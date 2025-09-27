from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.responses import FileResponse, HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import os
import shutil
from uuid import uuid4
import asyncio
import requests
from fastapi import Request
from fastapi import Body

from sqlalchemy import Column, Integer, String, ForeignKey, create_engine, Float, UniqueConstraint, Text
from sqlalchemy import text, inspect
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship

# ------------------- Setup -------------------
app = FastAPI(title="Monastery360 Backend with SQLite & file_url")

# Allow frontend dev server to access API
app.add_middleware(
    CORSMiddleware,
    # Allow all origins in local development to support IDE preview proxy ports
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MEDIA_ROOT = os.path.join(BASE_DIR, "media")
os.makedirs(MEDIA_ROOT, exist_ok=True)

# Expose project-level Media directory at /assets (read-only) for exact user images
ASSETS_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "Media"))
if os.path.isdir(ASSETS_DIR):
    app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")

# Expose frontend at /app
DIST_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "frontend-react", "dist"))
FRONTEND_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "frontend"))
if os.path.isdir(DIST_DIR):
    app.mount("/app", StaticFiles(directory=DIST_DIR, html=True), name="app")

    @app.get("/")
    def root_redirect():
        return RedirectResponse(url="/app/index.html")
elif os.path.isdir(FRONTEND_DIR):
    app.mount("/app", StaticFiles(directory=FRONTEND_DIR, html=True), name="app")

    @app.get("/")
    def root_redirect():
        return RedirectResponse(url="/app/index.html")
else:
    @app.get("/")
    def root_redirect():
        return HTMLResponse("<h1>Monastery360 Backend</h1><p>React app not built yet. Run the dev server at http://127.0.0.1:5173 or build frontend-react.</p>")

# Mount design asset folders for React frontend usage
HOME_ASSETS_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "Home", "assets"))
if os.path.isdir(HOME_ASSETS_DIR):
    app.mount("/home-assets", StaticFiles(directory=HOME_ASSETS_DIR), name="home_assets")

MAP_ASSETS_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "Map", "assets"))
if os.path.isdir(MAP_ASSETS_DIR):
    app.mount("/map-assets", StaticFiles(directory=MAP_ASSETS_DIR), name="map_assets")

DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'monastery360.db')}"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

# Fixed origin for route planning: Sikkim Station (adjust as needed)
STATION_LAT = 27.3389
STATION_LNG = 88.6065

# ------------------- Database Models -------------------
class Monastery(Base):
    __tablename__ = "monasteries"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    location = Column(String, nullable=False)
    founded = Column(String, nullable=False)
    media = relationship("Media", back_populates="monastery")
    info = relationship("MonasteryInfo", back_populates="monastery", uselist=False)
    events = relationship("Event", back_populates="monastery")
    archives = relationship("ArchiveItem", back_populates="monastery")
    highlights = relationship("AudioHighlight", back_populates="monastery")

class Media(Base):
    __tablename__ = "media"
    id = Column(Integer, primary_key=True, index=True)
    monastery_id = Column(Integer, ForeignKey("monasteries.id"))
    title = Column(String)
    type = Column(String)
    file_path = Column(String)
    language = Column(String, nullable=True)  # optional media language code, e.g., 'en', 'hi'
    monastery = relationship("Monastery", back_populates="media")

class MonasteryInfo(Base):
    __tablename__ = "monastery_info"
    id = Column(Integer, primary_key=True)
    monastery_id = Column(Integer, ForeignKey("monasteries.id"), unique=True)
    district = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    founding_year = Column(Integer, nullable=True)
    description = Column(String, nullable=True)
    significance = Column(String, nullable=True)
    audio_intro = Column(String, nullable=True)
    audio_duration_min = Column(Integer, nullable=True)
    monastery = relationship("Monastery", back_populates="info")

class Event(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True)
    monastery_id = Column(Integer, ForeignKey("monasteries.id"))
    title = Column(String)
    date = Column(String)
    time = Column(String)
    description = Column(String)
    type = Column(String)  # festival | ritual | ceremony | teaching
    can_book = Column(String, default="false")
    max_participants = Column(Integer, nullable=True)
    monastery = relationship("Monastery", back_populates="events")

class ArchiveItem(Base):
    __tablename__ = "archive_items"
    id = Column(Integer, primary_key=True)
    monastery_id = Column(Integer, ForeignKey("monasteries.id"))
    title = Column(String)
    type = Column(String)  # manuscript | mural | artifact | document
    description = Column(String)
    image_url = Column(String)
    date_created = Column(String, nullable=True)
    digitalized_date = Column(String)
    monastery = relationship("Monastery", back_populates="archives")

class AudioHighlight(Base):
    __tablename__ = "audio_highlights"
    id = Column(Integer, primary_key=True)
    monastery_id = Column(Integer, ForeignKey("monasteries.id"))
    title = Column(String)
    description = Column(String)
    duration_sec = Column(Integer)
    location = Column(String)
    monastery = relationship("Monastery", back_populates="highlights")

class EmbeddingRow(Base):
    __tablename__ = "embeddings"
    id = Column(Integer, primary_key=True)
    doc_type = Column(String)  # monastery|event|archive
    doc_id = Column(Integer)
    title = Column(String)
    content = Column(Text)
    vector = Column(Text)  # JSON string of list[float]

class QaCache(Base):
    __tablename__ = "qa_cache"
    id = Column(Integer, primary_key=True)
    question = Column(Text)
    lang = Column(String, default="en")
    answer = Column(Text)
    citations = Column(Text)  # JSON string
    created_at = Column(String)

Base.metadata.create_all(bind=engine)
# Best-effort migration: add 'language' column to media if it doesn't exist yet (SQLAlchemy 2.x compatible)
try:
    insp = inspect(engine)
    cols = [c['name'] for c in insp.get_columns('media')]
    if 'language' not in cols:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE media ADD COLUMN language VARCHAR"))
            conn.commit()
except Exception:
    # Column may already exist or inspect may fail; ignore
    pass

# ------------------- Pydantic Models -------------------
class MonasteryIn(BaseModel):
    name: str
    location: str
    founded: str

class MonasteryInfoIn(BaseModel):
    district: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    founding_year: Optional[int] = None
    description: Optional[str] = None
    significance: Optional[str] = None
    audio_intro: Optional[str] = None
    audio_duration_min: Optional[int] = None

class EventIn(BaseModel):
    title: str
    date: str
    time: str
    description: str
    type: str
    can_book: bool = False
    max_participants: Optional[int] = None

class ArchiveItemIn(BaseModel):
    title: str
    type: str
    description: str
    image_url: str
    date_created: Optional[str] = None
    digitalized_date: str

class AudioHighlightIn(BaseModel):
    title: str
    description: str
    duration_sec: int
    location: str

class NarrationIn(BaseModel):
    title: Optional[str] = "Audio Narration"
    voice: Optional[str] = "alloy"
    script: Optional[str] = None

class NarrationMultiIn(BaseModel):
    title: Optional[str] = "Audio Narration"
    voice: Optional[str] = None  # if None, we will select based on language
    script: Optional[str] = None  # source script (assumed EN if translation is needed)
    target_lang: str = "en"  # BCP-47 or ISO code like 'en', 'hi', 'bn', 'ne'

# ------------------- Dependency -------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/admin/seed/coordinates")
def admin_seed_coordinates(items: List[Dict]):
    """Upsert coordinates for monasteries matched by name (case-insensitive contains).
    Body example:
    [
      {"name": "Rumtek Monastery", "latitude": 27.3258, "longitude": 88.6012},
      ...
    ]
    """
    db = SessionLocal()
    try:
        updated = []
        for it in items or []:
            name = it.get("name") or ""
            lat = it.get("latitude")
            lng = it.get("longitude")
            if not name or lat is None or lng is None:
                continue
            m = db.query(Monastery).filter(Monastery.name.ilike(f"%{name}%")).first()
            if not m:
                continue
            info = db.query(MonasteryInfo).filter(MonasteryInfo.monastery_id == m.id).first()
            if not info:
                info = MonasteryInfo(monastery_id=m.id, latitude=float(lat), longitude=float(lng))
                db.add(info)
            else:
                info.latitude = float(lat)
                info.longitude = float(lng)
            updated.append({"id": m.id, "name": m.name, "lat": float(lat), "lng": float(lng)})
        db.commit()
        return {"updated": updated}
    finally:
        db.close()

# ------------------- Events Maintenance -------------------
@app.delete("/api/events")
def api_delete_all_events():
    db = SessionLocal()
    try:
        deleted = db.query(Event).delete()
        db.commit()
        return {"deleted": deleted}
    finally:
        db.close()

@app.get("/api/monasteries/{monastery_id}/events")
def api_list_monastery_events(monastery_id: int):
    db = SessionLocal()
    try:
        if not db.query(Monastery).filter(Monastery.id == monastery_id).first():
            raise HTTPException(status_code=404, detail="Monastery not found")
        rows = db.query(Event).filter(Event.monastery_id == monastery_id).all()
        return [
            {
                "id": r.id,
                "title": r.title,
                "date": r.date,
                "time": r.time,
                "description": r.description,
                "type": r.type,
                "can_book": r.can_book == "true",
                "max_participants": r.max_participants,
            }
            for r in rows
        ]
    finally:
        db.close()

@app.post("/api/monasteries/{monastery_id}/events")
def api_create_monastery_event(monastery_id: int, payload: EventIn):
    db = SessionLocal()
    try:
        if not db.query(Monastery).filter(Monastery.id == monastery_id).first():
            raise HTTPException(status_code=404, detail="Monastery not found")
        row = Event(
            monastery_id=monastery_id,
            title=payload.title,
            date=payload.date,
            time=payload.time,
            description=payload.description,
            type=payload.type,
            can_book="true" if payload.can_book else "false",
            max_participants=payload.max_participants,
        )
        db.add(row)
        db.commit()
        db.refresh(row)
        return {"id": row.id}
    finally:
        db.close()

