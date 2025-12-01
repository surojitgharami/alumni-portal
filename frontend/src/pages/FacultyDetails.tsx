import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, Phone, MapPin, Briefcase, Building2, Loader2 } from 'lucide-react'
import api from '../services/api'
import Card from '../components/Card'

interface Faculty {
  id: string
  name: string
  email: string
  department: string
  phone: string
  profile_photo_url?: string
  professional?: {
    designation?: string
    company?: string
    industry?: string
  }
  bio?: string
  location?: string
}

const PRIMARY_COLOR = '#0F4C81'
const ACCENT_COLOR = '#FF8A00'
const BG_COLOR = '#F5F7FA'

export default function FacultyDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [faculty, setFaculty] = useState<Faculty | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        const response = await api.get(`/api/faculty/${id}`)
        setFaculty(response.data)
      } catch (err) {
        setError('Failed to load faculty details')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchFaculty()
    }
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: BG_COLOR }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: PRIMARY_COLOR }} />
      </div>
    )
  }

  if (error || !faculty) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: BG_COLOR }}>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={() => navigate('/faculty')}
            className="flex items-center gap-2 mb-6"
            style={{ color: PRIMARY_COLOR }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Faculty
          </button>
          <Card>
            <p className="text-red-600">{error || 'Faculty not found'}</p>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: BG_COLOR }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/faculty')}
          className="flex items-center gap-2 mb-6"
          style={{ color: PRIMARY_COLOR }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Faculty
        </button>

        <Card>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Profile Section */}
            <div className="md:col-span-1 flex flex-col items-center">
              {faculty.profile_photo_url ? (
                <img
                  src={faculty.profile_photo_url}
                  alt={faculty.name}
                  className="w-40 h-40 rounded-lg object-cover mb-4 border-4"
                  style={{ borderColor: PRIMARY_COLOR }}
                />
              ) : (
                <div
                  className="w-40 h-40 rounded-lg mb-4 flex items-center justify-center border-4"
                  style={{ backgroundColor: ACCENT_COLOR + '20', borderColor: PRIMARY_COLOR }}
                >
                  <span className="text-4xl font-bold" style={{ color: PRIMARY_COLOR }}>
                    {faculty.name.charAt(0)}
                  </span>
                </div>
              )}
              <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">{faculty.name}</h1>
              <div
                className="px-4 py-2 rounded-full text-white text-sm font-semibold"
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                {faculty.department}
              </div>
            </div>

            {/* Details Section */}
            <div className="md:col-span-2 space-y-6">
              {/* Contact Information */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Contact Information</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5" style={{ color: PRIMARY_COLOR }} />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <a
                        href={`mailto:${faculty.email}`}
                        className="font-medium text-gray-900 hover:underline"
                      >
                        {faculty.email}
                      </a>
                    </div>
                  </div>
                  {faculty.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5" style={{ color: PRIMARY_COLOR }} />
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <a
                          href={`tel:${faculty.phone}`}
                          className="font-medium text-gray-900 hover:underline"
                        >
                          {faculty.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  {faculty.location && (
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5" style={{ color: PRIMARY_COLOR }} />
                      <div>
                        <p className="text-sm text-gray-600">Location</p>
                        <p className="font-medium text-gray-900">{faculty.location}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Professional Information */}
              {(faculty.professional?.designation || faculty.professional?.company) && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Professional Information</h2>
                  <div className="space-y-3">
                    {faculty.professional?.designation && (
                      <div className="flex items-start gap-3">
                        <Briefcase className="w-5 h-5 mt-1" style={{ color: PRIMARY_COLOR }} />
                        <div>
                          <p className="text-sm text-gray-600">Designation</p>
                          <p className="font-medium text-gray-900">{faculty.professional.designation}</p>
                        </div>
                      </div>
                    )}
                    {faculty.professional?.company && (
                      <div className="flex items-start gap-3">
                        <Building2 className="w-5 h-5 mt-1" style={{ color: PRIMARY_COLOR }} />
                        <div>
                          <p className="text-sm text-gray-600">Company/Organization</p>
                          <p className="font-medium text-gray-900">{faculty.professional.company}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Bio */}
              {faculty.bio && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">About</h2>
                  <p className="text-gray-700 leading-relaxed">{faculty.bio}</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
