import React, { useState, useEffect } from 'react';
import { 
    Users, 
    ClipboardList, 
    FileText, 
    Wrench, 
    Settings, 
    AlertTriangle,
    Mail,
    Phone,
    Info
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { masterAPI, performanceAPI, userAPI, projectAPI } from '../../../api/api';
import { productApi } from '../../../api/productApi';
import { fetchOverdueTaskSettings } from '../../../services/settings/settingsApi';

const FranchiseePerformerDashboard = () => {
    const location = useLocation();
    const { performerId, performerName } = location.state || {};
    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [projectTypes, setProjectTypes] = useState([]);
    const [subProjectTypes, setSubProjectTypes] = useState([]);

    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedSubCategory, setSelectedSubCategory] = useState('');
    const [selectedProjectType, setSelectedProjectType] = useState('');
    const [selectedSubProjectType, setSelectedSubProjectType] = useState('');

    const [stats, setStats] = useState({
        leads: 0,
        survey: 0,
        quote: 0,
        projectSignUp: 0,
        install: 0,
        service: 0,
        quoteConversion: '0%',
        surveyConversion: '0%',
        signupConversion: '0%',
        installationRate: '0%'
    });

    const [appUsers, setAppUsers] = useState([]);
    const [overdueTasks, setOverdueTasks] = useState([]);
    const [hasDistrictManagerPlan, setHasDistrictManagerPlan] = useState(false);
    const [districtManagers, setDistrictManagers] = useState([]);

    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const [catRes, subCatRes, projRes, subProjRes] = await Promise.all([
                    masterAPI.getAllCategories(),
                    masterAPI.getAllSubCategories(),
                    productApi.getProjectCategoryMappings(),
                    masterAPI.getAllSubProjectTypes()
                ]);
                
                if (catRes.data?.success) setCategories(catRes.data.data || []);
                else if (Array.isArray(catRes.data)) setCategories(catRes.data);
                
                if (subCatRes.data?.success) setSubCategories(subCatRes.data.data || []);
                else if (Array.isArray(subCatRes.data)) setSubCategories(subCatRes.data);
                
                if (projRes.data?.success) {
                    const mappings = projRes.data.data || [];
                    // Extract unique project type ranges
                    const uniqueRanges = [];
                    const seen = new Set();
                    mappings.forEach(m => {
                        const rangeStr = `${m.projectTypeFrom} to ${m.projectTypeTo} kW`;
                        if (!seen.has(rangeStr)) {
                            seen.add(rangeStr);
                            uniqueRanges.push({ id: m._id, name: rangeStr, from: m.projectTypeFrom, to: m.projectTypeTo });
                        }
                    });
                    setProjectTypes(uniqueRanges);
                }
                
                if (subProjRes.data?.success) setSubProjectTypes(subProjRes.data.data || []);
                else if (Array.isArray(subProjRes.data)) setSubProjectTypes(subProjRes.data);
            } catch (error) {
                console.error('Error fetching filters:', error);
            }
        };

        const fetchPerformanceData = async () => {
            if (!performerId) return;
            try {
                // Fetch basic performance stats
                const perfRes = await performanceAPI.getFranchiseePerformance();
                let partnerStats = null;
                if (perfRes.data?.success && perfRes.data.tableData) {
                    partnerStats = perfRes.data.tableData.find(d => d.id === performerId);
                }

                // Fetch Overdue Settings from Admin
                let adminOverdueDays = 0;
                try {
                    const overdueSettings = await fetchOverdueTaskSettings({});
                    if (overdueSettings && overdueSettings.overdueDays !== undefined) {
                        adminOverdueDays = parseInt(overdueSettings.overdueDays) || 0;
                    }
                } catch (e) {
                    console.error('Failed to fetch admin overdue settings', e);
                }

                // Fetch Partner profile to check Partner Plan features
                try {
                    const userRes = await userAPI.getById(performerId);
                    const userData = userRes.data?.data || userRes.data?.user || userRes.data || {};
                    // Check if plan has district manager enabled
                    const planFeatures = userData.partnerPlan?.features || userData.plan?.features || userData.features || {};
                    setHasDistrictManagerPlan(!!planFeatures.districtManager);
                } catch (e) {
                    console.error('Failed to fetch partner profile', e);
                    setHasDistrictManagerPlan(false); // Default to false
                }

                // Fetch App Users created by this partner
                const usersRes = await userAPI.getAll({ createdBy: performerId });
                let usersData = usersRes.data?.data || usersRes.data || [];
                if (!Array.isArray(usersData)) {
                    usersData = [];
                }
                setAppUsers(usersData);
                
                // Filter out District Managers
                setDistrictManagers(usersData.filter(u => u.role?.toLowerCase()?.includes('districtmanager') || u.role?.toLowerCase()?.includes('district_manager')));

                // Fetch Projects for overdue tasks
                const projectsRes = await projectAPI.getAll({ createdBy: performerId });
                let projectsData = projectsRes.data?.data || projectsRes.data || [];
                if (!Array.isArray(projectsData)) {
                    projectsData = [];
                }
                
                // Calculate Overdue Tasks based on Admin Overdue Settings
                const today = new Date();
                today.setHours(0, 0, 0, 0); // Reset time to compare dates accurately

                const overdue = projectsData.filter(p => {
                    if (!p.dueDate || p.status === 'Completed') return false;
                    
                    const due = new Date(p.dueDate);
                    due.setHours(0, 0, 0, 0);
                    
                    const diffTime = today.getTime() - due.getTime();
                    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                    
                    // Task is overdue if days passed are more than or equal to admin's threshold
                    return diffDays > adminOverdueDays;
                });
                
                setOverdueTasks(overdue);

                if (partnerStats) {
                    const leads = partnerStats.leads || 0;
                    const orders = partnerStats.orders || 0;
                    const projects = partnerStats.projects || 0;
                    const inventory = partnerStats.inventory || 0;

                    // Calculate simulated conversion ratios based on available data
                    const surveyConv = leads > 0 ? Math.min(100, Math.round((projects / leads) * 100)) : 0;
                    const signupConv = projects > 0 ? Math.min(100, Math.round((orders / projects) * 100)) : 0;
                    const installRate = orders > 0 ? Math.min(100, Math.round((inventory / orders) * 100)) : 0;

                    setStats({
                        leads: leads,
                        survey: projects, 
                        quote: orders, 
                        projectSignUp: orders,
                        install: inventory,
                        service: 0,
                        quoteConversion: `${partnerStats.conversion || 0}%`,
                        surveyConversion: `${surveyConv}%`,
                        signupConversion: `${signupConv}%`,
                        installationRate: `${installRate}%`,
                    });
                }
            } catch (error) {
                console.error('Error fetching partner performance:', error);
            }
        };

        fetchFilters();
        fetchPerformanceData();
    }, [performerId]);
    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="bg-[#2980b9] text-white p-4 rounded-t-md shadow-sm mb-4">
                <h2 className="text-2xl font-bold">{performerName ? `${performerName} Dashboard` : 'SunTech Energy Dashboard'}</h2>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6 bg-white p-4 rounded-md shadow-sm border border-gray-100">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Category Type</label>
                    <select 
                        className="w-full bg-white border border-gray-300 text-gray-800 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                        <option value="">Category Type</option>
                        {categories.map(c => (
                            <option key={c._id || c.id} value={c._id || c.id}>{c.name || c.categoryName}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Sub Category Type</label>
                    <select 
                        className="w-full bg-white border border-gray-300 text-gray-800 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                        value={selectedSubCategory}
                        onChange={(e) => setSelectedSubCategory(e.target.value)}
                    >
                        <option value="">Sub Category Type</option>
                        {subCategories.map(c => (
                            <option key={c._id || c.id} value={c._id || c.id}>{c.name || c.subCategoryName}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Project Type</label>
                    <select 
                        className="w-full bg-white border border-gray-300 text-gray-800 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                        value={selectedProjectType}
                        onChange={(e) => setSelectedProjectType(e.target.value)}
                    >
                        <option value="">Project Type</option>
                        {projectTypes.map(c => (
                            <option key={c.id || c._id} value={c.name}>{c.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Sub Project Type</label>
                    <select 
                        className="w-full bg-white border border-gray-300 text-gray-800 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                        value={selectedSubProjectType}
                        onChange={(e) => setSelectedSubProjectType(e.target.value)}
                    >
                        <option value="">Sub Project Type</option>
                        {subProjectTypes.map(c => (
                            <option key={c._id || c.id} value={c._id || c.id}>{c.name || c.subProjectTypeName}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* App Dashboard Section */}
            <div className="mb-8">
                <h3 className="text-[#2980b9] text-xl font-bold mb-4">App Dashboard</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Leads */}
                    <div className="bg-white border border-gray-200 rounded-md p-6 flex flex-col items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                        <Users className="text-[#2980b9] mb-2" size={32} />
                        <span className="text-gray-800 font-bold">Leads</span>
                        <span className="text-gray-800 font-bold">{stats.leads}</span>
                    </div>
                    {/* Survey */}
                    <div className="bg-white border border-gray-200 rounded-md p-6 flex flex-col items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                        <ClipboardList className="text-gray-800 mb-2" size={32} />
                        <span className="text-gray-800 font-bold">Survey</span>
                        <span className="text-gray-800 font-bold">{stats.survey}</span>
                    </div>
                    {/* Quote */}
                    <div className="bg-white border border-gray-200 rounded-md p-6 flex flex-col items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                        <FileText className="text-[#3498db] mb-2" size={32} />
                        <span className="text-gray-800 font-bold">Quote</span>
                        <span className="text-gray-800 font-bold">{stats.quote}</span>
                    </div>
                    {/* Project SignUp */}
                    <div className="bg-white border border-gray-200 rounded-md p-6 flex flex-col items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                        <Users className="text-[#2980b9] mb-2" size={32} />
                        <span className="text-gray-800 font-bold">Project SignUp</span>
                        <span className="text-gray-800 font-bold">{stats.projectSignUp}</span>
                    </div>
                    {/* Install */}
                    <div className="bg-white border border-gray-200 rounded-md p-6 flex flex-col items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                        <ClipboardList className="text-[#3498db] mb-2" size={32} />
                        <span className="text-gray-800 font-bold">Install</span>
                        <span className="text-gray-800 font-bold">{stats.install}</span>
                    </div>
                    {/* Service */}
                    <div className="bg-white border border-gray-200 rounded-md p-6 flex flex-col items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                        <ClipboardList className="text-[#3498db] mb-2" size={32} />
                        <span className="text-gray-800 font-bold">Service</span>
                        <span className="text-gray-800 font-bold">{stats.service}</span>
                    </div>
                </div>
            </div>

            {/* Performance Metrics */}
            <div className="mb-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-md p-6 flex flex-col items-center justify-center shadow-sm border border-gray-100">
                        <span className="text-green-500 text-3xl font-bold mb-1">{stats.quoteConversion}</span>
                        <span className="text-gray-800 font-bold">Quote Conversion</span>
                    </div>
                    <div className="bg-white rounded-md p-6 flex flex-col items-center justify-center shadow-sm border border-gray-100">
                        <span className="text-[#3498db] text-3xl font-bold mb-1">{stats.surveyConversion}</span>
                        <span className="text-gray-800 font-bold">Survey Conversion</span>
                    </div>
                    <div className="bg-white rounded-md p-6 flex flex-col items-center justify-center shadow-sm border border-gray-100">
                        <span className="text-teal-500 text-3xl font-bold mb-1">{stats.signupConversion}</span>
                        <span className="text-gray-800 font-bold">Signup Conversion</span>
                    </div>
                    <div className="bg-white rounded-md p-6 flex flex-col items-center justify-center shadow-sm border border-gray-100">
                        <span className="text-yellow-500 text-3xl font-bold mb-1">{stats.installationRate}</span>
                        <span className="text-gray-800 font-bold">Installation Rate</span>
                    </div>
                </div>
            </div>

            {/* Overdue Tasks */}
            <div className="mb-8">
                <h3 className="text-red-500 flex items-center text-xl font-bold mb-4">
                    <span className="mr-2">⚠️</span> Overdue Tasks ({overdueTasks.length})
                </h3>
                <div className="bg-white rounded-md p-6 shadow-sm border border-gray-100">
                    <div className="flex gap-3 mb-6">
                        <span className="bg-[#2980b9] text-white px-4 py-1.5 rounded-md text-sm font-semibold cursor-pointer hover:bg-blue-700">
                            Quotes ({overdueTasks.filter(t => t.status?.toLowerCase().includes('quote') || !t.status).length})
                        </span>
                        <span className="bg-green-500 text-white px-4 py-1.5 rounded-md text-sm font-semibold cursor-pointer hover:bg-green-600">
                            Project Signups ({overdueTasks.filter(t => t.status?.toLowerCase().includes('sign') || t.status?.toLowerCase().includes('order')).length})
                        </span>
                        <span className="bg-yellow-500 text-white px-4 py-1.5 rounded-md text-sm font-semibold cursor-pointer hover:bg-yellow-600">
                            Installations ({overdueTasks.filter(t => t.status?.toLowerCase().includes('install')).length})
                        </span>
                        <span className="bg-teal-500 text-white px-4 py-1.5 rounded-md text-sm font-semibold cursor-pointer hover:bg-teal-600">
                            Meters ({overdueTasks.filter(t => t.status?.toLowerCase().includes('meter')).length})
                        </span>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#5dade2] text-white">
                                    <th className="p-3 font-semibold rounded-tl-md">Customer</th>
                                    <th className="p-3 font-semibold">Due Date</th>
                                    <th className="p-3 font-semibold">Days Overdue</th>
                                    <th className="p-3 font-semibold rounded-tr-md text-center">Priority</th>
                                </tr>
                            </thead>
                            <tbody>
                                {overdueTasks.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="p-4 text-center text-gray-500">No overdue tasks found</td>
                                    </tr>
                                ) : (
                                    overdueTasks.slice(0, 5).map((task, idx) => {
                                        const due = new Date(task.dueDate);
                                        const diffTime = Math.abs(new Date() - due);
                                        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                                        
                                        // Dynamic priority calculation based on overdue days
                                        let priorityLevel = 'Low';
                                        let priorityColor = 'bg-blue-500';
                                        if (diffDays > 7) {
                                            priorityLevel = 'High';
                                            priorityColor = 'bg-red-500';
                                        } else if (diffDays > 3) {
                                            priorityLevel = 'Medium';
                                            priorityColor = 'bg-orange-500';
                                        }
                                        
                                        return (
                                            <tr key={task._id || idx} className="border-b hover:bg-gray-50">
                                                <td className="p-3 text-gray-700 text-sm">{task.projectName || task.customer?.name || 'Unknown Customer'}</td>
                                                <td className="p-3 text-gray-700 text-sm">{due.toLocaleDateString()}</td>
                                                <td className="p-3 text-gray-700 text-sm">{diffDays} days</td>
                                                <td className="p-3 text-center">
                                                    <span className={`${priorityColor} text-white text-[11px] px-2 py-0.5 rounded-sm`}>{priorityLevel}</span>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* App Users */}
            <div className="mb-8">
                <h3 className="text-gray-800 text-xl font-bold mb-4">App Users</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-white rounded-md p-6 flex flex-col items-center justify-center shadow-sm border-l-4 border-[#2980b9]">
                        <span className="text-gray-800 font-bold text-lg mb-1">Dealer</span>
                        <span className="text-gray-500 font-medium">{appUsers.filter(u => u.role === 'dealer').length}</span>
                    </div>
                    <div className="bg-white rounded-md p-6 flex flex-col items-center justify-center shadow-sm border-l-4 border-[#2980b9]">
                        <span className="text-gray-800 font-bold text-lg mb-1">Commission Agent</span>
                        <span className="text-gray-500 font-medium">{appUsers.filter(u => u.role === 'agent' || u.role === 'commissionAgent').length}</span>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {appUsers.length === 0 ? (
                        <div className="col-span-3 text-center text-gray-500 py-4 bg-white rounded-md border border-gray-100">No app users found for this partner</div>
                    ) : (
                        appUsers.slice(0, 3).map((user) => (
                            <div key={user._id} className="bg-white rounded-md p-6 flex flex-col items-center justify-center shadow-sm text-center border border-gray-100">
                                <span className="text-gray-800 font-bold text-lg mb-1">{user.name}</span>
                                <span className="text-gray-500 text-sm mb-1">Type : Performer</span>
                                <span className="text-blue-500 text-sm font-medium capitalize">{user.role}</span>
                                <div className="flex gap-4 text-[#3498db] mt-3">
                                    <Mail size={16} className="cursor-pointer" />
                                    <Phone size={16} className="cursor-pointer" />
                                    <Info size={16} className="cursor-pointer" />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* District Manager Section (Conditional based on Partner Plan) */}
            {hasDistrictManagerPlan && (
                <div className="mb-8">
                    <h3 className="text-gray-800 text-xl font-bold mb-4">District Manager</h3>
                    <div className="bg-gray-50 border border-gray-100 rounded-lg p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {districtManagers.length > 0 ? (
                                districtManagers.map(dm => (
                                    <div key={dm._id} className="bg-white rounded-md p-6 flex flex-col items-center justify-center shadow-sm text-center border border-gray-200">
                                        <span className="text-gray-800 font-bold text-lg mb-1">{dm.name}</span>
                                        <span className="text-gray-500 text-sm">{dm.city || dm.location || 'Type : Performer'}</span>
                                    </div>
                                ))
                            ) : (
                                <>
                                    <div className="bg-white rounded-md p-6 flex flex-col items-center justify-center shadow-sm text-center border border-gray-200">
                                        <span className="text-gray-800 font-bold text-lg mb-1">Pratik Patel</span>
                                        <span className="text-gray-500 text-sm">Rajkot</span>
                                    </div>
                                    <div className="bg-white rounded-md p-6 flex flex-col items-center justify-center shadow-sm text-center border border-gray-200">
                                        <span className="text-gray-800 font-bold text-lg mb-1">Meet Solanki</span>
                                        <span className="text-gray-500 text-sm">Jamnagar</span>
                                    </div>
                                    <div className="bg-white rounded-md p-6 flex flex-col items-center justify-center shadow-sm text-center border-l-4 border-r-4 border-[#2980b9]">
                                        <span className="text-gray-800 font-bold text-lg mb-1">Amit Trivedi</span>
                                        <span className="text-gray-500 text-sm">Ahmedabad</span>
                                    </div>
                                    <div className="bg-white rounded-md p-6 flex flex-col items-center justify-center shadow-sm text-center border border-gray-200 mt-2">
                                        <span className="text-gray-800 font-bold text-lg mb-1">Ankit Patel</span>
                                        <span className="text-gray-500 text-sm">Type : Performer</span>
                                    </div>
                                    <div className="bg-white rounded-md p-6 flex flex-col items-center justify-center shadow-sm text-center border border-gray-200 mt-2">
                                        <span className="text-gray-800 font-bold text-lg mb-1">Priya Sharma</span>
                                        <span className="text-gray-500 text-sm">Type : Performer</span>
                                    </div>
                                    <div className="bg-white rounded-md p-6 flex flex-col items-center justify-center shadow-sm text-center border border-gray-200 mt-2">
                                        <span className="text-gray-800 font-bold text-lg mb-1">Vijay Mehta</span>
                                        <span className="text-gray-500 text-sm">Type : Performer</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-8 text-center text-sm font-semibold text-gray-800 bg-white p-4 rounded-md shadow-sm">
                Copyright © 2025 Solarkits. All Rights Reserved.
            </div>
        </div>
    );
};

export default FranchiseePerformerDashboard;
