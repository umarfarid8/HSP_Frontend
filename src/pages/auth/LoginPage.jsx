import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { GoogleLogin } from '@react-oauth/google'
import toast from 'react-hot-toast'
import { loginUser, googleLogin } from '../../store/authSlice'
import { useAuth } from '../../hooks/useAuth'
import LoadingSpinner from '../../components/common/LoadingSpinner'

export default function LoginPage() {
  const dispatch  = useDispatch()
  const navigate  = useNavigate()
  const { isLoggedIn, role, isLoading } = useAuth()

  const [form, setForm] = useState({ email: '', password: '' })

  // If already logged in, redirect to the right dashboard
  useEffect(() => {
    if (isLoggedIn) {
      const routes = { Customer: '/customer/dashboard', Provider: '/provider/dashboard', Admin: '/admin/dashboard' }
      navigate(routes[role] || '/')
    }
  }, [isLoggedIn, role, navigate])

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await dispatch(loginUser(form))
    if (loginUser.fulfilled.match(result)) {
      toast.success(`Welcome back, ${result.payload.fullName}!`)
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    const result = await dispatch(googleLogin({ idToken: credentialResponse.credential }))
    if (googleLogin.fulfilled.match(result)) {
      toast.success(`Welcome, ${result.payload.fullName}!`)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12
                          bg-primary rounded-xl mb-4">
            <span className="text-white text-xl">🏠</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Home Service Provider</h1>
          <p className="text-slate-500 text-sm mt-1">Sign in to your account</p>
        </div>

        <div className="card">

          {/* Email + Password form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="input-field"
              />
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary">
              {isLoading ? <LoadingSpinner size="sm" /> : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <hr className="flex-1 border-slate-200" />
            <span className="text-xs text-slate-400 font-medium">OR</span>
            <hr className="flex-1 border-slate-200" />
          </div>

          {/* Google Sign-In */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error('Google sign-in failed. Try again.')}
              text="continue_with"
              shape="rectangular"
              width="368"
            />
          </div>

          {/* Register link */}
          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Create one
            </Link>
          </p>

        </div>
      </div>
    </div>
  )
}