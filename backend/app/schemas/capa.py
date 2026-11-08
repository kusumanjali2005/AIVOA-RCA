
from datetime import date, datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field


class CreateCAPARequest(BaseModel):
    investigation_id: str
    action_type: Literal["Corrective", "Preventive"]
    description: str = Field(..., min_length=5)
    owner: str = Field(..., min_length=2)
    due_date: date


class UpdateCAPARequest(BaseModel):
    action_type: Optional[Literal["Corrective", "Preventive"]] = None
    description: Optional[str] = Field(default=None, min_length=5)
    owner: Optional[str] = Field(default=None, min_length=2)
    due_date: Optional[date] = None
    status: Optional[
        Literal["Pending", "In Progress", "Completed"]
    ] = None


class CAPAResponse(BaseModel):
    id: str
    investigation_id: str
    action_type: str
    description: str
    owner: str
    due_date: date
    status: str
    created_at: Optional[datetime] = None
