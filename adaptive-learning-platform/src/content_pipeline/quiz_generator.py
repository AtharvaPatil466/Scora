# ==============================================================================
# QUIZ GENERATOR — Creates questions directly from study material
# Uses the AI service to generate adaptive quiz questions.
# ==============================================================================
from __future__ import annotations

import json
from .ai_service import AIProvider
from .expander import ExpandedMaterial


class QuizGenerator:
    """Generates quiz questions from expanded study material using AI."""

    def __init__(self, ai: AIProvider):
        self.ai = ai

    async def generate(
        self,
        material: ExpandedMaterial,
        target_difficulty: float = 0.5,
        num_questions: int = 5,
    ) -> list[dict]:
        """
        Generate quiz questions from expanded material.

        Returns list of:
        {
            "question": str,
            "options": [str, str, str, str],
            "correct_index": int,
            "explanation": str,
            "difficulty": float,
            "chapter_ref": str,  # which chapter this tests
        }
        """
        system_prompt = self._build_system_prompt(target_difficulty)
        user_prompt = self._build_user_prompt(material, num_questions, target_difficulty)

        raw_response = await self.ai.generate(user_prompt, system=system_prompt)
        return self._parse_response(raw_response, material, num_questions)

    def _build_system_prompt(self, difficulty: float) -> str:
        level = (
            "easy (test basic recall and understanding)"
            if difficulty < 0.3
            else "medium (test application and connections)"
            if difficulty < 0.7
            else "hard (test analysis, synthesis, and deep understanding)"
        )
        return f"""You are a quiz question generator for an adaptive learning platform.
Generate questions that are {level}.

Rules:
1. Questions MUST be based ONLY on the provided study material
2. Each question must have exactly 4 options with 1 correct answer
3. Explanations should reference the study material
4. Vary question types: recall, application, analysis
5. Output ONLY valid JSON — no markdown, no code fences, no extra text"""

    def _build_user_prompt(
        self,
        material: ExpandedMaterial,
        num_questions: int,
        difficulty: float,
    ) -> str:
        # Build content summary from chapters
        content_parts = []
        for ch in material.chapters[:5]:
            content_parts.append(f"## {ch.get('title', 'Section')}\n{ch.get('content', '')}")
        content_text = "\n\n".join(content_parts)[:3000]

        return f"""Study Material: "{material.title}"

--- CONTENT ---
{content_text}
--- END CONTENT ---

Generate exactly {num_questions} multiple-choice questions based on this material.
Target difficulty: {difficulty:.1f}/1.0

Return ONLY a JSON array with this exact schema:
[
    {{
        "question": "Question text here",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correct_index": 0,
        "explanation": "Why this is the correct answer, referencing the material"
    }}
]"""

    def _parse_response(
        self,
        raw: str,
        material: ExpandedMaterial,
        expected_count: int,
    ) -> list[dict]:
        """Parse AI response into question list, with fallback."""
        try:
            cleaned = raw.strip()
            # Strip markdown code fences if present
            if cleaned.startswith("```"):
                lines = cleaned.split("\n")
                cleaned = "\n".join(
                    lines[1:-1] if lines[-1].strip() == "```" else lines[1:]
                )
                cleaned = cleaned.strip()

            questions = json.loads(cleaned)

            if not isinstance(questions, list):
                raise ValueError("Expected a JSON array")

            # Validate and normalize each question
            valid = []
            for q in questions[:expected_count]:
                valid.append({
                    "question": q.get("question", ""),
                    "options": q.get("options", ["A", "B", "C", "D"])[:4],
                    "correct_index": q.get("correct_index", 0),
                    "explanation": q.get("explanation", ""),
                    "chapter_ref": material.chapters[0]["title"]
                    if material.chapters
                    else "",
                })
            return valid

        except (json.JSONDecodeError, ValueError, KeyError):
            # Fallback: generic questions about the material
            return self._fallback_questions(material, expected_count)

    def _fallback_questions(
        self,
        material: ExpandedMaterial,
        count: int,
    ) -> list[dict]:
        """Generate basic questions when AI parsing fails."""
        title = material.title or "this material"
        questions = [
            {
                "question": f"What is the main topic covered in '{title}'?",
                "options": [
                    f"The core concepts of {title}",
                    "An unrelated topic",
                    "Only historical background",
                    "None of the above",
                ],
                "correct_index": 0,
                "explanation": f"This material primarily covers the core concepts of {title}.",
                "chapter_ref": "",
            },
            {
                "question": f"Based on the material, which approach is recommended?",
                "options": [
                    "A step-by-step systematic approach",
                    "Random trial and error",
                    "Memorization without understanding",
                    "Skipping fundamentals",
                ],
                "correct_index": 0,
                "explanation": "Study materials typically recommend systematic approaches.",
                "chapter_ref": "",
            },
            {
                "question": f"How do the concepts in '{title}' connect to prior knowledge?",
                "options": [
                    "They build on and extend previous concepts",
                    "They are completely independent",
                    "They contradict earlier learning",
                    "There is no connection",
                ],
                "correct_index": 0,
                "explanation": "Concepts in an educational sequence build upon each other.",
                "chapter_ref": "",
            },
            {
                "question": "What is the most effective way to apply this knowledge?",
                "options": [
                    "Practice with varied examples",
                    "Read once and move on",
                    "Only study before exams",
                    "Avoid application entirely",
                ],
                "correct_index": 0,
                "explanation": "Active practice with varied examples leads to deeper understanding.",
                "chapter_ref": "",
            },
            {
                "question": "Why is understanding the foundational concepts important?",
                "options": [
                    "They support learning of advanced topics",
                    "They are only needed for tests",
                    "They are not important",
                    "They should be skipped",
                ],
                "correct_index": 0,
                "explanation": "Foundational concepts enable progression to advanced material.",
                "chapter_ref": "",
            },
        ]
        return questions[:count]
