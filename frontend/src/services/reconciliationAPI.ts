import api from './api'

export const reconciliationAPI = {
  getPayments: async (filters?: {status?: string; date?: string}) => {
    const response = await api.get('/admin/payments/reconcile', { params: filters })
    return response.data
  },
  retryPayment: async (paymentId: string) => {
    const response = await api.post(`/admin/payments/retry`, { payment_id: paymentId })
    return response.data
  },
  getWebhookLogs: async () => {
    const response = await api.get('/admin/webhooks/logs')
    return response.data
  }
}

export default reconciliationAPI
