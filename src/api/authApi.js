import api from './axios'

export const authApi = {
  registerCustomer: (data) => api.post('/auth/register/customer', data),
  registerProvider: (data) => api.post('/auth/register/provider', data),
  login:           (data) => api.post('/auth/login', data),
  googleLogin:     (data) => api.post('/auth/google', data),
  verifyEmail:     (token) => api.get(`/auth/verify-email?token=${token}`),
}