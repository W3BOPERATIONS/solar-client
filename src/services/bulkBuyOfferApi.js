import api from '../api/api.js';

export const getActiveBulkBuyOffers = async () => {
    try {
        const response = await api.get('/bulk-buy-offers/active');
        return response.data;
    } catch (error) {
        console.error('Error fetching active bulk buy offers', error);
        throw error;
    }
};

export const getAllBulkBuyOffers = async () => {
    try {
        const response = await api.get('/bulk-buy-offers');
        return response.data;
    } catch (error) {
        console.error('Error fetching all bulk buy offers', error);
        throw error;
    }
};

export const createBulkBuyOffer = async (offerData) => {
    try {
        const response = await api.post('/bulk-buy-offers', offerData);
        return response.data;
    } catch (error) {
        console.error('Error creating bulk buy offer', error);
        throw error;
    }
};

export const updateBulkBuyOffer = async (id, offerData) => {
    try {
        const response = await api.put(`/bulk-buy-offers/${id}`, offerData);
        return response.data;
    } catch (error) {
        console.error('Error updating bulk buy offer', error);
        throw error;
    }
};

export const deleteBulkBuyOffer = async (id) => {
    try {
        const response = await api.delete(`/bulk-buy-offers/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting bulk buy offer', error);
        throw error;
    }
};
