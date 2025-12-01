import api from './api'

export const galleryAPI = {
  getImages: async () => {
    const response = await api.get('/faculty/gallery')
    return response.data
  },
  uploadImage: async (file: File, albumName?: string) => {
    const formData = new FormData()
    formData.append('file', file)
    if (albumName) formData.append('album', albumName)
    const response = await api.post('/faculty/gallery/upload', formData)
    return response.data
  },
  deleteImage: async (imageId: string) => {
    const response = await api.delete(`/faculty/gallery/${imageId}`)
    return response.data
  }
}

export default galleryAPI
