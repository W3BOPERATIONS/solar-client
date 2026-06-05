import React, { useState } from 'react';
import {
    User,
    Users,
    MapPin,
    Calendar,
    FileText,
    CheckCircle,
    AlertCircle,
    ArrowRight,
    UserPlus,
    Briefcase,
    Star,
    TrendingUp,
    DollarSign,
    Clock,
    X
} from 'lucide-react';

const DealerManagerAssignToCP = () => {
    const [selectedCP, setSelectedCP] = useState(null);
    const [selectedDistrict, setSelectedDistrict] = useState(null);
    const [showDistrictCards, setShowDistrictCards] = useState(false);
    const [showDealerTable, setShowDealerTable] = useState(false);
    const [showSuccessAlert, setShowSuccessAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');

    const [cpList, setCpList] = useState([]);
    const [districtData, setDistrictData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch initial CP List
    React.useEffect(() => {
        const fetchCPs = async () => {
            try {
                const { default: api } = await import('../../../api/axios.js');
                const res = await api.get('/users?role=channelPartner');
                // Format the user list to cpList
                const formatted = (res.data?.users || []).map(user => ({
                    id: user._id,
                    name: user.name,
                    region: user.state || 'N/A',
                    dealers: 0, // Would need actual aggregation from backend, default to 0
                    performance: 'N/A'
                }));
                // Fallback to franchisee role if no channel partners
                if (formatted.length === 0) {
                    const fallbackRes = await api.get('/users?role=franchisee');
                    const fallbackFormatted = (fallbackRes.data?.users || []).map(user => ({
                        id: user._id,
                        name: user.name,
                        region: user.state || 'N/A',
                        dealers: 0,
                        performance: 'N/A'
                    }));
                    setCpList(fallbackFormatted);
                } else {
                    setCpList(formatted);
                }
            } catch (err) {
                console.error("Error fetching CPs:", err);
            }
        };
        fetchCPs();
    }, []);

    // Fetch dealers when a CP is selected (for their district/state mapping)
    const handleCPClick = async (cp) => {
        setSelectedCP(cp);
        setShowDistrictCards(true);
        setSelectedDistrict(null);
        setShowDealerTable(false);
        setLoading(true);

        try {
            const { default: api } = await import('../../../api/axios.js');
            // Fetch unassigned dealers or dealers assigned to this CP (using state/district loosely)
            const res = await api.get(`/users?role=dealer`);
            const dealers = res.data?.users || [];
            
            // Group dealers by district
            const grouped = dealers.reduce((acc, dealer) => {
                const dist = dealer.district || 'Unassigned';
                if (!acc[dist]) {
                    acc[dist] = {
                        id: dist,
                        name: dist,
                        totalDealers: 0,
                        dealers: []
                    };
                }
                acc[dist].dealers.push({
                    id: dealer._id,
                    name: dealer.name,
                    joinDate: dealer.createdAt ? new Date(dealer.createdAt).toLocaleDateString() : 'N/A',
                    cp: dealer.assignedTo || 'Unassigned',
                    quotations: 0, // Mock stats
                    projects: 0, // Mock stats
                    performance: 'N/A'
                });
                acc[dist].totalDealers++;
                return acc;
            }, {});

            setDistrictData(Object.values(grouped));
        } catch (error) {
            console.error("Error fetching dealers:", error);
        } finally {
            setLoading(false);
        }
    };

    const cpOptions = cpList.map(cp => cp.name);

    const handleDistrictClick = (district) => {
        setSelectedDistrict(district);
        setShowDealerTable(true);
    };

    const handleRaiseRequest = async (dealerId, dealerName, selectedCPValue) => {
        try {
            const { default: api } = await import('../../../api/axios.js');
            // Assuming there's a dealer manager route or user update route for assigning
            await api.put(`/users/${dealerId}`, { assignedTo: selectedCPValue });
            setAlertMessage(`Request raised successfully for ${dealerName} to ${selectedCPValue}`);
            setShowSuccessAlert(true);
            setTimeout(() => setShowSuccessAlert(false), 3000);
        } catch (error) {
            console.error("Error assigning dealer:", error);
            setAlertMessage(`Failed to assign ${dealerName}`);
            setShowSuccessAlert(true);
            setTimeout(() => setShowSuccessAlert(false), 3000);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-6">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6 text-center">
                    <h1 className="text-3xl font-bold text-blue-600 mb-2">Dealer Management System</h1>
                    <p className="text-gray-500">Manage dealers and CP assignments</p>
                </div>

                {/* Success Alert */}
                {showSuccessAlert && (
                    <div className="fixed top-4 right-4 z-50 animate-fade-in">
                        <div className="bg-green-500 text-white rounded-lg shadow-lg p-4 flex items-center">
                            <CheckCircle size={20} className="mr-2" />
                            <span>{alertMessage}</span>
                            <button onClick={() => setShowSuccessAlert(false)} className="ml-4">
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {/* CP Cards */}
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                        <Users size={20} className="mr-2 text-blue-500" />
                        Select Channel Partner
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {cpList.map((cp) => (
                            <div
                                key={cp.id}
                                onClick={() => handleCPClick(cp)}
                                className={`cursor-pointer rounded-xl shadow-sm transition-all hover:shadow-md ${selectedCP?.id === cp.id
                                        ? 'ring-2 ring-blue-500 bg-blue-50'
                                        : 'bg-white'
                                    }`}
                            >
                                <div className="p-4 text-center">
                                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <User size={32} className="text-blue-600" />
                                    </div>
                                    <h5 className="font-semibold text-gray-800">{cp.name}</h5>
                                    <p className="text-xs text-gray-500 mt-1">Region: {cp.region}</p>
                                    <div className="flex justify-center items-center mt-2 space-x-2">
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                            {cp.dealers} dealers
                                        </span>
                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                            {cp.performance}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* District Cards */}
                {showDistrictCards && selectedCP && (
                    <div className="mb-6 animate-fade-in">
                        <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                            <MapPin size={20} className="mr-2 text-blue-500" />
                            Districts for {selectedCP.name}
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {districtData.map((district) => (
                                <div
                                    key={district.id}
                                    onClick={() => handleDistrictClick(district)}
                                    className={`cursor-pointer rounded-xl shadow-sm transition-all hover:shadow-md ${selectedDistrict?.id === district.id
                                            ? 'ring-2 ring-blue-500 bg-blue-50'
                                            : 'bg-white'
                                        }`}
                                >
                                    <div className="p-4 text-center">
                                        <MapPin size={32} className="mx-auto mb-2 text-blue-500" />
                                        <h5 className="font-semibold text-gray-800">{district.name}</h5>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Dealers: {district.dealers.length}/{district.totalDealers}
                                        </p>
                                        <span className="inline-block mt-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                            Click to view dealers
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Dealers Table */}
                {showDealerTable && selectedDistrict && (
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden animate-fade-in">
                        <div className="p-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-700 flex items-center">
                                <Briefcase size={20} className="mr-2 text-blue-500" />
                                Dealers in {selectedDistrict.name}
                            </h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                            Dealer Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                            Joining Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                            Quotations
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                            Projects
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                            Performance
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                            Select CP
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {selectedDistrict.dealers.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                                                No dealers found in {selectedDistrict.name}
                                            </td>
                                        </tr>
                                    ) : (
                                        selectedDistrict.dealers.map((dealer) => (
                                            <tr key={dealer.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {dealer.name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <div className="flex items-center">
                                                        <Calendar size={14} className="mr-1 text-gray-400" />
                                                        {dealer.joinDate}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <div className="flex items-center">
                                                        <FileText size={14} className="mr-1 text-blue-400" />
                                                        {dealer.quotations}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <div className="flex items-center">
                                                        <TrendingUp size={14} className="mr-1 text-green-400" />
                                                        {dealer.projects}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 rounded-full text-xs ${parseInt(dealer.performance) >= 90
                                                            ? 'bg-green-100 text-green-700'
                                                            : parseInt(dealer.performance) >= 80
                                                                ? 'bg-blue-100 text-blue-700'
                                                                : 'bg-orange-100 text-orange-700'
                                                        }`}>
                                                        {dealer.performance}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <select
                                                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        defaultValue={dealer.cp}
                                                    >
                                                        {cpOptions.map((cp, index) => (
                                                            <option key={index} value={cp}>{cp}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <button
                                                        onClick={(event) => {
                                                            const select = event.target.closest('tr').querySelector('select');
                                                            const selectedCPValue = select ? select.value : dealer.cp;
                                                            handleRaiseRequest(dealer.id, dealer.name, selectedCPValue);
                                                        }}
                                                        className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors flex items-center"
                                                    >
                                                        <UserPlus size={12} className="mr-1" />
                                                        Raise Request
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* District Summary */}
                        <div className="p-4 bg-gray-50 border-t border-gray-200">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="bg-white rounded-lg p-3 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-gray-500">Total Dealers</p>
                                            <p className="text-lg font-bold text-gray-700">{selectedDistrict.dealers.length}</p>
                                        </div>
                                        <Users size={20} className="text-blue-500" />
                                    </div>
                                </div>
                                <div className="bg-white rounded-lg p-3 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-gray-500">Total Quotations</p>
                                            <p className="text-lg font-bold text-green-600">
                                                {selectedDistrict.dealers.reduce((sum, d) => sum + d.quotations, 0)}
                                            </p>
                                        </div>
                                        <FileText size={20} className="text-green-500" />
                                    </div>
                                </div>
                                <div className="bg-white rounded-lg p-3 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-gray-500">Total Projects</p>
                                            <p className="text-lg font-bold text-orange-600">
                                                {selectedDistrict.dealers.reduce((sum, d) => sum + d.projects, 0)}
                                            </p>
                                        </div>
                                        <TrendingUp size={20} className="text-orange-500" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!showDistrictCards && (
                    <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                        <Users size={48} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500">Select a Channel Partner to view districts and dealers</p>
                    </div>
                )}

                {showDistrictCards && selectedCP && !showDealerTable && (
                    <div className="text-center py-8 bg-white rounded-xl shadow-sm">
                        <MapPin size={40} className="mx-auto mb-3 text-gray-300" />
                        <p className="text-gray-500">Select a district to view dealers</p>
                    </div>
                )}
            </div>

            <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
        </div>
    );
};

export default DealerManagerAssignToCP;