import { useState, useEffect } from 'react'
import { Users, Loader2, Plus, Edit2, Trash2, CheckCircle, X, Search } from 'lucide-react'
import api from '../../services/api'
import Card from '../../components/Card'

interface Alumni {
  id: string
  name: string
  email: string
  phone: string
  passout_year: number
  current_company: string
  location: string
  is_blocked: boolean
  status: string
}

const PRIMARY_COLOR = "#0F4C81"
const BG_COLOR = "#F5F7FA"

export default function ManageAlumni() {
  const [alumni, setAlumni] = useState<Alumni[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    passout_year: new Date().getFullYear() - 5,
    current_company: '',
    location: ''
  })

  useEffect(() => {
    fetchAlumni()
  }, [])

  const fetchAlumni = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/faculty/alumni')
      setAlumni(response.data)
    } catch (err) {
      console.error('Error fetching alumni:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddNew = () => {
    setEditingId(null)
    setForm({
      name: '',
      email: '',
      phone: '',
      passout_year: new Date().getFullYear() - 5,
      current_company: '',
      location: ''
    })
    setShowForm(true)
  }

  const handleEdit = (alum: Alumni) => {
    setEditingId(alum.id)
    setForm({
      name: alum.name,
      email: alum.email,
      phone: alum.phone,
      passout_year: alum.passout_year,
      current_company: alum.current_company,
      location: alum.location
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editingId) {
        await api.patch(`/api/faculty/alumni/${editingId}`, form)
      } else {
        await api.post('/api/faculty/alumni', form)
      }
      await fetchAlumni()
      setShowForm(false)
      setForm({
        name: '',
        email: '',
        phone: '',
        passout_year: new Date().getFullYear() - 5,
        current_company: '',
        location: ''
      })
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error saving alumni')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this alumni?')) return
    try {
      await api.delete(`/api/faculty/alumni/${id}`)
      await fetchAlumni()
    } catch (err) {
      alert('Error deleting alumni')
    }
  }

  const handleApprove = async (id: string) => {
    try {
      await api.post(`/api/faculty/alumni/${id}/approve`)
      await fetchAlumni()
    } catch (err) {
      alert('Error approving alumni')
    }
  }

  const filtered = alumni.filter(a =>
    a.name.toLowerCase().includes(searchText.toLowerCase()) ||
    a.email.toLowerCase().includes(searchText.toLowerCase())
  )

  return (
    <div className="min-h-screen" style={{ backgroundColor: BG_COLOR }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage Alumni</h1>
              <p className="mt-2 text-gray-600">Add, edit, and approve department alumni</p>
            </div>
            <button
              onClick={handleAddNew}
              className="flex items-center gap-2 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              <Plus className="w-4 h-4" />
              Add Alumni
            </button>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <Card className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">{editingId ? 'Edit Alumni' : 'Add New Alumni'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Passout Year *</label>
                  <input
                    type="number"
                    value={form.passout_year}
                    onChange={(e) => setForm({ ...form, passout_year: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Current Company</label>
                  <input
                    type="text"
                    value={form.current_company}
                    onChange={(e) => setForm({ ...form, current_company: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: PRIMARY_COLOR }}
                >
                  {submitting ? 'Saving...' : (editingId ? 'Update' : 'Add')} Alumni
                </button>
              </div>
            </form>
          </Card>
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1"
              style={{ focusRing: PRIMARY_COLOR }}
            />
          </div>
        </div>

        {/* Alumni List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: PRIMARY_COLOR }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500">{alumni.length === 0 ? 'No alumni found. Add one to get started!' : 'No alumni match your search'}</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead style={{ backgroundColor: PRIMARY_COLOR }}>
                <tr className="text-white">
                  <th className="px-6 py-3 text-left text-sm font-medium">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Phone</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Year</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Company</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Location</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((person, idx) => (
                  <tr key={person.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{person.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{person.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{person.phone || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{person.passout_year}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{person.current_company || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{person.location || '-'}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        person.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {person.status.charAt(0).toUpperCase() + person.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm flex gap-2">
                      {person.status !== 'active' && (
                        <button
                          onClick={() => handleApprove(person.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded"
                          title="Approve"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(person)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(person.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
