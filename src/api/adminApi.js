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
}