@app.delete("/api/monasteries/{monastery_id}/events")
def api_delete_monastery_events(monastery_id: int):
    db = SessionLocal()
    try:
        if not db.query(Monastery).filter(Monastery.id == monastery_id).first():
            raise HTTPException(status_code=404, detail="Monastery not found")
        deleted = db.query(Event).filter(Event.monastery_id == monastery_id).delete()
        db.commit()
        return {"deleted": deleted}
    finally:
        db.close()

# Optional: seed a few example events
@app.post("/admin/seed/events")
def admin_seed_events():
    db = SessionLocal()
    try:
        examples = [
            {"match": "Tashiding", "title": "Bumchu Festival", "date": "2025-03-13..2025-03-14", "time": "", "description": "Opening of the sacred water vessel (Bumchu)", "type": "festival"},
            {"match": "Rumtek", "title": "Saga Dawa", "date": "2025-06-11", "time": "", "description": "Birth, enlightenment, parinirvana of Buddha", "type": "festival"},
            {"match": "Ralang", "title": "Pang Lhabsol", "date": "2025-09-07", "time": "", "description": "Honoring Mt. Kanchenjunga with Cham dances", "type": "festival"},
        ]
        seeded = []
        for e in examples:
            mon = db.query(Monastery).filter(Monastery.name.ilike(f"%{e['match']}%")) .first()
            if not mon:
                continue
            row = Event(
                monastery_id=mon.id,
                title=e["title"],
                date=e["date"],
                time=e["time"],
                description=e["description"],
                type=e["type"],
                can_book="false",
            )
            db.add(row)
            db.commit()
            db.refresh(row)
            seeded.append({"monastery_id": mon.id, "event_id": row.id})
        return {"seeded": seeded}
    finally:
        db.close()


@app.delete("/api/monasteries/{monastery_id}")
def api_delete_monastery(monastery_id: int):
    """Delete a single monastery and all its child rows and media files."""
    db = SessionLocal()
    try:
        m = db.query(Monastery).filter(Monastery.id == monastery_id).first()
        if not m:
            raise HTTPException(status_code=404, detail="Monastery not found")
        # Delete children first
        db.query(ArchiveItem).filter(ArchiveItem.monastery_id == monastery_id).delete()
        db.query(Event).filter(Event.monastery_id == monastery_id).delete()
        db.query(AudioHighlight).filter(AudioHighlight.monastery_id == monastery_id).delete()
        db.query(MonasteryInfo).filter(MonasteryInfo.monastery_id == monastery_id).delete()
        # Remove media files & rows
        medias = db.query(Media).filter(Media.monastery_id == monastery_id).all()
        for md in medias:
            try:
                if md.file_path:
                    fp = os.path.join(MEDIA_ROOT, md.file_path)
                    if os.path.isfile(fp):
                        os.remove(fp)
            except Exception:
                pass
            db.delete(md)
        db.delete(m)
        db.commit()
        return {"deleted": True, "id": monastery_id}
    finally:
        db.close()

# ------------------- Admin: Import Panoramas -------------------
@app.post("/admin/import/panoramas")
def admin_import_panoramas():
    """Scan project Media folders for panoramic images and attach them as Media(type='panorama').
    Matching logic:
    - For each monastery, try to locate a folder in ASSETS_DIR whose name is a substring match of the monastery name tokens.
    - Inside that folder (recursively), pick files containing '360', 'pano', or 'panorama' in their filename and with an image extension.
    - Copy the first match to MEDIA_ROOT and insert a Media row with type='panorama' if not already present for that monastery.
    Idempotent: if the monastery already has at least one panorama media, it will skip.
    """
    db = SessionLocal()
    try:
        imported = []
        if not os.path.isdir(ASSETS_DIR):
            return {"imported": 0, "note": "Assets folder not found"}

        def name_tokens(n: str):
            n = (n or "").lower().replace("(", " ").replace(")", " ")
            return [t for t in n.replace("monastery", "").replace("gompa", "").split() if t]

        def folder_candidates(mon_name: str):
            toks = name_tokens(mon_name)
            # Heuristic map for known names
            manual = {
                "rumtek": "Rumtek",
                "pemayangtse": "Pemangytse",
                "pemangytse": "Pemangytse",
                "tashiding": "Tashiding",
                "enchey": "Enchey",
                "phodong": "Phodong",
                "ralang": "Ralang",
                "dubdi": "Dubdi",
                "yuksom": "Dubdi",
                "lingdum": "Lingdum",
                "ranka": "Lingdum",
            }
            cands = []
            for t in toks:
                if t in manual:
                    cands.append(manual[t])
                else:
                    cands.append(t.capitalize())
            # De-dup
            seen, uniq = set(), []
            for c in cands:
                if c not in seen:
                    uniq.append(c); seen.add(c)
            return uniq

        IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".avif"}
        KEYWORDS = ("360", "pano", "panorama")

        for m in db.query(Monastery).all():
            # Skip if already has a panorama
            has_pano = any((md.type or "").lower() == "panorama" for md in m.media)
            if has_pano:
                continue

            # Try to find a folder match
            folders = folder_candidates(m.name)
            src_file = None
            for fname in folders:
                cand_dir = os.path.join(ASSETS_DIR, fname)
                if not os.path.isdir(cand_dir):
                    continue
                # walk and find candidate files
                for root, _, files in os.walk(cand_dir):
                    for f in files:
                        ext = os.path.splitext(f)[1].lower()
                        if ext not in IMAGE_EXTS:
                            continue
                        lf = f.lower()
                        if any(k in lf for k in KEYWORDS):
                            src_file = os.path.join(root, f)
                            break
                    if src_file:
                        break
                if src_file:
                    break

            # If not found in a subfolder, try ASSETS_DIR root by filename tokens
            if not src_file:
                toks = name_tokens(m.name)
                try:
                    for f in os.listdir(ASSETS_DIR):
                        path = os.path.join(ASSETS_DIR, f)
                        if not os.path.isfile(path):
                            continue
                        ext = os.path.splitext(f)[1].lower()
                        if ext not in IMAGE_EXTS:
                            continue
                        lf = f.lower()
                        if any(k in lf for k in KEYWORDS) and any(t in lf for t in toks):
                            src_file = path
                            break
                except Exception:
                    pass

            if not src_file:
                continue

            base = f"pano_{m.id}_{os.path.basename(src_file)}"
            dest = os.path.join(MEDIA_ROOT, base)
            try:
                shutil.copyfile(src_file, dest)
                db.add(Media(monastery_id=m.id, title=f"{m.name} Panorama", type="panorama", file_path=base))
                imported.append({"id": m.id, "name": m.name, "file": base})
            except Exception:
                pass

        db.commit()
        return {"imported": len(imported), "items": imported}
    finally:
        db.close()

@app.delete("/admin/monasteries/{monastery_id}/panoramas")
def admin_delete_panoramas(monastery_id: int):
    """Remove all panorama media rows and their files for a monastery."""
    db = SessionLocal()
    try:
        m = db.query(Monastery).filter(Monastery.id == monastery_id).first()
        if not m:
            raise HTTPException(status_code=404, detail="Monastery not found")
        removed = 0
        for md in list(m.media):
            if (md.type or "").lower() == "panorama":
                # remove file
                try:
                    if md.file_path:
                        fp = os.path.join(MEDIA_ROOT, md.file_path)
                        if os.path.isfile(fp):
                            os.remove(fp)
                except Exception:
                    pass
                db.delete(md)
                removed += 1
        db.commit()
        return {"removed": removed}
    finally:
        db.close()

@app.post("/admin/monasteries/{monastery_id}/panorama")
def admin_set_panorama(monastery_id: int, image: UploadFile = File(None), image_url: Optional[str] = Form(None)):
    """Replace panorama for a monastery.
    - If file uploaded via 'image', save it.
    - Else if 'image_url' Form provided (e.g., /assets/... or full path under assets), copy it.
    Removes existing panoramas first, then creates one new entry.
    """
    db = SessionLocal()
    try:
        m = db.query(Monastery).filter(Monastery.id == monastery_id).first()
        if not m:
            raise HTTPException(status_code=404, detail="Monastery not found")

        # Remove old panoramas
        for md in list(m.media):
            if (md.type or "").lower() == "panorama":
                try:
                    if md.file_path:
                        fp = os.path.join(MEDIA_ROOT, md.file_path)
                        if os.path.isfile(fp):
                            os.remove(fp)
                except Exception:
                    pass
                db.delete(md)
        db.commit()

        # Decide source and write new file
        dest_name = None
        if image is not None:
            ext = os.path.splitext(image.filename or "")[1].lower() or ".jpg"
            dest_name = f"pano_{monastery_id}_{uuid4().hex}{ext}"
            dest_path = os.path.join(MEDIA_ROOT, dest_name)
            with open(dest_path, "wb") as f:
                f.write(image.file.read())
        elif image_url:
            # If given an /assets path, translate to filesystem path under ASSETS_DIR
            if image_url.startswith("/assets/"):
                rel = image_url[len("/assets/"):]
                src_path = os.path.join(ASSETS_DIR, *rel.split("/"))
                if not os.path.isfile(src_path):
                    raise HTTPException(status_code=400, detail="image_url not found under assets")
                ext = os.path.splitext(src_path)[1].lower() or ".jpg"
                dest_name = f"pano_{monastery_id}_{uuid4().hex}{ext}"
                dest_path = os.path.join(MEDIA_ROOT, dest_name)
                shutil.copyfile(src_path, dest_path)
            else:
                raise HTTPException(status_code=400, detail="Provide an uploaded file or /assets/... URL")
        else:
            raise HTTPException(status_code=400, detail="Provide an uploaded file or image_url")

        db.add(Media(monastery_id=m.id, title=f"{m.name} Panorama", type="panorama", file_path=dest_name))
        db.commit()
        return {"status": "ok", "file": f"/media/{dest_name}"}
    finally:
        db.close()

