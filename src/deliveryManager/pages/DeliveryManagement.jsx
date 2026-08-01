import React, { useState, useEffect } from 'react';
import { 
  Coffee, 
  Printer, 
  Download, 
  Upload, 
  CheckCircle2, 
  Truck, 
  FileText, 
  X, 
  MapPin, 
  User, 
  ShieldCheck, 
  ArrowRight, 
  Eye, 
  Calendar, 
  Sparkles,
  Navigation,
  PhoneCall,
  Check,
  Package
} from 'lucide-react';

export default function DeliveryManagement() {
  const [deliveryData, setDeliveryData] = useState([]);
  const [activeTab, setActiveTab] = useState('Out for Delivery'); // 'Out for Delivery' | 'In Transit' | 'Delivered'
  const [toastMessage, setToastMessage] = useState(null);

  // Modals state
  const [showChallanModal, setShowChallanModal] = useState(false);
  const [activeChallanRow, setActiveChallanRow] = useState(null);

  const [showDriverPlanModal, setShowDriverPlanModal] = useState(false);
  const [activeDriverRow, setActiveDriverRow] = useState(null);

  const [showVehiclePhotoModal, setShowVehiclePhotoModal] = useState(false);
  const [activePhotoRow, setActivePhotoRow] = useState(null);
  const [tempPhotoUrl, setTempPhotoUrl] = useState(null);

  // Tracking state for generated files & photos
  const [generatedChallans, setGeneratedChallans] = useState(() => {
    try { return JSON.parse(localStorage.getItem('generatedChallans') || '{}'); } catch(e) { return {}; }
  });
  const [generatedDriverPlans, setGeneratedDriverPlans] = useState(() => {
    try { return JSON.parse(localStorage.getItem('generatedDriverPlans') || '{}'); } catch(e) { return {}; }
  });
  const [uploadedVehiclePhotos, setUploadedVehiclePhotos] = useState(() => {
    try { return JSON.parse(localStorage.getItem('uploadedVehiclePhotos') || '{}'); } catch(e) { return {}; }
  });

  const loadData = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('confirmedDeliveryPlans') || '[]');
      setDeliveryData(stored);
    } catch(e) {
      setDeliveryData([]);
    }
  };

  useEffect(() => {
    loadData();
    const handleStorageChange = () => loadData();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleStorageChange);
    };
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const updateDeliveryStatus = (targetNo, newStatus) => {
    const updated = deliveryData.map(item => {
      if ((item.no || item.id) === targetNo) {
        return { ...item, status: newStatus };
      }
      return item;
    });
    setDeliveryData(updated);
    localStorage.setItem('confirmedDeliveryPlans', JSON.stringify(updated));
  };

  // Handlers for Challan
  const handleOpenChallan = (row) => {
    setActiveChallanRow(row);
    setShowChallanModal(true);
  };

  const handleConfirmChallan = () => {
    if (!activeChallanRow) return;
    const rowKey = activeChallanRow.no || activeChallanRow.id;
    const updated = { ...generatedChallans, [rowKey]: true };
    setGeneratedChallans(updated);
    localStorage.setItem('generatedChallans', JSON.stringify(updated));
    showToast(`✅ Delivery Challan CHL-${rowKey} generated & verified!`);
    setShowChallanModal(false);
  };

  // Handlers for Driver Plan
  const handleOpenDriverPlan = (row) => {
    setActiveDriverRow(row);
    setShowDriverPlanModal(true);
  };

  const handleConfirmDriverPlan = () => {
    if (!activeDriverRow) return;
    const rowKey = activeDriverRow.no || activeDriverRow.id;
    const updated = { ...generatedDriverPlans, [rowKey]: true };
    setGeneratedDriverPlans(updated);
    localStorage.setItem('generatedDriverPlans', JSON.stringify(updated));
    showToast(`✅ Driver Delivery Plan DRV-PLAN-${rowKey} created!`);
    setShowDriverPlanModal(false);
  };

  // Handlers for Vehicle Photo
  const handleOpenPhotoUpload = (row) => {
    setActivePhotoRow(row);
    const rowKey = row.no || row.id;
    setTempPhotoUrl(uploadedVehiclePhotos[rowKey] || null);
    setShowVehiclePhotoModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempPhotoUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSavePhoto = () => {
    if (!activePhotoRow || !tempPhotoUrl) {
      alert("⚠️ Please select an image file first!");
      return;
    }
    const rowKey = activePhotoRow.no || activePhotoRow.id;
    const updated = { ...uploadedVehiclePhotos, [rowKey]: tempPhotoUrl };
    setUploadedVehiclePhotos(updated);
    localStorage.setItem('uploadedVehiclePhotos', JSON.stringify(updated));
    showToast(`📸 Vehicle Loading Photo uploaded for ${rowKey}!`);
    setShowVehiclePhotoModal(false);
  };

  // Status Action Handlers
  const handleStartDelivery = (row) => {
    const rowKey = row.no || row.id;
    updateDeliveryStatus(rowKey, 'In Transit');
    showToast(`🚚 Delivery started for ${rowKey}! Order is now In Transit.`);
  };

  const handleMarkDelivered = (row) => {
    const rowKey = row.no || row.id;
    updateDeliveryStatus(rowKey, 'Delivered');
    showToast(`🎉 Order ${rowKey} has been successfully Delivered!`);
  };

  // Counts
  const outForDeliveryOrders = deliveryData.filter(d => (d.status || 'Out for Delivery') === 'Out for Delivery');
  const inTransitOrders = deliveryData.filter(d => d.status === 'In Transit');
  const deliveredOrders = deliveryData.filter(d => d.status === 'Delivered');

  const activeTableOrders = 
    activeTab === 'Out for Delivery' ? outForDeliveryOrders :
    activeTab === 'In Transit' ? inTransitOrders : deliveredOrders;

  return (
    <div className="min-h-screen bg-[#F0F4F8] p-4 lg:p-6 space-y-6 pb-20 relative font-sans">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center space-x-3 animate-bounce">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-[#2A659A] text-white px-6 py-4 rounded-sm shadow-sm flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-wide flex items-center space-x-2">
          <Truck className="w-6 h-6 mr-2" />
          <span>Delivery Management</span>
        </h1>
        <span className="bg-blue-800/60 border border-blue-400/40 text-xs px-3 py-1 rounded-full font-medium">
          Dispatch & Tracking System
        </span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          onClick={() => setActiveTab('Out for Delivery')}
          className={`cursor-pointer bg-white rounded border-b-4 border-[#FFC107] p-6 shadow-sm flex flex-col items-center justify-center text-center transition-all ${activeTab === 'Out for Delivery' ? 'ring-2 ring-[#FFC107] bg-amber-50/20' : 'hover:shadow-md'}`}
        >
          <h2 className="text-[#FFC107] font-semibold text-lg mb-2">Out for Delivery</h2>
          <span className="text-4xl text-gray-800 font-light mb-2">{outForDeliveryOrders.length}</span>
          <p className="text-gray-500 text-sm">Orders ready for dispatch</p>
        </div>
        
        <div 
          onClick={() => setActiveTab('In Transit')}
          className={`cursor-pointer bg-white rounded border-b-4 border-[#00BCD4] p-6 shadow-sm flex flex-col items-center justify-center text-center transition-all ${activeTab === 'In Transit' ? 'ring-2 ring-[#00BCD4] bg-cyan-50/20' : 'hover:shadow-md'}`}
        >
          <h2 className="text-[#00BCD4] font-semibold text-lg mb-2">In Transit</h2>
          <span className="text-4xl text-gray-800 font-light mb-2">{inTransitOrders.length}</span>
          <p className="text-gray-500 text-sm">Orders currently being delivered</p>
        </div>

        <div 
          onClick={() => setActiveTab('Delivered')}
          className={`cursor-pointer bg-white rounded border-b-4 border-[#4CAF50] p-6 shadow-sm flex flex-col items-center justify-center text-center transition-all ${activeTab === 'Delivered' ? 'ring-2 ring-[#4CAF50] bg-emerald-50/20' : 'hover:shadow-md'}`}
        >
          <h2 className="text-[#4CAF50] font-semibold text-lg mb-2">Delivered</h2>
          <span className="text-4xl text-gray-800 font-light mb-2">{deliveredOrders.length}</span>
          <p className="text-gray-500 text-sm">Completed deliveries</p>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden mt-8">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-[#FFC107] font-bold text-xl flex items-center space-x-2">
            <span>{activeTab}</span>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
              {activeTableOrders.length} Orders
            </span>
          </h2>

          {/* Tab Filter Switcher */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('Out for Delivery')}
              className={`px-3 py-1 rounded transition-colors ${activeTab === 'Out for Delivery' ? 'bg-[#FFC107] text-slate-900 font-bold shadow-2xs' : 'text-slate-600 hover:bg-slate-200'}`}
            >
              Out for Delivery ({outForDeliveryOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('In Transit')}
              className={`px-3 py-1 rounded transition-colors ${activeTab === 'In Transit' ? 'bg-[#00BCD4] text-white font-bold shadow-2xs' : 'text-slate-600 hover:bg-slate-200'}`}
            >
              In Transit ({inTransitOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('Delivered')}
              className={`px-3 py-1 rounded transition-colors ${activeTab === 'Delivered' ? 'bg-[#4CAF50] text-white font-bold shadow-2xs' : 'text-slate-600 hover:bg-slate-200'}`}
            >
              Delivered ({deliveredOrders.length})
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] text-center">
            <thead className="text-white bg-[#74B8FA]">
              <tr>
                <th className="px-4 py-3.5 font-semibold border-r border-blue-300/30">Delivery No.</th>
                <th className="px-4 py-3.5 font-semibold border-r border-blue-300/30">Location</th>
                <th className="px-4 py-3.5 font-semibold border-r border-blue-300/30">Total<br/>Kit</th>
                <th className="px-4 py-3.5 font-semibold border-r border-blue-300/30">Total<br/>KW</th>
                <th className="px-4 py-3.5 font-semibold border-r border-blue-300/30">Delivery<br/>Type</th>
                <th className="px-4 py-3.5 font-semibold border-r border-blue-300/30">Vehicle<br/>Type</th>
                <th className="px-4 py-3.5 font-semibold border-r border-blue-300/30">Driver</th>
                <th className="px-4 py-3.5 font-semibold border-r border-blue-300/30">Generate Delivery<br/>Challan</th>
                <th className="px-4 py-3.5 font-semibold border-r border-blue-300/30">Driver Delivery<br/>Plan</th>
                <th className="px-4 py-3.5 font-semibold border-r border-blue-300/30">Upload Vehicle<br/>Photo</th>
                <th className="px-4 py-3.5 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {activeTableOrders.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-slate-400 font-medium">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Package className="w-10 h-10 text-slate-300" />
                      <p>No orders in "{activeTab}". Confirm delivery plans from "Delivery Plan" page to dispatch here.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                activeTableOrders.map((row, idx) => {
                  const rowKey = row.no || row.id;
                  const isChallanDone = generatedChallans[rowKey];
                  const isDriverPlanDone = generatedDriverPlans[rowKey];
                  const photoUrl = uploadedVehiclePhotos[rowKey];

                  return (
                    <tr key={idx} className="border-b hover:bg-gray-50 text-gray-700 transition-colors">
                      <td className="px-4 py-5 border-r border-gray-100 font-bold text-slate-800">{rowKey}</td>
                      <td className="px-4 py-5 border-r border-gray-100 font-semibold">{row.location || 'Rajkot'}</td>
                      <td className="px-4 py-5 border-r border-gray-100">{row.kit || '1 Kit'}</td>
                      <td className="px-4 py-5 border-r border-gray-100 font-bold text-blue-600">{row.kw || '9 KW'}</td>
                      <td className="px-4 py-5 border-r border-gray-100">
                        <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded border border-blue-200">
                          {row.deliveryType || 'Regular'}
                        </span>
                      </td>
                      <td className="px-4 py-5 border-r border-gray-100 font-medium">{row.vehicleType || row.vehicle || 'Bolero max'}</td>
                      <td className="px-4 py-5 border-r border-gray-100 whitespace-pre-line font-medium text-slate-700">
                        {(row.driver || 'Suresh Patel').replace(' ', '\n')}
                      </td>

                      {/* 1. Generate Delivery Challan Button */}
                      <td className="px-4 py-5 border-r border-gray-100">
                        {isChallanDone ? (
                          <button 
                            onClick={() => handleOpenChallan(row)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded font-bold text-xs flex items-center justify-center space-x-1 mx-auto transition shadow-2xs"
                            title="Click to view or print Delivery Challan"
                          >
                            <CheckCircle2 size={13} />
                            <span>Challan Ready</span>
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleOpenChallan(row)}
                            className="bg-[#2FA041] hover:bg-[#237d32] text-white px-3 py-1.5 rounded font-medium text-xs w-[90px] shadow-2xs hover:scale-105 transition-transform"
                          >
                            Generate
                          </button>
                        )}
                      </td>

                      {/* 2. Driver Delivery Plan Button */}
                      <td className="px-4 py-5 border-r border-gray-100">
                        {isDriverPlanDone ? (
                          <button 
                            onClick={() => handleOpenDriverPlan(row)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded font-bold text-xs flex items-center justify-center space-x-1 mx-auto transition shadow-2xs"
                            title="Click to view or print Driver Route Plan"
                          >
                            <CheckCircle2 size={13} />
                            <span>Plan Ready</span>
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleOpenDriverPlan(row)}
                            className="bg-[#2FA041] hover:bg-[#237d32] text-white px-3 py-1.5 rounded font-medium text-xs w-[90px] shadow-2xs hover:scale-105 transition-transform"
                          >
                            Generate
                          </button>
                        )}
                      </td>

                      {/* 3. Upload Vehicle Photo Button */}
                      <td className="px-4 py-5 border-r border-gray-100">
                        {photoUrl ? (
                          <div className="flex items-center justify-center space-x-1">
                            <img src={photoUrl} alt="Vehicle Loading" className="w-8 h-8 rounded border border-emerald-400 object-cover shadow-2xs" />
                            <button 
                              onClick={() => handleOpenPhotoUpload(row)}
                              className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 px-2 py-1 rounded text-[11px] font-bold"
                              title="Click to view or update uploaded vehicle photo"
                            >
                              Uploaded ✓
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleOpenPhotoUpload(row)}
                            className="bg-[#2FA041] hover:bg-[#237d32] text-white px-3 py-1.5 rounded font-medium text-xs w-[90px] shadow-2xs hover:scale-105 transition-transform"
                          >
                            Generate
                          </button>
                        )}
                      </td>

                      {/* 4. Action Button */}
                      <td className="px-4 py-5">
                        {row.status === 'In Transit' ? (
                          <button 
                            onClick={() => handleMarkDelivered(row)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded font-bold text-xs w-[95px] shadow-2xs transition"
                          >
                            Mark<br/>Delivered
                          </button>
                        ) : row.status === 'Delivered' ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 size={12} className="mr-1" /> Delivered
                          </span>
                        ) : (
                          <button 
                            onClick={() => handleStartDelivery(row)}
                            className="bg-[#00BCD4] hover:bg-[#0097a7] text-white px-3 py-1.5 rounded font-bold text-xs w-[95px] shadow-2xs hover:scale-105 transition-transform"
                          >
                            Start<br/>Delivery
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Break Time Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button className="bg-[#0F1E32] hover:bg-[#1a304d] text-white px-4 py-2 rounded-full flex items-center shadow-lg text-sm font-semibold transition-colors">
          <Coffee className="w-4 h-4 mr-2" />
          Break Time
        </button>
      </div>

      {/* MODAL 1: DELIVERY CHALLAN GENERATOR */}
      {showChallanModal && activeChallanRow && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <h2 className="text-base font-bold">Official Delivery Challan Generator</h2>
              </div>
              <button 
                onClick={() => setShowChallanModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full"
              >
                <X size={18} />
              </button>
            </div>

            {/* Printable Document Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto" id="printable-challan">
              {/* Document Letterhead */}
              <div className="border-b border-slate-200 pb-4 flex justify-between items-start">
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">SOLARKITS ERP LOGISTICS</h1>
                  <p className="text-xs text-slate-500">Solar Marketplace & Logistics Network</p>
                  <p className="text-xs text-slate-500">Reg Address: Industrial Hub, Gujarat, India</p>
                </div>
                <div className="text-right">
                  <span className="inline-block bg-blue-50 text-blue-700 font-mono text-xs font-bold px-3 py-1 rounded border border-blue-200 mb-1">
                    CHALLAN NO: CHL-{(activeChallanRow.no || activeChallanRow.id)}
                  </span>
                  <p className="text-xs text-slate-500">Date: {new Date().toLocaleDateString('en-GB')}</p>
                </div>
              </div>

              {/* Order & Location Info */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] text-blue-600 mb-1">Consignee & Delivery Address</h4>
                  <p className="font-bold text-slate-900 text-sm">{activeChallanRow.vendorName || activeChallanRow.name || 'SolarTech Commercial'}</p>
                  <p className="text-slate-600 font-medium mt-0.5">{activeChallanRow.address || 'Industrial Area, Rajkot'}</p>
                  <p className="text-slate-600 font-medium">Location: {activeChallanRow.location || 'Rajkot'} | Pincode: {activeChallanRow.pincode || '360001'}</p>
                  <p className="text-slate-500 mt-1 font-semibold">Partner: {activeChallanRow.partner || 'Tata Solar'}</p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] text-blue-600 mb-1">Dispatch & Vehicle Details</h4>
                  <p className="text-slate-700 font-semibold">Vehicle: <span className="text-slate-900">{activeChallanRow.vehicleType || activeChallanRow.vehicle || 'Bolero max'}</span></p>
                  <p className="text-slate-700 font-semibold">Driver: <span className="text-slate-900">{activeChallanRow.driver || 'Suresh Patel'}</span></p>
                  <p className="text-slate-700 font-semibold">Delivery Type: <span className="text-slate-900">{activeChallanRow.deliveryType || 'Regular'}</span></p>
                  <p className="text-slate-700 font-semibold">System Capacity: <span className="text-blue-700 font-bold">{activeChallanRow.kw || '9 KW'}</span></p>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">Item Specifications & Dispatch Manifest</h4>
                <table className="w-full text-xs text-left border border-slate-200">
                  <thead className="bg-slate-100 text-slate-800 font-bold uppercase text-[11px]">
                    <tr>
                      <th className="p-2.5 border-b border-r border-slate-200">#</th>
                      <th className="p-2.5 border-b border-r border-slate-200">Description</th>
                      <th className="p-2.5 border-b border-r border-slate-200">Quantity</th>
                      <th className="p-2.5 border-b border-slate-200">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    <tr>
                      <td className="p-2.5 border-r border-slate-200 font-mono">1</td>
                      <td className="p-2.5 border-r border-slate-200 font-bold">Solar Equipment Kit ({activeChallanRow.kit || '1 Kit'})</td>
                      <td className="p-2.5 border-r border-slate-200">Full System Kit</td>
                      <td className="p-2.5 text-emerald-600 font-bold">Packed & Verified</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 border-r border-slate-200 font-mono">2</td>
                      <td className="p-2.5 border-r border-slate-200 font-bold">Solar Panels Package ({activeChallanRow.panel || '15 Pcs (Tata Solar)'})</td>
                      <td className="p-2.5 border-r border-slate-200">15 Units</td>
                      <td className="p-2.5 text-emerald-600 font-bold">Loaded</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 border-r border-slate-200 font-mono">3</td>
                      <td className="p-2.5 border-r border-slate-200 font-bold">Inverter & BOS Accessories ({activeChallanRow.inverter || '5KW Hybrid Unit'})</td>
                      <td className="p-2.5 border-r border-slate-200">1 Unit + BOS Kit</td>
                      <td className="p-2.5 text-emerald-600 font-bold">Loaded</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Signatures */}
              <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs text-slate-500">
                <div>
                  <div className="border-b border-slate-300 mb-1 pb-8"></div>
                  <p className="font-bold text-slate-700">Driver / Dispatcher Signature</p>
                </div>
                <div>
                  <div className="border-b border-slate-300 mb-1 pb-8"></div>
                  <p className="font-bold text-slate-700">Client Consignee Signature</p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between items-center">
              <button
                onClick={() => window.print()}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs px-4 py-2 rounded-xl flex items-center space-x-2 transition"
              >
                <Printer size={14} />
                <span>Print Delivery Challan</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowChallanModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 text-xs font-bold hover:bg-slate-100 transition"
                >
                  Close
                </button>
                <button
                  onClick={handleConfirmChallan}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2 rounded-xl flex items-center space-x-2 transition shadow-md"
                >
                  <CheckCircle2 size={15} />
                  <span>Confirm & Generate Challan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: DRIVER DELIVERY PLAN GENERATOR */}
      {showDriverPlanModal && activeDriverRow && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="bg-emerald-800 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Navigation className="w-5 h-5 text-emerald-300" />
                <h2 className="text-base font-bold">Driver Delivery Route & Dispatch Plan</h2>
              </div>
              <button 
                onClick={() => setShowDriverPlanModal(false)}
                className="text-emerald-300 hover:text-white p-1 rounded-full"
              >
                <X size={18} />
              </button>
            </div>

            {/* Plan Content */}
            <div className="p-6 space-y-5 text-xs text-slate-800">
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">ROUTE PLAN ID</span>
                  <span className="text-base font-black text-emerald-950 font-mono">DRV-PLAN-{(activeDriverRow.no || activeDriverRow.id)}</span>
                </div>
                <span className="bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Status: Ready for Dispatch
                </span>
              </div>

              {/* Driver & Vehicle Card */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-start space-x-2">
                  <User className="w-4 h-4 text-emerald-600 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-500 block text-[10px] uppercase">Assigned Driver</span>
                    <p className="font-bold text-slate-900 text-sm">{activeDriverRow.driver || 'Suresh Patel'}</p>
                    <p className="text-slate-500 font-medium flex items-center mt-0.5">
                      <PhoneCall size={11} className="mr-1 text-slate-400" /> +91 98250 12345
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Truck className="w-4 h-4 text-emerald-600 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-500 block text-[10px] uppercase">Vehicle Assigned</span>
                    <p className="font-bold text-slate-900 text-sm">{activeDriverRow.vehicleType || activeDriverRow.vehicle || 'Bolero max'}</p>
                    <p className="text-slate-500 font-medium">Reg: GJ-03-AB-4829</p>
                  </div>
                </div>
              </div>

              {/* Route Destination */}
              <div className="space-y-2 border border-slate-200 p-4 rounded-xl">
                <h4 className="font-bold text-slate-900 flex items-center space-x-1.5 text-xs">
                  <MapPin size={14} className="text-rose-600" />
                  <span>Destination & Route Instructions</span>
                </h4>
                <p className="font-semibold text-slate-800">
                  Location: <span className="font-bold text-blue-700">{activeDriverRow.location || 'Rajkot'}</span>
                </p>
                <p className="text-slate-600">Full Address: {activeDriverRow.address || 'Industrial Area, Rajkot'}</p>
                <p className="text-slate-600">Pincode: {activeDriverRow.pincode || '360001'}</p>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-slate-500 text-[11px]">
                  <span>Estimated Distance: 35 KM</span>
                  <span>Est Delivery Time: 45 Mins</span>
                </div>
              </div>

              {/* Special Instructions */}
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-amber-900">
                <span className="font-bold block text-[11px] uppercase tracking-wider text-amber-700">Special Driver Instructions:</span>
                <p className="text-xs mt-0.5">
                  {activeDriverRow.specialInstructions || 'Handle solar panels with care. Obtain client signature on delivery challan upon arrival.'}
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between items-center">
              <button
                onClick={() => window.print()}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs px-4 py-2 rounded-xl flex items-center space-x-2 transition"
              >
                <Printer size={14} />
                <span>Print Route Plan</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowDriverPlanModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 text-xs font-bold hover:bg-slate-100 transition"
                >
                  Close
                </button>
                <button
                  onClick={handleConfirmDriverPlan}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2 rounded-xl flex items-center space-x-2 transition shadow-md"
                >
                  <CheckCircle2 size={15} />
                  <span>Confirm Driver Plan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: UPLOAD VEHICLE PHOTO */}
      {showVehiclePhotoModal && activePhotoRow && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Upload className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold">Upload Vehicle Loading Photo</h2>
              </div>
              <button 
                onClick={() => setShowVehiclePhotoModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 text-xs text-slate-800">
              <div className="text-center space-y-1">
                <p className="font-bold text-slate-900 text-sm">Vehicle Photo Verification</p>
                <p className="text-slate-500">Order: <span className="font-mono font-bold text-blue-600">{(activePhotoRow.no || activePhotoRow.id)}</span> | Vehicle: <span className="font-semibold">{activePhotoRow.vehicleType || activePhotoRow.vehicle || 'Bolero max'}</span></p>
              </div>

              {/* Photo Drag & Drop Preview Box */}
              <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 text-center bg-slate-50 transition flex flex-col items-center justify-center relative">
                {tempPhotoUrl ? (
                  <div className="space-y-3 w-full">
                    <img src={tempPhotoUrl} alt="Vehicle Inspection" className="max-h-48 rounded-xl mx-auto object-cover border border-slate-300 shadow-md" />
                    <span className="text-[11px] text-emerald-600 font-bold block">✓ Photo Selected & Ready to Upload</span>
                  </div>
                ) : (
                  <div className="space-y-2 py-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-full inline-block">
                      <Upload size={24} />
                    </div>
                    <p className="font-bold text-slate-700">Click to upload vehicle photo</p>
                    <p className="text-[11px] text-slate-400">PNG, JPG or WEBP (Max 5MB)</p>
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end space-x-2">
              <button
                onClick={() => setShowVehiclePhotoModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 text-xs font-bold hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePhoto}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2 rounded-xl flex items-center space-x-2 transition shadow-md"
              >
                <Check size={15} />
                <span>Save Vehicle Photo</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

