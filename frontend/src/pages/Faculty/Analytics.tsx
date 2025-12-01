import { useState, useEffect } from 'react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Loader2, TrendingUp, Users, Briefcase, FileText } from 'lucide-react'
import api from '../../services/api'
import Card from '../../components/Card'

interface StatData {
  total_events: number
  pending_events: number
  total_jobs: number
  pending_jobs: number
  total_alumni: number
  total_achievements: number
  total_newsletters: number
  verified_alumni: number
}

const PRIMARY_COLOR = '#0F4C81'
const ACCENT_COLOR = '#FF8A00'
const BG_COLOR = '#F5F7FA'
const CHART_COLORS = ['#0F4C81', '#FF8A00', '#16A34A', '#DC2626', '#7C3AED']

export default function Analytics() {
  const [stats, setStats] = useState<StatData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/faculty/activity/stats')
      setStats(response.data)
    } catch (err) {
      console.error('Error fetching analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: BG_COLOR }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: PRIMARY_COLOR }} />
      </div>
    )
  }

  // Prepare chart data
  const eventData = [
    { name: 'Approved', value: stats.total_events - stats.pending_events },
    { name: 'Pending', value: stats.pending_events }
  ]

  const jobData = [
    { name: 'Approved', value: stats.total_jobs - stats.pending_jobs },
    { name: 'Pending', value: stats.pending_jobs }
  ]

  const alumniData = [
    { name: 'Verified', value: stats.verified_alumni },
    { name: 'Pending', value: stats.total_alumni - stats.verified_alumni }
  ]

  const activityData = [
    { name: 'Events', value: stats.total_events },
    { name: 'Jobs', value: stats.total_jobs },
    { name: 'Alumni', value: stats.total_alumni },
    { name: 'Achievements', value: stats.total_achievements },
    { name: 'Newsletters', value: stats.total_newsletters }
  ]

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: BG_COLOR }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: PRIMARY_COLOR }}>
            Department Analytics
          </h1>
          <p className="text-gray-600">Track and monitor your department's activity</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Events</p>
                <p className="text-3xl font-bold" style={{ color: PRIMARY_COLOR }}>
                  {stats.total_events}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.pending_events} pending
                </p>
              </div>
              <div
                className="p-3 rounded-lg"
                style={{ backgroundColor: `${PRIMARY_COLOR}20` }}
              >
                <TrendingUp className="w-6 h-6" style={{ color: PRIMARY_COLOR }} />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Jobs</p>
                <p className="text-3xl font-bold" style={{ color: ACCENT_COLOR }}>
                  {stats.total_jobs}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.pending_jobs} pending
                </p>
              </div>
              <div
                className="p-3 rounded-lg"
                style={{ backgroundColor: `${ACCENT_COLOR}20` }}
              >
                <Briefcase className="w-6 h-6" style={{ color: ACCENT_COLOR }} />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Alumni</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.total_alumni}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.verified_alumni} verified
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-100">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Achievements</p>
                <p className="text-3xl font-bold text-purple-600">
                  {stats.total_achievements}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.total_newsletters} newsletters
                </p>
              </div>
              <div className="p-3 rounded-lg bg-purple-100">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Events Pie Chart */}
          <Card>
            <h3 className="text-lg font-bold mb-4" style={{ color: PRIMARY_COLOR }}>
              Events Status Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={eventData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }: { name: string; value: number }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {eventData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Jobs Pie Chart */}
          <Card>
            <h3 className="text-lg font-bold mb-4" style={{ color: PRIMARY_COLOR }}>
              Jobs Status Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={jobData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }: { name: string; value: number }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {jobData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Alumni Verification Chart */}
          <Card>
            <h3 className="text-lg font-bold mb-4" style={{ color: PRIMARY_COLOR }}>
              Alumni Verification Status
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={alumniData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }: { name: string; value: number }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {alumniData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#16A34A', '#DC2626'][index]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Activity Overview Bar Chart */}
          <Card>
            <h3 className="text-lg font-bold mb-4" style={{ color: PRIMARY_COLOR }}>
              Department Activity Overview
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill={PRIMARY_COLOR} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Summary Card */}
        <Card>
          <h3 className="text-lg font-bold mb-4" style={{ color: PRIMARY_COLOR }}>
            Department Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold" style={{ color: PRIMARY_COLOR }}>
                {stats.total_events + stats.total_jobs}
              </p>
              <p className="text-xs text-gray-600 mt-1">Total Posts</p>
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: ACCENT_COLOR }}>
                {stats.pending_events + stats.pending_jobs}
              </p>
              <p className="text-xs text-gray-600 mt-1">Pending Approvals</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {stats.total_alumni}
              </p>
              <p className="text-xs text-gray-600 mt-1">Alumni</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">
                {stats.total_achievements}
              </p>
              <p className="text-xs text-gray-600 mt-1">Achievements</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {stats.total_newsletters}
              </p>
              <p className="text-xs text-gray-600 mt-1">Newsletters</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
