import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import Card from '../../components/Card'
import api from '../../services/api'
import { Loader2, Download } from 'lucide-react'

interface DonationReport {
  total_donations: number
  total_amount: number
  recent_donations: Array<{
    _id: string
    donor_name: string
    amount: number
    created_at: string
  }>
}

export default function Donations() {
  const [report, setReport] = useState<DonationReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReport()
  }, [])

  const fetchReport = async () => {
    try {
      const res = await api.get('/api/admin/donations-report')
      setReport(res.data)
    } catch (error) {
      console.error('Failed to fetch donations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const res = await api.get('/api/admin/donations-report/export', { responseType: 'blob' })
      const url = window.URL.createObjectURL(res.data)
      const link = document.createElement('a')
      link.href = url
      link.download = `donations-${new Date().toISOString().split('T')[0]}.csv`
      link.click()
    } catch (error) {
      console.error('Failed to export:', error)
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

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Card>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">Donations & Payment Reports</h3>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Donations</p>
              <p className="text-3xl font-bold text-green-600">{report?.total_donations || 0}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-3xl font-bold text-blue-600">₹{report?.total_amount?.toLocaleString() || 0}</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Recent Donations</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-gray-900">Donor Name</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-900">Amount</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-900">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {report?.recent_donations?.map((donation) => (
                    <tr key={donation._id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-2">{donation.donor_name}</td>
                      <td className="px-4 py-2">₹{(donation.amount / 100).toLocaleString()}</td>
                      <td className="px-4 py-2">{new Date(donation.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!report?.recent_donations || report.recent_donations.length === 0 && (
                <div className="text-center py-8 text-gray-500">No donations yet</div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
