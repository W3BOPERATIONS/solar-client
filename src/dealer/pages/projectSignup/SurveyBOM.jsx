import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    Filter,
    MapPin,
    Grid,
    ChevronDown,
    FileText,
    User,
    Mail,
    Phone,
    Calendar,
    Home,
    Building2,
    CheckCircle,
    Clock,
    AlertCircle,
    X,
    Loader,
    Zap
} from 'lucide-react';
import { locationAPI, leadAPI, surveyAPI } from '../../../api/api';

const DealerSurveyBOM = () => {
    const navigate = useNavigate();
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('All');
    const [districts, setDistricts] = useState([]);
    const [statusFilter, setStatusFilter] = useState('All');

    // Survey Modal State
    const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);
    const [currentSurvey, setCurrentSurvey] = useState(null);
    const [currentLead, setCurrentLead] = useState(null);
    const [surveyLoading, setSurveyLoading] = useState(false);

    // Fetch districts
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

    // Fetch leads
    const fetchLeads = async () => {
        setLoading(true);
        try {
            const params = {
                search: searchTerm,
                district: selectedDistrict !== 'All' ? selectedDistrict : undefined,
            };
            const response = await leadAPI.getAllLeads(params);
            if (response.data && response.data.data) {
                setLeads(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching leads:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchLeads();
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, selectedDistrict]);

    const filteredLeads = leads.filter(lead => {
        if (statusFilter === 'All') return true;
        return lead.status === statusFilter;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'New': return 'bg-blue-100 text-blue-700';
            case 'SurveyPending': return 'bg-yellow-100 text-yellow-700';
            case 'SurveyCompleted': return 'bg-green-100 text-green-700';
            case 'QuoteGenerated': return 'bg-purple-100 text-purple-700';
            case 'ProjectStart': return 'bg-orange-100 text-orange-700';
            case 'ProjectSigned': return 'bg-teal-100 text-teal-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const handleSurveyClick = async (lead) => {
        setCurrentLead(lead);
        setSurveyLoading(true);
        setIsSurveyModalOpen(true);
        try {
            const response = await surveyAPI.getSurveyByLead(lead._id);
            if (response.data && response.data.data) {
                setCurrentSurvey(response.data.data);
            } else {
                // No survey exists yet, create a dummy local object or handle empty
                setCurrentSurvey({ status: 'Pending', details: {} });
            }
        } catch (error) {
            console.error("Error fetching survey:", error);
            alert("Failed to load survey details");
            setIsSurveyModalOpen(false);
        } finally {
            setSurveyLoading(false);
        }
    };

    const handleUpdateSurveyStatus = async (status) => {
        if (!currentLead) return;

        try {
            if (status === 'Completed') {
                // Complete Survey Workflow
                await surveyAPI.completeSurvey(currentLead._id);
                // Also update local cache or refetch
                alert("Survey Completed Successfully! Redirecting to Project Signup...");
                setIsSurveyModalOpen(false);
                fetchLeads();
                // Redirect to Project Signup
                navigate('/dealer/project-signup/project-signup');
            } else {
                // Just update status to Pending (or save progress)
                await surveyAPI.createOrUpdateSurvey(currentLead._id, { status: 'Pending' });
                // Update Lead Status to SurveyPending if it's currently New
                if (currentLead.status === 'New') {
                    await leadAPI.updateLead(currentLead._id, { status: 'SurveyPending' });
                }
                alert("Survey saved as Pending.");
                setIsSurveyModalOpen(false);
                fetchLeads();
            }
        } catch (error) {
            console.error(`Error updating survey to ${status}:`, error);
            alert(`Failed to update survey: ${error.message}`);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header with Breadcrumb */}
            <div className="mb-6">
                <div className="bg-white shadow-sm p-4">
                    <nav className="container-fluid">
                        <ol className="flex items-center space-x-2">
                            <li className="text-gray-500">
                                <h3 className="text-xl font-semibold text-gray-800">Survey & BOM</h3>
                            </li>
                        </ol>
                    </nav>
                </div>
            </div>

            <div className="container-fluid px-6">
                {/* Filters */}
                <div className="bg-white p-4 rounded-xl shadow-sm mb-6 border border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <input
                                type="text"
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                placeholder="Search by name, phone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                        </div>

                        {/* Status Filter */}
                        <div className="relative">
                            <select
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white transition-all"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="All">All Statuses</option>
                                <option value="New">New</option>
                                <option value="SurveyPending">Survey Pending</option>
                                <option value="SurveyCompleted">Survey Completed</option>
                                <option value="QuoteGenerated">Quote Generated</option>
                            </select>
                            <Filter className="absolute left-3 top-3 text-gray-400" size={18} />
                            <ChevronDown className="absolute right-3 top-3 text-gray-400" size={18} />
                        </div>

                        {/* District Filter */}
                        <div className="relative">
                            <select
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white transition-all"
                                value={selectedDistrict}
                                onChange={(e) => setSelectedDistrict(e.target.value)}
                            >
                                <option value="All">All Districts</option>
                                {districts.map(d => (
                                    <option key={d._id} value={d._id}>{d.name}</option>
                                ))}
                            </select>
                            <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                            <ChevronDown className="absolute right-3 top-3 text-gray-400" size={18} />
                        </div>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader className="animate-spin text-blue-500" size={40} />
                    </div>
                ) : filteredLeads.length === 0 ? (
                    <div className="text-center text-gray-500 py-20 bg-white rounded-xl shadow-sm border border-gray-100">
                        <FileText size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="text-xl font-medium">No leads found matching your filters</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredLeads.map((lead) => (
                            <div key={lead._id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow overflow-hidden group">
                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-100">
                                                {lead.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="ml-3">
                                                <h3 className="font-semibold text-gray-800 truncate max-w-[150px]" title={lead.name}>{lead.name}</h3>
                                                <div className="text-xs text-gray-500 flex items-center">
                                                    <Clock size={10} className="mr-1" />
                                                    {new Date(lead.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                        <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${getStatusColor(lead.status)}`}>
                                            {lead.status.replace(/([A-Z])/g, ' $1').trim()}
                                        </span>
                                    </div>

                                    <div className="space-y-3 mb-4">
                                        <div className="flex items-center text-sm text-gray-600">
                                            <Phone size={14} className="mr-2 text-gray-400" />
                                            {lead.mobile}
                                        </div>
                                        <div className="flex items-center text-sm text-gray-600">
                                            <MapPin size={14} className="mr-2 text-gray-400" />
                                            <span className="truncate">{lead.district?.name}, {lead.city?.name}</span>
                                        </div>
                                        <div className="flex items-center text-sm text-gray-600">
                                            <Zap size={14} className="mr-2 text-gray-400" />
                                            {lead.kw} KW ({lead.solarType})
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                                        <div className="text-xs text-gray-400 font-medium">
                                            {lead.subType}
                                        </div>
                                        <button
                                            onClick={() => handleSurveyClick(lead)}
                                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                                        >
                                            View Survey
                                        </button>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-5 py-2 border-t border-gray-100 text-xs text-gray-500 flex justify-between">
                                    <span>Bill: ₹{lead.billAmount}</span>
                                    <span className="text-blue-600 cursor-pointer hover:underline">Details &rarr;</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Survey Modal */}
            {isSurveyModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-800">
                                Survey Details: {currentLead?.name}
                            </h3>
                            <button
                                onClick={() => setIsSurveyModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6">
                            {surveyLoading ? (
                                <div className="flex justify-center py-10">
                                    <Loader className="animate-spin text-blue-500" size={30} />
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <span className="block text-xs text-gray-500 mb-1">Mobile</span>
                                            <span className="font-medium text-gray-800">{currentLead?.mobile}</span>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <span className="block text-xs text-gray-500 mb-1">Location</span>
                                            <span className="font-medium text-gray-800">{currentLead?.district?.name}, {currentLead?.city?.name}</span>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <span className="block text-xs text-gray-500 mb-1">System Type</span>
                                            <span className="font-medium text-gray-800">{currentLead?.solarType} - {currentLead?.subType}</span>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <span className="block text-xs text-gray-500 mb-1">Capacity</span>
                                            <span className="font-medium text-gray-800">{currentLead?.kw} KW</span>
                                        </div>
                                    </div>

                                    {/* Dynamic Survey Form Placeholder */}
                                    <div className="border rounded-lg p-4">
                                        <h4 className="font-semibold text-gray-700 mb-3">Site Survey Questions</h4>
                                        <div className="space-y-3">
                                            {/* We can add dynamic form fields here later based on BOM/Survey model */}
                                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                <span className="text-sm text-gray-600">Roof Type</span>
                                                <span className="text-sm font-medium">Flat / Concrete</span>
                                            </div>
                                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                <span className="text-sm text-gray-600">Shadow Free Area</span>
                                                <span className="text-sm font-medium">Yes - 100%</span>
                                            </div>
                                            <div className="text-center text-sm text-gray-400 italic mt-2">
                                                Detailed survey form fields will be loaded dynamically here.
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-4 pt-4">
                                        <button
                                            onClick={() => handleUpdateSurveyStatus('Pending')}
                                            className="flex-1 py-2.5 px-4 bg-yellow-50 text-yellow-700 font-semibold rounded-lg hover:bg-yellow-100 transition-colors border border-yellow-200"
                                        >
                                            Survey Pending
                                        </button>
                                        <button
                                            onClick={() => handleUpdateSurveyStatus('Completed')}
                                            className="flex-1 py-2.5 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                                        >
                                            Survey Completed
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DealerSurveyBOM;