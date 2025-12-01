import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { GraduationCap, Users, Briefcase, Calendar, ArrowRight, CheckCircle, ChevronLeft, ChevronRight, Clock, MapPin, MessageSquare } from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../App'

interface Event {
  _id: string
  title: string
  event_date: string
  location: string
  department: string
}

interface Announcement {
  _id: string
  title: string
  content: string
  created_at: string
}

function Landing() {
  const { user } = useAuth()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [galleryImages, setGalleryImages] = useState<string[]>([])
  const [heroImage, setHeroImage] = useState<string | null>(null)
  const [heroTitle, setHeroTitle] = useState('Your Alumni Network Awaits')
  const [heroSubtitle, setHeroSubtitle] = useState('Connect with fellow graduates, discover career opportunities, and stay engaged with your alma mater through our exclusive alumni portal.')
  const [heroCTA, setHeroCTA] = useState('Get Started')
  const [announcementsImage, setAnnouncementsImage] = useState<string | null>(null)
  const [announcementsTitle, setAnnouncementsTitle] = useState<string>('')
  const [announcementsDate, setAnnouncementsDate] = useState<string>('')
  const [newsImage, setNewsImage] = useState<string | null>(null)
  const [newsTitle, setNewsTitle] = useState<string>('')
  const [newsDate, setNewsDate] = useState<string>('')
  const [eventsImage, setEventsImage] = useState<string | null>(null)
  const [eventsTitle, setEventsTitle] = useState<string>('')
  const [eventsDate, setEventsDate] = useState<string>('')
  const [aboutTitle, setAboutTitle] = useState('About Our Alumni Association')
  const [aboutDesc, setAboutDesc] = useState('Our alumni network represents thousands of successful graduates making an impact across industries. We\'re dedicated to fostering lifelong connections and supporting career growth.')
  const [stat1, setStat1] = useState({ num: '5000+', text: 'Active Alumni Members Worldwide' })
  const [stat2, setStat2] = useState({ num: '50+', text: 'Companies Hiring Through Our Portal' })
  const [stat3, setStat3] = useState({ num: '100+', text: 'Events Organized Annually' })
  const [loadingEvents, setLoadingEvents] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Add cache-busting timestamp to content endpoints
      const cacheTimestamp = `t=${Date.now()}`
      const eventsRes = await api.get('/api/events').catch(() => ({ data: [] }))
      const announcementsRes = await api.get('/api/announcements').catch(() => ({ data: [] }))
      const galleryRes = await api.get(`/api/admin/content/gallery?${cacheTimestamp}`).catch(() => ({ data: { images: [] } }))
      const homepageRes = await api.get(`/api/admin/content/homepage?${cacheTimestamp}`).catch(() => ({ data: {} }))
      const annRes = await api.get(`/api/admin/content/sections/announcements?${cacheTimestamp}`).catch(() => ({ data: {} }))
      const newsRes = await api.get(`/api/admin/content/sections/news?${cacheTimestamp}`).catch(() => ({ data: {} }))
      const evtsRes = await api.get(`/api/admin/content/sections/events?${cacheTimestamp}`).catch(() => ({ data: {} }))
      const aboutSectionRes = await api.get(`/api/admin/content/sections/aboutsection?${cacheTimestamp}`).catch(() => ({ data: {} }))
      
      const eventsList = Array.isArray(eventsRes.data) ? eventsRes.data : []
      const announcementsList = Array.isArray(announcementsRes.data) ? announcementsRes.data : []
      const images = Array.isArray(galleryRes.data.images) ? galleryRes.data.images : []
      
      setUpcomingEvents(eventsList.slice(0, 3))
      setAnnouncements(announcementsList.slice(0, 3))
      setGalleryImages(images.length > 0 ? images : [
        'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop',
        'https://images.unsplash.com/photo-1517457373614-b7152f800fd1?w=800&h=400&fit=crop',
        'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=400&fit=crop',
        'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop'
      ])
      setHeroImage(homepageRes.data.hero_image || null)
      setHeroTitle(homepageRes.data.title || 'Your Alumni Network Awaits')
      setHeroSubtitle(homepageRes.data.subtitle || 'Connect with fellow graduates, discover career opportunities, and stay engaged with your alma mater through our exclusive alumni portal.')
      setHeroCTA(homepageRes.data.cta_text || 'Get Started')
      setAnnouncementsImage(annRes.data.image || null)
      setAnnouncementsTitle(annRes.data.title || 'Quick Announcements')
      setAnnouncementsDate(annRes.data.date || '')
      setNewsImage(newsRes.data.image || null)
      setNewsTitle(newsRes.data.title || 'Recent News & Updates')
      setNewsDate(newsRes.data.date || '')
      setEventsImage(evtsRes.data.image || null)
      setEventsTitle(evtsRes.data.title || 'Upcoming Events')
      setEventsDate(evtsRes.data.date || '')
      setAboutTitle(aboutSectionRes.data.title || 'About Our Alumni Association')
      setAboutDesc(aboutSectionRes.data.description || 'Our alumni network represents thousands of successful graduates making an impact across industries. We\'re dedicated to fostering lifelong connections and supporting career growth.')
      setStat1({ num: aboutSectionRes.data.stat1_number || '5000+', text: aboutSectionRes.data.stat1_text || 'Active Alumni Members Worldwide' })
      setStat2({ num: aboutSectionRes.data.stat2_number || '50+', text: aboutSectionRes.data.stat2_text || 'Companies Hiring Through Our Portal' })
      setStat3({ num: aboutSectionRes.data.stat3_number || '100+', text: aboutSectionRes.data.stat3_text || 'Events Organized Annually' })
    } catch (error) {
      console.error('Failed to fetch data:', error)
      setUpcomingEvents([])
      setAnnouncements([])
      setGalleryImages([
        'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop',
        'https://images.unsplash.com/photo-1517457373614-b7152f800fd1?w=800&h=400&fit=crop',
        'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=400&fit=crop',
        'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop'
      ])
      setHeroImage(null)
      setAnnouncementsImage(null)
      setAnnouncementsTitle('Quick Announcements')
      setAnnouncementsDate('')
      setNewsImage(null)
      setNewsTitle('Recent News & Updates')
      setNewsDate('')
      setEventsImage(null)
      setEventsTitle('Upcoming Events')
      setEventsDate('')
      setAboutTitle('About Our Alumni Association')
      setAboutDesc('Our alumni network represents thousands of successful graduates making an impact across industries. We\'re dedicated to fostering lifelong connections and supporting career growth.')
      setStat1({ num: '5000+', text: 'Active Alumni Members Worldwide' })
      setStat2({ num: '50+', text: 'Companies Hiring Through Our Portal' })
      setStat3({ num: '100+', text: 'Events Organized Annually' })
    } finally {
      setLoadingEvents(false)
    }
  }

  const features = [
    {
      icon: Users,
      title: 'Connect with Alumni',
      description: 'Build lasting connections with graduates from all departments and batches'
    },
    {
      icon: Briefcase,
      title: 'Job Opportunities',
      description: 'Access exclusive job postings from alumni at leading companies'
    },
    {
      icon: Calendar,
      title: 'Events & Reunions',
      description: 'Stay updated on alumni meetups, reunions, and networking events'
    }
  ]

  const benefits = [
    'Verified alumni network',
    'Exclusive job board',
    'Event registrations with QR tickets',
    'Department-wise networking',
    'Professional community'
  ]

  const news = [
    {
      title: 'Alumni Success Story: From Startup to Scale-up',
      date: 'Nov 25, 2025',
      category: 'Success'
    },
    {
      title: 'New Mentorship Program Launched',
      date: 'Nov 20, 2025',
      category: 'Program'
    },
    {
      title: 'Annual Alumni Meet 2025 - Registrations Open',
      date: 'Nov 15, 2025',
      category: 'Event'
    }
  ]

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % galleryImages.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + galleryImages.length) % galleryImages.length)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900">MAKAUT Alumni</span>
            </div>
            <div className="flex items-center gap-4">
              {user && user.profile_photo_url ? (
                <Link to="/profile" className="flex items-center gap-2">
                  <img 
                    src={user.profile_photo_url} 
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-primary hover:border-orange-500 transition-colors"
                  />
                  <span className="text-gray-700 font-medium hidden sm:inline">{user.name}</span>
                </Link>
              ) : user ? (
                <Link to="/profile" className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-bold text-sm">
                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                  <span className="text-gray-700 font-medium hidden sm:inline">{user.name}</span>
                </Link>
              ) : null}
              {!user && (
                <>
                  <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium">
                    Login
                  </Link>
                  <Link to="/signup" className="btn-primary">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section 
        className="text-white py-20 relative"
        style={heroImage ? {
          backgroundImage: `url('${heroImage}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        } : {
          background: 'linear-gradient(to bottom right, #0F4C81, #1e3a8a)'
        }}
      >
        {heroImage && <div className="absolute inset-0 bg-gradient-to-br from-primary/70 to-blue-800/70"></div>}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              {heroTitle}
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              {heroSubtitle}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/signup" className="btn bg-white text-primary hover:bg-gray-100 px-8 py-3 text-lg font-semibold">
                {heroCTA} <ArrowRight className="w-5 h-5" />
              </Link>
              <a href="#about" className="btn bg-blue-600 text-white hover:bg-blue-700 px-8 py-3 text-lg font-semibold">
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-neutral-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {aboutTitle}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {aboutDesc}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg border-l-4 border-primary">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{stat1.num}</h3>
              <p className="text-gray-600">{stat1.text}</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg border-l-4 border-accent">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{stat2.num}</h3>
              <p className="text-gray-600">{stat2.text}</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg border-l-4 border-success">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{stat3.num}</h3>
              <p className="text-gray-600">{stat3.text}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Stay Connected
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our alumni portal provides all the tools you need to maintain your professional network and stay engaged.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-neutral-bg rounded-2xl p-8 hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 bg-primary-50 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Photo Carousel Section */}
      <section className="py-20 bg-neutral-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
            Alumni Moments
          </h2>
          <div className="relative bg-white rounded-2xl overflow-hidden shadow-2xl">
            <div className="relative h-96 md:h-[500px] w-full overflow-hidden bg-gray-900">
              <img
                src={galleryImages[currentSlide]}
                alt={`Gallery ${currentSlide + 1}`}
                className="w-full h-full object-cover transition-opacity duration-500"
              />
              <div className="absolute inset-0 bg-black/20"></div>
            </div>
            
            {/* Carousel Controls */}
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-900 p-3 rounded-full transition-all"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-900 p-3 rounded-full transition-all"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Slide Indicators */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {galleryImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentSlide ? 'bg-white w-8' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Announcements Section */}
      <section className="py-20 bg-white">
        {announcementsImage && (
          <div className="w-full h-64 mb-12 overflow-hidden rounded-lg">
            <img src={announcementsImage} alt="Announcements" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-baseline mb-12">
            <h2 className="text-4xl font-bold text-gray-900">
              {announcementsTitle}
            </h2>
            {announcementsDate && (
              <p className="text-sm text-gray-500">Updated: {new Date(announcementsDate).toLocaleDateString()}</p>
            )}
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {announcements.length > 0 ? (
              announcements.map((ann) => (
                <div key={ann._id} className="bg-neutral-bg rounded-2xl p-6 border-l-4 border-accent hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-3 mb-4">
                    <MessageSquare className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                    <h3 className="font-semibold text-gray-900 text-lg flex-1">{ann.title}</h3>
                  </div>
                  <p className="text-gray-600 text-sm line-clamp-3">{ann.content}</p>
                  <p className="text-xs text-gray-500 mt-4">
                    {new Date(ann.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 col-span-3 text-center py-8">No announcements yet</p>
            )}
          </div>
        </div>
      </section>

      {/* Recent News & Updates Section */}
      <section className="py-20 bg-neutral-bg">
        {newsImage && (
          <div className="w-full h-64 mb-12 overflow-hidden rounded-lg">
            <img src={newsImage} alt="News" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-baseline mb-12">
            <h2 className="text-4xl font-bold text-gray-900">
              {newsTitle}
            </h2>
            {newsDate && (
              <p className="text-sm text-gray-500">Updated: {new Date(newsDate).toLocaleDateString()}</p>
            )}
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {news.map((item, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-shadow">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 bg-primary text-white text-xs font-semibold rounded-full">
                    {item.category}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 line-clamp-2">
                  {item.title}
                </h3>
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>{item.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section className="py-20 bg-white">
        {eventsImage && (
          <div className="w-full h-64 mb-12 overflow-hidden rounded-lg">
            <img src={eventsImage} alt="Events" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-baseline mb-12">
            <h2 className="text-4xl font-bold text-gray-900">
              {eventsTitle}
            </h2>
            {eventsDate && (
              <p className="text-sm text-gray-500">Updated: {new Date(eventsDate).toLocaleDateString()}</p>
            )}
          </div>
          {loadingEvents ? (
            <p className="text-center text-gray-500">Loading events...</p>
          ) : upcomingEvents.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-8">
              {upcomingEvents.map((event) => (
                <div key={event._id} className="bg-neutral-bg rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow">
                  <div className="bg-gradient-to-r from-primary to-blue-700 h-24"></div>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{event.title}</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        {new Date(event.event_date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-accent" />
                        {event.location}
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <span className="text-xs font-semibold text-primary bg-primary-50 px-3 py-1 rounded-full">
                        {event.department}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-12">No upcoming events at the moment</p>
          )}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-neutral-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Why Join Our Alumni Network?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Become part of a thriving community of graduates who are making a difference in their careers and giving back to their alma mater.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-success flex-shrink-0" />
                    <span className="text-gray-700 font-medium">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-2xl p-10 shadow-2xl">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Ready to Join?
              </h3>
              <p className="text-gray-600 mb-8">
                Registration is open for final-year students and alumni. Verify your registration number to get started today.
              </p>
              <Link to="/signup" className="btn-primary w-full py-4 text-center block text-lg font-semibold">
                Create Your Account
              </Link>
              <p className="text-center text-gray-600 mt-6">
                Already have an account? <Link to="/login" className="text-primary font-semibold hover:underline">Login here</Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="w-6 h-6" />
                <span className="font-bold text-lg">Alumni Portal</span>
              </div>
              <p className="text-primary-200 text-sm">Connecting graduates for lifelong success</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-primary-200">
                <li><a href="#about" className="hover:text-white">About</a></li>
                <li><Link to="/signup" className="hover:text-white">Join</Link></li>
                <li><Link to="/login" className="hover:text-white">Login</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-sm text-primary-200">
                <li><a href="#" className="hover:text-white">Job Board</a></li>
                <li><a href="#" className="hover:text-white">Events</a></li>
                <li><a href="#" className="hover:text-white">Directory</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-primary-200">
                <li><a href="mailto:alumni@college.edu" className="hover:text-white">alumni@college.edu</a></li>
                <li><a href="tel:+919876543210" className="hover:text-white">+91 9876543210</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-primary-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-primary-200 text-sm">
              &copy; {new Date().getFullYear()} Alumni Portal. All rights reserved.
            </p>
            <div className="flex gap-6 mt-4 md:mt-0 text-sm text-primary-200">
              <a href="#" className="hover:text-white">Privacy Policy</a>
              <a href="#" className="hover:text-white">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing
