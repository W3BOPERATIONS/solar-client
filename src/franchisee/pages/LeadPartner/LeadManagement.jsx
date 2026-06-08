// FranchiseProjectManagementAssignLead.jsx
import React, { useState, useEffect } from 'react';
import { locationAPI, userAPI, leadAPI } from '../../../api/api';
import {
    UserPlus,
    History,
    ClipboardList,
    Users,
    User,
    MapPin,
    Phone,
    Mail,
    Home,
    Bolt,
    IndianRupee,
    Check,
    Send,
    List,
    Calendar,
    UserRound,
    Share2
} from 'lucide-react';

const FranchiseProjectManagementAssignLead = () => {
    const [selectedTab, setSelectedTab] = useState('assign');
    const [selectedPartnerType, setSelectedPartnerType] = useState('dealer');
    const [selectedLead, setSelectedLead] = useState(null);
    const [selectedPartner, setSelectedPartner] = useState(null);
    const [historyFilter, setHistoryFilter] = useState('all');

    // History Filters
    const [historyProjectCategory, setHistoryProjectCategory] = useState('');
    const [historyProjectSubCategory, setHistoryProjectSubCategory] = useState('');
    const [historyProjectType, setHistoryProjectType] = useState('');
    const [historySubProjectType, setHistorySubProjectType] = useState('');

    // Location States
    const [states, setStates] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [cities, setCities] = useState([]);
    
    const [selectedState, setSelectedState] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [selectedCity, setSelectedCity] = useState('');

    // Dynamic state
    const [solarLeads, setSolarLeads] = useState([]);
    const [dealers, setDealers] = useState([]);
    const [districtManagers, setDistrictManagers] = useState([]);
    const [assignmentHistory, setAssignmentHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch dynamic data
    const fetchUsers = async () => {
        try {
            const [dealerRes, dealerManagerRes] = await Promise.all([
                userAPI.getUsersByRole('dealer'),
                userAPI.getUsersByRole('dealerManager')
            ]);
            
            const dealersList = [];
            if (dealerRes.data && dealerRes.data.users) {
                dealersList.push(...dealerRes.data.users);
            }
            if (dealerManagerRes.data && dealerManagerRes.data.users) {
                dealersList.push(...dealerManagerRes.data.users);
            }

            setDealers(dealersList.map(u => ({
                id: u._id,
                name: u.name,
                type: 'Dealer',
                email: u.email,
                phone: u.phone,
                location: u.city || u.district || 'N/A',
                status: u.status || 'Active',
                assignedLeads: 0,
                performance: 'N/A'
            })));

            const dmRes = await userAPI.getUsersByRole('franchiseeManager');
            if (dmRes.data && dmRes.data.users) {
                setDistrictManagers(dmRes.data.users.map(u => ({
                    id: u._id,
                    name: u.name,
                    type: 'District Manager',
                    email: u.email,
                    phone: u.phone,
                    location: u.city || u.district || 'N/A',
                    status: u.status || 'Active',
                    assignedLeads: 0,
                    performance: 'N/A'
                })));
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    const fetchLeadsAndHistory = async () => {
        try {
            const leadsRes = await leadAPI.getAllLeads();
            if (leadsRes.data && leadsRes.data.data) {
                const leads = leadsRes.data.data;
                
                // Unassigned or all leads
                setSolarLeads(leads.map(l => ({
                    id: l._id,
                    customerName: l.name,
                    phone: l.mobile,
                    email: l.email,
                    address: `${l.district?.name || ''}, ${l.city?.name || ''}`,
                    projectType: l.solarType,
                    systemSize: l.kw,
                    budget: l.billAmount ? `₹${l.billAmount}` : 'N/A',
                    status: l.status,
                    createdDate: new Date(l.createdAt).toLocaleDateString(),
                    assignedTo: l.assignedTo,
                    assignedToType: l.assignedToType
                })));

                // Build history from assigned leads
                const history = leads
                    .filter(l => l.assignedTo)
                    .map(l => ({
                        leadId: l._id,
                        leadName: l.name,
                        assignedToId: l.assignedTo?._id,
                        assignedToName: l.assignedTo?.name || 'Unknown',
                        assignedToType: l.assignedToType || 'Dealer',
                        assignedBy: 'System',
                        assignedDate: new Date(l.updatedAt).toLocaleString(),
                        status: l.status,
                        projectType: l.solarType,
                        systemSize: l.kw
                    }));
                
                setAssignmentHistory(history);
            }
        } catch (error) {
            console.error("Error fetching leads:", error);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchLeadsAndHistory();
    }, []);

    // Location API Effects
    useEffect(() => {
        const fetchStates = async () => {
            try {
                const response = await locationAPI.getAllStates();
                if (response.data && response.data.data) {
                    setStates(response.data.data);
                }
            } catch (error) {
                console.error("Error fetching states:", error);
            }
        };
        fetchStates();
    }, []);

    useEffect(() => {
        const fetchDistricts = async () => {
            if (!selectedState) {
                setDistricts([]);
                return;
            }
            try {
                const response = await locationAPI.getAllDistricts({ stateId: selectedState });
                if (response.data && response.data.data) {
                    setDistricts(response.data.data);
                }
            } catch (error) {
                console.error("Error fetching districts:", error);
            }
        };
        fetchDistricts();
    }, [selectedState]);

    useEffect(() => {
        const fetchCities = async () => {
            if (!selectedDistrict) {
                setCities([]);
                return;
            }
            try {
                const response = await locationAPI.getAllCities({ districtId: selectedDistrict });
                if (response.data && response.data.data) {
                    setCities(response.data.data);
                }
            } catch (error) {
                console.error("Error fetching cities:", error);
            }
        };
        fetchCities();
    }, [selectedDistrict]);

    // Filtered Leads
    const filteredLeads = solarLeads.filter(lead => {
        if (!selectedCity) return true;
        const cityObj = cities.find(c => c._id === selectedCity);
        if (!cityObj) return true;
        return lead.address.toLowerCase().includes(cityObj.name.toLowerCase());
    });

    // Helper Functions
    const getLocationFromAddress = (address) => {
        return address.split(',').length > 1 ? address.split(',')[1].trim() : address;
    };

    const getStatusBadgeClass = (status) => {
        switch (status.toLowerCase()) {
            case 'new':
                return 'bg-blue-50 text-blue-600 border-blue-200';
            case 'in progress':
                return 'bg-orange-50 text-orange-600 border-orange-200';
            case 'assigned':
                return 'bg-green-50 text-green-600 border-green-200';
            case 'completed':
                return 'bg-green-50 text-green-600 border-green-200';
            default:
                return 'bg-gray-50 text-gray-600 border-gray-200';
        }
    };

    // Render Functions
    const renderLeadCards = () => {
        if (filteredLeads.length === 0) {
            return <div className="text-gray-500 py-4">No leads found for the selected location.</div>;
        }

        return filteredLeads.map((lead, index) => {
            const isSelected = selectedLead === lead.id;
            const location = getLocationFromAddress(lead.address);

            return (
                <div
                    key={lead.id}
                    className={`inline-block w-[190px] h-[145px] rounded-lg border-2 mr-2 mb-2 relative cursor-pointer transition-all duration-300 ${isSelected
                        ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                    onClick={() => {
                        setSelectedLead(lead.id);
                        setSelectedPartner(null);
                    }}
                >
                    {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs">
                            <Check size={12} />
                        </div>
                    )}
                    <div className="p-3">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center max-w-[85%]">
                                <div className="rounded-full bg-blue-50 p-1 mr-2 shrink-0">
                                    <User size={12} className="text-blue-600" />
                                </div>
                                <div className="min-w-0">
                                    <h6 className="mb-0 font-bold text-sm truncate">{lead.customerName}</h6>
                                    <div className="text-[10px] text-gray-500 font-semibold mt-0.5">Lead #{index + 1}</div>
                                </div>
                            </div>
                        </div>

                        <div className="text-xs text-gray-600 mb-1 flex items-center justify-between">
                            <div className="flex items-center min-w-0 pr-1">
                                <Home size={10} className="mr-1 text-gray-400 shrink-0" />
                                <span className="truncate">{lead.projectType}</span>
                            </div>
                            <div className="text-[10px] text-gray-400 shrink-0">
                                {lead.createdDate}
                            </div>
                        </div>
                        <div className="text-xs text-gray-600 mb-1 flex items-center">
                            <Bolt size={10} className="mr-1 text-gray-400 shrink-0" />
                            <span className="truncate">{lead.systemSize}</span>
                        </div>
                        <div className="text-xs text-gray-600 flex items-center">
                            <IndianRupee size={10} className="mr-1 text-gray-400 shrink-0" />
                            <span className="truncate">{lead.budget}</span>
                        </div>
                    </div>
                </div>
            );
        });
    };

    const renderPartnerCards = () => {
        const partners = selectedPartnerType === 'dealer' ? dealers : districtManagers;
        const partnerTypeLabel = selectedPartnerType === 'dealer' ? 'Dealer' : 'District Manager';

        if (partners.length === 0) {
            return (
                <div className="inline-block text-center p-4 border rounded min-w-[200px]">
                    <Users size={32} className="mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-500 mb-0">No {partnerTypeLabel.toLowerCase()}s available</p>
                </div>
            );
        }

        return partners.map((partner) => {
            const isSelected = selectedPartner === partner.id;

            return (
                <div
                    key={partner.id}
                    className={`inline-block w-[200px] h-[120px] rounded-lg border-2 mr-2 mb-2 relative cursor-pointer transition-all duration-300 ${isSelected
                        ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                    onClick={() => setSelectedPartner(partner.id)}
                >
                    {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-xs">
                            <Check size={12} />
                        </div>
                    )}
                    <div className="p-3">
                        <div className="flex items-center mb-2">
                            <div className="rounded-full bg-gradient-to-br from-blue-50 to-blue-100 p-1 mr-2">
                                {partner.type === 'Dealer' ? (
                                    <User size={14} className="text-blue-600" />
                                ) : (
                                    <Users size={14} className="text-blue-600" />
                                )}
                            </div>
                            <div className="flex-grow">
                                <h6 className="mb-0 font-bold text-sm truncate">{partner.name}</h6>
                                <span className="bg-blue-100 text-blue-800 text-xs px-1 py-0.5 rounded">
                                    {partner.type}
                                </span>
                            </div>
                        </div>

                        <div className="text-xs text-gray-600 mb-1 flex items-center">
                            <MapPin size={10} className="mr-1" />
                            <span className="truncate">{partner.location}</span>
                        </div>
                        <div className="text-xs text-gray-600 mb-1 flex items-center">
                            <Phone size={10} className="mr-1" />
                            <span>{partner.phone}</span>
                        </div>
                        <div className="text-xs text-gray-600 flex items-center">
                            <Mail size={10} className="mr-1" />
                            <span className="truncate">{partner.email}</span>
                        </div>
                    </div>
                </div>
            );
        });
    };

    const renderAvailableLeadsGrid = () => {
        if (filteredLeads.length === 0) {
            return <div className="text-gray-500 py-4 text-center">No leads found for the selected location.</div>;
        }

        return filteredLeads.map((lead) => {
            const statusClass = getStatusBadgeClass(lead.status);
            const location = getLocationFromAddress(lead.address);

            return (
                <div
                    key={lead.id}
                    className="border-l-4 border-blue-500 rounded-lg mb-2 cursor-pointer hover:shadow-md transition-all duration-300 bg-white"
                    onClick={() => {
                        setSelectedLead(lead.id);
                        setSelectedPartner(null);
                        if (selectedTab !== 'assign') {
                            setSelectedTab('assign');
                        }
                    }}
                >
                    <div className="p-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="rounded-full bg-gray-100 p-2 mr-3">
                                    <User size={16} className="text-blue-600" />
                                </div>
                                <div>
                                    <h6 className="mb-1 font-bold">{lead.customerName}</h6>
                                    <p className="mb-1 text-gray-500 text-sm">
                                        <Home size={12} className="inline mr-1" />
                                        {lead.projectType} •
                                        <Bolt size={12} className="inline mx-1" />
                                        {lead.systemSize} •
                                        <IndianRupee size={12} className="inline mx-1" />
                                        {lead.budget}
                                    </p>
                                    <p className="mb-0 text-gray-400 text-xs">
                                        <MapPin size={10} className="inline mr-1" />
                                        {location}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${statusClass}`}>
                                    {lead.status}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            );
        });
    };

    const renderHistoryTable = () => {
        let filteredHistory = assignmentHistory;
        
        if (historyFilter !== 'all') {
            filteredHistory = filteredHistory.filter(assignment =>
                assignment.assignedToType.toLowerCase().replace(' ', '_') === historyFilter
            );
        }

        if (historyProjectCategory) {
            filteredHistory = filteredHistory.filter(assignment => assignment.projectType.includes(historyProjectCategory));
        }

        return filteredHistory.map((assignment, index) => {
            const statusClass = getStatusBadgeClass(assignment.status);
            const typeBadgeClass = assignment.assignedToType === 'Dealer'
                ? 'bg-green-100 text-green-800'
                : 'bg-blue-100 text-blue-800';

            return (
                <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-semibold">Lead #{String(index + 1).padStart(3, '0')}</td>
                    <td className="py-3 px-4">{assignment.leadName}</td>
                    <td className="py-3 px-4">
                        <div className="font-semibold">{assignment.projectType}</div>
                        <div className="text-sm text-gray-500">{assignment.systemSize}</div>
                    </td>
                    <td className="py-3 px-4">{assignment.assignedToName}</td>
                    <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${typeBadgeClass}`}>
                            {assignment.assignedToType}
                        </span>
                    </td>
                    <td className="py-3 px-4">{assignment.assignedDate}</td>
                    <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${statusClass}`}>
                            {assignment.status}
                        </span>
                    </td>
                </tr>
            );
        });
    };

    const assignLead = async () => {
        if (selectedLead === null) {
            alert('Please select a solar project lead');
            return;
        }

        if (selectedPartner === null) {
            alert('Please select a partner to assign');
            return;
        }

        const lead = solarLeads.find(l => l.id === selectedLead);
        let partner;

        if (selectedPartnerType === 'dealer') {
            partner = dealers.find(d => d.id === selectedPartner);
        } else {
            partner = districtManagers.find(sm => sm.id === selectedPartner);
        }

        try {
            // API Call to assign
            await leadAPI.assignLeadToPartner(lead.id, {
                assignedTo: partner.id,
                assignedToType: partner.type
            });

            alert(`Solar project lead ${lead.customerName} assigned to ${partner.name} successfully!`);
            
            // Refetch to update UI with latest assignment history
            fetchLeadsAndHistory();

            // Reset form
            setSelectedLead(null);
            setSelectedPartner(null);
        } catch (error) {
            console.error('Error assigning lead:', error);
            alert('Failed to assign lead. Please try again.');
        }
    };

    const isAssignButtonEnabled = selectedLead !== null && selectedPartner !== null;

    return (
        <div className="container mx-auto px-4 py-3 max-w-7xl">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm mb-4 border-0">
                <div className="p-6">
                    <h4 className="text-xl mb-1 text-blue-600 font-semibold">Lead Management</h4>
                    <p className="text-gray-500 mb-0">Efficiently assign and track solar project leads</p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-lg shadow-sm mb-4 border-0">
                <div className="p-2">
                    <div className="flex space-x-2">
                        <button
                            className={`flex-1 md:flex-none px-5 py-3 rounded-lg transition-all duration-300 ${selectedTab === 'assign'
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                                : 'border border-gray-200 hover:bg-gray-50'
                                }`}
                            onClick={() => setSelectedTab('assign')}
                        >
                            <UserPlus size={18} className="inline mr-2" />
                            <span>Assign Lead</span>
                        </button>
                        <button
                            className={`flex-1 md:flex-none px-5 py-3 rounded-lg transition-all duration-300 ${selectedTab === 'history'
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                                : 'border border-gray-200 hover:bg-gray-50'
                                }`}
                            onClick={() => setSelectedTab('history')}
                        >
                            <History size={18} className="inline mr-2" />
                            <span>History</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Assign Lead Content */}
            {selectedTab === 'assign' && (
                <>
                    {/* Main Assignment Card */}
                    <div className="bg-white rounded-lg shadow-sm mb-4 border-0">
                        <div className="p-6">
                            <div className="flex items-center mb-4">
                                <div className="w-9 h-9 bg-gradient-to-br from-green-50 to-green-100 rounded-lg flex items-center justify-center mr-3">
                                    <ClipboardList size={20} className="text-green-600" />
                                </div>
                                <h5 className="text-lg font-bold text-green-600 mb-0">Assign Solar Project Lead</h5>
                            </div>

                            {/* Location Filters */}
                            <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
                                <h6 className="text-blue-600 font-semibold mb-3 flex items-center">
                                    <MapPin size={16} className="mr-2" />
                                    Filter Leads by Location
                                </h6>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                                        <select
                                            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={selectedState}
                                            onChange={(e) => {
                                                setSelectedState(e.target.value);
                                                setSelectedDistrict('');
                                                setSelectedCity('');
                                            }}
                                        >
                                            <option value="">All States</option>
                                            {states.map((state) => (
                                                <option key={state._id} value={state._id}>
                                                    {state.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                                        <select
                                            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={selectedDistrict}
                                            onChange={(e) => {
                                                setSelectedDistrict(e.target.value);
                                                setSelectedCity('');
                                            }}
                                            disabled={!selectedState}
                                        >
                                            <option value="">All Districts</option>
                                            {districts.map((district) => (
                                                <option key={district._id} value={district._id}>
                                                    {district.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                        <select
                                            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={selectedCity}
                                            onChange={(e) => setSelectedCity(e.target.value)}
                                            disabled={!selectedDistrict}
                                        >
                                            <option value="">All Cities</option>
                                            {cities.map((city) => (
                                                <option key={city._id} value={city._id}>
                                                    {city.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Lead Selection */}
                            <div className="mb-4">
                                <h6 className="text-blue-600 font-semibold mb-3 flex items-center">
                                    <Users size={16} className="mr-2" />
                                    Select Solar Project Lead
                                </h6>
                                <p className="text-gray-500 mb-3 text-sm">Choose a lead to assign:</p>

                                <div className="overflow-x-auto whitespace-nowrap pb-3">
                                    {renderLeadCards()}
                                </div>
                            </div>

                            {/* Assign To */}
                            <div className="mb-4">
                                <h6 className="text-blue-600 font-semibold mb-3 flex items-center">
                                    <Share2 size={16} className="mr-2" />
                                    Assign To
                                </h6>

                                <div className="overflow-x-auto whitespace-nowrap pb-3">
                                    {/* Dealer Card */}
                                    <div
                                        className={`inline-block w-[140px] h-[90px] rounded-lg border-2 mr-2 cursor-pointer transition-all duration-300 ${selectedPartnerType === 'dealer'
                                            ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50'
                                            : 'border-gray-200 bg-white hover:border-gray-300'
                                            }`}
                                        onClick={() => {
                                            setSelectedPartnerType('dealer');
                                            setSelectedPartner(null);
                                        }}
                                    >
                                        <div className="flex flex-col items-center justify-center h-full">
                                            <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center mb-2">
                                                <User size={20} className="text-blue-600" />
                                            </div>
                                            <span className="font-bold text-green-600">Dealer</span>
                                        </div>
                                    </div>

                                    {/* District Manager Card */}
                                    <div
                                        className={`inline-block w-[140px] h-[90px] rounded-lg border-2 mr-2 cursor-pointer transition-all duration-300 ${selectedPartnerType === 'district_manager'
                                            ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50'
                                            : 'border-gray-200 bg-white hover:border-gray-300'
                                            }`}
                                        onClick={() => {
                                            setSelectedPartnerType('district_manager');
                                            setSelectedPartner(null);
                                        }}
                                    >
                                        <div className="flex flex-col items-center justify-center h-full">
                                            <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center mb-2">
                                                <Users size={20} className="text-blue-600" />
                                            </div>
                                            <span className="font-bold text-blue-600 text-sm text-center leading-tight">District Manager</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Partner Selection */}
                            <div className="mb-4">
                                <h6 className="text-blue-600 font-semibold mb-3 flex items-center">
                                    <UserRound size={16} className="mr-2" />
                                    Select {selectedPartnerType === 'dealer' ? 'Dealer' : 'District Manager'}
                                </h6>
                                <p className="text-gray-500 mb-3 text-sm">
                                    Choose a {selectedPartnerType === 'dealer' ? 'dealer' : 'district manager'} to assign lead:
                                </p>

                                <div className="overflow-x-auto whitespace-nowrap pb-3">
                                    {renderPartnerCards()}
                                </div>
                            </div>

                            {/* Assign Button */}
                            <div className="text-center mt-4">
                                <button
                                    className={`px-6 py-3 rounded-lg font-semibold text-white transition-all duration-300 shadow-lg ${isAssignButtonEnabled
                                        ? 'bg-gradient-to-r from-green-600 to-green-700 hover:shadow-xl cursor-pointer'
                                        : 'bg-gray-400 cursor-not-allowed'
                                        }`}
                                    disabled={!isAssignButtonEnabled}
                                    onClick={assignLead}
                                >
                                    <Send size={18} className="inline mr-2" />
                                    Assign Solar Project Lead
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* History Content */}
            {selectedTab === 'history' && (
                <div className="bg-white rounded-lg shadow-sm mb-4 border-0">
                    <div className="p-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-100 flex justify-between items-center shadow-sm">
                                <div>
                                    <h6 className="text-green-800 font-bold mb-1 text-lg">Dealer</h6>
                                    <p className="text-green-600 text-sm mb-0">Total assigned leads</p>
                                </div>
                                <div className="bg-white text-green-600 w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold shadow-sm border border-green-200">
                                    {assignmentHistory.filter(h => h.assignedToType === 'Dealer').length}
                                </div>
                            </div>
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100 flex justify-between items-center shadow-sm">
                                <div>
                                    <h6 className="text-blue-800 font-bold mb-1 text-lg">District Manager</h6>
                                    <p className="text-blue-600 text-sm mb-0">Total assigned leads</p>
                                </div>
                                <div className="bg-white text-blue-600 w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold shadow-sm border border-blue-200">
                                    {assignmentHistory.filter(h => h.assignedToType === 'District Manager').length}
                                </div>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <h6 className="text-blue-600 font-semibold mb-3 flex items-center">
                                <Bolt size={16} className="mr-2" />
                                Filter History
                            </h6>
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Project Category</label>
                                    <select className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={historyProjectCategory} onChange={(e) => setHistoryProjectCategory(e.target.value)}>
                                        <option value="">All Categories</option>
                                        <option value="Residential">Residential</option>
                                        <option value="Commercial">Commercial</option>
                                        <option value="Industrial">Industrial</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Sub Category</label>
                                    <select className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={historyProjectSubCategory} onChange={(e) => setHistoryProjectSubCategory(e.target.value)}>
                                        <option value="">All Sub Categories</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Project Type</label>
                                    <select className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={historyProjectType} onChange={(e) => setHistoryProjectType(e.target.value)}>
                                        <option value="">All Types</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Sub Project Type</label>
                                    <select className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={historySubProjectType} onChange={(e) => setHistorySubProjectType(e.target.value)}>
                                        <option value="">All Sub Types</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Assignment Type</label>
                                    <select className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={historyFilter} onChange={(e) => setHistoryFilter(e.target.value)}>
                                        <option value="all">All Assignments</option>
                                        <option value="dealer">Dealer Only</option>
                                        <option value="district_manager">District Manager Only</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                            <div className="flex items-center mb-3 md:mb-0">
                                <div className="w-9 h-9 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center mr-3">
                                    <History size={20} className="text-blue-600" />
                                </div>
                                <h5 className="text-lg font-bold text-blue-600 mb-0">Lead Assignment History</h5>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 border-b-2 border-gray-200">
                                        <th className="py-3 px-4 text-left font-semibold text-blue-600">Lead ID</th>
                                        <th className="py-3 px-4 text-left font-semibold text-blue-600">Customer</th>
                                        <th className="py-3 px-4 text-left font-semibold text-blue-600">Project</th>
                                        <th className="py-3 px-4 text-left font-semibold text-blue-600">Assigned To</th>
                                        <th className="py-3 px-4 text-left font-semibold text-blue-600">Type</th>
                                        <th className="py-3 px-4 text-left font-semibold text-blue-600">Date</th>
                                        <th className="py-3 px-4 text-left font-semibold text-blue-600">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {renderHistoryTable()}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FranchiseProjectManagementAssignLead;