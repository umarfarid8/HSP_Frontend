import api from './axios'

export const invoiceApi = {
  getByBookingId: (bookingId) =>
    api.get(`/invoices/booking/${bookingId}`),

  confirmCash: (invoiceId) =>
    api.post(`/invoices/${invoiceId}/confirm-cash`),

  // Returns a PDF blob — handled specially in the component
  download: (invoiceId) =>
    api.get(`/invoices/${invoiceId}/download`, { responseType: 'blob' }),
}