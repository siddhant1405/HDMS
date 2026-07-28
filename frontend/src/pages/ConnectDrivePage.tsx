import { Cloud, ShieldCheck, Check } from 'lucide-react'
import { getAccessToken } from '../api/client'
import { useAuth } from '../context/AuthContext'

// The Google OAuth redirect must go to the backend, not through the Vite proxy.
// We fall back to localhost:8000 for local dev if VITE_API_URL is unset.
const BACKEND_API =
  import.meta.env.VITE_BACKEND_URL
    ? `${import.meta.env.VITE_BACKEND_URL}/api/v1`
    : import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== ''
      ? import.meta.env.VITE_API_URL
      : 'http://localhost:8000/api/v1'

export default function ConnectDrivePage() {
  const { user } = useAuth()
  const connected = Boolean(user?.google_account_email)

  function connect() {
    const token = getAccessToken()
    if (token) {
      window.location.href = `${BACKEND_API}/google/login?token=${encodeURIComponent(token)}`
    }
  }

  return (
    <section className="screen">
      <div className="page-heading">
        <span className="heading-icon">
          <Cloud size={22} />
        </span>
        <div>
          <h1>Connect Google Drive</h1>
          <p>{connected ? `Connected as ${user?.google_account_email}` : 'Required before patient folders and uploads can be created.'}</p>
        </div>
      </div>
      <div className="notice-panel">
        <ShieldCheck size={24} />
        <p>HDMS requests Drive file access only. Files are stored in patient folders created by this app.</p>
      </div>
      {connected ? (
        <div className="success-panel">
          <Check size={22} />
          <span>Drive connected as <strong>{user?.google_account_email}</strong></span>
        </div>
      ) : null}
      <button
        type="button"
        className="button primary full"
        onClick={connect}
        disabled={connected}
        id="connect-drive-btn"
      >
        <Cloud size={18} /> {connected ? 'Drive connected' : 'Connect Drive'}
      </button>
    </section>
  )
}
