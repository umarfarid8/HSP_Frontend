import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, MessageSquare, Clock } from 'lucide-react'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { adminApi } from '../../api/adminApi'
import { formatDate, formatCurrency, getInitials } from '../../utils/formatters'
import toast from 'react-hot-toast'

const RESOLUTIONS = [
  { value: 'FavorCustomer', label: '👤 Favour Customer',  sub: 'Booking → Cancelled'  },
  { value: 'FavorProvider', label: '🔧 Favour Provider',  sub: 'Booking → Completed'  },
  { value: 'Mutual',        label: '🤝 Mutual Agreement', sub: 'You set the final status' },
]

// BookingStatus enum integers
const STATUS_OPTS = [
  { label: 'Completed', value: 3 },
  { label: 'Cancelled', value: 5 },
]

export default function DisputesPage() {
  const [disputes, setDisputes]     = useState([])
  const [isLoading, setIsLoading]   = useState(true)
  const [openId, setOpenId]         = useState(null)
  const [detail, setDetail]         = useState({})
  const [loadingDetail, setLoadingDetail] = useState(null)
  const [form, setForm]             = useState({})
  const [resolvingId, setResolvingId] = useState(null)

  const load = () => {
    adminApi.getDisputes()
      .then(({ data }) => setDisputes(data || []))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleOpen = async (bookingId) => {
    if (openId === bookingId) { setOpenId(null); return }
    setOpenId(bookingId)
    if (!detail[bookingId]) {
      setLoadingDetail(bookingId)
      try {
        const { data } = await adminApi.getDispute(bookingId)
        setDetail((prev) => ({ ...prev, [bookingId]: data }))
        setForm((prev) => ({
          ...prev,
          [bookingId]: { resolution: 'FavorProvider', adminNotes: '', finalStatus: 3 },
        }))
      } catch {}
      finally { setLoadingDetail(null) }
    }
  }

  const setField = (bookingId, field, value) =>
    setForm((prev) => ({
      ...prev,
      [bookingId]: { ...prev[bookingId], [field]: value },
    }))

  const handleResolve = async (bookingId) => {
    const f = form[bookingId]
    if (!f?.adminNotes?.trim()) { toast.error('Admin notes are required.'); return }
    setResolvingId(bookingId)
    try {
      await adminApi.resolveDispute(bookingId, {
        resolution:  f.resolution,
        adminNotes:  f.adminNotes.trim(),
        finalStatus: f.resolution === 'FavorCustomer' ? 5
                   : f.resolution === 'FavorProvider' ? 3
                   : f.finalStatus,
      })
      toast.success('Dispute resolved successfully.')
      setOpenId(null)
      load()
    } catch {}
    finally { setResolvingId(null) }
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Dispute Resolution</h1>
        <p className="text-slate-500 text-sm mt-1">
          {disputes.length} active dispute{disputes.length !== 1 ? 's' : ''}
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner text="Loading disputes..." />
        </div>
      ) : disputes.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-4xl mb-3">✅</div>
          <p className="font-semibold text-slate-700">No active disputes</p>
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map((d) => {
            const isOpen  = openId === d.bookingId
            const det     = detail[d.bookingId]
            const f       = form[d.bookingId] || {}
            const loading = loadingDetail === d.bookingId

            return (
              <div key={d.bookingId} className="card">
                {/* Summary row */}
                <div
                  className="flex items-start gap-4 cursor-pointer"
                  onClick={() => handleOpen(d.bookingId)}
                >
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center
                                  justify-center text-danger font-bold flex-shrink-0">
                    ⚠️
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="font-semibold text-slate-900">{d.serviceCategory}</p>
                        <p className="text-sm text-slate-500">
                          {d.customerName} → {d.businessName} ({d.providerName})
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold text-slate-800">
                          {formatCurrency(d.estimatedAmount)}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {formatDate(d.scheduledDate)} · {d.scheduledTime}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="badge-danger">Disputed</span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock size={11} />
                        Disputed {formatDate(d.disputedAt)}
                      </span>
                    </div>
                  </div>
                  <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 flex-shrink-0">
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="mt-5 pt-5 border-t border-slate-100">
                    {loading ? (
                      <div className="flex justify-center py-8">
                        <LoadingSpinner text="Loading transcript..." />
                      </div>
                    ) : det ? (
                      <div className="space-y-5">

                        {/* Chat transcript */}
                        <div>
                          <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                            <MessageSquare size={15} /> Chat Transcript
                          </p>
                          <div className="bg-slate-50 rounded-xl p-4 max-h-64
                                          overflow-y-auto space-y-3">
                            {det.chatTranscript?.length === 0 ? (
                              <p className="text-sm text-slate-400 text-center py-4">
                                No messages in this thread
                              </p>
                            ) : (
                              det.chatTranscript?.map((msg, i) => (
                                <div key={i}
                                  className={`flex gap-2 ${msg.senderRole === 'Customer'
                                    ? 'flex-row' : 'flex-row-reverse'}`}>
                                  <div className={`w-7 h-7 rounded-full flex-shrink-0 flex
                                                  items-center justify-center text-xs font-bold
                                    ${msg.senderRole === 'Customer'
                                      ? 'bg-blue-100 text-primary'
                                      : 'bg-purple-100 text-purple-600'}`}>
                                    {getInitials(msg.senderName)}
                                  </div>
                                  <div className={`max-w-[70%] px-3 py-2 rounded-xl text-sm
                                    ${msg.senderRole === 'Customer'
                                      ? 'bg-white text-slate-800 rounded-tl-sm'
                                      : 'bg-primary text-white rounded-tr-sm'}`}>
                                    <p className="leading-relaxed">{msg.content}</p>
                                    <p className={`text-[10px] mt-1
                                      ${msg.senderRole === 'Customer'
                                        ? 'text-slate-400' : 'text-white/70'}`}>
                                      {msg.senderName} ·{' '}
                                      {new Date(msg.sentAt).toLocaleString('en-PK', {
                                        month: 'short', day: 'numeric',
                                        hour: '2-digit', minute: '2-digit',
                                      })}
                                    </p>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Resolution form */}
                        <div>
                          <p className="text-sm font-semibold text-slate-700 mb-3">
                            Resolution Decision
                          </p>

                          {/* Decision options */}
                          <div className="grid sm:grid-cols-3 gap-2 mb-4">
                            {RESOLUTIONS.map((r) => (
                              <button
                                key={r.value}
                                type="button"
                                onClick={() => setField(d.bookingId, 'resolution', r.value)}
                                className={`p-3 rounded-xl border-2 text-left transition-colors
                                  ${f.resolution === r.value
                                    ? 'border-primary bg-primary-light'
                                    : 'border-slate-200 hover:border-slate-300'}`}
                              >
                                <p className="text-sm font-semibold text-slate-800">{r.label}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{r.sub}</p>
                              </button>
                            ))}
                          </div>

                          {/* Manual status if Mutual */}
                          {f.resolution === 'Mutual' && (
                            <div className="mb-4">
                              <label className="block text-xs font-medium text-slate-600 mb-1">
                                Final Booking Status
                              </label>
                              <select
                                value={f.finalStatus}
                                onChange={(e) =>
                                  setField(d.bookingId, 'finalStatus', Number(e.target.value))}
                                className="input-field w-auto"
                              >
                                {STATUS_OPTS.map((s) => (
                                  <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                              </select>
                            </div>
                          )}

                          {/* Admin notes */}
                          <textarea
                            rows={3}
                            value={f.adminNotes || ''}
                            onChange={(e) => setField(d.bookingId, 'adminNotes', e.target.value)}
                            placeholder="Admin notes — explain your decision (required)…"
                            className="input-field resize-none mb-4"
                          />

                          <button
                            onClick={() => handleResolve(d.bookingId)}
                            disabled={resolvingId === d.bookingId}
                            className="w-full bg-primary text-white py-3 rounded-xl
                                       text-sm font-semibold hover:bg-primary-dark
                                       disabled:opacity-50 transition-colors"
                          >
                            {resolvingId === d.bookingId
                              ? 'Resolving...'
                              : 'Submit Resolution'}
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </DashboardLayout>
  )
}