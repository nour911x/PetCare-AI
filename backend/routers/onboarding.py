"""Endpoint du parcours d'accompagnement nouveau propriétaire."""

from typing import Optional

from fastapi import APIRouter, HTTPException

from backend.schemas import OnboardingPlan
from src.config import SUPPORTED_SPECIES
from src.onboarding import build_onboarding_plan

router = APIRouter(prefix="/api/onboarding", tags=["onboarding"])


@router.get("", response_model=OnboardingPlan)
def read_onboarding(
    species: str,
    age_months: Optional[float] = None,
    breed: Optional[str] = None,
):
    """Parcours semaine par semaine adapté à l'espèce, l'âge et la race."""
    species = species.lower().strip()
    if species not in SUPPORTED_SPECIES:
        raise HTTPException(
            status_code=400,
            detail=f"Espèce non supportée. Doit être l'une de : {SUPPORTED_SPECIES}",
        )
    return build_onboarding_plan(species=species, age_months=age_months, breed=breed)
