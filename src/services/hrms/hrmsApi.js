import api from '../../api/axios';

// --- HRMS Settings (Department/Position Config) ---

// Get HRMS Settings (can filter by department, position)
export const getHRMSSettings = async (params) => {
    try {
        const res = await api.get('/hrms-settings/settings', { params });
        return res.data;
    } catch (err) {
        throw err.response?.data || err.message;
    }
};

// Create or Update HRMS Settings
export const saveHRMSSettings = async (data) => {
    try {
        const res = await api.post('/hrms-settings/settings', data);
        return res.data;
    } catch (err) {
        throw err.response?.data || err.message;
    }
};

// --- Candidate Tests ---

export const getCandidateTests = async (params) => {
    try {
        const res = await api.get('/hrms-settings/tests', { params });
        return res.data;
    } catch (err) {
        throw err.response?.data || err.message;
    }
};

export const createCandidateTest = async (data) => {
    try {
        const res = await api.post('/hrms-settings/tests', data);
        return res.data;
    } catch (err) {
        throw err.response?.data || err.message;
    }
};

export const updateCandidateTest = async (id, data) => {
    try {
        const res = await api.put(`/hrms-settings/tests/${id}`, data);
        return res.data;
    } catch (err) {
        throw err.response?.data || err.message;
    }
};

export const deleteCandidateTest = async (id) => {
    try {
        const res = await api.delete(`/hrms-settings/tests/${id}`);
        return res.data;
    } catch (err) {
        throw err.response?.data || err.message;
    }
};

// --- Candidate Trainings ---

export const getCandidateTrainings = async (params) => {
    try {
        const res = await api.get('/hrms-settings/trainings', { params });
        return res.data;
    } catch (err) {
        throw err.response?.data || err.message;
    }
};

export const createCandidateTraining = async (data) => {
    try {
        const res = await api.post('/hrms-settings/trainings', data);
        return res.data;
    } catch (err) {
        throw err.response?.data || err.message;
    }
};

export const updateCandidateTraining = async (id, data) => {
    try {
        const res = await api.put(`/hrms-settings/trainings/${id}`, data);
        return res.data;
    } catch (err) {
        throw err.response?.data || err.message;
    }
};

export const deleteCandidateTraining = async (id) => {
    try {
        const res = await api.delete(`/hrms-settings/trainings/${id}`);
        return res.data;
    } catch (err) {
        throw err.response?.data || err.message;
    }
};
