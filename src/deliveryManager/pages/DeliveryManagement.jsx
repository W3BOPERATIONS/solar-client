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
  const [challanFromAddress, setChallanFromAddress] = useState('');
  const [challanToAddress, setChallanToAddress] = useState('');
  const [driverSignature, setDriverSignature] = useState(null);
  const [clientSignature, setClientSignature] = useState(null);

  const [showDriverPlanModal, setShowDriverPlanModal] = useState(false);
  const [activeDriverRow, setActiveDriverRow] = useState(null);
  const [driverNameInput, setDriverNameInput] = useState('');
  const [driverPhoneInput, setDriverPhoneInput] = useState('');
  const [vehicleTypeInput, setVehicleTypeInput] = useState('');
  const [vehicleRegInput, setVehicleRegInput] = useState('');

  const [showVehiclePhotoModal, setShowVehiclePhotoModal] = useState(false);
  const [activePhotoRow, setActivePhotoRow] = useState(null);
  const [tempPhotos, setTempPhotos] = useState([]);

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

  // Handlers for Challan Signature Upload & Opening
  const handleSignatureUpload = (e, setSignature) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSignature(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenChallan = (row) => {
    setActiveChallanRow(row);
    const rowKey = row.no || row.id;
    const existing = generatedChallans[rowKey];
    
    const defaultFrom = row.fromAddress || 'SOLARKITS Logistics Hub, Plot 42, GIDC Industrial Estate, Rajkot, Gujarat, India - 360001';
    const defaultTo = row.toAddress || `${row.vendorName || row.name || 'Green Energy Setup'}\n${row.address || 'Industrial Area, Rajkot'}\nLocation: ${row.location || 'Rajkot'} | Pincode: ${row.pincode || '360001'}\nPartner: ${row.partner || 'Super Admin'}`;

    if (typeof existing === 'object' && existing !== null) {
      setChallanFromAddress(existing.fromAddress || defaultFrom);
      setChallanToAddress(existing.toAddress || defaultTo);
      setDriverSignature(existing.driverSignature || null);
      setClientSignature(existing.clientSignature || null);
    } else {
      setChallanFromAddress(defaultFrom);
      setChallanToAddress(defaultTo);
      setDriverSignature(row.driverSignature || null);
      setClientSignature(row.clientSignature || null);
    }
    setShowChallanModal(true);
  };

  const handleConfirmChallan = () => {
    if (!activeChallanRow) return;
    const rowKey = activeChallanRow.no || activeChallanRow.id;
    const challanDetails = {
      verified: true,
      fromAddress: challanFromAddress,
      toAddress: challanToAddress,
      driverSignature,
      clientSignature,
      generatedDate: new Date().toLocaleDateString('en-GB')
    };
    const updated = { ...generatedChallans, [rowKey]: challanDetails };
    setGeneratedChallans(updated);
    localStorage.setItem('generatedChallans', JSON.stringify(updated));
    showToast(`✅ Delivery Challan CHL-${rowKey} generated & verified!`);
    setShowChallanModal(false);
  };

  // Handlers for Driver Plan
  const handleOpenDriverPlan = (row) => {
    setActiveDriverRow(row);
    const rowKey = row.no || row.id;
    const existing = generatedDriverPlans[rowKey];

    if (typeof existing === 'object' && existing !== null) {
      setDriverNameInput(existing.driverName || row.driver || 'Suresh Patel');
      setDriverPhoneInput(existing.driverPhone || row.driverPhone || '+91 98250 12345');
      setVehicleTypeInput(existing.vehicleType || row.vehicleType || row.vehicle || 'Bolero max');
      setVehicleRegInput(existing.vehicleReg || row.vehicleReg || 'GJ-03-AB-4829');
    } else {
      setDriverNameInput(row.driver || 'Suresh Patel');
      setDriverPhoneInput(row.driverPhone || '+91 98250 12345');
      setVehicleTypeInput(row.vehicleType || row.vehicle || 'Bolero max');
      setVehicleRegInput(row.vehicleReg || 'GJ-03-AB-4829');
    }
    setShowDriverPlanModal(true);
  };

  const handleConfirmDriverPlan = () => {
    if (!activeDriverRow) return;
    const rowKey = activeDriverRow.no || activeDriverRow.id;
    const planDetails = {
      verified: true,
      driverName: driverNameInput,
      driverPhone: driverPhoneInput,
      vehicleType: vehicleTypeInput,
      vehicleReg: vehicleRegInput,
      createdDate: new Date().toLocaleDateString('en-GB')
    };
    const updated = { ...generatedDriverPlans, [rowKey]: planDetails };
    setGeneratedDriverPlans(updated);
    localStorage.setItem('generatedDriverPlans', JSON.stringify(updated));

    // Also update current active table data so changes reflect live
    const updatedDeliveryData = deliveryData.map(item => {
      if ((item.no || item.id) === rowKey) {
        return {
          ...item,
          driver: driverNameInput,
          driverPhone: driverPhoneInput,
          vehicleType: vehicleTypeInput,
          vehicle: vehicleTypeInput,
          vehicleReg: vehicleRegInput
        };
      }
      return item;
    });
    setDeliveryData(updatedDeliveryData);
    localStorage.setItem('confirmedDeliveryPlans', JSON.stringify(updatedDeliveryData));

    showToast(`✅ Driver Delivery Plan DRV-PLAN-${rowKey} created & details updated!`);
    setShowDriverPlanModal(false);
  };

  // Handlers for Vehicle Photos (Multiple photos supported)
  const handleOpenPhotoUpload = (row) => {
    setActivePhotoRow(row);
    const rowKey = row.no || row.id;
    const existing = uploadedVehiclePhotos[rowKey];
    if (Array.isArray(existing)) {
      setTempPhotos(existing);
    } else if (typeof existing === 'string' && existing) {
      setTempPhotos([existing]);
    } else {
      setTempPhotos([]);
    }
    setShowVehiclePhotoModal(true);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const filePromises = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result);
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(filePromises).then(newImages => {
      setTempPhotos(prev => [...prev, ...newImages]);
    });
  };

  const handleRemovePhoto = (indexToRemove) => {
    setTempPhotos(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSavePhoto = () => {
    if (!activePhotoRow || tempPhotos.length === 0) {
      alert("⚠️ Please select at least one vehicle photo!");
      return;
    }
    const rowKey = activePhotoRow.no || activePhotoRow.id;
    const updated = { ...uploadedVehiclePhotos, [rowKey]: tempPhotos };
    setUploadedVehiclePhotos(updated);
    localStorage.setItem('uploadedVehiclePhotos', JSON.stringify(updated));
    showToast(`📸 ${tempPhotos.length} Vehicle Loading Photo(s) saved for ${rowKey}!`);
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
                      <td className="px-4 py-4 border-r border-gray-100">
                        {isChallanDone ? (
                          <button 
                            onClick={() => handleOpenChallan(row)}
                            className="inline-flex items-center justify-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-bold text-xs transition-all shadow-2xs hover:shadow hover:scale-[1.02]"
                            title="Click to view or print Delivery Challan"
                          >
                            <CheckCircle2 size={13} />
                            <span>Challan Ready</span>
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleOpenChallan(row)}
                            className="inline-flex items-center justify-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg font-bold text-xs shadow-2xs hover:shadow transition-all hover:scale-[1.02]"
                          >
                            <FileText size={13} />
                            <span>Generate</span>
                          </button>
                        )}
                      </td>

                      {/* 2. Driver Delivery Plan Button */}
                      <td className="px-4 py-4 border-r border-gray-100">
                        {isDriverPlanDone ? (
                          <button 
                            onClick={() => handleOpenDriverPlan(row)}
                            className="inline-flex items-center justify-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-bold text-xs transition-all shadow-2xs hover:shadow hover:scale-[1.02]"
                            title="Click to view or print Driver Route Plan"
                          >
                            <CheckCircle2 size={13} />
                            <span>Plan Ready</span>
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleOpenDriverPlan(row)}
                            className="inline-flex items-center justify-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg font-bold text-xs shadow-2xs hover:shadow transition-all hover:scale-[1.02]"
                          >
                            <Navigation size={13} />
                            <span>Generate</span>
                          </button>
                        )}
                      </td>

                      {/* 3. Upload Vehicle Photo Button */}
                      <td className="px-4 py-4 border-r border-gray-100">
                        {photoUrl && (Array.isArray(photoUrl) ? photoUrl.length > 0 : !!photoUrl) ? (
                          <button 
                            onClick={() => handleOpenPhotoUpload(row)}
                            className="inline-flex items-center space-x-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs hover:shadow-xs group cursor-pointer"
                            title="Click to view, add or re-upload vehicle loading photos"
                          >
                            <div className="relative flex-shrink-0">
                              <img 
                                src={Array.isArray(photoUrl) ? photoUrl[0] : photoUrl} 
                                alt="Vehicle" 
                                className="w-7 h-7 rounded object-cover border border-amber-400 shadow-2xs group-hover:scale-105 transition-transform" 
                              />
                              {Array.isArray(photoUrl) && photoUrl.length > 1 && (
                                <span className="absolute -top-1.5 -right-1.5 bg-amber-600 text-white font-mono text-[9px] font-bold px-1 rounded-full border border-white">
                                  +{photoUrl.length - 1}
                                </span>
                              )}
                            </div>
                            <div className="text-left flex flex-col justify-center leading-tight">
                              <span className="text-[11px] font-bold text-amber-950 flex items-center">
                                <CheckCircle2 size={11} className="text-emerald-600 mr-1 flex-shrink-0" />
                                Uploaded ({Array.isArray(photoUrl) ? photoUrl.length : 1})
                              </span>
                              <span className="text-[9px] font-bold text-blue-600 group-hover:underline flex items-center mt-0.5">
                                <Upload size={9} className="mr-0.5 text-blue-600" /> + Add / Re-upload
                              </span>
                            </div>
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleOpenPhotoUpload(row)}
                            className="inline-flex items-center justify-center space-x-1.5 bg-amber-500 hover:bg-amber-600 text-white px-3.5 py-1.5 rounded-lg font-bold text-xs shadow-2xs hover:shadow transition-all hover:scale-[1.02]"
                          >
                            <Upload size={13} />
                            <span>Upload Photo</span>
                          </button>
                        )}
                      </td>

                      {/* 4. Action Button */}
                      <td className="px-4 py-4">
                        {row.status === 'In Transit' ? (
                          <button 
                            onClick={() => handleMarkDelivered(row)}
                            className="inline-flex items-center justify-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg font-bold text-xs shadow-2xs hover:shadow transition-all hover:scale-[1.02]"
                          >
                            <CheckCircle2 size={13} />
                            <span>Mark Delivered</span>
                          </button>
                        ) : row.status === 'Delivered' ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 size={13} className="mr-1 text-emerald-600" /> Delivered
                          </span>
                        ) : (
                          <button 
                            onClick={() => handleStartDelivery(row)}
                            className="inline-flex items-center justify-center space-x-1 bg-cyan-600 hover:bg-cyan-700 text-white px-3.5 py-1.5 rounded-lg font-bold text-xs shadow-2xs hover:shadow transition-all hover:scale-[1.02]"
                          >
                            <Truck size={13} />
                            <span>Start Delivery</span>
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

              {/* Order & Location Info (From Address & To Address) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                {/* FROM ADDRESS */}
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] text-blue-600 flex items-center">
                    <MapPin size={13} className="mr-1 text-blue-600" /> From Address (Dispatch Warehouse)
                  </h4>
                  <textarea
                    value={challanFromAddress}
                    onChange={(e) => setChallanFromAddress(e.target.value)}
                    rows={3}
                    placeholder="Enter Sender / Dispatch Warehouse Address..."
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-medium text-slate-800 resize-none"
                  />
                </div>

                {/* TO ADDRESS */}
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] text-blue-600 flex items-center">
                    <MapPin size={13} className="mr-1 text-blue-600" /> To Address (Consignee & Delivery)
                  </h4>
                  <textarea
                    value={challanToAddress}
                    onChange={(e) => setChallanToAddress(e.target.value)}
                    rows={3}
                    placeholder="Enter Receiver / Delivery Address..."
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-medium text-slate-800 resize-none"
                  />
                </div>
              </div>

              {/* DISPATCH & VEHICLE DETAILS */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Vehicle</span>
                  <span className="font-semibold text-slate-900">{activeChallanRow.vehicleType || activeChallanRow.vehicle || 'Bolero max'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Driver</span>
                  <span className="font-semibold text-slate-900">{activeChallanRow.driver || 'Suresh Patel'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Delivery Type</span>
                  <span className="font-semibold text-slate-900">{activeChallanRow.deliveryType || 'Regular'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">System Capacity</span>
                  <span className="font-bold text-blue-700">{activeChallanRow.kw || '9 KW'}</span>
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
                {/* Driver / Dispatcher Signature */}
                <div className="flex flex-col items-center">
                  <div className="w-full h-24 flex flex-col justify-end items-center mb-1 relative border-b border-slate-300 pb-2">
                    {driverSignature ? (
                      <div className="relative group flex items-center justify-center">
                        <img src={driverSignature} alt="Driver Signature" className="max-h-16 object-contain" />
                        <button 
                          type="button"
                          onClick={() => setDriverSignature(null)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow opacity-0 group-hover:opacity-100 transition print:hidden"
                          title="Remove Signature"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 border border-dashed border-slate-300 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition print:hidden mb-2">
                        <Upload size={14} className="text-blue-600" />
                        <span>Upload Driver Sign</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => handleSignatureUpload(e, setDriverSignature)} 
                        />
                      </label>
                    )}
                  </div>
                  <p className="font-bold text-slate-700 mt-1">Driver / Dispatcher Signature</p>
                </div>

                {/* Client Consignee Signature */}
                <div className="flex flex-col items-center">
                  <div className="w-full h-24 flex flex-col justify-end items-center mb-1 relative border-b border-slate-300 pb-2">
                    {clientSignature ? (
                      <div className="relative group flex items-center justify-center">
                        <img src={clientSignature} alt="Client Signature" className="max-h-16 object-contain" />
                        <button 
                          type="button"
                          onClick={() => setClientSignature(null)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow opacity-0 group-hover:opacity-100 transition print:hidden"
                          title="Remove Signature"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 border border-dashed border-slate-300 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition print:hidden mb-2">
                        <Upload size={14} className="text-blue-600" />
                        <span>Upload Client Sign</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => handleSignatureUpload(e, setClientSignature)} 
                        />
                      </label>
                    )}
                  </div>
                  <p className="font-bold text-slate-700 mt-1">Client Consignee Signature</p>
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

              {/* Driver & Vehicle Card (Editable) */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] text-emerald-700 flex items-center">
                    <User size={13} className="mr-1 text-emerald-600" /> Driver & Vehicle Details (Edit Below)
                  </h4>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">Editable</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Driver Name */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Assigned Driver Name</label>
                    <div className="relative">
                      <input 
                        type="text"
                        value={driverNameInput}
                        onChange={(e) => setDriverNameInput(e.target.value)}
                        placeholder="Enter Driver Name"
                        className="w-full pl-7 pr-2 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                      />
                      <User size={13} className="absolute left-2 top-2 text-emerald-600" />
                    </div>
                  </div>

                  {/* Driver Phone Number */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Driver Mobile Number</label>
                    <div className="relative">
                      <input 
                        type="text"
                        value={driverPhoneInput}
                        onChange={(e) => setDriverPhoneInput(e.target.value)}
                        placeholder="Enter Mobile (+91 ...)"
                        className="w-full pl-7 pr-2 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                      />
                      <PhoneCall size={13} className="absolute left-2 top-2 text-emerald-600" />
                    </div>
                  </div>

                  {/* Vehicle Assigned Name */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Vehicle Assigned</label>
                    <div className="relative">
                      <input 
                        type="text"
                        value={vehicleTypeInput}
                        onChange={(e) => setVehicleTypeInput(e.target.value)}
                        placeholder="Enter Vehicle Name (Bolero Max, etc.)"
                        className="w-full pl-7 pr-2 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                      />
                      <Truck size={13} className="absolute left-2 top-2 text-emerald-600" />
                    </div>
                  </div>

                  {/* Car / Vehicle Reg Number */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Car / Registration Number</label>
                    <div className="relative">
                      <input 
                        type="text"
                        value={vehicleRegInput}
                        onChange={(e) => setVehicleRegInput(e.target.value)}
                        placeholder="Enter Reg No (e.g. GJ-03-AB-4829)"
                        className="w-full pl-7 pr-2 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                      />
                      <Sparkles size={13} className="absolute left-2 top-2 text-emerald-600" />
                    </div>
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

      {/* MODAL 3: UPLOAD VEHICLE PHOTO (MULTIPLE PHOTOS SUPPORT) */}
      {showVehiclePhotoModal && activePhotoRow && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Upload className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold">Upload Vehicle Loading Photos</h2>
              </div>
              <button 
                onClick={() => setShowVehiclePhotoModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 text-xs text-slate-800 max-h-[75vh] overflow-y-auto">
              <div className="text-center space-y-1">
                <p className="font-bold text-slate-900 text-sm">Vehicle Loading Photos Verification</p>
                <p className="text-slate-500">Order: <span className="font-mono font-bold text-blue-600">{(activePhotoRow.no || activePhotoRow.id)}</span> | Vehicle: <span className="font-semibold">{activePhotoRow.vehicleType || activePhotoRow.vehicle || 'Bolero max'}</span></p>
              </div>

              {/* Photo Upload Zone */}
              <div className="border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-2xl p-5 text-center bg-amber-50/40 transition flex flex-col items-center justify-center relative cursor-pointer group">
                <input 
                  type="file" 
                  multiple
                  accept="image/*" 
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" 
                />
                <div className="p-3 bg-amber-100 text-amber-700 rounded-full inline-block group-hover:scale-110 transition-transform">
                  <Upload size={22} />
                </div>
                <p className="font-bold text-slate-800 mt-2">Click or Drag to Upload Multiple Photos</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Select multiple loading images (PNG, JPG, WEBP)</p>
              </div>

              {/* Uploaded Photos Grid Preview */}
              {tempPhotos.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-700 text-xs">Selected Photos ({tempPhotos.length})</span>
                    <label className="text-[11px] font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg cursor-pointer transition">
                      + Add More
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*" 
                        onChange={handleFileChange} 
                        className="hidden" 
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {tempPhotos.map((photoUrl, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-300 shadow-sm bg-slate-100">
                        <img 
                          src={photoUrl} 
                          alt={`Vehicle photo ${idx + 1}`} 
                          className="w-full h-28 object-cover group-hover:scale-105 transition-transform" 
                        />
                        <div className="absolute top-1 right-1">
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(idx)}
                            className="bg-red-600 text-white rounded-full p-1 shadow hover:bg-red-700 transition"
                            title="Delete photo"
                          >
                            <X size={13} />
                          </button>
                        </div>
                        <span className="absolute bottom-1 left-1 bg-slate-900/75 text-white font-mono text-[9px] px-1.5 py-0.5 rounded">
                          #{idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between items-center">
              <span className="text-[11px] text-slate-500 font-medium">
                {tempPhotos.length > 0 ? `✓ ${tempPhotos.length} photo(s) selected` : 'No photos selected'}
              </span>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowVehiclePhotoModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 text-xs font-bold hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePhoto}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-5 py-2 rounded-xl flex items-center space-x-2 transition shadow-md"
                >
                  <Check size={15} />
                  <span>Save {tempPhotos.length > 0 ? `(${tempPhotos.length})` : ''} Vehicle Photos</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

