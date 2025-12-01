import api from './api'

export const moderationAPI = {
  getReports: async (status?: string) => {
    const response = await api.get(`/admin/moderation?status=${status || 'all'}`)
    return response.data
  },
  approvePost: async (postId: string) => {
    const response = await api.post(`/admin/moderation/${postId}/approve`)
    return response.data
  },
  deletePost: async (postId: string) => {
    const response = await api.delete(`/admin/moderation/${postId}`)
    return response.data
  },
  banUser: async (userId: string) => {
    const response = await api.post(`/admin/moderation/ban`, { user_id: userId })
    return response.data
  }
}

export default moderationAPI
