import { Search, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api, type Patient } from '../api/client'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { PatientCard } from '../components/PatientCard'

export default function SearchPatientPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next')
  const deleteMode = params.get('delete') === '1'
  const [query, setQuery] = useState('')
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Patient | null>(null)
  const [deleting, setDeleting] = useState(false)
  const title = useMemo(() => {
    if (deleteMode) return 'Delete Patient'
    if (next === 'photo') return 'Choose Patient for Photo'
    if (next === 'document') return 'Choose Patient for Document'
    return 'Search Patient'
  }, [deleteMode, next])

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setLoading(true)
      try {
        const response = await api.get<Patient[]>('/patients', {
          params: query ? { q: query } : undefined,
          signal: controller.signal,
        })
        setPatients(response.data)
      } catch {
        setPatients([])
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  function openPatient(patient: Patient) {
    if (deleteMode) {
      setSelected(patient)
      return
    }
    if (next === 'photo') {
      navigate(`/patients/${patient.id}/photo`)
      return
    }
    if (next === 'document') {
      navigate(`/patients/${patient.id}/document`)
      return
    }
    navigate(`/patients/${patient.id}`)
  }

  async function confirmDelete() {
    if (!selected) return
    setDeleting(true)
    try {
      await api.delete(`/patients/${selected.id}`)
      setPatients((items) => items.filter((item) => item.id !== selected.id))
      setSelected(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <section className="screen">
      <div className="page-heading">
        <h1>{title}</h1>
        <p>{deleteMode ? 'Pick the patient record to permanently remove.' : 'Search by name or Ayushman ID.'}</p>
      </div>
      <label className="search-field">
        <Search size={18} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name or Ayushman ID" autoFocus />
      </label>
      <div className="list">
        {loading ? <p className="muted">Searching...</p> : null}
        {!loading && patients.length === 0 ? <p className="muted">No patients found.</p> : null}
        {patients.map((patient) => (
          <PatientCard key={patient.id} patient={patient} onClick={() => openPatient(patient)} />
        ))}
      </div>
      {selected ? (
        <ConfirmDialog
          title="Delete patient?"
          message={`This will permanently delete ${selected.name}'s Drive folder and all files.`}
          confirmLabel="Delete"
          busy={deleting}
          onCancel={() => setSelected(null)}
          onConfirm={confirmDelete}
        />
      ) : null}
      {deleteMode ? (
        <div className="floating-mode">
          <Trash2 size={16} /> Delete mode
        </div>
      ) : null}
    </section>
  )
}
