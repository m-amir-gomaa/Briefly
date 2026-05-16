"""
Ollama provider — uses a local Ollama instance via langchain-ollama.
Falls back gracefully if Ollama is unreachable.

Configure via env vars:
  OLLAMA_BASE_URL  (default: http://localhost:11434)
  OLLAMA_MODEL     (default: mistral)
"""
import asyncio
import os

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "tinyllama")


class OllamaProvider:
    def __init__(self, api_key: str = None):
        # api_key is ignored for Ollama — it's local
        self.base_url = OLLAMA_BASE_URL
        self.model_name = OLLAMA_MODEL

    def get_llm(self):
        try:
            from langchain_ollama import ChatOllama
            return ChatOllama(
                model=self.model_name,
                base_url=self.base_url,
                temperature=0.1,
            )
        except ImportError:
            raise RuntimeError(
                "langchain-ollama not installed. Add it to requirements.txt."
            )

    async def invoke_with_backoff(self, chain, inputs: dict, max_retries: int = 3) -> dict:
        """Invoke with simple retry — Ollama failures are usually transient load issues."""
        last_error = None
        for attempt in range(max_retries):
            try:
                return await chain.ainvoke(inputs)
            except Exception as e:
                last_error = e
                err_str = str(e)
                # Retry on connection errors (Ollama may be loading a model)
                if "connection" in err_str.lower() or "refused" in err_str.lower() or "timeout" in err_str.lower():
                    if attempt < max_retries - 1:
                        wait = (attempt + 1) * 10
                        print(f"  [Ollama] Not ready yet. Retrying in {wait}s (attempt {attempt + 1}/{max_retries})...")
                        await asyncio.sleep(wait)
                        continue
                raise
        raise RuntimeError(f"Ollama failed after {max_retries} attempts: {last_error}")
