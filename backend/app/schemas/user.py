from datetime import datetime

from pydantic import BaseModel, EmailStr


class UserRead(BaseModel):
    id: int
    email: EmailStr
    google_account_email: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
