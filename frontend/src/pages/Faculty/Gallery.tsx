import { useState, useEffect } from 'react'
import { Upload, Loader2, X, Image as ImageIcon } from 'lucide-react'
import api from '../../services/api'
import Card from '../../components/Card'

interface GalleryItem {
  _id: string
  title: string
  description: string
  image_url: string
  uploaded_at: string
}

const PRIMARY_COLOR = '#0F4C81'
const BG_COLOR = '#F5F7FA'

export default function Gallery() {
  const [gallery, setGallery] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [newItem, setNewItem] = useState({ title: '', description: '', image_url: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchGallery()
  }, [])

  const fetchGallery = async () => {
    try {
      const response = await api.get('/faculty/gallery')
      setGallery(response.data)
    } catch (err) {
      console.error('Error fetching gallery:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItem.title || !newItem.image_url) {
      setError('Please fill in title and image URL')
      return
    }

    setUploading(true)
    setError('')
    try {
      await api.post('/faculty/gallery', newItem)
      setSuccess('Gallery item added successfully!')
      setNewItem({ title: '', description: '', image_url: '' })
      fetchGallery()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/faculty/gallery/${id}`)
      setGallery(gallery.filter(item => item._id !== id))
    } catch (err) {
      console.error('Error deleting gallery item:', err)
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
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Faculty Gallery</h1>

        {error && <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">{error}</div>}
        {success && <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 text-green-700">{success}</div>}

        {/* Upload Form */}
        <Card className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Add Gallery Item</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <input
              type="text"
              placeholder="Title"
              value={newItem.title}
              onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            <textarea
              placeholder="Description"
              value={newItem.description}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              rows={3}
            />
            <input
              type="url"
              placeholder="Image URL"
              value={newItem.image_url}
              onChange={(e) => setNewItem({ ...newItem, image_url: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            <button
              type="submit"
              disabled={uploading}
              className="w-full py-2 rounded-lg text-white font-semibold flex items-center justify-center gap-2"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              <Upload className="w-4 h-4" />
              {uploading ? 'Uploading...' : 'Upload Image'}
            </button>
          </form>
        </Card>

        {/* Gallery Grid */}
        {gallery.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No gallery items yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gallery.map((item) => (
              <Card key={item._id}>
                <div className="relative pb-full overflow-hidden rounded-lg bg-gray-100 mb-4">
                  <img src={item.image_url} alt={item.title} className="w-full h-48 object-cover" />
                </div>
                <h3 className="font-bold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                <button
                  onClick={() => handleDelete(item._id)}
                  className="mt-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
