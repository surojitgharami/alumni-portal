import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import Card from '../../components/Card'
import api from '../../services/api'
import { Loader2, Check, X } from 'lucide-react'

interface Registration {
  _id: string
  name: string
  email: string
  registration_number: string
  department: string
  passout_year: number
  status: 'pending' | 'approved' | 'rejected'
}

export default function ManageRegistrations() {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRegistrations()
  }, [])

  const fetchRegistrations = async () => {
    try {
      const res = await api.get('/api/admin/registrations')
      setRegistrations(res.data)
    } catch (error) {
      console.error('Failed to fetch registrations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    try {
      await api.post(`/api/admin/registrations/${id}/approve`)
      setRegistrations(registrations.map(r => r._id === id ? { ...r, status: 'approved' } : r))
    } catch (error) {
      console.error('Failed to approve:', error)
    }
  }

  const handleReject = async (id: string) => {
    try {
      await api.post(`/api/admin/registrations/${id}/reject`)
      setRegistrations(registrations.map(r => r._id === id ? { ...r, status: 'rejected' } : r))
    } catch (error) {
      console.error('Failed to reject:', error)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    )
  }

  const pendingRegs = registrations.filter(r => r.status === 'pending')

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Card>
          <h3 className="text-lg font-semibold mb-6">Pending Registration Approvals</h3>

          <div className="space-y-4">
            {pendingRegs.map((reg) => (
              <div key={reg._id} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-semibold text-gray-900">{reg.name}</h4>
                  <p className="text-sm text-gray-600">{reg.email}</p>
                  <p className="text-sm text-gray-600">
                    {reg.registration_number} | {reg.department} | {reg.passout_year}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(reg._id)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Check className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(reg._id)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <X className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
            {pendingRegs.length === 0 && (
              <div className="text-center py-8 text-gray-500">No pending registrations</div>
            )}
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
