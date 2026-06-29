"""Couche base de données SQLite + ORM SQLAlchemy.

Stocke l'historique de toutes les analyses pour permettre :
- de consulter ses analyses passées
- de suivre l'évolution comportementale d'un animal dans le temps
- (futur) de faire des stats / ML sur les comportements
"""

import json
import uuid
from datetime import date, datetime
from pathlib import Path

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Float,
    Integer,
    String,
    Text,
    create_engine,
    desc,
    inspect,
    text,
)
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import declarative_base, sessionmaker

from src.config import DATA_DIR


DB_PATH = DATA_DIR / "petcare.db"
UPLOADS_DIR = DATA_DIR / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

engine = create_engine(f"sqlite:///{DB_PATH}", echo=False)
SessionLocal = sessionmaker(bind=engine, autoflush=False)
Base = declarative_base()


def _compute_age(birthdate: date | None) -> tuple[float | None, str | None]:
    """Calcule l'âge (en années décimales) et un libellé lisible à partir d'une date de naissance."""
    if not birthdate:
        return None, None

    today = date.today()
    months = (today.year - birthdate.year) * 12 + (today.month - birthdate.month)
    if today.day < birthdate.day:
        months -= 1
    months = max(months, 0)

    years, rem = divmod(months, 12)
    if years == 0:
        label = f"{rem} mois"
    elif rem == 0:
        label = f"{years} an" + ("s" if years > 1 else "")
    else:
        label = f"{years} an" + ("s" if years > 1 else "") + f" {rem} mois"

    return round(months / 12, 1), label


class Pet(Base):
    """Une fiche animal complète."""

    __tablename__ = "pets"

    id = Column(Integer, primary_key=True, autoincrement=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
    name = Column(String(100), nullable=False)
    species = Column(String(20), nullable=False)
    breed = Column(String(100), nullable=True)
    sex = Column(String(20), nullable=True)
    birthdate = Column(Date, nullable=True)
    weight_kg = Column(Float, nullable=True)
    sterilized = Column(Boolean, nullable=True)
    allergies = Column(Text, nullable=True)
    medical_notes = Column(Text, nullable=True)
    avatar_path = Column(String(500), nullable=True)

    def to_dict(self) -> dict:
        age_years, age_label = _compute_age(self.birthdate)
        return {
            "id": self.id,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "name": self.name,
            "species": self.species,
            "breed": self.breed,
            "sex": self.sex,
            "birthdate": self.birthdate.isoformat() if self.birthdate else None,
            "weight_kg": self.weight_kg,
            "sterilized": self.sterilized,
            "allergies": json.loads(self.allergies) if self.allergies else [],
            "medical_notes": self.medical_notes,
            "avatar_path": self.avatar_path,
            "age_years": age_years,
            "age_label": age_label,
        }


class Analysis(Base):
    """Une analyse effectuée par PetCare AI."""

    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    pet_id = Column(Integer, nullable=True)
    species = Column(String(20), nullable=False)
    breed = Column(String(100), nullable=True)
    pet_name = Column(String(100), nullable=True)
    question = Column(Text, nullable=True)
    image_path = Column(String(500), nullable=True)
    video_path = Column(String(500), nullable=True)
    vision_description = Column(Text, nullable=True)
    video_metrics = Column(Text, nullable=True)
    emotion_data = Column(Text, nullable=True)
    health_data = Column(Text, nullable=True)
    answer = Column(Text, nullable=False)
    sources_used = Column(Text, nullable=False, default="[]")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "created_at": self.created_at,
            "pet_id": self.pet_id,
            "species": self.species,
            "breed": self.breed,
            "pet_name": self.pet_name,
            "question": self.question,
            "image_path": self.image_path,
            "video_path": self.video_path,
            "vision_description": self.vision_description,
            "video_metrics": json.loads(self.video_metrics) if self.video_metrics else None,
            "emotion_data": json.loads(self.emotion_data) if self.emotion_data else None,
            "health_data": json.loads(self.health_data) if self.health_data else None,
            "answer": self.answer,
            "sources_used": json.loads(self.sources_used or "[]"),
        }


