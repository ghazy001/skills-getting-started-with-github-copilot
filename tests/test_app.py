from fastapi.testclient import TestClient
from src.app import app, activities
import copy
from urllib.parse import quote


import pytest


@pytest.fixture(autouse=True)
def preserve_activities():
    """Preserve the in-memory activities dict between tests."""
    original = copy.deepcopy(activities)
    yield
    # restore original state
    activities.clear()
    activities.update(original)


@pytest.fixture
def client():
    return TestClient(app)


def test_get_activities(client):
    res = client.get("/activities")
    assert res.status_code == 200
    data = res.json()
    # basic sanity checks
    assert isinstance(data, dict)
    assert "Soccer Team" in data


def test_signup_and_unregister(client):
    activity = "Soccer Team"
    email = "tester@example.com"

    # signup (note: spaces in the activity name need quoting)
    signup_path = f"/activities/{quote(activity)}/signup?email={quote(email)}"
    r = client.post(signup_path)
    assert r.status_code == 200
    assert email in activities[activity]["participants"]

    # unregister
    unregister_path = f"/activities/{quote(activity)}/unregister?email={quote(email)}"
    r2 = client.post(unregister_path)
    assert r2.status_code == 200
    assert email not in activities[activity]["participants"]
