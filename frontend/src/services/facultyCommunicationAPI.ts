import api from './api'

export const facultyCommunicationAPI = {
  sendEmail: async (data: {recipients: string[]; subject: string; message: string}) => {
    const response = await api.post('/faculty/communication/sendemail', data)
    return response.data
  },
  getEmailHistory: async () => {
    const response = await api.get('/faculty/communication/history')
    return response.data
  }
}

export default facultyCommunicationAPI
