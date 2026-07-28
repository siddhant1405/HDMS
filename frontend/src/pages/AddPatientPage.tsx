import { ArrowLeft, Cloud, Save } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, type Patient } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function AddPatientPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [ayushmanId, setAyushmanId] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('female')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const response = await api.post<Patient>('/patients', {
        name,
        ayushman_id: ayushmanId,
        age: Number(age),
        gender,
      })
      navigate(`/patients/${response.data.id}`)
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      if (detail?.toLowerCase().includes('ayushman')) {
        setError('Ayushman ID already exists. Check the ID and try again.')
      } else {
        setError('Could not add patient. Check Drive connection and try again.')
      }
    } finally {
      setBusy(false)
    }
  }

  if (!user?.google_account_email) {
    return (
      <section className="screen">
        <h1>Add Patient</h1>
        <div className="notice-panel" style={{ marginTop: 16 }}>
          <Cloud size={22} />
          <p>Connect Google Drive before creating patient folders.</p>
        </div>
        <Link className="button primary full" to="/connect-drive" id="go-connect-drive-btn">
          Connect Drive
        </Link>
      </section>
    )
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
      <div className="page-heading">
        <div>
          <h1>Add Patient</h1>
          <p>A Drive folder is created automatically when you save.</p>
        </div>
      </div>
      <form className="form" onSubmit={submit}>
        <label>
          Patient name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            minLength={2}
            id="patient-name-input"
            placeholder="e.g. Priya Sharma"
          />
        </label>
        <label>
          Ayushman ID
          <input
            value={ayushmanId}
            onChange={(event) => setAyushmanId(event.target.value)}
            required
            minLength={3}
            id="ayushman-id-input"
            placeholder="e.g. AB-12345678"
          />
        </label>
        <label>
          Age
          <input
            type="number"
            min={0}
            max={125}
            value={age}
            onChange={(event) => setAge(event.target.value)}
            required
            id="age-input"
            placeholder="e.g. 42"
          />
        </label>
        <label>
          Gender
          <select value={gender} onChange={(event) => setGender(event.target.value)} id="gender-select">
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </select>
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <button type="submit" className="button primary" disabled={busy} id="save-patient-btn">
          {busy ? <span className="spinner" /> : <Save size={18} />}
          {busy ? 'Creating Drive folder…' : 'Save patient'}
        </button>
      </form>
    </section>
  )
}
