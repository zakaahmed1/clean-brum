# Birmingham Road Map (Flask + Leaflet)

An interactive web app that lets you search, visualise, and explore road data for Birmingham, UK.

## Features
- Leaflet map with OpenStreetMap tiles
- Search bar with auto-suggestions
- Clickable roads showing name, road type, speed limit, and road length
- Flask backend serving GeoJSON API

## Getting Started

```bash
pip install -r requirements.txt
pip install -r requirements-dev.txt  # for running tests
python generate_geojson.py
python -m brumapp.app
```

The `generate_geojson.py` script downloads road data from OpenStreetMap and may require a stable
internet connection. The output file will be saved as `data/birmingham_roads.geojson`.

Then go to http://127.0.0.1:5000

## Testing

Run the unit tests with `pytest`:

```bash
pytest
```
