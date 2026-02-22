export interface QuizQuestionResult {
    question_id: string;
    student_answer: any;
    correct_answer: any;
    is_correct: boolean;
    time_spent: number;
    hints_used: number;
    attempts: number;
}

export interface QuizResult {
    quiz_id: string;
    student_id: string;
    concept_id: string;
    questions: QuizQuestionResult[];
    raw_score: number;
    final_performance: number;
    mastery_delta: number;
    completion_time: number;
    frustration_detected: boolean;
    learning_style_signals: {
        visual_affinity: number;
        verbal_affinity: number;
        interactive_affinity: number;
    };
}

export interface QuizProps {
    quizId: string;
    studentId: string;
    conceptId: string;
    targetDifficulty: number;
    maxQuestions?: number;
    onComplete: (result: QuizResult) => void;
}
