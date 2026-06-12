import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Plus } from 'lucide-react'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { useAuth } from '../../hooks/useAuth'
import { bookingApi } from '../../api/bookingApi'
import { formatDate, formatCurrency } from '../../utils/formatters'

const FILTERS = [
  { label: 'All',        value: 'all' },
  { label: 'Pending',    value: 'Pending' },
  { label: 'Active',     value: 'active' },  // Confirmed + InProgress
  { label: 'Completed',  value: 'Completed' },
  { label: 'Cancelled',  value: 'Cancelled' },
]

export default function BookingsPage() {
  const navigate          = useNavigate()
  const { isCustomer }    = useAuth()

  const [bookings, setBookings]   = useState([])
  const [filter, setFilter]       = useState('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    bookingApi.getMyBookings()
      .then(({ data }) => setBookings(data || []))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  const filtered = bookings.filter((b) => {
    if (filter === 'all')    return true
    if (filter === 'active') return ['Confirmed', 'InProgress'].includes(b.status)
    return b.status === filter
  })

  const detailPath = (id) =>
    isCustomer ? `/customer/bookings/${id}` : `/provider/jobs/${id}`

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isCustomer ? 'My Bookings' : 'My Jobs'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {isCustomer
              ? 'Track and manage all your service bookings'
              : 'View and manage your assigned jobs'}
          </p>
        </div>
        {isCustomer && (
          <button
            onClick={() => navigate('/customer/match')}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2.5
                       rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
          >
            <Plus size={16} /> New Booking
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-5 overflow-x-auto">
        {FILTERS.map(({ label, value }) => {
          const count = value === 'all'
            ? bookings.length
            : value === 'active'
              ? bookings.filter((b) => ['Confirmed', 'InProgress'].includes(b.status)).length
              : bookings.filter((b) => b.status === value).length

          return (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm
                         font-medium whitespace-nowrap transition-colors flex-shrink-0
                         ${filter === value
                           ? 'bg-white text-primary shadow-sm'
                           : 'text-slate-500 hover:text-slate-700'}`}
            >
              {label}
              {count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold
                  ${filter === value
                    ? 'bg-primary-light text-primary'
                    : 'bg-slate-200 text-slate-500'}`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner text="Loading bookings..." />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState filter={filter} isCustomer={isCustomer} navigate={navigate} />
      ) : (
        <div className="space-y-3">
          {filtered.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              isCustomer={isCustomer}
              onClick={() => navigate(detailPath(booking.id))}
            />
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function BookingCard({ booking, isCustomer, onClick }) {
  const otherParty = booking.otherPartyName || (isCustomer ? booking.providerName : booking.customerName)

  return (
    <div
      onClick={onClick}
      className="card flex items-center gap-4 hover:shadow-md cursor-pointer
                 transition-shadow group"
    >
      {/* Status colour strip */}
      <div className={`w-1 self-stretch rounded-full flex-shrink-0
        ${booking.status === 'Completed' ? 'bg-success'
        : booking.status === 'Cancelled' ? 'bg-danger'
        : booking.status === 'Pending'   ? 'bg-yellow-400'
        : 'bg-primary'}`}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 truncate">
              {booking.serviceCategory}
            </p>
            <p className="text-sm text-slate-500 truncate mt-0.5">
              {isCustomer ? booking.businessName : otherParty}
            </p>
          </div>
          <StatusBadge status={booking.status} />
        </div>

        <div className="flex items-center gap-4 mt-2 flex-wrap">
          <span className="text-xs text-slate-400">
            📅 {formatDate(booking.scheduledDate)} · {booking.scheduledStartTime}–{booking.scheduledEndTime}
          </span>
          <span className="text-xs font-semibold text-slate-700">
            {formatCurrency(booking.estimatedAmount)}
          </span>
          {booking.isEmergency && (
            <span className="text-xs bg-red-100 text-danger px-2 py-0.5 rounded-full font-medium">
              🚨 Emergency
            </span>
          )}
        </div>
      </div>

      <ChevronRight
        size={18}
        className="text-slate-300 group-hover:text-primary transition-colors flex-shrink-0"
      />
    </div>
  )
}

function EmptyState({ filter, isCustomer, navigate }) {
  const messages = {
    all:       { icon: '📋', text: isCustomer ? 'No bookings yet' : 'No jobs yet',
                 sub: isCustomer ? 'Book your first service to get started' : 'Jobs will appear once customers book you' },
    Pending:   { icon: '⏳', text: 'No pending requests',    sub: '' },
    active:    { icon: '⚡', text: 'No active jobs',          sub: '' },
    Completed: { icon: '✅', text: 'No completed jobs yet',  sub: '' },
    Cancelled: { icon: '❌', text: 'No cancelled bookings',   sub: '' },
  }
  const { icon, text, sub } = messages[filter] || messages.all

  return (
    <div className="card text-center py-14">
      <div className="text-4xl mb-3">{icon}</div>
      <p className="font-semibold text-slate-700">{text}</p>
      {sub && <p className="text-sm text-slate-400 mt-1">{sub}</p>}
      {isCustomer && filter === 'all' && (
        <button
          onClick={() => navigate('/customer/match')}
          className="mt-5 bg-primary text-white text-sm font-medium px-5 py-2
                     rounded-lg hover:bg-primary-dark transition-colors"
        >
          Find a Provider
        </button>
      )}
    </div>
  )
}