import { useState, useEffect } from 'react'
import { useAuth } from '../../App'
import { Trash2, AlertCircle, CheckCircle } from 'lucide-react'

export default function DiscussionModeration() {
  const { token } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchPosts()
  }, [filter])

  const fetchPosts = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/moderation?status=${filter}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const data = await res.json()
      setPosts(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (postId: string) => {
    try {
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/moderation/${postId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchPosts()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleReject = async (postId: string) => {
    try {
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/moderation/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchPosts()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Discussion Moderation</h1>
      <div className="mb-4 flex gap-2">
        {['all', 'flagged', 'pending'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center p-6">Loading...</div>
        ) : posts.length === 0 ? (
          <div className="text-center p-6 text-gray-500">No posts to moderate</div>
        ) : (
          posts.map((post: any) => (
            <div key={post.id} className="bg-white p-4 rounded-lg border">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold">{post.author}</p>
                  <p className="text-sm text-gray-600">{post.content}</p>
                </div>
                {post.is_flagged && <AlertCircle className="text-red-600" />}
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleApprove(post.id)}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center gap-1"
                >
                  <CheckCircle size={16} /> Approve
                </button>
                <button
                  onClick={() => handleReject(post.id)}
                  className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 flex items-center gap-1"
                >
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
