import React, { useState, useEffect } from 'react';
import {
  Eye,
  Filter,
  X,
  Check,
  AlertCircle,
  Settings,
  Search
} from 'lucide-react';
import { locationAPI } from '../../../../api/api';
import { getAssignments, updateAssignment } from '../../../../services/combokit/combokitApi';

// MultiSelect Component (Kept same)
const MultiSelect = ({ id, placeholder, options = [], selected = [], onSelect, onRemove }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (value) => {
    onSelect(value);
  };

  const handleRemove = (value) => {
    onRemove(value);
  };

  const selectedCount = selected.length;
  const displayText = selectedCount > 0
    ? `${selectedCount} selected`
    : placeholder;

  return (
    <div className="relative w-full">
      <div
        className="flex flex-wrap items-center min-h-[38px] border border-gray-300 rounded-lg px-3 py-1.5 cursor-pointer bg-white gap-2 hover:border-gray-400 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selected.map((value) => {
          const option = options.find(opt => opt.value === value);
          return (
            <span
              key={value}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded"
            >
              {option?.label || value}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(value);
                }}
                className="hover:text-gray-200"
              >
                <X size={12} />
              </button>
            </span>
          );
        })}
        {selected.length === 0 && (
          <span className="text-gray-500">{displayText}</span>
        )}
      </div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {options.map((option) => (
              <div
                key={option.value}
                className={`px-3 py-2 cursor-pointer hover:bg-gray-50 ${selected.includes(option.value) ? 'bg-gray-100 font-medium' : ''
                  }`}
                onClick={() => handleSelect(option.value)}
              >
                {option.label}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// Notification Component (Kept same)
const Notification = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-0 right-0 z-50 p-4">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg">
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <span className="font-medium">Status Update</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
        <div className="px-4 py-3">
          {message}
        </div>
      </div>
    </div>
  );
};

// Helper for placeholder images
const getPlaceholderImage = (type) => {
  switch (type) {
    case 'panel': return "https://via.placeholder.com/60x40?text=Panel";
    case 'inverter': return "https://via.placeholder.com/60x40?text=Inverter";
    case 'boskit': return "https://via.placeholder.com/60x40?text=BOS";
    default: return "https://via.placeholder.com/60x40?text=Image";
  }
};

// Main Component
export default function CombokitOverview() {
  // --- Data States ---
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [combokits, setCombokits] = useState([]); // Assignments

  // --- Selection States ---
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null); // Replaces Cluster
  const [selectedDistricts, setSelectedDistricts] = useState([]);
  const [selectedUserTypes, setSelectedUserTypes] = useState([]); // Replaces CP Type roughly, or maps to it

  // --- Filters ---
  const [filters, setFilters] = useState({
    category: '',
    subCategory: '',
    subProjectType: '', // "On Grid" etc
    projectType: '' // "1kw to 10kw" etc (mapped to capacity?)
  });

  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- Options Maps (for UI filters) ---
  const userTypeOptions = [
    { value: 'Franchisee', label: 'Franchisee' },
    { value: 'Dealer', label: 'Dealer' }
  ];

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    { value: 'Solar Panel', label: 'Solar Panel' },
    { value: 'Solar Light', label: 'Solar Light' },
    { value: 'Solar Pump', label: 'Solar Pump' }
  ];

  const subCategoryOptions = [
    { value: '', label: 'All Sub Categories' },
    { value: 'Residential', label: 'Residential' },
    { value: 'Commercial', label: 'Commercial' }
  ];

  const subProjectTypeOptions = [
    { value: '', label: 'All Sub Types' },
    { value: 'On Grid', label: 'On Grid' },
    { value: 'Off Grid', label: 'Off Grid' },
    { value: 'Hybrid', label: 'Hybrid' }
  ];

  // Map Project Type to Capacity
  const projectTypeOptions = [
    { value: '', label: 'Select Project Type' },
    { value: '1kW - 10kW', label: '1kW - 10kW' },
    { value: '10kW - 15kW', label: '10kW - 15kW' },
    { value: '15kW - 20kW', label: '15kW - 20kW' },
    { value: '20kW - 30kW', label: '20kW - 30kW' },
    { value: '30kW - 50kW', label: '30kW - 50kW' },
    { value: '50kW - 100kW', label: '50kW - 100kW' },
    { value: '100kW and above', label: '100kW and above' }
  ];

  // --- Initial Load ---
  useEffect(() => {
    fetchStates();
  }, []);

  const fetchStates = async () => {
    try {
      const response = await locationAPI.getAllStates({ isActive: true });
      if (response.data && response.data.data) {
        setStates(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching states:", error);
      showNotification("Error loading states");
    }
  };

  const showNotification = (message) => {
    setNotification(message);
  };

  // --- Handlers ---

  const handleStateSelect = async (state) => {
    setSelectedState(state);
    setSelectedCity(null);
    setCities([]);
    setSelectedDistricts([]);
    setDistricts([]);
    setCombokits([]);

    // Fetch Cities for State
    try {
      setLoading(true);
      const response = await locationAPI.getAllCities({ stateId: state._id, isActive: true });
      if (response.data && response.data.data) {
        setCities(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching cities:", error);
      showNotification("Error loading cities");
    } finally {
      setLoading(false);
    }
  };

  const handleCitySelect = async (city) => {
    setSelectedCity(city);
    setSelectedDistricts([]);
    setDistricts([]);

    // Fetch Districts for City
    try {
      setLoading(true);
      const response = await locationAPI.getAllDistricts({ cityId: city._id, isActive: true });
      if (response.data && response.data.data) {
        setDistricts(response.data.data);
      }
      // Fetch Assignments for City
      fetchAssignments(city._id);
    } catch (error) {
      console.error("Error fetching data:", error);
      showNotification("Error loading districts/data");
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async (cityId) => {
    try {
      const response = await getAssignments({ city: cityId });
      // Filter strictly by city at API level, but we can also filter in UI if needed
      // API returns array
      setCombokits(response || []);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    }
  };

  const toggleStatus = async (assignment, isActive) => {
    try {
      const newStatus = isActive ? 'Active' : 'Inactive';
      await updateAssignment(assignment._id, { status: newStatus });

      // Update local state
      setCombokits(prev => prev.map(item =>
        item._id === assignment._id ? { ...item, status: newStatus } : item
      ));

      showNotification(`${assignment.comboKitId?.name} is now ${newStatus}`);
    } catch (error) {
      console.error("Error updating status:", error);
      showNotification("Failed to update status");
    }
  };

  const getSalesBadgeColor = (volume) => {
    // We don't have sales volume in assignment yet, mock or use price/capacity?
    // Using 0 as default
    if (volume > 1500) return 'bg-green-500';
    if (volume > 1000) return 'bg-blue-500';
    if (volume > 500) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  // --- Filtering Logic ---
  const getFilteredCombokits = () => {
    if (!selectedCity) return [];

    return combokits.filter(item => {
      const kit = item.comboKitId;
      if (!kit) return false;

      // Category
      if (filters.category && kit.category !== filters.category) return false;
      // Sub Category
      if (filters.subCategory && kit.subCategory !== filters.subCategory) return false;
      // Sub Project Type
      if (filters.subProjectType && kit.subProjectType !== filters.subProjectType) return false;
      // Project Type (Capacity)
      if (filters.projectType && kit.capacity !== filters.projectType) return false;

      // District Filter (MultiSelect)
      if (selectedDistricts.length > 0) {
        // item.district is populated, check ID or name
        // MultiSelect values are district IDs (we should set them as IDs)
        if (!selectedDistricts.includes(item.district?._id)) return false;
      }

      // User Type (CP Type)
      if (selectedUserTypes.length > 0) {
        if (!selectedUserTypes.includes(item.userType)) return false;
      }

      return true;
    });
  };

  const filteredCombokits = getFilteredCombokits();

  const handleViewOverview = () => {
    if (!selectedState || !selectedCity) {
      showNotification('Please select a state and city first');
      return;
    }
    // Logic for navigation (keep same as before but with IDs)
    console.log('Navigating to overview...', { state: selectedState._id, city: selectedCity._id });
  };

  return (
    <div className="container px-4 py-8 mx-auto">
      {/* Notification */}
      {notification && (
        <Notification
          message={notification}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Title */}
      <div className="p-4 mb-4 bg-white rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold text-blue-600">Combokit Overview</h2>
      </div>

      {/* State Selection */}
      <div className="mb-3 text-lg font-semibold">Select a State</div>
      {loading && !states.length ? (
        <div className="p-4 text-center">Loading Data...</div>
      ) : (
        <div className="grid grid-cols-1 gap-3 mb-8 md:grid-cols-4">
          {states.map((state) => (
            <div
              key={state._id}
              className={`p-6 border rounded-lg cursor-pointer transition-all duration-200 flex flex-col justify-center items-center h-full hover:scale-105 ${selectedState?._id === state._id
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-blue-600'
                }`}
              onClick={() => handleStateSelect(state)}
            >
              <p className="mb-1">{state.name}</p>
              <p className="font-bold">{state.code}</p>
            </div>
          ))}
        </div>
      )}

      {/* City Selection (Replaces Cluster) */}
      {selectedState && (
        <div className="mb-8 animate-fadeIn">
          <div className="mb-3 text-lg font-semibold">
            Select a City - {selectedState.name}
          </div>
          {cities.length === 0 && !loading ? (
            <p className="text-gray-500">No cities found for this state.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              {cities.map((city) => (
                <div
                  key={city._id}
                  className={`p-4 border border-gray-300 rounded-lg cursor-pointer text-center transition-all duration-200 hover:scale-105 ${selectedCity?._id === city._id
                    ? 'bg-[#705ebe] text-white border-[#3d0a77]'
                    : ''
                    }`}
                  onClick={() => handleCitySelect(city)}
                >
                  {city.name}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filter Section */}
      {selectedCity && (
        <div className="p-4 mb-8 bg-gray-50 rounded-lg animate-fadeIn">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
            {/* Category */}
            <div className="md:col-span-3">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                className="w-full p-2 border border-gray-300 rounded-lg"
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              >
                {categoryOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sub Category */}
            <div className="md:col-span-3">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Sub Category
              </label>
              <select
                className="w-full p-2 border border-gray-300 rounded-lg"
                value={filters.subCategory}
                onChange={(e) => setFilters({ ...filters, subCategory: e.target.value })}
              >
                {subCategoryOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sub Project Type */}
            <div className="md:col-span-3">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Sub Project Type
              </label>
              <select
                className="w-full p-2 border border-gray-300 rounded-lg"
                value={filters.subProjectType}
                onChange={(e) => setFilters({ ...filters, subProjectType: e.target.value })}
              >
                {subProjectTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Project Type */}
            <div className="md:col-span-3">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Project Type / Capacity
              </label>
              <select
                className="w-full p-2 border border-gray-300 rounded-lg"
                value={filters.projectType}
                onChange={(e) => setFilters({ ...filters, projectType: e.target.value })}
              >
                {projectTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* District Multi-select */}
            <div className="md:col-span-3">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                District
              </label>
              <MultiSelect
                id="district"
                placeholder="Select Districts"
                options={districts.map(d => ({
                  key: d._id,
                  value: d._id,
                  label: d.name
                }))}
                selected={selectedDistricts}
                onSelect={(value) => setSelectedDistricts([...selectedDistricts, value])}
                onRemove={(value) => setSelectedDistricts(selectedDistricts.filter(d => d !== value))}
              />
            </div>

            {/* CP Type (User Type) Multi-select */}
            <div className="md:col-span-3">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                User Type
              </label>
              <MultiSelect
                id="userType"
                placeholder="Select User Types"
                options={userTypeOptions}
                selected={selectedUserTypes}
                onSelect={(value) => setSelectedUserTypes([...selectedUserTypes, value])}
                onRemove={(value) => setSelectedUserTypes(selectedUserTypes.filter(c => c !== value))}
              />
            </div>

            {/* Apply Filters Button */}
            <div className="md:col-span-3 md:col-start-10">
              <button
                className="w-full px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                onClick={() => {
                  showNotification('Filters applied locally');
                }}
              >
                <Filter size={16} className="inline mr-2" />
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overview Section */}
      {selectedCity && (
        <div className="animate-fadeIn">
          <div className="p-4 bg-white rounded-lg shadow-sm">
            <div className="flex flex-col justify-between mb-4 md:flex-row md:items-center">
              <h5 className="mb-2 text-lg font-medium md:mb-0">Combokit Overview</h5>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 text-sm text-white bg-blue-600 rounded-full">
                  {selectedState?.name} &gt; {selectedCity.name}
                </span>
                <button
                  className="px-3 py-1 text-sm border border-blue-600 rounded-lg hover:bg-blue-50"
                  onClick={handleViewOverview}
                >
                  <Eye size={14} className="inline mr-1" />
                  View Overview
                </button>
              </div>
            </div>

            <div className="overflow-auto max-h-[500px]">
              {filteredCombokits.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No combokits found for this selection.</div>
              ) : (
                <table className="w-full">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="p-3 text-left">Combokit Name</th>
                      <th className="p-3 text-left">Images</th>
                      <th className="p-3 text-left">Info</th>
                      <th className="p-3 text-left">District</th>
                      <th className="p-3 text-left">User Type</th>
                      <th className="p-3 text-left">Price</th>
                      <th className="p-3 text-left">Status</th>
                      <th className="p-3 text-left">Toggle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCombokits.map((assignment) => (
                      <tr key={assignment._id} className="border-b hover:bg-gray-50">
                        <td className="p-3">{assignment.comboKitId?.name || 'Unknown Kit'}</td>

                        {/* Images (Placeholder for now as DB doesn't have them yet) */}
                        <td className="p-3">
                          <div className="flex gap-2">
                            <img
                              src={getPlaceholderImage('panel')}
                              alt="Panel"
                              className="object-contain h-8 w-8"
                              title="Panel"
                            />
                            <img
                              src={getPlaceholderImage('inverter')}
                              alt="Inverter"
                              className="object-contain h-8 w-8"
                              title="Inverter"
                            />
                            <img
                              src={getPlaceholderImage('boskit')}
                              alt="BOS"
                              className="object-contain h-8 w-8"
                              title="BOS"
                            />
                          </div>
                        </td>

                        {/* Info (Product details) */}
                        <td className="p-3 text-sm">
                          <div><span className="font-semibold">Cap:</span> {assignment.comboKitId?.capacity || 'N/A'}</div>
                          <div><span className="font-semibold">Type:</span> {assignment.comboKitId?.subProjectType || 'N/A'}</div>
                        </td>

                        <td className="p-3 capitalize">{assignment.district?.name}</td>

                        <td className="p-3">{assignment.userType}</td>

                        <td className="p-3">
                          ₹ {assignment.price?.toLocaleString()}
                        </td>

                        <td className={`p-3 font-medium ${assignment.status === 'Active' ? 'text-green-600' : 'text-gray-600'}`}>
                          {assignment.status}
                        </td>

                        <td className="p-3">
                          <label className="relative inline-flex items-center cursor-pointer scale-125">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={assignment.status === 'Active'}
                              onChange={(e) => toggleStatus(assignment, e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}