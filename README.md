# 🐾 PetCare AI

> Comprends ton animal, prends soin de lui.

Assistant intelligent qui analyse le comportement de ton animal au quotidien. Il traduit les actions simples, détecte les émotions et identifie les signes de maladie. Conçu pour les nouveaux propriétaires qui apprennent à lire les signaux de leur animal.

## Fonctionnalités

### MVP v1 (en cours)
- Analyse de comportement par **description texte**
- Espèces supportées : **chien** et **chat**
- Pipeline **RAG** basé sur des sources vétérinaires fiables
- Interface **Streamlit** simple et intuitive

### Roadmap
- **v2** — Analyse de photos (Computer Vision)
- **v3** — Analyse de vidéos (MediaPipe) + historique en base de données
- **v4** — Détection d'émotions et signes de maladie (niveaux 2 et 3)
- **vNext** — Extension à d'autres espèces (lapin, oiseau, etc.)

## Stack technique

| Composant | Technologie |
|-----------|-------------|
| RAG | LangChain + ChromaDB |
| Embeddings | sentence-transformers (multilingue) |
| LLM | Groq (Llama 3) |
| Interface | Streamlit |
| Base de données | SQLite (v3) |

## Installation

```powershell
# Cloner le repo
git clone https://github.com/Nour911x/petcare-ai.git
cd petcare-ai

# Créer et activer l'environnement virtuel
py -m venv venv
.\venv\Scripts\Activate.ps1

# Installer les dépendances
pip install -r requirements.txt

# Configurer les clés API
copy .env.example .env
# Puis éditer .env avec ta clé Groq
```

## Utilisation

```powershell
# 1. Construire la base de connaissances (à faire une seule fois)
py -m src.ingest

# 2. Lancer l'interface
streamlit run app.py
```

## Architecture

```
petcare-ai/
├── data/
│   ├── knowledge_base/   # Sources vétérinaires (.md)
│   └── chroma_db/        # Vector store généré
├── src/
│   ├── config.py         # Paramètres centralisés
│   ├── ingest.py         # Pipeline d'ingestion RAG
│   └── rag.py            # Pipeline retrieval + LLM
├── app.py                # Interface Streamlit
└── requirements.txt
```

## Auteure

Projet réalisé par **Nour** dans le cadre de son portfolio.
