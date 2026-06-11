import React, { useState, useEffect } from 'react';
import {
    User,
    Phone,
    Mail,
    MapPin,
    ArrowLeft,
    Save,
    CheckCircle2,
    Briefcase
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { locationAPI, masterAPI } from '../../../api/api';
import { productApi } from '../../../api/productApi';
import { createApproval } from '../../../services/approvals/approvalsApi';

const CreateDealerManager = () => {
    const navigate = useNavigate();
    const [districts, setDistricts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        role: 'Dealer Manager',
        district: '',
        category: [],
        subCategory: [],
        projectType: [],
        subProjectType: [],
    });

    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [projectTypes, setProjectTypes] = useState([]);
    const [subProjectTypes, setSubProjectTypes] = useState([]);

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
            if (!formData.category || formData.category.length === 0) return setSubCategories([]);
            try {
                const promises = formData.category.map(cat => masterAPI.getAllSubCategories({ categoryId: cat.value }));
                const responses = await Promise.all(promises);
                let allSubCats = [];
                responses.forEach(res => {
                    if (res.data && res.data.data) {
                        allSubCats = [...allSubCats, ...res.data.data];
                    }
                });
                const uniqueSubCats = Array.from(new Map(allSubCats.map(item => [item._id, item])).values());
                setSubCategories(uniqueSubCats);
            } catch (error) {
                console.error("Error fetching sub categories:", error);
            }
        };
        fetchSubCategories();
    }, [formData.category]);

    useEffect(() => {
        const fetchProjectTypes = async () => {
            if (!formData.category || formData.category.length === 0) return setProjectTypes([]);
            try {
                const promises = formData.category.map(cat => productApi.getProjectCategoryMappings({ categoryId: cat.value }));
                const responses = await Promise.all(promises);
                const uniqueRanges = [];
                const map = new Map();
                responses.forEach(response => {
                    if (response.data && response.data.data) {
                        response.data.data.forEach(m => {
                            const label = `${m.projectTypeFrom} to ${m.projectTypeTo} kW`;
                            if(!map.has(label)) {
                                map.set(label, true);
                                uniqueRanges.push({ _id: label, name: label, original: m });
                            }
                        });
                    }
                });
                setProjectTypes(uniqueRanges);
            } catch (error) {
                console.error("Error fetching project types:", error);
            }
        };
        fetchProjectTypes();
    }, [formData.category]);

    useEffect(() => {
        const fetchSubProjectTypes = async () => {
            if (!formData.projectType || formData.projectType.length === 0 || !formData.category || formData.category.length === 0) return setSubProjectTypes([]);
            try {
                const promises = formData.category.map(cat => productApi.getProjectCategoryMappings({ categoryId: cat.value }));
                const responses = await Promise.all(promises);
                
                let uniqueSubTypes = [];
                const map = new Map();
                const selectedProjectTypes = formData.projectType.map(pt => pt.value);
                
                responses.forEach(response => {
                    if (response.data && response.data.data) {
                        const mappings = response.data.data.filter(m => 
                            selectedProjectTypes.includes(`${m.projectTypeFrom} to ${m.projectTypeTo} kW`)
                        );
                        
                        mappings.forEach(m => {
                            const subTypeId = m.subProjectTypeId?._id || m.subProjectTypeId;
                            const subTypeName = m.subProjectTypeId?.name || 'On-Grid';
                            if (subTypeId && !map.has(subTypeId)) {
                                map.set(subTypeId, true);
                                uniqueSubTypes.push({ _id: subTypeId, name: subTypeName });
                            }
                        });
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
            } catch (error) {
                console.error("Error fetching sub project types:", error);
            }
        };
        fetchSubProjectTypes();
    }, [formData.projectType, formData.category]);

    const handleSelectChange = (name, selectedOptions) => {
        setFormData(prev => ({
            ...prev,
            [name]: selectedOptions || []
        }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const districtName = districts.find(d => d._id === formData.district)?.name || formData.district;
        
        const categoryIds = formData.category.map(c => c.value);
        const categoryNames = formData.category.map(c => c.label).join(', ');
        
        const subCategoryIds = formData.subCategory.map(c => c.value);
        const subCategoryNames = formData.subCategory.map(c => c.label).join(', ');
        
        const projectTypeIds = formData.projectType.map(c => c.value);
        const projectTypeNames = formData.projectType.map(c => c.label).join(', ');
        
        const subProjectTypeIds = formData.subProjectType.map(c => c.value);
        const subProjectTypeNames = formData.subProjectType.map(c => c.label).join(', ');

        try {
            await createApproval({
                type: 'dealerManager',
                requestedBy: 'Franchisee User',
                data: {
                    ...formData,
                    password: 'defaultPassword123',
                    role: 'dealerManager',
                    districtId: formData.district, // ObjectId for User creation
                    district: districtName, // String for display in Approvals table
                    categoryId: categoryIds.length === 1 ? categoryIds[0] : categoryIds,
                    category: categoryNames,
                    subCategoryId: subCategoryIds.length === 1 ? subCategoryIds[0] : subCategoryIds,
                    subCategory: subCategoryNames,
                    projectTypeId: projectTypeIds.length === 1 ? projectTypeIds[0] : projectTypeIds,
                    projectType: projectTypeNames,
                    subProjectTypeId: subProjectTypeIds.length === 1 ? subProjectTypeIds[0] : subProjectTypeIds,
                    subProjectType: subProjectTypeNames
                },
                location: {
                    state: 'Gujarat', // Placeholder state
                    district: districtName
                }
            });
            setSuccess(true);
            setTimeout(() => {
                navigate('/franchisee/dealer-manager');
            }, 2000);
        } catch (error) {
            console.error("Error creating dealer manager approval request:", error);
            alert(error.message || "Error submitting request");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white rounded-xl shadow-sm p-8 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 size={48} className="text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Dealer Manager Created!</h2>
                <p className="text-gray-600">The new dealer manager has been successfully created and assigned to the district.</p>
                <p className="text-sm text-gray-500 mt-4">Redirecting back...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-6 max-w-4xl">
            {/* Header */}
            <div className="flex items-center mb-6">
                <button
                    onClick={() => navigate('/franchisee/dealer-manager')}
                    className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft size={24} className="text-gray-600" />
                </button>
                <h1 className="text-2xl font-bold text-gray-800">Create New Dealer Manager</h1>
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
                                    value="Dealer Manager"
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
                                <Select
                                    isMulti
                                    name="category"
                                    placeholder="Select Category"
                                    options={categories.map(c => ({ value: c._id, label: c.name }))}
                                    className="text-sm"
                                    value={formData.category}
                                    onChange={(val) => handleSelectChange('category', val)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Sub Category</label>
                                <Select
                                    isMulti
                                    name="subCategory"
                                    placeholder="Select Sub Category"
                                    options={subCategories.map(sc => ({ value: sc._id, label: sc.name }))}
                                    className="text-sm"
                                    value={formData.subCategory}
                                    onChange={(val) => handleSelectChange('subCategory', val)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Project Type</label>
                                <Select
                                    isMulti
                                    name="projectType"
                                    placeholder="Select Project Type"
                                    options={projectTypes.map(pt => ({ value: pt._id, label: pt.name }))}
                                    className="text-sm"
                                    value={formData.projectType}
                                    onChange={(val) => handleSelectChange('projectType', val)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Sub Project Type</label>
                                <Select
                                    isMulti
                                    name="subProjectType"
                                    placeholder="Select Sub Project Type"
                                    options={subProjectTypes.map(spt => ({ value: spt._id, label: spt.name }))}
                                    className="text-sm"
                                    value={formData.subProjectType}
                                    onChange={(val) => handleSelectChange('subProjectType', val)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end space-x-4">
                    <button
                        type="button"
                        onClick={() => navigate('/franchisee/dealer-manager')}
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
                                Create Manager
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateDealerManager;
