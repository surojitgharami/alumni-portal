import { useState, useEffect } from 'react'
import { useAuth } from '../../App'
import DataTable from '../../components/DataTable'
import { CheckCircle, XCircle } from 'lucide-react'

// Faculty-only page for approving pending events

export default function PendingEvents() {
  const { token } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchPendingEvents()
  }, [])
  
  const fetchPendingEvents = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/faculty/events?status=pending`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const data = await response.json()
      setEvents(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleApprove = async (eventId: string) => {
    try {
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/faculty/events/${eventId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchPendingEvents()
    } catch (error) {
      console.error('Approve error:', error)
    }
  }
  
  const handleReject = async (eventId: string) => {
    try {
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/faculty/events/${eventId}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchPendingEvents()
    } catch (error) {
      console.error('Reject error:', error)
    }
  }
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Pending Event Approvals</h1>
      
      <DataTable
        columns={[
          { header: 'Event Title', accessor: 'title' },
          { header: 'Proposed By', accessor: 'createdByName' },
          { header: 'Date', accessor: 'eventDate' },
          { header: 'Status', accessor: 'status' }
        ]}
        data={events}
        loading={loading}
        actions={(row) => (
          <div className="flex gap-2">
            <button
              onClick={() => handleApprove(row.id)}
              className="text-green-600 hover:bg-green-50 p-2 rounded"
            >
              <CheckCircle size={20} />
            </button>
            <button
              onClick={() => handleReject(row.id)}
              className="text-red-600 hover:bg-red-50 p-2 rounded"
            >
              <XCircle size={20} />
            </button>
          </div>
        )}
      />
    </div>
  )
}
