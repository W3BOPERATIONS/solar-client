import React, { useState, useEffect } from 'react';
import {
    User,
    Phone,
    Mail,
    MapPin,
    CheckCircle2,
    CreditCard
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { locationAPI, masterAPI } from '../../../api/api';
import { productApi } from '../../../api/productApi';
import { createApproval } from '../../../services/approvals/approvalsApi';

const CreateDistrictManager = () => {
    const navigate = useNavigate();
    const [districts, setDistricts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        district: '',
        category: [],
        subCategory: [],
        projectType: [],
        subProjectType: [],
        aadhaarCard: '',
        panCard: ''
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
                type: 'districtManager',
                requestedBy: 'Franchisee User',
                data: {
                    ...formData,
                    password: 'defaultPassword123',
                    role: 'franchiseeManager',
                    districtId: formData.district,
                    district: districtName,
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
                    state: 'Gujarat',
                    district: districtName
                }
            });
            setSuccess(true);
            setTimeout(() => {
                navigate('/franchisee/district-manager');
            }, 2000);
        } catch (error) {
            console.error("Error creating district manager approval request:", error);
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
                <h2 className="text-2xl font-bold text-gray-800 mb-2">District Manager Created!</h2>
                <p className="text-gray-600">The new district manager has been successfully created and added to your region.</p>
                <p className="text-sm text-gray-500 mt-4">Redirecting back...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-6 max-w-4xl">
            <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-8">
                    <h1 className="text-xl font-bold text-blue-700 mb-8">Create New District Manager</h1>
                    
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div>
                            <h2 className="text-sm font-semibold text-gray-700 mb-4">User Information</h2>
                            <div className="space-y-4">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <User size={18} className="text-gray-500" />
                                    </div>
                                    <input
                                        type="text"
                                        name="name"
                                        required
                                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                                        placeholder="Full Name"
                                        value={formData.name}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail size={18} className="text-gray-500" />
                                    </div>
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                                        placeholder="Email Address"
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="relative flex items-center">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Phone size={18} className="text-gray-500" />
                                    </div>
                                    <input
                                        type="tel"
                                        name="phone"
                                        required
                                        className="w-full pl-12 pr-20 py-3 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                                        placeholder="Phone Number"
                                        value={formData.phone}
                                        onChange={handleChange}
                                    />
                                    <button type="button" className="absolute right-4 text-blue-600 text-sm font-semibold hover:text-blue-800">
                                        Verify
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-sm font-semibold text-gray-700 mb-4">Select District</h2>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <MapPin size={18} className="text-gray-500" />
                                </div>
                                <select
                                    name="district"
                                    required
                                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm appearance-none bg-white"
                                    value={formData.district}
                                    onChange={handleChange}
                                >
                                    <option value="" disabled>Choose your district</option>
                                    {districts.map(d => (
                                        <option key={d._id} value={d._id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-sm font-semibold text-gray-700 mb-4">Project Details</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Select
                                    isMulti
                                    name="category"
                                    placeholder="Select Project Category"
                                    options={categories.map(c => ({ value: c._id, label: c.name }))}
                                    className="text-sm"
                                    value={formData.category}
                                    onChange={(val) => handleSelectChange('category', val)}
                                />
                                <Select
                                    isMulti
                                    name="subCategory"
                                    placeholder="Select Sub Category"
                                    options={subCategories.map(sc => ({ value: sc._id, label: sc.name }))}
                                    className="text-sm"
                                    value={formData.subCategory}
                                    onChange={(val) => handleSelectChange('subCategory', val)}
                                />
                                <Select
                                    isMulti
                                    name="projectType"
                                    placeholder="Select Project Type"
                                    options={projectTypes.map(pt => ({ value: pt._id, label: pt.name }))}
                                    className="text-sm"
                                    value={formData.projectType}
                                    onChange={(val) => handleSelectChange('projectType', val)}
                                />
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

                        {/* Document Information */}
                        <div>
                            <h2 className="text-sm font-semibold text-gray-700 mb-4">Document Information</h2>
                            <div className="space-y-4">
                                <div className="relative flex items-center">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <CreditCard size={18} className="text-gray-500" />
                                    </div>
                                    <input
                                        type="text"
                                        name="aadhaarCard"
                                        required
                                        className="w-full pl-12 pr-20 py-3 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                                        placeholder="Aadhaar Card Number"
                                        value={formData.aadhaarCard}
                                        onChange={handleChange}
                                    />
                                    <button type="button" className="absolute right-4 text-blue-600 text-sm font-semibold hover:text-blue-800">
                                        Verify
                                    </button>
                                </div>

                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <CreditCard size={18} className="text-gray-500" />
                                    </div>
                                    <input
                                        type="text"
                                        name="panCard"
                                        required
                                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                                        placeholder="PAN Card Number"
                                        value={formData.panCard}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`bg-teal-500 text-white px-6 py-2.5 rounded-md font-semibold text-sm hover:bg-teal-600 transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {loading ? 'Creating...' : 'Create Admin Account'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateDistrictManager;
