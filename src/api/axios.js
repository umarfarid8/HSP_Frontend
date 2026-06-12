import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request Interceptor ───────────────────────────────────────────────────────
// Automatically attach the JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hsp_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response Interceptor ──────────────────────────────────────────────────────
// Handle errors globally so individual API calls stay clean
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'Something went wrong.'

    if (error.response?.status === 401) {
      // Token expired or invalid — clear session and redirect
      localStorage.removeItem('hsp_token')
      localStorage.removeItem('hsp_user')
      window.location.href = '/login'
      return Promise.reject(error)
    }

    if (error.response?.status === 403) {
      toast.error('You do not have permission to do this.')
      return Promise.reject(error)
    }

    // Show the backend error message for all other errors
    toast.error(message)
    return Promise.reject(error)
  }
)

export default api