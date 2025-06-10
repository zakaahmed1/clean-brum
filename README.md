# Birmingham Road Map (Flask + Leaflet)

An interactive web app that lets you search, visualise, and explore road data for Birmingham, UK.

## Features
- Leaflet map with OpenStreetMap tiles
- Search bar with auto-suggestions
- Clickable roads showing name and length
- Flask backend serving GeoJSON API

## Getting Started

```bash
pip install -r requirements.txt
python generate_geojson.py
python app.py
```

Then go to http://127.0.0.1:5000
