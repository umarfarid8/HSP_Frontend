import { useState } from 'react'
import Navbar from '../common/Navbar'
import Sidebar from '../common/Sidebar'

// Wrap every dashboard page with this layout
// Usage: <DashboardLayout><YourPage /></DashboardLayout>
export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-surface">
      <Navbar onMenuToggle={() => setSidebarOpen((v) => !v)} />

      <div className="flex">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main content */}
        <main className="flex-1 min-w-0 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}