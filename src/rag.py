"""Pipeline RAG : recherche dans ChromaDB puis réponse générée par le LLM (Groq).

Gère l'analyse du comportement, la détection d'émotion et l'évaluation santé.
"""

from typing import Literal

from pydantic import BaseModel, Field

from langchain_chroma import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from src.config import (
    CHROMA_DB_DIR,
    EMBEDDING_MODEL,
    GROQ_API_KEY,
    LLM_TEXT_MODEL,
    RETRIEVAL_K,
)
from src.vision import describe_image


EmotionLabel = Literal[
    "heureux",
    "calme",
    "joueur",
    "stresse",
    "anxieux",
    "en_colere",
    "triste",
    "peur",
    "fatigue",
    "neutre",
]

IntensityLabel = Literal["faible", "moderee", "elevee"]


class EmotionAnalysis(BaseModel):
    """Analyse émotionnelle structurée d'un animal."""

    emotion: EmotionLabel = Field(
        description=(
            "L'émotion principale détectée parmi : heureux, calme, joueur, "
            "stresse, anxieux, en_colere, triste, peur, fatigue, neutre."
        )
    )
    intensity: IntensityLabel = Field(
        description="Intensité de l'émotion : faible, moderee ou elevee."
    )
    confidence: float = Field(
        ge=0.0,
        le=1.0,
        description="Niveau de confiance dans la détection (0.0 à 1.0).",
    )
    reasoning: str = Field(
        description="Explication courte (1-2 phrases) du pourquoi de ce choix d'émotion."
    )
    observed_signals: list[str] = Field(
        description=(
            "Liste des signaux observés qui ont conduit à ce diagnostic émotionnel "
            "(ex : 'oreilles plaquées en arrière', 'queue dressée', 'pupilles dilatées'...)."
        )
    )


EMOTION_EMOJI = {
    "heureux": "😊",
    "calme": "😌",
    "joueur": "🤸",
    "stresse": "😰",
    "anxieux": "😟",
    "en_colere": "😡",
    "triste": "😢",
    "peur": "😨",
    "fatigue": "😴",
    "neutre": "😐",
}

EMOTION_COLOR = {
    "heureux": "#22c55e",
    "calme": "#06b6d4",
    "joueur": "#a855f7",
    "stresse": "#f59e0b",
    "anxieux": "#fb923c",
    "en_colere": "#dc2626",
    "triste": "#6366f1",
    "peur": "#7c3aed",
    "fatigue": "#64748b",
    "neutre": "#94a3b8",
}


UrgencyLevel = Literal["vert", "jaune", "orange", "rouge"]

RecommendationLevel = Literal[
    "aucune_action",
    "surveiller",
    "consulter_bientot",
    "urgence_veto",
]


class HealthAssessment(BaseModel):
    """Évaluation santé structurée d'un animal."""

    urgency: UrgencyLevel = Field(
        description=(
            "Niveau d'urgence : 'vert' (RAS), 'jaune' (surveiller 24-48h), "
            "'orange' (consulter sous 24-72h), 'rouge' (URGENCE véto immédiate)."
        )
    )
    recommendation: RecommendationLevel = Field(
        description=(
            "Recommandation : 'aucune_action', 'surveiller', "
            "'consulter_bientot', 'urgence_veto'."
        )
    )
    confidence: float = Field(
        ge=0.0,
        le=1.0,
        description="Confiance dans l'évaluation (0.0 à 1.0).",
    )
    potential_concerns: list[str] = Field(
        description=(
            "Liste de 0 à 3 préoccupations médicales possibles "
            "(ex : 'cystite idiopathique', 'suspicion d'obstruction urinaire'). "
            "Vide si aucune préoccupation. NE PAS poser de diagnostic ferme."
        )
    )
    reasoning: str = Field(
        description="Justification courte (1-2 phrases) du niveau d'urgence choisi."
    )
    when_to_consult: str = Field(
        description=(
            "Indication pratique sur quand consulter "
            "(ex : 'Immédiatement', 'Dans les 24h si ça persiste', 'Pas nécessaire')."
        )
    )


URGENCY_EMOJI = {
    "vert": "🟢",
    "jaune": "🟡",
    "orange": "🟠",
    "rouge": "🔴",
}

URGENCY_COLOR = {
    "vert": "#22c55e",
    "jaune": "#eab308",
    "orange": "#f97316",
    "rouge": "#dc2626",
}

URGENCY_LABEL = {
    "vert": "Rien à signaler",
    "jaune": "À surveiller",
    "orange": "Consulter bientôt",
    "rouge": "URGENCE VÉTÉRINAIRE",
}

RECOMMENDATION_LABEL = {
    "aucune_action": "Aucune action vétérinaire nécessaire",
    "surveiller": "Surveiller 24-48h, consulter si ça empire",
    "consulter_bientot": "Consulter un vétérinaire dans les 24-72h",
    "urgence_veto": "Consulter un vétérinaire IMMÉDIATEMENT",
}


