import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'

// When VITE_API_URL is empty (docker-compose dev with proxy) fall back to
// a relative path so the Vite dev server proxy forwards /api/* to the backend.
export const API_BASE_URL =
  import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== ''
    ? import.meta.env.VITE_API_URL
    : '/api/v1'

let accessToken: string | null = sessionStorage.getItem('hdms_access_token')
let onUnauthorized: (() => void) | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
  if (token) {
    sessionStorage.setItem('hdms_access_token', token)
  } else {
    sessionStorage.removeItem('hdms_access_token')
  }
}

export function getAccessToken() {
  return accessToken
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined
    const isRefresh = original?.url?.includes('/refresh')
    if (error.response?.status === 401 && original && !original._retry && !isRefresh) {
      original._retry = true
      try {
        const refresh = await api.post<{ access_token: string }>('/refresh')
        setAccessToken(refresh.data.access_token)
        original.headers.Authorization = `Bearer ${refresh.data.access_token}`
        return api(original)
      } catch {
        setAccessToken(null)
        onUnauthorized?.()
      }
    }
    return Promise.reject(error)
  },
)

export type User = {
  id: number
  email: string
  google_account_email: string | null
  created_at: string
}

export type FileMetadata = {
  id: number
  patient_id: number
  drive_file_id: string
  filename: string
  type: 'photo' | 'document'
  uploaded_at: string
  uploaded_by: number
}

export type Patient = {
  id: number
  name: string
  ayushman_id: string
  age: number
  gender: string
  drive_folder_id: string | null
  created_by: number
  created_at: string
  files: FileMetadata[]
}
