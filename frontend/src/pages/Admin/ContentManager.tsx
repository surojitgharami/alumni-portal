import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { Loader2, AlertCircle, CheckCircle, Upload, Save, ChevronDown, ArrowLeft } from 'lucide-react'

interface ContentData {
  title: string
  subtitle: string
  description: string
  cta_text: string
  hero_image: string | null
}

interface GalleryData {
  images: (string | null)[]
}

function ContentManager() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  const [content, setContent] = useState<ContentData>({
    title: '',
    subtitle: '',
    description: '',
    cta_text: '',
    hero_image: null
  })

  const [sections, setSections] = useState({
    about: { title: '', content: '', image: null },
    contact: { title: '', content: '', image: null },
    features: { title: '', content: '', image: null },
    announcements: { title: '', date: '', image: null },
    news: { title: '', date: '', image: null },
    events: { title: '', date: '', image: null },
    aboutsection: { 
      title: '', 
      description: '', 
      stat1_number: '', 
      stat1_text: '', 
      stat2_number: '', 
      stat2_text: '', 
      stat3_number: '', 
      stat3_text: '' 
    },
    donationimpact: {
      total_donated: '',
      scholarships_awarded: '',
      events_organized: ''
    }
  })

  const [gallery, setGallery] = useState<GalleryData>({
    images: []
  })

  useEffect(() => {
    fetchContent()
  }, [])

  const fetchContent = async () => {
    try {
      setLoading(true)
      const homepage = await api.get('/api/admin/content/homepage')
      setContent(homepage.data)
      
      const aboutSection = await api.get('/api/admin/content/sections/about')
      const contactSection = await api.get('/api/admin/content/sections/contact')
      const featuresSection = await api.get('/api/admin/content/sections/features')
      const announcementsSection = await api.get('/api/admin/content/sections/announcements')
      const newsSection = await api.get('/api/admin/content/sections/news')
      const eventsSection = await api.get('/api/admin/content/sections/events')
      const aboutSectionData = await api.get('/api/admin/content/sections/aboutsection')
      const donationimpactSection = await api.get('/api/admin/content/sections/donationimpact')
      
      setSections({
        about: aboutSection.data,
        contact: contactSection.data,
        features: featuresSection.data,
        announcements: announcementsSection.data,
        news: newsSection.data,
        events: eventsSection.data,
        aboutsection: aboutSectionData.data,
        donationimpact: donationimpactSection.data
      })

      const galleryData = await api.get('/api/admin/content/gallery')
      setGallery(galleryData.data)
    } catch (err) {
      setError('Failed to load content')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, section: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSaving(true)
    try {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        setSections({
          ...sections,
          [section]: { ...sections[section as keyof typeof sections], image: reader.result }
        })
      }
      setSuccess('Image uploaded successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to upload image')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveGalleryImage = (index: number) => {
    const newImages = gallery.images.filter((_, i) => i !== index)
    setGallery({ images: newImages })
  }

  const handleSaveHomepage = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      await api.post('/api/admin/content/homepage', content)
      setSuccess('Homepage content saved successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to save content')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveSection = async (e: React.FormEvent, sectionKey: string) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const sectionData = sections[sectionKey as keyof typeof sections]
      const payload: any = {
        section_name: sectionKey,
        ...sectionData
      }
      
      await api.post('/api/admin/content/sections', payload)
      setSuccess(`${sectionKey} section saved successfully`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to save section')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveGallery = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const filteredImages = gallery.images.filter(img => img !== null && img !== undefined)
      if (filteredImages.length === 0) {
        setError('Please add at least one image to the gallery')
        setSaving(false)
        return
      }
      await api.post('/api/admin/content/gallery', { images: filteredImages })
      setSuccess('Gallery images saved successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to save gallery images')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const SectionHeader = ({ title, isOpen }: { title: string; isOpen: boolean }) => (
    <div className="flex items-center justify-between">
      <span className="font-semibold text-gray-900">{title}</span>
      <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 text-primary hover:text-blue-700 transition"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-medium">Back</span>
      </button>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Content Management</h1>
        <p className="text-gray-600 mt-2">Manage all your portal content from one place</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-green-600">{success}</p>
        </div>
      )}

      <div className="space-y-4">
        {/* Homepage Section */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('homepage')}
            className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 transition flex items-center gap-3"
          >
            <SectionHeader title="🏠 Homepage Hero" isOpen={expandedSections.has('homepage')} />
          </button>
          {expandedSections.has('homepage') && (
            <form onSubmit={handleSaveHomepage} className="p-6 border-t border-gray-200 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={content.title}
                  onChange={(e) => setContent({ ...content, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                <input
                  type="text"
                  value={content.subtitle}
                  onChange={(e) => setContent({ ...content, subtitle: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={content.description}
                  onChange={(e) => setContent({ ...content, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CTA Button Text</label>
                <input
                  type="text"
                  value={content.cta_text}
                  onChange={(e) => setContent({ ...content, cta_text: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hero Image</label>
                {content.hero_image && (
                  <div className="mb-4 w-full h-40 rounded-lg overflow-hidden">
                    <img src={content.hero_image} alt="Hero" className="w-full h-full object-cover" />
                  </div>
                )}
                <label className="block px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary transition">
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'homepage')} disabled={saving} className="hidden" />
                  <div className="flex items-center justify-center gap-2 text-gray-600">
                    <Upload className="w-5 h-5" />
                    <span>Upload Image</span>
                  </div>
                </label>
              </div>
              <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </button>
            </form>
          )}
        </div>

        {/* About Stats Section */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('aboutsection')}
            className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 transition flex items-center gap-3"
          >
            <SectionHeader title="📊 About Stats" isOpen={expandedSections.has('aboutsection')} />
          </button>
          {expandedSections.has('aboutsection') && (
            <form onSubmit={(e) => handleSaveSection(e, 'aboutsection')} className="p-6 border-t border-gray-200 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section Title</label>
                <input
                  type="text"
                  value={sections.aboutsection.title}
                  onChange={(e) => setSections({ ...sections, aboutsection: { ...sections.aboutsection, title: e.target.value } })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={sections.aboutsection.description}
                  onChange={(e) => setSections({ ...sections, aboutsection: { ...sections.aboutsection, description: e.target.value } })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Stat 1 Number (e.g., 5000+)" value={sections.aboutsection.stat1_number} onChange={(e) => setSections({ ...sections, aboutsection: { ...sections.aboutsection, stat1_number: e.target.value } })} className="px-4 py-2 border border-gray-300 rounded-lg" />
                <input type="text" placeholder="Stat 1 Text" value={sections.aboutsection.stat1_text} onChange={(e) => setSections({ ...sections, aboutsection: { ...sections.aboutsection, stat1_text: e.target.value } })} className="px-4 py-2 border border-gray-300 rounded-lg" />
                <input type="text" placeholder="Stat 2 Number (e.g., 50+)" value={sections.aboutsection.stat2_number} onChange={(e) => setSections({ ...sections, aboutsection: { ...sections.aboutsection, stat2_number: e.target.value } })} className="px-4 py-2 border border-gray-300 rounded-lg" />
                <input type="text" placeholder="Stat 2 Text" value={sections.aboutsection.stat2_text} onChange={(e) => setSections({ ...sections, aboutsection: { ...sections.aboutsection, stat2_text: e.target.value } })} className="px-4 py-2 border border-gray-300 rounded-lg" />
                <input type="text" placeholder="Stat 3 Number (e.g., 100+)" value={sections.aboutsection.stat3_number} onChange={(e) => setSections({ ...sections, aboutsection: { ...sections.aboutsection, stat3_number: e.target.value } })} className="px-4 py-2 border border-gray-300 rounded-lg" />
                <input type="text" placeholder="Stat 3 Text" value={sections.aboutsection.stat3_text} onChange={(e) => setSections({ ...sections, aboutsection: { ...sections.aboutsection, stat3_text: e.target.value } })} className="px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
              <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </button>
            </form>
          )}
        </div>

        {/* Announcements Section */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('announcements')}
            className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 transition flex items-center gap-3"
          >
            <SectionHeader title="📢 Quick Announcements" isOpen={expandedSections.has('announcements')} />
          </button>
          {expandedSections.has('announcements') && (
            <form onSubmit={(e) => handleSaveSection(e, 'announcements')} className="p-6 border-t border-gray-200 space-y-4">
              <input type="text" placeholder="Title" value={sections.announcements.title} onChange={(e) => setSections({ ...sections, announcements: { ...sections.announcements, title: e.target.value } })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              <input type="date" value={sections.announcements.date} onChange={(e) => setSections({ ...sections, announcements: { ...sections.announcements, date: e.target.value } })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              <div>
                {sections.announcements.image && <div className="mb-2 w-full h-32 rounded-lg overflow-hidden"><img src={sections.announcements.image as string} alt="Announcements" className="w-full h-full object-cover" /></div>}
                <label className="block px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary transition">
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'announcements')} disabled={saving} className="hidden" />
                  <div className="flex items-center justify-center gap-2 text-gray-600">
                    <Upload className="w-5 h-5" />
                    <span>Upload Image</span>
                  </div>
                </label>
              </div>
              <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </button>
            </form>
          )}
        </div>

        {/* News Section */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('news')}
            className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 transition flex items-center gap-3"
          >
            <SectionHeader title="📰 Recent News" isOpen={expandedSections.has('news')} />
          </button>
          {expandedSections.has('news') && (
            <form onSubmit={(e) => handleSaveSection(e, 'news')} className="p-6 border-t border-gray-200 space-y-4">
              <input type="text" placeholder="Title" value={sections.news.title} onChange={(e) => setSections({ ...sections, news: { ...sections.news, title: e.target.value } })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              <input type="date" value={sections.news.date} onChange={(e) => setSections({ ...sections, news: { ...sections.news, date: e.target.value } })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              <div>
                {sections.news.image && <div className="mb-2 w-full h-32 rounded-lg overflow-hidden"><img src={sections.news.image as string} alt="News" className="w-full h-full object-cover" /></div>}
                <label className="block px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary transition">
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'news')} disabled={saving} className="hidden" />
                  <div className="flex items-center justify-center gap-2 text-gray-600">
                    <Upload className="w-5 h-5" />
                    <span>Upload Image</span>
                  </div>
                </label>
              </div>
              <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </button>
            </form>
          )}
        </div>

        {/* Events Section */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('events')}
            className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 transition flex items-center gap-3"
          >
            <SectionHeader title="📅 Upcoming Events" isOpen={expandedSections.has('events')} />
          </button>
          {expandedSections.has('events') && (
            <form onSubmit={(e) => handleSaveSection(e, 'events')} className="p-6 border-t border-gray-200 space-y-4">
              <input type="text" placeholder="Title" value={sections.events.title} onChange={(e) => setSections({ ...sections, events: { ...sections.events, title: e.target.value } })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              <input type="date" value={sections.events.date} onChange={(e) => setSections({ ...sections, events: { ...sections.events, date: e.target.value } })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
              <div>
                {sections.events.image && <div className="mb-2 w-full h-32 rounded-lg overflow-hidden"><img src={sections.events.image as string} alt="Events" className="w-full h-full object-cover" /></div>}
                <label className="block px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary transition">
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'events')} disabled={saving} className="hidden" />
                  <div className="flex items-center justify-center gap-2 text-gray-600">
                    <Upload className="w-5 h-5" />
                    <span>Upload Image</span>
                  </div>
                </label>
              </div>
              <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </button>
            </form>
          )}
        </div>

        {/* Donation Impact Stats */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('donationimpact')}
            className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 transition flex items-center gap-3"
          >
            <SectionHeader title="💝 Impact of Donations" isOpen={expandedSections.has('donationimpact')} />
          </button>
          {expandedSections.has('donationimpact') && (
            <form onSubmit={(e) => handleSaveSection(e, 'donationimpact')} className="p-6 border-t border-gray-200 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Donated (in ₹)</label>
                <input type="number" placeholder="e.g., 5000000" value={(sections.donationimpact as any).total_donated} onChange={(e) => setSections({ ...sections, donationimpact: { ...(sections.donationimpact as any), total_donated: e.target.value } })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Scholarships Awarded</label>
                <input type="number" placeholder="e.g., 500" value={(sections.donationimpact as any).scholarships_awarded} onChange={(e) => setSections({ ...sections, donationimpact: { ...(sections.donationimpact as any), scholarships_awarded: e.target.value } })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Events Organized</label>
                <input type="number" placeholder="e.g., 100" value={(sections.donationimpact as any).events_organized} onChange={(e) => setSections({ ...sections, donationimpact: { ...(sections.donationimpact as any), events_organized: e.target.value } })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" />
              </div>
              <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </button>
            </form>
          )}
        </div>

        {/* Gallery Section */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('gallery')}
            className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 transition flex items-center gap-3"
          >
            <SectionHeader title="🖼️ Gallery (Alumni Moments)" isOpen={expandedSections.has('gallery')} />
          </button>
          {expandedSections.has('gallery') && (
            <form onSubmit={handleSaveGallery} className="p-6 border-t border-gray-200 space-y-4">
              {gallery.images.length > 0 && <div className="grid grid-cols-3 gap-3">{gallery.images.map((image, idx) => <div key={idx} className="relative group"><img src={image || ''} alt={`Gallery ${idx}`} className="w-full h-24 object-cover rounded-lg" /><button type="button" onClick={() => handleRemoveGalleryImage(idx)} className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition">✕</button></div>)}</div>}
              <label className="block px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary transition">
                <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.readAsDataURL(file); reader.onload = () => setGallery({ images: [...gallery.images, reader.result as string] }); } }} disabled={saving} className="hidden" />
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <Upload className="w-5 h-5" />
                  <span>Add Image</span>
                </div>
              </label>
              <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default ContentManager
