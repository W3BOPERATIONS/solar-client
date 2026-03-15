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
import {
  getAssignments,
  updateAssignment,
  deleteAssignment,
  getCategories,
  getSubCategories,
  getProjectTypes,
  getSubProjectTypes,
  getProjectCategoryMappings,
  getPartnerTypes
} from '../../../../services/combokit/combokitApi';
import { Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

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
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [cities, setCities] = useState([]);
  const [combokits, setCombokits] = useState([]); // Assignments

  // --- Selection States ---
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  
  // Filter states
  const [selectedFilterDistricts, setSelectedFilterDistricts] = useState([]); // Districts selected in filter dropdown
  const [selectedUserTypes, setSelectedUserTypes] = useState([]); 

  // --- Filters ---
  const [filters, setFilters] = useState({
    category: '',
    subCategory: '',
    subProjectType: '', 
    projectType: '' 
  });

  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // --- Master Data States ---
  const [masterCategories, setMasterCategories] = useState([]);
  const [masterSubCategories, setMasterSubCategories] = useState([]);
  const [masterProjectTypes, setMasterProjectTypes] = useState([]);
  const [masterSubProjectTypes, setMasterSubProjectTypes] = useState([]);
  const [projectMappings, setProjectMappings] = useState([]);
  const [masterPartnerTypes, setMasterPartnerTypes] = useState([]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;
    try {
      setLoading(true);
      await deleteAssignment(id);
      toast.success('Assignment deleted successfully');
      fetchAssignments(selectedCity?._id);
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast.error('Failed to delete assignment');
    } finally {
      setLoading(false);
    }
  };

  // --- Options Maps (for UI filters) ---
  const userTypeOptions = masterPartnerTypes.map(p => ({
    value: p.name,
    label: p.name
  }));

  const getSubCategoryOptions = () => {
    if (!filters.category) return [];
    const selCat = masterCategories.find(c => c.name === filters.category);
    if (!selCat) return [];
    return masterSubCategories
      .filter(sub => {
        const subCatId = sub.categoryId?._id || sub.categoryId;
        return subCatId === selCat._id;
      })
      .map(sub => ({ value: sub.name, label: sub.name }));
  };

  const getProjectTypeOptions = () => {
    if (projectMappings?.length > 0) {
      const selCat = masterCategories.find(c => c.name === filters.category);
      const selSubCat = masterSubCategories.find(sc => sc.name === filters.subCategory);
      
      return projectMappings
        .filter(m => {
          const mCatId = m.categoryId?._id || m.categoryId;
          const mSubCatId = m.subCategoryId?._id || m.subCategoryId;
          return (!selCat || mCatId === selCat._id) && (!selSubCat || mSubCatId === selSubCat._id);
        })
        .map(m => `${m.projectTypeFrom} to ${m.projectTypeTo} kW`)
        .filter((v, i, a) => a.indexOf(v) === i)
        .map(pt => ({ value: pt, label: pt }));
    }
    return masterProjectTypes.map(pt => ({ value: pt.name, label: pt.name }));
  };

  // --- Initial Load ---
  useEffect(() => {
    fetchCountries();
    fetchAssignments(); // Load all by default
    fetchMasterData();
  }, []);

  const fetchMasterData = async () => {
    try {
      const [cats, subCats, projs, subProjs, mappings, partners] = await Promise.all([
        getCategories(),
        getSubCategories(),
        getProjectTypes(),
        getSubProjectTypes(),
        getProjectCategoryMappings(),
        getPartnerTypes()
      ]);

      setMasterCategories(cats || []);
      setMasterSubCategories(subCats || []);
      setMasterProjectTypes(projs || []);
      setMasterSubProjectTypes(subProjs || []);
      setProjectMappings(mappings || []);
      setMasterPartnerTypes(partners || []);
    } catch (err) {
      console.error("Error fetching master data:", err);
    }
  };

  const fetchCountries = async () => {
    try {
      setLoading(true);
      const response = await locationAPI.getAllCountries({ isActive: true });
      if (response.data && response.data.data) {
        setCountries(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching countries:", error);
      showNotification("Error loading countries");
    } finally {
      setLoading(false);
    }
  };

  const fetchStates = async (countryId) => {
    try {
      setLoading(true);
      const response = await locationAPI.getAllStates({ countryId, isActive: true });
      if (response.data && response.data.data) {
        setStates(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching states:", error);
      showNotification("Error loading states");
    } finally {
      setLoading(false);
    }
  };

  const fetchClusters = async (stateId) => {
    try {
      setLoading(true);
      const response = await locationAPI.getAllClusters({ stateId, isActive: true });
      if (response.data && response.data.data) {
        setClusters(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching clusters:", error);
      showNotification("Error loading clusters");
    } finally {
      setLoading(false);
    }
  };

  const fetchDistricts = async (clusterId) => {
    try {
      setLoading(true);
      const response = await locationAPI.getAllDistricts({ clusterId, isActive: true });
      if (response.data && response.data.data) {
        setDistricts(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching districts:", error);
      showNotification("Error loading districts");
    } finally {
      setLoading(false);
    }
  };

  const fetchCities = async (districtId) => {
    try {
      setLoading(true);
      const response = await locationAPI.getAllCities({ districtId, isActive: true });
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

  const showNotification = (message) => {
    setNotification(message);
  };

  // --- Handlers ---

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setSelectedState(null);
    setSelectedCluster(null);
    setSelectedDistrict(null);
    setSelectedCity(null);
    setStates([]);
    setClusters([]);
    setDistricts([]);
    setCities([]);
    fetchStates(country._id);
  };

  const handleStateSelect = (state) => {
    setSelectedState(state);
    setSelectedCluster(null);
    setSelectedDistrict(null);
    setSelectedCity(null);
    setClusters([]);
    setDistricts([]);
    setCities([]);
    fetchClusters(state._id);
  };

  const handleClusterSelect = (cluster) => {
    setSelectedCluster(cluster);
    setSelectedDistrict(null);
    setSelectedCity(null);
    setDistricts([]);
    setCities([]);
    fetchDistricts(cluster._id);
  };

  const handleDistrictSelect = (district) => {
    setSelectedDistrict(district);
    setSelectedCity(null);
    setCities([]);
    fetchCities(district._id);
  };

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    fetchAssignments(city._id);
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
      if (selectedFilterDistricts.length > 0 && item.districts) {
        // item.districts usually populated array of objects, map to IDs for check
        const assignmentDistrictIds = item.districts.map(d => typeof d === 'object' ? d._id : d);
        const hasDistrictMatch = selectedFilterDistricts.some(d => assignmentDistrictIds.includes(d));
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

      {/* Country Selection */}
      <div className="mb-6">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Select a Country</label>
        {loading && !countries.length ? (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {countries.map((country) => (
              <div
                key={country._id}
                className={`p-5 rounded-xl border-2 cursor-pointer transition-all duration-300 group ${selectedCountry?._id === country._id
                  ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:shadow-md'
                  }`}
                onClick={() => handleCountrySelect(country)}
              >
                <div className="flex flex-col items-center justify-center text-center">
                  <span className="text-xs font-bold leading-tight">{country.name}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* State Selection */}
      {selectedCountry && (
        <div className="mb-6 animate-fadeIn">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">
            Select a State - {selectedCountry.name}
          </label>
          {states.length === 0 && !loading ? (
             <div className="p-4 bg-slate-50 rounded-lg border border-dashed border-slate-300 text-center">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">No states found for this country.</p>
             </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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
      )}

      {/* Cluster Selection */}
      {selectedState && (
        <div className="mb-6 animate-fadeIn">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">
            Select a Cluster - {selectedState.name}
          </label>
          {clusters.length === 0 && !loading ? (
            <div className="p-4 bg-slate-50 rounded-lg border border-dashed border-slate-300 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">No clusters found for this state.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {clusters.map((cluster) => (
                <div
                  key={cluster._id}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer text-center ${selectedCluster?._id === cluster._id
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:shadow-md'
                    }`}
                  onClick={() => handleClusterSelect(cluster)}
                >
                  <span className="text-xs font-bold">{cluster.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* District Selection */}
      {selectedCluster && (
        <div className="mb-6 animate-fadeIn">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">
            Select a District - {selectedCluster.name}
          </label>
          {districts.length === 0 && !loading ? (
            <div className="p-4 bg-slate-50 rounded-lg border border-dashed border-slate-300 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">No districts found for this cluster.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {districts.map((district) => (
                <div
                  key={district._id}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer text-center ${selectedDistrict?._id === district._id
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:shadow-md'
                    }`}
                  onClick={() => handleDistrictSelect(district)}
                >
                  <span className="text-xs font-bold">{district.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* City Selection */}
      {selectedDistrict && (
        <div className="mb-8 animate-fadeIn">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">
            Select a City - {selectedDistrict.name}
          </label>
          {cities.length === 0 && !loading ? (
            <div className="p-8 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No cities found for this district.</p>
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
              onChange={(e) => setFilters({ ...filters, category: e.target.value, subCategory: '' })}
            >
              <option value="">All Categories</option>
              {masterCategories.map(cat => (
                <option key={cat._id} value={cat.name}>
                  {cat.name}
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
              <option value="">All Sub Categories</option>
              {getSubCategoryOptions().map(option => (
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
              <option value="">All Sub Types</option>
              {masterSubProjectTypes.map(spt => (
                <option key={spt._id} value={spt.name}>
                  {spt.name}
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
              <option value="">Select Project Type</option>
              {getProjectTypeOptions().map(option => (
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
              selected={selectedFilterDistricts}
              onSelect={(value) => setSelectedFilterDistricts([...selectedFilterDistricts, value])}
              onRemove={(value) => setSelectedFilterDistricts(selectedFilterDistricts.filter(d => d !== value))}
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
              {selectedCountry && selectedState && selectedCluster && selectedDistrict && selectedCity && (
                <span className="px-4 py-1.5 text-xs font-black uppercase tracking-widest text-white bg-indigo-600 rounded-lg shadow-sm">
                  {selectedCountry.name} &gt; {selectedState.name} &gt; {selectedCluster.name} &gt; {selectedDistrict.name} &gt; {selectedCity.name}
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
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Actions</th>
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
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => navigate('/admin/settings/combokit/customize')}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(item._id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
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