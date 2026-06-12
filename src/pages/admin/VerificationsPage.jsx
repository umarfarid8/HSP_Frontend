import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { adminApi } from '../../api/adminApi'
import { formatDate, formatCurrency, getInitials } from '../../utils/formatters'
import toast from 'react-hot-toast'

export default function VerificationsPage() {
  const [providers, setProviders]         = useState([])
  const [isLoading, setIsLoading]         = useState(true)
  const [expandedId, setExpandedId]       = useState(null)
  const [rejectingId, setRejectingId]     = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [actionId, setActionId]           = useState(null)

  const load = () => {
    adminApi.getPendingVerifications()
      .then(({ data }) => setProviders(data || []))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleApprove = async (id, name) => {
    setActionId(id)
    try {
      await adminApi.approveVerification(id)
      toast.success(`${name} has been approved!`)
      load()
    } catch {}
    finally { setActionId(null) }
  }

  const handleReject = async (id, name) => {
    if (!rejectionReason.trim()) {
      toast.error('Please enter a rejection reason.')
      return
    }
    setActionId(id)
    try {
      await adminApi.rejectVerification(id, { rejectionReason: rejectionReason.trim() })
      toast.success(`${name}'s application has been rejected.`)
      setRejectingId(null)
      setRejectionReason('')
      load()
    } catch {}
    finally { setActionId(null) }
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Provider Verifications</h1>
        <p className="text-slate-500 text-sm mt-1">
          {providers.length} provider{providers.length !== 1 ? 's' : ''} awaiting verification
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner text="Loading pending verifications..." />
        </div>
      ) : providers.length === 0 ? (
        <div className="card text-center py-16">
          <CheckCircle size={40} className="text-success mx-auto mb-3" />
          <p className="font-semibold text-slate-700">All caught up!</p>
          <p className="text-sm text-slate-400 mt-1">No pending verifications.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {providers.map((p) => (
            <VerificationCard
              key={p.providerProfileId}
              provider={p}
              isExpanded={expandedId === p.providerProfileId}
              onToggleExpand={() =>
                setExpandedId((prev) =>
                  prev === p.providerProfileId ? null : p.providerProfileId
                )
              }
              isRejecting={rejectingId === p.providerProfileId}
              rejectionReason={rejectingId === p.providerProfileId ? rejectionReason : ''}
              onSetRejectionReason={setRejectionReason}
              onShowReject={() => setRejectingId(p.providerProfileId)}
              onHideReject={() => { setRejectingId(null); setRejectionReason('') }}
              onApprove={() => handleApprove(p.providerProfileId, p.businessName)}
              onReject={() => handleReject(p.providerProfileId, p.businessName)}
              isActioning={actionId === p.providerProfileId}
            />
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}

function VerificationCard({
  provider, isExpanded, onToggleExpand,
  isRejecting, rejectionReason, onSetRejectionReason,
  onShowReject, onHideReject, onApprove, onReject, isActioning,
}) {
  const p = provider

  return (
    <div className="card">
      {/* Header row */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center
                        justify-center text-purple-600 font-bold text-lg flex-shrink-0">
          {getInitials(p.businessName)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <h3 className="font-semibold text-slate-900">{p.businessName}</h3>
              <p className="text-sm text-slate-500">{p.providerName} · {p.city}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="badge-pending">{p.verificationStatus}</span>
              <p className="text-xs text-slate-400">
                Joined {formatDate(p.registeredAt)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-500">
            <span>📧 {p.email}</span>
            <span>📱 {p.phoneNumber}</span>
            <span>🪪 CNIC: {p.cnic}</span>
            <span>💰 {formatCurrency(p.baseHourlyRate)}/hr</span>
          </div>
        </div>

        {/* Expand toggle */}
        <button
          onClick={onToggleExpand}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 flex-shrink-0"
        >
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {/* Expanded detail */}
      {isExpanded && (
        <div className="mt-5 pt-5 border-t border-slate-100 space-y-4">
          {/* Bio */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Bio
            </p>
            <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3 leading-relaxed">
              {p.bio || 'No bio provided.'}
            </p>
          </div>

          {/* Documents */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Submitted Documents ({p.documents?.length || 0})
            </p>
            {p.documents?.length === 0 ? (
              <p className="text-sm text-danger">⚠️ No documents submitted yet</p>
            ) : (
              <div className="space-y-2">
                {p.documents.map((doc) => (
                  <div key={doc.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{doc.documentType}</p>
                      <p className="text-xs text-slate-400">{formatDate(doc.uploadedAt)}</p>
                    </div>
                    <a
                      href={doc.documentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      View <ExternalLink size={11} />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          {!isRejecting ? (
            <div className="flex gap-3 pt-2">
              <button
                onClick={onApprove}
                disabled={isActioning}
                className="flex-1 flex items-center justify-center gap-2 bg-success
                           text-white py-2.5 rounded-xl text-sm font-semibold
                           hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                {isActioning ? <LoadingSpinner size="sm" /> : <CheckCircle size={16} />}
                Approve Provider
              </button>
              <button
                onClick={onShowReject}
                className="flex-1 flex items-center justify-center gap-2 bg-red-50
                           text-danger py-2.5 rounded-xl text-sm font-semibold
                           hover:bg-red-100 transition-colors"
              >
                <XCircle size={16} /> Reject
              </button>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => onSetRejectionReason(e.target.value)}
                placeholder="Reason for rejection (required — provider will be notified)…"
                className="input-field resize-none"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={onReject}
                  disabled={isActioning}
                  className="flex-1 bg-danger text-white py-2.5 rounded-xl text-sm
                             font-semibold hover:bg-red-700 disabled:opacity-50"
                >
                  {isActioning ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
                <button
                  onClick={onHideReject}
                  className="flex-1 border border-slate-300 text-slate-600 py-2.5
                             rounded-xl text-sm hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}