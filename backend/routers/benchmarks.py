"""Endpoint des benchmarks par race."""

from typing import Optional

from fastapi import APIRouter, HTTPException

from backend.schemas import BreedBenchmark
from src.benchmarks import compute_breed_benchmarks

router = APIRouter(prefix="/api/benchmarks", tags=["benchmarks"])


@router.get("", response_model=BreedBenchmark)
def read_benchmarks(breed: str, species: Optional[str] = None):
    """Repères de comportement et statistiques pour une race."""
    breed = breed.strip()
    if not breed:
        raise HTTPException(status_code=400, detail="La race est requise.")
    return compute_breed_benchmarks(breed=breed, species=species)
