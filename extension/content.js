let harmonyVisible = false;
let harmonyBubble = null;
let ws = null;
let room = null;
let isConnected = false;
let userSpeechRecognition = null;
let isWaitingForResponse = false;
let pendingTokenCallback = null;
let sessionActive = false;
let isSpeaking = false;
let lastAgentResponse = "";

function isContextValid() {
  try {
    return !!chrome.runtime.id;
  } catch (e) {
    return false;
  }
}

const SERVER_URL = "ws://localhost:8000/ws";
const REST_URL = "http://localhost:8000";
const LIVEKIT_ROOM_NAME = "harmony-room";

/* ========== LIVEKIT CONNECTION ========== */
async function joinLiveKitRoom() {
  try {
    console.log("📡 Requesting LiveKit token from server...");

    // Set up callback to receive token
    pendingTokenCallback = async (data) => {
      try {
        const { token, url } = data;
        console.log("✅ Token received, URL:", url);

        const { Room, RoomEvent, LocalAudioTrack } = window.LivekitClient;

        console.log("🔗 Connecting to LiveKit room...");
        const newRoom = new Room({
          adaptiveStream: true,
          dynacast: true,
        });
        room = newRoom; // Assign global room variable

        await newRoom.connect(url, token, {
          autoSubscribe: true,
        });

        isConnected = true;
        console.log("✅ Connected to LiveKit!");

        // Request microphone with echo cancellation
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          },
          video: false,
        });

        console.log("🎤 Got microphone access");

        // Publish local audio
        // Note: We do NOT publish audio tracks in this text-based mode.
        // We rely on Browser SpeechRecognition -> publishData
        console.log("📝 Text-Mode: Skipping audio track publication");

        // Handle remote audio
        // Handle incoming text from Agent
        newRoom.on("dataReceived", (payload, participant, kind, topic) => {
          const decoder = new TextDecoder();
          const text = decoder.decode(payload);
          console.log("📨 Received text from Agent:", text);

          // Clear waiting flag - now you can speak again
          isWaitingForResponse = false;
          console.log("✅ Ready to listen again!");

          // Speak the response
          showMessage(text);
        });

      } catch (error) {
        console.error("❌ Failed to connect to LiveKit:", error);
      }

    };

    // Send request
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "get_token" }));
      console.log("📤 Requested token");
    } else {
      console.error("❌ WebSocket not connected");
    }

  } catch (error) {
    console.error("❌ Failed to join room:", error);
  }
}

/* ========== WEBSOCKET CONNECTION ========== */
function connectToServer() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;

  try {
    ws = new WebSocket(SERVER_URL);

    ws.onopen = () => {
      console.log("✅ Connected to server");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("📨 Received:", data.type);

        if (data.type === "token") {
          // Handle LiveKit token
          console.log("✅ Token received!");
          if (pendingTokenCallback) {
            pendingTokenCallback(data);
          }
        } else if (data.type === "greeting") {
          showMessage(data.message);
        } else if (data.type === "response") {
          console.log("🤖 Agent response:", data.message);
          isWaitingForResponse = false;
          console.log("✅ Ready to listen again!");
          showMessage(data.message);
        }
      } catch (e) {
        console.error("Failed to parse message:", e);
      }
    };

    ws.onerror = (error) => {
      console.error("❌ WebSocket error:", error);
    };

    ws.onclose = (event) => {
      console.log("⚠️ WebSocket closed");
      if (event.code !== 1000) {
        setTimeout(connectToServer, 3000);
      }
    };
  } catch (e) {
    console.error("❌ Failed to create WebSocket:", e);
    setTimeout(connectToServer, 3000);
  }
}

/* ========== SPEECH SYNTHESIS ========== */
function showMessage(message) {
  if (!isContextValid()) return;
  console.log("🎤 Speaking (via background):", message);

  // Pause recognition while speaking
  isSpeaking = true;
  lastAgentResponse = message.toLowerCase();
  if (recognition) {
    try { recognition.stop(); } catch (e) { }
  }

  try {
    chrome.runtime.sendMessage({ action: "SPEAK", text: message }, (response) => {
      // Resume listening after TTS finishes
      // Estimate speech time: ~100ms per word
      const wordCount = message.split(' ').length;
      const speakTime = Math.max(1500, wordCount * 100);

      setTimeout(() => {
        isSpeaking = false;
        console.log("✅ TTS finished, resuming listening");
        if (sessionActive && recognition && !isWaitingForResponse) {
          try { recognition.start(); } catch (e) { }
        }
      }, speakTime);
    });
  } catch (e) {
    console.error("❌ Failed to send TTS message:", e);
    isSpeaking = false;
  }
}

/* ========== UI ========== */
function createHarmonyBubble() {
  harmonyBubble = document.createElement("div");
  harmonyBubble.id = "harmony-bubble";
  harmonyBubble.innerText = "🎧";

  document.body.appendChild(harmonyBubble);
  makeDraggable(harmonyBubble);
  harmonyVisible = true;

  console.log("🎵 Harmony bubble created");

  // Bind click to start session (User Gesture for AudioContext)
  harmonyBubble.addEventListener('click', () => {
    if (!isConnected) {
      startSession();
    }
  }, { once: true });
}

