from pydantic import BaseModel

class ActivityCreate(BaseModel):
    email: str
    activity_type: str
    details: dict
