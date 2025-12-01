import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect, createContext, useContext } from 'react'
import api from './services/api'
import Landing from './pages/Landing'
import Signup from './pages/Signup'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Events from './pages/Events'
import EventDetails from './pages/EventDetails'
import Jobs from './pages/Jobs'
import JobDetail from './pages/JobDetail'
import JobCreate from './pages/JobCreate'
import Profile from './pages/Profile'
import Alumni from './pages/Alumni'
import AdminDashboard from './pages/Admin/AdminDashboard'
import StudentDataUpload from './pages/Admin/StudentDataUpload'
import AlumniAccounts from './pages/Admin/AlumniAccounts'
import ManageRegistrations from './pages/Admin/ManageRegistrations'
import ManageEvents from './pages/Admin/ManageEvents'
import ManageJobs from './pages/Admin/ManageJobs'
import Announcements from './pages/Admin/Announcements'
import HomepageContent from './pages/Admin/HomepageContent'
import Gallery from './pages/Admin/Gallery'
import DonationsAdmin from './pages/Admin/Donations'
import MassEmails from './pages/Admin/MassEmails'
import ContentManager from './pages/Admin/ContentManager'
import AddFaculty from './pages/Admin/AddFaculty'
import AddAlumni from './pages/Admin/AddAlumni'
import EditAlumni from './pages/Admin/EditAlumni'
import FacultyDirectory from './pages/FacultyDirectory'
import FacultyDetails from './pages/FacultyDetails'
import FacultyProfile from './pages/FacultyProfile'
import FacultyManageAlumni from './pages/Faculty/ManageAlumni'
import FacultyManageEvents from './pages/Faculty/ManageEvents'
import FacultyManageJobs from './pages/Faculty/ManageJobs'
import FacultyGallery from './pages/Faculty/Gallery'
import FacultyAchievements from './pages/Faculty/Achievements'
import FacultyNewsletter from './pages/Faculty/Newsletter'
import FacultyAnnouncements from './pages/Faculty/Announcements'
import FacultyAnalytics from './pages/Faculty/Analytics'
import FacultyDashboard from './pages/Faculty/FacultyDashboard'
import ImportHistory from './pages/Admin/ImportHistory'
import NewsletterManagement from './pages/Admin/NewsletterManagement'
import AdvancedAnalytics from './pages/Admin/AdvancedAnalytics'
import AdminNotices from './pages/Admin/Notices'
import AdminDiscussionModeration from './pages/Admin/DiscussionModeration'
import AdminPaymentReconciliation from './pages/Admin/PaymentReconciliation'
import AdminAuditLogs from './pages/Admin/AuditLogs'
import FacultyActivity from './pages/Faculty/Activity'
import AlumniDiscussion from './pages/Alumni/Discussion'
import AlumniDirectory from './pages/Alumni/Directory'
import AlumniAchievementSubmission from './pages/Alumni/AchievementSubmission'
import StudentEventProposalStatus from './pages/Student/EventProposalStatus'
import Donate from './pages/Donate'
import Header from './components/Header'
import Footer from './components/Footer'
import { getStoredUser, getStoredToken, clearAuth } from './services/auth'

interface User {
  id: string
  name: string
  email: string
  department: string
  registration_number: string
  passout_year: number
  role: 'student' | 'alumni' | 'admin' | 'faculty'
  membership_status: 'unpaid' | 'active'
  dob: string
  phone: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  setAuth: (user: User, token: string) => void
  logout: () => void
  refreshUser: () => void
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  setAuth: () => {},
  logout: () => {},
  refreshUser: () => {}
})

