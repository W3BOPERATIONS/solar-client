import axiosInstance from './axios';

export const productApi = {
    // Products
    getAll: (params) => axiosInstance.get('/products', { params }),
    getById: (id) => axiosInstance.get(`/products/${id}`),
    create: (data) => axiosInstance.post('/products', data),
    update: (id, data) => axiosInstance.put(`/products/${id}`, data),
    delete: (id) => axiosInstance.delete(`/products/${id}`),

    // Project Types
    getProjectTypes: (params) => axiosInstance.get('/masters/project-types', { params }),
    createProjectType: (data) => axiosInstance.post('/masters/project-types', data),
    updateProjectType: (id, data) => axiosInstance.put(`/masters/project-types/${id}`, data),
    deleteProjectType: (id) => axiosInstance.delete(`/masters/project-types/${id}`),

    // Categories
    getCategories: (params) => axiosInstance.get('/masters/categories', { params }),
    createCategory: (data) => axiosInstance.post('/masters/categories', data),
    updateCategory: (id, data) => axiosInstance.put(`/masters/categories/${id}`, data),
    deleteCategory: (id) => axiosInstance.delete(`/masters/categories/${id}`),

    // Units
    getUnits: (params) => axiosInstance.get('/masters/units', { params }),
    createUnit: (data) => axiosInstance.post('/masters/units', data),
    updateUnit: (id, data) => axiosInstance.put(`/masters/units/${id}`, data),
    deleteUnit: (id) => axiosInstance.delete(`/masters/units/${id}`),

    // SKUs
    getSkus: (params) => axiosInstance.get('/masters/skus', { params }),
    createSku: (data) => axiosInstance.post('/masters/skus', data),
    updateSku: (id, data) => axiosInstance.put(`/masters/skus/${id}`, data),
    deleteSku: (id) => axiosInstance.delete(`/masters/skus/${id}`),

    // Price Master
    getPriceMasters: (params) => axiosInstance.get('/masters/price-master', { params }),
    createPriceMaster: (data) => axiosInstance.post('/masters/price-master', data),
    updatePriceMaster: (id, data) => axiosInstance.put(`/masters/price-master/${id}`, data),
    deletePriceMaster: (id) => axiosInstance.delete(`/masters/price-master/${id}`),
};
