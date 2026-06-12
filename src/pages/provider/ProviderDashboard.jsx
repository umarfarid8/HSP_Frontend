import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, ChevronRight, Briefcase } from 'lucide-react'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { useAuth } from '../../hooks/useAuth'
import { bookingApi } from '../../api/bookingApi'
import { formatDate, formatCurrency } from '../../utils/formatters'

export default function ProviderDashboard() {
  const navigate        = useNavigate()
  const { user }        = useAuth()
  const [bookings, setBookings]   = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    bookingApi.getMyBookings()
      .then(({ data }) => setBookings(data || []))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  const pending    = bookings.filter((b) => b.status === 'Pending')
  const active     = bookings.filter((b) => ['Confirmed', 'InProgress'].includes(b.status))
  const completed  = bookings.filter((b) => b.status === 'Completed')
  const firstName  = user?.fullName?.split(' ')[0] || 'there'

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Welcome back, {firstName} 👋</h1>
        <p className="text-slate-500 text-sm mt-1">Here's what's happening with your jobs today</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Pending',   value: pending.length,   color: 'text-yellow-600' },
          { label: 'Active',    value: active.length,    color: 'text-primary' },
          { label: 'Completed', value: completed.length, color: 'text-success' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card text-center">
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-slate-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <QuickAction icon={<Briefcase size={20} className="text-primary" />}
          label="My Jobs" sub="View all assigned jobs"
          onClick={() => navigate('/provider/jobs')} />
        <QuickAction icon={<CalendarDays size={20} className="text-primary" />}
          label="Availability" sub="Set your working hours"
          onClick={() => navigate('/provider/availability')} />
      </div>

      {/* Pending jobs — require immediate action */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-800">Pending Requests</h2>
          <button
            onClick={() => navigate('/provider/jobs')}
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            All jobs <ChevronRight size={14} />
          </button>
        </div>

        {isLoading ? (
          <div className="py-8 flex justify-center"><LoadingSpinner /></div>
        ) : pending.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <p className="text-3xl mb-2">🎉</p>
            <p className="text-sm">No pending requests right now</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.slice(0, 5).map((b) => (
              <div
                key={b.id}
                onClick={() => navigate(`/provider/jobs/${b.id}`)}
                className="flex items-center justify-between p-3 rounded-lg
                           hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <div>
                  <p className="font-medium text-slate-800 text-sm">{b.serviceCategory}</p>
                  <p className="text-xs text-slate-400">{b.otherPartyName} · {formatDate(b.scheduledDate)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{formatCurrency(b.estimatedAmount)}</span>
                  <StatusBadge status={b.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

function QuickAction({ icon, label, sub, onClick }) {
  return (
    <button onClick={onClick}
      className="card flex items-center gap-3 hover:shadow-md transition-shadow text-left w-full">
      <div className="bg-primary-light rounded-lg p-2.5">{icon}</div>
      <div>
        <p className="font-medium text-slate-800 text-sm">{label}</p>
        <p className="text-xs text-slate-400">{sub}</p>
      </div>
    </button>
  )
}