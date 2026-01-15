let harmonyVisible = false;
let harmonyBubble = null;
let ws = null;
const SERVER_URL = "ws://localhost:8000/ws";

/* ---------- WebSocket Connection ---------- */
function connectToServer() {
  if (ws && ws.readyState === WebSocket.OPEN) return;

  try {
    ws = new WebSocket(SERVER_URL);

    ws.onopen = () => {
      console.log("Connected to Harmony server");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Received from agent:", data);
      
      if (data.type === "greeting") {
        showMessage(data.message);
      } else if (data.type === "response") {
        showMessage(data.message);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("Disconnected from server, retrying in 3s...");
      setTimeout(connectToServer, 3000);
    };
  } catch (e) {
    console.error("Failed to connect to server:", e);
    setTimeout(connectToServer, 3000);
  }
}

function showMessage(message) {
  // Create audio element to speak the message
  const utterance = new SpeechSynthesisUtterance(message);
  utterance.voice = speechSynthesis.getVoices()[0];
  speechSynthesis.speak(utterance);
  console.log("Agent says:", message);
}

/* ---------- UI ---------- */
function createHarmonyBubble() {
  harmonyBubble = document.createElement("div");
  harmonyBubble.id = "harmony-bubble";

  document.body.appendChild(harmonyBubble);
  makeDraggable(harmonyBubble);
  harmonyVisible = true;

  // Connect to server and notify it
  connectToServer();
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: "activate" }));
  }
}

/* ---------- Drag Logic ---------- */
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

/* ---------- Activation ---------- */
function activateHarmony() {
  if (!harmonyVisible) {
    createHarmonyBubble();
  }
}

/* ---------- Keyboard Trigger ---------- */
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("Message received:", msg);
  if (msg.action === "ACTIVATE_HARMONY") {
    activateHarmony();
    sendResponse({ success: true });
  }
});

/* ---------- Voice Wake Word ---------- */
let recognition = null;
let isListening = false;

function startVoiceListener() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.error("Speech Recognition not supported");
    return;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";

  recognition.onstart = () => {
    isListening = true;
    console.log("Voice listening started");
  };

  recognition.onresult = (event) => {
    let transcript = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript.toLowerCase();
    }
    console.log("Detected:", transcript);
    if (transcript.includes("harmony")) {
      console.log("Wake word detected!");
      activateHarmony();
    }
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
  };

  recognition.onend = () => {
    isListening = false;
    console.log("Voice listening stopped, restarting...");
    setTimeout(() => startVoiceListener(), 1000);
  };

  try {
    recognition.start();
  } catch (e) {
    console.error("Error starting recognition:", e);
  }
}

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
