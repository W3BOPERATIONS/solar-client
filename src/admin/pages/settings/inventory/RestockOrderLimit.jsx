// InventoryRestockLimit.jsx
import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Loader } from 'lucide-react';
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

  const [showLocationSection, setShowLocationSection] = useState(false);

  // Data
  const [products, setProducts] = useState([]);
  const [limitInputs, setLimitInputs] = useState({}); // Stores input values
  const [loading, setLoading] = useState(false);

  // Load Initial States & Products
  useEffect(() => {
    loadStates();
    fetchRestockLimits(); // Fetch all on mount initially
  }, []);

  // Fetch Inventory and Limits when location changes
  useEffect(() => {
    fetchRestockLimits();
  }, [selectedState, selectedCity, selectedDistrict]);

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
      const params = {};
      if (selectedState) params.state = selectedState;
      if (selectedCity) params.city = selectedCity;
      if (selectedDistrict) params.district = selectedDistrict;

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

      // Update local state to reflect the saved limit in cards
      setProducts(prevProducts =>
        prevProducts.map(p =>
          p._id === item._id ? { ...p, currentRestockLimit: Number(threshold) } : p
        )
      );

      toast.success(`Limit set to ₹${threshold} for ${item.itemName}`);
    } catch (error) {
      console.error("Failed to save limit", error);
      toast.error("Failed to save limit");
    }
  };

  // Utility to parse missing data from itemName
  const getDisplayValue = (item, field) => {
    if (item[field] && item[field] !== '-' && item[field] !== 'undefined') return item[field];

    const name = item.itemName || '';

    if (field === 'wattage') {
      const match = name.match(/(\d+(?:\.\d+)?)\s*W/i);
      if (match) return match[1];
    }
    if (field === 'technology') {
      const techKeywords = ['Mono Perc', 'Polycrystalline', 'Bifacial', 'Half Cut', 'Mono', 'Poly', 'Thin Film'];
      const found = techKeywords.find(tech => new RegExp(tech, 'i').test(name));
      if (found) {
        // Normalize commonly used terms
        return found.toLowerCase() === 'mono perc' ? 'Mono Perc' : found;
      }
    }
    if (field === 'kitType') {
      if (name.includes('+')) {
        // Attempt to extract Brands connected by +
        const parts = name.split('+');
        if (parts.length >= 2) {
          const left = parts[0].trim().split(' ').pop(); // last word before +
          const right = parts[1].trim().split(' ')[0]; // first word after +
          return `${left} + ${right}`;
        }
      }
    }
    return '-';
  };

  // Get unique products to display in cards based on SKU or itemName
  const uniqueProductsForCards = products.reduce((acc, current) => {
    // Only add if we haven't already added a product with the same SKU or itemName for this location
    const destName = `${current.state?.name || 'Unknown'} - ${current.district?.name || 'Unknown'}`;
    const isDuplicate = acc.find(item => {
      const itemDest = `${item.state?.name || 'Unknown'} - ${item.district?.name || 'Unknown'}`;
      if (itemDest !== destName) return false;
      return (item.sku && item.sku === current.sku) ||
        (!item.sku && item.itemName === current.itemName);
    });

    if (!isDuplicate) {
      acc.push(current);
    }
    return acc;
  }, []);

  // --- Component ---
  return (
    <div className="container mx-auto px-4 py-8 bg-[#f4f6fa] min-h-screen">
      {/* Header */}
      <div className="bg-white rounded shadow-sm border border-gray-100 mb-8 p-6 pb-4">
        <h2 className="text-2xl font-bold text-[#1c2434] mb-2">Inventory Restock Limit Setting</h2>
        <button
          onClick={() => setShowLocationSection(!showLocationSection)}
          className="text-[#3c50e0] hover:text-blue-700 text-sm flex items-center"
        >
          {showLocationSection ? (
            <><EyeOff size={14} className="mr-1.5" /> Hide Location Cards</>
          ) : (
            <><Eye size={14} className="mr-1.5" /> Show Location Cards</>
          )}
        </button>
      </div>

      {/* Location Selection Section */}
      <div className={`transition-all duration-300 overflow-hidden ${showLocationSection ? 'max-h-[1000px] opacity-100 mb-10' : 'max-h-0 opacity-0'}`}>
        <h3 className="text-[#1c2434] text-xl font-bold mb-5">Select State</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {states.map(state => (
            <div
              key={state._id}
              className={`cursor-pointer bg-white rounded shadow-sm py-6 px-4 flex flex-col items-center justify-center transition-all ${selectedState === state._id ? 'border-2 border-[#1c2434] bg-gray-50' : 'border border-gray-100 hover:shadow-md'
                }`}
              onClick={() => handleStateSelect(state._id)}
            >
              <h4 className="text-[#1c2434] text-[17px] font-bold mb-1">{state.name}</h4>
              <span className="text-gray-500 text-[13px] font-semibold">{state.code || 'N/A'}</span>
            </div>
          ))}
          {states.length === 0 && <div className="col-span-4 text-sm text-gray-500">Loading states...</div>}
        </div>
      </div>

      {/* Table Section */}
      <h3 className="text-[22px] font-bold text-[#206bc4] mb-4">Inventory Restock Order Approval Table</h3>
      <div className="bg-white rounded overflow-hidden shadow-sm border border-gray-100 mb-12">
        <div className="overflow-x-auto">
          <table className="w-full text-[14px] text-left align-middle whitespace-nowrap">
            <thead className="bg-[#75baff] text-white">
              <tr>
                <th className="py-3 px-4 font-semibold border-r border-[#6eb0ff]">Product</th>
                <th className="py-3 px-4 font-semibold border-r border-[#6eb0ff]">Brand</th>
                <th className="py-3 px-4 font-semibold border-r border-[#6eb0ff]">Combokit Selection</th>
                <th className="py-3 px-4 font-semibold border-r border-[#6eb0ff]">Technology</th>
                <th className="py-3 px-4 font-semibold border-r border-[#6eb0ff]">Watt</th>
                <th className="py-3 px-4 font-semibold border-r border-[#6eb0ff] min-w-[200px]">Restock Order Limit (₹)</th>
                <th className="py-3 px-4 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center"><Loader className="animate-spin mx-auto text-blue-500" /></td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-gray-500">No inventory items found.</td></tr>
              ) : (
                products.map((item) => (
                  <tr key={item._id} className="bg-white hover:bg-gray-50 transition-colors">
                    <td className="py-3.5 px-4 border-r border-gray-200 text-[#1c2434] font-medium">{item.itemName}</td>
                    <td className="py-3.5 px-4 border-r border-gray-200 text-[#1c2434]">{item.brand?.brandName || '-'}</td>
                    <td className="py-3.5 px-4 border-r border-gray-200 text-[#1c2434]">{getDisplayValue(item, 'kitType')}</td>
                    <td className="py-3.5 px-4 border-r border-gray-200 text-[#1c2434] font-medium">{getDisplayValue(item, 'technology')}</td>
                    <td className="py-3.5 px-4 border-r border-gray-200 text-[#1c2434] font-medium">{getDisplayValue(item, 'wattage')}</td>
                    <td className="py-3.5 px-4 border-r border-gray-200">
                      <input
                        type="number"
                        className="w-[90%] outline-none border border-gray-300 rounded focus:border-[#206bc4] text-gray-600 px-3 py-1.5 placeholder-gray-400"
                        placeholder="Enter ₹ amount"
                        value={limitInputs[item._id] ?? ''}
                        onChange={(e) => handleAmountChange(item._id, e.target.value)}
                      />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleSaveLimit(item)}
                        className="px-4 py-1.5 bg-[#6c757d] text-white text-[13px] rounded hover:bg-[#5a6268] transition-colors"
                      >
                        Done
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cards Section */}
      {!loading && uniqueProductsForCards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 relative">
          {uniqueProductsForCards.map((item, index) => {
            const locationName = `${item.state?.name || 'Unknown State'} - ${item.district?.name || 'Unknown District'}`;
            return (
              <div key={item._id || index} className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
                {/* Card Header matching the image green style */}
                <div className="bg-[#28a745] text-[#1c2434] py-3.5 px-5 font-bold text-[17px]">
                  {locationName}
                </div>
                {/* Card Content */}
                <div className="p-5 flex flex-col gap-3.5 flex-grow bg-white text-[14px]">
                  <div className="text-gray-700">
                    Product : <span className="font-bold text-[#1c2434]">{item.itemName}</span>
                  </div>
                  <div className="text-gray-700">
                    Brand : <span className="font-bold text-[#1c2434]">{item.brand?.brandName || '-'}</span>
                  </div>
                  <div className="text-gray-700">
                    Combokit : <br />
                    <span className="font-bold text-[#1c2434]">{getDisplayValue(item, 'kitType')}</span>
                  </div>
                  <div className="text-gray-700">
                    Technology : <span className="font-bold text-[#1c2434]">{getDisplayValue(item, 'technology')}</span>
                  </div>
                  <div className="text-gray-700">
                    Watt : <span className="font-bold text-[#1c2434]">{getDisplayValue(item, 'wattage')}</span>
                  </div>
                  <div className="text-gray-700 mt-2">
                    Restock Order Limit : <br />
                    <span className="font-bold text-[#1c2434]">{item.currentRestockLimit || 0}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer / Copyright similar to image */}
      <div className="mt-8 bg-white py-4 rounded shadow-sm border border-gray-100 flex justify-center items-center">
        <span className="text-[14px] text-[#1c2434] font-medium">Copyright © {new Date().getFullYear()} Solarkits. All Rights Reserved.</span>
      </div>

    </div>
  );
};

export default InventoryRestockLimit;

// CSS for animations
const styles = `
.animate-fadeIn {
  animation: fadeIn 0.3s ease-in-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}
`;
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}