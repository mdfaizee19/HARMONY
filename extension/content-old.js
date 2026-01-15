let harmonyVisible = false;
let harmonyBubble = null;
let ws = null;
let room = null;
let isConnected = false;
let userSpeechRecognition = null;
let isWaitingForResponse = false;

const SERVER_URL = "ws://localhost:8000/ws";
const REST_URL = "http://localhost:8000";
const LIVEKIT_ROOM_NAME = "harmony-room";

/* ========== LIVEKIT CONNECTION ========== */
async function joinLiveKitRoom() {
  try {
    console.log("📡 Requesting LiveKit token from server...");
    
    // Request token via WebSocket instead of HTTP (avoids CORS)
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "get_token" }));
      console.log("📤 Requested token");
      
      // Wait for token response
      ws.addEventListener("message", async (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === "token") {
          const { token, url } = data;
          console.log("✅ Token received");
          console.log("🔗 LiveKit URL:", url);
          
          // Load LiveKit and connect
          const script = document.createElement("script");
          script.src = "https://unpkg.com/livekit-client@latest/dist/index.js";
          script.onload = async () => {
            try {
              const { connect } = window.LiveKit;
              
              console.log("🔗 Connecting to LiveKit room...");
              const room = await connect(url, token, {
                autoSubscribe: true,
                audio: true,
                video: false,
              });
              
              isConnected = true;
              console.log("✅ Connected to LiveKit!");
              
              // Request microphone
              const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: true,
                video: false,
              });
              
              console.log("🎤 Got microphone access");
              
              // Publish local audio
              const audioTrack = stream.getAudioTracks()[0];
              if (audioTrack) {
                await room.localParticipant.publishTrack(
                  new window.LiveKit.LocalAudioTrack(audioTrack)
                );
                console.log("📤 Publishing audio to agent");
              }
              
              // Handle remote audio
              room.on("trackSubscribed", (track) => {
                if (track.kind === "audio") {
                  const audio = document.createElement("audio");
                  audio.autoplay = true;
                  audio.playsinline = true;
                  document.body.appendChild(audio);
                  track.attach(audio);
                  console.log("🔊 Playing agent audio");
                }
              });
              
            } catch (error) {
              console.error("❌ Failed to connect to LiveKit:", error);
            }
          };
          
          document.head.appendChild(script);
        }
      }, { once: true });
      
    } else {
      console.error("❌ WebSocket not connected");
    }
    
  } catch (error) {
    console.error("❌ Failed to join room:", error);
  }
}

/* ========== WEBSOCKET CONNECTION ========== */
let pendingTokenCallback = null;

function connectToServer() {
  if (ws && ws.readyState === WebSocket.OPEN) return;

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
  console.log("🎤 Speaking:", message);
  
  try {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message);
    
    let voices = speechSynthesis.getVoices();
    if (voices.length > 0) {
      utterance.voice = voices[0];
    }
    
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    utterance.onend = () => {
      console.log("✅ Speaking finished");
    };
    
    utterance.onerror = (event) => {
      console.warn("⚠️ TTS blocked:", event.error);
    };
    
    speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn("⚠️ TTS not available");
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
    
    // Stop background listener
    if (recognition) {
      try {
        recognition.stop();
        console.log("🛑 Stopped background listener");
      } catch (e) {}
    }
    
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

      recognition.onresult = (event) => {
        if (harmonyVisible) return;
        
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript.toLowerCase();
          }
        }
        
        if (transcript) {
          console.log("🔊 Heard:", transcript);
          if (transcript.includes("harmony")) {
            console.log("✨ Wake word detected!");
            activateHarmony();
          }
        }
      };

      recognition.onerror = (event) => {
        console.warn("⚠️ Background listener error:", event.error);
        
        if (event.error === "network") {
          console.warn("⚠️ Network error - check microphone permissions and internet");
        } else if (event.error === "no-speech") {
          console.log("⚠️ No speech detected");
        }
      };

      recognition.onend = () => {
        isListening = false;
        if (!harmonyVisible) {
          console.log("🔄 Restarting listener in 2s...");
          setTimeout(() => startVoiceListener(), 2000);
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
