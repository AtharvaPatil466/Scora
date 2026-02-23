# ==============================================================================
# CONTENT EXPANDER — AI-powered expansion of extracted study materials
# Takes raw extracted content and generates personalized, structured lessons.
# ==============================================================================
from __future__ import annotations

import json
from dataclasses import dataclass, field, asdict
from .extractors import ExtractedContent
from .ai_service import AIProvider


@dataclass
class ExpandedMaterial:
    """Structured, AI-expanded version of uploaded study material."""

    material_id: str = ""
    title: str = ""
    summary: str = ""
    chapters: list[dict] = field(default_factory=list)
    key_concepts: list[str] = field(default_factory=list)
    concept_mapping: dict = field(default_factory=dict)
    difficulty_level: float = 0.5

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, d: dict) -> "ExpandedMaterial":
        return cls(**{k: v for k, v in d.items() if k in cls.__dataclass_fields__})


class ContentExpander:
    """Uses an AI provider to expand extracted content into structured lessons."""

    def __init__(self, ai: AIProvider):
        self.ai = ai

    async def expand(
        self,
        extracted: ExtractedContent,
        knowledge_state: list[float] | None = None,
        learning_style: str = "visual",
    ) -> ExpandedMaterial:
        """
        Expand extracted content into a full structured lesson.
        Personalizes based on the student's knowledge state and learning style.
        """
        ks = knowledge_state or []
        avg_mastery = sum(ks) / max(len(ks), 1) if ks else 0.0

        # Build the prompt
        system_prompt = self._build_system_prompt(learning_style, avg_mastery)
        user_prompt = self._build_user_prompt(extracted, learning_style, avg_mastery)

        # Call AI
        raw_response = await self.ai.generate(user_prompt, system=system_prompt)

        # Parse response into ExpandedMaterial
        return self._parse_response(raw_response, extracted)

    def _build_system_prompt(self, learning_style: str, avg_mastery: float) -> str:
        level = (
            "beginner" if avg_mastery < 0.3
            else "intermediate" if avg_mastery < 0.7
            else "advanced"
        )
        return f"""You are an expert educational content creator for an adaptive learning platform.
Your job is to take student-uploaded study materials and expand them into clear, structured lessons.

Student profile:
- Learning style: {learning_style}
- Current level: {level} (avg mastery: {avg_mastery:.0%})

Rules:
1. Keep all original facts and formulas intact — never change the source material
2. Add explanations, analogies, and examples that match the student's level
3. For visual learners, describe diagrams and use spatial language
4. For reading/writing learners, provide detailed written explanations
5. Connect new concepts to things the student likely already knows at their level
6. Output ONLY valid JSON — no markdown, no code fences, no extra text"""

    def _build_user_prompt(
        self,
        extracted: ExtractedContent,
        learning_style: str,
        avg_mastery: float,
    ) -> str:
        # Truncate if too long (keep first ~3000 chars for LLM context)
        raw = extracted.raw_text[:3000]
        section_summary = "\n".join(
            f"- {s['heading']}" for s in extracted.sections[:10]
        )

        return f"""Here is a student's uploaded study material:

--- START OF MATERIAL ---
{raw}
--- END OF MATERIAL ---

Sections found: {section_summary}

Please expand this into a structured lesson. Return ONLY a JSON object with this exact schema:
{{
    "title": "A clear, descriptive title for this lesson",
    "summary": "2-3 sentence overview of what this material covers",
    "chapters": [
        {{
            "title": "Chapter title",
            "content": "Expanded explanation (2-3 paragraphs). Include the original content plus your additions.",
            "concept_ids": []
        }}
    ],
    "key_concepts": ["concept1", "concept2", "concept3"],
    "difficulty_level": 0.5
}}

Create 2-5 chapters based on the material's natural structure.
Make the content engaging for a {learning_style} learner at {"beginner" if avg_mastery < 0.3 else "intermediate" if avg_mastery < 0.7 else "advanced"} level."""

    def _parse_response(
        self,
        raw: str,
        extracted: ExtractedContent,
    ) -> ExpandedMaterial:
        """Parse AI response into ExpandedMaterial, with fallback."""
        try:
            # Try to find JSON in the response
            cleaned = raw.strip()
            # Remove markdown code fences if present
            if cleaned.startswith("```"):
                lines = cleaned.split("\n")
                cleaned = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
                cleaned = cleaned.strip()

            data = json.loads(cleaned)
            return ExpandedMaterial(
                title=data.get("title", extracted.metadata.get("filename", "Lesson")),
                summary=data.get("summary", ""),
                chapters=data.get("chapters", []),
                key_concepts=data.get("key_concepts", []),
                difficulty_level=data.get("difficulty_level", 0.5),
            )
        except (json.JSONDecodeError, KeyError, TypeError):
            # Fallback: structure from extracted sections directly
            return ExpandedMaterial(
                title=extracted.metadata.get("filename", "Study Material"),
                summary=f"Extracted content from {extracted.metadata.get('filename', 'your file')}.",
                chapters=[
                    {
                        "title": section.get("heading", f"Section {i+1}"),
                        "content": section.get("body", ""),
                        "concept_ids": [],
                    }
                    for i, section in enumerate(extracted.sections[:5])
                ],
                key_concepts=[],
                difficulty_level=0.5,
            )
