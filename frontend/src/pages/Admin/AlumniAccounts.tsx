import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import Card from '../../components/Card'
import api from '../../services/api'
import { Loader2, Trash2, Edit2, Search } from 'lucide-react'

interface Alumni {
  id: string
  name: string
  email: string
  department: string
  registration_number: string
  passout_year: number
  membership_status: 'active' | 'unpaid'
  phone: string
  role: string
}

export default function AlumniAccounts() {
  const navigate = useNavigate()
  const [alumni, setAlumni] = useState<Alumni[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchAlumni()
  }, [])

  const fetchAlumni = async () => {
    try {
      const res = await api.get('/api/admin/users')
      setAlumni(res.data)
    } catch (error) {
      console.error('Failed to fetch alumni:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (id: string) => {
    navigate(`/admin/alumni/edit/${id}`)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return
    try {
      await api.delete(`/api/admin/users/${id}`)
      setAlumni(alumni.filter(a => a.id !== id))
    } catch (error) {
      console.error('Failed to delete alumni:', error)
    }
  }

  const filtered = alumni.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase())
  )

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
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Manage Alumni Accounts</h3>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Department</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Batch</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Membership</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((alum) => (
                  <tr key={alum.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{alum.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{alum.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{alum.department}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{alum.passout_year}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        alum.membership_status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {alum.membership_status === 'active' ? 'Active' : 'Unpaid'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm flex gap-2">
                      <button 
                        onClick={() => handleEdit(alum.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit alumni"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(alum.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Delete alumni"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-8 text-gray-500">No alumni found</div>
            )}
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
