import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import Card from '../../components/Card'
import api from '../../services/api'
import { Loader2, Send } from 'lucide-react'

export default function MassEmails() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(0)
  const [form, setForm] = useState({ subject: '', content: '', recipient_group: 'all' })

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!confirm('Send email to all ' + form.recipient_group + ' recipients?')) return

    setLoading(true)
    try {
      const res = await api.post('/api/admin/send-mass-email', form)
      setSent(res.data.sent_count)
      setForm({ subject: '', content: '', recipient_group: 'all' })
      alert(`Email sent successfully to ${res.data.sent_count} recipients!`)
    } catch (error) {
      console.error('Failed to send emails:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Card>
          <h3 className="text-lg font-semibold mb-6">Send Mass Emails to Alumni</h3>

          <form onSubmit={handleSend} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Recipient Group</label>
              <select
                value={form.recipient_group}
                onChange={(e) => setForm({ ...form, recipient_group: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Alumni</option>
                <option value="active">Active Members</option>
                <option value="unpaid">Unpaid Members</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Email Subject</label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Email Content</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                rows={8}
                required
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                💡 Tip: Use these variables in your content:
                <br />
                {'{'}name{'}'}, {'{'}email{'}'}, {'{'}department{'}'}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 w-full justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Mass Email
                </>
              )}
            </button>

            {sent > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">✓ Successfully sent to {sent} recipients</p>
              </div>
            )}
          </form>
        </Card>
      </div>
    </AdminLayout>
  )
}
