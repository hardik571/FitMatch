from fastapi import APIRouter
from models.user_model import UserCreate, UserResponse
from controllers import user_controller

router = APIRouter()

@router.post("/", response_model=UserResponse)
def create_user(user: UserCreate):
    return user_controller.create_user(user)

@router.get("/{email}", response_model=UserResponse)
def get_user(email: str):
    return user_controller.get_user_by_email(email)
