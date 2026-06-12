import { useState, useEffect } from 'react'
import { CalendarDays, Clock, Info } from 'lucide-react'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { availabilityApi } from '../../api/availabilityApi'
import toast from 'react-hot-toast'

// All 7 days in Pakistani calendar order (Mon–Sun is common for businesses)
const DAYS = [
  { name: 'Monday',    int: 1 },
  { name: 'Tuesday',   int: 2 },
  { name: 'Wednesday', int: 3 },
  { name: 'Thursday',  int: 4 },
  { name: 'Friday',    int: 5 },
  { name: 'Saturday',  int: 6 },
  { name: 'Sunday',    int: 0 },
]

// Half-hour time options: 07:00 to 22:00
const TIME_OPTIONS = (() => {
  const opts = []
  for (let h = 7; h <= 22; h++) {
    opts.push(`${String(h).padStart(2, '0')}:00`)
    if (h < 22) opts.push(`${String(h).padStart(2, '0')}:30`)
  }
  return opts
})()

const DEFAULT_SLOT = { active: false, startTime: '09:00', endTime: '17:00' }

// Build initial state — all days off by default
const buildEmptySchedule = () =>
  Object.fromEntries(DAYS.map(({ name }) => [name, { ...DEFAULT_SLOT }]))

// Transform API response → local state
const transformSlots = (slots) => {
  const schedule = buildEmptySchedule()
  slots
    .filter((s) => s.isRecurring && s.isAvailable)
    .forEach((s) => {
      if (schedule[s.dayOfWeek]) {
        schedule[s.dayOfWeek] = {
          active:    true,
          startTime: s.startTime.slice(0, 5), // "09:00:00" → "09:00"
          endTime:   s.endTime.slice(0, 5),
        }
      }
    })
  return schedule
}

export default function AvailabilityPage() {
  const [schedule, setSchedule]   = useState(buildEmptySchedule())
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving]   = useState(false)
  const [isDirty, setIsDirty]     = useState(false)

  useEffect(() => {
    availabilityApi.getMySchedule()
      .then(({ data }) => setSchedule(transformSlots(data)))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  // Toggle a day on/off
  const toggleDay = (dayName) => {
    setSchedule((prev) => ({
      ...prev,
      [dayName]: { ...prev[dayName], active: !prev[dayName].active },
    }))
    setIsDirty(true)
  }

  // Update start or end time for a day
  const updateTime = (dayName, field, value) => {
    setSchedule((prev) => ({
      ...prev,
      [dayName]: { ...prev[dayName], [field]: value },
    }))
    setIsDirty(true)
  }

  const handleSave = async () => {
    // Validate: all active days must have end > start
    for (const [dayName, slot] of Object.entries(schedule)) {
      if (slot.active && slot.endTime <= slot.startTime) {
        toast.error(`${dayName}: end time must be after start time.`)
        return
      }
    }

    const activeDays = Object.entries(schedule).filter(([, s]) => s.active)
    if (activeDays.length === 0) {
      toast.error('Please enable at least one working day.')
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        slots: activeDays.map(([dayName, slot]) => ({
          dayOfWeek:  DAYS.find((d) => d.name === dayName)?.int ?? 1,
          startTime:  slot.startTime + ':00',
          endTime:    slot.endTime   + ':00',
        })),
      }
      await availabilityApi.setWeeklySchedule(payload)
      toast.success('Weekly schedule saved successfully!')
      setIsDirty(false)
    } catch { /* handled by interceptor */ }
    finally { setIsSaving(false) }
  }

  const activeCount = Object.values(schedule).filter((s) => s.active).length

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner text="Loading your schedule..." />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarDays size={22} className="text-primary" />
            Weekly Availability
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Set the days and hours when customers can book you
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving || !isDirty}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium
                     transition-colors ${isDirty
                       ? 'bg-primary text-white hover:bg-primary-dark'
                       : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
        >
          {isSaving ? <LoadingSpinner size="sm" /> : null}
          {isSaving ? 'Saving...' : isDirty ? 'Save Schedule' : 'No Changes'}
        </button>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-blue-50 rounded-xl p-4 mb-6 text-sm">
        <Info size={16} className="text-primary mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium text-primary">How it works</p>
          <p className="text-slate-600 mt-0.5">
            Enable the days you work and set your hours. Customers can only book
            you within these windows. A 30-minute buffer is automatically added
            between jobs.
          </p>
        </div>
      </div>

      {/* Summary pills */}
      <div className="flex flex-wrap gap-2 mb-5">
        {DAYS.map(({ name }) => (
          <span
            key={name}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors
              ${schedule[name].active
                ? 'bg-primary text-white'
                : 'bg-slate-100 text-slate-400'}`}
          >
            {name.slice(0, 3)}
            {schedule[name].active && (
              <span className="ml-1 opacity-80">
                {schedule[name].startTime}–{schedule[name].endTime}
              </span>
            )}
          </span>
        ))}
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
          {activeCount} day{activeCount !== 1 ? 's' : ''} active
        </span>
      </div>

      {/* Day rows */}
      <div className="card space-y-0 divide-y divide-slate-100">
        {DAYS.map(({ name }) => {
          const slot      = schedule[name]
          const timeError = slot.active && slot.endTime <= slot.startTime

          return (
            <div
              key={name}
              className={`flex items-center gap-4 py-4 px-2 transition-colors
                         ${slot.active ? '' : 'opacity-50'}`}
            >
              {/* Toggle switch */}
              <button
                type="button"
                onClick={() => toggleDay(name)}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0
                  ${slot.active ? 'bg-primary' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow
                                 transition-transform
                                 ${slot.active ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>

              {/* Day name */}
              <p className={`w-24 text-sm font-medium flex-shrink-0
                ${slot.active ? 'text-slate-900' : 'text-slate-400'}`}>
                {name}
              </p>

              {/* Time range */}
              {slot.active ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <Clock size={14} className="text-slate-400 flex-shrink-0" />
                  <select
                    value={slot.startTime}
                    onChange={(e) => updateTime(name, 'startTime', e.target.value)}
                    className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm
                               text-slate-700 bg-white focus:ring-2 focus:ring-primary
                               focus:border-transparent outline-none"
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>

                  <span className="text-slate-400 text-sm">to</span>

                  <select
                    value={slot.endTime}
                    onChange={(e) => updateTime(name, 'endTime', e.target.value)}
                    className={`border rounded-lg px-2.5 py-1.5 text-sm bg-white
                               focus:ring-2 focus:ring-primary focus:border-transparent
                               outline-none transition-colors
                               ${timeError
                                 ? 'border-danger text-danger'
                                 : 'border-slate-200 text-slate-700'}`}
                  >
                    {TIME_OPTIONS.filter((t) => t > slot.startTime).map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>

                  {timeError && (
                    <span className="text-xs text-danger">End must be after start</span>
                  )}

                  {/* Hours indicator */}
                  {!timeError && (
                    <span className="text-xs text-slate-400">
                      ({calcHours(slot.startTime, slot.endTime)} hrs)
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">Day off</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Save button (bottom) */}
      <div className="flex justify-end mt-6">
        <button
          onClick={handleSave}
          disabled={isSaving || !isDirty}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold
                     transition-colors ${isDirty
                       ? 'bg-primary text-white hover:bg-primary-dark shadow-md'
                       : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
        >
          {isSaving && <LoadingSpinner size="sm" />}
          {isSaving ? 'Saving changes...' : 'Save Schedule'}
        </button>
      </div>
    </DashboardLayout>
  )
}

function calcHours(start, end) {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return ((eh * 60 + em - sh * 60 - sm) / 60).toFixed(1)
}