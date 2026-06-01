import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const client = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Redirect to login on 401
client.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const productsApi = {
  list: (params) => client.get('/products', { params }),
  get: (id) => client.get(`/products/${id}`),
  create: (data) => client.post('/products', data),
  update: (id, data) => client.put(`/products/${id}`, data),
  delete: (id) => client.delete(`/products/${id}`),
}

export const customersApi = {
  list: (params) => client.get('/customers', { params }),
  get: (id) => client.get(`/customers/${id}`),
  create: (data) => client.post('/customers', data),
  update: (id, data) => client.put(`/customers/${id}`, data),
  delete: (id) => client.delete(`/customers/${id}`),
}

export const ordersApi = {
  list: (params) => client.get('/orders', { params }),
  get: (id) => client.get(`/orders/${id}`),
  create: (data) => client.post('/orders', data),
  update: (id, data) => client.patch(`/orders/${id}`, data),
  delete: (id) => client.delete(`/orders/${id}`),
}

export const statsApi = {
  get: () => client.get('/stats'),
}
