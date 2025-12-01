import { useState, useEffect } from 'react'
import { useAuth } from '../../App'
import { Clock, CheckCircle, XCircle, MessageSquare } from 'lucide-react'

export default function EventProposalStatus() {
  const { token } = useAuth()
  const [proposals, setProposals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProposals()
  }, [])

  const fetchProposals = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/student/events`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setProposals(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="text-green-600" size={24} />
      case 'rejected': return <XCircle className="text-red-600" size={24} />
      default: return <Clock className="text-yellow-600" size={24} />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-yellow-100 text-yellow-800'
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">My Event Proposals</h1>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center p-6">Loading...</div>
        ) : proposals.length === 0 ? (
          <div className="text-center p-6 text-gray-500">No proposals submitted</div>
        ) : (
          proposals.map((proposal: any) => (
            <div key={proposal.id} className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-600">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{proposal.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{proposal.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Proposed: {new Date(proposal.created_at).toLocaleDateString()}</span>
                    <span>Event Date: {new Date(proposal.event_date).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusIcon(proposal.status)}
                  <span className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(proposal.status)}`}>
                    {proposal.status?.charAt(0).toUpperCase() + proposal.status?.slice(1) || 'Pending'}
                  </span>
                </div>
              </div>

              {proposal.faculty_feedback && (
                <div className="mt-4 p-3 bg-blue-50 border-l-2 border-blue-600 rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare size={18} className="text-blue-600" />
                    <p className="font-medium text-blue-900">Faculty Feedback</p>
                  </div>
                  <p className="text-blue-800 text-sm">{proposal.faculty_feedback}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
