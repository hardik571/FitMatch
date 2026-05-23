from fastapi import FastAPI
from middleware.cors_middleware import add_cors_middleware
from routes import user_routes, activity_routes

app = FastAPI(title="FitMatch AI Backend")

# Add middleware
add_cors_middleware(app)

# Include routers
app.include_router(user_routes.router, prefix="/users", tags=["users"])
app.include_router(activity_routes.router, prefix="/activity", tags=["activity"])

@app.get("/")
def read_root():
    return {"message": "Welcome to FitMatch AI Backend API"}
