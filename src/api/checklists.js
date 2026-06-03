import API from './axios';

export const getChecklists = () => API.get('/checklists');
export const getChecklist = (id) => API.get(`/checklists/${id}`);
export const createChecklist = (data) => API.post('/checklists', data);
export const updateChecklist = (id, data) => API.put(`/checklists/${id}`, data);
export const deleteChecklist = (id) => API.delete(`/checklists/${id}`);
