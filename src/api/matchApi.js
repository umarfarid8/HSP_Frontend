import api from './axios'

export const matchApi = {
  findProviders: (data) => api.post('/match', data),
}