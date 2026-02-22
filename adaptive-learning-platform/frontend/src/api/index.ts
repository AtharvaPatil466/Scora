import axios from 'axios';
import { Recommendation, KnowledgeGraphData } from '../types';

const API_BASE_URL = 'http://localhost:8000'; // Defaulting to local FastAPI proxy

export const getStudentState = async (studentId: string) => {
    const response = await axios.get(`${API_BASE_URL}/student/${studentId}`);
    return response.data;
};

export const getRecommendations = async (studentId: string, topK: number = 5, knowledgeState?: number[]): Promise<Recommendation[]> => {
    const response = await axios.post(`${API_BASE_URL}/recommend`, {
        student_id: studentId,
        top_k: topK,
        knowledge_state: knowledgeState
    });
    return response.data.recommendations;
};

export const getKnowledgeGraph = async (studentId?: string): Promise<KnowledgeGraphData> => {
    const url = studentId ? `${API_BASE_URL}/knowledge-graph?student_id=${studentId}` : `${API_BASE_URL}/knowledge-graph`;
    const response = await axios.get(url);
    return response.data;
};

export const logInteraction = async (
    studentId: string,
    contentId: number,
    success: boolean,
    timeSpent: number,
    difficulty: number
) => {
    const response = await axios.post(`${API_BASE_URL}/interact`, {
        student_id: studentId,
        content_id: contentId,
        success,
        time_spent: timeSpent,
        difficulty
    });
    return response.data;
};
