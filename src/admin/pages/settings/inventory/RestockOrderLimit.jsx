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
    <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center">
            <div className="w-full h-full flex justify-between items-center">
              <h3 className="text-xl font-semibold mb-0 text-blue-600">Inventory Restock Order Approval Table</h3>
              <button
                onClick={() => setShowLocationSection(!showLocationSection)}
                className="px-4 py-2 border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 flex items-center"
              >
                {showLocationSection ? (
                  <>
                    <EyeOff size={16} className="mr-2" />
                    Hide Location Filters
                  </>
                ) : (
                  <>
                    <Eye size={16} className="mr-2" />
                    Show Location Filters
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Location Selection Section */}
      <div className={`transition-all duration-500 overflow-hidden ${showLocationSection ? 'max-h-[2000px] opacity-100 mb-8' : 'max-h-0 opacity-0'}`}>
        {/* State Selection */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold mb-2 text-gray-700">Select State</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {states.map(state => (
              <div
                key={state._id}
                className={`cursor-pointer bg-white rounded-lg border p-3 text-center transition-all duration-200 hover:shadow ${selectedState === state._id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                onClick={() => handleStateSelect(state._id)}
              >
                <h5 className="font-semibold text-sm">{state.name}</h5>
              </div>
            ))}
            {states.length === 0 && <div className="col-span-4 text-sm text-gray-500">Loading states...</div>}
            {selectedState && (
              <div 
                className="cursor-pointer bg-red-50 text-red-600 rounded-lg border border-red-200 p-3 text-center hover:bg-red-100"
                onClick={() => handleStateSelect(selectedState)}
              >
                <h5 className="font-semibold text-sm">Clear State</h5>
              </div>
            )}
          </div>
        </div>

        {/* City/Cluster Selection */}
        {selectedState && (
          <div className={`mb-4 animate-fadeIn`}>
            <h4 className="text-sm font-semibold mb-2 text-gray-700">Select City</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {cities.map(city => (
                <div
                  key={city._id}
                  className={`cursor-pointer bg-white rounded-lg border p-3 text-center transition-all duration-200 hover:shadow ${selectedCity === city._id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                  onClick={() => handleCitySelect(city._id)}
                >
                  <h6 className="font-semibold text-sm">{city.name}</h6>
                </div>
              ))}
              {cities.length === 0 && <div className="col-span-4 text-sm text-gray-400">No cities found</div>}
            </div>
          </div>
        )}

        {/* District Selection */}
        {selectedCity && (
          <div className={`mb-4 animate-fadeIn`}>
            <h4 className="text-sm font-semibold mb-2 text-gray-700">Select District</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {districts.map(district => (
                <div
                  key={district._id}
                  className={`cursor-pointer bg-white rounded-lg border p-3 text-center transition-all duration-200 hover:shadow ${selectedDistrict === district._id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                  onClick={() => handleDistrictSelect(district._id)}
                >
                  <h6 className="font-semibold text-sm">{district.name}</h6>
                </div>
              ))}
              {districts.length === 0 && <div className="col-span-4 text-sm text-gray-400">No districts found</div>}
            </div>
          </div>
        )}
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-10">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#66b2ff] text-white">
              <tr>
                <th className="py-4 px-4 font-semibold border-b border-blue-400 border-r">Product</th>
                <th className="py-4 px-4 font-semibold border-b border-blue-400 border-r">Brand</th>
                <th className="py-4 px-4 font-semibold border-b border-blue-400 border-r">Combokit Selection</th>
                <th className="py-4 px-4 font-semibold border-b border-blue-400 border-r">Technology</th>
                <th className="py-4 px-4 font-semibold border-b border-blue-400 border-r">Watt</th>
                <th className="py-4 px-4 font-semibold border-b border-blue-400 border-r min-w-[200px]">Restock Order Limit (₹)</th>
                <th className="py-4 px-4 font-semibold border-b border-blue-400">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center"><Loader className="animate-spin mx-auto text-blue-500" /></td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-gray-500">No inventory items found.</td></tr>
              ) : (
                products.map((item) => (
                  <tr key={item._id} className="border-b hover:bg-gray-50 bg-white">
                    <td className="py-4 px-4 border-r text-gray-800">{item.itemName}</td>
                    <td className="py-4 px-4 border-r text-gray-800">{item.brand?.brandName || '-'}</td>
                    <td className="py-4 px-4 border-r text-gray-800">{getDisplayValue(item, 'kitType')}</td>
                    <td className="py-4 px-4 border-r text-gray-800">{getDisplayValue(item, 'technology')}</td>
                    <td className="py-4 px-4 border-r text-gray-800">{getDisplayValue(item, 'wattage')}</td>
                    <td className="py-3 px-4 border-r">
                      <input
                        type="number"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Enter ₹ amount"
                        value={limitInputs[item._id] ?? ''}
                        onChange={(e) => handleAmountChange(item._id, e.target.value)}
                      />
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleSaveLimit(item)}
                        className="px-5 py-1.5 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors font-medium"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {uniqueProductsForCards.map((item, index) => {
            const locationName = `${item.state?.name || 'Unknown State'} - ${item.district?.name || 'Unknown District'}`;
            return (
              <div key={item._id || index} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 flex flex-col h-full">
                {/* Card Header matching the image green style */}
                <div className="bg-[#2ca64b] text-white py-3 px-4 font-bold text-lg">
                  {locationName}
                </div>
                {/* Card Content */}
                <div className="p-4 flex flex-col gap-6 flex-grow">
                  <div className="flex flex-col gap-1.5 text-sm text-gray-800">
                    <div className="grid grid-cols-[120px_1fr] gap-2">
                      <span className="font-medium">Product :</span>
                      <span className="font-semibold">{item.itemName}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-2">
                      <span className="font-medium">Brand :</span>
                      <span className="font-semibold">{item.brand?.brandName || '-'}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-2">
                      <span className="font-medium">Combokit :</span>
                      <span className="font-semibold">{getDisplayValue(item, 'kitType')}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-2">
                      <span className="font-medium">Technology :</span>
                      <span className="font-semibold">{getDisplayValue(item, 'technology')}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-2">
                      <span className="font-medium">Watt :</span>
                      <span className="font-semibold">{getDisplayValue(item, 'wattage')}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-2 mt-1">
                      <span className="font-medium">Restock Order Limit :</span>
                      <span className="font-bold text-gray-900">{item.currentRestockLimit || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer / Copyright similar to image */}
      <div className="mt-12 text-center text-sm text-gray-500 py-4 border-t border-gray-200">
        Copyright © {new Date().getFullYear()} Solarkits. All Rights Reserved.
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