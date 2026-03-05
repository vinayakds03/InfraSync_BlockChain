import pandas as pd
df = pd.read_csv('indian_road_tender_dataset_1000_records_v4_final.csv')
for col in ['State', 'Road_Type', 'Terrain_Type', 'Soil_Type', 'Pavement_Type']:
    print(f"{col}: {df[col].unique().tolist()}")
