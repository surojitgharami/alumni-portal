import api from './api'

export const discussionAPI = {
  getPosts: async (filters?: {category?: string; sort?: string}) => {
    const response = await api.get('/discussion', { params: filters })
    return response.data
  },
  createPost: async (data: {title: string; content: string; category?: string}) => {
    const response = await api.post('/discussion', data)
    return response.data
  },
  updatePost: async (id: string, data: any) => {
    const response = await api.put(`/discussion/${id}`, data)
    return response.data
  },
  deletePost: async (id: string) => {
    const response = await api.delete(`/discussion/${id}`)
    return response.data
  },
  reportPost: async (id: string, reason: string) => {
    const response = await api.post(`/discussion/${id}/report`, {reason})
    return response.data
  },
  likePost: async (id: string) => {
    const response = await api.post(`/discussion/${id}/like`)
    return response.data
  }
}

export default discussionAPI
