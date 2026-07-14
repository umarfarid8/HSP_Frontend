import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, ShieldCheck, AlertTriangle, MessageSquareWarning,
  TrendingUp, CheckCircle, ChevronRight, Layers, // 👈 Added Layers icon here
} from 'lucide-react'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { adminApi } from '../../api/adminApi'
import { formatCurrency } from '../../utils/formatters'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats]     = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    adminApi.getDashboard()
      .then(({ data }) => setStats(data))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner text="Loading dashboard..." />
        </div>
      </DashboardLayout>
    )
  }

  if (!stats) return null

  const urgent = [
    stats.pendingProviderVerifications > 0 && {
      label: `${stats.pendingProviderVerifications} provider verifications awaiting review`,
      path:  '/admin/verifications',
      color: 'bg-yellow-50 border-yellow-300 text-yellow-800',
    },
    stats.activeDisputes > 0 && {
      label: `${stats.activeDisputes} active disputes need resolution`,
      path:  '/admin/disputes',
      color: 'bg-red-50 border-red-300 text-danger',
    },
    stats.pendingModerationItems > 0 && {
      label: `${stats.pendingModerationItems} flagged reviews pending moderation`,
      path:  '/admin/reviews',
      color: 'bg-orange-50 border-orange-300 text-orange-700',
    },
  ].filter(Boolean)

  const bs = stats.bookingStats
  const fs = stats.financialSnapshot

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Platform overview and key metrics</p>
      </div>

      {/* Urgent alerts */}
      {urgent.length > 0 && (
        <div className="space-y-2 mb-6">
          {urgent.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl
                         border text-sm font-medium text-left transition-opacity
                         hover:opacity-80 ${item.color}`}
            >
              <span>⚠️  {item.label}</span>
              <ChevronRight size={16} />
            </button>
          ))}
        </div>
      )}

      {/* User stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <StatCard
          icon={<Users size={18} />}
          label="Customers"
          value={stats.totalCustomers}
          color="text-primary"
          bg="bg-primary-light"
        />
        <StatCard
          icon={<ShieldCheck size={18} />}
          label="Providers"
          value={stats.totalProviders}
          color="text-purple-600"
          bg="bg-purple-50"
        />
        <StatCard
          icon={<TrendingUp size={18} />}
          label="This Month Revenue"
          value={formatCurrency(fs.thisMonthRevenue)}
          color="text-success"
          bg="bg-green-50"
          small
        />
        <StatCard
          icon={<CheckCircle size={18} />}
          label="Total Revenue"
          value={formatCurrency(fs.totalPlatformRevenue)}
          color="text-slate-700"
          bg="bg-slate-100"
          small
        />
      </div>

      {/* Booking breakdown + Action items */}
      <div className="grid lg:grid-cols-2 gap-5">

        {/* Booking stats */}
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-4">Booking Status Breakdown</h2>
          <div className="space-y-2.5">
            {[
              { label: 'Pending',     value: bs.pending,    color: 'bg-yellow-400' },
              { label: 'Confirmed',   value: bs.confirmed,  color: 'bg-blue-400' },
              { label: 'In Progress', value: bs.inProgress, color: 'bg-primary' },
              { label: 'Completed',   value: bs.completed,  color: 'bg-success' },
              { label: 'Cancelled',   value: bs.cancelled,  color: 'bg-slate-300' },
              { label: 'Disputed',    value: bs.disputed,   color: 'bg-danger' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-20 flex-shrink-0">{label}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-2">
                  <div
                    className={`${color} h-2 rounded-full transition-all`}
                    style={{ width: bs.total > 0 ? `${(value / bs.total) * 100}%` : '0%' }}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-700 w-6 text-right">
                  {value}
                </span>
              </div>
            ))}
            <p className="text-xs text-slate-400 pt-1">Total: {bs.total} bookings</p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="card bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {[
              // ⚙️ 1. Added: Manage Categories Action
              {
                label: 'Manage Service Categories',
                sub:   'Add, update, or remove service classifications',
                path:  '/admin/categories',
                icon:  <Layers size={18} className="text-emerald-600" />,
                bg:    'bg-emerald-50',
              },
              {
                label: 'Review Verifications',
                sub:   `${stats.pendingProviderVerifications} pending`,
                path:  '/admin/verifications',
                icon:  <ShieldCheck size={18} className="text-yellow-600" />,
                bg:    'bg-yellow-50',
              },
              {
                label: 'Resolve Disputes',
                sub:   `${stats.activeDisputes} active`,
                path:  '/admin/disputes',
                icon:  <AlertTriangle size={18} className="text-danger" />,
                bg:    'bg-red-50',
              },
              {
                label: 'Moderation Queue',
                sub:   `${stats.pendingModerationItems} flagged reviews`,
                path:  '/admin/reviews',
                icon:  <MessageSquareWarning size={18} className="text-orange-600" />,
                bg:    'bg-orange-50',
              },
              {
                label: 'Manage Users',
                sub:   `${stats.totalCustomers + stats.totalProviders} total users`,
                path:  '/admin/users',
                icon:  <Users size={18} className="text-primary" />,
                bg:    'bg-primary-light',
              },
            ].map(({ label, sub, path, icon, bg }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="w-full flex items-center gap-3 p-3 rounded-xl
                           hover:bg-slate-50 transition-colors text-left group"
              >
                <div className={`${bg} p-2 rounded-lg`}>{icon}</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">{label}</p>
                  <p className="text-xs text-slate-400">{sub}</p>
                </div>
                <ChevronRight size={15} className="text-slate-300
                  group-hover:text-primary transition-colors" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

function StatCard({ icon, label, value, color, bg, small }) {
  return (
    <div className="card">
      <div className={`${bg} ${color} w-9 h-9 rounded-lg flex items-center
                       justify-center mb-3`}>
        {icon}
      </div>
      <p className={`font-bold mt-1 ${small ? 'text-lg' : 'text-3xl'} ${color}`}>
        {value}
      </p>
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
    </div>
  )
}