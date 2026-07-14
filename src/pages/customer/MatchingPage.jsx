import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Star, Briefcase, MapPin, Sparkles,
  Crown, AlertCircle, ChevronRight,
} from 'lucide-react'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { formatCurrency, renderStars, getInitials } from '../../utils/formatters'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const PROBLEM_EXAMPLES = [
  'My kitchen drain has been backing up since yesterday',
  'The ceiling fan makes a loud grinding noise',
  'Bathroom tap is dripping constantly',
  'Air conditioner is not cooling at all',
  'Front door lock is stuck and won\'t open',
]

export default function MatchingPage() {
  const navigate = useNavigate()

  const [query, setQuery]         = useState('')
  const [result, setResult]       = useState(null)
  const [error, setError]         = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async (e) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (trimmed.length < 5) {
      toast.error('Please describe your problem in a few words.')
      return
    }

    setIsLoading(true)
    setHasSearched(true)
    setResult(null)
    setError(null)

    try {
      const { data } = await api.post('/match/hybrid', { query: trimmed })
      setResult(data)
    } catch (err) {
      // Backend returns 400 for low-confidence queries with a helpful message
      const msg = err.response?.data?.message
      setError(msg || 'Search failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const goToProfile = (providerId, provider) =>
    navigate(`/providers/${providerId}`, { state: { provider } })

  const bookProvider = (providerId, provider) =>
    navigate('/customer/bookings/new', {
      state: { providerProfileId: providerId, provider },
    })

  return (
    <DashboardLayout>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Sparkles size={22} className="text-primary" />
          Find the Right Professional
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Describe your problem in plain words — AI identifies the service and finds the best match
        </p>
      </div>

      {/* Search form */}
      <div className="card mb-6">
        <form onSubmit={handleSearch}>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            What's the problem?
          </label>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={3}
            placeholder="e.g. My kitchen drain has been backing up since yesterday and water is pooling under the sink..."
            className="input-field resize-none mb-3"
          />

          {/* Example chips */}
          {!query && (
            <div className="mb-4">
              <p className="text-xs text-slate-400 mb-2">Quick examples:</p>
              <div className="flex flex-wrap gap-2">
                {PROBLEM_EXAMPLES.map((ex) => (
                  <button
                    key={ex} type="button"
                    onClick={() => setQuery(ex)}
                    className="text-xs bg-slate-100 hover:bg-primary-light hover:text-primary
                               text-slate-600 px-3 py-1.5 rounded-full transition-colors"
                  >
                    {ex.slice(0, 38)}…
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || query.trim().length < 5}
            className="btn-primary flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <><LoadingSpinner size="sm" /><span>Analysing your request…</span></>
            ) : (
              <><Search size={17} /><span>Find Best Providers</span></>
            )}
          </button>
        </form>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="card text-center py-14">
          <div className="text-5xl mb-4 animate-pulse">🧠</div>
          <p className="font-semibold text-slate-800 text-lg">
            Understanding your problem…
          </p>
          <p className="text-slate-400 text-sm mt-2">
            Identifying the service category, then finding the best providers in your area
          </p>
        </div>
      )}

      {/* Low-confidence error state */}
      {!isLoading && hasSearched && error && (
        <div className="card border-2 border-orange-200 bg-orange-50">
          <div className="flex items-start gap-3">
            <AlertCircle size={22} className="text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-orange-800">We couldn't understand the request</p>
              <p className="text-sm text-orange-700 mt-1">{error}</p>
              <button
                onClick={() => { setQuery(''); setError(null); setHasSearched(false) }}
                className="mt-3 text-sm text-orange-600 font-medium hover:underline"
              >
                Try again with different words →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {!isLoading && result && (
        <div className="space-y-5">

          {/* Classification badge */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-primary-light text-primary
                            px-4 py-2 rounded-full text-sm font-semibold">
              <Sparkles size={14} />
              Identified: {result.classifiedCategory}
            </div>
            <span className="text-xs text-slate-400">
              {(result.confidenceScore * 100).toFixed(0)}% confidence
              · {result.totalProvidersFound} provider{result.totalProvidersFound !== 1 ? 's' : ''} found
              {result.servedFromCache && ' · ⚡ from cache'}
            </span>
          </div>

          {/* ── PREMIUM BANNER — Top pick ────────────────────────── */}
          {result.aiSuggestedProvider && (
            <PremiumBanner
              provider={result.aiSuggestedProvider}
              onViewProfile={() =>
                goToProfile(result.aiSuggestedProvider.providerProfileId,
                            result.aiSuggestedProvider)}
              onBook={() =>
                bookProvider(result.aiSuggestedProvider.providerProfileId,
                             result.aiSuggestedProvider)}
            />
          )}

          {/* ── SECONDARY GRID ───────────────────────────────────── */}
          {result.remainingProviders.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Other providers in your area
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

          {/* Only one provider found */}
          {result.remainingProviders.length === 0 && result.aiSuggestedProvider && (
            <p className="text-sm text-slate-400 text-center py-2">
              Only one {result.classifiedCategory} provider found in your city right now.
            </p>
          )}
        </div>
      )}
    </DashboardLayout>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PREMIUM BANNER — Rank 1 provider
// ─────────────────────────────────────────────────────────────────────────────

function PremiumBanner({ provider: p, onViewProfile, onBook }) {
  return (
    <div className="relative overflow-hidden rounded-2xl
                    bg-gradient-to-br from-primary to-blue-700 p-5 text-white shadow-lg">

      {/* Badge */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center gap-1.5 bg-white/20 rounded-full
                        px-3 py-1 text-xs font-bold backdrop-blur-sm">
          <Crown size={13} className="text-yellow-300" />
          AI Best Match Selection
        </div>
        <span className="text-xs text-white/60">Highest rated in your area</span>
      </div>

      <div className="flex gap-4">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center
                        justify-center text-white font-bold text-xl flex-shrink-0
                        backdrop-blur-sm">
          {getInitials(p.businessName)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-white">{p.businessName}</h2>
          <p className="text-white/80 text-sm">{p.providerName}</p>

          <div className="flex flex-wrap items-center gap-3 mt-2">
            {/* Stars */}
            <div className="flex items-center gap-1">
              <span className="text-yellow-300 text-sm">
                {'★'.repeat(Math.round(p.averageRating))}
                {'☆'.repeat(5 - Math.round(p.averageRating))}
              </span>
              <span className="text-white/80 text-xs font-semibold">
                {p.averageRating.toFixed(1)}
              </span>
            </div>

            <span className="text-white/70 text-xs flex items-center gap-1">
              <Briefcase size={11} /> {p.totalJobsCompleted} jobs
            </span>

            <span className="text-white/70 text-xs flex items-center gap-1">
              <MapPin size={11} /> {p.city}
            </span>
          </div>

          {/* Service tags */}
          {p.serviceNames?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {p.serviceNames.slice(0, 3).map((s) => (
                <span key={s}
                  className="bg-white/15 text-white/90 text-[11px] font-medium
                             px-2 py-0.5 rounded-full backdrop-blur-sm">
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Rate */}
        <div className="text-right flex-shrink-0 hidden sm:block">
          <p className="text-2xl font-bold text-white">
            {formatCurrency(p.baseHourlyRate)}
          </p>
          <p className="text-white/60 text-xs">/hour</p>
          {p.experienceYears > 0 && (
            <p className="text-white/60 text-xs mt-1">
              {p.experienceYears} yr exp.
            </p>
          )}
        </div>
      </div>

      {/* Mobile rate */}
      <div className="sm:hidden mt-3">
        <span className="text-lg font-bold">{formatCurrency(p.baseHourlyRate)}</span>
        <span className="text-white/60 text-xs">/hr</span>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={onViewProfile}
          className="flex-1 bg-white/20 hover:bg-white/30 text-white py-2.5
                     rounded-xl text-sm font-semibold transition-colors backdrop-blur-sm"
        >
          View Profile
        </button>
        <button
          onClick={onBook}
          className="flex-1 bg-white text-primary py-2.5 rounded-xl text-sm
                     font-bold hover:bg-white/90 transition-colors shadow-md"
        >
          Book Now
        </button>
      </div>

      {/* Decorative circle */}
      <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/5
                      rounded-full pointer-events-none" />
      <div className="absolute -bottom-8 -left-4 w-24 h-24 bg-white/5
                      rounded-full pointer-events-none" />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SECONDARY CARD — Rank 2..N providers
// ─────────────────────────────────────────────────────────────────────────────

function SecondaryCard({ provider: p, onViewProfile, onBook }) {
  return (
    <div className="card flex items-center gap-4 hover:shadow-md
                    transition-shadow group">
      {/* Avatar */}
      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center
                      justify-center text-slate-600 font-bold flex-shrink-0">
        {getInitials(p.businessName)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 truncate">{p.businessName}</p>
        <p className="text-xs text-slate-500 truncate">{p.providerName}</p>

        <div className="flex flex-wrap items-center gap-3 mt-1">
          <span className="text-yellow-400 text-xs">
            {renderStars(p.averageRating)}
            <span className="text-slate-500 ml-1">{p.averageRating.toFixed(1)}</span>
          </span>
          <span className="text-xs text-slate-400">
            {p.totalJobsCompleted} jobs
          </span>
          <span className="text-xs text-slate-400 flex items-center gap-0.5">
            <MapPin size={10} /> {p.city}
          </span>
        </div>
      </div>

      {/* Rate + actions */}
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold text-slate-800">
          {formatCurrency(p.baseHourlyRate)}
          <span className="text-xs font-normal text-slate-400">/hr</span>
        </p>
        <div className="flex gap-1.5 mt-2">
          <button
            onClick={onViewProfile}
            className="text-xs border border-slate-300 text-slate-600 px-3 py-1.5
                       rounded-lg hover:bg-slate-50 transition-colors"
          >
            Profile
          </button>
          <button
            onClick={onBook}
            className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg
                       hover:bg-primary-dark transition-colors font-medium"
          >
            Book
          </button>
        </div>
      </div>
    </div>
  )
}