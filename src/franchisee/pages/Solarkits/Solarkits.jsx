import React, { useState, useEffect } from 'react';
import {
    Zap,
    Funnel,
    RotateCcw,
    Package,
    Zap as LightningIcon,
    CheckCircle,
    XCircle,
    DollarSign,
    Gauge,
    Sun,
    Battery,
    Cpu
} from 'lucide-react';
import { 
    getAllCustomizedCombokits, 
    getCategories, 
    getSubCategories, 
    getProjectCategoryMappings, 
    getSubProjectTypes,
    getBrands,
    getAllSKUs
} from '../../../services/combokit/combokitApi';

const FranchiseSolarkits = () => {
    const [filters, setFilters] = useState({
        category: '',
        subCategory: '',
        subProjectType: '',
        projectType: '',
        panelBrand: '',
        inverterBrand: '',
        technology: '',
        stockStatus: '',
        priceRange: '',
        wattsRange: ''
    });
    const [appliedFilters, setAppliedFilters] = useState({
        category: '',
        subCategory: '',
        subProjectType: '',
        projectType: '',
        panelBrand: '',
        inverterBrand: '',
        technology: '',
        stockStatus: '',
        priceRange: '',
        wattsRange: ''
    });

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    const [filterOptions, setFilterOptions] = useState({
        categories: [],
        subCategories: [],
        projectTypes: [],
        subProjectTypes: [],
        panelBrands: [],
        inverterBrands: [],
        technologies: [],
        stockStatuses: ['In Stock', 'Out of Stock']
    });

    useEffect(() => {
        fetchCombokits();
    }, []);

    const fetchCombokits = async () => {
        try {
            setLoading(true);
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            
            // Fetch everything in parallel
            const [
                res, 
                categoriesData, 
                subCategoriesData, 
                projectCategoryMappingData, 
                subProjectTypesData, 
                brandsData,
                skusData
            ] = await Promise.all([
                getAllCustomizedCombokits(),
                getCategories(),
                getSubCategories(),
                getProjectCategoryMappings(),
                getSubProjectTypes(),
                getBrands().catch(() => []), // Fallback in case endpoint is missing
                getAllSKUs().catch(() => [])
            ]);
            
            let availableKits = res || [];
            
            /*
            // Filter based on partner type / role if needed
            if (user.role) {
                availableKits = availableKits.filter(kit => !kit.role || kit.role === user.role);
            }
            */

            const formattedData = availableKits.map(kit => {
                const panelBrand = kit.panels && kit.panels.length > 0 ? kit.panels[0] : 'Unknown';
                const inverterBrand = kit.inverters && kit.inverters.length > 0 ? kit.inverters[0] : 'Unknown';
                
                return {
                    id: kit._id,
                    combokit: kit.solarkitName || "Solar ComboKit",
                    category: kit.category || "Uncategorized",
                    subCategory: kit.subCategory || "None",
                    subProjectType: kit.subProjectType || "None",
                    projectType: kit.projectType || "None",
                    watts: kit.watts || 0,
                    pricePerKW: kit.pricePerKW || 0,
                    panelBrand: panelBrand,
                    inverterBrand: inverterBrand,
                    technology: kit.technology || "Standard",
                    stockStatus: kit.status === 'Active' ? 'In Stock' : 'Out of Stock',
                    image: kit.image || "https://m.media-amazon.com/images/I/71qsYaba9EL.jpg",
                    panelLogo: kit.panelLogo || "https://i.pinimg.com/736x/20/3d/8e/203d8e6de718b5a5f34295533e6f808b.jpg",
                    inverterLogo: kit.inverterLogo || "https://lumprodsta.blob.core.windows.net/prodcontainer/Images/2499e3e7-22b8-4382-9707-4c55b1a3d070_NXG_850_1.png"
                };
            });

            setData(formattedData);
            
            // Safely map name from masters data
            const safeMap = (arr) => Array.isArray(arr) ? arr.map(item => item.name || item.brandName || item).filter(Boolean) : [];
            
            // Map BrandManufacturer data
            const safeBrandMap = (arr, productType) => {
                if (!Array.isArray(arr)) return [];
                return arr
                    .filter(item => item.product && item.product.toUpperCase() === productType.toUpperCase())
                    .map(item => item.brand || item.companyName)
                    .filter(Boolean);
            };

            // Map Project Types from Mappings
            const safeProjectTypesMap = (arr) => {
                if (!Array.isArray(arr)) return [];
                return arr.map(item => `${item.projectTypeFrom || 0} to ${item.projectTypeTo || 0} kW`).filter(Boolean);
            };

            // Map Watts from SKUs
            const safeWattsMap = (arr) => {
                if (!Array.isArray(arr)) return [];
                return arr.map(item => item.wattage).filter(Boolean);
            };
            
            setFilterOptions({
                categories: safeMap(categoriesData),
                subCategories: safeMap(subCategoriesData),
                projectTypes: [...new Set(safeProjectTypesMap(projectCategoryMappingData))],
                subProjectTypes: safeMap(subProjectTypesData),
                panelBrands: [...new Set(safeBrandMap(brandsData, 'PANEL'))],
                inverterBrands: [...new Set(safeBrandMap(brandsData, 'INVERTER'))],
                // Technologies don't have a master, derive from data
                technologies: [...new Set(formattedData.map(item => item.technology).filter(Boolean))],
                stockStatuses: ['In Stock', 'Out of Stock'],
                wattsRanges: [...new Set(safeWattsMap(skusData))] // Populate watts range from SKUs
            });
            
        } catch (error) {
            console.error("Error fetching combokits or options:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (filterName, value) => {
        setFilters(prev => ({ ...prev, [filterName]: value }));
    };

    const applyFilters = () => {
        setAppliedFilters({ ...filters });
    };

    const resetFilters = () => {
        const emptyFilters = {
            category: '',
            subCategory: '',
            subProjectType: '',
            projectType: '',
            panelBrand: '',
            inverterBrand: '',
            technology: '',
            stockStatus: '',
            priceRange: '',
            wattsRange: ''
        };
        setFilters(emptyFilters);
        setAppliedFilters(emptyFilters);
    };

    const filteredData = data.filter(item => {
        const checkMatch = (val1, val2) => {
            if (!val1) return true;
            if (!val2) return false;
            return String(val1).toLowerCase() === String(val2).toLowerCase();
        };

        const categoryMatch = checkMatch(appliedFilters.category, item.category);
        const subCategoryMatch = checkMatch(appliedFilters.subCategory, item.subCategory);
        const subProjectTypeMatch = checkMatch(appliedFilters.subProjectType, item.subProjectType);
        const projectTypeMatch = checkMatch(appliedFilters.projectType, item.projectType);
        const panelBrandMatch = checkMatch(appliedFilters.panelBrand, item.panelBrand);
        const inverterBrandMatch = checkMatch(appliedFilters.inverterBrand, item.inverterBrand);
        const techMatch = checkMatch(appliedFilters.technology, item.technology);
        const stockMatch = checkMatch(appliedFilters.stockStatus, item.stockStatus);

        let priceMatch = true;
        if (appliedFilters.priceRange) {
            const [min, max] = appliedFilters.priceRange.split('-');
            if (max === '+') {
                priceMatch = item.pricePerKW >= parseInt(min);
            } else {
                priceMatch = item.pricePerKW >= parseInt(min) && item.pricePerKW <= parseInt(max);
            }
        }

        let wattsMatch = true;
        if (appliedFilters.wattsRange) {
            // Because wattsRange is now directly populated from SKU wattages (exact numbers)
            wattsMatch = item.watts === parseInt(appliedFilters.wattsRange);
        }

        return categoryMatch && subCategoryMatch && subProjectTypeMatch && projectTypeMatch &&
            panelBrandMatch && inverterBrandMatch && techMatch && stockMatch &&
            priceMatch && wattsMatch;
    });

    return (
        <div className="container mx-auto px-4 py-4 max-w-7xl">
            {/* Title */}
            <div className="bg-white rounded-lg shadow-sm mb-3 border-0">
                <div className="p-4">
                    <h3 className="text-2xl font-bold text-blue-600 flex items-center">
                        <Zap size={24} className="mr-2 text-yellow-500 fill-current" />
                        Solarkits
                    </h3>
                </div>
            </div>

            {/* Filter Section */}
            <div className="bg-white rounded-lg shadow-sm mb-3 border-0">
                <div className="p-4">
                    {/* Row 1: Category Filters */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                        <div>
                            <label className="block mb-1 text-xs font-semibold text-gray-600">Category</label>
                            <select
                                className="w-full px-2 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                value={filters.category}
                                onChange={(e) => handleFilterChange('category', e.target.value)}
                            >
                                <option value="">All Categories</option>
                                {filterOptions.categories.map((opt, i) => (
                                    <option key={i} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block mb-1 text-xs font-semibold text-gray-600">Sub Category</label>
                            <select
                                className="w-full px-2 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                value={filters.subCategory}
                                onChange={(e) => handleFilterChange('subCategory', e.target.value)}
                            >
                                <option value="">All Sub Categories</option>
                                {filterOptions.subCategories.map((opt, i) => (
                                    <option key={i} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block mb-1 text-xs font-semibold text-gray-600">Sub Project Type</label>
                            <select
                                className="w-full px-2 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                value={filters.subProjectType}
                                onChange={(e) => handleFilterChange('subProjectType', e.target.value)}
                            >
                                <option value="">All Sub Project Types</option>
                                {filterOptions.subProjectTypes.map((opt, i) => (
                                    <option key={i} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block mb-1 text-xs font-semibold text-gray-600">Project Type</label>
                            <select
                                className="w-full px-2 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                value={filters.projectType}
                                onChange={(e) => handleFilterChange('projectType', e.target.value)}
                            >
                                <option value="">All Project Types</option>
                                {filterOptions.projectTypes.map((opt, i) => (
                                    <option key={i} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Row 2: New Filters */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                        <div>
                            <label className="block mb-1 text-xs font-semibold text-gray-600">Solar Panel Brand</label>
                            <select
                                className="w-full px-2 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                value={filters.panelBrand}
                                onChange={(e) => handleFilterChange('panelBrand', e.target.value)}
                            >
                                <option value="">All Panel Brands</option>
                                {filterOptions.panelBrands.map((opt, i) => (
                                    <option key={i} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block mb-1 text-xs font-semibold text-gray-600">Inverter Brand</label>
                            <select
                                className="w-full px-2 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                value={filters.inverterBrand}
                                onChange={(e) => handleFilterChange('inverterBrand', e.target.value)}
                            >
                                <option value="">All Inverter Brands</option>
                                {filterOptions.inverterBrands.map((opt, i) => (
                                    <option key={i} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                        {/* Commenting out Technology as requested 
                        <div>
                            <label className="block mb-1 text-xs font-semibold text-gray-600">Solar Panel Technology</label>
                            <select
                                className="w-full px-2 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                value={filters.technology}
                                onChange={(e) => handleFilterChange('technology', e.target.value)}
                            >
                                <option value="">All Technologies</option>
                                {filterOptions.technologies.map((opt, i) => (
                                    <option key={i} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                        */}
                        <div>
                            <label className="block mb-1 text-xs font-semibold text-gray-600">Stock Status</label>
                            <select
                                className="w-full px-2 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                value={filters.stockStatus}
                                onChange={(e) => handleFilterChange('stockStatus', e.target.value)}
                            >
                                <option value="">All</option>
                                <option value="In Stock">In Stock</option>
                                <option value="Out of Stock">Out of Stock</option>
                            </select>
                        </div>
                    </div>

                    {/* Row 3: Range Filters */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        <div>
                            <label className="block mb-1 text-xs font-semibold text-gray-600">Price Range (₹)</label>
                            <select
                                className="w-full px-2 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                value={filters.priceRange}
                                onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                            >
                                <option value="">All</option>
                                <option value="0-40000">Below 40,000</option>
                                <option value="40000-50000">40,000 - 50,000</option>
                                <option value="50000-60000">50,000 - 60,000</option>
                                <option value="60000+">Above 60,000</option>
                            </select>
                        </div>
                        <div>
                            <label className="block mb-1 text-xs font-semibold text-gray-600">Solar Panel Watts</label>
                            <select
                                className="w-full px-2 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                value={filters.wattsRange}
                                onChange={(e) => handleFilterChange('wattsRange', e.target.value)}
                            >
                                <option value="">All Watts</option>
                                {filterOptions.wattsRanges && filterOptions.wattsRanges.map((opt, i) => (
                                    <option key={i} value={opt}>{opt} W</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-2 mt-2">
                        <button
                            className="px-4 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium flex items-center hover:bg-blue-700 transition-colors"
                            onClick={applyFilters}
                        >
                            <Funnel size={14} className="mr-1" />
                            Apply
                        </button>
                        <button
                            className="px-4 py-1.5 bg-gray-500 text-white rounded-md text-sm font-medium flex items-center hover:bg-gray-600 transition-colors"
                            onClick={resetFilters}
                        >
                            <RotateCcw size={14} className="mr-1" />
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            {/* ComboKit Cards */}
            {loading ? (
                <div className="text-center text-gray-500 py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    Loading Combokits...
                </div>
            ) : filteredData.length === 0 ? (
                <div className="text-center text-gray-500 py-8 bg-white rounded-lg shadow-sm">
                    <Package size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-lg font-medium">No matching Combokits found</p>
                    <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredData.map((item, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-lg hover:border-blue-500 transition-all duration-300 cursor-pointer relative flex flex-col h-full"
                        >
                            {/* Stock Badge */}
                            <span className={`absolute top-2 right-2 text-xs px-2 py-1 rounded-full font-medium ${item.stockStatus === 'In Stock'
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : 'bg-red-100 text-red-800 border border-red-200'
                                }`}>
                                {item.stockStatus === 'In Stock' ? (
                                    <CheckCircle size={10} className="inline mr-1" />
                                ) : (
                                    <XCircle size={10} className="inline mr-1" />
                                )}
                                {item.stockStatus}
                            </span>

                            <div className="p-4 text-center flex flex-col h-full">
                                <h6 className="font-bold text-blue-600 mb-3">{item.combokit} ComboKit</h6>

                                <img
                                    src={item.image}
                                    alt="ComboKit"
                                    className="max-w-[220px] mx-auto rounded mb-3"
                                />

                                <div className="flex justify-center items-center space-x-3 mb-3">
                                    <img src={item.panelLogo} alt="Panel" className="h-8" />
                                    <img src={item.inverterLogo} alt="Inverter" className="h-8" />
                                </div>

                                <div className="text-sm space-y-1 mb-3">
                                    <div className="flex items-center justify-center">
                                        <Sun size={14} className="mr-1 text-yellow-500" />
                                        <span><b>Panel:</b> {item.panelBrand}</span>
                                    </div>
                                    <div className="flex items-center justify-center">
                                        <Battery size={14} className="mr-1 text-blue-500" />
                                        <span><b>Inverter:</b> {item.inverterBrand}</span>
                                    </div>
                                    <div className="flex items-center justify-center">
                                        <Cpu size={14} className="mr-1 text-purple-500" />
                                        <span><b>Tech:</b> {item.technology}</span>
                                    </div>
                                </div>

                                <div className="mt-auto border-t pt-3">
                                    {item.watts > 0 && (
                                        <span className="inline-flex items-center bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mb-2">
                                            <LightningIcon size={12} className="mr-1" />
                                            {item.watts}W
                                        </span>
                                    )}
                                    <br />
                                    {item.pricePerKW > 0 && (
                                        <span className="inline-flex items-center bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                            <DollarSign size={12} className="mr-1" />
                                            ₹ {item.pricePerKW.toLocaleString()} / KW
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FranchiseSolarkits;