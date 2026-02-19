import api from '../../api/axios';

const buildQueryString = (params) => {
    const cleanedParams = Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v !== null && v !== undefined && v !== 'undefined' && v !== '')
    );
    return new URLSearchParams(cleanedParams).toString();
};

const performanceApi = {
    getFranchiseManagerPerformance: async (params = {}) => {
        try {
            const query = buildQueryString(params);
            const res = await api.get(`/performance/franchise-manager?${query}`);
            return res.data;
        } catch (err) {
            throw err.response?.data || err.message;
        }
    },

    getFranchiseePerformance: async (params = {}) => {
        try {
            const query = buildQueryString(params);
            const res = await api.get(`/performance/franchise?${query}`);
            return res.data;
        } catch (err) {
            throw err.response?.data || err.message;
        }
    },

    getDealerManagerPerformance: async (params = {}) => {
        try {
            const query = buildQueryString(params);
            const res = await api.get(`/performance/dealer-manager?${query}`);
            return res.data;
        } catch (err) {
            throw err.response?.data || err.message;
        }
    },

    getDealerPerformance: async (params = {}) => {
        try {
            const query = buildQueryString(params);
            const res = await api.get(`/performance/dealer?${query}`);
            return res.data;
        } catch (err) {
            throw err.response?.data || err.message;
        }
    },

    getDashboardData: async (role, params = {}) => {
        try {
            const query = buildQueryString(params);
            const res = await api.get(`/performance/${role}?${query}`);
            return res.data;
        } catch (err) {
            throw err.response?.data || err.message;
        }
    }
};

export default performanceApi;
