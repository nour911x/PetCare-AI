# 🐾 PetCare AI

> Comprends ton animal, prends soin de lui.

Application full-stack qui analyse le comportement des animaux de compagnie pour aider les propriétaires à mieux les comprendre. Elle combine une IA d'analyse (texte, photo, vidéo) avec un véritable carnet de suivi : fiche santé, poids, rappels de soins, export vétérinaire et conseils personnalisés.

Projet réalisé par **Nour**.

![Python](https://img.shields.io/badge/Python-3.13-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)

## Aperçu

<!-- Ajoute tes captures d'écran dans un dossier "screenshots/" puis décommente les lignes ci-dessous -->
<!-- ![Accueil](screenshots/accueil.png) -->
<!-- ![Fiche animal](screenshots/fiche-animal.png) -->
<!-- ![Tendances](screenshots/tendances.png) -->

_Captures d'écran à venir._

## Fonctionnalités

**Analyse comportementale par IA**
- Analyse par description texte, photo (vision) ou courte vidéo
- Détection des émotions et évaluation du niveau d'urgence santé (feu tricolore)
- Réponses appuyées sur des sources vétérinaires (RAG)

**Carnet de l'animal**
- Fiche complète : âge, poids, vaccins, allergies, notes médicales, photo
- Suivi du poids avec courbe d'évolution et détection des variations anormales
- Calendrier de rappels (vaccins, vermifuges, visites) avec statut automatique
- Export d'un dossier vétérinaire en PDF (fiche + poids + rappels + historique)

**Accompagnement**
- Mode urgence : triage rapide en 3 questions + recherche de vétérinaire proche
- Tendances & insights sur l'historique (« X signes d'anxiété ce mois-ci »)
- Mode nouveau propriétaire : guide semaine par semaine selon l'espèce, l'âge et la race
- Benchmarks par race pour normaliser les comportements

**Espèces supportées :** chien et chat (architecture pensée pour s'étendre à d'autres espèces).

## Stack technique

| Couche | Technologies |
|--------|-------------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | FastAPI, SQLAlchemy, SQLite |
| RAG | LangChain + ChromaDB, embeddings sentence-transformers (multilingue) |
| LLM | Groq — Llama 3.3 70B (texte) et Llama 4 Scout (vision) |
| Vision / vidéo | OpenCV + MediaPipe |

## Architecture

```
petcare-ai/
├── backend/              # API FastAPI
│   ├── main.py           # Point d'entrée + routes
│   ├── schemas.py        # Schémas Pydantic
│   └── routers/          # analyses, fiches, rappels, insights, onboarding, benchmarks
├── src/                  # Logique métier & IA
│   ├── rag.py            # Pipeline RAG (retrieval + LLM)
│   ├── vision.py         # Analyse d'images
│   ├── video.py          # Analyse de vidéos (OpenCV + MediaPipe)
│   ├── db.py             # Base de données (SQLAlchemy)
│   ├── onboarding.py     # Génération du parcours nouveau propriétaire
│   ├── benchmarks.py     # Repères par race
│   └── ingest.py         # Ingestion de la base de connaissances
├── frontend/             # Application Next.js
│   ├── app/              # Pages (accueil, animaux, rappels, urgence, tendances…)
│   ├── components/       # Composants UI
│   └── lib/              # Appels API
├── data/
│   └── knowledge_base/   # Sources vétérinaires (.md)
└── requirements.txt
```

## Installation

Prérequis : **Python 3.13+**, **Node.js 20+**, et une clé API **Groq** (gratuite).

### 1. Backend

```powershell
git clone https://github.com/Nour911x/petcare-ai.git
cd petcare-ai

py -m venv venv
.\venv\Scripts\Activate.ps1

pip install -r requirements.txt

copy .env.example .env
# puis ouvre .env et ajoute ta clé Groq
```

Construis la base de connaissances (une seule fois) :

```powershell
py -m src.ingest
```

Lance l'API :

```powershell
uvicorn backend.main:app --reload
```

L'API tourne sur http://localhost:8000 (documentation interactive sur http://localhost:8000/docs).

### 2. Frontend

Dans un **second** terminal :

```powershell
cd frontend
npm install
npm run dev
```

Ouvre http://localhost:3000. Le frontend et le backend doivent tourner en même temps.

## Ce que ce projet démontre

- Conception et développement d'une application **full-stack** de bout en bout
- Intégration d'un pipeline **RAG** sur un domaine métier (comportement animal)
- Combinaison de plusieurs briques IA : **NLP, vision et analyse vidéo**
- Une **pensée produit** : au-delà du POC, des fonctionnalités utiles au quotidien

## Pistes futures

- Extension à d'autres espèces (lapin, oiseau, rongeur…)
- Comptes utilisateurs et synchronisation multi-appareils
- Notifications de rappels

## Auteure

Projet réalisé par **Nour**.
