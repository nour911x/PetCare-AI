"""Endpoints d'analyse : texte, photo, vidéo."""

from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from backend.schemas import AnalysisResponse
from src.config import SUPPORTED_SPECIES
from src.db import (
    save_analysis,
    save_uploaded_image,
    save_uploaded_video,
)
from src.rag import answer, answer_with_image, answer_with_video

router = APIRouter(prefix="/api/analyze", tags=["analysis"])


def _validate_species(species: str) -> str:
    species = species.lower().strip()
    if species not in SUPPORTED_SPECIES:
        raise HTTPException(
            status_code=400,
            detail=f"Espèce non supportée. Doit être l'une de : {SUPPORTED_SPECIES}",
        )
    return species


@router.post("/text", response_model=AnalysisResponse)
def analyze_text(
    species: str = Form(...),
    question: str = Form(...),
    breed: Optional[str] = Form(None),
    pet_name: Optional[str] = Form(None),
):
    """Analyse comportementale à partir d'une description texte uniquement."""
    species = _validate_species(species)
    if not question.strip():
        raise HTTPException(status_code=400, detail="Le champ 'question' est requis.")

    result = answer(question, species, breed=breed or None)

    analysis_id = save_analysis(
        species=species,
        breed=breed or None,
        pet_name=pet_name or None,
        question=question,
        emotion_data=result.get("emotion"),
        health_data=result.get("health"),
        answer=result["answer"],
        sources_used=result["sources"],
    )

    return AnalysisResponse(id=analysis_id, **result)


@router.post("/image", response_model=AnalysisResponse)
async def analyze_image(
    species: str = Form(...),
    image: UploadFile = File(...),
    question: str = Form(""),
    breed: Optional[str] = Form(None),
    pet_name: Optional[str] = Form(None),
):
    """Analyse combinant photo + texte optionnel."""
    species = _validate_species(species)

    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Fichier image vide.")

    image_path = save_uploaded_image(image_bytes, image.filename or "image.jpg")
    mime_type = image.content_type or "image/jpeg"

    result = answer_with_image(
        question=question,
        species=species,
        image_input=image_bytes,
        breed=breed or None,
        mime_type=mime_type,
    )

    analysis_id = save_analysis(
        species=species,
        breed=breed or None,
        pet_name=pet_name or None,
        question=question or None,
        image_path=image_path,
        vision_description=result.get("image_description"),
        emotion_data=result.get("emotion"),
        health_data=result.get("health"),
        answer=result["answer"],
        sources_used=result["sources"],
    )

    return AnalysisResponse(id=analysis_id, **result)


@router.post("/video", response_model=AnalysisResponse)
async def analyze_video(
    species: str = Form(...),
    video: UploadFile = File(...),
    question: str = Form(""),
    breed: Optional[str] = Form(None),
    pet_name: Optional[str] = Form(None),
):
    """Analyse combinant vidéo + texte optionnel (MediaPipe + Vision + RAG)."""
    species = _validate_species(species)

    video_bytes = await video.read()
    if not video_bytes:
        raise HTTPException(status_code=400, detail="Fichier vidéo vide.")

    video_path = save_uploaded_video(video_bytes, video.filename or "video.mp4")

    try:
        result = answer_with_video(
            question=question,
            species=species,
            video_input=video_bytes,
            breed=breed or None,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    va = result.get("video_analysis") or {}
    video_metrics = {
        "duration_s": va.get("duration_s"),
        "activity_score": va.get("activity_score"),
        "displacement": va.get("displacement"),
        "detection_rate": va.get("detection_rate"),
        "n_frames_extracted": va.get("n_frames_extracted"),
    }

    analysis_id = save_analysis(
        species=species,
        breed=breed or None,
        pet_name=pet_name or None,
        question=question or None,
        video_path=video_path,
        video_metrics=video_metrics,
        emotion_data=result.get("emotion"),
        health_data=result.get("health"),
        answer=result["answer"],
        sources_used=result["sources"],
    )

    return AnalysisResponse(id=analysis_id, **result)
