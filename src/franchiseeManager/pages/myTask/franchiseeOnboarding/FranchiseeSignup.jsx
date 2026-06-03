import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import LocationSelector from './LocationSelector';
import {
    ChevronRight,
    Plus,
    Filter,
    Search,
    RefreshCw,
    MoreVertical,
    Trash2,
    ChevronLeft,
    ChevronRight as ChevronRightIcon,
    X,
    Eye,
    Calendar,
    MapPin,
    Building,
    User,
    Phone,
    Zap,
    CreditCard,
    Home,
    Globe,
    Layers,
    Grid,
    CheckCircle,
    AlertCircle,
    Clock
} from 'lucide-react';

const FranchiseeManagerKYC = () => {
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [selectedDateRange, setSelectedDateRange] = useState('today');
    const [locationFilters, setLocationFilters] = useState({
        country: '',
        state: '',
        city: '',
        district: '',
        cluster: '',
        zone: ''
    });
    const [selectedKycStatus, setSelectedKycStatus] = useState('');
    const [customDate, setCustomDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [topDateFilter, setTopDateFilter] = useState('');

    const [bottomFilter, setBottomFilter] = useState('');
    const [bottomCustomDate, setBottomCustomDate] = useState('');
    const todayDate = new Date().toISOString().split('T')[0];
    const tomorrowDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    // KYC data state initialized from completed App Demo leads in localStorage
    const [kycData, setKycData] = useState(() => {
        try {
            const savedAppDemoLeads = localStorage.getItem('appDemoLeads');
            if (savedAppDemoLeads) {
                const parsedLeads = JSON.parse(savedAppDemoLeads);
                // Filter only completed demos and format them for the signup table
                const completedLeads = parsedLeads.filter(lead => lead.status === 'Completed').map((lead, index) => ({
                    id: lead.id,
                    srNo: index + 1,
                    status: 'New', // Initially 'New' in the Signup stage
                    statusColor: 'pink',
                    leadId: lead.leadId,
                    name: lead.name,
                    mobile: lead.mobile,
                    designation: lead.designation,
                    district: lead.district,
                    followupDate: todayDate // Default follow up to today
                }));
                return completedLeads;
            }
        } catch (e) {
            console.error("Error loading leads from localStorage", e);
        }
        return [];
    });

    const handleDateRangeChange = (e) => {
        setSelectedDateRange(e.target.value);
    };

    const toggleFilterModal = () => {
        setIsFilterModalOpen(!isFilterModalOpen);
    };

    // Get status badge color
    const getStatusBadge = (status) => {
        switch (status) {
            case 'New':
                return 'bg-pink-100 text-pink-800';
            case 'Pending':
                return 'bg-orange-100 text-orange-800';
            case 'Overdue':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const handleDeleteLead = (id) => {
        if (window.confirm("Are you sure you want to delete this record?")) {
            setKycData(kycData.filter(record => record.id !== id));
        }
    };

    const filteredKycData = kycData.filter(record => {
        if (selectedDistrict && record.district !== selectedDistrict) return false;
        if (topDateFilter && record.followupDate !== topDateFilter) return false;
        
        if (bottomFilter === 'Today') return record.followupDate === todayDate;
        if (bottomFilter === 'Tomorrow') return record.followupDate === tomorrowDate;
        if (bottomFilter === 'Custom Date' && bottomCustomDate) return record.followupDate === bottomCustomDate;

        return true;
    }).filter(record => {
        return record.name.toLowerCase().includes(searchTerm.toLowerCase()) || record.leadId.toLowerCase().includes(searchTerm.toLowerCase());
    });

    // Calculate dynamic stats
    const totalKyc = kycData.length;
    const pendingKyc = kycData.filter(record => record.status === 'New' || record.status === 'Pending').length;
    const approvedKyc = kycData.filter(record => record.status === 'Completed').length;
    const overdueKyc = kycData.filter(record => record.status === 'Overdue').length;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-6">
                {/* Page Header with Breadcrumb */}
                <div className="mb-6">
                    <nav className="flex" aria-label="Breadcrumb">
                        <ol className="flex items-center space-x-2 text-sm">
                            <li>
                                <Link to="/franchiseeManager" className="text-blue-600 hover:text-blue-800">
                                    Franchisee onboarding
                                </Link>
                            </li>
                            <li>
                                <ChevronRight size={16} className="text-gray-400" />
                            </li>
                            <li className="text-gray-500 font-medium" aria-current="page">
                                Franchisee KYC
                            </li>
                        </ol>
                    </nav>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    {/* Toolbar */}
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-2">
                                {/* Add Button */}
                                {/* <button className="px-4 py-2 bg-[#0f4e8d] text-white rounded-full text-sm font-semibold hover:bg-[#0d3e70] transition-colors flex items-center">
                                    <Plus size={16} className="mr-1" />
                                    ADD
                                </button> */}

                                {/* District Filter Dropdown */}
                                <div className="relative">
                                    <select 
                                        className="px-4 py-2 border border-gray-300 rounded-full text-sm font-semibold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={selectedDistrict}
                                        onChange={(e) => setSelectedDistrict(e.target.value)}
                                    >
                                        <option value="">Districts</option>
                                        <option value="Rajkot">Rajkot</option>
                                        <option value="Tankara">Tankara</option>
                                        <option value="Chotila">Chotila</option>
                                    </select>
                                </div>

                                {/* Filter Button */}
                                <button
                                    onClick={toggleFilterModal}
                                    className="px-4 py-2 bg-[#0f4e8d] text-white rounded-full text-sm font-semibold hover:bg-[#0d3e70] transition-colors flex items-center"
                                >
                                    <Filter size={16} className="mr-1" />
                                    Filter
                                </button>

                                {/* Date Filter */}
                                <div className="relative">
                                    <input
                                        type="date"
                                        className="px-4 py-2 border border-gray-300 rounded-full text-sm font-semibold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={topDateFilter}
                                        onChange={(e) => setTopDateFilter(e.target.value)}
                                        title="Filter by Date"
                                    />
                                </div>

                                {/* Import Lead Button */}
                                {/* <button className="px-4 py-2 bg-[#0f4e8d] text-white rounded-full text-sm font-semibold hover:bg-[#0d3e70] transition-colors">
                                    Import Lead
                                </button> */}
                            </div>

                            {/* Search Bar */}
                            <div className="relative">
                                <div className="flex">
                                    <input
                                        type="search"
                                        placeholder="Search by here"
                                        className="px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    <button className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-lg bg-gray-50 hover:bg-gray-100">
                                        <Search size={18} className="text-gray-600" />
                                    </button>
                                    <button className="ml-2 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100">
                                        <RefreshCw size={18} className="text-gray-600" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filter Modal */}
                    {isFilterModalOpen && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-lg max-w-md w-full">
                                <div className="p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-semibold">Filter KYC Records</h3>
                                        <button
                                            onClick={toggleFilterModal}
                                            className="text-gray-500 hover:text-gray-700"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>

                                    {/* Location Filters */}
                                    <div className="mb-4">
                                        <LocationSelector
                                            values={locationFilters}
                                            onChange={setLocationFilters}
                                            layout="stack"
                                        />
                                    </div>

                                    {/* Date Range Dropdown */}
                                    <div className="mb-4">
                                        <label htmlFor="date-range" className="block text-sm font-medium text-gray-700 mb-1">
                                            Select Date Range
                                        </label>
                                        <select
                                            id="date-range"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={selectedDateRange}
                                            onChange={handleDateRangeChange}
                                        >
                                            <option value="today">Today</option>
                                            <option value="yesterday">Yesterday</option>
                                            <option value="last7">Last 7 Days</option>
                                            <option value="last15">Last 15 Days</option>
                                            <option value="lastMonth">Last Month</option>
                                            <option value="custom">Custom Range</option>
                                        </select>
                                    </div>

                                    {/* Custom Date Picker */}
                                    {selectedDateRange === 'custom' && (
                                        <div className="mb-4">
                                            <label htmlFor="custom-date" className="block text-sm font-medium text-gray-700 mb-1">
                                                Select Custom Date
                                            </label>
                                            <input
                                                type="date"
                                                id="custom-date"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                value={customDate}
                                                onChange={(e) => setCustomDate(e.target.value)}
                                            />
                                        </div>
                                    )}

                                    {/* KYC Status Dropdown */}
                                    <div className="mb-4">
                                        <label htmlFor="kyc-status" className="block text-sm font-medium text-gray-700 mb-1">
                                            KYC Status
                                        </label>
                                        <select
                                            id="kyc-status"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={selectedKycStatus}
                                            onChange={(e) => setSelectedKycStatus(e.target.value)}
                                        >
                                            <option value="">Choose Status</option>
                                            <option value="new">New</option>
                                            <option value="pending">Pending</option>
                                            <option value="overdue">Overdue</option>
                                        </select>
                                    </div>

                                    <div className="flex justify-end space-x-3 mt-6">
                                        <button
                                            onClick={toggleFilterModal}
                                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                                        >
                                            Close
                                        </button>
                                        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                                            Submit
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-[#0f4e8d]">
                                <tr>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                        Actions
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                        SrNo.
                                    </th>
                                    {/* <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                        Status
                                    </th> */}
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                        Lead Id
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                        Mobile No.
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                        Designation
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                        District
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                        Followup
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                        Signup
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredKycData.map((record) => (
                                    <tr key={record.id} className="hover:bg-gray-50">
                                        {/* Delete Action */}
                                        <td className="px-4 py-2 whitespace-nowrap">
                                            <button 
                                                onClick={() => handleDeleteLead(record.id)}
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-full transition-colors"
                                                title="Delete Record"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>

                                        {/* Data Cells */}
                                        <td className="px-4 py-2 whitespace-nowrap text-xs">{record.srNo}</td>
                                        {/* <td className="px-4 py-2 whitespace-nowrap">
                                            <span className={`px-3 py-1 ${getStatusBadge(record.status)} rounded-full text-xs font-semibold`}>
                                                {record.status}
                                            </span>
                                        </td> */}
                                        <td className="px-4 py-2 whitespace-nowrap text-xs">{record.leadId}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-xs font-medium text-gray-900">{record.name}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-xs">{record.mobile}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-xs">{record.designation}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-xs">{record.district}</td>
                                        <td className="px-4 py-2 whitespace-nowrap">
                                            <button className="px-3 py-1 bg-white border border-red-500 text-red-500 text-xs font-semibold rounded hover:bg-red-50 transition-colors">
                                                Followup
                                            </button>
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap">
                                            <Link to={`/franchisee-manager/my-task/franchisee-onboarding/kyc-process`}>
                                                <button className="px-3 py-1 bg-[#2c68a3] text-white text-xs font-semibold rounded hover:bg-[#1e4c7a] transition-colors">
                                                    Signup
                                                </button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination & Bottom Filters */}
                    <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex flex-col space-y-4">
                        {/* Followup Filters Section */}
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="text-sm font-semibold text-gray-700">Followups:</span>
                            {['All', 'Today', 'Tomorrow', 'Custom Date'].map(filter => (
                                filter !== 'Custom Date' ? (
                                    <button
                                        key={filter}
                                        onClick={() => {
                                            setBottomFilter(filter === 'All' ? '' : filter);
                                            setBottomCustomDate('');
                                        }}
                                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                                            (bottomFilter === filter || (filter === 'All' && !bottomFilter))
                                                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                        }`}
                                    >
                                        {filter}
                                    </button>
                                ) : (
                                    <div key={filter} className={`flex items-center rounded-full border overflow-hidden transition-colors ${
                                        bottomFilter === 'Custom Date' 
                                            ? 'border-blue-300 bg-blue-50' 
                                            : 'border-gray-200 bg-white hover:bg-gray-50'
                                    }`}>
                                        <span className={`px-3 py-1.5 text-xs font-semibold ${
                                            bottomFilter === 'Custom Date' ? 'text-blue-800 bg-blue-100' : 'text-gray-600 bg-gray-100'
                                        }`}>
                                            Date Filter
                                        </span>
                                        <input
                                            type="date"
                                            className="px-2 py-1 text-xs focus:outline-none bg-transparent text-gray-700 w-32"
                                            value={bottomCustomDate}
                                            onChange={(e) => {
                                                setBottomCustomDate(e.target.value);
                                                setBottomFilter('Custom Date');
                                            }}
                                            onClick={() => setBottomFilter('Custom Date')}
                                        />
                                    </div>
                                )
                            ))}
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="text-sm text-gray-700">
                                Showing <span className="font-medium">1-{filteredKycData.length}</span> of <span className="font-medium">{filteredKycData.length}</span> entries
                            </div>
                            <div className="flex items-center space-x-2">
                                <button className="px-3 py-1 border border-gray-300 rounded-md bg-white text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-50" disabled>
                                    <ChevronLeft size={16} />
                                </button>
                                <button className="px-3 py-1 border border-blue-600 rounded-md bg-blue-600 text-white text-sm">1</button>
                                <button className="px-3 py-1 border border-gray-300 rounded-md bg-white text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50" disabled>
                                    <ChevronRightIcon size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* KYC Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total KYC</p>
                                <p className="text-2xl font-bold text-gray-700">{totalKyc}</p>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-full">
                                <CheckCircle size={24} className="text-blue-600" />
                            </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">+12% from last month</div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Pending</p>
                                <p className="text-2xl font-bold text-orange-600">{pendingKyc}</p>
                            </div>
                            <div className="bg-orange-100 p-3 rounded-full">
                                <Clock size={24} className="text-orange-600" />
                            </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">28% of total</div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Approved</p>
                                <p className="text-2xl font-bold text-green-600">{approvedKyc}</p>
                            </div>
                            <div className="bg-green-100 p-3 rounded-full">
                                <CheckCircle size={24} className="text-green-600" />
                            </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">57% approval rate</div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Overdue</p>
                                <p className="text-2xl font-bold text-red-600">{overdueKyc}</p>
                            </div>
                            <div className="bg-red-100 p-3 rounded-full">
                                <AlertCircle size={24} className="text-red-600" />
                            </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">Requires attention</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FranchiseeManagerKYC;