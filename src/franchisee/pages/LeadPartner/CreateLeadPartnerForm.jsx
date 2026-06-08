import React, { useState, useEffect } from 'react';
import {
    User,
    Phone,
    Mail,
    MapPin,
    ArrowLeft,
    Save,
    CheckCircle2,
    Briefcase,
    FileText,
    Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { locationAPI, masterAPI } from '../../../api/api';
import { productApi } from '../../../api/productApi';

const CreateLeadPartnerForm = () => {
    const navigate = useNavigate();
    const [districts, setDistricts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        role: 'Lead Partner',
        district: '',
        category: '',
        subCategory: '',
        projectType: '',
        subProjectType: '',
        aadhaarCard: '',
        panCard: ''
    });

    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [projectTypes, setProjectTypes] = useState([]);
    const [subProjectTypes, setSubProjectTypes] = useState([]);

    const [aadhaarVerified, setAadhaarVerified] = useState(false);
    const [panVerified, setPanVerified] = useState(false);

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

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await masterAPI.getAllCategories();
                if (response.data && response.data.data) {
                    setCategories(response.data.data);
                }
            } catch (error) {
                console.error("Error fetching categories:", error);
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        const fetchSubCategories = async () => {
            if (!formData.category) return setSubCategories([]);
            try {
                const response = await masterAPI.getAllSubCategories({ categoryId: formData.category });
                if (response.data && response.data.data) {
                    setSubCategories(response.data.data);
                }
            } catch (error) {
                console.error("Error fetching sub categories:", error);
            }
        };
        fetchSubCategories();
    }, [formData.category]);

    useEffect(() => {
        const fetchProjectTypes = async () => {
            if (!formData.category) return setProjectTypes([]);
            try {
                const response = await productApi.getProjectCategoryMappings({ categoryId: formData.category });
                if (response.data && response.data.data) {
                    const mappings = response.data.data;
                    
                    const uniqueRanges = [];
                    const map = new Map();
                    mappings.forEach(m => {
                        const label = `${m.projectTypeFrom} to ${m.projectTypeTo} kW`;
                        if(!map.has(label)) {
                            map.set(label, true);
                            uniqueRanges.push({ _id: label, name: label, original: m });
                        }
                    });
                    setProjectTypes(uniqueRanges);
                }
            } catch (error) {
                console.error("Error fetching project types:", error);
            }
        };
        fetchProjectTypes();
    }, [formData.category]);

    useEffect(() => {
        const fetchSubProjectTypes = async () => {
            if (!formData.projectType || !formData.category) return setSubProjectTypes([]);
            try {
                const response = await productApi.getProjectCategoryMappings({ categoryId: formData.category });
                if (response.data && response.data.data) {
                    const mappings = response.data.data.filter(m => 
                        `${m.projectTypeFrom} to ${m.projectTypeTo} kW` === formData.projectType
                    );
                    
                    const uniqueSubTypes = [];
                    const map = new Map();
                    mappings.forEach(m => {
                        const subTypeId = m.subProjectTypeId?._id || m.subProjectTypeId;
                        const subTypeName = m.subProjectTypeId?.name || 'On-Grid';
                        if (subTypeId && !map.has(subTypeId)) {
                            map.set(subTypeId, true);
                            uniqueSubTypes.push({ _id: subTypeId, name: subTypeName });
                        }
                    });
                    if (uniqueSubTypes.length === 0) {
                        const fallbackResponse = await masterAPI.getAllSubProjectTypes();
                        if (fallbackResponse.data && fallbackResponse.data.data) {
                             setSubProjectTypes(fallbackResponse.data.data);
                        } else {
                             setSubProjectTypes([{ _id: 'default', name: 'On-Grid' }]);
                        }
                    } else {
                        setSubProjectTypes(uniqueSubTypes);
                    }
                }
            } catch (error) {
                console.error("Error fetching sub project types:", error);
            }
        };
        fetchSubProjectTypes();
    }, [formData.projectType, formData.category]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleVerifyAadhaar = () => {
        if (formData.aadhaarCard.length === 12) {
            setAadhaarVerified(true);
        } else {
            alert('Please enter a valid 12-digit Aadhaar number');
        }
    };

    const handleVerifyPan = () => {
        if (formData.panCard.length === 10) {
            setPanVerified(true);
        } else {
            alert('Please enter a valid 10-character PAN number');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!aadhaarVerified || !panVerified) {
            alert("Please verify both Aadhaar and PAN Card before submitting.");
            return;
        }

        setLoading(true);

        // Simulate direct User Creation API call
        setTimeout(() => {
            setLoading(false);
            setSuccess(true);
            setTimeout(() => {
                navigate('/franchisee/lead-partner');
            }, 2000);
        }, 1500);
    };

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white rounded-xl shadow-sm p-8 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 size={48} className="text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Lead Partner Created!</h2>
                <p className="text-gray-600">The new lead partner has been successfully created directly.</p>
                <p className="text-sm text-gray-500 mt-4">Redirecting back...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-6 max-w-4xl">
            {/* Header */}
            <div className="flex items-center mb-6">
                <button
                    onClick={() => navigate('/franchisee/lead-partner/create')}
                    className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft size={24} className="text-gray-600" />
                </button>
                <h1 className="text-2xl font-bold text-gray-800">Create New Lead Partner</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Basic Info Section */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-blue-600 flex items-center">
                                <User size={20} className="mr-2" />
                                Basic Information
                            </h2>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="Enter full name"
                                    value={formData.name}
                                    onChange={handleChange}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <div className="relative">
                                    <Phone size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="tel"
                                        name="phone"
                                        required
                                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="+91 00000 00000"
                                        value={formData.phone}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <div className="relative">
                                    <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="email@example.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Assignment Section */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-blue-600 flex items-center">
                                <Briefcase size={20} className="mr-2" />
                                Assignment
                            </h2>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-gray-500 outline-none"
                                    value="Lead Partner"
                                    readOnly
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                                <div className="relative">
                                    <MapPin size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <select
                                        name="district"
                                        required
                                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        value={formData.district}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select District</option>
                                        {districts.map(d => (
                                            <option key={d._id} value={d._id}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Project Options */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Project Category</label>
                                <select
                                    name="category"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                                    value={formData.category}
                                    onChange={handleChange}
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(c => (
                                        <option key={c._id} value={c._id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Sub Category</label>
                                <select
                                    name="subCategory"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                                    value={formData.subCategory}
                                    onChange={handleChange}
                                    disabled={!formData.category}
                                >
                                    <option value="">Select Sub Category</option>
                                    {subCategories.map(s => (
                                        <option key={s._id} value={s._id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Project Type</label>
                                <select
                                    name="projectType"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                                    value={formData.projectType}
                                    onChange={handleChange}
                                    disabled={!formData.subCategory}
                                >
                                    <option value="">Select Project Type</option>
                                    {projectTypes.map(p => (
                                        <option key={p._id} value={p._id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Sub Project Type</label>
                                <select
                                    name="subProjectType"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                                    value={formData.subProjectType}
                                    onChange={handleChange}
                                    disabled={!formData.projectType}
                                >
                                    <option value="">Select Sub Project Type</option>
                                    {subProjectTypes.map(s => (
                                        <option key={s._id} value={s._id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Document Information Section */}
                        <div className="space-y-4 md:col-span-2 mt-4 pt-4 border-t">
                            <h2 className="text-lg font-semibold text-blue-600 flex items-center">
                                <FileText size={20} className="mr-2" />
                                Document Information
                            </h2>
                            <p className="text-sm text-red-500 mb-4 bg-red-50 p-3 rounded-md border border-red-100">
                                Yeh lead partner banane ka form hai - Aadhaar and PAN verified hoge API se and form submit ho sakta hai warna nahi!!
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Aadhaar */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Aadhaar Card Number</label>
                                    <div className="flex">
                                        <input
                                            type="text"
                                            name="aadhaarCard"
                                            maxLength="12"
                                            required
                                            className={`w-full px-4 py-2 border rounded-l-lg outline-none transition-all ${aadhaarVerified ? 'bg-gray-50 border-green-300 text-gray-500' : 'focus:ring-2 focus:ring-blue-500'}`}
                                            placeholder="12 digit Aadhaar Number"
                                            value={formData.aadhaarCard}
                                            onChange={handleChange}
                                            readOnly={aadhaarVerified}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleVerifyAadhaar}
                                            disabled={aadhaarVerified}
                                            className={`px-4 py-2 rounded-r-lg font-medium transition-colors border flex items-center ${aadhaarVerified ? 'bg-green-500 text-white border-green-500' : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'}`}
                                        >
                                            {aadhaarVerified ? <><Check size={16} className="mr-1"/> Verified</> : 'Verify'}
                                        </button>
                                    </div>
                                </div>

                                {/* PAN */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">PAN Card Number</label>
                                    <div className="flex">
                                        <input
                                            type="text"
                                            name="panCard"
                                            maxLength="10"
                                            required
                                            className={`w-full px-4 py-2 border rounded-l-lg outline-none transition-all uppercase ${panVerified ? 'bg-gray-50 border-green-300 text-gray-500' : 'focus:ring-2 focus:ring-blue-500'}`}
                                            placeholder="10 character PAN Number"
                                            value={formData.panCard}
                                            onChange={handleChange}
                                            readOnly={panVerified}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleVerifyPan}
                                            disabled={panVerified}
                                            className={`px-4 py-2 rounded-r-lg font-medium transition-colors border flex items-center ${panVerified ? 'bg-green-500 text-white border-green-500' : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'}`}
                                        >
                                            {panVerified ? <><Check size={16} className="mr-1"/> Verified</> : 'Verify'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end space-x-4">
                    <button
                        type="button"
                        onClick={() => navigate('/franchisee/lead-partner/create')}
                        className="px-6 py-2 text-gray-600 font-medium hover:text-gray-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`bg-blue-600 text-white px-8 py-2 rounded-lg font-semibold flex items-center shadow-lg hover:bg-blue-700 transition-all ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {loading ? (
                            <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Creating...
                            </span>
                        ) : (
                            <>
                                <Save size={18} className="mr-2" />
                                Create Lead Partner
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateLeadPartnerForm;
