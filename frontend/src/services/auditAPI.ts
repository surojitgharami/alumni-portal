import api from './api'

export const auditAPI = {
  getLogs: async (filters?: {user?: string; action?: string; date?: string}) => {
    const response = await api.get('/admin/logs', { params: filters })
    return response.data
  },
  getLog: async (id: string) => {
    const response = await api.get(`/admin/logs/${id}`)
    return response.data
  },
  exportLogs: async (filters?: any) => {
    const response = await api.get('/admin/logs/export', { params: filters })
    return response.data
  }
}

export default auditAPI
