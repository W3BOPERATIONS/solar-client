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

// Config
export const getCampaignConfig = async () => {
    const response = await axios.get('/campaigns/settings/config');
    return response.data;
};

export const updateCampaignConfig = async (data) => {
    const response = await axios.put('/campaigns/settings/config', data);
    return response.data;
};

// Social Platforms
export const getAllSocialPlatforms = async () => {
    const response = await axios.get('/campaigns/social/platforms');
    return response.data;
};

export const createSocialPlatform = async (data) => {
    const response = await axios.post('/campaigns/social/platforms', data);
    return response.data;
};

export const updateSocialPlatform = async (id, data) => {
    const response = await axios.put(`/campaigns/social/platforms/${id}`, data);
    return response.data;
};

export const deleteSocialPlatform = async (id) => {
    const response = await axios.delete(`/campaigns/social/platforms/${id}`);
    return response.data;
};
