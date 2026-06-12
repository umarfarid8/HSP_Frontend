import api from './axios'

export const availabilityApi = {
  getProviderAvailability: (providerProfileId, date) =>
    api.get(`/availability/provider/${providerProfileId}?date=${date}`),
  setWeeklySchedule: (data) => api.put('/availability/schedule', data),
  getMySchedule:     ()     => api.get('/availability/my-schedule'),
}