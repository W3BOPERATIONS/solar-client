import React, { useState, useEffect, useRef } from 'react';
import { getPartnerPlans, createPartnerPlan, updatePartnerPlan, deletePartnerPlan, getPartners } from '../../../../services/partner/partnerApi';
import { getStates, getCountries, getClustersHierarchy, getDistrictsHierarchy } from '../../../../services/core/locationApi';
import {
    Rocket,
    Layers,
    Building2,
    SolarPanel,
    Plus,
    Check,
    List,
    Save,
    Trash2,
    Loader,
    X,
    Users,
    BadgeCheck,
    CheckCircle2,
    MapPin,
    Settings,
    CreditCard,
    Target,
    Percent,
    Video,
    Monitor,
    Edit,
    Globe,
    Star,
    MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PartnerPlans() {
    const [loading, setLoading] = useState(true);
    const [partners, setPartners] = useState([]);
    const [countries, setCountries] = useState([]);
    const [states, setStates] = useState([]);
    const [clusters, setClusters] = useState([]);
    const [districts, setDistricts] = useState([]);

    const [selectedPartnerType, setSelectedPartnerType] = useState('');
    const [selectedCountryId, setSelectedCountryId] = useState('');
    const [selectedStateId, setSelectedStateId] = useState('');
    const [selectedClusterId, setSelectedClusterId] = useState('');
    const [selectedDistrictId, setSelectedDistrictId] = useState('');
    const [plans, setPlans] = useState([]);
    const [selectedPlanId, setSelectedPlanId] = useState(null);
    const [showAddPlanModal, setShowAddPlanModal] = useState(false);

    // Initial Form State Template directly mapped to generic Schema
    const initialFormState = {
        name: '',
        description: '',
        price: 0,
        priceDescription: 'signup fees',
        yearlyTargetKw: 0,
        cashbackAmount: 0,
        accessType: '',
        userLimit: 1,
        userDescription: '',
        projectTypes: [],
        features: [],
        documents: [],
        depositFees: 0,
        isActive: true,
        // Using config to store all other nested configurations
        config: {
            kyc: { aadhar: true, pan: true, gst: false, verifiedPartner: false, notVerifiedPartner: true },
            eligibility: { kyc: true, agreement: true, depositCheque: true, gstRequired: false, gstAmount: '', depositAmount: '', noCashback: false },
            coverage: { area: '1 District', city: true, district: true, cluster: false, state: false },
            user: { sales: true, admin: true, leadPartner: true, service: true, userLimit: 10, noSublogin: false },
            category: { upto3kw: true, threeTo10kw: true, tenTo100kw: false, above100kw: false, above200kw: false, residential: true, commercial: true, onGrid: true, offGrid: false, hybrid: false },
            features: { adminApp: true, adminCrm: false, userApp: true, leadPartner: true, districtManager: false, appSubUser: false, crmLeadManagement: true, assignLead: true, crmKnowMargin: true, crmSurveyBom: true, crmInstall: true, crmService: false, crmProjectManagement: false, crmAmcPlan: false },
            quote: { quickQuote: true, surveyQuote: true, generationGraph: false, addons: false, projectSignupLimit: '', deliveryType: '' },
            fees: { signupFees: '', installerCharges: '', sdAmountCheque: '', upgradeFees: '', directUpgradeFees: '' },
            incentive: { yearlyTarget: '', cashbackPerKw: '', totalIncentive: '' },
            commissions: []
        },
        ui: { headerColor: '#0078bd', buttonColor: '#0078bd', icon: 'Rocket', iconColor: 'text-[#0078bd]', bgColor: 'bg-blue-50' }
    };

    const [formData, setFormData] = useState(initialFormState);

    // Initial Fetch for Partners and States
    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [partnersData, countriesData] = await Promise.all([
                getPartners(),
                getCountries()
            ]);
            setPartners(partnersData);
            setCountries(countriesData);

            if (partnersData.length > 0) {
                setSelectedPartnerType(partnersData[0].name);
            }
            if (countriesData.length > 0) {
                setSelectedCountryId(countriesData[0]._id);
            }
        } catch (error) {
            console.error('Error fetching initial data:', error);
            toast.error('Failed to load initial data');
        } finally {
            setLoading(false);
        }
    };

    // Cascading: Fetch States when Country changes
    useEffect(() => {
        if (selectedCountryId) {
            const fetchStatesForCountry = async () => {
                try {
                    const data = await getStates({ countryId: selectedCountryId });
                    setStates(data);
                    setSelectedStateId('');
                    setSelectedClusterId('');
                    setSelectedDistrictId('');
                } catch (error) {
                    console.error('Error fetching states:', error);
                }
            };
            fetchStatesForCountry();
        } else {
            setStates([]);
        }
    }, [selectedCountryId]);

    // Cascading: Fetch Clusters when State changes
    useEffect(() => {
        if (selectedStateId) {
            const fetchClustersForState = async () => {
                try {
                    const data = await getClustersHierarchy(selectedStateId);
                    setClusters(data);
                    setSelectedClusterId('');
                    setSelectedDistrictId('');
                } catch (error) {
                    console.error('Error fetching clusters:', error);
                }
            };
            fetchClustersForState();
        } else {
            setClusters([]);
        }
    }, [selectedStateId]);

    // Cascading: Fetch Districts when Cluster changes
    useEffect(() => {
        if (selectedClusterId) {
            const fetchDistrictsForCluster = async () => {
                try {
                    const data = await getDistrictsHierarchy(selectedClusterId);
                    setDistricts(data);
                    setSelectedDistrictId('');
                } catch (error) {
                    console.error('Error fetching districts:', error);
                }
            };
            fetchDistrictsForCluster();
        } else {
            setDistricts([]);
        }
    }, [selectedClusterId]);

    // Fetch Plans when any filter changes
    useEffect(() => {
        if (selectedPartnerType) {
            fetchPlans();
        } else {
            setPlans([]);
            setSelectedPlanId(null);
            setFormData(initialFormState);
        }
    }, [selectedPartnerType, selectedCountryId, selectedStateId, selectedClusterId, selectedDistrictId]);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const data = await getPartnerPlans(
                selectedPartnerType, 
                selectedStateId, 
                selectedCountryId, 
                selectedClusterId, 
                selectedDistrictId
            );
            
            // Safety filter: Deduplicate by name if backend has legacy duplicates
            const uniqueData = [];
            const seenNames = new Set();
            data.forEach(plan => {
                if (!seenNames.has(plan.name)) {
                    seenNames.add(plan.name);
                    uniqueData.push(plan);
                }
            });

            setPlans(uniqueData);
            if (uniqueData.length > 0) {
                const firstPlanId = uniqueData[0]._id;
                setSelectedPlanId(firstPlanId);
                loadPlanData(uniqueData[0]);
            } else {
                setSelectedPlanId(null);
                setFormData(initialFormState);
            }
        } catch (error) {
            console.error('Error fetching plans:', error);
            toast.error('Failed to load plans for selected configuration');
        } finally {
            setLoading(false);
        }
    };

    const loadPlanData = (plan) => {
        setFormData({
            ...initialFormState,
            ...plan,
            config: {
                ...initialFormState.config,
                ...plan.config
            }
        });
    };

    const handlePlanSelect = (planId) => {
        setSelectedPlanId(planId);
        const plan = plans.find(p => p._id === planId);
        if (plan) {
            loadPlanData(plan);
        }
    };

    const handleRootInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleUiChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            ui: {
                ...(prev.ui || {}),
                [field]: value
            }
        }));
    };

    const handleAddCommissionRow = () => {
        setFormData(prev => ({
            ...prev,
            config: {
                ...prev.config,
                commissions: [...(prev.config.commissions || []), { category: '', subCategory: '', projectType: '', subProjectType: '', amount: '' }]
            }
        }));
    };

    const handleRemoveCommissionRow = (index) => {
        setFormData(prev => ({
            ...prev,
            config: {
                ...prev.config,
                commissions: prev.config.commissions.filter((_, i) => i !== index)
            }
        }));
    };

    const handleCommissionChange = (index, field, value) => {
        const newCommissions = [...formData.config.commissions];
        newCommissions[index][field] = value;
        handleInputChange('commissions', null, newCommissions);
    };

    const calculateIncentive = () => {
        const target = parseFloat(formData.config?.incentive?.yearlyTarget) || 0;
        const rate = parseFloat(formData.config?.incentive?.cashbackPerKw) || 0;
        const total = target * rate;
        handleInputChange('incentive', 'totalIncentive', total.toString());
        toast.success(`Calculated Total Incentive: ₹${total}`);
    };

    // Adjusted handleInputChange to support setting entire arrays/objects
    const handleInputChange = (section, field, value) => {
        setFormData(prev => {
            if (field === null) {
                return {
                    ...prev,
                    config: {
                        ...prev.config,
                        [section]: value
                    }
                };
            }
            return {
                ...prev,
                config: {
                    ...prev.config,
                    [section]: {
                        ...prev.config[section],
                        [field]: value
                    }
                }
            };
        });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            if (selectedPlanId) {
                await updatePartnerPlan(selectedPlanId, { 
                    ...formData, 
                    partnerType: selectedPartnerType, 
                    country: selectedCountryId,
                    state: selectedStateId,
                    cluster: selectedClusterId,
                    district: selectedDistrictId
                });
                toast.success('Plan updated successfully');
                fetchPlans(); // Refresh
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to update plan');
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePlan = async () => {
        try {
            const newPlan = {
                ...initialFormState,
                name: formData.name || 'New Plan',
                price: parseFloat(formData.price) || 0,
                partnerType: selectedPartnerType,
                country: selectedCountryId,
                state: selectedStateId,
                cluster: selectedClusterId,
                district: selectedDistrictId
            };
            await createPartnerPlan(newPlan);
            toast.success('Plan created successfully');
            setShowAddPlanModal(false);
            fetchPlans();
        } catch (error) {
            console.error(error);
            toast.error('Failed to create plan');
        }
    };

    const handleDeletePlan = async (id) => {
        if (window.confirm('Are you sure you want to delete this plan?')) {
            try {
                await deletePartnerPlan(id);
                toast.success('Plan deleted');
                fetchPlans();
            } catch (error) {
                console.error(error);
                toast.error('Failed to delete plan');
            }
        }
    };

    // Icons map for URI rendering
    const getIcon = (iconName, className) => {
        switch (iconName) {
            case 'Rocket': return <Rocket className={className} />;
            case 'Layers': return <Layers className={className} />;
            case 'Building2': return <Building2 className={className} />;
            case 'SolarPanel': return <SolarPanel className={className} />;
            default: return <Rocket className={className} />;
        }
    };

    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            const headerOffset = 100; // Account for sticky header
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    };

    if (loading && partners.length === 0) {
        return <div className="flex justify-center items-center h-screen"><Loader className="animate-spin text-blue-600 w-8 h-8" /></div>;
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen font-sans">
            <style>{`
                .scrollbar-thin::-webkit-scrollbar { width: 6px; height: 6px; }
                .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
                .scrollbar-thin::-webkit-scrollbar-thumb { background: #ddd; border-radius: 10px; }
                .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #bbb; }
            `}</style>
            {/* Context Selectors */}
            <div className="mb-6 space-y-6">
                {/* 1. Partner Type Selection */}
                <div>
                    <h2 className="text-lg font-bold text-gray-800 mb-3 ml-1">Select Partner Type</h2>
                    <div className="flex flex-wrap gap-4">
                        {partners.map((partner) => (
                            <div
                                key={partner._id}
                                onClick={() => setSelectedPartnerType(partner.name)}
                                className={`cursor-pointer px-6 py-4 rounded-xl shadow-sm text-center min-w-[150px] transition-all bg-white border ${
                                    selectedPartnerType === partner.name
                                        ? 'border-blue-500 text-blue-600 font-bold ring-1 ring-blue-500'
                                        : 'border-gray-200 text-gray-600 hover:border-blue-300'
                                }`}
                            >
                                {partner.name}
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. Location Cascade Selection */}
                {selectedPartnerType && (
                    <div className="pt-2 space-y-6">
                        {/* Country Selection */}
                        <div>
                            <h2 className="text-lg font-bold text-gray-800 mb-3 ml-1 flex items-center gap-2">
                                <Globe className="w-5 h-5 text-blue-600" /> Select Country
                            </h2>
                            <div className="flex flex-wrap gap-4">
                                {countries.map((country) => (
                                    <div
                                        key={country._id}
                                        onClick={() => setSelectedCountryId(prev => prev === country._id ? '' : country._id)}
                                        className={`cursor-pointer px-6 py-4 rounded-xl shadow-sm text-center min-w-[180px] transition-all bg-white border ${
                                            selectedCountryId === country._id
                                                ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-blue-300'
                                        }`}
                                    >
                                        <div className={`font-bold text-lg ${selectedCountryId === country._id ? 'text-blue-600' : 'text-gray-800'}`}>
                                            {country.name}
                                        </div>
                                        <div className="text-gray-500 text-sm mt-1 uppercase tracking-wider">
                                            {country.code || country.name.substring(0, 3).toUpperCase()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* State Selection */}
                        {selectedCountryId && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                <h2 className="text-lg font-bold text-gray-800 mb-3 ml-1 flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-blue-600" /> Select State
                                </h2>
                                <div className="flex flex-wrap gap-4">
                                    {states.length > 0 ? (
                                        states.map((state) => (
                                            <div
                                                key={state._id}
                                                onClick={() => setSelectedStateId(prev => prev === state._id ? '' : state._id)}
                                                className={`cursor-pointer px-6 py-4 rounded-xl shadow-sm text-center min-w-[180px] transition-all bg-white border ${
                                                    selectedStateId === state._id
                                                        ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50'
                                                        : 'border-gray-200 hover:border-blue-300'
                                                }`}
                                            >
                                                <div className={`font-bold text-lg ${selectedStateId === state._id ? 'text-blue-600' : 'text-gray-800'}`}>
                                                    {state.name}
                                                </div>
                                                <div className="text-gray-500 text-sm mt-1 uppercase">
                                                    {state.code || state.name.substring(0, 2).toUpperCase()}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="bg-gray-100/50 rounded-xl p-4 text-center text-gray-400 border border-dashed w-full max-w-sm">
                                            No states found for this country
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col gap-6">
                            {/* Cluster Selection */}
                            {selectedStateId && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                    <h2 className="text-lg font-bold text-gray-800 mb-3 ml-1 flex items-center gap-2">
                                        <Layers className="w-5 h-5 text-blue-600" /> Select Cluster
                                    </h2>
                                    <div className="flex flex-wrap gap-3">
                                        {clusters.length > 0 ? (
                                            clusters.map((cluster) => (
                                                <div
                                                    key={cluster._id}
                                                    onClick={() => setSelectedClusterId(prev => prev === cluster._id ? '' : cluster._id)}
                                                    className={`cursor-pointer px-6 py-3 rounded-xl shadow-sm text-center min-w-[160px] transition-all bg-white border ${
                                                        selectedClusterId === cluster._id
                                                            ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50'
                                                            : 'border-gray-200 hover:border-blue-300'
                                                    }`}
                                                >
                                                    <div className={`font-bold ${selectedClusterId === cluster._id ? 'text-blue-600' : 'text-gray-800'}`}>
                                                        {cluster.name || cluster.clusterName || 'Unnamed'}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="bg-gray-100/50 rounded-xl p-4 text-center text-gray-400 border border-dashed text-sm w-full max-w-sm">
                                                No clusters found for this state
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* District Selection */}
                            {selectedClusterId && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                    <h2 className="text-lg font-bold text-gray-800 mb-3 ml-1 flex items-center gap-2">
                                        <Target className="w-5 h-5 text-blue-600" /> Select District
                                    </h2>
                                    <div className="flex flex-wrap gap-3">
                                        {districts.length > 0 ? (
                                            districts.map((district) => (
                                                <div
                                                    key={district._id}
                                                    onClick={() => setSelectedDistrictId(prev => prev === district._id ? '' : district._id)}
                                                    className={`cursor-pointer px-6 py-3 rounded-xl shadow-sm text-center min-w-[160px] transition-all bg-white border ${
                                                        selectedDistrictId === district._id
                                                            ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50'
                                                            : 'border-gray-200 hover:border-blue-300'
                                                    }`}
                                                >
                                                    <div className={`font-bold ${selectedDistrictId === district._id ? 'text-blue-600' : 'text-gray-800'}`}>
                                                        {district.name || district.districtName || 'Unnamed'}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="bg-gray-100/50 rounded-xl p-4 text-center text-gray-400 border border-dashed text-sm w-full max-w-sm">
                                                No districts found for this cluster
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {loading && partners.length > 0 ? (
                <div className="flex justify-center p-8"><Loader className="animate-spin text-blue-600 w-8 h-8" /></div>
            ) : (!selectedPartnerType) ? (
                <div className="bg-white rounded-xl p-8 text-center text-gray-500 shadow-sm border border-dashed text-lg font-medium flex flex-col items-center justify-center min-h-[200px]">
                    <Rocket className="w-12 h-12 text-gray-300 mb-4" />
                    Please select a Partner Type to view and configure plans.
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    {/* Top Pill Navigation for Plans */}
                    <div className="flex flex-col lg:flex-row items-center justify-start gap-6 border-b border-gray-200 pb-2">
                        <div className="flex flex-wrap gap-2 overflow-visible w-auto pt-5 pb-3 px-3">
                            {plans.map(plan => {
                                let isSelected = selectedPlanId === plan._id;
                                let buttonClass = 'px-4 py-2 font-bold whitespace-nowrap transition-colors flex items-center gap-2 rounded-md';
                                let customStyle = {};
                                
                                // Safely resolve color, ignoring legacy tailwind classes
                                let safeColor = (plan.ui?.buttonColor && plan.ui.buttonColor.startsWith('#')) 
                                    ? plan.ui.buttonColor 
                                    : '#0078bd';
                                
                                if (isSelected) {
                                    buttonClass += ' text-white shadow-md';
                                    customStyle = {
                                        backgroundColor: safeColor,
                                        color: '#ffffff',
                                    };
                                } else {
                                    buttonClass += ' hover:bg-gray-50 border border-gray-200';
                                    customStyle = {
                                        color: safeColor,
                                        backgroundColor: 'transparent',
                                    };
                                }

                                return (
                                    <div key={plan._id} className="relative group">
                                        <button
                                            onClick={() => handlePlanSelect(plan._id)}
                                            className={buttonClass}
                                            style={customStyle}
                                        >
                                            {getIcon(plan.ui?.icon, "w-4 h-4")}
                                            {plan.name}
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeletePlan(plan._id); }}
                                            className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-all z-30 hover:bg-red-600 hover:scale-110"
                                            title="Delete Plan"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex shrink-0 mt-2 lg:mt-0">
                            <button
                                onClick={() => {
                                    setFormData(initialFormState);
                                    setShowAddPlanModal(true);
                                }}
                                className="bg-[#343a40] hover:bg-[#23272b] text-white px-4 py-2 rounded-md flex items-center gap-2 font-bold transition-colors"
                            >
                                <Plus className="w-4 h-4" /> Add More Plan
                            </button>
                        </div>
                    </div>

                    {selectedPlanId && (
                        <div className="flex flex-col lg:flex-row gap-6 items-start">
                            {/* Left Scroll Sidebar */}
                            <div className="w-full lg:w-[18%] sticky top-20 bg-white border border-gray-200 hidden lg:block rounded-md overflow-hidden text-sm self-start shadow-md">
                                <div className="bg-[#0078bd] text-white px-4 py-3 font-bold flex items-center gap-3 text-lg border-b border-[#006ba9]">
                                    <List className="w-6 h-6" /> Plan Sections
                                </div>
                                <div className="flex flex-col py-3 bg-white">
                                    {[
                                        { name: 'KYC Requirements', id: 'kyc-requirements' },
                                        { name: 'Eligibility', id: 'eligibility' },
                                        { name: 'Coverage & Project Types', id: 'coverage-&-project-types' },
                                        { name: 'User Management', id: 'user-management' },
                                        { name: 'Category Types', id: 'category-types' },
                                        { name: 'Features', id: 'features' },
                                        { name: 'Quote Settings', id: 'quote-settings' },
                                        { name: 'Fees & Charges', id: 'fees-&-charges' },
                                        { name: 'Incentive& Targets', id: 'incentive-&-targets' },
                                        { name: 'Commission Setup', id: 'commission-setup' },
                                        { name: 'Rewards And Points', id: 'rewards-and-points' },
                                        { name: 'Training Videos', id: 'training-videos' },
                                        { name: 'UI & Branding', id: 'ui-branding' }
                                    ].map((item) => (
                                        <button
                                            key={item.name}
                                            onClick={() => scrollToSection(item.id)}
                                            className="px-5 py-3.5 text-left hover:bg-gray-50 text-[#555] flex items-start gap-3 font-medium transition-colors border-b border-gray-50 last:border-0 leading-tight"
                                        >
                                            <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" /> 
                                            <span className="text-[15px]">{item.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Center Content Form */}
                            <div className="w-full lg:w-[62%] bg-white rounded-lg shadow-md border border-gray-200 p-8 space-y-12">
                                {/* Plan Header */}
                                <div className="border-b-2 border-blue-600 pb-4 mb-8 text-left">
                                    <div className="flex justify-between items-center mb-1">
                                        <h1 className="text-3xl font-bold text-[#0078bd]">{formData.name}</h1>
                                        <div className="flex gap-6">
                                            <button className="text-blue-600 flex items-center gap-1.5 font-medium hover:underline text-sm">
                                                <Edit className="w-4 h-4" /> Edit Plan
                                            </button>
                                            <button className="text-blue-600 flex items-center gap-1.5 font-medium hover:underline text-sm">
                                                <MessageSquare className="w-4 h-4" /> Edit Msg
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-[#777] font-medium">Configure settings for the {formData.name.toLowerCase()}</p>
                                </div>

                                {/* Form Sections mapping closely to UI screenshot design */}
                                
                                {/* KYC Requirements */}
                                <div id="kyc-requirements" className="border rounded-md border-gray-200 overflow-hidden shadow-sm">
                                    <div className="bg-[#0078bd] text-white px-5 py-3 font-bold flex justify-between items-center text-lg text-left">
                                        <div className="flex items-center gap-2">
                                            <Monitor className="w-5 h-5" /> KYC Requirements
                                        </div>
                                        <span className="bg-white text-[#0078bd] text-[10px] uppercase font-bold px-2.5 py-1 rounded">Required</span>
                                    </div>
                                    <div className="p-5 grid grid-cols-2 gap-8">
                                        <div>
                                            <h4 className="font-bold text-gray-800 mb-3 text-base">KYC Documents</h4>
                                            <div className="space-y-2">
                                                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.config?.kyc?.aadhar} onChange={(e) => handleInputChange('kyc', 'aadhar', e.target.checked)} className="rounded" /> <span className="text-gray-700">Aadhar Card</span></label>
                                                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.config?.kyc?.pan} onChange={(e) => handleInputChange('kyc', 'pan', e.target.checked)} className="rounded" /> <span className="text-gray-700">PAN Card</span></label>
                                                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.config?.kyc?.gst} onChange={(e) => handleInputChange('kyc', 'gst', e.target.checked)} className="rounded" /> <span className="text-gray-700">GST Certificate</span></label>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800 mb-3 text-base">Verification Status</h4>
                                            <div className="space-y-2 mb-4">
                                                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.config?.kyc?.verifiedPartner} onChange={(e) => handleInputChange('kyc', 'verifiedPartner', e.target.checked)} className="rounded" /> <span className="text-gray-700">Verified Dealer</span></label>
                                                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.config?.kyc?.notVerifiedPartner} onChange={(e) => handleInputChange('kyc', 'notVerifiedPartner', e.target.checked)} className="rounded bg-blue-600" /> <span className="text-gray-700">Not Verified Dealer</span></label>
                                            </div>
                                            <h4 className="font-bold text-gray-800 mb-3 text-base">Additional Documents</h4>
                                            <input type="file" className="text-sm text-gray-600 border rounded p-1" />
                                        </div>
                                    </div>
                                </div>

                                {/* Eligibility */}
                                <div id="eligibility" className="border rounded-md border-gray-200 overflow-hidden shadow-sm">
                                    <div className="bg-[#0078bd] text-white px-5 py-3 font-bold flex items-center gap-2 text-lg text-left">
                                        <CheckCircle2 className="w-5 h-5" /> Eligibility Requirements
                                    </div>
                                    <div className="p-5 grid grid-cols-2 gap-8">
                                        <div>
                                            <h4 className="font-bold text-gray-800 mb-3 text-base text-left">Basic Requirements</h4>
                                            <div className="space-y-2">
                                                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.config?.eligibility?.kyc} onChange={(e) => handleInputChange('eligibility', 'kyc', e.target.checked)} className="rounded" /> <span className="text-gray-700">KYC Verified</span></label>
                                                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.config?.eligibility?.agreement} onChange={(e) => handleInputChange('eligibility', 'agreement', e.target.checked)} className="rounded" /> <span className="text-gray-700">Agreement Signed</span></label>
                                                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.config?.eligibility?.depositCheque} onChange={(e) => handleInputChange('eligibility', 'depositCheque', e.target.checked)} className="rounded" /> <span className="text-gray-700">Security Deposit Cheque</span></label>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <h4 className="font-bold text-gray-800 mb-1 text-sm text-left">GST Requirements</h4>
                                                    <select value={formData.config?.eligibility?.gstRequired ? 'yes' : 'no'} onChange={(e) => handleInputChange('eligibility', 'gstRequired', e.target.value === 'yes')} className="w-full border rounded p-2 text-sm">
                                                        <option value="no">No</option>
                                                        <option value="yes">Yes</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-800 mb-1 text-sm text-left">Deposit Amount</h4>
                                                    <input type="text" placeholder="₹ 0" value={formData.config?.eligibility?.depositAmount} onChange={(e) => handleInputChange('eligibility', 'depositAmount', e.target.value)} className="w-full border rounded p-2 text-sm" />
                                                </div>
                                            </div>
                                            <label className="flex items-center gap-2 pt-2"><input type="checkbox" checked={formData.config?.eligibility?.noCashback} onChange={(e) => handleInputChange('eligibility', 'noCashback', e.target.checked)} className="rounded" /> <span className="text-gray-700 font-bold">No Cashback for this plan</span></label>
                                        </div>
                                    </div>
                                </div>

                                {/* Coverage & Project Types */}
                                <div id="coverage-&-project-types" className="border rounded-md border-gray-200 overflow-hidden shadow-sm">
                                    <div className="bg-[#0078bd] text-white px-5 py-3 font-bold flex items-center gap-2 text-lg text-left">
                                        <Globe className="w-5 h-5" /> Coverage & Project Types
                                    </div>
                                    <div className="p-5 grid grid-cols-2 gap-8">
                                        <div>
                                            <h4 className="font-bold text-gray-800 mb-3 text-base text-left">Operation Area</h4>
                                            <select value={formData.config?.coverage?.area} onChange={(e) => handleInputChange('coverage', 'area', e.target.value)} className="w-full border rounded p-3 mb-4 text-sm">
                                                <option value="1 District">1 District</option>
                                                <option value="Whole State">Whole State</option>
                                                <option value="Multiple Districts">Multiple Districts</option>
                                            </select>
                                            <div className="grid grid-cols-2 gap-2">
                                                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.config?.coverage?.city} onChange={(e) => handleInputChange('coverage', 'city', e.target.checked)} className="rounded" /> <span className="text-gray-700">City Level</span></label>
                                                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.config?.coverage?.district} onChange={(e) => handleInputChange('coverage', 'district', e.target.checked)} className="rounded" /> <span className="text-gray-700">District Level</span></label>
                                                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.config?.coverage?.cluster} onChange={(e) => handleInputChange('coverage', 'cluster', e.target.checked)} className="rounded" /> <span className="text-gray-700">Cluster Level</span></label>
                                                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.config?.coverage?.state} onChange={(e) => handleInputChange('coverage', 'state', e.target.checked)} className="rounded" /> <span className="text-gray-700">State Level</span></label>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800 mb-3 text-base text-left">Project Types Allowed</h4>
                                            <div className="flex flex-wrap gap-2">
                                                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold border border-blue-100">Residential</span>
                                                <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-bold border border-green-100">Commercial</span>
                                                <span className="px-3 py-1 bg-yellow-50 text-yellow-600 rounded-full text-xs font-bold border border-yellow-100">Industrial</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* User Management */}
                                <div id="user-management" className="border rounded-md border-gray-200 overflow-hidden shadow-sm">
                                    <div className="bg-[#0078bd] text-white px-5 py-3 font-bold flex items-center gap-2 text-lg text-left">
                                        <Users className="w-5 h-5" /> User Management
                                    </div>
                                    <div className="p-5 grid grid-cols-2 gap-8">
                                        <div>
                                            <h4 className="font-bold text-gray-800 mb-3 text-base text-left">Access Controls</h4>
                                            <div className="space-y-2">
                                                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.config?.user?.sales} onChange={(e) => handleInputChange('user', 'sales', e.target.checked)} className="rounded" /> <span className="text-gray-700">Sales Dashboard</span></label>
                                                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.config?.user?.admin} onChange={(e) => handleInputChange('user', 'admin', e.target.checked)} className="rounded" /> <span className="text-gray-700">Mini Admin Panel</span></label>
                                                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.config?.user?.leadPartner} onChange={(e) => handleInputChange('user', 'leadPartner', e.target.checked)} className="rounded" /> <span className="text-gray-700">Lead Partner Access</span></label>
                                                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.config?.user?.service} onChange={(e) => handleInputChange('user', 'service', e.target.checked)} className="rounded" /> <span className="text-gray-700">Service Requests</span></label>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800 mb-1 text-sm text-left">Max Sub-logins</h4>
                                            <input type="number" value={formData.config?.user?.userLimit} onChange={(e) => handleInputChange('user', 'userLimit', parseInt(e.target.value))} className="w-full border rounded p-2 mb-4 text-sm" />
                                            <label className="flex items-center gap-2"><input type="checkbox" checked={formData.config?.user?.noSublogin} onChange={(e) => handleInputChange('user', 'noSublogin', e.target.checked)} className="rounded" /> <span className="text-gray-700 font-bold">Disable Sub-logins</span></label>
                                        </div>
                                    </div>
                                </div>


                                {/* Category Types */}
                                <div id="category-types" className="border rounded-md border-gray-200 overflow-hidden shadow-sm">
                                    <div className="bg-[#0078bd] text-white px-5 py-3 font-bold flex items-center gap-2 text-lg text-left">
                                        <Layers className="w-5 h-5" /> Category Types
                                    </div>
                                    <div className="p-5 grid grid-cols-2 gap-8">
                                        <div>
                                            <h4 className="font-bold text-gray-800 mb-3 text-base text-left">Category Selection</h4>
                                            <div className="space-y-2">
                                                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.config?.category?.upto3kw} onChange={(e) => handleInputChange('category', 'upto3kw', e.target.checked)} className="rounded" /> <span className="text-gray-700">Up to 3 KW</span></label>
                                                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.config?.category?.threeTo10kw} onChange={(e) => handleInputChange('category', 'threeTo10kw', e.target.checked)} className="rounded" /> <span className="text-gray-700">3 KW - 10 KW</span></label>
                                                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.config?.category?.tenTo100kw} onChange={(e) => handleInputChange('category', 'tenTo100kw', e.target.checked)} className="rounded" /> <span className="text-gray-700">10 KW - 100 KW</span></label>
                                                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.config?.category?.above100kw} onChange={(e) => handleInputChange('category', 'above100kw', e.target.checked)} className="rounded" /> <span className="text-gray-700">100 KW - 200 KW</span></label>
                                                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.config?.category?.above200kw} onChange={(e) => handleInputChange('category', 'above200kw', e.target.checked)} className="rounded" /> <span className="text-gray-700">Above 200 KW</span></label>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="mb-4">
                                                <h4 className="font-bold text-gray-800 mb-3 text-base text-left">Project Type</h4>
                                                <div className="space-y-2">
                                                    <label className="flex items-center gap-2"><input type="checkbox" checked={formData.config?.category?.residential} onChange={(e) => handleInputChange('category', 'residential', e.target.checked)} className="rounded" /> <span className="text-gray-700">Residential</span></label>
                                                    <label className="flex items-center gap-2"><input type="checkbox" checked={formData.config?.category?.commercial} onChange={(e) => handleInputChange('category', 'commercial', e.target.checked)} className="rounded" /> <span className="text-gray-700">Commercial</span></label>
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-800 mb-3 text-base text-left">Sub Project Type</h4>
                                                <div className="space-y-2">
                                                    <label className="flex items-center gap-2"><input type="checkbox" checked={formData.config?.category?.onGrid} onChange={(e) => handleInputChange('category', 'onGrid', e.target.checked)} className="rounded" /> <span className="text-gray-700">On-Grid</span></label>
                                                    <label className="flex items-center gap-2"><input type="checkbox" checked={formData.config?.category?.offGrid} onChange={(e) => handleInputChange('category', 'offGrid', e.target.checked)} className="rounded" /> <span className="text-gray-700">Off-Grid</span></label>
                                                    <label className="flex items-center gap-2"><input type="checkbox" checked={formData.config?.category?.hybrid} onChange={(e) => handleInputChange('category', 'hybrid', e.target.checked)} className="rounded" /> <span className="text-gray-700">Hybrid</span></label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Quote Settings */}
                                <div id="quote-settings" className="border rounded-md border-gray-200 overflow-hidden shadow-sm text-left">
                                    <div className="bg-[#0078bd] text-white px-5 py-3 font-bold text-lg flex items-center gap-2">
                                        <Settings className="w-5 h-5" /> Quote Settings
                                    </div>
                                    <div className="p-5 grid grid-cols-2 gap-8">
                                        <div>
                                            <h4 className="font-bold text-gray-800 mb-3 text-base">Customer Quote Type</h4>
                                            <div className="space-y-2">
                                                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.config?.quote?.quickQuote} onChange={(e) => handleInputChange('quote', 'quickQuote', e.target.checked)} className="rounded" /> <span className="text-gray-700">Quick Quote</span></label>
                                                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.config?.quote?.surveyQuote} onChange={(e) => handleInputChange('quote', 'surveyQuote', e.target.checked)} className="rounded" /> <span className="text-gray-700">Survey Quote</span></label>
                                                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.config?.quote?.generationGraph} onChange={(e) => handleInputChange('quote', 'generationGraph', e.target.checked)} className="rounded" /> <span className="text-gray-700">Generation Graph</span></label>
                                                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.config?.quote?.addons} onChange={(e) => handleInputChange('quote', 'addons', e.target.checked)} className="rounded" /> <span className="text-gray-700">Add-ons</span></label>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="mb-4">
                                                <h4 className="font-bold text-gray-800 mb-1 text-base">Project Signup Limit</h4>
                                                <input type="text" placeholder="e.g. 10000 kw" value={formData.config?.quote?.projectSignupLimit} onChange={(e) => handleInputChange('quote', 'projectSignupLimit', e.target.value)} className="w-full border rounded p-2 text-sm" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-800 mb-1 text-base">Delivery Type</h4>
                                                <input type="text" placeholder="e.g. Standard" value={formData.config?.quote?.deliveryType} onChange={(e) => handleInputChange('quote', 'deliveryType', e.target.value)} className="w-full border rounded p-2 text-sm" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Fees & Charges */}
                                <div id="fees-&-charges" className="border rounded-md border-gray-200 overflow-hidden shadow-sm text-left">
                                    <div className="bg-[#0078bd] text-white px-5 py-3 font-bold text-lg flex items-center gap-2">
                                        <CreditCard className="w-5 h-5" /> Fees & Charges
                                    </div>
                                    <div className="p-5 grid grid-cols-3 gap-4">
                                        <div>
                                            <h4 className="font-bold text-gray-800 mb-1 text-sm">Signup Fees</h4>
                                            <input type="text" placeholder="e.g. 4999" value={formData.config?.fees?.signupFees} onChange={(e) => handleInputChange('fees', 'signupFees', e.target.value)} className="w-full border rounded p-2 text-sm" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800 mb-1 text-sm">Installer Charges</h4>
                                            <input type="text" placeholder="e.g. 5000" value={formData.config?.fees?.installerCharges} onChange={(e) => handleInputChange('fees', 'installerCharges', e.target.value)} className="w-full border rounded p-2 text-sm" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800 mb-1 text-sm">SD Amount Cheque</h4>
                                            <input type="text" placeholder="e.g. 10000" value={formData.config?.fees?.sdAmountCheque} onChange={(e) => handleInputChange('fees', 'sdAmountCheque', e.target.value)} className="w-full border rounded p-2 text-sm" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800 mb-1 text-sm">Applicable Upgrade Fees*</h4>
                                            <input type="text" placeholder="e.g. 2000" value={formData.config?.fees?.upgradeFees} onChange={(e) => handleInputChange('fees', 'upgradeFees', e.target.value)} className="w-full border rounded p-2 text-sm" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800 mb-1 text-sm">Signup Fees if Direct Upgrade*</h4>
                                            <input type="text" placeholder="e.g. 3000" value={formData.config?.fees?.directUpgradeFees} onChange={(e) => handleInputChange('fees', 'directUpgradeFees', e.target.value)} className="w-full border rounded p-2 text-sm" />
                                        </div>
                                    </div>
                                </div>

                                {/* Incentive & Targets */}
                                <div id="incentive-&-targets" className="border rounded-md border-gray-200 overflow-hidden shadow-sm text-left">
                                    <div className="bg-[#0078bd] text-white px-5 py-3 font-bold text-lg flex items-center gap-2">
                                        <Target className="w-5 h-5" /> Incentive & Targets
                                    </div>
                                    <div className="p-5 flex flex-col gap-4">
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <h4 className="font-bold text-gray-800 mb-1 text-sm">Yearly Target (kW)</h4>
                                                <input type="text" placeholder="Enter target in kW" value={formData.config?.incentive?.yearlyTarget} onChange={(e) => handleInputChange('incentive', 'yearlyTarget', e.target.value)} className="w-full border rounded p-2 text-sm" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-800 mb-1 text-sm">Cashback per kW (₹)</h4>
                                                <input type="text" placeholder="Enter cashback per kW" value={formData.config?.incentive?.cashbackPerKw} onChange={(e) => handleInputChange('incentive', 'cashbackPerKw', e.target.value)} className="w-full border rounded p-2 text-sm" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-800 mb-1 text-sm">Total Incentive (₹)</h4>
                                                <input type="text" readOnly placeholder="" value={formData.config?.incentive?.totalIncentive} className="w-full border rounded p-2 text-sm bg-gray-50" />
                                            </div>
                                        </div>
                                        <div className="flex justify-end">
                                            <button 
                                                onClick={calculateIncentive}
                                                className="bg-[#0078bd] hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-bold"
                                            >
                                                Calculate
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Commission Setup */}
                                <div id="commission-setup" className="border rounded-md border-gray-200 overflow-hidden shadow-sm text-left">
                                    <div className="bg-[#0078bd] text-white px-5 py-3 font-bold text-lg flex items-center gap-2">
                                        <Percent className="w-5 h-5" /> Commission Setup
                                    </div>
                                    <div className="p-5">
                                        <div className="overflow-x-auto scrollbar-thin">
                                            <table className="w-full text-sm border-collapse min-w-[800px]">
                                                <thead>
                                                    <tr className="bg-gray-100 text-gray-700 text-left">
                                                        <th className="p-2 border">Category</th>
                                                        <th className="p-2 border">Sub-Category</th>
                                                        <th className="p-2 border">Project Type</th>
                                                        <th className="p-2 border">Sub-Project Type</th>
                                                        <th className="p-2 border">Commission (₹)</th>
                                                        <th className="p-2 border w-10">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(formData.config?.commissions || []).map((row, index) => (
                                                        <tr key={index}>
                                                            <td className="p-2 border">
                                                                <select 
                                                                    value={row.category} 
                                                                    onChange={(e) => handleCommissionChange(index, 'category', e.target.value)}
                                                                    className="w-full border p-1 rounded"
                                                                >
                                                                    <option value="">Select</option>
                                                                    <option value="Solar Panel">Solar Panel</option>
                                                                    <option value="Solar Rooftop">Solar Rooftop</option>
                                                                </select>
                                                            </td>
                                                            <td className="p-2 border">
                                                                <select 
                                                                    value={row.subCategory} 
                                                                    onChange={(e) => handleCommissionChange(index, 'subCategory', e.target.value)}
                                                                    className="w-full border p-1 rounded"
                                                                >
                                                                    <option value="">Select</option>
                                                                    <option value="Upto 100KW">Upto 100KW</option>
                                                                    <option value="Above 100KW">Above 100KW</option>
                                                                </select>
                                                            </td>
                                                            <td className="p-2 border">
                                                                <select 
                                                                    value={row.projectType} 
                                                                    onChange={(e) => handleCommissionChange(index, 'projectType', e.target.value)}
                                                                    className="w-full border p-1 rounded"
                                                                >
                                                                    <option value="">Select</option>
                                                                    <option value="Residential">Residential</option>
                                                                    <option value="Commercial">Commercial</option>
                                                                </select>
                                                            </td>
                                                            <td className="p-2 border">
                                                                <select 
                                                                    value={row.subProjectType} 
                                                                    onChange={(e) => handleCommissionChange(index, 'subProjectType', e.target.value)}
                                                                    className="w-full border p-1 rounded"
                                                                >
                                                                    <option value="">Select</option>
                                                                    <option value="On-Grid">On-Grid</option>
                                                                    <option value="Off-Grid">Off-Grid</option>
                                                                </select>
                                                            </td>
                                                            <td className="p-2 border">
                                                                <div className="flex items-center gap-1">
                                                                    <input 
                                                                        type="text" 
                                                                        value={row.amount} 
                                                                        onChange={(e) => handleCommissionChange(index, 'amount', e.target.value)}
                                                                        className="w-full border p-1 rounded"
                                                                        placeholder="Enter amount"
                                                                    />
                                                                    <button className="p-1 border text-xs bg-white rounded flex items-center gap-1 hover:bg-gray-50"><Settings size={12} /> Settings</button>
                                                                </div>
                                                            </td>
                                                            <td className="p-2 border text-center">
                                                                <button 
                                                                    onClick={() => handleRemoveCommissionRow(index)}
                                                                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <button 
                                            onClick={handleAddCommissionRow}
                                            className="mt-4 text-[#1e73be] font-bold text-sm flex items-center gap-1 hover:underline"
                                        >
                                            <Plus size={16} /> Add Row
                                        </button>
                                    </div>
                                </div>

                                {/* Rewards And Points */}
                                <div id="rewards-and-points" className="border rounded-md border-gray-200 overflow-hidden shadow-sm text-left">
                                    <div className="bg-[#0078bd] text-white px-5 py-3 font-bold text-lg flex items-center gap-2">
                                        <Star className="w-5 h-5" /> Rewards And Points
                                    </div>
                                    <div className="p-5">
                                        <p className="text-gray-500 italic">Rewards and loyalty points configuration section...</p>
                                    </div>
                                </div>

                                {/* Training Videos */}
                                <div id="training-videos" className="border rounded-md border-gray-200 overflow-hidden shadow-sm text-left">
                                    <div className="bg-[#0078bd] text-white px-5 py-3 font-bold text-lg flex items-center gap-2">
                                        <Video className="w-5 h-5" /> Training Videos
                                    </div>
                                    <div className="p-5">
                                        <p className="text-gray-500 italic">Training video configuration section...</p>
                                    </div>
                                </div>

                                {/* UI & Branding */}
                                <div id="ui-branding" className="border rounded-md border-gray-200 overflow-hidden shadow-sm text-left">
                                    <div className="bg-[#0078bd] text-white px-5 py-3 font-bold text-lg flex items-center gap-2">
                                        <div className="flex items-center justify-center p-1 rounded-sm bg-white/20 mr-1"><div className="w-3 h-3 bg-red-400 rounded-full mr-1"></div><div className="w-3 h-3 bg-green-400 rounded-full mr-1"></div><div className="w-3 h-3 bg-blue-400 rounded-full"></div></div> UI & Branding
                                    </div>
                                    <div className="p-5 grid grid-cols-2 gap-8">
                                        <div>
                                            <h4 className="font-bold text-gray-800 mb-3 text-base">Plan Colors</h4>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Theme Button Color</label>
                                                    <div className="flex items-center gap-2">
                                                        <input 
                                                            type="color" 
                                                            value={formData.ui?.buttonColor?.startsWith('#') ? formData.ui.buttonColor : '#0078bd'} 
                                                            onChange={(e) => handleUiChange('buttonColor', e.target.value)} 
                                                            className="w-10 h-10 p-0 border-0 rounded cursor-pointer"
                                                        />
                                                        <span className="text-sm text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded border">{formData.ui?.buttonColor || '#0078bd'}</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Header Background Color</label>
                                                    <div className="flex items-center gap-2">
                                                        <input 
                                                            type="color" 
                                                            value={formData.ui?.headerColor?.startsWith('#') ? formData.ui.headerColor : '#0078bd'} 
                                                            onChange={(e) => handleUiChange('headerColor', e.target.value)} 
                                                            className="w-10 h-10 p-0 border-0 rounded cursor-pointer"
                                                        />
                                                        <span className="text-sm text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded border">{formData.ui?.headerColor || '#0078bd'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800 mb-3 text-base">Plan Icons</h4>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Lucide Icon Name</label>
                                                    <input 
                                                        type="text" 
                                                        placeholder="e.g. Rocket, Star, Shield"
                                                        value={formData.ui?.icon || ''} 
                                                        onChange={(e) => handleUiChange('icon', e.target.value)} 
                                                        className="w-full border rounded p-2 text-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Features */}
                                <div id="features" className="border rounded-md border-gray-200 overflow-hidden shadow-sm text-left">
                                    <div className="bg-[#0078bd] text-white px-5 py-3 font-bold text-lg flex items-center gap-2">
                                        <Rocket className="w-5 h-5" /> Features
                                    </div>
                                    <div className="p-5 grid grid-cols-2 gap-8">
                                        <div>
                                            <h4 className="font-bold text-gray-800 mb-3 text-base">Platform Features</h4>
                                            <div className="space-y-2">
                                                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.config?.features?.adminApp} onChange={(e) => handleInputChange('features', 'adminApp', e.target.checked)} className="rounded" /> <span className="text-gray-700">Admin App</span></label>
                                                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.config?.features?.adminCrm} onChange={(e) => handleInputChange('features', 'adminCrm', e.target.checked)} className="rounded" /> <span className="text-gray-700">Admin CRM</span></label>
                                                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.config?.features?.userApp} onChange={(e) => handleInputChange('features', 'userApp', e.target.checked)} className="rounded" /> <span className="text-gray-700">Dealer User</span></label>
                                                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.config?.features?.leadPartner} onChange={(e) => handleInputChange('features', 'leadPartner', e.target.checked)} className="rounded" /> <span className="text-gray-700">Lead Partner Access</span></label>
                                                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.config?.features?.districtManager} onChange={(e) => handleInputChange('features', 'districtManager', e.target.checked)} className="rounded" /> <span className="text-gray-700">District Manager User</span></label>
                                                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.config?.features?.appSubUser} onChange={(e) => handleInputChange('features', 'appSubUser', e.target.checked)} className="rounded" /> <span className="text-gray-700">App Sub User</span></label>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800 mb-3 text-base">CRM App Features</h4>
                                            <div className="space-y-2">
                                                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.config?.features?.crmLeadManagement} onChange={(e) => handleInputChange('features', 'crmLeadManagement', e.target.checked)} className="rounded" /> <span className="text-gray-700">Lead Management</span></label>
                                                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.config?.features?.assignLead} onChange={(e) => handleInputChange('features', 'assignLead', e.target.checked)} className="rounded" /> <span className="text-gray-700">Assign Lead</span></label>
                                                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.config?.features?.crmKnowMargin} onChange={(e) => handleInputChange('features', 'crmKnowMargin', e.target.checked)} className="rounded" /> <span className="text-gray-700">Know my margin</span></label>
                                                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.config?.features?.crmSurveyBom} onChange={(e) => handleInputChange('features', 'crmSurveyBom', e.target.checked)} className="rounded" /> <span className="text-gray-700">Survey BOM</span></label>
                                                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.config?.features?.crmInstall} onChange={(e) => handleInputChange('features', 'crmInstall', e.target.checked)} className="rounded" /> <span className="text-gray-700">Install</span></label>
                                                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.config?.features?.crmService} onChange={(e) => handleInputChange('features', 'crmService', e.target.checked)} className="rounded" /> <span className="text-gray-700">Service</span></label>
                                                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.config?.features?.crmProjectManagement} onChange={(e) => handleInputChange('features', 'crmProjectManagement', e.target.checked)} className="rounded" /> <span className="text-gray-700">Project Management</span></label>
                                                <label className="flex items-center gap-2"><input type="checkbox" checked={formData.config?.features?.crmAmcPlan} onChange={(e) => handleInputChange('features', 'crmAmcPlan', e.target.checked)} className="rounded" /> <span className="text-gray-700">AMC Plan</span></label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right flex justify-end gap-4 mt-6">
                                     <button 
                                        onClick={() => handleDeletePlan(selectedPlanId)}
                                        className="bg-red-50 text-red-600 hover:bg-red-100 font-bold py-2 px-6 rounded border border-red-200 transition-colors"
                                     >
                                         Delete Plan
                                     </button>
                                     <button onClick={handleSave} className="bg-[#1e73be] hover:bg-blue-700 text-white font-bold py-2 px-6 rounded">
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                            
                            {/* Right Plan View Sidebar Widget */}
                            <div className="w-full lg:w-[20%] sticky top-20 bg-[#f8f9fa] border-4 border-white shadow-xl flex flex-col items-center p-8 relative rounded-md self-start text-left">
                                <div 
                                    className="w-full py-8 px-4 text-center text-white mb-6 relative overflow-hidden flex flex-col items-center justify-center rounded"
                                    style={{ backgroundColor: formData.ui?.headerColor?.startsWith('#') ? formData.ui.headerColor : '#0078bd' }}
                                >
                                    <h2 className="text-3xl font-black uppercase tracking-wide mb-1 relative z-10">{formData.name}</h2>
                                    <p className="text-sm font-medium relative z-10 opacity-90">Perfect for your business</p>
                                </div>
                                
                                <div className="text-center w-full mb-6">
                                    <h3 className="text-4xl font-black text-gray-800 mb-1 flex items-center justify-center gap-1">
                                        ₹<input type="number" value={formData.price} onChange={(e) => handleRootInputChange('price', e.target.value)} className="bg-transparent border-none text-center focus:ring-0 font-black p-0 w-32" />
                                    </h3>
                                    <p className="text-gray-500 font-medium">
                                        <input type="text" value={formData.priceDescription} onChange={(e) => handleRootInputChange('priceDescription', e.target.value)} className="bg-transparent border-none text-center focus:ring-0 w-full" />
                                    </p>
                                </div>

                                <div className="w-full space-y-2 mb-6">
                                    <div className="bg-[#0078bd] text-white text-center py-4 font-bold flex flex-col items-center rounded shadow-sm">
                                        <span className="text-xs uppercase opacity-80 mb-1">🎯 Yearly Target</span>
                                        <div className="flex items-center gap-1">
                                            <input type="number" value={formData.yearlyTargetKw} onChange={(e) => handleRootInputChange('yearlyTargetKw', e.target.value)} className="bg-transparent border-none focus:ring-0 p-0 w-16 text-center text-white font-black text-lg" />
                                            <span className="text-lg font-black">KW</span>
                                        </div>
                                    </div>
                                    <div className="bg-[#0078bd] text-white text-center py-4 font-bold flex flex-col items-center rounded shadow-sm">
                                        <span className="text-xs uppercase opacity-80 mb-1">💰 Incentive</span>
                                        <div className="flex items-center gap-1">
                                            <span className="text-lg font-black">₹</span>
                                            <input type="number" value={formData.cashbackAmount} onChange={(e) => handleRootInputChange('cashbackAmount', e.target.value)} className="bg-transparent border-none focus:ring-0 p-0 w-24 text-center text-white font-black text-lg" />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-[#28a745] text-white px-6 py-2 rounded-md font-extrabold mb-6 shadow-sm uppercase text-xs tracking-wider">
                                    {formData.accessType || 'App Only Access'}
                                </div>
                                
                                <div className="text-center flex flex-col items-center justify-center mb-8">
                                    <div className="flex items-center gap-2 text-[#0078bd] font-black text-xl">
                                        <Users className="w-6 h-6"/> {formData.userDescription || 'Single User'}
                                    </div>
                                    <p className="text-gray-500 text-sm font-medium mt-1">1 primary user account</p>
                                </div>
                                
                                <div className="w-full text-left bg-white p-5 mb-8 border border-gray-200 rounded-lg shadow-inner">
                                    <div className="flex justify-between items-center mb-4 text-gray-800 font-bold">
                                        <span className="text-sm">Total Cashback</span> <Monitor className="w-4 h-4 text-[#0078bd]" />
                                    </div>
                                    <h4 className="font-bold text-gray-900 border-b pb-2 mb-3 text-sm">Project Types</h4>
                                    <ul className="text-gray-600 space-y-2">
                                        <li className="flex items-center gap-2 text-xs font-medium"><Check className="w-3.5 h-3.5 text-green-500"/> Residential Projects</li>
                                        <li className="flex items-center gap-2 text-xs font-medium"><Check className="w-3.5 h-3.5 text-green-500"/> Commercial Projects</li>
                                    </ul>
                                </div>

                                <button 
                                    onClick={handleSave} 
                                    className="w-full text-white font-black py-4 rounded-lg hover:shadow-xl transition-all shadow-md uppercase tracking-widest text-sm flex items-center justify-center gap-2"
                                    style={{ backgroundColor: formData.ui?.buttonColor?.startsWith('#') ? formData.ui.buttonColor : '#0078bd' }}
                                >
                                    Upgrade Plan <Rocket className="w-4 h-4" />
                                </button>
                                
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Add Plan Modal */}
            {showAddPlanModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-96 font-sans">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Add New Plan</h3>
                            <button onClick={() => setShowAddPlanModal(false)}><X className="text-gray-500" /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Plan Name</label>
                                <input
                                    type="text"
                                    placeholder="Enter Plan Name"
                                    className="w-full border rounded p-2"
                                    value={formData.name}
                                    onChange={(e) => handleRootInputChange('name', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Price (₹)</label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    className="w-full border rounded p-2"
                                    value={formData.price}
                                    onChange={(e) => handleRootInputChange('price', e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Theme Color</label>
                                    <div className="flex border rounded p-1">
                                        <input 
                                            type="color" 
                                            value={formData.ui?.buttonColor?.startsWith('#') ? formData.ui.buttonColor : '#0078bd'} 
                                            onChange={(e) => handleUiChange('buttonColor', e.target.value)} 
                                            className="w-8 h-8 p-0 border-0 rounded cursor-pointer"
                                        />
                                        <input 
                                            type="text"
                                            value={formData.ui?.buttonColor?.startsWith('#') ? formData.ui.buttonColor : '#0078bd'}
                                            onChange={(e) => handleUiChange('buttonColor', e.target.value)}
                                            className="w-full border-none focus:ring-0 px-2 text-sm text-gray-600"
                                            placeholder="#0078bd"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Header Color</label>
                                    <div className="flex border rounded p-1">
                                        <input 
                                            type="color" 
                                            value={formData.ui?.headerColor?.startsWith('#') ? formData.ui.headerColor : '#0078bd'} 
                                            onChange={(e) => handleUiChange('headerColor', e.target.value)} 
                                            className="w-8 h-8 p-0 border-0 rounded cursor-pointer"
                                        />
                                        <input 
                                            type="text"
                                            value={formData.ui?.headerColor?.startsWith('#') ? formData.ui.headerColor : '#0078bd'}
                                            onChange={(e) => handleUiChange('headerColor', e.target.value)}
                                            className="w-full border-none focus:ring-0 px-2 text-sm text-gray-600"
                                            placeholder="#0078bd"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setShowAddPlanModal(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                            <button onClick={handleCreatePlan} className="px-4 py-2 bg-blue-600 text-white rounded font-bold">Create Plan</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
