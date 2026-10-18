"""
FastAPI Application Entrypoint for Autonomous SQL Database Analyst.
"""

import time
import uuid
import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.api.endpoints import router as api_router

app = FastAPI(
    title="Autonomous SQL Database Analyst - AI Service",
    description="Secure AI engine for intent analysis, SQLGlot validation, read-only execution, and result intelligence.",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Tracing & Correlation ID Middleware
@app.middleware("http")
async def correlation_id_middleware(request: Request, call_next):
    request_id = request.headers.get("x-request-id") or str(uuid.uuid4())
    start_time = time.time()
    
    response = await call_next(request)
    
    duration = round((time.time() - start_time) * 1000, 2)
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Response-Time-Ms"] = str(duration)
    return response

# Include internal API routes
app.include_router(api_router)

# Global sanitized exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred during analysis processing.",
            "type": type(exc).__name__
        }
    )

if __name__ == "__main__":
    uvicorn.run(
        "app.main.py:app",
        host=settings.AI_SERVICE_HOST,
        port=settings.AI_SERVICE_PORT,
        reload=False
    )
