import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, ArrowLeft, Save, Eye, EyeOff, Upload } from 'lucide-react'
import { useAuth } from '../App'
import api from '../services/api'
import Card from '../components/Card'

const PRIMARY_COLOR = '#0F4C81'
const BG_COLOR = '#F5F7FA'

interface FacultyProfile {
  name: string
  email: string
  phone: string
  department: string
  bio?: string
  location?: string
  profile_photo_url?: string
  professional?: {
    designation?: string
    company?: string
    industry?: string
  }
}

export default function FacultyProfile() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoLoading, setPhotoLoading] = useState(false)
  const [form, setForm] = useState<FacultyProfile>({
    name: '',
    email: '',
    phone: '',
    department: '',
    bio: '',
    location: '',
    profile_photo_url: '',
    professional: {
      designation: '',
      company: '',
      industry: ''
    }
  })
  const [passwords, setPasswords] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  })

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        department: user.department || '',
        bio: '',
        location: '',
        profile_photo_url: '',
        professional: {
          designation: '',
          company: '',
          industry: ''
        }
      })
    }
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (name.startsWith('professional_')) {
      const key = name.replace('professional_', '')
      setForm(prev => ({
        ...prev,
        professional: { ...prev.professional, [key]: value }
      }))
    } else {
      setForm(prev => ({ ...prev, [name]: value }))
    }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswords(prev => ({ ...prev, [name]: value }))
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setPhotoLoading(true)
    setError('')

    try {
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64String = reader.result as string
        
        // Show preview
        setPhotoPreview(base64String)
        
        // Upload to backend
        await api.patch('/api/auth/me', {
          profile_photo_url: base64String
        })
        
        setSuccess('Profile photo updated successfully!')
        setTimeout(() => setSuccess(''), 3000)
      }
      reader.readAsDataURL(file)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload photo')
    } finally {
      setPhotoLoading(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await api.patch('/api/auth/me', {
        name: form.name,
        phone: form.phone,
        bio: form.bio,
        location: form.location,
        professional: form.professional
      })
      setSuccess('Profile updated successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      if (passwords.new_password !== passwords.confirm_password) {
        throw new Error('Passwords do not match')
      }
      if (passwords.new_password.length < 8) {
        throw new Error('New password must be at least 8 characters')
      }

      await api.post('/api/auth/change-password', {
        old_password: passwords.old_password,
        new_password: passwords.new_password
      })
      
      setSuccess('Password changed successfully!')
      setPasswords({ old_password: '', new_password: '', confirm_password: '' })
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to change password')
      console.error('Password change error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: BG_COLOR }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 mb-6"
          style={{ color: PRIMARY_COLOR }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        {success && (
          <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 text-green-700">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
            {error}
          </div>
        )}

        {/* Profile Photo Upload */}
        <Card className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Profile Photo</h2>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full overflow-hidden flex items-center justify-center">
              {photoPreview ? (
                <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
              ) : form.profile_photo_url ? (
                <img src={form.profile_photo_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-3xl font-bold">{user?.name?.charAt(0) || 'F'}</span>
              )}
            </div>
            <div>
              <label className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-semibold cursor-pointer hover:opacity-90 transition"
                style={{ backgroundColor: PRIMARY_COLOR }}>
                <Upload className="w-4 h-4" />
                {photoLoading ? 'Uploading...' : 'Upload Photo'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={photoLoading}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-gray-500 mt-2">JPG, PNG, GIF (Max 5MB)</p>
            </div>
          </div>
        </Card>

        {/* Profile Edit Form */}
        <Card className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">Contact admin to change name</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+91 XXXXX XXXXX"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
                />
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  placeholder="Write about yourself..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title
                </label>
                <input
                  type="text"
                  name="professional_designation"
                  value={form.professional?.designation || ''}
                  onChange={handleChange}
                  placeholder="e.g., Associate Professor"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization/Department
                </label>
                <input
                  type="text"
                  name="professional_company"
                  value={form.professional?.company || ''}
                  onChange={handleChange}
                  placeholder="Institution name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specialization
                </label>
                <input
                  type="text"
                  name="professional_industry"
                  value={form.professional?.industry || ''}
                  onChange={handleChange}
                  placeholder="e.g., Computer Science"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 rounded-lg text-white font-semibold flex items-center justify-center gap-2"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Update Profile
                </>
              )}
            </button>
          </form>
        </Card>

        {/* Password Change Form */}
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-6">Change Password</h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <input
                type={showPasswords ? 'text' : 'password'}
                name="old_password"
                value={passwords.old_password}
                onChange={handlePasswordChange}
                placeholder="Enter your current password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                type={showPasswords ? 'text' : 'password'}
                name="new_password"
                value={passwords.new_password}
                onChange={handlePasswordChange}
                placeholder="Enter new password (min 8 characters)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <input
                type={showPasswords ? 'text' : 'password'}
                name="confirm_password"
                value={passwords.confirm_password}
                onChange={handlePasswordChange}
                placeholder="Confirm new password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowPasswords(!showPasswords)}
              className="text-sm flex items-center gap-2"
              style={{ color: PRIMARY_COLOR }}
            >
              {showPasswords ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  Hide passwords
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  Show passwords
                </>
              )}
            </button>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 rounded-lg text-white font-semibold flex items-center justify-center gap-2"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Changing...
                </>
              ) : (
                'Change Password'
              )}
            </button>
          </form>
        </Card>
      </div>
    </div>
  )
}
