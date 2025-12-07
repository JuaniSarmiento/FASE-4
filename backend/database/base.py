"""
Base model for SQLAlchemy ORM

Provides:
- Declarative base
- Common fields (id, created_at, updated_at)
- UUID primary keys
- JSON serialization
"""
import uuid
from datetime import datetime, timezone
from typing import Any, Dict

from sqlalchemy import Column, String, DateTime
from sqlalchemy.ext.declarative import declarative_base, declared_attr


def _utc_now():
    """Helper para SQLAlchemy default - retorna timestamp timezone-aware"""
    return datetime.now(timezone.utc)


# Create declarative base
Base = declarative_base()


class BaseModel:
    """Mixin class with common fields for all database models"""

    # Allow unmapped annotations for SQLAlchemy 2.x compatibility
    __allow_unmapped__ = True

    @declared_attr
    def __tablename__(cls) -> str:
        """Generate table name from class name"""
        return cls.__name__.lower()

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, default=_utc_now, nullable=False)
    updated_at = Column(
        DateTime, default=_utc_now, onupdate=_utc_now, nullable=False
    )

    @property
    def timestamp(self):
        """
        Alias for created_at (for Pydantic compatibility).

        Pydantic models use 'timestamp' field, but ORM uses 'created_at'
        to follow standard naming conventions. This property provides
        backward compatibility.
        """
        return self.created_at

    def to_dict(self) -> Dict[str, Any]:
        """Convert model to dictionary"""
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            # Handle datetime serialization
            if isinstance(value, datetime):
                value = value.isoformat()
            result[column.name] = value
        return result

    def __repr__(self) -> str:
        """String representation"""
        return f"<{self.__class__.__name__}(id={self.id})>"