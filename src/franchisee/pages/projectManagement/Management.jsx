import React, { useState } from 'react';
import {
    Home,
    Building2,
    Factory,
    Filter,
    X,
    ChevronRight,
    Sun,
    Zap,
    Battery,
    ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCategories, getSubCategories, getProjectTypes, getSubProjectTypes } from '../../../services/core/masterApi';

const ProjectManagement = () => {
    const navigate = useNavigate();
    // State for filters
    const [filters, setFilters] = useState({
        category: '',
        subCategory: '',
        projectType: '',
        subProjectType: ''
    });

    // State for selected customer type
    const [selectedCustomerType, setSelectedCustomerType] = useState(null);

    // Dynamic Filter options
    const [dynamicOptions, setDynamicOptions] = useState({
        categories: [],
        subCategories: [],
        projectTypes: [],
        subProjectTypes: []
    });

    React.useEffect(() => {
        const fetchOptions = async () => {
            try {
                const [catRes, subCatRes, ptRes, sptRes] = await Promise.all([
                    getCategories(),
                    getSubCategories(),
                    getProjectTypes(),
                    getSubProjectTypes()
                ]);

                setDynamicOptions({
                    categories: Array.isArray(catRes?.data) ? catRes.data : Array.isArray(catRes) ? catRes : [],
                    subCategories: Array.isArray(subCatRes?.data) ? subCatRes.data : Array.isArray(subCatRes) ? subCatRes : [],
                    projectTypes: Array.isArray(ptRes?.data) ? ptRes.data : Array.isArray(ptRes) ? ptRes : [],
                    subProjectTypes: Array.isArray(sptRes?.data) ? sptRes.data : Array.isArray(sptRes) ? sptRes : []
                });
            } catch (error) {
                console.error("Error fetching project management options:", error);
            }
        };
        fetchOptions();
    }, []);

    // Handle filter changes
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));

        // Auto-hide cards based on sub-category selection
        // Auto-hide cards based on sub-category selection
        if (name === 'subCategory') {
            if (value) {
                setSelectedCustomerType(value);
            } else {
                setSelectedCustomerType(null);
            }
        }
    };

    // Clear all filters
    const clearFilters = () => {
        setFilters({
            category: '',
            subCategory: '',
            projectType: '',
            subProjectType: ''
        });
        setSelectedCustomerType(null);
    };

    // Handle customer type selection
    const handleCustomerTypeSelect = (type) => {
        setSelectedCustomerType(type);
    };

    // Handle continue button click
    const handleContinue = () => {
        if (selectedCustomerType) {
            // Convert 'Residential' to 'residential-project', etc.
            const routeType = selectedCustomerType.toLowerCase().replace(/\s+/g, '-');
            navigate(`/franchisee/${routeType}-project`);
        }
    };

    // Check if continue button should be enabled
    const isContinueEnabled = selectedCustomerType !== null;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-6">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm mb-6">
                    <div className="p-4">
                        <h4 className="text-blue-600 font-bold text-lg">Project Management</h4>
                    </div>
                </div>

                {/* Filter Section */}
                <div className="bg-white rounded-lg shadow-sm mb-6">
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Category Filter */}
                            <div>
                                <select
                                    name="category"
                                    value={filters.category}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Filter by Category</option>
                                    {dynamicOptions.categories.map(option => (
                                        <option key={option._id || option.name} value={option.name}>
                                            {option.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Sub-Category Filter */}
                            <div>
                                <select
                                    name="subCategory"
                                    value={filters.subCategory}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Filter by Sub-Category</option>
                                    {dynamicOptions.subCategories.map(option => (
                                        <option key={option._id || option.name} value={option.name}>
                                            {option.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Project Type Filter */}
                            <div>
                                <select
                                    name="projectType"
                                    value={filters.projectType}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Filter by Project Type</option>
                                    {dynamicOptions.projectTypes.map(option => (
                                        <option key={option._id || option.name} value={option.name}>
                                            {option.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Sub Project Type Filter */}
                            <div>
                                <select
                                    name="subProjectType"
                                    value={filters.subProjectType}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Filter by Sub Project Type</option>
                                    {dynamicOptions.subProjectTypes.map(option => (
                                        <option key={option._id || option.name} value={option.name}>
                                            {option.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Clear Filters Button */}
                        <div className="flex justify-end mt-4">
                            <button
                                onClick={clearFilters}
                                className="px-3 py-1.5 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 text-sm flex items-center"
                            >
                                <X size={16} className="mr-1" />
                                Clear Filters
                            </button>
                        </div>
                    </div>
                </div>

                {/* Customer Type Selection */}
                <div className="text-center mt-8">
                    <h3 className="text-blue-600 font-bold text-2xl mb-2">Select Customer Type</h3>
                    <p className="text-gray-500 mb-6">Choose one to continue</p>

                    <div className="flex flex-col md:flex-row justify-center gap-6 max-w-3xl mx-auto">
                        {dynamicOptions.subCategories.map((subCat) => {
                            const name = subCat.name;
                            if (!name) return null;
                            const isSelected = selectedCustomerType === name;
                            const isHidden = filters.subCategory && filters.subCategory !== name;
                            
                            // Choose icon based on name
                            let Icon = Building2;
                            if (name.toLowerCase().includes('residential')) Icon = Home;
                            else if (name.toLowerCase().includes('industrial') || name.toLowerCase().includes('factory')) Icon = Factory;
                            else if (name.toLowerCase().includes('solar')) Icon = Sun;
                            
                            return (
                                <div
                                    key={subCat._id || name}
                                    onClick={() => handleCustomerTypeSelect(name)}
                                    className={`flex-1 min-w-[250px] cursor-pointer transition-all ${isHidden ? 'hidden' : 'block'}`}
                                >
                                    <div
                                        className={`bg-white rounded-lg shadow-md p-8 text-center border-2 transition-all ${isSelected
                                            ? 'border-blue-500 shadow-lg ring-2 ring-blue-200'
                                            : 'border-gray-200 hover:shadow-lg hover:border-blue-300'
                                            }`}
                                    >
                                        <Icon
                                            size={56}
                                            className={`mx-auto mb-3 ${isSelected ? 'text-blue-500' : 'text-blue-400'}`}
                                        />
                                        <h4 className="font-bold text-xl mb-2">{name}</h4>
                                        <p className="text-gray-500 text-sm">For {name.toLowerCase()} purposes</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Continue Button */}
                    <button
                        onClick={handleContinue}
                        disabled={!isContinueEnabled}
                        className={`mt-8 px-8 py-3 rounded-md text-white font-semibold text-lg flex items-center justify-center mx-auto transition-colors ${isContinueEnabled
                            ? 'bg-blue-600 hover:bg-blue-700'
                            : 'bg-gray-300 cursor-not-allowed'
                            }`}
                    >
                        Continue
                        <ArrowRight size={20} className="ml-2" />
                    </button>
                </div>

                {/* Summary of Selections (Optional - for better UX) */}
                {(filters.category || filters.subCategory || filters.projectType || filters.subProjectType || selectedCustomerType) && (
                    <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h5 className="font-semibold text-blue-700 mb-2">Current Selections:</h5>
                        <div className="flex flex-wrap gap-2">
                            {filters.category && (
                                <span className="px-2 py-1 bg-white text-blue-600 text-sm rounded-full border border-blue-200">
                                    Category: {filters.category}
                                </span>
                            )}
                            {filters.subCategory && (
                                <span className="px-2 py-1 bg-white text-blue-600 text-sm rounded-full border border-blue-200">
                                    Sub-Category: {filters.subCategory}
                                </span>
                            )}
                            {filters.projectType && (
                                <span className="px-2 py-1 bg-white text-blue-600 text-sm rounded-full border border-blue-200">
                                    Project Type: {filters.projectType}
                                </span>
                            )}
                            {filters.subProjectType && (
                                <span className="px-2 py-1 bg-white text-blue-600 text-sm rounded-full border border-blue-200">
                                    Sub Project Type: {filters.subProjectType}
                                </span>
                            )}
                            {selectedCustomerType && (
                                <span className="px-2 py-1 bg-white text-blue-600 text-sm rounded-full border border-blue-200">
                                    Customer Type: {selectedCustomerType}
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectManagement;