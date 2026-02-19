import React, { useState, useEffect } from 'react';
import Chart from 'react-apexcharts';
import {
  ShoppingBag,
  IndianRupee,
  AlertCircle,
  Filter,
  Calendar,
  Package,
  Building,
  Handshake,
  Eye,
  Download,
  MapPin,
  X,
  Users,
  TrendingUp,
  Banknote,
  CheckCircle
} from 'lucide-react';
import { useLocations } from '../../../hooks/useLocations';
import { getLoanApplications, getLoanStats } from '../../../services/loanApi';

function Badge({ tone = 'gray', children, className = '' }) {
  const map = {
    green: 'bg-green-100 text-green-800 border-green-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    gray: 'bg-gray-100 text-gray-800 border-gray-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    primary: 'bg-blue-100 text-blue-800 border-blue-200',
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    danger: 'bg-red-100 text-red-800 border-red-200',
    secondary: 'bg-gray-100 text-gray-800 border-gray-200',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md border text-xs font-semibold ${map[tone] || map.gray} ${className}`}>
      {children}
    </span>
  );
}

export default function OrdersByLoanDashboard() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('bank-loans');
  const [locationVisible, setLocationVisible] = useState(true);
  const [selectedStateId, setSelectedStateId] = useState('');
  const [selectedClusterId, setSelectedClusterId] = useState('');
  const [showClusters, setShowClusters] = useState(false);

  const [filters, setFilters] = useState({
    timeline: '',
    quarter: '',
    category: '',
    subcategory: '',
    projectType: '',
    subType: '',
  });

  const [bankFranchiseeFilter, setBankFranchiseeFilter] = useState('');
  const [privateFranchiseeFilter, setPrivateFranchiseeFilter] = useState('');

  const [bankLoansData, setBankLoansData] = useState([]);
  const [privateLoansData, setPrivateLoansData] = useState([]);
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalLoanAmount: 0,
    totalDisbursed: 0,
    overdue: 0
  });

  const { states, clusters, fetchClusters } = useLocations();
  const selectedState = states.find((s) => s._id === selectedStateId) || null;
  const selectedCluster = clusters.find((c) => c._id === selectedClusterId) || null;

  // Summary calculations
  const totalFiles = stats.totalFiles;
  const totalLoanAmount = stats.totalLoanAmount;
  const totalDisbursed = stats.totalDisbursed;
  const disbursedPercentage = totalLoanAmount > 0 ? Math.round((totalDisbursed / totalLoanAmount) * 100) : 0;
  const overdueCount = stats.overdue;

  // Get status class
  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'active':
      case 'disbursed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected':
      case 'closed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Format number with commas
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-IN', options);
  };

  // Handle state selection
  const handleStateSelect = (stateId) => {
    setSelectedStateId(stateId);
    setSelectedClusterId('');
    setShowClusters(true);
  };

  // Handle cluster selection
  const handleClusterSelect = (clusterId) => {
    setSelectedClusterId(clusterId);
  };

  useEffect(() => {
    if (selectedStateId) {
      fetchClusters({ stateId: selectedStateId });
    }
  }, [selectedStateId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const queryParams = {
        state: selectedStateId,
        cluster: selectedClusterId,
        timeline: filters.timeline,
        category: filters.category,
        projectType: filters.projectType
      };

      const statsRes = await getLoanStats(queryParams);
      if (statsRes.success) {
        setStats(statsRes.data);
      }

      const loansRes = await getLoanApplications({
        ...queryParams,
        loanType: activeTab === 'bank-loans' ? 'bank' : 'private'
      });

      if (loansRes.success) {
        if (activeTab === 'bank-loans') {
          setBankLoansData(loansRes.data);
        } else {
          setPrivateLoansData(loansRes.data);
        }
      }
    } catch (err) {
      console.error('Error fetching loan data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, selectedStateId, selectedClusterId, filters.timeline, filters.category, filters.projectType]);

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedStateId('');
    setSelectedClusterId('');
    setShowClusters(false);
    setFilters({
      timeline: '',
      quarter: '',
      category: '',
      subcategory: '',
      projectType: '',
      subType: '',
    });
    setBankFranchiseeFilter('');
    setPrivateFranchiseeFilter('');
  };

  // Get progress bar color
  const getProgressBarColor = (percentage) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // View loan details
  const viewLoanDetails = (type, id) => {
    alert(`View ${type} loan details for ID: ${id}`);
  };

  // Export table
  const exportTable = (type) => {
    alert(`Exporting ${type} table data`);
  };

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="mb-4">
        <nav className="breadcrumb bg-white p-3 rounded shadow-sm">
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-3">
              <Banknote className="h-6 w-6 text-blue-600" />
              <h3 className="text-xl font-bold text-blue-600 mb-0">Order by Loan Dashboard</h3>
            </div>
            <div className="flex space-x-2">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Franchisee Order
              </button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Dealer Order
              </button>
            </div>
          </div>
        </nav>
      </div>

      {/* Location Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            <h5 className="font-semibold text-gray-800">Location Selection</h5>
          </div>
          <button
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            onClick={() => setLocationVisible(!locationVisible)}
          >
            {locationVisible ? (
              <>
                <Eye className="h-4 w-4" />
                Hide
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                Show
              </>
            )}
          </button>
        </div>

        {locationVisible && (
          <div className="p-4">
            {/* State Selection */}
            <div className="mb-6">
              <h6 className="font-medium text-gray-700 mb-3">Select State</h6>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {states.length > 0 ? states.map((state) => (
                  <div
                    key={state._id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${selectedStateId === state._id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                    onClick={() => handleStateSelect(state._id)}
                  >
                    <h6 className="font-bold text-center mb-1">{state.name}</h6>
                    <small className="text-gray-500 text-center block">{state.code || '-'}</small>
                  </div>
                )) : (
                  <div className="col-span-full p-4 rounded-lg border border-gray-200 text-center text-gray-500 bg-white">
                    No states available.
                  </div>
                )}
              </div>
            </div>

            {/* Cluster Selection */}
            {showClusters && selectedStateId && (
              <div className="mb-4">
                <h6 className="font-medium text-gray-700 mb-3">Select Cluster</h6>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {clusters.length > 0 ? (
                    clusters.map((cluster) => (
                      <div
                        key={cluster._id}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${selectedClusterId === cluster._id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                        onClick={() => handleClusterSelect(cluster._id)}
                      >
                        <h6 className="font-bold text-center mb-1">{cluster.name}</h6>
                        <small className="text-gray-500 text-center block">{selectedState?.name || ''}</small>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full p-4 rounded-lg border border-gray-200 text-center text-gray-500 bg-white">
                      No clusters available.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Other Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="relative">
          <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <select
            className="w-full pl-10 p-3 border border-gray-300 rounded-lg bg-white text-sm"
            value={filters.timeline}
            onChange={(e) => setFilters({ ...filters, timeline: e.target.value })}
          >
            <option value="" disabled className="text-gray-400">Select Timeline</option>
            <option value="lastweek">Last Week</option>
            <option value="lastmonth">Last Month</option>
            <option value="last3month">Last 3 Month</option>
            <option value="last6month">Last 6 Month</option>
          </select>
        </div>

        <div className="relative">
          <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <select
            className="w-full pl-10 p-3 border border-gray-300 rounded-lg bg-white text-sm"
            value={filters.quarter}
            onChange={(e) => setFilters({ ...filters, quarter: e.target.value })}
          >
            <option value="" disabled className="text-gray-400">Select Quarter</option>
            <option value="Q1">Q1 (Jan - Mar)</option>
            <option value="Q2">Q2 (Apr - Jun)</option>
            <option value="Q3">Q3 (Jul - Sep)</option>
            <option value="Q4">Q4 (Oct - Dec)</option>
          </select>
        </div>

        <div className="relative">
          <Package className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <select
            className="w-full pl-10 p-3 border border-gray-300 rounded-lg bg-white text-sm"
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          >
            <option value="" disabled className="text-gray-400">Select Category</option>
            <option value="solarpanel">Solar Panel</option>
            <option value="rooftop">Solar Rooftop</option>
            <option value="streetlight">Solar Street Light</option>
            <option value="solarpump">Solar Pump</option>
          </select>
        </div>

        <div className="relative">
          <Package className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <select
            className="w-full pl-10 p-3 border border-gray-300 rounded-lg bg-white text-sm"
            value={filters.subcategory}
            onChange={(e) => setFilters({ ...filters, subcategory: e.target.value })}
          >
            <option value="" disabled className="text-gray-400">Select Sub Category</option>
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
          </select>
        </div>

        <div className="relative">
          <Package className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <select
            className="w-full pl-10 p-3 border border-gray-300 rounded-lg bg-white text-sm"
            value={filters.projectType}
            onChange={(e) => setFilters({ ...filters, projectType: e.target.value })}
          >
            <option value="" disabled className="text-gray-400">Select Project Type</option>
            <option value="above3kw">Above 3KW</option>
            <option value="below3kw">Below 3KW</option>
          </select>
        </div>

        <div className="relative">
          <Package className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <select
            className="w-full pl-10 p-3 border border-gray-300 rounded-lg bg-white text-sm"
            value={filters.subType}
            onChange={(e) => setFilters({ ...filters, subType: e.target.value })}
          >
            <option value="" disabled>Select Sub Type</option>
            <option value="ongrid">On-Grid</option>
            <option value="offgrid">Off-Grid</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
      </div>

      {/* Active Filters */}
      <div className="bg-white rounded-lg shadow-sm border-l-4 border-blue-400 mb-4 p-4">
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedState && (
            <Badge tone="primary" className="flex items-center gap-1">
              State: {selectedState.name}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedStateId('')} />
            </Badge>
          )}
          {selectedCluster && (
            <Badge tone="success" className="flex items-center gap-1">
              Cluster: {selectedCluster.name}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedClusterId('')} />
            </Badge>
          )}
          {filters.timeline && (
            <Badge tone="warning" className="flex items-center gap-1">
              Timeline: {filters.timeline}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setFilters({ ...filters, timeline: '' })} />
            </Badge>
          )}
          {filters.quarter && (
            <Badge tone="info" className="flex items-center gap-1">
              Quarter: {filters.quarter}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setFilters({ ...filters, quarter: '' })} />
            </Badge>
          )}
        </div>
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">Applied Filters</div>
          <button
            className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
            onClick={clearAllFilters}
          >
            <X className="h-4 w-4" />
            Clear All
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* TOTAL Files Card */}
        <div className="bg-white rounded-lg shadow-sm border-l-4 border-blue-500">
          <div className="p-4">
            <div className="flex justify-between items-center mb-2">
              <h6 className="text-gray-500 text-sm font-medium">TOTAL Files</h6>
              <ShoppingBag className="h-5 w-5 text-blue-500" />
            </div>
            <h3 className="text-2xl font-bold mb-3" id="totalFiles">{totalFiles}</h3>
          </div>
        </div>

        {/* TOTAL Loan Amount Card */}
        <div className="bg-white rounded-lg shadow-sm border-l-4 border-green-500">
          <div className="p-4">
            <div className="flex justify-between items-center mb-2">
              <h6 className="text-gray-500 text-sm font-medium">TOTAL Loan Amount</h6>
              <IndianRupee className="h-5 w-5 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold mb-0">₹{formatNumber(totalLoanAmount)}</h3>
          </div>
        </div>

        {/* Total Disbursed Card */}
        <div className="bg-white rounded-lg shadow-sm border-l-4 border-yellow-500">
          <div className="p-4">
            <div className="flex justify-between items-center mb-2">
              <h6 className="text-gray-500 text-sm font-medium">Total Disbursed</h6>
              <TrendingUp className="h-5 w-5 text-yellow-500" />
            </div>
            <h3 className="text-2xl font-bold mb-0">₹{formatNumber(totalDisbursed)}</h3>
            <small className="text-gray-500">({disbursedPercentage}%)</small>
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${getProgressBarColor(disbursedPercentage)}`}
                  style={{ width: `${disbursedPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Overdue Card */}
        <div className="bg-white rounded-lg shadow-sm border-l-4 border-red-500">
          <div className="p-4">
            <div className="flex justify-between items-center mb-2">
              <h6 className="text-gray-500 text-sm font-medium">Overdue</h6>
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <h3 className="text-2xl font-bold mb-0">{overdueCount}</h3>
          </div>
        </div>
      </div>

      {/* Loan Type Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        {/* Tabs Header */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              className={`px-6 py-3 text-sm font-medium border-b-2 ${activeTab === 'bank-loans' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('bank-loans')}
            >
              <Building className="h-4 w-4 inline mr-2" />
              Bank Loans
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium border-b-2 ${activeTab === 'private-loans' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('private-loans')}
            >
              <Handshake className="h-4 w-4 inline mr-2" />
              Private Loans
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {activeTab === 'bank-loans' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-blue-600" />
                  <h5 className="font-semibold text-gray-800">Bank Loan Applications</h5>
                </div>
                <button
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  onClick={() => exportTable('bank')}
                >
                  <Download className="h-4 w-4" />
                  Export
                </button>
              </div>

              {/* Franchisee Filter */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Franchisee</label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-lg bg-white text-sm"
                    value={bankFranchiseeFilter}
                    onChange={(e) => setBankFranchiseeFilter(e.target.value)}
                  >
                    <option value="">All Franchisees</option>
                    <option value="Solar Tech Solutions">Solar Tech Solutions</option>
                    <option value="Green Energy Corp">Green Energy Corp</option>
                    <option value="Sun Power Enterprises">Sun Power Enterprises</option>
                    <option value="Eco Solar Solutions">Eco Solar Solutions</option>
                  </select>
                </div>
              </div>

              {/* Bank Loans Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 font-semibold text-gray-700">Sr No.</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Franchisee Name</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Customer Name</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Bank Name</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Loan Amount (₹)</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Disbursed Amount (₹)</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Disbursed %</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Application Date</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Status</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bankLoansData.length > 0 ? bankLoansData.map((loan, index) => {
                      const disbursedPercentage = Math.round((loan.disbursedAmount / loan.loanAmount) * 100);
                      return (
                        <tr key={loan._id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-3">{index + 1}</td>
                          <td className="p-3 font-medium text-gray-900">{loan.franchisee?.name || 'N/A'}</td>
                          <td className="p-3 text-gray-700">{loan.customerName}</td>
                          <td className="p-3 text-gray-700">{loan.bankName || '-'}</td>
                          <td className="p-3 text-gray-700">₹{formatNumber(loan.loanAmount)}</td>
                          <td className="p-3 text-gray-700">₹{formatNumber(loan.disbursedAmount)}</td>
                          <td className="p-3">
                            <div className="flex items-center">
                              <span className="mr-2">{disbursedPercentage}%</span>
                              <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full ${getProgressBarColor(disbursedPercentage)}`}
                                  style={{ width: `${disbursedPercentage}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-gray-700">{formatDate(loan.applicationDate)}</td>
                          <td className="p-3">
                            <Badge tone={loan.status === 'Approved' ? 'success' :
                              loan.status === 'Pending' ? 'warning' :
                                loan.status === 'Rejected' ? 'danger' : 'gray'}>
                              {loan.status}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <button
                              className="text-blue-600 hover:text-blue-800"
                              onClick={() => viewLoanDetails('bank', loan.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan="10" className="p-8 text-center text-gray-500 bg-white">
                          No bank loan applications found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'private-loans' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <Handshake className="h-5 w-5 text-green-600" />
                  <h5 className="font-semibold text-gray-800">Private Loan Applications</h5>
                </div>
                <button
                  className="text-sm text-green-600 hover:text-green-800 flex items-center gap-1"
                  onClick={() => exportTable('private')}
                >
                  <Download className="h-4 w-4" />
                  Export
                </button>
              </div>

              {/* Franchisee Filter */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Franchisee</label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-lg bg-white text-sm"
                    value={privateFranchiseeFilter}
                    onChange={(e) => setPrivateFranchiseeFilter(e.target.value)}
                  >
                    <option value="">All Franchisees</option>
                    <option value="Solar Tech Solutions">Solar Tech Solutions</option>
                    <option value="Green Energy Corp">Green Energy Corp</option>
                    <option value="Sun Power Enterprises">Sun Power Enterprises</option>
                    <option value="Eco Solar Solutions">Eco Solar Solutions</option>
                  </select>
                </div>
              </div>

              {/* Private Loans Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 font-semibold text-gray-700">Sr No.</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Franchisee Name</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Lender Type</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Customer Name</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Lender Name</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Loan Amount (₹)</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Disbursed Amount (₹)</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Interest Rate</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Tenure (Months)</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Application Date</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Status</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {privateLoansData.length > 0 ? privateLoansData.map((loan, index) => {
                      const disbursedPercentage = Math.round((loan.disbursedAmount / loan.loanAmount) * 100);
                      return (
                        <tr key={loan._id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-3">{index + 1}</td>
                          <td className="p-3 font-medium text-gray-900">{loan.franchisee?.name || 'N/A'}</td>
                          <td className="p-3 text-gray-700">{loan.lenderType}</td>
                          <td className="p-3 text-gray-700">{loan.customerName}</td>
                          <td className="p-3 text-gray-700">{loan.lenderName}</td>
                          <td className="p-3 text-gray-700">₹{formatNumber(loan.loanAmount)}</td>
                          <td className="p-3 text-gray-700">₹{formatNumber(loan.disbursedAmount)}</td>
                          <td className="p-3 text-gray-700">{loan.interestRate}</td>
                          <td className="p-3 text-gray-700">{loan.tenure}</td>
                          <td className="p-3 text-gray-700">{formatDate(loan.applicationDate)}</td>
                          <td className="p-3">
                            <Badge tone={loan.status === 'Active' ? 'success' :
                              loan.status === 'Pending' ? 'warning' : 'gray'}>
                              {loan.status}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <button
                              className="text-blue-600 hover:text-blue-800"
                              onClick={() => viewLoanDetails('private', loan.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan="12" className="p-8 text-center text-gray-500 bg-white">
                          No private loan applications found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}