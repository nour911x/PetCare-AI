FROM python:3.12-slim

WORKDIR /app

# Dépendances système pour OpenCV et MediaPipe
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 libgl1 libsm6 libxext6 libxrender1 \
    && rm -rf /var/lib/apt/lists/*

# Dépendances Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Code de l'application
COPY . .

# Construit la base vectorielle (embeddings) pendant le build
RUN python -m src.ingest

# Hugging Face Spaces sert l'application sur le port 7860
EXPOSE 7860
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "7860"]
