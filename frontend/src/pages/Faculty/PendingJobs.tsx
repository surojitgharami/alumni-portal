import { useState, useEffect } from 'react'
import { useAuth } from '../../App'
import DataTable from '../../components/DataTable'
import { CheckCircle, XCircle } from 'lucide-react'

// Faculty-only page for approving pending jobs

export default function PendingJobs() {
  const { token } = useAuth()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchPendingJobs()
  }, [])
  
  const fetchPendingJobs = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/faculty/jobs?status=pending`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const data = await response.json()
      setJobs(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleApprove = async (jobId: string) => {
    try {
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/faculty/jobs/${jobId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchPendingJobs()
    } catch (error) {
      console.error('Approve error:', error)
    }
  }
  
  const handleReject = async (jobId: string) => {
    try {
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/faculty/jobs/${jobId}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchPendingJobs()
    } catch (error) {
      console.error('Reject error:', error)
    }
  }
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Pending Job Approvals</h1>
      
      <DataTable
        columns={[
          { header: 'Job Title', accessor: 'title' },
          { header: 'Company', accessor: 'company' },
          { header: 'Posted By', accessor: 'postedByName' },
          { header: 'Status', accessor: 'status' }
        ]}
        data={jobs}
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
