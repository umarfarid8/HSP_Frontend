import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Bell, ChevronDown, LogOut, User } from 'lucide-react'
import { logout } from '../../store/authSlice'
import { useAuth } from '../../hooks/useAuth'
import { getInitials } from '../../utils/formatters'
import api from '../../api/axios'

export default function Navbar({ onMenuToggle }) {
  const dispatch   = useDispatch()
  const navigate   = useNavigate()
  const { user }   = useAuth()
  const [unread, setUnread]       = useState(0)
  const [dropOpen, setDropOpen]   = useState(false)

  // Poll unread count every 30 seconds
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const { data } = await api.get('/messages/unread-count')
        setUnread(data.unreadCount || 0)
      } catch { /* silently ignore */ }
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 30_000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <nav className="h-16 bg-white border-b border-slate-200 flex items-center
                    justify-between px-4 lg:px-6 sticky top-0 z-30">
      {/* Left: mobile menu toggle + brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-500"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="font-bold text-primary text-lg hidden sm:block">
          Home Service Provider
        </span>
        <span className="font-bold text-primary text-lg sm:hidden">HSP</span>
      </div>

      {/* Right: bell + user menu */}
      <div className="flex items-center gap-2">

        {/* Notification bell */}
        <button
          onClick={() => navigate(`/${user?.role?.toLowerCase()}/messages`)}
          className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500"
        >
          <Bell size={20} />
          {unread > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-danger text-white
                             text-[10px] font-bold rounded-full flex items-center
                             justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        {/* User dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropOpen((v) => !v)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg
                       hover:bg-slate-100 transition-colors"
          >
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-primary flex items-center
                            justify-center text-white text-xs font-semibold">
              {getInitials(user?.fullName)}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-slate-800 leading-none">
                {user?.fullName?.split(' ')[0]}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{user?.role}</p>
            </div>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {dropOpen && (
            <>
              {/* Click-away overlay */}
              <div className="fixed inset-0 z-10" onClick={() => setDropOpen(false)} />
              <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg
                              border border-slate-100 py-1 z-20">
                <button
                  onClick={() => {
                    setDropOpen(false)
                    navigate(`/${user?.role?.toLowerCase()}/profile`)
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm
                             text-slate-700 hover:bg-slate-50"
                >
                  <User size={15} /> My Profile
                </button>
                <hr className="my-1 border-slate-100" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm
                             text-danger hover:bg-red-50"
                >
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}