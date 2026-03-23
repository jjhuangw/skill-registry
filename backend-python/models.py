from pydantic import BaseModel


class SkillCreate(BaseModel):
    name: str
    description: str
    content: str


class Skill(SkillCreate):
    id: str
    createdAt: str
