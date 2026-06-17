"""Pipeline d'ingestion RAG.

Charge les sources Markdown, les découpe en chunks, génère les embeddings
avec sentence-transformers (local) et stocke le tout dans ChromaDB.

Usage :
    py -m src.ingest
"""

from pathlib import Path

from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings

from src.config import (
    KNOWLEDGE_BASE_DIR,
    CHROMA_DB_DIR,
    EMBEDDING_MODEL,
    CHUNK_SIZE,
    CHUNK_OVERLAP,
)


def load_documents():
    """Charge tous les fichiers .md du dossier knowledge_base/."""
    loader = DirectoryLoader(
        str(KNOWLEDGE_BASE_DIR),
        glob="**/*.md",
        loader_cls=TextLoader,
        loader_kwargs={"encoding": "utf-8"},
        show_progress=True,
    )
    docs = loader.load()

    # Enrichit chaque document avec son espèce et son sujet (depuis le chemin)
    for doc in docs:
        path = Path(doc.metadata["source"])
        doc.metadata["species"] = path.parent.name
        doc.metadata["topic"] = path.stem

    return docs


def split_documents(documents):
    """Découpe les documents en chunks en respectant la structure Markdown."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n## ", "\n### ", "\n\n", "\n", ". ", " ", ""],
    )
    return splitter.split_documents(documents)


def build_vector_store(chunks):
    """Crée (ou recrée) la base vectorielle ChromaDB."""
    embeddings = HuggingFaceEmbeddings(
        model_name=EMBEDDING_MODEL,
        model_kwargs={"device": "cpu"},
        encode_kwargs={"normalize_embeddings": True},
    )

    CHROMA_DB_DIR.mkdir(parents=True, exist_ok=True)

    vector_store = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=str(CHROMA_DB_DIR),
        collection_name="petcare",
    )
    return vector_store


def main():
    print("Chargement des documents...")
    docs = load_documents()
    print(f"  -> {len(docs)} fichiers charges")

    print("Decoupage en chunks...")
    chunks = split_documents(docs)
    print(f"  -> {len(chunks)} chunks generes")

    print("Generation des embeddings et stockage")
    print("  (1ere fois : telechargement du modele ~120 MB, soyez patient)")
    build_vector_store(chunks)
    print("Base vectorielle creee dans data/chroma_db/")


if __name__ == "__main__":
    main()
