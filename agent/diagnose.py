import asyncio
import os
import numpy as np
from dotenv import load_dotenv
from livekit import agents, rtc
from livekit.agents import JobContext, WorkerOptions

load_dotenv()

async def entrypoint(ctx: JobContext):
    print("Connecting to room...")
    await ctx.connect(auto_subscribe=agents.AutoSubscribe.AUDIO_ONLY)
    print("✅ Connected! Waiting for audio...")

    @ctx.room.on("track_published")
    def on_track_published(publication, participant):
        if publication.kind == rtc.TrackKind.KIND_AUDIO:
             print(f"Fnound track from {participant.identity}, subscribing...")
             publication.set_subscribed(True)

    @ctx.room.on("track_subscribed")
    def on_track_subscribed(track, publication, participant):
        print(f"👂 Subscribed to {participant.identity}")
        asyncio.create_task(print_volume(track))

    async def print_volume(track):
        stream = rtc.AudioStream(track)
        async for frame in stream:
            # Calculate RMS amplitude
            data = np.frombuffer(frame.data, dtype=np.int16)
            rms = np.sqrt(np.mean(data**2))
            
            # Create visual bar
            bars = "|" * int(rms / 100)
            if len(bars) > 0:
                print(f"🎤 Audio Level: {bars}")
            
        await stream.aclose()
        
    # Check existing
    for participant in ctx.room.remote_participants.values():
        for publication in participant.track_publications.values():
             if publication.kind == rtc.TrackKind.KIND_AUDIO:
                 publication.set_subscribed(True)

if __name__ == "__main__":
    print("Starting Diagnostic Agent...")
    print("Press Ctrl+C to stop")
    agents.cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
