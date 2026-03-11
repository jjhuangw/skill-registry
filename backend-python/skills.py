import json
import os
from datetime import datetime, timezone
from typing import List, Optional
from uuid import uuid4

from models import Skill

DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "skills.json")


def _read() -> List[dict]:
    if not os.path.exists(DATA_PATH):
        return []
    with open(DATA_PATH) as f:
        return json.load(f)


def _write(skills: List[dict]) -> None:
    os.makedirs(os.path.dirname(DATA_PATH), exist_ok=True)
    with open(DATA_PATH, "w") as f:
        json.dump(skills, f, indent=2)


def list_skills(query: Optional[str] = None) -> List[Skill]:
    skills = [Skill(**s) for s in _read()]
    if not query:
        return skills
    q = query.lower()
    return [
        s for s in skills
        if q in s.name.lower() or q in s.description.lower() or q in s.content.lower()
    ]


def get_skill_by_id(id: str) -> Optional[Skill]:
    for s in _read():
        if s["id"] == id:
            return Skill(**s)
    return None


def create_skill(name: str, description: str, content: str) -> Skill:
    skills = _read()
    skill = Skill(
        id=str(uuid4()),
        name=name,
        description=description,
        content=content,
        createdAt=datetime.now(timezone.utc).isoformat(),
    )
    skills.append(skill.model_dump())
    _write(skills)
    return skill


def delete_skill(id: str) -> bool:
    skills = _read()
    new_skills = [s for s in skills if s["id"] != id]
    if len(new_skills) == len(skills):
        return False
    _write(new_skills)
    return True
