from fastapi import APIRouter
from models.activity_model import ActivityCreate
from controllers import activity_controller

router = APIRouter()

@router.post("/")
def log_activity(activity: ActivityCreate):
    return activity_controller.log_activity(activity)
