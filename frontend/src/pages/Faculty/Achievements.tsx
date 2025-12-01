import { useState, useEffect } from 'react'
import { Edit2, Trash2, Loader2 } from 'lucide-react'
import api from '../../services/api'

interface AlumniAchievement {
  id: string
  title: string
  description: string
  submitted_by: string
  category: string
  created_at: string
}

const PRIMARY_COLOR = '#0F4C81'
const BG_COLOR = '#F5F7FA'

export default function Achievements() {
  const [achievements, setAchievements] = useState<AlumniAchievement[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [editData, setEditData] = useState({ title: '', description: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchAlumniAchievements()
  }, [])

  const fetchAlumniAchievements = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/faculty/alumni-achievements')
      setAchievements(response.data)
    } catch (err) {
      setError('Failed to load alumni achievements')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleEditStart = (ach: AlumniAchievement) => {
    setEditing(ach.id)
    setEditData({ title: ach.title, description: ach.description })
  }

  const handleEditSave = async (id: string) => {
    try {
      await api.put(`/api/faculty/alumni-achievements/${id}`, editData)
      setSuccess('Achievement updated successfully')
      setEditing(null)
      fetchAlumniAchievements()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to update achievement')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this achievement?')) return
    try {
      await api.delete(`/api/faculty/alumni-achievements/${id}`)
      setSuccess('Achievement deleted successfully')
      setAchievements(achievements.filter(a => a.id !== id))
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to delete achievement')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: BG_COLOR }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: PRIMARY_COLOR }} />
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: BG_COLOR }}>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Alumni Achievements</h1>
        <p className="text-gray-600 mb-8">View and manage achievements submitted by alumni from your department</p>

        {error && <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-lg bg-green-50 border border-green-200 text-green-700">{success}</div>}

        <div className="grid gap-4">
          {achievements.length === 0 ? (
            <div className="bg-white p-8 rounded-lg border text-center text-gray-500">
              No alumni achievements found
            </div>
          ) : (
            achievements.map((ach) => (
              <div key={ach.id} className="bg-white p-6 rounded-lg border hover:shadow-md transition-shadow">
                {editing === ach.id ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={editData.title}
                      onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                      className="w-full border rounded p-2"
                      placeholder="Title"
                    />
                    <textarea
                      value={editData.description}
                      onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                      className="w-full border rounded p-2"
                      placeholder="Description"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditSave(ach.id)}
                        className="px-4 py-2 rounded text-white font-medium"
                        style={{ backgroundColor: PRIMARY_COLOR }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditing(null)}
                        className="px-4 py-2 rounded bg-gray-300 text-gray-700 font-medium hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900">{ach.title}</h3>
                        <p className="text-gray-600 text-sm mt-1">{ach.description}</p>
                        <div className="mt-3 flex gap-3 text-xs text-gray-500">
                          <span>By: {ach.submitted_by}</span>
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">{ach.category}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEditStart(ach)}
                          className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(ach.id)}
                          className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
