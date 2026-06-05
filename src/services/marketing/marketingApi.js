import api from '../../api/axios';

// Fetch all leads (or filter by queries)
export const getLeads = async (params) => {
    try {
        const response = await api.get('/marketing/leads', { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching leads:", error);
        throw error;
    }
};

// Qualify a lead
export const qualifyLead = async (id, data) => {
    try {
        const response = await api.put(`/marketing/leads/${id}/qualify`, data);
        return response.data;
    } catch (error) {
        console.error("Error qualifying lead:", error);
        throw error;
    }
};

// Update lead status
export const updateLeadStatus = async (id, status) => {
    try {
        const response = await api.put(`/marketing/leads/${id}/status`, { status });
        return response.data;
    } catch (error) {
        console.error("Error updating lead status:", error);
        throw error;
    }
};
