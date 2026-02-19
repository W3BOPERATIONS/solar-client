import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
};

// --- Departments ---
export const getDepartments = async () => {
    const response = await axios.get(`${API_URL}/masters/departments`, { ...getAuthHeader(), params: { isActive: true } });
    return response.data;
};

export const createDepartment = async (data) => {
    const response = await axios.post(`${API_URL}/masters/departments`, data, getAuthHeader());
    return response.data;
};

export const updateDepartment = async (id, data) => {
    const response = await axios.put(`${API_URL}/masters/departments/${id}`, data, getAuthHeader());
    return response.data;
};

export const deleteDepartment = async (id) => {
    const response = await axios.delete(`${API_URL}/masters/departments/${id}`, getAuthHeader());
    return response.data;
};

// --- Roles ---
export const getRoles = async () => {
    const response = await axios.get(`${API_URL}/masters/roles`, { ...getAuthHeader(), params: { isActive: true } });
    return response.data;
};

export const createRole = async (data) => {
    const response = await axios.post(`${API_URL}/masters/roles`, data, getAuthHeader());
    return response.data;
};

export const updateRole = async (id, data) => {
    const response = await axios.put(`${API_URL}/masters/roles/${id}`, data, getAuthHeader());
    return response.data;
};

export const deleteRole = async (id) => {
    const response = await axios.delete(`${API_URL}/masters/roles/${id}`, getAuthHeader());
    return response.data;
};

// --- Modules ---
export const getAllModules = async () => {
    const response = await axios.get(`${API_URL}/hr/modules`, getAuthHeader());
    return response.data;
};

export const assignModulesToDepartment = async (departmentId, modules) => {
    const response = await axios.post(`${API_URL}/hr/department/${departmentId}/modules`, { departmentId, modules }, getAuthHeader());
    return response.data;
};

export const getDepartmentModules = async (departmentId) => {
    const response = await axios.get(`${API_URL}/hr/department/${departmentId}/modules`, getAuthHeader());
    return response.data;
};

// --- Temporary Incharge ---
export const createTemporaryIncharge = async (data) => {
    const response = await axios.post(`${API_URL}/hr/temporary-incharge`, data, getAuthHeader());
    return response.data;
};

export const getTemporaryIncharges = async (departmentId) => {
    const params = departmentId ? { department: departmentId } : {};
    const response = await axios.get(`${API_URL}/hr/temporary-incharge`, { ...getAuthHeader(), params });
    return response.data;
};

// --- Users (Helper for dropdowns) ---
export const getUsers = async (departmentId) => {
    // Assuming we have a user endpoint that can filter by department
    // If not, we might need to fetch all and filter client side or add query support to userController
    const params = departmentId ? { department: departmentId } : {};
    const response = await axios.get(`${API_URL}/users`, { ...getAuthHeader(), params });
    return response.data;
};
