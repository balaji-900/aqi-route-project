
from datetime import datetime, timedelta
from services.ml_service import predict_aqi

sample_pollutants = {
    "pm2_5": 180, "pm10": 280, "no2": 60,
    "so2": 15, "co": 1.5, "o3": 20, "nh3": 25
}

eta_time = datetime.now() + timedelta(minutes=20)
result = predict_aqi(sample_pollutants, eta_time)
print("Predicted AQI at ETA:", result)