import { Activity, LogIn } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) {
    return <Navigate to="/" replace />
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await login(email, password)
      const next = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/'
      navigate(next, { replace: true })
    } catch {
      setError('Invalid email or password.')
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
        <h1>Welcome back</h1>
        <p>Sign in to upload patient photos and documents to Google Drive.</p>
        <form onSubmit={submit} className="form" style={{ marginTop: 20 }}>
          <label>
            Email address
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              id="login-email"
              placeholder="staff@hospital.in"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              id="login-password"
              placeholder="••••••••"
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button type="submit" className="button primary full" disabled={busy} id="login-submit-btn">
            {busy ? <span className="spinner" /> : <LogIn size={18} />}
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <Link className="text-link" to="/register" style={{ marginTop: 12 }}>
          Create a staff account →
        </Link>
      </section>
    </main>
  )
}
