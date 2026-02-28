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

// Helper for placeholder images using inline SVG to prevent network errors
const getPlaceholderImage = (type) => {
  const text = type === 'panel' ? 'Panel' : type === 'inverter' ? 'Inverter' : type === 'boskit' ? 'BOS Kit' : 'Image';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="40"><rect width="60" height="40" fill="#e2e8f0"/><text x="50%" y="50%" fill="#64748b" font-size="10" font-family="sans-serif" font-weight="bold" text-anchor="middle" dominant-baseline="middle">${text}</text></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
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
    { value: 'Dealer', label: 'Dealer' },
    { value: 'Channel Partner', label: 'Channel Partner' }
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
    fetchAssignments(); // Load all by default
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
      const params = cityId ? { city: cityId } : {};
      const response = await getAssignments(params);
      setCombokits(response || []);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      showNotification("Error loading assignments");
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
    // Flatten assignments into individual combokits
    const flattenedCombokits = combokits.flatMap(assignment => {
      if (!assignment.comboKits || assignment.comboKits.length === 0) return [];
      return assignment.comboKits.map((kit, index) => ({
        ...assignment,          // Contains assignment level info (districts, role, cpTypes, status, category etc)
        comboKitData: kit,      // The individual kit details (name, panelBrand, etc)
        uniqueId: `${assignment._id}-${index}`
      }));
    });

    return flattenedCombokits.filter(item => {
      // Category fields are on the assignment level
      if (filters.category && item.category !== filters.category) return false;
      if (filters.subCategory && item.subCategory !== filters.subCategory) return false;
      if (filters.subProjectType && item.subProjectType !== filters.subProjectType) return false;
      if (filters.projectType && item.projectType !== filters.projectType) return false;

      // District Filter (MultiSelect)
      if (selectedDistricts.length > 0 && item.districts) {
        // item.districts usually populated array of objects, map to IDs for check
        const assignmentDistrictIds = item.districts.map(d => typeof d === 'object' ? d._id : d);
        const hasDistrictMatch = selectedDistricts.some(d => assignmentDistrictIds.includes(d));
        if (!hasDistrictMatch) return false;
      }

      // User Type (Role / CP Type) Filter
      if (selectedUserTypes.length > 0) {
        if (!selectedUserTypes.includes(item.role)) {
          // Fallback to cpTypes array if role isn't definitively set
          const hasCpTypeMatch = selectedUserTypes.some(type => item.cpTypes?.includes(type));
          if (!hasCpTypeMatch) return false;
        }
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
      <div className="mb-6">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Select a State</label>
        {loading && !states.length ? (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {states.map((state) => (
              <div
                key={state._id}
                className={`p-5 rounded-xl border-2 cursor-pointer transition-all duration-300 group ${selectedState?._id === state._id
                  ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:shadow-md'
                  }`}
                onClick={() => handleStateSelect(state)}
              >
                <div className="flex flex-col items-center justify-center text-center">
                  <span className="text-xs font-bold leading-tight">{state.name}</span>
                  <span className={`text-[10px] font-black uppercase tracking-tighter mt-1 ${selectedState?._id === state._id ? 'text-indigo-100' : 'text-slate-400'}`}>
                    {state.code}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* City Selection */}
      {selectedState && (
        <div className="mb-8 animate-fadeIn">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">
            Select a City - {selectedState.name}
          </label>
          {cities.length === 0 && !loading ? (
            <div className="p-8 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No cities found for this state.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {cities.map((city) => (
                <div
                  key={city._id}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer text-center ${selectedCity?._id === city._id
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:shadow-md'
                    }`}
                  onClick={() => handleCitySelect(city)}
                >
                  <span className="text-xs font-bold">{city.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filter Section */}
      <div className="p-6 bg-white rounded-xl shadow-md border border-gray-100 animate-fadeIn mb-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          {/* Category */}
          <div className="md:col-span-3">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
              Category
            </label>
            <select
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
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
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
              Sub Category
            </label>
            <select
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
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
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
              Sub Project Type
            </label>
            <select
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
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
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
              Project Type / Capacity
            </label>
            <select
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
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
          <div className="md:col-span-4">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
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
          <div className="md:col-span-4">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
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
          <div className="md:col-span-4 flex items-end">
            <button
              className="w-full px-6 py-2.5 text-[11px] font-black uppercase tracking-widest text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
              onClick={() => {
                showNotification('Filters applied locally');
              }}
            >
              <Filter size={14} />
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Overview Section */}
      <div className="animate-fadeIn">
        <div className="p-6 bg-white rounded-xl shadow-md border border-gray-100 mt-6">
          <div className="flex flex-col justify-between mb-6 md:flex-row md:items-center">
            <div>
              <h5 className="text-xl font-bold text-slate-800">Combokit Overview</h5>
              <p className="text-sm text-slate-500 mt-1">Manage and monitor all combo kit assignments</p>
            </div>
            <div className="flex items-center gap-3">
              {selectedState && selectedCity && (
                <span className="px-4 py-1.5 text-xs font-black uppercase tracking-widest text-white bg-indigo-600 rounded-lg shadow-sm">
                  {selectedState?.name} &gt; {selectedCity.name}
                </span>
              )}
              <button
                className="px-4 py-2 text-xs font-black uppercase tracking-widest border-2 border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all flex items-center gap-2"
                onClick={handleViewOverview}
              >
                <Eye size={14} />
                View Overview
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            {filteredCombokits.length === 0 ? (
              <div className="text-center py-20 bg-slate-50">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search size={32} className="text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-700">No combokits found</h3>
                <p className="text-sm text-slate-400 max-w-xs mx-auto mt-1">Adjust your filters or selection to find what you're looking for.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500">combokit Name</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Panel</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Inverter</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Boskit</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500">District</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Partner</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Sales Volume</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Toggle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCombokits.map((item) => {
                    const kit = item.comboKitData;
                    // Get first district name for display if available
                    const districtName = item.districts && item.districts.length > 0
                      ? (typeof item.districts[0] === 'object' ? item.districts[0].name : 'District IDs Available')
                      : '-';

                    return (
                      <tr key={item.uniqueId} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="p-4">
                          <span className="text-sm font-bold text-slate-700">{kit.name || 'Standard Kit'}</span>
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                              <img src={kit.image || getPlaceholderImage('panel')} alt="Panel" className="w-6 h-6 object-cover rounded" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-600">{kit.panelBrand || 'Not Specified'}</span>
                              <span className="text-[9px] font-medium text-slate-400">{kit.panelSkus?.length || 0} SKUs</span>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                              <img src={getPlaceholderImage('inverter')} alt="Inverter" className="w-6 h-6 object-contain" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-600">{kit.inverterBrand || 'Not Specified'}</span>
                              <span className="text-[9px] font-medium text-slate-400">Brand only</span>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                              <img src={getPlaceholderImage('boskit')} alt="BOS" className="w-6 h-6 object-contain" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-600">BOS Kit Config</span>
                              <span className="text-[9px] font-medium text-slate-400">{kit.bomSections?.length || 0} Sections</span>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <span className="text-xs font-bold text-slate-600">{districtName}</span>
                        </td>

                        <td className="p-4">
                          <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                            {item.role || item.cpTypes?.[0] || 'Startup'}
                          </span>
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black text-white ${getSalesBadgeColor(1250)}`}>
                              1,250 units
                            </span>
                          </div>
                        </td>

                        <td className="p-4">
                          <span className={`text-[10px] font-black uppercase tracking-widest ${item.status === 'Active' ? 'text-emerald-500' : 'text-slate-400'}`}>
                            {item.status}
                          </span>
                        </td>

                        <td className="p-4 text-center">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={item.status === 'Active'}
                              onChange={(e) => toggleStatus(item, e.target.checked)}
                            />
                            <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                          </label>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}