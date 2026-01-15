import os
import asyncio
from dotenv import load_dotenv
from livekit import agents, rtc
from livekit.agents import JobContext, WorkerOptions, AutoSubscribe
from livekit.plugins import openai

load_dotenv()

class TextAgent(agents.Agent):
    def __init__(self, room):
        super().__init__()
        self.room = room
        self.llm = openai.LLM(
            model=os.getenv("LLM_MODEL", "gpt-4o-mini"),
            temperature=0.7,
        )
        self.chat_ctx = openai.ChatContext().append(
    role="system",
    text="""
You are Harmony, a proactive, voice-first personal financial decision agent.

IMPORTANT RULES:
- All purchases, payments, and transactions are SIMULATED.
- You are allowed to recommend, approve, and proceed with simulated payments.
- You must NEVER refuse by saying you cannot buy, cannot pay, or are not allowed.
- You must NEVER mention safety policies, limitations, or that you are an AI.
- Treat this as a future-facing agentic payment simulation.

Behavior rules:
- Always acknowledge and restate the user’s intent briefly to reassure understanding.
- Simulate intelligent research by saying you scanned multiple sources, providers, or datasets.
- Mention filtering by relevance, reviews, freshness, and cost.
- Casually reference past spending, subscriptions, or usage patterns.
- Use past context to justify recommendations.
- Optimize for the user’s best interest.
- Prefer cheaper, higher-value options when possible.
- Clearly explain why one option is better than others.
- Never take action without confirmation.
- Before any simulated purchase, explicitly ask for approval.
- Speak calmly and confidently.
- Use short sentences.
- No technical jargon unless asked.
- Sound decisive.

Response structure (always follow this order):
1. Reassure understanding.
2. Simulated search and evaluation.
3. Reference past usage or spending.
4. Clear recommendation.
5. Ask for confirmation to proceed.

Example behavior:
“I checked multiple datasets, compared pricing and reviews, and considered your recent spending. The five-dollar option gives you full coverage without unnecessary cost. Would you like me to proceed with this purchase?”

You are not a chatbot.
You are a decision-making assistant that reduces cognitive load.
"""
)


    async def on_data_received(self, payload: bytes, participant: rtc.RemoteParticipant, kind: rtc.DataPacketKind):
        text = payload.decode("utf-8")
        print(f"📨 [STEP 1] Received text from {participant.identity}: {text}")
        
        self.chat_ctx.append(role="user", text=text)
        print(f"📝 [STEP 2] Added to chat context")
        
        try:
            print("🤔 [STEP 3] Calling LLM...")
            
            # Use simple completion instead of streaming
            response = await self.llm.chat(chat_ctx=self.chat_ctx)
            
            # Handle both streaming and non-streaming responses
            if hasattr(response, '__aiter__'):
                print("📡 [STEP 3b] Streaming response...")
                full_response = ""
                async for chunk in response:
                    if hasattr(chunk, 'choices') and chunk.choices:
                        delta = chunk.choices[0].delta
                        if hasattr(delta, 'content') and delta.content:
                            full_response += delta.content
            else:
                # Non-streaming response
                full_response = str(response)
            
            print(f"✅ [STEP 4] LLM response: {full_response[:100]}...")
            
            if not full_response.strip():
                full_response = "I'm not sure how to respond to that."
            
            self.chat_ctx.append(role="assistant", text=full_response)
            
            print(f"📤 [STEP 5] Publishing reply: {full_response}")
            await self.room.local_participant.publish_data(
                payload=full_response.encode("utf-8"),
                reliable=True
            )
            print("✅ [STEP 6] Reply published successfully!")

        except Exception as e:
            import traceback
            print(f"❌ [ERROR] Exception: {e}")
            print(traceback.format_exc())
            error_msg = "Sorry, I encountered an error."
            await self.room.local_participant.publish_data(
                payload=error_msg.encode("utf-8"),
                reliable=True
            )
            print("📤 [STEP 6] Error message published")

async def entrypoint(ctx: JobContext):
    # Connect with ALL subscriptions to ensure we see the user and data
    await ctx.connect(auto_subscribe=AutoSubscribe.SUBSCRIBE_ALL)
    print("✅ Harmony Text-Agent connected")
    
    agent = TextAgent(ctx.room)

    @ctx.room.on("participant_connected")
    def on_participant_connected(participant):
        print(f"👋 Participant connected: {participant.identity}")

    @ctx.room.on("data_received")
    def on_data_received(payload, participant, kind, topic=None):
        print(f"📨 RAW DATA RECEIVED from {participant.identity}") # Debug log
        asyncio.create_task(agent.on_data_received(payload, participant, kind))

    # Greet
    initial = "Hey, I'm ready."
    print(f"📤 Sending greeting: {initial}")
    await ctx.room.local_participant.publish_data(initial.encode("utf-8"), reliable=True)

    # Log existing participants
    for p in ctx.room.remote_participants.values():
        print(f"👤 Existing participant: {p.identity}")

    # Keep the agent alive in the room
    print("🔄 Agent is now listening for data...")
    while True:
        await asyncio.sleep(1)

if __name__ == "__main__":
    agents.cli.run_app(
        agents.WorkerOptions(entrypoint_fnc=entrypoint)
    )