class WeightEntry(Base):
    """Une pesée d'un animal, pour suivre l'évolution du poids dans le temps."""

    __tablename__ = "weight_entries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    pet_id = Column(Integer, nullable=False)
    date = Column(Date, nullable=False, default=date.today)
    weight_kg = Column(Float, nullable=False)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "pet_id": self.pet_id,
            "date": self.date.isoformat() if self.date else None,
            "weight_kg": self.weight_kg,
            "note": self.note,
            "created_at": self.created_at,
        }


class Reminder(Base):
    """Un rappel de soin (vaccin, vermifuge, visite véto…) pour un animal."""

    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, autoincrement=True)
    pet_id = Column(Integer, nullable=False)
    title = Column(String(200), nullable=False)
    category = Column(String(30), nullable=False, default="autre")
    due_date = Column(Date, nullable=False)
    notes = Column(Text, nullable=True)
    done = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self) -> dict:
        today = date.today()
        if self.done:
            status = "fait"
            days_until = None
        else:
            days_until = (self.due_date - today).days
            if days_until < 0:
                status = "en_retard"
            elif days_until <= 14:
                status = "bientot"
            else:
                status = "a_venir"
        return {
            "id": self.id,
            "pet_id": self.pet_id,
            "title": self.title,
            "category": self.category,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "notes": self.notes,
            "done": self.done,
            "status": status,
            "days_until": days_until,
            "created_at": self.created_at,
        }


def _migrate_add_missing_columns():
    """Ajoute les colonnes manquantes aux tables existantes (mini-migration)."""
    inspector = inspect(engine)
    if "analyses" not in inspector.get_table_names():
        return

    existing_cols = {col["name"] for col in inspector.get_columns("analyses")}
    columns_to_add = {
        "video_path": "VARCHAR(500)",
        "video_metrics": "TEXT",
        "breed": "VARCHAR(100)",
        "emotion_data": "TEXT",
        "health_data": "TEXT",
        "pet_id": "INTEGER",
    }

    with engine.begin() as conn:
        for col_name, col_type in columns_to_add.items():
            if col_name not in existing_cols:
                try:
                    conn.execute(text(f"ALTER TABLE analyses ADD COLUMN {col_name} {col_type}"))
                except OperationalError:
                    pass


def init_db():
    """Crée les tables si elles n'existent pas. À appeler au démarrage."""
    Base.metadata.create_all(bind=engine)
    _migrate_add_missing_columns()


def save_uploaded_image(image_bytes: bytes, original_filename: str = "image.jpg") -> str:
    """Sauvegarde une image uploadée sur disque avec un nom unique.

    Returns:
        Chemin relatif (str) vers le fichier sauvegardé.
    """
    suffix = Path(original_filename).suffix or ".jpg"
    if suffix.lower() not in {".jpg", ".jpeg", ".png", ".webp"}:
        suffix = ".jpg"

    filename = f"{uuid.uuid4().hex}{suffix}"
    path = UPLOADS_DIR / filename
    path.write_bytes(image_bytes)
    return str(path)


def save_uploaded_video(video_bytes: bytes, original_filename: str = "video.mp4") -> str:
    """Sauvegarde une vidéo uploadée sur disque avec un nom unique."""
    suffix = Path(original_filename).suffix or ".mp4"
    if suffix.lower() not in {".mp4", ".mov", ".avi", ".mkv", ".webm"}:
        suffix = ".mp4"

    filename = f"{uuid.uuid4().hex}{suffix}"
    path = UPLOADS_DIR / filename
    path.write_bytes(video_bytes)
    return str(path)


def save_analysis(
    species: str,
    answer: str,
    sources_used: list,
    question: str = None,
    breed: str = None,
    pet_name: str = None,
    pet_id: int = None,
    image_path: str = None,
    video_path: str = None,
    vision_description: str = None,
    video_metrics: dict = None,
    emotion_data: dict = None,
    health_data: dict = None,
) -> int:
    """Sauvegarde une analyse en base. Retourne l'id créé."""
    init_db()

    with SessionLocal() as session:
        record = Analysis(
            species=species,
            breed=breed,
            pet_name=pet_name,
            pet_id=pet_id,
            question=question,
            image_path=image_path,
            video_path=video_path,
            vision_description=vision_description,
            video_metrics=json.dumps(video_metrics, ensure_ascii=False) if video_metrics else None,
            emotion_data=json.dumps(emotion_data, ensure_ascii=False) if emotion_data else None,
            health_data=json.dumps(health_data, ensure_ascii=False) if health_data else None,
            answer=answer,
            sources_used=json.dumps(sources_used, ensure_ascii=False),
        )
        session.add(record)
        session.commit()
        return record.id


