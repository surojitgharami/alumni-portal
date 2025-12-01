import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { Briefcase, MapPin, Loader2, Plus, Search, ChevronDown, DollarSign, Clock } from 'lucide-react'
import { useAuth } from '../App'

interface Job {
  id: string
  _id?: string
  title: string
  company: string
  location: string
  job_type: string
  description: string
  salary_range: string
  department: string
  created_at: string
  posted_by?: string
}

const PRIMARY_COLOR = "#0F4C81"

const FilterBar = ({ search, setSearch, filter1, setFilter1, options1, label1, filter2, setFilter2, options2, label2, placeholder }) => (
  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
      {/* Search */}
      <div className="md:col-span-6 relative">
        <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">Search</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={placeholder}
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-1 transition-all"
            style={{ '--tw-ring-color': PRIMARY_COLOR } as any}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Filter 1 */}
      <div className="md:col-span-3 relative">
        <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">{label1}</label>
        <div className="relative">
          <select
            className="block w-full pl-3 pr-10 py-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-1 transition-all appearance-none cursor-pointer text-sm"
            style={{ '--tw-ring-color': PRIMARY_COLOR } as any}
            value={filter1}
            onChange={(e) => setFilter1(e.target.value)}
          >
            {options1.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Filter 2 */}
      <div className="md:col-span-3 relative">
        <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">{label2}</label>
        <div className="relative">
          <select
            className="block w-full pl-3 pr-10 py-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-1 transition-all appearance-none cursor-pointer text-sm"
            style={{ '--tw-ring-color': PRIMARY_COLOR } as any}
            value={filter2}
            onChange={(e) => setFilter2(e.target.value)}
          >
            {options2.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  </div>
)

export default function Jobs() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [jobType, setJobType] = useState("All")
  const [location, setLocation] = useState("All")

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const jobsRes = await api.get('/api/jobs')
      const jobsList = Array.isArray(jobsRes.data) 
        ? jobsRes.data.map(j => ({ ...j, id: j._id || j.id })) 
        : []
      setJobs(jobsList)
    } catch (err) {
      console.error('Failed to load jobs:', err)
      setJobs([])
    } finally {
      setLoading(false)
    }
  }

  const types = useMemo(() => ["All", ...new Set(jobs.map(j => j.job_type))], [jobs])
  const locations = useMemo(() => {
    const locs = ["All", "Remote"]
    jobs.forEach(j => {
      if (j.location !== "Remote") {
        const state = j.location.split(',').pop()?.trim()
        if (state && !locs.includes(state)) locs.push(state)
      }
    })
    return locs
  }, [jobs])

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchesSearch = 
        job.title.toLowerCase().includes(search.toLowerCase()) || 
        job.company.toLowerCase().includes(search.toLowerCase()) ||
        job.description.toLowerCase().includes(search.toLowerCase())
      const matchesType = jobType === "All" || job.job_type === jobType
      const matchesLoc = location === "All" || job.location.includes(location)
      return matchesSearch && matchesType && matchesLoc
    })
  }, [search, jobType, location, jobs])

  const getJobTypeBadgeStyle = (type: string) => {
    switch(type) {
      case 'Full-time': return 'bg-blue-50 text-blue-700'
      case 'Internship': return 'bg-green-50 text-green-700'
      case 'Contract': return 'bg-orange-50 text-orange-700'
      default: return 'bg-gray-50 text-gray-700'
    }
  }

  const getInitials = (company: string) => {
    return company.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Job Opportunities</h1>
            <p className="mt-2 text-gray-600">Explore career opportunities shared by your alumni network.</p>
          </div>
          {user?.role === 'alumni' && (
            <Link
              to="/jobs/create"
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white transition-all hover:shadow-lg w-fit"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              <Briefcase size={18} />
              Post a Job
            </Link>
          )}
        </div>

        {/* Filters */}
        <FilterBar 
          search={search} setSearch={setSearch} placeholder="Search jobs, companies, or keywords..."
          filter1={jobType} setFilter1={setJobType} options1={types} label1="Job Type"
          filter2={location} setFilter2={setLocation} options2={locations} label2="Location"
        />

        {/* Results Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 text-lg">
            We have <span style={{ color: PRIMARY_COLOR }}>{filteredJobs.length}</span> active openings now
          </h2>
          <div className="hidden sm:flex items-center gap-2 text-sm">
            <span className="text-gray-500">Sort by:</span>
            <select className="bg-transparent font-medium text-gray-900 focus:outline-none cursor-pointer text-sm">
              <option>Newest First</option>
              <option>Salary: High to Low</option>
            </select>
          </div>
        </div>

        {/* Jobs List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin" style={{ color: PRIMARY_COLOR }} />
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white p-12 rounded-xl border border-dashed border-gray-300 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
              <Briefcase size={32} />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No jobs found</h3>
            <p className="text-gray-500 mt-1">Try adjusting your filters or search terms.</p>
            <button 
              onClick={() => { setSearch(''); setJobType('All'); setLocation('All') }}
              className="mt-4 font-medium hover:underline transition-colors"
              style={{ color: PRIMARY_COLOR }}
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map(job => {
              const jobId = job.id || job._id
              return (
                <div key={jobId} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group">
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Logo */}
                    <div 
                      className="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center text-white font-bold text-xl"
                      style={{ backgroundColor: PRIMARY_COLOR }}
                    >
                      {getInitials(job.company)}
                    </div>
                    
                    {/* Main Content */}
                    <div className="flex-1">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 group-hover:transition-colors" style={{ '--group-hover-color': PRIMARY_COLOR } as any}>
                            {job.title}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                            <span className="font-medium">{job.company}</span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                            <span className="flex items-center gap-1">
                              <MapPin size={14} /> {job.location}
                            </span>
                          </div>
                        </div>
                        <div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getJobTypeBadgeStyle(job.job_type)}`}>
                            {job.job_type}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 text-sm text-gray-600 line-clamp-2">
                        {job.description}
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <DollarSign size={16} className="text-gray-400" />
                            <span>{job.salary_range}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={16} className="text-gray-400" />
                            <span>{new Date(job.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-semibold" style={{ backgroundColor: PRIMARY_COLOR }}>
                            {(job.posted_by || job.company).charAt(0).toUpperCase()}
                          </div>
                          <span className="text-gray-500">Posted by <span className="font-medium text-gray-900">{job.posted_by || 'Alumni'}</span></span>
                          <Link to={`/jobs/${jobId}`} className="ml-4 font-medium hover:underline transition-colors" style={{ color: PRIMARY_COLOR }}>
                            View Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
