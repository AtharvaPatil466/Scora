export interface Chapter {
    title: string;
    content: string;
    concept_ids: number[];
}

export interface Material {
    material_id: string;
    student_id: string;
    filename: string;
    file_type: string;
    status: 'uploaded' | 'extracting' | 'expanding' | 'ready' | 'error';
    title: string;
    summary: string;
    num_chapters: number;
    num_questions: number;
    key_concepts: string[];
    created_at: string;
    updated_at: string;
}

export interface ExpandedMaterial {
    material_id: string;
    title: string;
    summary: string;
    chapters: Chapter[];
    key_concepts: string[];
    concept_mapping: Record<string, number>;
    difficulty_level: number;
}
