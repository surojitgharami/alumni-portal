import { useState, useEffect } from 'react'
import { useAuth } from '../../App'
import { RefreshCw, Download } from 'lucide-react'

interface Payment {
  id: string
  order_id: string
  amount: number
  status: string
  user_name: string
}

export default function PaymentReconciliation() {
  const { token } = useAuth()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/payments/reconcile`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setPayments(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = async (paymentId: string) => {
    try {
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/payments/retry`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_id: paymentId })
      })
      fetchPayments()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const exportData = () => {
    const csv = payments.map(p => `${p.order_id},${p.amount},${p.status}`).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'payments.csv'
    a.click()
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Payment Reconciliation</h1>
        <button
          onClick={exportData}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
        >
          <Download size={18} /> Export
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-6 text-center">Loading...</div>
        ) : payments.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No failed payments</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="p-3 text-left">Order ID</th>
                <th className="p-3 text-left">Amount</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">User</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p: any) => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-mono text-sm">{p.order_id}</td>
                  <td className="p-3">₹{p.amount}</td>
                  <td className="p-3"><span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">{p.status}</span></td>
                  <td className="p-3">{p.user_name}</td>
                  <td className="p-3">
                    <button
                      onClick={() => handleRetry(p.id)}
                      className="text-blue-600 hover:bg-blue-50 p-2 rounded flex items-center gap-1"
                    >
                      <RefreshCw size={16} /> Retry
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
