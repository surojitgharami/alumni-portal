import { useState, useEffect } from 'react'
import { useAuth } from '../App'
import api from '../services/api'
import { Loader2, AlertCircle, CheckCircle, Lock, Upload, Plus, Award, FileText } from 'lucide-react'
import Badge from '../components/Badge'

interface Achievement {
  _id?: string
  title: string
  description: string
  certification_url: string
  date: string
}

interface ProfileData {
  id: string
  name: string
  dob: string
  email: string
  phone: string
  registration_number: string
  passout_year: number
  department: string
  role: string
  membership_status: string
  profile_photo_url?: string
  resume_url?: string
  guardian_name?: string
  nationality?: string
  gender?: string
  marital_status?: string
  employment_status?: string
  employer_name?: string
  highest_qualification?: string
  address?: string
  social_media?: {
    linkedin?: string
    facebook?: string
    instagram?: string
  }
  professional?: {
    workplace: string
    designation: string
    industry: string
    skills: string[]
  }
  achievements: Achievement[]
}

function Profile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [addingAchievement, setAddingAchievement] = useState(false)

  const [form, setForm] = useState({
    name: '',
    phone: '',
    dob: '',
    guardian_name: '',
    nationality: '',
    gender: '',
    marital_status: '',
    employment_status: '',
    employer_name: '',
    highest_qualification: '',
    address: '',
    linkedin: '',
    facebook: '',
    instagram: '',
    workplace: '',
    designation: '',
    industry: '',
    skills: ''
  })

  const [achievement, setAchievement] = useState({
    title: '',
    description: ''
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await api.get('/api/profile')
      setProfile(response.data)
      setForm({
        name: response.data.name,
        phone: response.data.phone,
        dob: response.data.dob,
        guardian_name: response.data.guardian_name || '',
        nationality: response.data.nationality || '',
        gender: response.data.gender || '',
        marital_status: response.data.marital_status || '',
        employment_status: response.data.employment_status || '',
        employer_name: response.data.employer_name || '',
        highest_qualification: response.data.highest_qualification || '',
        address: response.data.address || '',
        linkedin: response.data.social_media?.linkedin || '',
        facebook: response.data.social_media?.facebook || '',
        instagram: response.data.social_media?.instagram || '',
        workplace: response.data.professional?.workplace || '',
        designation: response.data.professional?.designation || '',
        industry: response.data.professional?.industry || '',
        skills: response.data.professional?.skills?.join(', ') || ''
      })
    } catch (err) {
      setError('Failed to load profile')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setSaving(true)
      const formData = new FormData()
      formData.append('file', file)

      const response = await api.post('/api/profile/upload-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      if (response.data.success) {
        await fetchProfile()
        setSuccess('Photo uploaded successfully')
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err) {
      setError('Failed to upload photo')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setSaving(true)
      const formData = new FormData()
      formData.append('file', file)

      const response = await api.post('/api/profile/upload-resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      if (response.data.success) {
        await fetchProfile()
        setSuccess('Resume uploaded successfully')
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err) {
      setError('Failed to upload resume')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const skillsArray = form.skills
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0)

      await api.put('/api/profile', {
        name: form.name,
        phone: form.phone,
        dob: form.dob,
        guardian_name: form.guardian_name,
        nationality: form.nationality,
        gender: form.gender,
        marital_status: form.marital_status,
        employment_status: form.employment_status,
        employer_name: form.employer_name,
        highest_qualification: form.highest_qualification,
        address: form.address,
        social_media: {
          linkedin: form.linkedin,
          facebook: form.facebook,
          instagram: form.instagram
        },
        workplace: form.workplace,
        designation: form.designation,
        industry: form.industry,
        skills: skillsArray
      })

      await fetchProfile()
      setEditMode(false)
      setSuccess('Profile updated successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to update profile')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleAddAchievement = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      await api.post('/api/profile/achievement', {
        title: achievement.title,
        description: achievement.description,
        date: new Date().toISOString()
      })

      await fetchProfile()
      setAchievement({ title: '', description: '' })
      setAddingAchievement(false)
      setSuccess('Achievement added successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to add achievement')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!profile) {
    return <div className="text-center py-12 text-danger">Failed to load profile</div>
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-grow container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
            <p className="text-danger">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
            <p className="text-success">{success}</p>
          </div>
        )}

        <div className="grid gap-6">
          {/* Profile Header */}
          <div className="bg-white rounded-lg shadow p-6 flex items-start gap-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full overflow-hidden flex items-center justify-center">
                {profile.profile_photo_url ? (
                  <img src={profile.profile_photo_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-3xl font-bold">{profile.name.charAt(0)}</span>
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-blue-700">
                <Upload className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={saving}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2>
              <p className="text-gray-600">{profile.professional?.designation || 'Not specified'}</p>
              <div className="flex gap-2 mt-3">
                <Badge variant={profile.role === 'alumni' ? 'success' : 'primary'} size="sm">
                  {profile.role}
                </Badge>
                {profile.role !== 'faculty' && (
                  <Badge
                    variant={profile.membership_status === 'active' ? 'success' : 'danger'}
                    size="sm"
                  >
                    {profile.membership_status}
                  </Badge>
                )}
              </div>
            </div>

            {!editMode && (
              <button
                onClick={() => setEditMode(true)}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition"
              >
                Edit Profile
              </button>
            )}
          </div>

          {/* Account Status - Hide for Faculty */}
          {profile.role !== 'faculty' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Account Information</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Registration Number</p>
                  <p className="font-semibold text-gray-900 flex items-center gap-2">
                    <Lock className="w-4 h-4" /> {profile.registration_number}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Passout Year</p>
                  <p className="font-semibold text-gray-900 flex items-center gap-2">
                    <Lock className="w-4 h-4" /> {profile.passout_year}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Department</p>
                  <p className="font-semibold text-gray-900">{profile.department}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Email</p>
                  <p className="font-semibold text-gray-900">{profile.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Edit Form */}
          {editMode && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Edit Profile</h3>
              <form onSubmit={handleSaveProfile} className="space-y-6">
                
                {/* Personal Information */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Personal Information</h4>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                      <input
                        type="date"
                        value={form.dob}
                        onChange={(e) => setForm({ ...form, dob: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Name</label>
                      <input
                        type="text"
                        value={form.guardian_name}
                        onChange={(e) => setForm({ ...form, guardian_name: e.target.value })}
                        placeholder="Parent/Guardian name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                      <input
                        type="text"
                        value={form.nationality}
                        onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                        placeholder="Your nationality"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                      <select
                        value={form.gender}
                        onChange={(e) => setForm({ ...form, gender: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="">Select...</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status</label>
                      <select
                        value={form.marital_status}
                        onChange={(e) => setForm({ ...form, marital_status: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="">Select...</option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Divorced">Divorced</option>
                        <option value="Widowed">Widowed</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <textarea
                        value={form.address}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                        placeholder="Street, City, State, Postal Code"
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Professional Information */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Professional Information</h4>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employment Status</label>
                      <select
                        value={form.employment_status}
                        onChange={(e) => setForm({ ...form, employment_status: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="">Select...</option>
                        <option value="Employed">Employed</option>
                        <option value="Self-Employed">Self-Employed</option>
                        <option value="Unemployed">Unemployed</option>
                        <option value="Student">Student</option>
                        <option value="Retired">Retired</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employer Name</label>
                      <input
                        type="text"
                        value={form.employer_name}
                        onChange={(e) => setForm({ ...form, employer_name: e.target.value })}
                        placeholder="Current employer"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Workplace</label>
                      <input
                        type="text"
                        value={form.workplace}
                        onChange={(e) => setForm({ ...form, workplace: e.target.value })}
                        placeholder="Company name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                      <input
                        type="text"
                        value={form.designation}
                        onChange={(e) => setForm({ ...form, designation: e.target.value })}
                        placeholder="Job title"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Highest Qualification</label>
                      <input
                        type="text"
                        value={form.highest_qualification}
                        onChange={(e) => setForm({ ...form, highest_qualification: e.target.value })}
                        placeholder="B.E., M.Tech, MBA, etc."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                      <input
                        type="text"
                        value={form.industry}
                        onChange={(e) => setForm({ ...form, industry: e.target.value })}
                        placeholder="IT, Finance, Healthcare, etc."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
                      <input
                        type="text"
                        value={form.skills}
                        onChange={(e) => setForm({ ...form, skills: e.target.value })}
                        placeholder="Separate with commas (React, Node.js, etc.)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Social Media */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Social Media Profiles</h4>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
                      <input
                        type="url"
                        value={form.linkedin}
                        onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                        placeholder="https://linkedin.com/in/..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Facebook URL</label>
                      <input
                        type="url"
                        value={form.facebook}
                        onChange={(e) => setForm({ ...form, facebook: e.target.value })}
                        placeholder="https://facebook.com/..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Instagram URL</label>
                      <input
                        type="url"
                        value={form.instagram}
                        onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                        placeholder="https://instagram.com/..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Resume Upload */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-gray-900">Resume</h3>
              </div>
            </div>
            {profile.resume_url ? (
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-blue-900 font-medium">Resume uploaded</span>
                <a href={profile.resume_url} download className="text-primary hover:underline text-sm font-medium">
                  Download
                </a>
              </div>
            ) : (
              <p className="text-gray-500 mb-3">No resume uploaded</p>
            )}
            <label className="block mt-3 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary transition">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleResumeUpload}
                disabled={saving}
                className="hidden"
              />
              <div className="flex items-center gap-2 text-gray-600">
                <Upload className="w-5 h-5" />
                <span>Upload Resume (PDF or DOC)</span>
              </div>
            </label>
          </div>

          {/* Professional Info Display */}
          {profile.professional && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Professional Information</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {profile.professional.workplace && (
                  <div>
                    <p className="text-sm text-gray-600">Workplace</p>
                    <p className="font-semibold text-gray-900">{profile.professional.workplace}</p>
                  </div>
                )}
                {profile.professional.designation && (
                  <div>
                    <p className="text-sm text-gray-600">Designation</p>
                    <p className="font-semibold text-gray-900">{profile.professional.designation}</p>
                  </div>
                )}
                {profile.professional.industry && (
                  <div>
                    <p className="text-sm text-gray-600">Industry</p>
                    <p className="font-semibold text-gray-900">{profile.professional.industry}</p>
                  </div>
                )}
              </div>
              {profile.professional.skills && profile.professional.skills.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.professional.skills.map((skill, idx) => (
                      <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Achievements */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-gray-900">Achievements & Certifications</h3>
              </div>
              {!addingAchievement && (
                <button
                  onClick={() => setAddingAchievement(true)}
                  className="flex items-center gap-1 px-3 py-1 bg-primary text-white rounded-lg hover:bg-blue-700 transition text-sm"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              )}
            </div>

            {addingAchievement && (
              <form onSubmit={handleAddAchievement} className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
                <input
                  type="text"
                  placeholder="Achievement title"
                  value={achievement.title}
                  onChange={(e) => setAchievement({ ...achievement, title: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <textarea
                  placeholder="Description (optional)"
                  value={achievement.description}
                  onChange={(e) => setAchievement({ ...achievement, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={!achievement.title || saving}
                    className="flex-1 px-3 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    Add Achievement
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAddingAchievement(false)
                      setAchievement({ title: '', description: '' })
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {profile.achievements && profile.achievements.length > 0 ? (
              <div className="space-y-3">
                {profile.achievements.map((ach, idx) => (
                  <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">{ach.title}</h4>
                        {ach.description && <p className="text-sm text-gray-600 mt-1">{ach.description}</p>}
                        {ach.date && (
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(ach.date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">No achievements added yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
