from fastapi import FastAPI

app = FastAPI(title="CyberDock API")

@app.get("/")
def read_root():
    return {"message": "Welcome to CyberDock Backend API"}
