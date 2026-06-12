// All currency formatted in Pakistani Rupees
export const formatCurrency = (amount) =>
  `PKR ${Number(amount || 0).toLocaleString('en-PK')}`

export const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-PK', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

export const formatTime = (timeStr) =>
  timeStr ? timeStr.slice(0, 5) : ''

// Maps a booking status string to the right Tailwind badge class
export const statusBadgeClass = (status) => ({
  Pending:    'badge-pending',
  Confirmed:  'badge-info',
  InProgress: 'badge-info',
  Completed:  'badge-success',
  Cancelled:  'badge-danger',
  Disputed:   'badge-danger',
}[status] || 'badge-pending')

// Renders filled/empty stars for a 1-5 rating
export const renderStars = (rating) => {
  const full  = Math.floor(rating)
  const empty = 5 - full
  return '★'.repeat(full) + '☆'.repeat(empty)
}

// Returns user's initials for avatar placeholders
export const getInitials = (name = '') =>
  name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

// Mirrors the backend pricing engine — used for live estimates in the booking form
export function estimatePrice(baseHourlyRate, startTime, endTime, dateStr, isEmergency) {
  if (!startTime || !endTime || !baseHourlyRate) return null

  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  const startMins = sh * 60 + sm
  const endMins   = eh * 60 + em

  if (endMins <= startMins) return null

  const durationHours = (endMins - startMins) / 60
  const baseAmount    = baseHourlyRate * durationHours

  let multiplier     = 1
  const surcharges   = []

  if (isEmergency) {
    multiplier *= 1.5
    surcharges.push('Emergency surcharge ×1.5')
  }
  if (sh < 9 || sh >= 18) {
    multiplier *= 1.25
    surcharges.push('Off-hours surcharge ×1.25')
  }
  const day = dateStr ? new Date(dateStr).getDay() : -1
  if (day === 0 || day === 6) {
    multiplier *= 1.20
    surcharges.push('Weekend surcharge ×1.20')
  }

  return {
    durationHours,
    baseAmount:  Math.round(baseAmount),
    finalAmount: Math.round(baseAmount * multiplier),
    surcharges,
  }
}