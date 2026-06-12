import api from './axios'

export const providerApi = {
  getMyProfile:    ()     => api.get('/providers/profile'),
  updateProfile:   (data) => api.put('/providers/profile', data),
  uploadDocument:  (data) => api.post('/providers/documents', data),
  getPublicProfile:(id)   => api.get(`/providers/${id}/public`),
}