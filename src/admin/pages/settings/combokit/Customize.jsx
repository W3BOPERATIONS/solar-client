import React, { useState, useEffect } from 'react';
import {
  Plus, Eye, Edit, Save, X,
  CheckSquare, XCircle,
  Download, Filter, Trash2
} from 'lucide-react';
import { useLocations } from '../../../../hooks/useLocations';
import { locationAPI } from '../../../../api/api';
import {
  getAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getPartnerTypes,
  getSolarKits,
  getCategories,
  getSubCategories,
  getProjectTypes,
  getSubProjectTypes,
  getProjectCategoryMappings
} from '../../../../services/combokit/combokitApi';
import { getSkus } from '../../../../services/settings/orderProcurementSettingApi';
import Select from 'react-select';
import toast from 'react-hot-toast';

const CustomizeCombokit = () => {
  const { countries, states: allStates, fetchCountries, fetchStates } = useLocations();

  // Custom CSS for refined scrollbars and UI
  const scrollbarStyles = `
    .custom-scrollbar::-webkit-scrollbar {
      width: 5px;
      height: 5px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: #f8fafc;
      border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }
    .table-container {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    }
  `;

  // Default options
  // Master data for dropdowns
  const [panelOptions, setPanelOptions] = useState([]);
  const [inverterOptions, setInverterOptions] = useState([]);
  const [boskitOptions, setBoskitOptions] = useState([]);
  const [solarKitsList, setSolarKitsList] = useState([]);
  const [masterCategories, setMasterCategories] = useState([]);
  const [masterSubCategories, setMasterSubCategories] = useState([]);
  const [masterProjectTypes, setMasterProjectTypes] = useState([]);
  const [masterSubProjectTypes, setMasterSubProjectTypes] = useState([]);
  const [projectMappings, setProjectMappings] = useState([]);

  const [lastSavedConfig, setLastSavedConfig] = useState(null);
  const [showSummary, setShowSummary] = useState(false);

  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCountryName, setSelectedCountryName] = useState('');
  const [selectedStates, setSelectedStates] = useState(new Set());
  const [selectedClusters, setSelectedClusters] = useState(new Set());
  const [selectedDistricts, setSelectedDistricts] = useState(new Set());
  const [selectedRoles, setSelectedRoles] = useState(new Set());
  const [partners, setPartners] = useState([]);

  // Data Cache (ID -> Data)
  const [availableClusters, setAvailableClusters] = useState({}); // stateId -> [clusters]
  const [availableDistricts, setAvailableDistricts] = useState({}); // clusterId -> [districts]

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState({});
  const [modalContent, setModalContent] = useState(null);
  const [modalType, setModalType] = useState(null); // 'view', 'cluster', 'district'

  const [showConfigureModal, setShowConfigureModal] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    solarkitName: '',
    panels: [],
    inverters: [],
    boskits: [],
    role: '',
    category: '',
    subCategory: '',
    projectType: '',
    subProjectType: '',
    state: null,
    cluster: null,
    districts: []
  });
  const [currentAssignment, setCurrentAssignment] = useState(null);

  // Initial Data
  useEffect(() => {
    fetchCountries();
    fetchPartners();
    fetchAssignments();
    fetchMasterData();
  }, []);

  const fetchMasterData = async () => {
    try {
      const [kits, cats, subCats, projs, subProjs, panels, inverters, bos, mappings] = await Promise.all([
        getSolarKits(),
        getCategories(),
        getSubCategories(),
        getProjectTypes(),
        getSubProjectTypes(),
        getSkus({ category: 'Solar Panel' }),
        getSkus({ category: 'Inverter' }),
        getSkus({ category: 'BOS' }),
        getProjectCategoryMappings()
      ]);

      setSolarKitsList(kits || []);
      setMasterCategories(cats || []);
      setMasterSubCategories(subCats || []);

      // Derive unique project types from mappings if available, else use generic projs
      const uniqueProjectTypes = (mappings?.length > 0)
        ? Array.from(new Set(mappings.map(m => `${m.projectTypeFrom} to ${m.projectTypeTo} kW`))).filter(Boolean).sort()
        : projs?.map(p => p.name) || [];

      setMasterProjectTypes(uniqueProjectTypes);
      setMasterSubProjectTypes(subProjs || []);
      setProjectMappings(mappings || []);

      const pData = Array.isArray(panels) ? panels : panels?.data || [];
      const iData = Array.isArray(inverters) ? inverters : inverters?.data || [];
      const bData = Array.isArray(bos) ? bos : bos?.data || [];

      setPanelOptions(pData.map(p => p.skuName || p.name));
      setInverterOptions(iData.map(i => i.skuName || i.name));
      setBoskitOptions(bData.map(b => b.skuName || b.name));
    } catch (err) {
      console.error("Error fetching master data", err);
    }
  };

  const fetchPartners = async () => {
    try {
      const data = await getPartnerTypes();
      setPartners(data || []);
    } catch (err) {
      console.error("Error fetching partners", err);
    }
  };

  // When countries load, auto-select India if available
  useEffect(() => {
    if (countries.length > 0 && !selectedCountry) {
      const india = countries.find(c => c.name === 'India');
      if (india) {
        handleCountrySelect(india._id, india.name);
      }
    }
  }, [countries]);

  // Handle country selection
  const handleCountrySelect = (countryId, countryName) => {
    setSelectedCountry(countryId);
    setSelectedCountryName(countryName);
    fetchStates({ countryId: countryId });

    // Reset all following
    setSelectedStates(new Set());
    setSelectedClusters(new Set());
    setSelectedDistricts(new Set());
    setSelectedRoles(new Set());
    setAvailableClusters({});
    setAvailableDistricts({});
  };

  // Fetch Assignments
  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await getAssignments();
      // Handle both direct array or wrapped {success, data} responses
      const data = res?.data || (Array.isArray(res) ? res : []);
      setAssignments(data);
    } catch (error) {
      console.error("Failed to fetch assignments", error);
      toast.error("Failed to fetch assignments");
    } finally {
      setLoading(false);
    }
  };

  // Handle state selection
  const handleStateClick = async (stateId) => {
    const newSelectedStates = new Set(selectedStates);
    if (newSelectedStates.has(stateId)) {
      newSelectedStates.delete(stateId);
    } else {
      newSelectedStates.clear(); // Enforce single selection hierarchy for clean flow
      newSelectedStates.add(stateId);
      // Fetch clusters for this state if not available
      if (!availableClusters[stateId]) {
        try {
          const res = await locationAPI.getAllClusters({ stateId: stateId, isActive: 'true' });
          if (res.data && res.data.data) {
            setAvailableClusters(prev => ({ ...prev, [stateId]: res.data.data }));
          }
        } catch (error) {
          console.error("Failed to fetch clusters", error);
        }
      }
    }
    
    // Strict Hierarchy Reset
    setSelectedStates(newSelectedStates);
    setSelectedClusters(new Set());
    setSelectedDistricts(new Set());
    setSelectedRoles(new Set());
  };

  const selectAllStates = async () => {
    const allIds = allStates.map(s => s._id);
    setSelectedStates(new Set(allIds));

    // Fetch clusters for all states that don't have them
    for (const stateId of allIds) {
      if (!availableClusters[stateId]) {
        try {
          const res = await locationAPI.getAllClusters({ stateId: stateId, isActive: 'true' });
          if (res.data && res.data.data) {
            setAvailableClusters(prev => ({ ...prev, [stateId]: res.data.data }));
          }
        } catch (error) {
          console.error("Failed to fetch clusters", error);
        }
      }
    }
  };

  const clearAllStates = () => {
    setSelectedStates(new Set());
    setSelectedClusters(new Set());
    setSelectedDistricts(new Set());
    setSelectedRoles(new Set());
  };

  // Get displayed clusters based on selected states
  const getDisplayedClusters = () => {
    let clusters = [];
    const seen = new Set();
    selectedStates.forEach(stateId => {
      if (availableClusters[stateId]) {
        availableClusters[stateId].forEach(cluster => {
          if (!seen.has(cluster._id)) {
            seen.add(cluster._id);
            clusters.push(cluster);
          }
        });
      }
    });
    return clusters;
  };

  // Handle cluster selection
  const handleClusterClick = async (clusterId) => {
    const newSelectedClusters = new Set(selectedClusters);
    if (newSelectedClusters.has(clusterId)) {
      newSelectedClusters.delete(clusterId);
    } else {
      newSelectedClusters.clear(); // Enforce single selection hierarchy for clean flow
      newSelectedClusters.add(clusterId);
      // Fetch districts
      if (!availableDistricts[clusterId]) {
        try {
          const res = await locationAPI.getAllDistricts({ clusterId: clusterId, isActive: 'true' });
          if (res.data && res.data.data) {
            setAvailableDistricts(prev => ({ ...prev, [clusterId]: res.data.data }));
          }
        } catch (error) {
          console.error("Failed to fetch districts", error);
        }
      }
    }

    // Strict Hierarchy Reset
    setSelectedClusters(newSelectedClusters);
    setSelectedDistricts(new Set());
    setSelectedRoles(new Set());
  };

  const selectAllClusters = async () => {
    const displayedClusters = getDisplayedClusters();
    const allIds = displayedClusters.map(c => c._id);
    setSelectedClusters(new Set(allIds));

    // Fetch districts
    for (const clusterId of allIds) {
      if (!availableDistricts[clusterId]) {
        try {
          const res = await locationAPI.getAllDistricts({ clusterId: clusterId, isActive: 'true' });
          if (res.data && res.data.data) {
            setAvailableDistricts(prev => ({ ...prev, [clusterId]: res.data.data }));
          }
        } catch (error) {
          console.error("Error fetching districts", error);
        }
      }
    }
  };

  const clearAllClusters = () => {
    setSelectedClusters(new Set());
    setSelectedDistricts(new Set());
    setSelectedRoles(new Set());
  };

  // Get displayed districts based on selected clusters
  const getDisplayedDistricts = () => {
    let districts = [];
    const seen = new Set();
    selectedClusters.forEach(clusterId => {
      if (availableDistricts[clusterId]) {
        availableDistricts[clusterId].forEach(district => {
          if (!seen.has(district._id)) {
            seen.add(district._id);
            districts.push(district);
          }
        });
      }
    });
    return districts;
  };

  // Handle district selection
  const handleDistrictClick = (districtId) => {
    const newSelectedDistricts = new Set(selectedDistricts);
    if (newSelectedDistricts.has(districtId)) {
      newSelectedDistricts.delete(districtId);
    } else {
      newSelectedDistricts.add(districtId);
    }
    
    // Strict Hierarchy Reset
    setSelectedDistricts(newSelectedDistricts);
    setSelectedRoles(new Set());
  };

  const selectAllDistricts = () => {
    const displayedDistricts = getDisplayedDistricts();
    const allIds = displayedDistricts.map(d => d._id);
    setSelectedDistricts(new Set(allIds));
  };

  const clearAllDistricts = () => {
    setSelectedDistricts(new Set());
    setSelectedRoles(new Set());
  };

  const resolveClusterName = (assignment) => {
    if (!assignment) return null;
    
    // 1. Direct object check
    const cluster = assignment.cluster || assignment.clusterId;
    if (typeof cluster === 'object' && (cluster.name || cluster.clusterName)) {
      return cluster.name || cluster.clusterName;
    }

    // 2. ID-based cache lookup
    const nid = (v) => {
      if (!v) return "";
      if (typeof v === 'string') return v.trim();
      return String(v?._id || v?.id || v || "").trim();
    };
    const cid = nid(cluster).toLowerCase();
    if (cid && cid !== 'undefined' && cid !== 'null') {
      for (const stateId in availableClusters) {
        const found = availableClusters[stateId]?.find(c => nid(c).toLowerCase() === cid);
        if (found) return found.name || found.clusterName;
      }
    }

    // 3. District-based fallback (ONLY if cluster is missing/invalid)
    const districtIds = (assignment.districts || assignment.districtIds || [])
      .map(d => nid(d).toLowerCase())
      .filter(id => id && id !== 'undefined' && id !== 'null');

    if (districtIds.length > 0) {
      for (const cId in availableDistricts) {
        const districtsInCluster = availableDistricts[cId] || [];
        const overlaps = districtsInCluster.some(d => districtIds.includes(nid(d._id || d).toLowerCase()));
        if (overlaps) {
          const cidToFind = cId.toLowerCase().trim();
          for (const sId in availableClusters) {
            const found = availableClusters[sId]?.find(c => nid(c._id || c).toLowerCase() === cidToFind);
            if (found) return found.name || found.clusterName;
          }
        }
      }
    }

    return null;
  };

  // Handle role selection
  const handleRoleClick = (role) => {
    const newSelectedRoles = new Set(selectedRoles);
    if (newSelectedRoles.has(role)) {
      newSelectedRoles.delete(role);
    } else {
      newSelectedRoles.add(role);
    }
    setSelectedRoles(newSelectedRoles);
  };

  const selectAllRoles = () => {
    setSelectedRoles(new Set(partners.map(p => p.name)));
  };

  const clearAllRoles = () => {
    setSelectedRoles(new Set());
  };



  // Custom styles for React Select
  const selectStyles = {
    control: (base) => ({
      ...base,
      minHeight: '32px',
      fontSize: '11px',
      borderRadius: '6px',
      borderColor: '#d1d5db',
      '&:hover': { borderColor: '#4f46e5' }
    }),
    valueContainer: (base) => ({
      ...base,
      padding: '0 8px'
    }),
    input: (base) => ({
      ...base,
      margin: '0'
    }),
    dropdownIndicator: (base) => ({
      ...base,
      padding: '2px'
    }),
    clearIndicator: (base) => ({
      ...base,
      padding: '2px'
    }),
    menu: (base) => ({
      ...base,
      fontSize: '11px',
      zIndex: 100
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: '#e0e7ff',
      borderRadius: '4px'
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: '#3730a3',
      padding: '1px 4px'
    }),
    menuPortal: base => ({ ...base, zIndex: 9999 })
  };

  const handleEditClick = (assignment) => {
    setAssignmentForm({
      solarkitName: assignment.solarkitName || '',
      panels: assignment.panels || [],
      inverters: assignment.inverters || [],
      boskits: assignment.boskits || [],
      role: assignment.role || (Array.isArray(assignment.cpTypes) ? assignment.cpTypes[0] : assignment.cpTypes) || '',
      category: assignment.category || '',
      subCategory: assignment.subCategory || '',
      projectType: assignment.projectType || '',
      subProjectType: assignment.subProjectType || '',
      country: assignment.country || assignment.countryId || null,
      state: assignment.state,
      cluster: assignment.cluster,
      districts: assignment.districts || []
    });
    setCurrentAssignment(assignment);
    setShowConfigureModal(true);
  };

  const deleteAssignmentById = async (id) => {
    if (!window.confirm("Are you sure you want to delete this configuration?")) return;

    try {
      await deleteAssignment(id);
      toast.success("Configuration deleted successfully");
      fetchAssignments();
    } catch (error) {
      console.error("Failed to delete assignment", error);
      toast.error("Failed to delete configuration");
    }
  };

  const handleSaveClick = async () => {
    try {
      if (!assignmentForm.solarkitName) {
        toast.error("Please select a Solarkit name");
        return;
      }

      setLoading(true);
      const payload = {
        solarkitName: assignmentForm.solarkitName,
        panels: assignmentForm.panels,
        inverters: assignmentForm.inverters,
        boskits: assignmentForm.boskits,
        state: assignmentForm.state?._id || assignmentForm.state,
        cluster: assignmentForm.cluster?._id || assignmentForm.cluster,
        districts: assignmentForm.districts?.map(d => d._id || d),
        role: assignmentForm.role,
        cpTypes: [assignmentForm.role],
        category: assignmentForm.category,
        subCategory: assignmentForm.subCategory,
        projectType: assignmentForm.projectType,
        subProjectType: assignmentForm.subProjectType,
        country: selectedCountry || assignmentForm.state?.country?._id || assignmentForm.state?.country
      };

      let savedData;
      if (!currentAssignment) {
        const res = await createAssignment(payload);
        savedData = res.data || res;
        toast.success("New configuration created successfully");
      } else {
        const res = await updateAssignment(currentAssignment._id, payload);
        savedData = res.data || res;
        toast.success("Details updated successfully");
      }

      // Clear forms and close modal early for snappy feel
      setShowConfigureModal(false);
      setCurrentAssignment(null);

      // Force fetch fresh data and wait for it
      await fetchAssignments();

      // Update last saved with the ACTUAL server data (which has _id)
      setLastSavedConfig(savedData);
      setShowSummary(true);

    } catch (error) {
      console.error("Failed to save assignment", error);
      toast.error("Failed to save details: " + (error.response?.data?.message || "Server Error"));
    } finally {
      setLoading(false);
    }
  };

  const addNewCustomization = () => {
    if (!selectedCountry) {
      toast.error("Please select a Country first");
      return;
    }
    if (selectedStates.size === 0) {
      toast.error("Please select a State first");
      return;
    }

    const stateId = Array.from(selectedStates)[0];
    const clusterId = Array.from(selectedClusters)[0];
    const districtIds = Array.from(selectedDistricts);
    const selRolesArr = Array.from(selectedRoles);
    const role = selRolesArr.length === 1 ? selRolesArr[0] : '';

    // Find objects from cache for auto-fill
    const countryObj = countries.find(c => c._id === selectedCountry);
    const stateObj = allStates.find(s => s._id === stateId);
    
    // STRICT CLUSTER RESOLUTION: Prioritize selection
    let clusterObj = null;
    if (clusterId) {
      for (const sId in availableClusters) {
        const found = availableClusters[sId]?.find(c => String(c._id || c) === String(clusterId));
        if (found) { clusterObj = found; break; }
      }
      // If not in cache, create a minimal object so it's not "lost"
      if (!clusterObj) {
        clusterObj = { _id: clusterId, name: 'Selected Cluster' };
      }
    }
    
    const districtObjs = [];
    if (districtIds.length > 0) {
      for (const cId in availableDistricts) {
        const matched = availableDistricts[cId]?.filter(d => districtIds.includes(String(d._id || d)));
        if (matched?.length) districtObjs.push(...matched);
      }
      // If some districts were NOT found in cache, at least keep their IDs
      if (districtObjs.length < districtIds.length) {
        const foundIds = new Set(districtObjs.map(d => String(d._id || d)));
        districtIds.forEach(id => {
          if (!foundIds.has(String(id))) {
            districtObjs.push({ _id: id, name: 'Selected District' });
          }
        });
      }
    }
    const finalDistricts = Array.from(new Map(districtObjs.map(d => [String(d._id || d), d])).values());

    setAssignmentForm({
      solarkitName: '',
      panels: [],
      inverters: [],
      boskits: [],
      role: role || '',
      category: '',
      subCategory: '',
      projectType: '',
      subProjectType: '',
      country: countryObj || null,
      state: stateObj || null,
      cluster: clusterObj || null,
      districts: finalDistricts
    });
    setCurrentAssignment(null);
    setShowConfigureModal(true);
  };

  const handleCancelClick = (assignmentId) => {
    setEditMode(prev => ({ ...prev, [assignmentId]: false }));
    // Optionally revert changes by re-fetching or keeping a backup
    fetchAssignments();
  };

  // Handle dropdown changes
  const handlePanelChange = (assignmentId, selectedOptions) => {
    setAssignments(prev => prev.map(a =>
      a._id === assignmentId ? { ...a, panels: selectedOptions } : a
    ));
  };

  const handleInverterChange = (assignmentId, selectedOptions) => {
    setAssignments(prev => prev.map(a =>
      a._id === assignmentId ? { ...a, inverters: selectedOptions } : a
    ));
  };

  const handleBoskitChange = (assignmentId, selectedOptions) => {
    setAssignments(prev => prev.map(a =>
      a._id === assignmentId ? { ...a, boskits: selectedOptions } : a
    ));
  };

  const handleFieldChange = (assignmentId, field, value) => {
    setAssignments(prev => prev.map(a =>
      a._id === assignmentId ? { ...a, [field]: value } : a
    ));
  };

  const handleLocationChange = (assignmentId, field, id) => {
    setAssignments(prev => prev.map(a => {
      if (a._id !== assignmentId) return a;

      let update = { [field]: id };

      if (field === 'state' || field === 'stateId') {
        const stateObj = allStates.find(s => s._id === id);
        update = { ...update, state: stateObj };
      } else if (field === 'cluster' || field === 'clusterId') {
        const clusterObj = getDisplayedClusters().find(c => c._id === id);
        update = { ...update, cluster: clusterObj };
      } else if (field === 'districts') {
        // value is array of IDs
        const districtObjs = getDisplayedDistricts().filter(d => id.includes(d._id));
        update = { ...update, districts: districtObjs };
      }

      return { ...a, ...update };
    }));
  };

  // Modal handlers
  const showCombokitDetails = (assignment) => {
    const data = assignment;
    const stateName = assignment.state?.name || "Unknown State";
    const clusterName = resolveClusterName(assignment) || "Unknown Cluster";
    const districtNames = assignment.districts?.map(d => d.name).join(", ") || "None";

    setModalContent({
      title: "Combokit Details",
      content: (
        <div>
          <h4 className="text-lg font-semibold mb-4">{stateName} Combokit Details</h4>
          <table className="min-w-full divide-y divide-gray-200 mt-3">
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">Solarkit Name:</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{data.solarkitName}</td>
              </tr>
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">Panel:</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                  {data.panels?.length ? data.panels.join(", ") : "Not Selected"}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">Inverter:</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                  {data.inverters?.length ? data.inverters.join(", ") : "Not Selected"}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">Boskit:</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                  {data.boskits?.length ? data.boskits.join(", ") : "Not Selected"}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">State:</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{stateName}</td>
              </tr>
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">Clusters:</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{clusterName}</td>
              </tr>
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">Districts:</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{districtNames}</td>
              </tr>
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">Partner:</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{data.role || data.cpTypes?.join(", ") || '-'}</td>
              </tr>
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">Category:</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{data.category}</td>
              </tr>
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">Sub Category:</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{data.subCategory}</td>
              </tr>
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">Project Type:</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{data.projectType}</td>
              </tr>
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">Sub Project Type:</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{data.subProjectType}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )
    });
    setModalType('view');
  };

  const closeModal = () => {
    setModalContent(null);
    setModalType(null);
  };



  // Get modal header color based on type
  const getModalHeaderColor = () => {
    switch (modalType) {
      case 'view': return 'bg-blue-600';
      case 'cluster': return 'bg-cyan-600';
      case 'district': return 'bg-green-600';
      default: return 'bg-blue-600';
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header Card */}
      <div className="card mb-6 shadow-lg rounded-lg bg-white">
        <div className="card-header px-6 py-4 bg-white border-b border-gray-200">
          <h2 className="text-2xl font-bold text-blue-600 mb-0">Customize Combokit</h2>
        </div>
      </div>

      {/* Country Selection */}
      <div className="card mb-6 shadow-lg rounded-lg bg-white">
        <div className="card-body p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 pl-3 border-l-4 border-blue-600">Select Country</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {countries.map((country) => (
              <div
                key={country._id}
                onClick={() => handleCountrySelect(country._id, country.name)}
                className={`card border rounded-lg p-4 text-center cursor-pointer transition-transform duration-200 hover:scale-105 ${selectedCountry === country._id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                  : 'bg-white border-blue-400 hover:border-blue-600'
                  }`}
              >
                <p className="font-medium">{country.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* State Selection */}
      {selectedCountry && (
        <div className="card mb-6 shadow-lg rounded-lg bg-white">
          <div className="card-body p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 pl-3 border-l-4 border-blue-600">Select States</h3>

            <div className="mb-4">
              <button
                onClick={selectAllStates}
                className="btn btn-sm btn-outline-primary mr-2 px-3 py-1.5 text-sm rounded border border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <CheckSquare className="inline-block w-4 h-4 mr-1" />
                Select All States
              </button>
              <button
                onClick={clearAllStates}
                className="btn btn-sm btn-outline-secondary px-3 py-1.5 text-sm rounded border border-gray-400 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <XCircle className="inline-block w-4 h-4 mr-1" />
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {allStates.map((state, index) => (
                <div
                  key={`${state._id}-${index}`}
                  onClick={() => handleStateClick(state._id)}
                  className={`card border rounded-lg p-4 text-center cursor-pointer transition-transform duration-200 hover:scale-105 ${selectedStates.has(state._id)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-blue-400 hover:border-blue-600'
                    }`}
                >
                  <p className="font-medium">{state.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cluster Selection */}
      {selectedStates.size > 0 && (
        <div className="card mb-6 shadow-lg rounded-lg bg-white">
          <div className="card-body p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 pl-3 border-l-4 border-blue-600">Select Clusters</h3>

            <div className="mb-4">
              <button
                onClick={selectAllClusters}
                className="btn btn-sm btn-outline-primary mr-2 px-3 py-1.5 text-sm rounded border border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <CheckSquare className="inline-block w-4 h-4 mr-1" />
                Select All Clusters
              </button>
              <button
                onClick={clearAllClusters}
                className="btn btn-sm btn-outline-secondary px-3 py-1.5 text-sm rounded border border-gray-400 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <XCircle className="inline-block w-4 h-4 mr-1" />
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {getDisplayedClusters().map((cluster, index) => (
                <div
                  key={`${cluster._id}-${index}`}
                  onClick={() => handleClusterClick(cluster._id)}
                  className={`card border rounded-lg p-4 text-center cursor-pointer transition-transform duration-200 hover:scale-105 ${selectedClusters.has(cluster._id)
                    ? 'bg-purple-700 text-white border-purple-700'
                    : 'border-gray-300 hover:border-purple-500'
                    }`}
                >
                  {cluster.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* District Selection */}
      {selectedClusters.size > 0 && (
        <div className="card mb-6 shadow-lg rounded-lg bg-white">
          <div className="card-body p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 pl-3 border-l-4 border-blue-600">Select Districts</h3>

            <div className="mb-4">
              <button
                onClick={selectAllDistricts}
                className="btn btn-sm btn-outline-primary mr-2 px-3 py-1.5 text-sm rounded border border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <CheckSquare className="inline-block w-4 h-4 mr-1" />
                Select All Districts
              </button>
              <button
                onClick={clearAllDistricts}
                className="btn btn-sm btn-outline-secondary px-3 py-1.5 text-sm rounded border border-gray-400 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <XCircle className="inline-block w-4 h-4 mr-1" />
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-2">
              {getDisplayedDistricts().map((district, index) => (
                <button
                  key={`${district._id}-${index}`}
                  onClick={() => handleDistrictClick(district._id)}
                  className={`px-4 py-2.5 rounded-lg border text-xs font-semibold transition-all duration-200 shadow-sm ${selectedDistricts.has(district._id)
                      ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-100'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50'
                    }`}
                >
                  {district.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Role Selection */}
      {selectedDistricts.size > 0 && (
        <div className="card mb-6 shadow-lg rounded-lg bg-white">
          <div className="card-body p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 pl-3 border-l-4 border-blue-600">Select Partner</h3>

            <div className="mb-4">
              <button
                onClick={selectAllRoles}
                className="btn btn-sm btn-outline-primary mr-2 px-3 py-1.5 text-sm rounded border border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <CheckSquare className="inline-block w-4 h-4 mr-1" />
                Select All
              </button>
              <button
                onClick={clearAllRoles}
                className="btn btn-sm btn-outline-secondary px-3 py-1.5 text-sm rounded border border-gray-400 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <XCircle className="inline-block w-4 h-4 mr-1" />
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-2">
              {partners.map((p, index) => (
                <button
                  key={`${p._id}-${index}`}
                  onClick={() => handleRoleClick(p.name)}
                  className={`px-4 py-2.5 rounded-lg border text-xs font-semibold transition-all duration-200 shadow-sm ${selectedRoles.has(p.name)
                      ? 'bg-orange-600 text-white border-orange-600 ring-2 ring-orange-100'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-orange-400 hover:bg-orange-50'
                    }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Result Table */}
      <style>{scrollbarStyles}</style>
      <div className="mt-8 mb-10" id="result-table-container">
        <div className="table-container bg-white overflow-hidden">
          <div className="p-0">
            <div className="flex justify-between items-center p-5 bg-slate-50 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                <h3 className="text-lg font-bold text-slate-800">Customize Combokit Details</h3>
              </div>
              <button
                onClick={addNewCustomization}
                className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-all shadow-md text-sm font-bold active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Add New Configuration
              </button>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-gray-500 font-medium">Loading assignments...</p>
                </div>
              ) : assignments.length === 0 ? (
                <div className="text-center py-20 bg-gray-50/30">
                  <div className="w-16 h-16 bg-blue-50 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Filter className="w-8 h-8" />
                  </div>
                  <p className="text-gray-500 mb-6 font-medium">No configurations found for the selected filters.</p>
                  <button
                    onClick={addNewCustomization}
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg font-bold active:scale-95"
                  >
                    <Plus className="w-5 h-5" />
                    Create First Configuration
                  </button>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {[
                        "Solarkit Name", "Panel", "Inverter", "Boskit", "State",
                        "Cluster", "Districts", "Partner", "Category",
                        "Sub Category", "Project Type", "Sub Project Type", "Action"
                      ].map((header) => (
                        <th key={header} className="px-4 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {(() => {
                      const filtered = assignments.filter(assignment => {
                        // Always show temporary rows being edited
                        if (assignment.tempId) return true;
                        
                        // BYPASS: Always show the record that was just saved or updated
                        const assignmentId = assignment._id || assignment.id;
                        if (lastSavedConfig && (assignmentId === lastSavedConfig._id || assignmentId === lastSavedConfig.id)) {
                          return true;
                        }

                        // Robust Normalization
                        const nid = (v) => {
                          if (!v) return "";
                          if (typeof v === 'string') return v.trim();
                          return String(v?._id || v?.id || v || "").trim();
                        };
                        const ntext = (v) => String(v || "").toLowerCase().trim();

                        // 1. Extract Values
                        const aCountryId = nid(assignment.country || assignment.countryId);
                        const aStateId = nid(assignment.state || assignment.stateId);
                        const aClusterId = nid(assignment.cluster || assignment.clusterId);
                        const aDistricts = (assignment.districts || assignment.districtIds || []).map(d => nid(d));
                        const aRole = ntext(assignment.role || (Array.isArray(assignment.cpTypes) ? assignment.cpTypes[0] : assignment.cpTypes) || "");
                        const aStateCountryId = nid(assignment.state?.country || assignment.state?.countryId || assignment.state?.country_id);

                        // 2. Extract Filters
                        const fCountryId = nid(selectedCountry);
                        const fStates = Array.from(selectedStates).map(nid);
                        const fClusters = Array.from(selectedClusters).map(nid);
                        const fDistricts = Array.from(selectedDistricts).map(nid);
                        const fRoles = Array.from(selectedRoles).map(ntext);

                        const hasStateFilter = fStates.length > 0;
                        const hasClusterFilter = fClusters.length > 0;
                        const hasDistrictFilter = fDistricts.length > 0;
                        const hasRoleFilter = fRoles.length > 0;

                        // 3. Apply Active Filters (STRICT HIERARCHY)
                        
                        // Level 1: Country
                        if (fCountryId) {
                          const matchingCountry = (aCountryId === fCountryId) || (aStateCountryId === fCountryId);
                          if (!matchingCountry && (aCountryId || aStateCountryId)) return false;
                        }

                        // Level 2: State
                        if (hasStateFilter) {
                          if (!fStates.includes(aStateId)) return false;
                        }

                        // Level 3: Cluster
                        if (hasClusterFilter) {
                          if (aClusterId) {
                            if (!fClusters.includes(aClusterId)) return false;
                          } else if (aDistricts.length > 0) {
                            // Support district-based matching only if explicit cluster ID is missing
                            const districtMatch = fClusters.some(fCid => {
                              const clusterDistricts = (availableDistricts[fCid] || []).map(d => nid(d._id || d));
                              return aDistricts.some(aDid => clusterDistricts.includes(aDid));
                            });
                            if (!districtMatch) return false;
                          } else {
                            return false; 
                          }
                        }

                        // Level 4: District
                        if (hasDistrictFilter) {
                          const districtMatch = aDistricts.some(d => fDistricts.includes(d));
                          if (!districtMatch) return false;
                        }

                        // Level 5: Partner (Role)
                        if (hasRoleFilter) {
                          if (!fRoles.includes(aRole)) return false;
                        }

                        return true;
                      });

                      if (filtered.length === 0) {
                        return (
                          <tr>
                            <td colSpan="13" className="text-center py-20 bg-gray-50/30">
                              <div className="w-16 h-16 bg-blue-50 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Filter className="w-8 h-8" />
                              </div>
                              <p className="text-gray-500 font-medium">No configurations found for the selected filters.</p>
                              {assignments.length > 0 && (
                                <button
                                  onClick={() => { clearAllStates(); clearAllRoles(); }}
                                  className="mt-4 text-blue-600 underline text-sm font-semibold"
                                >
                                  Clear all filters to see all configurations
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      }

                      return filtered.map((assignment, index) => {
                        const districtNames = assignment.districts?.map(d => d.name).join(", ") || "None";
                        const districtsDisplay = districtNames.length > 50 ? districtNames.substring(0, 50) + "..." : districtNames;

                        return (
                          <tr key={`${assignment._id}-${index}`} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-4 text-xs font-medium text-gray-900 min-w-[150px]">
                              <div className="font-semibold text-blue-700">{assignment.solarkitName || '-'}</div>
                            </td>

                            <td className="px-2 py-4 min-w-[180px]">
                              <div className="flex flex-wrap gap-1">
                                {assignment.panels?.length ? assignment.panels.map(p => (
                                  <span key={p} className="bg-gray-100 text-[10px] px-1.5 py-0.5 rounded text-gray-600 border border-gray-200">{p}</span>
                                )) : <span className="text-gray-400 italic text-[10px]">Not Selected</span>}
                              </div>
                            </td>

                            <td className="px-2 py-4 min-w-[180px]">
                              <div className="flex flex-wrap gap-1">
                                {assignment.inverters?.length ? assignment.inverters.map(i => (
                                  <span key={i} className="bg-gray-100 text-[10px] px-1.5 py-0.5 rounded text-gray-600 border border-gray-200">{i}</span>
                                )) : <span className="text-gray-400 italic text-[10px]">Not Selected</span>}
                              </div>
                            </td>

                            <td className="px-2 py-4 min-w-[180px]">
                              <div className="flex flex-wrap gap-1">
                                {assignment.boskits?.length ? assignment.boskits.map(b => (
                                  <span key={b} className="bg-gray-100 text-[10px] px-1.5 py-0.5 rounded text-gray-600 border border-gray-200">{b}</span>
                                )) : <span className="text-gray-400 italic text-[10px]">Not Selected</span>}
                              </div>
                            </td>

                            <td className="px-4 py-4 text-[11px] text-gray-600 min-w-[100px]">
                              <span className="font-medium">{assignment.state?.name}</span>
                            </td>
                            <td className="px-4 py-4 text-[11px] text-gray-600 min-w-[120px]">
                              <span>{resolveClusterName(assignment) || <span className="text-gray-400 italic">Not Assigned</span>}</span>
                            </td>
                            <td className="px-4 py-4 text-[11px] text-gray-600 min-w-[150px]">
                              <span className="truncate block max-w-[140px]" title={districtNames}>{districtsDisplay}</span>
                            </td>

                            <td className="px-4 py-4 text-[11px] text-gray-600 min-w-[120px]">
                              {assignment.role || (Array.isArray(assignment.cpTypes) ? assignment.cpTypes[0] : assignment.cpTypes) ? (
                                <span className={`px-2 py-0.5 rounded-full font-semibold ${(assignment.role || assignment.cpTypes?.[0])?.toLowerCase() === 'dealer'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-orange-100 text-orange-700'
                                  }`}>
                                  {assignment.role || (Array.isArray(assignment.cpTypes) ? assignment.cpTypes[0] : assignment.cpTypes)}
                                </span>
                              ) : (
                                <span className="text-gray-400 italic">Not Assigned</span>
                              )}
                            </td>

                            <td className="px-4 py-4 text-[11px] text-gray-600 min-w-[130px]">
                              <span>{assignment.category}</span>
                            </td>
                            <td className="px-4 py-4 text-[11px] text-gray-600 min-w-[130px]">
                              <span>{assignment.subCategory}</span>
                            </td>

                            <td className="px-4 py-4 text-[11px] text-gray-600 min-w-[130px]">
                              <span>{assignment.projectType}</span>
                            </td>
                            <td className="px-4 py-4 text-[11px] text-gray-600 min-w-[130px]">
                              <span>{assignment.subProjectType}</span>
                            </td>

                            <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end items-center space-x-3">
                                <button
                                  onClick={() => showCombokitDetails(assignment)}
                                  className="text-gray-400 hover:text-blue-600 transition-colors p-1.5 rounded-full hover:bg-blue-50"
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleEditClick(assignment)}
                                  className="text-gray-400 hover:text-indigo-600 transition-colors p-1.5 rounded-full hover:bg-indigo-50"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => deleteAssignmentById(assignment._id)}
                                  className="text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded-full hover:bg-red-50"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>


      {/* Modal View/Filter */}
      {modalContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col relative">
            <div className={`modal-header px-6 py-4 text-white ${getModalHeaderColor()}`}>
              <h3 className="text-lg font-semibold">{modalContent.title}</h3>
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 text-white hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="modal-body p-6 overflow-y-auto">
              {modalContent.content}
            </div>
            <div className="modal-footer px-6 py-4 bg-gray-50 border-t border-gray-200">
              <button
                onClick={closeModal}
                className="btn btn-secondary px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-700 font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Modal */}
      {showConfigureModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 px-8 py-6 text-white shrink-0">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-blue-200 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Configuration Wizard</p>
                  <h3 className="text-2xl font-black tracking-tight">{currentAssignment ? 'Update Custom Configuration' : 'Create New Configuration'}</h3>
                </div>
                <button onClick={() => setShowConfigureModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors group">
                  <X className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/50">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Section 1: Identity */}
                <div className="space-y-6">
                  <h4 className="text-[11px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2 border-l-4 border-blue-500 pl-3">
                    Plan Identity
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Solarkit Name</label>
                      <Select
                        styles={selectStyles}
                        placeholder="Select Kit Name"
                        value={assignmentForm.solarkitName ? { label: assignmentForm.solarkitName, value: assignmentForm.solarkitName } : null}
                        onChange={(opt) => setAssignmentForm({ ...assignmentForm, solarkitName: opt.value })}
                        options={solarKitsList.map(kit => ({ label: kit.name, value: kit.name }))}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Partner Role</label>
                      <Select
                        styles={selectStyles}
                        placeholder="Select Role"
                        value={assignmentForm.role ? { label: assignmentForm.role, value: assignmentForm.role } : null}
                        onChange={(opt) => setAssignmentForm({ ...assignmentForm, role: opt.value })}
                        options={partners.map(p => ({ label: p.name, value: p.name }))}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Category</label>
                        <Select
                          styles={selectStyles}
                          placeholder="Select"
                          value={assignmentForm.category ? { label: assignmentForm.category, value: assignmentForm.category } : null}
                          onChange={(opt) => setAssignmentForm({ ...assignmentForm, category: opt.value, subCategory: '' })}
                          options={masterCategories.map(cat => ({ label: cat.name, value: cat.name }))}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Sub Category</label>
                        <Select
                          styles={selectStyles}
                          placeholder="Select"
                          value={assignmentForm.subCategory ? { label: assignmentForm.subCategory, value: assignmentForm.subCategory } : null}
                          onChange={(opt) => setAssignmentForm({ ...assignmentForm, subCategory: opt.value })}
                          options={masterSubCategories
                            .filter(sub => {
                              const selCat = masterCategories.find(c => c.name === assignmentForm.category);
                              const subCatId = sub.categoryId?._id || sub.categoryId;
                              return selCat && subCatId === selCat._id;
                            })
                            .map(sub => ({ label: sub.name, value: sub.name }))
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Project Type Range</label>
                      <Select
                        styles={selectStyles}
                        placeholder="Select Project Type"
                        value={assignmentForm.projectType ? { label: assignmentForm.projectType, value: assignmentForm.projectType } : null}
                        onChange={(opt) => setAssignmentForm({ ...assignmentForm, projectType: opt.value })}
                        options={projectMappings?.length > 0 ? (
                          projectMappings
                            .filter(m => {
                              const selCat = masterCategories.find(c => c.name === assignmentForm.category);
                              const selSubCat = masterSubCategories.find(sc => sc.name === assignmentForm.subCategory);
                              const mCatId = m.categoryId?._id || m.categoryId;
                              const mSubCatId = m.subCategoryId?._id || m.subCategoryId;
                              return (!selCat || mCatId === selCat._id) && (!selSubCat || mSubCatId === selSubCat._id);
                            })
                            .map(m => `${m.projectTypeFrom} to ${m.projectTypeTo} kW`)
                            .filter((v, i, a) => a.indexOf(v) === i)
                            .map(pt => ({ label: pt, value: pt }))
                        ) : (
                          masterProjectTypes.map(pt => ({ label: pt, value: pt }))
                        )}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Sub Project Type</label>
                      <Select
                        styles={selectStyles}
                        placeholder="Select Sub Project Type"
                        value={assignmentForm.subProjectType ? { label: assignmentForm.subProjectType, value: assignmentForm.subProjectType } : null}
                        onChange={(opt) => setAssignmentForm({ ...assignmentForm, subProjectType: opt.value })}
                        options={masterSubProjectTypes.map(spt => ({ label: spt.name, value: spt.name }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Technical Specs */}
                <div className="space-y-6">
                  <h4 className="text-[11px] font-bold text-cyan-600 uppercase tracking-widest flex items-center gap-2 border-l-4 border-cyan-500 pl-3">
                    Technical Specifications
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Solar Panel Brands</label>
                      <textarea
                        className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 focus:border-cyan-500 focus:outline-none transition-all h-24 no-scrollbar"
                        placeholder="e.g. Adani 540W, Tata 550W (Comma separated)"
                        value={assignmentForm.panels?.join(", ")}
                        onChange={(e) => setAssignmentForm({ ...assignmentForm, panels: e.target.value.split(",").map(v => v.trim()) })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Inverter Models</label>
                      <textarea
                        className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 focus:border-cyan-500 focus:outline-none transition-all h-24 no-scrollbar"
                        placeholder="e.g. Growatt 5kW, Havells (Comma separated)"
                        value={assignmentForm.inverters?.join(", ")}
                        onChange={(e) => setAssignmentForm({ ...assignmentForm, inverters: e.target.value.split(",").map(v => v.trim()) })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">BOS Kit Components</label>
                      <textarea
                        className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 focus:border-cyan-500 focus:outline-none transition-all h-24 no-scrollbar"
                        placeholder="e.g. ACDB, DCDB, MC4 (Comma separated)"
                        value={assignmentForm.boskits?.join(", ")}
                        onChange={(e) => setAssignmentForm({ ...assignmentForm, boskits: e.target.value.split(",").map(v => v.trim()) })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-6 bg-slate-50 border-t border-slate-200 shrink-0">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3 text-slate-500">
                  <div className="p-2 bg-slate-200 rounded-lg">
                    <Filter className="w-4 h-4" />
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-tight">
                    Applying to <span className="text-blue-600">{assignmentForm.state?.name || 'Selected'}</span> State context
                  </div>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowConfigureModal(false)}
                    className="px-8 py-3 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={handleSaveClick}
                    className="px-10 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-sm font-black rounded-xl hover:shadow-lg hover:shadow-blue-200 active:scale-95 transition-all uppercase tracking-widest"
                  >
                    {currentAssignment ? 'UPDATE CONFIG' : 'SAVE CONFIGURATION'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomizeCombokit;