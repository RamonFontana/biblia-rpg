import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export function ProtectedRoute() {
  const { session } = useAuthStore()

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