def get_history(
    species: str = None,
    pet_name: str = None,
    limit: int = 50,
) -> list[dict]:
    """Récupère l'historique des analyses, plus récentes en premier."""
    init_db()

    with SessionLocal() as session:
        query = session.query(Analysis)
        if species:
            query = query.filter(Analysis.species == species)
        if pet_name:
            query = query.filter(Analysis.pet_name == pet_name)
        records = query.order_by(desc(Analysis.created_at)).limit(limit).all()
        return [r.to_dict() for r in records]


def get_pet_names() -> list[str]:
    """Liste des noms d'animaux enregistrés (pour le filtre dans l'UI)."""
    init_db()
    with SessionLocal() as session:
        rows = (
            session.query(Analysis.pet_name)
            .filter(Analysis.pet_name.isnot(None))
            .distinct()
            .all()
        )
        return sorted([r[0] for r in rows if r[0]])


def delete_analysis(analysis_id: int) -> bool:
    """Supprime une analyse par son id. Retourne True si supprimé."""
    init_db()
    with SessionLocal() as session:
        record = session.query(Analysis).filter(Analysis.id == analysis_id).first()
        if not record:
            return False
        if record.image_path:
            try:
                Path(record.image_path).unlink(missing_ok=True)
            except OSError:
                pass
        session.delete(record)
        session.commit()
        return True


def get_stats() -> dict:
    """Stats globales pour le dashboard."""
    init_db()
    with SessionLocal() as session:
        total = session.query(Analysis).count()
        chiens = session.query(Analysis).filter(Analysis.species == "chien").count()
        chats = session.query(Analysis).filter(Analysis.species == "chat").count()
        with_photos = (
            session.query(Analysis).filter(Analysis.image_path.isnot(None)).count()
        )
        return {
            "total": total,
            "chiens": chiens,
            "chats": chats,
            "with_photos": with_photos,
        }


_WEEKDAYS_FR = [
    "lundi", "mardi", "mercredi", "jeudi",
    "vendredi", "samedi", "dimanche",
]
_DAYPART_LABEL = {
    "matin": "en matinée",
    "aprem": "l'après-midi",
    "soir": "en soirée",
    "nuit": "en pleine nuit",
}
_NEGATIVE_EMOTIONS = {"stresse", "anxieux", "en_colere", "triste", "peur"}
_POSITIVE_EMOTIONS = {"heureux", "calme", "joueur"}


def _daypart(hour: int) -> str:
    if 5 <= hour < 12:
        return "matin"
    if 12 <= hour < 18:
        return "aprem"
    if 18 <= hour < 23:
        return "soir"
    return "nuit"


