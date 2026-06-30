"""Évaluation du retrieval RAG.

Mesure si le système récupère le bon document de la base vétérinaire pour
une question donnée, sur un jeu de questions test étiquetées par espèce et
sujet attendu. On calcule le hit-rate@k et le MRR (mean reciprocal rank).

Usage :
    py evaluate_rag.py
"""

import sys

from src.rag import retrieve_context

sys.stdout.reconfigure(encoding="utf-8")

K = 4

TEST_CASES = [
    ("Combien de fois par jour faut-il nourrir un chiot ?", "chien", "alimentation"),
    ("Quelle quantité de croquettes pour un chien adulte ?", "chien", "alimentation"),
    ("Mon chien grogne sur les autres chiens en promenade", "chien", "comportements_sociaux"),
    ("Pourquoi mon chien aboie quand un autre chien approche ?", "chien", "comportements_sociaux"),
    ("Combien d'heures dort un chien adulte par jour ?", "chien", "sommeil_repos"),
    ("Mon chiot se réveille la nuit, est-ce normal ?", "chien", "sommeil_repos"),
    ("Comment savoir si mon chien est stressé ou anxieux ?", "chien", "emotions"),
    ("Mon chien vomit et refuse de manger depuis ce matin", "chien", "sante"),
    ("À quelle fréquence nourrir un chaton ?", "chat", "alimentation"),
    ("Quelle nourriture convient à un chat adulte ?", "chat", "alimentation"),
    ("Mon chat fait ses besoins à côté de la litière", "chat", "litiere"),
    ("Combien de bacs à litière prévoir pour plusieurs chats ?", "chat", "litiere"),
    ("Comment reconnaître un chat en colère ?", "chat", "emotions"),
    ("Pourquoi mon chat se frotte contre mes jambes ?", "chat", "comportements_sociaux"),
    ("Mon chat mâle n'arrive pas à uriner, est-ce grave ?", "chat", "sante"),
    ("Quels signes indiquent une urgence chez le chat ?", "chat", "sante"),
]


def evaluate():
    hits = 0
    reciprocal_ranks = []

    print(f"\n{'Question':<52}{'Sujet attendu':<22}Résultat")
    print("-" * 88)

    for question, species, expected_topic in TEST_CASES:
        docs = retrieve_context(question, species, k=K)
        topics = [doc.metadata.get("topic") for doc in docs]

        if expected_topic in topics:
            rank = topics.index(expected_topic) + 1
            reciprocal_ranks.append(1 / rank)
            hits += 1
            result = f"OK (rang {rank})"
        else:
            reciprocal_ranks.append(0.0)
            result = "manqué"

        print(f"{question[:50]:<52}{expected_topic:<22}{result}")

    total = len(TEST_CASES)
    hit_rate = hits / total
    mrr = sum(reciprocal_ranks) / total

    print("-" * 88)
    print(f"\n{total} questions testées (retrieval top-{K})")
    print(f"Hit-rate@{K} : {hit_rate:.0%} ({hits}/{total})")
    print(f"MRR : {mrr:.2f}")


if __name__ == "__main__":
    evaluate()
