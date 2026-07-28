import { ArrowLeft, CheckCircle, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { CameraCapture } from '../components/CameraCapture'
import { UploadProgress } from '../components/UploadProgress'

export default function CapturePhotoPage() {
  const { patientId } = useParams()
  const navigate = useNavigate()
  const [progress, setProgress] = useState(0)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [captureKey, setCaptureKey] = useState(0)

  async function upload(file: File) {
    if (!patientId) return
    if (!navigator.onLine) {
      setError('You are offline. Connect to the internet and try again.')
      return
    }
    const form = new FormData()
    form.append('file', file)
    setBusy(true)
    setError('')
    setDone(false)
    setProgress(0)
    try {
      await api.post(`/patients/${patientId}/photo`, form, {
        onUploadProgress: (event) => {
          if (event.total) {
            setProgress(Math.round((event.loaded * 100) / event.total))
          }
        },
      })
      setDone(true)
    } catch {
      setError('Photo upload failed. Reconnect Drive or try again.')
    } finally {
      setBusy(false)
    }
  }

  function resetForNewPhoto() {
    setDone(false)
    setError('')
    setProgress(0)
    setCaptureKey((k) => k + 1)
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
          <h1>Click Photo</h1>
          <p>Capture, review, and confirm upload to Drive.</p>
        </div>
      </div>
      {!done ? (
        <CameraCapture key={captureKey} busy={busy} onConfirm={upload} />
      ) : null}
      {busy ? <UploadProgress value={progress} /> : null}
      {error ? <p className="form-error" style={{ marginTop: 10 }}>{error}</p> : null}
      {done ? (
        <>
          <div className="success-panel">
            <CheckCircle size={22} />
            <span>Photo uploaded successfully!</span>
            <Link to={`/patients/${patientId}`} id="view-patient-link">View patient</Link>
          </div>
          <div className="button-row" style={{ marginTop: 10 }}>
            <button
              type="button"
              className="button secondary"
              onClick={resetForNewPhoto}
              id="another-photo-btn"
            >
              <RefreshCw size={18} /> Another photo
            </button>
            <Link className="button primary" to={`/patients/${patientId}`} id="go-to-patient-btn">
              Done
            </Link>
          </div>
        </>
      ) : null}
    </section>
  )
}
