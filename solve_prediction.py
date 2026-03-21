import sys
from roadDataset import RoadCostPredictor

try:
    predictor = RoadCostPredictor(model_path='road_model.xgb', encoder_path='encoders.joblib')

    sample_bid = {
        'State': 'Gujarat',
        'Road_Type': 'National Highway',
        'Terrain_Type': 'Plain',
        'Soil_Type': 'Clay',
        'Pavement_Type': 'Bituminous',
        'Road_Length_km': 15.0,
        'Lanes': 4,
        'Road_Width_m': 14.0,
        'Num_Workers': 300,
        'Duration_days': 150,
        'Average_Daily_Wage_INR': 650,
        'Subgrade_CBR_Value': 8.0,
        'Pavement_Thickness_mm': 600,
        'Earthwork_Volume_m3': 120000,
        'Embankment_Height_m': 0.8,
        'Bridge_Count': 1,
        'Culvert_Count': 6,
        'Drainage_Length_m': 15000
    }

    cost, breakdown = predictor.predict_cost(sample_bid, buffer_percent=0)
    print(f"PREDICTED: {cost:,.2f}")
    print(f"LOWER (97%): {cost * 0.97:,.2f}")
    print(f"RECOMMENDED BID TO TYPE IN: {int(cost * 0.99)}")
except Exception as e:
    print("Error:", e)
