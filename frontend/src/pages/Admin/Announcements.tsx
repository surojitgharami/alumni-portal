import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import Card from '../../components/Card'
import api from '../../services/api'
import { Loader2, Plus, Trash2 } from 'lucide-react'

interface Announcement {
  _id: string
  title: string
  content: string
  created_at: string
}

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', content: '' })

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get('/api/admin/announcements')
      setAnnouncements(res.data)
    } catch (error) {
      console.error('Failed to fetch announcements:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/api/admin/announcements', form)
      setShowForm(false)
      setForm({ title: '', content: '' })
      fetchAnnouncements()
    } catch (error) {
      console.error('Failed to create announcement:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement?')) return
    try {
      await api.delete(`/api/admin/announcements/${id}`)
      setAnnouncements(announcements.filter(a => a._id !== id))
    } catch (error) {
      console.error('Failed to delete announcement:', error)
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
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">Post Announcements</h3>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
            >
              <Plus className="w-4 h-4" />
              New Announcement
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleCreate} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
              <input
                type="text"
                placeholder="Announcement Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
              <textarea
                placeholder="Announcement Content"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={5}
                required
              />
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  Post
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="space-y-4">
            {announcements.map((ann) => (
              <div key={ann._id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{ann.title}</h4>
                    <p className="text-sm text-gray-600 mt-2">{ann.content}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(ann.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(ann._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {announcements.length === 0 && (
              <div className="text-center py-8 text-gray-500">No announcements yet</div>
            )}
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
