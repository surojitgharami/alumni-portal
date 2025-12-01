import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import Card from '../../components/Card'
import api from '../../services/api'
import { Loader2, Trash2, Check } from 'lucide-react'

interface Job {
  _id: string
  title: string
  company: string
  location: string
  job_type: string
  description: string
  approved: boolean
  created_by: string
}

export default function ManageJobs() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      const res = await api.get('/api/admin/jobs-list')
      setJobs(res.data)
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    try {
      await api.patch(`/api/admin/jobs/${id}/approve`)
      setJobs(jobs.map(j => j._id === id ? { ...j, approved: true } : j))
    } catch (error) {
      console.error('Failed to approve job:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this job?')) return
    try {
      await api.delete(`/api/admin/jobs/${id}`)
      setJobs(jobs.filter(j => j._id !== id))
    } catch (error) {
      console.error('Failed to delete job:', error)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Card>
          <h3 className="text-lg font-semibold mb-6">Manage Job Postings</h3>

          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job._id} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-semibold text-gray-900">{job.title}</h4>
                  <p className="text-sm text-gray-600">{job.company} | {job.location}</p>
                  <p className="text-sm text-gray-600">{job.description.substring(0, 100)}...</p>
                  <span className={`inline-block mt-2 px-2 py-1 text-xs rounded ${
                    job.approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {job.approved ? 'Approved' : 'Pending'}
                  </span>
                </div>
                <div className="flex gap-2">
                  {!job.approved && (
                    <button
                      onClick={() => handleApprove(job._id)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(job._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {jobs.length === 0 && (
              <div className="text-center py-8 text-gray-500">No jobs found</div>
            )}
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
