import { useState, useEffect } from 'react'
import { Edit3, Save, X, AlertCircle } from 'lucide-react'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { customerApi } from '../../api/customerApi'
import { formatDate, getInitials } from '../../utils/formatters'
import toast from 'react-hot-toast'

export default function CustomerProfilePage() {
  const [profile, setProfile]     = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [editMode, setEditMode]   = useState(false)
  const [form, setForm]           = useState({})
  const [isSaving, setIsSaving]   = useState(false)

  const load = () => {
    customerApi.getMyProfile()
      .then(({ data }) => {
        setProfile(data)
        setForm({
          fullName:    data.fullName,
          phoneNumber: data.phoneNumber,
          city:        data.city,
          address:     data.address,
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
      await customerApi.updateProfile(form)
      toast.success('Profile updated!')
      setEditMode(false)
      load()
    } catch {}
    finally { setIsSaving(false) }
  }

  const handleCancelEdit = () => {
    setEditMode(false)
    setForm({
      fullName:    profile.fullName,
      phoneNumber: profile.phoneNumber,
      city:        profile.city,
      address:     profile.address,
    })
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

  return (
    <DashboardLayout>
      <div className="max-w-xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
          {!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              className="flex items-center gap-2 px-4 py-2 border border-slate-300
                         text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50"
            >
              <Edit3 size={15} /> Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={handleCancelEdit}
                className="flex items-center gap-1.5 px-4 py-2 border border-slate-300
                           text-slate-600 rounded-lg text-sm hover:bg-slate-50">
                <X size={15} /> Cancel
              </button>
              <button onClick={handleSave} disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white
                           rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50">
                {isSaving ? <LoadingSpinner size="sm" /> : <Save size={15} />}
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>

        {/* Avatar + identity */}
        <div className="card">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-primary-light flex items-center
                            justify-center text-primary font-bold text-xl">
              {getInitials(profile.fullName)}
            </div>
            <div>
              <p className="font-bold text-slate-900 text-lg">{profile.fullName}</p>
              <p className="text-sm text-slate-500">{profile.email}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Member since {formatDate(profile.memberSince)}
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Full name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-500
                                uppercase tracking-wide mb-1">Full Name</label>
              {editMode
                ? <input value={form.fullName} onChange={set('fullName')} className="input-field" />
                : <p className="text-sm font-medium text-slate-800">{profile.fullName}</p>}
            </div>

            {/* Email — always read-only */}
            <div>
              <label className="block text-xs font-medium text-slate-500
                                uppercase tracking-wide mb-1">Email</label>
              <p className="text-sm text-slate-400">{profile.email}</p>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-medium text-slate-500
                                uppercase tracking-wide mb-1">Phone</label>
              {editMode
                ? <input value={form.phoneNumber} onChange={set('phoneNumber')} className="input-field" />
                : <p className="text-sm font-medium text-slate-800">{profile.phoneNumber || '—'}</p>}
            </div>

            {/* City */}
            <div>
              <label className="block text-xs font-medium text-slate-500
                                uppercase tracking-wide mb-1">City</label>
              {editMode
                ? <input value={form.city} onChange={set('city')} className="input-field" />
                : <p className="text-sm font-medium text-slate-800">{profile.city || '—'}</p>}
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs font-medium text-slate-500
                                uppercase tracking-wide mb-1">Address</label>
              {editMode
                ? <input value={form.address} onChange={set('address')} className="input-field" />
                : <p className="text-sm font-medium text-slate-800">{profile.address || '—'}</p>}
            </div>
          </div>
        </div>

        {/* Email verification notice */}
        {!profile.isEmailVerified && (
          <div className="flex items-center gap-3 bg-yellow-50 rounded-xl p-4">
            <AlertCircle size={18} className="text-yellow-600 flex-shrink-0" />
            <p className="text-sm text-yellow-700">
              Your email address is not verified yet.
              Check your inbox for the verification link.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}