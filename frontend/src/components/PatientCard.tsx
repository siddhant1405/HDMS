import { FileText, Image, UserRound } from 'lucide-react'
import type { Patient } from '../api/client'

export function PatientCard({ patient, onClick }: { patient: Patient; onClick: () => void }) {
  const photos = patient.files.filter((file) => file.type === 'photo').length
  const documents = patient.files.filter((file) => file.type === 'document').length
  return (
    <button type="button" className="patient-card" onClick={onClick}>
      <span className="avatar" aria-hidden="true">
        <UserRound size={20} />
      </span>
      <span className="patient-card-main">
        <strong>{patient.name}</strong>
        <small>
          {patient.ayushman_id} &middot; {patient.age} yrs &middot; {patient.gender}
        </small>
      </span>
      <span className="patient-counts" aria-label={`${photos} photos and ${documents} documents`}>
        <Image size={14} /> {photos}
        <FileText size={14} /> {documents}
      </span>
    </button>
  )
}
