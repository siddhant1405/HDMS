from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.file_metadata import FileMetadataRead


class PatientCreate(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    ayushman_id: str = Field(min_length=3, max_length=80)
    age: int = Field(ge=0, le=125)
    gender: Literal["female", "male", "other"]


class PatientRead(BaseModel):
    id: int
    name: str
    ayushman_id: str
    age: int
    gender: str
    drive_folder_id: str | None
    created_by: int
    created_at: datetime
    files: list[FileMetadataRead] = []

    model_config = {"from_attributes": True}
