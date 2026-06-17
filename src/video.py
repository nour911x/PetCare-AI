"""Module Vidéo : analyse temporelle d'une courte vidéo d'animal.

Pipeline :
1. OpenCV extrait N frames espacées dans la vidéo
2. MediaPipe Object Detection localise l'animal dans chaque frame
3. On calcule des métriques de mouvement (déplacement, activité)
4. Vision LLM décrit 3 frames clés (début, milieu, fin)
5. On construit un récit temporel pour le RAG
"""

from __future__ import annotations

import tempfile
from dataclasses import dataclass
from pathlib import Path

import cv2
import numpy as np

from src.vision import describe_image


# ---------- Constantes ----------
N_FRAMES_FOR_TRACKING = 12       # frames pour tracking MediaPipe
N_KEY_FRAMES_FOR_VISION = 3      # frames clés analysées par Vision LLM
MAX_VIDEO_DURATION_SEC = 20.0    # limite de durée

ANIMAL_CATEGORIES = {"cat", "dog"}


# ---------- Structures ----------
@dataclass
class FrameDetection:
    """Une détection sur une frame."""
    frame_index: int
    timestamp_s: float
    bbox: tuple[float, float, float, float] | None  # (x, y, w, h) normalisés 0-1
    confidence: float | None
    category: str | None


@dataclass
class VideoAnalysis:
    """Résultat de l'analyse vidéo."""
    duration_s: float
    n_frames_extracted: int
    detections: list[FrameDetection]
    activity_score: float          # 0-1, plus haut = plus actif
    displacement: float            # déplacement total normalisé
    detection_rate: float          # % de frames où l'animal est détecté
    key_frame_descriptions: list[str]
    temporal_narrative: str        # récit construit pour le RAG


# ---------- Extraction frames ----------
def extract_evenly_spaced_frames(
    video_path: str | Path,
    n_frames: int,
) -> tuple[list[np.ndarray], float, float]:
    """Extrait N frames espacées uniformément dans la vidéo.

    Returns:
        (liste de frames BGR, durée en secondes, fps)
    """
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise ValueError(f"Impossible de lire la vidéo : {video_path}")

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    duration = total_frames / fps if fps > 0 else 0.0

    if duration > MAX_VIDEO_DURATION_SEC:
        cap.release()
        raise ValueError(
            f"Vidéo trop longue ({duration:.1f}s). "
            f"Maximum autorisé : {MAX_VIDEO_DURATION_SEC}s."
        )

    if total_frames < n_frames:
        n_frames = max(1, total_frames)

    indices = np.linspace(0, total_frames - 1, num=n_frames, dtype=int)
    frames = []
    for idx in indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, int(idx))
        ret, frame = cap.read()
        if ret:
            frames.append(frame)

    cap.release()
    return frames, duration, fps


# ---------- Détection MediaPipe ----------
def _get_mediapipe_detector():
    """Charge le détecteur d'objets MediaPipe (EfficientDet Lite0).

    Le modèle est téléchargé automatiquement à la première utilisation.
    """
    import urllib.request
    from mediapipe.tasks import python as mp_python
    from mediapipe.tasks.python import vision as mp_vision

    from src.config import DATA_DIR

    model_dir = DATA_DIR / "models"
    model_dir.mkdir(parents=True, exist_ok=True)
    model_path = model_dir / "efficientdet_lite0.tflite"

    if not model_path.exists():
        url = (
            "https://storage.googleapis.com/mediapipe-models/object_detector/"
            "efficientdet_lite0/float32/1/efficientdet_lite0.tflite"
        )
        print(f"Telechargement du modele MediaPipe ({url})...")
        urllib.request.urlretrieve(url, model_path)

    base_options = mp_python.BaseOptions(model_asset_path=str(model_path))
    options = mp_vision.ObjectDetectorOptions(
        base_options=base_options,
        score_threshold=0.3,
        max_results=5,
    )
    return mp_vision.ObjectDetector.create_from_options(options)


def detect_animal_in_frames(
    frames: list[np.ndarray],
    fps: float,
    species: str,
) -> list[FrameDetection]:
    """Détecte l'animal dans chaque frame via MediaPipe Object Detection."""
    import mediapipe as mp
    from mediapipe.tasks.python.components.containers import detections as _

    detector = _get_mediapipe_detector()
    expected_category = "dog" if species == "chien" else "cat"
    results = []

    for i, frame_bgr in enumerate(frames):
        # MediaPipe attend du RGB
        frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        h, w = frame_rgb.shape[:2]
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame_rgb)

        detection_result = detector.detect(mp_image)

        # On cherche la meilleure détection de la bonne catégorie
        best = None
        for det in detection_result.detections:
            cat = det.categories[0].category_name.lower() if det.categories else ""
            score = det.categories[0].score if det.categories else 0.0
            if cat == expected_category and (best is None or score > best[1]):
                bbox = det.bounding_box
                # Normalise en 0-1
                norm_bbox = (
                    bbox.origin_x / w,
                    bbox.origin_y / h,
                    bbox.width / w,
                    bbox.height / h,
                )
                best = (norm_bbox, score, cat)

        if best is not None:
            bbox, score, cat = best
            results.append(FrameDetection(
                frame_index=i,
                timestamp_s=i * (1.0 / fps) if fps > 0 else 0.0,
                bbox=bbox,
                confidence=score,
                category=cat,
            ))
        else:
            results.append(FrameDetection(
                frame_index=i,
                timestamp_s=i * (1.0 / fps) if fps > 0 else 0.0,
                bbox=None,
                confidence=None,
                category=None,
            ))

    return results


