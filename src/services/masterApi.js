import api from '../api/axios';

export const getDepartments = async () => {
    try {
        const res = await api.get('/masters/departments');
        return res.data.data;
    } catch (err) {
        throw err.response?.data || err.message;
    }
};

export const getDesignations = async () => {
    try {
        const res = await api.get('/masters/designations');
        return res.data.data;
    } catch (err) {
        throw err.response?.data || err.message;
    }
};

export const getDesignationsByDepartment = async (departmentId) => {
    try {
        const res = await api.get(`/masters/departments/${departmentId}/designations`);
        return res.data.data;
    } catch (err) {
        throw err.response?.data || err.message;
    }
};

export const getRoles = async () => {
    try {
        const res = await api.get('/masters/roles');
        return res.data;
    } catch (err) {
        throw err.response?.data || err.message;
    }
};

export const getProjectTypes = async () => {
    try {
        const res = await api.get('/masters/project-types');
        return res.data.data; // Assuming controller returns standard response structure
    } catch (err) {
        throw err.response?.data || err.message;
    }
};

export const getCategories = async () => {
    try {
        const res = await api.get('/masters/categories');
        return res.data.data;
    } catch (err) {
        throw err.response?.data || err.message;
    }
};

export const getUnits = async () => {
    try {
        const res = await api.get('/masters/units');
        return res.data.data;
    } catch (err) {
        throw err.response?.data || err.message;
    }
};

export const getSKUs = async () => {
    try {
        const res = await api.get('/masters/skus');
        return res.data.data;
    } catch (err) {
        throw err.response?.data || err.message;
    }
};
