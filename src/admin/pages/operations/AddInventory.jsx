// Location data
import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import Chart from 'chart.js/auto';
import { useLocations } from '../../../hooks/useLocations';
import inventoryApi from '../../../services/inventory/inventoryApi';
import { productAPI } from '../../../api/api';
import { getProjectTypes, getCategories, getSKUs } from '../../../services/masterApi';

export default function AddInventory() {
  // Location hook
  const {
    states,
    clusters,
    districts,
    // cities, // Not used in this UI?
    selectedState,
    setSelectedState,
    selectedCluster,
    setSelectedCluster,
    selectedDistrict,
    setSelectedDistrict,
    // selectedCity,
    // setSelectedCity,
  } = useLocations();

  const [locationCardsVisible, setLocationCardsVisible] = useState(true);

  // Dynamic Data State
  const [warehousesList, setWarehousesList] = useState([]);
  const [brandsList, setBrandsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [skuList, setSkuList] = useState([]);
  const [projectTypesList, setProjectTypesList] = useState([]);

  // Derived Options
  const [techOptions, setTechOptions] = useState([]);
  const [skuOptions, setSkuOptions] = useState([]);
  const [wattOptions, setWattOptions] = useState([]);
  const [filteredSkus, setFilteredSkus] = useState([]);

  // Form state
  // ... existing form state ...
  const [form, setForm] = useState({
    warehouse: '',
    categoryType: '',
    subCategoryType: '',
    projectType: '',
    subProjectType: '',
    productType: '',
    brand: '',
    technology: '',
    watt: '',
    sku: '',
    panels: '',
    kw: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Data state
  const [recentAdditions, setRecentAdditions] = useState([]);
  const [chartData, setChartData] = useState({});
  const [productFilters, setProductFilters] = useState({});
  const [productTypeFilters, setProductTypeFilters] = useState({
    solarpanel: true,
    invertor: true,
    battery: true,
    boskit: true
  });

  const productTypes = [
    { value: 'solarpanel', label: 'Solar Panels' },
    { value: 'invertor', label: 'Inverters' },
    { value: 'battery', label: 'Batteries' },
    { value: 'boskit', label: 'BOS Kits' }
  ];
  const [filterAllProducts, setFilterAllProducts] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);
  const [chartVisible, setChartVisible] = useState(false);

  // Refs
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // Fetch Initial Data
  useEffect(() => {
    fetchDynamicData();
  }, []);

  const fetchDynamicData = async () => {
    try {
      const results = await Promise.allSettled([
        inventoryApi.getAllWarehouses(),
        inventoryApi.getBrands(),
        getCategories(),
        getProjectTypes(),
        getSKUs()
      ]);

      setWarehousesList(results[0].status === 'fulfilled' ? (results[0].value.data?.data || []) : []);
      setBrandsList(results[1].status === 'fulfilled' ? (results[1].value.data || []) : []);
      setCategoriesList(results[2].status === 'fulfilled' ? (results[2].value || []) : []);
      setProjectTypesList(results[3].status === 'fulfilled' ? (results[3].value || []) : []);
      setSkuList(results[4].status === 'fulfilled' ? (results[4].value || []) : []);

    } catch (error) {
      console.error("Error fetching dynamic data", error);
    }
  };

  const fetchRecentInventory = async () => {
    try {
      const res = await inventoryApi.getItems({ page: 1, limit: 5, sort: '-createdAt' });
      // Transform data to match table structure if needed or directly use
      // The table expects: date, productType, sku, projectType, brand, technology, watt, panels, kw
      // Backend returns items with populated fields.
      if (res.data?.items) {
        setRecentAdditions(res.data.items.map(item => ({
          id: item._id,
          date: new Date(item.createdAt).toLocaleDateString('en-GB'), // Or item.date which might be just string
          productType: item.productType || item.category,
          sku: item.sku,
          projectType: item.projectType,
          brand: item.brand?.brandName || 'N/A',
          technology: item.technology,
          watt: item.wattage,
          panels: item.quantity,
          kw: ((item.quantity * (item.wattage || 0)) / 1000).toFixed(2)
        })));
      }
    } catch (error) {
      console.error("Error fetching recent inventory", error);
    }
  };

  useEffect(() => {
    fetchRecentInventory();
  }, []);

  useEffect(() => {
    console.log("AddInventory Data State:", {
      warehouses: warehousesList.length,
      brands: brandsList.length,
      categories: categoriesList.length,
      projectTypes: projectTypesList.length,
      skus: skuList.length,
      skuListPreview: skuList.slice(0, 3)
    });
  }, [warehousesList, brandsList, categoriesList, projectTypesList, skuList]);

  // Update derived options when filters change
  useEffect(() => {
    let activeSkus = skuList;

    // Filter logic if needed, e.g. by Brand
    if (form.brand) {
      activeSkus = activeSkus.filter(s => (s.brand?._id || String(s.brand)) === String(form.brand));
    }

    // Extract unique Techs
    const techs = [...new Set(activeSkus.map(s => s.technology).filter(Boolean))];
    // Filter activeSkus based on selections to narrow down subsequent placeholders
    if (form.categoryType) {
      // Assuming categoryType maps to ProjectType Name or similar
      const pt = projectTypesList.find(p => p._id === form.categoryType)?.name;
      if (pt) activeSkus = activeSkus.filter(s => s.projectType === pt || s.categoryType === pt);
    }
    if (form.productType) {
      // activeSkus = activeSkus.filter(s => s.category === form.productType); 
    }
    // Note: complex filtering logic omitted for brevity, relying on SKU list to drive options

    // Extract unique values from SKUs for dropdowns
    const uniqueSubCats = [...new Set(skuList.map(s => s.subCategory).filter(Boolean))];
    const uniqueProjTypes = [...new Set(skuList.map(s => s.projectType).filter(Boolean))];
    const uniqueSubProjTypes = [...new Set(skuList.map(s => s.subProjectType).filter(Boolean))];
    const uniqueTechs = [...new Set(skuList.map(s => s.technology).filter(Boolean))];
    const uniqueWatts = [...new Set(skuList.map(s => s.wattage).filter(Boolean))];

    // Filter SKUs based on form state for the SKU dropdown
    let filtered = activeSkus;
    if (form.brand) filtered = filtered.filter(s => (s.brand?._id || String(s.brand)) === String(form.brand));
    if (form.technology) filtered = filtered.filter(s => s.technology === form.technology);
    if (form.watt) filtered = filtered.filter(s => s.wattage == form.watt);
    if (form.productType) filtered = filtered.filter(s => s.productType === form.productType);

    console.log("Derived Options Logic:", {
      activeSkusCount: activeSkus.length,
      uniqueTechs,
      uniqueWatts,
      filteredSkusCount: filtered.length
    });

    setSkuOptions(filtered.map(s => ({ value: s.skuCode || s.name, label: s.name || s.skuCode, original: s })));
    setTechOptions(uniqueTechs.map(t => ({ value: t, label: t })));
    setWattOptions(uniqueWatts.map(w => ({ value: w, label: `${w}W` })));

  }, [skuList, form, projectTypesList]);


  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => {
      const updated = { ...prev, [name]: value };

      // Auto-fill fields when SKU is selected
      if (name === 'sku') {
        const selectedSku = skuList.find(s => s.skuCode === value || s.name === value);
        if (selectedSku) {
          updated.brand = selectedSku.brand?._id || selectedSku.brand || '';
          updated.productType = selectedSku.productType || selectedSku.category || '';
          updated.technology = selectedSku.technology || '';
          updated.watt = selectedSku.wattage || '';
          updated.projectType = selectedSku.projectType || '';
          updated.subProjectType = selectedSku.subProjectType || '';
          updated.subCategoryType = selectedSku.subCategory || '';

          // Try to match Category Type (Project Type ID)
          const matchedProjectType = projectTypesList.find(pt => pt.name === selectedSku.projectType);
          if (matchedProjectType) {
            updated.categoryType = matchedProjectType._id;
          }
        }
      }

      // Calculate KW when panels or wattage changes
      if (name === 'panels' || (name === 'watt' && value) || (name === 'sku' && updated.watt)) {
        const panels = parseFloat(updated.panels) || 0;
        const watt = parseFloat(updated.watt) || 0;
        updated.kw = ((panels * watt) / 1000).toFixed(2);
      }

      if (name === 'warehouse') {
        const warehouse = warehousesList.find(w => w._id === value);
        if (warehouse) {
          setSelectedState(warehouse.state?._id || warehouse.state);
          setTimeout(() => setSelectedCluster(warehouse.cluster?._id || warehouse.cluster), 100);
          setTimeout(() => setSelectedDistrict(warehouse.district?._id || warehouse.district), 200);
        }
      }
      return updated;
    });
  };

  // Reset location selection
  const handleResetLocation = () => {
    setSelectedState('');
    setSelectedCluster('');
    setSelectedDistrict('');
  };


  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!form.sku || !form.warehouse || !form.panels || !form.date) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    if (!selectedState || !selectedCluster || !selectedDistrict) {
      showToast('Please select a valid location (State, Cluster, District)', 'error');
      return;
    }

    const panels = parseFloat(form.panels);
    const kw = parseFloat(form.kw);

    if (isNaN(panels) || panels <= 0 || isNaN(kw) || kw <= 0) {
      showToast('Please enter valid number of panels', 'error');
      return;
    }

    // Prepare Payload
    // Find IDs/Names from lists
    const brandObj = brandsList.find(b => b._id === form.brand);
    const skuObj = skuList.find(s => s.skuCode === form.sku || s.name === form.sku);

    const payload = {
      warehouse: form.warehouse, // ID
      state: selectedState,
      cluster: selectedCluster,
      district: selectedDistrict,
      // Using form values which are now derived/selected correctly
      itemName: skuObj?.description || form.sku, // Required by backend
      category: form.productType || skuObj?.category || skuObj?.productType, // Using Product Type as Category
      subCategory: form.subCategoryType || skuObj?.subCategory,
      projectType: form.projectType || skuObj?.projectType,
      subProjectType: form.subProjectType || skuObj?.subProjectType,
      brand: form.brand || skuObj?.brand?._id || skuObj?.brand, // ID
      technology: form.technology || skuObj?.technology,
      wattage: form.watt || skuObj?.wattage,
      productType: form.productType || skuObj?.productType || skuObj?.category,
      sku: form.sku,
      quantity: panels,
      price: 0, // Price logic?
      date: form.date,
      // Any other fields required by createInventoryItem
    };

    try {
      await inventoryApi.createItem(payload);

      await inventoryApi.createItem(payload);

      // Refresh recent additions list
      fetchRecentInventory();

      // Logic to update charts... (omitted for brevity, keep existing logic if needed or fetch updated stats)
      // Ideally should fetch updated stats, but for UI responsiveness we can update local state

      showToast('Inventory added successfully', 'success');

      // Reset
      setForm(prev => ({
        ...prev,
        sku: '',
        panels: '',
        kw: ''
      }));
    } catch (err) {
      console.error(err);
      showToast('Failed to add inventory', 'error');
    }
  };

  // Update chart
  useEffect(() => {
    if (!chartRef.current || Object.keys(chartData).length === 0) return;

    // Filter data based on product type filters
    const visibleProductTypes = Object.entries(productTypeFilters)
      .filter(([type, visible]) => visible)
      .map(([type]) => type);

    const filteredData = Object.values(chartData).filter(item =>
      item.visible && visibleProductTypes.includes(item.productType) && productFilters[`${item.productType}|${item.brand}|${item.technology}|${item.watt}`] !== false
    );

    // Group by brand
    const brandsList = [...new Set(filteredData.map(item => item.brand))];

    // Prepare datasets by product type
    const productGroups = {};
    filteredData.forEach(data => {
      if (!productGroups[data.productType]) {
        productGroups[data.productType] = {
          label: data.productTypeText,
          productType: data.productType,
          technology: data.technology,
          watt: data.watt,
          data: new Array(brandsList.length).fill(0),
          backgroundColor: data.color,
          borderColor: data.color.replace('0.7', '1'),
          borderWidth: 1
        };
      }
      const brandIndex = brandsList.indexOf(data.brand);
      productGroups[data.productType].data[brandIndex] += data.value;
    });

    // Destroy previous chart instance
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Create new chart
    const ctx = chartRef.current.getContext('2d');
    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: brandsList,
        datasets: Object.values(productGroups)
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        barThickness: 20,
        maxBarThickness: 30,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              title: function (context) {
                return context[0].label;
              },
              beforeBody: function (context) {
                const datasetIndex = context[0].datasetIndex;
                const dataset = chartInstance.current.data.datasets[datasetIndex];
                return [
                  `Product: ${dataset.label}`,
                  `Technology: ${dataset.technology}`,
                  `Watt: ${dataset.watt}`
                ];
              },
              label: function (context) {
                return `Quantity: ${context.raw} Kw`;
              }
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Kilowatt (Kw)'
            },
            grid: {
              display: false
            }
          },
          y: {
            grid: {
              display: false
            },
            stacked: true
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [chartData, productTypeFilters, productFilters]);

  // Show toast message
  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Handle filter all toggle
  const handleFilterAllToggle = () => {
    const newValue = !filterAllProducts;
    setFilterAllProducts(newValue);

    // Update all product type filters
    const newProductTypeFilters = {};
    Object.keys(productTypeFilters).forEach(key => {
      newProductTypeFilters[key] = newValue;
    });
    setProductTypeFilters(newProductTypeFilters);

    // Update all individual product filters
    const newProductFilters = {};
    Object.keys(productFilters).forEach(key => {
      newProductFilters[key] = newValue;
    });
    setProductFilters(newProductFilters);
  };

  // Handle product type filter toggle
  const handleProductTypeFilterToggle = (type) => {
    const newProductTypeFilters = {
      ...productTypeFilters,
      [type]: !productTypeFilters[type]
    };
    setProductTypeFilters(newProductTypeFilters);

    // Update individual product filters for this type
    const newProductFilters = { ...productFilters };
    Object.keys(chartData).forEach(key => {
      if (key.startsWith(`${type}|`)) {
        newProductFilters[key] = newProductTypeFilters[type];
      }
    });
    setProductFilters(newProductFilters);

    // Update "All Products" checkbox if needed
    const allChecked = Object.values(newProductTypeFilters).every(v => v);
    setFilterAllProducts(allChecked);
  };

  // Handle individual product filter toggle
  const handleProductFilterToggle = (key) => {
    const newProductFilters = {
      ...productFilters,
      [key]: !productFilters[key]
    };
    setProductFilters(newProductFilters);

    // Update chart data visibility
    setChartData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        visible: newProductFilters[key]
      }
    }));

    // Update product type filter checkbox
    const productType = key.split('|')[0];
    const productTypeKeys = Object.keys(chartData).filter(k => k.startsWith(`${productType}|`));
    const allOfTypeChecked = productTypeKeys.every(k => newProductFilters[k] !== false);
    const anyOfTypeChecked = productTypeKeys.some(k => newProductFilters[k] !== false);

    setProductTypeFilters(prev => ({
      ...prev,
      [productType]: anyOfTypeChecked
    }));

    // Update "All Products" checkbox
    const allChecked = Object.keys(newProductFilters).every(k => newProductFilters[k] !== false);
    setFilterAllProducts(allChecked);
  };

  // Add product filter checkbox
  const addProductFilterCheckbox = (key, productType, brand, tech, watt) => {
    const checkboxId = `filter-${key.replace(/\s+/g, '-').toLowerCase()}`;

    return (
      <div className="form-check form-check-inline" key={key}>
        <input
          className="form-check-input product-filter"
          type="checkbox"
          id={checkboxId}
          checked={productFilters[key] !== false}
          onChange={() => handleProductFilterToggle(key)}
          data-key={key}
          data-product-type={productType}
        />
        <label className="form-check-label" htmlFor={checkboxId}>
          {productType} - {brand} ({tech}, {watt})
        </label>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 mt-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`toast show fixed bottom-5 right-5 m-3 z-50 flex items-center text-white ${toastMessage.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          } rounded-lg shadow-lg`}>
          <div className="flex p-3">
            <div className="toast-body">
              {toastMessage.message}
            </div>
            <button
              type="button"
              className="btn-close btn-close-white ml-2 self-center"
              onClick={() => setToastMessage(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-4">
        <nav className="bg-white p-3 rounded-lg shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="mb-0 text-xl font-semibold">Add New Inventory Request</h3>
            </div>
            <button
              className="btn btn-outline-primary flex items-center border border-blue-500 text-blue-500 hover:bg-blue-50 px-4 py-2 rounded transition-colors"
              onClick={() => setLocationCardsVisible(!locationCardsVisible)}
            >
              {locationCardsVisible ? (
                <>
                  <EyeOff className="w-4 h-4 mr-2" />
                  Hide Location Cards
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Show Location Cards
                </>
              )}
            </button>
          </div>
        </nav>
      </div>

      {/* Location Selection Section */}
      <div className={`location-section transition-all duration-500 overflow-hidden ${locationCardsVisible ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 m-0 p-0'
        }`}>
        {/* State Selection */}
        <div className="mb-4">
          <h4 className="mb-3 text-lg font-medium">Select State</h4>
          <div className="row grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 my-4">
            {states.map((state) => (
              <div className="col mb-3" key={state._id}>
                <div
                  className={`card h-full shadow text-center cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg border rounded-lg ${selectedState === state._id
                    ? 'border-2 border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                    }`}
                  onClick={() => setSelectedState(state._id)}
                >
                  <div className="card-body p-4">
                    <h5 className="card-title font-bold text-lg">{state.name}</h5>
                    <p className="text-gray-600 mb-0">{state.code}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cluster Selection */}
        {selectedState && (
          <div className={`cluster-section transition-all duration-500 overflow-hidden`}>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-lg font-medium">Select Cluster</h4>
              <button
                onClick={handleResetLocation}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Reset Selection
              </button>
            </div>
            <div className="row grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 my-4">
              {clusters.map((cluster) => (
                <div className="col mb-3" key={cluster._id}>
                  <div
                    className={`card h-full shadow text-center cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg border rounded-lg ${selectedCluster === cluster._id
                      ? 'border-2 border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                      }`}
                    onClick={() => setSelectedCluster(cluster._id)}
                  >
                    <div className="card-body p-4">
                      <h6 className="card-title font-bold">{cluster.name}</h6>
                      {/* <p className="text-gray-600 mb-0">{currentState}</p> */}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* District Selection */}
        {selectedCluster && (
          <div className={`district-section transition-all duration-500 overflow-hidden`}>
            <h4 className="mb-3 text-lg font-medium">Select District</h4>
            <div className="row grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 my-4">
              {districts.map((district) => (
                <div className="col mb-3" key={district._id}>
                  <div
                    className={`card h-full shadow text-center cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg border rounded-lg ${selectedDistrict === district._id
                      ? 'border-2 border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                      }`}
                    onClick={() => setSelectedDistrict(district._id)}
                  >
                    <div className="card-body p-4">
                      <h6 className="card-title font-bold">{district.name}</h6>
                      {/* <p className="text-gray-600 mb-0">{currentCluster}</p> */}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="row">
        <div className="col-md-3 w-full md:w-1/4">
          <label htmlFor="warehouse-select" className="form-label block mb-2">Select Warehouse</label>
          <select
            className="form-control border border-gray-300 rounded-lg px-3 py-2 w-full"
            id="warehouse-select"
            name="warehouse"
            value={form.warehouse}
            onChange={handleChange}
          >
            <option value="">-- Select Warehouse --</option>
            {warehousesList.map((warehouse) => (
              <option key={warehouse._id} value={warehouse._id}>
                {warehouse.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="row mt-5 flex flex-col lg:flex-row gap-6">
        {/* Map Section */}
        <div className="lg:w-5/12">
          <div className="card p-3 shadow-sm h-full border rounded-lg">
            <h5 className="mb-3 text-lg font-medium">Location Map</h5>
            <div className="w-full rounded-lg overflow-hidden" style={{ height: '550px' }}>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3777314.4013896515!2d68.68610173519345!3d22.399514157136505!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3959051f5f0ef795%3A0x861bd887ed54522e!2sGujarat!5e0!3m2!1sen!2sin!4v1746007377622!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Location Map"
              />
            </div>
          </div>
        </div>

        {/* Add Inventory Section */}
        <div className="lg:w-7/12">
          <div className="card mb-4 border rounded-lg">
            <div className="card-header bg-blue-600 text-white p-3 rounded-t-lg">
              <h5 className="mb-0 text-white font-medium">Add New Inventory</h5>
            </div>
            <div className="card-body p-4">
              <form id="add-inventory-form" onSubmit={handleSubmit}>
                <div className="row grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="mb-3">
                    <label htmlFor="category-type" className="form-label block mb-2">Category Type</label>
                    <select
                      className="form-control border border-gray-300 rounded-lg px-3 py-2 w-full"
                      id="category-type"
                      name="categoryType"
                      value={form.categoryType}
                      onChange={handleChange}
                    >
                      <option value="">-- Select Category Type --</option>
                      {projectTypesList.map((pt) => (
                        <option key={pt._id} value={pt._id}>
                          {pt.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="sub-category-type" className="form-label block mb-2">Sub Category Type</label>
                    <select
                      className="form-control border border-gray-300 rounded-lg px-3 py-2 w-full"
                      id="sub-category-type"
                      name="subCategoryType"
                      value={form.subCategoryType}
                      onChange={handleChange}
                    >
                      <option value="">-- Select Sub Category Type --</option>
                      {[...new Set(skuList.map(s => s.subCategory).filter(Boolean))].map((sc) => (
                        <option key={sc} value={sc}>{sc}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="project-type" className="form-label block mb-2">Project Type</label>
                    <select
                      className="form-control border border-gray-300 rounded-lg px-3 py-2 w-full"
                      id="project-type"
                      name="projectType"
                      value={form.projectType}
                      onChange={handleChange}
                      required
                    >
                      <option value="">-- Select Project Type --</option>
                      {[...new Set(skuList.map(s => s.projectType).filter(Boolean))].map((pt) => (
                        <option key={pt} value={pt}>{pt}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="sub-project-type" className="form-label block mb-2">Sub Project Type</label>
                    <select
                      className="form-control border border-gray-300 rounded-lg px-3 py-2 w-full"
                      id="sub-project-type"
                      name="subProjectType"
                      value={form.subProjectType}
                      onChange={handleChange}
                    >
                      <option value="">-- Select Sub Project Type --</option>
                      {[...new Set(skuList.map(s => s.subProjectType).filter(Boolean))].map((spt) => (
                        <option key={spt} value={spt}>{spt}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3 md:col-span-3">
                    <label htmlFor="product-type" className="form-label block mb-2">Product Type</label>
                    <select
                      className="form-control border border-gray-300 rounded-lg px-3 py-2 w-full"
                      id="product-type"
                      name="productType"
                      value={form.productType}
                      onChange={handleChange}
                    >
                      <option value="">-- Select Product Type --</option>
                      {categoriesList.map((cat) => (
                        <option key={cat._id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="brand-filter" className="form-label block mb-2">Brand</label>
                    <select
                      className="form-control border border-gray-300 rounded-lg px-3 py-2 w-full"
                      id="brand-filter"
                      name="brand"
                      value={form.brand}
                      onChange={handleChange}
                    >
                      <option value="">-- Select Brand --</option>
                      {brandsList.map((brand) => (
                        <option key={brand._id} value={brand._id}>
                          {brand.brandName || brand.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="tech-filter" className="form-label block mb-2">Technology</label>
                    <select
                      className="form-control border border-gray-300 rounded-lg px-3 py-2 w-full"
                      id="tech-filter"
                      name="technology"
                      value={form.technology}
                      onChange={handleChange}
                    >
                      <option value="">-- Select Technology --</option>
                      {techOptions.map((tech) => (
                        <option key={tech.value} value={tech.value}>
                          {tech.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="watt-filter" className="form-label block mb-2">Watt</label>
                    <select
                      className="form-control border border-gray-300 rounded-lg px-3 py-2 w-full"
                      id="watt-filter"
                      name="watt"
                      value={form.watt}
                      onChange={handleChange}
                    >
                      <option value="">-- Select Watt --</option>
                      {wattOptions.map((watt) => (
                        <option key={watt.value} value={watt.value}>
                          {watt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3 md:col-span-3">
                    <label htmlFor="sku-select" className="form-label block mb-2">SKU</label>
                    <select
                      className="form-control border border-gray-300 rounded-lg px-3 py-2 w-full"
                      id="sku-select"
                      name="sku"
                      value={form.sku}
                      onChange={handleChange}
                      required
                    >
                      <option value="">-- Select SKU --</option>
                      {skuOptions.map((sku) => (
                        <option key={sku.value} value={sku.value}>
                          {sku.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="panel" className="form-label block mb-2">No of Panels</label>
                    <input
                      type="number"
                      className="form-control border border-gray-300 rounded-lg px-3 py-2 w-full"
                      id="panel"
                      name="panels"
                      value={form.panels}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="kw" className="form-label block mb-2">KW</label>
                    <input
                      type="text"
                      className="form-control border border-gray-300 rounded-lg px-3 py-2 w-full bg-gray-50"
                      id="kw"
                      name="kw"
                      value={form.kw}
                      readOnly
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="date" className="form-label block mb-2">Date</label>
                    <input
                      type="date"
                      className="form-control border border-gray-300 rounded-lg px-3 py-2 w-full"
                      id="date"
                      name="date"
                      value={form.date}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary mt-3 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Add Inventory
                </button>
              </form>
            </div>
          </div>

          {/* Recent Additions Table */}
          <div className="card border rounded-lg">
            <div className="card-header bg-blue-500 text-white p-3 rounded-t-lg">
              <h5 className="mb-0 text-white font-medium">Recent Inventory Additions</h5>
            </div>
            <div className="card-body p-4">
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto border-collapse">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 px-4 py-2 text-left">Date</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Product Type</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">SKU Number</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Project Type</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Brand</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Technology</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Watt</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">No of Panels</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">KW</th>
                    </tr>
                  </thead>
                  <tbody id="recent-additions">
                    {recentAdditions.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="border border-gray-300 px-4 py-4 text-center text-gray-500">
                          No recent inventory additions
                        </td>
                      </tr>
                    ) : (
                      recentAdditions.map((item) => (
                        <tr key={item.id}>
                          <td className="border border-gray-300 px-4 py-2">{item.date}</td>
                          <td className="border border-gray-300 px-4 py-2">{item.productType}</td>
                          <td className="border border-gray-300 px-4 py-2">{item.sku}</td>
                          <td className="border border-gray-300 px-4 py-2">{item.projectType}</td>
                          <td className="border border-gray-300 px-4 py-2">{item.brand}</td>
                          <td className="border border-gray-300 px-4 py-2">{item.technology}</td>
                          <td className="border border-gray-300 px-4 py-2">{item.watt}</td>
                          <td className="border border-gray-300 px-4 py-2">{item.panels}</td>
                          <td className="border border-gray-300 px-4 py-2">{item.kw}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Filter Checkboxes */}
      <div className="card mt-4 border rounded-lg">
        <div className="card-header bg-blue-500 text-white p-3 rounded-t-lg">
          <h6 className="mb-0 font-medium">Filter Products for Graph</h6>
        </div>
        <div className="card-body p-4">
          <div className="row">
            <div className="col-md-12 mb-3">
              <div className="form-check form-check-inline mr-4">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="filter-all-products"
                  checked={filterAllProducts}
                  onChange={handleFilterAllToggle}
                />
                <label className="form-check-label ml-2" htmlFor="filter-all-products">
                  All Products
                </label>
              </div>
              {Object.entries(productTypeFilters).map(([type, checked]) => (
                <div className="form-check form-check-inline mr-4" key={type}>
                  <input
                    className="form-check-input product-type-filter"
                    type="checkbox"
                    id={`filter-${type}`}
                    value={type}
                    checked={checked}
                    onChange={() => handleProductTypeFilterToggle(type)}
                  />
                  <label className="form-check-label ml-2" htmlFor={`filter-${type}`}>
                    {productTypes.find(p => p.value === type)?.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
          <div className="row" id="product-filters">
            {Object.entries(chartData).map(([key, data]) => (
              addProductFilterCheckbox(key, data.productTypeText, data.brand, data.technology, data.watt)
            ))}
          </div>
        </div>
      </div>

      {/* Chart Section */}
      {chartVisible && (
        <div className="card mt-4 border rounded-lg">
          <div className="card-header bg-blue-500 text-white p-3 rounded-t-lg flex justify-between items-center">
            <h6 className="mb-0 font-medium">Inventory Overview (Kw)</h6>
            <div className="chart-legend flex">
              <span className="mr-3">
                <i className="fas fa-square text-blue-500 mr-1"></i> Solar Panels
              </span>
              <span className="mr-3">
                <i className="fas fa-square text-green-500 mr-1"></i> Invertors
              </span>
              <span className="mr-3">
                <i className="fas fa-square text-yellow-500 mr-1"></i> Batteries
              </span>
              <span>
                <i className="fas fa-square text-red-500 mr-1"></i> BosKits
              </span>
            </div>
          </div>
          <div className="card-body p-4">
            <canvas id="inventoryChart" ref={chartRef} height="100"></canvas>
          </div>
        </div>
      )}
    </div>
  );
}