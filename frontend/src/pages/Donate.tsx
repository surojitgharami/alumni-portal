import { useState, useEffect } from 'react'
import { Heart, TrendingUp, BookOpen, Building2 } from 'lucide-react'
import { useAuth } from '../App'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
interface Donation {
  id: string
  amount: number
  donation_purpose: string
  created_at: string
  status: string
}

declare global {
  interface Window {
    Razorpay: any
  }
}

export default function Donate() {
  const { user, token, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [selectedPurpose, setSelectedPurpose] = useState('scholarships')
  const [amount, setAmount] = useState('500')
  const [loading, setLoading] = useState(false)
  const [donationHistory, setDonationHistory] = useState<Donation[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [impactStats, setImpactStats] = useState({
    total_donated: 5000000,
    scholarships_awarded: 500,
    events_organized: 100
  })

  const purposes = [
    { id: 'scholarships', label: 'Scholarships', icon: BookOpen, color: 'bg-blue-50 border-blue-200' },
    { id: 'events', label: 'Events & Activities', icon: TrendingUp, color: 'bg-purple-50 border-purple-200' },
    { id: 'infra', label: 'Infrastructure', icon: Building2, color: 'bg-green-50 border-green-200' }
  ]

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    fetchDonationHistory()
    fetchImpactStats()
    loadRazorpayScript()
  }, [user, navigate])

  const loadRazorpayScript = () => {
    if (window.Razorpay) return
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
  }

  const fetchImpactStats = async () => {
    try {
      const response = await api.get('/api/admin/content/sections/donationimpact')
      setImpactStats(response.data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const fetchDonationHistory = async () => {
    try {
      setLoadingHistory(true)
      const response = await api.get('/api/donations/history')
      setDonationHistory(response.data || [])
    } catch (error) {
      console.error('Failed to fetch donation history:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleDonate = async () => {
    if (!amount || parseInt(amount) <= 0) {
      alert('Please enter a valid amount')
      return
    }

    if (!window.Razorpay) {
      alert('Payment system is loading. Please try again in a moment.')
      return
    }

    try {
      setLoading(true)

      const response = await api.post('/api/payments/create-order', {
        amount: parseInt(amount) * 100,
        purpose: 'donation',
        metadata: { donation_purpose: selectedPurpose }
      })

      const options = {
        key: response.data.key_id,
        amount: response.data.amount,
        currency: response.data.currency,
        order_id: response.data.order_id,
        handler: async function (paymentResponse: any) {
          try {
            setLoading(true)
            await api.post('/api/payments/verify', {
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature,
              purpose: 'donation',
              metadata: { donation_purpose: selectedPurpose }
            })

            // Update user state after successful payment
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
            if (selectedPurpose === 'membership') {
              storedUser.membership_status = 'active'
            }
            localStorage.setItem('user', JSON.stringify(storedUser))
            refreshUser()

            setSuccessMessage(`Thank you! Your donation of ₹${amount} has been received.`)
            setAmount('500')
            setTimeout(() => setSuccessMessage(''), 5000)
            await fetchDonationHistory()
          } catch (error) {
            alert('Payment verification failed. Please contact support.')
            console.error('Verification error:', error)
          } finally {
            setLoading(false)
          }
        },
        prefill: {
          email: user?.email || '',
          name: user?.name || ''
        }
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (error) {
      alert('Failed to initiate donation. Please try again.')
      console.error('Donation error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-grow container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-8 text-white mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Heart className="w-10 h-10" />
            <h1 className="text-4xl font-bold">Support Our Alumni Community</h1>
          </div>
          <p className="text-blue-100 text-lg">
            Your donation helps us create scholarships, organize events, and improve our infrastructure for current students and alumni.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Donation Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Make a Donation</h2>

              {successMessage && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <p className="text-green-800">{successMessage}</p>
                </div>
              )}

              {/* Purpose Selection */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-4">
                  Purpose of Donation
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {purposes.map((purpose) => {
                    const Icon = purpose.icon
                    return (
                      <button
                        key={purpose.id}
                        onClick={() => setSelectedPurpose(purpose.id)}
                        className={`p-4 rounded-lg border-2 transition ${
                          selectedPurpose === purpose.id
                            ? 'border-blue-500 bg-blue-50'
                            : `${purpose.color} border-transparent hover:border-blue-200`
                        }`}
                      >
                        <Icon className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                        <p className="font-medium text-gray-900">{purpose.label}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Amount Input */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Donation Amount (₹)
                </label>
                <div className="flex gap-4 mb-4">
                  {[100, 500, 1000, 5000].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setAmount(preset.toString())}
                      className={`px-4 py-2 rounded-lg font-medium transition ${
                        amount === preset.toString()
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      }`}
                    >
                      ₹{preset}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter custom amount"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                />
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-gray-700">
                  <strong>Purpose:</strong> Your donation will support <strong>{purposes.find(p => p.id === selectedPurpose)?.label}</strong> initiatives
                </p>
              </div>

              {/* Donate Button */}
              <button
                onClick={handleDonate}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-bold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Heart className="w-5 h-5" />
                {loading ? 'Processing...' : `Donate ₹${amount}`}
              </button>

              <p className="text-center text-sm text-gray-500 mt-4">
                💳 Secure payment powered by Razorpay
              </p>
            </div>
          </div>

          {/* Impact Stats */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Impact of Donations</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-3xl font-bold text-blue-600">₹{(impactStats.total_donated / 100000).toFixed(1)} Lakh+</p>
                  <p className="text-gray-600">Donated by Alumni</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-green-600">{impactStats.scholarships_awarded}+</p>
                  <p className="text-gray-600">Scholarships Awarded</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-purple-600">{impactStats.events_organized}+</p>
                  <p className="text-gray-600">Events Organized</p>
                </div>
              </div>
            </div>

            {/* Donation History */}
            {user && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Your Donations</h3>
                {loadingHistory ? (
                  <p className="text-gray-500 text-center py-4">Loading...</p>
                ) : donationHistory.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {donationHistory.map((donation) => (
                      <div key={donation.id} className="border-b pb-3 last:border-b-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-gray-900">₹{donation.amount / 100}</p>
                            <p className="text-sm text-gray-600 capitalize">
                              {donation.donation_purpose}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500">
                            {new Date(donation.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No donations yet</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