def compute_insights(pet_name: str = None) -> dict:
    """Analyse l'historique pour en dégager tendances et insights (rule-based)."""
    from collections import Counter

    init_db()
    today = datetime.utcnow()

    with SessionLocal() as session:
        query = session.query(Analysis)
        if pet_name:
            query = query.filter(Analysis.pet_name == pet_name)
        records = (
            query.order_by(desc(Analysis.created_at)).limit(2000).all()
        )
        analyses = [r.to_dict() for r in records]

    def same_month(dt, year, month):
        return dt and dt.year == year and dt.month == month

    prev_year, prev_month = (
        (today.year - 1, 12) if today.month == 1 else (today.year, today.month - 1)
    )
    this_month = sum(
        1 for a in analyses if same_month(a["created_at"], today.year, today.month)
    )
    last_month = sum(
        1 for a in analyses if same_month(a["created_at"], prev_year, prev_month)
    )
    trend_pct = (
        round((this_month - last_month) / last_month * 100)
        if last_month
        else None
    )

    months = []
    y, m = today.year, today.month
    for _ in range(6):
        months.append((y, m))
        y, m = (y - 1, 12) if m == 1 else (y, m - 1)
    months.reverse()
    monthly_counts = [
        {
            "month": f"{yy:04d}-{mm:02d}",
            "count": sum(
                1 for a in analyses if same_month(a["created_at"], yy, mm)
            ),
        }
        for (yy, mm) in months
    ]

    emotions = [
        a["emotion_data"]["emotion"]
        for a in analyses
        if a.get("emotion_data")
    ]
    emotion_distribution = dict(Counter(emotions))
    top_emotion, top_emotion_count = (None, 0)
    if emotions:
        top_emotion, top_emotion_count = Counter(emotions).most_common(1)[0]

    anxiety = [
        a
        for a in analyses
        if a.get("emotion_data")
        and a["emotion_data"]["emotion"] in {"anxieux", "stresse"}
        and same_month(a["created_at"], today.year, today.month)
    ]
    pattern = Counter(
        (a["created_at"].weekday(), _daypart(a["created_at"].hour))
        for a in anxiety
        if a["created_at"]
    )

    health_alerts = sum(
        1
        for a in analyses
        if a.get("health_data")
        and a["health_data"].get("urgency") in {"orange", "rouge"}
        and same_month(a["created_at"], today.year, today.month)
    )

    positive = sum(1 for e in emotions if e in _POSITIVE_EMOTIONS)
    positive_pct = round(positive / len(emotions) * 100) if emotions else None

    highlights = []

    if health_alerts > 0:
        highlights.append({
            "type": "health",
            "tone": "warning",
            "text": (
                f"{health_alerts} alerte(s) santé importante(s) ce mois-ci — "
                "pense à consulter un vétérinaire."
            ),
        })

    if len(anxiety) >= 2:
        if pattern:
            (weekday, part), _ = pattern.most_common(1)[0]
            text = (
                f"{len(anxiety)} signes de stress ou d'anxiété ce mois-ci, "
                f"surtout le {_WEEKDAYS_FR[weekday]} {_DAYPART_LABEL[part]}."
            )
        else:
            text = (
                f"{len(anxiety)} signes de stress ou d'anxiété ce mois-ci."
            )
        highlights.append({"type": "anxiety", "tone": "warning", "text": text})

    if trend_pct is not None and abs(trend_pct) >= 10:
        sens = "plus" if trend_pct > 0 else "moins"
        highlights.append({
            "type": "trend",
            "tone": "neutral",
            "text": (
                f"{abs(trend_pct)} % d'analyses en {sens} que le mois dernier "
                f"({this_month} ce mois-ci)."
            ),
        })

    if top_emotion:
        highlights.append({
            "type": "emotion",
            "tone": "neutral",
            "text": (
                f"L'état le plus souvent détecté est « {top_emotion} » "
                f"({top_emotion_count} fois)."
            ),
        })

    if positive_pct is not None and positive_pct >= 60:
        highlights.append({
            "type": "positive",
            "tone": "positive",
            "text": (
                f"Bonne nouvelle : {positive_pct} % des analyses montrent "
                "un état serein."
            ),
        })

    return {
        "total": len(analyses),
        "this_month": this_month,
        "last_month": last_month,
        "trend_pct": trend_pct,
        "top_emotion": top_emotion,
        "top_emotion_count": top_emotion_count,
        "emotion_distribution": emotion_distribution,
        "monthly_counts": monthly_counts,
        "highlights": highlights,
    }


def create_pet(
    name: str,
    species: str,
    breed: str = None,
    sex: str = None,
    birthdate: date = None,
    weight_kg: float = None,
    sterilized: bool = None,
    allergies: list[str] = None,
    medical_notes: str = None,
    avatar_path: str = None,
) -> dict:
    """Crée une fiche animal. Retourne la fiche complète."""
    init_db()
    with SessionLocal() as session:
        pet = Pet(
            name=name,
            species=species,
            breed=breed,
            sex=sex,
            birthdate=birthdate,
            weight_kg=weight_kg,
            sterilized=sterilized,
            allergies=json.dumps(allergies, ensure_ascii=False) if allergies else None,
            medical_notes=medical_notes,
            avatar_path=avatar_path,
        )
        session.add(pet)
        session.commit()
        return pet.to_dict()


