import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Clock, AlertTriangle, CheckCircle } from 'lucide-react'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { bookingApi } from '../../api/bookingApi'
import { serviceCategoryApi } from '../../api/serviceCategoryApi'
import { formatCurrency, estimatePrice, getInitials } from '../../utils/formatters'
import toast from 'react-hot-toast'

// Time options in 30-minute increments: 08:00 to 20:00
const TIME_OPTIONS = (() => {
  const opts = []
  for (let h = 8; h <= 20; h++) {
    opts.push(`${String(h).padStart(2, '0')}:00`)
    if (h < 20) opts.push(`${String(h).padStart(2, '0')}:30`)
  }
  return opts
})()

const TODAY = new Date().toISOString().split('T')[0]

export default function CreateBookingPage() {
  const navigate  = useNavigate()
  const { state } = useLocation()

  // Provider passed from ProviderProfilePage
  const provider = state?.provider

  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading]   = useState(false)

  const [form, setForm] = useState({
    providerProfileId:  provider?.providerProfileId || '',
    serviceCategoryId:  '',
    problemDescription: '',
    scheduledDate:      '',
    scheduledStartTime: '09:00',
    scheduledEndTime:   '11:00',
    isEmergency:        false,
  })

  // If provider has services, use them; otherwise fall back to all categories
  useEffect(() => {
    if (provider?.services?.length) {
      setCategories(provider.services.map((s) => ({
        id:   s.serviceCategoryId,
        name: s.serviceCategory?.name || s.description,
      })))
    } else {
      serviceCategoryApi.getAll()
        .then(({ data }) => setCategories(data))
        .catch(() => {})
    }
  }, [])

  // If no provider was passed, redirect back
  useEffect(() => {
    if (!provider) navigate('/customer/match')
  }, [])

  const set = (field) => (e) =>
    setForm((p) => ({ ...p, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  // Live price estimate — recalculates on every relevant field change
  const estimate = useMemo(() => estimatePrice(
    provider?.baseHourlyRate,
    form.scheduledStartTime,
    form.scheduledEndTime,
    form.scheduledDate,
    form.isEmergency,
  ), [form.scheduledStartTime, form.scheduledEndTime, form.scheduledDate, form.isEmergency, provider])

  const isValid =
    form.serviceCategoryId &&
    form.problemDescription.trim().length >= 10 &&
    form.scheduledDate &&
    form.scheduledStartTime < form.scheduledEndTime

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isValid) return
    setIsLoading(true)

    try {
      const payload = {
        ...form,
        scheduledStartTime: form.scheduledStartTime + ':00',
        scheduledEndTime:   form.scheduledEndTime   + ':00',
      }
      const { data } = await bookingApi.create(payload)
      toast.success('Booking created! The provider will confirm shortly.')
      navigate(`/customer/bookings/${data.id}`)
    } catch { /* error shown by interceptor */ }
    finally { setIsLoading(false) }
  }

  if (!provider) return null

  return (
    <DashboardLayout>
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-slate-500
                   hover:text-slate-800 mb-5 transition-colors"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <h1 className="text-2xl font-bold text-slate-900 mb-6">Book a Service</h1>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* ── Booking form ─────────────────────────────────────────── */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Provider info (read-only) */}
            <div className="card flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center
                              justify-center text-primary font-bold text-lg flex-shrink-0">
                {getInitials(provider.businessName)}
              </div>
              <div>
                <p className="font-semibold text-slate-900">{provider.businessName}</p>
                <p className="text-sm text-slate-500">{provider.providerName}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xs text-slate-400">Starting rate</p>
                <p className="font-semibold text-primary">
                  {formatCurrency(provider.baseHourlyRate)}/hr
                </p>
              </div>
            </div>

            {/* Service category */}
            <div className="card space-y-4">
              <h2 className="font-semibold text-slate-800">Service & Schedule</h2>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Service Type <span className="text-danger">*</span>
                </label>
                <select
                  value={form.serviceCategoryId}
                  onChange={set('serviceCategoryId')}
                  required
                  className="input-field"
                >
                  <option value="">Select a service...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Date <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  min={TODAY}
                  value={form.scheduledDate}
                  onChange={set('scheduledDate')}
                  required
                  className="input-field"
                />
              </div>

              {/* Time slots */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Start Time <span className="text-danger">*</span>
                  </label>
                  <select
                    value={form.scheduledStartTime}
                    onChange={set('scheduledStartTime')}
                    className="input-field"
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    End Time <span className="text-danger">*</span>
                  </label>
                  <select
                    value={form.scheduledEndTime}
                    onChange={set('scheduledEndTime')}
                    className="input-field"
                  >
                    {TIME_OPTIONS.filter((t) => t > form.scheduledStartTime).map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
              {form.scheduledStartTime >= form.scheduledEndTime && (
                <p className="text-xs text-danger">End time must be after start time.</p>
              )}
            </div>

            {/* Problem description */}
            <div className="card">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Describe your problem <span className="text-danger">*</span>
              </label>
              <textarea
                rows={4}
                value={form.problemDescription}
                onChange={set('problemDescription')}
                placeholder="e.g. My kitchen drain has been backing up since yesterday and water is pooling under the sink..."
                required
                minLength={10}
                className="input-field resize-none"
              />
              <p className="text-xs text-slate-400 mt-1">
                {form.problemDescription.trim().length}/500 characters (min. 10)
              </p>
            </div>

            {/* Emergency toggle */}
            <div className="card">
              <label className="flex items-start gap-3 cursor-pointer">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    checked={form.isEmergency}
                    onChange={set('isEmergency')}
                    className="sr-only"
                  />
                  <div className={`w-10 h-6 rounded-full transition-colors
                    ${form.isEmergency ? 'bg-danger' : 'bg-slate-200'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow absolute top-1
                      transition-transform ${form.isEmergency ? 'translate-x-5' : 'translate-x-1'}`} />
                  </div>
                </div>
                <div>
                  <p className="font-medium text-slate-800 flex items-center gap-2">
                    <AlertTriangle size={15} className="text-danger" />
                    Emergency booking
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Requires immediate attention — a 50% surcharge applies
                  </p>
                </div>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!isValid || isLoading}
              className="btn-primary flex items-center justify-center gap-2"
            >
              {isLoading
                ? <><LoadingSpinner size="sm" /> Creating booking...</>
                : <><CheckCircle size={17} /> Confirm Booking</>}
            </button>
          </form>
        </div>

        {/* ── Price estimate panel ──────────────────────────────────── */}
        <div className="space-y-4">
          <div className="card sticky top-24">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Clock size={16} className="text-primary" /> Price Estimate
            </h3>

            {estimate ? (
              <div className="space-y-2.5">
                <PriceRow
                  label={`Duration (${estimate.durationHours.toFixed(1)} hrs)`}
                  value={formatCurrency(estimate.baseAmount)}
                />
                {estimate.surcharges.map((s) => (
                  <PriceRow key={s} label={s} value="" className="text-xs text-orange-600" />
                ))}
                <hr className="border-slate-100" />
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">Total Estimate</span>
                  <span className="font-bold text-primary text-lg">
                    {formatCurrency(estimate.finalAmount)}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Exact amount confirmed after job completion. Payment is Cash on Delivery.
                </p>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400">
                <Clock size={28} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">Select date and time to see estimate</p>
              </div>
            )}
          </div>

          {/* COD info */}
          <div className="card bg-slate-50 border-slate-200">
            <p className="text-xs font-semibold text-slate-600 mb-1">💵 Cash on Delivery</p>
            <p className="text-xs text-slate-500">
              Pay the provider directly in cash after the job is done.
              A digital invoice is generated automatically.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

function PriceRow({ label, value, className = '' }) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <span className="text-sm text-slate-600">{label}</span>
      {value && <span className="text-sm font-medium text-slate-800">{value}</span>}
    </div>
  )
}