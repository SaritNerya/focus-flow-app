import pytest
from fastapi.testclient import TestClient
from mongomock_motor import AsyncMongoMockClient

from app import db as dbmod
from app.main import app


@pytest.fixture()
def client(monkeypatch):
    async def fake_connect():
        dbmod._db = AsyncMongoMockClient()["test"]

    async def fake_close():
        pass

    monkeypatch.setattr(dbmod, "connect", fake_connect)
    monkeypatch.setattr(dbmod, "close", fake_close)
    with TestClient(app) as c:
        yield c


def register(c, email="a@b.com", pw="password1", name="דני"):
    return c.post("/api/auth/register", json={"email": email, "password": pw, "display_name": name})


def login(c, email="a@b.com", pw="password1"):
    r = c.post("/api/auth/login", json={"email": email, "password": pw})
    return r, ({"Authorization": f"Bearer {r.json()['access_token']}"} if r.status_code == 200 else None)


def test_health(client):
    assert client.get("/health").json() == {"status": "ok"}


def test_register_rules(client):
    r = register(client)
    assert r.status_code == 201 and "password" not in r.text and r.json()["email"] == "a@b.com"
    assert register(client, email="A@B.com").status_code == 409          # בלי הבדל בין גדולות לקטנות
    r = register(client, email="x@y.com", pw="short")
    assert r.status_code == 422 and "8" in r.json()["message"]
    assert register(client, email="bad").status_code == 422


def test_login_logout_and_token(client):
    register(client)
    r, _ = login(client, pw="wrongpass1")
    assert r.status_code == 401 and "message" in r.json()
    r, h = login(client)
    assert r.status_code == 200 and r.json()["token_type"] == "bearer"
    assert client.get("/api/users/me").status_code == 401
    assert client.get("/api/users/me", headers={"Authorization": "Bearer junk"}).status_code == 401
    me = client.get("/api/users/me", headers=h).json()
    assert me["display_name"] == "דני" and "password_hash" not in me
    assert client.post("/api/auth/logout", headers=h).status_code == 204
    assert client.get("/api/users/me", headers=h).status_code == 401      # הטוקן בוטל


def test_lockout(client):
    register(client)
    for _ in range(5):
        assert login(client, pw="nope-nope")[0].status_code == 401
    assert login(client)[0].status_code == 429                            # גם סיסמה נכונה נחסמת


def test_content_and_isolation(client):
    register(client)
    _, h1 = login(client)
    r = client.post("/api/content", headers=h1, json={"type": "youtube", "title": "סרטון", "source": "https://youtu.be/dQw4w9WgXcQ"})
    assert r.status_code == 201 and r.json()["source"].endswith("dQw4w9WgXcQ")
    t = client.post("/api/content", headers=h1, json={"type": "text", "title": "מאמר", "source": "א" * 500}).json()
    assert client.post("/api/content", headers=h1, json={"type": "pdf", "title": "x", "source": "y"}).status_code == 422
    assert client.post("/api/content", headers=h1, json={"type": "youtube", "title": "x", "source": "https://example.com"}).status_code == 422
    lst = client.get("/api/content", headers=h1).json()
    assert len(lst) == 2 and all(i["text"] is None for i in lst)
    assert client.get(f"/api/content/{t['id']}", headers=h1).json()["text"] == "א" * 500

    register(client, email="b@b.com")
    _, h2 = login(client, email="b@b.com")
    assert client.get("/api/content", headers=h2).json() == []
    assert client.get(f"/api/content/{t['id']}", headers=h2).status_code == 404
    assert client.delete(f"/api/content/{t['id']}", headers=h2).status_code == 404
    assert client.get("/api/content/not-an-id", headers=h2).status_code == 404


def test_ssrf_blocked(client):
    register(client)
    _, h = login(client)
    r = client.post("/api/content", headers=h, json={"type": "web", "title": "x", "source": "http://127.0.0.1:8000/health"})
    assert r.status_code == 422


def test_session_flow(client):
    register(client)
    _, h = login(client)
    c = client.post("/api/content", headers=h, json={"type": "text", "title": "מאמר", "source": "טקסט ארוך לבדיקה"}).json()
    s = client.post("/api/sessions", headers=h, json={"content_id": c["id"]})
    assert s.status_code == 201
    sid = s.json()["id"]
    assert client.post(f"/api/sessions/{sid}/readings", headers=h, json={"position": 1, "score": 1.5}).status_code == 422
    for score in (0.2, 0.6):
        assert client.post(f"/api/sessions/{sid}/readings", headers=h, json={"position": 3, "score": score}).status_code == 201
    end = client.post(f"/api/sessions/{sid}/end", headers=h).json()
    assert end["reading_count"] == 2 and end["average_score"] == 0.4 and end["ended_at"]
    assert client.post(f"/api/sessions/{sid}/readings", headers=h, json={"position": 3, "score": 0.5}).status_code == 409
    detail = client.get(f"/api/sessions/{sid}", headers=h).json()
    assert len(detail["readings"]) == 2
    assert client.get("/api/sessions", headers=h).json()[0]["content_title"] == "מאמר"

    register(client, email="b@b.com")
    _, h2 = login(client, email="b@b.com")
    assert client.get(f"/api/sessions/{sid}", headers=h2).status_code == 404
    assert client.post("/api/sessions", headers=h2, json={"content_id": c["id"]}).status_code == 404
    assert client.get("/api/sessions", headers=h2).json() == []


def test_profile_password_delete(client):
    register(client)
    _, h = login(client)
    assert client.patch("/api/users/me", headers=h, json={"display_name": "חדש"}).json()["display_name"] == "חדש"
    bad = client.post("/api/users/me/password", headers=h, json={"current_password": "x", "new_password": "newpassword1"})
    assert bad.status_code == 400
    ok = client.post("/api/users/me/password", headers=h, json={"current_password": "password1", "new_password": "newpassword1"})
    assert ok.status_code == 204
    assert client.get("/api/users/me", headers=h).status_code == 401      # טוקן ישן נפסל
    assert login(client, pw="password1")[0].status_code == 401
    _, h = login(client, pw="newpassword1")
    assert client.delete("/api/users/me", headers=h).status_code == 204
    assert login(client, pw="newpassword1")[0].status_code == 401
