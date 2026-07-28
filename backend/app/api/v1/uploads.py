from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.deps import get_current_user
from app.db.models.file_metadata import FileMetadata, FileType
from app.db.models.patient import Patient
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.file_metadata import FileMetadataRead
from app.services.google_drive import GoogleDriveService

settings = get_settings()
router = APIRouter(prefix="/patients", tags=["uploads"])

IMAGE_MIMES = {"image/jpeg", "image/png", "image/heic", "image/heif"}
DOCUMENT_MIMES = {"application/pdf", "image/jpeg", "image/png"}
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".heic", ".heif"}
DOCUMENT_EXTS = {".pdf", ".jpg", ".jpeg", ".png"}


async def _read_validated_file(
    upload: UploadFile,
    allowed_mimes: set[str],
    allowed_exts: set[str],
) -> tuple[bytes, str]:
    filename = Path(upload.filename or "upload").name
    mimetype = upload.content_type or "application/octet-stream"
    ext = Path(filename).suffix.lower()
    if mimetype not in allowed_mimes or ext not in allowed_exts:
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Unsupported file type")
    content = await upload.read()
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="File is too large")
    return content, mimetype


async def _get_patient(db: AsyncSession, patient_id: int) -> Patient:
    patient = await db.scalar(select(Patient).where(Patient.id == patient_id))
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    if not patient.drive_folder_id:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Patient Drive folder is missing")
    return patient


async def _upload(
    patient_id: int,
    upload: UploadFile,
    file_type: FileType,
    folder_name: str,
    allowed_mimes: set[str],
    allowed_exts: set[str],
    db: AsyncSession,
    current_user: User,
) -> FileMetadata:
    patient = await _get_patient(db, patient_id)
    content, mimetype = await _read_validated_file(upload, allowed_mimes, allowed_exts)
    drive = GoogleDriveService(current_user)
    folder_id = drive.ensure_child_folder(patient.drive_folder_id, folder_name)
    drive_file_id = drive.upload_file(folder_id, content, Path(upload.filename or "upload").name, mimetype)
    metadata = FileMetadata(
        patient_id=patient.id,
        drive_file_id=drive_file_id,
        filename=Path(upload.filename or "upload").name,
        type=file_type,
        uploaded_by=current_user.id,
    )
    db.add(metadata)
    await db.flush()
    await db.refresh(metadata)
    return metadata


@router.post("/{patient_id}/photo", response_model=FileMetadataRead, status_code=status.HTTP_201_CREATED)
async def upload_photo(
    patient_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    file: Annotated[UploadFile, File()],
) -> FileMetadata:
    return await _upload(
        patient_id,
        file,
        FileType.photo,
        "Photos",
        IMAGE_MIMES,
        IMAGE_EXTS,
        db,
        current_user,
    )


@router.post("/{patient_id}/document", response_model=FileMetadataRead, status_code=status.HTTP_201_CREATED)
async def upload_document(
    patient_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    file: Annotated[UploadFile, File()],
) -> FileMetadata:
    return await _upload(
        patient_id,
        file,
        FileType.document,
        "Documents",
        DOCUMENT_MIMES,
        DOCUMENT_EXTS,
        db,
        current_user,
    )
