import { Activity, UserPlus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await register(email, password)
      navigate('/connect-drive', { replace: true })
    } catch {
      setError('Could not create that account. The email may already be registered.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-panel">
        <div className="auth-logo">
          <div className="auth-logo-mark">
            <Activity size={22} />
          </div>
          <div className="auth-logo-text">
            HDMS
            <small>Hospital Patient Documentation</small>
          </div>
        </div>
        <h1>Create staff account</h1>
        <p>Use a shared hospital email only if your local process allows it.</p>
        <form onSubmit={submit} className="form" style={{ marginTop: 20 }}>
          <label>
            Email address
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              id="register-email"
              placeholder="staff@hospital.in"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              id="register-password"
              placeholder="At least 8 characters"
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button type="submit" className="button primary full" disabled={busy} id="register-submit-btn">
            {busy ? <span className="spinner" /> : <UserPlus size={18} />}
            {busy ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <Link className="text-link" to="/login" style={{ marginTop: 12 }}>
          ← Back to sign in
        </Link>
      </section>
    </main>
  )
}
