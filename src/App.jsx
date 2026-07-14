import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import ProtectedRoute from './components/common/ProtectedRoute'

// Auth
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

// Customer Pages
import CustomerDashboard from './pages/customer/CustomerDashboard'
import MatchingPage from './pages/customer/MatchingPage'
import ProviderProfilePage from './pages/customer/ProviderProfilePage' // Public customer-facing browse view
import CreateBookingPage from './pages/customer/CreateBookingPage'
import BookingsPage from './pages/customer/BookingsPage'
import BookingDetailPage from './pages/customer/BookingDetailPage'
import MessagesPage from './pages/customer/MessagesPage'
import SubmitReviewPage from './pages/customer/SubmitReviewPage'
import CustomerProfilePage from './pages/customer/ProfilePage'

// Provider Pages
import ProviderDashboard from './pages/provider/ProviderDashboard'
import AvailabilityPage from './pages/provider/AvailabilityPage'
import JobsPage from './pages/provider/JobsPage'
import ProviderOwnProfilePage from './pages/provider/ProfilePage' // Custom alias to prevent collision with public browse view

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard'
import UsersPage from './pages/admin/UsersPage'
import VerificationsPage from './pages/admin/VerificationsPage'
import DisputesPage from './pages/admin/DisputesPage'
import AnalyticsPage from './pages/admin/AnalyticsPage'
import ModerationPage from './pages/admin/ModerationPage'
import LogsPage from './pages/admin/LogsPage'
import CategoriesPage from './pages/admin/CategoriesPage' // 👈 Clean, single import!

export default function App() {
  return (
    <BrowserRouter>
      {/* Global toast notifications — place once at app root */}
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />

      <Routes>
        {/* Public routes */}
        <Route path="/"         element={<Navigate to="/login" replace />} />
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Customer routes */}
        <Route path="/customer/dashboard"
          element={<ProtectedRoute role="Customer"><CustomerDashboard /></ProtectedRoute>} />
        <Route path="/customer/match"
          element={<ProtectedRoute role="Customer"><MatchingPage /></ProtectedRoute>} />
        <Route path="/customer/bookings"
          element={<ProtectedRoute role="Customer"><BookingsPage /></ProtectedRoute>} />
        <Route path="/customer/bookings/new"
          element={<ProtectedRoute role="Customer"><CreateBookingPage /></ProtectedRoute>} />
        <Route path="/customer/bookings/:id"
          element={<ProtectedRoute role="Customer"><BookingDetailPage /></ProtectedRoute>} />
        <Route path="/customer/messages"
          element={<ProtectedRoute role="Customer"><MessagesPage /></ProtectedRoute>} />
        <Route path="/reviews/new"
          element={<ProtectedRoute role="Customer"><SubmitReviewPage /></ProtectedRoute>} />
        <Route path="/customer/profile"
          element={<ProtectedRoute role="Customer"><CustomerProfilePage /></ProtectedRoute>} />

        {/* Public-Facing Shared Provider Profile Link */}
        <Route path="/providers/:id"
          element={<ProtectedRoute><ProviderProfilePage /></ProtectedRoute>} />

        {/* Provider routes */}
        <Route path="/provider/dashboard"
          element={<ProtectedRoute role="Provider"><ProviderDashboard /></ProtectedRoute>} />
        <Route path="/provider/jobs"
          element={<ProtectedRoute role="Provider"><BookingsPage /></ProtectedRoute>} />
        <Route path="/provider/jobs/:id"
          element={<ProtectedRoute role="Provider"><BookingDetailPage /></ProtectedRoute>} />
        <Route path="/provider/availability"
          element={<ProtectedRoute role="Provider"><AvailabilityPage /></ProtectedRoute>} />
        <Route path="/provider/messages"
          element={<ProtectedRoute role="Provider"><MessagesPage /></ProtectedRoute>} />  
        <Route path="/provider/profile"
          element={<ProtectedRoute role="Provider"><ProviderOwnProfilePage /></ProtectedRoute>} />

        {/* Admin routes */}
        <Route path="/admin/dashboard"
          element={<ProtectedRoute role="Admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users"
          element={<ProtectedRoute role="Admin"><UsersPage /></ProtectedRoute>} />
        <Route path="/admin/verifications"
          element={<ProtectedRoute role="Admin"><VerificationsPage /></ProtectedRoute>} />
        <Route path="/admin/disputes"
          element={<ProtectedRoute role="Admin"><DisputesPage /></ProtectedRoute>} />
        <Route path="/admin/analytics"
          element={<ProtectedRoute role="Admin"><AnalyticsPage /></ProtectedRoute>} />
        <Route path="/admin/reviews"
          element={<ProtectedRoute role="Admin"><ModerationPage /></ProtectedRoute>} />
        <Route path="/admin/logs"
          element={<ProtectedRoute role="Admin"><LogsPage /></ProtectedRoute>} />
        
        {/* 🛠️ FIXED: Nested securely under Admin-only routes */}
        <Route path="/admin/categories"
          element={<ProtectedRoute role="Admin"><CategoriesPage /></ProtectedRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}