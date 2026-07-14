import { useSelector } from 'react-redux'

// Maps integer enum values from database to frontend string roles
const ROLE_MAP = {
  0: 'Customer',
  1: 'Provider',
  2: 'Admin',
  '0': 'Customer',
  '1': 'Provider',
  '2': 'Admin',
  'Customer': 'Customer',
  'Provider': 'Provider',
  'Admin': 'Admin'
}

export function useAuth() {
  const { user, token, role, isLoading, error } = useSelector((s) => s.auth)

  // Normalize role to string regardless of how the database returned it
  const normalizedRole = ROLE_MAP[role] || role

  return {
    user,
    token,
    role: normalizedRole,
    isLoading,
    error,
    isLoggedIn:   !!token,
    isCustomer:   normalizedRole === 'Customer',
    isProvider:   normalizedRole === 'Provider',
    isAdmin:      normalizedRole === 'Admin',
  }
}