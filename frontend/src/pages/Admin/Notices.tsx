import { useState, useEffect } from 'react'
import { useAuth } from '../../App'
import { Upload, Trash2, Eye } from 'lucide-react'

export default function AdminNotices() {
  const { token } = useAuth()
  const [notices, setNotices] = useState([])
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotices()
  }, [])

  const fetchNotices = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/notices`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setNotices(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async () => {
    if (!file || !title) return
    const form = new FormData()
    form.append('title', title)
    form.append('file', file)

    try {
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/notices`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form
      })
      setFile(null)
      setTitle('')
      fetchNotices()
    } catch (error) {
      console.error('Upload error:', error)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Department Notices</h1>
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <input
          className="border p-2 rounded w-full mb-3"
          placeholder="Notice Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          accept=".pdf,.jpg,.png"
          className="mb-3 block"
        />
        <button
          onClick={handleUpload}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
        >
          <Upload size={18} /> Upload Notice
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-6 text-center">Loading...</div>
        ) : notices.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No notices</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="p-3 text-left">Title</th>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {notices.map((notice: any) => (
                <tr key={notice.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{notice.title}</td>
                  <td className="p-3">{new Date(notice.created_at).toLocaleDateString()}</td>
                  <td className="p-3 flex gap-2">
                    <button className="text-blue-600"><Eye size={18} /></button>
                    <button className="text-red-600"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
