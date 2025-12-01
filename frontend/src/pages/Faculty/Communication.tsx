import React, { useState, useEffect } from 'react';
import { Mail, Users, Send, AlertCircle } from 'lucide-react';
import axios from 'axios';

interface EmailLog {
  id: string;
  subject: string;
  recipient_count: number;
  recipient_type: string;
  created_at: string;
}

export default function FacultyCommunication() {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipientType, setRecipientType] = useState('students');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    fetchEmailLogs();
  }, []);

  const fetchEmailLogs = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/faculty/communication/email-logs`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setLogs(response.data);
    } catch (err) {
      console.error('Error fetching email logs:', err);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) {
      setError('Subject and message are required');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/faculty/communication/sendemail`,
        {
          subject,
          body,
          recipient_type: recipientType
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      setMessage(`✅ ${response.data.message}`);
      setSubject('');
      setBody('');
      fetchEmailLogs();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-6">
          <Mail className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Communication Tools</h1>
        </div>

        <form onSubmit={handleSendEmail} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Recipient Type</label>
            <select
              value={recipientType}
              onChange={(e) => setRecipientType(e.target.value)}
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="students">All Department Students</option>
              <option value="alumni">All Department Alumni</option>
              <option value="all">All Users</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Email subject"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Type your message here..."
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {message && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2"
          >
            <Send className="w-5 h-5" />
            {loading ? 'Sending...' : 'Send Email'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Email History</h2>
        </div>

        <div className="space-y-3">
          {logs.length === 0 ? (
            <p className="text-gray-500">No emails sent yet</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="border border-gray-200 rounded-lg p-4">
                <p className="font-medium text-gray-900">{log.subject}</p>
                <p className="text-sm text-gray-600">
                  To: {log.recipient_count} {log.recipient_type}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(log.created_at).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
