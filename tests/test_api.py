import json
import os
import pytest
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app import app

@pytest.fixture
def client(tmp_path, monkeypatch):
    data_dir = tmp_path / "data"
    data_dir.mkdir()
    sample = data_dir / "birmingham_roads.geojson"
    sample.write_text('{"type": "FeatureCollection", "features": []}')
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
