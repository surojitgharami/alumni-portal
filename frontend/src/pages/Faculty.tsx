import { useState, useEffect } from 'react'
import { Search, Mail, Building2, Loader2, Phone } from 'lucide-react'
import api from '../services/api'

interface Faculty {
  id: string
  name: string
  department: string
  email: string
  phone?: string
  profile_photo_url?: string
  professional?: {
    workplace?: string
    designation?: string
    industry?: string
    skills?: string[]
  }
  designation?: string
}

function Faculty() {
  const [faculty, setFaculty] = useState<Faculty[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('')
  const [departments, setDepartments] = useState<string[]>([])

  useEffect(() => {
    fetchFaculty()
  }, [search, department])

  useEffect(() => {
    getDepartments()
  }, [])

  const getDepartments = async () => {
    try {
      const response = await api.get('/api/faculty?limit=1000')
      const depts = new Set<string>()
      response.data.forEach((item: any) => {
        if (item.department) depts.add(item.department)
      })
      setDepartments(Array.from(depts).sort())
    } catch (err) {
      console.log('Could not fetch departments')
    }
  }

  const fetchFaculty = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (department) params.append('department', department)

      const response = await api.get(`/api/faculty?${params}`)
      setFaculty(response.data)
    } catch (err) {
      console.error('Error fetching faculty:', err)
      setFaculty([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Faculty Directory</h1>
          <p className="text-gray-600">Meet our dedicated faculty members</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search by Name</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search faculty..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Faculty Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : faculty.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {faculty.map((prof) => (
              <div key={prof.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                {/* Header Gradient */}
                <div className="h-24 bg-gradient-to-r from-blue-600 to-orange-500"></div>

                {/* Profile Content */}
                <div className="px-6 pb-6 pt-4">
                  {/* Profile Photo */}
                  <div className="-mt-16 mb-4 flex justify-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-2xl border-4 border-white overflow-hidden">
                      {prof.profile_photo_url ? (
                        <img src={prof.profile_photo_url} alt={prof.name} className="w-full h-full object-cover" />
                      ) : (
                        prof.name.charAt(0)
                      )}
                    </div>
                  </div>

                  {/* Name */}
                  <h3 className="text-xl font-bold text-gray-900 text-center mb-1">{prof.name}</h3>

                  {/* Designation */}
                  {(prof.designation || prof.professional?.designation) && (
                    <p className="text-center text-gray-600 font-medium mb-2">
                      {prof.designation || prof.professional?.designation}
                    </p>
                  )}

                  {/* Department */}
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-4">
                    <Building2 className="w-4 h-4" />
                    {prof.department}
                  </div>

                  {/* Specialization/Skills */}
                  {prof.professional?.skills && prof.professional.skills.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Expertise:</p>
                      <div className="flex flex-wrap gap-2">
                        {prof.professional.skills.slice(0, 4).map((skill, idx) => (
                          <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contact */}
                  <div className="space-y-2 border-t pt-4">
                    {prof.email && (
                      <a
                        href={`mailto:${prof.email}`}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition text-sm"
                      >
                        <Mail className="w-4 h-4" />
                        Email
                      </a>
                    )}
                    {prof.phone && (
                      <a
                        href={`tel:${prof.phone}`}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition text-sm"
                      >
                        <Phone className="w-4 h-4" />
                        Call
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg">No faculty found</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Faculty
