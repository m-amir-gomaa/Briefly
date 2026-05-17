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
import time
from .gemini_provider import GeminiProvider
from .ollama_provider import OllamaProvider

_PROVIDER_MAP = {
    "gemini": GeminiProvider,
    "ollama": OllamaProvider,
}

# Errors that indicate a bad/missing API key, or quota exhaustion — we can fall back on these
_AUTH_ERROR_KEYWORDS = (
    "API_KEY_INVALID", "INVALID_ARGUMENT", "api key not valid",
    "401", "403", "UNAUTHENTICATED",
    "429", "RESOURCE_EXHAUSTED", "Quota exceeded", "rate limit",
)

# Circuit breaker map: API Key string -> time.time() until which it is blocked
_EXHAUSTED_KEYS = {}


def mark_key_exhausted(api_key: str, duration: int = 300):
    """Mark a key as exhausted/rate-limited for a given duration (default 5 minutes)."""
    if api_key:
        _EXHAUSTED_KEYS[api_key] = time.time() + duration
        print(f"  [CircuitBreaker] Key marked as rate-limited/exhausted until {time.ctime(time.time() + duration)}")


def is_key_exhausted(api_key: str) -> bool:
    """Check if the key is currently marked as rate-limited/exhausted."""
    if not api_key:
        return False
    expiry = _EXHAUSTED_KEYS.get(api_key, 0)
    if expiry > time.time():
        return True
    # Clean up expired entry
    if api_key in _EXHAUSTED_KEYS:
        del _EXHAUSTED_KEYS[api_key]
    return False


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
                
                # Expose rate-limited key to circuit breaker
                if hasattr(self.primary, "api_key") and self.primary.api_key:
                    mark_key_exhausted(self.primary.api_key)

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
    
    # Get the key that would be used
    default_key = os.getenv("DEMO_GOOGLE_API_KEY") or os.getenv("GOOGLE_API_KEY", "")
    effective_key = api_key or default_key

    # Circuit Breaker Check
    if is_key_exhausted(effective_key):
        print(f"  [CircuitBreaker] Key is currently rate-limited/exhausted. Routing directly to Ollama.")
        return OllamaProvider()
    
    # If a custom key is provided, we ALWAYS use Gemini as primary,
    # regardless of the default AI_PROVIDER setting.
    if api_key:
        primary = GeminiProvider(api_key=api_key)
    else:
        provider_cls = _PROVIDER_MAP.get(provider_name, GeminiProvider)
        primary = provider_cls()

    # Always set up Ollama as a fallback (unless primary IS Ollama)
    if not isinstance(primary, OllamaProvider):
        fallback = OllamaProvider()
        return FallbackProvider(primary=primary, fallback=fallback)

    return primary


__all__ = ["get_provider"]

