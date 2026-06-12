import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

// Usage:
// <ProtectedRoute role="Customer"> <CustomerDashboard /> </ProtectedRoute>
// <ProtectedRoute>                 <AnyLoggedInPage />   </ProtectedRoute>

export default function ProtectedRoute({ children, role }) {
  const { isLoggedIn, role: userRole } = useAuth()

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  if (role && userRole !== role) {
    // Logged in but wrong role — redirect to their own dashboard
    const dashboardMap = {
      Customer: '/customer/dashboard',
      Provider: '/provider/dashboard',
      Admin:    '/admin/dashboard',
    }
    return <Navigate to={dashboardMap[userRole] || '/login'} replace />
  }

  return children
}