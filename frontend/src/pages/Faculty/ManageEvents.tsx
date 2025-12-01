import { useState, useEffect, useRef } from 'react'
import { Loader2, CheckCircle, XCircle, Plus, X, Trash2, Calendar, MapPin, Clock, Users, Video } from 'lucide-react'
import { useAuth } from '../../App'
import api from '../../services/api'
import Card from '../../components/Card'

interface Event {
  id: string
  title: string
  description: string
  event_date: string
  location: string
  event_type: string
  status: string
  created_by: string
  is_paid?: boolean
  fee_amount?: number
  created_at: string
}

const PRIMARY_COLOR = "#0F4C81"
const BG_COLOR = "#F5F7FA"

export default function ManageEvents() {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"all" | "pending" | "approved">("all")
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    event_date: '',
    location: '',
    event_type: 'Offline',
    is_paid: false,
    fee_amount: 0,
    image: ''
  })
  const [imagePreview, setImagePreview] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/events')
      setEvents(response.data)
    } catch (err) {
      console.error('Error fetching events:', err)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredEvents = () => {
    if (events.length > 0) {
      console.log('First event full data:', events[0])
    }
    
    if (tab === "all") {
      // All approved events from the system
      const filtered = events.filter(e => e.approved === true)
      return filtered
    } else if (tab === "pending") {
      // Events waiting for approval (not approved yet)
      const filtered = events.filter(e => e.approved !== true)
      return filtered
    } else {
      // Events created by current faculty member
      const filtered = events.filter(e => String(e.created_by) === String(user?.id))
      return filtered
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      setForm({ ...form, image: base64 })
      setImagePreview(base64)
      setUploading(false)
    }
    reader.readAsDataURL(file)
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.description || !form.event_date || !form.location) {
      alert('Please fill all required fields')
      return
    }

    setSubmitting(true)
    try {
      const eventData = {
        title: form.title,
        description: form.description,
        event_date: form.event_date,
        location: form.location,
        event_type: form.event_type,
        is_paid: form.is_paid,
        fee_amount: form.is_paid ? form.fee_amount : 0,
        image: imagePreview || ""
      }
      
      await api.post('/api/faculty/events', eventData)
      
      // Reset form
      setForm({
        title: '',
        description: '',
        event_date: '',
        location: '',
        event_type: 'Offline',
        is_paid: false,
        fee_amount: 0,
        image: ''
      })
      setImagePreview('')
      setShowForm(false)
      
      // Refresh events
      await fetchEvents()
    } catch (err: any) {
      console.error('Error creating event:', err)
      alert(err.response?.data?.detail || 'Failed to create event')
    } finally {
      setSubmitting(false)
    }
  }

  const handleApprove = async (eventId: string) => {
    try {
      await api.post(`/api/faculty/events/${eventId}/approve`)
      setEvents(events.map(e => e.id === eventId ? {...e, status: 'approved'} : e))
    } catch (err) {
      console.error('Error approving event:', err)
    }
  }

  const handleReject = async (eventId: string) => {
    try {
      await api.post(`/api/faculty/events/${eventId}/reject`)
      setEvents(events.map(e => e.id === eventId ? {...e, status: 'rejected'} : e))
    } catch (err) {
      console.error('Error rejecting event:', err)
    }
  }

  const handleDelete = async (eventId: string) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return
    try {
      await api.delete(`/api/faculty/events/${eventId}`)
      setEvents(events.filter(e => e.id !== eventId))
      alert('Event deleted successfully')
    } catch (err: any) {
      console.error('Error deleting event:', err)
      alert(err.response?.data?.detail || 'Failed to delete event')
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setForm({
      title: '',
      description: '',
      event_date: '',
      location: '',
      event_type: 'Offline',
      is_paid: false,
      fee_amount: 0,
      image: ''
    })
    setImagePreview('')
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: BG_COLOR }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage Events</h1>
              <p className="mt-2 text-gray-600">Create, approve, and manage events for your department</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              <Plus className="w-4 h-4" />
              Create Event
            </button>
          </div>
        </div>

        {/* Create Event Form */}
        {showForm && (
          <Card className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Create New Event</h3>
              <button
                onClick={handleCancel}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-6">
              {/* Image Upload (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Event Image (Optional)</label>
                <div className="flex gap-4">
                  <div
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors bg-gray-50"
                  >
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-md" />
                    ) : (
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Click to upload</p>
                        <p className="text-xs text-gray-500">JPG, PNG (5MB max)</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                  {uploading && <Loader2 className="w-4 h-4 animate-spin text-gray-600" />}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Event Title *</label>
                <input
                  type="text"
                  placeholder="Enter event title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:border-gray-300 transition-colors"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Description *</label>
                <textarea
                  placeholder="Enter event description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:border-gray-300 transition-colors"
                  rows={3}
                  required
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Location *</label>
                <input
                  type="text"
                  placeholder="Enter event location (e.g., Main Campus Hall, Zoom)"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:border-gray-300 transition-colors"
                  required
                />
              </div>

              {/* Event Type */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">Event Type *</label>
                <div className="flex gap-4 bg-gray-50 p-3 rounded-lg">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="event_type"
                      value="Online"
                      checked={form.event_type === 'Online'}
                      onChange={(e) => setForm({ ...form, event_type: e.target.value })}
                      className="w-4 h-4"
                    />
                    <span className="font-medium text-gray-900">📱 Online</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="event_type"
                      value="Offline"
                      checked={form.event_type === 'Offline'}
                      onChange={(e) => setForm({ ...form, event_type: e.target.value })}
                      className="w-4 h-4"
                    />
                    <span className="font-medium text-gray-900">📍 Offline</span>
                  </label>
                </div>
              </div>

              {/* Date & Time */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Event Date & Time *</label>
                <input
                  type="datetime-local"
                  value={form.event_date}
                  onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:border-gray-300 transition-colors"
                  required
                />
              </div>

              {/* Paid Event & Fee */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_paid}
                    onChange={(e) => setForm({ ...form, is_paid: e.target.checked, fee_amount: e.target.checked ? form.fee_amount : 0 })}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="font-medium text-gray-900">This is a paid event</span>
                </label>
                {form.is_paid && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-900 mb-1">Fee Amount (₹)</label>
                    <input
                      type="number"
                      placeholder="Enter fee amount"
                      value={form.fee_amount}
                      onChange={(e) => setForm({ ...form, fee_amount: Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:border-gray-300 transition-colors"
                      min="0"
                    />
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-2 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 text-white rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50"
                  style={{ backgroundColor: PRIMARY_COLOR }}
                >
                  {submitting ? 'Creating...' : 'Create Event'}
                </button>
              </div>
            </form>
          </Card>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-0 mb-8 border-b border-gray-200">
          {[
            { key: "all", label: "All Approved Events" },
            { key: "pending", label: "Pending Approval" },
            { key: "approved", label: "My Approvals" }
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                tab === t.key
                  ? 'text-gray-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={{
                borderBottomColor: tab === t.key ? '#FF8A00' : 'transparent'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Events List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: PRIMARY_COLOR }} />
          </div>
        ) : getFilteredEvents().length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500 font-medium">
              {tab === "all" && "No approved events yet"}
              {tab === "pending" && "No pending events for approval"}
              {tab === "approved" && "You haven't created any events yet"}
            </p>
            <p className="text-sm text-gray-400 mt-2">
              {tab === "all" && "Events will appear here once they are approved"}
              {tab === "pending" && "All pending events will appear here"}
              {tab === "approved" && "Create an event to see it here"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {getFilteredEvents().map((event) => {
              const eventDate = new Date(event.event_date)
              const description = event.description || ''
              const eventType = event.event_type === 'Online' ? 'Online' : 'Offline'
              
              const formatDate = (dateString: string) => {
                return new Date(dateString).toLocaleDateString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit'
                })
              }
              
              return (
                <div key={event.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col h-full border border-gray-100">
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
                    
                    {/* Status Badge */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      <div className={`${event.approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'} px-3 py-1 rounded-full text-xs font-semibold`}>
                        {event.approved ? '✓ Approved' : '⏳ Pending'}
                      </div>
                    </div>

                    {/* Event Type */}
                    <div className="absolute top-3 right-3 flex gap-2">
                      <div className={`${eventType === 'Online' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'} px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1`}>
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
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{description}</p>
                      
                      <div className="space-y-2 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-gray-400" />
                          <span>{formatDate(event.event_date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-gray-400" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-5 pt-4 border-t border-gray-100 flex gap-2 flex-wrap">
                      {!event.approved && (
                        <>
                          <button
                            onClick={() => handleApprove(event.id)}
                            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-white font-medium transition-colors"
                            style={{ backgroundColor: '#16A34A' }}
                          >
                            <CheckCircle size={16} />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(event.id)}
                            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-white font-medium transition-colors"
                            style={{ backgroundColor: '#DC2626' }}
                          >
                            <XCircle size={16} />
                            Reject
                          </button>
                        </>
                      )}
                      {event.created_by === user?.id && (
                        <button
                          onClick={() => handleDelete(event.id)}
                          className={`flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-white font-medium transition-colors hover:opacity-80 ${!event.approved ? 'flex-1' : ''}`}
                          style={{ backgroundColor: '#DC2626' }}
                          title="Delete this event"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      )}
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
