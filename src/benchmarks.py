"""Benchmarks par race : croise l'historique réel avec des repères de tempérament.

Objectif produit : « normaliser » les comportements en montrant à l'utilisateur
ce qui est courant pour la race de son animal.
"""

from collections import Counter

from sqlalchemy import desc

from src.db import Analysis, SessionLocal, init_db

_BREED_TRAITS: dict[str, list[str]] = {
    "Berger Allemand": [
        "Très attaché à son maître, parfois protecteur.",
        "A besoin d'un travail ou d'occupations : l'ennui le rend agité.",
    ],
    "Berger Australien": [
        "Énergie débordante et grande intelligence.",
        "Peut chercher à « rassembler » personnes et animaux (instinct de berger).",
    ],
    "Border Collie": [
        "Le chien le plus intelligent : il s'ennuie vite sans stimulation.",
        "Hypersensible au mouvement (vélos, voitures, balles).",
    ],
    "Bouledogue Français": [
        "Affectueux et casanier, adore les câlins.",
        "Ronfle et halète : c'est normal, mais surveille les fortes chaleurs.",
    ],
    "Cavalier King Charles": [
        "Très sociable et doux, déteste la solitude.",
        "Cherche le contact et le réconfort en permanence.",
    ],
    "Chihuahua": [
        "Grand caractère dans un petit corps, très attaché à une personne.",
        "Peut être méfiant ou aboyeur face aux inconnus.",
    ],
    "Cocker Spaniel": [
        "Joyeux et affectueux, adore plaire.",
        "Sensible : réagit fort aux changements et aux réprimandes.",
    ],
    "Dogue Allemand": [
        "Géant doux et calme à la maison.",
        "Se prend souvent pour un chien de salon malgré sa taille.",
    ],
    "Golden Retriever": [
        "Gentil, patient, excellent avec les enfants.",
        "Très gourmand et joueur, adore rapporter.",
    ],
    "Husky": [
        "Indépendant et fugueur, suit son instinct.",
        "« Parle » beaucoup (hurlements) et a un énorme besoin de courir.",
    ],
    "Jack Russell": [
        "Boule d'énergie et de malice, infatigable.",
        "Instinct de chasse marqué : creuse et poursuit.",
    ],
    "Labrador": [
        "Sociable, joueur et très gourmand : la gourmandise est normale.",
        "Énergique surtout jeune, adore l'eau et rapporter.",
    ],
    "Malinois": [
        "Ultra énergique et travailleur, a besoin d'un cadre clair.",
        "Très lié à son maître, peu fait pour rester inactif.",
    ],
    "Pitbull": [
        "Affectueux et attaché à sa famille malgré sa réputation.",
        "Énergique et joueur, a besoin de dépense et de cadre.",
    ],
    "Poodle": [
        "Très intelligent et facile à éduquer.",
        "Sensible et proche de l'humain.",
    ],
    "Rottweiler": [
        "Calme et confiant, protecteur de sa famille.",
        "A besoin d'une socialisation précoce et de repères stables.",
    ],
    "Shiba Inu": [
        "Indépendant, propre, presque « félin » dans son attitude.",
        "Têtu et réservé avec les inconnus.",
    ],
    "Yorkshire Terrier": [
        "Vif, courageux et très attaché à son maître.",
        "Peut aboyer facilement pour alerter.",
    ],
    "Bengal": [
        "Très actif et joueur, adore grimper et l'eau.",
        "Intelligent : a besoin de stimulation pour ne pas s'ennuyer.",
    ],
    "Birman": [
        "Doux, calme et très sociable.",
        "Aime la compagnie sans être envahissant.",
    ],
    "British Shorthair": [
        "Tranquille et indépendant, peu démonstratif.",
        "Apprécie la routine et déteste être trop porté.",
    ],
    "Chartreux": [
        "Calme, silencieux et très attaché à son maître.",
        "Bon chasseur malgré son tempérament posé.",
    ],
    "Européen": [
        "Tempérament équilibré, bon chasseur.",
        "S'adapte facilement à la vie de famille.",
    ],
    "Maine Coon": [
        "Géant doux et sociable, « chien-chat ».",
        "Vocal avec de petits trilles, adore suivre son maître.",
    ],
    "Norvégien": [
        "Robuste et calme, bon grimpeur.",
        "Indépendant mais affectueux avec sa famille.",
    ],
    "Persan": [
        "Très calme et casanier, aime la tranquillité.",
        "Peu joueur, apprécie les moments paisibles.",
    ],
    "Ragdoll": [
        "Ultra câlin, se laisse porter comme une poupée de chiffon.",
        "Doux et peu bagarreur, suit son humain partout.",
    ],
    "Russe Bleu": [
        "Réservé et timide avec les inconnus, fidèle à sa famille.",
        "Calme et discret, aime la routine.",
    ],
    "Sacré de Birmanie": [
        "Doux, équilibré et sociable.",
        "Aime la présence humaine sans être collant.",
    ],
    "Savannah": [
        "Très actif, athlétique et curieux.",
        "Adore sauter haut et jouer ; certains aiment l'eau.",
    ],
    "Siamois": [
        "Très bavard et demandeur d'attention.",
        "Hyper attaché à son maître, supporte mal la solitude.",
    ],
    "Sphynx": [
        "Affectueux, collant et cherche la chaleur.",
        "Très sociable et joueur.",
    ],
}

