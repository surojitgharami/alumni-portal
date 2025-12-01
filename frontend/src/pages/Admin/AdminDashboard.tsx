import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../App'
import api from '../../services/api'
import Card from '../../components/Card'
import Badge from '../../components/Badge'
import AdminSidebar from '../../components/AdminSidebar'
import { 
  Users, CreditCard, Calendar, Briefcase, 
  Check, Loader2, RefreshCw,
  TrendingUp, Menu
} from 'lucide-react'

interface DashboardStats {
  total_users: number
  students: number
  alumni: number
  active_members: number
  pending_events: number
  pending_jobs: number
  total_payments: number
  total_revenue: number
}

interface PendingEvent {
  id: string
  title: string
  department: string
  event_date: string
  is_paid: boolean
  fee_amount: number
}

interface PendingJob {
  id: string
  title: string
  company: string
  location: string
  job_type: string
}

function AdminDashboard() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [pendingEvents, setPendingEvents] = useState<PendingEvent[]>([])
  const [pendingJobs, setPendingJobs] = useState<PendingJob[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [dashboardRes, eventsRes, jobsRes] = await Promise.all([
        api.get('/api/admin/dashboard'),
        api.get('/api/admin/pending-events'),
        api.get('/api/admin/pending-jobs')
      ])
      setStats(dashboardRes.data.stats)
      setPendingEvents(eventsRes.data)
      setPendingJobs(jobsRes.data)
    } catch (error) {
      console.error('Failed to fetch admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveEvent = async (eventId: string) => {
    setActionLoading(`event-${eventId}`)
    try {
      await api.patch(`/api/admin/events/${eventId}/approve`)
      setPendingEvents(events => events.filter(e => e.id !== eventId))
      if (stats) {
        setStats({ ...stats, pending_events: stats.pending_events - 1 })
      }
    } catch (error) {
      console.error('Failed to approve event:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleApproveJob = async (jobId: string) => {
    setActionLoading(`job-${jobId}`)
    try {
      await api.patch(`/api/admin/jobs/${jobId}/approve`)
      setPendingJobs(jobs => jobs.filter(j => j.id !== jobId))
      if (stats) {
        setStats({ ...stats, pending_jobs: stats.pending_jobs - 1 })
      }
    } catch (error) {
      console.error('Failed to approve job:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleUpgradeStudents = async () => {
    setActionLoading('upgrade')
    try {
      const response = await api.post('/api/admin/cron/upgrade-students')
      alert(response.data.message)
      fetchData()
    } catch (error) {
      console.error('Failed to upgrade students:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-bg flex">
      {/* Admin Sidebar */}
      <AdminSidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar with Hamburger Menu */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center lg:hidden sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
          <div className="ml-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm">
              A
            </div>
            <span className="font-semibold text-gray-900">Alumni Portal</span>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats?.total_users || 0}</p>
                <p className="text-sm text-gray-600">Total Users</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats?.active_members || 0}</p>
                <p className="text-sm text-gray-600">Active Members</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent-50 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats?.pending_events || 0}</p>
                <p className="text-sm text-gray-600">Pending Events</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats?.pending_jobs || 0}</p>
                <p className="text-sm text-gray-600">Pending Jobs</p>
              </div>
            </div>
          </Card>
        </div>


        <div className="mb-6 flex flex-wrap gap-3">
          <button
            onClick={handleUpgradeStudents}
            disabled={actionLoading === 'upgrade'}
            className="btn-outline"
          >
            {actionLoading === 'upgrade' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Upgrade Eligible Students to Alumni
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Events</h2>
            {pendingEvents.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No pending events</p>
            ) : (
              <div className="space-y-4">
                {pendingEvents.map((event) => (
                  <div key={event.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">{event.title}</h3>
                      <p className="text-sm text-gray-600">
                        {event.department} | {new Date(event.event_date).toLocaleDateString()}
                      </p>
                      {event.is_paid && (
                        <Badge variant="accent" size="sm">Rs. {event.fee_amount / 100}</Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveEvent(event.id)}
                        disabled={actionLoading === `event-${event.id}`}
                        className="p-2 bg-success text-white rounded-lg hover:bg-green-600"
                      >
                        {actionLoading === `event-${event.id}` ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Jobs</h2>
            {pendingJobs.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No pending jobs</p>
            ) : (
              <div className="space-y-4">
                {pendingJobs.map((job) => (
                  <div key={job.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">{job.title}</h3>
                      <p className="text-sm text-gray-600">
                        {job.company} | {job.location}
                      </p>
                      <Badge variant="neutral" size="sm">{job.job_type}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveJob(job.id)}
                        disabled={actionLoading === `job-${job.id}`}
                        className="p-2 bg-success text-white rounded-lg hover:bg-green-600"
                      >
                        {actionLoading === `job-${job.id}` ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <Card className="mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Overview</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-3xl font-bold text-primary">Rs. {stats?.total_revenue?.toLocaleString() || 0}</p>
              <p className="text-sm text-gray-600">Total Revenue</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-3xl font-bold text-gray-900">{stats?.total_payments || 0}</p>
              <p className="text-sm text-gray-600">Total Payments</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-3xl font-bold text-gray-900">{stats?.alumni || 0}</p>
              <p className="text-sm text-gray-600">Alumni Members</p>
            </div>
          </div>
        </Card>

        </div>
      </main>
    </div>
  )
}

export default AdminDashboard
