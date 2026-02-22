export interface StudentProfile {
  name: string;
  grade_level: string;
  learning_style: string;
}

export interface StudentState {
  id: string;
  profile: StudentProfile;
  knowledgeState: number[];
  struggleAreas: string[];
  totalInteractions: number;
  lastInteraction: string;
}

export interface Recommendation {
  content_id: number;
  concept_id: number;
  concept_name: string;
  content_type: string;
  difficulty: number;
  current_mastery: number;
  q_value: number;
  causal_aligned: boolean;
  explanation: string;
}

export interface Node {
  id: number;
  label: string;
  mastery: number;
}

export interface Edge {
  source: number;
  target: number;
  strength: number;
}

export interface KnowledgeGraphData {
  nodes: Node[];
  edges: Edge[];
}
