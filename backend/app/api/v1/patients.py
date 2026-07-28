from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.deps import get_current_user
from app.db.models.patient import Patient
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.patient import PatientCreate, PatientRead
from app.services.google_drive import GoogleDriveService

router = APIRouter(prefix="/patients", tags=["patients"])


def _patient_options():
    return selectinload(Patient.files)


@router.get("", response_model=list[PatientRead])
async def list_patients(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    q: Annotated[str | None, Query(max_length=120)] = None,
) -> list[Patient]:
    del current_user
    stmt = select(Patient).options(_patient_options()).order_by(Patient.created_at.desc())
    if q:
        needle = f"%{q.strip()}%"
        stmt = stmt.where(or_(Patient.name.ilike(needle), Patient.ayushman_id.ilike(needle)))
    return list((await db.scalars(stmt)).unique().all())


@router.post("", response_model=PatientRead, status_code=status.HTTP_201_CREATED)
async def create_patient(
    payload: PatientCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> Patient:
    drive = GoogleDriveService(current_user)
    folders = drive.create_patient_folder_structure(f"{payload.name} - {payload.ayushman_id}")
    patient = Patient(
        name=payload.name.strip(),
        ayushman_id=payload.ayushman_id.strip(),
        age=payload.age,
        gender=payload.gender,
        drive_folder_id=folders["patient_folder_id"],
        created_by=current_user.id,
    )
    db.add(patient)
    try:
        await db.flush()
    except IntegrityError as exc:
        drive.delete_folder(folders["patient_folder_id"])
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ayushman ID already exists",
        ) from exc
    except Exception:
        drive.delete_folder(folders["patient_folder_id"])
        raise
    await db.refresh(patient, attribute_names=["files"])
    return patient


@router.get("/{patient_id}", response_model=PatientRead)
async def get_patient(
    patient_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> Patient:
    del current_user
    patient = await db.scalar(
        select(Patient).options(_patient_options()).where(Patient.id == patient_id)
    )
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    return patient


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_patient(
    patient_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> None:
    patient = await db.scalar(select(Patient).where(Patient.id == patient_id))
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    if patient.drive_folder_id:
        GoogleDriveService(current_user).delete_folder(patient.drive_folder_id)
    await db.delete(patient)