def get_pets(species: str = None) -> list[dict]:
    """Liste toutes les fiches animaux (plus récentes en premier)."""
    init_db()
    with SessionLocal() as session:
        query = session.query(Pet)
        if species:
            query = query.filter(Pet.species == species)
        records = query.order_by(desc(Pet.created_at)).all()
        return [p.to_dict() for p in records]


def get_pet(pet_id: int) -> dict | None:
    """Récupère une fiche animal par son id."""
    init_db()
    with SessionLocal() as session:
        pet = session.get(Pet, pet_id)
        return pet.to_dict() if pet else None


def update_pet(pet_id: int, **fields) -> dict | None:
    """Met à jour les champs fournis d'une fiche animal. Retourne la fiche ou None."""
    init_db()
    with SessionLocal() as session:
        pet = session.get(Pet, pet_id)
        if not pet:
            return None
        if "allergies" in fields:
            allergies = fields.pop("allergies")
            pet.allergies = (
                json.dumps(allergies, ensure_ascii=False) if allergies else None
            )
        for key, value in fields.items():
            if hasattr(pet, key):
                setattr(pet, key, value)
        session.commit()
        return pet.to_dict()


def delete_pet(pet_id: int) -> bool:
    """Supprime une fiche animal (et sa photo). Retourne True si supprimé."""
    init_db()
    with SessionLocal() as session:
        pet = session.get(Pet, pet_id)
        if not pet:
            return False
        if pet.avatar_path:
            try:
                Path(pet.avatar_path).unlink(missing_ok=True)
            except OSError:
                pass
        session.query(Analysis).filter(Analysis.pet_id == pet_id).update(
            {Analysis.pet_id: None}
        )
        session.query(WeightEntry).filter(WeightEntry.pet_id == pet_id).delete()
        session.query(Reminder).filter(Reminder.pet_id == pet_id).delete()
        session.delete(pet)
        session.commit()
        return True


def _sync_pet_current_weight(session, pet_id: int) -> None:
    """Aligne le poids courant de la fiche sur la pesée la plus récente."""
    latest = (
        session.query(WeightEntry)
        .filter(WeightEntry.pet_id == pet_id)
        .order_by(desc(WeightEntry.date), desc(WeightEntry.created_at))
        .first()
    )
    pet = session.get(Pet, pet_id)
    if pet and latest:
        pet.weight_kg = latest.weight_kg


def add_weight_entry(
    pet_id: int,
    weight_kg: float,
    entry_date: date = None,
    note: str = None,
) -> dict:
    """Ajoute une pesée et synchronise le poids courant de la fiche."""
    init_db()
    with SessionLocal() as session:
        entry = WeightEntry(
            pet_id=pet_id,
            weight_kg=weight_kg,
            date=entry_date or date.today(),
            note=note,
        )
        session.add(entry)
        session.flush()
        _sync_pet_current_weight(session, pet_id)
        session.commit()
        return entry.to_dict()


def get_weight_entries(pet_id: int) -> list[dict]:
    """Pesées d'un animal, des plus anciennes aux plus récentes."""
    init_db()
    with SessionLocal() as session:
        rows = (
            session.query(WeightEntry)
            .filter(WeightEntry.pet_id == pet_id)
            .order_by(WeightEntry.date.asc(), WeightEntry.created_at.asc())
            .all()
        )
        return [r.to_dict() for r in rows]


def delete_weight_entry(entry_id: int) -> bool:
    """Supprime une pesée. Retourne True si supprimée."""
    init_db()
    with SessionLocal() as session:
        entry = session.get(WeightEntry, entry_id)
        if not entry:
            return False
        pet_id = entry.pet_id
        session.delete(entry)
        session.flush()
        _sync_pet_current_weight(session, pet_id)
        session.commit()
        return True