# ---------- Métriques de mouvement ----------
def compute_motion_metrics(detections: list[FrameDetection]) -> dict:
    """Calcule des métriques quantitatives à partir des détections."""
    valid = [d for d in detections if d.bbox is not None]
    if len(valid) < 2:
        return {
            "displacement": 0.0,
            "activity_score": 0.0,
            "detection_rate": len(valid) / max(1, len(detections)),
        }

    centers = np.array([
        (d.bbox[0] + d.bbox[2] / 2, d.bbox[1] + d.bbox[3] / 2)
        for d in valid
    ])

    # Déplacement total = somme des distances entre frames consécutives
    diffs = np.diff(centers, axis=0)
    distances = np.linalg.norm(diffs, axis=1)
    displacement = float(distances.sum())

    # Score d'activité : variance des positions (normalisée)
    activity_score = float(np.clip(centers.std(axis=0).mean() * 4, 0, 1))

    return {
        "displacement": displacement,
        "activity_score": activity_score,
        "detection_rate": len(valid) / len(detections),
    }


# ---------- Frames clés pour Vision ----------
def pick_key_frames(frames: list[np.ndarray], n: int) -> list[tuple[int, np.ndarray]]:
    """Choisit n frames espacées comme frames clés."""
    if len(frames) == 0:
        return []
    indices = np.linspace(0, len(frames) - 1, num=min(n, len(frames)), dtype=int)
    return [(int(i), frames[int(i)]) for i in indices]


def describe_key_frames(
    key_frames: list[tuple[int, np.ndarray]],
    species: str,
) -> list[str]:
    """Encode chaque frame clé en JPEG bytes et la fait décrire par Vision LLM."""
    descriptions = []
    for _, frame_bgr in key_frames:
        ok, buffer = cv2.imencode(".jpg", frame_bgr)
        if not ok:
            descriptions.append("(Frame illisible)")
            continue
        image_bytes = buffer.tobytes()
        desc = describe_image(image_bytes, species, mime_type="image/jpeg")
        descriptions.append(desc)
    return descriptions


# ---------- Récit temporel ----------
def build_temporal_narrative(
    duration: float,
    metrics: dict,
    key_descriptions: list[str],
    n_key_frames: int,
) -> str:
    """Construit un récit temporel pour le RAG."""
    lines = [
        f"Vidéo de {duration:.1f}s analysée.",
        f"L'animal est détecté dans {metrics['detection_rate'] * 100:.0f}% des frames.",
    ]

    if metrics["activity_score"] > 0.5:
        lines.append("L'animal est très actif (beaucoup de mouvement).")
    elif metrics["activity_score"] > 0.2:
        lines.append("L'animal a une activité modérée.")
    else:
        lines.append("L'animal est peu actif ou statique.")

    lines.append("")
    labels = ["DÉBUT", "MILIEU", "FIN"]
    for i, desc in enumerate(key_descriptions):
        label = labels[i] if i < len(labels) else f"Moment {i + 1}"
        lines.append(f"=== {label} de la vidéo ===")
        lines.append(desc)
        lines.append("")

    return "\n".join(lines).strip()


# ---------- Pipeline complet ----------
def analyze_video(
    video_input,
    species: str,
) -> VideoAnalysis:
    """Pipeline complet d'analyse vidéo.

    Args:
        video_input: bytes (depuis Streamlit) ou chemin vers la vidéo
        species: "chien" ou "chat"
    """
    # Si on reçoit des bytes, écrire dans un fichier temporaire
    if isinstance(video_input, bytes):
        tmp = tempfile.NamedTemporaryFile(suffix=".mp4", delete=False)
        tmp.write(video_input)
        tmp.close()
        video_path = tmp.name
    else:
        video_path = str(video_input)

    try:
        frames, duration, fps = extract_evenly_spaced_frames(
            video_path,
            n_frames=N_FRAMES_FOR_TRACKING,
        )

        detections = detect_animal_in_frames(frames, fps, species)
        metrics = compute_motion_metrics(detections)

        key_frames = pick_key_frames(frames, N_KEY_FRAMES_FOR_VISION)
        key_descriptions = describe_key_frames(key_frames, species)

        narrative = build_temporal_narrative(
            duration=duration,
            metrics=metrics,
            key_descriptions=key_descriptions,
            n_key_frames=len(key_frames),
        )

        return VideoAnalysis(
            duration_s=duration,
            n_frames_extracted=len(frames),
            detections=detections,
            activity_score=metrics["activity_score"],
            displacement=metrics["displacement"],
            detection_rate=metrics["detection_rate"],
            key_frame_descriptions=key_descriptions,
            temporal_narrative=narrative,
        )
    finally:
        if isinstance(video_input, bytes):
            Path(video_path).unlink(missing_ok=True)
