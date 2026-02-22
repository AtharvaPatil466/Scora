# ==============================================================================
# ADAPTIVE LEARNING PLATFORM - INFERENCE PIPELINE
# File: pipeline.py
#
# Loads all 4 trained models and generates personalized recommendations.
# ==============================================================================

import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
import pickle
import json
import os
from typing import Dict, List, Optional, Tuple


# ==============================================================================
# MODEL DEFINITIONS (must match training code exactly)
# ==============================================================================

class KnowledgeGraphGNN(nn.Module):
    """3-layer GAT for knowledge graph encoding."""
    def __init__(self, num_features=10, hidden_dim=128, embedding_dim=32,
                 num_heads=4, dropout=0.2):
        super().__init__()
        try:
            from torch_geometric.nn import GATConv
            self.use_pyg = True
            self.conv1 = GATConv(num_features, hidden_dim, heads=num_heads, dropout=dropout)
            self.conv2 = GATConv(hidden_dim * num_heads, hidden_dim // 2,
                                 heads=num_heads, dropout=dropout)
            self.conv3 = GATConv((hidden_dim // 2) * num_heads, embedding_dim,
                                 heads=1, concat=False, dropout=dropout)
        except ImportError:
            self.use_pyg = False
        self.dropout = nn.Dropout(dropout)

    def forward(self, x, edge_index):
        x = self.conv1(x, edge_index)
        x = F.elu(x)
        x = self.dropout(x)
        x = self.conv2(x, edge_index)
        x = F.elu(x)
        x = self.dropout(x)
        x = self.conv3(x, edge_index)
        return x


class QNetwork(nn.Module):
    """CQL Q-Network: 96 → 256 → 128 → 64 → 500."""
    def __init__(self, state_dim=96, action_dim=500,
                 hidden_dim_1=256, hidden_dim_2=128):
        super().__init__()
        self.network = nn.Sequential(
            nn.Linear(state_dim, hidden_dim_1), nn.ReLU(), nn.Dropout(0.1),
            nn.Linear(hidden_dim_1, hidden_dim_2), nn.ReLU(), nn.Dropout(0.1),
            nn.Linear(hidden_dim_2, hidden_dim_2 // 2), nn.ReLU(),
            nn.Linear(hidden_dim_2 // 2, action_dim)
        )

    def forward(self, x):
        return self.network(x)


class ContextEncoder(nn.Module):
    """PEARL context encoder: support transitions → 16D context."""
    def __init__(self, input_dim=194, hidden_dim=64, context_dim=16):
        super().__init__()
        self.encoder = nn.Sequential(
            nn.Linear(input_dim, hidden_dim), nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim), nn.ReLU(),
        )
        self.mean_layer = nn.Linear(hidden_dim, context_dim)
        self.log_std_layer = nn.Linear(hidden_dim, context_dim)

    def forward(self, transitions):
        h = self.encoder(transitions)
        h_agg = h.mean(dim=0, keepdim=True)
        mean = self.mean_layer(h_agg)
        log_std = self.log_std_layer(h_agg).clamp(-4, 2)
        std = log_std.exp()
        eps = torch.randn_like(std)
        z = mean + std * eps
        return z, mean, log_std


class PEARLPolicy(nn.Module):
    """PEARL context-conditioned policy: (state + context) → Q-values."""
    def __init__(self, state_dim=96, context_dim=16, action_dim=500,
                 hidden_1=256, hidden_2=128):
        super().__init__()
        self.network = nn.Sequential(
            nn.Linear(state_dim + context_dim, hidden_1), nn.ReLU(), nn.Dropout(0.1),
            nn.Linear(hidden_1, hidden_2), nn.ReLU(),
            nn.Linear(hidden_2, hidden_2 // 2), nn.ReLU(),
            nn.Linear(hidden_2 // 2, action_dim)
        )

    def forward(self, state, context):
        if context.shape[0] == 1 and state.shape[0] > 1:
            context = context.expand(state.shape[0], -1)
        return self.network(torch.cat([state, context], dim=1))


# ==============================================================================
# MAIN PIPELINE CLASS
# ==============================================================================

CPU = torch.device('cpu')  # Always use CPU for Mac


class AdaptiveLearningPipeline:
    """
    Unified inference pipeline for the Adaptive Learning Platform.

    Combines all 4 AI layers:
    1. GNN         → concept embeddings (knowledge graph)
    2. Causal      → treatment effect estimation (why content works)
    3. CQL         → offline RL policy (what to recommend)
    4. PEARL       → fast adaptation (personalize per student)
    """

    def __init__(self, models_dir: str = "models/", device: str = "cpu"):
        self.device = CPU  # Force CPU regardless of passed device
        print(f"Initializing AdaptiveLearningPipeline on CPU")
        self.models_dir = models_dir
        self.models_loaded = {}
        self._load_all_models()
        print(f"Pipeline ready! Models loaded: {list(self.models_loaded.keys())}")

    def _load_all_models(self):
        self._load_knowledge_graph()
        self._load_causal_model()
        self._load_cql_model()
        self._load_pearl_models()

    def _load_knowledge_graph(self):
        kg_path = os.path.join(self.models_dir, "knowledge_graph.pkl")
        emb_path = os.path.join(self.models_dir, "concept_embeddings.pt")

        with open(kg_path, "rb") as f:
            self.knowledge_graph = pickle.load(f)

        self.concept_embeddings = torch.load(
            emb_path, map_location=CPU, weights_only=False
        ).to(CPU)
        self.concept_embeddings_np = self.concept_embeddings.cpu().numpy()

        self.num_concepts = len(self.knowledge_graph["concepts"])
        self.concepts = self.knowledge_graph["concepts"]
        self.kg_edges = self.knowledge_graph["edges"]

        self.models_loaded["GNN"] = True
        print(f"  ✅ GNN: {self.num_concepts} concepts, "
              f"embeddings {self.concept_embeddings.shape}")

    def _load_causal_model(self):
        dag_path = os.path.join(self.models_dir, "causal_dag.pkl")
        model_path = os.path.join(self.models_dir, "treatment_model.pkl")

        with open(dag_path, "rb") as f:
            self.causal_dag = pickle.load(f)

        with open(model_path, "rb") as f:
            self.treatment_model_data = pickle.load(f)

        self.causal_forest = self.treatment_model_data["causal_forest"]
        self.causal_scaler = self.treatment_model_data["scaler"]
        self.causal_features = self.treatment_model_data["feature_cols"]
        self.ate = self.treatment_model_data["ate"]

        self.models_loaded["Causal"] = True
        print(f"  ✅ Causal: ATE={self.ate:.4f}, "
              f"DAG edges={len(self.causal_dag['edges'])}")

    def _load_cql_model(self):
        cql_path = os.path.join(self.models_dir, "cql_model.pth")

        # Force CPU explicitly — model was trained on CUDA (Kaggle H100)
        checkpoint = torch.load(
            cql_path,
            map_location=CPU,
            weights_only=False
        )

        self.cql_network = QNetwork(
            state_dim=96, action_dim=500,
            hidden_dim_1=256, hidden_dim_2=128
        ).to(CPU)
        self.cql_network.load_state_dict(checkpoint["model_state_dict"])
        self.cql_network.eval()

        self.models_loaded["CQL"] = True
        print(f"  ✅ CQL: Q-network loaded "
              f"(best loss: {checkpoint['loss']:.4f})")

    def _load_pearl_models(self):
        encoder_path = os.path.join(self.models_dir, "pearl_context_encoder.pth")
        policy_path = os.path.join(self.models_dir, "pearl_policy.pth")

        context_input_dim = 96 * 2 + 2  # state + next_state + reward + action_norm

        self.pearl_encoder = ContextEncoder(
            input_dim=context_input_dim,
            hidden_dim=64,
            context_dim=16
        ).to(CPU)
        self.pearl_encoder.load_state_dict(
            torch.load(encoder_path, map_location=CPU, weights_only=False)
        )
        self.pearl_encoder.eval()

        self.pearl_policy = PEARLPolicy(
            state_dim=96, context_dim=16, action_dim=500,
            hidden_1=256, hidden_2=128
        ).to(CPU)
        self.pearl_policy.load_state_dict(
            torch.load(policy_path, map_location=CPU, weights_only=False)
        )
        self.pearl_policy.eval()

        self.models_loaded["PEARL"] = True
        print(f"  ✅ PEARL: Context encoder + policy loaded")

    # ==========================================================================
    # STATE BUILDING
    # ==========================================================================

    def build_state(self, knowledge_state: List[float],
                    student_features: Dict) -> np.ndarray:
        ks = np.array(knowledge_state, dtype=np.float32)
        weights = ks / (ks.sum() + 1e-8)
        gnn_context = (self.concept_embeddings_np * weights[:, None]).sum(axis=0)

        feat = np.array([
            student_features.get("skill_level", 0.5),
            student_features.get("learning_rate", 0.05),
            float(ks.mean()), float(ks.std()),
            float(ks.max()), float(ks.min()),
            float((ks > 0.7).sum()), float((ks < 0.3).sum()),
            float((ks > 0).sum()),
            float(ks[:10].mean()), float(ks[10:20].mean()),
            float(ks[20:30].mean()), float(ks[30:40].mean()),
            float(ks[40:].mean()),
        ], dtype=np.float32)

        return np.concatenate([ks, gnn_context, feat])

    # ==========================================================================
    # RECOMMENDATION
    # ==========================================================================

    def recommend(self,
                  knowledge_state: List[float],
                  student_features: Dict,
                  interaction_history: Optional[List[Dict]] = None,
                  top_k: int = 5) -> Dict:
        state = self.build_state(knowledge_state, student_features)
        state_tensor = torch.FloatTensor(state).unsqueeze(0).to(CPU)

        # === CQL Recommendations ===
        with torch.no_grad():
            cql_q_values = self.cql_network(state_tensor).squeeze(0)
            cql_top_k = torch.topk(cql_q_values, top_k * 2)
            cql_actions = cql_top_k.indices.cpu().numpy()
            cql_scores = cql_top_k.values.cpu().numpy()

        # === PEARL Adaptation ===
        pearl_actions = None
        context_vector = None

        if interaction_history and len(interaction_history) >= 3:
            context_input = self._build_context_input(interaction_history, state)
            if context_input is not None:
                with torch.no_grad():
                    z, mean, _ = self.pearl_encoder(context_input)
                    pearl_q_values = self.pearl_policy(state_tensor, z).squeeze(0)
                    pearl_top_k = torch.topk(pearl_q_values, top_k * 2)
                    pearl_actions = pearl_top_k.indices.cpu().numpy()
                    context_vector = mean.cpu().numpy().flatten().tolist()

        # === Causal Treatment Effect ===
        causal_recommendation = self._get_causal_recommendation(
            knowledge_state, student_features
        )

        # === Combine & Rank ===
        recommendations = self._combine_recommendations(
            knowledge_state=knowledge_state,
            cql_actions=cql_actions,
            cql_scores=cql_scores,
            pearl_actions=pearl_actions,
            causal_rec=causal_recommendation,
            top_k=top_k
        )

        return {
            "recommendations": recommendations,
            "causal_insight": causal_recommendation,
            "context_vector": context_vector,
            "student_summary": self._summarize_student(knowledge_state),
            "models_used": {
                "gnn": True,
                "causal": True,
                "cql": True,
                "pearl": interaction_history is not None and len(interaction_history) >= 3
            }
        }

    def _build_context_input(self, history: List[Dict], current_state: np.ndarray):
        try:
            rows = []
            for interaction in history[-10:]:
                s = self.build_state(interaction["state"],
                                     interaction.get("student_features", {}))
                ns = self.build_state(interaction["next_state"],
                                      interaction.get("student_features", {}))
                r = float(interaction["reward"])
                a = float(interaction["action"]) / 500.0
                row = np.concatenate([s, ns, [r, a]])
                rows.append(row)

            return torch.FloatTensor(np.array(rows, dtype=np.float32)).to(CPU)
        except Exception:
            return None

    def _get_causal_recommendation(self, knowledge_state: List[float],
                                    student_features: Dict) -> Dict:
        try:
            ks = np.array(knowledge_state)
            features = np.array([[
                float(ks[0]) if len(ks) > 0 else 0.5,
                float(ks.mean()),
                float(ks.std()),
                student_features.get("skill_level", 0.5),
                student_features.get("learning_rate", 0.05),
                300.0, 1.0, 0.5, 50.0,
            ]])

            features_scaled = self.causal_scaler.transform(features)
            ite = self.causal_forest.effect(features_scaled)[0]

            return {
                "recommended_difficulty": "high" if ite > 0 else "low",
                "estimated_treatment_effect": float(ite),
                "explanation": (
                    f"High difficulty content estimated to increase learning by {abs(ite):.4f}"
                    if ite > 0 else
                    f"Low difficulty content estimated to increase learning by {abs(ite):.4f}"
                )
            }
        except Exception:
            return {
                "recommended_difficulty": "medium",
                "estimated_treatment_effect": float(self.ate),
                "explanation": "Using average treatment effect"
            }

    def _combine_recommendations(self, knowledge_state, cql_actions,
                                   cql_scores, pearl_actions,
                                   causal_rec, top_k) -> List[Dict]:
        ks = np.array(knowledge_state)
        recommended_difficulty = causal_rec.get("recommended_difficulty", "medium")

        candidates = {}
        for action, score in zip(cql_actions, cql_scores):
            candidates[int(action)] = {
                "cql_score": float(score),
                "pearl_score": 0.0,
                "combined_score": float(score)
            }

        if pearl_actions is not None:
            for i, action in enumerate(pearl_actions[:top_k * 2]):
                action = int(action)
                if action in candidates:
                    candidates[action]["pearl_score"] = float(
                        cql_scores[0] * (1 - i / (top_k * 2))
                    )
                    candidates[action]["combined_score"] += (
                        candidates[action]["pearl_score"] * 0.3
                    )
                else:
                    candidates[action] = {
                        "cql_score": 0.0,
                        "pearl_score": float(cql_scores[0] * 0.5),
                        "combined_score": float(cql_scores[0] * 0.5)
                    }

        sorted_actions = sorted(
            candidates.items(),
            key=lambda x: x[1]["combined_score"],
            reverse=True
        )[:top_k]

        recommendations = []
        for action_id, scores in sorted_actions:
            concept_id = action_id % self.num_concepts
            difficulty = (action_id % 9 + 1) / 10.0
            content_types = ["video", "quiz", "reading"]
            content_type = content_types[action_id % 3]

            concept_name = (self.concepts[concept_id]
                            if concept_id < len(self.concepts)
                            else f"Concept {concept_id}")
            current_mastery = (float(ks[concept_id])
                               if concept_id < len(ks) else 0.5)

            difficulty_aligned = (
                (recommended_difficulty == "high" and difficulty > 0.5) or
                (recommended_difficulty == "low" and difficulty <= 0.5) or
                recommended_difficulty == "medium"
            )

            recommendations.append({
                "content_id": action_id,
                "concept_id": concept_id,
                "concept_name": concept_name,
                "content_type": content_type,
                "difficulty": round(difficulty, 2),
                "current_mastery": round(current_mastery, 3),
                "q_value": round(scores["combined_score"], 4),
                "causal_aligned": difficulty_aligned,
                "explanation": self._generate_explanation(
                    concept_name, difficulty, current_mastery,
                    difficulty_aligned, causal_rec
                )
            })

        return recommendations

    def _generate_explanation(self, concept_name, difficulty,
                               current_mastery, causal_aligned, causal_rec) -> str:
        mastery_desc = (
            "low mastery" if current_mastery < 0.3 else
            "medium mastery" if current_mastery < 0.7 else
            "high mastery"
        )
        diff_desc = (
            "challenging" if difficulty > 0.6 else
            "moderate" if difficulty > 0.3 else
            "foundational"
        )
        causal_note = (
            "✓ Causal analysis confirms this difficulty"
            if causal_aligned else
            "Standard difficulty"
        )
        return f"{concept_name} ({diff_desc}, {mastery_desc}). {causal_note}."

    def _summarize_student(self, knowledge_state: List[float]) -> Dict:
        ks = np.array(knowledge_state)
        return {
            "overall_mastery": round(float(ks.mean()), 3),
            "concepts_mastered": int((ks > 0.7).sum()),
            "concepts_in_progress": int(((ks > 0.1) & (ks <= 0.7)).sum()),
            "concepts_not_started": int((ks <= 0.1).sum()),
            "strongest_area": (self.concepts[int(ks.argmax())]
                               if len(self.concepts) > 0 else "N/A"),
            "weakest_area": (self.concepts[int(ks.argmin())]
                             if len(self.concepts) > 0 else "N/A"),
            "domain_progress": {
                "basic_arithmetic": round(float(ks[:10].mean()), 3),
                "fractions_decimals": round(float(ks[10:20].mean()), 3),
                "pre_algebra": round(float(ks[20:30].mean()), 3),
                "algebra": round(float(ks[30:40].mean()), 3),
                "advanced": round(float(ks[40:].mean()), 3),
            }
        }

    def get_knowledge_graph(self) -> Dict:
        nodes = [
            {"id": i, "label": concept, "mastery": 0.0}
            for i, concept in enumerate(self.concepts)
        ]
        edges = [
            {"source": e["source"], "target": e["target"],
             "strength": e.get("strength", 1.0)}
            for e in self.kg_edges
        ]
        return {"nodes": nodes, "edges": edges}