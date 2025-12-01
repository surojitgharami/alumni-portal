import api from './api'

export const facultyActivityAPI = {
  getActivity: async (timeframe?: string) => {
    const response = await api.get(`/faculty/activity?timeframe=${timeframe || '30d'}`)
    return response.data
  },
  getAnalytics: async () => {
    const response = await api.get('/faculty/analytics')
    return response.data
  }
}

export default facultyActivityAPI
