import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import Badge from '../components/Badge'
import { 
  Calendar, MapPin, Users, IndianRupee, Loader2, 
  Search, Filter, ChevronDown, Video, Clock
} from 'lucide-react'

interface Event {
  id: string
  _id?: string
  title: string
  department: string
  description: string
  event_date: string
  location: string
  is_paid: boolean
  fee_amount: number
  attendees_count: number
  created_at: string
  image?: string
  event_type?: string
}

const PRIMARY_COLOR = "#0F4C81"
const ACCENT_COLOR = "#FF8A00"

function Events() {
  const [allEvents, setAllEvents] = useState<Event[]>([])
  const [featuredEventIds, setFeaturedEventIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filter States
  const [search, setSearch] = useState("")
  const [department, setDepartment] = useState("All")
  const [timeFilter, setTimeFilter] = useState("Upcoming")
  const [paidFilter, setPaidFilter] = useState("All")

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const eventsRes = await api.get('/api/events')
      const events = Array.isArray(eventsRes.data) 
        ? eventsRes.data.map(e => ({...e, id: e._id || e.id})) 
        : []
      setAllEvents(events)

      const featuredRes = await api.get('/api/admin/content/events-featured').catch(() => ({ data: { event_ids: [] } }))
      setFeaturedEventIds(featuredRes.data.event_ids || [])
    } catch (err) {
      setError('Failed to load events')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const departments = ["All", ...new Set(allEvents.map(e => e.department).filter(d => d !== 'All'))]

  const filteredEvents = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let result = allEvents.filter(event => {
      const eventDate = new Date(event.event_date)
      eventDate.setHours(0, 0, 0, 0)

      // Search filter
      const matchesSearch = 
        event.title.toLowerCase().includes(search.toLowerCase()) || 
        event.location.toLowerCase().includes(search.toLowerCase())

      // Department filter
      const matchesDept = department === "All" || event.department === department

      // Paid filter
      const matchesPaid = paidFilter === "All" || 
        (paidFilter === "Paid" && event.is_paid) || 
        (paidFilter === "Free" && !event.is_paid)

      // Time filter
      let matchesTime = true
      if (timeFilter === "Upcoming") {
        matchesTime = eventDate >= today
      } else if (timeFilter === "Past") {
        matchesTime = eventDate < today
      } else if (timeFilter === "This Month") {
        matchesTime = eventDate.getMonth() === today.getMonth() && eventDate.getFullYear() === today.getFullYear()
      }

      return matchesSearch && matchesDept && matchesPaid && matchesTime
    })

    // Sort: featured first, then by date
    result.sort((a, b) => {
      const aFeatured = featuredEventIds.includes(a.id || a._id || '')
      const bFeatured = featuredEventIds.includes(b.id || b._id || '')
      
      if (aFeatured !== bFeatured) {
        return aFeatured ? -1 : 1
      }

      const dateA = new Date(a.event_date)
      const dateB = new Date(b.event_date)
      
      if (timeFilter === "Past") {
        return dateB.getTime() - dateA.getTime()
      } else {
        return dateA.getTime() - dateB.getTime()
      }
    })

    return result
  }, [search, department, timeFilter, paidFilter, allEvents, featuredEventIds])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getEventType = (location: string) => {
    return location.toLowerCase().includes('zoom') || 
           location.toLowerCase().includes('online') || 
           location.toLowerCase().includes('virtual') 
      ? 'Online' 
      : 'Offline'
  }

  const EventCard = ({ event }: { event: Event }) => {
    const eventDate = new Date(event.event_date)
    const today = new Date()
    const isToday = eventDate.toDateString() === today.toDateString()
    const isPast = eventDate < today && !isToday
    const isFeatured = featuredEventIds.includes(event.id || event._id || '')
    const eventType = getEventType(event.location)

    return (
      <Link to={`/events/${event.id || event._id}`}>
        <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col h-full border border-gray-100">
          {/* Image Header */}
          <div className="relative h-48 w-full overflow-hidden group bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
            {event.image ? (
              <img 
                src={event.image} 
                alt={event.title} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
              />
            ) : (
              <div className="text-center">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto" />
                <p className="text-gray-400 text-sm mt-2">No image</p>
              </div>
            )}

            {/* Dark Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            
            {/* Status Badges */}
            <div className="absolute top-3 left-3 flex gap-2">
              {isToday ? (
                <div className="relative">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping"></span>
                  <div className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-semibold border border-red-400 relative z-10">
                    Happening Now
                  </div>
                </div>
              ) : (
                <div className="bg-white/90 text-gray-800 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold">
                  {event.department}
                </div>
              )}
            </div>

            {/* Event Type & Featured */}
            <div className="absolute top-3 right-3 flex gap-2">
              {isFeatured && (
                <div className="bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-xs font-semibold">
                  ⭐ Featured
                </div>
              )}
              <div className={`${eventType === 'Online' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'} backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1`}>
                {eventType === 'Online' ? <Video size={12} /> : <MapPin size={12} />}
                {eventType}
              </div>
            </div>

            {/* Date Overlay */}
            <div className="absolute bottom-3 left-4 text-white">
              <p className="text-2xl font-bold leading-none">{eventDate.getDate()}</p>
              <p className="text-xs uppercase tracking-wider font-medium opacity-90">
                {eventDate.toLocaleString('default', { month: 'short' })}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-5 flex-grow flex flex-col">
            <div className="mb-auto">
              <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{event.title}</h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>
              
              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-gray-400" />
                  <span>{formatDate(event.event_date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-gray-400" />
                  <span className="truncate">{event.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-gray-400" />
                  <span>{event.attendees_count || 0} Attending</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
              <div className="flex gap-2">
                <Badge variant={event.is_paid ? 'accent' : 'success'}>
                  {event.is_paid ? `₹${event.fee_amount}` : 'Free'}
                </Badge>
              </div>
              <button 
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isPast 
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' 
                    : 'text-white hover:opacity-90'
                }`}
                style={{ backgroundColor: isPast ? undefined : PRIMARY_COLOR }}
              >
                {isPast ? 'View Recap' : 'View Details'}
              </button>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: PRIMARY_COLOR }} />
      </div>
    )
  }

  return (
    <div className="bg-[#F5F7FA] min-h-screen">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Events & Networking</h1>
          <p className="mt-2 text-gray-600">Discover upcoming gatherings, workshops, and reunions organized by your alumni community.</p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-6">
            {error}
          </div>
        )}

        {/* Filter Component */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Search Input */}
            <div className="md:col-span-4 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search events or locations..."
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:border-gray-300 sm:text-sm transition duration-150 ease-in-out"
                style={{ 
                  '--tw-ring-color': PRIMARY_COLOR,
                  '--tw-border-opacity': '1'
                } as any}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Department Dropdown */}
            <div className="md:col-span-3 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
              <select
                className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg leading-5 bg-gray-50 focus:outline-none focus:ring-1 focus:border-gray-300 sm:text-sm appearance-none cursor-pointer"
                style={{ 
                  '--tw-ring-color': PRIMARY_COLOR,
                  '--tw-border-opacity': '1'
                } as any}
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Time Dropdown */}
            <div className="md:col-span-2 relative">
              <select
                className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg leading-5 bg-gray-50 focus:outline-none focus:ring-1 focus:border-gray-300 sm:text-sm appearance-none cursor-pointer"
                style={{ 
                  '--tw-ring-color': PRIMARY_COLOR,
                  '--tw-border-opacity': '1'
                } as any}
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
              >
                <option value="All">All Time</option>
                <option value="Upcoming">Upcoming</option>
                <option value="This Month">This Month</option>
                <option value="Past">Past</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Paid Filter Toggle */}
            <div className="md:col-span-3 flex bg-gray-100 p-1 rounded-lg">
              {['All', 'Free', 'Paid'].map((type) => (
                <button
                  key={type}
                  onClick={() => setPaidFilter(type)}
                  className={`flex-1 text-sm font-medium rounded-md py-1.5 transition-all ${
                    paidFilter === type 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Search size={24} />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No events found</h3>
            <p className="text-gray-500 mt-1">Try adjusting your search or filters.</p>
            <button 
              onClick={() => {setSearch(""); setDepartment("All"); setTimeFilter("All"); setPaidFilter("All");}}
              className="mt-4 font-medium hover:underline"
              style={{ color: PRIMARY_COLOR }}
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map(event => (
              <EventCard key={event.id || event._id} event={event} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default Events
