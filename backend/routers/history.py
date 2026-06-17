"""Endpoints historique."""

from typing import Optional

from fastapi import APIRouter, HTTPException

from backend.schemas import DeleteResponse, HistoryItem
from src.db import delete_analysis, get_history, get_pet_names

router = APIRouter(prefix="/api/history", tags=["history"])


@router.get("", response_model=list[HistoryItem])
def list_history(
    species: Optional[str] = None,
    pet_name: Optional[str] = None,
    limit: int = 100,
):
    """Retourne la liste des analyses passées (plus récentes en premier)."""
    items = get_history(species=species, pet_name=pet_name, limit=limit)
    return items


@router.get("/pet-names", response_model=list[str])
def list_pet_names():
    """Retourne la liste des noms d'animaux enregistrés."""
    return get_pet_names()


@router.delete("/{analysis_id}", response_model=DeleteResponse)
def remove_analysis(analysis_id: int):
    """Supprime une analyse."""
    ok = delete_analysis(analysis_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Analyse introuvable.")
    return DeleteResponse(success=True, deleted_id=analysis_id)
