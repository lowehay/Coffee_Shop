import api from '../../../services/api';

// API service for ingredients management
export const ingredientsApi = {
  // Categories
  getCategories: () => {
    return api.get('/api/ingredients/categories/');
  },
  
  getCategory: (id) => {
    return api.get(`/api/ingredients/categories/${id}/`);
  },
  
  createCategory: (data) => {
    return api.post('/api/ingredients/categories/', data);
  },
  
  updateCategory: (id, data) => {
    return api.put(`/api/ingredients/categories/${id}/`, data);
  },
  
  deleteCategory: (id) => {
    return api.delete(`/api/ingredients/categories/${id}/`);
  },
  
  // Ingredients
  getIngredients: (params = {}) => {
    return api.get('/api/ingredients/ingredients/', { params });
  },
  
  getIngredient: (id) => {
    return api.get(`/api/ingredients/ingredients/${id}/`);
  },
  
  createIngredient: (data) => {
    return api.post('/api/ingredients/ingredients/', data);
  },
  
  updateIngredient: (id, data) => {
    return api.put(`/api/ingredients/ingredients/${id}/`, data);
  },
  
  deleteIngredient: (id) => {
    return api.delete(`/api/ingredients/ingredients/${id}/`);
  }
};
