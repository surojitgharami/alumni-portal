import { useState, useEffect } from 'react'
import { Search, Briefcase, Mail, Building2, Loader2, MapPin, Share2, ChevronDown } from 'lucide-react'
import api from '../services/api'

interface Alumni {
  id: string
  name: string
  department: string
  passout_year: number
  email: string
  current_company?: string
  current_position?: string
  profile_photo_url?: string
  location?: string
  gender?: string
  professional?: {
    workplace?: string
    designation?: string
    industry?: string
    skills?: string[]
  }
}

const PRIMARY_COLOR = "#0F4C81"
const ACCENT_COLOR = "#FF8A00"
const BG_COLOR = "#F5F7FA"

// Gender-based avatar generator
const getGenderBasedAvatar = (name: string, gender?: string) => {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase()
  
  // Detect gender from name or use provided gender
  const femaleNames = ['sarah', 'elena', 'priya', 'emily', 'sophia', 'jessica', 'maria', 'anna', 'lisa', 'rachel']
  const isFemale = gender?.toLowerCase() === 'female' || femaleNames.some(fn => name.toLowerCase().includes(fn))
  
  return {
    initials,
    bgGradient: isFemale 
      ? 'from-pink-500 to-rose-600' 
      : 'from-blue-600 to-blue-800',
    badge: isFemale ? '👩' : '👨'
  }
}

