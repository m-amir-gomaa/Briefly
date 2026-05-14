"""
AI Provider abstraction layer for Briefly.

Providers are selected via the AI_PROVIDER environment variable:
  - "gemini"  (default) — Google Gemini 2.0 Flash via LangChain
  - "ollama"             — Local Ollama (mistral by default)

Switching is a single env var change with zero code changes.
"""
import os
from .gemini_provider import GeminiProvider
from .ollama_provider import OllamaProvider

_PROVIDER_MAP = {
    "gemini": GeminiProvider,
    "ollama": OllamaProvider,
}

def get_provider(api_key: str = None):
    """Return the configured AI provider instance."""
    provider_name = os.getenv("AI_PROVIDER", "gemini").lower()
    provider_cls = _PROVIDER_MAP.get(provider_name, GeminiProvider)
    return provider_cls(api_key=api_key)

__all__ = ["get_provider"]
