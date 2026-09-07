import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const analyticsService = {
  getSummary: () => api.get('/analytics/summary').then(res => res.data),
};

export const currencyService = {
  list: () => api.get('/currencies').then(res => res.data),
  update: (code: string, data: any) => api.put(`/currencies/${code}`, data).then(res => res.data),
  create: (data: any) => api.post('/currencies', data).then(res => res.data),
};

export const bankService = {
  list: () => api.get('/banks').then(res => res.data),
  create: (data: any) => api.post('/banks', data).then(res => res.data),
  update: (id: string, data: any) => api.put(`/banks/${id}`, data).then(res => res.data),
  delete: (id: string) => api.delete(`/banks/${id}`).then(res => res.data),
  transfer: (data: any) => api.post('/banks/transfer', data).then(res => res.data),
  listTransfers: () => api.get('/banks/transfers/history').then(res => res.data),
};

export const providerService = {
  list: () => api.get('/providers').then(res => res.data),
  create: (data: any) => api.post('/providers', data).then(res => res.data),
  update: (id: string, data: any) => api.put(`/providers/${id}`, data).then(res => res.data),
  delete: (id: string) => api.delete(`/providers/${id}`).then(res => res.data),
};

export const serverService = {
  list: (status?: string) => api.get('/servers', { params: { status } }).then(res => res.data),
  get: (id: string) => api.get(`/servers/${id}`).then(res => res.data),
  create: (data: any) => api.post('/servers', data).then(res => res.data),
  update: (id: string, data: any) => api.put(`/servers/${id}`, data).then(res => res.data),
  delete: (id: string) => api.delete(`/servers/${id}`).then(res => res.data),
  powerAction: (id: string, action: string) => api.post(`/servers/${id}/action`, { action }).then(res => res.data),
  release: (id: string) => api.post(`/servers/${id}/release`).then(res => res.data),
  addIp: (id: string, data: any) => api.post(`/servers/${id}/ips`, data).then(res => res.data),
  deleteIp: (id: string, ipId: string) => api.delete(`/servers/${id}/ips/${ipId}`).then(res => res.data),
};

export const clientService = {
  list: () => api.get('/clients').then(res => res.data),
  get: (id: string) => api.get(`/clients/${id}`).then(res => res.data),
  create: (data: any) => api.post('/clients', data).then(res => res.data),
  update: (id: string, data: any) => api.put(`/clients/${id}`, data).then(res => res.data),
  delete: (id: string) => api.delete(`/clients/${id}`).then(res => res.data),
  depositWallet: (clientId: string, data: any) => api.post(`/clients/${clientId}/wallet/deposit`, data).then(res => res.data),
};

export const subscriptionService = {
  list: () => api.get('/subscriptions').then(res => res.data),
  create: (data: any) => api.post('/subscriptions', data).then(res => res.data),
};

export const invoiceService = {
  list: () => api.get('/invoices').then(res => res.data),
  createManual: (data: any) => api.post('/invoices/manual', data).then(res => res.data),
  recordPayment: (invoiceId: string, data: any) => api.post(`/invoices/${invoiceId}/pay`, data).then(res => res.data),
  autoDebit: (invoiceId: string) => api.post(`/invoices/${invoiceId}/auto-debit`).then(res => res.data),
  delete: (id: string) => api.delete(`/invoices/${id}`).then(res => res.data),
  downloadPdfUrl: (invoiceId: string) => `/api/v1/invoices/${invoiceId}/pdf`,
};

export default api;
