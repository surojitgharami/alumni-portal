import { useState, useEffect } from 'react'
import { useAuth } from '../../App'
import { Send, Flag, Trash2, MessageCircle, Loader2, Plus, Heart, Reply as ReplyIcon, User } from 'lucide-react'
import api from '../../services/api'

interface Post {
  id: string
  title: string
  content: string
  author: string
  author_role: string
  created_at: string
  replies_count: number
}

interface Reply {
  id: string
  content: string
  author: string
  author_role: string
  created_at: string
  post_id: string
}

const PRIMARY_COLOR = "#0F4C81"
const BG_COLOR = "#F5F7FA"

export default function AlumniDiscussion() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [replies, setReplies] = useState<{ [key: string]: Reply[] }>({})
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [replyContent, setReplyContent] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/discussion/department')
      setPosts(Array.isArray(response.data) ? response.data : [])
      // Fetch replies for each post
      const repliesMap: { [key: string]: Reply[] } = {}
      for (const post of response.data) {
        try {
          const repliesRes = await api.get(`/api/discussion/${post.id}/replies`)
          repliesMap[post.id] = repliesRes.data || []
        } catch (err) {
          repliesMap[post.id] = []
        }
      }
      setReplies(repliesMap)
    } catch (error) {
      console.error('Error fetching posts:', error)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    
    setPosting(true)
    try {
      await api.post('/api/discussion', {
        title: title.trim(),
        content: content.trim()
      })
      setTitle('')
      setContent('')
      setShowForm(false)
      fetchPosts()
    } catch (error) {
      console.error('Error posting:', error)
      alert('Failed to post discussion')
    } finally {
      setPosting(false)
    }
  }

  const handleReply = async (postId: string) => {
    if (!replyContent.trim()) return
    
    try {
      await api.post(`/api/discussion/${postId}/reply`, {
        content: replyContent.trim()
      })
      setReplyContent('')
      setReplyingTo(null)
      fetchPosts()
    } catch (error) {
      console.error('Error replying:', error)
      alert('Failed to post reply')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: BG_COLOR }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <MessageCircle size={32} style={{ color: PRIMARY_COLOR }} />
              Alumni Discussion Board
            </h1>
            <p className="mt-2 text-gray-600">Connect, share experiences, and discuss with fellow alumni</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-6 py-2 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg"
            style={{ backgroundColor: PRIMARY_COLOR }}
          >
            <Plus size={20} />
            New Discussion
          </button>
        </div>

        {/* New Post Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Start a Discussion</h2>
            <form onSubmit={handlePost} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Topic</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What do you want to discuss?"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-all"
                  style={{ '--tw-ring-color': PRIMARY_COLOR } as any}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Thoughts</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Share your thoughts, questions, or experiences..."
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-all resize-none"
                  style={{ '--tw-ring-color': PRIMARY_COLOR } as any}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={posting}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg disabled:opacity-50"
                  style={{ backgroundColor: PRIMARY_COLOR }}
                >
                  {posting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Post Discussion
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2.5 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Posts */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin" style={{ color: PRIMARY_COLOR }} />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <MessageCircle size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-600 text-lg">No discussions yet</p>
            <p className="text-gray-500 text-sm mt-1">Be the first to start a discussion!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300">
                {/* Post Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900">{post.title}</h3>
                      <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold" style={{ backgroundColor: PRIMARY_COLOR }}>
                            {post.author.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium">{post.author}</span>
                        </div>
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-700 capitalize">
                          {post.author_role}
                        </span>
                        <span className="text-gray-500">{formatDate(post.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{post.content}</p>
                </div>

                {/* Post Actions */}
                <div className="px-6 py-3 bg-gray-50 flex items-center gap-6 text-sm text-gray-600 border-b border-gray-100">
                  <button className="flex items-center gap-2 hover:text-red-600 transition-colors">
                    <Heart size={16} />
                    Like
                  </button>
                  <button
                    onClick={() => setReplyingTo(replyingTo === post.id ? null : post.id)}
                    className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                  >
                    <ReplyIcon size={16} />
                    {post.replies_count} Replies
                  </button>
                  <button className="flex items-center gap-2 hover:text-orange-600 transition-colors ml-auto">
                    <Flag size={16} />
                    Report
                  </button>
                </div>

                {/* Reply Form */}
                {replyingTo === post.id && (
                  <div className="p-6 bg-blue-50 border-b border-blue-100">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Reply</label>
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Share your thoughts..."
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 resize-none mb-3"
                      style={{ '--tw-ring-color': PRIMARY_COLOR } as any}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReply(post.id)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white transition-all hover:shadow-lg"
                        style={{ backgroundColor: PRIMARY_COLOR }}
                      >
                        <Send size={16} />
                        Reply
                      </button>
                      <button
                        onClick={() => {
                          setReplyingTo(null)
                          setReplyContent('')
                        }}
                        className="px-4 py-2 rounded-lg font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Replies */}
                {replies[post.id] && replies[post.id].length > 0 && (
                  <div className="p-6 bg-gray-50 space-y-4">
                    <p className="text-sm font-semibold text-gray-900 mb-4">{replies[post.id].length} Replies</p>
                    {replies[post.id].map((reply) => (
                      <div key={reply.id} className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-start gap-3 mb-2">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0" style={{ backgroundColor: PRIMARY_COLOR }}>
                            {reply.author.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900">{reply.author}</p>
                            <p className="text-xs text-gray-500">{formatDate(reply.created_at)}</p>
                          </div>
                        </div>
                        <p className="text-gray-700 text-sm">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
