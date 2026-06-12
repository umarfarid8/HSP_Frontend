import api from './axios'

export const bookingApi = {
  getMyBookings:    ()        => api.get('/bookings'),
  getById:          (id)      => api.get(`/bookings/${id}`),
  create:           (data)    => api.post('/bookings', data),
  updateStatus:     (id, data)=> api.put(`/bookings/${id}/status`, data),
}