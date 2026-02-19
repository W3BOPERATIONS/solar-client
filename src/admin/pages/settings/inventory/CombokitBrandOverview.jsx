// CombokitBrandOverview.jsx
import React, { useState, useEffect } from 'react';
import { Search, Package, MapPin, Loader, AlertCircle } from 'lucide-react';
import { locationAPI } from '../../../../api/api';
import inventoryApi from '../../../../services/inventory/inventoryApi';
import toast from 'react-hot-toast';

const CombokitBrandOverview = () => {
  // --- State Management ---
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');

  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);

  const [data, setData] = useState([]); // Brand Overview Data
  const [loading, setLoading] = useState(false);
  const [cpType, setCpType] = useState('Franchisee'); // Replicates existing toggle

  // Load Initial States
  useEffect(() => {
    loadStates();
  }, []);

  // Fetch Overview when location selected
  useEffect(() => {
    if (selectedDistrict) {
      fetchOverview();
    } else {
      setData([]);
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

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const params = {
        state: selectedState,
        city: selectedCity,
        district: selectedDistrict
      };
      const response = await inventoryApi.getBrandOverview(params);

      // The backend returns { _id: "ProductName", brands: [{ brandName, logo, skus }] }
      // We need to map this to the UI structure.
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

  // --- Component ---
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <h4 className="text-blue-600 text-xl font-semibold mb-4 md:mb-0">Combokit Brand SKU Overview</h4>

          <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
            {['Franchisee', 'Dealer'].map((type) => (
              <button
                key={type}
                onClick={() => setCpType(type)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${cpType === type
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* State Selection */}
        <div className="mb-6">
          <h6 className="text-gray-600 font-medium mb-3 flex items-center">
            <MapPin size={18} className="mr-2" /> Select State
          </h6>
          <div className="flex flex-wrap gap-2">
            {states.map(state => (
              <button
                key={state._id}
                onClick={() => handleStateSelect(state._id)}
                className={`px-4 py-2 rounded-lg border transition-all ${selectedState === state._id
                  ? 'bg-blue-500 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                  }`}
              >
                {state.name}
              </button>
            ))}
          </div>
        </div>

        {/* City Selection */}
        {cities.length > 0 && (
          <div className="mb-6 animate-fadeIn">
            <h6 className="text-gray-600 font-medium mb-3 flex items-center">
              <MapPin size={18} className="mr-2" /> Select City
            </h6>
            <div className="flex flex-wrap gap-2">
              {cities.map(city => (
                <button
                  key={city._id}
                  onClick={() => handleCitySelect(city._id)}
                  className={`px-4 py-2 rounded-lg border transition-all ${selectedCity === city._id
                    ? 'bg-indigo-500 text-white border-indigo-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'
                    }`}
                >
                  {city.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* District Selection */}
        {districts.length > 0 && (
          <div className="mb-8 animate-fadeIn">
            <h6 className="text-gray-600 font-medium mb-3 flex items-center">
              <MapPin size={18} className="mr-2" /> Select District
            </h6>
            <div className="flex flex-wrap gap-2">
              {districts.map(district => (
                <button
                  key={district._id}
                  onClick={() => handleDistrictSelect(district._id)}
                  className={`px-4 py-2 rounded-lg border transition-all ${selectedDistrict === district._id
                    ? 'bg-green-500 text-white border-green-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-green-300'
                    }`}
                >
                  {district.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Overview Cards/Table */}
      {selectedDistrict && (
        <div className="grid grid-cols-1 gap-6">
          {loading ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <Loader className="animate-spin mx-auto text-blue-500" size={32} />
              <p className="mt-2 text-gray-500">Loading overview...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <AlertCircle className="mx-auto text-gray-300" size={48} />
              <p className="mt-2 text-gray-500">No data found for this location.</p>
            </div>
          ) : (
            data.map((item, index) => (
              <div key={index} className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                <h5 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">
                  {item._id} {/* Product Name */}
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {item.brands.map((brand, bIndex) => (
                    <div key={bIndex} className="bg-gray-50 rounded-lg p-4 flex justify-between items-center hover:bg-gray-100 transition-colors">
                      <div>
                        <p className="font-semibold text-gray-700">{brand.brandName}</p>
                        <p className="text-xs text-gray-500">Available SKUs</p>
                      </div>
                      <div className="bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full">
                        {brand.skus}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default CombokitBrandOverview;

const styles = `
.animate-fadeIn {
  animation: fadeIn 0.4s ease-out forwards;
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