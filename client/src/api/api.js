import axios from 'axios';
const api = axios.create({ baseURL: '/api' });
export default api;

export const get    = (url, p) => api.get(url, { params: p }).then(r => r.data);
export const post   = (url, d) => api.post(url, d).then(r => r.data);
export const put    = (url, d) => api.put(url, d).then(r => r.data);
export const del    = (url)    => api.delete(url).then(r => r.data);
