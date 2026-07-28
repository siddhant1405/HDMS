import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, getAccessToken, setAccessToken, setUnauthorizedHandler, type User } from '../api/client'

type AuthContextValue = {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  reloadUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [token, setTokenState] = useState<string | null>(getAccessToken())
  const [loading, setLoading] = useState(true)

  const applyToken = useCallback((nextToken: string | null) => {
    setAccessToken(nextToken)
    setTokenState(nextToken)
  }, [])

  const reloadUser = useCallback(async () => {
    const response = await api.get<User>('/me')
    setUser(response.data)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null)
      setTokenState(null)
      navigate('/login', { replace: true })
    })
    return () => setUnauthorizedHandler(null)
  }, [navigate])

  useEffect(() => {
    async function bootstrap() {
      try {
        if (!getAccessToken()) {
          const response = await api.post<{ access_token: string }>('/refresh')
          applyToken(response.data.access_token)
        }
        if (getAccessToken()) {
          await reloadUser()
        }
      } catch {
        applyToken(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    void bootstrap()
  }, [applyToken, reloadUser])

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await api.post<{ access_token: string }>('/login', { email, password })
      applyToken(response.data.access_token)
      await reloadUser()
    },
    [applyToken, reloadUser],
  )

  const register = useCallback(
    async (email: string, password: string) => {
      const response = await api.post<{ access_token: string }>('/register', { email, password })
      applyToken(response.data.access_token)
      await reloadUser()
    },
    [applyToken, reloadUser],
  )

  const logout = useCallback(async () => {
    await api.post('/logout').catch(() => undefined)
    applyToken(null)
    setUser(null)
    navigate('/login', { replace: true })
  }, [applyToken, navigate])

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout, reloadUser }),
    [user, token, loading, login, register, logout, reloadUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return value
}
