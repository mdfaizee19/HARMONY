"""
HARMONY – Financial Voice Agent (LiveKit)
========================================
A simulated financial advisor agent that helps users decide whether to
buy datasets or digital resources using MNEE stablecoins.

This is a hackathon-ready, simulation-first agent.
"""

from dotenv import load_dotenv
from livekit import agents
from livekit.agents import Agent, AgentSession, RunContext
from livekit.agents.llm import function_tool
from livekit.plugins import openai, deepgram, silero
from datetime import datetime
import os

# Load environment variables
load_dotenv(".env")


class HarmonyAgent(Agent):
    """
    HARMONY – a calm, responsible financial advisor AI.
    """

    def __init__(self):
        super().__init__(
            instructions="""
You are HARMONY, a calm and responsible AI financial advisor.

Your role:
- Help users decide whether they should spend money on datasets or digital resources.
- Explain costs clearly in MNEE stablecoins.
- Consider past spending history before recommending a purchase.
- Suggest cheaper or free alternatives when possible.
- Never purchase automatically — always wait for user confirmation.
- Treat all payments as simulated.

Speak concisely, clearly, and like a trusted financial assistant.
"""
        )

        # Simulated dataset marketplace
        self.datasets = {
            "machine learning": [
                {
                    "id": "ds001",
                    "name": "Large-Scale Image Dataset",
                    "provider": "VisionData Inc.",
                    "price_mnee": 12,
                    "description": "50k labeled images for computer vision tasks",
                },
                {
                    "id": "ds002",
                    "name": "Financial Transactions Dataset",
                    "provider": "OpenFinance Labs",
                    "price_mnee": 20,
                    "description": "Anonymized transaction data for fraud detection",
                },
            ],
            "nlp": [
                {
                    "id": "ds003",
                    "name": "Multilingual Text Corpus",
                    "provider": "LinguaTech",
                    "price_mnee": 8,
                    "description": "Text data in 20 languages for NLP models",
                }
            ],
        }

        # Simulated spending history
        self.spending_history = [
            {
                "item": "Sentiment Analysis Dataset",
                "cost_mnee": 6,
                "date": "Last week",
            },
            {
                "item": "Stock Market API Access",
                "cost_mnee": 10,
                "date": "Two weeks ago",
            },
        ]

    # -------------------------
    # Utility Tools
    # -------------------------

    @function_tool
    async def get_current_date_and_time(self, context: RunContext) -> str:
        """Get the current date and time."""
        now = datetime.now().strftime("%B %d, %Y at %I:%M %p")
        return f"The current date and time is {now}."

    @function_tool
    async def view_spending_history(self, context: RunContext) -> str:
        """View the user's recent spending history."""
        total = sum(item["cost_mnee"] for item in self.spending_history)

        response = "Here is your recent spending history:\n\n"
        for item in self.spending_history:
            response += f"• {item['item']} – {item['cost_mnee']} MNEE ({item['date']})\n"

        response += f"\nTotal spent recently: {total} MNEE."
        return response

    # -------------------------
    # Dataset Search
    # -------------------------

    @function_tool
    async def search_datasets(self, context: RunContext, domain: str) -> str:
        """
        Search available datasets by domain.

        Args:
            domain: Domain to search (e.g., 'machine learning', 'nlp')
        """
        domain = domain.lower()

        if domain not in self.datasets:
            return (
                f"No datasets found for '{domain}'. "
                f"Available domains are: {', '.join(self.datasets.keys())}."
            )

        results = self.datasets[domain]
        response = f"Found {len(results)} datasets in {domain}:\n\n"

        for ds in results:
            response += (
                f"• {ds['name']}\n"
                f"  Provider: {ds['provider']}\n"
                f"  Cost: {ds['price_mnee']} MNEE\n"
                f"  Description: {ds['description']}\n"
                f"  ID: {ds['id']}\n\n"
            )

        return response

    # -------------------------
    # Simulated Purchase
    # -------------------------

    @function_tool
    async def simulate_purchase(self, context: RunContext, dataset_id: str) -> str:
        """
        Simulate purchasing a dataset after user confirmation.

        Args:
            dataset_id: The dataset ID to purchase
        """
        for group in self.datasets.values():
            for ds in group:
                if ds["id"] == dataset_id:
                    self.spending_history.append(
                        {
                            "item": ds["name"],
                            "cost_mnee": ds["price_mnee"],
                            "date": "Today",
                        }
                    )

                    return (
                        "✓ Purchase simulated successfully.\n\n"
                        f"Dataset: {ds['name']}\n"
                        f"Cost: {ds['price_mnee']} MNEE\n\n"
                        "I’ve recorded this in your spending history."
                    )

        return "I couldn’t find that dataset ID. Please search again."


# -------------------------
# LiveKit Entrypoint
# -------------------------

async def entrypoint(ctx: agents.JobContext):
    """
    Entry point for the HARMONY agent.
    """

    session = AgentSession(
        stt=deepgram.STT(model="nova-2"),
        llm=openai.LLM(model=os.getenv("LLM_CHOICE", "gpt-4o-mini")),
        # Disable TTS if using OpenRouter to avoid 405 errors
        # tts=openai.TTS(voice="echo"),
        vad=silero.VAD.load(),
    )

    await session.start(
        room=ctx.room,
        agent=HarmonyAgent()
    )

    


if __name__ == "__main__":
    agents.cli.run_app(
        agents.WorkerOptions(entrypoint_fnc=entrypoint)
    )
