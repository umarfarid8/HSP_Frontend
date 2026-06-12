import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { Star, Briefcase, MapPin, Clock, ArrowLeft } from 'lucide-react'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { providerApi } from '../../api/providerApi'
import { reviewApi } from '../../api/reviewApi'
import { availabilityApi } from '../../api/availabilityApi'
import {
  formatCurrency, formatDate, renderStars, getInitials,
} from '../../utils/formatters'

export default function ProviderProfilePage() {
  const { id }         = useParams()
  const { state }      = useLocation()
  const navigate       = useNavigate()

  // Use data passed from MatchingPage (fast) or fetch fresh (direct URL visit)
  const [provider, setProvider]           = useState(state?.provider || null)
  const [reviews, setReviews]             = useState(null)
  const [availability, setAvailability]   = useState(null)
  const [selectedDate, setSelectedDate]   = useState('')
  const [isLoadingProfile, setIsLoadingProfile] = useState(!state?.provider)
  const [isLoadingReviews, setIsLoadingReviews] = useState(true)
  const [isCheckingDate, setIsCheckingDate]     = useState(false)

  // Fetch full profile if we don't have it from navigation state
  useEffect(() => {
    if (!provider) {
      providerApi.getPublicProfile(id)
        .then(({ data }) => setProvider(data))
        .catch(() => navigate('/customer/match'))
        .finally(() => setIsLoadingProfile(false))
    }
  }, [id])

  // Always fetch reviews fresh
  useEffect(() => {
    reviewApi.getProviderReviews(id)
      .then(({ data }) => setReviews(data))
      .catch(() => setReviews({ totalReviews: 0, averageRating: 0, reviews: [] }))
      .finally(() => setIsLoadingReviews(false))
  }, [id])

  const handleCheckAvailability = async () => {
    if (!selectedDate) return
    setIsCheckingDate(true)
    try {
      const { data } = await availabilityApi.getProviderAvailability(id, selectedDate)
      setAvailability(data)
    } catch {}
    finally { setIsCheckingDate(false) }
  }

  const handleBook = () => {
    navigate('/customer/bookings/new', {
      state: { providerProfileId: id, provider },
    })
  }

  if (isLoadingProfile) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner text="Loading profile..." />
        </div>
      </DashboardLayout>
    )
  }

  if (!provider) return null

  return (
    <DashboardLayout>
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-slate-500
                   hover:text-slate-800 mb-5 transition-colors"
      >
        <ArrowLeft size={16} /> Back to results
      </button>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* ── Left column: profile info ────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Hero card */}
          <div className="card">
            <div className="flex gap-4">
              <div className="w-16 h-16 rounded-xl bg-primary-light flex items-center
                              justify-center text-primary font-bold text-xl flex-shrink-0">
                {getInitials(provider.businessName)}
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-slate-900">
                  {provider.businessName}
                </h1>
                <p className="text-slate-500 text-sm">{provider.providerName}</p>

                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <span className="text-yellow-500 text-sm">
                    {renderStars(provider.averageRating)}
                  </span>
                  <span className="text-sm text-slate-600">
                    {provider.averageRating?.toFixed(1)} ({reviews?.totalReviews || 0} reviews)
                  </span>
                  <span className="flex items-center gap-1 text-sm text-slate-500">
                    <Briefcase size={13} /> {provider.totalJobsCompleted} jobs completed
                  </span>
                  <span className="flex items-center gap-1 text-sm text-slate-500">
                    <MapPin size={13} /> {provider.city}
                  </span>
                </div>
              </div>
            </div>

            <p className="mt-4 text-slate-600 text-sm leading-relaxed">{provider.bio}</p>
          </div>

          {/* Services & pricing */}
          {provider.services?.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-slate-800 mb-4">Services & Pricing</h2>
              <div className="space-y-3">
                {provider.services.map((svc) => (
                  <div
                    key={svc.serviceCategoryId}
                    className="flex items-center justify-between p-3
                               bg-slate-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-slate-800 text-sm">
                        {svc.serviceCategory?.name || 'Service'}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {svc.yearsOfExperience} yr{svc.yearsOfExperience !== 1 ? 's' : ''} experience
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary text-sm">
                        {formatCurrency(svc.hourlyRate)}/hr
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          <div className="card">
            <h2 className="font-semibold text-slate-800 mb-4">Customer Reviews</h2>

            {isLoadingReviews ? (
              <div className="py-6 flex justify-center">
                <LoadingSpinner size="sm" />
              </div>
            ) : reviews?.reviews?.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">
                No reviews yet — be the first!
              </p>
            ) : (
              <>
                {/* Rating breakdown */}
                <RatingBreakdown
                  average={reviews.averageRating}
                  total={reviews.totalReviews}
                  breakdown={reviews.ratingBreakdown}
                />

                {/* Review list */}
                <div className="mt-5 space-y-4">
                  {reviews.reviews.map((r) => (
                    <ReviewItem key={r.id} review={r} />
                  ))}
                </div>
              </>
            )}
          </div>

        </div>

        {/* ── Right column: sticky booking panel ──────────────────── */}
        <div className="space-y-4">

          {/* Pricing summary */}
          <div className="card">
            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-1">
              Starting from
            </p>
            <p className="text-3xl font-bold text-primary">
              {formatCurrency(provider.baseHourlyRate)}
              <span className="text-base font-normal text-slate-400">/hr</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Price may vary based on job type and timing
            </p>

            <button
              onClick={handleBook}
              className="btn-primary mt-4"
            >
              Book This Provider
            </button>
          </div>

          {/* Availability checker */}
          <div className="card">
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Clock size={16} className="text-primary" />
              Check Availability
            </h3>

            <input
              type="date"
              value={selectedDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => {
                setSelectedDate(e.target.value)
                setAvailability(null)
              }}
              className="input-field mb-3"
            />

            <button
              onClick={handleCheckAvailability}
              disabled={!selectedDate || isCheckingDate}
              className="w-full border border-primary text-primary py-2 px-4
                         rounded-lg text-sm font-medium hover:bg-primary-light
                         transition-colors disabled:opacity-50"
            >
              {isCheckingDate ? 'Checking...' : 'Check Date'}
            </button>

            {/* Availability result */}
            {availability && (
              <div className={`mt-3 p-3 rounded-lg text-sm font-medium text-center
                               ${availability.isDayAvailable
                                 ? 'bg-green-50 text-success'
                                 : 'bg-red-50 text-danger'}`}>
                {availability.isDayAvailable ? (
                  <>
                    ✓ Available on {formatDate(selectedDate)}
                    <p className="font-normal text-xs mt-0.5">
                      Working hours: {availability.workingHoursStart}–{availability.workingHoursEnd}
                    </p>
                  </>
                ) : (
                  '✕ Not available on this date'
                )}
              </div>
            )}
          </div>

          {/* Verification badge */}
          {provider.isVerified && (
            <div className="card bg-green-50 border-green-200 flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="text-sm font-semibold text-success">Verified Professional</p>
                <p className="text-xs text-green-600">
                  Identity and credentials confirmed by HSP
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function RatingBreakdown({ average, total, breakdown = {} }) {
  return (
    <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-xl">
      <div className="text-center flex-shrink-0">
        <p className="text-4xl font-bold text-slate-900">{average?.toFixed(1)}</p>
        <p className="text-yellow-500 text-lg">{renderStars(average)}</p>
        <p className="text-xs text-slate-400">{total} reviews</p>
      </div>
      <div className="flex-1 space-y-1.5">
        {[5, 4, 3, 2, 1].map((star) => {
          const count   = breakdown[star] || 0
          const percent = total > 0 ? (count / total) * 100 : 0
          return (
            <div key={star} className="flex items-center gap-2">
              <span className="text-xs text-slate-500 w-3">{star}</span>
              <Star size={11} className="text-yellow-400 fill-yellow-400 flex-shrink-0" />
              <div className="flex-1 bg-slate-200 rounded-full h-1.5">
                <div
                  className="bg-yellow-400 h-1.5 rounded-full"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="text-xs text-slate-400 w-4">{count}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ReviewItem({ review }) {
  return (
    <div className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center
                          justify-center text-xs font-semibold text-slate-600">
            {getInitials(review.reviewerName)}
          </div>
          <span className="text-sm font-medium text-slate-800">
            {review.reviewerName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-yellow-500 text-xs">{renderStars(review.rating)}</span>
          <span className="text-xs text-slate-400">{formatDate(review.createdAt)}</span>
        </div>
      </div>
      <p className="text-sm text-slate-600 leading-relaxed ml-9">{review.comment}</p>
    </div>
  )
}