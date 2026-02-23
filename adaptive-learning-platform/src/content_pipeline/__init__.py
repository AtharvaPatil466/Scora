# ==============================================================================
# CONTENT PIPELINE — Upload → Extract → Expand → Learn
# ==============================================================================
from .extractors import extract_file, ExtractedContent
from .ai_service import get_ai_provider, AIProvider
from .expander import ContentExpander, ExpandedMaterial
from .quiz_generator import QuizGenerator
from .storage import MaterialStorage

__all__ = [
    "extract_file",
    "ExtractedContent",
    "get_ai_provider",
    "AIProvider",
    "ContentExpander",
    "ExpandedMaterial",
    "QuizGenerator",
    "MaterialStorage",
    "ContentPipeline",
]


class ContentPipeline:
    """
    Orchestrates the full content pipeline:
    Upload → Extract → Expand → Generate Quiz
    """

    def __init__(self, storage_root: str = "data/materials"):
        self.storage = MaterialStorage(storage_root)
        self.ai = get_ai_provider()
        self.expander = ContentExpander(self.ai)
        self.quiz_gen = QuizGenerator(self.ai)

    async def process_material(
        self,
        student_id: str,
        material_id: str,
        filename: str,
        knowledge_state: list[float] | None = None,
        learning_style: str = "visual",
    ) -> dict:
        """Full pipeline: extract → expand → quiz."""
        # 1. Update status → extracting
        self.storage.update_status(student_id, material_id, "extracting")

        # 3. Extract content from file
        file_path = self.storage.get_original_path(student_id, material_id)
        extracted = extract_file(file_path, filename)
        self.storage.save_extracted(student_id, material_id, extracted)

        # 4. Update status → expanding
        self.storage.update_status(student_id, material_id, "expanding")

        # 5. Expand with AI
        expanded = await self.expander.expand(
            extracted,
            knowledge_state=knowledge_state or [],
            learning_style=learning_style,
        )
        self.storage.save_expanded(student_id, material_id, expanded)

        # 6. Generate quiz
        quiz = await self.quiz_gen.generate(
            expanded,
            target_difficulty=0.5,
            num_questions=5,
        )
        self.storage.save_quiz(student_id, material_id, quiz)

        # 7. Mark ready
        self.storage.update_status(student_id, material_id, "ready")

        return {
            "material_id": material_id,
            "status": "ready",
            "title": expanded.title,
            "summary": expanded.summary,
            "num_chapters": len(expanded.chapters),
            "num_questions": len(quiz),
            "key_concepts": expanded.key_concepts,
        }
