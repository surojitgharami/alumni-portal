import { useState, useEffect } from 'react'
import { useAuth } from '../../App'
import { Download } from 'lucide-react'

interface AnalyticsStats {
  totalEvents: number
  totalJobs: number
  totalUsers: number
  eventConversion: number
  jobConversion: number
}

export default function AdvancedAnalytics() {
  const { token } = useAuth()
  const [stats, setStats] = useState<AnalyticsStats>({
    totalEvents: 0,
    totalJobs: 0,
    totalUsers: 0,
    eventConversion: 0,
    jobConversion: 0
  })
  const [department, setDepartment] = useState('all')
  const [year, setYear] = useState('all')
  
  useEffect(() => {
    fetchAnalytics()
  }, [department, year])
  
  const fetchAnalytics = async () => {
    try {
      const params = new URLSearchParams()
      if (department !== 'all') params.append('department', department)
      if (year !== 'all') params.append('year', year)
      
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/analytics?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    }
  }
  
  const exportCSV = () => {
    const csv = `Event Conversions,${stats.eventConversion}%\nJob Conversions,${stats.jobConversion}%\nTotal Events,${stats.totalEvents}\nTotal Jobs,${stats.totalJobs}`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'analytics.csv'
    a.click()
  }
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Advanced Analytics</h1>
        <button
          onClick={exportCSV}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
        >
          <Download size={18} /> Export CSV
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Department</label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full border rounded p-2"
          >
            <option value="all">All Departments</option>
            <option value="cs">Computer Science</option>
            <option value="ec">Electronics</option>
            <option value="me">Mechanical</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Year</label>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="w-full border rounded p-2"
          >
            <option value="all">All Years</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <p className="text-gray-600 text-sm">Total Events</p>
          <p className="text-3xl font-bold text-blue-600">{stats.totalEvents}</p>
        </div>
        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <p className="text-gray-600 text-sm">Total Jobs</p>
          <p className="text-3xl font-bold text-green-600">{stats.totalJobs}</p>
        </div>
        <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
          <p className="text-gray-600 text-sm">Total Users</p>
          <p className="text-3xl font-bold text-purple-600">{stats.totalUsers}</p>
        </div>
      </div>
    </div>
  )
}
