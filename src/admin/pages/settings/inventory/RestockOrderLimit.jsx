// InventoryRestockLimit.jsx
import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Check, X, Loader } from 'lucide-react';
import { locationAPI } from '../../../../api/api';
import inventoryApi from '../../../../services/inventory/inventoryApi';
import toast from 'react-hot-toast';

const InventoryRestockLimit = () => {
  // --- State Management ---
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');

  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);

  const [showLocationSection, setShowLocationSection] = useState(true);

  // Data
  const [products, setProducts] = useState([]);
  const [limitInputs, setLimitInputs] = useState({}); // Stores input values
  const [loading, setLoading] = useState(false);

  // Load Initial States
  useEffect(() => {
    loadStates();
  }, []);

  // Fetch Inventory and Limits when location selected
  useEffect(() => {
    if (selectedDistrict) {
      fetchRestockLimits();
    } else {
      setProducts([]);
    }
  }, [selectedDistrict]);

  const loadStates = async () => {
    try {
      const response = await locationAPI.getAllStates({ isActive: true });
      setStates(response.data.data || []);
    } catch (error) {
      console.error("Failed to load states", error);
    }
  };

  const loadCities = async (stateId) => {
    try {
      const response = await locationAPI.getAllCities({ stateId: stateId, isActive: true });
      setCities(response.data.data || []);
    } catch (error) {
      console.error("Failed to load cities", error);
    }
  };

  const loadDistricts = async (cityId) => {
    try {
      const response = await locationAPI.getAllDistricts({ cityId: cityId, isActive: true });
      setDistricts(response.data.data || []);
    } catch (error) {
      console.error("Failed to load districts", error);
    }
  };

  const fetchRestockLimits = async () => {
    try {
      setLoading(true);
      const params = {
        state: selectedState,
        city: selectedCity,
        district: selectedDistrict
      };
      const response = await inventoryApi.getRestockLimits(params);
      setProducts(response.data || []);

      // Initial input values
      const initialInputs = {};
      response.data.forEach(item => {
        initialInputs[item._id] = item.currentRestockLimit || '';
      });
      setLimitInputs(initialInputs);

    } catch (error) {
      console.error("Failed to fetch limits", error);
      toast.error("Failed to fetch restock limits");
    } finally {
      setLoading(false);
    }
  };


  // --- Event Handlers ---
  const handleStateSelect = (stateId) => {
    if (selectedState === stateId) {
      setSelectedState('');
      setCities([]);
    } else {
      setSelectedState(stateId);
      loadCities(stateId);
    }
    setSelectedCity('');
    setSelectedDistrict('');
    setDistricts([]);
  };

  const handleCitySelect = (cityId) => {
    if (selectedCity === cityId) {
      setSelectedCity('');
      setDistricts([]);
    } else {
      setSelectedCity(cityId);
      loadDistricts(cityId);
    }
    setSelectedDistrict('');
  };

  const handleDistrictSelect = (districtId) => {
    setSelectedDistrict(prev => prev === districtId ? '' : districtId);
  };

  const handleAmountChange = (itemId, value) => {
    setLimitInputs(prev => ({
      ...prev,
      [itemId]: value
    }));
  };

  const handleSaveLimit = async (item) => {
    try {
      const threshold = limitInputs[item._id];
      if (threshold === '' || isNaN(threshold)) {
        toast.error("Please enter a valid amount");
        return;
      }

      await inventoryApi.setRestockLimit({
        itemId: item._id,
        threshold: Number(threshold)
      });

      toast.success(`Limit set to ₹${threshold} for ${item.itemName}`);
      // Refresh? Or update local state?
      // Let's just update local view for now to avoid re-fetch flickers

    } catch (error) {
      console.error("Failed to save limit", error);
      toast.error("Failed to save limit");
    }
  };

  // --- Component ---
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center">
            <div className="w-full h-full flex justify-between items-center">
              <h3 className="text-xl font-semibold mb-0">Inventory Restock Limit Setting</h3>
              <button
                onClick={() => setShowLocationSection(!showLocationSection)}
                className="px-4 py-2 border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 flex items-center"
              >
                {showLocationSection ? (
                  <>
                    <EyeOff size={16} className="mr-2" />
                    Hide Location Cards
                  </>
                ) : (
                  <>
                    <Eye size={16} className="mr-2" />
                    Show Location Cards
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Location Selection Section */}
      <div className={`transition-all duration-500 overflow-hidden ${showLocationSection ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>

        {/* State Selection */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold mb-4">Select State</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {states.map(state => (
              <div
                key={state._id}
                className={`cursor-pointer bg-white rounded-lg shadow p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${selectedState === state._id ? 'border-2 border-blue-500' : 'border border-gray-200'
                  }`}
                onClick={() => handleStateSelect(state._id)}
              >
                <h5 className="font-bold text-lg">{state.name}</h5>
                <p className="text-gray-500 mt-1">{state.code}</p>
              </div>
            ))}
            {states.length === 0 && <div className="col-span-4 text-center text-gray-400">Loading states...</div>}
          </div>
        </div>

        {/* City/Cluster Selection */}
        {selectedState && (
          <div className={`mb-8 animate-fadeIn`}>
            <h4 className="text-lg font-semibold mb-4">Select City</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {cities.map(city => (
                <div
                  key={city._id}
                  className={`cursor-pointer bg-white rounded-lg shadow p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${selectedCity === city._id ? 'border-2 border-blue-500' : 'border border-gray-200'
                    }`}
                  onClick={() => handleCitySelect(city._id)}
                >
                  <h6 className="font-bold">{city.name}</h6>
                </div>
              ))}
              {cities.length === 0 && <div className="col-span-4 text-center text-gray-400">No cities found</div>}
            </div>
          </div>
        )}

        {/* District Selection */}
        {selectedCity && (
          <div className={`mb-8 animate-fadeIn`}>
            <h4 className="text-lg font-semibold mb-4">Select District</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {districts.map(district => (
                <div
                  key={district._id}
                  className={`cursor-pointer bg-white rounded-lg shadow p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${selectedDistrict === district._id ? 'border-2 border-blue-500' : 'border border-gray-200'
                    }`}
                  onClick={() => handleDistrictSelect(district._id)}
                >
                  <h6 className="font-bold">{district.name}</h6>
                </div>
              ))}
              {districts.length === 0 && <div className="col-span-4 text-center text-gray-400">No districts found</div>}
            </div>
          </div>
        )}
      </div>

      {/* Inventory Restock Order Approval Table */}
      {selectedDistrict && (
        <div className="mt-10">
          <h4 className="text-blue-600 text-xl font-semibold mb-6">Inventory Restock Limit Table</h4>
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left border">Product</th>
                  <th className="py-3 px-4 text-left border">Brand</th>
                  <th className="py-3 px-4 text-left border">SKU</th>
                  <th className="py-3 px-4 text-left border">Current Limit</th>
                  <th className="py-3 px-4 text-left border">New Restock Order Limit (₹)</th>
                  <th className="py-3 px-4 text-left border">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="p-8 text-center"><Loader className="animate-spin mx-auto" /></td></tr>
                ) : products.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-gray-500">No inventory items found for this location.</td></tr>
                ) : (
                  products.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 border font-medium">{item.itemName}</td>
                      <td className="py-3 px-4 border">{item.brand?.brandName || 'Unknown'}</td>
                      <td className="py-3 px-4 border font-mono text-sm">{item.sku}</td>
                      <td className="py-3 px-4 border">₹ {item.currentRestockLimit || 0}</td>
                      <td className="py-3 px-4 border">
                        <input
                          type="number"
                          className="w-full border rounded px-3 py-2"
                          placeholder="Enter ₹ amount"
                          value={limitInputs[item._id]}
                          onChange={(e) => handleAmountChange(item._id, e.target.value)}
                        />
                      </td>
                      <td className="py-3 px-4 border">
                        <button
                          onClick={() => handleSaveLimit(item)}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                        >
                          <Check size={16} className="mr-1" />
                          Save
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryRestockLimit;

// CSS for animations if needed
const styles = `
.animate-fadeIn {
  animation: fadeIn 0.5s ease-in-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
`;
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}