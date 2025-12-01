import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, Plus } from 'lucide-react';
import axios from 'axios';

interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  author_role: string;
  created_at: string;
  replies_count: number;
}

export default function Discussion() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/discussion/department`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setPosts(response.data);
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    try {
      await axios.post(
        `${BACKEND_URL}/api/discussion`,
        { title, content },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setTitle('');
      setContent('');
      setShowForm(false);
      fetchPosts();
    } catch (err) {
      console.error('Error creating post:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Department Discussion</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Start Discussion
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Discussion topic..."
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="What do you want to discuss?"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Post
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Loading discussions...</p>
      ) : (
        <div className="space-y-4">
          {posts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No discussions yet. Start one!</p>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="bg-white rounded-lg shadow p-6">
                <h3 className="font-bold text-lg text-gray-900">{post.title}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  By {post.author} ({post.author_role})
                </p>
                <p className="text-gray-700 mt-3">{post.content}</p>
                <div className="flex items-center gap-4 mt-4 pt-4 border-t">
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    {post.replies_count} replies
                  </span>
                  <p className="text-xs text-gray-500">
                    {new Date(post.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
