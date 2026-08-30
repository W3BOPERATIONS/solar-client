import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  RefreshCw, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  CreditCard, 
  Share2, 
  ExternalLink, 
  Eye, 
  Building2, 
  MapPin, 
  X,
  ChevronDown,
  ArrowUpDown,
  Download
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PerformaInvoice() {
  // Initial dataset for PIs
  const [piList, setPiList] = useState([
    {
      id: 1,
      piNumber: 'PI-2026-0042',
      orderNumber: 'ORD-9841',
      orderType: 'PO Order',
      poNumber: 'PO-GUJ-2026-88',
      poValidity: '2026-10-31',
      buyerName: 'SunSolar EPC Solutions Pvt Ltd',
      buyerGst: '24AAACS1423N1Z5',
      isRegularBuyer: true,
      district: 'Ahmedabad',
      projectType: 'Residential Subsidy',
      capacity: '5 KW',
      productType: 'Solarkit',
      numberOfKits: 1,
      piDate: '2026-08-28',
      piValidity: '2026-09-15',
      basicAmount: 220000,
      gstAmount: 39600,
      totalPiAmount: 259600,
      amountReceived: 259600,
      balanceAmount: 0,
      paymentStatus: 'Payment Received',
      orderStatus: 'Order Confirmed',
      deliveryStatus: 'Delivery Plan Created',
      utrNumber: 'GATEWAY-TXN-884219'
    },
    {
      id: 2,
      piNumber: 'PI-2026-0043',
      orderNumber: 'ORD-9842',
      orderType: 'One Order',
      poNumber: 'N/A',
      poValidity: 'N/A',
      buyerName: 'Gujarat Green Energy EPC',
      buyerGst: '24BBBCS2345M1Z8',
      isRegularBuyer: false,
      district: 'Surat',
      projectType: 'Commercial',
      capacity: '15 KW',
      productType: 'Solarkit',
      numberOfKits: 3,
      piDate: '2026-08-29',
      piValidity: '2026-09-20',
      basicAmount: 650000,
      gstAmount: 117000,
      totalPiAmount: 767000,
      amountReceived: 300000,
      balanceAmount: 467000,
      paymentStatus: 'Partially Paid',
      orderStatus: 'Order Confirmed',
      deliveryStatus: 'Order Confirmed',
      utrNumber: 'UTR-HDFC-991204'
    },
    {
      id: 3,
      piNumber: 'PI-2026-0044',
      orderNumber: 'ORD-9843',
      orderType: 'PO Order',
      poNumber: 'PO-GUJ-2026-90',
      poValidity: '2026-09-02', // Expiring PO soon
      buyerName: 'Adani Solar EPC',
      buyerGst: '24CCCCS3456L1Z2',
      isRegularBuyer: true,
      district: 'Vadodara',
      projectType: 'Industrial',
      capacity: '50 KW',
      productType: 'BOSKit',
      numberOfKits: 5,
      piDate: '2026-08-15',
      piValidity: '2026-09-01', // Expiring PI soon
      basicAmount: 1800000,
      gstAmount: 324000,
      totalPiAmount: 2124000,
      amountReceived: 0,
      balanceAmount: 2124000,
      paymentStatus: 'Payment Pending',
      orderStatus: 'Pending Payment',
      deliveryStatus: 'Order Created',
      utrNumber: '-'
    },
    {
      id: 4,
      piNumber: 'PI-2026-0045',
      orderNumber: 'ORD-9844',
      orderType: 'One Order',
      poNumber: 'N/A',
      poValidity: 'N/A',
      buyerName: 'Rajkot Renewable Systems',
      buyerGst: '24DDDCS4567K1Z4',
      isRegularBuyer: true,
      district: 'Rajkot',
      projectType: 'Residential',
      capacity: '3 KW',
      productType: 'Other approved products',
      numberOfKits: 1,
      piDate: '2026-08-01',
      piValidity: '2026-08-25', // Expired PI
      basicAmount: 140000,
      gstAmount: 25200,
      totalPiAmount: 165200,
      amountReceived: 0,
      balanceAmount: 165200,
      paymentStatus: 'Payment Overdue',
      orderStatus: 'Payment Overdue',
      deliveryStatus: 'Order Created',
      utrNumber: '-'
    }
  ]);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBuyerFilter, setSelectedBuyerFilter] = useState('All');
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState('All');
  const [selectedProjectTypeFilter, setSelectedProjectTypeFilter] = useState('All');
  const [selectedProductFilter, setSelectedProductFilter] = useState('All');
  const [selectedOrderTypeFilter, setSelectedOrderTypeFilter] = useState('All');
  const [selectedPaymentStatusFilter, setSelectedPaymentStatusFilter] = useState('All');
  const [selectedValidityFilter, setSelectedValidityFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // UTR Modal State
  const [isUtrModalOpen, setIsUtrModalOpen] = useState(false);
  const [selectedPiForUtr, setSelectedPiForUtr] = useState(null);
  const [utrInput, setUtrInput] = useState('');
  const [receivedAmountInput, setReceivedAmountInput] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Calculate Dashboard KPI Counters
  const dashboardStats = useMemo(() => {
    const totalOrders = piList.length;
    const totalPI = piList.length;
    let paymentPendingCount = 0;
    let paymentPendingAmount = 0;
    let partiallyPaidCount = 0;
    let paymentReceivedCount = 0;
    let paymentOverdueCount = 0;
    let poExpiringSoonCount = 0;
    let piExpiringSoonCount = 0;

    const today = new Date('2026-08-30');

    piList.forEach(item => {
      if (item.paymentStatus === 'Payment Pending') {
        paymentPendingCount++;
        paymentPendingAmount += item.balanceAmount;
      } else if (item.paymentStatus === 'Partially Paid') {
        partiallyPaidCount++;
      } else if (item.paymentStatus === 'Payment Received') {
        paymentReceivedCount++;
      } else if (item.paymentStatus === 'Payment Overdue') {
        paymentOverdueCount++;
      }

      // Check PO Validity Expiring Soon (within 7 days)
      if (item.poValidity && item.poValidity !== 'N/A') {
        const poDate = new Date(item.poValidity);
        const diffDays = Math.ceil((poDate - today) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= 7) {
          poExpiringSoonCount++;
        }
      }

      // Check PI Validity Expiring Soon (within 7 days)
      if (item.piValidity) {
        const piDate = new Date(item.piValidity);
        const diffDays = Math.ceil((piDate - today) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= 7) {
          piExpiringSoonCount++;
        }
      }
    });

    return {
      totalOrders,
      totalPI,
      paymentPendingCount,
      paymentPendingAmount,
      partiallyPaidCount,
      paymentReceivedCount,
      paymentOverdueCount,
      poExpiringSoonCount,
      piExpiringSoonCount
    };
  }, [piList]);

  // Filter Logic
  const filteredPiList = useMemo(() => {
    const today = new Date('2026-08-30');

    return piList.filter(item => {
      // Global Search Term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesSearch = 
          item.piNumber.toLowerCase().includes(term) ||
          item.orderNumber.toLowerCase().includes(term) ||
          item.buyerName.toLowerCase().includes(term) ||
          item.buyerGst.toLowerCase().includes(term) ||
          (item.poNumber && item.poNumber.toLowerCase().includes(term));
        if (!matchesSearch) return false;
      }

      // Buyer Filter
      if (selectedBuyerFilter !== 'All' && item.buyerName !== selectedBuyerFilter) {
        return false;
      }

      // District Filter
      if (selectedDistrictFilter !== 'All' && item.district !== selectedDistrictFilter) {
        return false;
      }

      // Project Type Filter
      if (selectedProjectTypeFilter !== 'All' && item.projectType !== selectedProjectTypeFilter) {
        return false;
      }

      // Product Filter
      if (selectedProductFilter !== 'All' && item.productType !== selectedProductFilter) {
        return false;
      }

      // Order Type Filter
      if (selectedOrderTypeFilter !== 'All' && item.orderType !== selectedOrderTypeFilter) {
        return false;
      }

      // Payment Status Filter
      if (selectedPaymentStatusFilter !== 'All' && item.paymentStatus !== selectedPaymentStatusFilter) {
        return false;
      }

      // Validity Filter
      if (selectedValidityFilter !== 'All') {
        if (selectedValidityFilter === 'Expiring PO') {
          if (!item.poValidity || item.poValidity === 'N/A') return false;
          const diffDays = Math.ceil((new Date(item.poValidity) - today) / (1000 * 60 * 60 * 24));
          if (diffDays < 0 || diffDays > 7) return false;
        } else if (selectedValidityFilter === 'Expired PO') {
          if (!item.poValidity || item.poValidity === 'N/A') return false;
          if (new Date(item.poValidity) >= today) return false;
        } else if (selectedValidityFilter === 'Expiring PI') {
          const diffDays = Math.ceil((new Date(item.piValidity) - today) / (1000 * 60 * 60 * 24));
          if (diffDays < 0 || diffDays > 7) return false;
        } else if (selectedValidityFilter === 'Expired PI') {
          if (new Date(item.piValidity) >= today) return false;
        }
      }

      // Date Range Filter
      if (startDate && new Date(item.piDate) < new Date(startDate)) return false;
      if (endDate && new Date(item.piDate) > new Date(endDate)) return false;

      return true;
    });
  }, [
    piList, 
    searchTerm, 
    selectedBuyerFilter, 
    selectedDistrictFilter, 
    selectedProjectTypeFilter, 
    selectedProductFilter, 
    selectedOrderTypeFilter, 
    selectedPaymentStatusFilter, 
    selectedValidityFilter,
    startDate,
    endDate
  ]);

  // Open Manual UTR Entry Modal
  const handleOpenUtrModal = (item) => {
    setSelectedPiForUtr(item);
    setUtrInput('');
    setReceivedAmountInput(item.balanceAmount || '');
    setIsUtrModalOpen(true);
  };

  // Submit Manual UTR Entry
  const handleSaveUtr = () => {
    if (!utrInput.trim()) {
      alert('Please enter a valid UTR Number');
      return;
    }

    const payAmount = parseFloat(receivedAmountInput) || 0;
    if (payAmount <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    setPiList(prev => prev.map(item => {
      if (item.id === selectedPiForUtr.id) {
        const newReceived = item.amountReceived + payAmount;
        const newBalance = Math.max(0, item.totalPiAmount - newReceived);
        let newPaymentStatus = 'Partially Paid';
        if (newBalance === 0) {
          newPaymentStatus = 'Payment Received';
        }

        return {
          ...item,
          amountReceived: newReceived,
          balanceAmount: newBalance,
          paymentStatus: newPaymentStatus,
          orderStatus: newBalance === 0 ? 'Order Confirmed' : item.orderStatus,
          utrNumber: utrInput
        };
      }
      return item;
    }));

    setIsUtrModalOpen(false);
    setToastMessage(`Payment of ₹${payAmount.toLocaleString('en-IN')} updated with UTR ${utrInput}!`);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedBuyerFilter('All');
    setSelectedDistrictFilter('All');
    setSelectedProjectTypeFilter('All');
    setSelectedProductFilter('All');
    setSelectedOrderTypeFilter('All');
    setSelectedPaymentStatusFilter('All');
    setSelectedValidityFilter('All');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="p-6 bg-[#f8f9fa] min-h-screen space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-700 text-white text-sm font-semibold px-6 py-3 rounded-lg shadow-xl animate-fade-in flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
            <Building2 size={14} />
            <span>Accounts Login — Gujarat State Business</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Performa Invoice (PI) Module
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Main payment tracking, PO validity & PI management dashboard
          </p>
        </div>

        <button
          onClick={handleResetFilters}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold px-4 py-2 rounded-lg border border-gray-300 transition flex items-center gap-1.5"
        >
          <RefreshCw size={14} />
          Reset All Filters
        </button>
      </div>

      {/* Accounts Dashboard KPI Cards (Section 7) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Total Orders</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{dashboardStats.totalOrders}</p>
          <span className="text-[10px] text-gray-400 font-medium">Solarkit orders</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">Total PI</p>
          <p className="text-xl font-bold text-blue-700 mt-1">{dashboardStats.totalPI}</p>
          <span className="text-[10px] text-gray-400 font-medium">Generated PIs</span>
        </div>

        <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200 shadow-sm hover:shadow-md transition">
          <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">Payment Pending</p>
          <p className="text-xl font-bold text-amber-800 mt-1">{dashboardStats.paymentPendingCount}</p>
          <span className="text-[10px] text-amber-600 font-medium">₹{(dashboardStats.paymentPendingAmount / 100000).toFixed(1)}L Awaiting</span>
        </div>

        <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-200 shadow-sm hover:shadow-md transition">
          <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wide">Partially Paid</p>
          <p className="text-xl font-bold text-blue-800 mt-1">{dashboardStats.partiallyPaidCount}</p>
          <span className="text-[10px] text-blue-600 font-medium">Balance orders</span>
        </div>

        <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200 shadow-sm hover:shadow-md transition">
          <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">Payment Received</p>
          <p className="text-xl font-bold text-emerald-800 mt-1">{dashboardStats.paymentReceivedCount}</p>
          <span className="text-[10px] text-emerald-600 font-medium">Fully paid</span>
        </div>

        <div className="bg-rose-50/60 p-3.5 rounded-xl border border-rose-200 shadow-sm hover:shadow-md transition">
          <p className="text-[10px] font-bold text-rose-700 uppercase tracking-wide">Payment Overdue</p>
          <p className="text-xl font-bold text-rose-800 mt-1">{dashboardStats.paymentOverdueCount}</p>
          <span className="text-[10px] text-rose-600 font-medium">Beyond due date</span>
        </div>

        <div className="bg-purple-50/60 p-3.5 rounded-xl border border-purple-200 shadow-sm hover:shadow-md transition">
          <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wide">PO Expiring Soon</p>
          <p className="text-xl font-bold text-purple-800 mt-1">{dashboardStats.poExpiringSoonCount}</p>
          <span className="text-[10px] text-purple-600 font-medium">Approaching validity</span>
        </div>

        <div className="bg-orange-50/60 p-3.5 rounded-xl border border-orange-200 shadow-sm hover:shadow-md transition">
          <p className="text-[10px] font-bold text-orange-700 uppercase tracking-wide">PI Expiring Soon</p>
          <p className="text-xl font-bold text-orange-800 mt-1">{dashboardStats.piExpiringSoonCount}</p>
          <span className="text-[10px] text-orange-600 font-medium">Approaching validity</span>
        </div>
      </div>

      {/* Comprehensive Filter Panel (Section 6) */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center space-x-2 text-gray-800 font-bold text-sm">
            <Filter size={16} className="text-blue-600" />
            <span>Performa Invoice Filters</span>
          </div>
          <span className="text-xs text-gray-500 font-medium">
            Showing <strong className="text-blue-600">{filteredPiList.length}</strong> of {piList.length} PIs
          </span>
        </div>

        {/* Global Search Bar */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by PI Number, Order Number, Buyer Name, GST, or PO Number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50/50"
          />
        </div>

        {/* Multi-Select Filters */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          
          {/* Buyer Filter */}
          <div>
            <label className="text-[10px] text-gray-500 font-semibold mb-1 block">Buyer Filter</label>
            <select
              value={selectedBuyerFilter}
              onChange={(e) => setSelectedBuyerFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white text-gray-700 focus:ring-1 focus:ring-blue-400"
            >
              <option value="All">All Buyers</option>
              <option value="SunSolar EPC Solutions Pvt Ltd">SunSolar EPC</option>
              <option value="Gujarat Green Energy EPC">Gujarat Green EPC</option>
              <option value="Adani Solar EPC">Adani Solar EPC</option>
              <option value="Rajkot Renewable Systems">Rajkot Renewable</option>
            </select>
          </div>

          {/* Location / District Filter */}
          <div>
            <label className="text-[10px] text-gray-500 font-semibold mb-1 block">District Location</label>
            <select
              value={selectedDistrictFilter}
              onChange={(e) => setSelectedDistrictFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white text-gray-700 focus:ring-1 focus:ring-blue-400"
            >
              <option value="All">All Districts</option>
              <option value="Ahmedabad">Ahmedabad</option>
              <option value="Surat">Surat</option>
              <option value="Vadodara">Vadodara</option>
              <option value="Rajkot">Rajkot</option>
            </select>
          </div>

          {/* Product Filter */}
          <div>
            <label className="text-[10px] text-gray-500 font-semibold mb-1 block">Product Filter</label>
            <select
              value={selectedProductFilter}
              onChange={(e) => setSelectedProductFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white text-gray-700 focus:ring-1 focus:ring-blue-400"
            >
              <option value="All">All Products</option>
              <option value="Solarkit">Solarkit</option>
              <option value="BOSKit">BOSKit</option>
              <option value="Other approved products">Other Products</option>
            </select>
          </div>

          {/* Order Type Filter */}
          <div>
            <label className="text-[10px] text-gray-500 font-semibold mb-1 block">Order Type</label>
            <select
              value={selectedOrderTypeFilter}
              onChange={(e) => setSelectedOrderTypeFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white text-gray-700 focus:ring-1 focus:ring-blue-400"
            >
              <option value="All">All Order Types</option>
              <option value="PO Order">PO Order</option>
              <option value="One Order">One Order</option>
            </select>
          </div>

          {/* Payment Filter */}
          <div>
            <label className="text-[10px] text-gray-500 font-semibold mb-1 block">Payment Status</label>
            <select
              value={selectedPaymentStatusFilter}
              onChange={(e) => setSelectedPaymentStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white text-gray-700 focus:ring-1 focus:ring-blue-400"
            >
              <option value="All">All Payment Status</option>
              <option value="Payment Pending">Payment Pending</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Payment Received">Payment Received</option>
              <option value="Payment Overdue">Payment Overdue</option>
            </select>
          </div>

          {/* Validity Filter */}
          <div>
            <label className="text-[10px] text-gray-500 font-semibold mb-1 block">Validity Filter</label>
            <select
              value={selectedValidityFilter}
              onChange={(e) => setSelectedValidityFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white text-gray-700 focus:ring-1 focus:ring-blue-400"
            >
              <option value="All">All Validity</option>
              <option value="Expiring PO">PO Expiring Soon</option>
              <option value="Expired PO">PO Expired</option>
              <option value="Expiring PI">PI Expiring Soon</option>
              <option value="Expired PI">PI Expired</option>
            </select>
          </div>

          {/* Date Filter Range */}
          <div>
            <label className="text-[10px] text-gray-500 font-semibold mb-1 block">PI Date Range</label>
            <div className="flex space-x-1">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded px-1 py-1 text-[10px]"
              />
            </div>
          </div>

        </div>
      </div>

      {/* Main Performa Invoice Table (Section 3) */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#145a80] text-white font-semibold">
              <tr>
                <th className="px-3 py-3">PI Number / Order No</th>
                <th className="px-3 py-3">Buyer & GST Details</th>
                <th className="px-3 py-3">Type & Validity</th>
                <th className="px-3 py-3">Project & Location</th>
                <th className="px-3 py-3">Product / Kits</th>
                <th className="px-3 py-3 text-right">PI Amount Breakdown</th>
                <th className="px-3 py-3 text-center">Payment Status</th>
                <th className="px-3 py-3 text-center">Action / Links</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPiList.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-400 font-medium">
                    No Performa Invoice records found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredPiList.map((item) => {
                  const isFullyPaid = item.paymentStatus === 'Payment Received';
                  const isPartiallyPaid = item.paymentStatus === 'Partially Paid';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      {/* PI & Order Number */}
                      <td className="px-3 py-3">
                        <span className="font-bold text-blue-700 block">{item.piNumber}</span>
                        <span className="text-[11px] font-semibold text-gray-700">{item.orderNumber}</span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">Date: {item.piDate}</span>
                      </td>

                      {/* Buyer Details */}
                      <td className="px-3 py-3">
                        <p className="font-bold text-gray-800">{item.buyerName}</p>
                        <p className="text-[10px] font-mono text-gray-500">GST: {item.buyerGst}</p>
                        {item.isRegularBuyer && (
                          <span className="bg-blue-100 text-blue-700 text-[9px] font-bold px-1.5 py-0.5 rounded inline-block mt-1">
                            Regular Buyer
                          </span>
                        )}
                      </td>

                      {/* Order Type & Validity */}
                      <td className="px-3 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          item.orderType === 'PO Order' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-gray-50 text-gray-700 border-gray-200'
                        }`}>
                          {item.orderType}
                        </span>
                        {item.orderType === 'PO Order' && (
                          <div className="mt-1 text-[10px]">
                            <p className="text-gray-600 font-medium">PO: {item.poNumber}</p>
                            <p className="text-purple-600 font-semibold">Valid: {item.poValidity}</p>
                          </div>
                        )}
                        <p className="text-[10px] text-orange-600 font-medium mt-1">PI Valid: {item.piValidity}</p>
                      </td>

                      {/* Project & Location */}
                      <td className="px-3 py-3">
                        <p className="font-semibold text-gray-800">{item.district}</p>
                        <p className="text-[10px] text-gray-500">{item.projectType}</p>
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded mt-1 inline-block">
                          {item.capacity}
                        </span>
                      </td>

                      {/* Product & Kits */}
                      <td className="px-3 py-3">
                        <p className="font-semibold text-gray-800">{item.productType}</p>
                        <p className="text-[10px] text-gray-500">{item.numberOfKits} Kit(s)</p>
                      </td>

                      {/* Amount Breakdown */}
                      <td className="px-3 py-3 text-right">
                        <p className="font-bold text-gray-900">₹{item.totalPiAmount.toLocaleString('en-IN')}</p>
                        <p className="text-[10px] text-emerald-600 font-medium">Paid: ₹{item.amountReceived.toLocaleString('en-IN')}</p>
                        <p className="text-[10px] text-rose-600 font-bold">Bal: ₹{item.balanceAmount.toLocaleString('en-IN')}</p>
                      </td>

                      {/* Payment Status */}
                      <td className="px-3 py-3 text-center">
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border inline-block ${
                          isFullyPaid ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                          isPartiallyPaid ? 'bg-blue-100 text-blue-800 border-blue-300' :
                          item.paymentStatus === 'Payment Overdue' ? 'bg-rose-100 text-rose-800 border-rose-300' :
                          'bg-amber-100 text-amber-800 border-amber-300'
                        }`}>
                          {item.paymentStatus}
                        </span>
                        {item.utrNumber !== '-' && (
                          <span className="text-[9px] font-mono text-gray-500 block mt-1">
                            {item.utrNumber}
                          </span>
                        )}
                      </td>

                      {/* Action Links */}
                      <td className="px-3 py-3 text-center space-y-1.5">
                        {!isFullyPaid && (
                          <button
                            onClick={() => handleOpenUtrModal(item)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold px-2.5 py-1.5 rounded shadow-sm transition w-full flex items-center justify-center gap-1"
                          >
                            <CreditCard size={12} />
                            Manual UTR
                          </button>
                        )}

                        <Link
                          to={`/epc/order-tracking/${item.orderNumber}`}
                          target="_blank"
                          className="bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-semibold px-2.5 py-1 rounded shadow-sm transition w-full flex items-center justify-center gap-1"
                        >
                          <Eye size={12} />
                          Buyer EPC Link
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual UTR Entry Modal (Section 4B) */}
      {isUtrModalOpen && selectedPiForUtr && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="flex justify-between items-center bg-[#145a80] text-white p-4">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <CreditCard size={16} />
                <span>Enter Manual UTR & Verify Payment</span>
              </h3>
              <button onClick={() => setIsUtrModalOpen(false)} className="text-white hover:text-rose-200">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-xs">
                <p className="font-bold text-blue-900">{selectedPiForUtr.buyerName}</p>
                <p className="text-blue-700 mt-0.5">PI: {selectedPiForUtr.piNumber} | Order: {selectedPiForUtr.orderNumber}</p>
                <p className="text-blue-800 font-bold mt-1">
                  Remaining Balance: ₹{selectedPiForUtr.balanceAmount.toLocaleString('en-IN')}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Bank Transfer UTR Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTR-HDFC-998822"
                  value={utrInput}
                  onChange={(e) => setUtrInput(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Received Amount (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  placeholder="Enter amount paid"
                  value={receivedAmountInput}
                  onChange={(e) => setReceivedAmountInput(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="bg-gray-50 p-3.5 border-t border-gray-200 flex justify-end space-x-2">
              <button
                onClick={() => setIsUtrModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUtr}
                className="px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition"
              >
                Verify & Mark Received
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
