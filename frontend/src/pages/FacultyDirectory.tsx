import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Mail, Phone, Search } from 'lucide-react'
import api from '../services/api'
import Card from '../components/Card'

interface Faculty {
  id: string
  name: string
  email: string
  department: string
  phone?: string
  profile_photo_url?: string
  designation?: string
}

const PRIMARY_COLOR = '#0F4C81'
const ACCENT_COLOR = '#FF8A00'
const BG_COLOR = '#F5F7FA'

export default function FacultyDirectory() {
  const navigate = useNavigate()
  const [faculty, setFaculty] = useState<Faculty[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [departments, setDepartments] = useState<string[]>([])

  useEffect(() => {
    fetchFaculty()
  }, [departmentFilter])

  const fetchFaculty = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (departmentFilter) params.append('department', departmentFilter)
      params.append('limit', '100')

      const response = await api.get(`/api/faculty?${params}`)
      setFaculty(response.data || [])

      // Extract unique departments
      const depts = [...new Set(response.data?.map((f: Faculty) => f.department) || [])]
      setDepartments(depts as string[])
    } catch (err) {
      console.error('Failed to fetch faculty:', err)
      setFaculty([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = faculty.filter(f =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen" style={{ backgroundColor: BG_COLOR }}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Faculty Directory</h1>
          <p className="text-gray-600">Browse and contact faculty members from all departments</p>
        </div>

        {/* Filters */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
              style={{ borderColor: PRIMARY_COLOR }}
            />
          </div>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: PRIMARY_COLOR }} />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <p className="text-center text-gray-600 py-8">No faculty members found</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(fac => (
              <Card
                key={fac.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/faculty/${fac.id}`)}
              >
                <div className="flex flex-col h-full">
                  {/* Profile Photo */}
                  <div className="mb-4">
                    {fac.profile_photo_url ? (
                      <img
                        src={fac.profile_photo_url}
                        alt={fac.name}
                        className="w-full h-48 rounded-lg object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-48 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: ACCENT_COLOR + '20' }}
                      >
                        <span className="text-5xl font-bold" style={{ color: PRIMARY_COLOR }}>
                          {fac.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{fac.name}</h3>

                  {/* Department Badge */}
                  <div className="mb-3">
                    <span
                      className="inline-block px-3 py-1 rounded-full text-white text-xs font-semibold"
                      style={{ backgroundColor: PRIMARY_COLOR }}
                    >
                      {fac.department}
                    </span>
                  </div>

                  {/* Designation */}
                  {fac.designation && (
                    <p className="text-sm text-gray-600 mb-3">{fac.designation}</p>
                  )}

                  {/* Contact Info */}
                  <div className="space-y-2 text-sm mb-4 flex-grow">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" style={{ color: PRIMARY_COLOR }} />
                      <a href={`mailto:${fac.email}`} className="hover:underline truncate">
                        {fac.email}
                      </a>
                    </div>
                    {fac.phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4" style={{ color: PRIMARY_COLOR }} />
                        <a href={`tel:${fac.phone}`} className="hover:underline">
                          {fac.phone}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* View Details Button */}
                  <button
                    className="w-full py-2 rounded-lg text-white font-semibold text-sm transition-colors"
                    style={{ backgroundColor: PRIMARY_COLOR }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                  >
                    View Profile
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
