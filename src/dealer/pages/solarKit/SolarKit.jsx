import React, { useState, useEffect } from 'react';
import {
    SolarPanel,
    Zap,
    Home,
    Building2,
    Factory,
    Globe,
    Briefcase,
    Info,
    Tag,
    Bolt,
    ChartLine,
    Power,
    Cpu,
    Check,
    X,
    Filter,
    XCircle,
    CheckCircle,
    Clock,
    AlertCircle,
    DollarSign,
    FileText,
    Table,
    Edit,
    Trash2,
    Plus,
    Save
} from 'lucide-react';
import { solarKitAPI } from '../../../api/api';

const DealerSolarKit = () => {
    // GST and company margin
    const GST = 18;
    const COMPANY_MARGIN = 15000;

    // State
    const [solarKits, setSolarKits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        category: 'All',
        type: 'All',
        kwRange: 'All',
        status: 'All',
        subCategory: 'All'
    });
    const [showFilters, setShowFilters] = useState(false);

    // Modal States
    const [selectedKitForDetails, setSelectedKitForDetails] = useState(null);
    const [selectedKitForPrice, setSelectedKitForPrice] = useState(null);
    const [showPriceModal, setShowPriceModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showAddEditModal, setShowAddEditModal] = useState(false);
    const [editingKit, setEditingKit] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        brand: '',
        kw: '',
        inverter: '',
        panels: '',
        price: '',
        warranty: '',
        efficiency: '',
        description: '',
        panelBrand: '',
        inverterBrand: '',
        status: 'In-Stock',
        type: 'Hybrid',
        category: 'Roof Top',
        subCategory: 'Residential',
        commissionRate: 0,
        panelWatt: '',
        technology: '',
        priceBreakdown: [] // Simplified for now, can be expanded
    });

    // Fetch Kits
    const fetchKits = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filters.category !== 'All') params.category = filters.category;
            if (filters.type !== 'All') params.type = filters.type;
            if (filters.status !== 'All') params.status = filters.status;
            if (filters.subCategory !== 'All') params.subCategory = filters.subCategory;
            if (filters.kwRange !== 'All') params.kwRange = filters.kwRange;

            const response = await solarKitAPI.getAll(params);
            setSolarKits(response.data);
        } catch (error) {
            console.error('Error fetching solar kits:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKits();
    }, [filters]);

    // Handlers
    const handleFilterChange = (filterName, value) => {
        setFilters(prev => {
            const newFilters = { ...prev, [filterName]: value };
            if (filterName === 'category') {
                newFilters.subCategory = 'All';
            }
            return newFilters;
        });
    };

    const clearFilters = () => {
        setFilters({
            category: 'All',
            type: 'All',
            kwRange: 'All',
            status: 'All',
            subCategory: 'All'
        });
    };

    const handleDeleteKit = async (id) => {
        if (window.confirm('Are you sure you want to delete this solar kit?')) {
            try {
                await solarKitAPI.delete(id);
                fetchKits();
            } catch (error) {
                console.error('Error deleting kit:', error);
                alert('Failed to delete kit');
            }
        }
    };

    const handleEditKit = (kit) => {
        setEditingKit(kit);
        setFormData({
            ...kit,
            priceBreakdown: kit.priceBreakdown || []
        });
        setShowAddEditModal(true);
    };

    const handleAddKit = () => {
        setEditingKit(null);
        setFormData({
            name: '',
            brand: 'Luminous', // Defaults
            kw: '5-10 kW',
            inverter: '',
            panels: '',
            price: 0,
            warranty: '10 years',
            efficiency: '20%',
            description: '',
            panelBrand: 'Adani',
            inverterBrand: 'Luminous',
            status: 'In-Stock',
            type: 'Hybrid',
            category: 'Roof Top',
            subCategory: 'Residential',
            commissionRate: 0,
            panelWatt: '500W',
            technology: 'Mono PERC',
            priceBreakdown: []
        });
        setShowAddEditModal(true);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingKit) {
                await solarKitAPI.update(editingKit._id, formData);
            } else {
                await solarKitAPI.create(formData);
            }
            setShowAddEditModal(false);
            fetchKits();
        } catch (error) {
            console.error('Error saving kit:', error);
            alert('Failed to save kit');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Helper functions (same as before)
    const formatPrice = (price) => {
        return Math.round(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    const calculateFinalPrice = (kit) => {
        const calculatedPrice = Number(kit.price) + COMPANY_MARGIN;
        const gstAmount = (calculatedPrice / 100) * GST;
        return calculatedPrice + gstAmount;
    };

    // ... (rest of the helper functions from original file: getStatusClass, etc. converted to use new data structure if needed)
    const getStatusClass = (status) => status === 'In-Stock' ? 'bg-green-500 text-white' : 'bg-red-500 text-white';
    const getTypeClass = (type) => {
        switch (type) {
            case 'Hybrid': return 'bg-purple-600 text-white';
            case 'On-Grid': return 'bg-blue-600 text-white';
            case 'Off-Grid': return 'bg-orange-500 text-white';
            default: return 'bg-gray-500 text-white';
        }
    };
    const getSubCategoryClass = (subCat) => {
        switch (subCat) {
            case 'Commercial': return 'bg-gradient-to-r from-orange-500 to-orange-700 text-white';
            case 'Residential': return 'bg-gradient-to-r from-green-500 to-green-700 text-white';
            case 'Industrial': return 'bg-gradient-to-r from-purple-600 to-purple-800 text-white';
            case 'Mega': return 'bg-gradient-to-r from-red-500 to-red-700 text-white';
            default: return 'bg-gray-600 text-white';
        }
    };

    // Options (can be dynamic later)
    const categoryOptions = ['All', 'Roof Top', 'Ground Mount', 'Carport'];
    const typeOptions = ['All', 'On-Grid', 'Off-Grid', 'Hybrid'];
    const kwOptions = ['All', '1-5 kW', '5-10 kW', '10-15 kW', '15+ kW'];

    return (
        <div className="min-h-screen bg-gray-50 font-poppins">
            <div className="container-fluid px-4 py-4">
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Solar Kits</h1>
                        <p className="text-gray-500">Browse and manage our premium solar kit collection</p>
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={handleAddKit}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-lg flex items-center shadow-sm"
                        >
                            <Plus size={18} className="mr-1" />
                            Add Kit
                        </button>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="bg-white border rounded-lg px-4 py-2 flex items-center hover:bg-gray-50"
                        >
                            <Filter size={18} className="mr-2" />
                            <span className="bg-blue-600 text-white rounded-full px-2 py-0.5 text-xs ml-1">
                                {solarKits.length}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Filter Section (Simplified for brevity, same as original logic) */}
                {showFilters && (
                    <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                            <div>
                                <label className="block text-xs font-bold mb-1">Category</label>
                                <select
                                    className="w-full border rounded-lg p-2"
                                    value={filters.category}
                                    onChange={(e) => handleFilterChange('category', e.target.value)}
                                >
                                    {categoryOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold mb-1">System Type</label>
                                <select
                                    className="w-full border rounded-lg p-2"
                                    value={filters.type}
                                    onChange={(e) => handleFilterChange('type', e.target.value)}
                                >
                                    {typeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold mb-1">Capacity</label>
                                <select
                                    className="w-full border rounded-lg p-2"
                                    value={filters.kwRange}
                                    onChange={(e) => handleFilterChange('kwRange', e.target.value)}
                                >
                                    {kwOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                            <div className="flex items-end">
                                <button onClick={clearFilters} className="w-full border border-red-500 text-red-500 rounded-lg p-2 hover:bg-red-50">
                                    <XCircle size={18} className="inline mr-2" /> Clear All
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {loading ? (
                    <div className="text-center py-20">Loading solar kits...</div>
                ) : (
                    /* Solar Kits Grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {solarKits.map((kit) => {
                            const finalPrice = calculateFinalPrice(kit);

                            return (
                                <div key={kit._id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all relative group">
                                    {/* Edit/Delete Actions */}
                                    <div className="absolute top-2 right-2 flex space-x-1 opacity-100 z-10">
                                        <button
                                            onClick={() => handleEditKit(kit)}
                                            className="bg-white p-2 rounded-full shadow-sm text-blue-600 hover:bg-blue-50"
                                            title="Edit Kit"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteKit(kit._id)}
                                            className="bg-white p-2 rounded-full shadow-sm text-red-600 hover:bg-red-50"
                                            title="Delete Kit"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    <div className="p-4" onClick={() => { setSelectedKitForDetails(kit); setShowDetailsModal(true); }}>
                                        {/* Image/Brand Section */}
                                        <div className="flex mb-3 mt-4">
                                            <div className="flex-1 mr-2">
                                                <div className="bg-blue-50 rounded-lg h-16 flex items-center justify-center">
                                                    <SolarPanel size={32} className="text-blue-600" />
                                                </div>
                                                <small className="block text-center mt-1">{kit.panelBrand}</small>
                                            </div>
                                            <div className="flex-1 ml-2">
                                                <div className="bg-green-50 rounded-lg h-16 flex items-center justify-center">
                                                    <Zap size={32} className="text-green-600" />
                                                </div>
                                                <small className="block text-center mt-1">{kit.inverterBrand}</small>
                                            </div>
                                        </div>

                                        {/* Status Badges */}
                                        <div className="flex justify-between mb-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(kit.status)}`}>
                                                {kit.status}
                                            </span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeClass(kit.type)}`}>
                                                {kit.type}
                                            </span>
                                        </div>

                                        {/* Kit Info */}
                                        <h6 className="font-semibold text-gray-800 mb-2 truncate" title={kit.name}>{kit.name}</h6>
                                        <div className="flex items-center mb-3">
                                            <Tag size={14} className="text-yellow-500 mr-2" />
                                            <span className="text-xs text-gray-600">{kit.brand}</span>
                                            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${getSubCategoryClass(kit.subCategory)}`}>
                                                {kit.subCategory}
                                            </span>
                                        </div>

                                        {/* Specs Grid */}
                                        <div className="grid grid-cols-2 gap-2 mb-3">
                                            <div className="bg-gray-50 rounded-lg p-2">
                                                <span className="text-xs font-bold block">{kit.kw}</span>
                                                <small className="text-[10px] text-gray-500">Capacity</small>
                                            </div>
                                            <div className="bg-gray-50 rounded-lg p-2">
                                                <span className="text-xs font-bold block">{kit.efficiency}</span>
                                                <small className="text-[10px] text-gray-500">Efficiency</small>
                                            </div>
                                        </div>

                                        {/* Price Footer */}
                                        <div className="border-t pt-3 flex justify-between items-center">
                                            <span className="text-lg font-bold text-green-600">
                                                ₹{formatPrice(finalPrice)}/kW
                                            </span>
                                            <span className="text-xs text-gray-400">Click for details</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Add/Edit Modal */}
                {showAddEditModal && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                                <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setShowAddEditModal(false)}></div>
                            </div>

                            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                                <form onSubmit={handleFormSubmit}>
                                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                        <div className="sm:flex sm:items-start">
                                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                                    {editingKit ? 'Edit Solar Kit' : 'Add New Solar Kit'}
                                                </h3>
                                                <div className="mt-4 grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">Name</label>
                                                        <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">Brand</label>
                                                        <input type="text" name="brand" value={formData.brand} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">Capacity (e.g. 5-10 kW)</label>
                                                        <input type="text" name="kw" value={formData.kw} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">Price (Base)</label>
                                                        <input type="number" name="price" value={formData.price} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">Inverter</label>
                                                        <input type="text" name="inverter" value={formData.inverter} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">Panels</label>
                                                        <input type="text" name="panels" value={formData.panels} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">Category</label>
                                                        <select name="category" value={formData.category} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                                                            {categoryOptions.filter(o => o !== 'All').map(o => <option key={o} value={o}>{o}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">Type</label>
                                                        <select name="type" value={formData.type} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                                                            {typeOptions.filter(o => o !== 'All').map(o => <option key={o} value={o}>{o}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">Status</label>
                                                        <select name="status" value={formData.status} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                                                            <option value="In-Stock">In-Stock</option>
                                                            <option value="Out-of-Stock">Out-of-Stock</option>
                                                        </select>
                                                    </div>
                                                    {/* More fields as necessary */}
                                                    <div className="col-span-2">
                                                        <label className="block text-sm font-medium text-gray-700">Description</label>
                                                        <textarea name="description" value={formData.description} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" rows="3"></textarea>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                        <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm">
                                            Save
                                        </button>
                                        <button type="button" onClick={() => setShowAddEditModal(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Simplified Check for Details Modal (placeholder) */}
                {showDetailsModal && selectedKitForDetails && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="flex items-center justify-center min-h-screen px-4">
                            <div className="fixed inset-0 bg-black opacity-50" onClick={() => setShowDetailsModal(false)}></div>
                            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-auto z-10 p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold">{selectedKitForDetails.name}</h2>
                                    <button onClick={() => setShowDetailsModal(false)}><X size={24} /></button>
                                </div>
                                <div className="space-y-2">
                                    <p><strong>Brand:</strong> {selectedKitForDetails.brand}</p>
                                    <p><strong>Type:</strong> {selectedKitForDetails.type}</p>
                                    <p><strong>Description:</strong> {selectedKitForDetails.description}</p>
                                    <p><strong>Warranty:</strong> {selectedKitForDetails.warranty}</p>
                                    <button onClick={() => { setShowDetailsModal(false); setShowPriceModal(true); setSelectedKitForPrice(selectedKitForDetails) }} className="text-blue-600 underline text-sm">View Price Breakdown</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Simplified Price Modal (placeholder) */}
                {showPriceModal && selectedKitForPrice && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="flex items-center justify-center min-h-screen px-4">
                            <div className="fixed inset-0 bg-black opacity-50" onClick={() => setShowPriceModal(false)}></div>
                            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-auto z-10 p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold">Price Details</h2>
                                    <button onClick={() => setShowPriceModal(false)}><X size={24} /></button>
                                </div>
                                <div className="space-y-2">
                                    {/* You can iterate over selectedKitForPrice.priceBreakdown if it exists */}
                                    <p>Base Price: ₹{selectedKitForPrice.price}</p>
                                    <p>+ Company Margin: ₹{COMPANY_MARGIN}</p>
                                    <p>+ GST ({GST}%): ₹{((selectedKitForPrice.price + COMPANY_MARGIN) * GST / 100)}</p>
                                    <hr />
                                    <p className="font-bold">Total: ₹{calculateFinalPrice(selectedKitForPrice)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DealerSolarKit;