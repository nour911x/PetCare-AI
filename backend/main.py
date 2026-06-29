"""Application FastAPI de PetCare AI.

Lancer avec : uvicorn backend.main:app --reload
La liste des routes est consultable sur http://localhost:8000/docs
"""

from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from backend.routers import (
    analysis,
    benchmarks,
    history,
    insights,
    onboarding,
    pets,
    reminders,
    stats,
)
from src.db import UPLOADS_DIR, init_db


app = FastAPI(
    title="PetCare AI API",
    description=(
        "API d'analyse comportementale d'animaux de compagnie. "
        "Combine RAG (LangChain + ChromaDB), Vision (Llama 4 Vision via Groq), "
        "vidéo (OpenCV + MediaPipe), détection d'émotion et évaluation santé."
    ),
    version="1.0.0",
)


ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()


app.include_router(analysis.router)
app.include_router(history.router)
app.include_router(stats.router)
app.include_router(pets.router)
app.include_router(reminders.router)
app.include_router(insights.router)
app.include_router(onboarding.router)
app.include_router(benchmarks.router)


@app.get("/", tags=["root"])
def root():
    return {
        "service": "PetCare AI API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/api/media/{filename}", tags=["media"])
def serve_media(filename: str):
    """Sert une image ou vidéo uploadée (référencée par nom de fichier)."""
    if "/" in filename or "\\" in filename or ".." in filename:
        raise HTTPException(status_code=400, detail="Nom de fichier invalide.")

    file_path = UPLOADS_DIR / filename
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="Fichier introuvable.")

    return FileResponse(file_path)
