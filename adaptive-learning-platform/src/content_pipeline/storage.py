# ==============================================================================
# MATERIAL STORAGE — Local filesystem storage for uploaded materials
# Stores originals, extraction results, expansions, and quizzes.
# ==============================================================================
from __future__ import annotations

import os
import json
import uuid
import datetime
from pathlib import Path


class MaterialStorage:
    """
    Manages local filesystem storage for student materials.

    Structure:
        {root}/
        ├── index.json               # Global metadata index
        └── {student_id}/
            └── {material_id}/
                ├── original/         # Original uploaded file
                ├── extracted.json    # ExtractedContent
                ├── expanded.json     # ExpandedMaterial
                └── quiz.json         # Generated quiz questions
    """

    def __init__(self, root: str = "data/materials"):
        self.root = Path(root)
        self.root.mkdir(parents=True, exist_ok=True)
        self.index_path = self.root / "index.json"
        self._index = self._load_index()

    # ── Index Management ──────────────────────────────────────────────────

    def _load_index(self) -> dict:
        if self.index_path.exists():
            with open(self.index_path, "r") as f:
                return json.load(f)
        return {}

    def _save_index(self):
        with open(self.index_path, "w") as f:
            json.dump(self._index, f, indent=2, default=str)

    # ── Upload ────────────────────────────────────────────────────────────

    def save_upload(
        self,
        student_id: str,
        filename: str,
        file_bytes: bytes,
    ) -> str:
        """Save an uploaded file and return its material_id."""
        material_id = uuid.uuid4().hex[:12]

        # Create directory structure
        material_dir = self.root / student_id / material_id / "original"
        material_dir.mkdir(parents=True, exist_ok=True)

        # Save original file
        file_path = material_dir / filename
        with open(file_path, "wb") as f:
            f.write(file_bytes)

        # Update index
        key = f"{student_id}/{material_id}"
        self._index[key] = {
            "student_id": student_id,
            "material_id": material_id,
            "filename": filename,
            "file_type": os.path.splitext(filename)[1].lower(),
            "status": "uploaded",
            "title": os.path.splitext(filename)[0],
            "summary": "",
            "num_chapters": 0,
            "num_questions": 0,
            "key_concepts": [],
            "created_at": datetime.datetime.now().isoformat(),
            "updated_at": datetime.datetime.now().isoformat(),
        }
        self._save_index()

        return material_id

    # ── Status ────────────────────────────────────────────────────────────

    def update_status(self, student_id: str, material_id: str, status: str):
        key = f"{student_id}/{material_id}"
        if key in self._index:
            self._index[key]["status"] = status
            self._index[key]["updated_at"] = datetime.datetime.now().isoformat()
            self._save_index()

    def get_status(self, student_id: str, material_id: str) -> str:
        key = f"{student_id}/{material_id}"
        return self._index.get(key, {}).get("status", "not_found")

    # ── File Paths ────────────────────────────────────────────────────────

    def get_original_path(self, student_id: str, material_id: str) -> str:
        original_dir = self.root / student_id / material_id / "original"
        if original_dir.exists():
            files = list(original_dir.iterdir())
            if files:
                return str(files[0])
        return ""

    def _material_dir(self, student_id: str, material_id: str) -> Path:
        return self.root / student_id / material_id

    # ── Save/Load Extracted ───────────────────────────────────────────────

    def save_extracted(self, student_id: str, material_id: str, extracted):
        path = self._material_dir(student_id, material_id) / "extracted.json"
        with open(path, "w") as f:
            json.dump(extracted.to_dict(), f, indent=2, default=str)

    def load_extracted(self, student_id: str, material_id: str) -> dict | None:
        path = self._material_dir(student_id, material_id) / "extracted.json"
        if path.exists():
            with open(path, "r") as f:
                return json.load(f)
        return None

    # ── Save/Load Expanded ────────────────────────────────────────────────

    def save_expanded(self, student_id: str, material_id: str, expanded):
        path = self._material_dir(student_id, material_id) / "expanded.json"
        data = expanded.to_dict()
        with open(path, "w") as f:
            json.dump(data, f, indent=2, default=str)

        # Update index metadata
        key = f"{student_id}/{material_id}"
        if key in self._index:
            self._index[key]["title"] = data.get("title", self._index[key]["title"])
            self._index[key]["summary"] = data.get("summary", "")
            self._index[key]["num_chapters"] = len(data.get("chapters", []))
            self._index[key]["key_concepts"] = data.get("key_concepts", [])
            self._save_index()

    def load_expanded(self, student_id: str, material_id: str) -> dict | None:
        path = self._material_dir(student_id, material_id) / "expanded.json"
        if path.exists():
            with open(path, "r") as f:
                return json.load(f)
        return None

    # ── Save/Load Quiz ────────────────────────────────────────────────────

    def save_quiz(self, student_id: str, material_id: str, quiz: list[dict]):
        path = self._material_dir(student_id, material_id) / "quiz.json"
        with open(path, "w") as f:
            json.dump(quiz, f, indent=2, default=str)

        key = f"{student_id}/{material_id}"
        if key in self._index:
            self._index[key]["num_questions"] = len(quiz)
            self._save_index()

    def load_quiz(self, student_id: str, material_id: str) -> list[dict] | None:
        path = self._material_dir(student_id, material_id) / "quiz.json"
        if path.exists():
            with open(path, "r") as f:
                return json.load(f)
        return None

    # ── Listing ───────────────────────────────────────────────────────────

    def list_materials(self, student_id: str) -> list[dict]:
        """List all materials for a student."""
        results = []
        for key, meta in self._index.items():
            if meta.get("student_id") == student_id:
                results.append(meta)
        return sorted(results, key=lambda x: x.get("created_at", ""), reverse=True)

    def get_material_meta(self, student_id: str, material_id: str) -> dict | None:
        key = f"{student_id}/{material_id}"
        return self._index.get(key)

    # ── Deletion ──────────────────────────────────────────────────────────

    def delete_material(self, student_id: str, material_id: str) -> bool:
        import shutil

        key = f"{student_id}/{material_id}"
        if key not in self._index:
            return False

        material_dir = self._material_dir(student_id, material_id)
        if material_dir.exists():
            shutil.rmtree(material_dir)

        del self._index[key]
        self._save_index()
        return True
