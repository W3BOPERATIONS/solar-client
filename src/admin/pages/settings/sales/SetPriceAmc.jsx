import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Filter, CheckCircle, RefreshCw, MapPin, Layers, Tag, Save, X, Plus, Trash2, Edit } from 'lucide-react';
import { useLocations } from '../../../../hooks/useLocations';
import salesSettingsService from '../../../../services/settings/salesSettingsApi';
import { productApi } from '../../../../api/productApi';

const LocationCard = ({ title, subtitle, isSelected, onClick, isState }) => (
  <div
    onClick={onClick}
    className={`p-4 rounded-md transition-all cursor-pointer flex flex-col items-center justify-center text-center h-20 shadow-sm hover:shadow-md ${
      isSelected
      ? isState ? 'border-2 border-[#007bff] bg-[#8ccdfa]' : 'border-2 border-[#007bff] bg-white'
      : 'border border-gray-200 bg-white'
      }`}
  >
    <div className="font-bold text-[14px] text-[#2c3e50] mb-0">{title}</div>
    <div className="text-[11px] text-gray-500 font-medium uppercase tracking-tight">{subtitle}</div>
  </div>
);

export default function SetPriceAmc() {
  const [showLocationCards, setShowLocationCards] = useState(true);
  const [selectedStateId, setSelectedStateId] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [selectedClusterId, setSelectedClusterId] = useState('');
  
  // Dynamic filter lists
  const [categoriesList, setCategoriesList] = useState([]);
  const [subCategoriesList, setSubCategoriesList] = useState([]);
  const [projectTypesList, setProjectTypesList] = useState([]);
  const [subProjectTypesList, setSubProjectTypesList] = useState([]);
  const [brandsList, setBrandsList] = useState([]);
  const [productTypesList, setProductTypesList] = useState(['Solar Panel', 'Inverter', 'Battery', 'Solar Water Heater', 'Solar Street Light', 'Solar Pump']); // Standard products


  const [filters, setFilters] = useState({
    category: 'All Categories',
    subCategory: 'All Sub Categories',
    projectType: 'All Project Types',
    subProjectType: 'All Sub Types',
    brand: 'All Brands',
    productType: 'All Products'
  });

  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMarginModal, setShowMarginModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  
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
    amcPrice: 0,
    latestBuyingPrice: 0,
    gst: 18,
    status: 'Active'
  });

  const { states, districts, clusters, fetchDistricts, fetchClusters } = useLocations();
  const selectedStateObj = states.find((s) => s._id === selectedStateId) || null;
  const selectedClusterObj = clusters.find((c) => c._id === selectedClusterId) || null;
  const selectedDistrictObj = districts.find((d) => d._id === selectedDistrictId) || null;

  // 1. Fetch Dynamic Filter Data on Mount
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        const [catRes, subCatRes, projRes, subProjRes, brandRes] = await Promise.all([
          productApi.getCategories(),
          productApi.getSubCategories(),
          productApi.getProjectTypes(),
          productApi.getSubProjectTypes(),
          productApi.getBrands()
        ]);
        
        if (catRes.data?.data) setCategoriesList(catRes.data.data);
        if (subCatRes.data?.data) setSubCategoriesList(subCatRes.data.data);
        if (projRes.data?.data) setProjectTypesList(projRes.data.data);
        if (subProjRes.data?.data) setSubProjectTypesList(subProjRes.data.data);
        if (brandRes.data?.data) setBrandsList(brandRes.data.data);

      } catch (error) {
        console.error("Error fetching filter data:", error);
      }
    };
    fetchFilterData();
  }, []);

  // 2. Fetch Prices depends on District/Cluster/State
  useEffect(() => {
    if (selectedStateId) {
      // Clear downstream
      setSelectedClusterId('');
      setSelectedDistrictId('');
      fetchClusters({ stateId: selectedStateId }); // fetch clusters for state
    }
  }, [selectedStateId]);

  useEffect(() => {
    if (selectedClusterId) {
       setSelectedDistrictId('');
       fetchDistricts({ clusterId: selectedClusterId }); // if useLocations supports this, or fetch all districts
    }
  }, [selectedClusterId]);

  useEffect(() => {
    fetchPrices();
  }, [selectedStateId, selectedClusterId, selectedDistrictId]);

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const query = {};
      // Even if 'all' is selected, we map to missing ID
      if (selectedStateId && selectedStateId !== 'all') query.state = selectedStateId;
      if (selectedClusterId && selectedClusterId !== 'all') query.cluster = selectedClusterId;
      if (selectedDistrictId && selectedDistrictId !== 'all') query.district = selectedDistrictId;

      if (filters.category !== 'All Categories') query.category = filters.category;
      if (filters.subCategory !== 'All Sub Categories') query.subCategory = filters.subCategory;
      if (filters.projectType !== 'All Project Types') query.projectType = filters.projectType;
      if (filters.subProjectType !== 'All Sub Types') query.subProjectType = filters.subProjectType;
      if (filters.brand !== 'All Brands') query.brand = filters.brand;
      if (filters.productType !== 'All Products') query.productType = filters.productType;

      const data = await salesSettingsService.getSetPriceAmcs(query);
      
      const processedData = data.map(item => ({
        ...item,
        id: item._id,
        comboKit: item.comboKit || `${item.brand} Kit`,
        isEditing: false
      }));

      setTableData(processedData);
    } catch (error) {
      console.error("Error fetching prices:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStateSelect = (stateId) => setSelectedStateId(stateId);
  const handleClusterSelect = (clusterId) => setSelectedClusterId(clusterId);
  const handleDistrictSelect = (districtId) => setSelectedDistrictId(districtId);

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const handleApplyFilters = () => {
    fetchPrices(); // Apply fetched filters
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
        await salesSettingsService.updateSetPriceAmc(id, {
          amcPrice: item.amcPrice,
          latestBuyingPrice: item.latestBuyingPrice,
          gst: item.gst
        });
      } catch (error) {
        console.error("Error updating price:", error);
        alert("Failed to update price");
        return; 
      }
    }

    setTableData(prev => prev.map(row => {
      if (row.id === id) return { ...row, isEditing: !row.isEditing };
      return row;
    }));
  };

  const handleDeletePrice = async (id) => {
    if (window.confirm("Are you sure you want to delete this price setting?")) {
      try {
        await salesSettingsService.deleteSetPriceAmc(id);
        setTableData(prev => prev.filter(item => item.id !== id));
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
        quoteSettingsId: "000000000000000000000000", // Placeholder for the schema requirement since we are mirroring SetPrice UI directly
        state: (selectedStateId && selectedStateId !== 'all') ? selectedStateId : undefined,
        cluster: (selectedClusterId && selectedClusterId !== 'all') ? selectedClusterId : undefined,
        district: (selectedDistrictId && selectedDistrictId !== 'all') ? selectedDistrictId : undefined
      };
      await salesSettingsService.createSetPriceAmc(payload);
      setShowAddModal(false);
      fetchPrices(); 
      alert("Price added successfully!");
    } catch (error) {
      console.error("Error adding price:", error);
      alert("Failed to add price. Status 500. Please verify all fields.");
    }
  };

  return (
    <div className="bg-[#f4f7fa] min-h-screen font-sans">
      {/* Header Block matching styling commonly found in Sales Settings */}
      <div className="bg-white p-6 border-b border-gray-200 mb-8 px-12">
        <h1 className="text-[22px] font-bold text-[#14233c] mb-2">Set Price for AMC</h1>
        <button
          onClick={() => setShowLocationCards(!showLocationCards)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0076a8] text-white rounded text-xs font-bold shadow-sm hover:bg-blue-800 transition-all"
        >
          {showLocationCards ? <EyeOff size={14} /> : <Eye size={14} />} {showLocationCards ? 'Hide Location Cards' : 'Show Location Cards'}
        </button>
      </div>

      <div className="max-w-[1400px] mx-auto px-12 pb-20">
        
        {/* Location Selection Section */}
        {showLocationCards ? (
          <div className="space-y-10 mb-8">
            {/* States */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-[#14233c] mb-4">Select State</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <LocationCard
                  title="All States"
                  subtitle="ALL"
                  isSelected={selectedStateId === 'all' || selectedStateId === ''}
                  onClick={() => handleStateSelect('all')}
                />
                {states.map(s => (
                  <LocationCard
                    key={s._id}
                    title={s.name}
                    subtitle={s.code || s.name.substring(0, 2).toUpperCase()}
                    isSelected={selectedStateId === s._id}
                    onClick={() => handleStateSelect(s._id)}
                    isState={true}
                  />
                ))}
              </div>
            </div>

            {/* Clusters */}
            {selectedStateId && (
              <div className="mb-6">
                <h2 className="text-xl font-bold text-[#14233c] mb-4">Select Cluster</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <LocationCard
                    title="All Clusters"
                    subtitle="ALL"
                    isSelected={selectedClusterId === 'all'}
                    onClick={() => handleClusterSelect('all')}
                  />
                  {clusters.filter(c => selectedStateId === 'all' || c.state === selectedStateId || c.state?._id === selectedStateId).map(c => {
                    const parentState = states.find(s => s._id === c.state || s._id === c.state?._id) || selectedStateObj;
                    return (
                      <LocationCard
                        key={c._id}
                        title={c.name}
                        subtitle={parentState ? (parentState.code || parentState.name.substring(0,2).toUpperCase()) : 'CL'}
                        isSelected={selectedClusterId === c._id}
                        onClick={() => handleClusterSelect(c._id)}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Districts */}
            {selectedClusterId && (
              <div className="mb-6">
                <h2 className="text-xl font-bold text-[#14233c] mb-4">Select District</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <LocationCard
                    title="All Districts"
                    subtitle="ALL"
                    isSelected={selectedDistrictId === 'all'}
                    onClick={() => handleDistrictSelect('all')}
                  />
                  {districts.map(d => {
                    const parentCluster = clusters.find(c => c._id === selectedClusterId);
                    return (
                      <LocationCard
                        key={d._id}
                        title={d.name}
                        subtitle={parentCluster ? parentCluster.name : 'DT'}
                        isSelected={selectedDistrictId === d._id}
                        onClick={() => handleDistrictSelect(d._id)}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Selected Location Banner */}
        {selectedDistrictId && (
          <div className="bg-white rounded-lg shadow-sm mb-6 p-6 border border-gray-100">
            <h5 className="mb-4 text-xl font-bold text-gray-800">Selected Location</h5>
            <div className="flex flex-wrap gap-3 mt-2">
              <span className="inline-flex items-center bg-[#0076a8] text-white px-4 py-2 rounded font-bold text-sm shadow-sm">
                State: {selectedStateObj?.name || 'All'}
              </span>
              <span className="inline-flex items-center bg-[#0d6efd] text-white px-4 py-2 rounded font-bold text-sm shadow-sm">
                <Layers size={14} className="mr-1" />
                Cluster: {selectedClusterObj?.name || 'All'}
              </span>
              <span className="inline-flex items-center bg-green-600 text-white px-4 py-2 rounded font-bold text-sm shadow-sm">
                <MapPin size={14} className="mr-1" />
                District: {selectedDistrictObj?.name || 'All'}
              </span>
            </div>
          </div>
        )}

        {/* Filters Section (Mirroring the PHP layout) */}
        {selectedDistrictId && (
          <div className="space-y-6 mb-8">
            {/* Top Row: Project Type & Kit Type */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col xl:flex-row p-0 overflow-hidden">
               
               {/* Project Type Filters */}
               <div className="flex-[2] p-5 border-b xl:border-b-0 xl:border-r border-gray-100 xl:min-w-[600px]">
                  <h5 className="font-bold text-[#14233c] mb-4 text-[15px]">Project Type Filters</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[13px] text-gray-600 mb-1.5">Category</label>
                      <select
                        className="w-full px-2 py-1.5 border border-gray-200 rounded text-[13px] text-gray-700 bg-white focus:outline-none focus:border-[#0076a8]"
                        value={filters.category}
                        onChange={(e) => handleFilterChange('category', e.target.value)}
                      >
                        <option>All Categories</option>
                        {categoriesList.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[13px] text-gray-600 mb-1.5">Sub Category</label>
                      <select
                        className="w-full px-2 py-1.5 border border-gray-200 rounded text-[13px] text-gray-700 bg-white focus:outline-none focus:border-[#0076a8]"
                        value={filters.subCategory}
                        onChange={(e) => handleFilterChange('subCategory', e.target.value)}
                      >
                        <option>All Sub Categories</option>
                        {subCategoriesList.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[13px] text-gray-600 mb-1.5">Project Type</label>
                      <select
                        className="w-full px-2 py-1.5 border border-gray-200 rounded text-[13px] text-gray-700 bg-white focus:outline-none focus:border-[#0076a8]"
                        value={filters.projectType}
                        onChange={(e) => handleFilterChange('projectType', e.target.value)}
                      >
                        <option>All Project Types</option>
                        {projectTypesList.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[13px] text-gray-600 mb-1.5">Sub Project Type</label>
                      <select
                        className="w-full px-2 py-1.5 border border-gray-200 rounded text-[13px] text-gray-700 bg-white focus:outline-none focus:border-[#0076a8]"
                        value={filters.subProjectType}
                        onChange={(e) => handleFilterChange('subProjectType', e.target.value)}
                      >
                        <option>All Sub Types</option>
                        {subProjectTypesList.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
               </div>

               {/* Select Kit Type - REMOVED */}
               <div className="xl:w-[350px] shrink-0 p-5">
                  <h5 className="font-bold text-[#14233c] mb-4 text-[15px]">Product Type Selection</h5>
                  <p className="text-sm text-gray-500">Product types are filtered below.</p>
               </div>
            </div>

            {/* Bottom Row: Product & Brand Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 xl:w-[500px] max-w-full">
               <h5 className="font-bold text-[#14233c] mb-4 text-[15px]">Product & Brand Filters</h5>
               <div className="flex flex-col sm:flex-row items-end gap-3">
                 <div className="flex-1 w-full">
                   <label className="block text-[13px] text-gray-600 mb-1.5">Brand</label>
                   <select
                     className="w-full px-2 py-1.5 border border-gray-200 rounded text-[13px] text-gray-700 bg-white focus:outline-none focus:border-[#0076a8]"
                     value={filters.brand}
                     onChange={(e) => handleFilterChange('brand', e.target.value)}
                   >
                     <option>All Brands</option>
                     {brandsList.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
                   </select>
                 </div>
                 <div className="flex-1 w-full">
                   <label className="block text-[13px] text-gray-600 mb-1.5">Product Type</label>
                   <select
                     className="w-full px-2 py-1.5 border border-gray-200 rounded text-[13px] text-gray-700 bg-white focus:outline-none focus:border-[#0076a8]"
                     value={filters.productType}
                     onChange={(e) => handleFilterChange('productType', e.target.value)}
                   >
                     <option>All Product</option>
                     {productTypesList.map((p, i) => <option key={i} value={p}>{p}</option>)}
                   </select>
                 </div>
                 <button 
                   onClick={handleApplyFilters}
                   className="flex items-center justify-center gap-1.5 text-[13px] text-gray-500 hover:text-[#0076a8] font-bold py-1.5 sm:mb-0 w-full sm:w-auto mt-2 sm:mt-0"
                 >
                   <Filter size={14} /> Apply Filters
                 </button>
               </div>
            </div>
          </div>
        )}

        {/* Table Area */}
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
                      <th className="p-3 border-r border-white/20 text-center text-xs font-bold leading-tight w-28">AMC Price</th>
                      <th className="p-3 border-r border-white/20 text-center text-xs font-bold leading-tight w-28">Latest Buying Price</th>
                      <th className="p-3 border-r border-white/20 text-center text-xs font-bold leading-tight w-24">Purchase History</th>
                      <th className="p-3 border-r border-white/20 text-center text-xs font-bold leading-tight w-28">Company Margin (per KW)</th>
                      <th className="p-3 border-r border-white/20 text-center text-xs font-bold leading-tight w-20">GST (%)</th>
                      <th className="p-3 text-center text-xs font-bold leading-tight w-20">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                       <tr><td colSpan="13" className="text-center py-6 text-gray-500">Loading prices...</td></tr>
                    ) : tableData.length === 0 ? (
                       <tr><td colSpan="13" className="text-center py-6 text-gray-500">No data found. Add new price.</td></tr>
                    ) : (
                       tableData.map((row, idx) => (
                          <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                              <td className="p-2 border-r border-gray-100 text-center text-gray-600 text-xs">{row.comboKit || `${row.brand} - ${row.productType}`}</td>
                              <td className="p-2 border-r border-gray-100 text-center text-gray-600 text-xs">{row.brand}</td>
                              <td className="p-2 border-r border-gray-100 text-center text-gray-600 text-xs">{row.productType}</td>
                              <td className="p-2 border-r border-gray-100 text-center text-gray-600 text-xs">{row.category}</td>
                              <td className="p-2 border-r border-gray-100 text-center text-gray-600 text-xs">{row.subCategory}</td>
                              <td className="p-2 border-r border-gray-100 text-center text-gray-600 text-xs">{row.projectType}</td>
                              <td className="p-2 border-r border-gray-100 text-center text-gray-600 text-xs">{row.subProjectType}</td>
                              <td className="p-2 border-r border-gray-100 text-center">
                                 <input
                                    type="number"
                                    className={`w-32 px-3 py-1.5 border rounded-full text-center text-xs mx-auto focus:outline-none ${row.isEditing ? 'border-blue-400 bg-white' : 'border-gray-200 bg-gray-50'}`}
                                    value={row.amcPrice}
                                    onChange={(e) => handleTableInputChange(row.id, 'amcPrice', Number(e.target.value) || 0)}
                                    disabled={!row.isEditing}
                                 />
                              </td>
                              <td className="p-2 border-r border-gray-100 text-center">
                                 <input
                                    type="number"
                                    className={`w-32 px-3 py-1.5 border rounded-full text-center text-xs mx-auto focus:outline-none ${row.isEditing ? 'border-blue-400 bg-white' : 'border-gray-200 bg-gray-50'}`}
                                    value={row.latestBuyingPrice}
                                    onChange={(e) => handleTableInputChange(row.id, 'latestBuyingPrice', Number(e.target.value) || 0)}
                                    disabled={!row.isEditing}
                                 />
                              </td>
                              <td className="p-2 border-r border-gray-100 text-center">
                                 <button onClick={() => setShowHistoryModal(true)} className="bg-[#17a2b8] text-white px-4 py-1.5 rounded font-bold text-[11px] hover:bg-[#138496] transition-colors">
                                    View
                                 </button>
                              </td>
                              <td className="p-2 border-r border-gray-100 text-center">
                                 <button onClick={() => setShowMarginModal(true)} className="bg-[#ffc107] text-[#212529] px-3 py-1.5 rounded font-bold text-[11px] hover:bg-[#e0a800] transition-colors">
                                    Set Margin
                                 </button>
                              </td>
                              <td className="p-2 border-r border-gray-100 text-center">
                                  <input
                                    type="number"
                                    className={`w-20 px-2 py-1.5 border rounded-full text-center text-xs mx-auto focus:outline-none ${row.isEditing ? 'border-blue-400 bg-white' : 'border-gray-200 bg-gray-50'}`}
                                    value={row.gst}
                                    onChange={(e) => handleTableInputChange(row.id, 'gst', Number(e.target.value) || 0)}
                                    disabled={!row.isEditing}
                                 />
                              </td>
                              <td className="p-2 text-center">
                                  <button
                                    onClick={() => toggleRowEdit(row.id)}
                                    className={`px-3 py-1.5 rounded font-bold text-[10px] text-white shadow-sm transition-colors mr-2 ${row.isEditing ? 'bg-blue-500 hover:bg-blue-600' : 'bg-[#28a745] hover:bg-green-600'}`}
                                  >
                                     {row.isEditing ? 'Save' : 'Edit'}
                                  </button>
                              </td>
                          </tr>
                       ))
                    )}
                  </tbody>
                </table>
             </div>
             <div className="p-4 border-t border-gray-100 flex gap-2">
                 <button className="bg-[#0076a8] text-white px-5 py-2 rounded shadow text-sm font-bold flex items-center gap-2 hover:bg-blue-800 transition-colors" onClick={() => setShowAddModal(true)}>
                    <CheckCircle size={16} /> Set Price
                 </button>
                 <button className="bg-gray-500 text-white px-5 py-2 rounded shadow text-sm font-bold flex items-center gap-2 hover:bg-gray-600 transition-colors" onClick={handleResetFilters}>
                    <RefreshCw size={16} /> Reset Filters
                 </button>
             </div>
          </div>
        )}

      </div>
      
      {/* Add Price Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-none">
              <h3 className="text-xl font-bold text-[#0b386a]">Add New Price</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 min-h-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pointer-events-auto">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Product Type</label>
                  <select className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm" value={newPriceForm.productType} onChange={e => setNewPriceForm({ ...newPriceForm, productType: e.target.value })}>
                     {productTypesList.map((p, i) => <option key={i} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Brand</label>
                  <select className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm" value={newPriceForm.brand} onChange={e => setNewPriceForm({ ...newPriceForm, brand: e.target.value })}>
                      <option value="">Select Brand</option>
                      {brandsList.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Category</label>
                  <select className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm" value={newPriceForm.category} onChange={e => setNewPriceForm({ ...newPriceForm, category: e.target.value })}>
                       <option value="">Select Category</option>
                      {categoriesList.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Sub Category</label>
                  <select className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm" value={newPriceForm.subCategory} onChange={e => setNewPriceForm({ ...newPriceForm, subCategory: e.target.value })}>
                       <option value="">Select Sub Category</option>
                       {subCategoriesList.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Project Type</label>
                  <select className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm" value={newPriceForm.projectType} onChange={e => setNewPriceForm({ ...newPriceForm, projectType: e.target.value })}>
                       <option value="">Select Project Type</option>
                       {projectTypesList.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Sub Project Type</label>
                  <select className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm" value={newPriceForm.subProjectType} onChange={e => setNewPriceForm({ ...newPriceForm, subProjectType: e.target.value })}>
                       <option value="">Select Sub Project Type</option>
                       {subProjectTypesList.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">AMC Price</label>
                  <input type="number" className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm" value={newPriceForm.amcPrice} onChange={e => setNewPriceForm({ ...newPriceForm, amcPrice: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Latest Buying Price</label>
                  <input type="number" className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm" value={newPriceForm.latestBuyingPrice} onChange={e => setNewPriceForm({ ...newPriceForm, latestBuyingPrice: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">GST (%)</label>
                  <input type="number" className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm" value={newPriceForm.gst} onChange={e => setNewPriceForm({ ...newPriceForm, gst: Number(e.target.value) })} />
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-100 flex gap-3 bg-white flex-none">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-50 shadow-sm transition-colors text-sm">Cancel</button>
                <button type="button" onClick={handleAddNewSubmit} className="flex-1 px-4 py-3 bg-[#0d6efd] text-white font-bold rounded-lg shadow hover:bg-blue-600 transition-colors text-sm">Save Price</button>
            </div>
          </div>
        </div>
      )}

      {/* Purchase History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="p-4 bg-[#17a2b8] flex justify-between items-center text-white">
                <h3 className="text-lg font-bold">Purchase History</h3>
                <button type="button" onClick={() => setShowHistoryModal(false)} className="text-white hover:text-gray-200 transition-colors"><X size={20} /></button>
             </div>
             <div className="p-6 overflow-y-auto">
                <div className="mb-4">
                   <select 
                      className="px-3 py-1.5 border border-gray-300 rounded text-sm min-w-[200px] outline-none"
                      value={historyFilter}
                      onChange={(e) => setHistoryFilter(e.target.value)}
                   >
                     <option>Last 3 Months</option>
                     <option>Last 6 Months</option>
                     <option>Last Year</option>
                   </select>
                </div>
                
                <div className="border border-gray-200 rounded overflow-hidden">
                   <table className="w-full text-left border-collapse text-sm">
                      <thead className="bg-[#6db3f2] text-white">
                         <tr>
                           <th className="p-3 text-xs font-bold leading-tight">Date</th>
                           <th className="p-3 text-xs font-bold leading-tight">Purchase Price</th>
                           <th className="p-3 text-xs font-bold leading-tight">Price Change</th>
                           <th className="p-3 text-xs font-bold leading-tight">Percentage Change</th>
                           <th className="p-3 text-xs font-bold leading-tight">Vendor</th>
                         </tr>
                      </thead>
                      <tbody>
                         <tr className="border-b border-gray-100">
                           <td className="p-3 text-gray-700 text-[13px]">2023-10-15</td>
                           <td className="p-3 text-gray-700 font-bold text-[13px]">₹24,500</td>
                           <td className="p-3 text-green-500 font-bold text-[13px]">+300</td>
                           <td className="p-3 text-green-500 font-bold text-[13px]">+1.24%</td>
                           <td className="p-3 text-gray-700 text-[13px]">SolarTech Inc</td>
                         </tr>
                         <tr className="border-b border-gray-100">
                           <td className="p-3 text-gray-700 text-[13px]">2023-09-22</td>
                           <td className="p-3 text-gray-700 font-bold text-[13px]">₹24,200</td>
                           <td className="p-3 text-green-500 font-bold text-[13px]">+400</td>
                           <td className="p-3 text-green-500 font-bold text-[13px]">+1.68%</td>
                           <td className="p-3 text-gray-700 text-[13px]">Green Energy Solutions</td>
                         </tr>
                         <tr>
                           <td className="p-3 text-gray-700 text-[13px]">2023-08-10</td>
                           <td className="p-3 text-gray-700 font-bold text-[13px]">₹23,800</td>
                           <td className="p-3 text-green-500 font-bold text-[13px]">+300</td>
                           <td className="p-3 text-green-500 font-bold text-[13px]">+1.28%</td>
                           <td className="p-3 text-gray-700 text-[13px]">SolarTech Inc</td>
                         </tr>
                      </tbody>
                   </table>
                </div>
             </div>
             <div className="p-4 flex justify-end">
                <button type="button" onClick={() => setShowHistoryModal(false)} className="px-5 py-2 bg-[#6c757d] text-white font-bold rounded hover:bg-[#5a6268] text-[13px]">Close</button>
             </div>
          </div>
        </div>
      )}

      {/* Set Company Margin Modal */}
      {showMarginModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded shadow-2xl max-w-3xl w-full flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="p-4 bg-[#ffc107] flex justify-between items-center text-[#212529]">
                <h3 className="text-lg font-bold">Set Company Margin</h3>
                <button type="button" onClick={() => setShowMarginModal(false)} className="text-[#212529] hover:text-black transition-colors"><X size={20} /></button>
             </div>
             <div className="p-6 overflow-y-auto">
                <div className="mb-4 flex items-center gap-2">
                   <label className="text-[13px] text-gray-700 font-bold">Filter by Delivery Type:</label>
                   <select 
                      className="px-2 py-1 border border-gray-300 rounded text-sm min-w-[100px] outline-none"
                      value={marginFilter}
                      onChange={(e) => setMarginFilter(e.target.value)}
                   >
                     <option>All</option>
                     <option>Prime</option>
                     <option>Regular</option>
                     <option>Other</option>
                   </select>
                </div>
                
                <div className="border border-gray-200 rounded overflow-hidden">
                   <table className="w-full text-left border-collapse text-sm">
                      <thead className="bg-[#6db3f2] text-white">
                         <tr>
                           <th className="p-3 text-xs font-bold leading-tight">Delivery Type</th>
                           <th className="p-3 text-xs font-bold leading-tight text-center">Delivery Cost (₹)</th>
                           <th className="p-3 text-xs font-bold leading-tight text-center">Cashback per KW (₹)</th>
                           <th className="p-3 text-xs font-bold leading-tight text-center">Company Margin Per Kw</th>
                           <th className="p-3 text-xs font-bold leading-tight text-center">Total (₹)</th>
                         </tr>
                      </thead>
                      <tbody>
                         {marginData.map((row, idx) => (
                           <tr key={idx} className="border-b border-gray-100">
                             <td className="p-3 text-gray-700 text-[13px]">{row.type}</td>
                             <td className="p-3 text-center">
                               <input type="number" 
                                  value={row.cost}
                                  onChange={(e) => {
                                     const newD = [...marginData];
                                     newD[idx].cost = Number(e.target.value);
                                     newD[idx].total = newD[idx].cost + newD[idx].cashback + newD[idx].margin;
                                     setMarginData(newD);
                                  }}
                                  className="w-24 px-3 py-2 border border-gray-200 bg-gray-50 rounded text-center text-[13px] focus:outline-none" />
                             </td>
                             <td className="p-3 text-center">
                               <input type="number" 
                                  value={row.cashback}
                                  onChange={(e) => {
                                     const newD = [...marginData];
                                     newD[idx].cashback = Number(e.target.value);
                                     newD[idx].total = newD[idx].cost + newD[idx].cashback + newD[idx].margin;
                                     setMarginData(newD);
                                  }}
                                  className="w-24 px-3 py-2 border border-gray-200 bg-gray-50 rounded text-center text-[13px] focus:outline-none" />
                             </td>
                             <td className="p-3 text-center">
                               <input type="number" 
                                  value={row.margin}
                                  onChange={(e) => {
                                     const newD = [...marginData];
                                     newD[idx].margin = Number(e.target.value);
                                     newD[idx].total = newD[idx].cost + newD[idx].cashback + newD[idx].margin;
                                     setMarginData(newD);
                                  }}
                                  className="w-24 px-3 py-2 border border-gray-200 bg-gray-50 rounded text-center text-[13px] focus:outline-none focus:border-[#6db3f2]" />
                             </td>
                             <td className="p-3 text-center text-gray-800 text-[13px]">
                               ₹ {row.total.toFixed(2)}
                             </td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
             <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
                <button type="button" onClick={() => setShowMarginModal(false)} className="px-5 py-2 bg-[#6c757d] text-white font-bold rounded hover:bg-[#5a6268] text-[13px]">Close</button>
                <button type="button" onClick={() => setShowMarginModal(false)} className="px-5 py-2 bg-[#007bff] text-white font-bold rounded hover:bg-[#0069d9] text-[13px]">Save Changes</button>
             </div>
          </div>
        </div>
      )}
      
      {/* Footer Area to match style */}
      <div className="py-10 border-t border-gray-200 text-center">
          <p className="text-[10px] text-gray-400 font-medium tracking-widest uppercase">Copyright © 2025, Solarkits. All Rights Reserved.</p>
      </div>

    </div>
  );
}