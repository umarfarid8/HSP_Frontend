import api from './axios'

export const messageApi = {
  getThreads:     ()               => api.get('/messages/threads'),
  getThread:      (threadId)       => api.get(`/messages/threads/${threadId}`),
  sendMessage:    (threadId, data) => api.post(`/messages/threads/${threadId}`, data),
  getUnreadCount: ()               => api.get('/messages/unread-count'),
}