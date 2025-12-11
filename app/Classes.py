from pydantic import BaseModel
from typing import Optional # For optional fields
from datetime import datetime
from typing import List, Optional
from app.database import SearchHistory

class LoginResponse(BaseModel):
    message: str = "Login successful"
    access_code: str
    logged_in_at: datetime
    user_id: str

class User(BaseModel):
    # Required fields
    username: str
    
    # Optional field (defaults to None if not provided)
    access_code: Optional[str] = None
    password: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "username": "abcde",
                "password": "abcdefjhsk",
                "access_code": "ABCDE"
            }
        }

class DistanceCalcRequest(BaseModel):
    Place1: str
    Place2: str
    Type: str
    class Config:
        json_schema_extra = {
            "example": {
                "Place1": "New York",
                "Place2": "Paris",
                "Type" : "Kms/Miles/Both"
            }
        }

class SearchHistoryRecord(BaseModel):
    # ALL fields here must match the data types and names of the columns 
    # in your SQLAlchemy SearchHistory model.
    Place1: str
    Place2: str
    Miles: float
    Kilometers: float
    searched_at: datetime
    id: int
    user_id: int

    class Config:
        # THIS IS THE VITAL FIX. It allows Pydantic V2 to read attributes from 
        # non-Pydantic objects (like SQLAlchemy models).
        from_attributes = True

class SearchHistoryResponse(BaseModel):
    data: List[SearchHistoryRecord]

    class Config:
        arbitrary_types_allowed = True