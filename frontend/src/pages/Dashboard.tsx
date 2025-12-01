import { useAuth } from '../App'
import { Link } from 'react-router-dom'
import Card from '../components/Card'
import Badge from '../components/Badge'
import { Calendar, Briefcase, User, AlertTriangle, CreditCard, ArrowRight, Image, Award, Mail, Users, BarChart3, Settings, MessageSquare, FileText, Megaphone, Gift, TrendingUp, Upload } from 'lucide-react'
import { useState } from 'react'
import { createPaymentOrder, verifyPayment, openRazorpayCheckout } from '../services/payments'

function Dashboard() {
  const { user, refreshUser } = useAuth()
  const [paymentLoading, setPaymentLoading] = useState(false)

  if (!user) return null

  const isStudent = user.role === 'student'
  const isFaculty = user.role === 'faculty'
  const isAlumni = user.role === 'alumni'
  const isAdmin = user.role === 'admin'
  const isPaidMember = user.membership_status === 'active'

  const handlePayMembership = async () => {
    setPaymentLoading(true)
    try {
      const orderData = await createPaymentOrder({
        amount: 50000,
        purpose: 'membership'
      })

      openRazorpayCheckout(
        orderData,
        { name: user.name, email: user.email, phone: user.phone },
        'membership',
        async (response) => {
          try {
            await verifyPayment({
              ...response,
              purpose: 'membership'
            })
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
            storedUser.membership_status = 'active'
            localStorage.setItem('user', JSON.stringify(storedUser))
            refreshUser()
          } catch (error) {
            console.error('Payment verification failed:', error)
          }
          setPaymentLoading(false)
        },
        () => {
          setPaymentLoading(false)
        }
      )
    } catch (error) {
      console.error('Failed to create payment order:', error)
      setPaymentLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user.name}!
        </h1>
        <p className="text-gray-600 mt-1">
          Here's what's happening in your alumni network
        </p>
      </div>

      {!isFaculty && !isPaidMember && (
        <Card className="mb-8 border-accent bg-accent-50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900">Complete Your Membership</h3>
                <p className="text-gray-600 text-sm mt-1">
                  Pay the membership fee to unlock job postings, paid events, and exclusive invitations.
                </p>
              </div>
            </div>
            <button
              onClick={handlePayMembership}
              disabled={paymentLoading}
              className="btn-accent whitespace-nowrap"
            >
              <CreditCard className="w-4 h-4" />
              {paymentLoading ? 'Processing...' : 'Pay Rs. 1000'}
            </button>
          </div>
        </Card>
      )}

      <div className={`grid gap-6 mb-8 ${isFaculty ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
        <Card className="bg-primary-50 border-primary-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-primary-600">Your Role</p>
              <p className="text-xl font-bold text-primary capitalize">{user.role}</p>
            </div>
          </div>
        </Card>

        {!isFaculty && (
          <>
            <Card className={isPaidMember ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isPaidMember ? 'bg-success' : 'bg-danger'}`}>
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className={`text-sm ${isPaidMember ? 'text-green-600' : 'text-red-600'}`}>Membership</p>
                  <p className={`text-xl font-bold capitalize ${isPaidMember ? 'text-success' : 'text-danger'}`}>
                    {user.membership_status}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-accent-50 border-accent-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-accent-600">Batch</p>
                  <p className="text-xl font-bold text-accent">{user.passout_year}</p>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      <div className={`grid gap-6 ${isFaculty || isAdmin ? 'md:grid-cols-1 lg:grid-cols-2' : 'md:grid-cols-2'}`}>
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="space-y-3">
            {isAdmin ? (
              <>
                <Link to="/admin/dashboard" className="flex items-center justify-between p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors">
                  <div className="flex items-center gap-3"><BarChart3 className="w-5 h-5 text-primary" /><span className="font-medium text-primary">Admin Dashboard</span></div>
                  <ArrowRight className="w-5 h-5 text-primary" />
                </Link>
                <Link to="/admin/student-upload" className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3"><Upload className="w-5 h-5 text-primary" /><span className="font-medium text-gray-900">Import Students</span></div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </Link>
                <Link to="/admin/add-faculty" className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3"><Users className="w-5 h-5 text-primary" /><span className="font-medium text-gray-900">Add Faculty</span></div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </Link>
                <Link to="/admin/events" className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3"><Calendar className="w-5 h-5 text-primary" /><span className="font-medium text-gray-900">Manage Events</span></div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </Link>
                <Link to="/admin/jobs" className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3"><Briefcase className="w-5 h-5 text-primary" /><span className="font-medium text-gray-900">Manage Jobs</span></div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </Link>
                <Link to="/admin/payments" className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3"><CreditCard className="w-5 h-5 text-primary" /><span className="font-medium text-gray-900">Payments</span></div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </Link>
                <Link to="/admin/audit-logs" className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3"><FileText className="w-5 h-5 text-primary" /><span className="font-medium text-gray-900">Audit Logs</span></div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </Link>
                <Link to="/admin/notices" className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3"><Megaphone className="w-5 h-5 text-primary" /><span className="font-medium text-gray-900">Department Notices</span></div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </Link>
                <Link to="/admin/content" className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3"><Settings className="w-5 h-5 text-primary" /><span className="font-medium text-gray-900">Content Manager</span></div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </Link>
              </>
            ) : isFaculty ? (
              <>
                <Link to="/faculty-profile" className="flex items-center justify-between p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors">
                  <div className="flex items-center gap-3"><User className="w-5 h-5 text-primary" /><span className="font-medium text-primary">My Profile</span></div>
                  <ArrowRight className="w-5 h-5 text-primary" />
                </Link>
                <Link to="/faculty/events" className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3"><Calendar className="w-5 h-5 text-primary" /><span className="font-medium text-gray-900">Manage Events</span></div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </Link>
                <Link to="/faculty/jobs" className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3"><Briefcase className="w-5 h-5 text-primary" /><span className="font-medium text-gray-900">Manage Jobs</span></div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </Link>
                <Link to="/faculty/alumni" className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3"><Users className="w-5 h-5 text-primary" /><span className="font-medium text-gray-900">Manage Alumni</span></div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </Link>
                <Link to="/faculty/gallery" className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3"><Image className="w-5 h-5 text-primary" /><span className="font-medium text-gray-900">Gallery</span></div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </Link>
                <Link to="/faculty/achievements" className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3"><Award className="w-5 h-5 text-primary" /><span className="font-medium text-gray-900">Achievements</span></div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </Link>
                <Link to="/faculty/newsletter" className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3"><Mail className="w-5 h-5 text-primary" /><span className="font-medium text-gray-900">Newsletter</span></div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </Link>
                <Link to="/faculty/announcements" className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3"><Megaphone className="w-5 h-5 text-primary" /><span className="font-medium text-gray-900">Announcements</span></div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </Link>
                <Link to="/faculty/analytics" className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3"><BarChart3 className="w-5 h-5 text-primary" /><span className="font-medium text-gray-900">Analytics</span></div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </Link>
              </>
            ) : isAlumni ? (
              <>
                <Link to="/profile" className="flex items-center justify-between p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors">
                  <div className="flex items-center gap-3"><User className="w-5 h-5 text-primary" /><span className="font-medium text-primary">My Profile</span></div>
                  <ArrowRight className="w-5 h-5 text-primary" />
                </Link>
                <Link to="/alumni/directory" className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3"><Users className="w-5 h-5 text-primary" /><span className="font-medium text-gray-900">Alumni Directory</span></div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </Link>
                <Link to="/alumni/achievements" className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3"><Award className="w-5 h-5 text-primary" /><span className="font-medium text-gray-900">Submit Achievement</span></div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </Link>
                <Link to="/discussion" className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3"><MessageSquare className="w-5 h-5 text-primary" /><span className="font-medium text-gray-900">Discussion Board</span></div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </Link>
                <Link to="/events" className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3"><Calendar className="w-5 h-5 text-primary" /><span className="font-medium text-gray-900">Browse Events</span></div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </Link>
                <Link to="/jobs" className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3"><Briefcase className="w-5 h-5 text-primary" /><span className="font-medium text-gray-900">Job Opportunities</span></div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </Link>
                <Link to="/donate" className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3"><Gift className="w-5 h-5 text-primary" /><span className="font-medium text-gray-900">Make a Donation</span></div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </Link>
              </>
            ) : (
              <>
                <Link to="/events" className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3"><Calendar className="w-5 h-5 text-primary" /><span className="font-medium text-gray-900">Browse Events</span></div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </Link>
                <Link to="/jobs" className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3"><Briefcase className="w-5 h-5 text-primary" /><span className="font-medium text-gray-900">View Jobs</span></div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </Link>
                <Link to="/alumni/achievements" className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3"><Award className="w-5 h-5 text-primary" /><span className="font-medium text-gray-900">Submit Achievement</span></div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </Link>
                <Link to="/profile" className="flex items-center justify-between p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors">
                  <div className="flex items-center gap-3"><User className="w-5 h-5 text-primary" /><span className="font-medium text-primary">Edit Profile</span></div>
                  <ArrowRight className="w-5 h-5 text-primary" />
                </Link>
              </>
            )}
          </div>
        </Card>

        {!isFaculty && !isAdmin && (
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Profile</h2>
            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Department</span>
                <span className="font-medium text-gray-900">{user.department}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Registration No.</span>
                <span className="font-medium text-gray-900">{user.registration_number}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Email</span>
                <span className="font-medium text-gray-900">{user.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Role</span>
                <Badge variant={user.role === 'alumni' ? 'success' : 'primary'}>
                  {user.role}
                </Badge>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Membership</span>
                <Badge variant={isPaidMember ? 'success' : 'danger'}>
                  {user.membership_status}
                </Badge>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

export default Dashboard
