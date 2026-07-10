from fastapi import FastAPI

app = FastAPI(title="MarketMind AI Service")

@app.get("/")
def read_root():
    return {"service": "ai-service", "status": "running"}
