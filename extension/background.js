chrome.commands.onCommand.addListener((command) => {
  console.log("Command triggered:", command);
  if (command === "toggle-harmony") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        console.log("Sending message to tab:", tabs[0].id);
        chrome.tabs.sendMessage(
          tabs[0].id,
          { action: "ACTIVATE_HARMONY" },
          (response) => {
            if (chrome.runtime.lastError) {
              console.error("Error:", chrome.runtime.lastError);
            } else {
              console.log("Message sent successfully");
            }
          }
        );
      }
    });
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "SPEAK") {
    chrome.tts.stop(); // Stop any previous speech
    chrome.tts.speak(msg.text, {
      rate: 1.0,
      pitch: 1.0
    });
  } else if (msg.action === "STOP_SPEAKING") {
    chrome.tts.stop();
  }
});
