import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Filter, CheckCircle, RefreshCw, MapPin, Layers, Tag, Save, X, Plus, Trash2, Edit } from 'lucide-react';
import { useLocations } from '../../../../hooks/useLocations';
import salesSettingsService from '../../../../services/settings/salesSettingsApi';
import { productApi } from '../../../../api/productApi';

const LocationCard = ({ title, subtitle, isSelected, onClick, isState, count }) => (
  <div
    onClick={onClick}
    className={`p-4 rounded-md transition-all cursor-pointer flex flex-col items-center justify-center text-center h-20 shadow-sm relative hover:shadow-md ${
      isSelected
      ? isState ? 'border-2 border-[#007bff] bg-[#8ccdfa]' : 'border-2 border-[#007bff] bg-white'
      : 'border border-gray-200 bg-white'
      }`}
  >
    {count > 0 && (
      <span className="absolute -top-3 -right-3 bg-red-500 text-white text-[10px] rounded-full w-6 h-6 flex items-center justify-center font-bold border-2 border-white shadow-sm z-10">
        {count}
      </span>
    )}
    <div className="font-bold text-[14px] text-[#2c3e50] mb-0">{title}</div>
    <div className="text-[11px] text-gray-500 font-medium uppercase tracking-tight">{subtitle}</div>
  </div>
);

const extractBrand = (itemName, brandsList) => {
  if (!itemName) return 'Generic';
  const found = brandsList.find(b => {
    const bName = (b.brand || b.name || b.companyName || '').toLowerCase();
    return bName && itemName.toLowerCase().includes(bName);
  });
  return found ? (found.brand || found.name || found.companyName) : itemName.split(' ')[0];
};

