import os
from main import SessionLocal, Monastery, Media, MEDIA_ROOT
from uuid import uuid4

os.makedirs(MEDIA_ROOT, exist_ok=True)

monasteries_data = [
    {"name": "Rumtek Monastery", "location": "Gangtok", "founded": "16th century"},
    {"name": "Pemayangtse Monastery", "location": "Pelling", "founded": "17th century"},
    {"name": "Enchey Monastery", "location": "Gangtok", "founded": "19th century"},
    {"name": "Tashiding Monastery", "location": "West Sikkim", "founded": "1717"},
    {"name": "Sangachoeling Monastery", "location": "West Sikkim", "founded": "1697"},
]

media_placeholders = [
    {"title": "Main Hall", "type": "image"},
    {"title": "Panorama View", "type": "panorama"}
]

db = SessionLocal()
for mon in monasteries_data:
    new_mon = Monastery(**mon)
    db.add(new_mon)
    db.commit()
    db.refresh(new_mon)

    for md in media_placeholders:
        fname = f"{uuid4().hex}.jpg"
        fpath = os.path.join(MEDIA_ROOT, fname)
        with open(fpath, "wb") as f:
            f.write(b"")  # empty placeholder
        media_item = Media(monastery_id=new_mon.id, title=md["title"], type=md["type"], file_path=fpath)
        db.add(media_item)
    db.commit()
db.close()
print("Seed data inserted successfully!")
