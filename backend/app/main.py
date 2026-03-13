from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import dashboard

app = FastAPI()

# Add CORS middleware allowing all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard.router, prefix="/api")


