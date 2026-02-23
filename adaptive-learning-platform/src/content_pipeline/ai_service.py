# ==============================================================================
# AI SERVICE — Pluggable provider for LLM generation
# Supports Ollama (local, free) and Claude API (paid, higher quality).
# Configured via AI_PROVIDER env var.
# ==============================================================================
from __future__ import annotations

import os
import json
from abc import ABC, abstractmethod


class AIProvider(ABC):
    """Abstract base for LLM providers."""

    @abstractmethod
    async def generate(self, prompt: str, system: str = "") -> str:
        """Send prompt to LLM and return generated text."""
        ...


# ── Ollama (local) ────────────────────────────────────────────────────────────

class OllamaProvider(AIProvider):
    """Calls a local Ollama server at http://localhost:11434."""

    def __init__(self, model: str = "llama3.2"):
        self.model = model
        self.base_url = os.environ.get("OLLAMA_URL", "http://localhost:11434")

    async def generate(self, prompt: str, system: str = "") -> str:
        import httpx

        payload = {
            "model": self.model,
            "prompt": prompt,
            "system": system,
            "stream": False,
            "options": {
                "temperature": 0.7,
                "num_predict": 2048,
            },
        }
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(
                f"{self.base_url}/api/generate",
                json=payload,
            )
            resp.raise_for_status()
            return resp.json().get("response", "")


# ── Claude API ────────────────────────────────────────────────────────────────

class ClaudeProvider(AIProvider):
    """Calls the Anthropic Messages API."""

    def __init__(self, model: str = "claude-sonnet-4-20250514"):
        self.model = model
        self.api_key = os.environ.get("ANTHROPIC_API_KEY", "")

    async def generate(self, prompt: str, system: str = "") -> str:
        import httpx

        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        }
        payload = {
            "model": self.model,
            "max_tokens": 2048,
            "messages": [{"role": "user", "content": prompt}],
        }
        if system:
            payload["system"] = system

        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers=headers,
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()
            return data["content"][0]["text"]


# ── Fallback (no LLM) ────────────────────────────────────────────────────────

class FallbackProvider(AIProvider):
    """
    Returns structured mock output when no LLM is available.
    Useful for testing the pipeline without running Ollama or having an API key.
    """

    async def generate(self, prompt: str, system: str = "") -> str:
        # Try to detect what kind of output is expected
        prompt_lower = prompt.lower()

        if "quiz" in prompt_lower or "question" in prompt_lower:
            return json.dumps([
                {
                    "question": "Based on the material, explain the key concept in your own words.",
                    "options": [
                        "It describes a fundamental principle",
                        "It is unrelated to the topic",
                        "It only applies in special cases",
                        "None of the above"
                    ],
                    "correct_index": 0,
                    "explanation": "This concept is central to the material you uploaded."
                },
                {
                    "question": "What is the main takeaway from this section?",
                    "options": [
                        "The topic builds on prerequisite knowledge",
                        "The topic is self-contained",
                        "The topic has no practical applications",
                        "The topic is purely theoretical"
                    ],
                    "correct_index": 0,
                    "explanation": "Understanding prerequisites helps you build a strong foundation."
                },
                {
                    "question": "How does this concept relate to what you've learned before?",
                    "options": [
                        "It extends previous concepts with new techniques",
                        "It contradicts earlier learning",
                        "It has no connection to prior topics",
                        "It replaces all prior knowledge"
                    ],
                    "correct_index": 0,
                    "explanation": "New concepts typically build on and extend what you already know."
                },
                {
                    "question": "Which approach best applies the concepts from this material?",
                    "options": [
                        "Break down the problem step by step",
                        "Skip directly to the answer",
                        "Memorize without understanding",
                        "Ignore the methodology"
                    ],
                    "correct_index": 0,
                    "explanation": "A step-by-step approach helps you apply concepts systematically."
                },
                {
                    "question": "Why is this topic important in the broader context?",
                    "options": [
                        "It provides foundational skills for advanced topics",
                        "It is only useful for exams",
                        "It has no broader applications",
                        "It is deprecated knowledge"
                    ],
                    "correct_index": 0,
                    "explanation": "Foundational topics unlock more advanced learning paths."
                },
            ])

        # Default: return a structured expansion
        return json.dumps({
            "title": "Study Material Summary",
            "summary": "This material covers key concepts that build on your existing knowledge. The AI has analyzed and structured the content for optimal learning.",
            "chapters": [
                {
                    "title": "Introduction & Overview",
                    "content": "This section introduces the core ideas from your study material. The concepts here form the foundation for everything that follows.",
                    "concept_ids": [],
                },
                {
                    "title": "Key Concepts Explained",
                    "content": "Here we break down the main ideas in detail, with connections to what you already know. Focus on understanding the relationships between concepts.",
                    "concept_ids": [],
                },
                {
                    "title": "Practice & Application",
                    "content": "Apply what you've learned through practice problems and real-world examples. This helps cement your understanding.",
                    "concept_ids": [],
                },
            ],
            "key_concepts": ["core concept", "fundamental principle", "application"],
            "difficulty_level": 0.5,
        })


# ── Factory ───────────────────────────────────────────────────────────────────

def get_ai_provider() -> AIProvider:
    """Return the configured AI provider based on env vars."""
    provider = os.environ.get("AI_PROVIDER", "fallback").lower()

    if provider == "ollama":
        model = os.environ.get("OLLAMA_MODEL", "llama3.2")
        print(f"  🤖 AI Provider: Ollama ({model})")
        return OllamaProvider(model=model)

    elif provider == "claude":
        if not os.environ.get("ANTHROPIC_API_KEY"):
            print("  ⚠️  ANTHROPIC_API_KEY not set, falling back to mock provider")
            return FallbackProvider()
        print("  🤖 AI Provider: Claude API")
        return ClaudeProvider()

    else:
        print("  🤖 AI Provider: Fallback (mock — set AI_PROVIDER=ollama or claude)")
        return FallbackProvider()