SYSTEM_PROMPT = """Tu es PetCare AI, un assistant bienveillant spécialisé dans le comportement des animaux de compagnie.

Tu aides les propriétaires de chiens et de chats — souvent des nouveaux propriétaires — à comprendre les comportements de leur animal.

RÈGLES IMPORTANTES :
- Tu réponds en français, de façon claire et chaleureuse.
- Tu utilises EXCLUSIVEMENT les informations du CONTEXTE ci-dessous.
- Si le contexte ne contient pas l'information, dis-le honnêtement et conseille de consulter un vétérinaire.
- Si le comportement décrit suggère une urgence médicale, tu le signales clairement en début de réponse.
- Tu ne poses jamais de diagnostic médical définitif — tu orientes vers le vétérinaire quand c'est nécessaire.
- Si une race est précisée, adapte tes conseils aux particularités connues de cette race.

FORMAT DE TA RÉPONSE :
**Ce que ça signifie** : explication du comportement en quelques phrases simples.
**Que faire** : 2 à 4 conseils pratiques et concrets pour le propriétaire.
**À surveiller** (optionnel) : signes d'alarme à observer.

CONTEXTE (extraits de sources vétérinaires) :
{context}
"""

USER_PROMPT = """Espèce de l'animal : {species}{breed_line}

Comportement décrit par le propriétaire : {question}

Analyse ce comportement en respectant le format demandé."""

MULTIMODAL_USER_PROMPT = """Espèce de l'animal : {species}{breed_line}

Description de la photo (par notre module Vision) :
{image_description}

Texte du propriétaire : {question}

Analyse la situation en combinant la description visuelle et le texte du propriétaire.
Respecte le format demandé."""

VIDEO_USER_PROMPT = """Espèce de l'animal : {species}{breed_line}

Analyse temporelle de la vidéo (par notre module Vidéo MediaPipe + Vision) :
{video_narrative}

Texte du propriétaire : {question}

Analyse le comportement en combinant l'évolution temporelle de l'animal et le texte du propriétaire.
Si l'animal est très actif ou très statique, mentionne-le. Respecte le format demandé."""


EMOTION_SYSTEM_PROMPT = """Tu es un expert en comportement animal. Tu analyses l'état émotionnel d'un animal à partir d'observations.

RÈGLES IMPORTANTES :
- Tu te bases EXCLUSIVEMENT sur les signaux et observations fournis.
- Tu utilises le CONTEXTE (sources vétérinaires) pour interpréter correctement les signaux.
- Tu choisis UNE émotion principale parmi : heureux, calme, joueur, stresse, anxieux, en_colere, triste, peur, fatigue, neutre.
- Tu indiques une intensité (faible, moderee, elevee) et une confiance (0-1).
- Tu listes 2 à 5 signaux concrets observés qui justifient ton diagnostic.
- Si tu n'as pas assez d'éléments, choisis "neutre" avec une confiance faible.
- Si une race est précisée, prends en compte ses particularités émotionnelles.

CONTEXTE (extraits de sources vétérinaires) :
{context}
"""

EMOTION_USER_PROMPT = """Espèce de l'animal : {species}{breed_line}

Observations à analyser :
{observations}

Donne ton analyse émotionnelle structurée."""


HEALTH_SYSTEM_PROMPT = """Tu es un vétérinaire prudent et bienveillant. Ton rôle est d'évaluer le niveau d'urgence d'une situation à partir des observations rapportées par le propriétaire d'un animal.

RÈGLES IMPORTANTES :
- Tu te bases EXCLUSIVEMENT sur les observations fournies et le CONTEXTE (sources vétérinaires).
- Tu choisis UN niveau d'urgence parmi : vert, jaune, orange, rouge.
  - vert : comportement normal, aucune préoccupation
  - jaune : signes mineurs à surveiller pendant 24-48h
  - orange : signes préoccupants, consulter sous 24-72h
  - rouge : signes graves, URGENCE véto immédiate
- Tu choisis UNE recommandation correspondante.
- En cas de DOUTE, tu choisis le niveau LE PLUS ÉLEVÉ par précaution (mieux vaut alerter que rater).
- Tu listes 0 à 3 préoccupations médicales PLAUSIBLES sans poser de diagnostic ferme.
- Tu ne dis JAMAIS "l'animal a telle maladie" — tu dis "ces signes pourraient évoquer..."
- Si une race est précisée, prends en compte ses prédispositions connues.

CAS À CLASSER ROUGE (urgence) sans hésiter :
- Convulsions, perte de conscience, paralysie
- Détresse respiratoire, gencives bleues/très pâles
- Chat mâle qui ne peut pas uriner (obstruction urinaire)
- Refus total de manger >24h chez le chat (lipidose)
- Suspicion de dilatation-torsion d'estomac (chien grande race)
- Traumatisme grave (chute, choc voiture, morsure)
- Suspicion d'intoxication (chocolat, lys, antigel, médicaments humains)
- Saignement actif important

CONTEXTE (extraits de sources vétérinaires) :
{context}
"""

