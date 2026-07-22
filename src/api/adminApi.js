import api from './axios'

export const adminApi = {
  // Dashboard
  getDashboard: ()        => api.get('/admin/dashboard'),

  // Users
  getUsers:         (params)   => api.get('/admin/users', { params }),
  toggleUserStatus: (userId)   => api.patch(`/admin/users/${userId}/toggle-status`),

  // Verifications
  getPendingVerifications: ()          => api.get('/admin/verifications/pending'),
  approveVerification:     (id)        => api.post(`/admin/verifications/${id}/approve`),
  rejectVerification:      (id, data)  => api.post(`/admin/verifications/${id}/reject`, data),

  // Disputes
  getDisputes:    ()          => api.get('/admin/disputes'),
  getDispute:     (id)        => api.get(`/admin/disputes/${id}`),
  resolveDispute: (id, data)  => api.post(`/admin/disputes/${id}/resolve`, data),

  // Analytics
  getAnalytics: () => api.get('/admin/analytics'),

  // Moderation
  getModerationQueue: ()          => api.get('/admin/moderation/queue'),
  moderateReview:     (id, data)  => api.post(`/admin/moderation/${id}/decide`, data),

  // Logs
  getLogs: (params) => api.get('/admin/logs', { params }),

  // Add these to the existing adminApi object:

// Categories
getCategories:    ()       => api.get('/admin/categories'),
createCategory:   (data)   => api.post('/admin/categories', data),
updateCategory:   (id, data) => api.put(`/admin/categories/${id}`, data),
toggleCategory:   (id)     => api.patch(`/admin/categories/${id}/toggle`),

// Prompt Templates
getPromptTemplates:    ()       => api.get('/admin/prompt-templates'),
updatePromptTemplate:  (id, data) => api.put(`/admin/prompt-templates/${id}`, data),
}