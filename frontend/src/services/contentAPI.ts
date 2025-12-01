import api from './api'

export const contentAPI = {
  getContent: async () => {
    const response = await api.get('/admin/content')
    return response.data
  },
  updateContent: async (section: string, data: any) => {
    const response = await api.put(`/admin/content/${section}`, data)
    return response.data
  },
  uploadImage: async (file: File, section: string) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('section', section)
    const response = await api.post('/admin/content/upload', formData)
    return response.data
  }
}

export default contentAPI
