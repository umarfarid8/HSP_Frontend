import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { adminApi } from '../../api/adminApi'
import { formatCurrency } from '../../utils/formatters'

// Custom tooltip shown on hover over chart bars
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-lg">
      <p className="text-xs font-semibold text-slate-500 mb-1">{label}</p>
      <p className="text-sm font-bold text-primary">
        {formatCurrency(payload[0].value)}
      </p>
      <p className="text-xs text-slate-400">
        {payload[1]?.value} bookings
      </p>
    </div>
  )
}

export default function AnalyticsPage() {
  const [data, setData]         = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    adminApi.getAnalytics()
      .then(({ data }) => setData(data))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner text="Loading analytics..." />
        </div>
      </DashboardLayout>
    )
  }

  if (!data) return null

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Financial Analytics</h1>
        <p className="text-slate-500 text-sm mt-1">Platform revenue and booking performance</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card">
          <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-1">
            Total Transaction Volume
          </p>
          <p className="text-2xl font-bold text-slate-900">
            {formatCurrency(data.totalTransactionVolume)}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Total cash paid by customers to providers
          </p>
        </div>
        <div className="card bg-primary-light">
          <p className="text-xs text-primary/70 uppercase tracking-wide font-medium mb-1">
            Platform Revenue (Commission)
          </p>
          <p className="text-2xl font-bold text-primary">
            {formatCurrency(data.totalPlatformRevenue)}
          </p>
          <p className="text-xs text-primary/60 mt-1">15% commission on all transactions</p>
        </div>
      </div>

      {/* Monthly revenue chart */}
      <div className="card mb-6">
        <h2 className="font-semibold text-slate-800 mb-5">Monthly Revenue</h2>
        {data.monthlyBreakdown?.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-slate-300">
            <p>No data yet — complete some bookings first</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={data.monthlyBreakdown}
              margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f8fafc' }} />
              <Bar
                dataKey="revenue"
                fill="#1a73e8"
                radius={[6, 6, 0, 0]}
                name="Revenue"
              />
              <Bar
                dataKey="bookingsCount"
                fill="#e8f0fe"
                radius={[6, 6, 0, 0]}
                name="Bookings"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Top providers */}
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-4">Top Providers by Revenue</h2>
          {data.topProviders?.length === 0 ? (
            <p className="text-sm text-slate-400 py-4">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {data.topProviders.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 w-5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {p.businessName}
                    </p>
                    <p className="text-xs text-slate-400">
                      {p.completedJobs} jobs completed
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-primary flex-shrink-0">
                    {formatCurrency(p.totalRevenue)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top categories */}
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-4">Top Service Categories</h2>
          {data.topCategories?.length === 0 ? (
            <p className="text-sm text-slate-400 py-4">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {data.topCategories.map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 w-5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">{c.categoryName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                        <div
                          className="bg-primary h-1.5 rounded-full"
                          style={{
                            width: data.topCategories[0]
                              ? `${(c.totalBookings / data.topCategories[0].totalBookings) * 100}%`
                              : '0%',
                          }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 flex-shrink-0">
                        {c.totalBookings} bookings
                      </span>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-slate-600 flex-shrink-0">
                    {formatCurrency(c.totalRevenue)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}