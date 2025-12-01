import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, ArrowLeft, Copy, Check } from 'lucide-react'
import AdminLayout from '../../components/AdminLayout'
import api from '../../services/api'
import Card from '../../components/Card'

interface FacultyForm {
  name: string
  email: string
  department: string
  phone: string
  registration_number: string
}

export default function AddFaculty() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [tempPassword, setTempPassword] = useState('')
  const [copied, setCopied] = useState(false)
  const [form, setForm] = useState<FacultyForm>({
    name: '',
    email: '',
    department: '',
    phone: '',
    registration_number: ''
  })

  const departments = [
    'Computer Science',
    'Electronics',
    'Mechanical',
    'Civil',
    'Electrical',
    'Chemical',
    'Aerospace',
    'Biomedical',
    'Information Technology',
    'Business Administration'
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(tempPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validate form
      if (!form.name || !form.email || !form.department || !form.phone || !form.registration_number) {
        throw new Error('All fields are required')
      }

      const response = await api.post('/api/admin/faculty/create', {
        name: form.name,
        email: form.email,
        department: form.department,
        phone: form.phone,
        registration_number: form.registration_number
      })

      setTempPassword(response.data.temp_password)
      setSuccess(true)
      setForm({ name: '', email: '', department: '', phone: '', registration_number: '' })

      // Auto-navigate after 30 seconds (gives admin time to copy password)
      setTimeout(() => {
        navigate('/admin/dashboard')
      }, 30000)
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to add faculty')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="flex items-center gap-2 text-primary hover:text-primary-dark mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <Card>
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Faculty Member</h1>

          {success ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-green-900 mb-4">Faculty Added Successfully!</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-green-700">Name: <span className="font-semibold">{form.name}</span></p>
                </div>
                <div>
                  <p className="text-sm text-green-700">Email: <span className="font-semibold">{form.email}</span></p>
                </div>
                <div>
                  <p className="text-sm text-green-700 mb-2">Temporary Password:</p>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-white p-3 rounded border border-green-300 font-mono text-sm break-all">
                      {tempPassword}
                    </div>
                    <button
                      onClick={copyToClipboard}
                      className="px-4 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-green-600 mt-2">Share this password with the faculty member. They should change it on first login.</p>
                </div>
              </div>
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-900"><strong>Auto-redirecting in 30 seconds...</strong> Use this time to copy and securely share the password with the faculty member.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Dr. John Smith"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="john@college.edu"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department *
                </label>
                <select
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+91 XXXXX XXXXX"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registration Number *
                </label>
                <input
                  type="text"
                  name="registration_number"
                  value={form.registration_number}
                  onChange={handleChange}
                  placeholder="FAC001 or unique faculty ID"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Faculty...
                  </>
                ) : (
                  'Add Faculty Member'
                )}
              </button>
            </form>
          )}
        </Card>
      </div>
    </AdminLayout>
  )
}
