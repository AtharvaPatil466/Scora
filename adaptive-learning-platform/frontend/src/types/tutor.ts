export interface ChatMessage {
    id: string;
    role: 'student' | 'tutor';
    content: string;
    timestamp: number;
}

export interface TutorChatProps {
    studentId: string;
    currentConceptId: string;
    currentProblem?: string;
    context: 'content' | 'quiz' | 'general';
}
