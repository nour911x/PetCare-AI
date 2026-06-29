"""Endpoints de gestion des rappels de soins (CRUD)."""

from typing import Optional

from fastapi import APIRouter, HTTPException

from backend.schemas import (
    REMINDER_CATEGORIES,
    DeleteResponse,
    ReminderCreate,
    ReminderOut,
    ReminderUpdate,
)
from src.db import (
    create_reminder,
    delete_reminder,
    get_pet,
    get_reminders,
    update_reminder,
)

router = APIRouter(prefix="/api/reminders", tags=["reminders"])


def _normalize_category(category: str) -> str:
    category = (category or "autre").lower().strip()
    return category if category in REMINDER_CATEGORIES else "autre"


@router.get("", response_model=list[ReminderOut])
def list_reminders(pet_id: Optional[int] = None, include_done: bool = True):
    """Liste les rappels (filtrable par animal), par échéance croissante."""
    return get_reminders(pet_id=pet_id, include_done=include_done)


@router.post("", response_model=ReminderOut)
def add_reminder(reminder: ReminderCreate):
    """Crée un rappel de soin."""
    if not get_pet(reminder.pet_id):
        raise HTTPException(status_code=404, detail="Animal introuvable.")
    if not reminder.title.strip():
        raise HTTPException(status_code=400, detail="Le titre est requis.")
    return create_reminder(
        pet_id=reminder.pet_id,
        title=reminder.title.strip(),
        category=_normalize_category(reminder.category),
        due_date=reminder.due_date,
        notes=reminder.notes,
    )


@router.put("/{reminder_id}", response_model=ReminderOut)
def edit_reminder(reminder_id: int, reminder: ReminderUpdate):
    """Modifie un rappel (champs fournis uniquement)."""
    fields = reminder.model_dump(exclude_unset=True)
    if "category" in fields and fields["category"] is not None:
        fields["category"] = _normalize_category(fields["category"])
    updated = update_reminder(reminder_id, **fields)
    if not updated:
        raise HTTPException(status_code=404, detail="Rappel introuvable.")
    return updated


@router.delete("/{reminder_id}", response_model=DeleteResponse)
def remove_reminder(reminder_id: int):
    """Supprime un rappel."""
    ok = delete_reminder(reminder_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Rappel introuvable.")
    return DeleteResponse(success=True, deleted_id=reminder_id)