HEALTH_USER_PROMPT = """Espèce de l'animal : {species}{breed_line}

Observations à analyser :
{observations}

Donne ton évaluation santé structurée."""


def get_embeddings():
    return HuggingFaceEmbeddings(
        model_name=EMBEDDING_MODEL,
        model_kwargs={"device": "cpu"},
        encode_kwargs={"normalize_embeddings": True},
    )


def get_vector_store():
    return Chroma(
        persist_directory=str(CHROMA_DB_DIR),
        embedding_function=get_embeddings(),
        collection_name="petcare",
    )


def get_llm():
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY manquante. Vérifie ton fichier .env")
    return ChatGroq(
        api_key=GROQ_API_KEY,
        model=LLM_TEXT_MODEL,
        temperature=0.3,
    )


def get_emotion_llm():
    """LLM avec sortie structurée Pydantic pour l'analyse émotionnelle."""
    base = ChatGroq(
        api_key=GROQ_API_KEY,
        model=LLM_TEXT_MODEL,
        temperature=0.1,
    )
    return base.with_structured_output(EmotionAnalysis)


def get_health_llm():
    """LLM avec sortie structurée Pydantic pour l'évaluation santé."""
    base = ChatGroq(
        api_key=GROQ_API_KEY,
        model=LLM_TEXT_MODEL,
        temperature=0.1,
    )
    return base.with_structured_output(HealthAssessment)


def retrieve_context(question: str, species: str, k: int = RETRIEVAL_K):
    vector_store = get_vector_store()
    retriever = vector_store.as_retriever(
        search_kwargs={"k": k, "filter": {"species": species}}
    )
    return retriever.invoke(question)


def format_context(docs) -> str:
    parts = []
    for i, doc in enumerate(docs, 1):
        topic = doc.metadata.get("topic", "inconnu")
        parts.append(f"[Extrait {i} — sujet : {topic}]\n{doc.page_content}")
    return "\n\n".join(parts)


def _breed_line(breed: str | None) -> str:
    if breed and breed.strip():
        return f"\nRace : {breed.strip()}"
    return ""


def analyze_emotion(
    observations: str,
    species: str,
    breed: str | None = None,
) -> dict | None:
    """Renvoie une analyse émotionnelle structurée (dict) ou None si erreur."""
    if not observations.strip():
        return None

    emotion_query = f"émotions état émotionnel signaux {observations}"
    docs = retrieve_context(emotion_query, species, k=RETRIEVAL_K)
    context = format_context(docs)

    prompt = ChatPromptTemplate.from_messages([
        ("system", EMOTION_SYSTEM_PROMPT),
        ("user", EMOTION_USER_PROMPT),
    ])

    chain = prompt | get_emotion_llm()

    try:
        result: EmotionAnalysis = chain.invoke({
            "context": context,
            "species": species,
            "breed_line": _breed_line(breed),
            "observations": observations,
        })
        data = result.model_dump()
        data["emoji"] = EMOTION_EMOJI.get(data["emotion"], "🐾")
        data["color"] = EMOTION_COLOR.get(data["emotion"], "#94a3b8")
        return data
    except Exception:
        return None


def analyze_health(
    observations: str,
    species: str,
    breed: str | None = None,
) -> dict | None:
    """Renvoie une évaluation santé / urgence structurée (dict) ou None si erreur."""
    if not observations.strip():
        return None

    health_query = f"santé maladie urgence symptômes {observations}"
    docs = retrieve_context(health_query, species, k=RETRIEVAL_K)
    context = format_context(docs)

    prompt = ChatPromptTemplate.from_messages([
        ("system", HEALTH_SYSTEM_PROMPT),
        ("user", HEALTH_USER_PROMPT),
    ])

    chain = prompt | get_health_llm()

    try:
        result: HealthAssessment = chain.invoke({
            "context": context,
            "species": species,
            "breed_line": _breed_line(breed),
            "observations": observations,
        })
        data = result.model_dump()
        data["emoji"] = URGENCY_EMOJI.get(data["urgency"], "⚪")
        data["color"] = URGENCY_COLOR.get(data["urgency"], "#94a3b8")
        data["urgency_label"] = URGENCY_LABEL.get(data["urgency"], data["urgency"])
        data["recommendation_label"] = RECOMMENDATION_LABEL.get(
            data["recommendation"], data["recommendation"]
        )
        return data
    except Exception:
        return None


