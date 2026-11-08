
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import Investigation, CAPAAction
from app.schemas.capa import (
    CreateCAPARequest,
    UpdateCAPARequest
)

router = APIRouter(
    prefix="/api/capa",
    tags=["CAPA Management"]
)


def capa_to_dict(action):
    return {
        "id": action.id,
        "investigation_id": action.investigation_id,
        "action_type": action.action_type,
        "description": action.description,
        "owner": action.owner,
        "due_date": action.due_date.isoformat(),
        "status": action.status,
        "created_at": (
            action.created_at.isoformat()
            if action.created_at else None
        )
    }


@router.post("/")
def create_capa(
    request: CreateCAPARequest,
    db: Session = Depends(get_db)
):
    investigation = db.query(Investigation).filter(
        Investigation.id == request.investigation_id
    ).first()

    if not investigation:
        raise HTTPException(
            status_code=404,
            detail="Investigation not found."
        )

    action = CAPAAction(
        id=str(uuid4()),
        investigation_id=request.investigation_id,
        action_type=request.action_type,
        description=request.description,
        owner=request.owner,
        due_date=request.due_date,
        status="Pending"
    )

    db.add(action)
    db.commit()
    db.refresh(action)

    return {
        "message": "CAPA action created successfully.",
        "capa": capa_to_dict(action)
    }


@router.get("/")
def list_capa(
    investigation_id: str = None,
    db: Session = Depends(get_db)
):
    query = db.query(CAPAAction)

    if investigation_id:
        query = query.filter(
            CAPAAction.investigation_id == investigation_id
        )

    actions = query.order_by(
        CAPAAction.created_at.desc()
    ).all()

    return {
        "total": len(actions),
        "actions": [capa_to_dict(action) for action in actions]
    }


@router.patch("/{capa_id}")
def update_capa(
    capa_id: str,
    request: UpdateCAPARequest,
    db: Session = Depends(get_db)
):
    action = db.query(CAPAAction).filter(
        CAPAAction.id == capa_id
    ).first()

    if not action:
        raise HTTPException(
            status_code=404,
            detail="CAPA action not found."
        )

    updates = request.model_dump(exclude_unset=True)

    for field, value in updates.items():
        setattr(action, field, value)

    db.commit()
    db.refresh(action)

    return {
        "message": "CAPA action updated successfully.",
        "capa": capa_to_dict(action)
    }


@router.delete("/{capa_id}")
def delete_capa(
    capa_id: str,
    db: Session = Depends(get_db)
):
    action = db.query(CAPAAction).filter(
        CAPAAction.id == capa_id
    ).first()

    if not action:
        raise HTTPException(
            status_code=404,
            detail="CAPA action not found."
        )

    db.delete(action)
    db.commit()

    return {
        "message": "CAPA action deleted successfully."
    }
