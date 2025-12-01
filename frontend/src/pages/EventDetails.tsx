import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import api from '../services/api'
import { createPaymentOrder, verifyPayment, openRazorpayCheckout } from '../services/payments'
import Card from '../components/Card'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import QRViewer from '../components/QRViewer'
import { Calendar, MapPin, Users, IndianRupee, Loader2, ArrowLeft, CheckCircle } from 'lucide-react'

interface Event {
  id: string
  title: string
  department: string
  description: string
  event_date: string
  location: string
  is_paid: boolean
  fee_amount: number
  attendees_count: number
  created_at: string
}

function EventDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [error, setError] = useState('')
  const [ticketId, setTicketId] = useState<string | null>(null)
  const [showQR, setShowQR] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  useEffect(() => {
    fetchEvent()
  }, [id])

  const fetchEvent = async () => {
    try {
      const response = await api.get(`/api/events/${id}`)
      setEvent(response.data)
    } catch {
      setError('Failed to load event')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!event || !user) return
    
    setRegistering(true)
    setError('')

    try {
      const response = await api.post(`/api/events/${id}/register`)
      
      if (response.data.requires_payment) {
        setShowPaymentModal(true)
      } else if (response.data.ticket_id) {
        setTicketId(response.data.ticket_id)
        setShowQR(true)
      }
    } catch (err: unknown) {
      interface ApiError {
        response?: {
          data?: {
            detail?: string
          }
        }
      }
      const apiError = err as ApiError
      setError(apiError.response?.data?.detail || 'Registration failed')
    } finally {
      setRegistering(false)
    }
  }

  const handlePayForEvent = async () => {
    if (!event || !user) return
    
    setRegistering(true)
    try {
      const orderData = await createPaymentOrder({
        amount: event.fee_amount,
        purpose: 'event',
        metadata: { event_id: event.id }
      })

      openRazorpayCheckout(
        orderData,
        { name: user.name, email: user.email, phone: user.phone },
        'event',
        async (response) => {
          try {
            await verifyPayment({
              ...response,
              purpose: 'event',
              metadata: { event_id: event.id }
            })
            
            const completeResponse = await api.post(`/api/events/${id}/complete-registration`)
            setTicketId(completeResponse.data.ticket_id)
            setShowPaymentModal(false)
            setShowQR(true)
          } catch {
            setError('Payment verification failed')
          }
          setRegistering(false)
        },
        () => {
          setRegistering(false)
        }
      )
    } catch {
      setError('Failed to create payment order')
      setRegistering(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Card className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Event Not Found</h3>
          <button onClick={() => navigate('/events')} className="btn-primary mt-4">
            Back to Events
          </button>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => navigate('/events')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Events
      </button>

      <Card>
        <div className="flex items-start justify-between mb-4">
          <div className="flex gap-2">
            <Badge variant={event.is_paid ? 'accent' : 'success'}>
              {event.is_paid ? 'Paid Event' : 'Free Event'}
            </Badge>
            {event.department !== 'All' && (
              <Badge variant="neutral">{event.department}</Badge>
            )}
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">{event.title}</h1>

        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-3 text-gray-600">
            <Calendar className="w-5 h-5 text-primary" />
            <span>{formatDate(event.event_date)}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-600">
            <MapPin className="w-5 h-5 text-primary" />
            <span>{event.location}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-600">
            <Users className="w-5 h-5 text-primary" />
            <span>{event.attendees_count} registered</span>
          </div>
          {event.is_paid && (
            <div className="flex items-center gap-3 text-accent font-medium">
              <IndianRupee className="w-5 h-5" />
              <span>Rs. {event.fee_amount / 100}</span>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 pt-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">About this Event</h2>
          <p className="text-gray-600 whitespace-pre-wrap">{event.description}</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-danger text-sm mb-4">
            {error}
          </div>
        )}

        <button
          onClick={handleRegister}
          disabled={registering}
          className="btn-primary w-full"
        >
          {registering ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : event.is_paid ? (
            `Register - Rs. ${event.fee_amount / 100}`
          ) : (
            'Register for Free'
          )}
        </button>
      </Card>

      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Complete Registration"
      >
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{event.title}</h3>
          <p className="text-gray-600 mb-6">
            Complete your payment to confirm your registration for this event.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-3xl font-bold text-gray-900">Rs. {event.fee_amount / 100}</p>
            <p className="text-sm text-gray-500">Event Registration Fee</p>
          </div>
          <button
            onClick={handlePayForEvent}
            disabled={registering}
            className="btn-accent w-full"
          >
            {registering ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Pay Now'}
          </button>
        </div>
      </Modal>

      {ticketId && (
        <QRViewer
          isOpen={showQR}
          onClose={() => setShowQR(false)}
          ticketId={ticketId}
          eventTitle={event.title}
        />
      )}

      {ticketId && !showQR && (
        <Card className="mt-6 bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-success" />
            <div>
              <h3 className="font-semibold text-gray-900">You're Registered!</h3>
              <p className="text-sm text-gray-600">Ticket ID: {ticketId}</p>
            </div>
            <button
              onClick={() => setShowQR(true)}
              className="ml-auto btn-outline text-sm py-2"
            >
              View Ticket
            </button>
          </div>
        </Card>
      )}
    </div>
  )
}

export default EventDetails
