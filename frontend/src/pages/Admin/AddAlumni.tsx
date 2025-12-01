import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  gender: string
  location: string
  professional_designation: string
  professional_company: string
  professional_industry: string
  bio: string
  profile_photo_url: string
}

interface CreatedAlumniResponse {
  data: Partial<AlumniForm> & { email: string; registration_number: string }
  temp_password?: string
}

export default function AddAlumni() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [createdAlumni, setCreatedAlumni] = useState<Partial<AlumniForm> | null>(null)
  const [tempPassword, setTempPassword] = useState<string>('')
  const [form, setForm] = useState<AlumniForm>({
    name: '',
    email: '',
    registration_number: '',
    passout_year: new Date().getFullYear().toString(),
    department: '',
    phone: '',
    gender: '',
    location: '',
    professional_designation: '',
    professional_company: '',
    professional_industry: '',
    bio: '',
    profile_photo_url: ''
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validate required fields
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
        gender: form.gender || null,
        location: form.location || '',
        professional: {
          designation: form.professional_designation || '',
          company: form.professional_company || '',
          industry: form.professional_industry || ''
        },
        bio: form.bio || '',
        profile_photo_url: form.profile_photo_url || '',
        role: 'alumni'
      }

      const response = await api.post('/api/admin/users', payload)

      setCreatedAlumni(form)
      if (response.data?.temporary_password) {
        setTempPassword(response.data.temporary_password)
      }
      setSuccess(true)
      // Reset form
      setForm({
        name: '',
        email: '',
        registration_number: '',
        passout_year: currentYear.toString(),
        department: '',
        phone: '',
        gender: '',
        location: '',
        professional_designation: '',
        professional_company: '',
        professional_industry: '',
        bio: '',
        profile_photo_url: ''
      })

      // Auto-navigate after 4 seconds
      setTimeout(() => {
        navigate('/admin/alumni')
      }, 4000)
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to add alumni')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="flex items-center gap-2 text-primary hover:text-primary-dark mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <Card>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Add New Alumni Member</h1>
          <p className="text-gray-600 text-sm mb-6">Create a detailed alumni profile with professional information</p>

          {success ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-green-900 mb-4">Alumni Profile Created Successfully!</h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-xs text-green-700 uppercase font-semibold">Name</p>
                  <p className="text-sm font-medium text-green-900">{createdAlumni?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-green-700 uppercase font-semibold">Email</p>
                  <p className="text-sm font-medium text-green-900">{createdAlumni?.email}</p>
                </div>
                <div>
                  <p className="text-xs text-green-700 uppercase font-semibold">Department</p>
                  <p className="text-sm font-medium text-green-900">{createdAlumni?.department}</p>
                </div>
                <div>
                  <p className="text-xs text-green-700 uppercase font-semibold">Passout Year</p>
                  <p className="text-sm font-medium text-green-900">{createdAlumni?.passout_year}</p>
                </div>
                <div>
                  <p className="text-xs text-green-700 uppercase font-semibold">Registration Number</p>
                  <p className="text-sm font-medium text-green-900">{createdAlumni?.registration_number}</p>
                </div>
                <div>
                  <p className="text-xs text-green-700 uppercase font-semibold">Location</p>
                  <p className="text-sm font-medium text-green-900">{createdAlumni?.location || 'Not specified'}</p>
                </div>
              </div>
              {tempPassword && (
                <div className="bg-yellow-50 border border-yellow-300 rounded p-4 mb-6">
                  <p className="text-xs text-yellow-700 uppercase font-semibold mb-2">🔐 Temporary Login Password</p>
                  <div className="bg-white p-3 rounded border border-yellow-200 font-mono text-sm text-yellow-900 break-all">
                    {tempPassword}
                  </div>
                  <p className="text-xs text-yellow-700 mt-2">Share this password with the user. They can login and change it later.</p>
                </div>
              )}
              {createdAlumni?.professional_designation && (
                <div className="bg-white p-4 rounded border border-green-300 mb-6">
                  <p className="text-xs text-green-700 uppercase font-semibold mb-2">Professional Info</p>
                  <p className="text-sm text-gray-900"><span className="font-medium">{createdAlumni.professional_designation}</span> at {createdAlumni.professional_company}</p>
                  {createdAlumni.professional_industry && (
                    <p className="text-sm text-gray-600">Industry: {createdAlumni.professional_industry}</p>
                  )}
                </div>
              )}
              <p className="text-sm text-green-700">Profile is now visible in Alumni Directory. Redirecting...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
                  {error}
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-900"><span className="font-semibold">Required fields: </span>Name, Email, Registration Number, Passout Year, and Department</p>
              </div>

              {/* Basic Information */}
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

              {/* Personal Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Personal Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={form.gender}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">Not specified</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={form.location}
                      onChange={handleChange}
                      placeholder="City, Country"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profile Photo URL
                    </label>
                    <input
                      type="url"
                      name="profile_photo_url"
                      value={form.profile_photo_url}
                      onChange={handleChange}
                      placeholder="https://example.com/photo.jpg"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Professional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Title / Designation
                    </label>
                    <input
                      type="text"
                      name="professional_designation"
                      value={form.professional_designation}
                      onChange={handleChange}
                      placeholder="Software Engineer"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name
                    </label>
                    <input
                      type="text"
                      name="professional_company"
                      value={form.professional_company}
                      onChange={handleChange}
                      placeholder="Tech Company Ltd."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Industry
                    </label>
                    <input
                      type="text"
                      name="professional_industry"
                      value={form.professional_industry}
                      onChange={handleChange}
                      placeholder="Software Development, Finance, etc."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio / About
                </label>
                <textarea
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  placeholder="Write a brief bio about this alumni member..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
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
                    Creating Alumni Profile...
                  </>
                ) : (
                  'Add Alumni Member'
                )}
              </button>
            </form>
          )}
        </Card>
      </div>
    </AdminLayout>
  )
}
