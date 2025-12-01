import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../App'
import { Home, Calendar, Briefcase, LogOut, Menu, X, Heart, ChevronDown, Users, User } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import api from '../services/api'
import NotificationBell from './NotificationBell'

function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [communityMenuOpen, setCommunityMenuOpen] = useState(false)
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const communityMenuRef = useRef<HTMLDivElement>(null)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleProfileClick = () => {
    if (user?.role === 'faculty') {
      navigate('/faculty-profile')
    } else {
      navigate('/profile')
    }
    setProfileMenuOpen(false)
  }

  useEffect(() => {
    const fetchProfilePhoto = async () => {
      try {
        const response = await api.get('/api/profile')
        if (response.data.profile_photo_url) {
          setProfilePhoto(response.data.profile_photo_url)
        }
      } catch (err) {
        console.log('Could not fetch profile photo')
      }
    }
    if (user) {
      fetchProfilePhoto()
    }
  }, [user])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false)
      }
      if (communityMenuRef.current && !communityMenuRef.current.contains(event.target as Node)) {
        setCommunityMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/events', label: 'Events', icon: Calendar },
    { path: '/jobs', label: 'Jobs', icon: Briefcase },
    { path: '/donate', label: 'Donate', icon: Heart }
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="font-semibold text-lg text-gray-900 hidden sm:block">Alumni Portal</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-primary-50 text-primary'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
            
            {/* Community Dropdown */}
            <div className="relative" ref={communityMenuRef}>
              <button
                onClick={() => setCommunityMenuOpen(!communityMenuOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  communityMenuOpen ? 'bg-primary-50 text-primary' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Users className="w-4 h-4" />
                Community
                <ChevronDown className={`w-4 h-4 transition-transform ${communityMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {communityMenuOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
                  <button
                    onClick={() => {
                      navigate('/faculty')
                      setCommunityMenuOpen(false)
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    Faculty
                  </button>
                  <button
                    onClick={() => {
                      navigate('/alumni')
                      setCommunityMenuOpen(false)
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 border-t border-gray-100"
                  >
                    <Users className="w-4 h-4" />
                    Alumni
                  </button>
                </div>
              )}
            </div>
          </nav>

          <div className="hidden md:flex items-center gap-2">
            {user && <NotificationBell />}
            {user && (
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-2 hover:bg-gray-100 rounded-lg px-3 py-2 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
                    {profilePhoto ? (
                      <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      user.name.charAt(0)
                    )}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                    </div>
                    <button
                      onClick={handleProfileClick}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      View Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-danger hover:bg-red-50 flex items-center gap-2 transition-colors border-t border-gray-100"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                  isActive(item.path)
                    ? 'bg-primary-50 text-primary'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-danger hover:bg-red-50 w-full"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      )}
    </header>
  )
}

export default Header
