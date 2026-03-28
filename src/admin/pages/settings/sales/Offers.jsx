import React, { useState, useEffect } from 'react';
import { useLocations } from '../../../../hooks/useLocations';
import salesSettingsService from '../../../../services/settings/salesSettingsApi';
import { EyeOff, Eye, MapPin, Layers, Trash2 } from 'lucide-react';

const LocationCard = ({ title, subtitle, isSelected, onClick, isState }) => (
  <div
    onClick={onClick}
    className={`p-4 rounded-md transition-all cursor-pointer flex flex-col items-center justify-center text-center h-20 shadow-sm hover:shadow-md ${
      isSelected
      ? isState ? 'border-2 border-[#007bff] bg-[#8ccdfa]' : 'border-2 border-[#007bff] bg-[#eef6ff]'
      : 'border border-gray-200 bg-white'
      }`}
  >
    <div className="font-bold text-[14px] text-[#2c3e50] mb-0">{title}</div>
    <div className="text-[11px] text-gray-500 font-medium uppercase tracking-tight">{subtitle}</div>
  </div>
);

export default function AdminOffers() {
  const [showLocationCards, setShowLocationCards] = useState(true);
  const [selectedCountryId, setSelectedCountryId] = useState('');
  const [selectedStateId, setSelectedStateId] = useState('');
  const [selectedClusterId, setSelectedClusterId] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');

  const [activeTab, setActiveTab] = useState('solar'); // 'solar', 'loyalty', 'limited'
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);

  const { countries, states, districts, clusters, fetchCountries, fetchStates, fetchDistricts, fetchClusters } = useLocations();
  const selectedCountryObj = countries.find((c) => c._id === selectedCountryId) || null;
  const selectedStateObj = states.find((s) => s._id === selectedStateId) || null;
  const selectedClusterObj = clusters.find((c) => c._id === selectedClusterId) || null;
  const selectedDistrictObj = districts.find((d) => d._id === selectedDistrictId) || null;

  // Global Location Logic
  useEffect(() => {
    fetchCountries();
  }, []);

  // Form States
  const [solarForm, setSolarForm] = useState({
    cpType: 'Starter', projectType: 'All', cluster: 'All',
    brand: 'Adani', kwSelection: '1-3 kW', targetKw: 5,
    cashbackDetails: 1500, startDate: '', endDate: '', autoRenew: false
  });

  const [loyaltyForm, setLoyaltyForm] = useState({
    cpType: 'Starter', projectType: 'All', cluster: 'All',
    brand: 'Adani', kwSelection: '1-3 kW',
    yearCashbacks: [{ years: 1, cashback: 1500 }, { years: 3, cashback: 3000 }, { years: 5, cashback: 5000 }]
  });

  const [stockForm, setStockForm] = useState({
    cluster: 'Ahmedabad', bundlePlan: 'Basic Solar Bundle', currentStock: 50,
    product: 'Solar Panel', deadline: '', brand: 'Adani', cashbackValue: 1000
  });

  const [showNewOfferModal, setShowNewOfferModal] = useState(false);
  const [newOfferForm, setNewOfferForm] = useState({
    offerName: '', offerType: 'Referral Bonus'
  });

  // Global Location Logic
  useEffect(() => {
    if (selectedCountryId) {
       setSelectedStateId('');
       setSelectedClusterId('');
       setSelectedDistrictId('');
       if (selectedCountryId !== 'all') {
         fetchStates({ countryId: selectedCountryId });
       } else {
         fetchStates(); // Fetch all states
       }
    }
  }, [selectedCountryId]);

  useEffect(() => {
    if (selectedStateId) {
      setSelectedClusterId('');
      setSelectedDistrictId('');
      if (selectedStateId !== 'all') {
        fetchClusters({ stateId: selectedStateId }); 
      } else {
        fetchClusters(); // Fetch all clusters
      }
    }
  }, [selectedStateId]);
 
  useEffect(() => {
    if (selectedClusterId) {
       setSelectedDistrictId('');
       if (selectedClusterId !== 'all') {
         fetchDistricts({ clusterId: selectedClusterId }); 
       } else {
         fetchDistricts(); // Fetch all districts
       }
    }
  }, [selectedClusterId]);

  useEffect(() => {
    fetchOffers();
  }, [selectedCountryId, selectedStateId, selectedClusterId, selectedDistrictId, activeTab]);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      let type = '';
      if (activeTab === 'solar') type = 'Solar Cashback';
      else if (activeTab === 'loyalty') type = 'Loyalty Program';
      else if (activeTab === 'limited') type = 'Limited Stock';
      
      const res = await salesSettingsService.getOffers({ type });
      // Keep it simple and filter by active locations on frontend if backend doesn't handle fully natively yet
      // Backend actually handles it via basic query.
      let filtered = res || [];
      if (selectedStateId && selectedStateId !== 'all') filtered = filtered.filter(o => o.location?.state === selectedStateId || o.location?.state === 'All');
      if (selectedClusterId && selectedClusterId !== 'all') filtered = filtered.filter(o => o.location?.cluster === selectedClusterId || o.location?.cluster === 'All');
      if (selectedDistrictId && selectedDistrictId !== 'all') filtered = filtered.filter(o => o.location?.district === selectedDistrictId || o.location?.district === 'All');

      setOffers(filtered);
    } catch (error) {
      console.error("Error fetching offers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this offer?")) {
      try {
        await salesSettingsService.deleteOffer(id);
        fetchOffers();
      } catch (error) {
        console.error("Error deleting offer:", error);
      }
    }
  };

  const handleSolarSubmit = async () => {
    try {
      const payload = {
        offerName: "Solar Panel Bundle Cashback",
        offerType: 'Solar Cashback',
        cpType: solarForm.cpType,
        projectType: solarForm.projectType,
        brand: solarForm.brand,
        kwSelection: solarForm.kwSelection,
        targetKw: Number(solarForm.targetKw),
        cashbackAmount: Number(solarForm.cashbackDetails),
        startDate: solarForm.startDate,
        endDate: solarForm.endDate,
        autoRenew: solarForm.autoRenew,
        location: {
          country: selectedCountryId || 'All',
          state: selectedStateId || 'All',
          district: selectedDistrictId || 'All',
          cluster: solarForm.cluster === 'All' ? 'All' : solarForm.cluster
        },
        status: 'Active'
      };
      await salesSettingsService.createOffer(payload);
      alert("Solar Cashback Offer Saved!");
      fetchOffers();
    } catch (error) {
      console.error("Error saving offer:", error);
      alert("Failed to save offer");
    }
  };

  const handleLoyaltySubmit = async () => {
    try {
      const payload = {
        offerName: "Loyalty Cashback",
        offerType: 'Loyalty Program',
        cpType: loyaltyForm.cpType,
        projectType: loyaltyForm.projectType,
        brand: loyaltyForm.brand,
        kwSelection: loyaltyForm.kwSelection,
        yearCashbacks: loyaltyForm.yearCashbacks,
        location: {
          country: selectedCountryId || 'All',
          state: selectedStateId || 'All',
          district: selectedDistrictId || 'All',
          cluster: loyaltyForm.cluster === 'All' ? 'All' : loyaltyForm.cluster
        },
        status: 'Active'
      };
      await salesSettingsService.createOffer(payload);
      alert("Loyalty Program Saved!");
      fetchOffers();
    } catch (error) {
      console.error("Error saving loyalty offer:", error);
      alert("Failed to save offer");
    }
  };

  const handleStockSubmit = async () => {
    try {
      const payload = {
        offerName: "Limited Stock Offer",
        offerType: 'Limited Stock',
        bundlePlan: stockForm.bundlePlan,
        currentStock: Number(stockForm.currentStock),
        product: stockForm.product,
        deadline: stockForm.deadline,
        brand: stockForm.brand,
        cashbackValue: Number(stockForm.cashbackValue),
        location: {
          country: selectedCountryId || 'All',
          state: selectedStateId || 'All',
          district: selectedDistrictId || 'All',
          cluster: stockForm.cluster === 'All' ? 'All' : stockForm.cluster
        },
        status: 'Active'
      };
      await salesSettingsService.createOffer(payload);
      alert("Limited Stock Offer Saved!");
      fetchOffers();
    } catch (error) {
      console.error("Error saving stock offer:", error);
      alert("Failed to save offer");
    }
  };

  const handleNewOfferSubmit = async () => {
    if (!newOfferForm.offerName) return alert("Offer name is required");
    try {
      const payload = {
        offerName: newOfferForm.offerName,
        offerType: newOfferForm.offerType,
        status: 'Active'
      };
      await salesSettingsService.createOffer(payload);
      alert("New Offer Saved!");
      setShowNewOfferModal(false);
      setNewOfferForm({ offerName: '', offerType: 'Referral Bonus' });
      fetchOffers();
    } catch (error) {
      console.error("Error saving new offer:", error);
      alert("Failed to save offer");
    }
  };

  return (
    <div className="bg-[#f4f7fa] min-h-screen font-sans">
      {/* Header Block */}
      <div className="bg-white p-6 border-b border-gray-200 mb-8 px-12">
        <h1 className="text-[22px] font-bold text-[#14233c] mb-2">Offers Management</h1>
        <button
          onClick={() => setShowLocationCards(!showLocationCards)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0076a8] text-white rounded text-xs font-bold shadow-sm hover:bg-blue-800 transition-all"
        >
          {showLocationCards ? <EyeOff size={14} /> : <Eye size={14} />}
          {showLocationCards ? 'Hide Location Cards' : 'Show Location Cards'}
        </button>
      </div>

      <div className="px-12 pb-12">
        {/* Dynamic Location Path Display */}
        {selectedStateObj && !showLocationCards && (
           <div className="mb-4 text-sm text-gray-600 flex items-center gap-2">
             <MapPin size={14} className="text-gray-400" />
             Filtering by: 
             {selectedCountryObj && <><span className="font-bold text-[#14233c]">{selectedCountryObj.name}</span> <span className="text-gray-400">&gt;</span></>}
             <span className="font-bold text-[#14233c]">{selectedStateObj?.name}</span>
             {selectedClusterObj && <><span className="text-gray-400">&gt;</span><span className="font-bold text-[#14233c]">{selectedClusterObj.name}</span></>}
             {selectedDistrictObj && <><span className="text-gray-400">&gt;</span><span className="font-bold text-[#14233c]">{selectedDistrictObj.name}</span></>}
           </div>
        )}

        {/* Location Selection Cards */}
        {showLocationCards && (
          <div className="mb-8 bg-gray-50 p-6 rounded-xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
             {/* Country Select */}
             <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-[16px] font-bold text-[#14233c] flex items-center gap-2">
                    <MapPin className="text-[#007bff]" size={16} /> Select Country
                  </h2>
                  <button onClick={() => { setSelectedCountryId('all'); setSelectedStateId(''); setSelectedClusterId(''); setSelectedDistrictId(''); }} className="text-xs font-bold text-[#0076a8] hover:underline uppercase tracking-wider">Select All</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    <LocationCard 
                      title="All Countries" subtitle="ALL" isSelected={selectedCountryId === 'all' || selectedCountryId === ''} 
                      onClick={() => { setSelectedCountryId('all'); setSelectedStateId(''); setSelectedClusterId(''); setSelectedDistrictId(''); }} 
                    />
                    {countries.map((c) => (
                      <LocationCard 
                         key={c._id} title={c.name} subtitle={c.code || c.name.substring(0,2).toUpperCase()} 
                         isSelected={selectedCountryId === c._id}
                         onClick={() => setSelectedCountryId(c._id)} 
                      />
                    ))}
                </div>
             </div>

             {/* State Select */}
             {selectedCountryId && (
              <div className="mb-6 border-t border-gray-100 pt-6 animate-in slide-in-from-left duration-300">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-[16px] font-bold text-[#14233c] flex items-center gap-2">
                    <MapPin className="text-[#007bff]" size={16} /> Select State
                  </h2>
                  <button onClick={() => { setSelectedStateId('all'); setSelectedClusterId(''); setSelectedDistrictId(''); }} className="text-xs font-bold text-[#0076a8] hover:underline uppercase tracking-wider">Select All</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    <LocationCard 
                      title="All States" subtitle="ALL" isSelected={selectedStateId === 'all' || (selectedCountryId && selectedStateId === '')} isState={true}
                      onClick={() => { setSelectedStateId('all'); setSelectedClusterId(''); setSelectedDistrictId(''); }} 
                    />
                    {states.map((s) => (
                      <LocationCard 
                         key={s._id} title={s.name} subtitle={s.code || s.name.substring(0,2).toUpperCase()} 
                         isSelected={selectedStateId === s._id} isState={true}
                         onClick={() => setSelectedStateId(s._id)} 
                      />
                    ))}
                </div>
              </div>
             )}

              {/* Cluster Select */}
             {selectedStateId && (
                <div className="mb-6 border-t border-gray-100 pt-6 animate-in slide-in-from-left duration-300">
                  <div className="flex justify-between items-center mb-3">
                    <h2 className="text-[16px] font-bold text-[#14233c] flex items-center gap-2">
                      <Layers className="text-[#007bff]" size={16} /> Select Cluster
                    </h2>
                    <button onClick={() => { setSelectedClusterId('all'); setSelectedDistrictId(''); }} className="text-xs font-bold text-[#0076a8] hover:underline uppercase tracking-wider">Select All</button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                     <LocationCard 
                        title="All Clusters" subtitle="ALL" isSelected={selectedClusterId === 'all' || selectedClusterId === ''} 
                        onClick={() => { setSelectedClusterId('all'); setSelectedDistrictId(''); }} 
                     />
                     {clusters.map((c) => (
                        <LocationCard 
                          key={c._id} title={c.name} subtitle={selectedStateObj?.name || 'State'} 
                          isSelected={selectedClusterId === c._id} 
                          onClick={() => setSelectedClusterId(c._id)} 
                        />
                     ))}
                  </div>
                </div>
             )}

              {/* District Select */}
             {selectedClusterId && (
                <div className="border-t border-gray-100 pt-6 animate-in slide-in-from-left duration-300">
                  <div className="flex justify-between items-center mb-3">
                    <h2 className="text-[16px] font-bold text-[#14233c] flex items-center gap-2">
                      <MapPin className="text-[#007bff]" size={16} /> Select District
                    </h2>
                    <button onClick={() => setSelectedDistrictId('all')} className="text-xs font-bold text-[#0076a8] hover:underline uppercase tracking-wider">Select All</button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                     <LocationCard 
                        title="All Districts" subtitle="ALL" isSelected={selectedDistrictId === 'all' || selectedDistrictId === ''} 
                        onClick={() => setSelectedDistrictId('all')} 
                     />
                     {districts.map((d) => (
                        <LocationCard 
                          key={d._id} title={d.name} subtitle={selectedClusterObj?.name || 'Cluster'} 
                          isSelected={selectedDistrictId === d._id} 
                          onClick={() => setSelectedDistrictId(d._id)} 
                        />
                     ))}
                  </div>
                </div>
             )}
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex gap-4 mb-6 mt-4">
          <button 
             className={`px-5 py-2.5 rounded-full font-bold text-sm shadow-sm transition-colors flex items-center gap-2 ${activeTab === 'solar' ? 'bg-[#28a745] text-white' : 'bg-[#e5f5ea] text-[#28a745] hover:bg-[#d4eddb]'}`}
             onClick={() => setActiveTab('solar')}
          >
             Solar Cashback <span className="bg-white text-[#28a745] px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider">Active</span>
          </button>
          <button 
             className={`px-5 py-2.5 rounded-full font-bold text-sm shadow-sm transition-colors flex items-center gap-2 ${activeTab === 'loyalty' ? 'bg-[#ffc107] text-[#343a40]' : 'bg-[#fff8e5] text-[#d39e00] hover:bg-[#ffefc2]'}`}
             onClick={() => setActiveTab('loyalty')}
          >
             Loyalty Program <span className="bg-white text-[#ffc107] px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider shadow-sm">New</span>
          </button>
          <button onClick={() => setActiveTab('limited')}
             className={`px-5 py-2.5 rounded-full font-bold text-sm shadow-sm transition-colors flex items-center gap-2 ${activeTab === 'limited' ? 'bg-[#dc3545] text-white' : 'bg-[#fceeed] text-[#dc3545] hover:bg-[#fadbd8]'}`}
          >
             Limited Stock <span className="bg-white text-[#dc3545] px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider shadow-sm">Hurry!</span>
          </button>
          <button onClick={() => setShowNewOfferModal(true)} className="px-5 py-2.5 rounded font-bold text-sm bg-[#343a40] text-white hover:bg-black transition-colors shadow-sm ml-2">
             New Offer
          </button>
        </div>

        {/* Form Area */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
           
           {/* Solar Cashback Form */}
           {activeTab === 'solar' && (
             <div className="animate-in fade-in zoom-in-95 duration-300">
               <div className="flex justify-between items-center mb-8 border-b pb-4">
                 <h2 className="text-2xl font-bold text-[#28a745]">Solar Panel Bundle Cashback</h2>
                 <span className="bg-[#28a745] text-white text-xs font-bold px-3 py-1.5 rounded">Active Until: 31 Dec 2025</span>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-6">
                  {/* Col 1 */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-[#14233c] mb-2">CP Type</label>
                      <select className="w-full border border-gray-200 rounded p-2.5 text-sm bg-white" value={solarForm.cpType} onChange={e => setSolarForm({...solarForm, cpType: e.target.value})}>
                        <option>Starter</option>
                        <option>Pro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#14233c] mb-2">Project Type</label>
                      <select className="w-full border border-gray-200 rounded p-2.5 text-sm bg-white" value={solarForm.projectType} onChange={e => setSolarForm({...solarForm, projectType: e.target.value})}>
                        <option>All</option>
                        <option>Residential</option>
                        <option>Commercial</option>
                      </select>
                    </div>
                    <div>
                         {/* Notice: Screenshot shows Cluster inside the form as well. */}
                      <label className="block text-sm font-bold text-[#14233c] mb-2">Cluster</label>
                      <select className="w-full border border-gray-200 rounded p-2.5 text-sm bg-white" value={solarForm.cluster} onChange={e => setSolarForm({...solarForm, cluster: e.target.value})}>
                        <option>All</option>
                         {clusters.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#14233c] mb-2">Cashback Details</label>
                      <div className="flex items-center gap-3">
                         <div className="relative flex-1">
                            <span className="absolute left-3 top-2.5 text-gray-500 font-medium">₹</span>
                            <input type="number" className="w-full border border-gray-200 rounded p-2.5 pl-8 text-sm" value={solarForm.cashbackDetails} onChange={e => setSolarForm({...solarForm, cashbackDetails: e.target.value})} />
                         </div>
                         <span className="text-sm text-gray-500 w-16">per kW</span>
                      </div>
                    </div>
                  </div>

                  {/* Col 2 */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-[#14233c] mb-2">Brand-wise Selection</label>
                      <select className="w-full border border-gray-200 rounded p-2.5 text-sm bg-white" value={solarForm.brand} onChange={e => setSolarForm({...solarForm, brand: e.target.value})}>
                        <option>Adani</option>
                        <option>Tata Power</option>
                        <option>Waaree</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#14233c] mb-2">kW-wise Selection</label>
                      <select className="w-full border border-gray-200 rounded p-2.5 text-sm bg-white" value={solarForm.kwSelection} onChange={e => setSolarForm({...solarForm, kwSelection: e.target.value})}>
                        <option>1-3 kW</option>
                        <option>3-5 kW</option>
                        <option>5-10 kW</option>
                        <option>10+ kW</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#14233c] mb-2">Target Kw</label>
                      <input type="number" className="w-full border border-gray-200 rounded p-2.5 text-sm" value={solarForm.targetKw} onChange={e => setSolarForm({...solarForm, targetKw: e.target.value})} />
                      <p className="text-xs text-gray-400 mt-1.5">Minimum kW capacity for eligibility</p>
                    </div>
                  </div>

                  {/* Col 3 */}
                  <div className="space-y-6">
                     <label className="block text-sm font-bold text-[#14233c]">Offer Duration</label>
                     <div>
                       <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                       <input type="date" className="w-full border border-gray-200 rounded p-2.5 text-sm" value={solarForm.startDate} onChange={e => setSolarForm({...solarForm, startDate: e.target.value})} />
                     </div>
                     <div>
                       <label className="block text-xs text-gray-500 mb-1">End Date</label>
                       <input type="date" className="w-full border border-gray-200 rounded p-2.5 text-sm" value={solarForm.endDate} onChange={e => setSolarForm({...solarForm, endDate: e.target.value})} />
                     </div>
                     <div className="flex items-center gap-2 mt-4 cursor-pointer" onClick={() => setSolarForm({...solarForm, autoRenew: !solarForm.autoRenew})}>
                       <div className={`w-4 h-4 border rounded flex items-center justify-center ${solarForm.autoRenew ? 'bg-[#0076a8] border-[#0076a8]' : 'border-gray-400'}`}>
                          {solarForm.autoRenew && <div className="w-2 h-2 bg-white shrink-0" />}
                       </div>
                       <span className="text-sm text-gray-700">Auto-renew Offer</span>
                     </div>
                  </div>
               </div>
               
               <div className="flex justify-end mt-8">
                 <button onClick={handleSolarSubmit} className="bg-[#28a745] text-white px-6 py-2.5 rounded font-bold shadow hover:bg-green-600 transition-colors text-sm">
                   Save Solar Offer
                 </button>
               </div>
             </div>
           )}

           {/* Loyalty Program Form */}
           {activeTab === 'loyalty' && (
             <div className="animate-in fade-in zoom-in-95 duration-300">
               <div className="flex justify-between items-center mb-8 border-b pb-4">
                 <h2 className="text-2xl font-bold text-[#ffc107]">Loyalty Cashback</h2>
                 <span className="bg-[#ffc107] text-[#343a40] text-xs font-bold px-3 py-1.5 rounded">Ongoing</span>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
                  {/* Col 1 */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-[#14233c] mb-2">CP Type</label>
                      <select className="w-full border border-gray-200 rounded p-2.5 text-sm bg-white" value={loyaltyForm.cpType} onChange={e => setLoyaltyForm({...loyaltyForm, cpType: e.target.value})}>
                        <option>Starter</option>
                        <option>Pro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#14233c] mb-2">Project Type</label>
                      <select className="w-full border border-gray-200 rounded p-2.5 text-sm bg-white" value={loyaltyForm.projectType} onChange={e => setLoyaltyForm({...loyaltyForm, projectType: e.target.value})}>
                        <option>All</option>
                        <option>Residential</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#14233c] mb-2">Cluster</label>
                      <select className="w-full border border-gray-200 rounded p-2.5 text-sm bg-white" value={loyaltyForm.cluster} onChange={e => setLoyaltyForm({...loyaltyForm, cluster: e.target.value})}>
                         <option>All</option>
                         {clusters.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#14233c] mb-2">Brand-wise Selection</label>
                      <select className="w-full border border-gray-200 rounded p-2.5 text-sm bg-white" value={loyaltyForm.brand} onChange={e => setLoyaltyForm({...loyaltyForm, brand: e.target.value})}>
                        <option>Adani</option>
                        <option>Tata Power</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#14233c] mb-2">kW-wise Selection</label>
                      <select className="w-full border border-gray-200 rounded p-2.5 text-sm bg-white" value={loyaltyForm.kwSelection} onChange={e => setLoyaltyForm({...loyaltyForm, kwSelection: e.target.value})}>
                        <option>1-3 kW</option>
                        <option>3-5 kW</option>
                      </select>
                    </div>
                  </div>

                  {/* Col 2 - Yearwise Cashback */}
                  <div>
                    <div className="bg-[#f0f9ff] rounded-lg p-5 border border-blue-50 h-full">
                       <h3 className="font-bold text-[#14233c] mb-6 flex items-center gap-2 text-base">
                         <span className="text-[#007bff]">📅</span> Year-wise Cashback
                       </h3>
                       <div className="grid grid-cols-2 gap-4 mb-3">
                          <span className="text-xs font-bold text-gray-400">Years</span>
                          <span className="text-xs font-bold text-gray-400">Cashback (₹)</span>
                       </div>
                       
                       {loyaltyForm.yearCashbacks.map((yc, idx) => (
                          <div key={idx} className="grid grid-cols-2 gap-4 mb-4">
                            <input 
                              type="number" 
                              className="w-full border border-gray-200 rounded p-2.5 text-sm bg-white" 
                              value={yc.years} 
                              onChange={e => {
                                const newArr = [...loyaltyForm.yearCashbacks];
                                newArr[idx].years = Number(e.target.value);
                                setLoyaltyForm({...loyaltyForm, yearCashbacks: newArr});
                              }}
                            />
                            <input 
                              type="number" 
                              className="w-full border border-gray-200 rounded p-2.5 text-sm bg-white" 
                              value={yc.cashback}
                              onChange={e => {
                                const newArr = [...loyaltyForm.yearCashbacks];
                                newArr[idx].cashback = Number(e.target.value);
                                setLoyaltyForm({...loyaltyForm, yearCashbacks: newArr});
                              }} 
                            />
                          </div>
                       ))}
                       <button 
                         className="text-xs font-bold text-[#007bff] hover:underline"
                         onClick={() => setLoyaltyForm({...loyaltyForm, yearCashbacks: [...loyaltyForm.yearCashbacks, {years: 0, cashback: 0}]})}
                       >
                         + Add Year
                       </button>
                    </div>
                  </div>
               </div>
               
               <div className="flex justify-center mt-8">
                 <button onClick={handleLoyaltySubmit} className="bg-[#ffc107] text-[#343a40] px-8 py-2.5 rounded font-bold shadow hover:bg-yellow-500 transition-colors text-sm">
                   Save Program
                 </button>
               </div>
             </div>
           )}

           {/* Limited Stock Form */}
           {activeTab === 'limited' && (
             <div className="animate-in fade-in zoom-in-95 duration-300">
               <div className="flex justify-between items-center mb-8 border-b pb-4">
                 <h2 className="text-2xl font-bold text-[#dc3545]">Limited Stock Offer</h2>
                 <span className="bg-[#dc3545] text-white text-xs font-bold px-3 py-1.5 rounded">Limited Time</span>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-6">
                  {/* Col 1 */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-[#14233c] mb-2">Cluster</label>
                      <select className="w-full border border-gray-200 rounded p-2.5 text-sm bg-white" value={stockForm.cluster} onChange={e => setStockForm({...stockForm, cluster: e.target.value})}>
                         <option>Ahmedabad</option>
                         <option>Rajkot</option>
                         {clusters.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#14233c] mb-2">Bundle Plan</label>
                      <select className="w-full border border-gray-200 rounded p-2.5 text-sm bg-white" value={stockForm.bundlePlan} onChange={e => setStockForm({...stockForm, bundlePlan: e.target.value})}>
                        <option>Basic Solar Bundle</option>
                        <option>Premium Panel Bundle</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#14233c] mb-2">Current Stock</label>
                      <input type="number" className="w-full border border-gray-200 rounded p-2.5 text-sm" value={stockForm.currentStock} onChange={e => setStockForm({...stockForm, currentStock: e.target.value})} />
                    </div>
                  </div>

                  {/* Col 2 */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-[#14233c] mb-2">Product</label>
                      <select className="w-full border border-gray-200 rounded p-2.5 text-sm bg-white" value={stockForm.product} onChange={e => setStockForm({...stockForm, product: e.target.value})}>
                        <option>Solar Panel</option>
                        <option>Inverter</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#14233c] mb-2">Deadline</label>
                      <input type="date" className="w-full border border-gray-200 rounded p-2.5 text-sm" value={stockForm.deadline} onChange={e => setStockForm({...stockForm, deadline: e.target.value})} />
                    </div>
                  </div>

                  {/* Col 3 */}
                  <div className="space-y-6">
                     <div>
                      <label className="block text-sm font-bold text-[#14233c] mb-2">Brand</label>
                      <select className="w-full border border-gray-200 rounded p-2.5 text-sm bg-white" value={stockForm.brand} onChange={e => setStockForm({...stockForm, brand: e.target.value})}>
                        <option>Adani</option>
                        <option>Waaree</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#14233c] mb-2">Cashback Value</label>
                      <div className="flex items-center gap-3">
                         <div className="relative flex-1">
                            <span className="absolute left-3 top-2.5 text-gray-500 font-medium">₹</span>
                            <input type="number" className="w-full border border-gray-200 rounded p-2.5 pl-8 text-sm" value={stockForm.cashbackValue} onChange={e => setStockForm({...stockForm, cashbackValue: e.target.value})} />
                         </div>
                         <span className="text-gray-400 font-medium">₹</span>
                      </div>
                    </div>
                  </div>
               </div>
               
               <div className="flex justify-center mt-8">
                 <button onClick={handleStockSubmit} className="bg-[#dc3545] text-white px-8 py-2.5 rounded font-bold shadow hover:bg-red-700 transition-colors text-sm">
                   Save Limited Stock Offer
                 </button>
               </div>
             </div>
           )}

        </div>

        {/* Global Offers Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                 <h3 className="text-lg font-bold text-[#14233c]">Saved Offers</h3>
             </div>
             <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm whitespace-nowrap">
                     <thead className="bg-[#343a40] text-white">
                         <tr>
                             <th className="p-3 border-r border-white/20 font-bold">Offer Name</th>
                             <th className="p-3 border-r border-white/20 font-bold">Offer Type</th>
                             <th className="p-3 border-r border-white/20 font-bold">Brand/Plan</th>
                             <th className="p-3 border-r border-white/20 font-bold">Target</th>
                             <th className="p-3 border-r border-white/20 font-bold">Cashback / Value</th>
                             <th className="p-3 border-r border-white/20 font-bold">Country</th>
                              <th className="p-3 border-r border-white/20 font-bold">State</th>
                             <th className="p-3 border-r border-white/20 font-bold">Cluster</th>
                             <th className="p-3 border-r border-white/20 font-bold">Deadline / Status</th>
                             <th className="p-3 font-bold text-center">Actions</th>
                         </tr>
                     </thead>
                     <tbody>
                         {loading ? (
                             <tr><td colSpan="10" className="text-center p-6 text-gray-500">Loading offers...</td></tr>
                         ) : offers.length === 0 ? (
                             <tr><td colSpan="10" className="text-center p-6 text-gray-500">No offers found holding current filter criteria.</td></tr>
                         ) : (
                             offers.map(offer => (
                                 <tr key={offer._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                     <td className="p-3 border-r border-gray-100 font-bold text-[#0076a8]">{offer.offerName}</td>
                                     <td className="p-3 border-r border-gray-100 font-medium">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                            offer.offerType === 'Solar Cashback' ? 'bg-[#e5f5ea] text-[#28a745]' :
                                            offer.offerType === 'Loyalty Program' ? 'bg-[#fff8e5] text-[#d39e00]' :
                                            'bg-[#fceeed] text-[#dc3545]'
                                        }`}>
                                          {offer.offerType}
                                        </span>
                                     </td>
                                     <td className="p-3 border-r border-gray-100 text-gray-600">{offer.brand || offer.bundlePlan || 'N/A'}</td>
                                     <td className="p-3 border-r border-gray-100 text-gray-600">
                                         {offer.cpType}{offer.projectType ? `, ${offer.projectType}` : ''}
                                         {offer.kwSelection ? ` (${offer.kwSelection})` : ''}
                                     </td>
                                     <td className="p-3 border-r border-gray-100 text-gray-800 font-bold text-center">
                                         {offer.cashbackAmount ? `₹${offer.cashbackAmount}` : offer.yearCashbacks?.length ? `${offer.yearCashbacks.length} Tiers` : '-'}
                                     </td>
                                     <td className="p-3 border-r border-gray-100 text-gray-600 text-center">{offer.location?.country !== 'All' ? countries.find(c => c._id === offer.location?.country)?.name || offer.location?.country : 'All'}</td>
                                      <td className="p-3 border-r border-gray-100 text-gray-600 text-center">{offer.location?.state !== 'All' ? states.find(s => s._id === offer.location?.state)?.name || offer.location?.state : 'All'}</td>
                                     <td className="p-3 border-r border-gray-100 text-gray-600 text-center">{offer.location?.cluster !== 'All' ? clusters.find(c => c._id === offer.location?.cluster)?.name || offer.location?.cluster : 'All'}</td>
                                     <td className="p-3 border-r border-gray-100 text-gray-600 text-center">
                                         {offer.endDate ? new Date(offer.endDate).toLocaleDateString() : offer.deadline ? new Date(offer.deadline).toLocaleDateString() : 'N/A'}
                                     </td>
                                     <td className="p-3 text-center">
                                         <button onClick={() => handleDelete(offer._id)} className="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded-full transition-colors">
                                            <Trash2 size={16} />
                                         </button>
                                     </td>
                                 </tr>
                             ))
                         )}
                     </tbody>
                 </table>
             </div>
        </div>

      </div>

      {/* New Offer Modal */}
      {showNewOfferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 pb-4">
                 <div className="mb-4">
                    <label className="block text-sm font-bold text-[#14233c] mb-2">Offer Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g., Festival Special Discount" 
                      className="w-full border border-gray-300 rounded p-2.5 text-sm focus:outline-none focus:border-[#007bff] focus:ring-1 focus:ring-[#007bff]"
                      value={newOfferForm.offerName}
                      onChange={(e) => setNewOfferForm({...newOfferForm, offerName: e.target.value})}
                    />
                 </div>
                 <div className="mb-4">
                    <label className="block text-sm font-bold text-[#14233c] mb-2">Offer Type</label>
                    <select 
                      className="w-full border border-gray-300 rounded p-2.5 text-sm bg-white focus:outline-none focus:border-[#007bff] focus:ring-1 focus:ring-[#007bff]"
                      value={newOfferForm.offerType}
                      onChange={(e) => setNewOfferForm({...newOfferForm, offerType: e.target.value})}
                    >
                      <option>Referral Bonus</option>
                      <option>Cashback Offer</option>
                      <option>Loyalty Program</option>
                      <option>Limited Stock Offer</option>
                      <option>Seasonal Discount</option>
                    </select>
                 </div>
              </div>
              <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                <button 
                  className="px-4 py-2 bg-[#6c757d] text-white text-sm font-bold rounded hover:bg-gray-600 transition-colors"
                  onClick={() => setShowNewOfferModal(false)}
                >
                  Close
                </button>
                <button 
                  className="px-4 py-2 bg-[#007bff] text-white text-sm font-bold rounded hover:bg-blue-600 transition-colors"
                  onClick={handleNewOfferSubmit}
                >
                  Save
                </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}