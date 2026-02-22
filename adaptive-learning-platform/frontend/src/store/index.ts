import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { StudentState, Recommendation, KnowledgeGraphData } from '../types';

interface AppState {
    student: StudentState | null;
    recommendations: Recommendation[];
    knowledgeGraph: KnowledgeGraphData | null;
    isLoading: boolean;
    error: string | null;
}

const initialState: AppState = {
    student: null,
    recommendations: [],
    knowledgeGraph: null,
    isLoading: false,
    error: null,
};

const appSlice = createSlice({
    name: 'app',
    initialState,
    reducers: {
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
        setStudent: (state, action: PayloadAction<StudentState>) => {
            state.student = action.payload;
        },
        setRecommendations: (state, action: PayloadAction<Recommendation[]>) => {
            state.recommendations = action.payload;
        },
        setKnowledgeGraph: (state, action: PayloadAction<KnowledgeGraphData>) => {
            state.knowledgeGraph = action.payload;
        },
    },
});

export const {
    setLoading,
    setError,
    setStudent,
    setRecommendations,
    setKnowledgeGraph,
} = appSlice.actions;

export const store = configureStore({
    reducer: {
        app: appSlice.reducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
