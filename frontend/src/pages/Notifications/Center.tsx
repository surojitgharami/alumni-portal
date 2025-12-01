import { useState, useEffect } from 'react'
import { useAuth } from '../../App'
import { Trash2, Check } from 'lucide-react'

// Global notification center for all users

export default function NotificationCenter() {
  const { token } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchNotifications()
  }, [])
  
  const fetchNotifications = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await response.json()
      setNotifications(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchNotifications()
    } catch (error) {
      console.error('Error:', error)
    }
  }
  
  const deleteNotification = async (notificationId: string) => {
    try {
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchNotifications()
    } catch (error) {
      console.error('Error:', error)
    }
  }
  
  if (loading) return <div className="p-6">Loading notifications...</div>
  
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Notifications</h1>
      
      {notifications.length === 0 ? (
        <p className="text-gray-500">No notifications</p>
      ) : (
        <div className="space-y-4">
          {notifications.map((notif: any) => (
            <div
              key={notif.id}
              className={`p-4 rounded-lg border ${notif.isRead ? 'bg-gray-50' : 'bg-blue-50'}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{notif.title}</h3>
                  <p className="text-gray-600 text-sm">{notif.message}</p>
                  <p className="text-xs text-gray-400 mt-2">{notif.createdAt}</p>
                </div>
                <div className="flex gap-2">
                  {!notif.isRead && (
                    <button
                      onClick={() => markAsRead(notif.id)}
                      className="text-blue-600 hover:bg-blue-100 p-2 rounded"
                    >
                      <Check size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notif.id)}
                    className="text-red-600 hover:bg-red-100 p-2 rounded"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
