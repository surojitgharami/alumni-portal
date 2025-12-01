import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, DollarSign, Clock, Mail } from 'lucide-react'
import api from '../services/api'

interface Job {
  id: string
  _id?: string
  title: string
  company: string
  location: string
  job_type: string
  description: string
  salary_range: string
  department: string
  created_at: string
  posted_by?: string
}

const PRIMARY_COLOR = "#0F4C81"

export default function JobDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchJob()
  }, [id])

  const fetchJob = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/api/jobs/${id}`)
      setJob(response.data)
    } catch (err) {
      console.error('Error fetching job:', err)
      setError('Failed to load job details')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mx-auto mb-4" style={{ borderColor: PRIMARY_COLOR }}></div>
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Job Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'This job posting is no longer available.'}</p>
          <button
            onClick={() => navigate('/jobs')}
            className="px-6 py-2 rounded-lg text-white font-medium transition-all hover:shadow-lg"
            style={{ backgroundColor: PRIMARY_COLOR }}
          >
            Back to Jobs
          </button>
        </div>
      </div>
    )
  }

  const formatSalaryInRupee = (salary: string) => {
    if (!salary) return 'Not specified'
    if (salary.includes('₹')) return salary
    if (salary.includes('$')) return salary.replace(/\$/g, '₹')
    if (/^\d/.test(salary)) return `₹${salary}`
    return `₹${salary}`
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/jobs')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Jobs
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
                <p className="text-xl font-semibold text-gray-700">{job.company}</p>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                job.job_type === 'Full-time' ? 'bg-blue-50 text-blue-700' : 
                job.job_type === 'Internship' ? 'bg-green-50 text-green-700' : 
                'bg-orange-50 text-orange-700'
              }`}>
                {job.job_type}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 pb-8 border-b border-gray-200">
            <div className="flex items-start gap-3">
              <MapPin size={20} style={{ color: PRIMARY_COLOR }} className="flex-shrink-0 mt-1" />
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Location</p>
                <p className="text-gray-900 font-semibold">{job.location}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <DollarSign size={20} style={{ color: PRIMARY_COLOR }} className="flex-shrink-0 mt-1" />
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Salary</p>
                <p className="text-gray-900 font-semibold">{formatSalaryInRupee(job.salary_range)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock size={20} style={{ color: PRIMARY_COLOR }} className="flex-shrink-0 mt-1" />
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Posted</p>
                <p className="text-gray-900 font-semibold">{new Date(job.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-3">About This Position</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{job.description}</p>
          </div>

          <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Department:</span> {job.department}
            </p>
            {job.posted_by && (
              <p className="text-sm text-gray-600 mt-2">
                <span className="font-medium">Posted by:</span> {job.posted_by}
              </p>
            )}
          </div>

          <div className="flex gap-4">
            <button
              className="flex-1 py-3 rounded-lg text-white font-medium transition-all hover:shadow-lg flex items-center justify-center gap-2"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              <Mail size={18} />
              Apply Now
            </button>
            <button
              className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Save Job
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">Share this opportunity with others</p>
          <div className="flex justify-center gap-4">
            <button className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium">
              LinkedIn
            </button>
            <button className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium">
              WhatsApp
            </button>
            <button className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium">
              Email
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
