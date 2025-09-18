from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import os
from uuid import uuid4
import asyncio
import requests
from fastapi import Request

from sqlalchemy import Column, Integer, String, ForeignKey, create_engine, Float, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship

# ------------------- Setup -------------------
app = FastAPI(title="Monastery360 Backend with SQLite & file_url")

# Allow frontend dev server to access API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MEDIA_ROOT = os.path.join(BASE_DIR, "media")
os.makedirs(MEDIA_ROOT, exist_ok=True)

DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'monastery360.db')}"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

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

Base.metadata.create_all(bind=engine)

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

# ------------------- Dependency -------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ------------------- Helpers -------------------
def serialize_monastery(m: Monastery) -> Dict:
    # media
    media_list = []
    for md in m.media:
        filename = os.path.basename(md.file_path)
        file_url = f"http://127.0.0.1:8000/media/{filename}"
        media_list.append({"title": md.title, "type": md.type, "file_url": file_url})

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
        "info": info,
        "events": events,
        "archiveItems": archives,
    }

# ------------------- CRUD APIs -------------------

@app.get("/")
def root():
    return {"message": "Monastery360 Backend Running!"}

@app.get("/monasteries", response_model=List[Dict])
def get_monasteries():
    db = SessionLocal()
    try:
        monasteries = db.query(Monastery).all()
        return [serialize_monastery(m) for m in monasteries]
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
async def upload_media(monastery_id: int, file: UploadFile = File(...), title: str = "Untitled", type: str = "image"):
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

@app.get("/media/{filename}")
def serve_media(filename: str):
    fpath = os.path.join(MEDIA_ROOT, filename)
    if not os.path.exists(fpath):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(fpath)

# ------------------- AI-generated Narration -------------------
@app.post("/monasteries/{monastery_id}/narration", response_model=Dict)
def generate_monastery_narration(monastery_id: int, title: str = "Audio Narration", voice: str = "alloy", script: str = None, request: Request = None):
    db = SessionLocal()
    try:
        monastery = db.query(Monastery).filter(Monastery.id == monastery_id).first()
        if not monastery:
            raise HTTPException(status_code=404, detail="Monastery not found")

        api_key = os.getenv("OPENAI_API_KEY")

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

        media_item = Media(monastery_id=monastery_id, title=title, type="audio", file_path=fpath)
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
