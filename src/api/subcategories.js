import API from './axios';

export const getSubCategories = (category = '') => {
  const url = category ? `/subcategories?category=${category}` : '/subcategories';
  return API.get(url);
};

export const createSubCategory = (data) => API.post('/subcategories', data);
export const updateSubCategory = (id, data) => API.put(`/subcategories/${id}`, data);
export const deleteSubCategory = (id) => API.delete(`/subcategories/${id}`);
export const lockSubCategoriesByCategory = (categoryId) => API.put(`/subcategories/lock-by-category/${categoryId}`);
