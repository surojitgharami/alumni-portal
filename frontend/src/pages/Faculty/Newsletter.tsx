import { useState, useEffect } from 'react'
import { Send, Loader2, X, Mail } from 'lucide-react'
import api from '../../services/api'
import Card from '../../components/Card'

interface Newsletter {
  _id?: string
  title: string
  content: string
  published_date: string
  recipients: number
}

const PRIMARY_COLOR = '#0F4C81'
const BG_COLOR = '#F5F7FA'

export default function Newsletter() {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([])
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [newLetter, setNewLetter] = useState({ title: '', content: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchNewsletters()
  }, [])

  const fetchNewsletters = async () => {
    try {
      const response = await api.get('/faculty/newsletters')
      setNewsletters(response.data)
    } catch (err) {
      console.error('Error fetching newsletters:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLetter.title || !newLetter.content) {
      setError('Please fill in title and content')
      return
    }

    setPublishing(true)
    setError('')
    try {
      await api.post('/faculty/newsletters', newLetter)
      setSuccess('Newsletter published successfully!')
      setNewLetter({ title: '', content: '' })
      fetchNewsletters()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to publish newsletter')
    } finally {
      setPublishing(false)
    }
  }

  const handleDelete = async (id: string | undefined) => {
    if (!id) return
    try {
      await api.delete(`/faculty/newsletters/${id}`)
      setNewsletters(newsletters.filter(item => item._id !== id))
    } catch (err) {
      console.error('Error deleting newsletter:', err)
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Faculty Newsletter</h1>

        {error && <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">{error}</div>}
        {success && <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 text-green-700">{success}</div>}

        {/* Publish Newsletter Form */}
        <Card className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Publish Newsletter</h2>
          <form onSubmit={handlePublish} className="space-y-4">
            <input
              type="text"
              placeholder="Newsletter Title"
              value={newLetter.title}
              onChange={(e) => setNewLetter({ ...newLetter, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            <textarea
              placeholder="Newsletter Content (Markdown supported)"
              value={newLetter.content}
              onChange={(e) => setNewLetter({ ...newLetter, content: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              rows={6}
            />
            <button
              type="submit"
              disabled={publishing}
              className="w-full py-2 rounded-lg text-white font-semibold flex items-center justify-center gap-2"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              <Send className="w-4 h-4" />
              {publishing ? 'Publishing...' : 'Publish Newsletter'}
            </button>
          </form>
        </Card>

        {/* Newsletters List */}
        {newsletters.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No newsletters published yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {newsletters.map((letter) => (
              <Card key={letter._id} className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{letter.title}</h3>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{letter.content}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Published: {new Date(letter.published_date).toLocaleDateString()} • Recipients: {letter.recipients}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(letter._id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
