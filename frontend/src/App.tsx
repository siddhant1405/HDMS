import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { BottomNav } from './components/BottomNav'
import { AuthProvider, useAuth } from './context/AuthContext'
import './App.css'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const ConnectDrivePage = lazy(() => import('./pages/ConnectDrivePage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const AddPatientPage = lazy(() => import('./pages/AddPatientPage'))
const SearchPatientPage = lazy(() => import('./pages/SearchPatientPage'))
const PatientProfilePage = lazy(() => import('./pages/PatientProfilePage'))
const CapturePhotoPage = lazy(() => import('./pages/CapturePhotoPage'))
const UploadDocumentPage = lazy(() => import('./pages/UploadDocumentPage'))

function OfflineBanner() {
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const markOnline = () => setOnline(true)
    const markOffline = () => setOnline(false)
    window.addEventListener('online', markOnline)
    window.addEventListener('offline', markOffline)
    return () => {
      window.removeEventListener('online', markOnline)
      window.removeEventListener('offline', markOffline)
    }
  }, [])
  return online ? null : (
    <div className="offline-banner" role="alert">
      ⚠️ You are offline — uploads need a network connection.
    </div>
  )
}

function LoadingFallback() {
  return (
    <main className="screen center-screen">
      <span className="spinner spinner-primary" style={{ width: 28, height: 28, borderWidth: 3 }} />
    </main>
  )
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) {
    return <LoadingFallback />
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return children
}

function AppRoutes() {
  return (
    <>
      <OfflineBanner />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <main className="app-shell">
                  <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/connect-drive" element={<ConnectDrivePage />} />
                    <Route path="/patients/new" element={<AddPatientPage />} />
                    <Route path="/search" element={<SearchPatientPage />} />
                    <Route path="/patients/:patientId" element={<PatientProfilePage />} />
                    <Route path="/patients/:patientId/photo" element={<CapturePhotoPage />} />
                    <Route path="/patients/:patientId/document" element={<UploadDocumentPage />} />
                  </Routes>
                </main>
                <BottomNav />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
