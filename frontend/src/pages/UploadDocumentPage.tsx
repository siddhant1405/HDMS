import { ArrowLeft, CheckCircle, FileUp, RefreshCw } from 'lucide-react'
import { useState, type ChangeEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { UploadProgress } from '../components/UploadProgress'

export default function UploadDocumentPage() {
  const { patientId } = useParams()
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null)
    setDone(false)
    setError('')
  }

  async function upload() {
    if (!patientId || !file) return
    if (!navigator.onLine) {
      setError('You are offline. Connect to the internet and try again.')
      return
    }
    const form = new FormData()
    form.append('file', file)
    setBusy(true)
    setError('')
    setProgress(0)
    try {
      await api.post(`/patients/${patientId}/document`, form, {
        onUploadProgress: (event) => {
          if (event.total) {
            setProgress(Math.round((event.loaded * 100) / event.total))
          }
        },
      })
      setDone(true)
    } catch {
      setError('Document upload failed. Check file type, Drive connection, and network.')
    } finally {
      setBusy(false)
    }
  }

  function resetForAnother() {
    setFile(null)
    setDone(false)
    setError('')
    setProgress(0)
  }

  return (
    <section className="screen">
      <div className="page-heading">
        <div>
          <button
            type="button"
            className="text-button"
            onClick={() => navigate(-1)}
            style={{ marginBottom: 6, gap: 4, fontSize: '0.88rem' }}
            id="back-btn"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <h1>Upload Document</h1>
          <p>PDF, JPG, or PNG &mdash; up to 25 MB.</p>
        </div>
      </div>

      {!done ? (
        <>
          <label className="file-picker" id="file-picker-label">
            <FileUp size={32} />
            <span style={{ fontWeight: 800 }}>
              {file ? file.name : 'Select document'}
            </span>
            {file ? (
              <span className="file-picker-name">{(file.size / 1024).toFixed(0)} KB</span>
            ) : (
              <span className="file-picker-name">PDF, JPG, or PNG</span>
            )}
            <input
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              onChange={chooseFile}
              id="document-file-input"
            />
          </label>
          {file ? (
            <button
              type="button"
              className="button primary full"
              onClick={upload}
              disabled={busy}
              id="upload-document-btn"
            >
              {busy ? <span className="spinner" /> : <FileUp size={18} />}
              {busy ? 'Uploading…' : 'Confirm upload'}
            </button>
          ) : null}
          {busy ? <UploadProgress value={progress} /> : null}
          {error ? <p className="form-error" style={{ marginTop: 10 }}>{error}</p> : null}
        </>
      ) : (
        <>
          <div className="success-panel">
            <CheckCircle size={22} />
            <span>Document uploaded successfully!</span>
            <Link to={`/patients/${patientId}`} id="view-patient-link">View patient</Link>
          </div>
          <div className="button-row" style={{ marginTop: 10 }}>
            <button
              type="button"
              className="button secondary"
              onClick={resetForAnother}
              id="another-document-btn"
            >
              <RefreshCw size={18} /> Another document
            </button>
            <Link className="button primary" to={`/patients/${patientId}`} id="go-to-patient-btn">
              Done
            </Link>
          </div>
        </>
      )}
    </section>
  )
}