function Alumni() {
  const [allAlumni, setAllAlumni] = useState<Alumni[]>([])
  const [displayedAlumni, setDisplayedAlumni] = useState<Alumni[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('')
  const [passoutYear, setPassoutYear] = useState('')
  const [departments, setDepartments] = useState<string[]>([])
  const [years, setYears] = useState<number[]>([])
  const [displayCount, setDisplayCount] = useState(8)

  const ITEMS_PER_PAGE = 8

  useEffect(() => {
    fetchAlumni()
  }, [search, department, passoutYear])

  useEffect(() => {
    setDisplayCount(8)
    setDisplayedAlumni(allAlumni.slice(0, 8))
  }, [allAlumni])

  useEffect(() => {
    const currentYear = new Date().getFullYear()
    const yearsList = Array.from({ length: 20 }, (_, i) => currentYear - i)
    setYears(yearsList)
    
    getDepartments()
  }, [])

  const getDepartments = async () => {
    try {
      const response = await api.get('/api/alumni/directory?limit=50000')
      const depts = new Set<string>()
      response.data.forEach((item: any) => {
        if (item.department) depts.add(item.department)
      })
      setDepartments(Array.from(depts).sort())
    } catch (err) {
      console.log('Could not fetch departments')
    }
  }

  const fetchAlumni = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (department) params.append('department', department)
      if (passoutYear) params.append('passout_year', passoutYear)
      params.append('limit', '50000')

      const response = await api.get(`/api/alumni/directory?${params}`)
      setAllAlumni(response.data)
      setDisplayCount(8)
    } catch (err) {
      console.error('Error fetching alumni:', err)
      setAllAlumni([])
    } finally {
      setLoading(false)
    }
  }

  const loadMore = async () => {
    setLoadingMore(true)
    await new Promise(resolve => setTimeout(resolve, 300))
    const newCount = displayCount + ITEMS_PER_PAGE
    setDisplayCount(newCount)
    setDisplayedAlumni(allAlumni.slice(0, newCount))
    setLoadingMore(false)
  }

  const hasMore = displayCount < allAlumni.length

  return (
    <div className="min-h-screen" style={{ backgroundColor: BG_COLOR }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Alumni Directory</h1>
          <p className="mt-2 text-gray-600">Reconnect with classmates, find mentors, and expand your professional network.</p>
        </div>

        {/* Filter Component */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Search Input */}
            <div className="md:col-span-6 relative">
              <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">Search</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by name, company, or role..."
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:border-transparent sm:text-sm transition duration-150 ease-in-out"
                  style={{ '--tw-ring-color': PRIMARY_COLOR } as any}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Department Dropdown */}
            <div className="md:col-span-3 relative">
              <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">Department</label>
              <div className="relative">
                <select
                  className="block w-full pl-3 pr-10 py-2.5 border border-gray-300 rounded-lg leading-5 bg-gray-50 focus:outline-none focus:ring-1 sm:text-sm appearance-none cursor-pointer"
                  style={{ '--tw-ring-color': PRIMARY_COLOR } as any}
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  <option value="">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Passout Year Dropdown */}
            <div className="md:col-span-3 relative">
              <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">Passing Year</label>
              <div className="relative">
                <select
                  className="block w-full pl-3 pr-10 py-2.5 border border-gray-300 rounded-lg leading-5 bg-gray-50 focus:outline-none focus:ring-1 sm:text-sm appearance-none cursor-pointer"
                  style={{ '--tw-ring-color': PRIMARY_COLOR } as any}
                  value={passoutYear}
                  onChange={(e) => setPassoutYear(e.target.value)}
                >
                  <option value="">All Years</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alumni Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: PRIMARY_COLOR }} />
          </div>
        ) : displayedAlumni.length > 0 ? (
          <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedAlumni.map((person) => {
              const avatar = getGenderBasedAvatar(person.name, person.gender)
              return (
                <div key={person.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group">
                  <div className="p-6 flex flex-col items-center text-center relative">
                    {/* Background Pattern */}
                    <div className="absolute top-0 left-0 w-full h-24 opacity-5 group-hover:opacity-10 transition-opacity" style={{ backgroundColor: PRIMARY_COLOR }}></div>
                    
                    {/* Profile Image */}
                    <div className="relative mb-4">
                      {person.profile_photo_url ? (
                        <img 
                          src={person.profile_photo_url} 
                          alt={person.name} 
                          className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-md group-hover:scale-105 transition-transform duration-300" 
                        />
                      ) : (
                        <div className={`w-28 h-28 rounded-full flex items-center justify-center text-white font-bold text-3xl border-4 border-white shadow-md group-hover:scale-105 transition-transform duration-300 bg-gradient-to-br ${avatar.bgGradient}`}>
                          {avatar.initials}
                        </div>
                      )}
                      <div className="absolute bottom-1 right-1 bg-white p-1.5 rounded-full shadow-sm border border-gray-100">
                        <Briefcase size={14} className="text-gray-500" />
                      </div>
                    </div>

                    {/* Name & Role */}
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{person.name}</h3>
                    <p className="font-medium text-sm mb-4" style={{ color: PRIMARY_COLOR }}>
                      {person.current_position || person.professional?.designation || 'Professional'} {person.current_company || person.professional?.workplace ? `at ${person.current_company || person.professional?.workplace}` : ''}
                    </p>

                    {/* Details Grid */}
                    <div className="w-full grid grid-cols-2 gap-3 text-sm mb-6">
                      <div className="bg-gray-50 p-2 rounded-lg">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Class Of</p>
                        <p className="font-semibold text-gray-800">{person.passout_year}</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded-lg">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Dept</p>
                        <p className="font-semibold text-gray-800 truncate" title={person.department}>{person.department}</p>
                      </div>
                    </div>

                    {/* Location */}
                    {person.location && (
                      <div className="flex items-center justify-center gap-1 text-gray-500 text-sm mb-6">
                        <MapPin size={14} />
                        <span>{person.location}</span>
                      </div>
                    )}

                    {/* Skills */}
                    {person.professional?.skills && person.professional.skills.length > 0 && (
                      <div className="w-full mb-6">
                        <div className="flex flex-wrap gap-2 justify-center">
                          {person.professional.skills.slice(0, 3).map((skill, idx) => (
                            <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                              {skill}
                            </span>
                          ))}
                          {person.professional.skills.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                              +{person.professional.skills.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 w-full mt-auto">
                      {person.email && (
                        <a 
                          href={`mailto:${person.email}`}
                          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Mail size={16} />
                          <span className="text-sm font-medium">Message</span>
                        </a>
                      )}
                      <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-white transition-colors" style={{ backgroundColor: PRIMARY_COLOR }}>
                        <Share2 size={16} />
                        <span className="text-sm font-medium">Connect</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center mt-8">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-8 py-3 rounded-lg font-medium text-white transition-all duration-300 flex items-center gap-2"
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                {loadingMore ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Load More
                    <span className="text-xs ml-1">({allAlumni.length - displayCount} remaining)</span>
                  </>
                )}
              </button>
            </div>
          )}
          </>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg">No alumni found matching your filters</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Alumni
