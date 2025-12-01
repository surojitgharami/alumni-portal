import api from './api'

export const rateLimitAPI = {
  getRateLimits: async () => {
    const response = await api.get('/admin/rate-limits')
    return response.data
  },
  blockIP: async (ip: string, duration: number) => {
    const response = await api.post('/admin/rate-limits/block', {ip, duration})
    return response.data
  },
  unblockIP: async (ip: string) => {
    const response = await api.delete(`/admin/rate-limits/${ip}`)
    return response.data
  }
}

export default rateLimitAPI
