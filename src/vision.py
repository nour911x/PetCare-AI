"""Module Vision : analyse de photos via Groq Llama Vision.

Prend une image (bytes ou path), retourne une description structurée
du comportement et de la posture de l'animal visible.
"""

import base64
from pathlib import Path

from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage

from src.config import GROQ_API_KEY, LLM_VISION_MODEL


VISION_PROMPT = """Tu es un expert en comportement animal. On te montre une photo d'un {species}.

Décris cette image en détail, en te concentrant sur les informations utiles pour analyser le comportement :

1. **Posture du corps** : position générale (debout, couché, recroquevillé, dos arqué, etc.)
2. **Tête et oreilles** : direction du regard, oreilles dressées/aplaties/en arrière
3. **Yeux** : ouverts/mi-clos/fermés, pupilles dilatées, expression
4. **Queue** : haute/basse/entre les pattes/dressée/en mouvement (si visible)
5. **Pelage** : normal/hérissé/aplati
6. **Bouche** : fermée/ouverte/halètement/grognement/bâillement
7. **Action en cours** : ce que l'animal fait (mange, dort, observe, etc.)
8. **Environnement** : indices contextuels (gamelle, litière, fenêtre, jouet, etc.)

Sois factuel et précis. N'invente rien : si une partie n'est pas visible, dis-le. Ne donne PAS d'interprétation ou de diagnostic — uniquement la description visuelle.

Réponds en français en quelques phrases structurées (pas de liste à puces, du texte naturel)."""


def encode_image_to_base64(image_input) -> str:
    """Encode une image en base64.

    Accepte :
    - bytes (depuis Streamlit uploader)
    - str ou Path (chemin vers un fichier)
    """
    if isinstance(image_input, (str, Path)):
        with open(image_input, "rb") as f:
            image_bytes = f.read()
    elif isinstance(image_input, bytes):
        image_bytes = image_input
    else:
        # Streamlit UploadedFile a une méthode read()
        image_bytes = image_input.read()

    return base64.b64encode(image_bytes).decode("utf-8")


def get_vision_llm():
    """LLM multimodal via Groq."""
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY manquante dans .env")
    return ChatGroq(
        api_key=GROQ_API_KEY,
        model=LLM_VISION_MODEL,
        temperature=0.2,
        max_tokens=600,
    )


def describe_image(image_input, species: str, mime_type: str = "image/jpeg") -> str:
    """Renvoie une description détaillée du comportement visible sur la photo.

    Args:
        image_input: bytes, path, ou objet Streamlit UploadedFile
        species: "chien" ou "chat"
        mime_type: type MIME de l'image (image/jpeg, image/png...)

    Returns:
        Description textuelle structurée du comportement et de la posture.
    """
    base64_image = encode_image_to_base64(image_input)

    message = HumanMessage(content=[
        {
            "type": "text",
            "text": VISION_PROMPT.format(species=species),
        },
        {
            "type": "image_url",
            "image_url": {
                "url": f"data:{mime_type};base64,{base64_image}",
            },
        },
    ])

    response = get_vision_llm().invoke([message])
    return response.content.strip()


def main():
    """Test rapide avec une image de test (fournir un chemin)."""
    import sys

    if len(sys.argv) < 3:
        print("Usage : py -m src.vision <chemin_image> <chien|chat>")
        sys.exit(1)

    image_path = sys.argv[1]
    species = sys.argv[2]

    print(f"Image  : {image_path}")
    print(f"Espece : {species}")
    print("\n--- Analyse Vision en cours ---\n")

    description = describe_image(image_path, species)
    print("DESCRIPTION :\n")
    print(description)


if __name__ == "__main__":
    main()
