export interface CompletionData {
    timeSpent: number;
    completed: boolean;
    progress: number;
}

export interface ContentViewerProps {
    contentId: string | number;
    studentId: string;
    contentType: 'video' | 'reading' | 'interactive' | string;
    title?: string;
    contentUrl?: string; // Optional URL representing the content
    onComplete: (data: CompletionData) => void;
    onProgress: (percent: number) => void;
}
