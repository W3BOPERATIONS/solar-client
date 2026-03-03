// CombokitBrandOverview.jsx
import React, { useState, useEffect } from 'react';
import { MapPin, Loader, AlertCircle, Check } from 'lucide-react';
import { locationAPI } from '../../../../api/api';
import inventoryApi from '../../../../services/inventory/inventoryApi';
import toast from 'react-hot-toast';

const CombokitBrandOverview = () => {
  // --- State Management ---
  const [selectedState, setSelectedState] = useState('');
  const [selectedCluster, setSelectedCluster] = useState('');
  const [selectedDistricts, setSelectedDistricts] = useState([]);
  const [selectedCpTypes, setSelectedCpTypes] = useState([]);

  const [states, setStates] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [districts, setDistricts] = useState([]);

  const cpTypesList = ['Startup', 'Basic', 'Enterprise', 'Solar Business'];

  const [data, setData] = useState([]); // Brand Overview Data
  const [loading, setLoading] = useState(false);

  // Load Initial States
  useEffect(() => {
    loadStates();
  }, []);

  // Fetch Overview when location/CP type selected
  useEffect(() => {
    if (selectedDistricts.length > 0 && selectedCpTypes.length > 0) {
      fetchOverview();
    } else {
      setData([]);
    }
  }, [selectedDistricts, selectedCpTypes]);

  const loadStates = async () => {
    try {
      const response = await locationAPI.getAllStates({ isActive: true });
      setStates(response.data.data || []);
    } catch (error) {
      console.error("Failed to load states", error);
    }
  };

  const loadClusters = async (stateId) => {
    try {
      const response = await locationAPI.getAllClusters({ stateId: stateId, isActive: true });
      setClusters(response.data.data || []);
    } catch (error) {
      console.error("Failed to load clusters", error);
    }
  };

  const loadDistricts = async (clusterId) => {
    try {
      const response = await locationAPI.getAllDistricts({ cityId: clusterId, isActive: true });
      setDistricts(response.data.data || []);
    } catch (error) {
      console.error("Failed to load districts", error);
    }
  };

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const params = {
        state: selectedState,
        cluster: selectedCluster,
        districts: selectedDistricts,
        cpTypes: selectedCpTypes
      };
      // Note: Assuming the API supports these multi-select parameters
      const response = await inventoryApi.getBrandOverview(params);
      setData(response.data || []);
    } catch (error) {
      console.error("Failed to fetch brand overview", error);
    } finally {
      setLoading(false);
    }
  };

  // --- Event Handlers ---
  const handleStateSelect = (stateId) => {
    if (selectedState === stateId) {
      setSelectedState('');
      setClusters([]);
    } else {
      setSelectedState(stateId);
      loadClusters(stateId);
    }
    setSelectedCluster('');
    setSelectedDistricts([]);
    setSelectedCpTypes([]);
    setDistricts([]);
  };

  const handleClusterSelect = (clusterId) => {
    if (selectedCluster === clusterId) {
      setSelectedCluster('');
      setDistricts([]);
    } else {
      setSelectedCluster(clusterId);
      loadDistricts(clusterId);
    }
    setSelectedDistricts([]);
  };

  const toggleDistrict = (districtId) => {
    setSelectedDistricts(prev =>
      prev.includes(districtId)
        ? prev.filter(id => id !== districtId)
        : [...prev, districtId]
    );
  };

  const toggleCpType = (type) => {
    setSelectedCpTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const selectAllDistricts = () => {
    setSelectedDistricts(districts.map(d => d._id));
  };

  const clearAllDistricts = () => {
    setSelectedDistricts([]);
  };

  const selectAllCpTypes = () => {
    setSelectedCpTypes([...cpTypesList]);
  };

  const clearAllCpTypes = () => {
    setSelectedCpTypes([]);
  };

  const getDistrictNames = () => {
    return districts
      .filter(d => selectedDistricts.includes(d._id))
      .map(d => d.name)
      .join(', ');
  };

  const getCpTypeNames = () => {
    return selectedCpTypes.join(', ');
  };

  const getSummaryHeader = () => {
    const state = states.find(s => s._id === selectedState)?.name || '';
    const cluster = clusters.find(c => c._id === selectedCluster)?.name || '';
    const districtCount = selectedDistricts.length;
    const districtNames = districts.filter(d => selectedDistricts.includes(d._id)).slice(0, 2).map(d => d.name).join(', ');
    const cpCount = selectedCpTypes.length;
    const cpNames = selectedCpTypes.slice(0, 2).join(', ');

    let summary = `${state} > ${cluster}`;
    if (districtCount > 0) {
      summary += ` > ${districtNames}${districtCount > 2 ? ` +${districtCount - 2} more` : ''}`;
    }
    if (cpCount > 0) {
      summary += ` > ${cpNames}${cpCount > 2 ? ` +${cpCount - 2} more` : ''}`;
    }
    return summary;
  };

  // --- Component ---
  return (
    <div className="container mx-auto px-4 py-8 bg-[#f4f6fa] min-h-screen font-sans">
      {/* Top Header */}
      <div className="bg-white rounded border border-[#3c50e0] mb-8 p-6">
        <h2 className="text-[#1c2434] text-xl font-bold">Combokit Brand SKU Overview</h2>
      </div>

      {/* State Selection */}
      <div className="mb-8">
        <h3 className="text-[#1c2434] text-[15px] font-semibold mb-4">Select a State</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {states.map(state => (
            <div
              key={state._id}
              onClick={() => handleStateSelect(state._id)}
              className={`cursor-pointer rounded border p-6 flex flex-col items-center justify-center transition-all ${selectedState === state._id
                  ? 'bg-[#3c50e0] text-white border-[#3c50e0] shadow-lg scale-[1.02]'
                  : 'bg-white text-[#1c2434] border-gray-200 hover:shadow-md'
                }`}
            >
              <span className="text-[17px] font-bold mb-1 uppercase tracking-wide">{state.name}</span>
              <span className={`text-[13px] font-semibold ${selectedState === state._id ? 'text-blue-100' : 'text-gray-500'}`}>
                {state.code || 'N/A'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Cluster Selection */}
      {selectedState && (
        <div className="mb-8 animate-fadeIn">
          <h3 className="text-[#1c2434] text-[15px] font-semibold mb-4">
            Select a Cluster - {states.find(s => s._id === selectedState)?.name} ({states.find(s => s._id === selectedState)?.code})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {clusters.map(cluster => (
              <div
                key={cluster._id}
                onClick={() => handleClusterSelect(cluster._id)}
                className={`cursor-pointer rounded border py-4 px-6 flex items-center justify-center transition-all ${selectedCluster === cluster._id
                    ? 'bg-[#6a5cb8] text-white border-[#6a5cb8] shadow-md'
                    : 'bg-[#eff2f7] text-[#1c2434] border-gray-100 hover:bg-gray-200'
                  }`}
              >
                <span className="text-[15px] font-bold">{cluster.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Districts Selection */}
      {selectedCluster && (
        <div className="mb-8 animate-fadeIn">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[#1c2434] text-[15px] font-semibold">Select Districts</h3>
            <div className="flex items-center space-x-3 text-[13px]">
              <span className="text-gray-400">{selectedDistricts.length} selected</span>
              <button onClick={selectAllDistricts} className="text-[#3c50e0] font-bold hover:underline">Select All</button>
              <button onClick={clearAllDistricts} className="text-gray-500 font-bold hover:underline">Clear All</button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
            {districts.map(district => (
              <div
                key={district._id}
                onClick={() => toggleDistrict(district._id)}
                className={`cursor-pointer rounded border py-4 px-6 flex items-center justify-center transition-all ${selectedDistricts.includes(district._id)
                    ? 'bg-[#6a5cb8] text-white border-[#6a5cb8] shadow-md'
                    : 'bg-[#eff2f7] text-[#1c2434] border-gray-100 hover:bg-gray-200'
                  }`}
              >
                <span className="text-[15px] font-bold">{district.name}</span>
              </div>
            ))}
          </div>
          <div className="bg-white border border-gray-200 rounded p-3 mb-6">
            <span className="text-gray-500 font-medium text-[14px]">Selected: </span>
            <span className="text-[#1c2434] font-bold text-[14px]">{getDistrictNames() || 'None'}</span>
          </div>
        </div>
      )}

      {/* CP Types Selection */}
      {selectedDistricts.length > 0 && (
        <div className="mb-8 animate-fadeIn">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[#1c2434] text-[15px] font-semibold">Select CP Types</h3>
            <div className="flex items-center space-x-3 text-[13px]">
              <span className="text-gray-400">{selectedCpTypes.length} selected</span>
              <button onClick={selectAllCpTypes} className="text-[#3c50e0] font-bold hover:underline">Select All</button>
              <button onClick={clearAllCpTypes} className="text-gray-500 font-bold hover:underline">Clear All</button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
            {cpTypesList.map(type => (
              <div
                key={type}
                onClick={() => toggleCpType(type)}
                className={`cursor-pointer rounded border py-4 px-6 flex items-center justify-center transition-all ${selectedCpTypes.includes(type)
                    ? 'bg-[#6a5cb8] text-white border-[#6a5cb8] shadow-md'
                    : 'bg-[#eff2f7] text-[#1c2434] border-gray-100 hover:bg-gray-200'
                  }`}
              >
                <span className="text-[15px] font-bold">{type}</span>
              </div>
            ))}
          </div>
          <div className="bg-white border border-gray-200 rounded p-3 mb-6">
            <span className="text-gray-500 font-medium text-[14px]">Selected: </span>
            <span className="text-[#1c2434] font-bold text-[14px]">{getCpTypeNames() || 'None'}</span>
          </div>
        </div>
      )}

      {/* Brand Overview Card */}
      <div className="bg-white rounded shadow-sm border border-gray-100 mb-8 overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[#1c2434] text-[20px] font-bold">Brand Overview</h3>
            {selectedState && selectedCluster && (
              <div className="bg-[#007fb1] text-white px-4 py-2 rounded text-[13px] font-bold uppercase tracking-wider">
                {getSummaryHeader()}
              </div>
            )}
          </div>

          <div className="overflow-x-auto rounded border border-gray-200">
            <table className="w-full text-left align-middle border-collapse">
              <thead className="bg-gradient-to-r from-sky-400 to-blue-400 text-white">
                <tr>
                  <th className="py-3 px-6 font-bold text-[15px] border-r border-white/20">Product</th>
                  <th className="py-3 px-6 font-bold text-[15px] border-r border-white/20">Brand Names</th>
                  <th className="py-3 px-6 font-bold text-[15px]">Brand Logos + SKUs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="py-12 text-center">
                      <Loader className="animate-spin mx-auto text-blue-500" />
                      <p className="mt-2 text-gray-500 text-sm">Loading data...</p>
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-12 text-center text-gray-400 italic">
                      No data found for the selected criteria.
                    </td>
                  </tr>
                ) : (
                  data.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="py-5 px-6 font-bold text-[#1c2434] border-r border-gray-200">{item._id}</td>
                      <td className="py-5 px-6 text-[#1c2434] border-r border-gray-200">
                        {item.brands.map(b => b.brandName).join(', ')}
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex flex-wrap gap-4">
                          {item.brands.map((brand, bIndex) => (
                            <div key={bIndex} className="flex items-center bg-gray-50 rounded px-3 py-1.5 border border-gray-100">
                              {brand.logo && <img src={brand.logo} alt={brand.brandName} className="w-8 h-8 object-contain mr-2" />}
                              <span className="font-bold text-[#1c2434] text-[14px]">{brand.skus} SKUs</span>
                            </div>
                          ))}
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

      {/* Footer */}
      <div className="mt-12 text-center py-6 border-t border-gray-200">
        <p className="text-[#1c2434] text-[14px] font-medium">
          Copyright © {new Date().getFullYear()} Solarkits. All Rights Reserved.
        </p>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
};

export default CombokitBrandOverview;
