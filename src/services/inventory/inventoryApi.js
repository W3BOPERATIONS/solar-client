import api from '../../api/axios';

const inventoryApi = {
    // Inventory Items
    createItem: (data) => api.post('/inventory/items', data),
    getItems: (params) => api.get('/inventory/items', { params }),
    updateItem: (id, data) => api.patch(`/inventory/items/${id}`, data),
    deleteItem: (id) => api.delete(`/inventory/items/${id}`),

    // Summary
    getSummary: (params) => api.get('/inventory/summary', { params }),

    // Brands
    createBrand: (data) => api.post('/inventory/brands', data),
    getBrands: () => api.get('/inventory/brands'),
    getBrandOverview: (params) => api.get('/inventory/brand-overview', { params }),

    // Restock Limits
    getRestockLimits: (params) => api.get('/inventory/restock-limits', { params }),
    setRestockLimit: (data) => api.post('/inventory/restock-limits', data),

    // Warehouses
    getAllWarehouses: (params) => api.get('/inventory/warehouses', { params }),
    getWarehouseById: (id) => api.get(`/inventory/warehouses/${id}`),
    createWarehouse: (data) => api.post('/inventory/warehouses', data),
    updateWarehouse: (id, data) => api.patch(`/inventory/warehouses/${id}`, data),
    deleteWarehouse: (id) => api.delete(`/inventory/warehouses/${id}`),
};

export default inventoryApi;
