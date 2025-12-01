import { useState, useEffect } from 'react'
import { useAuth } from '../../App'
import { CheckCircle, Clock, Users } from 'lucide-react'

export default function FacultyActivity() {
  const { token } = useAuth()
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/faculty/activity`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setActivities(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'approval': return <CheckCircle className="text-green-600" size={20} />
      case 'pending': return <Clock className="text-yellow-600" size={20} />
      case 'engagement': return <Users className="text-blue-600" size={20} />
      default: return <Clock size={20} />
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Activity Timeline</h1>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center p-6">Loading...</div>
        ) : activities.length === 0 ? (
          <div className="text-center p-6 text-gray-500">No activities yet</div>
        ) : (
          activities.map((activity: any) => (
            <div key={activity.id} className="bg-white p-4 rounded-lg border-l-4 border-blue-600">
              <div className="flex items-start gap-4">
                <div className="mt-1">{getIcon(activity.type)}</div>
                <div className="flex-1">
                  <h3 className="font-semibold">{activity.title}</h3>
                  <p className="text-gray-600 text-sm">{activity.description}</p>
                  <p className="text-xs text-gray-400 mt-2">{new Date(activity.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