# ------------------- Admin: Seed Archives -------------------
@app.post("/admin/seed/archives")
def admin_seed_archives():
    """Seed ArchiveItem entries for select monasteries using curated descriptions.
    This will overwrite existing archive items for the affected monasteries to keep idempotency.
    """
    db = SessionLocal()
    try:
        # Helper: find monastery by name (case-insensitive contains)
        def find_monastery(name_substr: str) -> Optional[Monastery]:
            q = db.query(Monastery).filter(Monastery.name.ilike(f"%{name_substr}%")).first()
            return q

        data = [
            {
                "match": "Rumtek",
                "items": [
                    {"title": "Golden Stupa of the 16th Karmapa", "type": "relic", "description": "Sacred funerary stupa containing relics of the 16th Karmapa."},
                    {"title": "Rare Tibetan manuscripts", "type": "manuscript", "description": "Collections of Kagyu scriptures preserved in the monastery library."},
                    {"title": "Thangkas and ritual objects", "type": "artifact", "description": "Traditional scroll paintings and ritual implements used in ceremonies."},
                ],
            },
            {
                "match": "Pemayangtse",
                "items": [
                    {"title": "Zangdok Palri wooden structure", "type": "artifact", "description": "Seven-tiered hand-carved model depicting Guru Padmasambhava’s celestial abode, crafted over 36 years."},
                    {"title": "Ancient murals and statues", "type": "mural", "description": "Murals and images of tantric deities within shrine halls."},
                    {"title": "Ritual masks and scriptures", "type": "artifact", "description": "Masks used for Cham dances and handwritten Tibetan scriptures."},
                ],
            },
            {
                "match": "Tashiding",
                "items": [
                    {"title": "Bumchu Manuscripts", "type": "manuscript", "description": "Sacred texts associated with the annual Bumchu divination ritual."},
                    {"title": "Thong-Wa-Rang-Dol Chorten", "type": "relic", "description": "Revered stupa believed to cleanse the sins of devotees."},
                    {"title": "Early Buddhist relics", "type": "artifact", "description": "Objects linked to the early spread of Buddhism in Sikkim."},
                ],
            },
            {
                "match": "Lingdum",  # Ranka Monastery
                "items": [
                    {"title": "Colorful murals", "type": "mural", "description": "Murals of Buddhist cosmology and deities adorning the prayer halls."},
                    {"title": "Large Buddha statue", "type": "artifact", "description": "A massive Buddha statue housed in the main prayer hall."},
                    {"title": "Cham ritual instruments and masks", "type": "artifact", "description": "Instruments and masks used during ceremonial Cham dances."},
                ],
            },
        ]

        seeded = []
        for entry in data:
            mon = find_monastery(entry["match"])
            if not mon:
                continue
            # Clear existing archives for idempotency
            db.query(ArchiveItem).filter(ArchiveItem.monastery_id == mon.id).delete()
            # Insert new items
            for it in entry["items"]:
                db.add(ArchiveItem(
                    monastery_id=mon.id,
                    title=it["title"],
                    type=it["type"],
                    description=it["description"],
                    image_url="",
                    digitalized_date="",
                ))
            seeded.append({"id": mon.id, "name": mon.name, "count": len(entry["items"])})
        db.commit()
        return {"seeded": seeded}
    finally:
        db.close()

@app.get("/api/monasteries/{monastery_id}")
def api_get_monastery(monastery_id: int):
    db = SessionLocal()
    try:
        m = db.query(Monastery).filter(Monastery.id == monastery_id).first()
        if not m:
            raise HTTPException(status_code=404, detail="Monastery not found")
        return serialize_monastery(m)
    finally:
        db.close()

# ------------------- Admin: Embeddings Snapshot -------------------
@app.get("/admin/embeddings/export")
def admin_embeddings_export():
    db = SessionLocal()
    try:
        rows = db.query(EmbeddingRow).all()
        import json as _json
        data = [
            {
                "doc_type": r.doc_type,
                "doc_id": r.doc_id,
                "title": r.title,
                "content": r.content,
                "vector": r.vector,
            }
            for r in rows
        ]
        return {"items": data}
    finally:
        db.close()

# ------------------- Monasteries CRUD (Simple API) -------------------

@app.get("/api/monasteries")
def api_list_monasteries():
    db = SessionLocal()
    try:
        items = db.query(Monastery).all()
        # Fallback to asset previews when no media exists
        asset_map = {
            "Rumtek Monastery": ("Rumtek", "Preview.jpg"),
            "Pemayangtse Monastery": ("Pemangytse", "Permangytse-preview.jpg"),
            "Tashiding Monastery": ("Tashiding", "Tashiding-Monastery-Preview.jpg"),
        }
        result = []
        for m in items:
            img = None
            if m.media:
                img = f"/media/{os.path.basename(m.media[0].file_path)}"
            elif m.name in asset_map:
                folder, fname = asset_map[m.name]
                img = f"/assets/{folder}/{fname}"
            # include events for Events page
            evs = [
                {
                    "id": e.id,
                    "title": e.title,
                    "date": e.date,
                    "time": e.time,
                    "description": e.description,
                    "type": e.type,
                }
                for e in m.events
            ]
            result.append({
                "id": m.id,
                "name": m.name,
                "image": img,
                "info": (m.info.description if m.info and m.info.description else None),
                "coordinates": ({
                    "lat": (m.info.latitude if m.info else None),
                    "lng": (m.info.longitude if m.info else None),
                } if m.info else None),
                "events": evs,
            })
        return result
    finally:
        db.close()


class MonasteryCreate(BaseModel):
    name: str
    location: str = "Sikkim"
    founded: str = "Unknown"
    info: Optional[str] = None
    image: Optional[str] = None  # if provided as already-hosted URL or '/media/xxx'


@app.post("/api/monasteries")
def api_create_monastery(payload: MonasteryCreate):
    db = SessionLocal()
    try:
        m = Monastery(name=payload.name, location=payload.location, founded=payload.founded)
        db.add(m)
        db.commit()
        db.refresh(m)

        if payload.info:
            info = MonasteryInfo(monastery_id=m.id, description=payload.info)
            db.add(info)

        if payload.image:
            # Accept a URL or /media/ path; store basename in file_path for consistency
            file_name = os.path.basename(payload.image)
            db.add(Media(monastery_id=m.id, title=f"{payload.name} Image", type="image", file_path=file_name))

        db.commit()
        return {"id": m.id, "name": m.name}
    finally:
        db.close()


@app.delete("/api/monasteries")
def api_delete_all_monasteries():
    db = SessionLocal()
    try:
        # Delete children first to satisfy FKs
        db.query(ArchiveItem).delete()
        db.query(Event).delete()
        db.query(AudioHighlight).delete()
        db.query(MonasteryInfo).delete()
        db.query(Media).delete()
        db.query(Monastery).delete()
        db.commit()
        return {"deleted": True}
    finally:
        db.close()


# ------------------- Seed Endpoint -------------------

SEED_MONASTERIES = [
    {
        "name": "Rumtek Monastery",
        "founded": "18th century",
        "info": "The largest monastery in Sikkim, seat of the Karmapa of the Kagyu sect. Known for its grand architecture and golden stupa.",
    },
    {
        "name": "Pemayangtse Monastery",
        "founded": "17th century",
        "info": "One of the oldest (17th century), belonging to the Nyingma sect. Famous for the ‘Zangdok Palri’ wooden structure.",
    },
    {
        "name": "Tashiding Monastery",
        "founded": "17th century",
        "info": "Sacred monastery, believed to wash away sins if you visit during ‘Bumchu Festival’.",
    },
    {
        "name": "Enchey Monastery",
        "founded": "19th century",
        "info": "Located near Gangtok, dedicated to Guru Padmasambhava. Known for its masked dance festivals.",
    },
    {
        "name": "Phodong Monastery",
        "founded": "18th century",
        "info": "Built in the 18th century, important for Kagyu sect. Famous for annual Cham dances.",
    },
    {
        "name": "Ralang Monastery",
        "founded": "18th century",
        "info": "Near Ravangla, a huge complex and seat of Kagyu tradition. Hosts Pang Lhabsol festival.",
    },
    {
        "name": "Dubdi Monastery (Yuksom)",
        "founded": "1701",
        "info": "The first monastery of Sikkim, built in 1701. Also called ‘Hermit’s Cell’.",
    },
    {
        "name": "Lingdum Monastery (Ranka Monastery)",
        "founded": "Modern",
        "info": "Modern, large and very scenic monastery near Gangtok.",
    },
]


