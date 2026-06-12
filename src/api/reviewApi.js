import api from './axios'

export const reviewApi = {
  getProviderReviews: (providerProfileId) =>
    api.get(`/reviews/provider/${providerProfileId}`),
  submitReview: (data) => api.post('/reviews', data),
}