_GENERIC_TRAITS = {
    "chien": [
        "Chaque chien a son tempérament, mais l'éducation et l'environnement comptent beaucoup.",
        "Un besoin d'activité non comblé se traduit souvent par de l'agitation.",
    ],
    "chat": [
        "Chaque chat a sa personnalité ; la stabilité de son environnement le rassure.",
        "Cachettes, griffades et jeu sont des besoins normaux.",
    ],
}

_EMOTION_PHRASE = {
    "heureux": "se montrent heureux",
    "calme": "sont calmes",
    "joueur": "sont joueurs",
    "stresse": "montrent du stress",
    "anxieux": "montrent de l'anxiété",
    "en_colere": "montrent de l'irritation",
    "triste": "semblent tristes",
    "peur": "ont peur",
    "fatigue": "semblent fatigués",
    "neutre": "ont un état neutre",
}


def compute_breed_benchmarks(breed: str, species: str = None) -> dict:
    """Statistiques + repères pour une race donnée."""
    init_db()
    with SessionLocal() as session:
        query = session.query(Analysis).filter(Analysis.breed == breed)
        if species:
            query = query.filter(Analysis.species == species)
        records = query.order_by(desc(Analysis.created_at)).limit(2000).all()
        analyses = [r.to_dict() for r in records]

    emotions = [
        a["emotion_data"]["emotion"]
        for a in analyses
        if a.get("emotion_data")
    ]
    sample = len(emotions)
    distribution = dict(Counter(emotions))
    percentages = {
        emo: round(count / sample * 100) for emo, count in distribution.items()
    } if sample else {}

    traits = _BREED_TRAITS.get(breed)
    if not traits:
        traits = _GENERIC_TRAITS.get(species or "chien", _GENERIC_TRAITS["chien"])

    highlights = []
    if sample >= 3:
        for emo, pct in sorted(percentages.items(), key=lambda x: -x[1])[:2]:
            phrase = _EMOTION_PHRASE.get(emo, f"montrent « {emo} »")
            highlights.append(
                f"{pct} % des {breed} analysés {phrase} — "
                "ton animal n'est pas un cas isolé."
            )
    else:
        highlights.append(
            f"Encore peu d'analyses pour les {breed} ({sample}). "
            "Les repères ci-dessous décrivent les tendances générales de la race."
        )

    return {
        "breed": breed,
        "species": species,
        "sample_size": sample,
        "emotion_distribution": distribution,
        "emotion_percentages": percentages,
        "typical_traits": traits,
        "highlights": highlights,
    }
