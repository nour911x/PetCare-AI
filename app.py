"""Interface Streamlit de PetCare AI."""

from pathlib import Path

import streamlit as st

from src.rag import answer, answer_with_image, answer_with_video
from src.config import SUPPORTED_SPECIES
from src.db import (
    save_analysis,
    save_uploaded_image,
    save_uploaded_video,
    get_history,
    get_pet_names,
    get_stats,
    delete_analysis,
    init_db,
)


init_db()

st.set_page_config(
    page_title="PetCare AI",
    page_icon="🐾",
    layout="centered",
)


BREED_SUGGESTIONS = {
    "chien": [
        "", "Berger Allemand", "Berger Australien", "Border Collie",
        "Bouledogue Français", "Cavalier King Charles", "Chihuahua",
        "Cocker Spaniel", "Dogue Allemand", "Golden Retriever", "Husky",
        "Jack Russell", "Labrador", "Malinois", "Pitbull", "Poodle",
        "Rottweiler", "Shiba Inu", "Yorkshire Terrier", "Croisé / Inconnu",
    ],
    "chat": [
        "", "Bengal", "Birman", "British Shorthair", "Chartreux",
        "Européen", "Maine Coon", "Norvégien", "Persan", "Ragdoll",
        "Russe Bleu", "Sacré de Birmanie", "Savannah", "Siamois", "Sphynx",
        "Croisé / Inconnu",
    ],
}


