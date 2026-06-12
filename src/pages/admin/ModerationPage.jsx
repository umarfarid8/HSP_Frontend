import { useState, useEffect } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { adminApi } from '../../api/adminApi'
import { formatDate } from '../../utils/formatters'
import toast from 'react-hot-toast'

// ModerationStatus enum: 1 = Approved, 2 = Rejected
const DECISIONS = [
  { value: 1, label: 'Approve', icon: <CheckCircle size={14} />,
    style: 'bg-success text-white hover:bg-green-600' },
  { value: 2, label: 'Reject',  icon: <XCircle size={14} />,
    style: 'bg-danger text-white hover:bg-red-700' },
]

export default function ModerationPage() {
  const [items, setItems]         = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [notes, setNotes]         = useState({})
  const [decidingId, setDecidingId] = useState(null)

  const load = () => {
    adminApi.getModerationQueue()
      .then(({ data }) => setItems(data || []))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDecide = async (moderationItemId, decision) => {
    setDecidingId(moderationItemId)
    try {
      await adminApi.moderateReview(moderationItemId, {
        decision,
        adminNotes: notes[moderationItemId]?.trim() || null,
      })
      toast.success(decision === 1 ? 'Review approved and published.' : 'Review rejected.')
      load()
    } catch {}
    finally { setDecidingId(null) }
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Review Moderation</h1>
        <p className="text-slate-500 text-sm mt-1">
          {items.length} flagged review{items.length !== 1 ? 's' : ''} awaiting decision
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner text="Loading moderation queue..." />
        </div>
      ) : items.length === 0 ? (
        <div className="card text-center py-16">
          <CheckCircle size={40} className="text-success mx-auto mb-3" />
          <p className="font-semibold text-slate-700">Queue is empty!</p>
          <p className="text-sm text-slate-400 mt-1">All flagged reviews have been reviewed.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.moderationItemId} className="card">
              {/* Review content */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="font-semibold text-slate-900">{item.reviewerName}</p>
                    <span className="text-xs text-slate-400">reviewed</span>
                    <p className="font-semibold text-slate-900">{item.revieweeName}</p>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-yellow-400">{'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}</span>
                    <span className="text-xs text-slate-400">{formatDate(item.flaggedAt)}</span>
                  </div>
                  <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3 leading-relaxed">
                    "{item.comment}"
                  </p>
                </div>

                {/* Authenticity score */}
                <div className="text-center flex-shrink-0">
                  <div className={`w-16 h-16 rounded-full border-4 flex items-center
                                   justify-center font-bold text-lg
                    ${item.authenticityScore < 0.3 ? 'border-danger text-danger'
                    : item.authenticityScore < 0.6 ? 'border-orange-400 text-orange-500'
                    : 'border-yellow-400 text-yellow-600'}`}>
                    {(item.authenticityScore * 100).toFixed(0)}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Auth Score</p>
                </div>
              </div>

              {/* Flag reason */}
              <div className="bg-orange-50 rounded-lg px-3 py-2 mb-4">
                <p className="text-xs font-semibold text-orange-700 mb-0.5">
                  🚩 Why this was flagged:
                </p>
                <p className="text-xs text-orange-600">{item.flagReason}</p>
              </div>

              {/* Admin notes */}
              <textarea
                rows={2}
                value={notes[item.moderationItemId] || ''}
                onChange={(e) =>
                  setNotes((prev) => ({ ...prev, [item.moderationItemId]: e.target.value }))}
                placeholder="Admin notes (optional)…"
                className="input-field resize-none mb-3 text-sm"
              />

              {/* Decision buttons */}
              <div className="flex gap-2">
                {DECISIONS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => handleDecide(item.moderationItemId, d.value)}
                    disabled={decidingId === item.moderationItemId}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5
                               rounded-xl text-sm font-semibold transition-colors
                               disabled:opacity-50 ${d.style}`}
                  >
                    {decidingId === item.moderationItemId
                      ? <LoadingSpinner size="sm" />
                      : d.icon}
                    {d.label} Review
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}