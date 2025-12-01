import api from './api'

export const noticeAPI = {
  getNotices: async () => {
    const response = await api.get('/admin/notices')
    return response.data
  },
  createNotice: async (data: {title: string; content: string; department?: string}) => {
    const response = await api.post('/admin/notices', data)
    return response.data
  },
  updateNotice: async (id: string, data: any) => {
    const response = await api.put(`/admin/notices/${id}`, data)
    return response.data
  },
  deleteNotice: async (id: string) => {
    const response = await api.delete(`/admin/notices/${id}`)
    return response.data
  }
}

export default noticeAPI
