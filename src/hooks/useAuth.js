import { useSelector } from 'react-redux'

// Clean hook — use this in any component instead of reaching into Redux directly
export function useAuth() {
  const { user, token, role, isLoading, error } = useSelector((s) => s.auth)

  return {
    user,
    token,
    role,
    isLoading,
    error,
    isLoggedIn:   !!token,
    isCustomer:   role === 'Customer',
    isProvider:   role === 'Provider',
    isAdmin:      role === 'Admin',
  }
}