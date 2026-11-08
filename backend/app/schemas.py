from pydantic import BaseModel
from typing import Any

class StateWrite(BaseModel):
    data: dict[str, Any]