@app.post("/admin/seed/monasteries")
def admin_seed_monasteries():
    db = SessionLocal()
    try:
        # Wipe existing
        db.query(ArchiveItem).delete()
        db.query(Event).delete()
        db.query(AudioHighlight).delete()
        db.query(MonasteryInfo).delete()
        db.query(Media).delete()
        db.query(Monastery).delete()
        db.commit()

        # Insert seed (attach preview images from /assets when available by copying into /media)
        created = []
        asset_map = {
            "Rumtek Monastery": ("Rumtek", "Preview.jpg"),
            "Pemayangtse Monastery": ("Pemangytse", "Permangytse-preview.jpg"),
            "Tashiding Monastery": ("Tashiding", "Tashiding-Monastery-Preview.jpg"),
        }
        for it in SEED_MONASTERIES:
            m = Monastery(name=it["name"], location="Sikkim", founded=it.get("founded") or "Unknown")
            db.add(m)
            db.commit()
            db.refresh(m)
            if it.get("info"):
                db.add(MonasteryInfo(monastery_id=m.id, description=it["info"]))
            # Attach image if we have an asset
            if it["name"] in asset_map:
                folder, fname = asset_map[it["name"]]
                src = os.path.join(ASSETS_DIR, folder, fname)
                if os.path.isfile(src):
                    base = f"{m.id}_{os.path.splitext(fname)[0]}{os.path.splitext(fname)[1]}"
                    dest = os.path.join(MEDIA_ROOT, base)
                    try:
                        shutil.copyfile(src, dest)
                        db.add(Media(monastery_id=m.id, title=f"{m.name} Image", type="image", file_path=base))
                    except Exception:
                        pass
            created.append({"id": m.id, "name": m.name})
        db.commit()
        return {"created": created, "count": len(created)}
    finally:
        db.close()

@app.post("/admin/embeddings/import")
def admin_embeddings_import(payload: Dict = Body(...)):
    db = SessionLocal()
    try:
        items = payload.get("items") or []
        # Clear table then insert
        db.query(EmbeddingRow).delete()
        for it in items:
            row = EmbeddingRow(
                doc_type=it.get("doc_type"),
                doc_id=it.get("doc_id"),
                title=it.get("title"),
                content=it.get("content"),
                vector=it.get("vector"),
            )
            db.add(row)
        db.commit()
        return {"imported": len(items)}
    finally:
        db.close()

# ------------------- RAG QnA and Route Planning -------------------
class QnAIn(BaseModel):
    question: str
    top_k: int = 5
    target_lang: Optional[str] = None  # if provided, translate question/answer

class IngestOut(BaseModel):
    count: int

class RouteIn(BaseModel):
    question: str
    duration_minutes: int = 90
    start_lat: Optional[float] = None
    start_lng: Optional[float] = None
    transport_mode: Optional[str] = "foot"  # foot | bike | car

class RouteStep(BaseModel):
    title: str
    description: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    estimated_minutes: int = 10

class RouteOut(BaseModel):
    steps: List[RouteStep]
    path: Optional[List[Dict[str, float]]] = None  # [{lat, lng}] polyline of the full route if available

@app.post("/ai/ingest", response_model=IngestOut)
def ai_ingest():
    """Build embeddings for Monasteries, Events, Archives into SQLite."""
    db = SessionLocal()
    try:
        # Clear table
        db.query(EmbeddingRow).delete()
        db.commit()

        items: List[Dict] = []
        # Monasteries
        for m in db.query(Monastery).all():
            info = m.info
            text = f"{m.name}. {m.location}. Founded {m.founded}. "
            if info and info.description:
                text += info.description
            items.append({
                "doc_type": "monastery",
                "doc_id": m.id,
                "title": m.name,
                "content": text,
            })
        # Events
        for e in db.query(Event).all():
            mon = db.query(Monastery).filter(Monastery.id == e.monastery_id).first()
            mon_name = mon.name if mon else ""
            text = f"Event: {e.title}. {e.description}. Date {e.date} {e.time}. Monastery {mon_name}."
            items.append({
                "doc_type": "event",
                "doc_id": e.id,
                "title": e.title,
                "content": text,
            })
        # Archives
        for a in db.query(ArchiveItem).all():
            mon = db.query(Monastery).filter(Monastery.id == a.monastery_id).first()
            mon_name = mon.name if mon else ""
            text = f"Archive: {a.title}. {a.description}. Type {a.type}. Monastery {mon_name}."
            items.append({
                "doc_type": "archive",
                "doc_id": a.id,
                "title": a.title,
                "content": text,
            })

        # Compute embeddings if possible
        vectors: Optional[List[List[float]]]= _openai_embed([it["content"] for it in items])
        import json as _json
        for idx, it in enumerate(items):
            vec = vectors[idx] if vectors and idx < len(vectors) else []
            row = EmbeddingRow(
                doc_type=it["doc_type"],
                doc_id=it["doc_id"],
                title=it["title"],
                content=it["content"],
                vector=_json.dumps(vec),
            )
            db.add(row)
        db.commit()
        return {"count": len(items)}
    finally:
        db.close()

@app.post("/ai/qna")
def ai_qna(payload: QnAIn):
    db = SessionLocal()
    try:
        import json as _json
        # Try cache first
        lang = (payload.target_lang or "en").lower()
        cache_row = db.query(QaCache).filter(QaCache.question == payload.question, QaCache.lang == lang).first()
        if cache_row:
            try:
                cits = _json.loads(cache_row.citations) if cache_row.citations else []
            except Exception:
                cits = []
            return {"answer": cache_row.answer, "citations": cits}

        # Translate question to English for retrieval if needed
        retrieval_question = payload.question if lang.startswith("en") else translate_with_openai(payload.question, "en")

        rows = db.query(EmbeddingRow).all()
        if not rows:
            raise HTTPException(status_code=400, detail="No embeddings found. Run /ai/ingest first.")

        # Build query vector if possible
        q_vecs = _openai_embed([retrieval_question])
        q_vec = q_vecs[0] if q_vecs else None

        scored = []
        for r in rows:
            try:
                vec = _json.loads(r.vector) if r.vector else []
            except Exception:
                vec = []
            if q_vec and vec:
                score = _cosine(q_vec, vec)
            else:
                score = _tf_score(retrieval_question, (r.title or "") + "\n" + (r.content or ""))
            scored.append((score, r))
        scored.sort(key=lambda x: x[0], reverse=True)
        top = scored[: max(1, payload.top_k)]

        context_blocks = [f"[{r.doc_type}:{r.doc_id}] {r.title}\n{r.content}" for _, r in top]
        context = "\n\n".join(context_blocks)

        api_key = os.getenv("OPENAI_API_KEY")
        if api_key:
            try:
                resp = requests.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": "gpt-4o-mini",
                        "temperature": 0.2,
                        "messages": [
                            {"role": "system", "content": "You are a helpful assistant for a monastery visitor app. Answer succinctly and cite sources using the [type:id] labels."},
                            {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {retrieval_question}\n\nAnswer with brief bullet points and cite [type:id]."},
                        ],
                    },
                    timeout=60,
                )
                if resp.status_code == 200:
                    data = resp.json()
                    answer_en = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                    answer = answer_en if lang.startswith("en") else translate_with_openai(answer_en, lang)
                    citations = [
                        {"doc_type": r.doc_type, "doc_id": r.doc_id, "title": r.title} for _, r in top
                    ]
                    # Save to cache
                    from datetime import datetime
                    db.add(QaCache(question=payload.question, lang=lang, answer=answer, citations=_json.dumps(citations), created_at=datetime.utcnow().isoformat()))
                    db.commit()
                    return {"answer": answer, "citations": citations}
            except Exception:
                pass
        # Fallback: return top snippets
        snippet_en = "\n\n".join(context_blocks)
        answer = snippet_en if lang.startswith("en") else translate_with_openai(snippet_en, lang)
        citations = [
            {"doc_type": r.doc_type, "doc_id": r.doc_id, "title": r.title} for _, r in top
        ]
        from datetime import datetime
        db.add(QaCache(question=payload.question, lang=lang, answer=answer, citations=_json.dumps(citations), created_at=datetime.utcnow().isoformat()))
        db.commit()
        return {"answer": answer, "citations": citations}
    finally:
        db.close()

