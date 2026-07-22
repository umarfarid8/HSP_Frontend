import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Sparkles, AlertCircle, Crown,
  MapPin, Briefcase, ListFilter, Zap,
} from 'lucide-react'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { formatCurrency, renderStars, getInitials } from '../../utils/formatters'
import api from '../../api/axios'
import { serviceCategoryApi } from '../../api/serviceCategoryApi'
import toast from 'react-hot-toast'

const PROBLEM_EXAMPLES = [
  'My kitchen drain has been backing up since yesterday',
  'The ceiling fan makes a loud grinding noise',
  'Bathroom tap is dripping constantly',
  'Air conditioner is not cooling at all',
]

export default function MatchingPage() {
  const navigate = useNavigate()

  // Toggle between AI mode and Manual mode
  const [mode, setMode]             = useState('ai')  // 'ai' | 'manual'
  const [categories, setCategories] = useState([])

  // AI search state
  const [query, setQuery]           = useState('')

  // Manual search state
  const [selectedCat, setSelectedCat] = useState('')
  const [cityOverride, setCityOverride] = useState('')

  // Shared result state
  const [result, setResult]         = useState(null)
  const [error, setError]           = useState(null)
  const [isLoading, setIsLoading]   = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  useEffect(() => {
    serviceCategoryApi.getAll().then(({ data }) => setCategories(data || []))
  }, [])

  const reset = () => { setResult(null); setError(null); setHasSearched(false) }

  const handleAISearch = async (e) => {
    e.preventDefault()
    if (query.trim().length < 5) { toast.error('Please describe your problem.'); return }
    setIsLoading(true); setHasSearched(true); setResult(null); setError(null)
    try {
      const { data } = await api.post('/match/hybrid', { query: query.trim() })
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Search failed.')
    } finally { setIsLoading(false) }
  }

  const handleManualSearch = async (e) => {
    e.preventDefault()
    if (!selectedCat) { toast.error('Please select a service category.'); return }
    setIsLoading(true); setHasSearched(true); setResult(null); setError(null)
    try {
      const { data } = await api.post('/match/manual', {
        serviceCategoryId: selectedCat,
        city: cityOverride.trim() || undefined,
      })
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.message || 'No providers found.')
    } finally { setIsLoading(false) }
  }

  const goToProfile = (id, p) => navigate(`/providers/${id}`, { state: { provider: p } })
  const bookProvider = (id, p) => navigate('/customer/bookings/new', {
    state: { providerProfileId: id, provider: p },
  })

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Search size={22} className="text-primary" /> Find a Professional
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Use AI search or browse by category manually
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex bg-slate-100 rounded-xl p-1 mb-5 w-fit">
        {[
          { key: 'ai',     icon: <Sparkles size={14} />,    label: 'AI Search'     },
          { key: 'manual', icon: <ListFilter size={14} />,  label: 'Browse Manually' },
        ].map(({ key, icon, label }) => (
          <button
            key={key}
            onClick={() => { setMode(key); reset() }}
            className={`flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-medium
                       transition-colors ${mode === key
                         ? 'bg-white text-primary shadow-sm'
                         : 'text-slate-500 hover:text-slate-700'}`}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* ── AI SEARCH FORM ────────────────────────────────────────── */}
      {mode === 'ai' && (
        <div className="card mb-6">
          <form onSubmit={handleAISearch}>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Describe your problem
            </label>
            <textarea
              rows={3} value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. My kitchen drain has been backing up since yesterday..."
              className="input-field resize-none mb-3"
            />
            {!query && (
              <div className="mb-3 flex flex-wrap gap-2">
                {PROBLEM_EXAMPLES.map((ex) => (
                  <button key={ex} type="button"
                    onClick={() => setQuery(ex)}
                    className="text-xs bg-slate-100 hover:bg-primary-light hover:text-primary
                               text-slate-600 px-3 py-1.5 rounded-full transition-colors">
                    {ex.slice(0, 36)}…
                  </button>
                ))}
              </div>
            )}
            <button type="submit" disabled={isLoading || query.trim().length < 5}
              className="btn-primary flex items-center justify-center gap-2">
              {isLoading
                ? <><LoadingSpinner size="sm" /><span>Analysing…</span></>
                : <><Sparkles size={16} /><span>AI Search</span></>}
            </button>
          </form>
        </div>
      )}

      {/* ── MANUAL SEARCH FORM ───────────────────────────────────── */}
      {mode === 'manual' && (
        <div className="card mb-6">
          <form onSubmit={handleManualSearch}>
            <p className="text-sm text-slate-500 mb-4 bg-blue-50 rounded-lg p-3">
              ℹ️ Browse providers directly by service type.
              Your profile city is used unless you enter a different one below.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Service Category <span className="text-danger">*</span>
                </label>
                <select
                  value={selectedCat}
                  onChange={(e) => setSelectedCat(e.target.value)}
                  required
                  className="input-field"
                >
                  <option value="">Select a service…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  City <span className="text-slate-400 font-normal">(optional override)</span>
                </label>
                <input
                  type="text" value={cityOverride}
                  onChange={(e) => setCityOverride(e.target.value)}
                  placeholder="Leave blank to use your profile city"
                  className="input-field"
                />
              </div>
            </div>

            <button type="submit" disabled={isLoading || !selectedCat}
              className="btn-primary flex items-center justify-center gap-2">
              {isLoading
                ? <><LoadingSpinner size="sm" /><span>Searching…</span></>
                : <><Search size={16} /><span>Find Providers</span></>}
            </button>
          </form>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="card text-center py-12">
          <div className="text-4xl mb-3 animate-pulse">
            {mode === 'ai' ? '🧠' : '🔍'}
          </div>
          <p className="font-semibold text-slate-700">
            {mode === 'ai' ? 'Identifying the service…' : 'Searching providers…'}
          </p>
        </div>
      )}

      {/* Error */}
      {!isLoading && hasSearched && error && (
        <div className="card border-2 border-orange-200 bg-orange-50">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-orange-800">Search didn't return results</p>
              <p className="text-sm text-orange-700 mt-1">{error}</p>
              {mode === 'ai' && (
                <button
                  onClick={() => { setMode('manual'); reset() }}
                  className="mt-3 text-sm text-orange-700 font-semibold underline"
                >
                  Try manual search instead →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {!isLoading && result && (
        <div className="space-y-5">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-primary-light text-primary
                            px-4 py-2 rounded-full text-sm font-semibold">
              {mode === 'ai' ? <Sparkles size={14} /> : <ListFilter size={14} />}
              {result.classifiedCategory}
            </div>
            <span className="text-xs text-slate-400">
              {result.totalProvidersFound} provider{result.totalProvidersFound !== 1 ? 's' : ''} found
              {mode === 'ai' && ` · ${(result.confidenceScore * 100).toFixed(0)}% confidence`}
              {result.servedFromCache && ' · ⚡ cached'}
            </span>
          </div>

          {result.aiSuggestedProvider && (
            <PremiumBanner
              provider={result.aiSuggestedProvider}
              onViewProfile={() => goToProfile(result.aiSuggestedProvider.providerProfileId, result.aiSuggestedProvider)}
              onBook={() => bookProvider(result.aiSuggestedProvider.providerProfileId, result.aiSuggestedProvider)}
            />
          )}

          {result.remainingProviders.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Other providers
              </h2>
              <div className="space-y-3">
                {result.remainingProviders.map((p) => (
                  <SecondaryCard
                    key={p.providerProfileId}
                    provider={p}
                    onViewProfile={() => goToProfile(p.providerProfileId, p)}
                    onBook={() => bookProvider(p.providerProfileId, p)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  )
}

// (PremiumBanner and SecondaryCard components unchanged from previous file — keep them as-is)
function PremiumBanner({ provider: p, onViewProfile, onBook }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br
                    from-primary to-blue-700 p-5 text-white shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1
                        text-xs font-bold backdrop-blur-sm">
          <Crown size={13} className="text-yellow-300" />
          {p.totalJobsCompleted > 0 ? 'Highest Rated · Best Match' : 'Top Pick'}
        </div>
      </div>
      <div className="flex gap-4">
        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center
                        text-white font-bold text-xl flex-shrink-0">
          {getInitials(p.businessName)}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold">{p.businessName}</h2>
          <p className="text-white/80 text-sm">{p.providerName}</p>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <span className="text-yellow-300 text-sm">
              {'★'.repeat(Math.round(p.averageRating))}{'☆'.repeat(5 - Math.round(p.averageRating))}
              <span className="text-white/80 text-xs ml-1">{p.averageRating.toFixed(1)}</span>
            </span>
            <span className="text-white/70 text-xs flex items-center gap-1">
              <Briefcase size={11} />{p.totalJobsCompleted} jobs
            </span>
            <span className="text-white/70 text-xs flex items-center gap-1">
              <MapPin size={11} />{p.city}
            </span>
          </div>
        </div>
        <div className="text-right hidden sm:block flex-shrink-0">
          <p className="text-2xl font-bold">{formatCurrency(p.baseHourlyRate)}</p>
          <p className="text-white/60 text-xs">/hour</p>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button onClick={onViewProfile}
          className="flex-1 bg-white/20 hover:bg-white/30 text-white py-2.5
                     rounded-xl text-sm font-semibold transition-colors">
          View Profile
        </button>
        <button onClick={onBook}
          className="flex-1 bg-white text-primary py-2.5 rounded-xl text-sm
                     font-bold hover:bg-white/90 transition-colors shadow-md">
          Book Now
        </button>
      </div>
      <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/5 rounded-full pointer-events-none"/>
    </div>
  )
}

function SecondaryCard({ provider: p, onViewProfile, onBook }) {
  return (
    <div className="card flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center
                      text-slate-600 font-bold flex-shrink-0">
        {getInitials(p.businessName)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 truncate">{p.businessName}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-yellow-400 text-xs">
            {renderStars(p.averageRating)}
            <span className="text-slate-500 ml-1">{p.averageRating.toFixed(1)}</span>
          </span>
          <span className="text-xs text-slate-400">{p.totalJobsCompleted} jobs</span>
          <span className="text-xs text-slate-400 flex items-center gap-0.5">
            <MapPin size={10}/>{p.city}
          </span>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold text-slate-800">
          {formatCurrency(p.baseHourlyRate)}<span className="text-xs font-normal text-slate-400">/hr</span>
        </p>
        <div className="flex gap-1.5 mt-2">
          <button onClick={onViewProfile}
            className="text-xs border border-slate-300 text-slate-600 px-3 py-1.5
                       rounded-lg hover:bg-slate-50 transition-colors">Profile</button>
          <button onClick={onBook}
            className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg
                       hover:bg-primary-dark transition-colors font-medium">Book</button>
        </div>
      </div>
    </div>
  )
}