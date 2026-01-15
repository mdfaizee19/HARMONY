# Harmony - Voice-First AI Assistant

Three independent services that work together:

## Structure
```
HARMONY/
├── extension/        (Chrome extension)
├── server/          (FastAPI WebSocket server)
└── agent/           (LiveKit AI agent)
```

## Setup & Run

### 1. Start the Server (Terminal 1)
```bash
cd /home/haroon12h8/Desktop/HARMONY/server
pip install -r requirements.txt
python server.py
```
Runs on `http://localhost:8000`

### 2. Start the Agent (Terminal 2)
```bash
cd /home/haroon12h8/Desktop/HARMONY/agent
pip install -r requirements.txt
python main.py
```
Make sure `.env` has:
- `LIVEKIT_URL`
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`
- `OPENAI_API_KEY`

### 3. Load Chrome Extension (Terminal 3 or manual)
1. Open `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select `/home/haroon12h8/Desktop/HARMONY/extension` folder

## Usage
- **Voice**: Say "harmony" anywhere on any webpage
- **Keyboard**: Press `Ctrl+Shift+H` to open popup
- **Popup**: White circle with black border appears
- **Interaction**: Drag it around, speak to chat with the agent

## How It Works
1. **Extension detects** voice command "harmony" or keyboard shortcut
2. **Extension creates popup** and connects to WebSocket server
3. **Server sends greeting** "Hey, how can I help you?"
4. **Browser speaks** the message using Web Speech API
5. **User can speak** back and interact with the agent

## Troubleshooting

**Extension not loading?**
- Check `chrome://extensions/` error details
- Verify manifest.json syntax

**Server not connecting?**
- Make sure server is running on port 8000
- Check browser console (F12) for WebSocket errors
- URL should be `ws://localhost:8000/ws`

**Agent not responding?**
- Verify all API keys in `.env`
- Check LiveKit connection settings
- Agent runs separately from extension

**No voice detection?**
- Check browser permissions (microphone)
- Ensure HTTPS or localhost
- Try saying "harmony" or press Ctrl+Shift+H
