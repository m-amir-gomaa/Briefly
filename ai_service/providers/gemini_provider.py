"""
Gemini provider — uses Google Gemini 2.0 Flash via langchain-google-genai.
Includes exponential backoff for rate limit handling.
"""
import asyncio
import os
from langchain_google_genai import ChatGoogleGenerativeAI

DEFAULT_GOOGLE_API_KEY = os.getenv("DEMO_GOOGLE_API_KEY") or os.getenv("GOOGLE_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")


class GeminiProvider:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or DEFAULT_GOOGLE_API_KEY
        self.model_name = GEMINI_MODEL

    def get_llm(self):
        return ChatGoogleGenerativeAI(
            model=self.model_name,
            temperature=0.1,
            google_api_key=self.api_key,
        )

    async def invoke_with_backoff(self, chain, inputs: dict, max_retries: int = 2) -> dict:
        """Invoke a LangChain chain with exponential backoff for rate limits."""
        delay = 5
        last_error = None
        for attempt in range(max_retries):
            try:
                return await chain.ainvoke(inputs)
            except Exception as e:
                last_error = e
                err_str = str(e)
                if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str or "500" in err_str or "503" in err_str:
                    if attempt < max_retries - 1:
                        print(f"  [Gemini] Rate limit hit. Retrying in {delay}s (attempt {attempt + 1}/{max_retries})...")
                        await asyncio.sleep(delay)
                        delay = min(delay * 2, 300)
                        continue
                raise
        raise RuntimeError(f"Gemini failed after {max_retries} attempts: {last_error}")