def render_health_card(health: dict):
    """Affiche une carte de santé avec feu tricolore."""
    if not health:
        return

    color = health.get("color", "#94a3b8")
    emoji = health.get("emoji", "⚪")
    urgency_label = health.get("urgency_label", health["urgency"].capitalize())
    reco_label = health.get("recommendation_label", "")
    confidence = health.get("confidence", 0)
    is_emergency = health.get("urgency") == "rouge"

    bg_opacity = "30" if is_emergency else "15"
    text_weight = "800" if is_emergency else "700"
    border_width = "8px" if is_emergency else "6px"

    st.markdown(
        f"""
        <div style="
            border-left: {border_width} solid {color};
            background: linear-gradient(90deg, {color}{bg_opacity} 0%, transparent 100%);
            padding: 18px 22px;
            border-radius: 10px;
            margin: 8px 0 12px 0;
            {"box-shadow: 0 0 20px " + color + "55;" if is_emergency else ""}
        ">
            <div style="display: flex; align-items: center; gap: 14px;">
                <div style="font-size: 42px;">{emoji}</div>
                <div style="flex: 1;">
                    <div style="font-size: 22px; font-weight: {text_weight}; color: {color};">
                        {urgency_label}
                    </div>
                    <div style="color: #475569; font-size: 14px; margin-top: 4px;">
                        {reco_label}
                    </div>
                    <div style="color: #94a3b8; font-size: 12px; margin-top: 2px;">
                        Confiance : <strong>{confidence * 100:.0f}%</strong>
                    </div>
                </div>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    if is_emergency:
        st.error(
            "🚨 **Cette situation nécessite une consultation vétérinaire IMMÉDIATE.** "
            "Si tu n'as pas accès à ton vétérinaire habituel, appelle une clinique "
            "vétérinaire d'urgence (disponibles 24h/24)."
        )

    st.markdown(f"**Analyse :** {health['reasoning']}")

    if health.get("potential_concerns"):
        st.markdown("**Préoccupations médicales possibles :**")
        for c in health["potential_concerns"]:
            st.markdown(f"- {c}")
        st.caption(
            "⚠️ Ce ne sont que des pistes — un diagnostic ne peut être posé que par un vétérinaire."
        )

    if health.get("when_to_consult"):
        st.markdown(f"**Quand consulter :** {health['when_to_consult']}")


def render_emotion_card(emotion: dict):
    """Affiche une carte stylée pour l'émotion détectée."""
    if not emotion:
        return

    color = emotion.get("color", "#94a3b8")
    emoji = emotion.get("emoji", "🐾")
    name = emotion["emotion"].replace("_", " ").capitalize()
    intensity = emotion["intensity"].capitalize()
    confidence = emotion["confidence"]

    st.markdown(
        f"""
        <div style="
            border-left: 6px solid {color};
            background: linear-gradient(90deg, {color}15 0%, transparent 100%);
            padding: 16px 20px;
            border-radius: 8px;
            margin: 8px 0 16px 0;
        ">
            <div style="display: flex; align-items: center; gap: 12px;">
                <div style="font-size: 38px;">{emoji}</div>
                <div>
                    <div style="font-size: 22px; font-weight: 700; color: {color};">
                        {name}
                    </div>
                    <div style="color: #64748b; font-size: 13px;">
                        Intensité : <strong>{intensity}</strong>
                        &nbsp;·&nbsp;
                        Confiance : <strong>{confidence * 100:.0f}%</strong>
                    </div>
                </div>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    st.markdown(f"**Pourquoi :** {emotion['reasoning']}")

    if emotion.get("observed_signals"):
        st.markdown("**Signaux observés :**")
        for sig in emotion["observed_signals"]:
            st.markdown(f"- {sig}")


st.sidebar.title("🐾 PetCare AI")
st.sidebar.caption("Comprends ton animal, prends soin de lui.")

page = st.sidebar.radio(
    "Navigation",
    options=["🔍 Nouvelle analyse", "📚 Historique", "📊 Statistiques"],
    label_visibility="collapsed",
)

st.sidebar.divider()
st.sidebar.caption(
    "PetCare AI est un assistant informatif. "
    "Pour toute urgence, consulte un vétérinaire."
)


def render_analysis_page():
    st.title("🔍 Nouvelle analyse")
    st.caption("Décris le comportement, envoie une photo OU une courte vidéo.")
    st.divider()

    col1, col2 = st.columns([1, 1])
    with col1:
        species = st.radio(
            "Espèce",
            options=SUPPORTED_SPECIES,
            format_func=lambda s: {"chien": "🐕 Chien", "chat": "🐈 Chat"}.get(s, s),
            horizontal=True,
        )
    with col2:
        pet_name = st.text_input(
            "Nom de l'animal (optionnel)",
            placeholder="Ex : Milou",
        )

    breed = st.selectbox(
        "Race de l'animal (optionnel)",
        options=BREED_SUGGESTIONS[species],
        index=0,
        help="Précise la race pour des conseils plus adaptés. Laisse vide si tu ne sais pas.",
    )

    question = st.text_area(
        "Description du comportement",
        placeholder="Ex : Mon chat reste devant sa litière sans rien faire depuis ce matin...",
        height=110,
    )

    media_type = st.radio(
        "Type de média (optionnel)",
        options=["Aucun", "Photo", "Vidéo (max 20s)"],
        horizontal=True,
    )

    uploaded_image = None
    uploaded_video = None

    if media_type == "Photo":
        uploaded_image = st.file_uploader(
            "Photo de l'animal",
            type=["jpg", "jpeg", "png", "webp"],
        )
        if uploaded_image is not None:
            st.image(uploaded_image, caption="Photo à analyser", use_container_width=True)
    elif media_type == "Vidéo (max 20s)":
        uploaded_video = st.file_uploader(
            "Vidéo courte de l'animal",
            type=["mp4", "mov", "avi", "mkv", "webm"],
        )
        if uploaded_video is not None:
            st.video(uploaded_video)

    analyze = st.button(
        "🔍 Analyser le comportement",
        type="primary",
        use_container_width=True,
    )

    if not analyze:
        return

    has_text = bool(question.strip())
    has_image = uploaded_image is not None
    has_video = uploaded_video is not None

    if not has_text and not has_image and not has_video:
        st.warning("⚠️ Décris d'abord le comportement, ou envoie une photo / vidéo.")
        return

    breed_value = breed.strip() if breed else None

    try:
        result = None
        image_path = None
        video_path = None
        video_metrics = None

        if has_video:
            with st.spinner("Analyse vidéo en cours (MediaPipe + Vision + RAG + Émotion)..."):
                video_bytes = uploaded_video.getvalue()
                video_path = save_uploaded_video(video_bytes, uploaded_video.name)
                result = answer_with_video(
                    question=question,
                    species=species,
                    video_input=video_bytes,
                    breed=breed_value,
                )
                va = result["video_analysis"]
                video_metrics = {
                    "duration_s": va["duration_s"],
                    "activity_score": va["activity_score"],
                    "displacement": va["displacement"],
                    "detection_rate": va["detection_rate"],
                    "n_frames_extracted": va["n_frames_extracted"],
                }
        elif has_image:
            with st.spinner("Analyse photo en cours (Vision + RAG + Émotion)..."):
                image_bytes = uploaded_image.getvalue()
                mime_type = uploaded_image.type or "image/jpeg"
                image_path = save_uploaded_image(image_bytes, uploaded_image.name)
                result = answer_with_image(
                    question=question,
                    species=species,
                    image_input=image_bytes,
                    breed=breed_value,
                    mime_type=mime_type,
                )
        else:
            with st.spinner("Analyse en cours (RAG + Émotion)..."):
                result = answer(question, species, breed=breed_value)

        analysis_id = save_analysis(
            species=species,
            breed=breed_value,
            pet_name=pet_name.strip() or None,
            question=question.strip() or None,
            image_path=image_path,
            video_path=video_path,
            vision_description=result.get("image_description"),
            video_metrics=video_metrics,
            emotion_data=result.get("emotion"),
            health_data=result.get("health"),
            answer=result["answer"],
            sources_used=result["sources"],
        )
    except Exception as e:
        st.error(f"❌ Une erreur est survenue : {e}")
        return

    st.success(f"✅ Analyse sauvegardée (#{analysis_id})")

    # SANTÉ / URGENCE (tout en haut — priorité absolue)
    if result.get("health"):
        st.divider()
        st.markdown("### 🏥 Évaluation santé")
        render_health_card(result["health"])

    # ÉMOTION
    if result.get("emotion"):
        st.divider()
        st.markdown("### 🎭 État émotionnel détecté")
        render_emotion_card(result["emotion"])

    # Analyse vidéo
    if result.get("video_analysis"):
        va = result["video_analysis"]
        st.divider()
        st.markdown("### 🎬 Analyse vidéo")

        m1, m2, m3, m4 = st.columns(4)
        m1.metric("⏱️ Durée", f"{va['duration_s']:.1f}s")
        m2.metric("🎯 Détection", f"{va['detection_rate']*100:.0f}%")
        m3.metric("⚡ Activité", f"{va['activity_score']*100:.0f}%")
        m4.metric("📐 Déplacement", f"{va['displacement']:.2f}")

        with st.expander("👁️ Descriptions des frames clés (MediaPipe + Vision)"):
            labels = ["🟢 Début", "🟡 Milieu", "🔴 Fin"]
            for i, desc in enumerate(va["key_frame_descriptions"]):
                label = labels[i] if i < len(labels) else f"Moment {i+1}"
                st.markdown(f"**{label}**")
                st.markdown(f"> {desc}")
                st.markdown("")

    # Photo Vision
    if result.get("image_description"):
        st.divider()
        with st.expander("👁️ Ce que voit le module Vision", expanded=False):
            st.markdown(result["image_description"])

    # Analyse comportementale
    st.divider()
    st.markdown("### 💬 Analyse comportementale")
    st.markdown(result["answer"])

    with st.expander(f"📚 Sources utilisées ({len(result['sources'])} extraits)"):
        for i, src in enumerate(result["sources"], 1):
            st.markdown(
                f"**{i}. {src['species'].capitalize()} — {src['topic'].replace('_', ' ')}**"
            )
            st.markdown(f"> {src['excerpt']}...")
            st.markdown("")


def render_history_page():
    st.title("📚 Historique des analyses")
    st.caption("Consulte toutes tes analyses passées.")
    st.divider()

    col1, col2 = st.columns(2)
    with col1:
        filter_species = st.selectbox(
            "Filtrer par espèce",
            options=["Toutes"] + SUPPORTED_SPECIES,
            format_func=lambda s: {
                "Toutes": "Toutes",
                "chien": "🐕 Chien",
                "chat": "🐈 Chat",
            }.get(s, s),
        )
    with col2:
        pets = get_pet_names()
        filter_pet = st.selectbox(
            "Filtrer par animal",
            options=["Tous"] + pets,
        )

    species_arg = None if filter_species == "Toutes" else filter_species
    pet_arg = None if filter_pet == "Tous" else filter_pet

    analyses = get_history(species=species_arg, pet_name=pet_arg, limit=100)

    if not analyses:
        st.info("Aucune analyse pour le moment. Va sur **🔍 Nouvelle analyse**.")
        return

    st.caption(f"{len(analyses)} analyse(s) trouvée(s)")
    st.divider()

    for a in analyses:
        species_emoji = "🐕" if a["species"] == "chien" else "🐈"
        when = a["created_at"].strftime("%d/%m/%Y à %H:%M") if a["created_at"] else "?"
        pet_label = f" — **{a['pet_name']}**" if a["pet_name"] else ""
        breed_label = f" ({a['breed']})" if a.get("breed") else ""

        media_icon = ""
        if a.get("video_path"):
            media_icon = " 🎬"
        elif a.get("image_path"):
            media_icon = " 📷"

        emotion_label = ""
        if a.get("emotion_data"):
            emotion_label = f" — {a['emotion_data'].get('emoji', '')} {a['emotion_data']['emotion']}"

        health_label = ""
        if a.get("health_data"):
            health_label = f" {a['health_data'].get('emoji', '')}"

        header = f"{species_emoji}{health_label}{media_icon} {when}{pet_label}{breed_label}{emotion_label}"

        with st.expander(header):
            if a.get("video_path") and Path(a["video_path"]).exists():
                st.video(a["video_path"])
                if a.get("video_metrics"):
                    vm = a["video_metrics"]
                    m1, m2, m3 = st.columns(3)
                    m1.metric("Durée", f"{vm.get('duration_s', 0):.1f}s")
                    m2.metric("Activité", f"{vm.get('activity_score', 0)*100:.0f}%")
                    m3.metric("Détection", f"{vm.get('detection_rate', 0)*100:.0f}%")
            elif a.get("image_path") and Path(a["image_path"]).exists():
                st.image(a["image_path"], use_container_width=True)

            if a.get("health_data"):
                render_health_card(a["health_data"])

            if a.get("emotion_data"):
                render_emotion_card(a["emotion_data"])

            if a["question"]:
                st.markdown("**Description :**")
                st.markdown(f"> {a['question']}")

            if a["vision_description"]:
                with st.expander("👁️ Description Vision"):
                    st.markdown(a["vision_description"])

            st.markdown("**Analyse :**")
            st.markdown(a["answer"])

            if a["sources_used"]:
                with st.expander(f"📚 Sources ({len(a['sources_used'])})"):
                    for i, src in enumerate(a["sources_used"], 1):
                        st.markdown(
                            f"**{i}. {src['species'].capitalize()} — "
                            f"{src['topic'].replace('_', ' ')}**"
                        )
                        st.markdown(f"> {src['excerpt']}...")

            if st.button(
                "🗑️ Supprimer cette analyse",
                key=f"del_{a['id']}",
                type="secondary",
            ):
                delete_analysis(a["id"])
                st.rerun()


def render_stats_page():
    st.title("📊 Statistiques")
    st.caption("Vue d'ensemble de l'activité de l'app.")
    st.divider()

    stats = get_stats()

    if stats["total"] == 0:
        st.info("Pas encore d'analyses pour afficher des statistiques.")
        return

    col1, col2, col3, col4 = st.columns(4)
    col1.metric("Total", stats["total"])
    col2.metric("🐕 Chiens", stats["chiens"])
    col3.metric("🐈 Chats", stats["chats"])
    col4.metric("📷 Avec médias", stats["with_photos"])

    st.divider()

    all_analyses = get_history(limit=500)
    if all_analyses:
        import pandas as pd

        df = pd.DataFrame([
            {
                "date": a["created_at"].date() if a["created_at"] else None,
                "species": a["species"],
            }
            for a in all_analyses
        ])
        if not df.empty:
            st.markdown("### 📈 Analyses par jour")
            chart_data = df.groupby(["date", "species"]).size().unstack(fill_value=0)
            st.bar_chart(chart_data)

            st.markdown("### 🐾 Répartition par animal")
            pets_df = pd.DataFrame([
                {"pet_name": a["pet_name"] or "(sans nom)"}
                for a in all_analyses
            ])
            pets_count = pets_df["pet_name"].value_counts()
            st.bar_chart(pets_count)

            emotions = [
                a["emotion_data"]["emotion"]
                for a in all_analyses
                if a.get("emotion_data")
            ]
            if emotions:
                st.markdown("### 🎭 Distribution des émotions détectées")
                em_df = pd.DataFrame({"emotion": emotions})
                em_counts = em_df["emotion"].value_counts()
                st.bar_chart(em_counts)

            urgencies = [
                a["health_data"]["urgency"]
                for a in all_analyses
                if a.get("health_data")
            ]
            if urgencies:
                st.markdown("### 🏥 Niveaux d'urgence détectés")
                u_df = pd.DataFrame({"urgency": urgencies})
                u_counts = u_df["urgency"].value_counts().reindex(
                    ["vert", "jaune", "orange", "rouge"], fill_value=0
                )
                st.bar_chart(u_counts)


if page == "🔍 Nouvelle analyse":
    render_analysis_page()
elif page == "📚 Historique":
    render_history_page()
elif page == "📊 Statistiques":
    render_stats_page()
