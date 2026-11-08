
from sqlalchemy import Column, String, Text, DateTime, Date, ForeignKey
from sqlalchemy.sql import func
from app.database.database import Base


class Investigation(Base):
    __tablename__ = "investigations"

    id = Column(String(36), primary_key=True, index=True)
    title = Column(String(250), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String(30), nullable=False)
    source = Column(String(100), nullable=False)

    status = Column(String(50), default="Received")
    analysis = Column(Text, nullable=True)
    analysis_error = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )


class CAPAAction(Base):
    __tablename__ = "capa_actions"

    id = Column(String(36), primary_key=True, index=True)

    investigation_id = Column(
        String(36),
        ForeignKey("investigations.id"),
        nullable=False,
        index=True
    )

    action_type = Column(String(30), nullable=False)
    description = Column(Text, nullable=False)
    owner = Column(String(150), nullable=False)
    due_date = Column(Date, nullable=False)
    status = Column(String(30), default="Pending", nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )
