export interface CompletionData {
    timeSpent: number;
    completed: boolean;
    progress: number;
}

export interface ContentViewerProps {
    contentId: number;
    studentId: string;
    contentType: 'video' | 'quiz' | 'reading';
    title: string;
    contentUrl?: string; // Optional actual content URL
    materialId?: string; // Optional material ID for custom uploaded content
    onComplete: (data: CompletionData) => void;
    onProgress: (progress: number) => void;
}
