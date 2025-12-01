import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import Card from '../../components/Card'
import api from '../../services/api'
import { Loader2 } from 'lucide-react'

interface HomepageContent {
  hero_title: string
  hero_subtitle: string
  hero_image_url: string
  features: string[]
  footer_text: string
}

export default function HomepageContent() {
  const [content, setContent] = useState<HomepageContent>({
    hero_title: '',
    hero_subtitle: '',
    hero_image_url: '',
    features: [],
    footer_text: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchContent()
  }, [])

  const fetchContent = async () => {
    try {
      const res = await api.get('/api/admin/homepage-content')
      setContent(res.data)
    } catch (error) {
      console.error('Failed to fetch content:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put('/api/admin/homepage-content', content)
      alert('Homepage content updated successfully!')
    } catch (error) {
      console.error('Failed to save content:', error)
    } finally {
      setSaving(false)
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
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Card>
          <h3 className="text-lg font-semibold mb-6">Edit Homepage Content</h3>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Hero Title</label>
              <input
                type="text"
                value={content.hero_title}
                onChange={(e) => setContent({ ...content, hero_title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Hero Subtitle</label>
              <textarea
                value={content.hero_subtitle}
                onChange={(e) => setContent({ ...content, hero_subtitle: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Hero Image URL</label>
              <input
                type="text"
                value={content.hero_image_url}
                onChange={(e) => setContent({ ...content, hero_image_url: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Footer Text</label>
              <textarea
                value={content.footer_text}
                onChange={(e) => setContent({ ...content, footer_text: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
              </button>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
