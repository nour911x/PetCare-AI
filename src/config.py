"""Paramètres centralisés du projet PetCare AI."""

import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / "data"
KNOWLEDGE_BASE_DIR = DATA_DIR / "knowledge_base"
CHROMA_DB_DIR = DATA_DIR / "chroma_db"

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "groq")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

EMBEDDING_MODEL = os.getenv(
    "EMBEDDING_MODEL",
    "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
)

CHUNK_SIZE = 500
CHUNK_OVERLAP = 50
RETRIEVAL_K = 4

LLM_TEXT_MODEL = os.getenv("LLM_TEXT_MODEL", "llama-3.3-70b-versatile")
LLM_VISION_MODEL = os.getenv(
    "LLM_VISION_MODEL", "meta-llama/llama-4-scout-17b-16e-instruct"
)

SUPPORTED_SPECIES = ["chien", "chat"]

WEIGHT_ANOMALY_PCT = 5.0
