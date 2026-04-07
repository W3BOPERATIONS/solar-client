import React, { useState, useEffect } from 'react';
import { useLocations } from '../../../../hooks/useLocations';
import salesSettingsService from '../../../../services/settings/salesSettingsApi';
import axiosInstance from '../../../../api/axios';
import { EyeOff, Eye, MapPin, Layers, Trash2, Edit } from 'lucide-react';

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

  const [activeTab, setActiveTab] = useState('solar');
  const [offers, setOffers] = useState([]);
  const [customTabs, setCustomTabs] = useState([]); // List of custom offer types from DB
  const [loading, setLoading] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState(null);

  const { countries, states, districts, clusters, fetchCountries, fetchStates, fetchDistricts, fetchClusters } = useLocations();
  const selectedCountryObj = countries.find((c) => c._id === selectedCountryId) || null;
  const selectedStateObj = states.find((s) => s._id === selectedStateId) || null;
  const selectedClusterObj = clusters.find((c) => c._id === selectedClusterId) || null;
  const selectedDistrictObj = districts.find((d) => d._id === selectedDistrictId) || null;

  // Global Location Logic
  useEffect(() => {
    fetchCountries();
  }, []);

  // Form States (Solar Panel Bundle Cashback)
  const [solarForm, setSolarForm] = useState({
    cpType: '', 
    selectedPlans: [], // Multiselect
    product: '',
    category: 'All Categories',
    subCategory: 'All Sub Categories',
    brand: 'Adani', 
    kwSelection: '1-3 kW', 
    targetKw: 5,
    cashbackDetails: 1500, 
    startDate: '', 
    endDate: '', 
    autoRenew: false
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

  // Dynamic filter lists
  const [categoriesList, setCategoriesList] = useState([]);
  const [subCategoriesList, setSubCategoriesList] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [brandsList, setBrandsList] = useState([]);
  const [partnerTypesList, setPartnerTypesList] = useState([]);
  const [plansList, setPlansList] = useState([]);

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

  // Fetch Filter Data
  const fetchFilterData = async () => {
    try {
      const { productApi } = await import('../../../../api/productApi');
      const results = await Promise.allSettled([
        productApi.getCategories(),
        productApi.getSubCategories(),
        productApi.getBrands(),
        productApi.getAll(),
        axiosInstance.get('/partner-settings/types')
      ]);
      
      const safeExtract = (result) => {
          if (result.status !== 'fulfilled') return [];
          const val = result.value;
          if (Array.isArray(val)) return val;
          if (val && Array.isArray(val.data)) return val.data;
          if (val && val.data && Array.isArray(val.data.data)) return val.data.data;
          return [];
      };
      
      setCategoriesList(safeExtract(results[0]));
      setSubCategoriesList(safeExtract(results[1]));
      setBrandsList(safeExtract(results[2]));
      setProductsList(safeExtract(results[3]));
      setPartnerTypesList(safeExtract(results[4]));
    } catch (error) {
      console.error("Error fetching filter data:", error);
    }
  };

  useEffect(() => {
    fetchCountries();
    fetchFilterData();
  }, []);

  // Fetch Dynamic Plans based on Location & Partner Type
  const fetchDynamicPlans = async () => {
    // Required filters: at least Partner Type and State should be selected
    if (!solarForm.cpType || !selectedStateId || selectedStateId === 'all') {
      setPlansList([]);
      return;
    }

    try {
      const params = {};
      if (selectedCountryId && selectedCountryId !== 'all') params.countryId = selectedCountryId;
      if (selectedStateId && selectedStateId !== 'all') params.stateId = selectedStateId;
      if (selectedClusterId && selectedClusterId !== 'all') params.clusterId = selectedClusterId;
      if (selectedDistrictId && selectedDistrictId !== 'all') params.districtId = selectedDistrictId;
      if (solarForm.cpType) params.partnerType = solarForm.cpType;

      const res = await axiosInstance.get('/partner-settings/plans', { params });
      const plans = res.data || [];
      
      // Keep only unique names to avoid duplicates in the UI
      const uniquePlanNames = [];
      const uniquePlans = [];
      
      plans.forEach(p => {
         if (!uniquePlanNames.includes(p.name)) {
            uniquePlanNames.push(p.name);
            uniquePlans.push({ id: p._id, name: p.name });
         }
      });

      setPlansList(uniquePlans);
    } catch (error) {
       console.error("Error fetching dynamic plans:", error);
    }
  };

  useEffect(() => {
    fetchDynamicPlans();
  }, [selectedCountryId, selectedStateId, selectedClusterId, selectedDistrictId, solarForm.cpType]);

  // Sync selectedPlans with plansList (keep only those that still exist)
  useEffect(() => {
    const validPlanNames = plansList.map(p => p.name);
    const newSelected = solarForm.selectedPlans.filter(p => validPlanNames.includes(p));
    if (newSelected.length !== solarForm.selectedPlans.length) {
       setSolarForm(prev => ({...prev, selectedPlans: newSelected}));
    }
  }, [plansList]);

  useEffect(() => {
    fetchOffers();
  }, [selectedCountryId, selectedStateId, selectedClusterId, selectedDistrictId, activeTab]);

  const handleEdit = (offer) => {
    setEditingOfferId(offer._id);
    const type = offer.offerType;

    if (type === 'Solar Cashback') {
       setActiveTab('solar');
       setSolarForm({
          cpType: offer.cpType || '',
          selectedPlans: offer.plans || [],
          product: offer.product || '',
          category: offer.category || 'All Categories',
          subCategory: offer.subCategory || 'All Sub Categories',
          brand: offer.brand || 'Adani',
          kwSelection: offer.kwSelection || '1-3 kW',
          targetKw: offer.targetKw || 5,
          cashbackDetails: offer.cashbackAmount || 1500,
          startDate: offer.startDate ? offer.startDate.split('T')[0] : '',
          endDate: offer.endDate ? offer.endDate.split('T')[0] : '',
          autoRenew: offer.autoRenew || false
       });
    } else if (type === 'Loyalty Program') {
       setActiveTab('loyalty');
       setLoyaltyForm({
          cpType: offer.cpType || 'Dealer',
          projectType: offer.projectType || 'Residential',
          brand: offer.brand || 'Adani',
          kwSelection: offer.kwSelection || '1-3 kW',
          yearCashbacks: offer.yearCashbacks || [{years: 1, cashback: 1000}, {years: 5, cashback: 5000}],
          cluster: offer.location?.cluster || 'All'
       });
    } else if (type === 'Limited Stock') {
       setActiveTab('limited');
       setStockForm({
          cluster: offer.location?.cluster || 'Ahmedabad',
          bundlePlan: offer.bundlePlan || 'Basic Solar Bundle',
          currentStock: offer.currentStock || 10,
          product: offer.product || 'Solar Panel',
          deadline: offer.deadline ? offer.deadline.split('T')[0] : '',
          brand: offer.brand || 'Adani',
          cashbackValue: offer.cashbackValue || 1500,
       });
    } else {
       // Custom dynamic offer
       setActiveTab(offer.offerName);
       setNewOfferForm({
          offerName: offer.offerName,
          offerType: offer.offerType
       });
       setShowNewOfferModal(true);
    }

    // Set Global Filters to match offer location
    if (offer.location) {
       setSelectedCountryId(offer.location.country || 'All');
       setSelectedStateId(offer.location.state || 'All');
       setSelectedDistrictId(offer.location.district || 'All');
       setSelectedClusterId(offer.location.cluster || 'All');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isWithinTimeline = (start, end) => {
    if (!start || !end) return false;
    const now = new Date();
    const startDate = new Date(start);
    const endDate = new Date(end);
    return now >= startDate && now <= endDate;
  };

  const fetchOffers = async () => {
    setLoading(true);
    try {
      let type = '';
      // Fetch ALL offers initially to get types, or fetch by type if tab is a main one
      // Strategy: Fetch all to find unique types, then filter for display
      const res = await salesSettingsService.getOffers({});
      const allOffers = res || [];
      
      // Extract unique custom names
      const mainOfferNames = ["Solar Panel Bundle Cashback", "Loyalty Program", "Limited Stock Offer"];
      const uniqueNames = [...new Set(allOffers.map(o => o.offerName))].filter(n => n && !mainOfferNames.includes(n));
      setCustomTabs(uniqueNames);

      let filtered = allOffers;
      
      if (activeTab === 'solar') {
         filtered = allOffers.filter(o => o.offerType === 'Solar Cashback');
      } else if (activeTab === 'loyalty') {
         filtered = allOffers.filter(o => o.offerType === 'Loyalty Program');
      } else if (activeTab === 'limited') {
         filtered = allOffers.filter(o => o.offerType === 'Limited Stock');
      } else {
         // It's a custom tab based on NAME
         filtered = allOffers.filter(o => o.offerName === activeTab);
      }
      if (selectedStateId && selectedStateId !== 'all') {
         filtered = filtered.filter(o => {
            const loc = o.location;
            if (!loc) return true; // Global if no location specified
            return loc.state === selectedStateId || loc.state === 'All' || !loc.state;
         });
      }
      if (selectedClusterId && selectedClusterId !== 'all') {
         filtered = filtered.filter(o => {
            const loc = o.location;
            if (!loc) return true;
            return loc.cluster === selectedClusterId || loc.cluster === 'All' || !loc.cluster;
         });
      }
      if (selectedDistrictId && selectedDistrictId !== 'all') {
         filtered = filtered.filter(o => {
            const loc = o.location;
            if (!loc) return true;
            return loc.district === selectedDistrictId || loc.district === 'All' || !loc.district;
         });
      }

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
    if (solarForm.startDate && solarForm.endDate) {
      if (new Date(solarForm.endDate) < new Date(solarForm.startDate)) {
        alert("End Date cannot be earlier than Start Date");
        return;
      }
    }
    try {
      const payload = {
        offerName: "Solar Panel Bundle Cashback",
        offerType: 'Solar Cashback',
        cpType: solarForm.cpType,
        plans: solarForm.selectedPlans,
        product: solarForm.product,
        category: solarForm.category,
        subCategory: solarForm.subCategory,
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
          cluster: selectedClusterId || 'All'
        },
        status: 'Active'
      };
      
      if (editingOfferId) {
         await salesSettingsService.updateOffer(editingOfferId, payload);
         alert("Solar Cashback Offer Updated!");
      } else {
         await salesSettingsService.createOffer(payload);
         alert("Solar Cashback Offer Saved!");
      }
      
      setEditingOfferId(null);
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
      
      if (editingOfferId) {
         await salesSettingsService.updateOffer(editingOfferId, payload);
         alert("Loyalty Program Updated!");
      } else {
         await salesSettingsService.createOffer(payload);
         alert("Loyalty Program Saved!");
      }
      
      setEditingOfferId(null);
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
      
      if (editingOfferId) {
         await salesSettingsService.updateOffer(editingOfferId, payload);
         alert("Limited Stock Offer Updated!");
      } else {
         await salesSettingsService.createOffer(payload);
         alert("Limited Stock Offer Saved!");
      }
      
      setEditingOfferId(null);
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
        location: {
           country: 'All',
           state: 'All',
           cluster: 'All',
           district: 'All'
        },
        status: 'Active'
      };
      
      if (editingOfferId) {
         await salesSettingsService.updateOffer(editingOfferId, payload);
         alert("Offer Updated!");
      } else {
         await salesSettingsService.createOffer(payload);
         alert("New Offer Saved!");
      }
      
      setEditingOfferId(null);
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
          
          {/* Dynamic Custom Tabs by Name */}
          {customTabs.map(tabName => (
             <button key={tabName} onClick={() => setActiveTab(tabName)}
                className={`px-5 py-2.5 rounded-full font-bold text-sm shadow-sm transition-colors flex items-center gap-2 ${activeTab === tabName ? 'bg-[#6c757d] text-white' : 'bg-[#f8f9fa] text-[#6c757d] hover:bg-[#e2e6ea]'}`}
             >
                {tabName}
             </button>
          ))}

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
                 <span className="bg-[#28a745] text-white text-xs font-bold px-3 py-1.5 rounded">
                   Active Until: {solarForm.endDate ? new Date(solarForm.endDate).toLocaleDateString() : '31 Dec 2025'}
                 </span>
               </div>
               
               <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  {/* Row 1: Partner, Plans, Product, Brand */}
                  <div className="lg:col-span-1">
                    <label className="block text-sm font-bold text-[#14233c] mb-2">Partner's type</label>
                    <select className="w-full border border-gray-200 rounded p-2.5 text-sm bg-white" value={solarForm.cpType} onChange={e => setSolarForm({...solarForm, cpType: e.target.value})}>
                      <option value="">Select Type</option>
                      {partnerTypesList.map(type => (
                         <option key={type._id} value={type.name}>{type.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="lg:col-span-1">
                    <label className="block text-sm font-bold text-[#14233c] mb-2">Select Plans</label>
                    <div className="border border-gray-200 rounded p-2 h-[120px] overflow-y-auto bg-white">
                        {plansList.map(plan => (
                           <div key={plan.id} className="flex items-center gap-2 mb-1 px-1">
                              <input 
                                type="checkbox" 
                                id={`plan-${plan.id}`}
                                checked={solarForm.selectedPlans.includes(plan.name)}
                                onChange={(e) => {
                                   const newPlans = e.target.checked 
                                      ? [...solarForm.selectedPlans, plan.name]
                                      : solarForm.selectedPlans.filter(p => p !== plan.name);
                                   setSolarForm({...solarForm, selectedPlans: newPlans});
                                }}
                              />
                              <label htmlFor={`plan-${plan.id}`} className="text-xs text-gray-700 cursor-pointer">{plan.name}</label>
                           </div>
                        ))}
                    </div>
                  </div>

                  <div className="lg:col-span-1">
                    <label className="block text-sm font-bold text-[#14233c] mb-2">Product Selection</label>
                    <select className="w-full border border-gray-200 rounded p-2.5 text-sm bg-white" value={solarForm.product} onChange={e => setSolarForm({...solarForm, product: e.target.value})}>
                      <option value="">Select Product</option>
                      {productsList.map((p, i) => <option key={i} value={p.name}>{p.name}</option>)}
                    </select>
                  </div>

                  <div className="lg:col-span-1">
                    <label className="block text-sm font-bold text-[#14233c] mb-2">Brand-wise Selection</label>
                    <select className="w-full border border-gray-200 rounded p-2.5 text-sm bg-white" value={solarForm.brand} onChange={e => setSolarForm({...solarForm, brand: e.target.value})}>
                      <option value="">Select Brand</option>
                      {brandsList.map(b => {
                        const brandName = b.brand || b.name || b.companyName;
                        return <option key={b._id} value={brandName}>{brandName}</option>;
                      })}
                    </select>
                  </div>

                  {/* Row 2: Category, SubCat, kW Selection, Target Kw */}
                  <div className="lg:col-span-2">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 h-full">
                       <label className="block text-sm font-bold text-[#14233c] mb-3">Project Type Selection</label>
                       <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Category</label>
                            <select className="w-full border border-gray-200 rounded p-2 text-sm bg-white" value={solarForm.category} onChange={e => setSolarForm({...solarForm, category: e.target.value, subCategory: 'All Sub Categories'})}>
                               <option>All Categories</option>
                               {categoriesList.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Sub Category</label>
                            <select className="w-full border border-gray-200 rounded p-2 text-sm bg-white" value={solarForm.subCategory} onChange={e => setSolarForm({...solarForm, subCategory: e.target.value})} disabled={solarForm.category === 'All Categories'}>
                               <option>All Sub Categories</option>
                               {subCategoriesList
                                 .filter(sc => solarForm.category === 'All Categories' || sc.categoryId?.name === solarForm.category)
                                 .map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                            </select>
                          </div>
                       </div>
                    </div>
                  </div>

                  <div className="lg:col-span-1">
                    <label className="block text-sm font-bold text-[#14233c] mb-2">kW-wise Selection</label>
                    <select className="w-full border border-gray-200 rounded p-2.5 text-sm bg-white" value={solarForm.kwSelection} onChange={e => setSolarForm({...solarForm, kwSelection: e.target.value})}>
                      <option>1-3 kW</option>
                      <option>3-5 kW</option>
                      <option>5-10 kW</option>
                      <option>10+ kW</option>
                    </select>
                  </div>

                  <div className="lg:col-span-1">
                    <label className="block text-sm font-bold text-[#14233c] mb-2">Target Kw</label>
                    <input type="number" className="w-full border border-gray-200 rounded p-2.5 text-sm" value={solarForm.targetKw} onChange={e => setSolarForm({...solarForm, targetKw: e.target.value})} />
                    <p className="text-xs text-gray-400 mt-1.5">Minimum kW capacity for eligibility</p>
                  </div>

                  {/* Row 3: Cashback & Offer Duration */}
                  <div className="lg:col-span-1">
                    <label className="block text-sm font-bold text-[#14233c] mb-2">Cashback Details</label>
                    <div className="flex items-center gap-3">
                       <div className="relative flex-1">
                          <span className="absolute left-3 top-2.5 text-gray-500 font-medium">₹</span>
                          <input type="number" className="w-full border border-gray-200 rounded p-2.5 pl-8 text-sm" value={solarForm.cashbackDetails} onChange={e => setSolarForm({...solarForm, cashbackDetails: e.target.value})} />
                       </div>
                       <span className="text-sm text-gray-500 w-16">per kW</span>
                    </div>
                  </div>

                  <div className="lg:col-span-3 space-y-6">
                     <div className="flex flex-col md:flex-row gap-6 md:items-end">
                        <div className="flex-1">
                           <div className="flex justify-between items-center mb-2">
                             <label className="text-sm font-bold text-[#14233c]">Offer Duration</label>
                             <p className="text-[10px] text-red-500 font-bold italic">"offer dates can be set once - offer can not be edited during the timeline of selected dates"</p>
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="flex-1">
                                <label className="block text-[11px] font-bold text-gray-400 mb-1.5 uppercase">Start Date</label>
                                <input 
                                  type="date" 
                                  className={`w-full border border-gray-200 rounded p-2.5 text-sm ${editingOfferId && isWithinTimeline(solarForm.startDate, solarForm.endDate) ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                                  value={solarForm.startDate} 
                                  disabled={editingOfferId && isWithinTimeline(solarForm.startDate, solarForm.endDate)}
                                  onChange={e => setSolarForm({...solarForm, startDate: e.target.value})} 
                                />
                              </div>
                              <div className="flex-1">
                                <label className="block text-[11px] font-bold text-gray-400 mb-1.5 uppercase">End Date</label>
                                <input 
                                  type="date" 
                                  className={`w-full border border-gray-200 rounded p-2.5 text-sm ${editingOfferId && isWithinTimeline(solarForm.startDate, solarForm.endDate) ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                                  value={solarForm.endDate} 
                                  disabled={editingOfferId && isWithinTimeline(solarForm.startDate, solarForm.endDate)}
                                  onChange={e => setSolarForm({...solarForm, endDate: e.target.value})} 
                                />
                              </div>
                           </div>
                        </div>
                        <div className="flex items-center gap-2 mb-2 cursor-pointer pb-2" onClick={() => setSolarForm({...solarForm, autoRenew: !solarForm.autoRenew})}>
                           <div className={`w-4 h-4 border rounded flex items-center justify-center ${solarForm.autoRenew ? 'bg-[#0076a8] border-[#0076a8]' : 'border-gray-400'}`}>
                              {solarForm.autoRenew && <div className="w-2 h-2 bg-white shrink-0" />}
                           </div>
                           <span className="text-sm text-gray-700 font-bold">Auto-renew Offer</span>
                        </div>
                     </div>
                  </div>
               </div>
               
               <div className="flex justify-end mt-10">
                 <button onClick={handleSolarSubmit} className="bg-[#28a745] text-white px-10 py-3 rounded-lg font-bold shadow-lg hover:bg-green-600 transition-all text-sm uppercase tracking-wider">
                   {editingOfferId ? 'Update Solar Offer' : 'Save Solar Offer'}
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
                   {editingOfferId ? 'Update Loyalty Program' : 'Save Program'}
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
                   {editingOfferId ? 'Update Limited Stock Offer' : 'Save Limited Stock Offer'}
                 </button>
               </div>
             </div>
           )}

        </div>

        {/* Global Offers Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-5 border-b border-gray-100 bg-gray-50">
                 <h3 className="text-lg font-bold text-[#14233c] mb-1">Saved Offers</h3>
                 <p className="text-xs text-gray-500">Manage and view all active and historical promotional offers.</p>
             </div>
             <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse min-w-[1200px]">
                      <thead>
                          <tr className="bg-[#14233c] text-white text-[11px] uppercase tracking-wider">
                              <th className="p-3 border-r border-white/20 font-bold">Offer Name</th>
                              <th className="p-3 border-r border-white/20 font-bold">Category/Sub</th>
                              <th className="p-3 border-r border-white/20 font-bold">Product/Brand</th>
                              <th className="p-3 border-r border-white/20 font-bold">Plans</th>
                              <th className="p-3 border-r border-white/20 font-bold">kW Info</th>
                              <th className="p-3 border-r border-white/20 font-bold">Cashback</th>
                              <th className="p-3 border-r border-white/20 font-bold">Country</th>
                              <th className="p-3 border-r border-white/20 font-bold">State</th>
                              <th className="p-3 border-r border-white/20 font-bold">Cluster</th>
                              <th className="p-3 border-r border-white/20 font-bold">District</th>
                              <th className="p-3 border-r border-white/20 font-bold">Duration</th>
                              <th className="p-3 font-bold text-center">Actions</th>
                          </tr>
                      </thead>
                      <tbody>
                          {loading ? (
                              <tr><td colSpan="11" className="text-center p-6 text-gray-500">Loading offers...</td></tr>
                          ) : offers.length === 0 ? (
                              <tr><td colSpan="11" className="text-center p-6 text-gray-500">No offers found holding current filter criteria.</td></tr>
                          ) : (
                              offers.map(offer => (
                                  <tr key={offer._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors text-[13px]">
                                      <td className="p-3 border-r border-gray-100 font-bold text-[#0076a8]">
                                         <div>{offer.offerName}</div>
                                         <div className="text-[10px] text-gray-400 font-normal">{offer.offerType}</div>
                                      </td>
                                      <td className="p-3 border-r border-gray-100">
                                         <div className="font-bold text-gray-700">{offer.category || 'All'}</div>
                                         <div className="text-[11px] text-gray-500">{offer.subCategory || 'All'}</div>
                                      </td>
                                      <td className="p-3 border-r border-gray-100">
                                         <div className="font-bold text-gray-700">{offer.product || offer.bundlePlan || 'N/A'}</div>
                                         <div className="text-[11px] text-gray-500 italic">{offer.brand || 'No Brand'}</div>
                                      </td>
                                      <td className="p-3 border-r border-gray-100 max-w-[150px]">
                                         <div className="flex flex-wrap gap-1">
                                            {offer.plans?.length > 0 ? offer.plans.map((p, i) => (
                                               <span key={i} className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">{p}</span>
                                            )) : <span className="text-gray-400 italic">None</span>}
                                         </div>
                                      </td>
                                      <td className="p-3 border-r border-gray-100">
                                         <div className="font-bold">{offer.kwSelection || 'N/A'}</div>
                                         <div className="text-[10px] text-gray-500">Target: {offer.targetKw || '0'} kW</div>
                                      </td>
                                      <td className="p-3 border-r border-gray-100 text-center font-bold text-green-600">
                                          {offer.cashbackAmount ? `₹${offer.cashbackAmount}` : offer.yearCashbacks?.length ? `${offer.yearCashbacks.length} Tiers` : '-'}
                                      </td>
                                      <td className="p-3 border-r border-gray-100 text-center text-gray-600">
                                         {offer.location?.country === 'All' ? 'All' : 
                                           (countries.find(c => c._id === offer.location?.country)?.name || 
                                            countries.find(c => c.code === offer.location?.country)?.name || 
                                            offer.location?.country || 'All')}
                                      </td>
                                      <td className="p-3 border-r border-gray-100 text-center text-gray-600">
                                         {offer.location?.state === 'All' ? 'All' : 
                                           (states.find(s => s._id === offer.location?.state)?.name || 
                                            states.find(s => s.code === offer.location?.state)?.name || 
                                            offer.location?.state || 'All')}
                                      </td>
                                      <td className="p-3 border-r border-gray-100 text-center text-gray-600">
                                         {offer.location?.cluster === 'All' ? 'All' : 
                                           (clusters.find(c => c._id === offer.location?.cluster)?.name || 
                                            offer.location?.cluster || 'All')}
                                      </td>
                                      <td className="p-3 border-r border-gray-100 text-center text-gray-600">
                                         {offer.location?.district === 'All' ? 'All' : 
                                           (districts.find(d => d._id === offer.location?.district)?.name || 
                                            districts.find(d => d.name === offer.location?.district)?.name || 
                                            offer.location?.district || 'All')}
                                      </td>
                                      <td className="p-3 border-r border-gray-100 text-center text-[11px]">
                                         <div className="text-gray-700 font-bold">
                                            {offer.startDate ? new Date(offer.startDate).toLocaleDateString() : 'N/A'}
                                         </div>
                                         <div className="text-gray-400">to</div>
                                         <div className="text-red-500 font-bold">
                                            {offer.endDate ? new Date(offer.endDate).toLocaleDateString() : offer.deadline ? new Date(offer.deadline).toLocaleDateString() : (offer.endDate || 'N/A')}
                                         </div>
                                      </td>
                                      <td className="p-3 text-center">
                                         <div className="flex justify-center gap-2">
                                            <button onClick={() => handleEdit(offer)} className="text-blue-500 hover:text-blue-700 bg-blue-50 p-2 rounded-full transition-colors">
                                               <Edit size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(offer._id)} className="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded-full transition-colors">
                                               <Trash2 size={16} />
                                            </button>
                                         </div>
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