import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, CheckCircle, Save, LayoutGrid, Package, Settings, RefreshCw 
} from 'lucide-react';
import { useLocations } from '../../../../hooks/useLocations';
import salesSettingsService from '../../../../admin/services/salesSettingsService';

const LocationCard = ({ title, subtitle, isSelected, onClick, isState }) => (
  <div
    onClick={onClick}
    className={`p-4 rounded-md transition-all cursor-pointer flex flex-col items-center justify-center text-center h-20 shadow-sm hover:shadow-md ${
      isSelected
      ? isState ? 'border-2 border-[#007bff] bg-[#eef6ff]' : 'border-2 border-[#007bff] bg-[#eef6ff]'
      : 'border border-gray-200 bg-white'
      }`}
  >
    <div className="font-bold text-[14px] text-[#2c3e50] mb-0">{title}</div>
    <div className="text-[11px] text-gray-500 font-medium uppercase tracking-tight">{subtitle}</div>
  </div>
);

export default function SolarPanelBundleSetting() {
  const { states, districts, clusters, fetchStates, fetchDistricts, fetchClusters } = useLocations();

  const [selectedStateId, setSelectedStateId] = useState('');
  const [selectedClusterId, setSelectedClusterId] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);

  const [planRows, setPlanRows] = useState([{
    product: '', brand: '', sku: '', technology: '', wattage: '', kwOption: '', duration: '', startDate: '', discount: '', status: 'Inactive', isSelectedForActivation: false
  }]);

  // Temporary static dropdown options 
  const dropdownOptions = {
    products: ["Solar Panel", "Solar Inverter"],
    brands: {
      "Solar Panel": ["Adani", "Tata", "Waaree", "Vikram"],
      "Solar Inverter": ["SMA", "Growatt", "Huawei"]
    },
    skus: {
      "Solar Panel": [
        { value: "SP-330", display: "SP-330 (330W Mono)", quantity: 25 },
        { value: "SP-400", display: "SP-400 (400W LG)", quantity: 18 }
      ],
      "Solar Inverter": [
        { value: "SI-3KW", display: "SI-3KW SMA", quantity: 12 },
        { value: "SI-5KW", display: "SI-5KW Growatt", quantity: 8 }
      ]
    },
    technologies: ["Mono PERC", "Poly", "Half Cut"],
    wattages: ["330W", "400W", "500W", "540W"]
  };

  const selectedStateObj = states.find(s => s._id === selectedStateId);
  const selectedClusterObj = clusters.find(c => c._id === selectedClusterId);
  const selectedDistrictObj = districts.find(d => d._id === selectedDistrictId);

  useEffect(() => {
    fetchStates();
    fetchClusters(); 
  }, []);

  useEffect(() => {
    if (selectedStateId) {
      setSelectedClusterId('');
      setSelectedDistrictId('');
      if (selectedStateId !== 'all') fetchClusters({ stateId: selectedStateId }); 
      else fetchClusters();
    }
  }, [selectedStateId]);

  useEffect(() => {
    if (selectedClusterId) {
       setSelectedDistrictId('');
       if (selectedClusterId !== 'all') fetchDistricts({ clusterId: selectedClusterId }); 
       else fetchDistricts();
    }
  }, [selectedClusterId]);

  useEffect(() => {
    if (selectedDistrictId) {
      fetchBundlePlans();
    }
  }, [selectedStateId, selectedClusterId, selectedDistrictId]);

  const fetchBundlePlans = async () => {
    setLoading(true);
    try {
      const allBundles = await salesSettingsService.getBundles();
      const filtered = allBundles.filter(b => 
        (selectedStateId === 'all' || b.state === selectedStateId) &&
        (selectedClusterId === 'all' || b.cluster === selectedClusterId) &&
        (selectedDistrictId === 'all' || b.district === selectedDistrictId)
      );
      setPlans(filtered);
    } catch (error) {
      console.error("Error fetching bundles:", error);
    } finally {
      setLoading(false);
    }
  };

  const addPlanRow = () => {
    setPlanRows([...planRows, {
      product: '', brand: '', sku: '', technology: '', wattage: '', kwOption: '', duration: '', startDate: '', discount: '', status: 'Inactive', isSelectedForActivation: false
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

  const toggleRowActivationChoice = (index) => {
    const updatedRows = [...planRows];
    updatedRows[index].isSelectedForActivation = !updatedRows[index].isSelectedForActivation;
    updatedRows[index].status = updatedRows[index].isSelectedForActivation ? 'Active' : 'Inactive';
    setPlanRows(updatedRows);
  };

  const handleGenerate = async () => {
    if(!selectedStateId || !selectedClusterId || !selectedDistrictId || selectedStateId === 'all' || selectedClusterId === 'all' || selectedDistrictId === 'all') {
       return alert("Please select a specific State, Cluster and District before generating plans.");
    }

    const validPlans = planRows.filter(row => row.product && row.brand && row.sku && row.kwOption && row.duration);

    if (validPlans.length === 0) {
      alert("Please fill in at least one valid plan row with all required attributes (Product, Brand, SKU, KW, Duration).");
      return;
    }

    try {
      await Promise.all(validPlans.map(plan => {
        const skuData = dropdownOptions.skus[plan.product]?.find(s => s.value === plan.sku);
        return salesSettingsService.createBundle({
          ...plan,
          skuQuantity: skuData?.quantity || 0,
          kwOption: Number(plan.kwOption),
          duration: Number(plan.duration),
          discount: Number(plan.discount),
          state: selectedStateId,
          district: selectedDistrictId,
          cluster: selectedClusterId
        });
      }));

      alert("Bundle Plans Generated Successfully!");
      setPlanRows([{
        product: '', brand: '', sku: '', technology: '', wattage: '', kwOption: '', duration: '', startDate: '', discount: '', status: 'Inactive', isSelectedForActivation: false
      }]);
      fetchBundlePlans(); 
    } catch (error) {
      console.error("Error creating bundles:", error);
      alert("Failed to create bundles");
    }
  };

  const handleDeletePlan = async (id) => {
    if (window.confirm("Are you sure you want to delete this bundle plan?")) {
      try {
        await salesSettingsService.deleteBundle(id);
        fetchBundlePlans();
      } catch (error) {
        console.error("Error deleting bundle:", error);
      }
    }
  };

  const activePlansCount = plans.filter(p => p.status === 'Active').length;

  return (
    <div className="bg-[#f4f7fa] min-h-screen font-sans">
      {/* Header Block */}
      <div className="bg-white p-6 border-b border-gray-200 mb-8 px-12">
        <h1 className="text-[22px] font-bold text-[#14233c] mb-2">Solar Panel Bundle Plan Management</h1>
      </div>

      <div className="px-12 pb-12">
        
        {/* Location Filters Block */}
        <div className="mb-8 bg-gray-50 p-6 rounded-xl border border-gray-100 shadow-sm">
           {/* Select State */}
           <div className="mb-6">
              <h2 className="text-[16px] font-bold text-[#6c757d] mb-3">Select State</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
                  <LocationCard 
                    title="All States" subtitle="ALL" isSelected={selectedStateId === 'all' || selectedStateId === ''} isState={true}
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

           {/* Select Cluster */}
           {selectedStateId && (
              <div className="mb-6 border-t border-gray-100 pt-6">
                <h2 className="text-[16px] font-bold text-[#6c757d] mb-3">Select Cluster</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
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

           {/* Select District */}
           {selectedClusterId && (
              <div className="border-t border-gray-100 pt-6">
                <h2 className="text-[16px] font-bold text-[#6c757d] mb-3">Select District</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
                   <LocationCard 
                      title="All Districts" subtitle="ALL" isSelected={selectedDistrictId === 'all' || selectedDistrictId === ''} 
                      onClick={() => setSelectedDistrictId('all')} 
                   />
                   {districts.map((d) => (
                      <LocationCard 
                        key={d._id} title={d.name} subtitle={'District'} 
                        isSelected={selectedDistrictId === d._id} 
                        onClick={() => setSelectedDistrictId(d._id)} 
                      />
                   ))}
                </div>
              </div>
           )}
        </div>

        {/* Generate / Input Setup Block */}
        <div className="mb-8">
           <h2 className="text-[18px] font-bold text-[#6c757d] mb-3">Solar Panel Bundle Plan Setup</h2>
           <div className="bg-white rounded shadow-sm border border-[#0076a8] overflow-hidden">
               {/* Header Blue Bar */}
               <div className="bg-[#0076a8] text-white p-3 flex justify-between items-center">
                   <h3 className="font-bold text-[16px]">Configure Bundle Plans</h3>
                   <button onClick={addPlanRow} className="bg-white text-[#0076a8] hover:bg-gray-100 px-3 py-1.5 rounded text-sm font-bold flex items-center gap-1.5 transition-colors shadow-sm">
                       <Plus size={16} /> Add Row
                   </button>
               </div>

               {/* Table Input Container */}
               <div className="overflow-x-auto w-full">
                   <table className="w-full text-left whitespace-nowrap min-w-max">
                       <thead className="bg-[#64b5f6] text-white">
                           <tr>
                               <th className="p-3 text-sm font-bold border-r border-[#64b5f6]">Product</th>
                               <th className="p-3 text-sm font-bold border-r border-[#64b5f6]">Brand</th>
                               <th className="p-3 text-sm font-bold border-r border-[#64b5f6]">SKU Number</th>
                               <th className="p-3 text-sm font-bold border-r border-[#64b5f6]">Technology</th>
                               <th className="p-3 text-sm font-bold border-r border-[#64b5f6]">Wattage Option</th>
                               <th className="p-3 text-sm font-bold border-r border-[#64b5f6]">KW Option</th>
                               <th className="p-3 text-sm font-bold border-r border-[#64b5f6]">Time Duration<br/><span className="text-xs font-normal">(Days)</span></th>
                               <th className="p-3 text-sm font-bold border-r border-[#64b5f6]">Start Date</th>
                               <th className="p-3 text-sm font-bold border-r border-[#64b5f6]">Discount (₹/KW)</th>
                               <th className="p-3 text-sm font-bold border-r border-[#64b5f6]">Status</th>
                               <th className="p-3 text-sm font-bold text-center">Activate</th>
                           </tr>
                       </thead>
                       <tbody>
                           {planRows.map((row, index) => (
                               <tr key={index} className="border-b border-gray-200">
                                   <td className="p-2 align-top">
                                       <div className="flex items-center">
                                          {planRows.length > 1 && (
                                              <button onClick={() => { const r = [...planRows]; r.splice(index, 1); setPlanRows(r); }} className="text-gray-400 hover:text-red-500 mr-2 opacity-50"><Trash2 size={14}/></button>
                                          )}
                                          <select className="flex-1 border border-gray-300 rounded p-2 text-sm bg-white" value={row.product} onChange={e => updatePlanRow(index, 'product', e.target.value)}>
                                              <option value="">Select Product</option>
                                              {dropdownOptions.products.map(p => <option key={p} value={p}>{p}</option>)}
                                          </select>
                                       </div>
                                   </td>
                                   <td className="p-2 align-top">
                                       <select className="w-40 border border-gray-300 rounded p-2 text-sm bg-white" value={row.brand} onChange={e => updatePlanRow(index, 'brand', e.target.value)} disabled={!row.product}>
                                           <option value="">Select Brand</option>
                                           {row.product && dropdownOptions.brands[row.product]?.map(b => <option key={b} value={b}>{b}</option>)}
                                       </select>
                                   </td>
                                   <td className="p-2 align-top">
                                       <select className="w-40 border border-gray-300 rounded p-2 text-sm bg-white" value={row.sku} onChange={e => updatePlanRow(index, 'sku', e.target.value)} disabled={!row.product}>
                                           <option value="">Select SKU</option>
                                           {row.product && dropdownOptions.skus[row.product]?.map(s => <option key={s.value} value={s.value}>{s.display}</option>)}
                                       </select>
                                   </td>
                                   <td className="p-2 align-top">
                                       <select className="w-40 border border-gray-300 rounded p-2 text-sm bg-white" value={row.technology} onChange={e => updatePlanRow(index, 'technology', e.target.value)}>
                                           <option value="">Select Technology</option>
                                           {dropdownOptions.technologies.map(t => <option key={t} value={t}>{t}</option>)}
                                       </select>
                                   </td>
                                   <td className="p-2 align-top">
                                       <select className="w-40 border border-gray-300 rounded p-2 text-sm bg-white" value={row.wattage} onChange={e => updatePlanRow(index, 'wattage', e.target.value)}>
                                           <option value="">Select Wattage</option>
                                           {dropdownOptions.wattages.map(w => <option key={w} value={w}>{w}</option>)}
                                       </select>
                                   </td>
                                   <td className="p-2 align-top">
                                       <input type="number" placeholder="Enter KW" className="w-28 border border-gray-300 rounded p-2 text-sm" value={row.kwOption} onChange={e => updatePlanRow(index, 'kwOption', e.target.value)} />
                                   </td>
                                   <td className="p-2 align-top">
                                       <input type="number" placeholder="Days" className="w-24 border border-gray-300 rounded p-2 text-sm" value={row.duration} onChange={e => updatePlanRow(index, 'duration', e.target.value)} />
                                   </td>
                                   <td className="p-2 align-top">
                                       <input type="date" className="border border-gray-300 rounded p-2 text-sm" value={row.startDate} onChange={e => updatePlanRow(index, 'startDate', e.target.value)} />
                                   </td>
                                   <td className="p-2 align-top">
                                       <div className="relative">
                                          <input type="number" placeholder="₹/KW" className="w-28 border border-gray-300 rounded p-2 pl-3 text-sm" value={row.discount} onChange={e => updatePlanRow(index, 'discount', e.target.value)} />
                                       </div>
                                   </td>
                                   <td className="p-2 align-top">
                                       <span className={`px-2 py-1 rounded text-xs font-bold ${row.status === 'Active' ? 'bg-[#d4eddb] text-[#28a745]' : 'bg-[#f8d7da] text-[#dc3545]'}`}>
                                           {row.status}
                                       </span>
                                   </td>
                                   <td className="p-2 align-top text-center">
                                       <input type="checkbox" className="w-4 h-4 mt-2 cursor-pointer" checked={row.isSelectedForActivation} onChange={() => toggleRowActivationChoice(index)} />
                                   </td>
                               </tr>
                           ))}
                       </tbody>
                   </table>
               </div>
               
               {/* Footer Generate Section */}
               <div className="p-4 bg-gray-50 flex justify-end border-t border-gray-200">
                   <button onClick={handleGenerate} className="bg-[#28a745] hover:bg-green-600 text-white px-5 py-2 rounded text-sm font-bold flex items-center gap-1.5 transition-colors shadow-sm">
                      <Save size={16} /> Generate
                   </button>
               </div>
           </div>
        </div>


        {/* Summary Table Section */}
        {plans.length >= 0 && (
           <div className="mb-12">
               <h2 className="text-[18px] font-bold text-[#6c757d] mb-3">Plan Summary</h2>
               <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
                   
                   {/* Header Row */}
                   <div className="bg-[#28a745] text-white p-3">
                       <h3 className="font-bold text-[16px]">Bundle Plan Summary</h3>
                   </div>

                   {/* Location Metrics Row */}
                   <div className="p-6 border-b border-gray-100 flex justify-between items-end">
                       <div className="flex gap-x-24">
                           <div className="border-l-2 border-[#007bff] pl-3">
                               <h6 className="text-gray-800 text-[14px] font-bold mb-1">State</h6>
                               <p className="font-bold text-[#007bff] text-[16px]">{selectedStateId === 'all' ? 'All States' : (selectedStateObj?.name || '-')}</p>
                           </div>
                           <div className="border-l-2 border-[#007bff] pl-3">
                               <h6 className="text-gray-800 text-[14px] font-bold mb-1">Cluster</h6>
                               <p className="font-bold text-[#007bff] text-[16px]">{selectedClusterId === 'all' ? 'All Clusters' : (selectedClusterObj?.name || '-')}</p>
                           </div>
                           <div className="border-l-2 border-[#007bff] pl-3">
                               <h6 className="text-gray-800 text-[14px] font-bold mb-1">District</h6>
                               <p className="font-bold text-[#007bff] text-[16px]">{selectedDistrictId === 'all' ? 'All Districts' : (selectedDistrictObj?.name || '-')}</p>
                           </div>
                       </div>
                   </div>

                   {/* Sub-Header Metrics */}
                   <div className="px-6 py-4 flex justify-between items-center">
                       <h3 className="font-bold text-[16px] text-gray-800">Bundle Plans</h3>
                       <div className="flex gap-3">
                           <span className="bg-[#007bff] text-white px-3 py-1 rounded shadow-sm text-sm font-bold">Total Plans: {plans.length}</span>
                           <span className="bg-[#28a745] text-white px-3 py-1 rounded shadow-sm text-sm font-bold">Active Plans: {activePlansCount}</span>
                       </div>
                   </div>

                   {/* Data Table */}
                   <div className="overflow-x-auto w-full px-6 pb-6 w-full">
                       <table className="w-full text-left whitespace-nowrap min-w-max">
                           <thead className="bg-[#64b5f6] text-white">
                               <tr>
                                   <th className="p-3 text-[13px] font-bold border-r border-[#64b5f6]">#</th>
                                   <th className="p-3 text-[13px] font-bold border-r border-[#64b5f6]">Product</th>
                                   <th className="p-3 text-[13px] font-bold border-r border-[#64b5f6]">Brand</th>
                                   <th className="p-3 text-[13px] font-bold border-r border-[#64b5f6]">SKU Number</th>
                                   <th className="p-3 text-[13px] font-bold border-r border-[#64b5f6]">Technology</th>
                                   <th className="p-3 text-[13px] font-bold border-r border-[#64b5f6]">Wattage</th>
                                   <th className="p-3 text-[13px] font-bold border-r border-[#64b5f6]">KW Option</th>
                                   <th className="p-3 text-[13px] font-bold border-r border-[#64b5f6]">Duration</th>
                                   <th className="p-3 text-[13px] font-bold border-r border-[#64b5f6]">Start Date</th>
                                   <th className="p-3 text-[13px] font-bold border-r border-[#64b5f6]">Discount (₹/KW)</th>
                                   <th className="p-3 text-[13px] font-bold border-r border-[#64b5f6]">Status</th>
                                   <th className="p-3 text-[13px] font-bold text-center">Actions</th>
                               </tr>
                           </thead>
                           <tbody>
                               {plans.length === 0 ? (
                                   <tr><td colSpan="12" className="text-center p-6 text-gray-400">No Bundle Plans active for this location logic.</td></tr>
                               ) : plans.map((plan, idx) => (
                                   <tr key={plan._id} className="border-b border-gray-100 hover:bg-gray-50 border-x">
                                       <td className="p-3 text-sm text-gray-500 font-medium">{idx + 1}</td>
                                       <td className="p-3 text-sm font-medium text-gray-800">{plan.product}</td>
                                       <td className="p-3 text-sm text-gray-600">{plan.brand}</td>
                                       <td className="p-3 text-sm text-gray-600">{plan.sku}</td>
                                       <td className="p-3 text-sm text-gray-600">{plan.technology || '-'}</td>
                                       <td className="p-3 text-sm text-gray-600">{plan.wattage || '-'}</td>
                                       <td className="p-3 text-sm text-gray-600">{plan.kwOption || '-'} KW</td>
                                       <td className="p-3 text-sm text-gray-600">{plan.duration || '-'} Days</td>
                                       <td className="p-3 text-sm text-gray-600">{plan.startDate ? new Date(plan.startDate).toLocaleDateString() : '-'}</td>
                                       <td className="p-3 text-sm text-gray-600">{plan.discount ? `₹${plan.discount}` : '₹0'}</td>
                                       <td className="p-3 text-sm text-center">
                                           <span className={`px-2 py-1 rounded text-[11px] font-bold ${plan.status === 'Active' ? 'bg-[#d4eddb] text-[#28a745]' : 'bg-[#f8d7da] text-[#dc3545]'}`}>
                                               {plan.status || 'Active'}
                                           </span>
                                       </td>
                                       <td className="p-3 text-sm text-center">
                                           <button onClick={() => handleDeletePlan(plan._id)} className="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded-full transition-colors">
                                              <Trash2 size={16} />
                                           </button>
                                       </td>
                                   </tr>
                               ))}
                           </tbody>
                       </table>
                       
                       {/* Table Footer Actions */}
                       {plans.length > 0 && (
                          <div className="mt-4 flex gap-3">
                              <button className="bg-[#0076a8] hover:bg-blue-700 text-white px-4 py-2 rounded text-[13px] font-bold flex items-center gap-1.5 transition-colors shadow-sm">
                                 <Edit size={14} /> Edit Plan
                              </button>
                              <button className="bg-[#28a745] hover:bg-green-600 text-white px-4 py-2 rounded text-[13px] font-bold flex items-center gap-1.5 transition-colors shadow-sm">
                                 <CheckCircle size={14} /> Final Save Plan
                              </button>
                          </div>
                       )}
                   </div>
               </div>
           </div>
        )}

      </div>
    </div>
  );
}