def answer(question: str, species: str, breed: str | None = None) -> dict:
    """Pipeline RAG texte seul + analyse émotionnelle."""
    docs = retrieve_context(question, species)
    context = format_context(docs)

    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("user", USER_PROMPT),
    ])

    chain = prompt | get_llm() | StrOutputParser()

    response = chain.invoke({
        "context": context,
        "species": species,
        "breed_line": _breed_line(breed),
        "question": question,
    })

    emotion = analyze_emotion(question, species, breed)
    health = analyze_health(question, species, breed)

    return {
        "answer": response,
        "emotion": emotion,
        "health": health,
        "image_description": None,
        "sources": _sources_from_docs(docs),
    }


def answer_with_image(
    question: str,
    species: str,
    image_input,
    breed: str | None = None,
    mime_type: str = "image/jpeg",
) -> dict:
    """Pipeline RAG photo + analyse émotionnelle."""
    image_description = describe_image(image_input, species, mime_type=mime_type)

    enriched_query = (
        f"{question}\n\n{image_description}" if question.strip() else image_description
    )
    docs = retrieve_context(enriched_query, species)
    context = format_context(docs)

    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("user", MULTIMODAL_USER_PROMPT),
    ])

    chain = prompt | get_llm() | StrOutputParser()

    response = chain.invoke({
        "context": context,
        "species": species,
        "breed_line": _breed_line(breed),
        "question": question or "(pas de description écrite, voir la photo)",
        "image_description": image_description,
    })

    # Observations pour l'analyse émotionnelle : on combine texte + description Vision
    observations_combined = (
        f"Description de la photo : {image_description}"
        + (f"\nTexte du propriétaire : {question}" if question.strip() else "")
    )
    emotion = analyze_emotion(observations_combined, species, breed)
    health = analyze_health(observations_combined, species, breed)

    return {
        "answer": response,
        "emotion": emotion,
        "health": health,
        "image_description": image_description,
        "sources": _sources_from_docs(docs),
    }


def answer_with_video(
    question: str,
    species: str,
    video_input,
    breed: str | None = None,
) -> dict:
    """Pipeline RAG vidéo + analyse émotionnelle."""
    from src.video import analyze_video

    video_analysis = analyze_video(video_input, species)
    narrative = video_analysis.temporal_narrative

    enriched_query = f"{question}\n\n{narrative}" if question.strip() else narrative
    docs = retrieve_context(enriched_query, species)
    context = format_context(docs)

    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("user", VIDEO_USER_PROMPT),
    ])

    chain = prompt | get_llm() | StrOutputParser()

    response = chain.invoke({
        "context": context,
        "species": species,
        "breed_line": _breed_line(breed),
        "question": question or "(pas de description écrite, voir la vidéo)",
        "video_narrative": narrative,
    })

    observations_combined = (
        f"Analyse temporelle vidéo : {narrative}"
        + (f"\nTexte du propriétaire : {question}" if question.strip() else "")
    )
    emotion = analyze_emotion(observations_combined, species, breed)
    health = analyze_health(observations_combined, species, breed)

    return {
        "answer": response,
        "emotion": emotion,
        "health": health,
        "video_analysis": {
            "duration_s": video_analysis.duration_s,
            "activity_score": video_analysis.activity_score,
            "displacement": video_analysis.displacement,
            "detection_rate": video_analysis.detection_rate,
            "n_frames_extracted": video_analysis.n_frames_extracted,
            "key_frame_descriptions": video_analysis.key_frame_descriptions,
            "temporal_narrative": narrative,
        },
        "sources": _sources_from_docs(docs),
    }


def _sources_from_docs(docs) -> list[dict]:
    return [
        {
            "topic": doc.metadata.get("topic"),
            "species": doc.metadata.get("species"),
            "excerpt": doc.page_content[:200].strip(),
        }
        for doc in docs
    ]


def main():
    test_question = "Mon chien a les oreilles plaquees en arriere, la queue entre les pattes et il tremble"
    test_species = "chien"

    print(f"Espece : {test_species}")
    print(f"Question : {test_question}")
    print("\n--- Analyse en cours ---\n")

    result = answer(test_question, test_species)

    print("REPONSE COMPORTEMENT :\n")
    print(result["answer"])

    if result.get("emotion"):
        e = result["emotion"]
        print("\n" + "=" * 60)
        print("EMOTION DETECTEE :")
        print("=" * 60)
        print(f"  Emotion    : {e['emotion']} {e['emoji']}")
        print(f"  Intensite  : {e['intensity']}")
        print(f"  Confiance  : {e['confidence']:.0%}")
        print(f"  Raison     : {e['reasoning']}")
        print(f"  Signaux observes :")
        for s in e['observed_signals']:
            print(f"    - {s}")


if __name__ == "__main__":
    main()
