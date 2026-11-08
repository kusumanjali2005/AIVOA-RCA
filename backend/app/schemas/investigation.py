
from pydantic import BaseModel, Field
from typing import Optional, Any


class InvestigationRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=250)
    description: str = Field(..., min_length=10)
    severity: str = "Medium"
    source: Optional[str] = "Manual"


class InvestigationResponse(BaseModel):
    message: str
    investigation_id: str
    status: str
    title: str
    analysis: Optional[dict[str, Any]] = None
    analysis_error: Optional[str] = None
    created_at: Optional[str] = None
