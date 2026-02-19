import axios from './axios';

export const getCampaigns = async (params) => {
    const response = await axios.get('/campaigns', { params });
    return response.data;
};

export const getCampaignById = async (id) => {
    const response = await axios.get(`/campaigns/${id}`);
    return response.data;
};

export const createCampaign = async (data) => {
    const response = await axios.post('/campaigns', data);
    return response.data;
};

export const updateCampaign = async (id, data) => {
    const response = await axios.put(`/campaigns/${id}`, data);
    return response.data;
};

export const deleteCampaign = async (id) => {
    const response = await axios.delete(`/campaigns/${id}`);
    return response.data;
};

export const getCampaignStats = async () => {
    const response = await axios.get('/campaigns/stats');
    return response.data;
};
