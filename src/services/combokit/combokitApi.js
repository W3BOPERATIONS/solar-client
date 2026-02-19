import api from '../../api/axios';

// SolarKit API
export const createSolarKit = async (data) => {
    const response = await api.post('/combokit/solarkits', data);
    return response.data;
};

export const getSolarKits = async (country) => {
    const params = country ? { country } : {};
    const response = await api.get('/combokit/solarkits', { params });
    return response.data;
};

export const updateSolarKit = async (id, data) => {
    const response = await api.put(`/combokit/solarkits/${id}`, data);
    return response.data;
};

export const deleteSolarKit = async (id) => {
    const response = await api.delete(`/combokit/solarkits/${id}`);
    return response.data;
};

export const updateSolarKitStatus = async (id, status) => {
    const response = await api.put(`/combokit/solarkits/${id}/status`, { status });
    return response.data;
};

export const getSolarKitBOM = async (id) => {
    const response = await api.get(`/combokit/solarkits/${id}/bom`);
    return response.data;
};

export const saveSolarKitBOM = async (id, bom) => {
    const response = await api.put(`/combokit/solarkits/${id}/bom`, { bom });
    return response.data;
};

// AMC Plan API
export const createAMCPlan = async (data) => {
    const response = await api.post('/combokit/amc-plans', data);
    return response.data;
};

export const getAMCPlans = async () => {
    const response = await api.get('/combokit/amc-plans');
    return response.data;
};

export const updateAMCPlan = async (id, data) => {
    const response = await api.put(`/combokit/amc-plans/${id}`, data);
    return response.data;
};

export const deleteAMCPlan = async (id) => {
    const response = await api.delete(`/combokit/amc-plans/${id}`);
    return response.data;
};

// AMC Service API
export const createAMCService = async (data) => {
    const response = await api.post('/combokit/amc-services', data);
    return response.data;
};

export const getAMCServices = async (amcPlanId) => {
    const params = amcPlanId ? { amcPlanId } : {};
    const response = await api.get('/combokit/amc-services', { params });
    return response.data;
};

export const updateAMCService = async (id, data) => {
    const response = await api.put(`/combokit/amc-services/${id}`, data);
    return response.data;
};

export const deleteAMCService = async (id) => {
    const response = await api.delete(`/combokit/amc-services/${id}`);
    return response.data;
};

// Bundle Plan API
export const createBundlePlan = async (data) => {
    const response = await api.post('/combokit/bundle-plans', data);
    return response.data;
};

export const getBundlePlans = async () => {
    const response = await api.get('/combokit/bundle-plans');
    return response.data;
};

export const updateBundlePlan = async (id, data) => {
    const response = await api.put(`/combokit/bundle-plans/${id}`, data);
    return response.data;
};

export const deleteBundlePlan = async (id) => {
    const response = await api.delete(`/combokit/bundle-plans/${id}`);
    return response.data;
};

// ComboKit Assignment API
export const createAssignment = async (data) => {
    const response = await api.post('/combokit/assignments', data);
    return response.data;
};

export const getAssignments = async (params) => {
    const response = await api.get('/combokit/assignments', { params });
    return response.data;
};

export const updateAssignment = async (id, data) => {
    const response = await api.put(`/combokit/assignments/${id}`, data);
    return response.data;
};

export const deleteAssignment = async (id) => {
    const response = await api.delete(`/combokit/assignments/${id}`);
    return response.data;
};
