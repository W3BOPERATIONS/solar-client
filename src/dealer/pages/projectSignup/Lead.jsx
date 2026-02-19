import React, { useState, useEffect } from 'react';
import {
    Search,
    Plus,
    Phone,
    Mail,
    MapPin,
    Zap,
    Home,
    Building2,
    Sun,
    Battery,
    Globe,
    X,
    ChevronRight,
    Loader
} from 'lucide-react';
import { locationAPI, leadAPI } from '../../../api/api';

const DealerLead = () => {
    const [leads, setLeads] = useState([]);
    const [selectedLead, setSelectedLead] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal form state
    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        whatsapp: '',
        email: '',
        district: '',
        districtName: '',
        city: '',
        cityName: '',
        solarType: 'Residential',
        subType: 'onGrid',
        kw: '',
        billAmount: 0
    });

    const [districts, setDistricts] = useState([]);
    const [citiesList, setCitiesList] = useState([]);

    // Fetch districts on mount
    useEffect(() => {
        const fetchDistricts = async () => {
            try {
                const response = await locationAPI.getAllDistricts({ isActive: true });
                if (response.data && response.data.data) {
                    setDistricts(response.data.data);
                }
            } catch (error) {
                console.error("Error fetching districts:", error);
            }
        };
        fetchDistricts();
    }, []);

    // Fetch leads
    const fetchLeads = async () => {
        setLoading(true);
        try {
            const response = await leadAPI.getAllLeads({ search: searchTerm });
            if (response.data && response.data.data) {
                setLeads(response.data.data);
                if (response.data.data.length > 0 && !selectedLead) {
                    setSelectedLead(response.data.data[0]);
                } else if (response.data.data.length === 0) {
                    setSelectedLead(null);
                }
            }
        } catch (error) {
            console.error("Error fetching leads:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchLeads();
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    // Handle form input changes
    const handleInputChange = async (e) => {
        const { id, value } = e.target;

        if (id === 'district') {
            const selectedDistrict = districts.find(d => d._id === value);
            setFormData(prev => ({
                ...prev,
                district: value,
                districtName: selectedDistrict ? selectedDistrict.name : '',
                city: '',
                cityName: ''
            }));

            // Fetch cities for this district
            setCitiesList([]);
            if (value) {
                try {
                    const response = await locationAPI.getAllClusters({ district: value, isActive: true }); // Using Clusters as Cities
                    if (response.data && response.data.data) {
                        setCitiesList(response.data.data);
                    }
                } catch (error) {
                    console.error("Error fetching cities:", error);
                }
            }
        } else if (id === 'city') {
            const selectedCity = citiesList.find(c => c._id === value);
            setFormData(prev => ({
                ...prev,
                city: value,
                cityName: selectedCity ? selectedCity.name : ''
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [id]: value
            }));
        }
    };

    const handleRadioChange = (e) => {
        setFormData(prev => ({
            ...prev,
            subType: e.target.id
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await leadAPI.createLead(formData);
            setShowModal(false);
            setSearchTerm(''); // Clear search to show new lead if it matches
            fetchLeads(); // Refresh list
            // Reset form
            setFormData({
                name: '',
                mobile: '',
                whatsapp: '',
                email: '',
                district: '',
                districtName: '',
                city: '',
                cityName: '',
                solarType: 'Residential',
                subType: 'onGrid',
                kw: '',
                billAmount: 0
            });
        } catch (error) {
            console.error("Error creating lead:", error);
            alert("Failed to create lead. Please try again.");
        }
    };

    // Helper to format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Helper for status active check
    const isStepActive = (currentStatus, stepIndex) => {
        const statusMap = {
            'New': 0,
            'SurveyPending': 0,
            'SurveyCompleted': 1,
            'QuoteGenerated': 2,
            'ProjectStart': 3,
            'ProjectSigned': 4
        };
        const currentStepIndex = statusMap[currentStatus] || 0;
        return currentStepIndex >= stepIndex;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header with Breadcrumb */}
            <div className="mb-4">
                <div className="bg-white shadow-sm p-3">
                    <nav className="container-fluid">
                        <ol className="flex items-center space-x-2">
                            <li className="text-gray-500">
                                <h3 className="text-xl font-semibold text-gray-800">Solar Kits</h3>
                            </li>
                        </ol>
                    </nav>
                </div>
            </div>

            <div className="container-fluid px-4">
                <div className="flex flex-wrap h-[calc(100vh-140px)]">
                    {/* LEFT SIDE - Lead List */}
                    <div className="w-full md:w-1/4 border-r bg-white p-3 flex flex-col h-full rounded-l-xl shadow-sm">
                        {/* Search and Add Button */}
                        <div className="flex items-center mb-3">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Search Leads..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            </div>
                            <button
                                onClick={() => setShowModal(true)}
                                className="ml-2 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
                            >
                                <Plus size={20} />
                            </button>
                        </div>

                        {/* Lead List */}
                        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                            {loading ? (
                                <div className="flex justify-center items-center py-10">
                                    <Loader className="animate-spin text-blue-500" size={24} />
                                </div>
                            ) : leads.length === 0 ? (
                                <div className="text-center text-gray-500 py-10 flex flex-col items-center">
                                    <Search size={32} className="mb-2 opacity-30" />
                                    <p>No leads found</p>
                                </div>
                            ) : (
                                leads.map((lead) => (
                                    <div
                                        key={lead._id}
                                        onClick={() => setSelectedLead(lead)}
                                        className={`p-3 rounded-lg cursor-pointer transition-all border ${selectedLead && selectedLead._id === lead._id
                                            ? 'bg-blue-50 border-blue-500 shadow-sm'
                                            : 'bg-white hover:bg-gray-50 border-gray-100 hover:shadow-sm'
                                            }`}
                                    >
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 font-bold overflow-hidden shadow-inner">
                                                {lead.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="ml-3 flex-1 overflow-hidden">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="text-sm font-semibold text-gray-800 truncate" title={lead.name}>{lead.name}</h4>
                                                </div>
                                                <div className="text-xs text-gray-500 truncate">{lead.mobile}</div>
                                                <div className="text-xs text-gray-500 mt-1 flex justify-between">
                                                    <span className="font-medium bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 text-[10px]">{lead.kw} KW</span>
                                                    <span className="text-[10px] text-gray-400">{new Date(lead.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-2 flex justify-between items-center border-t border-gray-50 pt-2">
                                            <div className="flex items-center text-xs text-gray-500 truncate max-w-[100px]">
                                                <MapPin size={10} className="mr-1" />
                                                <span className="truncate">{lead.district?.name || 'Unknown'}</span>
                                            </div>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${lead.solarType === 'Residential'
                                                    ? 'bg-green-50 text-green-700 border border-green-100'
                                                    : 'bg-blue-50 text-blue-700 border border-blue-100'
                                                }`}>
                                                {lead.solarType}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* RIGHT SIDE - Lead Details */}
                    <div className="w-full md:w-3/4 bg-white p-6 flex-1 overflow-y-auto rounded-r-xl shadow-sm h-full">
                        {selectedLead ? (
                            <div className="animate-fade-in max-w-4xl mx-auto">
                                {/* Header */}
                                <div className="flex items-center mb-8 pb-6 border-b border-gray-100">
                                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg mr-6">
                                        {selectedLead.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-bold text-gray-800">{selectedLead.name}</h2>
                                        <div className="flex items-center mt-2 space-x-4">
                                            <p className="text-gray-500 flex items-center bg-gray-50 px-3 py-1 rounded-full text-sm">
                                                <Phone size={14} className="mr-2 text-blue-500" /> {selectedLead.mobile}
                                            </p>
                                            <p className="text-gray-500 flex items-center bg-gray-50 px-3 py-1 rounded-full text-sm">
                                                <span className={`w-2 h-2 rounded-full mr-2 ${selectedLead.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                {selectedLead.isActive ? 'Active' : 'Inactive'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Details Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                    {/* Project Details */}
                                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                        <h4 className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-6 flex items-center">
                                            <Zap size={16} className="mr-2" /> Project Configuration
                                        </h4>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                                                <div className="text-sm text-gray-500">System Capacity</div>
                                                <div className="font-bold text-gray-800 text-lg">{selectedLead.kw} <span className="text-xs text-gray-500 font-normal">KW</span></div>
                                            </div>
                                            <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                                                <div className="text-sm text-gray-500">Project Type</div>
                                                <div className="font-semibold text-gray-800 bg-blue-50 px-3 py-1 rounded-full text-sm">{selectedLead.solarType}</div>
                                            </div>
                                            <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                                                <div className="text-sm text-gray-500">Connection Type</div>
                                                <div className="font-semibold text-gray-800 capitalize">{selectedLead.subType || 'On Grid'}</div>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <div className="text-sm text-gray-500">Approx. Monthly Bill</div>
                                                <div className="font-semibold text-green-600">{formatCurrency(selectedLead.billAmount || 0)}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Location & Contact Info */}
                                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                        <h4 className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-6 flex items-center">
                                            <MapPin size={16} className="mr-2" /> Location & Contact
                                        </h4>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <div className="text-xs text-gray-400 mb-1">State</div>
                                                    <div className="font-medium text-gray-800">Gujarat</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-gray-400 mb-1">District</div>
                                                    <div className="font-medium text-gray-800">{selectedLead.district?.name || '-'}</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-gray-400 mb-1">City / Cluster</div>
                                                    <div className="font-medium text-gray-800">{selectedLead.city?.name || '-'}</div>
                                                </div>
                                            </div>
                                            <div className="pt-4 border-t border-gray-50">
                                                <div className="grid grid-cols-1 gap-3">
                                                    <div className="flex items-center text-sm">
                                                        <Mail size={14} className="mr-3 text-gray-400" />
                                                        <span className="text-gray-700">{selectedLead.email || 'No email provided'}</span>
                                                    </div>
                                                    <div className="flex items-center text-sm">
                                                        <Phone size={14} className="mr-3 text-gray-400" />
                                                        <span className="text-gray-700">{selectedLead.whatsapp ? `${selectedLead.whatsapp} (WhatsApp)` : 'No WhatsApp provided'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Status Tracker */}
                                <div className="mt-8 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                                    <h4 className="text-lg font-bold text-gray-800 mb-8 text-center">Project Progress Timeline</h4>
                                    <div className="relative">
                                        {/* Progress Bar Background */}
                                        <div className="absolute top-1/2 left-0 w-full h-2 bg-gray-100 -z-10 transform -translate-y-1/2 rounded-full"></div>

                                        {/* Steps */}
                                        <div className="flex justify-between items-center">
                                            {['New', 'SurveyCompleted', 'QuoteGenerated', 'ProjectStart', 'ProjectSigned'].map((step, index) => {
                                                const completed = isStepActive(selectedLead.status, index);
                                                const isCurrent = (selectedLead.status === step) || (selectedLead.status === 'SurveyPending' && index === 0);

                                                return (
                                                    <div key={step} className="flex flex-col items-center">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mb-3 transition-all duration-300 border-4 ${completed ? 'bg-green-500 text-white border-green-200 shadow-green-200 shadow-lg' : 'bg-white text-gray-400 border-gray-200'
                                                            }`}>
                                                            {completed ? <ChevronRight size={16} /> : index + 1}
                                                        </div>
                                                        <span className={`text-xs font-bold uppercase tracking-wider ${completed ? 'text-green-600' : 'text-gray-400'}`}>
                                                            {step.replace(/([A-Z])/g, ' $1').trim()}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-300">
                                <Search size={64} className="mb-4 opacity-50" />
                                <p className="text-xl font-medium text-gray-400">Select a lead to view details</p>
                                <p className="text-sm">or create a new one to get started</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal - Add New Lead */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">
                        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold text-gray-800">Add New Lead</h2>
                            <button onClick={() => setShowModal(false)} className="bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors text-gray-500">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-8">
                            {/* Personal Info */}
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center">
                                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2 text-[10px]">1</span> Personal Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5 ">Full Name <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            id="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all focus:border-blue-500"
                                            placeholder="Enter customer name"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile Number <span className="text-red-500">*</span></label>
                                        <input
                                            type="tel"
                                            id="mobile"
                                            value={formData.mobile}
                                            onChange={handleInputChange}
                                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all focus:border-blue-500"
                                            placeholder="Enter 10 digit number"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">WhatsApp Number</label>
                                        <input
                                            type="tel"
                                            id="whatsapp"
                                            value={formData.whatsapp}
                                            onChange={handleInputChange}
                                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all focus:border-blue-500"
                                            placeholder="Optional"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                                        <input
                                            type="email"
                                            id="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all focus:border-blue-500"
                                            placeholder="Optional"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="h-px bg-gray-100"></div>

                            {/* Location */}
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center">
                                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2 text-[10px]">2</span> Location Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">District <span className="text-red-500">*</span></label>
                                        <select
                                            id="district"
                                            value={formData.district}
                                            onChange={handleInputChange}
                                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all focus:border-blue-500 bg-white"
                                            required
                                        >
                                            <option value="">Select District</option>
                                            {districts.map(d => (
                                                <option key={d._id} value={d._id}>{d.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">City / Cluster</label>
                                        <select
                                            id="city"
                                            value={formData.city}
                                            onChange={handleInputChange}
                                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all focus:border-blue-500 bg-white"
                                            disabled={!formData.district}
                                        >
                                            <option value="">Select City</option>
                                            {citiesList.map(c => (
                                                <option key={c._id} value={c._id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="h-px bg-gray-100"></div>

                            {/* Solar Info */}
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center">
                                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2 text-[10px]">3</span> Solar Requirements
                                </h3>
                                <div className="space-y-5">
                                    {/* Type Selection */}
                                    <div className="flex gap-4">
                                        <label className={`flex-1 p-4 border rounded-xl cursor-pointer transition-all ${formData.solarType === 'Residential' ? 'bg-green-50 border-green-500 text-green-700 shadow-sm' : 'hover:bg-gray-50 border-gray-200'
                                            }`}>
                                            <input
                                                type="radio"
                                                name="solarType"
                                                value="Residential"
                                                checked={formData.solarType === 'Residential'}
                                                onChange={(e) => setFormData({ ...formData, solarType: e.target.value })}
                                                className="hidden"
                                            />
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Home size={24} className={formData.solarType === 'Residential' ? 'text-green-600' : 'text-gray-400'} />
                                                <span className="font-semibold">Residential</span>
                                            </div>
                                        </label>
                                        <label className={`flex-1 p-4 border rounded-xl cursor-pointer transition-all ${formData.solarType === 'Commercial' ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' : 'hover:bg-gray-50 border-gray-200'
                                            }`}>
                                            <input
                                                type="radio"
                                                name="solarType"
                                                value="Commercial"
                                                checked={formData.solarType === 'Commercial'}
                                                onChange={(e) => setFormData({ ...formData, solarType: e.target.value })}
                                                className="hidden"
                                            />
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Building2 size={24} className={formData.solarType === 'Commercial' ? 'text-blue-600' : 'text-gray-400'} />
                                                <span className="font-semibold">Commercial</span>
                                            </div>
                                        </label>
                                    </div>

                                    {/* Connection Type */}
                                    <div className="flex gap-4">
                                        <label className={`flex-1 p-3 border rounded-xl cursor-pointer transition-all ${formData.subType === 'onGrid' ? 'bg-orange-50 border-orange-500 text-orange-700' : 'hover:bg-gray-50 border-gray-200'
                                            }`}>
                                            <input
                                                type="radio"
                                                id="onGrid"
                                                name="subType"
                                                checked={formData.subType === 'onGrid'}
                                                onChange={handleRadioChange}
                                                className="hidden"
                                            />
                                            <div className="flex items-center justify-center gap-2">
                                                <Sun size={20} className={formData.subType === 'onGrid' ? 'text-orange-500' : 'text-gray-400'} />
                                                <span className="font-medium">On Grid</span>
                                            </div>
                                        </label>
                                        <label className={`flex-1 p-3 border rounded-xl cursor-pointer transition-all ${formData.subType === 'offGrid' ? 'bg-purple-50 border-purple-500 text-purple-700' : 'hover:bg-gray-50 border-gray-200'
                                            }`}>
                                            <input
                                                type="radio"
                                                id="offGrid"
                                                name="subType"
                                                checked={formData.subType === 'offGrid'}
                                                onChange={handleRadioChange}
                                                className="hidden"
                                            />
                                            <div className="flex items-center justify-center gap-2">
                                                <Battery size={20} className={formData.subType === 'offGrid' ? 'text-purple-500' : 'text-gray-400'} />
                                                <span className="font-medium">Off Grid/Hybrid</span>
                                            </div>
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Required Capacity (KW) <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                id="kw"
                                                value={formData.kw}
                                                onChange={handleInputChange}
                                                placeholder="e.g. 3.5"
                                                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all focus:border-blue-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Approx. Monthly Bill (₹)</label>
                                            <input
                                                type="number"
                                                id="billAmount"
                                                value={formData.billAmount}
                                                onChange={handleInputChange}
                                                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all focus:border-blue-500"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 transform hover:-translate-y-0.5"
                            >
                                Create Lead
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DealerLead;