import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/vendors`; // Adjust base URL as needed

// Helper to get token (if auth is required)
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

// ==================== INSTALLER VENDORS ====================

export const getInstallerVendors = async (params = {}) => {
    const response = await axios.get(`${API_URL}/installer-vendors`, { ...getAuthHeaders(), params });
    return response.data;
};

export const createInstallerVendor = async (data) => {
    const response = await axios.post(`${API_URL}/installer-vendors`, data, getAuthHeaders());
    return response.data;
};

export const updateInstallerVendor = async (id, data) => {
    const response = await axios.put(`${API_URL}/installer-vendors/${id}`, data, getAuthHeaders());
    return response.data;
};

export const deleteInstallerVendor = async (id) => {
    const response = await axios.delete(`${API_URL}/installer-vendors/${id}`, getAuthHeaders());
    return response.data;
};

// ==================== SUPPLIER TYPES ====================

export const getSupplierTypes = async () => {
    const response = await axios.get(`${API_URL}/supplier-types`, getAuthHeaders());
    return response.data;
};

export const createSupplierType = async (data) => {
    const response = await axios.post(`${API_URL}/supplier-types`, data, getAuthHeaders());
    return response.data;
};

export const updateSupplierType = async (id, data) => {
    const response = await axios.put(`${API_URL}/supplier-types/${id}`, data, getAuthHeaders());
    return response.data;
};

export const deleteSupplierType = async (id) => {
    const response = await axios.delete(`${API_URL}/supplier-types/${id}`, getAuthHeaders());
    return response.data;
};

// ==================== SUPPLIER VENDORS ====================

export const getSupplierVendors = async (params = {}) => {
    const response = await axios.get(`${API_URL}/supplier-vendors`, { ...getAuthHeaders(), params });
    return response.data;
};

export const createSupplierVendor = async (data) => {
    const response = await axios.post(`${API_URL}/supplier-vendors`, data, getAuthHeaders());
    return response.data;
};

export const updateSupplierVendor = async (id, data) => {
    const response = await axios.put(`${API_URL}/supplier-vendors/${id}`, data, getAuthHeaders());
    return response.data;
};

export const deleteSupplierVendor = async (id) => {
    const response = await axios.delete(`${API_URL}/supplier-vendors/${id}`, getAuthHeaders());
    return response.data;
};

// ==================== INSTALLER VENDOR PLANS ====================

export const getInstallerVendorPlans = async (districtId) => {
    const response = await axios.get(`${API_URL}/installer-vendor-plans`, {
        ...getAuthHeaders(),
        params: { districtId }
    });
    return response.data;
};

export const saveInstallerVendorPlan = async (data) => {
    const response = await axios.post(`${API_URL}/installer-vendor-plans`, data, getAuthHeaders());
    return response.data;
};

export const deleteInstallerVendorPlan = async (id) => {
    const response = await axios.delete(`${API_URL}/installer-vendor-plans/${id}`, getAuthHeaders());
    return response.data;
};
