import api from './api'

export const alumniAchievementAPI = {
  getAchievements: async () => {
    const response = await api.get('/alumni/achievements')
    return response.data
  },
  getAchievement: async (id: string) => {
    const response = await api.get(`/alumni/achievements/${id}`)
    return response.data
  },
  createAchievement: async (data: any) => {
    const response = await api.post('/alumni/achievements', data)
    return response.data
  },
  updateAchievement: async (id: string, data: any) => {
    const response = await api.put(`/alumni/achievements/${id}`, data)
    return response.data
  },
  deleteAchievement: async (id: string) => {
    const response = await api.delete(`/alumni/achievements/${id}`)
    return response.data
  }
}

export default alumniAchievementAPI
