import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import {
  LayoutDashboard, Search, CalendarCheck, MessageSquare,
  User, Briefcase, CalendarDays, Users, ShieldCheck,
  AlertTriangle, BarChart3, ScrollText,
} from 'lucide-react'

import { MessageSquareWarning } from 'lucide-react'


// Navigation links for each role
const NAV_LINKS = {
  Customer: [
    { to: '/customer/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/customer/match',     icon: Search,           label: 'Find a Provider' },
    { to: '/customer/bookings',  icon: CalendarCheck,    label: 'My Bookings' },
    { to: '/customer/messages',  icon: MessageSquare,    label: 'Messages' },
    { to: '/customer/profile',   icon: User,             label: 'Profile' },
  ],
  Provider: [
    { to: '/provider/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/provider/jobs',         icon: Briefcase,       label: 'My Jobs' },
    { to: '/provider/availability', icon: CalendarDays,    label: 'Availability' },
    { to: '/provider/messages',     icon: MessageSquare,   label: 'Messages' },
    { to: '/provider/profile',      icon: User,            label: 'Profile' },
  ],
  Admin: [
  { to: '/admin/dashboard',      icon: LayoutDashboard,      label: 'Dashboard'     },
  { to: '/admin/users',          icon: Users,                label: 'Users'         },
  { to: '/admin/verifications',  icon: ShieldCheck,          label: 'Verifications' },
  { to: '/admin/disputes',       icon: AlertTriangle,        label: 'Disputes'      },
  { to: '/admin/reviews',        icon: MessageSquareWarning, label: 'Reviews'       },
  { to: '/admin/analytics',      icon: BarChart3,            label: 'Analytics'     },
  { to: '/admin/logs',           icon: ScrollText,           label: 'Audit Logs'    },
],
}

export default function Sidebar({ isOpen, onClose }) {
  const { role } = useAuth()
  const links = NAV_LINKS[role] || []

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside className={`
        fixed top-16 left-0 h-[calc(100vh-4rem)] w-60 bg-white
        border-r border-slate-200 z-20 transition-transform duration-200
        lg:translate-x-0 lg:static lg:block
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <nav className="p-3 space-y-0.5">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                 font-medium transition-colors
                 ${isActive
                   ? 'bg-primary-light text-primary'
                   : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}