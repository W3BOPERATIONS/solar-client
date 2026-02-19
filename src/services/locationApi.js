import api from '../api/axios';

// Get all countries
export const getCountries = async () => {
    try {
        const res = await api.get('/locations/countries');
        return res.data.data;
    } catch (err) {
        throw err.response?.data || err.message;
    }
};

// Get all states (optionally by country)
export const getStates = async (countryId) => {
    try {
        const url = countryId ? `/locations/states?countryId=${countryId}` : '/locations/states';
        const res = await api.get(url);
        return res.data.data;
    } catch (err) {
        throw err.response?.data || err.message;
    }
};

// Get cities by state
export const getCities = async (stateId) => {
    try {
        const res = await api.get(`/locations/cities?stateId=${stateId}`);
        return res.data.data;
    } catch (err) {
        throw err.response?.data || err.message;
    }
};

// Get districts by city or state
export const getDistricts = async (params = {}) => {
    try {
        const query = new URLSearchParams(params).toString();
        const res = await api.get(`/locations/districts?${query}`);
        return res.data.data;
    } catch (err) {
        throw err.response?.data || err.message;
    }
};

// Get clusters by district
export const getClusters = async (districtId) => {
    try {
        const res = await api.get(`/locations/clusters?districtId=${districtId}`);
        return res.data.data;
    } catch (err) {
        throw err.response?.data || err.message;
    }
};

// Hierarchy functions
export const getStatesHierarchy = async () => {
    try {
        const res = await api.get('/locations/hierarchy/states');
        return res.data.data;
    } catch (err) {
        throw err.response?.data || err.message;
    }
};

export const getClustersHierarchy = async (stateId) => {
    try {
        const url = stateId ? `/locations/hierarchy/clusters?stateId=${stateId}` : '/locations/hierarchy/clusters';
        const res = await api.get(url);
        return res.data.data;
    } catch (err) {
        throw err.response?.data || err.message;
    }
};

export const getDistrictsHierarchy = async (clusterId) => {
    try {
        const url = clusterId ? `/locations/hierarchy/districts?clusterId=${clusterId}` : '/locations/hierarchy/districts';
        const res = await api.get(url);
        return res.data.data;
    } catch (err) {
        throw err.response?.data || err.message;
    }
};

export const getCitiesHierarchy = async (districtId) => {
    try {
        const url = districtId ? `/locations/hierarchy/cities?districtId=${districtId}` : '/locations/hierarchy/cities';
        const res = await api.get(url);
        return res.data.data;
    } catch (err) {
        throw err.response?.data || err.message;
    }
};
