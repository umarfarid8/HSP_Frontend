import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { bookingApi } from '../../api/bookingApi'
import { reviewApi } from '../../api/reviewApi'
import { formatDate, getInitials } from '../../utils/formatters'
import toast from 'react-hot-toast'

const RATING_LABELS = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent',
}

export default function SubmitReviewPage() {
  const navigate         = useNavigate()
  const [searchParams]   = useSearchParams()
  const bookingId        = searchParams.get('bookingId')

  const [booking, setBooking]       = useState(null)
  const [rating, setRating]         = useState(0)
  const [comment, setComment]       = useState('')
  const [isLoading, setIsLoading]   = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(false)

  useEffect(() => {
    if (!bookingId) { navigate(-1); return }

    bookingApi.getById(bookingId)
      .then(({ data }) => {
        if (data.status !== 'Completed') {
          toast.error('Reviews can only be submitted for completed bookings.')
          navigate(-1)
          return
        }
        setBooking(data)
      })
      .catch(() => navigate(-1))
      .finally(() => setIsLoading(false))
  }, [bookingId])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (rating === 0) {
      toast.error('Please select a star rating.')
      return
    }
    if (comment.trim().length < 10) {
      toast.error('Please write at least 10 characters in your review.')
      return
    }

    setIsSubmitting(true)
    try {
      await reviewApi.submitReview({
        bookingId,
        rating,
        comment: comment.trim(),
      })
      setSubmitted(true)
    } catch { /* error handled by interceptor */ }
    finally { setIsSubmitting(false) }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner text="Loading booking details..." />
        </div>
      </DashboardLayout>
    )
  }

  if (!booking) return null

  // ── Success State ─────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <DashboardLayout>
        <div className="max-w-lg mx-auto text-center py-16">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center
                          justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-success" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Review Submitted!
          </h1>
          <p className="text-slate-500 mb-8">
            Thank you for your feedback. It helps other customers find the right provider.
          </p>

          {/* Show what they submitted */}
          <div className="card text-left mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary-light flex items-center
                              justify-center text-primary font-bold">
                {getInitials(booking.businessName)}
              </div>
              <div>
                <p className="font-semibold text-slate-900">{booking.businessName}</p>
                <p className="text-sm text-slate-500">{booking.serviceCategory}</p>
              </div>
            </div>

            <div className="text-2xl text-yellow-400 mb-2">
              {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
              <span className="text-sm font-medium text-slate-600 ml-2">
                {RATING_LABELS[rating]}
              </span>
            </div>

            <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 leading-relaxed">
              "{comment}"
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/customer/bookings')}
              className="flex-1 btn-secondary"
            >
              My Bookings
            </button>
            <button
              onClick={() => navigate('/customer/dashboard')}
              className="flex-1 btn-primary"
            >
              Dashboard
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // ── Review Form ───────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-slate-500
                   hover:text-slate-800 mb-5 transition-colors"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="max-w-xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Write a Review</h1>
          <p className="text-slate-500 text-sm mt-1">
            Share your experience to help others make better decisions
          </p>
        </div>

        {/* Booking context card */}
        <div className="card mb-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center
                          justify-center text-primary font-bold text-lg flex-shrink-0">
            {getInitials(booking.businessName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900">{booking.businessName}</p>
            <p className="text-sm text-slate-500">
              {booking.serviceCategory} · {formatDate(booking.scheduledDate)}
            </p>
          </div>
          <span className="badge-success flex-shrink-0">Completed</span>
        </div>

        {/* Review form */}
        <form onSubmit={handleSubmit} className="card space-y-6">

          {/* Star rating */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              How was the overall experience?
            </label>
            <StarRating
              value={rating}
              onChange={setRating}
            />
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Tell us more{' '}
              <span className="font-normal text-slate-400">(required, min. 10 characters)</span>
            </label>
            <textarea
              rows={5}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Was the provider on time? Did they solve your problem? Would you recommend them?"
              required
              minLength={10}
              maxLength={500}
              className="input-field resize-none"
            />
            <div className="flex justify-between mt-1">
              <p className="text-xs text-slate-400">
                Be honest and specific — vague reviews get less trust
              </p>
              <p className={`text-xs ${comment.length > 450 ? 'text-orange-500' : 'text-slate-400'}`}>
                {comment.length}/500
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || rating === 0}
            className="btn-primary flex items-center justify-center gap-2"
          >
            {isSubmitting
              ? <><LoadingSpinner size="sm" /> Submitting...</>
              : 'Submit Review'}
          </button>
        </form>

        <p className="text-xs text-slate-400 text-center mt-4">
          All reviews are checked by our team before being published.
        </p>
      </div>
    </DashboardLayout>
  )
}

// ── Interactive Star Rating ───────────────────────────────────────────────────

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0)
  const display = hover || value

  return (
    <div>
      {/* Stars */}
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="text-5xl transition-all duration-100 hover:scale-110 leading-none"
          >
            <span className={
              display >= star
                ? 'text-yellow-400 drop-shadow-sm'
                : 'text-slate-200'
            }>
              ★
            </span>
          </button>
        ))}
      </div>

      {/* Label below stars */}
      <div className="mt-3 h-6">
        {display > 0 && (
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold
              ${display <= 2 ? 'text-danger'
              : display === 3 ? 'text-yellow-600'
              : 'text-success'}`}>
              {display} — {RATING_LABELS[display]}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}