import React, { useState } from 'react';
import {
    Users,
    Building2,
    Eye,
    X,
    UserCheck,
    Target,
    FileText,
    CheckCircle,
    Clock,
    AlertCircle,
    ChevronRight,
    MapPin
} from 'lucide-react';

const TrackDealerDashboard = () => {
    const [selectedDistrict, setSelectedDistrict] = useState(null);
    const [currentDataType, setCurrentDataType] = useState(null); // 'cp' or 'company'
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState(null);
    const [data, setData] = useState({});
    const [districts, setDistricts] = useState([]);
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        const fetchTrackingData = async () => {
            try {
                const { default: api } = await import('../../../api/axios.js');
                const [cpRes, dealerRes] = await Promise.all([
                    api.get('/users?role=channelPartner'),
                    api.get('/users?role=dealer')
                ]);
                
                const cps = cpRes.data?.users || [];
                const dealers = dealerRes.data?.users || [];

                const districtMap = {};
                
                // Group dealers by district
                dealers.forEach(dealer => {
                    const distName = dealer.district || dealer.city || 'Unassigned';
                    if (!districtMap[distName]) {
                        districtMap[distName] = { cps: [], companies: [], rawDealers: [] };
                    }
                    districtMap[distName].rawDealers.push(dealer);
                });

                const formattedDistricts = [];
                const formattedData = {};

                Object.keys(districtMap).forEach(distName => {
                    const distDealers = districtMap[distName].rawDealers;
                    
                    // Simulate CPs for this district
                    const distCPs = cps.map(cp => {
                        const assignedDealers = distDealers.filter(d => d.assignedTo === cp.name || d.assignedTo === cp._id);
                        return {
                            id: cp._id,
                            name: cp.name,
                            dealers: assignedDealers.length,
                            dealersList: assignedDealers.map(d => ({
                                id: d._id,
                                name: d.name,
                                joinDate: d.createdAt ? new Date(d.createdAt).toLocaleDateString() : 'N/A',
                                status: d.status || 'Active',
                                quotations: 0,
                                projects: 0,
                                efficiency: 80
                            }))
                        };
                    });

                    formattedData[distName] = {
                        cps: distCPs,
                        companies: [] // If company specific logic exists, handle here
                    };

                    formattedDistricts.push({
                        name: distName,
                        dealers: distDealers.length,
                        performance: 85, // Mock performance
                        performanceClass: 'bg-blue-500'
                    });
                });

                if (formattedDistricts.length > 0) {
                    setData(formattedData);
                    setDistricts(formattedDistricts);
                } else {
                    // Fallback static data if no dynamic available
                    setDistricts([
                        { name: 'Paddhari', dealers: 0, performance: 0, performanceClass: 'bg-blue-500' }
                    ]);
                }
            } catch (err) {
                console.error("Error fetching tracking data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchTrackingData();
    }, []);
    // Data states are managed by useState above

    const handleDistrictClick = (district) => {
        setSelectedDistrict(district);
        setCurrentDataType(null);
    };

    const handleCpClick = () => {
        if (!selectedDistrict) return;
        setCurrentDataType('cp');
    };

    const handleCompanyClick = () => {
        if (!selectedDistrict) return;
        setCurrentDataType('company');
    };

    const handleViewDetails = (item) => {
        setModalData(item);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setModalData(null);
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Active':
                return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle size={12} className="mr-1" />Active</span>;
            case 'Pending':
                return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock size={12} className="mr-1" />Pending</span>;
            case 'Inactive':
                return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"><AlertCircle size={12} className="mr-1" />Inactive</span>;
            default:
                return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
        }
    };

    const getEfficiencyColor = (efficiency) => {
        if (efficiency > 70) return 'bg-green-500';
        if (efficiency > 50) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-8 text-center">
                    <h1 className="text-3xl font-bold text-blue-600 mb-2">Track Dealer Dashboard</h1>
                    <p className="text-gray-500 text-lg">Monitor dealer performance across districts</p>
                </div>

                {/* District Cards */}
                {loading ? (
                    <div className="text-center py-10">Loading districts...</div>
                ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {districts.map((district) => (
                        <div
                            key={district.name}
                            onClick={() => handleDistrictClick(district.name)}
                            className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1 ${selectedDistrict === district.name ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                                }`}
                        >
                            <div className="p-6 text-center">
                                <div className="flex items-center justify-center mb-3">
                                    <MapPin className="text-blue-500 mr-2" size={24} />
                                    <h4 className="text-xl font-semibold text-blue-600">{district.name}</h4>
                                </div>
                                <p className="text-gray-600 mb-3">{district.dealers} Dealers</p>
                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium text-white ${district.performanceClass}`}>
                                    Performance: {district.performance}%
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
                )}

                {/* CP and Company Options */}
                {selectedDistrict && (
                    <div className="flex flex-wrap justify-start gap-4 mb-6">
                        <div className="w-full md:w-4/12">
                            <button
                                onClick={handleCpClick}
                                className={`w-full px-6 py-4 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 ${currentDataType === 'cp'
                                        ? 'bg-blue-600 ring-2 ring-blue-300'
                                        : 'bg-blue-500 hover:bg-blue-600'
                                    }`}
                            >
                                <div className="flex items-center justify-center text-white">
                                    <Users size={24} className="mr-3" />
                                    <h5 className="text-lg font-semibold">Franchisee's</h5>
                                </div>
                            </button>
                        </div>
                        <div className="w-full md:w-4/12">
                            <button
                                onClick={handleCompanyClick}
                                className={`w-full px-6 py-4 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 ${currentDataType === 'company'
                                        ? 'bg-green-600 ring-2 ring-green-300'
                                        : 'bg-green-500 hover:bg-green-600'
                                    }`}
                            >
                                <div className="flex items-center justify-center text-white">
                                    <Building2 size={24} className="mr-3" />
                                    <h5 className="text-lg font-semibold">Companies</h5>
                                </div>
                            </button>
                        </div>
                    </div>
                )}

                {/* Data Table Section */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    {!selectedDistrict && (
                        <div className="p-8 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                                <Users className="text-blue-600" size={32} />
                            </div>
                            <p className="text-gray-500 text-lg">Please select a district to view data</p>
                        </div>
                    )}

                    {selectedDistrict && !currentDataType && (
                        <div className="p-8 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
                                <Target className="text-yellow-600" size={32} />
                            </div>
                            <p className="text-gray-500 text-lg">Please select an option for {selectedDistrict} district</p>
                        </div>
                    )}

                    {selectedDistrict && currentDataType && (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-800">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                            {currentDataType === 'cp' ? 'Franchisee ID' : 'Company ID'}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Dealers</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {(currentDataType === 'cp'
                                        ? data[selectedDistrict]?.cps || []
                                        : data[selectedDistrict]?.companies || []
                                    ).map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-700">{item.id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.dealers}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <button
                                                    onClick={() => handleViewDetails(item)}
                                                    className="inline-flex items-center px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-150"
                                                >
                                                    <Eye size={16} className="mr-1" />
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {showModal && modalData && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                            <div className="bg-blue-600 px-6 py-4 flex justify-between items-center">
                                <h4 className="text-xl font-semibold text-white">
                                    {modalData.name} - Dealers ({modalData.dealers})
                                </h4>
                                <button
                                    onClick={closeModal}
                                    className="text-white hover:text-gray-200 focus:outline-none"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="bg-white px-6 py-4">
                                {modalData.dealersList ? (
                                    <>
                                        <div className="mb-4">
                                            <h5 className="text-lg font-semibold text-gray-800">{modalData.name} ({modalData.id})</h5>
                                            <p className="text-gray-600">Total Dealers: {modalData.dealers}</p>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full border-collapse">
                                                <thead>
                                                    <tr className="bg-blue-100">
                                                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Dealer ID</th>
                                                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Dealer Name</th>
                                                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Join Date</th>
                                                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Quotations</th>
                                                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Projects</th>
                                                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Efficiency</th>
                                                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {modalData.dealersList.map((dealer, idx) => (
                                                        <tr key={idx} className="hover:bg-gray-50">
                                                            <td className="px-4 py-2 text-sm font-mono text-gray-700">{dealer.id}</td>
                                                            <td className="px-4 py-2 text-sm text-gray-700">{dealer.name}</td>
                                                            <td className="px-4 py-2 text-sm text-gray-700">{dealer.joinDate}</td>
                                                            <td className="px-4 py-2 text-sm text-gray-700">{dealer.quotations}</td>
                                                            <td className="px-4 py-2 text-sm text-gray-700">{dealer.projects}</td>
                                                            <td className="px-4 py-2 text-sm">
                                                                <div className="flex items-center">
                                                                    <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                                                                        <div
                                                                            className={`${getEfficiencyColor(dealer.efficiency)} h-2 rounded-full`}
                                                                            style={{ width: `${dealer.efficiency}%` }}
                                                                        ></div>
                                                                    </div>
                                                                    <span className="text-xs text-gray-600">{dealer.efficiency}%</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-2 text-sm">{getStatusBadge(dealer.status)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="mb-4">
                                            <h5 className="text-lg font-semibold text-gray-800">{modalData.name} ({modalData.id})</h5>
                                            <p className="text-gray-600">Total Dealers: {modalData.dealers}</p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                            <div className="bg-blue-50 rounded-lg p-4 text-center">
                                                <FileText className="mx-auto text-blue-600 mb-2" size={32} />
                                                <h4 className="text-2xl font-bold text-blue-600">24</h4>
                                                <p className="text-gray-600">Total Quotations</p>
                                            </div>
                                            <div className="bg-green-50 rounded-lg p-4 text-center">
                                                <CheckCircle className="mx-auto text-green-600 mb-2" size={32} />
                                                <h4 className="text-2xl font-bold text-green-600">18</h4>
                                                <p className="text-gray-600">Projects Signed</p>
                                            </div>
                                            <div className="bg-purple-50 rounded-lg p-4 text-center">
                                                <Target className="mx-auto text-purple-600 mb-2" size={32} />
                                                <h4 className="text-2xl font-bold text-purple-600">85%</h4>
                                                <p className="text-gray-600">Efficiency Score</p>
                                            </div>
                                        </div>
                                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                                            <div className="flex">
                                                <AlertCircle className="text-blue-600 mr-3" size={20} />
                                                <p className="text-sm text-blue-700">
                                                    Detailed dealer information is not available for this entry.
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="bg-gray-50 px-6 py-3 flex justify-end">
                                <button
                                    onClick={closeModal}
                                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors duration-150"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrackDealerDashboard;