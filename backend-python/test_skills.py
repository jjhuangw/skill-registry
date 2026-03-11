import json
import os
import pytest
from skills import list_skills, get_skill_by_id, create_skill, delete_skill

DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "skills.json")


@pytest.fixture(autouse=True)
def reset_data():
    with open(DATA_PATH, "w") as f:
        json.dump([], f)
    yield
    with open(DATA_PATH, "w") as f:
        json.dump([], f)


def test_create_skill_returns_skill_with_id():
    skill = create_skill(name="foo", description="bar", content="baz")
    assert skill.name == "foo"
    assert skill.description == "bar"
    assert skill.content == "baz"
    assert skill.id is not None
    assert skill.createdAt is not None


def test_list_skills_returns_all():
    create_skill(name="a", description="d1", content="c1")
    create_skill(name="b", description="d2", content="c2")
    skills = list_skills()
    assert len(skills) == 2


def test_list_skills_filters_by_query():
    create_skill(name="python guide", description="about python", content="...")
    create_skill(name="vue intro", description="about vue", content="...")
    skills = list_skills(query="python")
    assert len(skills) == 1
    assert skills[0].name == "python guide"


def test_get_skill_by_id_returns_skill():
    created = create_skill(name="x", description="y", content="z")
    found = get_skill_by_id(created.id)
    assert found is not None
    assert found.id == created.id


def test_get_skill_by_id_returns_none_for_missing():
    assert get_skill_by_id("nonexistent") is None


def test_delete_skill_removes_it():
    skill = create_skill(name="del", description="me", content="bye")
    assert delete_skill(skill.id) is True
    assert get_skill_by_id(skill.id) is None


def test_delete_skill_returns_false_for_missing():
    assert delete_skill("nonexistent") is False
