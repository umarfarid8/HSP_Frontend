import api from './axios'

export const chatbotApi = {
  sendMessage: (messages) => api.post('/chatbot/message', { messages }),
}