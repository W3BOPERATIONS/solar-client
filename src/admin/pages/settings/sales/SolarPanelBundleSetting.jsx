import React, { useState, useEffect } from 'react';
import {
  Save, Plus, Edit, Trash2, CheckCircle,
  Package, Layers, Calendar, Battery,
  Settings, Grid, Sun, Zap, RefreshCw
} from 'lucide-react';
import { useLocations } from '../../../../hooks/useLocations';
import salesSettingsService from '../../../../admin/services/salesSettingsService';

const SolarPanelBundleSetting = () => {
  // Location Hooks
  const { states, districts, clusters, fetchDistricts, fetchClusters } = useLocations();

  // State for location selection
  const [selectedState, setSelectedState] = useState('');
  const [selectedCluster, setSelectedCluster] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');

  // State for plan data
  const [plans, setPlans] = useState([]); // Fetched from DB
  const [loading, setLoading] = useState(false);

  // New Plan Draft Rows
  const [planRows, setPlanRows] = useState([{
    product: '',
    brand: '',
    sku: '',
    technology: '',
    wattage: '',
    kwOption: '',
    duration: '',
    startDate: '',
    discount: '',
    status: 'Inactive'
  }]);

  // Helper names for display
  const selectedStateName = states.find(s => s._id === selectedState)?.name;
  const selectedClusterName = clusters.find(c => c._id === selectedCluster)?.name;
  const selectedDistrictName = districts.find(d => d._id === selectedDistrict)?.name;

  // Static dropdown options (for now) - could be dynamic later
  const dropdownOptions = {
    products: ["Solar Panel", "Solar Inverter", "Battery", "Mounting Structure"],
    brands: {
      "Solar Panel": ["SunPower", "LG", "Panasonic", "Canadian Solar"],
      "Solar Inverter": ["SMA", "Fronius", "SolarEdge", "Huawei"],
      "Battery": ["Tesla Powerwall", "LG Chem", "Sonnen", "BYD"],
      "Mounting Structure": ["IronRidge", "Unirac", "EcoFasten", "Renusol"]
    },
    skus: {
      "Solar Panel": [
        { value: "SP-330-MP", display: "SP-330-MP (330W Mono PERC)", quantity: 25 },
        { value: "SP-400-LG", display: "SP-400-LG (400W LG)", quantity: 18 },
        { value: "SP-450-PN", display: "SP-450-PN (450W Panasonic)", quantity: 32 },
        { value: "SP-500-CS", display: "SP-500-CS (500W Canadian Solar)", quantity: 15 }
      ],
      "Solar Inverter": [
        { value: "SI-3KW-SMA", display: "SI-3KW-SMA (3KW SMA)", quantity: 12 },
        { value: "SI-5KW-FR", display: "SI-5KW-FR (5KW Fronius)", quantity: 8 },
        { value: "SI-10KW-SE", display: "SI-10KW-SE (10KW SolarEdge)", quantity: 6 },
        { value: "SI-15KW-HW", display: "SI-15KW-HW (15KW Huawei)", quantity: 4 }
      ],
      "Battery": [
        { value: "BT-5KW-TS", display: "BT-5KW-TS (5KW Tesla)", quantity: 10 },
        { value: "BT-10KW-LG", display: "BT-10KW-LG (10KW LG Chem)", quantity: 7 },
        { value: "BT-15KW-SN", display: "BT-15KW-SN (15KW Sonnen)", quantity: 5 },
        { value: "BT-20KW-BYD", display: "BT-20KW-BYD (20KW BYD)", quantity: 3 }
      ],
      "Mounting Structure": [
        { value: "MS-Roof-IR", display: "MS-Roof-IR (Roof IronRidge)", quantity: 45 },
        { value: "MS-Ground-UN", display: "MS-Ground-UN (Ground Unirac)", quantity: 28 },
        { value: "MS-Flat-EF", display: "MS-Flat-EF (Flat EcoFasten)", quantity: 35 },
        { value: "MS-Slope-RS", display: "MS-Slope-RS (Slope Renusol)", quantity: 22 }
      ]
    },
    technologies: ["Mono PERC", "Polycrystalline", "Thin Film", "Bifacial"],
    wattages: ["330W", "400W", "450W", "500W"]
  };

  useEffect(() => {
    if (selectedState) {
      fetchDistricts({ stateId: selectedState });
    }
  }, [selectedState]);

  useEffect(() => {
    if (selectedDistrict) {
      fetchClusters({ districtId: selectedDistrict });
      fetchBundlePlans(); // Fetch plans when district selected
    } else {
      setPlans([]);
    }
  }, [selectedDistrict]);

  const fetchBundlePlans = async () => {
    // In a real scenario, we might want to filter by location. 
    // Current API gets all, but we can filter client side or update API.
    // For now, I'll fetch all and filter client side if location matches.
    setLoading(true);
    try {
      const allBundles = await salesSettingsService.getBundles();
      // Filter by selected location
      const filtered = allBundles.filter(b =>
        (!b.state || b.state === selectedState) &&
        (!b.district || b.district === selectedDistrict) &&
        (!b.cluster || b.cluster === selectedCluster)
      );
      setPlans(filtered);
    } catch (error) {
      console.error("Error fetching bundles:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleStateSelect = (stateId) => {
    setSelectedState(stateId);
    setSelectedCluster(null);
    setSelectedDistrict(null);
  };

  const handleClusterSelect = (clusterId) => {
    setSelectedCluster(clusterId);
    // Note: In some hierarchies Cluster depends on District, in others District on Cluster.
    // The previous file had State -> Cluster -> District.
    // The `useLocations` hook usually follows State -> District -> Cluster.
    // I will stick to the hierarchy provided by `useLocations` which is standard. 
    // Wait, the previous file had State -> Cluster -> District. 
    // Let's check `useLocations`. Usually it is State -> District -> Cluster.
    // If the UI demands State -> Cluster -> District, I might need to adapt.
    // But `useLocations` has `fetchClusters({ districtId })`. So Cluster is below District.
    // So the flow should be State -> District -> Cluster.
    // I will re-arrange the UI to match `useLocations` flow: State -> District -> Cluster.
  };

  const handleDistrictSelect = (districtId) => {
    setSelectedDistrict(districtId);
    setSelectedCluster(null);
  };

  const addPlanRow = () => {
    setPlanRows([...planRows, {
      product: '',
      brand: '',
      sku: '',
      technology: '',
      wattage: '',
      kwOption: '',
      duration: '',
      startDate: '',
      discount: '',
      status: 'Inactive'
    }]);
  };

  const updatePlanRow = (index, field, value) => {
    const updatedRows = [...planRows];
    updatedRows[index] = { ...updatedRows[index], [field]: value };

    if (field === 'product') {
      updatedRows[index].brand = '';
      updatedRows[index].sku = '';
    }

    setPlanRows(updatedRows);
  };

  const togglePlanStatus = (index) => {
    const updatedRows = [...planRows];
    updatedRows[index].status = updatedRows[index].status === 'Active' ? 'Inactive' : 'Active';
    setPlanRows(updatedRows);
  };

  const handleGenerate = async () => {
    // Filter valid rows
    const validPlans = planRows.filter(row =>
      row.product && row.brand && row.sku
    );

    if (validPlans.length === 0) {
      alert("Please fill in at least one valid plan row.");
      return;
    }

    try {
      // Create all plans
      await Promise.all(validPlans.map(plan => {
        // Find SKU qty
        const skuData = dropdownOptions.skus[plan.product]?.find(s => s.value === plan.sku);

        return salesSettingsService.createBundle({
          ...plan,
          skuQuantity: skuData?.quantity || 0,
          kwOption: Number(plan.kwOption),
          duration: Number(plan.duration),
          discount: Number(plan.discount),
          state: selectedState,
          district: selectedDistrict,
          cluster: selectedCluster
        });
      }));

      alert("Bundle Plans Generated Successfully!");
      setPlanRows([{
        product: '', brand: '', sku: '', technology: '', wattage: '', kwOption: '', duration: '', startDate: '', discount: '', status: 'Inactive'
      }]); // Reset form
      fetchBundlePlans(); // Refresh list

    } catch (error) {
      console.error("Error creating bundles:", error);
      alert("Failed to create bundles");
    }
  };

  const handleDeletePlan = async (id) => {
    if (window.confirm("Are you sure you want to delete this bundle plan?")) {
      try {
        await salesSettingsService.deleteBundle(id);
        setPlans(prev => prev.filter(p => p._id !== id));
      } catch (error) {
        console.error("Error deleting bundle:", error);
      }
    }
  };


  const activePlansCount = plans.filter(p => p.status === 'Active').length;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <nav className="bg-white rounded-lg shadow-sm p-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Solar Panel Bundle Plan Management
            </h3>
            <ol className="flex items-center space-x-2 text-sm text-gray-600">
              <li className="flex items-center">
                <span className="hover:text-blue-600 cursor-pointer">Dashboard</span>
              </li>
              <li className="flex items-center">
                <span className="mx-2">›</span>
                <span className="text-blue-600 font-medium">Solar Panel Bundle Plan</span>
              </li>
            </ol>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* State Selection */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Select State</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {states.length > 0 ? states.map((state) => (
              <div
                key={state._id}
                className={`bg-white rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 p-5 text-center ${selectedState === state._id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                onClick={() => handleStateSelect(state._id)}
              >
                <h5 className="font-bold text-gray-800">{state.name}</h5>
              </div>
            )) : <p>No states available.</p>}
          </div>
        </div>

        {/* District Selection (Standard Hierarchy: State -> District -> Cluster)*/}
        {selectedState && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Select District</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {districts.map((district) => (
                <div
                  key={district._id}
                  className={`bg-white rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 p-5 text-center ${selectedDistrict === district._id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                  onClick={() => handleDistrictSelect(district._id)}
                >
                  <h5 className="font-bold text-gray-800">{district.name}</h5>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cluster Selection */}
        {selectedDistrict && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Select Cluster</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {clusters.map((cluster) => (
                <div
                  key={cluster._id}
                  className={`bg-white rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 p-5 text-center ${selectedCluster === cluster._id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                  onClick={() => handleClusterSelect(cluster._id)}
                >
                  <h5 className="font-bold text-gray-800">{cluster.name}</h5>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Plan Setup Table - Only show if cluster is selected (or district if strict) */}
        {selectedCluster && (
          <div id="planSetupSection" className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Solar Panel Bundle Plan Setup</h4>
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <div className="bg-blue-600 text-white px-6 py-3 flex justify-between items-center">
                <h5 className="font-semibold text-lg">Configure Bundle Plans</h5>
                <button onClick={addPlanRow} className="bg-white text-blue-600 hover:bg-gray-100 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
                  <Plus size={18} /> Add Row
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Product</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Brand</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">SKU Number</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Technology</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Wattage</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">KW Option</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Duration (Days)</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Start Date</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Discount (₹/KW)</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {planRows.map((row, index) => (
                      <tr key={index} className="border-t border-gray-200 hover:bg-gray-50">
                        {/* Fields mapped as before */}
                        <td className="px-4 py-3">
                          <select className="w-full p-2 border border-gray-300 rounded" value={row.product} onChange={(e) => updatePlanRow(index, 'product', e.target.value)}>
                            <option value="">Select</option>
                            {dropdownOptions.products.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <select className="w-full p-2 border border-gray-300 rounded" value={row.brand} onChange={(e) => updatePlanRow(index, 'brand', e.target.value)} disabled={!row.product}>
                            <option value="">Select</option>
                            {row.product && dropdownOptions.brands[row.product]?.map(b => <option key={b} value={b}>{b}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <select className="w-full p-2 border border-gray-300 rounded" value={row.sku} onChange={(e) => updatePlanRow(index, 'sku', e.target.value)} disabled={!row.product}>
                            <option value="">Select</option>
                            {row.product && dropdownOptions.skus[row.product]?.map(s => <option key={s.value} value={s.value}>{s.display}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <select className="w-full p-2 border border-gray-300 rounded" value={row.technology} onChange={(e) => updatePlanRow(index, 'technology', e.target.value)}>
                            <option value="">Select</option>
                            {dropdownOptions.technologies.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <select className="w-full p-2 border border-gray-300 rounded" value={row.wattage} onChange={(e) => updatePlanRow(index, 'wattage', e.target.value)}>
                            <option value="">Select</option>
                            {dropdownOptions.wattages.map(w => <option key={w} value={w}>{w}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <input type="number" className="w-20 p-2 border border-gray-300 rounded" value={row.kwOption} onChange={(e) => updatePlanRow(index, 'kwOption', e.target.value)} />
                        </td>
                        <td className="px-4 py-3">
                          <input type="number" className="w-20 p-2 border border-gray-300 rounded" value={row.duration} onChange={(e) => updatePlanRow(index, 'duration', e.target.value)} />
                        </td>
                        <td className="px-4 py-3">
                          <input type="date" className="w-32 p-2 border border-gray-300 rounded" value={row.startDate} onChange={(e) => updatePlanRow(index, 'startDate', e.target.value)} />
                        </td>
                        <td className="px-4 py-3">
                          <input type="number" className="w-24 p-2 border border-gray-300 rounded" value={row.discount} onChange={(e) => updatePlanRow(index, 'discount', e.target.value)} />
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => togglePlanStatus(index)} className={`px-2 py-1 rounded text-xs text-white ${row.status === 'Active' ? 'bg-green-500' : 'bg-gray-400'}`}>
                            {row.status}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => {
                            const newRows = planRows.filter((_, i) => i !== index);
                            setPlanRows(newRows);
                          }} className="text-red-500"><Trash2 size={16} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-end">
                <button onClick={handleGenerate} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
                  <Save size={18} /> Generate
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Existing Plans Summary (Dynamic) */}
        {plans.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Existing Bundle Plans</h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="border-l-4 border-blue-500 pl-4">
                <h6 className="text-gray-600 text-sm font-medium mb-1">State</h6>
                <p className="font-bold text-blue-600 text-lg">{selectedStateName || '-'}</p>
              </div>
              <div className="border-l-4 border-blue-500 pl-4">
                <h6 className="text-gray-600 text-sm font-medium mb-1">District</h6>
                <p className="font-bold text-blue-600 text-lg">{selectedDistrictName || '-'}</p>
              </div>
              <div className="border-l-4 border-blue-500 pl-4">
                <h6 className="text-gray-600 text-sm font-medium mb-1">Cluster</h6>
                <p className="font-bold text-blue-600 text-lg">{selectedClusterName || '-'}</p>
              </div>
            </div>

            <div className="flex justify-between items-center mb-6">
              <div className="flex gap-3">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">Total: {plans.length}</span>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">Active: {activePlansCount}</span>
              </div>
              <button onClick={fetchBundlePlans} className="text-blue-600 flex items-center gap-1 text-sm"><RefreshCw size={14} /> Refresh</button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Product</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">SKU</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Specs</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Discount</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Expiry</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map(plan => (
                    <tr key={plan._id} className="border-t border-gray-200">
                      <td className="px-4 py-2">{plan.product} <br /><span className="text-xs text-gray-500">{plan.brand}</span></td>
                      <td className="px-4 py-2">{plan.sku} <br /><span className="text-xs text-blue-500">Qty: {plan.skuQuantity}</span></td>
                      <td className="px-4 py-2 text-xs">
                        {plan.technology}, {plan.wattage}<br />
                        {plan.kwOption}KW, {plan.duration} Days
                      </td>
                      <td className="px-4 py-2">₹{plan.discount}</td>
                      <td className="px-4 py-2">{new Date(plan.startDate).toLocaleDateString()}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-xs text-white ${plan.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`}>{plan.status}</span>
                      </td>
                      <td className="px-4 py-2">
                        <button onClick={() => handleDeletePlan(plan._id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SolarPanelBundleSetting;