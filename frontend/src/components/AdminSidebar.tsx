import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Users, Calendar, Briefcase, Megaphone, Settings, DollarSign, Lock,
  Upload, Plus, Eye, CheckCircle, FileText, Image, Mail, LogOut, ChevronDown, ChevronLeft, Menu
} from 'lucide-react'

interface NavItem {
  label: string
  icon: React.ReactNode
  path: string
}

interface NavSection {
  title: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    title: '',
    items: [
      { label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, path: '/admin/dashboard' }
    ]
  },
  {
    title: 'Users',
    items: [
      { label: 'Student Upload', icon: <Upload className="w-5 h-5" />, path: '/admin/student-upload' },
      { label: 'Add Faculty', icon: <Plus className="w-5 h-5" />, path: '/admin/add-faculty' },
      { label: 'Add Alumni', icon: <Plus className="w-5 h-5" />, path: '/admin/add-alumni' },
      { label: 'Alumni Accounts', icon: <Eye className="w-5 h-5" />, path: '/admin/alumni' },
      { label: 'Registrations', icon: <CheckCircle className="w-5 h-5" />, path: '/admin/registrations' }
    ]
  },
  {
    title: 'Events & Jobs',
    items: [
      { label: 'Manage Events', icon: <Calendar className="w-5 h-5" />, path: '/admin/events' },
      { label: 'Manage Jobs', icon: <Briefcase className="w-5 h-5" />, path: '/admin/jobs' }
    ]
  },
  {
    title: 'Communication',
    items: [
      { label: 'Announcements', icon: <Megaphone className="w-5 h-5" />, path: '/admin/announcements' },
      { label: 'Notices', icon: <FileText className="w-5 h-5" />, path: '/admin/notices' },
      { label: 'Mass Emails', icon: <Mail className="w-5 h-5" />, path: '/admin/mass-email' }
    ]
  },
  {
    title: 'Content Management',
    items: [
      { label: 'Homepage Editor', icon: <Settings className="w-5 h-5" />, path: '/admin/homepage' },
      { label: 'Gallery Manager', icon: <Image className="w-5 h-5" />, path: '/admin/gallery' },
      { label: 'Content Manager', icon: <Settings className="w-5 h-5" />, path: '/admin/content' }
    ]
  },
  {
    title: 'Finance',
    items: [
      { label: 'Payments', icon: <DollarSign className="w-5 h-5" />, path: '/admin/payments' },
      { label: 'Donations', icon: <DollarSign className="w-5 h-5" />, path: '/admin/donations' }
    ]
  },
  {
    title: 'System Tools',
    items: [
      { label: 'Audit Logs', icon: <Lock className="w-5 h-5" />, path: '/admin/audit-logs' }
    ]
  }
]

interface AdminSidebarProps {
  isOpen: boolean
  isCollapsed: boolean
  onClose: () => void
  onToggleCollapse: () => void
  onLogout: () => void
}

export default function AdminSidebar({
  isOpen,
  isCollapsed,
  onClose,
  onToggleCollapse,
  onLogout
}: AdminSidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(navSections.filter(s => s.title).map(s => s.title))
  )

  const isActive = (path: string) => location.pathname === path

  const handleNavClick = (path: string) => {
    navigate(path)
    onClose()
  }

  const toggleSection = (title: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(title)) {
      newExpanded.delete(title)
    } else {
      newExpanded.add(title)
    }
    setExpandedSections(newExpanded)
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static top-0 left-0 h-screen bg-white border-r border-gray-200 z-40 transition-all duration-300 ease-in-out flex flex-col overflow-hidden ${
          isOpen ? 'w-64' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary-dark rounded-lg flex items-center justify-center text-white font-bold text-sm">
                A
              </div>
              <div className="overflow-hidden">
                <h1 className="font-bold text-sm text-gray-900">Alumni</h1>
                <p className="text-xs text-gray-500">Admin</p>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary-dark rounded-lg flex items-center justify-center text-white font-bold text-sm">
              A
            </div>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors hidden lg:flex flex-shrink-0"
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? (
              <Menu className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          {navSections.map((section) => (
            <div key={section.title || 'dashboard'} className="mb-2">
              {section.title && !isCollapsed && (
                <button
                  onClick={() => toggleSection(section.title)}
                  className="w-full px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wide hover:text-primary transition-colors text-left flex items-center justify-between group"
                  title={section.title}
                >
                  <span className="overflow-hidden text-ellipsis">{section.title}</span>
                  <ChevronDown
                    className={`w-3 h-3 transition-transform flex-shrink-0 ${
                      expandedSections.has(section.title) ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              )}

              {/* Menu Items */}
              <div
                className={`space-y-1 overflow-hidden transition-all duration-200 ${
                  !section.title || expandedSections.has(section.title)
                    ? 'max-h-96 opacity-100'
                    : 'max-h-0 opacity-0'
                }`}
              >
                {section.items.map((item) => {
                  const active = isActive(item.path)
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavClick(item.path)}
                      title={isCollapsed ? item.label : ''}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        active
                          ? 'bg-primary text-white shadow-md shadow-primary/30'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <span className="flex-shrink-0">{item.icon}</span>
                      {!isCollapsed && <span className="truncate text-left">{item.label}</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-gray-200 mt-auto flex-shrink-0">
          <button
            onClick={onLogout}
            title={isCollapsed ? 'Logout' : ''}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

    </>
  )
}
