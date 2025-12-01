import { useState, useEffect, useRef } from 'react'
import AdminLayout from '../../components/AdminLayout'
import Card from '../../components/Card'
import api from '../../services/api'
import { Loader2, Plus, Edit2, Trash2, X, ChevronDown, Calendar, MapPin, Users, Clock } from 'lucide-react'
import Badge from '../../components/Badge'

interface Event {
  _id: string
  title: string
  description: string
  event_date: string
  location?: string
  department: string
  is_paid: boolean
  fee_amount: number
  approved: boolean
  image?: string
  attendees_count?: number
}

const PRIMARY_COLOR = "#0F4C81"
const ACCENT_COLOR = "#FF8A00"

export default function ManageEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({ 
    title: '', 
    description: '', 
    event_date: '', 
    location: '',
    event_type: 'Offline',
    department: '', 
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
      const res = await api.get('/api/admin/events-list')
      setEvents(res.data)
    } catch (error) {
      console.error('Failed to fetch events:', error)
    } finally {
      setLoading(false)
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingId) {
        await api.patch(`/api/admin/events/${editingId}`, form)
        setEditingId(null)
      } else {
        await api.post('/api/admin/events', form)
      }
      setShowForm(false)
      setForm({ 
        title: '', 
        description: '', 
        event_date: '', 
        location: '',
        event_type: 'Offline',
        department: '', 
        is_paid: false, 
        fee_amount: 0,
        image: ''
      })
      setImagePreview('')
      fetchEvents()
    } catch (error) {
      console.error('Failed to create/update event:', error)
    }
  }

  const handleEdit = (event: Event) => {
    setForm({
      title: event.title,
      description: event.description,
      event_date: event.event_date,
      location: event.location || '',
      event_type: (event as any).event_type || 'Offline',
      department: event.department,
      is_paid: event.is_paid,
      fee_amount: event.fee_amount,
      image: event.image || ''
    })
    setImagePreview(event.image || '')
    setEditingId(event._id)
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setForm({ 
      title: '', 
      description: '', 
      event_date: '', 
      location: '',
      event_type: 'Offline',
      department: '', 
      is_paid: false, 
      fee_amount: 0,
      image: ''
    })
    setImagePreview('')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this event?')) return
    try {
      await api.delete(`/api/admin/events/${id}`)
      setEvents(events.filter(e => e._id !== id))
    } catch (error) {
      console.error('Failed to delete event:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getEventType = (location: string) => {
    return location?.toLowerCase().includes('zoom') || 
           location?.toLowerCase().includes('online') || 
           location?.toLowerCase().includes('virtual') 
      ? 'Online' 
      : 'Offline'
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: PRIMARY_COLOR }} />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manage Events</h1>
              <p className="text-gray-600 mt-1">Create, update, and manage all events</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              <Plus className="w-4 h-4" />
              {editingId ? 'Update Event' : 'Create Event'}
            </button>
          </div>
        </div>

        {/* Create/Edit Form - Collapsible */}
        {showForm && (
          <Card className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">{editingId ? 'Update Event' : 'Create New Event'}</h3>
              <button
                onClick={handleCancel}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-6">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Event Image</label>
                <div className="flex gap-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
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

              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Department</label>
                <input
                  type="text"
                  placeholder="Enter department (e.g., IT, HR, All)"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:border-gray-300 transition-colors"
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
                  className="px-6 py-2 text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
                  style={{ backgroundColor: PRIMARY_COLOR }}
                >
                  {editingId ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </form>
          </Card>
        )}

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((event) => {
            const eventDate = new Date(event.event_date)
            const today = new Date()
            const isToday = eventDate.toDateString() === today.toDateString()
            const isPast = eventDate < today && !isToday
            const eventType = getEventType(event.location || '')

            return (
              <div
                key={event._id}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-100 flex flex-col h-full group"
              >
                {/* Image Header */}
                <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                  {event.image ? (
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="text-center">
                      <Calendar className="w-12 h-12 text-gray-300 mx-auto" />
                      <p className="text-gray-400 text-sm mt-2">No image</p>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                  {/* Status Badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    {isToday ? (
                      <div className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        Happening Now
                      </div>
                    ) : (
                      <div className="bg-white/90 text-gray-800 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold">
                        {event.department}
                      </div>
                    )}
                  </div>

                  {/* Event Type */}
                  <div className="absolute top-3 right-3">
                    <div className={`${eventType === 'Online' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'} backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1`}>
                      {eventType === 'Online' ? '📱' : '📍'} {eventType}
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
                      <Badge variant={event.approved ? 'success' : 'neutral'}>
                        {event.approved ? '✓ Approved' : 'Pending'}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(event)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(event._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {events.length === 0 && (
          <Card className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Events Yet</h3>
            <p className="text-gray-600 mb-6">Create your first event to get started.</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-6 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: PRIMARY_COLOR }}
            >
              <Plus className="w-4 h-4" />
              Create Event
            </button>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}
