import api from './axios'

export const serviceCategoryApi = {
  getAll: () => api.get('/service-categories'),
}