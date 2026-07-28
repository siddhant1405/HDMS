import { Camera, Download, FileUp, Heart, Search, Trash2, UserPlus, Wifi } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    function onPrompt(event: Event) {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  async function installApp() {
    if (!installPrompt) return
    await installPrompt.prompt()
    await installPrompt.userChoice
    setInstallPrompt(null)
  }

  const driveConnected = Boolean(user?.google_account_email)

  return (
    <section className="screen dashboard">
      <header className="dashboard-header">
        <div>
          <h1>HDMS</h1>
          <p>
            {driveConnected ? (
              <>
                <Wifi size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                {user?.google_account_email}
              </>
            ) : (
              'Drive not connected'
            )}
          </p>
        </div>
        <button type="button" className="text-button" onClick={logout} id="logout-btn">
          Logout
        </button>
      </header>

      {!driveConnected ? (
        <Link className="drive-banner" to="/connect-drive" id="connect-drive-banner">
          <Heart size={18} />
          Connect Google Drive to enable patient folders and uploads →
        </Link>
      ) : null}

      <div className="action-grid">
        <Link className="action-card" to="/patients/new" id="action-add-patient">
          <span className="action-card-icon"><UserPlus size={22} /></span>
          Add Patient
        </Link>
        <Link className="action-card" to="/search" id="action-search">
          <span className="action-card-icon"><Search size={22} /></span>
          Search Patient
        </Link>
        <Link className="action-card" to="/search?next=photo" id="action-photo">
          <span className="action-card-icon"><Camera size={22} /></span>
          Click Photo
        </Link>
        <Link className="action-card" to="/search?next=document" id="action-document">
          <span className="action-card-icon"><FileUp size={22} /></span>
          Upload Document
        </Link>
        <Link className="action-card danger-card" to="/search?delete=1" id="action-delete">
          <span className="action-card-icon"><Trash2 size={22} /></span>
          Delete Patient
        </Link>
      </div>

      {installPrompt ? (
        <div className="install-button-wrap">
          <button type="button" className="button secondary full" onClick={installApp} id="install-app-btn">
            <Download size={18} /> Install App on Device
          </button>
        </div>
      ) : null}
    </section>
  )
}
