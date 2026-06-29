"""Schémas Pydantic pour les réponses de l'API."""

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field


class Source(BaseModel):
    topic: Optional[str] = None
    species: Optional[str] = None
    excerpt: str


class EmotionData(BaseModel):
    emotion: str
    intensity: str
    confidence: float
    reasoning: str
    observed_signals: list[str]
    emoji: Optional[str] = None
    color: Optional[str] = None


class HealthData(BaseModel):
    urgency: str
    recommendation: str
    confidence: float
    potential_concerns: list[str]
    reasoning: str
    when_to_consult: str
    emoji: Optional[str] = None
    color: Optional[str] = None
    urgency_label: Optional[str] = None
    recommendation_label: Optional[str] = None


class VideoAnalysisData(BaseModel):
    duration_s: float
    activity_score: float
    displacement: float
    detection_rate: float
    n_frames_extracted: int
    key_frame_descriptions: list[str]
    temporal_narrative: str


class AnalysisResponse(BaseModel):
    id: Optional[int] = None
    answer: str
    emotion: Optional[EmotionData] = None
    health: Optional[HealthData] = None
    image_description: Optional[str] = None
    video_analysis: Optional[VideoAnalysisData] = None
    sources: list[Source]


class HistoryItem(BaseModel):
    id: int
    created_at: datetime
    species: str
    breed: Optional[str] = None
    pet_name: Optional[str] = None
    question: Optional[str] = None
    image_path: Optional[str] = None
    video_path: Optional[str] = None
    vision_description: Optional[str] = None
    video_metrics: Optional[dict] = None
    emotion_data: Optional[dict] = None
    health_data: Optional[dict] = None
    answer: str
    sources_used: list[Source]


class StatsResponse(BaseModel):
    total: int
    chiens: int
    chats: int
    with_photos: int
    emotion_distribution: dict[str, int]
    urgency_distribution: dict[str, int]
    pet_names: list[str]


class DeleteResponse(BaseModel):
    success: bool
    deleted_id: int


class MonthlyCount(BaseModel):
    month: str
    count: int


class InsightHighlight(BaseModel):
    type: str
    tone: str
    text: str


class InsightsResponse(BaseModel):
    total: int
    this_month: int
    last_month: int
    trend_pct: Optional[int] = None
    top_emotion: Optional[str] = None
    top_emotion_count: int = 0
    emotion_distribution: dict[str, int] = {}
    monthly_counts: list[MonthlyCount] = []
    highlights: list[InsightHighlight] = []
    pet_names: list[str] = []


class OnboardingStep(BaseModel):
    id: str
    text: str
    category: Optional[str] = None


class OnboardingPhase(BaseModel):
    id: str
    title: str
    emoji: str
    steps: list[OnboardingStep]


class OnboardingPlan(BaseModel):
    species: str
    age_category: str
    phases: list[OnboardingPhase]
    breed_tips: list[str] = []


class BreedBenchmark(BaseModel):
    breed: str
    species: Optional[str] = None
    sample_size: int
    emotion_distribution: dict[str, int] = {}
    emotion_percentages: dict[str, int] = {}
    typical_traits: list[str] = []
    highlights: list[str] = []


class PetCreate(BaseModel):
    name: str
    species: str
    breed: Optional[str] = None
    sex: Optional[str] = None
    birthdate: Optional[date] = None
    weight_kg: Optional[float] = None
    sterilized: Optional[bool] = None
    allergies: list[str] = []
    medical_notes: Optional[str] = None


class PetUpdate(BaseModel):
    name: Optional[str] = None
    species: Optional[str] = None
    breed: Optional[str] = None
    sex: Optional[str] = None
    birthdate: Optional[date] = None
    weight_kg: Optional[float] = None
    sterilized: Optional[bool] = None
    allergies: Optional[list[str]] = None
    medical_notes: Optional[str] = None


class PetOut(BaseModel):
    id: int
    created_at: datetime
    updated_at: datetime
    name: str
    species: str
    breed: Optional[str] = None
    sex: Optional[str] = None
    birthdate: Optional[str] = None
    weight_kg: Optional[float] = None
    sterilized: Optional[bool] = None
    allergies: list[str] = []
    medical_notes: Optional[str] = None
    avatar_path: Optional[str] = None
    age_years: Optional[float] = None
    age_label: Optional[str] = None


class WeightEntryCreate(BaseModel):
    weight_kg: float
    entry_date: Optional[date] = Field(default=None, alias="date")
    note: Optional[str] = None

    model_config = {"populate_by_name": True}


class WeightEntryOut(BaseModel):
    id: int
    pet_id: int
    date: str
    weight_kg: float
    note: Optional[str] = None
    created_at: datetime


class WeightInsights(BaseModel):
    count: int
    latest_kg: Optional[float] = None
    first_kg: Optional[float] = None
    change_kg: Optional[float] = None
    change_pct: Optional[float] = None
    direction: str
    anomalies: list[str] = []


class WeightHistory(BaseModel):
    pet_id: int
    entries: list[WeightEntryOut]
    insights: WeightInsights


REMINDER_CATEGORIES = ["vaccin", "vermifuge", "visite", "autre"]


class ReminderCreate(BaseModel):
    pet_id: int
    title: str
    category: str = "autre"
    due_date: date
    notes: Optional[str] = None


class ReminderUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    due_date: Optional[date] = None
    notes: Optional[str] = None
    done: Optional[bool] = None


class ReminderOut(BaseModel):
    id: int
    pet_id: int
    title: str
    category: str
    due_date: str
    notes: Optional[str] = None
    done: bool
    status: str
    days_until: Optional[int] = None
    created_at: datetime
