from fastapi import APIRouter

router = APIRouter()

@router.get("/dashboard")
async def get_dashboard_metrics():
    return {
        "active_sessions": 12,
        "available_chargers": 8,
        "current_load_kw": 54.3,
        "predicted_peak_kw": 71.2,
        "cost_today": 432.5
    }
