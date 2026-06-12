import { useState, useEffect, useMemo } from 'react'
import { Search, UserX, UserCheck } from 'lucide-react'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { adminApi } from '../../api/adminApi'
import { formatDate, formatCurrency, getInitials } from '../../utils/formatters'
import toast from 'react-hot-toast'

const ROLE_TABS = ['All', 'Customer', 'Provider', 'Admin']

const ROLE_BADGE = {
  Customer: 'bg-blue-100 text-blue-700',
  Provider: 'bg-purple-100 text-purple-700',
  Admin:    'bg-red-100 text-danger',
}

export default function UsersPage() {
  const [users, setUsers]       = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch]     = useState('')
  const [roleTab, setRoleTab]   = useState('All')
  const [togglingId, setTogglingId] = useState(null)

  const load = () => {
    adminApi.getUsers()
      .then(({ data }) => setUsers(data || []))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchRole   = roleTab === 'All' || u.role === roleTab
      const matchSearch = !search ||
        u.fullName.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      return matchRole && matchSearch
    })
  }, [users, roleTab, search])

  const handleToggle = async (userId, currentStatus) => {
    setTogglingId(userId)
    try {
      await adminApi.toggleUserStatus(userId)
      toast.success(`Account ${currentStatus ? 'deactivated' : 'activated'}.`)
      load()
    } catch {}
    finally { setTogglingId(null) }
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
        <p className="text-slate-500 text-sm mt-1">
          {users.length} total users registered on the platform
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="input-field pl-9"
          />
        </div>

        {/* Role tabs */}
        <div className="flex bg-slate-100 rounded-xl p-1">
          {ROLE_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setRoleTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${roleTab === tab
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner text="Loading users..." />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-14">
          <p className="text-slate-400">No users match your search.</p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          {/* Table header — desktop only */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3
                          bg-slate-50 border-b border-slate-100 text-xs
                          font-semibold text-slate-500 uppercase tracking-wide">
            <div className="col-span-4">User</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-2">City</div>
            <div className="col-span-2">Joined</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-50">
            {filtered.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                isToggling={togglingId === user.id}
                onToggle={() => handleToggle(user.id, user.isActive)}
              />
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

function UserRow({ user, isToggling, onToggle }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-12 gap-4 px-5 py-4
                    items-center hover:bg-slate-50 transition-colors">
      {/* Avatar + name */}
      <div className="col-span-1 md:col-span-4 flex items-center gap-3 min-w-0">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center
                         text-sm font-bold flex-shrink-0
                         ${user.isActive
                           ? 'bg-primary-light text-primary'
                           : 'bg-slate-100 text-slate-400'}`}>
          {getInitials(user.fullName)}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-slate-900 truncate">
              {user.fullName}
            </p>
            {!user.isActive && (
              <span className="text-[10px] bg-slate-100 text-slate-400
                               px-1.5 py-0.5 rounded font-medium flex-shrink-0">
                Inactive
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 truncate">{user.email}</p>
        </div>
      </div>

      {/* Role badge */}
      <div className="col-span-1 md:col-span-2">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full
                         ${ROLE_BADGE[user.role] || 'bg-slate-100 text-slate-600'}`}>
          {user.role}
        </span>
        {user.role === 'Provider' && user.verificationStatus && (
          <p className="text-[10px] text-slate-400 mt-1">{user.verificationStatus}</p>
        )}
      </div>

      {/* City */}
      <div className="hidden md:block col-span-2">
        <p className="text-sm text-slate-600">{user.city || '—'}</p>
      </div>

      {/* Joined date */}
      <div className="hidden md:block col-span-2">
        <p className="text-sm text-slate-500">{formatDate(user.joinedAt)}</p>
      </div>

      {/* Actions */}
      <div className="col-span-2 md:col-span-2 flex justify-end">
        <button
          onClick={onToggle}
          disabled={isToggling || user.role === 'Admin'}
          title={user.role === 'Admin' ? 'Admin accounts cannot be deactivated' : ''}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                     font-medium transition-colors disabled:opacity-40
                     ${user.isActive
                       ? 'bg-red-50 text-danger hover:bg-red-100'
                       : 'bg-green-50 text-success hover:bg-green-100'}`}
        >
          {isToggling
            ? <LoadingSpinner size="sm" />
            : user.isActive
              ? <><UserX size={13} /> Deactivate</>
              : <><UserCheck size={13} /> Activate</>}
        </button>
      </div>
    </div>
  )
}