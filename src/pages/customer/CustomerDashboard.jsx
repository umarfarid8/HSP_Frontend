import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, CalendarCheck, MessageSquare, ChevronRight } from 'lucide-react'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { useAuth } from '../../hooks/useAuth'
import { bookingApi } from '../../api/bookingApi'
import { formatDate, formatCurrency } from '../../utils/formatters'

export default function CustomerDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [bookings, setBookings]   = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    bookingApi.getMyBookings()
      .then(({ data }) => setBookings(data || []))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  // Derive stats from bookings list
  const stats = {
    total:    bookings.length,
    active:   bookings.filter((b) =>
      ['Pending', 'Confirmed', 'InProgress'].includes(b.status)).length,
    completed: bookings.filter((b) => b.status === 'Completed').length,
  }

  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)

  const firstName = user?.fullName?.split(' ')[0] || 'there'

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Good day, {firstName} 👋
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          What home service do you need today?
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Total Bookings"
          value={stats.total}
          color="text-slate-800"
          bg="bg-white"
        />
        <StatCard
          label="Active Bookings"
          value={stats.active}
          color="text-primary"
          bg="bg-primary-light"
        />
        <StatCard
          label="Completed Jobs"
          value={stats.completed}
          color="text-success"
          bg="bg-green-50"
          className="col-span-2 lg:col-span-1"
        />
      </div>

      {/* Find a provider CTA — the most important action for a customer */}
      <div
        onClick={() => navigate('/customer/match')}
        className="bg-primary rounded-2xl p-6 mb-6 cursor-pointer
                   hover:bg-primary-dark transition-colors group"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm font-medium mb-1">
              Need something fixed?
            </p>
            <h2 className="text-white text-xl font-bold">
              Find the right professional
            </h2>
            <p className="text-white/70 text-sm mt-1">
              Describe your problem — AI matches you instantly
            </p>
          </div>
          <div className="bg-white/20 rounded-xl p-3
                          group-hover:bg-white/30 transition-colors">
            <Search size={28} className="text-white" />
          </div>
        </div>
      </div>

      {/* Quick action cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <QuickAction
          icon={<CalendarCheck size={20} className="text-primary" />}
          label="My Bookings"
          sub={`${stats.active} active`}
          onClick={() => navigate('/customer/bookings')}
        />
        <QuickAction
          icon={<MessageSquare size={20} className="text-primary" />}
          label="Messages"
          sub="Chat with providers"
          onClick={() => navigate('/customer/messages')}
        />
      </div>

      {/* Recent bookings */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-800">Recent Bookings</h2>
          <button
            onClick={() => navigate('/customer/bookings')}
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            View all <ChevronRight size={14} />
          </button>
        </div>

        {isLoading ? (
          <div className="py-8 flex justify-center">
            <LoadingSpinner text="Loading bookings..." />
          </div>
        ) : recentBookings.length === 0 ? (
          <EmptyBookings onFindProvider={() => navigate('/customer/match')} />
        ) : (
          <div className="space-y-3">
            {recentBookings.map((b) => (
              <BookingRow
                key={b.id}
                booking={b}
                onClick={() => navigate(`/customer/bookings/${b.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({ label, value, color, bg, className = '' }) {
  return (
    <div className={`card ${bg} ${className}`}>
      <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">
        {label}
      </p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  )
}

function QuickAction({ icon, label, sub, onClick }) {
  return (
    <button
      onClick={onClick}
      className="card flex items-center gap-3 hover:shadow-md
                 transition-shadow text-left w-full"
    >
      <div className="bg-primary-light rounded-lg p-2.5">{icon}</div>
      <div>
        <p className="font-medium text-slate-800 text-sm">{label}</p>
        <p className="text-xs text-slate-400">{sub}</p>
      </div>
    </button>
  )
}

function BookingRow({ booking, onClick }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between p-3 rounded-lg
                 hover:bg-slate-50 cursor-pointer transition-colors"
    >
      <div>
        <p className="font-medium text-slate-800 text-sm">{booking.serviceCategory}</p>
        <p className="text-xs text-slate-400 mt-0.5">
          {booking.businessName} · {formatDate(booking.scheduledDate)}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-slate-600">
          {formatCurrency(booking.estimatedAmount)}
        </span>
        <StatusBadge status={booking.status} />
      </div>
    </div>
  )
}

function EmptyBookings({ onFindProvider }) {
  return (
    <div className="py-10 text-center">
      <div className="text-4xl mb-3">🔧</div>
      <p className="font-medium text-slate-700">No bookings yet</p>
      <p className="text-sm text-slate-400 mt-1">
        Find a service provider to get started
      </p>
      <button
        onClick={onFindProvider}
        className="mt-4 bg-primary text-white text-sm font-medium
                   px-5 py-2 rounded-lg hover:bg-primary-dark transition-colors"
      >
        Find a Provider
      </button>
    </div>
  )
}