import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import Card from '../../components/Card'
import api from '../../services/api'
import { Loader2, Plus, Trash2 } from 'lucide-react'

interface GalleryItem {
  _id: string
  title: string
  image_url: string
  description: string
  created_at: string
}

export default function Gallery() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({ title: '', image_url: '', description: '' })

  useEffect(() => {
    fetchGallery()
  }, [])

  const fetchGallery = async () => {
    try {
      const res = await api.get('/api/admin/gallery')
      setItems(res.data)
    } catch (error) {
      console.error('Failed to fetch gallery:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.image_url) {
      alert('Please enter an image URL')
      return
    }

    setUploading(true)
    try {
      await api.post('/api/admin/gallery', form)
      setForm({ title: '', image_url: '', description: '' })
      fetchGallery()
    } catch (error) {
      console.error('Failed to upload:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this image?')) return
    try {
      await api.delete(`/api/admin/gallery/${id}`)
      setItems(items.filter(i => i._id !== id))
    } catch (error) {
      console.error('Failed to delete:', error)
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
          <h3 className="text-lg font-semibold mb-6">Gallery Management</h3>

          <form onSubmit={handleUpload} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
            <input
              type="text"
              placeholder="Image Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
            <input
              type="text"
              placeholder="Image URL"
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
            <textarea
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows={3}
            />
            <button
              type="submit"
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              {uploading ? 'Uploading...' : 'Add Image'}
            </button>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <div key={item._id} className="bg-gray-50 rounded-lg overflow-hidden">
                <img src={item.image_url} alt={item.title} className="w-full h-48 object-cover" />
                <div className="p-4">
                  <h4 className="font-semibold text-gray-900">{item.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="mt-3 p-2 text-red-600 hover:bg-red-50 rounded w-full flex justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {items.length === 0 && (
            <div className="text-center py-8 text-gray-500">No gallery items yet</div>
          )}
        </Card>
      </div>
    </AdminLayout>
  )
}
