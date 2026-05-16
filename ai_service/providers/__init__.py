"""
AI Provider abstraction layer for Briefly.

Providers are selected via the AI_PROVIDER environment variable:
  - "gemini"  (default) — Google Gemini 2.0 Flash via LangChain
  - "ollama"             — Local Ollama (tinyllama by default)

Fallback chain: if the configured provider fails with an auth/invalid-key error,
the system automatically falls back to Ollama (local inference), then to the
hardcoded static fallback so the pipeline never fully dies.
"""
import os
from .gemini_provider import GeminiProvider
from .ollama_provider import OllamaProvider

_PROVIDER_MAP = {
    "gemini": GeminiProvider,
    "ollama": OllamaProvider,
}

# Errors that indicate a bad/missing API key — we can fall back on these
_AUTH_ERROR_KEYWORDS = (
    "API_KEY_INVALID", "INVALID_ARGUMENT", "api key not valid",
    "401", "403", "UNAUTHENTICATED",
)


class FallbackProvider:
    """Wraps a primary provider with automatic Ollama fallback on auth errors."""

    def __init__(self, primary, fallback):
        self.primary = primary
        self.fallback = fallback
        self.active_name = type(primary).__name__.replace("Provider", "")

    def get_llm(self):
        return self.primary.get_llm()

    async def invoke_with_backoff(self, chain, inputs: dict, max_retries: int = 2) -> dict:
        try:
            result = await self.primary.invoke_with_backoff(chain, inputs, max_retries)
            return result
        except Exception as e:
            err_str = str(e)
            if any(kw.lower() in err_str.lower() for kw in _AUTH_ERROR_KEYWORDS):
                print(f"  [FallbackProvider] Primary ({type(self.primary).__name__}) auth error — "
                      f"switching to {type(self.fallback).__name__} (tinyllama)...")
                self.active_name = type(self.fallback).__name__.replace("Provider", "")
                # Get the prompt template and parser from the chain to rebuild with fallback LLM
                # chain is a RunnableSequence: prompt | llm | parser
                # We extract prompt and parser and rebuild with fallback LLM
                try:
                    steps = chain.steps  # LangChain RunnableSequence
                    prompt_template = steps[0]
                    parser = steps[-1]
                    fallback_llm = self.fallback.get_llm()
                    fallback_chain = prompt_template | fallback_llm | parser
                    return await self.fallback.invoke_with_backoff(fallback_chain, inputs, max_retries=3)
                except AttributeError:
                    # If chain doesn't have .steps, fall back directly
                    return await self.fallback.invoke_with_backoff(chain, inputs, max_retries=3)
            raise


def get_provider(api_key: str = None):
    """Return the configured AI provider instance with automatic fallback."""
    provider_name = os.getenv("AI_PROVIDER", "gemini").lower()
    provider_cls = _PROVIDER_MAP.get(provider_name, GeminiProvider)
    primary = provider_cls(api_key=api_key)

    # Always set up Ollama as a fallback (unless primary IS Ollama)
    if not isinstance(primary, OllamaProvider):
        fallback = OllamaProvider()
        return FallbackProvider(primary=primary, fallback=fallback)

    return primary


__all__ = ["get_provider"]