@app.post("/ai/route", response_model=RouteOut)
def ai_route(payload: RouteIn):
    """Greedy nearest-neighbor route:
    - If start_lat/lng provided, start from there, else from the first monastery with coords.
    - Estimate walking travel time between points (~12 min per km) and include stop durations (~20 min default each).
    - Fit within duration_minutes budget.
    """
    db = SessionLocal()
    try:
        # Pull points with coordinates
        monasteries = db.query(Monastery).all()
        mons = []
        for m in monasteries:
            lat = m.info.latitude if m.info else None
            lng = m.info.longitude if m.info else None
            # Estimate visit duration: prefer highlights sum, else audio intro, else default 20
            visit_min = 20
            if m.highlights:
                total_sec = sum((h.duration_sec or 0) for h in m.highlights)
                visit_min = max(10, int(round(total_sec / 60)) or 20)
            elif m.info and m.info.audio_duration_min:
                visit_min = max(10, int(m.info.audio_duration_min))
            mons.append({
                "title": m.name,
                "desc": (m.info.description if (m.info and m.info.description) else f"Visit {m.name} in {m.location}"),
                "lat": lat,
                "lng": lng,
                "visit_min": visit_min,
            })

        # Filter those with coords first
        pts = [p for p in mons if p["lat"] is not None and p["lng"] is not None]
        if not pts:
            # Fallback: return a generic step
            return {"steps": [RouteStep(title="Explore the area", description="Walk around the monastery complex.", estimated_minutes=min(30, payload.duration_minutes))]}

        import math
        def haversine_km(lat1, lon1, lat2, lon2):
            R = 6371.0
            phi1 = math.radians(lat1)
            phi2 = math.radians(lat2)
            dphi = math.radians(lat2 - lat1)
            dl = math.radians(lon2 - lon1)
            a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dl/2)**2
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
            return R * c

        # ------------------- Routing helpers (Google preferred, OSRM fallback) -------------------
        def _gmaps_mode(mode: str) -> str:
            m = (mode or "foot").lower()
            if m in ("foot", "walk", "walking"): return "walking"
            if m in ("bike", "bicycle", "cycling"): return "bicycling"
            if m in ("car", "drive", "driving"): return "driving"
            return "walking"

        def _decode_polyline(encoded: str) -> List[Dict[str, float]]:
            # Google Encoded Polyline Algorithm Format
            coords: List[Dict[str, float]] = []
            if not encoded:
                return coords
            index, lat, lng = 0, 0, 0
            length = len(encoded)
            while index < length:
                result, shift = 0, 0
                while True:
                    b = ord(encoded[index]) - 63
                    index += 1
                    result |= (b & 0x1f) << shift
                    shift += 5
                    if b < 0x20:
                        break
                dlat = ~(result >> 1) if (result & 1) else (result >> 1)
                lat += dlat

                result, shift = 0, 0
                while True:
                    b = ord(encoded[index]) - 63
                    index += 1
                    result |= (b & 0x1f) << shift
                    shift += 5
                    if b < 0x20:
                        break
                dlng = ~(result >> 1) if (result & 1) else (result >> 1)
                lng += dlng

                coords.append({"lat": lat / 1e5, "lng": lng / 1e5})
            return coords

        def google_route_duration_and_geom(a_lat: float, a_lng: float, b_lat: float, b_lng: float, mode: str):
            """Use Google Directions API to compute duration (minutes) and polyline path.
            Returns (minutes, path_coords). Requires GOOGLE_MAPS_API_KEY env variable.
            """
            api_key = os.getenv("GOOGLE_MAPS_API_KEY")
            if not api_key:
                return None
            try:
                gmode = _gmaps_mode(mode)
                url = (
                    "https://maps.googleapis.com/maps/api/directions/json"
                    f"?origin={a_lat},{a_lng}&destination={b_lat},{b_lng}&mode={gmode}&key={api_key}"
                )
                r = requests.get(url, timeout=15)
                if r.status_code != 200:
                    return None
                data = r.json() or {}
                routes = data.get("routes") or []
                if not routes:
                    return None
                route0 = routes[0]
                legs = route0.get("legs") or []
                seconds = 0
                for leg in legs:
                    dur = (leg.get("duration") or {}).get("value", 0)
                    seconds += int(dur or 0)
                minutes = max(0, int(round(seconds / 60.0)))
                enc = (route0.get("overview_polyline") or {}).get("points") or ""
                path = _decode_polyline(enc) if enc else []
                return minutes, path
            except Exception:
                return None

        # OSRM helpers
        def _osrm_profile(mode: str):
            m = (mode or "foot").lower()
            if m in ("foot", "walk", "walking"):
                return "foot"
            if m in ("bike", "bicycle", "cycling"):
                return "bicycle"
            if m in ("car", "drive", "driving"):
                return "driving"
            return "foot"

        def osrm_route_duration_and_geom(a_lat: float, a_lng: float, b_lat: float, b_lng: float, mode: str):
            """Returns (minutes, path_coords) using OSRM public server. path_coords is a list of (lat,lng)."""
            try:
                profile = _osrm_profile(mode)
                url = f"https://router.project-osrm.org/route/v1/{profile}/{a_lng},{a_lat};{b_lng},{b_lat}?overview=full&geometries=geojson"
                r = requests.get(url, timeout=12)
                if r.status_code == 200:
                    data = r.json()
                    routes = (data or {}).get("routes") or []
                    if routes:
                        route0 = routes[0]
                        seconds = route0.get("duration", 0.0) or 0.0
                        minutes = max(0, int(round(seconds / 60.0)))
                        coords = route0.get("geometry", {}).get("coordinates", [])
                        # OSRM returns [lng, lat]
                        path = [{"lat": float(lat), "lng": float(lng)} for (lng, lat) in coords]
                        return minutes, path
            except Exception:
                pass
            # Fallback to haversine speed if OSRM fails
            dist_km = haversine_km(a_lat, a_lng, b_lat, b_lng)
            prof = _osrm_profile(mode)
            if prof == "foot":
                m_per_km = 12  # ~12 min per km
            elif prof == "bicycle":
                m_per_km = 3   # ~20 km/h -> 3 min per km
            else:  # driving
                m_per_km = 1   # rough fallback
            minutes = int(round(dist_km * m_per_km))
            return minutes, []

        def route_duration_and_geom(a_lat: float, a_lng: float, b_lat: float, b_lng: float, mode: str):
            # Prefer Google if key present
            g = google_route_duration_and_geom(a_lat, a_lng, b_lat, b_lng, mode)
            if g:
                return g
            # else OSRM
            return osrm_route_duration_and_geom(a_lat, a_lng, b_lat, b_lng, mode)

        # Establish start position: ALWAYS from fixed Sikkim Station
        # We ignore any client-provided start_lat/start_lng to keep routes consistent.
        start_lat = STATION_LAT
        start_lng = STATION_LNG
        curr_lat, curr_lng = float(start_lat), float(start_lng)

        remaining = pts.copy()
        route: List[RouteStep] = []
        time_left = max(10, payload.duration_minutes)
        full_path: List[Dict[str, float]] = []

        # Greedy pick next nearest, consume travel time + visit time, until budget exhausts
        while remaining and time_left > 5:
            # choose nearest
            remaining.sort(key=lambda p: haversine_km(curr_lat, curr_lng, float(p["lat"]), float(p["lng"])) )
            nxt = remaining.pop(0)
            # Calculate travel based on selected transport mode using Google Directions (if available), else OSRM
            travel_min, seg_path = route_duration_and_geom(curr_lat, curr_lng, float(nxt["lat"]), float(nxt["lng"]), payload.transport_mode or "foot")

            visit_min = int(nxt["visit_min"]) if nxt.get("visit_min") else 20

            # if first step and start is same as first point, reduce travel
            dist_km = haversine_km(curr_lat, curr_lng, float(nxt["lat"]), float(nxt["lng"]))
            if len(route) == 0 and dist_km < 0.05:
                travel_min = 0

            needed = travel_min + visit_min
            if needed > time_left:
                break

            # Add travel as a step if non-zero
            if travel_min > 0:
                mode = (_osrm_profile(payload.transport_mode or "foot"))
                label = "Walk" if mode == "foot" else ("Bike" if mode == "bicycle" else "Drive")
                route.append(RouteStep(title=label, description=f"{label} to {nxt['title']} (~{dist_km:.2f} km)", lat=None, lng=None, estimated_minutes=travel_min))
                # Append path geometry if available
                if seg_path:
                    # If we already have path, avoid duplicating the starting point
                    if full_path and seg_path:
                        seg_path = seg_path[1:]
                    full_path.extend(seg_path)
            route.append(RouteStep(title=nxt["title"], description=nxt["desc"], lat=float(nxt["lat"]), lng=float(nxt["lng"]), estimated_minutes=visit_min))

            time_left -= needed
            curr_lat, curr_lng = float(nxt["lat"]), float(nxt["lng"])

        if not route:
            # Couldn’t fit any visit; suggest nearest single POI name
            nearest = min(pts, key=lambda p: haversine_km(curr_lat, curr_lng, float(p["lat"]), float(p["lng"])) )
            route = [RouteStep(title=nearest["title"], description=nearest["desc"], lat=float(nearest["lat"]), lng=float(nearest["lng"]), estimated_minutes=min(20, time_left))]

        return {"steps": route, "path": full_path or None}
    finally:
        db.close()

# ------------------- Admin: QnA Cache -------------------
class QaCacheEntryOut(BaseModel):
    id: int
    question: str
    lang: str
    created_at: Optional[str] = None

@app.get("/admin/qa_cache", response_model=List[QaCacheEntryOut])
def admin_list_qa_cache():
    db = SessionLocal()
    try:
        rows = db.query(QaCache).order_by(QaCache.id.desc()).limit(200).all()
        return [
            {
                "id": r.id,
                "question": r.question or "",
                "lang": r.lang or "en",
                "created_at": r.created_at,
            }
            for r in rows
        ]
    finally:
        db.close()

@app.post("/admin/qa_cache/clear")
def admin_clear_qa_cache():
    db = SessionLocal()
    try:
        deleted = db.query(QaCache).delete()
        db.commit()
        return {"deleted": deleted}
    finally:
        db.close()

# ------------------- Helpers -------------------
def serialize_monastery(m: Monastery) -> Dict:
    # media
    media_list = []
    for md in m.media:
        # Guard against null/invalid file paths that can occur from partial seeds
        filename = os.path.basename(md.file_path) if (getattr(md, "file_path", None)) else ""
        file_url = f"http://127.0.0.1:8000/media/{filename}" if filename else ""
        media_list.append({
            "title": md.title,
            "type": md.type,
            "file_url": file_url,
            "language": getattr(md, "language", None)
        })

    # panoramas (subset of media)
    panoramas = [m for m in media_list if (m.get("type") or "").lower() == "panorama"]

    # info
    info = None
    if m.info:
        info = {
            "district": m.info.district,
            "coordinates": {
                "lat": m.info.latitude,
                "lng": m.info.longitude,
            },
            "foundingYear": m.info.founding_year,
            "description": m.info.description,
            "significance": m.info.significance,
            "audioGuide": {
                "introduction": m.info.audio_intro,
                "duration": m.info.audio_duration_min or 0,
                "highlights": [
                    {
                        "id": h.id,
                        "title": h.title,
                        "description": h.description,
                        "duration": h.duration_sec,
                        "location": h.location,
                    }
                    for h in m.highlights
                ],
            },
        }

    # events
    events = [
        {
            "id": e.id,
            "title": e.title,
            "date": e.date,
            "time": e.time,
            "description": e.description,
            "type": e.type,
            "canBook": e.can_book == "true",
            "maxParticipants": e.max_participants,
        }
        for e in m.events
    ]

    # archives
    archives = [
        {
            "id": a.id,
            "title": a.title,
            "type": a.type,
            "description": a.description,
            "imageUrl": a.image_url,
            "dateCreated": a.date_created,
            "digitalizedDate": a.digitalized_date,
        }
        for a in m.archives
    ]

    return {
        "id": m.id,
        "name": m.name,
        "location": m.location,
        "founded": m.founded,
        "media": media_list,
        # Convenience fields for simpler frontends
        "image": (media_list[0]["file_url"] if media_list else None),
        "panoramas": panoramas,
        "info": info,
        "events": events,
        "archiveItems": archives,
    }

