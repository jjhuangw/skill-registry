# backend-python/main.py
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware

from models import Skill, SkillCreate
from skills import list_skills, get_skill_by_id, create_skill, delete_skill

app = FastAPI()

# Intentionally permissive for local development only
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/skills", response_model=List[Skill])
def get_skills(q: Optional[str] = None):
    return list_skills(query=q)


@app.get("/api/skills/{id}", response_model=Skill)
def get_skill(id: str):
    skill = get_skill_by_id(id)
    if not skill:
        raise HTTPException(status_code=404, detail="Not found")
    return skill


@app.post("/api/skills", response_model=Skill, status_code=201)
def post_skill(body: SkillCreate):
    return create_skill(name=body.name, description=body.description, content=body.content)


@app.delete("/api/skills/{id}", status_code=204)
def remove_skill(id: str):
    if not delete_skill(id):
        raise HTTPException(status_code=404, detail="Not found")
    return Response(status_code=204)
