import axios from 'axios';

// Get base URL from environment variables or default to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const salesSettingsService = {
    // Dashboard Stats
    getDashboardStats: async () => {
        const response = await api.get('/sales-settings/dashboard-stats');
        return response.data;
    },

    // Set Price
    createSetPrice: async (data) => {
        const response = await api.post('/sales-settings/set-price', data);
        return response.data;
    },
    getSetPrices: async (filters = {}) => {
        const response = await api.get('/sales-settings/set-price', { params: filters });
        return response.data;
    },
    updateSetPrice: async (id, data) => {
        const response = await api.put(`/sales-settings/set-price/${id}`, data);
        return response.data;
    },
    deleteSetPrice: async (id) => {
        const response = await api.delete(`/sales-settings/set-price/${id}`);
        return response.data;
    },

    // Set Price AMC
    createSetPriceAmc: async (data) => {
        const response = await api.post('/sales-settings/set-price-amc', data);
        return response.data;
    },
    getSetPricesAmc: async (filters = {}) => {
        const response = await api.get('/sales-settings/set-price-amc', { params: filters });
        return response.data;
    },
    updateSetPriceAmc: async (id, data) => {
        const response = await api.put(`/sales-settings/set-price-amc/${id}`, data);
        return response.data;
    },
    deleteSetPriceAmc: async (id) => {
        const response = await api.delete(`/sales-settings/set-price-amc/${id}`);
        return response.data;
    },

    // Offers
    createOffer: async (data) => {
        const response = await api.post('/sales-settings/offers', data);
        return response.data;
    },
    getOffers: async (filters = {}) => {
        const response = await api.get('/sales-settings/offers', { params: filters });
        return response.data;
    },
    updateOffer: async (id, data) => {
        const response = await api.put(`/sales-settings/offers/${id}`, data);
        return response.data;
    },
    deleteOffer: async (id) => {
        const response = await api.delete(`/sales-settings/offers/${id}`);
        return response.data;
    },

    // Solar Bundles
    createBundle: async (data) => {
        const response = await api.post('/sales-settings/bundles', data);
        return response.data;
    },
    getBundles: async () => {
        const response = await api.get('/sales-settings/bundles');
        return response.data;
    },
    updateBundle: async (id, data) => {
        const response = await api.put(`/sales-settings/bundles/${id}`, data);
        return response.data;
    },
    deleteBundle: async (id) => {
        const response = await api.delete(`/sales-settings/bundles/${id}`);
        return response.data;
    }
};

export default salesSettingsService;
