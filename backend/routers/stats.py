"""Endpoints statistiques globales."""

from collections import Counter

from fastapi import APIRouter

from backend.schemas import StatsResponse
from src.db import get_history, get_pet_names, get_stats

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("", response_model=StatsResponse)
def stats():
    """Stats globales pour le dashboard frontend."""
    base = get_stats()
    all_analyses = get_history(limit=1000)

    emotion_counter: Counter = Counter()
    urgency_counter: Counter = Counter()

    for a in all_analyses:
        em = a.get("emotion_data")
        if em and em.get("emotion"):
            emotion_counter[em["emotion"]] += 1
        h = a.get("health_data")
        if h and h.get("urgency"):
            urgency_counter[h["urgency"]] += 1

    return StatsResponse(
        total=base["total"],
        chiens=base["chiens"],
        chats=base["chats"],
        with_photos=base["with_photos"],
        emotion_distribution=dict(emotion_counter),
        urgency_distribution=dict(urgency_counter),
        pet_names=get_pet_names(),
    )
