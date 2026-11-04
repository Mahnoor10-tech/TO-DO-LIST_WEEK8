import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.database import Base, get_db, normalize_database_url
from backend.main import app
from backend import models

test_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSession = sessionmaker(bind=test_engine, autoflush=False, autocommit=False)


def override_get_db():
    with TestSession() as session:
        yield session


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture()
def client():
    Base.metadata.create_all(bind=test_engine)
    with TestClient(app) as test_client:
        yield test_client
    Base.metadata.drop_all(bind=test_engine)


def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_normalize_postgres_urls_for_psycopg():
    assert normalize_database_url("postgres://user:pass@host/db") == (
        "postgresql+psycopg://user:pass@host/db"
    )
    assert normalize_database_url("postgresql://user:pass@host/db") == (
        "postgresql+psycopg://user:pass@host/db"
    )
    assert normalize_database_url("sqlite:///test.db") == "sqlite:///test.db"


def test_create_list_update_and_delete_todo(client):
    created = client.post(
        "/api/todos",
        json={"title": "  Learn React  ", "description": "Components"},
    )
    assert created.status_code == 201
    todo = created.json()
    assert todo["title"] == "Learn React"
    assert todo["description"] == "Components"
    assert todo["completed"] is False
    assert todo["created_at"]
    assert todo["updated_at"]

    listed = client.get("/api/todos")
    assert listed.status_code == 200
    assert [item["id"] for item in listed.json()] == [todo["id"]]

    updated = client.put(
        f"/api/todos/{todo['id']}",
        json={"title": "Learn FastAPI", "completed": True},
    )
    assert updated.status_code == 200
    assert updated.json()["title"] == "Learn FastAPI"
    assert updated.json()["completed"] is True
    assert updated.json()["description"] == "Components"

    deleted = client.delete(f"/api/todos/{todo['id']}")
    assert deleted.status_code == 204
    assert client.get("/api/todos").json() == []


def test_rejects_blank_title_and_reports_missing_todo(client):
    assert client.post("/api/todos", json={"title": "  "}).status_code == 422
    assert client.get("/api/todos/999").status_code == 404
    assert client.put("/api/todos/999", json={"title": "Missing"}).status_code == 404
    assert client.delete("/api/todos/999").status_code == 404


def test_clear_completed_todos_keeps_active_todos(client):
    active = client.post("/api/todos", json={"title": "Active"}).json()
    completed = client.post("/api/todos", json={"title": "Done"}).json()
    client.patch(f"/api/todos/{completed['id']}", json={"completed": True})

    response = client.delete("/api/todos/completed")
    assert response.status_code == 204
    remaining = client.get("/api/todos").json()
    assert [todo["id"] for todo in remaining] == [active["id"]]
