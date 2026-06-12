import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, MessageSquare, Download, Star,
  CheckCircle, XCircle, PlayCircle, AlertTriangle,
} from 'lucide-react'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { useAuth } from '../../hooks/useAuth'
import { bookingApi } from '../../api/bookingApi'
import { invoiceApi } from '../../api/invoiceApi'
import { formatDate, formatCurrency, formatTime } from '../../utils/formatters'
import toast from 'react-hot-toast'

// Ordered steps for the status timeline
const STATUS_STEPS = ['Pending', 'Confirmed', 'InProgress', 'Completed']

export default function BookingDetailPage() {
  const { id }              = useParams()
  const navigate            = useNavigate()
  const { isCustomer, isProvider, user } = useAuth()

  const [booking, setBooking]             = useState(null)
  const [invoice, setInvoice]             = useState(null)
  const [isLoading, setIsLoading]         = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [cancelReason, setCancelReason]   = useState('')
  const [showCancelInput, setShowCancelInput] = useState(false)

  const load = () => {
    bookingApi.getById(id)
      .then(({ data }) => {
        setBooking(data)
        // Load invoice if booking is completed
        if (data.status === 'Completed') {
          invoiceApi.getByBookingId(id)
            .then(({ data: inv }) => setInvoice(inv))
            .catch(() => {})
        }
      })
      .catch(() => navigate(-1))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => { load() }, [id])

  // ── Actions ─────────────────────────────────────────────────────────────────

  const performAction = async (newStatus, notes = '', cancellationReason = '') => {
    setActionLoading(true)
    try {
      await bookingApi.updateStatus(id, {
        newStatus: statusToInt(newStatus),
        notes,
        cancellationReason,
      })
      toast.success(`Booking status updated to ${newStatus}.`)
      load()  // Reload after action
    } catch {}
    finally { setActionLoading(false) }
  }

  const handleConfirm    = () => performAction('Confirmed',  'Provider confirmed the booking.')
  const handleStartJob   = () => performAction('InProgress', 'Provider has arrived and started the job.')
  const handleComplete   = () => performAction('Completed',  'Job completed successfully.')
  const handleDispute    = () => performAction('Disputed',   'Customer raised a dispute.')
  const handleCancel     = () => {
    if (!cancelReason.trim()) { toast.error('Please provide a reason for cancellation.'); return }
    performAction('Cancelled', '', cancelReason)
    setShowCancelInput(false)
  }

  const handleDownloadInvoice = async () => {
    if (!invoice) return
    try {
      const { data } = await invoiceApi.download(invoice.id)
      const url  = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href     = url
      link.download = `invoice-${invoice.invoiceNumber}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Could not download invoice.') }
  }

  const handleConfirmCash = async () => {
    if (!invoice) return
    setActionLoading(true)
    try {
      await invoiceApi.confirmCash(invoice.id)
      toast.success('Cash receipt confirmed!')
      load()
    } catch {}
    finally { setActionLoading(false) }
  }

  if (isLoading) return (
    <DashboardLayout>
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner text="Loading booking..." />
      </div>
    </DashboardLayout>
  )

  if (!booking) return null

  const isTerminal = ['Completed', 'Cancelled', 'Disputed'].includes(booking.status)

  return (
    <DashboardLayout>
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-slate-500
                   hover:text-slate-800 mb-5 transition-colors"
      >
        <ArrowLeft size={16} />
        {isCustomer ? 'My Bookings' : 'My Jobs'}
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {booking.serviceCategory}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Booking #{booking.id.slice(0, 8).toUpperCase()}
          </p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* ── Left: main info ──────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Status timeline */}
          <div className="card">
            <h2 className="font-semibold text-slate-800 mb-5">Progress</h2>
            <StatusStepper booking={booking} />
          </div>

          {/* Job details */}
          <div className="card">
            <h2 className="font-semibold text-slate-800 mb-4">Job Details</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Detail label="Service"      value={booking.serviceCategory} />
              <Detail label="Date"         value={formatDate(booking.scheduledDate)} />
              <Detail
                label="Time"
                value={`${formatTime(booking.scheduledStartTime)} – ${formatTime(booking.scheduledEndTime)}`}
              />
              <Detail
                label="Type"
                value={booking.isEmergency ? '🚨 Emergency' : 'Standard'}
              />
              {isCustomer && <Detail label="Provider"  value={booking.businessName} />}
              {isProvider  && <Detail label="Customer" value={booking.customerName} />}
            </div>

            <div className="mt-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                Problem Description
              </p>
              <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3 leading-relaxed">
                {booking.problemDescription}
              </p>
            </div>
          </div>

          {/* Invoice section — only when Completed */}
          {booking.status === 'Completed' && (
            <InvoiceSection
              invoice={invoice}
              isProvider={isProvider}
              onDownload={handleDownloadInvoice}
              onConfirmCash={handleConfirmCash}
              actionLoading={actionLoading}
            />
          )}

          {/* Review section — prompt after completion */}
          {booking.status === 'Completed' && (
            <div className="card border-2 border-dashed border-slate-200">
              <div className="flex items-center gap-3">
                <Star size={20} className="text-yellow-400 fill-yellow-400" />
                <div className="flex-1">
                  <p className="font-semibold text-slate-800">Leave a Review</p>
                  <p className="text-sm text-slate-500">
                    Share your experience to help others choose the right provider
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/reviews/new?bookingId=${booking.id}`)}
                  className="bg-yellow-400 hover:bg-yellow-500 text-white text-sm
                             font-medium px-4 py-2 rounded-lg transition-colors flex-shrink-0"
                >
                  Write Review
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Right: actions + chat ─────────────────────────────────── */}
        <div className="space-y-4">

          {/* Pricing */}
          <div className="card">
            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-3">
              Pricing
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Estimated</span>
                <span className="font-medium">{formatCurrency(booking.estimatedAmount)}</span>
              </div>
              {booking.finalAmount && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Final</span>
                  <span className="font-bold text-primary">
                    {formatCurrency(booking.finalAmount)}
                  </span>
                </div>
              )}
              {booking.isEmergency && (
                <p className="text-xs text-orange-500">⚡ Emergency surcharge included</p>
              )}
              {booking.isOffHours && (
                <p className="text-xs text-orange-500">🌙 Off-hours surcharge included</p>
              )}
            </div>
          </div>

          {/* Action buttons */}
          {!isTerminal && (
            <ActionsCard
              booking={booking}
              isCustomer={isCustomer}
              isProvider={isProvider}
              actionLoading={actionLoading}
              showCancelInput={showCancelInput}
              cancelReason={cancelReason}
              onSetCancelReason={setCancelReason}
              onShowCancel={setShowCancelInput}
              onConfirm={handleConfirm}
              onStartJob={handleStartJob}
              onComplete={handleComplete}
              onDispute={handleDispute}
              onCancel={handleCancel}
            />
          )}

          {/* Open chat */}
          {booking.chatThreadId && booking.chatThreadId !== '00000000-0000-0000-0000-000000000000' && (
            <button
              onClick={() => navigate(
                `/${isCustomer ? 'customer' : 'provider'}/messages?thread=${booking.chatThreadId}`
              )}
              className="w-full flex items-center justify-center gap-2 border
                         border-slate-300 text-slate-700 py-2.5 rounded-lg text-sm
                         font-medium hover:bg-slate-50 transition-colors"
            >
              <MessageSquare size={16} /> Open Chat
            </button>
          )}

          {/* Cancellation reason */}
          {booking.status === 'Cancelled' && booking.cancellationReason && (
            <div className="card bg-red-50 border-red-100">
              <p className="text-xs font-semibold text-danger mb-1">Cancellation Reason</p>
              <p className="text-sm text-slate-600">{booking.cancellationReason}</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

// ── Status Stepper ─────────────────────────────────────────────────────────────

function StatusStepper({ booking }) {
  const isCancelled = booking.status === 'Cancelled'
  const isDisputed  = booking.status === 'Disputed'
  const currentIdx  = STATUS_STEPS.indexOf(booking.status)

  if (isCancelled || isDisputed) {
    return (
      <div className={`flex items-center gap-3 p-4 rounded-xl
        ${isCancelled ? 'bg-red-50' : 'bg-orange-50'}`}>
        <XCircle size={24} className={isCancelled ? 'text-danger' : 'text-orange-500'} />
        <div>
          <p className={`font-semibold ${isCancelled ? 'text-danger' : 'text-orange-600'}`}>
            Booking {booking.status}
          </p>
          {booking.cancellationReason && (
            <p className="text-xs text-slate-500 mt-0.5">{booking.cancellationReason}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-0 overflow-x-auto pb-1">
      {STATUS_STEPS.map((step, idx) => {
        const done    = idx < currentIdx
        const current = idx === currentIdx
        const future  = idx > currentIdx

        const historyEntry = booking.statusHistory?.find((h) => h.status === step)

        return (
          <div key={step} className="flex items-start flex-1 min-w-0">
            <div className="flex flex-col items-center flex-1">
              {/* Step circle */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center
                               border-2 flex-shrink-0 transition-colors
                ${done    ? 'bg-success border-success text-white'
                : current ? 'bg-primary border-primary text-white'
                : 'bg-white border-slate-200 text-slate-300'}`}>
                {done
                  ? <CheckCircle size={16} />
                  : <span className="text-xs font-bold">{idx + 1}</span>}
              </div>

              {/* Label */}
              <div className="mt-2 text-center px-1">
                <p className={`text-xs font-semibold
                  ${current ? 'text-primary' : done ? 'text-success' : 'text-slate-400'}`}>
                  {step === 'InProgress' ? 'In Progress' : step}
                </p>
                {historyEntry && (
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                    {new Date(historyEntry.changedAt).toLocaleDateString('en-PK', {
                      month: 'short', day: 'numeric',
                    })}
                  </p>
                )}
              </div>
            </div>

            {/* Connector line (not after last) */}
            {idx < STATUS_STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mt-4 mx-1
                ${idx < currentIdx ? 'bg-success' : 'bg-slate-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Action Buttons ─────────────────────────────────────────────────────────────

function ActionsCard({
  booking, isCustomer, isProvider, actionLoading,
  showCancelInput, cancelReason,
  onSetCancelReason, onShowCancel,
  onConfirm, onStartJob, onComplete, onDispute, onCancel,
}) {
  const { status } = booking
  const canCancel  = ['Pending', 'Confirmed'].includes(status)

  return (
    <div className="card space-y-3">
      <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">
        Actions
      </p>

      {/* Provider actions */}
      {isProvider && status === 'Pending' && (
        <ActionButton
          icon={<CheckCircle size={16} />}
          label="Confirm Booking"
          color="bg-success hover:bg-green-600"
          onClick={onConfirm}
          loading={actionLoading}
        />
      )}
      {isProvider && status === 'Confirmed' && (
        <ActionButton
          icon={<PlayCircle size={16} />}
          label="Start Job"
          color="bg-primary hover:bg-primary-dark"
          onClick={onStartJob}
          loading={actionLoading}
        />
      )}
      {isProvider && status === 'InProgress' && (
        <ActionButton
          icon={<CheckCircle size={16} />}
          label="Mark as Completed"
          color="bg-success hover:bg-green-600"
          onClick={onComplete}
          loading={actionLoading}
        />
      )}

      {/* Customer dispute */}
      {isCustomer && ['InProgress', 'Completed'].includes(status) && (
        <ActionButton
          icon={<AlertTriangle size={16} />}
          label="Raise Dispute"
          color="bg-orange-500 hover:bg-orange-600"
          onClick={onDispute}
          loading={actionLoading}
        />
      )}

      {/* Cancel (both roles) */}
      {canCancel && (
        <>
          {!showCancelInput ? (
            <ActionButton
              icon={<XCircle size={16} />}
              label="Cancel Booking"
              color="bg-danger hover:bg-red-700"
              onClick={() => onShowCancel(true)}
              loading={actionLoading}
              variant="outline"
            />
          ) : (
            <div className="space-y-2">
              <textarea
                rows={2}
                value={cancelReason}
                onChange={(e) => onSetCancelReason(e.target.value)}
                placeholder="Reason for cancellation..."
                className="input-field resize-none text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={onCancel}
                  disabled={actionLoading}
                  className="flex-1 bg-danger text-white py-2 rounded-lg text-sm
                             font-medium hover:bg-red-700 transition-colors"
                >
                  Confirm Cancel
                </button>
                <button
                  onClick={() => onShowCancel(false)}
                  className="flex-1 border border-slate-300 text-slate-600 py-2
                             rounded-lg text-sm hover:bg-slate-50 transition-colors"
                >
                  Keep Booking
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ActionButton({ icon, label, color, onClick, loading, variant }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`w-full flex items-center justify-center gap-2 py-2.5
                 rounded-lg text-sm font-medium text-white transition-colors
                 disabled:opacity-50 ${color}`}
    >
      {loading ? <LoadingSpinner size="sm" /> : icon}
      {label}
    </button>
  )
}

// ── Invoice Section ────────────────────────────────────────────────────────────

function InvoiceSection({ invoice, isProvider, onDownload, onConfirmCash, actionLoading }) {
  if (!invoice) {
    return (
      <div className="card border-2 border-dashed border-slate-200">
        <p className="text-sm text-slate-400 text-center py-3">
          Invoice is being generated...
        </p>
      </div>
    )
  }

  return (
    <div className="card">
      <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
        🧾 Invoice — {invoice.invoiceNumber}
      </h2>

      <div className="space-y-2 mb-4">
        <InvoiceRow label="Subtotal"   value={formatCurrency(invoice.subTotal)} />
        <InvoiceRow
          label={`Platform fee (${(invoice.platformCommissionRate * 100).toFixed(0)}%)`}
          value={formatCurrency(invoice.platformCommissionAmount)}
          muted
        />
        <hr className="border-slate-100" />
        <InvoiceRow
          label="Total (Customer pays)"
          value={formatCurrency(invoice.totalAmount)}
          bold
        />
      </div>

      {/* COD status */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm mb-4
        ${invoice.isCashCollected ? 'bg-green-50 text-success' : 'bg-yellow-50 text-yellow-700'}`}>
        {invoice.isCashCollected ? '✓ Cash Received' : '⏳ Cash Pending'}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onDownload}
          className="flex-1 flex items-center justify-center gap-2 border
                     border-slate-300 text-slate-700 py-2 rounded-lg text-sm
                     font-medium hover:bg-slate-50 transition-colors"
        >
          <Download size={15} /> Download PDF
        </button>

        {isProvider && !invoice.isCashCollected && (
          <button
            onClick={onConfirmCash}
            disabled={actionLoading}
            className="flex-1 bg-success text-white py-2 rounded-lg text-sm
                       font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
          >
            {actionLoading ? 'Confirming...' : 'Confirm Cash Received'}
          </button>
        )}
      </div>
    </div>
  )
}

function InvoiceRow({ label, value, muted, bold }) {
  return (
    <div className="flex justify-between text-sm">
      <span className={muted ? 'text-slate-400' : 'text-slate-600'}>{label}</span>
      <span className={bold ? 'font-bold text-primary' : muted ? 'text-slate-400' : 'font-medium'}>
        {value}
      </span>
    </div>
  )
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-0.5">
        {label}
      </p>
      <p className="text-sm font-medium text-slate-800">{value}</p>
    </div>
  )
}

// Maps status string → integer for the API (matches BookingStatus enum)
function statusToInt(status) {
  return { Confirmed: 1, Cancelled: 5, InProgress: 2, Completed: 3, Disputed: 6 }[status] ?? 0
}