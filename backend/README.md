# Monastery360 Backend

## Endpoints

- GET `/` – Health check.
- GET `/monasteries` – List monasteries with media.
- GET `/monasteries/{id}` – Fetch single monastery by ID with media.
- POST `/monasteries` – Create a monastery.
- POST `/monasteries/{monastery_id}/media` – Upload media file to a monastery.
- GET `/media/{filename}` – Serve media files.

### GET /monasteries/{id}
Response shape example:
```json
{
  "id": 1,
  "name": "Rumtek Monastery",
  "location": "Gangtok, Sikkim",
  "founded": "18th Century",
  "media": [
    {
      "title": "Main Hall 360 View",
      "type": "image",
      "file_url": "http://127.0.0.1:8000/media/rumtek_hall.jpg"
    }
  ]
}
```

Notes:
- 404 response when not found: `{ "detail": "Monastery not found" }`.
- `file_url` format matches the list endpoint and is served by `/media/{filename}`.
