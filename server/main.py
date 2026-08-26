import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from server.config import PORT
from server.routers import auth, anomaly, churn, recommendations, segmentation, forecast, analytics, users

app = FastAPI(
    title="MarketMind AI — Unified Intelligence Platform",
    description="Unified AI & Business Intelligence Monolith running all portfolio services for Hugging Face Spaces.",
    version="2.0.0"
)

# ── CORS Middleware ────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?:\/\/.*",
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# ── Mount Service Routers ──────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(anomaly.router)
app.include_router(churn.router)
app.include_router(recommendations.router)
app.include_router(segmentation.router)
app.include_router(forecast.router)
app.include_router(analytics.router)

# ── Health & Diagnostics ───────────────────────────────────────────────────────
@app.api_route("/health", methods=["GET", "HEAD"])
@app.api_route("/api/health", methods=["GET", "HEAD"])
def health_check():
    return {
        "status": "UP",
        "service": "MarketMind AI Monolith",
        "platform": "Unified Cloud Platform",
        "port": PORT,
        "services": {
            "anomalyDetection": "online",
            "churnPrediction": "online",
            "productRecommendations": "online",
            "customerSegmentation": "online",
            "salesForecasting": "online",
            "authentication": "online"
        }
    }

@app.api_route("/api", methods=["GET", "HEAD"])
def api_root():
    return {
        "message": "Welcome to MarketMind AI Unified API Platform",
        "docs": "/docs",
        "endpoints": [
            "/api/auth",
            "/api/anomaly-detection",
            "/api/churn",
            "/api/recommendations",
            "/api/customer-groups",
            "/api/forecast",
            "/api/dashboard/summary",
            "/api/analytics/sales-trend",
            "/api/inventory"
        ]
    }

# ── Serve Built Frontend if Available ──────────────────────────────────────────
FRONTEND_DIST = Path(__file__).resolve().parent.parent / "Frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

    @app.api_route("/{full_path:path}", methods=["GET", "HEAD"])
    def serve_frontend(full_path: str):
        requested_file = FRONTEND_DIST / full_path
        if requested_file.exists() and requested_file.is_file():
            return FileResponse(requested_file)
        return FileResponse(FRONTEND_DIST / "index.html")
else:
    @app.api_route("/", methods=["GET", "HEAD"])
    def index():
        return {
            "service": "MarketMind AI Unified Platform",
            "status": "Online",
            "apiDocumentation": "/docs",
            "healthCheck": "/health"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server.main:app", host="0.0.0.0", port=PORT, reload=False)
