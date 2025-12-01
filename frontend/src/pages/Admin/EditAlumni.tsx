import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Loader2, ArrowLeft } from 'lucide-react'
import AdminLayout from '../../components/AdminLayout'
import api from '../../services/api'
import Card from '../../components/Card'

interface AlumniForm {
  name: string
  email: string
  registration_number: string
  passout_year: string
  department: string
  phone: string
  role: string
}

export default function EditAlumni() {
  const navigate = useNavigate()
  const { userId } = useParams<{ userId: string }>()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [tempPassword, setTempPassword] = useState<string>('')
  const [form, setForm] = useState<AlumniForm>({
    name: '',
    email: '',
    registration_number: '',
    passout_year: new Date().getFullYear().toString(),
    department: '',
    phone: '',
    role: 'alumni'
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

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 31 }, (_, i) => {
    if (i === 0) return (currentYear + 1).toString()
    return (currentYear - i + 1).toString()
  }).sort((a, b) => parseInt(b) - parseInt(a))

  useEffect(() => {
    const loadAlumni = async () => {
      try {
        const response = await api.get(`/api/admin/users`)
        const users = response.data
        const user = users.find((u: any) => u.id === userId)
        if (user) {
          setForm({
            name: user.name,
            email: user.email,
            registration_number: user.registration_number,
            passout_year: user.passout_year.toString(),
            department: user.department,
            phone: user.phone || '',
            role: user.role
          })
        } else {
          setError('Alumni not found')
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load alumni details')
      } finally {
        setLoading(false)
      }
    }
    loadAlumni()
  }, [userId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      if (!form.name || !form.email || !form.registration_number || !form.passout_year || !form.department) {
        throw new Error('Name, email, registration number, passout year, and department are required')
      }

      const payload = {
        name: form.name,
        email: form.email,
        registration_number: form.registration_number,
        passout_year: parseInt(form.passout_year),
        department: form.department,
        phone: form.phone || '',
        role: form.role
      }

      const response = await api.put(`/api/admin/users/${userId}`, payload)

      if (response.data?.temporary_password) {
        setTempPassword(response.data.temporary_password)
      }
      setSuccess(true)

      setTimeout(() => {
        navigate('/admin/alumni')
      }, 5000)
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to update alumni')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/admin/alumni')}
          className="flex items-center gap-2 text-primary hover:text-primary-dark mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Alumni
        </button>

        <Card>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Edit Alumni Member</h1>
          <p className="text-gray-600 text-sm mb-6">Update alumni information. A new temporary password will be generated on save.</p>

          {success && tempPassword && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-green-900 mb-4">Alumni Updated Successfully!</h2>
              <div className="bg-yellow-50 border border-yellow-300 rounded p-4 mb-4">
                <p className="text-xs text-yellow-700 uppercase font-semibold mb-2">🔐 New Temporary Login Password</p>
                <div className="bg-white p-3 rounded border border-yellow-200 font-mono text-sm text-yellow-900 break-all">
                  {tempPassword}
                </div>
                <p className="text-xs text-yellow-700 mt-2">Share this new password with the user. Their old password is no longer valid.</p>
              </div>
              <p className="text-sm text-green-700">Redirecting to alumni list...</p>
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
                  {error}
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="John Doe"
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
                      placeholder="john@example.com"
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
                      placeholder="REG-2020-001"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Passout Year *
                    </label>
                    <select
                      name="passout_year"
                      value={form.passout_year}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                    >
                      {years.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
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
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+91 XXXXX XXXXX"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-900"><span className="font-semibold">ℹ️ Note: </span>Saving will regenerate a new temporary password. The user will need to login with email + new temporary password.</p>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/admin/alumni')}
                  className="flex-1 bg-gray-200 text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </AdminLayout>
  )
}
