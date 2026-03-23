# backend-python/test_main.py
import json
import os
import pytest
from fastapi.testclient import TestClient
from main import app

DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "skills.json")
client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_data():
    with open(DATA_PATH, "w") as f:
        json.dump([], f)
    yield
    with open(DATA_PATH, "w") as f:
        json.dump([], f)


def test_list_skills_empty():
    r = client.get("/api/skills")
    assert r.status_code == 200
    assert r.json() == []


def test_create_skill():
    r = client.post("/api/skills", json={"name": "n", "description": "d", "content": "c"})
    assert r.status_code == 201
    body = r.json()
    assert body["name"] == "n"
    assert "id" in body


def test_create_skill_missing_fields():
    r = client.post("/api/skills", json={"name": "n"})
    assert r.status_code == 422


def test_get_skill_by_id():
    created = client.post("/api/skills", json={"name": "n", "description": "d", "content": "c"}).json()
    r = client.get(f"/api/skills/{created['id']}")
    assert r.status_code == 200
    assert r.json()["id"] == created["id"]


def test_get_skill_not_found():
    r = client.get("/api/skills/missing")
    assert r.status_code == 404


def test_delete_skill():
    created = client.post("/api/skills", json={"name": "n", "description": "d", "content": "c"}).json()
    r = client.delete(f"/api/skills/{created['id']}")
    assert r.status_code == 204
    assert client.get(f"/api/skills/{created['id']}").status_code == 404


def test_delete_skill_not_found():
    r = client.delete("/api/skills/missing")
    assert r.status_code == 404


def test_list_skills_with_query():
    client.post("/api/skills", json={"name": "python guide", "description": "d", "content": "c"})
    client.post("/api/skills", json={"name": "vue intro", "description": "d", "content": "c"})
    r = client.get("/api/skills?q=python")
    assert len(r.json()) == 1
    assert r.json()[0]["name"] == "python guide"
