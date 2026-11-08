
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.api.investigations import router as investigation_router
from app.api.capa import router as capa_router
from app.database.database import Base, engine
from app.database import models

load_dotenv()

app = FastAPI(
    title="AIVOA AI - Root Cause Analysis",
    description=(
        "AI-assisted pharmaceutical quality "
        "investigation and root cause analysis system"
    ),
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://aivoa-rca-five.vercel.app"
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)


app.include_router(investigation_router)
app.include_router(capa_router)


@app.get("/")
def home():
    return {
        "message": "Welcome to AIVOA AI Root Cause Analysis System",
        "status": "Running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "application": "AIVOA RCA"
    }
