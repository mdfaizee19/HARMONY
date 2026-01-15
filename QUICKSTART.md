## Quick Start Guide

### Prerequisites
- Python 3.11+
- Chrome browser
- `.env` files configured in `agent/` and `server/`

### Step 1: Install Dependencies
```bash
# Server
cd /home/haroon12h8/Desktop/HARMONY/server
pip install -r requirements.txt

# Agent  
cd /home/haroon12h8/Desktop/HARMONY/agent
pip install -r requirements.txt
```

### Step 2: Run Each Service in Separate Terminal

**Terminal 1 - Server:**
```bash
cd /home/haroon12h8/Desktop/HARMONY/server
python server.py
# Output: INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Terminal 2 - Agent:**
```bash
cd /home/haroon12h8/Desktop/HARMONY/agent
python main.py
# Output: Should show agent worker running
```

**Terminal 3 - Load Extension:**
1. Go to `chrome://extensions/`
2. Toggle "Developer mode" ON (top right)
3. Click "Load unpacked"
4. Select `/home/haroon12h8/Desktop/HARMONY/extension`

### Step 3: Test It!

Open any webpage, then:
- **Say:** "harmony" into your microphone
- **OR Press:** `Ctrl+Shift+H`

You should see:
1. ✅ White circle with black border popup appears (bottom right)
2. ✅ "Hey, how can I help you?" is spoken
3. ✅ You can drag the bubble around
4. ✅ Say things and interact with the agent

### Debugging

**Check console logs (F12):**
- Extension console shows WebSocket connection status
- See transcript detection in real-time

**Check server logs:**
- Terminal 1 shows WebSocket connections/disconnections
- Shows messages from browser

**Check agent logs:**
- Terminal 2 shows LiveKit agent status
- Shows session starts/stops

## Flow Diagram
```
User speaks "harmony"
    ↓
Extension detects via Speech Recognition
    ↓
Extension creates popup bubble
    ↓
Extension connects to WebSocket server
    ↓
Server receives "activate" message
    ↓
Server sends greeting "Hey, how can I help you?"
    ↓
Extension receives greeting
    ↓
Browser speaks greeting using Web Speech API
    ↓
(Agent is running separately, ready for LiveKit room connection)
```

## Files Overview

- **extension/manifest.json** - Chrome extension config
- **extension/content.js** - Voice detection, popup creation, WebSocket client
- **extension/background.js** - Keyboard shortcut handler
- **extension/popup.css** - Styling (white circle, thick border, smooth drag)
- **server/server.py** - WebSocket server, connects extension to agent
- **agent/main.py** - LiveKit agent with voice capabilities
