import os
import json
import asyncio
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from livekit import api
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Allow extension access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET")
LIVEKIT_URL = os.getenv("LIVEKIT_URL")
LIVEKIT_ROOM_NAME = "harmony-room"

# Active WebSocket connections
active_connections = {}

@app.get("/token")
def get_token(identity: str = "browser-user", room: str = "harmony-room"):
    token = api.AccessToken(
        LIVEKIT_API_KEY,
        LIVEKIT_API_SECRET
    ).with_identity(identity) \
    .with_name(identity) \
    .with_grants(
        api.VideoGrants(
            room_join=True,
            room=room,
            can_publish=True,
            can_subscribe=True,
        )
    )

    return {
        "token": token.to_jwt(),
        "room": room,
        "url": LIVEKIT_URL,
    }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    session_id = id(websocket)
    active_connections[session_id] = websocket
    print(f"✅ Browser connected. Total: {len(active_connections)}")

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            print(f"📨 Browser message: {message}")

            if message.get("type") == "activate":
                # Send greeting to browser
                greeting = {"type": "greeting", "message": "Hey, how can I help you?"}
                await websocket.send_json(greeting)
                print(f"📤 Sent greeting")

            elif message.get("type") == "get_token":
                # Send LiveKit token
                print(f"📤 Sending LiveKit token")
                token = api.AccessToken(
                    LIVEKIT_API_KEY,
                    LIVEKIT_API_SECRET
                ).with_identity("browser-user") \
                .with_grants(
                    api.VideoGrants(
                        room_join=True,
                        room=LIVEKIT_ROOM_NAME,
                        can_publish=True,
                        can_subscribe=True,
                        can_publish_data=True,
                    )
                )
                
                await websocket.send_json({
                    "type": "token",
                    "token": token.to_jwt(),
                    "url": LIVEKIT_URL,
                })
                print(f"✅ Token sent")

            elif message.get("type") == "user_input":
                user_text = message.get("text", "").strip()
                print(f"👤 User said: {user_text}")
                
                try:
                    import httpx
                    
                    api_key = os.getenv('OPENAI_API_KEY', '')
                    model = os.getenv("LLM_MODEL", "openai/gpt-oss-20b:free")
                    
                    SYSTEM_PROMPT = """You are Harmony, a proactive, voice-first personal decision agent.

Behavior rules:
- Always acknowledge and briefly restate the user's intent to reassure them you understood correctly.
- Simulate intelligent research by saying you are scanning multiple sources, providers, or datasets.
- Mention filtering results by relevance, reviews, freshness, and cost.
- Do not say this is a simulation or that anything is fake.
- Reference past user behavior by casually mentioning recent spending, subscriptions, or usage patterns.
- Use this context to justify recommendations.
- Optimize for the user's best interest.
- Prefer cheaper, higher-value options when possible.
- Clearly explain why one option is better than others.
- Never take action without confirmation.
- Before any purchase or payment, explicitly ask for approval.
- Speak like a calm, confident assistant.
- Use short sentences.
- Avoid technical jargon unless asked.
- Sound decisive, not uncertain.

Response structure (always follow this order):
1. Reassure understanding.
2. Simulated search and evaluation.
3. Reference past usage or spending.
4. Clear recommendation.
5. Ask for confirmation to proceed.

Tone example:
"I've checked multiple options and narrowed this down for you."

You are not a chatbot.
You are a decision-making assistant that reduces cognitive load."""

                    request_body = {
                        "model": model,
                        "messages": [
                            {"role": "system", "content": SYSTEM_PROMPT},
                            {"role": "user", "content": user_text}
                        ],
                        "max_tokens": 300
                    }
                    
                    print(f"📡 LLM Request: model={model}, api_key={api_key[:10]}...")
                    print(f"📡 Request body: {request_body}")
                    
                    # Call OpenRouter LLM
                    async with httpx.AsyncClient() as client:
                        llm_response = await client.post(
                            "https://openrouter.ai/api/v1/chat/completions",
                            headers={
                                "Authorization": f"Bearer {api_key}",
                                "Content-Type": "application/json",
                                "HTTP-Referer": "http://localhost:8000",
                                "X-Title": "Harmony Voice Assistant"
                            },
                            json=request_body,
                            timeout=30.0
                        )
                        
                        print(f"📡 LLM Status: {llm_response.status_code}")
                        raw_text = llm_response.text
                        print(f"🤖 LLM Raw Response: {raw_text[:500]}")
                        
                        data = llm_response.json()
                        
                        if "choices" in data and len(data["choices"]) > 0:
                            response_text = data["choices"][0]["message"]["content"]
                            print(f"✅ Parsed response: {response_text}")
                        elif "error" in data:
                            print(f"❌ API Error: {data['error']}")
                            response_text = f"API error: {data['error'].get('message', 'Unknown error')}"
                        else:
                            print(f"⚠️ Unexpected response format: {data}")
                            response_text = "I'm not sure how to respond."
                        
                except Exception as e:
                    import traceback
                    print(f"❌ LLM Error: {e}")
                    print(traceback.format_exc())
                    response_text = "Sorry, I had trouble thinking. Try again."
                
                response = {
                    "type": "response",
                    "message": response_text
                }
                
                print(f"📤 Sending response: {response_text}")
                await websocket.send_json(response)
                print(f"✅ Response sent")

    except Exception as e:
        print(f"❌ WebSocket error: {e}")
    finally:
        active_connections.pop(session_id, None)
        print(f"🔌 Browser disconnected. Total: {len(active_connections)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
