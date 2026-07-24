import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import toast from 'react-hot-toast'
import { registerCustomer, registerProvider } from '../../store/authSlice'
import { useAuth } from '../../hooks/useAuth'
import { serviceCategoryApi } from '../../api/serviceCategoryApi'
import LoadingSpinner from '../../components/common/LoadingSpinner'

export default function RegisterPage() {
  const dispatch  = useDispatch()
  const navigate  = useNavigate()
  const { isLoading } = useAuth()

  const [role, setRole] = useState('Customer')
  const [categories, setCategories] = useState([])
  const [isFetchingCategories, setIsFetchingCategories] = useState(false)

  const [form, setForm] = useState({
    fullName: '', email: '', password: '', phoneNumber: '',
    city: '', address: '', businessName: '', bio: '',
    cnic: '', baseHourlyRate: '', serviceAreaRadiusKm: 10,
    latitude: 0, longitude: 0, serviceCategoryId: ''
  })

  // Fetch active service categories registered by admin when Provider role is selected
  useEffect(() => {
    if (role === 'Provider' && categories.length === 0) {
      setIsFetchingCategories(true)
      serviceCategoryApi.getAll()
        .then(({ data }) => setCategories(data || []))
        .catch(() => toast.error('Failed to load service categories'))
        .finally(() => setIsFetchingCategories(false))
    }
  }, [role, categories.length])

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (role === 'Provider' && !form.serviceCategoryId) {
      toast.error('Please select a primary service category.')
      return
    }

    // ── Create a clean, role-specific payload ──
    const payload = role === 'Customer' 
      ? {
          fullName: form.fullName,
          email: form.email,
          password: form.password,
          phoneNumber: form.phoneNumber,
          city: form.city,
          address: form.address
        }
      : {
          fullName: form.fullName,
          email: form.email,
          password: form.password,
          phoneNumber: form.phoneNumber,
          city: form.city,
          businessName: form.businessName,
          bio: form.bio,
          cnic: form.cnic,
          baseHourlyRate: Number(form.baseHourlyRate) || 0,
          serviceAreaRadiusKm: Number(form.serviceAreaRadiusKm) || 10,
          latitude: Number(form.latitude) || 0,
          longitude: Number(form.longitude) || 0,
          serviceCategoryId: form.serviceCategoryId
        };

    const action = role === 'Customer' ? registerCustomer : registerProvider
    const result = await dispatch(action(payload))

    if (action.fulfilled.match(result)) {
      toast.success('Account created! Please verify your email.')
      navigate(role === 'Customer' ? '/customer/dashboard' : '/provider/dashboard')
    } else {
      toast.error(result.payload || 'Registration failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-xl mb-4">
            <span className="text-white text-xl">🏠</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Create an Account</h1>
          <p className="text-slate-500 text-sm mt-1">Join Home Service Provider</p>
        </div>

        <div className="card">

          {/* Role Selector */}
          <div className="flex bg-slate-100 rounded-lg p-1 mb-6">
            {['Customer', 'Provider'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors
                  ${role === r
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'}`}
              >
                {r === 'Customer' ? '👤 I need services' : '🔧 I provide services'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Common fields */}
            <FormField label="Full Name" name="fullName"
              value={form.fullName} onChange={handleChange} required />
            <FormField label="Email" name="email" type="email"
              value={form.email} onChange={handleChange} required />
            <FormField label="Password" name="password" type="password"
              value={form.password} onChange={handleChange} required
              placeholder="At least 8 characters" />
            <FormField label="Phone Number" name="phoneNumber"
              value={form.phoneNumber} onChange={handleChange}
              placeholder="03XXXXXXXXX" required />
            <FormField label="City" name="city"
              value={form.city} onChange={handleChange} required />

            {/* Customer-only fields */}
            {role === 'Customer' && (
              <FormField label="Address" name="address"
                value={form.address} onChange={handleChange} required />
            )}

            {/* Provider-only fields */}
            {role === 'Provider' && (
              <>
                <FormField label="Business Name" name="businessName"
                  value={form.businessName} onChange={handleChange} required />
                
                {/* Service Category Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Primary Service Category *
                  </label>
                  {isFetchingCategories ? (
                    <div className="p-2 text-xs text-slate-400">Loading admin-registered services...</div>
                  ) : (
                    <select
                      name="serviceCategoryId"
                      value={form.serviceCategoryId}
                      onChange={handleChange}
                      className="input-field"
                      required
                    >
                      <option value="">-- Select a Service --</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={form.bio}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Describe your experience and expertise..."
                    className="input-field resize-none"
                    required
                  />
                </div>

                <FormField label="CNIC" name="cnic"
                  value={form.cnic} onChange={handleChange}
                  placeholder="12345-1234567-1" required />
                
                <FormField label="Base Hourly Rate (PKR)" name="baseHourlyRate"
                  type="number" value={form.baseHourlyRate}
                  onChange={handleChange} required />

                <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3">
                  📋 Your account will be reviewed by our team before you can accept bookings.
                  Please upload your CNIC and trade license after registration.
                </p>
              </>
            )}

            <button type="submit" disabled={isLoading} className="btn-primary mt-2 w-full flex justify-center py-2">
              {isLoading
                ? <LoadingSpinner size="sm" />
                : `Create ${role} Account`}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>

        </div>
      </div>
    </div>
  )
}

function FormField({ label, name, type = 'text', value, onChange, placeholder, required }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="input-field"
      />
    </div>
  )
}