# ------------------- Featured Monasteries -------------------
class FeaturedMonasteryOut(BaseModel):
    key: str
    name: str
    location: str
    image_url: str

@app.get("/featured_monasteries", response_model=List[FeaturedMonasteryOut])
def get_featured_monasteries():
    """Return the three featured monasteries with preview images from the Media folder (/assets mount)."""
    return [
        FeaturedMonasteryOut(
            key="pemangytse",
            name="Pemangytse",
            location="Pelling, West Sikkim",
            image_url="/assets/Pemangytse/Permangytse-preview.jpg",
        ),
        FeaturedMonasteryOut(
            key="rumtek",
            name="Rumtek",
            location="Gangtok, East Sikkim",
            image_url="/assets/Rumtek/Preview.jpg",
        ),
        FeaturedMonasteryOut(
            key="tashiding",
            name="Tashiding",
            location="Gyalshing, West Sikkim",
            image_url="/assets/Tashiding/Tashiding-Monastery-Preview.jpg",
        ),
    ]

def _pick_edge_voice_for_lang(lang_code: str) -> str:
    """Basic mapping of language code to an Edge TTS voice. Fallback to en-US if unknown.
    Note: This is best-effort; update mappings as needed.
    """
    lc = (lang_code or "").lower()
    mapping = {
        # English
        "en": "en-US-AriaNeural",
        "en-us": "en-US-AriaNeural",
        # Popular Indian languages
        "hi": "hi-IN-SwaraNeural",        # Hindi
        "bn": "bn-IN-TanishaaNeural",     # Bengali
        "mr": "mr-IN-AarohiNeural",       # Marathi
        "gu": "gu-IN-DeepaNeural",        # Gujarati
        "ta": "ta-IN-PallaviNeural",      # Tamil
        "te": "te-IN-ShrutiNeural",       # Telugu
        "kn": "kn-IN-SapnaNeural",        # Kannada
        "ml": "ml-IN-SobhanaNeural",      # Malayalam
        "pa": "pa-IN-GurdeepNeural",      # Punjabi
        "ur": "ur-PK-UzmaNeural",         # Urdu (Pakistan)
        # Limited/fallbacks
        "ne": "en-US-AriaNeural",         # Nepali not broadly available in Edge
        "bo": "en-US-AriaNeural",         # Tibetan fallback
    }
    return mapping.get(lc, mapping.get(lc.split("-")[0], "en-US-AriaNeural"))

# ------------------- TTS Narration (no external API keys required) -------------------
class NarrateIn(BaseModel):
    text: str
    lang: str = "en"  # e.g., 'en', 'hi', 'bn', 'ne'
    title: Optional[str] = "Narration"

@app.post("/ai/narrate")
async def ai_narrate(payload: NarrateIn):
    """Synthesize speech from text using Edge TTS; fallback to gTTS.
    Returns { file_url } to the generated MP3 under /media.
    """
    if not payload.text:
        raise HTTPException(status_code=400, detail="Missing text")
    lang = (payload.lang or "en").lower()
    fname = f"tts_{lang}_{uuid4().hex}.mp3"
    fpath = os.path.join(MEDIA_ROOT, fname)

    # Try Edge TTS first (neural voices)
    try:
        import edge_tts  # type: ignore
        voice = _pick_edge_voice_for_lang(lang)
        communicate = edge_tts.Communicate(payload.text, voice=voice)
        await communicate.save(fpath)
    except Exception:
        # Fallback to gTTS (Google client library that works unauthenticated)
        try:
            from gtts import gTTS  # type: ignore
            tts = gTTS(text=payload.text, lang=(lang.split('-')[0] or 'en'))
            tts.save(fpath)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"TTS failed: {e}")

    url = f"http://127.0.0.1:8000/media/{fname}"
    return {"file_url": url, "title": payload.title or "Narration", "lang": lang}

