"""Endpoints de gestion des fiches animaux (CRUD + photo)."""

from typing import Optional

from fastapi import APIRouter, File, HTTPException, UploadFile

from backend.schemas import (
    DeleteResponse,
    PetCreate,
    PetOut,
    PetUpdate,
    WeightEntryCreate,
    WeightEntryOut,
    WeightHistory,
)
from src.config import SUPPORTED_SPECIES
from src.db import (
    add_weight_entry,
    compute_weight_insights,
    create_pet,
    delete_pet,
    delete_weight_entry,
    get_pet,
    get_pets,
    get_weight_entries,
    save_uploaded_image,
    update_pet,
)

router = APIRouter(prefix="/api/pets", tags=["pets"])


def _validate_species(species: str) -> str:
    species = species.lower().strip()
    if species not in SUPPORTED_SPECIES:
        raise HTTPException(
            status_code=400,
            detail=f"Espèce non supportée. Doit être l'une de : {SUPPORTED_SPECIES}",
        )
    return species


@router.get("", response_model=list[PetOut])
def list_pets(species: Optional[str] = None):
    """Liste toutes les fiches animaux enregistrées."""
    return get_pets(species=species)


@router.post("", response_model=PetOut)
def add_pet(pet: PetCreate):
    """Crée une nouvelle fiche animal."""
    data = pet.model_dump()
    data["species"] = _validate_species(data["species"])
    if not data["name"].strip():
        raise HTTPException(status_code=400, detail="Le nom est requis.")
    return create_pet(**data)


@router.get("/{pet_id}", response_model=PetOut)
def read_pet(pet_id: int):
    """Récupère une fiche animal."""
    pet = get_pet(pet_id)
    if not pet:
        raise HTTPException(status_code=404, detail="Animal introuvable.")
    return pet


@router.put("/{pet_id}", response_model=PetOut)
def edit_pet(pet_id: int, pet: PetUpdate):
    """Modifie une fiche animal (champs fournis uniquement)."""
    fields = pet.model_dump(exclude_unset=True)
    if "species" in fields and fields["species"]:
        fields["species"] = _validate_species(fields["species"])
    updated = update_pet(pet_id, **fields)
    if not updated:
        raise HTTPException(status_code=404, detail="Animal introuvable.")
    return updated


@router.delete("/{pet_id}", response_model=DeleteResponse)
def remove_pet(pet_id: int):
    """Supprime une fiche animal."""
    ok = delete_pet(pet_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Animal introuvable.")
    return DeleteResponse(success=True, deleted_id=pet_id)


@router.post("/{pet_id}/avatar", response_model=PetOut)
async def upload_avatar(pet_id: int, file: UploadFile = File(...)):
    """Ajoute / remplace la photo d'un animal."""
    if not get_pet(pet_id):
        raise HTTPException(status_code=404, detail="Animal introuvable.")

    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Fichier image vide.")

    avatar_path = save_uploaded_image(image_bytes, file.filename or "avatar.jpg")
    return update_pet(pet_id, avatar_path=avatar_path)


@router.get("/{pet_id}/weights", response_model=WeightHistory)
def list_weights(pet_id: int):
    """Historique de poids d'un animal + analyse (tendance, anomalies)."""
    if not get_pet(pet_id):
        raise HTTPException(status_code=404, detail="Animal introuvable.")
    entries = get_weight_entries(pet_id)
    return WeightHistory(
        pet_id=pet_id,
        entries=entries,
        insights=compute_weight_insights(entries),
    )


@router.post("/{pet_id}/weights", response_model=WeightEntryOut)
def add_weight(pet_id: int, entry: WeightEntryCreate):
    """Ajoute une pesée à un animal."""
    if not get_pet(pet_id):
        raise HTTPException(status_code=404, detail="Animal introuvable.")
    if entry.weight_kg <= 0:
        raise HTTPException(status_code=400, detail="Le poids doit être positif.")
    return add_weight_entry(
        pet_id=pet_id,
        weight_kg=entry.weight_kg,
        entry_date=entry.entry_date,
        note=entry.note,
    )


@router.delete("/{pet_id}/weights/{entry_id}", response_model=DeleteResponse)
def remove_weight(pet_id: int, entry_id: int):
    """Supprime une pesée."""
    ok = delete_weight_entry(entry_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Pesée introuvable.")
    return DeleteResponse(success=True, deleted_id=entry_id)
