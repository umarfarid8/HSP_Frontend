import api from './axios'

export const customerApi = {
  getMyProfile:   ()     => api.get('/customers/profile'),
  updateProfile:  (data) => api.put('/customers/profile', data),
}