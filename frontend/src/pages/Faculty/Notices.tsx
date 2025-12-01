import React, { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, AlertCircle } from 'lucide-react';
import axios from 'axios';

interface Notice {
  id: string;
  title: string;
  content: string;
  notice_type: string;
  created_at: string;
}

export default function DepartmentNotices() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [noticeType, setNoticeType] = useState('general');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/faculty/notices`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setNotices(response.data);
    } catch (err) {
      console.error('Error fetching notices:', err);
      setError('Failed to load notices');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }

    try {
      await axios.post(
        `${BACKEND_URL}/api/faculty/notices`,
        { title, content, notice_type: noticeType },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      setMessage('✅ Notice published successfully');
      setTitle('');
      setContent('');
      setShowForm(false);
      fetchNotices();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to publish notice');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this notice?')) return;

    try {
      await axios.delete(`${BACKEND_URL}/api/faculty/notices/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMessage('✅ Notice deleted');
      fetchNotices();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete notice');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Department Notices</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Notice
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Notice Type</label>
              <select
                value={noticeType}
                onChange={(e) => setNoticeType(e.target.value)}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="general">General</option>
                <option value="circular">Circular</option>
                <option value="exam">Exam Notice</option>
                <option value="internship">Internship</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Notice title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Notice content..."
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-red-700">{error}</p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg"
              >
                Publish
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

      {message && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {message}
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Loading notices...</p>
      ) : (
        <div className="grid gap-4">
          {notices.length === 0 ? (
            <p className="text-gray-500">No notices published yet</p>
          ) : (
            notices.map((notice) => (
              <div key={notice.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900">{notice.title}</h3>
                    <p className="text-sm text-blue-600 mt-1">
                      {notice.notice_type.charAt(0).toUpperCase() + notice.notice_type.slice(1)}
                    </p>
                    <p className="text-gray-700 mt-2">{notice.content}</p>
                    <p className="text-xs text-gray-500 mt-3">
                      {new Date(notice.created_at).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(notice.id)}
                    className="text-red-600 hover:text-red-700 p-2"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
