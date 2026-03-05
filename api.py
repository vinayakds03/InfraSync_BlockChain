from fastapi import FastAPI, UploadFile, File, Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
from roadDataset import RoadCostPredictor
import io
import math
import uuid
from typing import List, Optional

app = FastAPI(title="Road Bidding System API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

predictor = RoadCostPredictor(model_path='road_model.xgb', encoder_path='encoders.joblib')

# === IN-MEMORY STORAGE ===
# In a real app this would be a database.
tenders_db = []
bids_db = {} # Mapping: tender_id -> list of bids

# === MODELS ===
class TenderInput(BaseModel):
    title: str
    state: str
    road_length_km: float

class BidInput(BaseModel):
    Contractor_Name: str
    Bid_Amount: float
    State: str
    Road_Type: str
    Terrain_Type: str
    Soil_Type: str
    Pavement_Type: str
    Road_Length_km: float
    Lanes: int
    Road_Width_m: float
    Num_Workers: int
    Duration_days: int
    Average_Daily_Wage_INR: float
    Subgrade_CBR_Value: float
    Pavement_Thickness_mm: float
    Earthwork_Volume_m3: float
    Embankment_Height_m: float
    Bridge_Count: int
    Culvert_Count: int
    Drainage_Length_m: float

# === ENDPOINTS ===

@app.get("/api/tenders")
async def get_tenders():
    # Return all tenders with their bid count (but not the bid details)
    result = []
    for t in tenders_db:
        result.append({
            **t,
            "bidCount": len(bids_db.get(t["id"], []))
        })
    return {"tenders": result}

@app.post("/api/tenders")
async def create_tender(tender: TenderInput):
    new_tender = {
        "id": str(uuid.uuid4()),
        "title": tender.title,
        "state": tender.state,
        "road_length_km": tender.road_length_km,
        "status": "OPEN", # OPEN or CLOSED
    }
    tenders_db.append(new_tender)
    bids_db[new_tender["id"]] = []
    return {"tender": new_tender}

@app.post("/api/tenders/{tender_id}/bids")
async def submit_bid(tender_id: str, bid: BidInput):
    tender = next((t for t in tenders_db if t["id"] == tender_id), None)
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
        
    if tender["status"] != "OPEN":
        raise HTTPException(status_code=400, detail="Tender is closed to new bids")

    # Enforce tender lock-ins (contractor shouldn't be able to change these globally required constraints)
    bid.State = tender["state"]
    bid.Road_Length_km = tender["road_length_km"]

    bid_dict = bid.dict()
    bid_dict['id'] = str(uuid.uuid4())
    
    # Check if contractor already bid
    existing_bids = bids_db.get(tender_id, [])
    if any(b['Contractor_Name'] == bid.Contractor_Name for b in existing_bids):
        raise HTTPException(status_code=400, detail="Contractor has already submitted a bid for this tender")

    bids_db[tender_id].append(bid_dict)
    return {"message": "Bid submitted successfully", "bid_id": bid_dict['id']}

@app.get("/api/tenders/{tender_id}/bids")
async def get_tender_bids(tender_id: str):
    tender = next((t for t in tenders_db if t["id"] == tender_id), None)
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
    
    bids = bids_db.get(tender_id, [])
    # Return bids omitting sensitive details (for contractor views)
    safe_bids = [{"id": b["id"], "Contractor_Name": b["Contractor_Name"]} for b in bids]
    
    return {"bids": safe_bids}


@app.post("/api/tenders/{tender_id}/evaluate")
async def evaluate_tender(tender_id: str):
    tender = next((t for t in tenders_db if t["id"] == tender_id), None)
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
        
    bids = bids_db.get(tender_id, [])
    if not bids:
        raise HTTPException(status_code=400, detail="No bids to evaluate")

    results = []
    lowest_valid_bid = float('inf')
    winner = None

    for tender_data in bids:
        # Create a clean copy
        data_copy = dict(tender_data)
        
        contractor = data_copy.pop('Contractor_Name')
        bid_amount = float(data_copy.pop('Bid_Amount'))
        bid_id = data_copy.pop('id')

        try:
            predicted_cost, _ = predictor.predict_cost(data_copy, buffer_percent=0)
            
            # Constraints: (predicted_cost * 0.97) <= bid_amount <= predicted_cost
            lower_bound = predicted_cost * 0.97
            upper_bound = predicted_cost
            
            is_valid = False
            if bid_amount < lower_bound:
                status = "Rejected (Too Low)"
            elif bid_amount > upper_bound:
                status = "Rejected (Too High)"
            else:
                status = "Accepted"
                is_valid = True
                
            result_row = {
                "contractor": contractor,
                "bid": bid_amount,
                "predicted": float(predicted_cost),
                "lower_bound": float(lower_bound),
                "status": status,
                "is_valid": is_valid
            }
            results.append(result_row)
            
            if is_valid and bid_amount < lowest_valid_bid:
                lowest_valid_bid = bid_amount
                winner = result_row
                
        except Exception as e:
             results.append({"contractor": contractor, "status": f"Error: {e}", "is_valid": False})

    # Close the tender ONLY if a valid winner was found
    if winner:
        tender["status"] = "CLOSED"

    return {"bids": results, "winner": winner}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
