import { useState, useEffect } from 'react';
import { Bell, Mail, Calendar, Briefcase, MoreVertical } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: 'payment' | 'event' | 'job' | 'general';
  created_at: string;
  read: boolean;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/notifications`,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
      );
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/notifications/${id}/read`,
        {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }
      );
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <Mail className="text-green-500" size={20} />;
      case 'event':
        return <Calendar className="text-blue-500" size={20} />;
      case 'job':
        return <Briefcase className="text-purple-500" size={20} />;
      default:
        return <Bell className="text-gray-500" size={20} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Notifications</h1>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Bell size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`bg-white rounded-lg shadow p-4 flex items-start gap-4 hover:shadow-md transition ${
                  !notif.read ? 'border-l-4 border-[#0F4C81]' : ''
                }`}
              >
                <div className="flex-shrink-0 mt-1">
                  {getIcon(notif.notification_type)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{notif.title}</h3>
                  <p className="text-gray-600 text-sm mt-1">{notif.message}</p>
                  <p className="text-gray-500 text-xs mt-2">
                    {new Date(notif.created_at).toLocaleDateString()} at {new Date(notif.created_at).toLocaleTimeString()}
                  </p>
                </div>
                {!notif.read && (
                  <button
                    onClick={() => markAsRead(notif.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <MoreVertical size={20} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
