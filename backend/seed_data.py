import os
from main import SessionLocal, Monastery, Media, MEDIA_ROOT, MonasteryInfo, AudioHighlight
from uuid import uuid4

os.makedirs(MEDIA_ROOT, exist_ok=True)

monasteries_data = [
    {
        "name": "Rumtek Monastery",
        "location": "Gangtok",
        "founded": "16th century",
        "info": {
            "district": "East Sikkim",
            "latitude": 27.3175,
            "longitude": 88.62,
            "founding_year": 1500,
            "description": "Main seat-in-exile of the Karmapa; renowned for its rituals and architecture.",
            "significance": "Largest monastery in Sikkim",
            "audio_intro": "Welcome to Rumtek Monastery, a living center of Tibetan Buddhism.",
            "audio_duration_min": 5
        },
        "highlights": [
            {"title": "Assembly Hall", "description": "Main prayer hall with vibrant murals.", "duration_sec": 300, "location": "Central"},
            {"title": "Golden Stupa", "description": "Relics of the 16th Karmapa.", "duration_sec": 240, "location": "North Wing"},
        ]
    },
    {
        "name": "Pemayangtse Monastery",
        "location": "Pelling",
        "founded": "17th century",
        "info": {
            "district": "West Sikkim",
            "latitude": 27.3006,
            "longitude": 88.2338,
            "founding_year": 1705,
            "description": "One of the oldest monasteries of Sikkim with a famed seven-tiered wooden structure.",
            "significance": "Historic Nyingma monastery",
            "audio_intro": "Pemayangtse preserves centuries of monastic art and learning.",
            "audio_duration_min": 4
        },
        "highlights": [
            {"title": "Sangtok Palri", "description": "Seven-tiered wooden model.", "duration_sec": 180, "location": "Upper Floor"},
        ]
    },
    {
        "name": "Enchey Monastery",
        "location": "Gangtok",
        "founded": "19th century",
        "info": {
            "district": "East Sikkim",
            "latitude": 27.3452,
            "longitude": 88.6223,
            "founding_year": 1909,
            "description": "A serene monastery famed for its sacred dances and scenic views.",
            "significance": "Cultural hub",
            "audio_intro": "Enchey’s spiritual ambience welcomes visitors.",
            "audio_duration_min": 3
        },
        "highlights": []
    },
    {
        "name": "Tashiding Monastery",
        "location": "West Sikkim",
        "founded": "1717",
        "info": {
            "district": "West Sikkim",
            "latitude": 27.2516,
            "longitude": 88.2901,
            "founding_year": 1717,
            "description": "A pilgrimage site believed to purify sins when visited with devotion.",
            "significance": "Pilgrimage center",
            "audio_intro": "Tashiding is revered for its spiritual sanctity.",
            "audio_duration_min": 4
        },
        "highlights": []
    },
    {
        "name": "Sangachoeling Monastery",
        "location": "West Sikkim",
        "founded": "1697",
        "info": {
            "district": "West Sikkim",
            "latitude": 27.2991,
            "longitude": 88.2461,
            "founding_year": 1697,
            "description": "One of the oldest monasteries, accessible by a scenic hike.",
            "significance": "Ancient heritage",
            "audio_intro": "Sangachoeling stands among ancient pines overlooking Pelling.",
            "audio_duration_min": 3
        },
        "highlights": []
    },
]

media_placeholders = [
    {"title": "Main Hall", "type": "image"},
    {"title": "Panorama View", "type": "panorama"}
]

db = SessionLocal()
existing = db.query(Monastery).count()
if existing == 0:
    for mon in monasteries_data:
        base = {k: mon[k] for k in ("name","location","founded")}
        new_mon = Monastery(**base)
        db.add(new_mon)
        db.commit()
        db.refresh(new_mon)

        # Info row
        info = mon.get("info") or {}
        db.add(MonasteryInfo(
            monastery_id=new_mon.id,
            district=info.get("district"),
            latitude=info.get("latitude"),
            longitude=info.get("longitude"),
            founding_year=info.get("founding_year"),
            description=info.get("description"),
            significance=info.get("significance"),
            audio_intro=info.get("audio_intro"),
            audio_duration_min=info.get("audio_duration_min"),
        ))

        # Highlights
        for h in mon.get("highlights", []):
            db.add(AudioHighlight(
                monastery_id=new_mon.id,
                title=h.get("title"),
                description=h.get("description"),
                duration_sec=h.get("duration_sec", 180),
                location=h.get("location"),
            ))

        # Placeholder media
        for md in media_placeholders:
            fname = f"{uuid4().hex}.jpg"
            fpath = os.path.join(MEDIA_ROOT, fname)
            with open(fpath, "wb") as f:
                f.write(b"")
            media_item = Media(monastery_id=new_mon.id, title=md["title"], type=md["type"], file_path=fpath)
            db.add(media_item)
        db.commit()
db.close()
print("Seed data ready (no-op if already present).")
