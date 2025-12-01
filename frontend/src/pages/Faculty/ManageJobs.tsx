import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, CheckCircle, XCircle, Briefcase, Plus } from 'lucide-react'
import api from '../../services/api'

interface Job {
  id: string
  title: string
  company: string
  description: string
  location: string
  job_type: string
  status: string
  created_at: string
}

const PRIMARY_COLOR = "#0F4C81"
const BG_COLOR = "#F5F7FA"

export default function ManageJobs() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("")

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const url = statusFilter 
          ? `/api/faculty/jobs?status_filter=${statusFilter}`
          : '/api/faculty/jobs'
        const response = await api.get(url)
        setJobs(response.data)
      } catch (err) {
        console.error('Error fetching jobs:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchJobs()
  }, [statusFilter])

  const handleApprove = async (jobId: string) => {
    try {
      await api.post(`/api/faculty/jobs/${jobId}/approve`)
      setJobs(jobs.map(j => j.id === jobId ? {...j, status: 'approved'} : j))
    } catch (err) {
      console.error('Error approving job:', err)
    }
  }

  const handleReject = async (jobId: string) => {
    try {
      await api.post(`/api/faculty/jobs/${jobId}/reject`)
      setJobs(jobs.map(j => j.id === jobId ? {...j, status: 'rejected'} : j))
    } catch (err) {
      console.error('Error rejecting job:', err)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: BG_COLOR }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Jobs</h1>
            <p className="mt-2 text-gray-600">Review and approve job postings for your department</p>
          </div>
          <Link
            to="/jobs/create"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-all hover:shadow-lg"
            style={{ backgroundColor: PRIMARY_COLOR }}
          >
            <Plus size={18} />
            Post Job
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex gap-4">
            <button
              onClick={() => setStatusFilter("")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === "" 
                  ? 'text-white' 
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              style={{ backgroundColor: statusFilter === "" ? PRIMARY_COLOR : 'transparent' }}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter("pending")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === "pending" 
                  ? 'text-white' 
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              style={{ backgroundColor: statusFilter === "pending" ? PRIMARY_COLOR : 'transparent' }}
            >
              Pending
            </button>
            <button
              onClick={() => setStatusFilter("approved")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === "approved" 
                  ? 'text-white' 
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              style={{ backgroundColor: statusFilter === "approved" ? PRIMARY_COLOR : 'transparent' }}
            >
              Approved
            </button>
          </div>
        </div>

        {/* Jobs List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: PRIMARY_COLOR }} />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500">No jobs found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{job.title}</h3>
                    <p className="text-sm font-medium text-gray-600">{job.company}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    job.status === 'approved' 
                      ? 'bg-green-100 text-green-800'
                      : job.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {job.status}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-3">{job.description.substring(0, 120)}...</p>

                <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 mb-4">
                  <div>📍 {job.location}</div>
                  <div>💼 {job.job_type}</div>
                </div>

                {job.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(job.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-white font-medium transition-colors"
                      style={{ backgroundColor: '#16A34A' }}
                    >
                      <CheckCircle size={16} />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(job.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-white font-medium transition-colors"
                      style={{ backgroundColor: '#DC2626' }}
                    >
                      <XCircle size={16} />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
