import api from './api'

export const notificationAPI = {
  getNotifications: async (filters?: {read?: boolean; category?: string}) => {
    const response = await api.get('/notifications', { params: filters })
    return response.data
  },
  markAsRead: async (id: string) => {
    const response = await api.put(`/notifications/${id}/read`)
    return response.data
  },
  markAllAsRead: async () => {
    const response = await api.post('/notifications/mark-all-read')
    return response.data
  },
  deleteNotification: async (id: string) => {
    const response = await api.delete(`/notifications/${id}`)
    return response.data
  }
}

export default notificationAPI