def translate_with_openai(text: str, target_lang: str) -> str:
    """Translate text to target_lang using OpenAI if available; else return original text.
    Uses gpt-4o-mini via /chat/completions. This keeps dependencies minimal (requests only).
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or not text or not target_lang:
        return text
    try:
        resp = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": "You are a helpful translator. Translate the user text faithfully into the requested language without additional commentary."},
                    {"role": "user", "content": f"Target language: {target_lang}.\nText: {text}"},
                ],
                "temperature": 0.2,
            },
            timeout=60,
        )
        if resp.status_code != 200:
            return text
        data = resp.json()
        return data.get("choices", [{}])[0].get("message", {}).get("content", text) or text
    except Exception:
        return text

def _openai_embed(texts: List[str]) -> Optional[List[List[float]]]:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None
    try:
        resp = requests.post(
            "https://api.openai.com/v1/embeddings",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "text-embedding-3-small",
                "input": texts,
            },
            timeout=60,
        )
        if resp.status_code != 200:
            return None
        data = resp.json()
        return [item.get("embedding", []) for item in data.get("data", [])]
    except Exception:
        return None

def _cosine(a: List[float], b: List[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    import math
    dot = sum(x*y for x, y in zip(a, b))
    na = math.sqrt(sum(x*x for x in a))
    nb = math.sqrt(sum(y*y for y in b))
    if na == 0 or nb == 0:
        return 0.0
    return dot / (na * nb)

def _tf_score(query: str, text: str) -> float:
    if not query or not text:
        return 0.0
    q = query.lower().split()
    t = text.lower()
    return sum(t.count(term) for term in q)

# ------------------- CRUD APIs -------------------

@app.get("/health")
def health():
    return {"message": "Monastery360 Backend Running!"}

@app.get("/", response_class=HTMLResponse)
def dashboard():
    db = SessionLocal()
    try:
        monasteries_count = db.query(Monastery).count()
        media_count = db.query(Media).count()
        events_count = db.query(Event).count()
        archives_count = db.query(ArchiveItem).count()
    finally:
        db.close()

    html = f"""
    <!doctype html>
    <html lang=\"en\">
    <head>
      <meta charset=\"utf-8\" />
      <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
      <title>Monastery360 Backend</title>
      <style>
        :root {{ --bg:#0b1020; --panel:#111831; --muted:#9bb1ff; --text:#e6ecff; --accent:#7aa2ff; }}
        * {{ box-sizing: border-box; }}
        body {{ margin:0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"; background: var(--bg); color: var(--text); }}
        .wrap {{ max-width: 980px; margin: 0 auto; padding: 32px 20px; }}
        .hero {{ display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap; }}
        h1 {{ margin:0; font-size: 28px; letter-spacing: 0.2px; }}
        .badge {{ color: #0a1a3a; background: #bcd0ff; border-radius: 999px; padding: 6px 10px; font-weight:600; font-size:12px; }}
        .grid {{ display:grid; grid-template-columns: repeat(auto-fit, minmax(180px,1fr)); gap:16px; margin-top:20px; }}
        .card {{ background: var(--panel); border: 1px solid #1f2a4d; padding: 18px; border-radius: 12px; }}
        .big {{ font-size: 32px; font-weight: 800; color: var(--accent); margin: 4px 0 0; }}
        .muted {{ color: var(--muted); font-size: 13px; }}
        .links {{ display:flex; flex-wrap:wrap; gap:10px; margin-top: 22px; }}
        .btn {{ background: #1a2454; color: #dfe7ff; padding: 10px 14px; border-radius: 10px; text-decoration:none; border: 1px solid #233070; }}
        .btn:hover {{ background:#21306e; }}
        .note {{ margin-top: 20px; font-size: 13px; color: var(--muted); }}
        code {{ background:#0e1533; border:1px solid #1f2a4d; padding:2px 6px; border-radius:6px; }}
      </style>
    </head>
    <body>
      <div class=\"wrap\">
        <div class=\"hero\">
          <h1>Monastery360 Backend</h1>
          <span class=\"badge\">FastAPI • SQLite • Media</span>
        </div>
        <div class=\"grid\" role=\"list\">
          <div class=\"card\" role=\"listitem\">
            <div class=\"muted\">Monasteries</div>
            <div class=\"big\">{monasteries_count}</div>
          </div>
          <div class=\"card\" role=\"listitem\">
            <div class=\"muted\">Media Files</div>
            <div class=\"big\">{media_count}</div>
          </div>
          <div class=\"card\" role=\"listitem\">
            <div class=\"muted\">Events</div>
            <div class=\"big\">{events_count}</div>
          </div>
          <div class=\"card\" role=\"listitem\">
            <div class=\"muted\">Archive Items</div>
            <div class=\"big\">{archives_count}</div>
          </div>
        </div>

        <div class=\"links\">
          <a class=\"btn\" href=\"/docs\">Open API Docs</a>
          <a class=\"btn\" href=\"/redoc\">ReDoc</a>
          <a class=\"btn\" href=\"/monasteries\">List Monasteries (JSON)</a>
          <a class=\"btn\" href=\"/health\">Health (JSON)</a>
        </div>

        <p class=\"note\">
          Use <code>POST /monasteries</code> to add a monastery and <code>POST /monasteries/{{id}}/media</code> to upload media.
          For a live demo, open <a href=\"/docs\">Swagger UI</a> and try the endpoints.
        </p>
      </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html)

@app.get("/monasteries", response_model=List[Dict])
def get_monasteries():
    db = SessionLocal()
    try:
        monasteries = db.query(Monastery).all()
        safe_list = []
        for m in monasteries:
            try:
                safe_list.append(serialize_monastery(m))
            except Exception as e:
                # Log and skip problematic rows to avoid 500 on list
                try:
                    print(f"serialize_monastery error for id={getattr(m, 'id', None)}: {type(e).__name__}: {e}")
                except Exception:
                    pass
        return safe_list
    finally:
        db.close()

@app.get("/monasteries/{id}", response_model=Dict)
def get_monastery(id: int):
    db = SessionLocal()
    try:
        monastery = db.query(Monastery).filter(Monastery.id == id).first()
        if not monastery:
            raise HTTPException(status_code=404, detail="Monastery not found")
        return serialize_monastery(monastery)
    finally:
        db.close()

@app.post("/monasteries", response_model=Dict)
def add_monastery(monastery: MonasteryIn):
    db = SessionLocal()
    try:
        new_monastery = Monastery(**monastery.dict())
        db.add(new_monastery)
        db.commit()
        db.refresh(new_monastery)
        return serialize_monastery(new_monastery)
    finally:
        db.close()

@app.post("/monasteries/{monastery_id}/info", response_model=Dict)
def upsert_monastery_info(monastery_id: int, payload: MonasteryInfoIn):
    db = SessionLocal()
    try:
        monastery = db.query(Monastery).filter(Monastery.id == monastery_id).first()
        if not monastery:
            raise HTTPException(status_code=404, detail="Monastery not found")
        info = db.query(MonasteryInfo).filter(MonasteryInfo.monastery_id == monastery_id).first()
        if not info:
            info = MonasteryInfo(monastery_id=monastery_id)
            db.add(info)
        for field, value in payload.dict().items():
            setattr(info, field, value)
        db.commit()
        db.refresh(info)
        return serialize_monastery(monastery)
    finally:
        db.close()

@app.post("/monasteries/{monastery_id}/events", response_model=Dict)
def add_event(monastery_id: int, payload: EventIn):
    db = SessionLocal()
    try:
        monastery = db.query(Monastery).filter(Monastery.id == monastery_id).first()
        if not monastery:
            raise HTTPException(status_code=404, detail="Monastery not found")
        ev = Event(
            monastery_id=monastery_id,
            title=payload.title,
            date=payload.date,
            time=payload.time,
            description=payload.description,
            type=payload.type,
            can_book="true" if payload.can_book else "false",
            max_participants=payload.max_participants,
        )
        db.add(ev)
        db.commit()
        return serialize_monastery(monastery)
    finally:
        db.close()

@app.post("/monasteries/{monastery_id}/archives", response_model=Dict)
def add_archive(monastery_id: int, payload: ArchiveItemIn):
    db = SessionLocal()
    try:
        monastery = db.query(Monastery).filter(Monastery.id == monastery_id).first()
        if not monastery:
            raise HTTPException(status_code=404, detail="Monastery not found")
        ar = ArchiveItem(
            monastery_id=monastery_id,
            title=payload.title,
            type=payload.type,
            description=payload.description,
            image_url=payload.image_url,
            date_created=payload.date_created,
            digitalized_date=payload.digitalized_date,
        )
        db.add(ar)
        db.commit()
        return serialize_monastery(monastery)
    finally:
        db.close()

@app.post("/monasteries/{monastery_id}/audio_highlights", response_model=Dict)
def add_audio_highlight(monastery_id: int, payload: AudioHighlightIn):
    db = SessionLocal()
    try:
        monastery = db.query(Monastery).filter(Monastery.id == monastery_id).first()
        if not monastery:
            raise HTTPException(status_code=404, detail="Monastery not found")
        hl = AudioHighlight(
            monastery_id=monastery_id,
            title=payload.title,
            description=payload.description,
            duration_sec=payload.duration_sec,
            location=payload.location,
        )
        db.add(hl)
        db.commit()
        return serialize_monastery(monastery)
    finally:
        db.close()

# ------------------- Existing media + narration endpoints -------------------

@app.post("/monasteries/{monastery_id}/media", response_model=Dict)
async def upload_media(
    monastery_id: int,
    file: UploadFile = File(...),
    title: str = Form("Untitled"),
    type: str = Form("image"),
):
    db = SessionLocal()
    try:
        monastery = db.query(Monastery).filter(Monastery.id == monastery_id).first()
        if not monastery:
            raise HTTPException(status_code=404, detail="Monastery not found")

        ext = os.path.splitext(file.filename)[1]
        fname = f"{uuid4().hex}{ext}"
        fpath = os.path.join(MEDIA_ROOT, fname)

        with open(fpath, "wb") as f:
            f.write(await file.read())

        media_item = Media(monastery_id=monastery_id, title=title, type=type, file_path=fpath)
        db.add(media_item)
        db.commit()
        db.refresh(media_item)

        file_url = f"http://127.0.0.1:8000/media/{fname}"
        return {"title": media_item.title, "type": media_item.type, "file_url": file_url}
    finally:
        db.close()

# ------------------- Multilingual AI Narration -------------------
@app.post("/monasteries/{monastery_id}/narration_multilingual", response_model=Dict)
def generate_monastery_narration_multilingual(monastery_id: int, payload: NarrationMultiIn, request: Request = None):
    db = SessionLocal()
    try:
        monastery = db.query(Monastery).filter(Monastery.id == monastery_id).first()
        if not monastery:
            raise HTTPException(status_code=404, detail="Monastery not found")

        api_key = os.getenv("OPENAI_API_KEY")

        # Build a default script if none provided (using English base)
        base_script = payload.script
        if not base_script:
            base_script = (
                f"Welcome to {monastery.name}. Located in {monastery.location}, "
                f"this monastery was founded in {monastery.founded}. "
                f"Enjoy this guided audio narration as we explore its history, architecture, and cultural significance."
            )

        # Translate to target language if needed
        target_lang = (payload.target_lang or "en").strip()
        translated = base_script if target_lang.lower().startswith("en") else translate_with_openai(base_script, target_lang)

        # Decide title and voice
        title = payload.title or f"Audio Narration ({target_lang})"
        voice = payload.voice
        if not voice:
            # Prefer Edge locale-specific voice if OpenAI key is not present; else use alloy with OpenAI
            voice = _pick_edge_voice_for_lang(target_lang)

        fname = f"{uuid4().hex}.mp3"
        fpath = os.path.join(MEDIA_ROOT, fname)

        # Synthesize using the same provider chain: OpenAI TTS -> ElevenLabs -> Edge TTS -> gTTS
        if api_key:
            tts_payload = {
                "model": "gpt-4o-mini-tts",
                "voice": ("alloy" if voice.endswith("Neural") else (voice or "alloy")),
                "input": translated,
                "format": "mp3",
            }
            try:
                resp = requests.post(
                    "https://api.openai.com/v1/audio/speech",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    },
                    json=tts_payload,
                    timeout=60,
                )
            except Exception as e:
                raise HTTPException(status_code=502, detail=f"Failed to call TTS service: {e}")

            if resp.status_code != 200:
                try:
                    err = resp.json()
                except Exception:
                    err = {"message": resp.text}
                raise HTTPException(status_code=502, detail={"message": "TTS error", "data": err})

            audio_bytes = resp.content
            try:
                with open(fpath, "wb") as f:
                    f.write(audio_bytes)
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to save audio: {e}")
        else:
            # Fallback provider chain
            elevenlabs_key = os.getenv("ELEVENLABS_API_KEY")

            if elevenlabs_key:
                try:
                    elevenlabs_voice = "EXAVITQu4vr4xnSDxMaL"  # default voice id
                    elevenlabs_payload = {
                        "text": translated,
                        "model_id": "eleven_monolingual_v1",
                        "voice_settings": {"stability": 0.5, "similarity_boost": 0.5},
                    }
                    headers = {"Accept": "audio/mpeg", "Content-Type": "application/json", "xi-api-key": elevenlabs_key}
                    resp = requests.post(
                        f"https://api.elevenlabs.io/v1/text-to-speech/{elevenlabs_voice}",
                        json=elevenlabs_payload,
                        headers=headers,
                        timeout=60,
                    )
                    if resp.status_code == 200:
                        with open(fpath, "wb") as f:
                            f.write(resp.content)
                    else:
                        raise Exception(f"ElevenLabs API error: {resp.status_code}")
                except Exception as e:
                    print(f"ElevenLabs failed, trying Edge TTS: {e}")
                    try:
                        import edge_tts  # type: ignore

                        async def synth_edge(text: str, selected_voice: str, out_path: str) -> None:
                            communicate = edge_tts.Communicate(text, selected_voice)
                            with open(out_path, "wb") as outfile:
                                async for chunk in communicate.stream():
                                    if chunk["type"] == "audio":
                                        outfile.write(chunk["data"])

                        edge_voice = voice or _pick_edge_voice_for_lang(target_lang)
                        try:
                            asyncio.run(synth_edge(translated, edge_voice, fpath))
                        except RuntimeError:
                            loop = asyncio.get_event_loop()
                            loop.run_until_complete(synth_edge(translated, edge_voice, fpath))
                    except Exception:
                        try:
                            from gtts import gTTS  # type: ignore
                        except Exception:
                            raise HTTPException(status_code=500, detail="Text-to-speech requires OPENAI_API_KEY, ELEVENLABS_API_KEY, edge-tts, or gTTS installed. Install one: pip install edge-tts OR pip install gTTS")
                        try:
                            # For gTTS, try to map simple language code
                            gtts_lang = target_lang.split("-")[0] if target_lang else "en"
                            tts = gTTS(text=translated, lang=gtts_lang)
                            tts.save(fpath)
                        except Exception as e:
                            raise HTTPException(status_code=500, detail=f"Failed to synthesize audio with gTTS: {e}")
            else:
                # Directly try Edge, then gTTS
                try:
                    import edge_tts  # type: ignore

                    async def synth_edge(text: str, selected_voice: str, out_path: str) -> None:
                        communicate = edge_tts.Communicate(text, selected_voice)
                        with open(out_path, "wb") as outfile:
                            async for chunk in communicate.stream():
                                if chunk["type"] == "audio":
                                    outfile.write(chunk["data"])

                    edge_voice = voice or _pick_edge_voice_for_lang(target_lang)
                    try:
                        asyncio.run(synth_edge(translated, edge_voice, fpath))
                    except RuntimeError:
                        loop = asyncio.get_event_loop()
                        loop.run_until_complete(synth_edge(translated, edge_voice, fpath))
                except Exception:
                    try:
                        from gtts import gTTS  # type: ignore
                    except Exception:
                        raise HTTPException(status_code=500, detail="Text-to-speech requires OPENAI_API_KEY, ELEVENLABS_API_KEY, edge-tts, or gTTS installed. Install one: pip install edge-tts OR pip install gTTS")
                    try:
                        gtts_lang = target_lang.split("-")[0] if target_lang else "en"
                        tts = gTTS(text=translated, lang=gtts_lang)
                        tts.save(fpath)
                    except Exception as e:
                        raise HTTPException(status_code=500, detail=f"Failed to synthesize audio with gTTS: {e}")

        media_item = Media(monastery_id=monastery_id, title=title, type="audio", file_path=fpath, language="en")
        db.add(media_item)
        db.commit()
        db.refresh(media_item)

        try:
            if request is not None:
                file_url = str(request.url_for("serve_media", filename=fname))
            else:
                file_url = f"http://127.0.0.1:8000/media/{fname}"
        except Exception:
            file_url = f"http://127.0.0.1:8000/media/{fname}"
        return {"title": media_item.title, "type": media_item.type, "file_url": file_url}
    finally:
        db.close()

@app.get("/media/{filename}")
def serve_media(filename: str):
    fpath = os.path.join(MEDIA_ROOT, filename)
    if not os.path.exists(fpath):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(fpath)

# ------------------- AI-generated Narration -------------------
@app.post("/monasteries/{monastery_id}/narration", response_model=Dict)
def generate_monastery_narration(monastery_id: int, payload: NarrationIn, request: Request = None):
    db = SessionLocal()
    try:
        monastery = db.query(Monastery).filter(Monastery.id == monastery_id).first()
        if not monastery:
            raise HTTPException(status_code=404, detail="Monastery not found")

        api_key = os.getenv("OPENAI_API_KEY")

        title = payload.title or "Audio Narration"
        voice = payload.voice or "alloy"
        script = payload.script

        if not script:
            script = (
                f"Welcome to {monastery.name}. Located in {monastery.location}, "
                f"this monastery was founded in {monastery.founded}. "
                f"Enjoy this guided audio narration as we explore its history, architecture, and cultural significance."
            )

        fname = f"{uuid4().hex}.mp3"
        fpath = os.path.join(MEDIA_ROOT, fname)

        if api_key:
            tts_payload = {
                "model": "gpt-4o-mini-tts",
                "voice": voice,
                "input": script,
                "format": "mp3"
            }
            try:
                resp = requests.post(
                    "https://api.openai.com/v1/audio/speech",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json"
                    },
                    json=tts_payload,
                    timeout=60
                )
            except Exception as e:
                raise HTTPException(status_code=502, detail=f"Failed to call TTS service: {e}")

            if resp.status_code != 200:
                try:
                    err = resp.json()
                except Exception:
                    err = {"message": resp.text}
                raise HTTPException(status_code=502, detail={"message": "TTS error", "data": err})

            audio_bytes = resp.content
            try:
                with open(fpath, "wb") as f:
                    f.write(audio_bytes)
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to save audio: {e}")
        else:
            # Try ElevenLabs first (most human-like), then Edge TTS, then gTTS
            elevenlabs_key = os.getenv("ELEVENLABS_API_KEY")
            
            if elevenlabs_key:
                try:
                    # ElevenLabs TTS with very human-like voices
                    voice_mapping = {
                        "maple": "EXAVITQu4vr4xnSDxMaL",
                        "alloy": "pNInz6obpgDQGcFmaJgB",
                        "echo": "AZnzlk1XvdvUeBnXmlld",
                        "fable": "EXAVITQu4vr4xnSDxMaL",
                        "onyx": "pNInz6obpgDQGcFmaJgB",
                        "nova": "EXAVITQu4vr4xnSDxMaL",
                        "shimmer": "EXAVITQu4vr4xnSDxMaL"
                    }
                    
                    elevenlabs_voice = voice_mapping.get(voice.lower(), "EXAVITQu4vr4xnSDxMaL")
                    
                    elevenlabs_payload = {
                        "text": script,
                        "model_id": "eleven_monolingual_v1",
                        "voice_settings": {
                            "stability": 0.5,
                            "similarity_boost": 0.5
                        }
                    }
                    
                    headers = {
                        "Accept": "audio/mpeg",
                        "Content-Type": "application/json",
                        "xi-api-key": elevenlabs_key
                    }
                    
                    resp = requests.post(
                        f"https://api.elevenlabs.io/v1/text-to-speech/{elevenlabs_voice}",
                        json=elevenlabs_payload,
                        headers=headers,
                        timeout=60
                    )
                    
                    if resp.status_code == 200:
                        with open(fpath, 'wb') as f:
                            f.write(resp.content)
                    else:
                        raise Exception(f"ElevenLabs API error: {resp.status_code}")
                        
                except Exception as e:
                    print(f"ElevenLabs failed, trying Edge TTS: {e}")
                    # Fallback to Edge TTS
                    try:
                        import edge_tts  # type: ignore
                        async def synth_edge(text: str, selected_voice: str, out_path: str) -> None:
                            communicate = edge_tts.Communicate(text, selected_voice)
                            with open(out_path, "wb") as outfile:
                                async for chunk in communicate.stream():
                                    if chunk["type"] == "audio":
                                        outfile.write(chunk["data"])
                        edge_voice = voice
                        if voice.lower() in {"maple", "alloy", "verse", "breeze", "ember"}:
                            edge_voice = "en-US-AriaNeural"
                        try:
                            asyncio.run(synth_edge(script, edge_voice, fpath))
                        except RuntimeError:
                            loop = asyncio.get_event_loop()
                            loop.run_until_complete(synth_edge(script, edge_voice, fpath))
                    except Exception:
                        try:
                            from gtts import gTTS  # type: ignore
                        except Exception:
                            raise HTTPException(status_code=500, detail="Text-to-speech requires OPENAI_API_KEY, ELEVENLABS_API_KEY, edge-tts, or gTTS installed. Install one: pip install edge-tts OR pip install gTTS")
                        try:
                            tts = gTTS(text=script, lang="en")
                            tts.save(fpath)
                        except Exception as e:
                            raise HTTPException(status_code=500, detail=f"Failed to synthesize audio with gTTS: {e}")
            else:
                # Use Edge TTS if no ElevenLabs key
                try:
                    import edge_tts  # type: ignore
                    async def synth_edge(text: str, selected_voice: str, out_path: str) -> None:
                        communicate = edge_tts.Communicate(text, selected_voice)
                        with open(out_path, "wb") as outfile:
                            async for chunk in communicate.stream():
                                if chunk["type"] == "audio":
                                    outfile.write(chunk["data"])
                    edge_voice = voice
                    if voice.lower() in {"maple", "alloy", "verse", "breeze", "ember"}:
                        edge_voice = "en-US-AriaNeural"
                    try:
                        asyncio.run(synth_edge(script, edge_voice, fpath))
                    except RuntimeError:
                        loop = asyncio.get_event_loop()
                        loop.run_until_complete(synth_edge(script, edge_voice, fpath))
                except Exception:
                    try:
                        from gtts import gTTS  # type: ignore
                    except Exception:
                        raise HTTPException(status_code=500, detail="Text-to-speech requires OPENAI_API_KEY, ELEVENLABS_API_KEY, edge-tts, or gTTS installed. Install one: pip install edge-tts OR pip install gTTS")
                    try:
                        tts = gTTS(text=script, lang="en")
                        tts.save(fpath)
                    except Exception as e:
                        raise HTTPException(status_code=500, detail=f"Failed to synthesize audio with gTTS: {e}")

        media_item = Media(
            monastery_id=monastery_id,
            title=title,
            type="audio",
            file_path=fpath,
            language=(target_lang.split('-')[0] if target_lang else None),
        )
        db.add(media_item)
        db.commit()
        db.refresh(media_item)

        # Build URL based on request if available; fallback to localhost:8000
        try:
            if request is not None:
                file_url = str(request.url_for("serve_media", filename=fname))
            else:
                file_url = f"http://127.0.0.1:8000/media/{fname}"
        except Exception:
            file_url = f"http://127.0.0.1:8000/media/{fname}"
        return {"title": media_item.title, "type": media_item.type, "file_url": file_url}
    finally:
        db.close()
