import React, { useState } from 'react';
import {
    MapPin,
    Building,
    Check,
    Edit,
    Save,
    X,
    ChevronRight,
    Home,
    Zap,
    Sun,
    Wind,
    Grid,
    Package,
    Settings,
    DollarSign,
    Calendar,
    CheckCircle,
    AlertCircle,
    Plus
} from 'lucide-react';

const FranchiseeManagerComboKitCustomization = () => {
    const [selectedState, setSelectedState] = useState(null);
    const [selectedCity, setSelectedCity] = useState(null);
    const [editingRow, setEditingRow] = useState(null);
    const [comboKits, setComboKits] = useState([]);
    const [loading, setLoading] = useState(false);

    React.useEffect(() => {
        const fetchComboKits = async () => {
            setLoading(true);
            try {
                const { data } = await import('../../../api/axios.js').then(m => m.default.get('/combokit/all-customized-combokits'));
                if (data.success && data.data) {
                    setComboKits(data.data);
                } else if (Array.isArray(data)) {
                    setComboKits(data);
                } else if (data.customizedComboKits) {
                    setComboKits(data.customizedComboKits);
                }
            } catch (error) {
                console.error("Error fetching combokits:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchComboKits();
    }, []);

    // State data with cities
    const stateData = {
        'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar', 'Bhavnagar'],
        'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Thane'],
        'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner'],
        'Punjab': ['Amritsar', 'Ludhiana', 'Jalandhar', 'Patiala', 'Chandigarh', 'Mohali']
    };

    // Dropdown options for each column
    const dropdownOptions = {
        franchiseeType: ['Startup', 'Enterprise', 'Solar Business'],
        franchiseeName: ['Sunshine Solar Pvt Ltd', 'GreenTech Energy', 'SolarMax India', 'EcoSolar Solutions'],
        category: ['Solar Panel', 'Inverter', 'BOS Kit', 'Mounting Structure'],
        subCategory: ['Residential', 'Commercial', 'Industrial', 'Utility'],
        projectType: ['1Kw-5Kw', '5Kw-10Kw', '10Kw-50Kw', '50Kw-100Kw'],
        subProjectType: ['OnGrid', 'OffGrid', 'Hybrid'],
        panel: ['Adani Solar Panel', 'Tata Solar Panel', 'Vikram Solar Panel', 'Waaree Solar Panel'],
        inverter: ['Adani Inverter', 'Tata Inverter', 'ABB Inverter', 'Sungrow Inverter'],
        bosKit: ['Adani BOS Kit', 'ABB BOS Kit', 'Generic BOS Kit', 'Havells BOS Kit'],
        totalSelling: ['10Kw', '20Kw', '50Kw', '100Kw', '250Kw', '500Kw'],
        totalDays: ['7 days', '15 days', '30 days', '45 days', '60 days']
    };

    const handleStateSelect = (state) => {
        setSelectedState(state);
        setSelectedCity(null);
    };

    const handleCitySelect = (city) => {
        setSelectedCity(city);
    };

    const handleCustomizeClick = (rowId) => {
        setEditingRow(rowId);
    };

    const handleDoneClick = (rowId) => {
        setEditingRow(null);
    };

    const handleValueChange = (rowId, field, value) => {
        setComboKits(prev =>
            prev.map(item =>
                item.id === rowId ? { ...item, [field]: value } : item
            )
        );
    };

    const handleApproval = (rowId, status) => {
        setComboKits(prev =>
            prev.map(item =>
                item.id === rowId ? { ...item, approval: status } : item
            )
        );
    };

    const addNewRow = () => {
        const newId = comboKits.length + 1;
        setComboKits([
            ...comboKits,
            {
                id: newId,
                franchiseeType: 'Startup',
                franchiseeName: 'New Franchisee',
                category: 'Solar Panel',
                subCategory: 'Residential',
                projectType: '1Kw-5Kw',
                subProjectType: 'OnGrid',
                panel: 'Standard Panel',
                inverter: 'Standard Inverter',
                bosKit: 'Standard BOS Kit',
                totalSelling: '10Kw',
                totalDays: '15 days',
                approval: 'pending'
            }
        ]);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-6">
                {/* Header with Breadcrumb */}
                <div className="mb-6">
                    <nav className="flex" aria-label="Breadcrumb">
                        <ol className="flex items-center space-x-2 text-sm">
                            <li className="text-gray-500 font-medium" aria-current="page">
                                <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                                    <Package className="mr-2 text-blue-500" size={24} />
                                    ComboKit Customization
                                </h3>
                            </li>
                        </ol>
                    </nav>
                </div>

                {/* State Selection */}
                <div className="mb-6">
                    <h5 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                        <MapPin size={18} className="mr-2 text-blue-500" />
                        Select State
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.keys(stateData).map((state) => (
                            <div
                                key={state}
                                onClick={() => handleStateSelect(state)}
                                className={`cursor-pointer rounded-xl shadow-sm transition-all hover:shadow-md ${selectedState === state
                                        ? 'ring-2 ring-blue-500 bg-blue-50'
                                        : 'bg-white'
                                    }`}
                            >
                                <div className="p-4 text-center">
                                    <Building size={32} className="mx-auto mb-2 text-blue-500" />
                                    <h5 className="font-bold text-gray-800">{state}</h5>
                                    <p className="text-xs text-gray-500">{state.substring(0, 2).toUpperCase()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* City Selection */}
                {selectedState && (
                    <div className="mb-6">
                        <h5 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                            <Home size={18} className="mr-2 text-blue-500" />
                            Select City in {selectedState}
                        </h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {stateData[selectedState].map((city) => (
                                <div
                                    key={city}
                                    onClick={() => handleCitySelect(city)}
                                    className={`cursor-pointer rounded-lg shadow-sm transition-all hover:shadow-md ${selectedCity === city
                                            ? 'ring-2 ring-blue-500 bg-blue-50'
                                            : 'bg-white'
                                        }`}
                                >
                                    <div className="p-3 text-center">
                                        <h6 className="font-medium text-gray-700">{city}</h6>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Selected Location Display */}
                {selectedState && selectedCity && (
                    <div className="bg-blue-50 rounded-lg p-4 mb-6 flex items-center justify-between">
                        <div className="flex items-center">
                            <MapPin size={18} className="text-blue-500 mr-2" />
                            <span className="text-sm text-gray-700">
                                <span className="font-semibold">Selected Location:</span> {selectedCity}, {selectedState}
                            </span>
                        </div>
                        <button
                            onClick={addNewRow}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors flex items-center"
                        >
                            <Plus size={14} className="mr-1" />
                            Add New Configuration
                        </button>
                    </div>
                )}

                {/* ComboKit Table */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Customize Combokit</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Franchisee Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Franchisee Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Category</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Sub Category</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Project Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Sub Project Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Panel</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Inverter</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">BOS Kit</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Total Selling</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Total Days</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Approval</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan="13" className="text-center py-4 text-gray-500">Loading combo kits...</td>
                                    </tr>
                                ) : comboKits.length === 0 ? (
                                    <tr>
                                        <td colSpan="13" className="text-center py-4 text-gray-500">No customized combo kits found.</td>
                                    </tr>
                                ) : comboKits.map((kit, index) => {
                                    const kitId = kit._id || kit.id || index;
                                    return (
                                    <tr key={kitId} className="hover:bg-gray-50">
                                        {/* Customize Button Cell */}
                                        <td className="px-4 py-2 whitespace-nowrap">
                                            {editingRow === kitId ? (
                                                <button
                                                    onClick={() => handleDoneClick(kitId)}
                                                    className="px-3 py-1 bg-yellow-500 text-white text-xs rounded-md hover:bg-yellow-600 transition-colors flex items-center"
                                                >
                                                    <Save size={12} className="mr-1" />
                                                    Done
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleCustomizeClick(kitId)}
                                                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors flex items-center"
                                                >
                                                    <Settings size={12} className="mr-1" />
                                                    Customize
                                                </button>
                                            )}
                                        </td>

                                        {/* Editable Cells */}
                                        {editingRow === kitId ? (
                                            // Edit Mode - Dropdowns
                                            <>
                                                <td className="px-4 py-2">
                                                    <select
                                                        value={kit.franchiseeType || kit.franchisee?.type || ''}
                                                        onChange={(e) => handleValueChange(kitId, 'franchiseeType', e.target.value)}
                                                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    >
                                                        {dropdownOptions.franchiseeType.map(opt => (
                                                            <option key={opt} value={opt}>{opt}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-4 py-2">
                                                    <select
                                                        value={kit.franchiseeName || kit.franchisee?.name || ''}
                                                        onChange={(e) => handleValueChange(kitId, 'franchiseeName', e.target.value)}
                                                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    >
                                                        {dropdownOptions.franchiseeName.map(opt => (
                                                            <option key={opt} value={opt}>{opt}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-4 py-2">
                                                    <select
                                                        value={kit.category || kit.solarKit?.category?.name || ''}
                                                        onChange={(e) => handleValueChange(kitId, 'category', e.target.value)}
                                                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    >
                                                        {dropdownOptions.category.map(opt => (
                                                            <option key={opt} value={opt}>{opt}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-4 py-2">
                                                    <select
                                                        value={kit.subCategory || kit.solarKit?.subCategory?.name || ''}
                                                        onChange={(e) => handleValueChange(kitId, 'subCategory', e.target.value)}
                                                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    >
                                                        {dropdownOptions.subCategory.map(opt => (
                                                            <option key={opt} value={opt}>{opt}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-4 py-2">
                                                    <select
                                                        value={kit.projectType || kit.solarKit?.projectType?.name || ''}
                                                        onChange={(e) => handleValueChange(kitId, 'projectType', e.target.value)}
                                                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    >
                                                        {dropdownOptions.projectType.map(opt => (
                                                            <option key={opt} value={opt}>{opt}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-4 py-2">
                                                    <select
                                                        value={kit.subProjectType || kit.solarKit?.subProjectType?.name || ''}
                                                        onChange={(e) => handleValueChange(kitId, 'subProjectType', e.target.value)}
                                                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    >
                                                        {dropdownOptions.subProjectType.map(opt => (
                                                            <option key={opt} value={opt}>{opt}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-4 py-2">
                                                    <select
                                                        value={kit.panel || kit.customizations?.panel || ''}
                                                        onChange={(e) => handleValueChange(kitId, 'panel', e.target.value)}
                                                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    >
                                                        {dropdownOptions.panel.map(opt => (
                                                            <option key={opt} value={opt}>{opt}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-4 py-2">
                                                    <select
                                                        value={kit.inverter || kit.customizations?.inverter || ''}
                                                        onChange={(e) => handleValueChange(kitId, 'inverter', e.target.value)}
                                                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    >
                                                        {dropdownOptions.inverter.map(opt => (
                                                            <option key={opt} value={opt}>{opt}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-4 py-2">
                                                    <select
                                                        value={kit.bosKit || kit.customizations?.bosKit || ''}
                                                        onChange={(e) => handleValueChange(kitId, 'bosKit', e.target.value)}
                                                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    >
                                                        {dropdownOptions.bosKit.map(opt => (
                                                            <option key={opt} value={opt}>{opt}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-4 py-2">
                                                    <select
                                                        value={kit.totalSelling || kit.totalCapacity || ''}
                                                        onChange={(e) => handleValueChange(kitId, 'totalSelling', e.target.value)}
                                                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    >
                                                        {dropdownOptions.totalSelling.map(opt => (
                                                            <option key={opt} value={opt}>{opt}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-4 py-2">
                                                    <select
                                                        value={kit.totalDays || ''}
                                                        onChange={(e) => handleValueChange(kitId, 'totalDays', e.target.value)}
                                                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    >
                                                        {dropdownOptions.totalDays.map(opt => (
                                                            <option key={opt} value={opt}>{opt}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                            </>
                                        ) : (
                                            // View Mode - Static Text
                                            <>
                                                <td className="px-4 py-2 text-sm">{kit.franchiseeType || kit.franchisee?.type || '-'}</td>
                                                <td className="px-4 py-2 text-sm">{kit.franchiseeName || kit.franchisee?.name || '-'}</td>
                                                <td className="px-4 py-2 text-sm">{kit.category || kit.solarKit?.category?.name || '-'}</td>
                                                <td className="px-4 py-2 text-sm">{kit.subCategory || kit.solarKit?.subCategory?.name || '-'}</td>
                                                <td className="px-4 py-2 text-sm">{kit.projectType || kit.solarKit?.projectType?.name || '-'}</td>
                                                <td className="px-4 py-2 text-sm">{kit.subProjectType || kit.solarKit?.subProjectType?.name || '-'}</td>
                                                <td className="px-4 py-2 text-sm">{kit.panel || kit.customizations?.panel || kit.solarKit?.solarPanel?.name || '-'}</td>
                                                <td className="px-4 py-2 text-sm">{kit.inverter || kit.customizations?.inverter || kit.solarKit?.inverter?.name || '-'}</td>
                                                <td className="px-4 py-2 text-sm">{kit.bosKit || kit.customizations?.bosKit || kit.solarKit?.bosKit?.name || '-'}</td>
                                                <td className="px-4 py-2 text-sm">{kit.totalSelling || kit.totalCapacity || '-'}</td>
                                                <td className="px-4 py-2 text-sm">{kit.totalDays || '-'}</td>
                                            </>
                                        )}

                                        {/* Approval Button Cell */}
                                        <td className="px-4 py-2 whitespace-nowrap">
                                            {kit.approval === 'approved' || kit.status === 'Approved' ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    <CheckCircle size={14} className="mr-1" />
                                                    Approved
                                                </span>
                                            ) : kit.approval === 'rejected' || kit.status === 'Rejected' ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    <X size={14} className="mr-1" />
                                                    Rejected
                                                </span>
                                            ) : (
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleApproval(kitId, 'approved')}
                                                        className="p-1 rounded-full text-green-600 hover:bg-green-100 transition-colors"
                                                        title="Approve"
                                                    >
                                                        <Check size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleApproval(kitId, 'rejected')}
                                                        className="p-1 rounded-full text-red-600 hover:bg-red-100 transition-colors"
                                                        title="Reject"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-white rounded-xl shadow-sm p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Configurations</p>
                                <p className="text-2xl font-bold text-gray-700">{comboKits.length}</p>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-full">
                                <Package size={20} className="text-blue-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Approved</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {comboKits.filter(k => k.approval === 'approved').length}
                                </p>
                            </div>
                            <div className="bg-green-100 p-3 rounded-full">
                                <CheckCircle size={20} className="text-green-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Pending</p>
                                <p className="text-2xl font-bold text-orange-600">
                                    {comboKits.filter(k => k.approval === 'pending').length}
                                </p>
                            </div>
                            <div className="bg-orange-100 p-3 rounded-full">
                                <AlertCircle size={20} className="text-orange-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Rejected</p>
                                <p className="text-2xl font-bold text-red-600">
                                    {comboKits.filter(k => k.approval === 'rejected').length}
                                </p>
                            </div>
                            <div className="bg-red-100 p-3 rounded-full">
                                <X size={20} className="text-red-600" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FranchiseeManagerComboKitCustomization;