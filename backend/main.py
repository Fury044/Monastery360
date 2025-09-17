from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
import os
from uuid import uuid4

from sqlalchemy import Column, Integer, String, ForeignKey, create_engine
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

class Media(Base):
    __tablename__ = "media"
    id = Column(Integer, primary_key=True, index=True)
    monastery_id = Column(Integer, ForeignKey("monasteries.id"))
    title = Column(String)
    type = Column(String)
    file_path = Column(String)
    monastery = relationship("Monastery", back_populates="media")

Base.metadata.create_all(bind=engine)

# ------------------- Pydantic Models -------------------
class MonasteryIn(BaseModel):
    name: str
    location: str
    founded: str

# ------------------- Dependency -------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ------------------- CRUD APIs -------------------

@app.get("/")
def root():
    return {"message": "Monastery360 Backend Running!"}

@app.get("/monasteries", response_model=List[Dict])
def get_monasteries():
    db = next(get_db())
    monasteries = db.query(Monastery).all()
    result = []
    for m in monasteries:
        media_list = []
        for md in m.media:
            filename = os.path.basename(md.file_path)
            file_url = f"http://127.0.0.1:8000/media/{filename}"
            media_list.append({"title": md.title, "type": md.type, "file_url": file_url})
        result.append({
            "id": m.id,
            "name": m.name,
            "location": m.location,
            "founded": m.founded,
            "media": media_list
        })
    return result

@app.get("/monasteries/{id}", response_model=Dict)
def get_monastery(id: int):
    db = next(get_db())
    monastery = db.query(Monastery).filter(Monastery.id == id).first()
    if not monastery:
        raise HTTPException(status_code=404, detail="Monastery not found")

    media_list = []
    for md in monastery.media:
        filename = os.path.basename(md.file_path)
        file_url = f"http://127.0.0.1:8000/media/{filename}"
        media_list.append({"title": md.title, "type": md.type, "file_url": file_url})

    return {
        "id": monastery.id,
        "name": monastery.name,
        "location": monastery.location,
        "founded": monastery.founded,
        "media": media_list,
    }

@app.post("/monasteries", response_model=Dict)
def add_monastery(monastery: MonasteryIn):
    db = next(get_db())
    new_monastery = Monastery(**monastery.dict())
    db.add(new_monastery)
    db.commit()
    db.refresh(new_monastery)
    return {
        "id": new_monastery.id,
        "name": new_monastery.name,
        "location": new_monastery.location,
        "founded": new_monastery.founded,
        "media": []
    }

@app.post("/monasteries/{monastery_id}/media", response_model=Dict)
async def upload_media(monastery_id: int, file: UploadFile = File(...), title: str = "Untitled", type: str = "image"):
    db = next(get_db())
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

@app.get("/media/{filename}")
def serve_media(filename: str):
    fpath = os.path.join(MEDIA_ROOT, filename)
    if not os.path.exists(fpath):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(fpath)
