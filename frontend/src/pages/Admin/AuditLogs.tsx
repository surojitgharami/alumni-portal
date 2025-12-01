import { useState, useEffect } from 'react'
import { useAuth } from '../../App'
import { Download } from 'lucide-react'

interface AuditLog {
  id: string
  timestamp: string
  user: string
  action: string
  ip_address: string
}

export default function AuditLogs() {
  const { token } = useAuth()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ user: '', role: '', action: '' })

  useEffect(() => {
    fetchLogs()
  }, [filters])

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams()
      if (filters.user) params.append('user', filters.user)
      if (filters.role) params.append('role', filters.role)
      if (filters.action) params.append('action', filters.action)

      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/logs?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const data = await res.json()
      setLogs(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportLogs = () => {
    const csv = logs.map(l => `${l.timestamp},${l.user},${l.action},${l.ip_address}`).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'audit-logs.csv'
    a.click()
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <button
          onClick={exportLogs}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
        >
          <Download size={18} /> Export
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          type="text"
          placeholder="Filter by user email"
          value={filters.user}
          onChange={(e) => setFilters({ ...filters, user: e.target.value })}
          className="border rounded p-2"
        />
        <select
          value={filters.role}
          onChange={(e) => setFilters({ ...filters, role: e.target.value })}
          className="border rounded p-2"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="faculty">Faculty</option>
          <option value="alumni">Alumni</option>
          <option value="student">Student</option>
        </select>
        <input
          type="text"
          placeholder="Filter by action"
          value={filters.action}
          onChange={(e) => setFilters({ ...filters, action: e.target.value })}
          className="border rounded p-2"
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-6 text-center">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No logs found</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="p-3 text-left">Timestamp</th>
                <th className="p-3 text-left">User</th>
                <th className="p-3 text-left">Action</th>
                <th className="p-3 text-left">IP Address</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log: any) => (
                <tr key={log.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="p-3">{log.user}</td>
                  <td className="p-3">{log.action}</td>
                  <td className="p-3 font-mono text-xs">{log.ip_address}</td>
                  <td className="p-3"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Success</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
