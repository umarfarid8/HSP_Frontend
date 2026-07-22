import Navbar from '../common/Navbar'
import Sidebar from '../common/Sidebar'
import ChatbotWidget from '../common/ChatbotWidget' // 👈 Added Chatbot Widget

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 min-w-0 p-4 lg:p-6">
          {children}
        </main>
      </div>
      <ChatbotWidget /> {/* 👈 Rendered globally across all dashboard pages */}
    </div>
  )
}