def compute_weight_insights(entries: list[dict]) -> dict:
    """Analyse rule-based de l'évolution du poids (tendance + anomalies)."""
    from src.config import WEIGHT_ANOMALY_PCT

    count = len(entries)
    if count == 0:
        return {
            "count": 0,
            "latest_kg": None,
            "first_kg": None,
            "change_kg": None,
            "change_pct": None,
            "direction": "insuffisant",
            "anomalies": [],
        }

    first = entries[0]["weight_kg"]
    latest = entries[-1]["weight_kg"]
    change_kg = round(latest - first, 2)
    change_pct = round((change_kg / first) * 100, 1) if first else None

    if count < 2 or change_pct is None:
        direction = "insuffisant"
    elif change_pct >= 2:
        direction = "hausse"
    elif change_pct <= -2:
        direction = "baisse"
    else:
        direction = "stable"

    anomalies = []
    for prev, curr in zip(entries, entries[1:]):
        w0, w1 = prev["weight_kg"], curr["weight_kg"]
        if not w0:
            continue
        pct = (w1 - w0) / w0 * 100
        if abs(pct) >= WEIGHT_ANOMALY_PCT:
            sens = "Prise" if pct > 0 else "Perte"
            anomalies.append(
                f"{sens} de {abs(round(w1 - w0, 2))} kg ({pct:+.0f} %) "
                f"entre le {prev['date']} et le {curr['date']}"
            )

    return {
        "count": count,
        "latest_kg": latest,
        "first_kg": first,
        "change_kg": change_kg,
        "change_pct": change_pct,
        "direction": direction,
        "anomalies": anomalies,
    }


def create_reminder(
    pet_id: int,
    title: str,
    category: str,
    due_date: date,
    notes: str = None,
) -> dict:
    """Crée un rappel de soin."""
    init_db()
    with SessionLocal() as session:
        reminder = Reminder(
            pet_id=pet_id,
            title=title,
            category=category,
            due_date=due_date,
            notes=notes,
        )
        session.add(reminder)
        session.commit()
        return reminder.to_dict()


def get_reminders(pet_id: int = None, include_done: bool = True) -> list[dict]:
    """Liste les rappels, par date d'échéance croissante."""
    init_db()
    with SessionLocal() as session:
        query = session.query(Reminder)
        if pet_id is not None:
            query = query.filter(Reminder.pet_id == pet_id)
        if not include_done:
            query = query.filter(Reminder.done.is_(False))
        records = query.order_by(Reminder.due_date.asc()).all()
        return [r.to_dict() for r in records]


def update_reminder(reminder_id: int, **fields) -> dict | None:
    """Met à jour les champs fournis d'un rappel. Retourne le rappel ou None."""
    init_db()
    with SessionLocal() as session:
        reminder = session.get(Reminder, reminder_id)
        if not reminder:
            return None
        for key, value in fields.items():
            if hasattr(reminder, key):
                setattr(reminder, key, value)
        session.commit()
        return reminder.to_dict()


def delete_reminder(reminder_id: int) -> bool:
    """Supprime un rappel. Retourne True si supprimé."""
    init_db()
    with SessionLocal() as session:
        reminder = session.get(Reminder, reminder_id)
        if not reminder:
            return False
        session.delete(reminder)
        session.commit()
        return True


def build_pet_context(pet: dict) -> str:
    """Transforme une fiche animal en texte injecté dans le prompt du LLM."""
    parts = [f"Nom : {pet['name']}", f"Espèce : {pet['species']}"]
    if pet.get("breed"):
        parts.append(f"Race : {pet['breed']}")
    if pet.get("sex"):
        parts.append(f"Sexe : {pet['sex']}")
    if pet.get("age_label"):
        parts.append(f"Âge : {pet['age_label']}")
    if pet.get("weight_kg"):
        parts.append(f"Poids : {pet['weight_kg']} kg")
    if pet.get("sterilized") is not None:
        parts.append(f"Stérilisé : {'oui' if pet['sterilized'] else 'non'}")
    if pet.get("allergies"):
        parts.append(f"Allergies connues : {', '.join(pet['allergies'])}")
    if pet.get("medical_notes"):
        parts.append(f"Antécédents / notes médicales : {pet['medical_notes']}")
    return "\n".join(parts)
