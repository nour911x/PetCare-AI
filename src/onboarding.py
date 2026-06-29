"""Génère un parcours d'accompagnement pour les nouveaux propriétaires.

Le contenu est adapté à l'espèce, à la tranche d'âge et (un peu) à la race.
Logique pure, sans accès base de données.
"""

_BREED_TIPS = {
    "Labrador": [
        "Les Labradors prennent vite du poids : surveille les rations et limite les friandises.",
        "Race énergique : prévois de l'exercice tous les jours.",
    ],
    "Golden Retriever": [
        "Brossage régulier du pelage pour éviter les nœuds.",
        "Besoin de compagnie et d'activité physique.",
    ],
    "Berger Australien": [
        "Très intelligent et énergique : stimulation physique ET mentale indispensable.",
    ],
    "Husky": [
        "Grand besoin de courir : sécurise bien le jardin, c'est un fugueur.",
    ],
    "Bouledogue Français": [
        "Respiration sensible : évite les efforts intenses et les fortes chaleurs.",
    ],
    "Chihuahua": [
        "Petit et fragile : attention aux chutes et au froid (un manteau l'hiver).",
    ],
    "Maine Coon": [
        "Grande taille : prévois un arbre à chat robuste et un brossage hebdomadaire.",
    ],
    "Persan": [
        "Brossage quotidien et nettoyage régulier des yeux.",
    ],
    "Sphynx": [
        "Peau nue : bains réguliers et protection contre le froid et le soleil.",
    ],
    "Siamois": [
        "Très bavard et sociable : il déteste rester seul trop longtemps.",
    ],
}


def _age_category(species: str, age_months: float | None) -> str:
    """Détermine la tranche d'âge à partir de l'âge en mois."""
    if age_months is None:
        return "adulte"
    if species == "chien":
        if age_months < 12:
            return "chiot"
        if age_months >= 84:
            return "senior"
        return "adulte"
    if age_months < 12:
        return "chaton"
    if age_months >= 120:
        return "senior"
    return "adulte"


def _phases(species: str, category: str) -> list[dict]:
    """Renvoie les phases (titre, emoji, étapes) selon espèce + tranche d'âge.

    Chaque étape = (texte, catégorie de rappel ou None).
    """
    chien = species == "chien"
    proprete = (
        ("Sors-le souvent et récompense-le quand il fait dehors.", None)
        if chien
        else ("Place la litière dans un coin calme et accessible.", None)
    )
    activite = (
        ("Apprends-lui à marcher en laisse, petit à petit.", None)
        if chien
        else ("Installe un griffoir et propose des sessions de jeu.", None)
    )

    if category in ("chiot", "chaton"):
        jeune = "chiot" if chien else "chaton"
        return [
            {
                "title": "Semaine 1 — L'arrivée à la maison",
                "emoji": "🏠",
                "steps": [
                    (f"Aménage un coin calme rien que pour ton {jeune}.", None),
                    ("Mets à disposition de l'eau fraîche et sa nourriture.", None),
                    ("Laisse-le explorer à son rythme, sans le forcer.", None),
                    ("Repère le vétérinaire le plus proche de chez toi.", None),
                ],
            },
            {
                "title": "Semaine 1 — Sécuriser la maison",
                "emoji": "🛡️",
                "steps": [
                    ("Range les produits ménagers et médicaments en hauteur.", None),
                    ("Protège les câbles électriques.", None),
                    (
                        "Retire les plantes toxiques"
                        + (" (le lys est mortel pour les chats)." if not chien else "."),
                        None,
                    ),
                ],
            },
            {
                "title": "Semaine 2 — Les premiers soins",
                "emoji": "💉",
                "steps": [
                    ("Prends rendez-vous pour la primovaccination.", "vaccin"),
                    ("Commence le vermifuge.", "vermifuge"),
                    ("Fais identifier ton animal (puce électronique).", "visite"),
                ],
            },
            {
                "title": "Semaine 2-3 — Propreté & routine",
                "emoji": "🧻",
                "steps": [
                    proprete,
                    ("Installe des horaires de repas réguliers.", None),
                    (f"Choisis une alimentation adaptée aux {jeune}s.", None),
                ],
            },
            {
                "title": "Semaine 3-4 — Socialisation & éducation",
                "emoji": "🎓",
                "steps": [
                    ("Habitue-le en douceur à être manipulé (pattes, oreilles).", None),
                    ("Multiplie les rencontres positives (gens, bruits).", None),
                    ("Apprends-lui son nom et le rappel avec des récompenses.", None),
                    activite,
                ],
            },
        ]

    if category == "senior":
        return [
            {
                "title": "L'arrivée d'un animal senior",
                "emoji": "🏠",
                "steps": [
                    ("Offre-lui un couchage moelleux et facile d'accès.", None),
                    ("Laisse-lui le temps de prendre ses repères, en douceur.", None),
                ],
            },
            {
                "title": "Bilan de santé",
                "emoji": "🩺",
                "steps": [
                    ("Fais un bilan de santé senior chez le vétérinaire.", "visite"),
                    ("Vérifie que les vaccins sont à jour.", "vaccin"),
                    ("Refais un vermifuge si nécessaire.", "vermifuge"),
                ],
            },
            {
                "title": "Confort au quotidien",
                "emoji": "🛋️",
                "steps": [
                    ("Facilite l'accès à l'eau, la nourriture et le couchage.", None),
                    ("Passe à une alimentation senior adaptée.", None),
                ],
            },
            {
                "title": "Surveillance",
                "emoji": "🔎",
                "steps": [
                    ("Surveille son poids et son appétit.", None),
                    ("Note tout changement de comportement pour le véto.", None),
                ],
            },
        ]

    return [
        {
            "title": "L'arrivée à la maison",
            "emoji": "🏠",
            "steps": [
                ("Aménage un espace calme à lui.", None),
                ("Laisse-le explorer tranquillement, sois patient·e.", None),
                ("Repère le vétérinaire le plus proche.", None),
            ],
        },
        {
            "title": "Santé",
            "emoji": "💉",
            "steps": [
                ("Fais un bilan de santé chez le vétérinaire.", "visite"),
                ("Vérifie / mets à jour les vaccins.", "vaccin"),
                ("Fais un vermifuge.", "vermifuge"),
                ("Vérifie qu'il est bien identifié (puce).", None),
            ],
        },
        {
            "title": "Routine quotidienne",
            "emoji": "🕐",
            "steps": [
                ("Installe des horaires de repas réguliers.", None),
                proprete,
            ],
        },
        {
            "title": "Créer du lien",
            "emoji": "❤️",
            "steps": [
                ("Renforce la confiance par le jeu et les récompenses.", None),
                activite,
            ],
        },
    ]


def build_onboarding_plan(
    species: str,
    age_months: float | None = None,
    breed: str | None = None,
) -> dict:
    """Construit le parcours complet (phases avec id stable + conseils de race)."""
    category = _age_category(species, age_months)

    phases = []
    for p_index, phase in enumerate(_phases(species, category)):
        steps = [
            {
                "id": f"p{p_index}-s{s_index}",
                "text": text,
                "category": cat,
            }
            for s_index, (text, cat) in enumerate(phase["steps"])
        ]
        phases.append({
            "id": f"p{p_index}",
            "title": phase["title"],
            "emoji": phase["emoji"],
            "steps": steps,
        })

    breed_tips = _BREED_TIPS.get(breed, []) if breed else []

    return {
        "species": species,
        "age_category": category,
        "phases": phases,
        "breed_tips": breed_tips,
    }
