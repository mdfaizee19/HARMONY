// LiveKit connection
let room = null;
let localParticipant = null;
let isConnected = false;

const SERVER_URL = "http://localhost:8000";
const LIVEKIT_ROOM = "harmony-room";

async function joinLiveKitRoom() {
  try {
    console.log("📡 Getting token from server...");
    
    // Get token from server
    const tokenResponse = await fetch(`${SERVER_URL}/token`);
    const { token, url } = await tokenResponse.json();
    
    console.log("✅ Token received");
    console.log("🔗 LiveKit URL:", url);
    
    // Create room
    const { Room, LocalParticipant } = window.LiveKit;
    room = new Room();
    
    // Handle participants joining
    room.on("participantConnected", (participant) => {
      console.log("✨ Participant joined:", participant.name);
    });
    
    // Handle remote tracks
    room.on("trackSubscribed", (track, publication, participant) => {
      console.log("🎤 Got track from agent:", track.kind);
      
      if (track.kind === "audio") {
        // Attach audio to speaker
        const audio = document.createElement("audio");
        audio.autoplay = true;
        audio.playsinline = true;
        document.body.appendChild(audio);
        
        track.attach(audio);
        console.log("🔊 Playing agent audio");
      }
    });
    
    // Connect to room
    console.log("🔗 Connecting to LiveKit...");
    await room.connect(url, token);
    
    isConnected = true;
    console.log("✅ Connected to LiveKit room");
    
    // Get local participant
    localParticipant = room.localParticipant;
    
    // Request microphone and speaker permissions
    if (navigator.mediaDevices.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true,
        video: false 
      });
      console.log("🎤 Microphone access granted");
      
      // Start audio track
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        await localParticipant.publishTrack(
          new window.LiveKit.LocalAudioTrack(audioTrack)
        );
        console.log("📤 Publishing audio to agent");
      }
    }
    
  } catch (error) {
    console.error("❌ Failed to connect to LiveKit:", error);
  }
}

function leaveLiveKitRoom() {
  if (room) {
    room.disconnect();
    console.log("🔌 Disconnected from LiveKit");
    isConnected = false;
  }
}

// Show popup
function showPopup() {
  const container = document.getElementById("harmony-container");
  container.style.display = "flex";
  console.log("📍 Popup shown");
  
  // Join LiveKit room
  joinLiveKitRoom();
  
  // Make draggable
  makePopupDraggable();
}

// Make popup draggable
function makePopupDraggable() {
  const container = document.getElementById("harmony-container");
  let offsetX = 0;
  let offsetY = 0;
  let isDragging = false;
  let animationFrame = null;

  container.addEventListener("mousedown", (e) => {
    isDragging = true;
    offsetX = e.clientX - container.offsetLeft;
    offsetY = e.clientY - container.offsetTop;
    container.style.transition = "none";
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;

    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = requestAnimationFrame(() => {
      container.style.left = e.clientX - offsetX + "px";
      container.style.top = e.clientY - offsetY + "px";
    });
  });

  document.addEventListener("mouseup", () => {
    if (isDragging) {
      isDragging = false;
      container.style.transition = "box-shadow 0.2s ease, transform 0.2s ease";
      if (animationFrame) cancelAnimationFrame(animationFrame);
    }
  });
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("📨 Received message:", request);
  
  if (request.action === "SHOW_HARMONY") {
    showPopup();
    sendResponse({ success: true });
  }
});

console.log("✅ Popup script loaded");
