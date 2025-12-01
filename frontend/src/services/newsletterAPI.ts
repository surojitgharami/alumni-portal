import api from './api'

export const newsletterAPI = {
  getNewsletters: async () => {
    const response = await api.get('/faculty/newsletters')
    return response.data
  },
  uploadNewsletter: async (file: File, metadata: {title: string; date: string}) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', metadata.title)
    formData.append('date', metadata.date)
    const response = await api.post('/faculty/newsletters/upload', formData)
    return response.data
  },
  publishNewsletter: async (id: string) => {
    const response = await api.post(`/faculty/newsletters/${id}/publish`)
    return response.data
  },
  deleteNewsletter: async (id: string) => {
    const response = await api.delete(`/faculty/newsletters/${id}`)
    return response.data
  }
}

export default newsletterAPI
