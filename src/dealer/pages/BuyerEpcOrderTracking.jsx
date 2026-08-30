import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Package, 
  CheckCircle2, 
  Clock, 
  Truck, 
  ShieldCheck, 
  FileText, 
  Copy, 
  Share2, 
  CreditCard, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Building,
  MapPin,
  Zap,
  ArrowLeft
} from 'lucide-react';

export default function BuyerEpcOrderTracking() {
  const { orderId } = useParams();
  const [orderData, setOrderData] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Sample order dataset for demo/fallback
  const sampleOrders = [
    {
      orderNumber: 'ORD-9841',
      piNumber: 'PI-2026-0042',
      orderType: 'PO Order',
      poNumber: 'PO-GUJ-2026-88',
      poValidity: '2026-10-31',
      piValidity: '2026-09-15',
      piDate: '2026-08-28',
      buyerName: 'SunSolar EPC Solutions Pvt Ltd',
      buyerGst: '24AAACS1423N1Z5',
      district: 'Ahmedabad',
      projectType: 'Residential Subsidy',
      capacity: '5 KW',
      productType: 'Solarkit',
      numberOfKits: 1,
      basicAmount: 220000,
      gstAmount: 39600,
      totalAmount: 259600,
      amountReceived: 259600,
      balanceAmount: 0,
      paymentStatus: 'Payment Received',
      paymentMethod: 'Payment Gateway',
      orderStatus: 'Order Confirmed',
      currentMilestoneStep: 5, // 1 to 8 index (1-based)
      deliveryMilestones: [
        { id: 1, name: 'Order Created', date: '2026-08-28 10:30 AM', completed: true, active: false },
        { id: 2, name: 'Payment Confirmed', date: '2026-08-28 11:15 AM', completed: true, active: false },
        { id: 3, name: 'Order Confirmed', date: '2026-08-28 02:00 PM', completed: true, active: false },
        { id: 4, name: 'Material Ready', date: '2026-08-29 04:30 PM', completed: true, active: false },
        { id: 5, name: 'Delivery Plan Created', date: '2026-08-30 09:00 AM', completed: true, active: true },
        { id: 6, name: 'Dispatched', date: 'Expected 2026-08-31', completed: false, active: false },
        { id: 7, name: 'Out for Delivery', date: 'Expected 2026-09-01', completed: false, active: false },
        { id: 8, name: 'Delivered', date: 'Expected 2026-09-01', completed: false, active: false }
      ]
    },
    {
      orderNumber: 'ORD-9842',
      piNumber: 'PI-2026-0043',
      orderType: 'One Order',
      poNumber: 'N/A',
      poValidity: 'N/A',
      piValidity: '2026-09-20',
      piDate: '2026-08-29',
      buyerName: 'Gujarat Green Energy EPC',
      buyerGst: '24BBBCS2345M1Z8',
      district: 'Surat',
      projectType: 'Commercial',
      capacity: '15 KW',
      productType: 'Solarkit',
      numberOfKits: 3,
      basicAmount: 650000,
      gstAmount: 117000,
      totalAmount: 767000,
      amountReceived: 300000,
      balanceAmount: 467000,
      paymentStatus: 'Partially Paid',
      paymentMethod: 'Bank Transfer (Manual UTR)',
      orderStatus: 'Order Confirmed',
      currentMilestoneStep: 3,
      deliveryMilestones: [
        { id: 1, name: 'Order Created', date: '2026-08-29 02:00 PM', completed: true, active: false },
        { id: 2, name: 'Payment Confirmed', date: '2026-08-29 04:30 PM', completed: true, active: false },
        { id: 3, name: 'Order Confirmed', date: '2026-08-30 10:00 AM', completed: true, active: true },
        { id: 4, name: 'Material Ready', date: 'In Progress', completed: false, active: false },
        { id: 5, name: 'Delivery Plan Created', date: 'Pending', completed: false, active: false },
        { id: 6, name: 'Dispatched', date: 'Pending', completed: false, active: false },
        { id: 7, name: 'Out for Delivery', date: 'Pending', completed: false, active: false },
        { id: 8, name: 'Delivered', date: 'Pending', completed: false, active: false }
      ]
    }
  ];

  useEffect(() => {
    // Try finding order in localStorage first
    try {
      const stored = localStorage.getItem('solarOrdersList');
      if (stored) {
        const parsed = JSON.parse(stored);
        const match = parsed.find(o => o.orderNumber === orderId || o.id === orderId);
        if (match) {
          setOrderData(match);
          return;
        }
      }
    } catch (e) {
      console.error(e);
    }

    // Fallback to sample order
    const matchSample = sampleOrders.find(s => s.orderNumber === orderId) || sampleOrders[0];
    setOrderData(matchSample);
  }, [orderId]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setToastMessage('Link copied to clipboard!');
    setTimeout(() => {
      setCopiedLink(false);
      setToastMessage('');
    }, 3000);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Payment Received':
        return <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full border border-emerald-300">Payment Received</span>;
      case 'Partially Paid':
        return <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full border border-blue-300">Partially Paid</span>;
      case 'Payment Pending':
        return <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full border border-amber-300">Payment Pending</span>;
      case 'Payment Overdue':
        return <span className="bg-rose-100 text-rose-800 text-xs font-bold px-3 py-1 rounded-full border border-rose-300">Payment Overdue</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 text-xs font-bold px-3 py-1 rounded-full border border-gray-300">{status}</span>;
    }
  };

  if (!orderData) {
    return <div className="p-8 text-center text-gray-500 font-medium">Loading Order Tracking Details...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-xl animate-bounce flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <header className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-blue-600/30 border border-blue-400/40 backdrop-blur-md flex items-center justify-center text-amber-400 shadow-inner">
                <Zap className="w-7 h-7 fill-amber-400" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-widest text-blue-300 font-semibold">Solarkits EPC Portal</span>
                <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  Order & Delivery Tracking
                  <span className="text-sm font-normal px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30">
                    {orderData.orderNumber}
                  </span>
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleCopyLink}
                className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3.5 py-2 rounded-lg backdrop-blur-sm border border-white/20 transition flex items-center gap-1.5 shadow-sm"
              >
                {copiedLink ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copiedLink ? 'Copied Link' : 'Copy Tracking Link'}
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Check your Solarkits Order status here: ${window.location.href}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition flex items-center gap-1.5 shadow-sm"
              >
                <Share2 className="w-4 h-4" />
                Share WhatsApp
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 mt-8 space-y-8">
        
        {/* Customer-facing Delivery Tracker Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-8 border-b border-slate-100 gap-4">
            <div>
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm mb-1">
                <Truck className="w-5 h-5" />
                <span>Customer Delivery Status</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">Live Delivery Progress</h2>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-slate-500">Current Status:</span>
              <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm">
                {orderData.deliveryMilestones.find(m => m.active)?.name || orderData.orderStatus}
              </span>
            </div>
          </div>

          {/* Stepper Timeline */}
          <div className="relative">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 relative z-10">
              {orderData.deliveryMilestones.map((milestone, idx) => {
                const isCompleted = milestone.completed;
                const isActive = milestone.active;

                return (
                  <div key={milestone.id} className="flex flex-col items-center text-center group">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 shadow-sm ${
                        isCompleted
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                          : isActive
                          ? 'bg-blue-600 text-white ring-4 ring-blue-100 animate-pulse'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>
                    <span
                      className={`mt-3 text-xs font-semibold leading-tight max-w-[100px] ${
                        isCompleted
                          ? 'text-slate-900 font-bold'
                          : isActive
                          ? 'text-blue-700 font-extrabold'
                          : 'text-slate-400'
                      }`}
                    >
                      {milestone.name}
                    </span>
                    <span className="mt-1 text-[10px] text-slate-400 font-medium">{milestone.date}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Order Details & PI Summary Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Order Details (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>Order Overview</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Order Number</p>
                  <p className="text-sm font-bold text-slate-800 mt-1">{orderData.orderNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">PI Number</p>
                  <p className="text-sm font-bold text-blue-600 mt-1">{orderData.piNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Order Type</p>
                  <p className="text-sm font-semibold text-slate-800 mt-1">{orderData.orderType}</p>
                </div>

                {orderData.orderType === 'PO Order' && (
                  <>
                    <div>
                      <p className="text-xs text-slate-400 font-medium">PO Number</p>
                      <p className="text-sm font-semibold text-slate-800 mt-1">{orderData.poNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium">PO Validity Date</p>
                      <p className="text-sm font-semibold text-slate-800 mt-1">{orderData.poValidity}</p>
                    </div>
                  </>
                )}

                <div>
                  <p className="text-xs text-slate-400 font-medium">District (Location)</p>
                  <p className="text-sm font-semibold text-slate-800 mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {orderData.district}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Project Type</p>
                  <p className="text-sm font-semibold text-slate-800 mt-1">{orderData.projectType}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Capacity</p>
                  <p className="text-sm font-bold text-slate-800 mt-1">{orderData.capacity}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Product Type</p>
                  <p className="text-sm font-semibold text-slate-800 mt-1">{orderData.productType}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">No. of Kits</p>
                  <p className="text-sm font-bold text-slate-800 mt-1">{orderData.numberOfKits} Kit(s)</p>
                </div>
              </div>
            </div>

            {/* Buyer Details */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
                <Building className="w-5 h-5 text-indigo-600" />
                <span>Buyer / Company Information</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Buyer / Company Name</p>
                  <p className="text-sm font-bold text-slate-800 mt-1">{orderData.buyerName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">GST Number</p>
                  <p className="text-sm font-semibold font-mono text-slate-800 mt-1">{orderData.buyerGst}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment & Performa Summary (Right 1 col) */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  <span>Payment Summary</span>
                </span>
                {getStatusBadge(orderData.paymentStatus)}
              </h3>

              <div className="space-y-3.5 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Basic Amount:</span>
                  <span className="font-semibold text-slate-800">₹{orderData.basicAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST (18%):</span>
                  <span className="font-semibold text-slate-800">₹{orderData.gstAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="pt-3 border-t border-slate-100 flex justify-between font-bold text-base text-slate-900">
                  <span>Total PI Amount:</span>
                  <span className="text-blue-700">₹{orderData.totalAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-emerald-700 text-xs font-semibold bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
                  <span>Amount Paid:</span>
                  <span>₹{orderData.amountReceived.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-rose-700 text-xs font-semibold bg-rose-50 p-2.5 rounded-lg border border-rose-100">
                  <span>Balance Due:</span>
                  <span>₹{orderData.balanceAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {orderData.balanceAmount > 0 && (
                <button
                  onClick={() => {
                    alert('Redirecting to secure Payment Gateway...');
                  }}
                  className="w-full mt-5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm py-3 rounded-xl shadow-md transition flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  Pay Balance Online Now
                </button>
              )}
            </div>

            {/* Verification Security Note */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-slate-300 rounded-2xl p-5 text-xs space-y-2 border border-slate-700">
              <div className="flex items-center space-x-2 text-white font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Verified Solarkits Customer Tracking</span>
              </div>
              <p className="leading-relaxed">
                This tracking view is official and live. Deliveries are routed via Gujarat State Logistics hubs.
              </p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
