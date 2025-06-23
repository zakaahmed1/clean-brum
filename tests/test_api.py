import json
import os
import pytest
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from brumapp import app

@pytest.fixture
def client(tmp_path, monkeypatch):
    data_dir = tmp_path / "data"
    data_dir.mkdir()
    sample = data_dir / "birmingham_roads.geojson"
    sample.write_text('{"type": "FeatureCollection", "features": []}')
    monkeypatch.setattr(app, "DATA_PATH", str(sample))
    monkeypatch.chdir(tmp_path)
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

def test_get_roads(client):
    response = client.get("/api/roads")
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "type" in data

def test_home_route(client):
    response = client.get("/")
    assert response.status_code == 200
    assert b"<html" in response.data  # or some other check for the HTML


def test_get_roads_not_found(tmp_path, monkeypatch):
    """Ensure a 404 response is returned when the GeoJSON file is missing."""
    data_dir = tmp_path / "data"
    data_dir.mkdir()
    missing = data_dir / "missing.geojson"
    monkeypatch.setattr(app, "DATA_PATH", str(missing))
    monkeypatch.chdir(tmp_path)
    app.config["TESTING"] = True
    with app.test_client() as client:
        response = client.get("/api/roads")
        assert response.status_code == 404
        assert b"Road data not found" in response.data
