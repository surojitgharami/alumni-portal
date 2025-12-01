import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import { verifyRegistration, signup } from '../services/auth'
import { createPaymentOrder, verifyPayment, openRazorpayCheckout } from '../services/payments'
import FormField from '../components/FormField'
import Modal from '../components/Modal'
import { CheckCircle, AlertCircle, Loader2, CreditCard } from 'lucide-react'

const DEPARTMENTS = [
  { value: 'CSE', label: 'Computer Science & Engineering' },
  { value: 'ECE', label: 'Electronics & Communication' },
  { value: 'EEE', label: 'Electrical & Electronics' },
  { value: 'MECH', label: 'Mechanical Engineering' },
  { value: 'CIVIL', label: 'Civil Engineering' },
  { value: 'IT', label: 'Information Technology' },
  { value: 'CHEM', label: 'Chemical Engineering' }
]

const PASSOUT_YEARS = Array.from({ length: 10 }, (_, i) => {
  const year = new Date().getFullYear() + 1 - i
  return { value: year.toString(), label: year.toString() }
})

function Signup() {
  const navigate = useNavigate()
  const { setAuth } = useAuth()
  
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  
  const [verifyForm, setVerifyForm] = useState({
    registration_number: '',
    department: '',
    passout_year: ''
  })
  
  const [profileForm, setProfileForm] = useState({
    name: '',
    dob: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  const [verifiedData, setVerifiedData] = useState<{ name?: string } | null>(null)

  const handleVerifyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setVerifyForm({ ...verifyForm, [e.target.name]: e.target.value })
    setError('')
  }

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value })
    setError('')
  }

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await verifyRegistration({
        registration_number: verifyForm.registration_number,
        department: verifyForm.department,
        passout_year: parseInt(verifyForm.passout_year)
      })

      if (result.valid) {
        setVerifiedData(result.student_record)
        if (result.student_record?.name) {
          setProfileForm(prev => ({ ...prev, name: result.student_record.name }))
        }
        setStep(2)
      } else {
        setError(result.reason || 'Verification failed')
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Verification failed. Please check your details.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (profileForm.password !== profileForm.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (profileForm.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await signup({
        name: profileForm.name,
        dob: profileForm.dob,
        department: verifyForm.department,
        phone: profileForm.phone,
        email: profileForm.email,
        registration_number: verifyForm.registration_number,
        passout_year: parseInt(verifyForm.passout_year),
        password: profileForm.password
      })

      setAuth(result.user, result.access_token)
      setShowPaymentModal(true)
    } catch (err: unknown) {
      interface ApiError {
        response?: {
          data?: {
            detail?: string
          }
        }
      }
      const apiError = err as ApiError
      setError(apiError.response?.data?.detail || 'Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePayMembership = async () => {
    setLoading(true)
    try {
      const orderData = await createPaymentOrder({
        amount: 50000,
        purpose: 'membership'
      })

      openRazorpayCheckout(
        orderData,
        { name: profileForm.name, email: profileForm.email, phone: profileForm.phone },
        'membership',
        async (response) => {
          try {
            await verifyPayment({
              ...response,
              purpose: 'membership'
            })
            const user = JSON.parse(localStorage.getItem('user') || '{}')
            user.membership_status = 'active'
            localStorage.setItem('user', JSON.stringify(user))
            navigate('/dashboard')
          } catch {
            setError('Payment verification failed')
          }
        },
        () => {
          setLoading(false)
        }
      )
    } catch {
      setError('Failed to create payment order')
      setLoading(false)
    }
  }

  const skipPayment = () => {
    setShowPaymentModal(false)
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-neutral-bg py-12">
      <div className="max-w-md mx-auto px-4">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <span className="font-bold text-xl text-gray-900">Alumni Portal</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Create Your Account</h1>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= s ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {step > s ? <CheckCircle className="w-5 h-5" /> : s}
              </div>
              {s < 3 && <div className={`w-12 h-1 ${step > s ? 'bg-primary' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="card">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-danger">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleVerifySubmit}>
              <h2 className="text-lg font-semibold mb-4">Step 1: Verify Your Registration</h2>
              <p className="text-gray-600 text-sm mb-6">
                Enter your university registration details to verify your eligibility.
              </p>

              <FormField
                label="Registration Number"
                name="registration_number"
                value={verifyForm.registration_number}
                onChange={handleVerifyChange}
                placeholder="e.g., REG202601001"
                required
              />

              <FormField
                label="Department"
                name="department"
                value={verifyForm.department}
                onChange={handleVerifyChange}
                options={DEPARTMENTS}
                required
              />

              <FormField
                label="Passout Year"
                name="passout_year"
                value={verifyForm.passout_year}
                onChange={handleVerifyChange}
                options={PASSOUT_YEARS}
                required
              />

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full mt-4"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Continue'}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleSignupSubmit}>
              <h2 className="text-lg font-semibold mb-4">Step 2: Complete Your Profile</h2>
              
              {verifiedData && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">
                    <CheckCircle className="w-4 h-4 inline mr-1" />
                    Registration verified: {verifyForm.registration_number}
                  </p>
                </div>
              )}

              <FormField
                label="Full Name"
                name="name"
                value={profileForm.name}
                onChange={handleProfileChange}
                required
              />

              <FormField
                label="Date of Birth"
                name="dob"
                type="date"
                value={profileForm.dob}
                onChange={handleProfileChange}
                required
              />

              <FormField
                label="Phone Number"
                name="phone"
                type="tel"
                value={profileForm.phone}
                onChange={handleProfileChange}
                placeholder="10-digit mobile number"
                required
              />

              <FormField
                label="Email Address"
                name="email"
                type="email"
                value={profileForm.email}
                onChange={handleProfileChange}
                required
              />

              <FormField
                label="Password"
                name="password"
                type="password"
                value={profileForm.password}
                onChange={handleProfileChange}
                placeholder="Minimum 8 characters"
                required
              />

              <FormField
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={profileForm.confirmPassword}
                onChange={handleProfileChange}
                required
              />

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-outline flex-1"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-1"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline font-medium">
            Login here
          </Link>
        </p>
      </div>

      <Modal
        isOpen={showPaymentModal}
        onClose={skipPayment}
        title="Complete Your Membership"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-accent" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Activate Your Membership
          </h3>
          <p className="text-gray-600 mb-6">
            Pay the one-time membership fee to unlock all features including job postings, paid events, and exclusive invitations.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-3xl font-bold text-gray-900">Rs. 500</p>
            <p className="text-sm text-gray-500">One-time membership fee</p>
          </div>
          <button
            onClick={handlePayMembership}
            disabled={loading}
            className="btn-accent w-full mb-3"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Pay Now'}
          </button>
          <button
            onClick={skipPayment}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Skip for now (limited access)
          </button>
        </div>
      </Modal>
    </div>
  )
}

export default Signup
