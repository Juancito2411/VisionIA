from sqlalchemy import Column, Integer, JSON, DateTime, func
from .database import Base

class PlatformState(Base):
    __tablename__ = 'platform_state'
    id = Column(Integer, primary_key=True, index=True)
    data = Column(JSON, nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
