from datetime import datetime
from typing import Literal

from pydantic import BaseModel
from app.db.models.file_metadata import FileType


class FileMetadataRead(BaseModel):
    id: int
    patient_id: int
    drive_file_id: str
    filename: str
    type: FileType
    uploaded_at: datetime
    uploaded_by: int

    model_config = {"from_attributes": True}