export const useAuth = () => useContext(AuthContext)

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const storedUser = getStoredUser()
      const storedToken = getStoredToken()
      if (storedUser && storedToken) {
        try {
          const response = await api.get('/api/profile')
          setUser(storedUser)
          setToken(storedToken)
        } catch (error) {
          clearAuth()
        }
      }
      setLoading(false)
    }
    initAuth()
  }, [])

  const setAuth = (user: User, token: string) => {
    setUser(user)
    setToken(token)
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('token', token)
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    clearAuth()
  }

  const refreshUser = () => {
    const storedUser = getStoredUser()
    if (storedUser) {
      setUser(storedUser)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  const isAuthenticated = !!user && !!token
  const isAdmin = user?.role === 'admin'

  return (
    <AuthContext.Provider value={{ user, token, setAuth, logout, refreshUser }}>
      <div className="min-h-screen flex flex-col bg-neutral-bg">
        {isAuthenticated && !isAdmin && <Header />}
        <main className="flex-1">
          <Routes>
            <Route path="/" element={isAuthenticated ? <Navigate to={isAdmin ? "/admin/dashboard" : "/dashboard"} /> : <Landing />} />
            <Route path="/signup" element={isAuthenticated ? <Navigate to={isAdmin ? "/admin/dashboard" : "/dashboard"} /> : <Signup />} />
            <Route path="/login" element={isAuthenticated ? <Navigate to={isAdmin ? "/admin/dashboard" : "/dashboard"} /> : <Login />} />
            
            <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
            <Route path="/events" element={isAuthenticated ? <Events /> : <Navigate to="/login" />} />
            <Route path="/events/:id" element={isAuthenticated ? <EventDetails /> : <Navigate to="/login" />} />
            <Route path="/jobs" element={isAuthenticated ? <Jobs /> : <Navigate to="/login" />} />
            <Route path="/jobs/create" element={isAuthenticated ? <JobCreate /> : <Navigate to="/login" />} />
            <Route path="/jobs/:id" element={isAuthenticated ? <JobDetail /> : <Navigate to="/login" />} />
            <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
            <Route path="/faculty" element={isAuthenticated ? <FacultyDirectory /> : <Navigate to="/login" />} />
            <Route path="/faculty/:id" element={isAuthenticated ? <FacultyDetails /> : <Navigate to="/login" />} />
            <Route path="/dashboard-faculty" element={isAuthenticated && user?.role === 'faculty' ? <FacultyDashboard /> : <Navigate to="/login" />} />
            <Route path="/faculty-profile" element={isAuthenticated && user?.role === 'faculty' ? <FacultyProfile /> : <Navigate to="/login" />} />
            <Route path="/faculty/alumni" element={isAuthenticated && user?.role === 'faculty' ? <FacultyManageAlumni /> : <Navigate to="/login" />} />
            <Route path="/faculty/events" element={isAuthenticated && user?.role === 'faculty' ? <FacultyManageEvents /> : <Navigate to="/login" />} />
            <Route path="/faculty/jobs" element={isAuthenticated && user?.role === 'faculty' ? <FacultyManageJobs /> : <Navigate to="/login" />} />
            <Route path="/faculty/gallery" element={isAuthenticated && user?.role === 'faculty' ? <FacultyGallery /> : <Navigate to="/login" />} />
            <Route path="/faculty/achievements" element={isAuthenticated && user?.role === 'faculty' ? <FacultyAchievements /> : <Navigate to="/login" />} />
            <Route path="/faculty/newsletter" element={isAuthenticated && user?.role === 'faculty' ? <FacultyNewsletter /> : <Navigate to="/login" />} />
            <Route path="/faculty/announcements" element={isAuthenticated && user?.role === 'faculty' ? <FacultyAnnouncements /> : <Navigate to="/login" />} />
            <Route path="/faculty/analytics" element={isAuthenticated && user?.role === 'faculty' ? <FacultyAnalytics /> : <Navigate to="/login" />} />
            <Route path="/alumni" element={isAuthenticated ? <Alumni /> : <Navigate to="/login" />} />
            
            <Route path="/admin/dashboard" element={isAdmin ? <AdminDashboard /> : <Navigate to="/login" />} />
            <Route path="/admin/add-faculty" element={isAdmin ? <AddFaculty /> : <Navigate to="/login" />} />
            <Route path="/admin/add-alumni" element={isAdmin ? <AddAlumni /> : <Navigate to="/login" />} />
            <Route path="/admin/alumni/edit/:userId" element={isAdmin ? <EditAlumni /> : <Navigate to="/login" />} />
            <Route path="/admin/student-upload" element={isAdmin ? <StudentDataUpload /> : <Navigate to="/login" />} />
            <Route path="/admin/alumni" element={isAdmin ? <AlumniAccounts /> : <Navigate to="/login" />} />
            <Route path="/admin/registrations" element={isAdmin ? <ManageRegistrations /> : <Navigate to="/login" />} />
            <Route path="/admin/events" element={isAdmin ? <ManageEvents /> : <Navigate to="/login" />} />
            <Route path="/admin/jobs" element={isAdmin ? <ManageJobs /> : <Navigate to="/login" />} />
            <Route path="/admin/announcements" element={isAdmin ? <Announcements /> : <Navigate to="/login" />} />
            <Route path="/admin/content" element={isAdmin ? <ContentManager /> : <Navigate to="/login" />} />
            <Route path="/admin/homepage" element={isAdmin ? <HomepageContent /> : <Navigate to="/login" />} />
            <Route path="/admin/gallery" element={isAdmin ? <Gallery /> : <Navigate to="/login" />} />
            <Route path="/donate" element={<Donate />} />
            <Route path="/admin/donations" element={isAdmin ? <DonationsAdmin /> : <Navigate to="/login" />} />
            <Route path="/admin/emails" element={isAdmin ? <MassEmails /> : <Navigate to="/login" />} />
            <Route path="/admin/student/importhistory" element={isAdmin ? <ImportHistory /> : <Navigate to="/login" />} />
            <Route path="/admin/newsletters/all" element={isAdmin ? <NewsletterManagement /> : <Navigate to="/login" />} />
            <Route path="/admin/analytics/advanced" element={isAdmin ? <AdvancedAnalytics /> : <Navigate to="/login" />} />
            <Route path="/admin/notices" element={isAdmin ? <AdminNotices /> : <Navigate to="/login" />} />
            <Route path="/admin/discussionmoderation" element={isAdmin ? <AdminDiscussionModeration /> : <Navigate to="/login" />} />
            <Route path="/admin/payments" element={isAdmin ? <AdminPaymentReconciliation /> : <Navigate to="/login" />} />
            <Route path="/admin/reconciliation" element={isAdmin ? <AdminPaymentReconciliation /> : <Navigate to="/login" />} />
            <Route path="/admin/audit-logs" element={isAdmin ? <AdminAuditLogs /> : <Navigate to="/login" />} />
            <Route path="/admin/auditlogs" element={isAdmin ? <AdminAuditLogs /> : <Navigate to="/login" />} />
            <Route path="/faculty/activity" element={isAuthenticated && user?.role === 'faculty' ? <FacultyActivity /> : <Navigate to="/login" />} />
            <Route path="/alumni/directory" element={isAuthenticated && user?.role === 'alumni' ? <AlumniDirectory /> : <Navigate to="/login" />} />
            <Route path="/alumni/achievements" element={isAuthenticated && user?.role === 'alumni' ? <AlumniAchievementSubmission /> : <Navigate to="/login" />} />
            <Route path="/discussion" element={isAuthenticated && user?.role === 'alumni' ? <AlumniDiscussion /> : <Navigate to="/login" />} />
            <Route path="/alumni/discussion" element={isAuthenticated && user?.role === 'alumni' ? <AlumniDiscussion /> : <Navigate to="/login" />} />
            <Route path="/student/events/proposalstatus" element={isAuthenticated && user?.role === 'student' ? <StudentEventProposalStatus /> : <Navigate to="/login" />} />
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        {isAuthenticated && !isAdmin && <Footer />}
      </div>
    </AuthContext.Provider>
  )
}

export default App
