import json
import os

# Model dir path — resolved at import time but model itself is NOT loaded yet
MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "models")

# --- Lazy globals: populated on first call to predict_aqi() ---
_model = None
_feature_cols = None


def _load_model():
    """Load the ML model and feature list on first use (lazy loading).
    This defers the heavy scikit-learn / numpy memory allocation until the
    first actual prediction request, keeping startup RAM well under 512 MB.
    """
    global _model, _feature_cols
    if _model is None:
        import joblib  # heavy import — deferred intentionally
        _model = joblib.load(os.path.join(MODEL_DIR, "aqi_model_nolag.pkl"))
        _model.verbose = 0
        with open(os.path.join(MODEL_DIR, "aqi_model_features.json"), "r") as f:
            _feature_cols = json.load(f)


def get_season(month):
    if month in [12, 1, 2]:
        return "winter"
    elif month in [3, 4, 5]:
        return "summer"
    elif month in [6, 7, 8, 9]:
        return "monsoon"
    else:
        return "post_monsoon"


def predict_aqi(pollutants: dict, timestamp):
    """
    pollutants: dict with keys pm2_5, pm10, no2, so2, co, o3, nh3
                (matches the output shape of get_live_aqi_and_weather)
    timestamp: a Python datetime object representing the ETA at this waypoint

    Uses a numpy array instead of a pandas DataFrame to avoid importing pandas
    (~100 MB RAM), keeping memory usage within Render's free-tier 512 MB limit.
    """
    _load_model()

    hour = timestamp.hour
    day_of_week = timestamp.weekday()
    month = timestamp.month
    is_weekend = 1 if day_of_week in [5, 6] else 0
    season = get_season(month)

    season_summer = 1 if season == "summer" else 0
    season_winter = 1 if season == "winter" else 0
    season_post_monsoon = 1 if season == "post_monsoon" else 0

    # Build a dict of all possible feature values
    row = {
        "hour": hour,
        "day_of_week": day_of_week,
        "month": month,
        "is_weekend": is_weekend,
        "season_summer": season_summer,
        "season_winter": season_winter,
        "season_post_monsoon": season_post_monsoon,
        "PM2.5": pollutants["pm2_5"],
        "PM10": pollutants["pm10"],
        "NO2": pollutants["no2"],
        "SO2": pollutants["so2"],
        "CO": pollutants["co"],
        "O3": pollutants["o3"],
        "NH3": pollutants["nh3"],
    }

    # Build a numpy array in the exact column order the model expects —
    # no pandas required at all.
    import numpy as np  # already loaded by scikit-learn; just a reference
    input_array = np.array([[row[col] for col in _feature_cols]], dtype=float)

    prediction = _model.predict(input_array)[0]
    return round(float(prediction), 1)