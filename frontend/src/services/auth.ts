import api from './api'

interface VerifyRegistrationData {
  registration_number: string
  department: string
  passout_year: number
}

interface SignupData {
  name: string
  dob: string
  department: string
  phone: string
  email: string
  registration_number: string
  passout_year: number
  password: string
}

interface LoginData {
  email: string
  password: string
}

export const verifyRegistration = async (data: VerifyRegistrationData) => {
  const response = await api.post('/api/auth/verify-registration', data)
  return response.data
}

export const signup = async (data: SignupData) => {
  const response = await api.post('/api/auth/signup', data)
  return response.data
}

export const login = async (data: LoginData) => {
  const response = await api.post('/api/auth/login', data)
  return response.data
}

export const adminLogin = async (data: LoginData) => {
  const response = await api.post('/api/admin/login', data)
  return response.data
}

export const getCurrentUser = async () => {
  const response = await api.get('/api/auth/me')
  return response.data
}

export const updateProfile = async (data: Partial<SignupData>) => {
  const response = await api.patch('/api/auth/me', data)
  return response.data
}

export const getStoredToken = (): string | null => {
  return localStorage.getItem('token')
}

export const getStoredUser = () => {
  const userStr = localStorage.getItem('user')
  if (userStr) {
    try {
      return JSON.parse(userStr)
    } catch {
      return null
    }
  }
  return null
}

export const clearAuth = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}
