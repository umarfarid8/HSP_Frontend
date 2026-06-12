import { useState, useEffect } from 'react'
import { Search, Filter } from 'lucide-react'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { adminApi } from '../../api/adminApi'

const ACTION_FILTERS = [
  'All', 'PROVIDER_VERIFIED', 'PROVIDER_REJECTED',
  'USER_ACTIVATED', 'USER_DEACTIVATED',
  'DISPUTE_RESOLVED',
]

const ACTION_BADGE = {
  PROVIDER_VERIFIED:   'bg-green-100 text-success',
  PROVIDER_REJECTED:   'bg-red-100 text-danger',
  USER_ACTIVATED:      'bg-blue-100 text-primary',
  USER_DEACTIVATED:    'bg-slate-100 text-slate-500',
  DISPUTE_RESOLVED:    'bg-orange-100 text-orange-700',
}

export default function LogsPage() {
  const [logs, setLogs]           = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [filters, setFilters]     = useState({ from: '', to: '', action: 'All' })

  const load = () => {
    setIsLoading(true)
    const params = {
      ...(filters.from   && { from:   filters.from }),
      ...(filters.to     && { to:     filters.to }),
      ...(filters.action !== 'All' && { action: filters.action }),
    }
    adminApi.getLogs(params)
      .then(({ data }) => setLogs(data || []))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }

  useEffect(() => { load() }, [])

  const set = (field) => (e) =>
    setFilters((p) => ({ ...p, [field]: e.target.value }))

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
        <p className="text-slate-500 text-sm mt-1">
          Immutable record of all admin actions
        </p>
      </div>

      {/* Filters */}
      <div className="card mb-5">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">From</label>
            <input type="date" value={filters.from} onChange={set('from')}
              className="input-field w-auto" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">To</label>
            <input type="date" value={filters.to} onChange={set('to')}
              className="input-field w-auto" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Action</label>
            <select value={filters.action} onChange={set('action')}
              className="input-field w-auto">
              {ACTION_FILTERS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <button
            onClick={load}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2.5
                       rounded-lg text-sm font-medium hover:bg-primary-dark"
          >
            <Filter size={15} /> Apply
          </button>
          <button
            onClick={() => {
              setFilters({ from: '', to: '', action: 'All' })
              setTimeout(load, 0)
            }}
            className="text-sm text-slate-500 hover:text-slate-800"
          >
            Reset
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner text="Loading logs..." />
        </div>
      ) : logs.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-slate-400">No logs match your filters.</p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          {/* Header */}
          <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-3 bg-slate-50
                          border-b border-slate-100 text-xs font-semibold
                          text-slate-500 uppercase tracking-wide">
            <div className="col-span-2">Timestamp</div>
            <div className="col-span-2">Admin</div>
            <div className="col-span-3">Action</div>
            <div className="col-span-2">Entity</div>
            <div className="col-span-3">Details</div>
          </div>

          <div className="divide-y divide-slate-50">
            {logs.map((log) => (
              <div key={log.id}
                className="grid grid-cols-2 md:grid-cols-12 gap-3 px-5 py-3.5
                           text-sm hover:bg-slate-50 transition-colors items-start">
                <div className="col-span-1 md:col-span-2 text-xs text-slate-400">
                  {new Date(log.timestamp).toLocaleString('en-PK', {
                    day: 'numeric', month: 'short',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </div>
                <div className="col-span-1 md:col-span-2 font-medium text-slate-700 truncate">
                  {log.performedBy || 'System'}
                </div>
                <div className="col-span-2 md:col-span-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                    ${ACTION_BADGE[log.action] || 'bg-slate-100 text-slate-600'}`}>
                    {log.action}
                  </span>
                </div>
                <div className="col-span-2 md:col-span-2 text-xs text-slate-500">
                  {log.targetEntityType}
                </div>
                <div className="col-span-2 md:col-span-3 text-xs text-slate-600 truncate"
                  title={log.details || ''}>
                  {log.details || '—'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}