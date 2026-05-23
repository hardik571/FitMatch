from fastapi import HTTPException
from config.database import get_supabase
from models.activity_model import ActivityCreate

def log_activity(activity: ActivityCreate):
    supabase = get_supabase()
    try:
        response = supabase.table("user_activities").insert({
            "email": activity.email,
            "activity_type": activity.activity_type,
            "details": activity.details
        }).execute()
        
        if len(response.data) > 0:
            return response.data[0]
        else:
            raise HTTPException(status_code=400, detail="Failed to log activity")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
