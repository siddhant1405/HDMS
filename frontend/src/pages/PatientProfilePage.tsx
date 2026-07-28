import { ArrowLeft, Camera, FileText, FileUp, Image, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, type FileMetadata, type Patient } from '../api/client'
import { ConfirmDialog } from '../components/ConfirmDialog'

function FileRow({ file }: { file: FileMetadata }) {
  const isPhoto = file.type === 'photo'
  return (
    <li className="file-row">
      <span className={`file-row-icon ${isPhoto ? 'photo-icon' : 'doc-icon'}`}>
        {isPhoto ? <Image size={18} /> : <FileText size={18} />}
      </span>
      <span>
        <strong>{file.filename}</strong>
        <small>{new Date(file.uploaded_at).toLocaleString()}</small>
      </span>
    </li>
  )
}

export default function PatientProfilePage() {
  const { patientId } = useParams()
  const navigate = useNavigate()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function load() {
      if (!patientId) return
      setLoading(true)
      try {
        const response = await api.get<Patient>(`/patients/${patientId}`)
        setPatient(response.data)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [patientId])

  const photos = useMemo(() => patient?.files.filter((file) => file.type === 'photo') ?? [], [patient])
  const documents = useMemo(() => patient?.files.filter((file) => file.type === 'document') ?? [], [patient])

  async function deletePatient() {
    if (!patient) return
    setDeleting(true)
    try {
      await api.delete(`/patients/${patient.id}`)
      navigate('/', { replace: true })
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <section className="screen center-screen">
        <span className="spinner spinner-primary" style={{ width: 28, height: 28, borderWidth: 3 }} />
        Loading patient…
      </section>
    )
  }
  if (!patient) {
    return <section className="screen center-screen">Patient not found.</section>
  }

  return (
    <section className="screen">
      <button
        type="button"
        className="text-button"
        onClick={() => navigate(-1)}
        style={{ marginBottom: 12, gap: 4, fontSize: '0.88rem' }}
        id="back-btn"
      >
        <ArrowLeft size={16} /> Back
      </button>
      <div className="profile-head">
        <div>
          <h1>{patient.name}</h1>
          <div className="profile-badge">
            <span className="badge primary-badge">{patient.ayushman_id}</span>
            <span className="badge">{patient.age} yrs</span>
            <span className="badge" style={{ textTransform: 'capitalize' }}>{patient.gender}</span>
          </div>
        </div>
        <button
          type="button"
          className="icon-button danger"
          onClick={() => setConfirmOpen(true)}
          aria-label="Delete patient"
          id="delete-patient-btn"
        >
          <Trash2 size={20} />
        </button>
      </div>

      <div className="button-row">
        <Link className="button primary" to={`/patients/${patient.id}/photo`} id="click-photo-btn">
          <Camera size={18} /> Click Photo
        </Link>
        <Link className="button secondary" to={`/patients/${patient.id}/document`} id="upload-doc-btn">
          <FileUp size={18} /> Upload Doc
        </Link>
      </div>

      <section className="file-section">
        <div className="file-section-header">
          <h2>Photos</h2>
          <span className="badge">{photos.length}</span>
        </div>
        {photos.length ? (
          <ul>{photos.slice(0, 8).map((file) => <FileRow key={file.id} file={file} />)}</ul>
        ) : (
          <p className="muted">No photos yet.</p>
        )}
      </section>

      <section className="file-section">
        <div className="file-section-header">
          <h2>Documents</h2>
          <span className="badge">{documents.length}</span>
        </div>
        {documents.length ? (
          <ul>{documents.slice(0, 8).map((file) => <FileRow key={file.id} file={file} />)}</ul>
        ) : (
          <p className="muted">No documents yet.</p>
        )}
      </section>

      {confirmOpen ? (
        <ConfirmDialog
          title="Delete patient?"
          message={`This will permanently delete ${patient.name}'s Drive folder and ALL files inside it. This cannot be undone.`}
          confirmLabel="Delete permanently"
          busy={deleting}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={deletePatient}
        />
      ) : null}
    </section>
  )
}
