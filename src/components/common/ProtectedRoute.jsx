import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function ProtectedRoute({ children, role }) {
  const { isLoggedIn, role: userRole } = useAuth()

  // 1. If the user is not authenticated at all, redirect to the login page
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  // 2. If a specific role is required and the user doesn't possess it, redirect to their home dashboard
  if (role && userRole !== role) {
    const dashboardMap = {
      Customer: '/customer/dashboard',
      Provider: '/provider/dashboard',
      Admin:    '/admin/dashboard',
    }
    return <Navigate to={dashboardMap[userRole] || '/login'} replace />
  }

  // 3. Otherwise, render the requested page components securely
  return children
}