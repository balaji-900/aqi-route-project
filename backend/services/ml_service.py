import joblib
import json
import os
import pandas as pd

MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "models")

model = joblib.load(os.path.join(MODEL_DIR, "aqi_model_nolag.pkl"))
model.verbose = 0

with open(os.path.join(MODEL_DIR, "aqi_model_features.json"), "r") as f:
    feature_cols = json.load(f)


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
    """
    hour = timestamp.hour
    day_of_week = timestamp.weekday()
    month = timestamp.month
    is_weekend = 1 if day_of_week in [5, 6] else 0
    season = get_season(month)

    season_summer = 1 if season == "summer" else 0
    season_winter = 1 if season == "winter" else 0
    season_post_monsoon = 1 if season == "post_monsoon" else 0

    input_df = pd.DataFrame([{
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
    }])

    input_df = input_df[feature_cols]
    prediction = model.predict(input_df)[0]
    return round(float(prediction), 1)