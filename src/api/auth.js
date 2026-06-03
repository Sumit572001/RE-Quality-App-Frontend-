import API from './axios';

export const loginUser = (credentials) => API.post('/auth/login', credentials);
export const registerUser = (data) => API.post('/auth/register', data);
export const getMe = () => API.get('/auth/me');