export default function SetPrice() {
  const [showLocationCards, setShowLocationCards] = useState(true);
  const [selectedCountryId, setSelectedCountryId] = useState('');
  const [selectedStateId, setSelectedStateId] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [selectedClusterId, setSelectedClusterId] = useState('');
  
  // Dynamic filter lists
  const [categoriesList, setCategoriesList] = useState([]);
  const [subCategoriesList, setSubCategoriesList] = useState([]);
  const [projectTypesList, setProjectTypesList] = useState([]);
  const [subProjectTypesList, setSubProjectTypesList] = useState([]);
  const [brandsList, setBrandsList] = useState([]);
  const [productsList, setProductsList] = useState([]);
  
  // Modal specific filtered lists
  const [filteredModalSubCategories, setFilteredModalSubCategories] = useState([]);
  const [filteredModalSubProjectTypes, setFilteredModalSubProjectTypes] = useState([]);

  const [kitType, setKitType] = useState('Custom Kit'); // Custom Kit or Combo Kit
  const [paymentType, setPaymentType] = useState('Cash'); // Cash, Loan, or EMI

  const [filters, setFilters] = useState({
    category: 'All Categories',
    subCategory: 'All Sub Categories',
    projectType: 'All Project Types',
    subProjectType: 'All Sub Types',
    brand: 'All Brands',
    productType: 'All Products'
  });

  const [tableData, setTableData] = useState([]);
  const [summaryData, setSummaryData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMarginModal, setShowMarginModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  
  const [solarKitsList, setSolarKitsList] = useState([]);
  const [filteredSolarKits, setFilteredSolarKits] = useState([]);
  const [mappingsList, setMappingsList] = useState([]);
  const [allPricesForCount, setAllPricesForCount] = useState([]);
  
  // Margin & History internal states for the mock modals
  const [historyFilter, setHistoryFilter] = useState('Last 3 Months');
  const [marginFilter, setMarginFilter] = useState('All');
  
  const [marginData, setMarginData] = useState([
     { type: 'Prime', cost: 500, cashback: 150, margin: 1000, total: 1650 },
     { type: 'Regular', cost: 400, cashback: 100, margin: 800, total: 1300 },
     { type: 'Other', cost: 300, cashback: 80, margin: 500, total: 880 }
  ]);

  const [newPriceForm, setNewPriceForm] = useState({
    productType: 'Solar Panel',
    brand: '',
    category: '',
    subCategory: '',
    projectType: '',
    subProjectType: '',
    benchmarkPrice: 0,
    marketPrice: 0,
    gst: 18,
    status: 'Active',
    comboKit: ''
  });

  const { countries, states, districts, clusters, fetchStates, fetchDistricts, fetchClusters } = useLocations();
  const selectedCountryObj = countries.find((c) => c._id === selectedCountryId) || null;
  const selectedStateObj = states.find((s) => s._id === selectedStateId) || null;
  const selectedClusterObj = clusters.find((c) => c._id === selectedClusterId) || null;
  const selectedDistrictObj = districts.find((d) => d._id === selectedDistrictId) || null;

  // 1. Fetch Dynamic Filter Data on Mount
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        const results = await Promise.allSettled([
          productApi.getCategories(),
          productApi.getSubCategories(),
          productApi.getProjectTypes(),
          productApi.getSubProjectTypes(),
          productApi.getBrands(),
          productApi.getAll(),
          salesSettingsService.getSolarKits(),
          productApi.getProjectCategoryMappings(),
          salesSettingsService.getSetPrices({})
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
        setProjectTypesList(safeExtract(results[2]));
        setSubProjectTypesList(safeExtract(results[3]));
        setBrandsList(safeExtract(results[4]));
        setProductsList(safeExtract(results[5]));
        setSolarKitsList(safeExtract(results[6]));
        setMappingsList(safeExtract(results[7]));
        setAllPricesForCount(safeExtract(results[8]));

      } catch (error) {
        console.error("Error fetching filter data:", error);
      }
    };
    fetchFilterData();
  }, []);

  // 2. Location Selection Handlers (Hierarchy)
  const handleCountrySelect = (countryId) => {
    setSelectedCountryId(countryId);
    setSelectedStateId('');
    setSelectedClusterId('');
    setSelectedDistrictId('');
    if (countryId && countryId !== 'all') {
      fetchStates({ countryId });
    }
  };

  const handleStateSelect = (stateId) => {
    setSelectedStateId(stateId);
    setSelectedClusterId('');
    setSelectedDistrictId('');
    if (stateId && stateId !== 'all') {
      fetchClusters({ stateId });
    }
  };

  const handleClusterSelect = (clusterId) => {
    setSelectedClusterId(clusterId);
    setSelectedDistrictId('');
    if (clusterId && clusterId !== 'all') {
      fetchDistricts({ clusterId });
    }
  };

  const handleDistrictSelect = (districtId) => {
    setSelectedDistrictId(districtId);
  };

  useEffect(() => {
    fetchPrices();
  }, [selectedCountryId, selectedStateId, selectedClusterId, selectedDistrictId, kitType, paymentType, filters]);

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const query = {};
      if (selectedCountryId && selectedCountryId !== 'all') query.country = selectedCountryId;
      if (selectedStateId && selectedStateId !== 'all') query.state = selectedStateId;
      if (selectedClusterId && selectedClusterId !== 'all') query.cluster = selectedClusterId;
      if (selectedDistrictId && selectedDistrictId !== 'all') query.district = selectedDistrictId;

      if (filters.category !== 'All Categories') query.category = filters.category;
      if (filters.subCategory !== 'All Sub Categories') query.subCategory = filters.subCategory;
      if (filters.projectType !== 'All Project Types') query.projectType = filters.projectType;
      if (filters.subProjectType !== 'All Sub Types') query.subProjectType = filters.subProjectType;
      
      // We do NOT filter the Summary API call by brand/productType 
      // because we want to see the "ENTIRE" kit status in the summary table.
      
      query.kitType = kitType;
      query.paymentType = paymentType;

      const data = await salesSettingsService.getSetPrices(query);
      
      // All items matching the project configuration go to the summary table
      const savedPrices = data.map(item => ({
        ...item,
        id: item._id,
        comboKit: item.comboKit || `${item.brand} Kit`,
        isEditing: false,
        isGenerated: false
      }));

      // Items that are being newly generated go to the top working table
      let workingData = [];

      if (kitType === 'Combo Kit' && 
          filters.category !== 'All Categories' && 
          filters.projectType !== 'All Project Types') {
        
        const matchingKit = solarKitsList.find(kit => {
          const catMatch = filters.category === 'All Categories' || kit.category === filters.category;
          const subCatMatch = filters.subCategory === 'All Sub Categories' || kit.subCategory === filters.subCategory;
          const projMatch = filters.projectType === 'All Project Types' || kit.projectType === filters.projectType;
          const subProjMatch = filters.subProjectType === 'All Sub Types' || kit.subProjectType === filters.subProjectType;
          return catMatch && subCatMatch && projMatch && subProjMatch;
        });

        if (matchingKit && matchingKit.bom) {
          matchingKit.bom.forEach(section => {
            if (section.items && Array.isArray(section.items)) {
              section.items.forEach(item => {
                const brandName = extractBrand(item.name, brandsList);
                const itemType = item.itemType || 'Solar Panel';
                
                // USER REQUEST: Filter logic for top table
                const brandMatch = filters.brand === 'All Brands' || brandName === filters.brand;
                const productMatch = filters.productType === 'All Products' || itemType === filters.productType;
                
                if (brandMatch && productMatch) {
                  // Check if this component is NOT already saved
                  const alreadyExists = savedPrices.find(d => 
                    d.comboKit === matchingKit.name && 
                    d.productType === itemType &&
                    d.brand === brandName
                  );
                  
                  if (!alreadyExists) {
                    workingData.push({
                      id: `gen-${matchingKit._id}-${item.name}-${Math.random().toString(36).substr(2, 5)}`,
                      comboKit: matchingKit.name,
                      brand: brandName,
                      productType: itemType,
                      category: filters.category,
                      subCategory: filters.subCategory,
                      projectType: filters.projectType,
                      subProjectType: filters.subProjectType,
                      benchmarkPrice: 0,
                      marketPrice: 0,
                      gst: 18,
                      isEditing: true,
                      isGenerated: true
                    });
                  }
                }
              });
            }
          });
        }
      }

      if (kitType === 'Custom Kit' && 
          filters.brand !== 'All Brands' && 
          filters.productType !== 'All Products' && 
          filters.category !== 'All Categories') {
          
          // Check if this specific kit component is already saved
          const alreadyExists = savedPrices.find(d => 
            d.productType === filters.productType &&
            d.brand === filters.brand
          );

          if (!alreadyExists) {
            workingData.push({
              id: `gen-custom-${Date.now()}`,
              comboKit: filters.brand + ' Kit',
              brand: filters.brand,
              productType: filters.productType,
              category: filters.category,
              subCategory: filters.subCategory,
              projectType: filters.projectType,
              subProjectType: filters.subProjectType,
              benchmarkPrice: 0,
              marketPrice: 0,
              gst: 18,
              isEditing: true,
              isGenerated: true
            });
          }
      }

      setTableData(workingData);
      setSummaryData(savedPrices);
    } catch (error) {
      console.error("Error fetching prices:", error);
      alert("Error loading prices: " + (error.error || error.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [filterName]: value };
      if (filterName === 'category') newFilters.subCategory = 'All Sub Categories';
      if (filterName === 'projectType') newFilters.subProjectType = 'All Sub Types';
      return newFilters;
    });
  };

  const handleApplyFilters = () => {
    fetchPrices();
  };

  const handleResetFilters = () => {
    setFilters({
      category: 'All Categories',
      subCategory: 'All Sub Categories',
      projectType: 'All Project Types',
      subProjectType: 'All Sub Types',
      brand: 'All Brands',
      productType: 'All Products'
    });
    setKitType('Custom Kit');
    setPaymentType('Cash');
    setTimeout(() => {
      fetchPrices();
    }, 0);
  };

  const handleTableInputChange = (id, field, value) => {
    setTableData(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const toggleRowEdit = async (id) => {
    const item = tableData.find(i => i.id === id);
    if (!item) return;

    if (item.isEditing) {
      try {
        if (item.isGenerated) {
          const payload = {
            productType: item.productType,
            brand: item.brand,
            category: item.category,
            subCategory: item.subCategory,
            projectType: item.projectType,
            subProjectType: item.subProjectType,
            benchmarkPrice: item.benchmarkPrice,
            marketPrice: item.marketPrice,
            gst: item.gst,
            kitType: item.kitType || (item.id.includes('custom') ? 'Custom Kit' : 'Combo Kit'),
            paymentType: paymentType,
            comboKit: item.comboKit,
            state: (selectedStateId && selectedStateId !== 'all') ? selectedStateId : undefined,
            cluster: (selectedClusterId && selectedClusterId !== 'all') ? selectedClusterId : undefined,
            district: (selectedDistrictId && selectedDistrictId !== 'all') ? selectedDistrictId : undefined,
            country: (selectedCountryId && selectedCountryId !== 'all') ? selectedCountryId : undefined,
            status: 'Active'
          };
          const response = await salesSettingsService.createSetPrice(payload);
          // Move from working table to summary table
          const savedItem = {
            ...item,
            _id: response._id || response.data?._id,
            id: response._id || response.data?._id,
            isEditing: false,
            isGenerated: false
          };
          setSummaryData(prev => [...prev, savedItem]);
          setTableData(prev => prev.filter(row => row.id !== id));
          return;
        } else {
          await salesSettingsService.updateSetPrice(id, {
            benchmarkPrice: item.benchmarkPrice,
            marketPrice: item.marketPrice,
            gst: item.gst
          });
          // Update in summary table
          setSummaryData(prev => prev.map(row => row.id === id ? { ...row, isEditing: false } : row));
        }
      } catch (error) {
        console.error("Error updating price details:", error);
        alert(`Failed to update price: ${error.error || error.message || "Check fields and try again"}`);
        return; 
      }
    }

    setTableData(prev => prev.map(row => {
      if (row.id === id) return { ...row, isEditing: !row.isEditing };
      return row;
    }));
  };

  const handleEditExisting = (item) => {
    // Move from summary to working table
    const editingItem = { ...item, isEditing: true, isGenerated: false };
    setTableData(prev => [editingItem, ...prev]);
    setSummaryData(prev => prev.filter(row => row.id !== item.id));
  };

  const handleDeletePrice = async (id) => {
    const item = tableData.find(i => i.id === id);
    if (!item) return;

    if (window.confirm("Are you sure you want to delete this price setting?")) {
      try {
        if (!item.isGenerated) {
          await salesSettingsService.deleteSetPrice(id);
        }
        setTableData(prev => prev.filter(item => item.id !== id));
        setSummaryData(prev => prev.filter(item => item.id !== id));
      } catch (error) {
        console.error("Error deleting price:", error);
        alert("Failed to delete price");
      }
    }
  };

  const handleAddNewSubmit = async (e) => {
    e.preventDefault();
    if (!newPriceForm.brand || !newPriceForm.category || !newPriceForm.subCategory || !newPriceForm.projectType || !newPriceForm.subProjectType) {
      alert("Please fill in all dropdown fields before saving.");
      return;
    }
    try {
      const payload = {
        ...newPriceForm,
        kitType: kitType,
        paymentType: paymentType,
        state: (selectedStateId && selectedStateId !== 'all') ? selectedStateId : undefined,
        cluster: (selectedClusterId && selectedClusterId !== 'all') ? selectedClusterId : undefined,
        district: (selectedDistrictId && selectedDistrictId !== 'all') ? selectedDistrictId : undefined,
        country: (selectedCountryId && selectedCountryId !== 'all') ? selectedCountryId : undefined
      };
      await salesSettingsService.createSetPrice(payload);
      setShowAddModal(false);
      fetchPrices(); 
      alert("Price added successfully!");
    } catch (error) {
      console.error("Error adding price:", error);
      alert("Failed to add price. Please verify all fields.");
    }
  };

  return (
    <div className="bg-[#f4f7fa] min-h-screen font-sans">
      <div className="bg-white p-6 border-b border-gray-200 mb-8 px-12">
        <h1 className="text-[22px] font-bold text-[#14233c] mb-2">Set Price for Solarkit</h1>
        <button
          onClick={() => setShowLocationCards(!showLocationCards)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0076a8] text-white rounded text-xs font-bold shadow-sm hover:bg-blue-800 transition-all"
        >
          {showLocationCards ? <EyeOff size={14} /> : <Eye size={14} />} {showLocationCards ? 'Hide Location Cards' : 'Show Location Cards'}
        </button>
      </div>

      <div className="max-w-[1400px] mx-auto px-12 pb-20">
        {showLocationCards && (
          <div className="space-y-10 mb-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-[#14233c] mb-4">Select Country</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <LocationCard title="All Countries" subtitle="ALL" isSelected={selectedCountryId === 'all' || selectedCountryId === ''} onClick={() => handleCountrySelect('all')} />
                {countries.map(c => <LocationCard key={c._id} title={c.name} subtitle={c.code || c.name.substring(0, 2).toUpperCase()} isSelected={selectedCountryId === c._id} onClick={() => handleCountrySelect(c._id)} count={allPricesForCount.filter(p => (p.country?._id || p.country) === c._id || (p.country?.includes?.(c._id))).length} />)}
              </div>
            </div>
            {(selectedCountryId && selectedCountryId !== 'all') && (
              <div className="mb-6">
                <h2 className="text-xl font-bold text-[#14233c] mb-4">Select State</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <LocationCard title="All States" subtitle="ALL" isSelected={selectedStateId === 'all' || selectedStateId === ''} onClick={() => handleStateSelect('all')} />
                  {states.map(s => <LocationCard key={s._id} title={s.name} subtitle={s.code || s.name.substring(0, 2).toUpperCase()} isSelected={selectedStateId === s._id} onClick={() => handleStateSelect(s._id)} isState={true} count={allPricesForCount.filter(p => (p.state?._id || p.state) === s._id || (p.state?.includes?.(s._id))).length} />)}
                </div>
              </div>
            )}
            {(selectedStateId && selectedStateId !== 'all') && (
              <div className="mb-6">
                <h2 className="text-xl font-bold text-[#14233c] mb-4">Select Cluster</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <LocationCard title="All Clusters" subtitle="ALL" isSelected={selectedClusterId === 'all' || selectedClusterId === ''} onClick={() => handleClusterSelect('all')} />
                  {clusters.map(c => {
                    const parentState = states.find(s => s._id === c.state || s._id === c.state?._id) || selectedStateObj;
                    return <LocationCard key={c._id} title={c.name} subtitle={parentState ? (parentState.code || parentState.name.substring(0,2).toUpperCase()) : 'CL'} isSelected={selectedClusterId === c._id} onClick={() => handleClusterSelect(c._id)} count={allPricesForCount.filter(p => (p.cluster?._id || p.cluster) === c._id || (p.cluster?.includes?.(c._id))).length} />;
                  })}
                </div>
              </div>
            )}
            {(selectedClusterId && selectedClusterId !== 'all') && (
              <div className="mb-6">
                <h2 className="text-xl font-bold text-[#14233c] mb-4">Select District</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <LocationCard title="All Districts" subtitle="ALL" isSelected={selectedDistrictId === 'all' || selectedDistrictId === ''} onClick={() => handleDistrictSelect('all')} />
                  {districts.map(d => <LocationCard key={d._id} title={d.name} subtitle={'DT'} isSelected={selectedDistrictId === d._id} onClick={() => handleDistrictSelect(d._id)} count={allPricesForCount.filter(p => (p.district?._id || p.district) === d._id || (p.districts?.some(dist => (dist._id || dist) === d._id))).length} />)}
                </div>
              </div>
            )}
          </div>
        )}

        {selectedDistrictId && (
          <div className="bg-white rounded-lg shadow-sm mb-6 p-6 border border-gray-100">
            <h5 className="mb-4 text-xl font-bold text-gray-800">Selected Location</h5>
            <div className="flex flex-wrap gap-3 mt-2">
              <span className="inline-flex items-center bg-[#0076a8] text-white px-4 py-2 rounded font-bold text-sm shadow-sm">State: {selectedStateObj?.name || 'All'}</span>
              <span className="inline-flex items-center bg-[#0d6efd] text-white px-4 py-2 rounded font-bold text-sm shadow-sm"><Layers size={14} className="mr-1" />Cluster: {selectedClusterObj?.name || 'All'}</span>
              <span className="inline-flex items-center bg-green-600 text-white px-4 py-2 rounded font-bold text-sm shadow-sm"><MapPin size={14} className="mr-1" />District: {selectedDistrictObj?.name || 'All'}</span>
            </div>
          </div>
        )}

        {selectedDistrictId && (
          <div className="space-y-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col xl:flex-row p-0 overflow-hidden">
               <div className="flex-[2] p-5 border-b xl:border-b-0 xl:border-r border-gray-100 xl:min-w-[600px]">
                  <h5 className="font-bold text-[#14233c] mb-4 text-[15px]">Project Type Filters</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[13px] text-gray-600 mb-1.5">Category</label>
                      <select className="w-full px-2 py-1.5 border border-gray-200 rounded text-[13px] text-gray-700 bg-white focus:outline-none focus:border-[#0076a8]" value={filters.category} onChange={(e) => handleFilterChange('category', e.target.value)}>
                        <option>All Categories</option>
                        {categoriesList.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[13px] text-gray-600 mb-1.5">Sub Category</label>
                      <select className="w-full px-2 py-1.5 border border-gray-200 rounded text-[13px] text-gray-700 bg-white focus:outline-none focus:border-[#0076a8]" value={filters.subCategory} onChange={(e) => handleFilterChange('subCategory', e.target.value)} disabled={filters.category === 'All Categories'}>
                        <option>All Sub Categories</option>
                        {subCategoriesList.filter(sc => filters.category === 'All Categories' || sc.categoryId?.name === filters.category).map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[13px] text-gray-600 mb-1.5">Project Type</label>
                      <select className="w-full px-2 py-1.5 border border-gray-200 rounded text-[13px] text-gray-700 bg-white focus:outline-none focus:border-[#0076a8]" value={filters.projectType} onChange={(e) => handleFilterChange('projectType', e.target.value)}>
                        <option>All Project Types</option>
                        {mappingsList.filter(m => (filters.category === 'All Categories' || m.categoryId?.name === filters.category) && (filters.subCategory === 'All Sub Categories' || m.subCategoryId?.name === filters.subCategory)).map(m => `${m.projectTypeFrom} to ${m.projectTypeTo} kW`).filter((v, i, a) => a.indexOf(v) === i).map((range, i) => <option key={i} value={range}>{range}</option>)}
                        {projectTypesList.length > 0 && <option disabled>──────────</option>}
                        {projectTypesList.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[13px] text-gray-600 mb-1.5">Sub Project Type</label>
                      <select className="w-full px-2 py-1.5 border border-gray-200 rounded text-[13px] text-gray-700 bg-white focus:outline-none focus:border-[#0076a8]" value={filters.subProjectType} onChange={(e) => handleFilterChange('subProjectType', e.target.value)} disabled={filters.projectType === 'All Project Types'}>
                        <option>All Sub Types</option>
                        {subProjectTypesList.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
               </div>
               <div className="xl:w-[350px] shrink-0 p-5">
                   <h5 className="font-bold text-[#14233c] mb-4 text-[15px]">Select Kit Type</h5>
                   <div className="flex gap-4 mt-2 mb-6">
                     <label className="flex items-start gap-2 cursor-pointer group" onClick={() => setKitType('Custom Kit')}>
                        <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center ${kitType === 'Custom Kit' ? 'border-[#0076a8]' : 'border-gray-300'}`}>{kitType === 'Custom Kit' && <div className="w-2.5 h-2.5 rounded-full bg-[#0076a8]"></div>}</div>
                        <div className="flex flex-col"><span className={`text-[13px] font-bold tracking-tight ${kitType === 'Custom Kit' ? 'text-[#0076a8]' : 'text-gray-500'}`}>Custom Kit</span><span className="text-[10px] text-gray-400">Build your own kit</span></div>
                     </label>
                     <label className="flex items-start gap-2 cursor-pointer group" onClick={() => setKitType('Combo Kit')}>
                        <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center ${kitType === 'Combo Kit' ? 'border-[#0076a8]' : 'border-gray-300'}`}>{kitType === 'Combo Kit' && <div className="w-2.5 h-2.5 rounded-full bg-[#0076a8]"></div>}</div>
                        <div className="flex flex-col"><span className={`text-[13px] font-bold tracking-tight ${kitType === 'Combo Kit' ? 'text-[#14233c]' : 'text-gray-500'}`}>Combo Kit</span><span className="text-[10px] text-gray-400">Pre-configured kits</span></div>
                     </label>
                   </div>
                   <h5 className="font-bold text-[#14233c] mb-3 text-[14px]">Payment Type</h5>
                   <div className="flex flex-wrap gap-4 mt-1">
                     <label className="flex items-start gap-2 cursor-pointer group" onClick={() => setPaymentType('Cash')}>
                        <div className={`mt-0.5 w-3.5 h-3.5 rounded-full border flex items-center justify-center ${paymentType === 'Cash' ? 'border-[#0076a8]' : 'border-gray-300'}`}>{paymentType === 'Cash' && <div className="w-2 h-2 rounded-full bg-[#0076a8]"></div>}</div>
                        <span className={`text-[12px] font-bold ${paymentType === 'Cash' ? 'text-[#0076a8]' : 'text-gray-500'}`}>Cash</span>
                     </label>
                     <label className="flex items-start gap-2 cursor-pointer group" onClick={() => setPaymentType('Loan')}>
                        <div className={`mt-0.5 w-3.5 h-3.5 rounded-full border flex items-center justify-center ${paymentType === 'Loan' ? 'border-[#0076a8]' : 'border-gray-300'}`}>{paymentType === 'Loan' && <div className="w-2 h-2 rounded-full bg-[#0076a8]"></div>}</div>
                        <span className={`text-[12px] font-bold ${paymentType === 'Loan' ? 'text-[#14233c]' : 'text-gray-500'}`}>Loan</span>
                     </label>
                     <label className="flex items-start gap-2 cursor-pointer group" onClick={() => setPaymentType('EMI')}>
                        <div className={`mt-0.5 w-3.5 h-3.5 rounded-full border flex items-center justify-center ${paymentType === 'EMI' ? 'border-[#0076a8]' : 'border-gray-300'}`}>{paymentType === 'EMI' && <div className="w-2 h-2 rounded-full bg-[#0076a8]"></div>}</div>
                        <span className={`text-[12px] font-bold ${paymentType === 'EMI' ? 'text-[#14233c]' : 'text-gray-500'}`}>EMI</span>
                     </label>
                   </div>
                </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 xl:w-[500px] max-w-full">
               <h5 className="font-bold text-[#14233c] mb-4 text-[15px]">Product & Brand Filters</h5>
               <div className="flex flex-col sm:flex-row items-end gap-3">
                 <div className="flex-1 w-full">
                    <label className="block text-[13px] text-gray-600 mb-1.5">Brand</label>
                    <select className="w-full px-2 py-1.5 border border-gray-200 rounded text-[13px] text-gray-700 bg-white focus:outline-none focus:border-[#0076a8]" value={filters.brand} onChange={(e) => handleFilterChange('brand', e.target.value)}>
                      <option>All Brands</option>
                      {brandsList.map(b => <option key={b._id} value={b.brand || b.name || b.companyName}>{b.brand || b.name || b.companyName}</option>)}
                    </select>
                 </div>
                 <div className="flex-1 w-full">
                    <label className="block text-[13px] text-gray-600 mb-1.5">Product Type</label>
                    <select className="w-full px-2 py-1.5 border border-gray-200 rounded text-[13px] text-gray-700 bg-white focus:outline-none focus:border-[#0076a8]" value={filters.productType} onChange={(e) => handleFilterChange('productType', e.target.value)}>
                      <option>All Products</option>
                      {productsList.map((p, i) => <option key={i} value={p.name}>{p.name}</option>)}
                    </select>
                 </div>
                 <button onClick={handleApplyFilters} className="flex items-center justify-center gap-1.5 text-[13px] text-gray-500 hover:text-[#0076a8] font-bold py-1.5 sm:mb-0 w-full sm:w-auto mt-2 sm:mt-0"><Filter size={14} /> Apply Filters</button>
               </div>
            </div>
          </div>
        )}

        {selectedDistrictId && (
          <div className="bg-white shadow-sm border border-gray-100 rounded-lg overflow-hidden animate-in fade-in zoom-in-95 duration-500">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm min-w-[1200px]">
                  <thead className="bg-[#343a40] text-white">
                    <tr>
                      <th className="p-3 border-r border-white/20 text-center text-xs font-bold leading-tight">Combo Kit</th>
                      <th className="p-3 border-r border-white/20 text-center text-xs font-bold leading-tight">Brand</th>
                      <th className="p-3 border-r border-white/20 text-center text-xs font-bold leading-tight w-20">Product Type</th>
                      <th className="p-3 border-r border-white/20 text-center text-xs font-bold leading-tight">Category</th>
                      <th className="p-3 border-r border-white/20 text-center text-xs font-bold leading-tight w-24">Sub Category</th>
                      <th className="p-3 border-r border-white/20 text-center text-xs font-bold leading-tight w-20">Project Type</th>
                      <th className="p-3 border-r border-white/20 text-center text-xs font-bold leading-tight w-24">Sub Project Type</th>
                      <th className="p-3 border-r border-white/20 text-center text-xs font-bold leading-tight w-28">Solar Panel BenchMark Price (Per Kw)</th>
                      <th className="p-3 border-r border-white/20 text-center text-xs font-bold leading-tight w-28">Latest Buying Price (per Kw)</th>
                      <th className="p-3 border-r border-white/20 text-center text-xs font-bold leading-tight w-24">Purchase History</th>
                      <th className="p-3 border-r border-white/20 text-center text-xs font-bold leading-tight w-28">Company Margin (per KW)</th>
                      <th className="p-3 border-r border-white/20 text-center text-xs font-bold leading-tight w-20">GST (%)</th>
                      <th className="p-3 text-center text-xs font-bold leading-tight">Actions</th>
                      <th className="p-3 text-center text-xs font-bold leading-tight w-24">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                       <tr><td colSpan="14" className="text-center py-6 text-gray-500">Loading prices...</td></tr>
                    ) : tableData.length === 0 ? (
                       <tr><td colSpan="14" className="text-center py-10 text-gray-500 font-bold bg-gray-50/30">
                          {summaryData.length > 0 ? (
                            <div className="flex flex-col items-center gap-2">
                               <CheckCircle className="text-green-500" size={24} />
                               <span>All selected components are already configured and shown in the summary below.</span>
                            </div>
                          ) : (
                            "No data found. Please select Brand and Product Type to add new price."
                          )}
                       </td></tr>
                    ) : (
                       tableData.map((row) => (
                          <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                              <td className="p-2 border-r border-gray-100 text-center text-gray-600 text-[11px] font-medium">{row.comboKit}</td>
                              <td className="p-2 border-r border-gray-100 text-center text-gray-600 text-xs">{row.brand}</td>
                              <td className="p-2 border-r border-gray-100 text-center text-gray-600 text-xs">{row.productType}</td>
                              <td className="p-2 border-r border-gray-100 text-center text-gray-600 text-xs">{row.category}</td>
                              <td className="p-2 border-r border-gray-100 text-center text-gray-600 text-xs">{row.subCategory}</td>
                              <td className="p-2 border-r border-gray-100 text-center text-gray-600 text-xs">{row.projectType}</td>
                              <td className="p-2 border-r border-gray-100 text-center text-gray-600 text-xs">{row.subProjectType}</td>
                              <td className="p-2 border-r border-gray-100 text-center">
                                 <input type="number" className={`w-28 px-2 py-1.5 border rounded-full text-center text-xs mx-auto focus:outline-none ${row.isEditing ? 'border-blue-400 bg-white' : 'border-gray-200 bg-gray-50'}`} value={row.benchmarkPrice} onChange={(e) => handleTableInputChange(row.id, 'benchmarkPrice', Number(e.target.value) || 0)} disabled={!row.isEditing} />
                              </td>
                              <td className="p-2 border-r border-gray-100 text-center">
                                 <input type="number" className={`w-28 px-2 py-1.5 border rounded-full text-center text-xs mx-auto focus:outline-none ${row.isEditing ? 'border-blue-400 bg-white' : 'border-gray-200 bg-gray-50'}`} value={row.marketPrice} onChange={(e) => handleTableInputChange(row.id, 'marketPrice', Number(e.target.value) || 0)} disabled={!row.isEditing} />
                              </td>
                              <td className="p-2 border-r border-gray-100 text-center"><button onClick={() => setShowHistoryModal(true)} className="bg-[#17a2b8] text-white px-3 py-1 rounded font-bold text-[10px] hover:bg-[#138496]">View</button></td>
                              <td className="p-2 border-r border-gray-100 text-center"><button onClick={() => setShowMarginModal(true)} className="bg-[#ffc107] text-[#212529] px-3 py-1 rounded font-bold text-[10px] hover:bg-[#e0a800]">Set Margin</button></td>
                              <td className="p-2 border-r border-gray-100 text-center">
                                 <input type="number" className={`w-16 px-2 py-1.5 border rounded-full text-center text-xs mx-auto focus:outline-none ${row.isEditing ? 'border-blue-400 bg-white' : 'border-gray-200 bg-gray-50'}`} value={row.gst} onChange={(e) => handleTableInputChange(row.id, 'gst', Number(e.target.value) || 0)} disabled={!row.isEditing} />
                              </td>
                              <td className="p-2 text-center border-r border-gray-100">
                                 <div className="flex items-center justify-center gap-2">
                                    <button onClick={() => toggleRowEdit(row.id)} className={`px-3 py-1.5 rounded font-bold text-[10px] text-white shadow-sm transition-all min-w-[60px] ${row.isEditing ? 'bg-blue-500 hover:bg-blue-600' : 'bg-[#28a745] hover:bg-green-600'}`}>{row.isEditing ? 'Save' : 'Edit'}</button>
                                    <button onClick={() => handleDeletePrice(row.id)} className="px-2 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 shadow-sm" title="Delete"><Trash2 size={13} /></button>
                                 </div>
                              </td>
                              <td className="p-2 text-center">
                                 {row.isGenerated ? (
                                    <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-[9px] font-black uppercase">Unsaved</span>
                                 ) : (
                                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[9px] font-black uppercase">Database</span>
                                 )}
                              </td>
                          </tr>
                       ))
                    )}
                  </tbody>
                </table>
             </div>
             <div className="p-4 border-t border-gray-100 flex gap-2">
                 <button className="bg-[#0076a8] text-white px-5 py-2 rounded shadow text-sm font-bold flex items-center gap-2 hover:bg-blue-800 transition-colors" onClick={() => setShowAddModal(true)}><CheckCircle size={16} /> Set Price</button>
                 <button className="bg-gray-500 text-white px-5 py-2 rounded shadow text-sm font-bold flex items-center gap-2 hover:bg-gray-600 transition-colors" onClick={handleResetFilters}><RefreshCw size={16} /> Reset Filters</button>
             </div>
          </div>
        )}

        {summaryData.length > 0 && (
          <div className="mt-16 animate-in slide-in-from-bottom-10 duration-700">
             <div className="flex items-center gap-3 mb-5 px-1">
                <Tag className="text-[#0076a8]" size={22} />
                <h3 className="text-xl font-black text-[#14233c] tracking-tight">Pricing Summary Overview</h3>
                <div className="h-px flex-1 bg-gray-200 ml-4"></div>
             </div>
             <div className="bg-white rounded-xl shadow-xl border-t-4 border-[#14233c] overflow-hidden">
                <table className="w-full text-left border-collapse table-fixed">
                   <thead className="bg-[#f8fafc] border-b border-gray-200">
                      <tr>
                         <th className="p-4 font-bold text-[#14233c] text-xs uppercase tracking-wider w-[30%]">Component / Product</th>
                         <th className="p-4 font-bold text-[#14233c] text-xs uppercase tracking-wider w-[15%]">Brand</th>
                         <th className="p-4 font-bold text-[#14233c] text-xs uppercase tracking-wider text-right w-[12%]">Benchmark (₹)</th>
                         <th className="p-4 font-bold text-[#14233c] text-xs uppercase tracking-wider text-right w-[12%]">Market Price (₹)</th>
                         <th className="p-4 font-bold text-[#14233c] text-xs uppercase tracking-wider text-right w-[10%]">Margin (₹)</th>
                         <th className="p-4 font-bold text-[#14233c] text-xs uppercase tracking-wider text-center w-[8%]">GST (%)</th>
                         <th className="p-4 font-bold text-[#0076a8] text-xs uppercase tracking-widest text-right w-[13%] bg-blue-50/50">Final Price (₹)</th>
                         <th className="p-4 font-bold text-[#14233c] text-xs uppercase tracking-wider text-center w-[8%]">Action</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                      {summaryData.map((row, i) => {
                         const marginValue = (row.marketPrice || 0) - (row.benchmarkPrice || 0);
                         const gstAmount = (row.marketPrice || 0) * (row.gst || 0) / 100;
                         const finalCompTotal = (row.marketPrice || 0) + gstAmount;
                         return (
                            <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                               <td className="p-4 border-r border-gray-50">
                                  <div className="font-black text-gray-800 text-[13px]">{row.productType}</div>
                                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{row.category} / {row.subCategory}</div>
                               </td>
                               <td className="p-4 font-bold text-gray-600 border-r border-gray-50 uppercase text-[11px]">{row.brand}</td>
                               <td className="p-4 text-right text-gray-500 font-mono text-[13px] border-r border-gray-50">{(row.benchmarkPrice || 0).toLocaleString()}</td>
                               <td className="p-4 text-right text-gray-900 font-black font-mono text-[13px] border-r border-gray-50">{(row.marketPrice || 0).toLocaleString()}</td>
                               <td className={`p-4 text-right font-black font-mono text-[13px] border-r border-gray-50 ${marginValue >= 0 ? 'text-green-600' : 'text-red-500'}`}>{marginValue.toLocaleString()}</td>
                               <td className="p-4 text-center border-r border-gray-50"><span className="text-gray-500 font-bold text-xs">{row.gst}%</span></td>
                               <td className="p-4 text-right bg-blue-50/30 font-black font-mono text-[14px] text-[#0076a8] border-r border-gray-50">{finalCompTotal.toLocaleString()}</td>
                               <td className="p-4 text-center">
                                  <button onClick={() => handleEditExisting(row)} className="p-2 text-[#0076a8] hover:bg-blue-50 rounded-full transition-colors" title="Edit Price">
                                     <Edit size={16} />
                                  </button>
                               </td>
                            </tr>
                         );
                      })}
                   </tbody>
                   <tfoot className="bg-[#14233c] text-white">
                      <tr>
                         <td colSpan="2" className="p-6">
                            <div className="text-[10px] text-blue-300 uppercase font-black tracking-widest mb-1 opacity-80">Calculated Totals</div>
                            <div className="text-2xl font-black tracking-tighter uppercase">Grand Total Summary</div>
                         </td>
                         <td className="p-6 text-right border-l border-white/10">
                            <span className="block text-[9px] uppercase font-bold text-blue-200 mb-1 opacity-70">Benchmark</span>
                            <span className="font-mono text-base font-black">₹{summaryData.reduce((acc, row) => acc + (row.benchmarkPrice || 0), 0).toLocaleString()}</span>
                         </td>
                         <td className="p-6 text-right border-l border-white/10">
                            <span className="block text-[9px] uppercase font-bold text-blue-200 mb-1 opacity-70">Market Price</span>
                            <span className="font-mono text-base font-black">₹{summaryData.reduce((acc, row) => acc + (row.marketPrice || 0), 0).toLocaleString()}</span>
                         </td>
                         <td className="p-6 text-right border-l border-white/10">
                            <span className="block text-[9px] uppercase font-bold text-blue-200 mb-1 opacity-70">Margin</span>
                            <span className={`font-mono text-base font-black ${summaryData.reduce((acc, row) => acc + ((row.marketPrice || 0) - (row.benchmarkPrice || 0)), 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>₹{summaryData.reduce((acc, row) => acc + ((row.marketPrice || 0) - (row.benchmarkPrice || 0)), 0).toLocaleString()}</span>
                         </td>
                         <td className="p-6 border-l border-white/10"></td>
                         <td className="p-6 text-right bg-[#0076a8] border-l border-white/10">
                            <span className="block text-[9px] uppercase font-black text-blue-100 mb-1">Kit Final Price (Incl. GST)</span>
                            <span className="text-3xl font-black font-mono tracking-tighter">₹{summaryData.reduce((acc, row) => { const base = row.marketPrice || 0; const tax = base * (row.gst || 0) / 100; return acc + base + tax; }, 0).toLocaleString()}</span>
                         </td>
                         <td className="bg-[#14233c] border-l border-white/10"></td>
                      </tr>
                   </tfoot>
                </table>
             </div>
          </div>
        )}
      </div>
      
      {/* Modals follow ... */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-none">
              <h3 className="text-xl font-bold text-[#0b386a]">Add New Price</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 min-h-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pointer-events-auto">
                {kitType === 'Combo Kit' && (
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Combo Kit Name</label>
                    <select className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-bold text-blue-800 bg-blue-50/50" value={newPriceForm.comboKit} onChange={e => setNewPriceForm({ ...newPriceForm, comboKit: e.target.value })}>
                       <option value="">Select Combo Kit</option>
                       {solarKitsList.filter(kit => !newPriceForm.projectType || kit.projectType === newPriceForm.projectType || projectTypesList.find(pt => pt._id === newPriceForm.projectType)?.name === kit.projectType).map((kit, i) => <option key={i} value={kit.name}>{kit.name}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Product Type</label>
                  <select className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm" value={newPriceForm.productType} onChange={e => setNewPriceForm({ ...newPriceForm, productType: e.target.value })}>
                     <option value="">Select Product Type</option>
                     {productsList.map((p, i) => <option key={i} value={p.name}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Brand</label>
                  <select className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm" value={newPriceForm.brand} onChange={e => setNewPriceForm({ ...newPriceForm, brand: e.target.value })}>
                      <option value="">Select Brand</option>
                      {brandsList.map(b => <option key={b._id} value={b.brand || b.name || b.companyName}>{b.brand || b.name || b.companyName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Category</label>
                  <select className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm" value={newPriceForm.category} onChange={e => { const catName = e.target.value; setNewPriceForm({ ...newPriceForm, category: catName, subCategory: '' }); const catObj = categoriesList.find(c => c.name === catName); setFilteredModalSubCategories(catObj ? subCategoriesList.filter(sc => sc.categoryId === catObj._id || sc.categoryId?._id === catObj._id) : []); }}>
                       <option value="">Select Category</option>
                       {categoriesList.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Sub Category</label>
                  <select className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm" value={newPriceForm.subCategory} onChange={e => setNewPriceForm({ ...newPriceForm, subCategory: e.target.value })} disabled={!newPriceForm.category}>
                       <option value="">Select Sub Category</option>
                       {filteredModalSubCategories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Project Type</label>
                  <select className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm" value={newPriceForm.projectType} onChange={e => { const projName = e.target.value; setNewPriceForm({ ...newPriceForm, projectType: projName, subProjectType: '' }); setFilteredModalSubProjectTypes(subProjectTypesList); }}>
                       <option value="">Select Project Type</option>
                       {projectTypesList.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Sub Project Type</label>
                  <select className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm" value={newPriceForm.subProjectType} onChange={e => setNewPriceForm({ ...newPriceForm, subProjectType: e.target.value })} disabled={!newPriceForm.projectType}>
                       <option value="">Select Sub Project Type</option>
                       {filteredModalSubProjectTypes.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Benchmark Price</label><input type="number" className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm" value={newPriceForm.benchmarkPrice} onChange={e => setNewPriceForm({ ...newPriceForm, benchmarkPrice: Number(e.target.value) })} /></div>
                <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Market Price</label><input type="number" className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm" value={newPriceForm.marketPrice} onChange={e => setNewPriceForm({ ...newPriceForm, marketPrice: Number(e.target.value) })} /></div>
                <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">GST (%)</label><input type="number" className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm" value={newPriceForm.gst} onChange={e => setNewPriceForm({ ...newPriceForm, gst: Number(e.target.value) })} /></div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 flex gap-3 bg-white flex-none">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-50 transition-colors text-sm">Cancel</button>
                <button type="button" onClick={handleAddNewSubmit} className="flex-1 px-4 py-3 bg-[#0d6efd] text-white font-bold rounded-lg shadow hover:bg-blue-600 transition-colors text-sm">Save Price</button>
            </div>
          </div>
        </div>
      )}

      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="p-4 bg-[#17a2b8] flex justify-between items-center text-white"><h3 className="text-lg font-bold">Purchase History</h3><button type="button" onClick={() => setShowHistoryModal(false)}><X size={20} /></button></div>
             <div className="p-6">
                <div className="mb-4"><select className="px-3 py-1.5 border border-gray-300 rounded text-sm" value={historyFilter} onChange={(e) => setHistoryFilter(e.target.value)}><option>Last 3 Months</option><option>Last 6 Months</option><option>Last Year</option></select></div>
                <div className="border border-gray-200 rounded overflow-hidden">
                   <table className="w-full text-left text-sm"><thead className="bg-[#6db3f2] text-white"><tr><th className="p-3">Date</th><th className="p-3">Price</th><th className="p-3">Change</th><th className="p-3">Vendor</th></tr></thead><tbody><tr className="border-b"><td className="p-3">2023-10-15</td><td className="p-3 font-bold">₹24,500</td><td className="p-3 text-green-500">+300</td><td className="p-3">SolarTech Inc</td></tr></tbody></table>
                </div>
             </div>
             <div className="p-4 flex justify-end"><button type="button" onClick={() => setShowHistoryModal(false)} className="px-5 py-2 bg-gray-500 text-white rounded text-sm font-bold">Close</button></div>
          </div>
        </div>
      )}

      {showMarginModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded shadow-2xl max-w-3xl w-full flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="p-4 bg-[#ffc107] flex justify-between items-center"><h3 className="text-lg font-bold">Set Company Margin</h3><button type="button" onClick={() => setShowMarginModal(false)}><X size={20} /></button></div>
             <div className="p-6">
                <div className="border border-gray-200 rounded overflow-hidden">
                   <table className="w-full text-left text-sm">
                      <thead className="bg-[#6db3f2] text-white"><tr><th className="p-3">Delivery Type</th><th className="p-3 text-center">Cost (₹)</th><th className="p-3 text-center">Cashback (₹)</th><th className="p-3 text-center">Margin (₹)</th><th className="p-3 text-center">Total (₹)</th></tr></thead>
                      <tbody>{marginData.map((row, idx) => (<tr key={idx} className="border-b"><td className="p-3">{row.type}</td><td className="p-3 text-center"><input type="number" value={row.cost} onChange={e => { const n = [...marginData]; n[idx].cost = Number(e.target.value); n[idx].total = n[idx].cost + n[idx].cashback + n[idx].margin; setMarginData(n); }} className="w-20 border rounded px-2 text-center" /></td><td className="p-3 text-center"><input type="number" value={row.cashback} onChange={e => { const n = [...marginData]; n[idx].cashback = Number(e.target.value); n[idx].total = n[idx].cost + n[idx].cashback + n[idx].margin; setMarginData(n); }} className="w-20 border rounded px-2 text-center" /></td><td className="p-3 text-center"><input type="number" value={row.margin} onChange={e => { const n = [...marginData]; n[idx].margin = Number(e.target.value); n[idx].total = n[idx].cost + n[idx].cashback + n[idx].margin; setMarginData(n); }} className="w-20 border rounded px-2 text-center" /></td><td className="p-3 text-center font-bold">₹{row.total}</td></tr>))}</tbody>
                   </table>
                </div>
             </div>
             <div className="p-4 flex justify-end gap-2"><button type="button" onClick={() => setShowMarginModal(false)} className="px-5 py-2 bg-gray-500 text-white rounded font-bold text-sm">Close</button><button type="button" onClick={() => setShowMarginModal(false)} className="px-5 py-2 bg-blue-600 text-white rounded font-bold text-sm">Save Changes</button></div>
          </div>
        </div>
      )}
      
      <div className="py-10 border-t border-gray-200 text-center"><p className="text-[10px] text-gray-400 font-medium tracking-widest uppercase">Copyright © 2025, Solarkits. All Rights Reserved.</p></div>
    </div>
  );
}