function makeDraggable(el) {
  let offsetX, offsetY, isDragging = false;
  let animationFrame = null;

  el.addEventListener("mousedown", (e) => {
    isDragging = true;
    offsetX = e.clientX - el.offsetLeft;
    offsetY = e.clientY - el.offsetTop;
    el.style.transition = "none";
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;

    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = requestAnimationFrame(() => {
      el.style.left = e.clientX - offsetX + "px";
      el.style.top = e.clientY - offsetY + "px";
    });
  });

  document.addEventListener("mouseup", () => {
    if (isDragging) {
      isDragging = false;
      el.style.transition = "box-shadow 0.2s ease, transform 0.2s ease";
      if (animationFrame) cancelAnimationFrame(animationFrame);
    }
  });
}

function activateHarmony() {
  if (!harmonyVisible) {
    createHarmonyBubble();

    // Do NOT stop listener, we need it for dictation
    // if (recognition) { ... }

    // Connect to server immediately (keep connection open)
    connectToServer();
  }
}

function startSession() {
  if (sessionActive) return;
  sessionActive = true;

  console.log("️ Starting session via user gesture...");

  // Connect to server
  connectToServer();

  // Wait for server connection, then request token
  const checkConnection = setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      clearInterval(checkConnection);
      console.log("✅ WebSocket ready, requesting token...");

      // Send activation
      ws.send(JSON.stringify({ type: "activate" }));

      // Request token
      setTimeout(() => {
        joinLiveKitRoom();
      }, 500);
    }
  }, 100);

  // Timeout after 5 seconds
  setTimeout(() => clearInterval(checkConnection), 5000);
}

/* ========== BACKGROUND HARMONY DETECTION ========== */
let recognition = null;
let isListening = false;

function startVoiceListener() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.error("Speech Recognition not supported");
    return;
  }

  try {
    // Request microphone first
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        console.log("✅ Microphone access granted");

        // Stop the stream (we just wanted to request permission)
        stream.getTracks().forEach(track => track.stop());

        // Now start recognition
        setupRecognition();
      })
      .catch(err => {
        console.error("❌ Microphone access denied:", err.message);
        console.log("Please grant microphone permission in browser settings");
      });

    function setupRecognition() {
      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        isListening = true;
        console.log("🎤 Background listener started - say 'harmony'");
      };

      recognition.onresult = async (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript.toLowerCase();
          }
        }

        if (transcript) {
          console.log("🔊 Heard:", transcript);

          // Echo prevention: ignore if we're speaking or transcript matches agent's response
          if (isSpeaking) {
            console.log("🔇 Ignoring (agent is speaking)");
            return;
          }

          // Check if this is an echo of the agent's last response
          if (lastAgentResponse && transcript.includes(lastAgentResponse.substring(0, 20))) {
            console.log("🔇 Ignoring (echo of agent response)");
            return;
          }

          if (!sessionActive) {
            // Wake Word Check
            if (transcript.includes("harmony")) {
              console.log("✨ Wake word detected!");
              activateHarmony();
            }
          } else {
            // Session Active: Send text to Server via WebSocket
            if (ws && ws.readyState === WebSocket.OPEN) {
              if (isWaitingForResponse) {
                console.log("⏳ Waiting for previous response, ignoring:", transcript);
                return;
              }

              console.log("📤 Sending text to server:", transcript);
              ws.send(JSON.stringify({ type: "user_input", text: transcript }));

              isWaitingForResponse = true;
              // Safety timeout to reset blocking if server stalls
              setTimeout(() => isWaitingForResponse = false, 15000);
            } else {
              console.log("⚠️ WebSocket not connected, can't send:", transcript);
            }
          }
        }
      };

      recognition.onerror = (event) => {
        if (!isContextValid()) return;
        console.warn("⚠️ Background listener error:", event.error);

        if (event.error === "network") {
          console.warn("⚠️ Network error - check microphone permissions and internet");
        } else if (event.error === "no-speech") {
          console.log("⚠️ No speech detected");
        }
      };

      recognition.onend = () => {
        if (!isContextValid()) return;
        isListening = false;

        // Restart listener if context is valid (Continuous loop)
        if (true) {
          console.log("🔄 Restarting listener in 1s...");
          setTimeout(() => {
            if (isContextValid()) startVoiceListener();
          }, 1000);
        }
      };

      recognition.start();
    }

  } catch (e) {
    console.error("Error starting recognition:", e);
    setTimeout(() => startVoiceListener(), 2000);
  }
}

/* ========== KEYBOARD TRIGGER ========== */
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("📨 Keyboard trigger");
  if (msg.action === "ACTIVATE_HARMONY") {
    activateHarmony();
    sendResponse({ success: true });
  }
});

/* ========== INITIALIZATION ========== */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startVoiceListener);
} else {
  startVoiceListener();
}

document.addEventListener(
  "click",
  () => {
    if (!isListening && recognition) startVoiceListener();
  },
  { once: true }
);

console.log("✅ Harmony content script loaded");
