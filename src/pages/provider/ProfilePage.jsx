import { useState, useEffect } from 'react'
import { Edit3, Save, X, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { providerApi } from '../../api/providerApi'
import { formatCurrency, getInitials, renderStars } from '../../utils/formatters'
import toast from 'react-hot-toast'

const DOCUMENT_TYPES = [
  { value: 0, label: 'CNIC' },
  { value: 1, label: 'Trade License' },
  { value: 2, label: 'Certification' },
]

export default function ProviderProfilePage() {
  const [profile, setProfile]     = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [editMode, setEditMode]   = useState(false)
  const [form, setForm]           = useState({})
  const [isSaving, setIsSaving]   = useState(false)

  // Document upload state
  const [docType, setDocType]     = useState(0)
  const [docUrl, setDocUrl]       = useState('')
  const [isUploading, setIsUploading] = useState(false)

  const load = () => {
    providerApi.getMyProfile()
      .then(({ data }) => {
        setProfile(data)
        setForm({
          businessName:        data.businessName,
          bio:                 data.bio,
          phoneNumber:         data.phoneNumber,
          city:                data.city,
          baseHourlyRate:      data.baseHourlyRate,
          serviceAreaRadiusKm: data.serviceAreaRadiusKm,
        })
      })
      .catch(() => toast.error('Could not load profile.'))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => { load() }, [])

  const set = (field) => (e) =>
    setForm((p) => ({ ...p, [field]: e.target.value }))

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await providerApi.updateProfile(form)
      toast.success('Profile updated!')
      setEditMode(false)
      load()
    } catch {}
    finally { setIsSaving(false) }
  }

  const handleCancelEdit = () => {
    setEditMode(false)
    setForm({
      businessName:        profile.businessName,
      bio:                 profile.bio,
      phoneNumber:         profile.phoneNumber,
      city:                profile.city,
      baseHourlyRate:      profile.baseHourlyRate,
      serviceAreaRadiusKm: profile.serviceAreaRadiusKm,
    })
  }

  const handleUploadDoc = async () => {
    if (!docUrl.trim()) { toast.error('Please enter a document URL.'); return }
    setIsUploading(true)
    try {
      await providerApi.uploadDocument({ documentType: docType, documentUrl: docUrl.trim() })
      toast.success('Document uploaded for review!')
      setDocUrl('')
      load()
    } catch {}
    finally { setIsUploading(false) }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner text="Loading profile..." />
        </div>
      </DashboardLayout>
    )
  }

  if (!profile) return null

  const verificationColor = {
    Approved:    'text-success bg-green-50',
    Pending:     'text-yellow-700 bg-yellow-50',
    UnderReview: 'text-blue-700 bg-blue-50',
    Rejected:    'text-danger bg-red-50',
  }[profile.verificationStatus] || 'text-slate-600 bg-slate-50'

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-5">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
          {!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              className="flex items-center gap-2 px-4 py-2 border border-slate-300
                         text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50"
            >
              <Edit3 size={15} /> Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleCancelEdit}
                className="flex items-center gap-1.5 px-4 py-2 border border-slate-300
                           text-slate-600 rounded-lg text-sm hover:bg-slate-50"
              >
                <X size={15} /> Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white
                           rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50"
              >
                {isSaving ? <LoadingSpinner size="sm" /> : <Save size={15} />}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        {/* ── Identity card ──────────────────────────────────────── */}
        <div className="card">
          <div className="flex items-center gap-4 mb-5">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-2xl bg-primary-light flex items-center
                            justify-center text-primary font-bold text-xl flex-shrink-0">
              {getInitials(profile.businessName)}
            </div>
            <div className="flex-1 min-w-0">
              {editMode ? (
                <input
                  value={form.businessName}
                  onChange={set('businessName')}
                  className="input-field font-semibold"
                  placeholder="Business Name"
                />
              ) : (
                <h2 className="text-xl font-bold text-slate-900 truncate">
                  {profile.businessName}
                </h2>
              )}
              <p className="text-sm text-slate-500 mt-0.5">{profile.fullName}</p>

              {/* Rating */}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-yellow-400 text-sm">
                  {renderStars(profile.averageRating)}
                </span>
                <span className="text-xs text-slate-500">
                  {profile.averageRating?.toFixed(1)} · {profile.totalJobsCompleted} jobs
                </span>
              </div>
            </div>

            {/* Verification badge */}
            <span className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold
                             ${verificationColor}`}>
              {profile.verificationStatus}
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Email" value={profile.email} readOnly />
            <EditableField
              label="Phone Number"
              value={form.phoneNumber}
              onChange={set('phoneNumber')}
              editMode={editMode}
              display={profile.phoneNumber}
            />
            <EditableField
              label="City"
              value={form.city}
              onChange={set('city')}
              editMode={editMode}
              display={profile.city}
            />
            <EditableField
              label="Base Hourly Rate (PKR)"
              value={form.baseHourlyRate}
              onChange={set('baseHourlyRate')}
              type="number"
              editMode={editMode}
              display={formatCurrency(profile.baseHourlyRate)}
            />
            <EditableField
              label="Service Radius (km)"
              value={form.serviceAreaRadiusKm}
              onChange={set('serviceAreaRadiusKm')}
              type="number"
              editMode={editMode}
              display={`${profile.serviceAreaRadiusKm} km`}
            />
          </div>

          {/* Bio */}
          <div className="mt-4">
            <label className="block text-xs font-medium text-slate-500
                              uppercase tracking-wide mb-1.5">
              Bio
            </label>
            {editMode ? (
              <textarea
                value={form.bio}
                onChange={set('bio')}
                rows={4}
                maxLength={1000}
                className="input-field resize-none"
                placeholder="Describe your expertise and experience..."
              />
            ) : (
              <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3 leading-relaxed">
                {profile.bio || 'No bio added yet.'}
              </p>
            )}
          </div>
        </div>

        {/* ── Verification Documents ──────────────────────────────── */}
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-4">
            Verification Documents
          </h2>

          {/* Existing docs */}
          {profile.verificationDocuments?.length > 0 ? (
            <div className="space-y-3 mb-5">
              {profile.verificationDocuments.map((doc) => {
                const statusStyle = {
                  Approved:    { icon: <CheckCircle size={14} />, color: 'text-success' },
                  Pending:     { icon: <Clock size={14} />,       color: 'text-yellow-600' },
                  UnderReview: { icon: <Clock size={14} />,       color: 'text-blue-600' },
                  Rejected:    { icon: <AlertCircle size={14} />, color: 'text-danger' },
                }[doc.status] || { icon: null, color: 'text-slate-500' }

                return (
                  <div key={doc.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{doc.documentType}</p>
                      <a href={doc.documentUrl} target="_blank" rel="noreferrer"
                        className="text-xs text-primary hover:underline">
                        View document ↗
                      </a>
                    </div>
                    <span className={`flex items-center gap-1 text-xs font-semibold
                                     ${statusStyle.color}`}>
                      {statusStyle.icon}
                      {doc.status}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-400 mb-4">
              No documents uploaded yet. Upload your CNIC to get verified.
            </p>
          )}

          {/* Upload new doc */}
          <div className="border-t border-slate-100 pt-4">
            <p className="text-sm font-medium text-slate-700 mb-3">
              Upload a New Document
            </p>
            <div className="flex gap-2 flex-wrap">
              <select
                value={docType}
                onChange={(e) => setDocType(Number(e.target.value))}
                className="input-field w-auto"
              >
                {DOCUMENT_TYPES.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
              <input
                type="url"
                value={docUrl}
                onChange={(e) => setDocUrl(e.target.value)}
                placeholder="Document URL (upload to cloud, paste link)"
                className="input-field flex-1 min-w-[200px]"
              />
              <button
                onClick={handleUploadDoc}
                disabled={isUploading}
                className="px-4 py-2.5 bg-primary text-white rounded-lg text-sm
                           font-medium hover:bg-primary-dark disabled:opacity-50"
              >
                {isUploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Upload files to Google Drive or Dropbox and paste the shareable link here.
            </p>
          </div>
        </div>

        {/* ── Email verification notice ───────────────────────────── */}
        {!profile.isEmailVerified && (
          <div className="flex items-center gap-3 bg-yellow-50 rounded-xl p-4">
            <AlertCircle size={18} className="text-yellow-600 flex-shrink-0" />
            <p className="text-sm text-yellow-700">
              Your email is not verified. Check your inbox for the verification link.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

// ── Reusable field components ──────────────────────────────────────────────────

function Field({ label, value, readOnly }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className={`text-sm font-medium ${readOnly ? 'text-slate-400' : 'text-slate-800'}`}>
        {value || '—'}
      </p>
    </div>
  )
}

function EditableField({ label, value, onChange, type = 'text', editMode, display }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500
                        uppercase tracking-wide mb-1">
        {label}
      </label>
      {editMode ? (
        <input
          type={type}
          value={value}
          onChange={onChange}
          className="input-field"
        />
      ) : (
        <p className="text-sm font-medium text-slate-800">{display || '—'}</p>
      )}
    </div>
  )
}