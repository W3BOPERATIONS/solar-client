import api from '../../api/axios';

// Get all settings
export const getAllOrderProcurementSettings = async () => {
    try {
        const res = await api.get('/settings/order-procurement');
        return res.data;
    } catch (err) {
        throw err.response?.data || err.message;
    }
};

// Get single setting
export const getOrderProcurementSettingById = async (id) => {
    try {
        const res = await api.get(`/settings/order-procurement/${id}`);
        return res.data;
    } catch (err) {
        throw err.response?.data || err.message;
    }
};

// Create setting
export const createOrderProcurementSetting = async (settingData) => {
    try {
        const res = await api.post('/settings/order-procurement', settingData);
        return res.data;
    } catch (err) {
        throw err.response?.data || err.message;
    }
};

// Update setting
export const updateOrderProcurementSetting = async (id, settingData) => {
    try {
        const res = await api.put(`/settings/order-procurement/${id}`, settingData);
        return res.data;
    } catch (err) {
        throw err.response?.data || err.message;
    }
};

// Delete setting
export const deleteOrderProcurementSetting = async (id) => {
    try {
        const res = await api.delete(`/settings/order-procurement/${id}`);
        return res.data;
    } catch (err) {
        throw err.response?.data || err.message;
    }
};

// --- Helper Data Fetchers for Dropdowns ---
// Reusing some existing endpoints from other modules or assuming standard ones

export const getCategories = async () => {
    try {
        const res = await api.get('/masters/categories');
        return res.data;
    } catch (err) {
        throw err.response?.data || err.message;
    }
};

export const getSubCategories = async (categoryId) => {
    try {
        const url = categoryId ? `/masters/sub-categories?categoryId=${categoryId}` : '/masters/sub-categories';
        const res = await api.get(url);
        return res.data;
    } catch (err) {
        throw err.response?.data || err.message;
    }
};

export const getProjectTypes = async () => {
    try {
        const res = await api.get('/masters/project-types');
        return res.data;
    } catch (err) {
        throw err.response?.data || err.message;
    }
};

export const getSubProjectTypes = async (projectTypeId) => {
    try {
        const url = projectTypeId ? `/masters/sub-project-types?projectTypeId=${projectTypeId}` : '/masters/sub-project-types';
        const res = await api.get(url);
        return res.data;
    } catch (err) {
        throw err.response?.data || err.message;
    }
};

export const getProducts = async () => {
    try {
        const res = await api.get('/products');
        return res.data;
    } catch (err) {
        throw err.response?.data || err.message;
    }
};

export const getBrands = async () => {
    try {
        const res = await api.get('/brand/manufacturer'); 
        return res.data;
    } catch (err) {
        throw err.response?.data || err.message;
    }
};

export const getSkus = async () => {
    try {
        const res = await api.get('/masters/skus');
        return res.data;
    } catch (err) {
        throw err.response?.data || err.message;
    }
};

export const getComboKits = async () => {
    try {
        const res = await api.get('/combokit/assignments');
        if (Array.isArray(res.data)) {
            return res.data.map(item => {
                let name = '0 ComboKits';
                if (item.comboKits && item.comboKits.length === 1) {
                    name = item.comboKits[0].name || 'Unnamed ComboKit';
                } else if (item.comboKits && item.comboKits.length > 1) {
                    name = `${item.comboKits[0].name || 'Unnamed'} and ${item.comboKits.length - 1} more`;
                }
                return {
                    ...item,
                    name: name
                };
            });
        }
        return res.data;
    } catch (err) {
        throw err.response?.data || err.message;
    }
};

export const getSupplierTypes = async () => {
    try {
        const res = await api.get('/vendors/supplier-types');
        return res.data;
    } catch (err) {
        throw err.response?.data || err.message;
    }
};
