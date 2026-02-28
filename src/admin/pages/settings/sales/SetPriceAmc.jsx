import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Filter, CheckCircle, RefreshCw, MapPin, Layers, Tag, Save, X, Plus, Trash2, Edit } from 'lucide-react';
import { useLocations } from '../../../../hooks/useLocations';
import salesSettingsService from '../../../../admin/services/salesSettingsService';
import { getQuoteSettings } from '../../../../services/quote/quoteApi';

export default function SetPriceAmc() {
  const [showLocationCards, setShowLocationCards] = useState(true);
  const [selectedStateId, setSelectedStateId] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [selectedClusterId, setSelectedClusterId] = useState('');
  const [showLocationDisplay, setShowLocationDisplay] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showMarginModal, setShowMarginModal] = useState(false);
  const [kitType, setKitType] = useState('customKit');

  // New state for Add AMC Price Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPriceForm, setNewPriceForm] = useState({
    quoteSettingsId: '',
    productType: 'Service',
    brand: '-',
    category: '',
    subCategory: '',
    projectType: '',
    subProjectType: '',
    amcPrice: 0,
    latestBuyingPrice: 0,
    gst: 18,
    status: 'Active'
  });

  const [loading, setLoading] = useState(false);
  const [tableData, setTableData] = useState([]);

  const [filters, setFilters] = useState({
    category: 'All Categories',
    subCategory: 'All Sub Categories',
    projectType: 'All Project Types',
    subProjectType: 'All Sub Types',
    brand: 'All Brands',
    productType: 'All Products'
  });

  const { states, districts, clusters, fetchDistricts, fetchClusters } = useLocations();
  const selectedStateObj = states.find((s) => s._id === selectedStateId) || null;
  const selectedDistrictObj = districts.find((d) => d._id === selectedDistrictId) || null;
  const selectedClusterObj = clusters.find((c) => c._id === selectedClusterId) || null;

  // Margin modal data
  const [marginData, setMarginData] = useState([
    { type: "prime", cost: 500, cashback: 150, percent: 1000, total: 0 },
    { type: "regular", cost: 400, cashback: 100, percent: 800, total: 0 },
    { type: "other", cost: 300, cashback: 80, percent: 500, total: 0 }
  ]);

  // Summary data
  const [summaryData, setSummaryData] = useState({
    highestMargin: 0,
    highestMarginProduct: "",
    optimalCount: 0,
    priceAlerts: 0,
    greenProducts: []
  });

  // Purchase history data
  const purchaseHistory = [
    { date: "2023-10-15", price: "₹24,500", change: "+300", percent: "+1.24%", vendor: "SolarTech Inc" },
    { date: "2023-09-22", price: "₹24,200", change: "+400", percent: "+1.68%", vendor: "Green Energy Solutions" },
    { date: "2023-08-10", price: "₹23,800", change: "+300", percent: "+1.28%", vendor: "SolarTech Inc" }
  ];

  useEffect(() => {
    if (selectedStateId) {
      fetchDistricts({ stateId: selectedStateId });
    }
  }, [selectedStateId]);

  useEffect(() => {
    if (selectedDistrictId) {
      fetchClusters({ districtId: selectedDistrictId });
    }
  }, [selectedDistrictId]);

  // Fetch prices when location or filters change
  useEffect(() => {
    fetchPrices();
  }, [selectedStateId, selectedDistrictId, selectedClusterId]);

  const fetchPrices = async () => {
    setLoading(true);
    try {
      // 1. Fetch all active Quote Settings
      const quotesData = await getQuoteSettings();
      const activeQuotes = quotesData.filter(q => q.isActive !== false);

      // 2. Fetch existing AMC Price settings for the selected location
      const query = {};
      if (selectedStateId) query.state = selectedStateId;
      if (selectedDistrictId) query.district = selectedDistrictId;
      if (selectedClusterId) query.cluster = selectedClusterId;

      const amcPrices = await salesSettingsService.getSetPricesAmc(query);

      // 3. Automatic Row Generation: Map Quote Settings to rows, merge with existing prices
      const processedData = activeQuotes.map(q => {
        // Find existing price for this quote setting
        const existingPrice = amcPrices.find(p => p.quoteSettingsId === q._id);

        const row = {
          id: existingPrice?._id || `temp-${q._id}`,
          quoteSettingsId: q._id,
          category: q.category,
          subCategory: q.subCategory,
          projectType: q.projectType,
          subProjectType: q.subProjectType,
          brand: existingPrice?.brand || '-',
          productType: existingPrice?.productType || '-',
          comboKit: existingPrice?.comboKit || `${q.projectType} Kit`,
          amcPrice: existingPrice?.amcPrice || 0,
          latestBuyingPrice: existingPrice?.latestBuyingPrice || 0,
          gst: existingPrice?.gst || 18,
          status: existingPrice?.status || 'Active',
          isEditing: false,
          isNew: !existingPrice
        };

        const isRed = row.latestBuyingPrice > row.amcPrice;
        const isGreen = row.latestBuyingPrice <= row.amcPrice && row.amcPrice > 0;
        row.backgroundColor = isRed ? 'rgb(247, 186, 186)' : isGreen ? 'rgb(186, 240, 202)' : '';

        return row;
      });

      // Filter by frontend filters if applied
      const filteredData = processedData.filter(item => {
        if (filters.category !== 'All Categories' && item.category !== filters.category) return false;
        // Add more filter logic if needed
        return true;
      });

      setTableData(filteredData);
      calculateSummary(filteredData);

    } catch (error) {
      console.error("Error fetching AMC data:", error);
      alert("Failed to load AMC settings");
    } finally {
      setLoading(false);
    }
  };


  const handleStateSelect = (stateId) => {
    setSelectedStateId(stateId);
    setSelectedDistrictId('');
    setSelectedClusterId('');
    setShowLocationDisplay(false);
    setShowForm(false);
    setShowSummary(false);
  };

  const handleDistrictSelect = (districtId) => {
    setSelectedDistrictId(districtId);
    setSelectedClusterId('');
  };

  const handleClusterSelect = (clusterId) => {
    setSelectedClusterId(clusterId);
    setShowLocationDisplay(true);
    setShowForm(true);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
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
      // Saving changes
      try {
        const payload = {
          quoteSettingsId: item.quoteSettingsId,
          amcPrice: item.amcPrice,
          latestBuyingPrice: item.latestBuyingPrice,
          gst: item.gst,
          category: item.category,
          subCategory: item.subCategory,
          projectType: item.projectType,
          subProjectType: item.subProjectType,
          brand: item.brand !== '-' ? item.brand : 'Default',
          productType: item.productType !== '-' ? item.productType : 'Service',
          state: selectedStateId || undefined,
          district: selectedDistrictId || undefined,
          cluster: selectedClusterId || undefined
        };

        if (item.isNew) {
          await salesSettingsService.createSetPriceAmc(payload);
        } else {
          await salesSettingsService.updateSetPriceAmc(id, payload);
        }
        await fetchPrices(); // Refresh data to get real IDs
      } catch (error) {
        console.error("Error saving AMC price:", error);
        alert("Failed to save price");
        return;
      }
    }

    setTableData(prev => prev.map(item => {
      if (item.id === id) {
        const newEditingState = !item.isEditing;
        const isRed = item.latestBuyingPrice > item.amcPrice;
        const isGreen = item.latestBuyingPrice <= item.amcPrice;
        return {
          ...item,
          isEditing: newEditingState,
          backgroundColor: newEditingState ? '#fff8e1' : (isRed ? 'rgb(247, 186, 186)' : isGreen ? 'rgb(186, 240, 202)' : '')
        };
      }
      return item;
    }));
  };

  const handleDeletePrice = async (id) => {
    if (window.confirm("Are you sure you want to delete this AMC price setting?")) {
      try {
        await salesSettingsService.deleteSetPriceAmc(id);
        setTableData(prev => prev.filter(item => item.id !== id));
      } catch (error) {
        console.error("Error deleting price:", error);
        alert("Failed to delete price");
      }
    }
  };

  const handleSetPrice = () => {
    // Recalculate Logic visual only
    const updatedData = tableData.map(item => {
      const isRed = item.latestBuyingPrice > item.amcPrice;
      const isGreen = item.latestBuyingPrice <= item.amcPrice;

      return {
        ...item,
        backgroundColor: isRed ? 'rgb(247, 186, 186)' :
          isGreen ? 'rgb(186, 240, 202)' : '',
        isEditing: false
      };
    });

    setTableData(updatedData);
    calculateSummary(updatedData);
    setShowSummary(true);
    alert("Overview updated based on current values.");
  };

  const calculateSummary = (data) => {
    let highestMargin = 0;
    let highestMarginProduct = '';
    let optimalCount = 0;
    let priceAlerts = 0;
    const greenProducts = [];

    data.forEach(item => {
      const isRed = item.latestBuyingPrice > item.amcPrice;
      const isGreen = item.latestBuyingPrice <= item.amcPrice;

      if (isRed) priceAlerts++;
      if (isGreen) {
        optimalCount++;
        greenProducts.push(item);
      }

      if (item.gst > highestMargin) {
        highestMargin = item.gst;
        highestMarginProduct = item.comboKit;
      }
    });

    setSummaryData({
      highestMargin,
      highestMarginProduct,
      optimalCount,
      priceAlerts,
      greenProducts
    });
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
    setKitType('customKit');
    fetchPrices();
    setShowSummary(false);
    alert('All filters have been reset!');
  };

  const handleMarginChange = (index, field, value) => {
    const updated = [...marginData];
    updated[index][field] = parseInt(value) || 0;
    updated[index].total = updated[index].cost + updated[index].cashback + updated[index].percent;
    setMarginData(updated);
  };

  const handleSaveMargin = () => {
    alert('Margin settings saved successfully!');
    setShowMarginModal(false);
  };

  // Calculate margins on mount
  useEffect(() => {
    const updated = marginData.map(item => ({
      ...item,
      total: item.cost + item.cashback + item.percent
    }));
    setMarginData(updated);
  }, []);

  const handleAddNewSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newPriceForm,
        state: selectedStateId || undefined,
        district: selectedDistrictId || undefined,
        cluster: selectedClusterId || undefined
      };
      await salesSettingsService.createSetPriceAmc(payload);
      setShowAddModal(false);
      fetchPrices();
      alert("AMC Price added successfully!");
    } catch (error) {
      console.error("Error adding price:", error);
      alert("Failed to add price");
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="mb-4">
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h3 className="text-xl font-bold text-gray-900 mb-0">Set Price for AMC</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-all duration-300"
              >
                <Plus size={16} />
                Add New AMC Price
              </button>
              <button
                onClick={() => setShowLocationCards(!showLocationCards)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-300"
              >
                {showLocationCards ? <><EyeOff size={16} /> Hide Location</> : <><Eye size={16} /> Show Location</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Location Selection Section */}
      <div
        className={`transition-all duration-500 overflow-hidden ${showLocationCards ? 'max-h-[2000px] opacity-100 mb-6' : 'max-h-0 opacity-0'
          }`}
      >
        {/* State Selection */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-800 mb-3">Select State</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 my-4">
            {states.length > 0 ? states.map((state) => (
              <div
                key={state._id}
                className={`bg-white rounded-lg shadow-sm p-5 text-center cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${selectedStateId === state._id ? 'border-3 border-blue-500' : ''
                  }`}
                onClick={() => handleStateSelect(state._id)}
              >
                <h5 className="font-bold text-gray-900">{state.name}</h5>
                <p className="text-gray-500 mb-0">{state.code || '-'}</p>
              </div>
            )) : (
              <div className="col-span-full bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-500">
                No states available. Please add them in Settings → Location Management.
              </div>
            )}
          </div>
        </div>

        {/* District Selection */}
        <div
          className={`transition-all duration-500 overflow-hidden ${selectedStateId ? 'max-h-[2000px] opacity-100 mb-8' : 'max-h-0 opacity-0'
            }`}
        >
          <h4 className="text-lg font-semibold text-gray-800 mb-3">Select District</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 my-4">
            {districts.length > 0 ? districts.map((district) => (
              <div
                key={district._id}
                className={`bg-white rounded-lg shadow-sm p-5 text-center cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${selectedDistrictId === district._id ? 'border-3 border-blue-500' : ''
                  }`}
                onClick={() => handleDistrictSelect(district._id)}
              >
                <h6 className="font-bold text-gray-900">{district.name}</h6>
                <p className="text-gray-500 mb-0">{selectedStateObj?.name || ''}</p>
              </div>
            )) : (
              <div className="col-span-full bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-500">
                No districts available.
              </div>
            )}
          </div>
        </div>

        {/* Cluster Selection */}
        <div
          className={`transition-all duration-500 overflow-hidden ${selectedDistrictId ? 'max-h-[2000px] opacity-100 mb-8' : 'max-h-0 opacity-0'
            }`}
        >
          <h4 className="text-lg font-semibold text-gray-800 mb-3">Select Cluster</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 my-4">
            {clusters.length > 0 ? clusters.map((cluster) => (
              <div
                key={cluster._id}
                className={`bg-white rounded-lg shadow-sm p-5 text-center cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${selectedClusterId === cluster._id ? 'border-3 border-blue-500' : ''
                  }`}
                onClick={() => handleClusterSelect(cluster._id)}
              >
                <h6 className="font-bold text-gray-900">{cluster.name}</h6>
                <p className="text-gray-500 mb-0">{selectedDistrictObj?.name || ''}</p>
              </div>
            )) : (
              <div className="col-span-full bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-500">
                No clusters available.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selected Location Display */}
      {showLocationDisplay && (
        <div className="my-4">
          <div className="bg-gray-50 rounded-lg shadow-sm">
            <div className="p-4">
              <h5 className="mb-2 font-semibold text-gray-800">Selected Location</h5>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-full text-sm">
                  <MapPin size={14} />
                  State: <strong>{selectedStateObj?.name || '-'}</strong>
                </span>
                <span className="inline-flex items-center gap-2 bg-blue-500 text-white px-3 py-1.5 rounded-full text-sm">
                  <Layers size={14} />
                  Cluster: <strong>{selectedClusterObj?.name || '-'}</strong>
                </span>
                <span className="inline-flex items-center gap-2 bg-green-600 text-white px-3 py-1.5 rounded-full text-sm">
                  <Tag size={14} />
                  District: <strong>{selectedDistrictObj?.name || '-'}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Wrapper */}
      {showForm && (
        <div className="my-4 space-y-4">
          {/* Project Type Filters */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h5 className="mb-0 font-semibold text-gray-800">Project Type Filters</h5>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                  >
                    <option>All Categories</option>
                    <option>Solar Rooftop</option>
                    <option>Solar Pump</option>
                    <option>Solar Light</option>
                    <option>Solar Power Plant</option>
                  </select>
                </div>
                {/* Add other filters as needed */}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-[#4db2eb] text-white">
                    <th className="px-4 py-3 text-center font-semibold border-r border-white/20">Combo Kit</th>
                    <th className="px-4 py-3 text-center font-semibold border-r border-white/20">Brand</th>
                    <th className="px-4 py-3 text-center font-semibold border-r border-white/20">Product Type</th>
                    <th className="px-4 py-3 text-center font-semibold border-r border-white/20">Category</th>
                    <th className="px-4 py-3 text-center font-semibold border-r border-white/20">Sub Category</th>
                    <th className="px-4 py-3 text-center font-semibold border-r border-white/20">Project Type</th>
                    <th className="px-4 py-3 text-center font-semibold border-r border-white/20">Sub Project Type</th>
                    <th className="px-4 py-3 text-center font-semibold border-r border-white/20">AMC Price</th>
                    <th className="px-4 py-3 text-center font-semibold border-r border-white/20">Latest Buying Price</th>
                    <th className="px-4 py-3 text-center font-semibold border-r border-white/20">Company Margin (per KW)</th>
                    <th className="px-4 py-3 text-center font-semibold border-r border-white/20">GST (%)</th>
                    <th className="px-4 py-3 text-center font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr><td colSpan="12" className="text-center py-4">Loading AMC prices...</td></tr>
                  ) : tableData.length === 0 ? (
                    <tr><td colSpan="12" className="text-center py-4">No data found. Add new AMC price.</td></tr>
                  ) : (
                    tableData.map((row) => (
                      <tr key={row.id} style={{ backgroundColor: row.backgroundColor }}>
                        <td className="px-4 py-3 text-center">{row.comboKit}</td>
                        <td className="px-4 py-3 text-center min-w-[150px]">{row.brand}</td>
                        <td className="px-4 py-3 text-center">{row.productType}</td>
                        <td className="px-4 py-3 text-center">{row.category}</td>
                        <td className="px-4 py-3 text-center">{row.subCategory}</td>
                        <td className="px-4 py-3 text-center min-w-[150px]">{row.projectType}</td>
                        <td className="px-4 py-3 text-center">{row.subProjectType}</td>
                        <td className="px-4 py-3 text-center min-w-[120px]">
                          <input
                            type="number"
                            className={`w-full px-2 py-1 border rounded text-center ${row.isEditing ? 'border-blue-500' : 'border-gray-300'} ${row.backgroundColor.includes('247, 186, 186') ? 'bg-red-50' : ''}`}
                            value={row.amcPrice}
                            onChange={(e) => handleTableInputChange(row.id, 'amcPrice', parseInt(e.target.value) || 0)}
                            disabled={!row.isEditing}
                          />
                        </td>
                        <td className="px-4 py-3 text-center min-w-[120px]">
                          <input
                            type="number"
                            className={`w-full px-2 py-1 border rounded text-center ${row.isEditing ? 'border-blue-500' : 'border-gray-300'} ${row.backgroundColor.includes('247, 186, 186') ? 'bg-red-50' : ''}`}
                            value={row.latestBuyingPrice}
                            onChange={(e) => handleTableInputChange(row.id, 'latestBuyingPrice', parseInt(e.target.value) || 0)}
                            disabled={!row.isEditing}
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-sm"
                            onClick={() => setShowMarginModal(true)}
                          >
                            Set Margin
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center min-w-[120px]">
                          <input
                            type="number"
                            className={`w-full px-2 py-1 border rounded text-center ${row.isEditing ? 'border-blue-500' : 'border-gray-300'} ${row.backgroundColor.includes('247, 186, 186') ? 'bg-red-50' : ''}`}
                            value={row.gst}
                            onChange={(e) => handleTableInputChange(row.id, 'gst', parseInt(e.target.value) || 0)}
                            disabled={!row.isEditing}
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              className={`px-3 py-1 rounded text-sm ${row.isEditing ? 'bg-blue-500 hover:bg-blue-600' : 'bg-green-500 hover:bg-green-600'} text-white`}
                              onClick={() => toggleRowEdit(row.id)}
                            >
                              {row.isEditing ? <Save size={16} /> : <Edit size={16} />}
                            </button>
                            <button
                              className="px-3 py-1 rounded text-sm bg-red-500 hover:bg-red-600 text-white"
                              onClick={() => handleDeletePrice(row.id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="13" className="px-4 py-3 text-right space-x-2">
                      <button
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
                        onClick={handleResetFilters}
                      >
                        <RefreshCw size={16} />
                        Reset Filters
                      </button>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Summary Card */}
          {showSummary && (
            <div className="bg-white rounded-lg shadow-sm mt-4">
              <div className="p-4 border-b border-gray-200 bg-blue-600 text-white">
                <h5 className="mb-0 font-semibold">Pricing Summary</h5>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-gray-500 text-sm mb-1">Highest Margin</div>
                    <div className="text-green-600 text-xl font-semibold">{summaryData.highestMargin}%</div>
                    <div className="text-gray-500 text-xs">{summaryData.highestMarginProduct}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-gray-500 text-sm mb-1">Optimally Priced</div>
                    <div className="text-green-600 text-xl font-semibold">{summaryData.optimalCount}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-gray-500 text-sm mb-1">Price Alerts</div>
                    <div className="text-red-600 text-xl font-semibold">{summaryData.priceAlerts}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add AMC Price Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-100">
              <h3 className="text-lg font-bold text-gray-800">Add New AMC Price</h3>
              <button onClick={() => setShowAddModal(false)}><X size={20} /></button>
            </div>
            <div className="p-6">
              <form onSubmit={handleAddNewSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Product Type</label>
                  <select className="w-full border rounded p-2" value={newPriceForm.productType} onChange={e => setNewPriceForm({ ...newPriceForm, productType: e.target.value })}>
                    <option>Solar Panel</option>
                    <option>Inverter</option>
                    <option>Battery</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Brand</label>
                  <input className="w-full border rounded p-2" value={newPriceForm.brand} onChange={e => setNewPriceForm({ ...newPriceForm, brand: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    className="w-full border rounded p-2"
                    value={newPriceForm.category}
                    onChange={e => {
                      const cat = e.target.value;
                      const related = tableData.find(t => t.category === cat);
                      setNewPriceForm({
                        ...newPriceForm,
                        category: cat,
                        subCategory: related?.subCategory || '',
                        projectType: related?.projectType || '',
                        subProjectType: related?.subProjectType || '',
                        quoteSettingsId: related?.quoteSettingsId || ''
                      });
                    }}
                  >
                    <option value="">Select Category</option>
                    {[...new Set(tableData.map(t => t.category))].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sub Category</label>
                  <input className="w-full border rounded p-2 bg-gray-50" value={newPriceForm.subCategory} readOnly />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Project Type</label>
                  <select
                    className="w-full border rounded p-2"
                    value={newPriceForm.projectType}
                    onChange={e => {
                      const pt = e.target.value;
                      const related = tableData.find(t => t.category === newPriceForm.category && t.projectType === pt);
                      setNewPriceForm({
                        ...newPriceForm,
                        projectType: pt,
                        subProjectType: related?.subProjectType || '',
                        quoteSettingsId: related?.quoteSettingsId || ''
                      });
                    }}
                  >
                    <option value="">Select Project Type</option>
                    {tableData.filter(t => t.category === newPriceForm.category).map(t => (
                      <option key={t.projectType} value={t.projectType}>{t.projectType}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sub Project Type</label>
                  <input className="w-full border rounded p-2 bg-gray-50" value={newPriceForm.subProjectType} readOnly />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">AMC Price</label>
                  <input type="number" className="w-full border rounded p-2" value={newPriceForm.amcPrice} onChange={e => setNewPriceForm({ ...newPriceForm, amcPrice: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Latest Buying Price</label>
                  <input type="number" className="w-full border rounded p-2" value={newPriceForm.latestBuyingPrice} onChange={e => setNewPriceForm({ ...newPriceForm, latestBuyingPrice: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">GST (%)</label>
                  <input type="number" className="w-full border rounded p-2" value={newPriceForm.gst} onChange={e => setNewPriceForm({ ...newPriceForm, gst: Number(e.target.value) })} />
                </div>
                <div className="md:col-span-2 pt-4 flex justify-end gap-2">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Save Price</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}