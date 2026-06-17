"""Endpoint d'analyse de tendances et d'insights sur l'historique."""

from typing import Optional

from fastapi import APIRouter

from backend.schemas import InsightsResponse
from src.db import compute_insights, get_pet_names

router = APIRouter(prefix="/api/insights", tags=["insights"])


@router.get("", response_model=InsightsResponse)
def read_insights(pet_name: Optional[str] = None):
    """Tendances et insights, globaux ou filtrés sur un animal."""
    data = compute_insights(pet_name=pet_name)
    data["pet_names"] = get_pet_names()
    return data
