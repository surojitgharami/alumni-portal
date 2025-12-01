import { useState, useEffect } from 'react'
import { Users, FileText, Trophy, Loader2, Settings, Activity, BarChart3, Bell, Image, Award, Mail, MessageSquare, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'

interface DashboardStats {
  department: string
  stats: {
    total_events: number
    pending_events: number
    total_jobs: number
    pending_jobs: number
    total_alumni: number
    total_students: number
  }
}

interface ActivityItem {
  type: string
  title: string
  description: string
  timestamp: string
  status: string
  icon: string
}

const PRIMARY_COLOR = "#0F4C81"
const ACCENT_COLOR = "#FF8A00"
const BG_COLOR = "#F5F7FA"

function StatsCard({ icon: Icon, label, value, accent }: any) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <Icon size={40} style={{ color: accent ? ACCENT_COLOR : PRIMARY_COLOR }} className="opacity-20" />
      </div>
    </div>
  )
}

export default function FacultyDashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState<DashboardStats | null>(null)
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [dashResponse, activityResponse] = await Promise.all([
          api.get('/api/faculty/dashboard'),
          api.get('/api/faculty/activity/feed').catch(() => ({ data: [] }))
        ])
        setData(dashResponse.data)
        setActivity(activityResponse.data || [])
      } catch (err) {
        console.error('Error fetching dashboard:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: BG_COLOR }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: PRIMARY_COLOR }} />
      </div>
    )
  }

  const stats = data?.stats || {
    total_events: 0,
    pending_events: 0,
    total_jobs: 0,
    pending_jobs: 0,
    total_alumni: 0,
    total_students: 0
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: BG_COLOR }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Faculty Dashboard</h1>
          <p className="mt-2 text-gray-600">Department: <span className="font-semibold">{data?.department}</span></p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatsCard icon={FileText} label="Total Events" value={stats.total_events} />
          <StatsCard icon={FileText} label="Pending Events" value={stats.pending_events} accent />
          <StatsCard icon={Trophy} label="Total Jobs" value={stats.total_jobs} />
          <StatsCard icon={Trophy} label="Pending Jobs" value={stats.pending_jobs} accent />
          <StatsCard icon={Users} label="Department Alumni" value={stats.total_alumni} />
          <StatsCard icon={Users} label="Department Students" value={stats.total_students} />
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <button onClick={() => navigate('/faculty-profile')} className="p-4 text-center rounded-lg border-2 border-primary bg-primary-50 hover:bg-primary-100 transition-colors">
              <User size={24} className="mx-auto mb-2" style={{ color: PRIMARY_COLOR }} />
              <p className="font-medium text-sm text-primary-600">My Profile</p>
            </button>
            <a href="/faculty/events" className="p-4 text-center rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
              <FileText size={24} className="mx-auto mb-2" style={{ color: PRIMARY_COLOR }} />
              <p className="font-medium text-sm">Manage Events</p>
            </a>
            <a href="/faculty/jobs" className="p-4 text-center rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
              <Trophy size={24} className="mx-auto mb-2" style={{ color: PRIMARY_COLOR }} />
              <p className="font-medium text-sm">Manage Jobs</p>
            </a>
            <a href="/faculty/alumni" className="p-4 text-center rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
              <Users size={24} className="mx-auto mb-2" style={{ color: PRIMARY_COLOR }} />
              <p className="font-medium text-sm">View Alumni</p>
            </a>
            <a href="/faculty/gallery" className="p-4 text-center rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
              <Image size={24} className="mx-auto mb-2" style={{ color: PRIMARY_COLOR }} />
              <p className="font-medium text-sm">Gallery</p>
            </a>
            <a href="/faculty/achievements" className="p-4 text-center rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
              <Award size={24} className="mx-auto mb-2" style={{ color: PRIMARY_COLOR }} />
              <p className="font-medium text-sm">Achievements</p>
            </a>
            <a href="/faculty/newsletter" className="p-4 text-center rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
              <Mail size={24} className="mx-auto mb-2" style={{ color: PRIMARY_COLOR }} />
              <p className="font-medium text-sm">Newsletter</p>
            </a>
            <a href="/faculty/announcements" className="p-4 text-center rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
              <Bell size={24} className="mx-auto mb-2" style={{ color: PRIMARY_COLOR }} />
              <p className="font-medium text-sm">Announcements</p>
            </a>
            <a href="/faculty/analytics" className="p-4 text-center rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
              <BarChart3 size={24} className="mx-auto mb-2" style={{ color: PRIMARY_COLOR }} />
              <p className="font-medium text-sm">Analytics</p>
            </a>
            <a href="/faculty/activity" className="p-4 text-center rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
              <Activity size={24} className="mx-auto mb-2" style={{ color: PRIMARY_COLOR }} />
              <p className="font-medium text-sm">Activity</p>
            </a>
          </div>
        </div>

        {/* Activity Feed */}
        {activity.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={24} style={{ color: PRIMARY_COLOR }} />
              <h2 className="text-xl font-bold text-gray-900">Department Activity Feed</h2>
            </div>
            <div className="space-y-4">
              {activity.slice(0, 10).map((item, idx) => (
                <div key={idx} className="flex items-start gap-4 pb-4 border-b border-gray-200 last:border-b-0">
                  <div
                    className="p-2 rounded-lg flex-shrink-0"
                    style={{ backgroundColor: `${PRIMARY_COLOR}20` }}
                  >
                    <Activity size={20} style={{ color: PRIMARY_COLOR }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className="px-2 py-1 rounded text-xs font-medium text-white"
                        style={{ backgroundColor: item.status === 'approved' ? '#16A34A' : item.status === 'pending' ? ACCENT_COLOR : PRIMARY_COLOR }}
                      >
                        {item.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
