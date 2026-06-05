import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { Link, useNavigate } from 'react-router-dom';
import {
    Home,
    Building,
    Filter,
    Search,
    RefreshCw,
    ChevronRight,
    CheckCircle,
    AlertCircle,
    Clock,
    ArrowRight,
    Eye,
    Users,
    Zap,
    Sun,
    Wind,
    Grid,
    Calendar,
    User,
    Phone,
    MapPin,
    FileText,
    Download,
    Upload,
    Settings,
    Play,
    Pause,
    Check,
    X
} from 'lucide-react';
import { projectApi } from '../../../../services/project/projectApi';
import { getProjects } from '../../../../services/project/projectService';

const FranchiseeManagerProjectInProgress = () => {
    const navigate = useNavigate();
    const [projectType, setProjectType] = useState('residential'); // 'residential' or 'commercial'
    const [activeProcess, setActiveProcess] = useState('consumerRegistered');
    const [categoriesList, setCategoriesList] = useState([]);
    const [subCategoriesList, setSubCategoriesList] = useState([]);
    const [projectTypesList, setProjectTypesList] = useState([]);
    const [subProjectTypesList, setSubProjectTypesList] = useState([]);
    const [filters, setFilters] = useState({
        category: [],
        subCategory: [],
        projectType: [],
        subProjectType: [],
        partnerType: [],
        partnerPlan: []
    });
    const [cpFilter, setCpFilter] = useState('all');
    const [showFilters, setShowFilters] = useState(true);
    
    // Dynamic Settings
    const [dynamicStages, setDynamicStages] = useState([]);
    const [overdueSettings, setOverdueSettings] = useState({});
    
    // Real Data
    const [allProjects, setAllProjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [partnerTypeOptions, setPartnerTypeOptions] = useState([]);
    const [partnerPlanOptions, setPartnerPlanOptions] = useState([]);

    useEffect(() => {
        const fetchMasters = async () => {
            try {
                // Fetching master data from master API
                const { getCategories, getSubCategories, getProjectCategoryMappings, getSubProjectTypes } = await import('../../../../services/core/masterApi');
                // You can also use an instance of axios (e.g. api) if it's imported, but let's just fetch them along with others
                const apiModule = await import('../../../../api/api');
                const api = apiModule.default || apiModule;

                const [catRes, subCatRes, mappingRes, subProjTypesRes, stagesRes, overdueRes, pTypeRes, pPlanRes] = await Promise.all([
                    getCategories(),
                    getSubCategories(),
                    getProjectCategoryMappings(),
                    getSubProjectTypes(),
                    projectApi.getJourneyStages().catch(() => []),
                    projectApi.getOverdueSettings().catch(() => []),
                    api.get('/partner-settings/types').catch(() => ({ data: [] })),
                    api.get('/partner-settings/plans').catch(() => ({ data: [] }))
                ]);

                // Set dynamic partner types
                if (pTypeRes && pTypeRes.data) {
                    const tData = Array.isArray(pTypeRes.data) ? pTypeRes.data : [];
                    setPartnerTypeOptions(tData.map(t => ({ value: t._id, label: t.name || t.type })));
                }

                // Set dynamic partner plans
                if (pPlanRes && pPlanRes.data) {
                    const pData = Array.isArray(pPlanRes.data) ? pPlanRes.data : [];
                    setPartnerPlanOptions(pData.map(p => ({ value: p._id, label: p.name })));
                }

                if (catRes && catRes.data) {
                    setCategoriesList(catRes.data);
                } else if (Array.isArray(catRes)) {
                    setCategoriesList(catRes);
                }

                if (stagesRes && Array.isArray(stagesRes)) {
                    // Sort stages by order if applicable
                    const sortedStages = stagesRes.sort((a, b) => (a.order || 0) - (b.order || 0));
                    setDynamicStages(sortedStages);
                    if (sortedStages.length > 0) {
                        setActiveProcess(sortedStages[0]._id || sortedStages[0].name.replace(/\s+/g, '').toLowerCase());
                    }
                }

                if (overdueRes && Array.isArray(overdueRes)) {
                    // Build a map of SLA configurations for quick lookup
                    // Admin stores them per Category/SubCategory, so we merge processConfigs
                    let allSLA = {};
                    overdueRes.forEach(setting => {
                        if (setting.processConfig) {
                            allSLA = { ...allSLA, ...setting.processConfig };
                        }
                    });
                    setOverdueSettings(allSLA);
                }

                if (subCatRes && subCatRes.data) {
                    setSubCategoriesList(subCatRes.data);
                    if (subCatRes.data.length > 0) {
                        setProjectType(subCatRes.data[0]._id);
                    }
                } else if (Array.isArray(subCatRes)) {
                    setSubCategoriesList(subCatRes);
                    if (subCatRes.length > 0) {
                        setProjectType(subCatRes[0]._id);
                    }
                }

                if (subProjTypesRes && subProjTypesRes.data) {
                    setSubProjectTypesList(subProjTypesRes.data);
                } else if (Array.isArray(subProjTypesRes)) {
                    setSubProjectTypesList(subProjTypesRes);
                }

                // Extract unique project types (ranges) from mappings
                const mappings = mappingRes?.data || (Array.isArray(mappingRes) ? mappingRes : []);
                const uniqueRanges = [];
                const rangeMap = new Map();

                mappings.forEach(mapping => {
                    if (mapping.projectTypeFrom !== undefined && mapping.projectTypeTo !== undefined) {
                        const rangeStr = `${mapping.projectTypeFrom} to ${mapping.projectTypeTo} kW`;
                        if (!rangeMap.has(rangeStr)) {
                            rangeMap.set(rangeStr, true);
                            uniqueRanges.push({
                                _id: `${mapping.projectTypeFrom}-${mapping.projectTypeTo}`,
                                name: rangeStr
                            });
                        }
                    }
                });
                
                setProjectTypesList(uniqueRanges);
            } catch (error) {
                console.error("Error fetching master data:", error);
            }
        };
        fetchMasters();
    }, []);

    useEffect(() => {
        const fetchProjectsData = async () => {
            try {
                setIsLoading(true);
                // Fetch projects from backend
                const data = await getProjects();
                
                // Assuming data.data holds the array of projects
                const projectsList = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
                setAllProjects(projectsList);
            } catch (error) {
                console.error("Error fetching projects:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProjectsData();
    }, []);

    // Get unique CP list from projects
    const cpList = ['All Franchisees/Installers'];
    allProjects.forEach(p => {
        if (p.cp && !cpList.includes(p.cp)) {
            cpList.push(p.cp);
        }
    });

    // Dynamic Process Counts from real projects
    const getProcessCount = (stageName) => {
        if (!stageName) return 0;
        return allProjects.filter(p => {
            // Match exactly with project status, or fallback to statusStage
            if (p.status && p.status.toLowerCase() === stageName.toLowerCase()) return true;
            if (p.statusStage && p.statusStage.toLowerCase() === stageName.replace(/\s+/g, '').toLowerCase()) return true;
            return false;
        }).length;
    };

    // Filter processes based on project type
    const getProcesses = () => {
        if (dynamicStages && dynamicStages.length > 0) {
            return dynamicStages.map(stage => {
                const id = stage._id || stage.name.replace(/\s+/g, '').toLowerCase();
                const matchedCount = getProcessCount(stage.name);
                const count = matchedCount;

                return {
                    id: id,
                    label: stage.name,
                    count: count,
                    main: 'Project Processes', // Admin stages don't have main categories
                    colSpan: 2
                };
            });
        }
        
        // Fallback if no dynamic stages are configured
        const allProcesses = [
            { id: 'consumerRegistered', label: 'Consumer Registered', count: getProcessCount('Consumer Registered'), main: 'Project Signup', colSpan: 2 },
            { id: 'applicationSubmission', label: 'Application Submission', count: getProcessCount('Application Submission'), main: 'Project Signup', colSpan: 2 },
            { id: 'feasibilityCheck', label: 'Feasibility Check', count: getProcessCount('Feasibility Check'), main: 'Feasibility Approval', colSpan: 2 },
            { id: 'meterCharge', label: 'Meter Charge', count: getProcessCount('Meter Charge'), main: 'Feasibility Approval', colSpan: 2 },
            { id: 'vendorSelection', label: 'Vendor Selection', count: getProcessCount('Vendor Selection'), main: 'Installation Status', colSpan: 5 },
            { id: 'workStart', label: 'Work Start', count: getProcessCount('Work Start'), main: 'Installation Status', colSpan: 5 },
            { id: 'solarInstallation', label: 'Solar Installation', count: getProcessCount('Solar Installation'), main: 'Installation Status', colSpan: 5 },
            { id: 'pcr', label: 'PCR', count: getProcessCount('PCR'), main: 'Installation Status', colSpan: 5 },
            { id: 'commissioning', label: 'Commissioning', count: getProcessCount('Commissioning'), main: 'Installation Status', colSpan: 5 },
            { id: 'meterchange', label: 'Meter Change', count: getProcessCount('Meter Change'), main: 'Meter Installation', colSpan: 2 },
            { id: 'inspection', label: 'Meter Inspection', count: getProcessCount('Meter Inspection'), main: 'Meter Installation', colSpan: 2 },
        ];

        const selectedSubCat = subCategoriesList.find(s => s._id === projectType);
        const isResidential = selectedSubCat ? selectedSubCat.name.toLowerCase() === 'residential' : projectType === 'residential';

        if (isResidential) {
            allProcesses.push(
                { id: 'subsidyrequest', label: 'Subsidy Request', count: getProcessCount('Subsidy Request'), main: 'Subsidy', colSpan: 2 },
                { id: 'subsidydisbursal', label: 'Subsidy Disbursal', count: getProcessCount('Subsidy Disbursal'), main: 'Subsidy', colSpan: 2 }
            );
        }

        return allProcesses;
    };

    // Group processes by main category
    const getMainCategories = () => {
        const processes = getProcesses();
        const categories = [];

        processes.forEach(process => {
            if (!categories.find(c => c.name === process.main)) {
                categories.push({
                    name: process.main,
                    // If it's dynamic (Project Processes), span across all process columns
                    colSpan: process.main === 'Project Processes' ? processes.length : (process.main === 'Installation Status' ? 5 : process.main === 'Subsidy' ? 2 : 2)
                });
            }
        });

        return categories;
    };

    const getActionButton = (process, item) => {
        // Fallback for getting the label if process object isn't passed directly
        const stage = getProcesses().find(p => p.id === process) || { label: process };

        // Function to convert camelCase or Title Case to kebab-case
        const formatSlug = (str) => {
            if (!str) return 'details';
            return str
                .replace(/([a-z])([A-Z])/g, '$1-$2') // Insert hyphen between lower & upper
                .replace(/\s+/g, '-')                // Replace spaces with hyphens
                .toLowerCase();
        };

        const routeSlug = formatSlug(stage.label);

        return (
            <button
                onClick={() => navigate(`/franchisee-manager/my-task/project-management/stage/${routeSlug}?id=${item.id}&stageId=${process}&stageName=${encodeURIComponent(stage.label)}`)}
                className="px-3 py-1 theme-bg-primary text-white text-xs rounded-md theme-bg-primary-hover transition-colors flex items-center shadow-sm"
            >
                <Eye size={12} className="mr-1" />
                View Details
            </button>
        );
    };

    // Helper function to calculate actual overdue days based on admin SLA settings
    const calculateOverdueDays = (item, stageName) => {
        // If we don't have SLA settings or standard completion time in item, fallback to item.overdueDays
        let adminAllowedDays = null;
        
        // Find matching SLA setting by stage name
        if (overdueSettings && Object.keys(overdueSettings).length > 0) {
            const key = Object.keys(overdueSettings).find(k => k.toLowerCase() === stageName.toLowerCase());
            if (key) {
                adminAllowedDays = parseInt(overdueSettings[key]); // e.g., 2
            }
        }
        
        if (adminAllowedDays !== null && !isNaN(adminAllowedDays)) {
            // For mock calculation: parse the "completedIn" like "2 days"
            const completedInDays = parseInt(item.completedIn) || 0; 
            // If the time taken (completedInDays) > admin allowed SLA, it's overdue
            const overdue = completedInDays - adminAllowedDays;
            if (overdue > 0) {
                return overdue;
            }
            return 0; // Not overdue
        }
        
        // Fallback to mock data if no SLA defined in admin
        return parseInt(item.overdueDays) || 0;
    };

    // Helper to calculate previous task
    const getPreviousTask = (currentStatus) => {
        if (!dynamicStages || dynamicStages.length === 0 || !currentStatus) return 'Initial';
        const currentIndex = dynamicStages.findIndex(s => s.name.toLowerCase() === currentStatus.toLowerCase());
        if (currentIndex > 0) {
            return dynamicStages[currentIndex - 1].name;
        }
        return 'Initial Inquiry';
    };

    // Helper to calculate completed in days based on created/updated diff
    const getCompletedInDays = (item) => {
        if (!item.createdAt || !item.updatedAt) return 'N/A';
        const created = new Date(item.createdAt);
        const updated = new Date(item.updatedAt);
        const diffTime = Math.abs(updated - created);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? `${diffDays} days` : '1 day';
    };

    const activeStage = getProcesses().find(p => p.id === activeProcess) || { label: 'Consumer Registration' };
    
    let filteredData = [];
    if (activeStage) {
        filteredData = allProjects.filter(p => {
            const matchesStage = (p.status && p.status.toLowerCase() === activeStage.label.toLowerCase()) || 
                                 (p.statusStage && p.statusStage.toLowerCase() === activeStage.label.replace(/\s+/g, '').toLowerCase());
            
            const matchesCp = cpFilter === 'all' || p.cp === cpFilter;
            
            return matchesStage && matchesCp;
        });
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-6">
                {/* Header */}
                <div className="mb-6">
                    <div className="bg-white rounded-xl shadow-sm p-4">
                        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                            <Zap className="mr-2 text-blue-500" size={24} />
                            Solar Project Management
                        </h2>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                        <h5 className="font-semibold text-gray-700 flex items-center">
                            <Filter size={16} className="mr-2 text-blue-500" />
                            Filters
                        </h5>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="text-sm text-blue-600 hover:text-blue-800"
                        >
                            {showFilters ? 'Hide' : 'Show'} Filters
                        </button>
                    </div>

                    {showFilters && (
                        <div className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6 mb-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                                    <Select 
                                        isMulti 
                                        options={categoriesList.map(cat => ({ value: cat._id, label: cat.name }))}
                                        className="basic-multi-select"
                                        classNamePrefix="select"
                                        placeholder="Select Category..."
                                        menuPortalTarget={document.body}
                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Sub Category</label>
                                    <Select 
                                        isMulti 
                                        options={subCategoriesList.map(subCat => ({ value: subCat._id, label: subCat.name }))}
                                        className="basic-multi-select"
                                        classNamePrefix="select"
                                        placeholder="Select Sub Category..."
                                        menuPortalTarget={document.body}
                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Project Type</label>
                                    <Select 
                                        isMulti 
                                        options={projectTypesList.map(type => ({ value: type._id || type.id, label: type.name }))}
                                        className="basic-multi-select"
                                        classNamePrefix="select"
                                        placeholder="Select Project Type..."
                                        noOptionsMessage={() => "No project types found"}
                                        menuPortalTarget={document.body}
                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Sub Project Type</label>
                                    <Select 
                                        isMulti 
                                        options={subProjectTypesList.map(type => ({ value: type._id, label: type.name }))}
                                        className="basic-multi-select"
                                        classNamePrefix="select"
                                        placeholder="Select Sub Project Type..."
                                        menuPortalTarget={document.body}
                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Partner Type</label>
                                    <Select 
                                        isMulti 
                                        options={partnerTypeOptions}
                                        className="basic-multi-select"
                                        classNamePrefix="select"
                                        placeholder="Select Partner Type..."
                                        menuPortalTarget={document.body}
                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Partner Plan</label>
                                    <Select 
                                        isMulti 
                                        options={partnerPlanOptions}
                                        className="basic-multi-select"
                                        classNamePrefix="select"
                                        placeholder="Select Partner Plan..."
                                        menuPortalTarget={document.body}
                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                    />
                                </div>
                            </div>
                            <button className="px-4 py-2 theme-bg-primary text-white rounded-md theme-bg-primary-hover transition-colors flex items-center">
                                <Filter size={16} className="mr-2" />
                                Apply Filters
                            </button>
                        </div>
                    )}
                </div>

                {/* Project Type Selection */}
                <div className={`grid grid-cols-1 md:grid-cols-${Math.min(subCategoriesList.length || 2, 4)} gap-6 mb-6`}>
                    {subCategoriesList.length > 0 ? (
                        subCategoriesList.map((cat) => {
                            const isResidential = cat.name.toLowerCase() === 'residential';
                            const isCommercial = cat.name.toLowerCase() === 'commercial';
                            const IconComponent = isResidential ? Home : isCommercial ? Building : Grid;
                            return (
                                <div
                                    key={cat._id}
                                    onClick={() => setProjectType(cat._id)}
                                    className={`cursor-pointer rounded-xl shadow-sm transition-all hover:shadow-md ${projectType === cat._id ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-white'
                                        }`}
                                >
                                    <div className="p-6 text-center">
                                        <IconComponent size={48} className="mx-auto mb-3 theme-text-primary" />
                                        <h4 className="text-xl font-semibold text-gray-800">{cat.name}</h4>
                                        <p className="text-sm text-gray-500 mt-1">{cat.description || `Manage ${cat.name.toLowerCase()} solar projects`}</p>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        // Fallback skeleton or default
                        <>
                            <div className="cursor-pointer rounded-xl shadow-sm transition-all hover:shadow-md ring-2 ring-blue-500 bg-blue-50 animate-pulse">
                                <div className="p-6 text-center h-32"></div>
                            </div>
                            <div className="cursor-pointer rounded-xl shadow-sm transition-all hover:shadow-md bg-white animate-pulse">
                                <div className="p-6 text-center h-32"></div>
                            </div>
                        </>
                    )}
                </div>

                {/* Process Table */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-200">
                        <h5 className="font-semibold text-gray-700">Project Processes</h5>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                {/* Main Categories */}
                                <tr className="theme-bg-soft">
                                    {getMainCategories().map((category, idx) => (
                                        <th
                                            key={idx}
                                            colSpan={category.colSpan}
                                            className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-r border-gray-200"
                                        >
                                            {category.name}
                                        </th>
                                    ))}
                                </tr>

                                {/* Sub Processes */}
                                <tr className="bg-gray-100">
                                    {getProcesses().map((process) => {
                                        const selectedSubCat = subCategoriesList.find(s => s._id === projectType);
                                        const isCommercial = selectedSubCat ? selectedSubCat.name.toLowerCase() === 'commercial' : projectType === 'commercial';
                                        
                                        return (
                                        <td
                                            key={process.id}
                                            onClick={() => {
                                                if (isCommercial && process.id.includes('subsidy')) return;
                                                setActiveProcess(process.id);
                                            }}
                                            className={`px-3 py-2 text-xs font-medium text-center border-r border-gray-200 cursor-pointer transition-colors ${activeProcess === process.id ? 'theme-bg-primary text-white' : 'hover:bg-gray-200'
                                                } ${isCommercial && process.id.includes('subsidy') ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {process.label} ({process.count})
                                        </td>
                                    )})}
                                </tr>
                            </thead>
                            <tbody>
                                {/* Data Rows */}
                                {activeProcess && (
                                    <tr>
                                        <td colSpan="15" className="p-4 bg-gray-50">
                                            <div className="space-y-4">
                                                {/* CP Filter */}
                                                <div className="flex items-center space-x-2">
                                                    <label className="text-sm font-medium text-gray-700">Filter by Franchisee/Installer:</label>
                                                    <select
                                                        value={cpFilter}
                                                        onChange={(e) => setCpFilter(e.target.value)}
                                                        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        {cpList.map((cp, idx) => (
                                                            <option key={idx} value={cp === 'All Franchisees/Installers' ? 'all' : cp}>{cp}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Data Table */}
                                                <div className="overflow-x-auto">
                                                    <table className="min-w-full divide-y divide-gray-200">
                                                        <thead className="bg-gray-100">
                                                            <tr>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Customer Name</th>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Project ID</th>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Previous Task</th>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Completed In</th>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Current Task</th>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Overdue Days</th>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Partner Name</th>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Action</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="bg-white divide-y divide-gray-200">
                                                            {filteredData.map((item) => (
                                                                <tr key={item._id || item.id} className="hover:bg-gray-50">
                                                                    <td className="px-4 py-2 text-sm">{item.projectName || item.customer}</td>
                                                                    <td className="px-4 py-2 text-sm">{item.projectId}</td>
                                                                    <td className="px-4 py-2 text-sm">
                                                                        {getPreviousTask(item.status || item.currentTask)}
                                                                    </td>
                                                                    <td className="px-4 py-2 text-sm">
                                                                        <span className="text-green-600 font-medium">
                                                                            {getCompletedInDays(item)}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-4 py-2 text-sm font-medium text-gray-900">{item.status || item.currentTask}</td>
                                                                    <td className="px-4 py-2 text-sm">
                                                                        {(() => {
                                                                            const overdue = calculateOverdueDays(item, activeStage.label);
                                                                            return (
                                                                                <span className={`font-medium ${overdue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                                                {overdue > 0 ? `${overdue} days` : '0 days'}
                                                                            </span>
                                                                            );
                                                                        })()}
                                                                    </td>
                                                                    <td className="px-4 py-2 text-sm">{item.cp}</td>
                                                                    <td className="px-4 py-2 text-sm">
                                                                        {getActionButton(activeProcess, item)}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                            {filteredData.length === 0 && (
                                                                <tr>
                                                                    <td colSpan="8" className="px-4 py-4 text-center text-gray-500">
                                                                        No data found for selected filter
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-white rounded-xl shadow-sm p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Projects</p>
                                <p className="text-2xl font-bold text-gray-700">{allProjects.length}</p>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-full">
                                <Zap size={20} className="text-blue-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">In Progress</p>
                                <p className="text-2xl font-bold text-orange-600">
                                    {allProjects.filter(p => p.status && p.status !== 'Completed' && p.status !== 'Commissioning').length}
                                </p>
                            </div>
                            <div className="bg-orange-100 p-3 rounded-full">
                                <Clock size={20} className="text-orange-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Completed</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {allProjects.filter(p => p.status === 'Completed' || p.status === 'Commissioning').length}
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
                                <p className="text-sm text-gray-500">Overdue</p>
                                <p className="text-2xl font-bold text-red-600">
                                    {allProjects.filter(p => {
                                        // Mock overdue count based on dynamic calculation
                                        return calculateOverdueDays(p, p.status || '') > 0;
                                    }).length}
                                </p>
                            </div>
                            <div className="bg-red-100 p-3 rounded-full">
                                <AlertCircle size={20} className="text-red-600" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FranchiseeManagerProjectInProgress;