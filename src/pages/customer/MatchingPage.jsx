import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Star, Briefcase, MapPin, Sparkles } from 'lucide-react'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { matchApi } from '../../api/matchApi'
import { formatCurrency, renderStars, getInitials } from '../../utils/formatters'
import toast from 'react-hot-toast'

// Common problem examples shown as quick-fill chips
const PROBLEM_EXAMPLES = [
  'My kitchen drain is blocked and water is pooling',
  'The ceiling fan is making a loud noise',
  'Bathroom tap is leaking constantly',
  'Air conditioner is not cooling properly',
  'Front door lock is broken and won\'t open',
]

export default function MatchingPage() {
  const navigate = useNavigate()

  const [problem, setProblem]     = useState('')
  const [results, setResults]     = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async (e) => {
    e.preventDefault()
    if (problem.trim().length < 10) {
      toast.error('Please describe your problem in at least 10 characters.')
      return
    }

    setIsLoading(true)
    setHasSearched(true)

    try {
      const { data } = await matchApi.findProviders({ problemDescription: problem })
      setResults(data)
    } catch {
      // Error toast already shown by Axios interceptor
    } finally {
      setIsLoading(false)
    }
  }

  const handleExampleClick = (text) => {
    setProblem(text)
  }

  return (
    <DashboardLayout>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Sparkles size={22} className="text-primary" />
          Find the Right Professional
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Describe your problem in plain words — our AI finds the best match
        </p>
      </div>

      {/* Search form */}
      <div className="card mb-6">
        <form onSubmit={handleSearch}>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            What's the problem?
          </label>
          <textarea
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            rows={4}
            placeholder="e.g. My kitchen drain has been backing up since yesterday and water is pooling under the sink..."
            className="input-field resize-none mb-3"
          />

          {/* Example chips */}
          {!problem && (
            <div className="mb-4">
              <p className="text-xs text-slate-400 mb-2">Try an example:</p>
              <div className="flex flex-wrap gap-2">
                {PROBLEM_EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => handleExampleClick(ex)}
                    className="text-xs bg-slate-100 hover:bg-primary-light
                               hover:text-primary text-slate-600 px-3 py-1.5
                               rounded-full transition-colors"
                  >
                    {ex.slice(0, 40)}…
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || problem.trim().length < 10}
            className="btn-primary flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" />
                <span>AI is finding the best match...</span>
              </>
            ) : (
              <>
                <Search size={17} />
                <span>Find Best Providers</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="card text-center py-12">
          <div className="text-4xl mb-4 animate-bounce">🤖</div>
          <p className="font-semibold text-slate-800 text-lg">Analyzing your request</p>
          <p className="text-slate-400 text-sm mt-2">
            Reading provider bios, ratings, and customer reviews...
          </p>
        </div>
      )}

      {/* Results */}
      {!isLoading && results && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-slate-800">
                {results.rankedProviders.length} Providers Found
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluated {results.totalProvidersEvaluated} providers in your area
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {results.rankedProviders.map((provider) => (
              <ProviderResultCard
                key={provider.providerProfileId}
                provider={provider}
                onViewProfile={() =>
                  navigate(`/providers/${provider.providerProfileId}`, {
                    state: { provider },
                  })
                }
                onBook={() =>
                  navigate(`/providers/${provider.providerProfileId}`, {
                    state: { provider, openBooking: true },
                  })
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state — search done but no results */}
      {!isLoading && hasSearched && results?.rankedProviders?.length === 0 && (
        <div className="card text-center py-12">
          <div className="text-4xl mb-3">😕</div>
          <p className="font-semibold text-slate-700">No providers found in your city</p>
          <p className="text-sm text-slate-400 mt-1">
            Make sure your profile city is set correctly, then try again.
          </p>
        </div>
      )}
    </DashboardLayout>
  )
}

// ── Provider Result Card ───────────────────────────────────────────────────────

function ProviderResultCard({ provider, onViewProfile, onBook }) {
  const isTopPick = provider.rank === 1

  return (
    <div className={`card relative overflow-hidden transition-shadow hover:shadow-md
                     ${isTopPick ? 'ring-2 ring-primary' : ''}`}>

      {/* Top pick ribbon */}
      {isTopPick && (
        <div className="absolute top-0 right-0 bg-primary text-white text-xs
                        font-bold px-3 py-1 rounded-bl-lg">
          ✦ Best Match
        </div>
      )}

      <div className="flex gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-14 h-14 rounded-xl bg-primary-light flex items-center
                          justify-center text-primary font-bold text-lg">
            {getInitials(provider.businessName)}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-slate-900">{provider.businessName}</h3>
              <p className="text-sm text-slate-500">{provider.providerName}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold text-slate-800">
                {formatCurrency(provider.baseHourlyRate)}
                <span className="text-xs font-normal text-slate-400">/hr</span>
              </p>
            </div>
          </div>

          {/* Rating + jobs */}
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-yellow-500 text-sm">
              {renderStars(provider.averageRating)}
            </span>
            <span className="text-xs text-slate-500">
              {provider.averageRating?.toFixed(1)} · {provider.totalJobsCompleted} jobs
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <MapPin size={11} /> {provider.city}
            </span>
          </div>

          {/* AI explanation tag — the key differentiator for this card */}
          <div className="mt-2.5 bg-primary-light rounded-lg px-3 py-1.5">
            <p className="text-xs font-medium text-primary">
              ✦ {provider.explanationTag}
            </p>
          </div>

          {/* AI score bar */}
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 bg-slate-100 rounded-full h-1.5">
              <div
                className="bg-primary h-1.5 rounded-full transition-all"
                style={{ width: `${(provider.aiScore * 100).toFixed(0)}%` }}
              />
            </div>
            <span className="text-xs text-slate-400 flex-shrink-0">
              {(provider.aiScore * 100).toFixed(0)}% match
            </span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={onViewProfile}
          className="flex-1 btn-secondary py-2 text-sm"
        >
          View Profile
        </button>
        <button
          onClick={onBook}
          className="flex-1 bg-primary text-white py-2 px-4 rounded-lg text-sm
                     font-medium hover:bg-primary-dark transition-colors"
        >
          Book Now
        </button>
      </div>
    </div>
  )
}