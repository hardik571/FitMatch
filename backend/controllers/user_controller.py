from fastapi import HTTPException
from config.database import get_supabase
from models.user_model import UserCreate, UserResponse

def create_user(user: UserCreate) -> UserResponse:
    supabase = get_supabase()
    try:
        response = supabase.table("users").insert({
            "name": user.name,
            "email": user.email
        }).execute()
        
        if len(response.data) > 0:
            return response.data[0]
        else:
            raise HTTPException(status_code=400, detail="Failed to create user")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

def get_user_by_email(email: str) -> UserResponse:
    supabase = get_supabase()
    try:
        response = supabase.table("users").select("*").eq("email", email).execute()
        
        if len(response.data) > 0:
            return response.data[0]
        else:
            raise HTTPException(status_code=404, detail="User not found")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
