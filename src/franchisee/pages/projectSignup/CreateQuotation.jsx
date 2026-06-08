import React, { useState, useEffect } from 'react';
import {
    Info,
    X,
    ChevronDown,
    Home,
    Building2,
    Sun,
    Zap,
    Battery,
    Wifi,
    Shield,
    Settings,
    Wrench,
    Star,
    Calendar,
    DollarSign,
    Plus,
    Minus,
    Check
} from 'lucide-react';
import { getSolarKits, getAssignments, getAMCServices } from '../../../services/combokit/combokitApi';
import { productApi } from '../../../api/productApi';
import { masterApi } from '../../../api/masterApi';
import { createProject } from '../../../services/project/projectService';
import toast from 'react-hot-toast';

const FranchiseQuotes = () => {
    // Admin Quote Config
    const [adminQuoteConfig, setAdminQuoteConfig] = useState(null);
    const [comboKits, setComboKits] = useState([]);
    const [dbAmcServices, setDbAmcServices] = useState([]);
    
    // Dynamic Dropdown options from SKUs/Products
    const [dynamicOptions, setDynamicOptions] = useState({
        technologies: [],
        wattages: [],
        panelBrands: [],
        inverterBrands: [],
        projectTypes: []
    });
    
    // Dynamic Custom Kit options
    const [customPanels, setCustomPanels] = useState([]);
    const [customInverters, setCustomInverters] = useState([]);
    const [customBosKits, setCustomBosKits] = useState([]);
    const [allProducts, setAllProducts] = useState([]); // Store all products for ID lookup

    // Fetch dynamic options from SKUs on mount
    useEffect(() => {
        const fetchDynamicOptions = async () => {
            try {
                const response = await productApi.getSkus();
                const responseData = response?.data || response;
                const skus = responseData?.data || responseData || [];
                
                // Ensure skus is an array
                const skuArray = Array.isArray(skus) ? skus : [];
                setAllProducts(skuArray);

                const rawTechnologies = skuArray.flatMap(s => {
                    if (Array.isArray(s.technology)) return s.technology;
                    if (typeof s.technology === 'string') return s.technology.split(',').map(t => t.trim());
                    return [];
                }).filter(Boolean);

                const techMap = new Map();
                rawTechnologies.forEach(tech => {
                    let normalized = tech.toLowerCase().trim();
                    if (normalized.includes('mono') && normalized.includes('perc')) {
                        normalized = 'mono perc';
                    } else if (normalized === 'mono' || normalized === 'monocrystalline') {
                        normalized = 'mono';
                    } else if (normalized.includes('bifacial') || normalized.includes('bificial') || normalized.includes('bi-facial')) {
                        normalized = 'bi facial';
                    } else if (normalized.includes('topcon')) {
                        normalized = 'topcon';
                    } else {
                        normalized = normalized.replace(/\s+/g, ' ');
                    }
                    
                    if (!techMap.has(normalized)) {
                        const displayTech = normalized.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                        techMap.set(normalized, displayTech);
                    }
                });
                const uniqueTechnologies = Array.from(techMap.values());

                // Extract dynamic options from SKUs
                const uniqueWattages = [...new Set(skuArray.map(s => {
                    // Skip inverter capacities that use kW or kVA
                    if (s.capacity && typeof s.capacity === 'string' && (s.capacity.toLowerCase().includes('kw') || s.capacity.toLowerCase().includes('kva'))) {
                        return null;
                    }
                    
                    const wattageVal = s.wattage || (s.capacity ? parseFloat(s.capacity) : null);
                    if (wattageVal) {
                        return wattageVal.toString().toUpperCase().endsWith('W')
                            ? wattageVal.toString().toUpperCase()
                            : `${wattageVal}W`;
                    } else if (s.capacity && typeof s.capacity === 'string') {
                        const match = s.capacity.match(/(\d+(\.\d+)?)/);
                        if (match) {
                            return `${match[1]}W`;
                        }
                    }
                    return null;
                }).filter(Boolean))];
                
                const allBrands = [...new Set(skuArray.map(s => s.brand || s.companyName || s.manufacturer || (s.productId && s.productId.brand)).filter(Boolean))];
                const uniquePanelBrands = allBrands;
                const uniqueInverterBrands = allBrands;

                // Fetch Project Types from Mappings to match Admin's Project Type List
                let projectTypesList = [];
                try {
                    const ptResponse = await productApi.getProjectCategoryMappings();
                    const ptData = ptResponse?.data?.data || ptResponse?.data || [];
                    const typesMap = new Set();
                    if (Array.isArray(ptData)) {
                        ptData.forEach(m => {
                            if (m.projectTypeFrom !== undefined && m.projectTypeTo !== undefined) {
                                typesMap.add(`${m.projectTypeFrom} to ${m.projectTypeTo} kW`);
                            }
                        });
                    }
                    projectTypesList = Array.from(typesMap);
                } catch (err) {
                    console.error("Failed to fetch Project Category Mappings", err);
                }

                setDynamicOptions({
                    technologies: uniqueTechnologies,
                    wattages: uniqueWattages,
                    panelBrands: uniquePanelBrands,
                    inverterBrands: uniqueInverterBrands,
                    projectTypes: projectTypesList
                });
            } catch (err) {
                console.error("Failed to fetch SKUs for dynamic options", err);
            }
        };

        fetchDynamicOptions();
    }, []);

    useEffect(() => {
        const savedConfig = localStorage.getItem('activeQuoteSetup');
        if (savedConfig) {
            try {
                setAdminQuoteConfig(JSON.parse(savedConfig));
            } catch (e) {
                console.error("Failed to parse quote settings from localStorage", e);
            }
        }
    }, []);

    // State for system configuration
    const [systemConfig, setSystemConfig] = useState({
        technology: '',
        panelWattage: '',
        numberOfPanels: '',
        systemCapacity: '',
        location: '',
        countryId: '',
        stateId: '',
        districtId: '',
        clusterId: '',
        kitType: ''
    });

    // Locations Dropdown State
    const [locationOptions, setLocationOptions] = useState({
        countries: [],
        states: [],
        districts: [],
        clusters: []
    });

    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const res = await masterApi.getCountries();
                setLocationOptions(prev => ({ ...prev, countries: res?.data?.data || res?.data || res || [] }));
            } catch (err) {
                console.error("Failed to fetch countries", err);
            }
        };
        fetchCountries();
    }, []);

    useEffect(() => {
        if (systemConfig.countryId) {
            masterApi.getStates({ countryId: systemConfig.countryId }).then(res => {
                setLocationOptions(prev => ({ ...prev, states: res?.data?.data || res?.data || res || [], districts: [], clusters: [] }));
            }).catch(console.error);
        } else {
            setLocationOptions(prev => ({ ...prev, states: [], districts: [], clusters: [] }));
        }
    }, [systemConfig.countryId]);

    useEffect(() => {
        if (systemConfig.stateId) {
            // Clear existing ones first
            setLocationOptions(prev => ({ ...prev, districts: [], clusters: [] }));
            
            masterApi.getDistricts({ stateId: systemConfig.stateId }).then(res => {
                setLocationOptions(prev => ({ ...prev, districts: res?.data?.data || res?.data || res || [] }));
            }).catch(console.error);
            
            masterApi.getClusters({ stateId: systemConfig.stateId }).then(res => {
                setLocationOptions(prev => ({ ...prev, clusters: res?.data?.data || res?.data || res || [] }));
            }).catch(console.error);
        } else {
            setLocationOptions(prev => ({ ...prev, districts: [], clusters: [] }));
        }
    }, [systemConfig.stateId]);

    // State for pricing details
    const [pricing, setPricing] = useState({
        installationCharges: '',
        structureCharges: '',
        margin: '',
        discount: ''
    });

    // State for modals
    const [showComboKitModal, setShowComboKitModal] = useState(false);
    const [showCustomKitModal, setShowCustomKitModal] = useState(false);
    const [showProductDetailModal, setShowProductDetailModal] = useState(false);

    // State for selected products
    const [selectedProducts, setSelectedProducts] = useState([]);

    // State for custom kit selections
    const [customKit, setCustomKit] = useState({
        technology: 'TOPCON',
        panelWatt: '570',
        numberOfPanels: '8',
        kilowatt: '4.56 KW - (570 Wp / 8 Panel / TOPCON)',
        projectType: '',
        countryId: '',
        stateId: '',
        districtId: '',
        clusterId: '',
        solarPanel: '',
        inverter: '',
        bosKit: ''
    });

    // State for showing result section
    const [showResult, setShowResult] = useState(false);
    
    // State for customer details
    const [customerDetails, setCustomerDetails] = useState({
        name: '',
        mobile: '',
        email: ''
    });

    // State for advanced options accordion
    const [isAdvancedOptionsOpen, setIsAdvancedOptionsOpen] = useState(false);

    // State for advanced options selections
    const [advancedOptions, setAdvancedOptions] = useState({
        cleaningKit: {
            selected: null,
            price: 100000,
            isFree: true,
            customPrice: ''
        },
        insurance: {
            selected: null,
            price: 0
        },
        amc: {
            selected: null,
            price: 0
        }
    });

    // State for product detail
    const [selectedProductDetail, setSelectedProductDetail] = useState(null);

    // Combo kit products
    useEffect(() => {
        const fetchDynamicKits = async () => {
            try {
                // 1. Fetch Combo Kits
                const res = await getSolarKits();
                const allKits = res?.data || res || [];
                
                let kitsToShow = allKits;
                if (adminQuoteConfig && adminQuoteConfig.selectedKitIds && adminQuoteConfig.selectedKitIds.length > 0) {
                    const validIds = adminQuoteConfig.selectedKitIds;
                    kitsToShow = allKits.filter(k => validIds.includes(k._id));
                }
                
                const mappedKits = kitsToShow.map((k, index) => ({
                    id: k._id,
                    name: k.name || `Combo Kit ${index + 1}`,
                    price: k.price || 0,
                    oldPrice: (k.price || 0) * 1.2,
                    rating: 4.8,
                    image: '../../assets/vendors/images/solarpanel.png',
                    description: k.description || `${k.category || ''} > ${k.subCategory || ''}`,
                    specifications: {
                        type: 'combo',
                        warranty: '10 years',
                        efficiency: 'Standard'
                    },
                    bom: k.bom || []
                }));

                setComboKits(mappedKits);

                // 2. Fetch Customized Kits assignments
                try {
                    const resAssign = await getAssignments();
                    const assignments = resAssign?.data || (Array.isArray(resAssign) ? resAssign : []);
                    
                    let allPanels = new Set();
                    let allInverters = new Set();
                    let allBosKits = new Set();

                    const validIds = adminQuoteConfig?.selectedKitIds || [];
                    
                    assignments.forEach(a => {
                        // If admin selected specific kits, only include their customized components.
                        // Otherwise include all components.
                        if (validIds.length === 0 || validIds.includes(a._id)) {
                            if (a.panels) a.panels.forEach(p => allPanels.add(p));
                            if (a.inverters) a.inverters.forEach(i => allInverters.add(i));
                            if (a.boskits) a.boskits.forEach(b => allBosKits.add(b));
                        }
                    });

                    setCustomPanels(Array.from(allPanels));
                    setCustomInverters(Array.from(allInverters));
                    setCustomBosKits(Array.from(allBosKits));
                } catch (assignErr) {
                    console.error("Failed to fetch customized kits", assignErr);
                }

            } catch (err) {
                console.error("Failed to fetch dynamic kits", err);
            }
        };

        const fetchAmcServices = async () => {
            try {
                const data = await getAMCServices();
                if (data && Array.isArray(data)) {
                    setDbAmcServices(data);
                }
            } catch (err) {
                console.error("Failed to fetch AMC services", err);
            }
        };

        fetchDynamicKits();
        fetchAmcServices();
    }, [adminQuoteConfig]);

    // Default fallback options if not configured by admin
    const defaultCleaningKits = [
        {
            id: 'clean-1',
            name: 'Cleaning Brush',
            price: 100000,
            image: '../../assets/vendors/images/cleaning.jpg',
            description: 'Includes telescopic pole, brush and biodegradable cleaner'
        },
        {
            id: 'clean-2',
            name: 'Cleaning Brush Pro',
            price: 150000,
            image: '../../assets/vendors/images/cleaning.jpg',
            description: 'Professional grade cleaning kit with extended reach'
        },
        {
            id: 'clean-3',
            name: 'Cleaning Brush Premium',
            price: 200000,
            image: '../../assets/vendors/images/cleaning.jpg',
            description: 'Complete cleaning solution with automated features'
        }
    ];

    const defaultInsuranceOptions = [
        {
            id: 'ins-1',
            name: 'Basic Panel Protection',
            price: 3000,
            features: ['Covers damage from natural disasters', 'Theft protection', '10-year coverage option'],
            image: '../../assets/vendors/images/insurance-1.jpg'
        },
        {
            id: 'ins-2',
            name: 'Comprehensive System Insurance',
            price: 6000,
            features: ['Full system coverage', 'Performance guarantee', 'Rapid replacement service', '15-year coverage option'],
            image: '../../assets/vendors/images/insurance-2.jpg'
        }
    ];

    // Fetch from database if available, otherwise fallback
    const defaultAmcOptions = dbAmcServices.length > 0 ? dbAmcServices.map((service, idx) => ({
        id: `amc-db-${service._id || idx}`,
        name: service.serviceName,
        price: service.basePrice || 0,
        features: [service.description || '', service.serviceType ? `Type: ${service.serviceType}` : ''],
        image: '../../assets/vendors/images/amc-1.jpg'
    })) : [
        {
            id: 'amc-1',
            name: 'Basic AMC Plan',
            price: 4000,
            features: ['Bi-annual system inspection', 'Basic cleaning (twice a year)', 'Performance report', 'Remote monitoring setup'],
            image: '../../assets/vendors/images/amc-1.jpg'
        },
        {
            id: 'amc-2',
            name: 'Premium AMC Plan',
            price: 7000,
            features: ['Quarterly system inspection', 'Professional cleaning (quarterly)', 'Detailed performance analytics', 'Priority service response', 'Includes minor repairs'],
            image: '../../assets/vendors/images/amc-2.jpg'
        },
        {
            id: 'amc-3',
            name: 'Comprehensive AMC Plan',
            price: 12000,
            features: ['Monthly system inspection', 'Advanced robotic cleaning', 'Real-time monitoring & alerts', '24/7 emergency support', 'Includes all parts replacement', 'Maximum efficiency guarantee'],
            image: '../../assets/vendors/images/amc-3.jpg'
        }
    ];

    // Build lists dynamically from admin configurations if available
    let cleaningKits = [...defaultCleaningKits];
    let insuranceOptions = [...defaultInsuranceOptions];
    let amcOptions = [...defaultAmcOptions];

    if (adminQuoteConfig?.advancedOptions) {
        const adminCleaning = adminQuoteConfig.advancedOptions.filter(opt => opt.key === 'cleaningKit' && opt.enabled);
        if (adminCleaning.length > 0) {
            cleaningKits = adminCleaning.map((opt, idx) => ({
                id: `clean-admin-${idx}`,
                name: opt.type || 'Cleaning Kit',
                price: opt.price || 0,
                image: '../../assets/vendors/images/cleaning.jpg',
                description: opt.description || 'Professional cleaning kit'
            }));
        }

        const adminInsurance = adminQuoteConfig.advancedOptions.filter(opt => opt.key === 'insurance' && opt.enabled);
        if (adminInsurance.length > 0) {
            insuranceOptions = adminInsurance.map((opt, idx) => ({
                id: `ins-admin-${idx}`,
                name: opt.type || 'Insurance Plan',
                price: opt.price || 0,
                image: '../../assets/vendors/images/insurance-1.jpg',
                features: opt.description ? [opt.description] : ['Comprehensive coverage']
            }));
        }

        const adminAmc = adminQuoteConfig.advancedOptions.filter(opt => opt.key === 'amc' && opt.enabled);
        if (adminAmc.length > 0) {
            amcOptions = adminAmc.map((opt, idx) => ({
                id: `amc-admin-${idx}`,
                name: opt.type || 'AMC Plan',
                price: opt.price || 0,
                image: '../../assets/vendors/images/amc-1.jpg',
                features: opt.description ? [opt.description] : ['System maintenance and inspection']
            }));
        }
    }

    // Handle input changes
    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setSystemConfig(prev => ({
            ...prev,
            [id]: value
        }));
    };

    // Handle pricing changes
    const handlePricingChange = (e) => {
        const { id, value } = e.target;
        setPricing(prev => ({
            ...prev,
            [id]: value
        }));
    };

    // Handle custom kit changes
    const handleCustomKitChange = (e) => {
        const { id, value } = e.target;
        setCustomKit(prev => ({
            ...prev,
            [id]: value
        }));
    };

    // Add product to selected products
    const addSelectedProduct = (product, type) => {
        setSelectedProducts(prev => {
            // Check if product already exists
            const exists = prev.some(p => p.id === product.id && p.type === type);
            if (!exists) {
                return [...prev, { ...product, type, quantity: 1 }];
            }
            return prev;
        });
    };

    // Remove product from selected products
    const removeProduct = (productId, type) => {
        setSelectedProducts(prev => prev.filter(p => !(p.id === productId && p.type === type)));

        // Also uncheck in advanced options if applicable
        if (type === 'cleaning') {
            setAdvancedOptions(prev => ({ ...prev, cleaningKit: { ...prev.cleaningKit, selected: null } }));
        } else if (type === 'insurance') {
            setAdvancedOptions(prev => ({ ...prev, insurance: { ...prev.insurance, selected: null } }));
        } else if (type === 'amc') {
            setAdvancedOptions(prev => ({ ...prev, amc: { ...prev.amc, selected: null } }));
        }
    };

    // Add selected products from combo kit modal
    const addComboKitProducts = () => {
        const selectedComboKits = comboKits.filter(kit =>
            document.getElementById(`product-${kit.id}`)?.checked
        );

        selectedComboKits.forEach(kit => {
            addSelectedProduct(kit, 'combo');
        });

        setShowComboKitModal(false);

        // Uncheck all checkboxes
        selectedComboKits.forEach(kit => {
            const checkbox = document.getElementById(`product-${kit.id}`);
            if (checkbox) checkbox.checked = false;
        });
    };

    // Handle cleaning kit selection
    const handleCleaningKitSelect = (kit) => {
        setAdvancedOptions(prev => ({
            ...prev,
            cleaningKit: {
                ...prev.cleaningKit,
                selected: kit.id,
                price: kit.price,
                isFree: true
            }
        }));

        addSelectedProduct({
            id: kit.id,
            name: kit.name,
            price: kit.price,
            image: kit.image
        }, 'cleaning');
    };

    // Handle insurance selection
    const handleInsuranceSelect = (insurance) => {
        setAdvancedOptions(prev => ({
            ...prev,
            insurance: {
                ...prev.insurance,
                selected: insurance.id,
                price: insurance.price
            }
        }));

        addSelectedProduct({
            id: insurance.id,
            name: insurance.name,
            price: insurance.price,
            image: insurance.image
        }, 'insurance');
    };

    // Handle AMC selection
    const handleAmcSelect = (amc) => {
        setAdvancedOptions(prev => ({
            ...prev,
            amc: {
                ...prev.amc,
                selected: amc.id,
                price: amc.price
            }
        }));

        addSelectedProduct({
            id: amc.id,
            name: amc.name,
            price: amc.price,
            image: amc.image
        }, 'amc');
    };

    // Handle free/chargeable toggle
    const handleCleaningKitOptionChange = (kitId, value) => {
        setAdvancedOptions(prev => ({
            ...prev,
            cleaningKit: {
                ...prev.cleaningKit,
                isFree: value === 'free'
            }
        }));

        // Update product in selected products
        setSelectedProducts(prev =>
            prev.map(p => {
                if (p.id === kitId && p.type === 'cleaning') {
                    return {
                        ...p,
                        isFree: value === 'free'
                    };
                }
                return p;
            })
        );
    };

    // Handle custom price input
    const handleCustomPriceChange = (kitId, price) => {
        setAdvancedOptions(prev => ({
            ...prev,
            cleaningKit: {
                ...prev.cleaningKit,
                customPrice: price
            }
        }));

        // Update product in selected products
        setSelectedProducts(prev =>
            prev.map(p => {
                if (p.id === kitId && p.type === 'cleaning') {
                    return {
                        ...p,
                        customPrice: price
                    };
                }
                return p;
            })
        );
    };

    // Show product detail
    const showProductDetail = (product) => {
        setSelectedProductDetail(product);
        setShowProductDetailModal(true);
    };

    // Calculate total price
    const calculateTotal = () => {
        let total = 0;

        // Add combo kit prices
        selectedProducts.forEach(product => {
            if (product.type === 'combo') {
                total += product.price;
            } else if (product.type === 'cleaning') {
                if (product.isFree) {
                    // Free, don't add to total
                } else if (product.customPrice) {
                    total += parseInt(product.customPrice);
                } else {
                    total += product.price;
                }
            } else if (product.type === 'insurance' || product.type === 'amc') {
                total += product.price;
            }
        });

        // Add pricing details
        total += parseInt(pricing.installationCharges || 0);
        total += parseInt(pricing.structureCharges || 0);
        total += parseInt(pricing.margin || 0);
        total -= parseInt(pricing.discount || 0);

        return total;
    };

    // Get star rating
    const getStarRating = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;

        for (let i = 0; i < fullStars; i++) {
            stars.push(<Star key={`full-${i}`} className="fill-yellow-400 text-yellow-400" size={16} />);
        }

        if (hasHalfStar) {
            stars.push(<Star key="half" className="fill-yellow-400 text-yellow-400" size={16} style={{ clipPath: 'inset(0 50% 0 0)' }} />);
        }

        const emptyStars = 5 - stars.length;
        for (let i = 0; i < emptyStars; i++) {
            stars.push(<Star key={`empty-${i}`} className="text-gray-300" size={16} />);
        }

        return stars;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-4">
                {/* Header */}
                <div className="mb-4">
                    <nav className="bg-white rounded-lg shadow-sm p-4">
                        <ol className="flex items-center">
                            <li className="flex-1">
                                <h3 className="text-xl font-bold text-blue-600">CP Quotes</h3>
                            </li>
                        </ol>
                    </nav>
                </div>

                <div className="container mx-auto py-3">
                    <div id="quotation-pdf-content" className="bg-white rounded-lg shadow-md">
                        <div className="p-6">
                            {/* Customer Details Section */}
                            <div className="mb-8">
                                <h3 className="text-blue-600 text-lg font-semibold mb-4">Customer Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                                        <input
                                            type="text"
                                            value={customerDetails.name}
                                            onChange={(e) => setCustomerDetails({...customerDetails, name: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Enter full name"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
                                        <input
                                            type="tel"
                                            value={customerDetails.mobile}
                                            onChange={(e) => setCustomerDetails({...customerDetails, mobile: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Enter mobile number"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email ID</label>
                                        <input
                                            type="email"
                                            value={customerDetails.email}
                                            onChange={(e) => setCustomerDetails({...customerDetails, email: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Enter email address"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* System Configuration */}
                            <h3 className="text-blue-600 text-lg font-semibold mb-4">System Configuration</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Technology</label>
                                    <select
                                        id="technology"
                                        value={systemConfig.technology}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="" disabled>Select Technology</option>
                                        {dynamicOptions.technologies.length > 0 ? (
                                            dynamicOptions.technologies.map((tech, idx) => (
                                                <option key={idx} value={tech}>{tech}</option>
                                            ))
                                        ) : (
                                            <>
                                                <option value="Mono Perc">Mono Perc</option>
                                                <option value="Bi Facial">Bi Facial</option>
                                                <option value="Topcon">Topcon</option>
                                            </>
                                        )}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Panel Wattage</label>
                                    <select
                                        id="panelWattage"
                                        value={systemConfig.panelWattage}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="" disabled>Select Panel Wattage</option>
                                        {dynamicOptions.wattages.length > 0 ? (
                                            dynamicOptions.wattages.map((watt, idx) => (
                                                <option key={idx} value={watt}>{watt}</option>
                                            ))
                                        ) : (
                                            <>
                                                <option value="250W">250W</option>
                                                <option value="300W">300W</option>
                                                <option value="400W">400W</option>
                                            </>
                                        )}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Number of Panels</label>
                                    <input
                                        type="number"
                                        id="numberOfPanels"
                                        value={systemConfig.numberOfPanels}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter number of panels"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Project Type</label>
                                    <select
                                        id="systemCapacity"
                                        value={systemConfig.systemCapacity}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
                                    >
                                        <option value="" disabled className="text-gray-400">Select Project Type</option>
                                        {dynamicOptions.projectTypes.length > 0 ? (
                                            dynamicOptions.projectTypes.map((pt, idx) => (
                                                <option key={idx} value={pt}>{pt}</option>
                                            ))
                                        ) : (
                                            <>
                                                <option value="1 KW">1 KW</option>
                                                <option value="2 KW">2 KW</option>
                                                <option value="5 KW">5 KW</option>
                                                <option value="10 KW">10 KW</option>
                                            </>
                                        )}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Location Setup</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div>
                                            <select
                                                id="countryId"
                                                value={systemConfig.countryId}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
                                            >
                                                <option value="" disabled className="text-gray-400">Select Country</option>
                                                {locationOptions.countries.map(c => (
                                                    <option key={c._id} value={c._id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <select
                                                id="stateId"
                                                value={systemConfig.stateId}
                                                onChange={handleInputChange}
                                                disabled={!systemConfig.countryId}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                            >
                                                <option value="" disabled className="text-gray-400">Select State</option>
                                                {locationOptions.states.map(s => (
                                                    <option key={s._id} value={s._id}>{s.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <select
                                                id="districtId"
                                                value={systemConfig.districtId}
                                                onChange={handleInputChange}
                                                disabled={!systemConfig.stateId}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                            >
                                                <option value="" disabled className="text-gray-400">Select District</option>
                                                {locationOptions.districts.map(d => (
                                                    <option key={d._id} value={d._id}>{d.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <select
                                                id="clusterId"
                                                value={systemConfig.clusterId}
                                                onChange={handleInputChange}
                                                disabled={!systemConfig.stateId}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                            >
                                                <option value="" disabled className="text-gray-400">Select Cluster</option>
                                                {locationOptions.clusters.map(c => (
                                                    <option key={c._id} value={c._id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Kit Type */}
                            <div className="mt-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Select Kit Type</label>
                                <div className="flex space-x-4">
                                    {(!adminQuoteConfig || adminQuoteConfig.kitTypesSelected?.includes('Combo Kit')) && (
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                name="kitType"
                                                value="combo"
                                                checked={systemConfig.kitType === 'combo'}
                                                onChange={() => {
                                                    setSystemConfig(prev => ({ ...prev, kitType: 'combo' }));
                                                    setShowComboKitModal(true);
                                                }}
                                                className="form-radio h-4 w-4 text-blue-600"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">Combo Kits</span>
                                        </label>
                                    )}
                                    {(!adminQuoteConfig || adminQuoteConfig.kitTypesSelected?.includes('Customised Kit')) && (
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                name="kitType"
                                                value="custom"
                                                checked={systemConfig.kitType === 'custom'}
                                                onChange={() => {
                                                    setSystemConfig(prev => ({ ...prev, kitType: 'custom' }));
                                                    setShowCustomKitModal(true);
                                                }}
                                                className="form-radio h-4 w-4 text-blue-600"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">Customized Kits</span>
                                        </label>
                                    )}
                                </div>

                                {/* Selected Products Display */}
                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Selected Products</label>
                                    <div className="min-h-[100px] border-2 border-dashed border-gray-300 rounded-lg p-4">
                                        {selectedProducts.length === 0 ? (
                                            <p className="text-gray-400 text-center mt-4">No products selected yet</p>
                                        ) : (
                                            <div className="flex flex-wrap gap-2">
                                                {selectedProducts.map((product, index) => (
                                                    <div
                                                        key={`${product.id}-${index}`}
                                                        className="inline-flex items-center bg-gray-50 rounded-full px-3 py-1 border border-gray-200"
                                                    >
                                                        <img
                                                            src={product.image}
                                                            alt={product.name}
                                                            className="w-6 h-6 object-contain rounded-full mr-2"
                                                        />
                                                        <span className="text-sm">{product.name}</span>
                                                        {product.type === 'cleaning' && product.isFree && (
                                                            <span className="ml-2 text-xs text-green-600">Free</span>
                                                        )}
                                                        <button
                                                            onClick={() => removeProduct(product.id, product.type)}
                                                            className="ml-2 text-gray-400 hover:text-gray-600"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Pricing Details */}
                            <h5 className="text-blue-600 text-md font-semibold mt-8 mb-3">Pricing Details</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Installation Charges (₹)</label>
                                    <input
                                        type="number"
                                        id="installationCharges"
                                        value={pricing.installationCharges}
                                        onChange={handlePricingChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter installation charges"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Structure Charges (₹)</label>
                                    <input
                                        type="number"
                                        id="structureCharges"
                                        value={pricing.structureCharges}
                                        onChange={handlePricingChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter structure charges"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Margin (₹)</label>
                                    <input
                                        type="number"
                                        id="margin"
                                        value={pricing.margin}
                                        onChange={handlePricingChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter margin"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount (₹)</label>
                                    <input
                                        type="number"
                                        id="discount"
                                        value={pricing.discount}
                                        onChange={handlePricingChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter discount"
                                    />
                                </div>
                            </div>

                            {/* Advanced Options Section */}
                            <div className="mt-8">
                                <div 
                                    className="flex items-center cursor-pointer select-none mb-4"
                                    onClick={() => setIsAdvancedOptionsOpen(!isAdvancedOptionsOpen)}
                                >
                                    <h3 className="text-blue-600 text-lg font-semibold">Advanced Options</h3>
                                    <ChevronDown className={`ml-2 text-blue-600 transition-transform duration-200 ${isAdvancedOptionsOpen ? 'transform rotate-180' : ''}`} />
                                </div>

                                {isAdvancedOptionsOpen && (
                                    <div className="animate-in slide-in-from-top-2 duration-200">
                                        {/* Cleaning Kit */}
                                        {(!adminQuoteConfig || adminQuoteConfig.advancedOptions?.find(opt => opt.key === 'cleaningKit')?.enabled) && (
                                        <div className="mb-6">
                                            <h5 className="text-md font-semibold mb-3">Cleaning Kit</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {cleaningKits.map((kit) => (
                                            <div
                                                key={kit.id}
                                                className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-all border ${advancedOptions.cleaningKit.selected === kit.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                                                    }`}
                                            >
                                                <div className="p-4">
                                                    <img
                                                        src={kit.image}
                                                        alt={kit.name}
                                                        className="h-24 mx-auto object-contain mb-3"
                                                    />
                                                    <h6 className="font-semibold text-center mb-2">{kit.name}</h6>
                                                    <div className="text-center mb-2">
                                                        <span className="text-blue-600 font-bold">₹{kit.price.toLocaleString()}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 text-center mb-3">{kit.description}</p>

                                                    <div className="mb-3">
                                                        <label className="inline-flex items-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={advancedOptions.cleaningKit.selected === kit.id}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        handleCleaningKitSelect(kit);
                                                                    } else {
                                                                        removeProduct(kit.id, 'cleaning');
                                                                    }
                                                                }}
                                                                className="form-checkbox h-4 w-4 text-blue-600"
                                                            />
                                                            <span className="ml-2 text-sm">Select</span>
                                                        </label>
                                                    </div>

                                                    {advancedOptions.cleaningKit.selected === kit.id && (
                                                        <>
                                                            <div className="mt-2 space-y-2">
                                                                <label className="inline-flex items-center">
                                                                    <input
                                                                        type="radio"
                                                                        name={`${kit.id}-option`}
                                                                        value="free"
                                                                        checked={advancedOptions.cleaningKit.isFree}
                                                                        onChange={() => handleCleaningKitOptionChange(kit.id, 'free')}
                                                                        className="form-radio h-3 w-3 text-blue-600"
                                                                    />
                                                                    <span className="ml-2 text-xs">Free</span>
                                                                </label>
                                                                <label className="inline-flex items-center ml-4">
                                                                    <input
                                                                        type="radio"
                                                                        name={`${kit.id}-option`}
                                                                        value="chargeable"
                                                                        checked={!advancedOptions.cleaningKit.isFree}
                                                                        onChange={() => handleCleaningKitOptionChange(kit.id, 'chargeable')}
                                                                        className="form-radio h-3 w-3 text-blue-600"
                                                                    />
                                                                    <span className="ml-2 text-xs">Chargeable</span>
                                                                </label>
                                                            </div>

                                                            {!advancedOptions.cleaningKit.isFree && (
                                                                <div className="mt-2">
                                                                    <input
                                                                        type="number"
                                                                        placeholder="Enter new price"
                                                                        value={advancedOptions.cleaningKit.customPrice}
                                                                        onChange={(e) => handleCustomPriceChange(kit.id, e.target.value)}
                                                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                                                    />
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                )}

                                {/* Insurance */}
                                {(!adminQuoteConfig || adminQuoteConfig.advancedOptions?.find(opt => opt.key === 'insurance')?.enabled) && (
                                <div className="mb-6">
                                    <h5 className="text-md font-semibold mb-3">Insurance</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {insuranceOptions.map((insurance) => (
                                            <div
                                                key={insurance.id}
                                                className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-all border ${advancedOptions.insurance.selected === insurance.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                                                    }`}
                                            >
                                                <div className="p-4">
                                                    <h6 className="font-semibold mb-2">{insurance.name}</h6>
                                                    <p className="text-blue-600 font-bold mb-2">₹{insurance.price.toLocaleString()}/year</p>
                                                    <ul className="text-xs text-gray-600 mb-3 list-disc pl-4">
                                                        {insurance.features.map((feature, idx) => (
                                                            <li key={idx}>{feature}</li>
                                                        ))}
                                                    </ul>
                                                    <label className="inline-flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={advancedOptions.insurance.selected === insurance.id}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    handleInsuranceSelect(insurance);
                                                                } else {
                                                                    removeProduct(insurance.id, 'insurance');
                                                                }
                                                            }}
                                                            className="form-checkbox h-4 w-4 text-blue-600"
                                                        />
                                                        <span className="ml-2 text-sm">Select</span>
                                                    </label>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                )}

                                {/* AMC */}
                                {(!adminQuoteConfig || adminQuoteConfig.advancedOptions?.find(opt => opt.key === 'amc')?.enabled) && (
                                <div className="mb-6">
                                    <h5 className="text-md font-semibold mb-3">Annual Maintenance Contract (AMC)</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {amcOptions.map((amc) => (
                                            <div
                                                key={amc.id}
                                                className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-all border-l-4 border-blue-500 ${advancedOptions.amc.selected === amc.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                                                    }`}
                                            >
                                                <div className="p-4">
                                                    <h6 className="font-semibold mb-2">{amc.name}</h6>
                                                    <p className="text-blue-600 font-bold mb-2">₹{amc.price.toLocaleString()}/year</p>
                                                    <ul className="text-xs text-gray-600 mb-3 list-disc pl-4">
                                                        {amc.features.map((feature, idx) => (
                                                            <li key={idx}>{feature}</li>
                                                        ))}
                                                    </ul>
                                                    <label className="inline-flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={advancedOptions.amc.selected === amc.id}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    handleAmcSelect(amc);
                                                                } else {
                                                                    removeProduct(amc.id, 'amc');
                                                                }
                                                            }}
                                                            className="form-checkbox h-4 w-4 text-blue-600"
                                                        />
                                                        <span className="ml-2 text-sm">Select</span>
                                                    </label>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                )}
                                    </div>
                                )}
                            </div>

                            {/* Generate Quote Button */}
                            <div className="flex justify-end mt-6 space-x-4">
                                <button
                                    onClick={() => {
                                        import('html2pdf.js').then((html2pdf) => {
                                            const element = document.getElementById('quotation-pdf-content');
                                            if (!element) return;
                                            const opt = {
                                                margin: [10, 10, 10, 10],
                                                filename: `Quotation_${customerDetails.name || 'New'}.pdf`,
                                                image: { type: 'jpeg', quality: 0.98 },
                                                html2canvas: { scale: 2, useCORS: true },
                                                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                                            };
                                            html2pdf.default().set(opt).from(element).save();
                                        }).catch(err => {
                                            console.error("Failed to load html2pdf", err);
                                        });
                                    }}
                                    className="px-6 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors flex items-center gap-2"
                                >
                                    Download PDF
                                </button>
                                <button
                                    onClick={async () => {
                                        if (!customerDetails.name || !customerDetails.mobile || !systemConfig.stateId) {
                                            toast.error("Please fill required fields (Customer Name, Mobile, State)");
                                            return;
                                        }
                                        
                                        try {
                                            const randomNum = Math.floor(1000 + Math.random() * 9000);
                                            const projectId = `SOL-QT-${randomNum}`;

                                            const payload = {
                                                projectId,
                                                projectName: customerDetails.name,
                                                category: 'Residential', 
                                                projectType: 'On-Grid', 
                                                totalKW: parseFloat(systemConfig.systemCapacity) || 0,
                                                status: 'Project Signed',
                                                statusStage: 'consumer',
                                                dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
                                                state: systemConfig.stateId,
                                                district: systemConfig.districtId || null,
                                                cluster: systemConfig.clusterId || null,
                                                cp: 'Direct',
                                                mobile: customerDetails.mobile,
                                                email: customerDetails.email,
                                                numberOfPanels: parseInt(systemConfig.numberOfPanels) || 0
                                            };

                                            await createProject(payload);
                                            toast.success("Project Signed Up Successfully!");
                                            // In a real app, this would generate a PDF or navigate to quote page
                                        } catch (err) {
                                            toast.error("Failed to create project signup");
                                            console.error(err);
                                        }
                                    }}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                >
                                    Generate Quote
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Combo Kit Modal */}
            {showComboKitModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-blue-600 text-white px-6 py-4 flex justify-between items-center">
                            <h5 className="text-lg font-semibold">Select Combo Kit</h5>
                            <button onClick={() => setShowComboKitModal(false)} className="text-white hover:text-gray-200">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {comboKits.map((kit) => (
                                    <div key={kit.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all">
                                        <div className="p-4 text-center relative">
                                            <button
                                                onClick={() => showProductDetail(kit)}
                                                className="absolute top-2 right-2 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200"
                                            >
                                                <Info size={16} />
                                            </button>
                                            <img
                                                src={kit.image}
                                                alt={kit.name}
                                                className="h-24 mx-auto object-contain mb-3"
                                            />
                                            <h6 className="font-semibold mb-2">{kit.name}</h6>
                                            <p className="mb-2">
                                                <span className="text-blue-600 font-bold">₹{kit.price.toLocaleString()}</span>
                                                <span className="text-gray-400 line-through ml-2">₹{kit.oldPrice.toLocaleString()}</span>
                                            </p>
                                            <div className="flex justify-center mb-3">
                                                {getStarRating(kit.rating)}
                                            </div>
                                            <label className="inline-flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id={`product-${kit.id}`}
                                                    className="form-checkbox h-4 w-4 text-blue-600"
                                                />
                                                <span className="ml-2 text-sm">Select</span>
                                            </label>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="border-t px-6 py-4 flex justify-end space-x-3">
                            <button
                                onClick={() => setShowComboKitModal(false)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                            >
                                Close
                            </button>
                            <button
                                onClick={addComboKitProducts}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Add Selected Products
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Kit Modal */}
            {showCustomKitModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-blue-600 text-white px-6 py-4 flex justify-between items-center">
                            <h5 className="text-lg font-semibold">Select Customized Kit</h5>
                            <button onClick={() => setShowCustomKitModal(false)} className="text-white hover:text-gray-200">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6">
                            <form id="solarForm">
                                {/* Select Technology */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Technology</label>
                                    <select
                                        id="technology"
                                        value={customKit.technology}
                                        onChange={handleCustomKitChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {dynamicOptions.technologies.length > 0 ? (
                                            dynamicOptions.technologies.map((tech, idx) => (
                                                <option key={idx} value={tech}>{tech}</option>
                                            ))
                                        ) : (
                                            <>
                                                <option value="Mono Perc">Mono Perc</option>
                                                <option value="Bi Facial">Bi Facial</option>
                                                <option value="Topcon">Topcon</option>
                                            </>
                                        )}
                                    </select>
                                </div>

                                {/* Solar Panel Watt */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Solar panel watt</label>
                                    <select
                                        id="panelWatt"
                                        value={customKit.panelWatt}
                                        onChange={handleCustomKitChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {dynamicOptions.wattages.length > 0 ? (
                                            dynamicOptions.wattages.map((watt, idx) => (
                                                <option key={idx} value={watt}>{watt}</option>
                                            ))
                                        ) : (
                                            <>
                                                <option value="570">570</option>
                                                <option value="540">540</option>
                                                <option value="500">500</option>
                                            </>
                                        )}
                                    </select>
                                </div>

                                {/* Number of Panels */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Number of solar Panels</label>
                                    <select
                                        id="numberOfPanels"
                                        value={customKit.numberOfPanels}
                                        onChange={handleCustomKitChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="8">8</option>
                                        <option value="10">10</option>
                                        <option value="12">12</option>
                                    </select>
                                </div>

                                {/* Kilowatt */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Kilowatt (KW)</label>
                                    <select
                                        id="kilowatt"
                                        value={customKit.kilowatt}
                                        onChange={handleCustomKitChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="4.56 KW - (570 Wp / 8 Panel / TOPCON)">4.56 KW - (570 Wp / 8 Panel / TOPCON)</option>
                                    </select>
                                </div>

                                {/* Project Type */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Project Type</label>
                                    <select
                                        id="systemCapacity"
                                        value={systemConfig.systemCapacity}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
                                    >
                                        <option value="" disabled className="text-gray-400">Select Project Type</option>
                                        {dynamicOptions.projectTypes.length > 0 ? (
                                            dynamicOptions.projectTypes.map((pt, idx) => (
                                                <option key={idx} value={pt}>{pt}</option>
                                            ))
                                        ) : (
                                            <>
                                                <option value="1 KW">1 KW</option>
                                                <option value="2 KW">2 KW</option>
                                                <option value="5 KW">5 KW</option>
                                                <option value="10 KW">10 KW</option>
                                            </>
                                        )}
                                    </select>
                                </div>

                                {/* Location Setup */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Location Setup</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div>
                                            <select
                                                id="countryId"
                                                value={systemConfig.countryId}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
                                            >
                                                <option value="" disabled className="text-gray-400">Select Country</option>
                                                {locationOptions.countries.map(c => (
                                                    <option key={c._id} value={c._id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <select
                                                id="stateId"
                                                value={systemConfig.stateId}
                                                onChange={handleInputChange}
                                                disabled={!systemConfig.countryId}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                            >
                                                <option value="" disabled className="text-gray-400">Select State</option>
                                                {locationOptions.states.map(s => (
                                                    <option key={s._id} value={s._id}>{s.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <select
                                                id="districtId"
                                                value={systemConfig.districtId}
                                                onChange={handleInputChange}
                                                disabled={!systemConfig.stateId}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                            >
                                                <option value="" disabled className="text-gray-400">Select District</option>
                                                {locationOptions.districts.map(d => (
                                                    <option key={d._id} value={d._id}>{d.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <select
                                                id="clusterId"
                                                value={systemConfig.clusterId}
                                                onChange={handleInputChange}
                                                disabled={!systemConfig.stateId}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                            >
                                                <option value="" disabled className="text-gray-400">Select Cluster</option>
                                                {locationOptions.clusters.map(c => (
                                                    <option key={c._id} value={c._id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Customize Options - Commented out for now
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Solar Panel</label>
                                        <select
                                            id="solarPanel"
                                            value={customKit.solarPanel}
                                            onChange={handleCustomKitChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Select Panel</option>
                                            {customPanels.length > 0 ? (
                                                customPanels.map((p, i) => {
                                                    const product = allProducts.find(prod => prod._id === p);
                                                    const displayName = product ? (product.description || product.skuCode || p) : p;
                                                    return <option key={i} value={p}>{displayName}</option>;
                                                })
                                            ) : dynamicOptions.panelBrands.length > 0 ? (
                                                dynamicOptions.panelBrands.map((p, i) => <option key={i} value={p}>{p}</option>)
                                            ) : (
                                                <>
                                                    <option value="Adani">Adani</option>
                                                    <option value="Waaree">Waaree</option>
                                                    <option value="Tata">Tata</option>
                                                </>
                                            )}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Inverter</label>
                                        <select
                                            id="inverter"
                                            value={customKit.inverter}
                                            onChange={handleCustomKitChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Select Inverter</option>
                                            {customInverters.length > 0 ? (
                                                customInverters.map((inv, i) => {
                                                    const product = allProducts.find(prod => prod._id === inv);
                                                    const displayName = product ? (product.description || product.skuCode || inv) : inv;
                                                    return <option key={i} value={inv}>{displayName}</option>;
                                                })
                                            ) : dynamicOptions.inverterBrands.length > 0 ? (
                                                dynamicOptions.inverterBrands.map((inv, i) => <option key={i} value={inv}>{inv}</option>)
                                            ) : (
                                                <>
                                                    <option value="Vsole">Vsole</option>
                                                    <option value="Ksolar">Ksolar</option>
                                                </>
                                            )}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex justify-end mb-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowResult(true)}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                    >
                                        Calculate
                                    </button>
                                </div>
                                */}
                            </form>

                            {/* Results Section */}
                            {showResult && (
                                <div className="mt-4">
                                    <h6 className="font-semibold mb-3">Your Selection</h6>
                                    <div className="bg-white rounded-lg shadow-sm p-4">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                            {/* Solar Panel */}
                                            <div className="text-center">
                                                <img
                                                    src="../../assets/vendors/images/solarpanel.png"
                                                    className="h-16 mx-auto object-contain mb-2"
                                                    alt="Solar Panel"
                                                />
                                                <p className="text-sm font-medium">Adani Solar Panel</p>
                                            </div>

                                            {/* Inverter */}
                                            <div className="text-center">
                                                <img
                                                    src="../../assets/vendors/images/invertor.jpeg"
                                                    className="h-16 mx-auto object-contain mb-2"
                                                    alt="Inverter"
                                                />
                                                <p className="text-sm font-medium">Vsole Inverter</p>
                                            </div>

                                            {/* BOS Kit */}
                                            <div className="text-center">
                                                <img
                                                    src="../../assets/vendors/images/boskit.jpeg"
                                                    className="h-16 mx-auto object-contain mb-2"
                                                    alt="BOS Kit"
                                                />
                                                <p className="text-sm font-medium">Adani 3-4 KW BOS Kit</p>
                                            </div>
                                        </div>

                                        {/* Total Price */}
                                        <div className="text-right mt-3">
                                            <h6 className="text-green-600 font-bold">Total = ₹1,20,000</h6>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="border-t px-6 py-4 flex justify-end space-x-3">
                            <button
                                onClick={() => setShowCustomKitModal(false)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => {
                                    // Add custom kit products
                                    const customProduct = {
                                        id: 'custom-1',
                                        name: `Custom Kit - ${customKit.kilowatt}`,
                                        price: 120000,
                                        image: '../../assets/vendors/images/solarpanel.png'
                                    };
                                    addSelectedProduct(customProduct, 'custom');
                                    setShowCustomKitModal(false);
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Add Selected Products
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Product Detail Modal */}
            {showProductDetailModal && selectedProductDetail && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
                        <div className="sticky top-0 bg-blue-600 text-white px-6 py-4 flex justify-between items-center">
                            <h5 className="text-lg font-semibold">Product Details</h5>
                            <button onClick={() => setShowProductDetailModal(false)} className="text-white hover:text-gray-200">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="text-center">
                                    <img
                                        src={selectedProductDetail.image}
                                        alt={selectedProductDetail.name}
                                        className="max-h-48 mx-auto object-contain"
                                    />
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold mb-2">{selectedProductDetail.name}</h4>
                                    <p className="text-blue-600 font-bold text-lg mb-1">Price: ₹{selectedProductDetail.price.toLocaleString()}</p>
                                    {selectedProductDetail.oldPrice && (
                                        <p className="text-gray-400 line-through mb-2">Original: ₹{selectedProductDetail.oldPrice.toLocaleString()}</p>
                                    )}
                                    <div className="flex text-yellow-400 mb-3">
                                        {selectedProductDetail.rating && getStarRating(selectedProductDetail.rating)}
                                    </div>
                                    <h6 className="font-semibold mb-2">Description</h6>
                                    <p className="text-sm text-gray-600 mb-3">
                                        {selectedProductDetail.description || 'High-quality product with excellent efficiency and durability.'}
                                    </p>
                                    <h6 className="font-semibold mb-2">Specifications</h6>
                                    <ul className="text-sm border rounded-md divide-y">
                                        <li className="px-3 py-2">Type: {selectedProductDetail.specifications?.type || selectedProductDetail.type || 'Standard'}</li>
                                        <li className="px-3 py-2">Warranty: {selectedProductDetail.specifications?.warranty || '10 years'}</li>
                                        <li className="px-3 py-2">Efficiency: {selectedProductDetail.specifications?.efficiency || '90%'}</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="border-t px-6 py-4 flex justify-end">
                            <button
                                onClick={() => setShowProductDetailModal(false)}
                                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FranchiseQuotes;