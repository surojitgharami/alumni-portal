import { useState, useEffect } from 'react'
import { useAuth } from '../../App'
import { Save } from 'lucide-react'

export default function ProfessionalProfile() {
  const { user, token } = useAuth()
  const [profile, setProfile] = useState({
    organization: '',
    role: '',
    experience: '',
    skills: '',
    resume: null as File | null
  })
  
  useEffect(() => {
    fetchProfile()
  }, [])
  
  const fetchProfile = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/alumni/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await response.json()
      setProfile(data)
    } catch (error) {
      console.error('Error:', error)
    }
  }
  
  const handleSave = async () => {
    try {
      const formData = new FormData()
      formData.append('organization', profile.organization)
      formData.append('role', profile.role)
      formData.append('experience', profile.experience)
      formData.append('skills', profile.skills)
      if (profile.resume) formData.append('resume', profile.resume)
      
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/alumni/profile`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })
      alert('Profile updated successfully')
    } catch (error) {
      console.error('Error:', error)
    }
  }
  
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Professional Profile</h1>
      
      <div className="bg-white p-6 rounded-lg border">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Organization</label>
          <input
            type="text"
            value={profile.organization}
            onChange={(e) => setProfile({ ...profile, organization: e.target.value })}
            className="w-full border rounded p-2"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Role/Position</label>
          <input
            type="text"
            value={profile.role}
            onChange={(e) => setProfile({ ...profile, role: e.target.value })}
            className="w-full border rounded p-2"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Years of Experience</label>
          <input
            type="text"
            value={profile.experience}
            onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
            className="w-full border rounded p-2"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Skills</label>
          <textarea
            value={profile.skills}
            onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
            className="w-full border rounded p-2"
            rows={3}
            placeholder="Enter skills separated by commas"
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Resume</label>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => setProfile({ ...profile, resume: e.target.files?.[0] || null })}
            className="w-full border rounded p-2"
          />
        </div>
        
        <button
          onClick={handleSave}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
        >
          <Save size={18} /> Save Profile
        </button>
      </div>
    </div>
  )
}
