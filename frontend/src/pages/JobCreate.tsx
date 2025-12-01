import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import api from '../services/api'
import Card from '../components/Card'
import FormField from '../components/FormField'
import { ArrowLeft, Loader2, AlertCircle, CheckCircle } from 'lucide-react'

const JOB_TYPES = [
  { value: 'full-time', label: 'Full Time' },
  { value: 'part-time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' }
]

function JobCreate() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    title: '',
    company: '',
    description: '',
    location: '',
    job_type: 'full-time',
    salary_range: '',
    application_link: ''
  })

  const canPostJob = user?.role === 'alumni' && user?.membership_status === 'active'

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!canPostJob) {
      setError('Only alumni with active membership can post jobs')
      return
    }

    setLoading(true)
    setError('')

    try {
      await api.post('/api/jobs', {
        title: form.title,
        company: form.company,
        description: form.description,
        location: form.location,
        job_type: form.job_type,
        salary_range: form.salary_range || null,
        application_link: form.application_link || null
      })
      
      setSuccess(true)
    } catch (err: unknown) {
      interface ApiError {
        response?: {
          data?: {
            detail?: string
          }
        }
      }
      const apiError = err as ApiError
      setError(apiError.response?.data?.detail || 'Failed to create job posting')
    } finally {
      setLoading(false)
    }
  }

  if (!canPostJob) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-danger mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
          <p className="text-gray-600 mb-4">
            {user?.role === 'student' 
              ? 'Students cannot post jobs. This feature is available to alumni with active membership.'
              : 'You need an active membership to post job opportunities.'}
          </p>
          <button onClick={() => navigate('/jobs')} className="btn-primary">
            Back to Jobs
          </button>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card className="text-center py-12">
          <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Job Posted Successfully!</h3>
          <p className="text-gray-600 mb-4">
            Your job posting has been submitted and is pending admin approval.
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate('/jobs')} className="btn-primary">
              View All Jobs
            </button>
            <button 
              onClick={() => {
                setSuccess(false)
                setForm({
                  title: '',
                  company: '',
                  description: '',
                  location: '',
                  job_type: 'full-time',
                  salary_range: '',
                  application_link: ''
                })
              }} 
              className="btn-outline"
            >
              Post Another
            </button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => navigate('/jobs')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Jobs
      </button>

      <Card>
        <h1 className="text-xl font-bold text-gray-900 mb-6">Post a Job Opportunity</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-danger">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <FormField
            label="Job Title"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="e.g., Senior Software Engineer"
            required
          />

          <FormField
            label="Company Name"
            name="company"
            value={form.company}
            onChange={handleChange}
            placeholder="e.g., ABC Technologies Pvt Ltd"
            required
          />

          <FormField
            label="Job Description"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Describe the role, responsibilities, and requirements..."
            textarea
            rows={5}
            required
          />

          <FormField
            label="Location"
            name="location"
            value={form.location}
            onChange={handleChange}
            placeholder="e.g., Bangalore, India or Remote"
            required
          />

          <FormField
            label="Job Type"
            name="job_type"
            value={form.job_type}
            onChange={handleChange}
            options={JOB_TYPES}
            required
          />

          <FormField
            label="Salary Range"
            name="salary_range"
            value={form.salary_range}
            onChange={handleChange}
            placeholder="e.g., Rs. 8-12 LPA or As per industry standards"
          />

          <FormField
            label="Application Link"
            name="application_link"
            type="url"
            value={form.application_link}
            onChange={handleChange}
            placeholder="https://company.com/careers/job-id"
          />

          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-sm text-gray-600">
            <p>Your job posting will be reviewed by an admin before being published.</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Job Posting'}
          </button>
        </form>
      </Card>
    </div>
  )
}

export default JobCreate
