from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class StudentState(BaseModel):
    """
    Student knowledge and profile state
    Stored in: DynamoDB StudentStates table
    """
    student_id: str
    
    # Knowledge state
    knowledge_state: List[float] = Field(default_factory=list)
    learning_velocity: float = 0.0
    struggle_areas: List[str] = Field(default_factory=list)
    
    # Profile
    learning_style: str = "visual"
    grade_level: Optional[str] = None
    subject_interests: List[str] = Field(default_factory=list)
    
    # Metadata
    total_interactions: int = 0
    last_interaction: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # PEARL context (cached)
    cached_context: Optional[List[float]] = None
    context_updated_at: Optional[datetime] = None


class InteractionLog(BaseModel):
    """
    Single student interaction record
    Stored in: DynamoDB InteractionLogs table
    """
    student_id: str
    timestamp: float  # Unix timestamp
    
    # State-action-reward tuple
    state: List[float]
    action: Dict[str, Any]  # e.g. {"content_id": 123, "difficulty": 0.5}
    reward: float
    next_state: List[float]
    
    # Additional context
    content_id: str
    content_type: str
    performance: float
    time_spent: int
    completed: bool
    
    # Metadata
    session_id: str
    device: str = "web"


class ContentItem(BaseModel):
    """
    Educational content metadata
    Stored in: DynamoDB ContentLibrary table
    """
    content_id: str
    
    # Content details
    title: str
    description: str
    content_type: str
    url: Optional[str] = None
    content_data: Optional[Dict[str, Any]] = None
    
    # Difficulty & tagging
    difficulty_level: float
    concepts_covered: List[str] = Field(default_factory=list)
    prerequisites: List[str] = Field(default_factory=list)
    estimated_time_minutes: int
    
    # Effectiveness metrics
    avg_learning_gain: float = 0.0
    avg_engagement_score: float = 0.0
    num_completions: int = 0
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
