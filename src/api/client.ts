// API Client
// Currently uses mock data - will be replaced with real API calls when backend is ready

import { isMockMode } from './config';
import {
  mockLoanApi,
  mockBorrowerApi,
  mockCollateralApi,
  mockCommentApi,
  mockPaymentApi,
  mockProjectionSettingsApi,
  mockExitSettingsApi
} from './mockApi';

// When you have a real backend, import axios here:
// import axios from 'axios';
// import { API_CONFIG } from './config';

// For now, export mock API as the client
// Later, this will be replaced with real HTTP calls

export const loanApi = mockLoanApi;
export const borrowerApi = mockBorrowerApi;
export const collateralApi = mockCollateralApi;
export const commentApi = mockCommentApi;
export const paymentApi = mockPaymentApi;
export const projectionSettingsApi = mockProjectionSettingsApi;
export const exitSettingsApi = mockExitSettingsApi;

// Example of how this will look with real backend:
/*
const apiClient = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: API_CONFIG.headers
});

// Add auth token interceptor
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add error handling interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const loanApi = {
  getAll: () => apiClient.get('/loans').then(r => r.data),
  getById: (id: string) => apiClient.get(`/loans/${id}`).then(r => r.data),
  create: (loan: Loan) => apiClient.post('/loans', loan).then(r => r.data),
  update: (id: string, updates: Partial<Loan>) =>
    apiClient.put(`/loans/${id}`, updates).then(r => r.data),
  delete: (id: string) => apiClient.delete(`/loans/${id}`).then(r => r.data)
};
// ... same for other APIs
*/

export { isMockMode };
