from io import BytesIO

from fastapi import HTTPException, status
from google.auth.exceptions import RefreshError
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaIoBaseUpload

from app.core.config import get_settings
from app.core.security import decrypt_secret
from app.db.models.user import User

settings = get_settings()
DRIVE_FILE_SCOPE = "https://www.googleapis.com/auth/drive.file"
FOLDER_MIME = "application/vnd.google-apps.folder"


class GoogleDriveService:
    def __init__(self, user: User):
        if not user.google_refresh_token:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Google Drive is not connected",
            )
        refresh_token = decrypt_secret(user.google_refresh_token)
        credentials = Credentials(
            token=None,
            refresh_token=refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
            scopes=[DRIVE_FILE_SCOPE],
        )
        try:
            self.client = build("drive", "v3", credentials=credentials, cache_discovery=False)
        except RefreshError as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Google Drive connection expired. Please reconnect Drive.",
            ) from exc

    def _execute(self, request):
        try:
            return request.execute()
        except RefreshError as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Google Drive connection expired. Please reconnect Drive.",
            ) from exc
        except HttpError as exc:
            detail = "Google Drive request failed"
            if exc.resp.status in (401, 403):
                detail = "Google Drive authorization failed. Please reconnect Drive."
            raise HTTPException(status_code=exc.resp.status, detail=detail) from exc

    def _find_folder(self, name: str, parent_id: str | None = None) -> str | None:
        escaped = name.replace("'", "\\'")
        query = [
            f"name = '{escaped}'",
            f"mimeType = '{FOLDER_MIME}'",
            "trashed = false",
        ]
        if parent_id:
            query.append(f"'{parent_id}' in parents")
        response = self._execute(
            self.client.files()
            .list(q=" and ".join(query), fields="files(id, name)", spaces="drive", pageSize=1)
        )
        files = response.get("files", [])
        return files[0]["id"] if files else None

    def _create_folder(self, name: str, parent_id: str | None = None) -> str:
        body = {"name": name, "mimeType": FOLDER_MIME}
        if parent_id:
            body["parents"] = [parent_id]
        folder = self._execute(self.client.files().create(body=body, fields="id"))
        return folder["id"]

    def ensure_child_folder(self, parent_id: str, name: str) -> str:
        return self._find_folder(name, parent_id) or self._create_folder(name, parent_id)

    def create_patient_folder_structure(self, patient_name: str) -> dict[str, str]:
        root_id = self._find_folder("Patients") or self._create_folder("Patients")
        patient_folder_id = self._create_folder(patient_name, root_id)
        photos_folder_id = self._create_folder("Photos", patient_folder_id)
        documents_folder_id = self._create_folder("Documents", patient_folder_id)
        return {
            "patient_folder_id": patient_folder_id,
            "photos_folder_id": photos_folder_id,
            "documents_folder_id": documents_folder_id,
        }

    def upload_file(self, folder_id: str, file_bytes: bytes, filename: str, mimetype: str) -> str:
        media = MediaIoBaseUpload(BytesIO(file_bytes), mimetype=mimetype, resumable=False)
        body = {"name": filename, "parents": [folder_id]}
        file = self._execute(
            self.client.files().create(body=body, media_body=media, fields="id")
        )
        return file["id"]

    def delete_folder(self, folder_id: str) -> None:
        self._execute(self.client.files().delete(fileId=folder_id))
