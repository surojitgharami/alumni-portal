import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import { 
  Users, Calendar, Briefcase, Megaphone, Home, Image, CreditCard, 
  Mail, LayoutDashboard, Menu, X, LogOut
} from 'lucide-react'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Users, label: 'Add Faculty', path: '/admin/add-faculty' },
    { icon: Users, label: 'Add Alumni', path: '/admin/add-alumni' },
    { icon: Users, label: 'Alumni Accounts', path: '/admin/alumni' },
    { icon: Users, label: 'Approve Registrations', path: '/admin/registrations' },
    { icon: Calendar, label: 'Manage Events', path: '/admin/events' },
    { icon: Briefcase, label: 'Manage Jobs', path: '/admin/jobs' },
    { icon: Megaphone, label: 'Announcements', path: '/admin/announcements' },
    { icon: Home, label: 'Content Manager', path: '/admin/content' },
    { icon: Image, label: 'Gallery', path: '/admin/gallery' },
    { icon: CreditCard, label: 'Donations & Reports', path: '/admin/donations' },
    { icon: Mail, label: 'Mass Emails', path: '/admin/emails' }
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-neutral-bg">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-primary text-white transition-all duration-300 flex flex-col`}>
        <div className="p-4 flex items-center justify-between">
          {sidebarOpen && <h1 className="font-bold text-lg">Admin Panel</h1>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-primary-dark rounded">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary-dark transition-colors text-left"
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="text-sm">{item.label}</span>}
            </button>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 hover:bg-primary-dark transition-colors w-full text-left border-t border-primary-dark"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {sidebarOpen && <span className="text-sm">Logout</span>}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <h2 className="text-2xl font-bold text-gray-900">Admin Console</h2>
        </header>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
