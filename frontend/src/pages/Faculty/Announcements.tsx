import { useState, useEffect } from 'react'
import { Send, Loader2, Trash2, Mail, AlertCircle } from 'lucide-react'
import api from '../../services/api'
import Card from '../../components/Card'

interface Announcement {
  id?: string
  title: string
  content: string
  announcement_type: string
  target_audience: string
  created_at: string
}

const PRIMARY_COLOR = '#0F4C81'
const ACCENT_COLOR = '#FF8A00'
const BG_COLOR = '#F5F7FA'

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    announcement_type: 'general',
    target_audience: 'all'
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      const response = await api.get('/faculty/announcements')
      setAnnouncements(response.data || [])
    } catch (err) {
      console.error('Error fetching announcements:', err)
      setError('Failed to load announcements')
    } finally {
      setLoading(false)
    }
  }

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) {
      setError('Please fill in title and content')
      return
    }

    setPosting(true)
    setError('')
    try {
      await api.post('/faculty/announcements', newAnnouncement)
      setSuccess('Announcement posted successfully!')
      setNewAnnouncement({
        title: '',
        content: '',
        announcement_type: 'general',
        target_audience: 'all'
      })
      fetchAnnouncements()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to post announcement')
    } finally {
      setPosting(false)
    }
  }

  const handleDelete = async (id: string | undefined) => {
    if (!id) return
    if (!window.confirm('Delete this announcement?')) return

    try {
      await api.delete(`/api/faculty/announcements/${id}`)
      setAnnouncements(announcements.filter(item => item.id !== id))
      setSuccess('Announcement deleted')
      setTimeout(() => setSuccess(''), 2000)
    } catch (err) {
      setError('Failed to delete announcement')
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
    <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: BG_COLOR }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: PRIMARY_COLOR }}>
            Department Announcements
          </h1>
          <p className="text-gray-600">Send and manage department-wide announcements</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Announcement Form */}
          <div className="lg:col-span-1">
            <Card>
              <form onSubmit={handlePost} className="space-y-4">
                <h2 className="text-xl font-bold" style={{ color: PRIMARY_COLOR }}>
                  New Announcement
                </h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newAnnouncement.title}
                    onChange={(e) =>
                      setNewAnnouncement({ ...newAnnouncement, title: e.target.value })
                    }
                    placeholder="Announcement title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': PRIMARY_COLOR } as any}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={newAnnouncement.announcement_type}
                    onChange={(e) =>
                      setNewAnnouncement({ ...newAnnouncement, announcement_type: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': PRIMARY_COLOR } as any}
                  >
                    <option value="general">General</option>
                    <option value="urgent">Urgent</option>
                    <option value="event">Event</option>
                    <option value="important">Important</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Audience
                  </label>
                  <select
                    value={newAnnouncement.target_audience}
                    onChange={(e) =>
                      setNewAnnouncement({ ...newAnnouncement, target_audience: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': PRIMARY_COLOR } as any}
                  >
                    <option value="all">All</option>
                    <option value="students">Students Only</option>
                    <option value="alumni">Alumni Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content
                  </label>
                  <textarea
                    value={newAnnouncement.content}
                    onChange={(e) =>
                      setNewAnnouncement({ ...newAnnouncement, content: e.target.value })
                    }
                    placeholder="Write your announcement..."
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': PRIMARY_COLOR } as any}
                  />
                </div>

                <button
                  type="submit"
                  disabled={posting}
                  className="w-full py-2 px-4 rounded-lg text-white font-medium flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50"
                  style={{ backgroundColor: ACCENT_COLOR }}
                >
                  {posting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Post Announcement
                </button>
              </form>
            </Card>
          </div>

          {/* Announcements List */}
          <div className="lg:col-span-2 space-y-4">
            {announcements.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <Mail className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No announcements yet</p>
                  <p className="text-sm text-gray-400">Create one to get started</p>
                </div>
              </Card>
            ) : (
              announcements.map((ann) => (
                <Card key={ann.id}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold" style={{ color: PRIMARY_COLOR }}>
                          {ann.title}
                        </h3>
                        <span
                          className="px-2 py-1 rounded text-xs font-medium text-white"
                          style={{ backgroundColor: ACCENT_COLOR }}
                        >
                          {ann.announcement_type}
                        </span>
                        <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                          {ann.target_audience}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {new Date(ann.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(ann.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{ann.content}</p>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
