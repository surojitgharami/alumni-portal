import api from './api'

export const announcementAPI = {
  getAnnouncements: async () => {
    const response = await api.get('/faculty/announcements')
    return response.data
  },
  createAnnouncement: async (data: {title: string; content: string; visible_to?: string[]}) => {
    const response = await api.post('/faculty/announcements', data)
    return response.data
  },
  updateAnnouncement: async (id: string, data: any) => {
    const response = await api.put(`/faculty/announcements/${id}`, data)
    return response.data
  },
  deleteAnnouncement: async (id: string) => {
    const response = await api.delete(`/faculty/announcements/${id}`)
    return response.data
  }
}

export default announcementAPI
