import axios from 'axios';

const API_URL = '/installer';

// --- Solar Installers ---
export const getSolarInstallers = async (params = {}) => {
    const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}${API_URL}/installers`, { params });
    return response.data;
};

export const createSolarInstaller = async (data) => {
    const response = await axios.post(`${API_URL}/installers`, data);
    return response.data;
};

export const updateSolarInstaller = async (id, data) => {
    const response = await axios.put(`${API_URL}/installers/${id}`, data);
    return response.data;
};

export const deleteSolarInstaller = async (id) => {
    const response = await axios.delete(`${API_URL}/installers/${id}`);
    return response.data;
};

// --- Installer Tools ---
export const getInstallerTools = async () => {
    const response = await axios.get(`${API_URL}/tools`);
    return response.data;
};

export const createInstallerTool = async (data) => {
    const response = await axios.post(`${API_URL}/tools`, data);
    return response.data;
};

export const updateInstallerTool = async (id, data) => {
    const response = await axios.put(`${API_URL}/tools/${id}`, data);
    return response.data;
};

export const deleteInstallerTool = async (id) => {
    const response = await axios.delete(`${API_URL}/tools/${id}`);
    return response.data;
};

// --- Installation Rates ---
export const getInstallationRates = async () => {
    const response = await axios.get(`${API_URL}/rates`);
    return response.data;
};

export const createInstallationRate = async (data) => {
    const response = await axios.post(`${API_URL}/rates`, data);
    return response.data;
};

export const updateInstallationRate = async (id, data) => {
    const response = await axios.put(`${API_URL}/rates/${id}`, data);
    return response.data;
};

export const deleteInstallationRate = async (id) => {
    const response = await axios.delete(`${API_URL}/rates/${id}`);
    return response.data;
};

// --- Installer Agencies ---
export const getInstallerAgencies = async () => {
    const response = await axios.get(`${API_URL}/agencies`);
    return response.data;
};

export const createInstallerAgency = async (data) => {
    const response = await axios.post(`${API_URL}/agencies`, data);
    return response.data;
};

export const updateInstallerAgency = async (id, data) => {
    const response = await axios.put(`${API_URL}/agencies/${id}`, data);
    return response.data;
};

export const deleteInstallerAgency = async (id) => {
    const response = await axios.delete(`${API_URL}/agencies/${id}`);
    return response.data;
};
