import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, CheckCircle, Camera, ChevronUp, ChevronDown,
  X, Image as ImageIcon, Search, Edit, Eye, Trash2
} from 'lucide-react';
import Select from 'react-select';
import { useLocations } from '../../../../hooks/useLocations';
import { getAssignments, createAssignment, updateAssignment, deleteAssignment, getPartnerTypes, getPartnerPlans } from '../../../../services/combokit/combokitApi';
import { getBrands, getSkus } from '../../../../services/settings/orderProcurementSettingApi';
import * as locationSvc from '../../../../services/core/locationApi';
import { locationAPI } from '../../../../api/api';

// Main Component
export default function AddComboKit() {
  const { countries, states, fetchCountries, fetchStates, fetchClusters, fetchDistricts } = useLocations();

  const [selectedCountries, setSelectedCountries] = useState([]);
  const [selectedCountryName, setSelectedCountryName] = useState('');
  const [selectedStates, setSelectedStates] = useState([]);
  const [selectedClusters, setSelectedClusters] = useState([]);

  // CP Type is now Role
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [selectedPlans, setSelectedPlans] = useState([]);

  const [selectedDistricts, setSelectedDistricts] = useState([]); // Array of IDs
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showRoleSection, setShowRoleSection] = useState(false);
  const [showPlanSection, setShowPlanSection] = useState(false);
  const [showDistrictSection, setShowDistrictSection] = useState(false);
  const [selectAllCountry, setSelectAllCountry] = useState(false);
  const [selectAllRole, setSelectAllRole] = useState(false);
  const [selectAllState, setSelectAllState] = useState(false);
  const [selectAllCluster, setSelectAllCluster] = useState(false);
  const [selectAllPlan, setSelectAllPlan] = useState(false);
  const [selectAllDistrict, setSelectAllDistrict] = useState(false);
  const [projectRows, setProjectRows] = useState([]);
  const [activeTab, setActiveTab] = useState('create');
  const [showComboKitModal, setShowComboKitModal] = useState(false);
  const [showProjectCombokitsModal, setShowProjectCombokitsModal] = useState(false);
  const [showViewCombokitModal, setShowViewCombokitModal] = useState(false);
  const [currentRowId, setCurrentRowId] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingRowId, setEditingRowId] = useState(null);

  // Dynamic Options
  const [stateOptions, setStateOptions] = useState([]);
  const [clusterOptions, setClusterOptions] = useState([]);
  const [districtOptions, setDistrictOptions] = useState([]);

  // State for unified combo kit management
  const [modalMode, setModalMode] = useState('manage'); // 'edit-single' or 'manage'
  const [modalKits, setModalKits] = useState([]);
  const [activeKitIndex, setActiveKitIndex] = useState(0);
  const [isNewKitTab, setIsNewKitTab] = useState(false);

  // State for main combo kit form
  const [comboKitName, setComboKitName] = useState('');
  const [comboKitImage, setComboKitImage] = useState(null);
  const [solarPanelBrand, setSolarPanelBrand] = useState('');
  const [selectedPanelSkus, setSelectedPanelSkus] = useState([]);
  const [inverterBrand, setInverterBrand] = useState('');
  const [showPanelSkuSelect, setShowPanelSkuSelect] = useState(false);
  const [showInverterConfigBtn, setShowInverterConfigBtn] = useState(false);

  // State for BOM
  const [showBomSection, setShowBomSection] = useState(false);
  const [bomSections, setBomSections] = useState([]);

  // State for view combo kit
  const [viewingComboKit, setViewingComboKit] = useState(null);

  const [partners, setPartners] = useState([]);

  const [allManufacturers, setAllManufacturers] = useState([]);
  const [availablePanelSkus, setAvailablePanelSkus] = useState([]);
  const [availableInverterSkus, setAvailableInverterSkus] = useState([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingSkus, setLoadingSkus] = useState(false);

  // Initial Data
  useEffect(() => {
    fetchCountries();
    fetchPartners();
    loadAssignments();
    fetchInitialBrands();
  }, []);

  const fetchInitialBrands = async () => {
    try {
      setLoadingBrands(true);
      const data = await getBrands();
      setAllManufacturers(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      console.error("Error fetching brands", err);
    } finally {
      setLoadingBrands(false);
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

  // When countries load, don't auto-fetch states for India if we want user to select
  useEffect(() => {
    if (countries.length > 0 && selectedCountries.length === 0) {
      // Optional: Auto-select India if available
      const india = countries.find(c => c.name === 'India');
      if (india) {
        setSelectedCountries([india._id]);
        setSelectedCountryName(india.name);
        handleCountrySelect(india._id, india.name, true);
      }
    }
  }, [countries]);

  // Fetch clusters when selected states change
  useEffect(() => {
    if (selectedStates.length > 0) {
      fetchClustersForStates(selectedStates);
    } else {
      setClusterOptions([]);
      setSelectedClusters([]);
    }
  }, [selectedStates]);

  // Fetch districts when selected clusters change
  useEffect(() => {
    if (selectedClusters.length > 0) {
      fetchDistrictsForClusters(selectedClusters);
    } else {
      setDistrictOptions([]);
      setSelectedDistricts([]);
    }
  }, [selectedClusters]);

  const loadAssignments = async () => {
    try {
      const data = await getAssignments();
      setProjectRows(data.map(item => ({
        ...item,
        id: item._id,
        countryId: item.country?._id || item.country,
        stateId: item.state?._id || item.state,
        state: item.state?.name || 'Unknown',
        clusterId: item.cluster?._id || item.cluster,
        cluster: item.cluster?.name || 'Unknown',
        districts: item.districts ? item.districts.map(d => typeof d === 'object' ? d.name : d) : [],
        districtIds: item.districts ? item.districts.map(d => typeof d === 'object' ? d._id : d) : [],
      })));
    } catch (error) {
      console.error("Error loading assignments:", error);
    }
  };

  const filteredProjects = useMemo(() => {
    if (!projectRows || projectRows.length === 0) return [];
    
    // If no selections are made, return everything as requested
    if (selectedCountries.length === 0 && 
        selectedStates.length === 0 && 
        selectedClusters.length === 0 && 
        selectedDistricts.length === 0 && 
        selectedRoles.length === 0 && 
        selectedPlans.length === 0) {
      return projectRows;
    }

    return projectRows.filter(row => {
      // Apply location filters
      if (selectedCountries.length > 0) {
        if (row.countryId && !selectedCountries.some(id => String(id) === String(row.countryId))) return false;
      }
      if (selectedStates.length > 0) {
        if (row.stateId && !selectedStates.some(id => String(id) === String(row.stateId))) return false;
      }
      if (selectedClusters.length > 0) {
        if (row.clusterId && !selectedClusters.some(id => String(id) === String(row.clusterId))) return false;
      }
      if (selectedDistricts.length > 0) {
        const rowDIds = (row.districtIds || []).map(d => String(d));
        if (!selectedDistricts.some(id => rowDIds.includes(String(id)))) return false;
      }
      
      // Apply partner filters
      if (selectedRoles.length > 0) {
        if (!selectedRoles.some(role => String(role).toLowerCase() === String(row.role).toLowerCase())) return false;
      }
      
      if (selectedPlans.length > 0) {
        const rowPlans = (row.cpTypes || []).map(p => String(p).toLowerCase());
        const hasSelectedPlan = selectedPlans.some(p => rowPlans.includes(String(p).toLowerCase()));
        if (!hasSelectedPlan) return false;
      }

      return true;
    });
  }, [projectRows, selectedCountries, selectedStates, selectedClusters, selectedDistricts, selectedRoles, selectedPlans]);

  const getItemKitCount = (type, value) => {
    if (!projectRows || projectRows.length === 0) return 0;
    
    // Normalize value for comparison
    const targetValue = value ? String(value).toLowerCase().trim() : '';
    if (!targetValue) return 0;

    const matchingRows = projectRows.filter(row => {
      // 1. Level Filter: Match the actual item we are counting
      let isLevelMatch = false;
      if (type === 'country') {
         isLevelMatch = String(row.countryId) === targetValue;
      } else if (type === 'state') {
         isLevelMatch = String(row.stateId) === targetValue || String(row.state).toLowerCase().trim() === targetValue;
      } else if (type === 'cluster') {
         isLevelMatch = String(row.clusterId) === targetValue || String(row.cluster).toLowerCase().trim() === targetValue;
      } else if (type === 'district') {
         const rowD = (row.districts || []).map(d => String(d).toLowerCase().trim());
         const rowDIds = (row.districtIds || []).map(d => String(d).toLowerCase().trim());
         isLevelMatch = rowD.includes(targetValue) || rowDIds.includes(targetValue);
      } else if (type === 'role') {
         isLevelMatch = String(row.role).toLowerCase().trim() === targetValue;
      } else if (type === 'plan') {
         const rowPlans = (row.cpTypes || []).map(p => String(p).toLowerCase().trim());
         isLevelMatch = rowPlans.includes(targetValue);
      }
      
      if (!isLevelMatch) return false;

      // 2. Hierarchy Filters (ONLY apply if row has the mapping data)
      if (type !== 'country' && selectedCountries.length > 0) {
         if (row.countryId) {
            const countryMatch = selectedCountries.some(id => String(id) === String(row.countryId));
            if (!countryMatch) return false;
         }
      }

      if (['cluster', 'district', 'role', 'plan'].includes(type) && selectedStates.length > 0) {
         if (row.stateId) {
            const stateMatch = selectedStates.some(id => String(id) === String(row.stateId));
            if (!stateMatch) return false;
         }
      }

      if (['district', 'role', 'plan'].includes(type) && selectedClusters.length > 0) {
         if (row.clusterId) {
            const clusterMatch = selectedClusters.some(id => String(id) === String(row.clusterId));
            if (!clusterMatch) return false;
         }
      }

      return true;
    });

    return matchingRows.reduce((sum, row) => sum + (row.comboKits?.length || 0), 0);
  };

  const handleCountrySelect = (countryId, countryName, isAuto = false) => {
    let newSelected = [];
    if (selectedCountries.includes(countryId)) {
      newSelected = selectedCountries.filter(id => id !== countryId);
    } else {
      newSelected = [...selectedCountries, countryId];
    }
    
    setSelectedCountries(newSelected);
    if (newSelected.length === 1) {
      const c = countries.find(x => x._id === newSelected[0]);
      setSelectedCountryName(c?.name || '');
    } else if (newSelected.length > 1) {
      setSelectedCountryName(`${newSelected.length} Countries`);
    } else {
      setSelectedCountryName('');
    }

    fetchStatesForCountries(newSelected);

    // Reset all following
    setSelectedStates([]);
    setSelectedClusters([]);
    setShowProjectForm(false);
    setShowDistrictSection(false);
    setShowRoleSection(false);
    setShowPlanSection(false);
    setSelectedRoles([]); // Reset roles
    setClusterOptions([]);
    setDistrictOptions([]);
  };

  const handleSelectAllCountries = () => {
     if (selectAllCountry) {
        setSelectedCountries([]);
        setSelectedCountryName('');
        setStateOptions([]);
     } else {
        const allIds = countries.map(c => c._id);
        setSelectedCountries(allIds);
        setSelectedCountryName('All Countries');
        fetchStatesForCountries(allIds);
     }
     setSelectAllCountry(!selectAllCountry);
  };

  const fetchStatesForCountries = async (countryIds) => {
    try {
      const allStates = [];
      for (const id of countryIds) {
        const data = await locationSvc.getStates(id);
        allStates.push(...(data || []));
      }
      // Unique states
      const uniqueStates = Array.from(new Map(allStates.map(s => [s._id, s])).values());
      setStateOptions(uniqueStates);
    } catch (e) {
      console.error("Error fetching states", e);
      setStateOptions([]);
    }
  };

  const handleStateSelect = (stateId) => {
    setShowProjectForm(true);
    if (selectedStates.includes(stateId)) {
      setSelectedStates(selectedStates.filter(id => id !== stateId));
    } else {
      setSelectedStates([...selectedStates, stateId]);
    }

    // Reset following
    setSelectedClusters([]);
    setDistrictOptions([]);
    setSelectedDistricts([]);
    setShowDistrictSection(false);
    setShowRoleSection(false);
    setShowPlanSection(false);
    setSelectedRoles([]);
  };

  const handleSelectAllStates = () => {
    if (selectAllState) {
      setSelectedStates([]);
    } else {
      setSelectedStates(stateOptions.map(s => s._id));
    }
    setSelectAllState(!selectAllState);
    setShowProjectForm(!selectAllState);
  };

  const fetchClustersForStates = async (stateIds) => {
    try {
      const allRes = await Promise.all(stateIds.map(id =>
        locationAPI.getAllClusters({ stateId: id, isActive: 'true' })
      ));
      const allClusters = allRes.flatMap(res => res.data?.data || []);
      // Deduplicate by _id
      const uniqueClusters = Array.from(new Map(allClusters.map(c => [c._id, c])).values());
      setClusterOptions(uniqueClusters);
    } catch (e) {
      console.error("Error fetching clusters", e);
      setClusterOptions([]);
    }
  };

  const handleClusterSelect = (clusterId) => {
    if (selectedClusters.includes(clusterId)) {
      setSelectedClusters(selectedClusters.filter(id => id !== clusterId));
    } else {
      setSelectedClusters([...selectedClusters, clusterId]);
    }
    setShowDistrictSection(true);
    setShowRoleSection(false);

    // Reset selections
    setSelectedDistricts([]);
    setSelectedRoles([]);
    setSelectedPlans([]);
    setShowPlanSection(false);
    setSelectAllPlan(false);
    setSelectAllDistrict(false);
  };

  const handleSelectAllClusters = () => {
    if (selectAllCluster) {
      setSelectedClusters([]);
    } else {
      setSelectedClusters(clusterOptions.map(c => c._id));
    }
    setSelectAllCluster(!selectAllCluster);
    setShowDistrictSection(!selectAllCluster);
    setShowRoleSection(false);
  };

  const fetchDistrictsForClusters = async (clusterIds) => {
    try {
      const allDistricts = [];
      for (const id of clusterIds) {
        const clusterDistricts = await locationSvc.getDistrictsHierarchy(id);
        // Attach clusterId to each district for later mapping in handleAddProject
        allDistricts.push(...(clusterDistricts || []).map(d => ({ ...d, clusterId: id })));
      }

      // Deduplicate by _id
      const uniqueDistricts = Array.from(new Map(allDistricts.map(d => [d._id, d])).values());
      setDistrictOptions(uniqueDistricts);
    } catch (e) {
      console.error("Error fetching districts", e);
      setDistrictOptions([]);
    }
  };

  const handleRoleSelect = async (roleName) => {
    let newRoles = [];
    if (selectedRoles.includes(roleName)) {
       newRoles = selectedRoles.filter(r => r !== roleName);
    } else {
       newRoles = [...selectedRoles, roleName];
    }
    
    setSelectedRoles(newRoles);
    setSelectedPlans([]);
    setSelectAllPlan(false);

    if (newRoles.length > 0) {
      fetchPlansForRoles(newRoles);
    } else {
      setAvailablePlans([]);
      setShowPlanSection(false);
    }
  };

  const handleSelectAllRoles = () => {
     if (selectAllRole) {
        setSelectedRoles([]);
        setAvailablePlans([]);
        setShowPlanSection(false);
     } else {
        const allRoles = partners.map(p => p.name);
        setSelectedRoles(allRoles);
        fetchPlansForRoles(allRoles);
     }
     setSelectAllRole(!selectAllRole);
  };

  const fetchPlansForRoles = async (roleNames) => {
    try {
      const stateId = selectedStates.length > 0 ? selectedStates[0] : null;
      const allPlans = [];
      for (const role of roleNames) {
         const plans = await getPartnerPlans(role, stateId);
         allPlans.push(...(plans || []));
      }
      // Unique plans by name
      const uniquePlans = Array.from(new Map(allPlans.map(p => [p.name || p._id, p])).values());
      setAvailablePlans(uniquePlans);
      setShowPlanSection(true);
    } catch (err) {
      console.error("Error fetching plans:", err);
      setAvailablePlans([]);
      setShowPlanSection(true);
    }
  };

  const handlePlanSelect = (planName) => {
    if (selectedPlans.includes(planName)) {
      setSelectedPlans(selectedPlans.filter(p => p !== planName));
    } else {
      setSelectedPlans([...selectedPlans, planName]);
    }
  };

  const handleSelectAllPlan = () => {
    if (selectAllPlan) {
      setSelectedPlans([]);
    } else {
      setSelectedPlans(availablePlans.map(p => p.name));
    }
    setSelectAllPlan(!selectAllPlan);
  };

  const handleDistrictSelect = (districtId) => {
    if (selectedDistricts.includes(districtId)) {
      const newSelected = selectedDistricts.filter(id => id !== districtId);
      setSelectedDistricts(newSelected);
      setShowRoleSection(newSelected.length > 0);
    } else {
      const newSelected = [...selectedDistricts, districtId];
      setSelectedDistricts(newSelected);
      setShowRoleSection(true);
    }
  };

  const handleSelectAllDistrict = () => {
    if (selectAllDistrict) {
      setSelectedDistricts([]);
      setShowRoleSection(false);
    } else {
      setSelectedDistricts(districtOptions.map(d => d._id));
      setShowRoleSection(true);
    }
    setSelectAllDistrict(!selectAllDistrict);
  };

  const handleAddProject = async () => {
    if (selectedClusters.length === 0) {
      alert('Please select at least one cluster');
      return;
    }
    if (selectedDistricts.length === 0) {
      alert('Please select at least one District');
      return;
    }
    if (selectedRoles.length === 0) {
      alert('Please select at least one Role (Partner)');
      return;
    }
    if (selectedPlans.length === 0) {
      alert('Please select at least one Plan');
      return;
    }

    // Since our backend expects one assignment per cluster usually,
    // we'll loop through selected clusters that have districts selected in them.
    // Or just create one project row for now as UI shows state/cluster as strings.

    try {
      const results = [];
      for (const clusterId of selectedClusters) {
        // Filter districts that belong to THIS cluster
        const currentClusterDistricts = districtOptions
          .filter(d => d.clusterId === clusterId)
          .filter(d => selectedDistricts.includes(d._id));

        if (currentClusterDistricts.length === 0) continue;

        const clusterObj = clusterOptions.find(c => c._id === clusterId);
        const stateId = clusterObj?.state?._id || clusterObj?.state;
        const stateObj = stateOptions.find(s => s._id === stateId);

        // Loop through each selected role to create separate projects
        for (const roleName of selectedRoles) {
           // Only add if this role has plans selected that belong to it?
           // Actually, selectedPlans is global names. We'll just add it.
           const payload = {
            state: stateId,
            cluster: clusterId,
            cpTypes: [...selectedPlans],
            role: roleName,
            districts: currentClusterDistricts.map(d => d._id),
            status: 'Inactive',
            comboKits: [],
            category: 'Solar Panel',
            subCategory: 'Residential',
            projectType: '1kw-10kw',
            subProjectType: 'On Grid'
          };

          const newAssignment = await createAssignment(payload);
          const newRow = {
            ...newAssignment,
            id: newAssignment._id,
            state: stateObj?.name || 'Unknown',
            stateId: stateId,
            cluster: clusterObj?.name || 'Unknown',
            clusterId: clusterId,
            cpTypes: newAssignment.cpTypes,
            districts: currentClusterDistricts.map(d => d.name),
            districtIds: newAssignment.districts
          };
          results.push(newRow);
        }
      }

      if (results.length > 0) {
        setProjectRows([...projectRows, ...results]);
        alert(`${results.length} Project(s) added successfully!`);
      } else {
        alert('No districts were selected for the chosen clusters.');
      }
    } catch (error) {
      console.error("Error creating assignment:", error);
      alert('Failed to create projects');
    }
  };

  const handleAddComboKit = async (rowId, isEditSingle = false, kitIdx = 0) => {
    setCurrentRowId(rowId);
    setModalMode(isEditSingle ? 'edit-single' : 'manage');

    const row = projectRows.find(r => r.id === rowId);
    const existingKits = row ? [...row.comboKits] : [];

    setModalKits(existingKits);

    if (isEditSingle) {
      setActiveKitIndex(kitIdx);
      setIsNewKitTab(false);
      await loadKitIntoForm(existingKits[kitIdx]);
    } else {
      if (existingKits.length > 0) {
        setActiveKitIndex(0);
        setIsNewKitTab(false);
        await loadKitIntoForm(existingKits[0]);
      } else {
        setIsNewKitTab(true);
        resetComboKitForm();
      }
    }

    setShowComboKitModal(true);
  };

  const loadKitIntoForm = async (kit) => {
    if (!kit) {
      resetComboKitForm();
      return;
    }
    setComboKitName(kit.name || '');
    setComboKitImage(kit.image || null);
    setSolarPanelBrand(kit.panelBrand || '');
    setInverterBrand(kit.inverterBrand || '');
    setBomSections(kit.bomSections || []);
    setShowBomSection(kit.bomSections?.length > 0);

    if (kit.panelBrand) {
      await handleSolarPanelBrandChange(kit.panelBrand, false);
      setSelectedPanelSkus(kit.panelSkus || []);
    } else {
      setSelectedPanelSkus([]);
      setShowPanelSkuSelect(false);
    }

    if (kit.inverterBrand) {
      setShowInverterConfigBtn(true);
    } else {
      setShowInverterConfigBtn(false);
    }
  };

  const switchTab = async (newIdx, isNew = false) => {
    // 1. Save current state into modalKits[activeKitIndex]
    const currentKitData = {
      name: comboKitName,
      image: comboKitImage,
      panelBrand: solarPanelBrand,
      panelSkus: selectedPanelSkus,
      inverterBrand: inverterBrand,
      bomSections: bomSections
    };

    let updatedKits = [...modalKits];
    if (!isNewKitTab) {
      updatedKits[activeKitIndex] = currentKitData;
    }

    setModalKits(updatedKits);

    // 2. Load the new tab
    if (isNew) {
      setIsNewKitTab(true);
      setActiveKitIndex(updatedKits.length);
      resetComboKitForm();
    } else {
      setIsNewKitTab(false);
      setActiveKitIndex(newIdx);
      await loadKitIntoForm(updatedKits[newIdx]);
    }
  };

  const handleSaveComboKits = async (e) => {
    e.preventDefault();

    const currentRow = projectRows.find(r => r.id === currentRowId);
    if (!currentRow) return;

    const currentKitData = {
      name: comboKitName,
      image: comboKitImage,
      panelBrand: solarPanelBrand,
      panelSkus: selectedPanelSkus,
      inverterBrand: inverterBrand,
      bomSections: bomSections
    };

    let updatedComboKits = [...modalKits];

    if (modalMode === 'edit-single') {
      updatedComboKits[activeKitIndex] = currentKitData;
    } else {
      if (isNewKitTab) {
        updatedComboKits.push(currentKitData);
      } else {
        updatedComboKits[activeKitIndex] = currentKitData;
      }
    }

    try {
      const updatedAssignment = await updateAssignment(currentRowId, { comboKits: updatedComboKits });

      const updatedRows = projectRows.map(row => {
        if (row.id === currentRowId) {
          return { ...row, comboKits: updatedAssignment.comboKits };
        }
        return row;
      });

      setProjectRows(updatedRows);
      setShowComboKitModal(false);
      alert(modalMode === 'edit-single' ? 'ComboKit updated successfully!' : 'ComboKits updated successfully!');
    } catch (err) {
      console.error("Error saving combo kits", err);
      alert("Failed to save. Please try again.");
    }
  };

  const handleStatusToggle = async (rowId) => {
    const row = projectRows.find(r => r.id === rowId);
    if (!row) return;

    const newStatus = row.status === 'Active' ? 'Inactive' : 'Active';

    try {
      await updateAssignment(rowId, { status: newStatus });

      const updatedRows = projectRows.map(r => {
        if (r.id === rowId) {
          return { ...r, status: newStatus };
        }
        return r;
      });
      setProjectRows(updatedRows);
    } catch (error) {
      console.error("Error updating status:", error);
      alert('Failed to update status');
    }
  };

  const handleDeleteAssignment = async (rowId) => {
    if (!window.confirm("Are you sure you want to delete this assignment?")) return;

    try {
      await deleteAssignment(rowId);
      setProjectRows(projectRows.filter(r => r.id !== rowId));
      alert('Assignment deleted successfully');
    } catch (error) {
      console.error("Error deleting assignment:", error);
      alert('Failed to delete assignment');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setComboKitImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSolarPanelBrandChange = async (brandName, shouldResetSkus = true) => {
    setSolarPanelBrand(brandName);
    const manufacturer = allManufacturers.find(m => (m.brand || m.companyName || m.name) === brandName);
    const brandId = manufacturer?._id;

    if (!brandName || !brandId) {
      setAvailablePanelSkus([]);
      if (shouldResetSkus) setSelectedPanelSkus([]);
      setShowPanelSkuSelect(false);
      return;
    }

    try {
      setLoadingSkus(true);
      const res = await getSkus({ brand: brandId });
      setAvailablePanelSkus(res.data || []);
      if (shouldResetSkus) setSelectedPanelSkus([]);
      setShowPanelSkuSelect(true);
    } catch (err) {
      console.error("Error fetching panel skus", err);
    } finally {
      setLoadingSkus(false);
    }
  };

  const handleInverterBrandChange = async (brandName) => {
    setInverterBrand(brandName);
    const manufacturer = allManufacturers.find(m => (m.brand || m.companyName || m.name) === brandName);
    const brandId = manufacturer?._id;

    if (!brandName || !brandId) {
      setAvailableInverterSkus([]);
      setShowInverterConfigBtn(false);
      return;
    }

    try {
      setLoadingSkus(true);
      const res = await getSkus({ brand: brandId });
      setAvailableInverterSkus(res.data || []);
      setShowInverterConfigBtn(true);
    } catch (err) {
      console.error("Error fetching inverter skus", err);
    } finally {
      setLoadingSkus(false);
    }
  };

  const handleViewProjectCombokits = (rowId) => {
    setCurrentRowId(rowId);
    setShowProjectCombokitsModal(true);
  };

  const handleViewCombokitDetails = (comboKit) => {
    setViewingComboKit(comboKit);
    setShowViewCombokitModal(true);
  };

  const resetComboKitForm = () => {
    setComboKitName('');
    setComboKitImage(null);
    setSolarPanelBrand('');
    setSelectedPanelSkus([]);
    setInverterBrand('');
    setBomSections([]);
    setShowBomSection(false);
    setIsEditMode(false);
    setEditingRowId(null);
    setActiveTab('create');
  };

  // Render cluster cards
  const renderClusterCards = () => {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <label className="flex items-center cursor-pointer mb-4">
          <input
            type="checkbox"
            checked={selectAllCluster}
            onChange={handleSelectAllClusters}
            className="mr-2"
          />
          <span className="font-semibold">Select All Clusters</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
          {clusterOptions.length === 0 ? <p className="text-gray-500 col-span-4">No clusters found for selected states.</p> :
            clusterOptions.map(cluster => {
              const count = getItemKitCount('cluster', cluster._id);
              return (
                <div
                  key={cluster._id}
                  className={`border rounded-lg p-4 text-center cursor-pointer transition-transform hover:scale-105 ${selectedClusters.includes(cluster._id)
                    ? 'bg-purple-700 text-white border-purple-800 shadow-md'
                    : 'bg-white border-gray-300 hover:border-blue-500'
                    }`}
                  onClick={() => handleClusterSelect(cluster._id)}
                >
                  <div className="font-medium">{cluster.name}</div>
                  {count > 0 && (
                    <p className={`text-[10px] mt-1 font-bold ${selectedClusters.includes(cluster._id) ? 'text-purple-100' : 'text-purple-600'}`}>
                      {count} ComboKit{count !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    );
  };

  const renderRoleCards = () => {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <h5 className="text-lg font-semibold text-gray-700 mb-4">Select Partner</h5>
        <div className="mb-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={selectAllRole}
              onChange={handleSelectAllRoles}
              className="mr-2"
            />
            <span className="font-semibold">Select All</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {partners.map(p => {
            const count = getItemKitCount('role', p.name);
            const isSelected = selectedRoles.includes(p.name);
            return (
              <div
                key={p._id}
                className={`border rounded-lg p-4 text-center cursor-pointer transition-all h-24 flex flex-col justify-center items-center ${isSelected
                  ? 'bg-blue-600 text-white border-blue-700 shadow-md'
                  : 'bg-white border-gray-300 hover:border-blue-500'
                  }`}
                onClick={() => handleRoleSelect(p.name)}
              >
                <div className="font-medium">{p.name}</div>
                {count > 0 && (
                  <p className={`text-[10px] mt-1 font-bold ${isSelected ? 'text-blue-100' : 'text-blue-600'}`}>
                    {count} ComboKit{count !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderPlanCards = () => {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <h5 className="text-lg font-semibold text-gray-700 mb-4">
           Select Plans {selectedRoles.length > 0 ? `for ${selectedRoles.join(', ')}` : ''}
        </h5>

        <div className="mb-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={selectAllPlan}
              onChange={handleSelectAllPlan}
              className="mr-2"
            />
            <span className="font-semibold">Select All Plans</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {availablePlans.length === 0 ? <p className="text-gray-500 col-span-4">No active plans found.</p> :
            availablePlans.map(plan => {
              const count = getItemKitCount('plan', plan.name);
              return (
                <div
                  key={plan._id}
                  className={`border rounded-lg p-4 text-center cursor-pointer transition-all h-24 flex flex-col justify-center items-center ${selectedPlans.includes(plan.name)
                    ? 'bg-green-600 text-white border-green-700'
                    : 'border-gray-300 hover:border-green-500'
                    }`}
                  onClick={() => handlePlanSelect(plan.name)}
                >
                  <div className="font-medium">{plan.name}</div>
                  {count > 0 && (
                    <p className={`text-[10px] mt-1 font-bold ${selectedPlans.includes(plan.name) ? 'text-green-100' : 'text-green-600'}`}>
                      {count} ComboKit{count !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    );
  };

  // Render district cards
  const renderDistrictCards = () => {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <h5 className="text-lg font-semibold text-gray-700 mb-4">Select Districts</h5>

        <div className="mb-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={selectAllDistrict}
              onChange={handleSelectAllDistrict}
              className="mr-2"
            />
            <span className="font-semibold">Select All</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {districtOptions.length === 0 ? <p className="text-gray-500 col-span-4">No districts found for this cluster.</p> :
            districtOptions.map(district => {
              const count = getItemKitCount('district', district.name);
              return (
                <div
                  key={district._id}
                  className={`border rounded-lg p-3 text-center cursor-pointer transition-all h-16 flex flex-col justify-center items-center ${selectedDistricts.includes(district._id)
                    ? 'bg-cyan-600 text-white border-cyan-700'
                    : 'border-gray-300 hover:border-cyan-500'
                    }`}
                  onClick={() => handleDistrictSelect(district._id)}
                >
                  <div className="font-medium text-sm">{district.name}</div>
                  {count > 0 && (
                    <p className={`text-[10px] mt-1 font-bold ${selectedDistricts.includes(district._id) ? 'text-cyan-100' : 'text-cyan-600'}`}>
                      {count} ComboKit{count !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    );
  };

  // Render project table
  const renderProjectTable = () => {
    return (
      <div className="mt-8">
        <h5 className="text-lg font-semibold mb-4">Project List</h5>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
            <thead className="bg-blue-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">ComboKit</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">ComboKit Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">State</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Partner</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Districts</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Sub Category</th>
                <th className="px4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Project Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Sub Project Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Cluster</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan="12" className="px-4 py-8 text-center text-gray-500 italic">
                    No matching projects found for selected filters.
                  </td>
                </tr>
              ) : (
                filteredProjects.map(row => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        onClick={() => handleAddComboKit(row.id, false)}
                      >
                        Add
                      </button>
                      <button
                        className="px-3 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600"
                        onClick={() => handleAddComboKit(row.id, true)}
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      className={`px-3 py-1 text-xs rounded ${row.status === 'Active'
                        ? 'bg-green-100 text-green-800 border border-green-300'
                        : 'bg-gray-100 text-gray-800 border border-gray-300'
                        }`}
                      onClick={() => handleStatusToggle(row.id)}
                    >
                      {row.status}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    {row.comboKits.length === 0 ? (
                      <span className="text-gray-400 italic text-sm">No ComboKits</span>
                    ) : (
                      <div className="space-y-2">
                        {row.comboKits.map((kit, idx) => (
                          <div key={idx} className="flex justify-between items-center group bg-gray-50 hover:bg-white border hover:border-blue-300 p-2 rounded transition-all shadow-sm">
                            <span className="text-sm font-medium text-gray-700 truncate mr-2" title={kit.name}>
                              {kit.name}
                            </span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleAddComboKit(row.id, true, idx)}
                                className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                                title="Edit this ComboKit"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => handleViewCombokitDetails(kit)}
                                className="p-1 text-green-500 hover:bg-green-50 rounded"
                                title="View Details"
                              >
                                <Eye size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">{row.state}</td>
                  <td className="px-4 py-3 text-sm max-w-[200px] truncate" title={row.cpTypes.join(', ')}>
                    {row.cpTypes.join(', ') || 'None'}
                  </td>
                  <td className="px-4 py-3 text-sm max-w-[200px] truncate" title={row.districts.join(', ')}>
                    {row.districts.join(', ') || 'None'}
                  </td>
                  <td className="px-4 py-3 text-sm">{row.category}</td>
                  <td className="px-4 py-3 text-sm">{row.subCategory}</td>
                  <td className="px-4 py-3 text-sm">{row.projectType}</td>
                  <td className="px-4 py-3 text-sm">{row.subProjectType}</td>
                  <td className="px-4 py-3 text-sm">{row.cluster}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                      onClick={() => handleDeleteAssignment(row.id)}
                      title="Delete Assignment"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render combo kit modal
  const renderComboKitModal = () => {
    return (
      <div className={`fixed inset-0 z-50 overflow-y-auto ${showComboKitModal ? 'block' : 'hidden'}`}>
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
          <div className="fixed inset-0 bg-black opacity-50" onClick={() => setShowComboKitModal(false)}></div>

          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-6xl">
            <form onSubmit={handleSaveComboKits}>
              <div className="flex justify-between items-center p-6 border-b">
                <h4 className="text-xl font-bold text-blue-800">ComboKit Management</h4>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600 p-2"
                  onClick={() => setShowComboKitModal(false)}
                >
                  <X size={28} />
                </button>
              </div>

              <div className="p-6">
                {/* Tabs - Only show in manage mode */}
                {modalMode === 'manage' && (
                  <div className="flex items-center gap-2 border-b mb-6 overflow-x-auto no-scrollbar pb-1">
                    {modalKits.map((kit, index) => (
                      <button
                        key={index}
                        type="button"
                        className={`px-4 py-2 font-semibold text-sm rounded-t-lg transition-all min-w-[120px] truncate ${!isNewKitTab && activeKitIndex === index
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        onClick={() => switchTab(index, false)}
                      >
                        {kit.name || `Untitled Kit`}
                      </button>
                    ))}
                    <button
                      type="button"
                      className={`px-5 py-2 font-bold text-lg rounded-t-lg transition-all ${isNewKitTab
                        ? 'bg-green-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                      onClick={() => switchTab(modalKits.length, true)}
                      title="Add New ComboKit"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                )}

                {/* Edit Form Header */}
                {modalMode === 'edit-single' && (
                  <div className="flex items-center gap-2 mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <div className="bg-blue-600 text-white p-2 rounded-lg">
                      <Edit size={24} />
                    </div>
                    <div>
                      <h5 className="text-xl font-bold text-gray-800">Edit ComboKit</h5>
                      <p className="text-sm text-blue-600 font-medium">{comboKitName || 'Unnamed Kit'}</p>
                    </div>
                  </div>
                )}

                <div id="mainComboKitForm">
                  {/* ComboKit Name */}
                  <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-700 mb-2">ComboKit Name (Product Name)</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors text-lg font-semibold"
                      value={comboKitName}
                      onChange={(e) => setComboKitName(e.target.value)}
                      placeholder="Enter ComboKit name"
                      required
                    />
                  </div>

                  {/* ComboKit Image */}
                  <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-700 mb-2">ComboKit Image</label>
                    <div className="relative w-full border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 flex items-center justify-center h-48 group hover:border-blue-400 transition-colors">
                      {comboKitImage ? (
                        <img src={comboKitImage} alt="ComboKit" className="max-w-full max-h-full object-contain p-4" />
                      ) : (
                        <div className="text-center text-gray-400">
                          <ImageIcon size={48} className="mx-auto mb-2 opacity-50" />
                          <p className="text-sm font-medium">Click the camera to upload image</p>
                        </div>
                      )}
                      <input
                        type="file"
                        className="hidden"
                        id="combokitImage"
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                      <button
                        type="button"
                        className="absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-transform group-hover:scale-110"
                        onClick={() => document.getElementById('combokitImage').click()}
                      >
                        <Camera size={20} />
                      </button>
                    </div>
                  </div>

                  {/* Solar Panel Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 border-b pb-8 border-gray-100">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Select Solar Panel Brand</label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          value={solarPanelBrand}
                          onChange={(e) => handleSolarPanelBrandChange(e.target.value)}
                        >
                          <option value="">Select a brand</option>
                          {allManufacturers
                            .filter(m => m.product?.toLowerCase().includes('panel'))
                            .map(m => (
                              <option key={m._id} value={m.brand || m.companyName || m.name}>
                                {m.brand || m.companyName || m.name}
                              </option>
                            ))}
                        </select>
                      </div>

                      {showPanelSkuSelect && (
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">Select Panel SKUs</label>
                          <Select
                            isMulti
                            isLoading={loadingSkus}
                            options={availablePanelSkus.map(sku => ({ value: sku.skuCode, label: sku.skuCode }))}
                            value={selectedPanelSkus.map(sku => ({ value: sku, label: sku }))}
                            onChange={(selected) => setSelectedPanelSkus(selected ? selected.map(s => s.value) : [])}
                            className="basic-multi-select"
                            classNamePrefix="select"
                            placeholder="Select SKUs..."
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Selected Panel SKUs</label>
                      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl min-h-[100px]">
                        {selectedPanelSkus.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {selectedPanelSkus.map(sku => (
                              <span key={sku} className="bg-white border border-blue-200 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center shadow-sm">
                                {sku}
                                <button
                                  type="button"
                                  className="ml-2 text-blue-400 hover:text-red-500 transition-colors"
                                  onClick={() => setSelectedPanelSkus(prev => prev.filter(s => s !== sku))}
                                >
                                  <X size={14} />
                                </button>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60 italic">
                            <Search size={24} className="mb-1" />
                            <span className="text-sm">No SKUs selected</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Inverter Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 border-b pb-8 border-gray-100">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Select Inverter Brand</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        value={inverterBrand}
                        onChange={(e) => setInverterBrand(e.target.value)}
                      >
                        <option value="">Select a brand</option>
                        <option value="Vesole">Vesole</option>
                        <option value="Luminous">Luminous</option>
                        <option value="Microtek">Microtek</option>
                        {allManufacturers
                          .filter(m => m.product?.toLowerCase().includes('inverter') && !['Vesole', 'Luminous', 'Microtek'].includes(m.brand || m.companyName || m.name))
                          .map(m => (
                            <option key={m._id} value={m.brand || m.companyName || m.name}>
                              {m.brand || m.companyName || m.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Selected Inverter Brand</label>
                      <div className="bg-gray-100 p-4 rounded-xl flex items-center border border-gray-200 h-[50px]">
                        <div className="bg-white px-4 py-1 rounded-lg shadow-sm border border-gray-200 font-bold text-gray-700">
                          {inverterBrand || <span className="text-gray-400 font-normal">None</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* BOM Link */}
                  <div className="mb-6">
                    <button
                      type="button"
                      className="px-6 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 font-bold flex items-center transition-all"
                      onClick={() => setShowBomSection(!showBomSection)}
                    >
                      {showBomSection ? <ChevronUp size={20} className="mr-2" /> : <ChevronDown size={20} className="mr-2" />}
                      {showBomSection ? "Hide BOM Editor" : "Configure Custom BOM"}
                    </button>
                    {showBomSection && (
                      <div className="mt-4 p-6 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl text-center">
                        <p className="text-gray-500 font-medium italic">BOM Editor features are active for this kit.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end p-6 border-t gap-3 bg-gray-50 rounded-b-lg">
                <button
                  type="button"
                  className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 font-medium"
                  onClick={() => setShowComboKitModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-8 py-2 text-white rounded-md font-bold shadow-lg transition-transform hover:scale-105 ${isNewKitTab ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  {isNewKitTab ? 'Create & Save ComboKit' : 'Update & Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  // Render project combokits modal
  const renderProjectCombokitsModal = () => {
    const row = projectRows.find(r => r.id === currentRowId);
    const comboKits = row?.comboKits || [];

    return (
      <div className={`fixed inset-0 z-50 overflow-y-auto ${showProjectCombokitsModal ? 'block' : 'hidden'}`}>
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
          <div className="fixed inset-0 bg-black opacity-50" onClick={() => setShowProjectCombokitsModal(false)}></div>

          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl">
            <div className="flex justify-between items-center p-6 border-b bg-blue-50">
              <h5 className="text-xl font-bold text-blue-800">Project ComboKits</h5>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600"
                onClick={() => setShowProjectCombokitsModal(false)}
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              {comboKits.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-500 text-lg">No ComboKits available for this project</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {comboKits.map((kit, index) => (
                    <div key={index} className="border-2 border-gray-100 rounded-xl p-4 hover:border-blue-200 transition-colors bg-gray-50">
                      <div className="flex justify-between items-start mb-4">
                        <div className="font-bold text-gray-800 text-lg">{kit.name}</div>
                        <div className="flex gap-2">
                          <button
                            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
                            onClick={() => handleAddComboKit(row.id, true, index)}
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm"
                            onClick={() => handleViewCombokitDetails(kit)}
                            title="View"
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center text-gray-600">
                          <span className="font-semibold w-24">Panels:</span>
                          <span className="bg-white px-2 py-0.5 rounded border">{kit.panelBrand || 'N/A'}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <span className="font-semibold w-24">Inverter:</span>
                          <span className="bg-white px-2 py-0.5 rounded border">{kit.inverterBrand || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end p-6 border-t">
              <button
                type="button"
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-bold"
                onClick={() => setShowProjectCombokitsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render view combokit modal
  const renderViewCombokitModal = () => {
    if (!viewingComboKit) return null;

    return (
      <div className={`fixed inset-0 z-50 overflow-y-auto ${showViewCombokitModal ? 'block' : 'hidden'}`}>
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
          <div className="fixed inset-0 bg-black opacity-50" onClick={() => setShowViewCombokitModal(false)}></div>

          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-6xl">
            <div className="flex justify-between items-center p-6 border-b">
              <h5 className="text-xl font-semibold">ComboKit Details</h5>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600"
                onClick={() => setShowViewCombokitModal(false)}
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                <h4 className="text-xl font-semibold text-blue-600 border-b pb-2">{viewingComboKit.name}</h4>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="text-lg text-gray-600 mb-3 pb-2 border-b">Basic Information</h5>

                  {viewingComboKit.image && (
                    <div className="flex mb-3">
                      <div className="font-semibold text-gray-600 w-36">Image:</div>
                      <div>
                        <img
                          src={viewingComboKit.image}
                          alt="ComboKit"
                          className="max-w-[200px] max-h-[200px] object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Component</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Brand</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Selected SKUs</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-4 py-3 text-sm">Solar Panel</td>
                        <td className="px-4 py-3 text-sm">{viewingComboKit.panelBrand || 'Not specified'}</td>
                        <td className="px-4 py-3 text-sm">
                          {viewingComboKit.panelSkus?.join(', ') || 'None'}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm">Inverter</td>
                        <td className="px-4 py-3 text-sm">{viewingComboKit.inverterBrand || 'Not specified'}</td>
                        <td className="px-4 py-3 text-sm">{viewingComboKit.inverterSkus?.join(', ') || 'None'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex justify-end p-6 border-t">
              <button
                type="button"
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                onClick={() => setShowViewCombokitModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h4 className="text-2xl font-semibold text-blue-600">
          Add Combokit {selectedStates.length > 0 ? `- ${selectedStates.length} States` : selectedCountryName ? `- ${selectedCountryName}` : ''}
        </h4>
      </div>



      {/* Country Selection */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8">
        <h5 className="text-lg font-semibold text-gray-700 mb-4">Select Country</h5>
        <div className="mb-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={selectAllCountry}
              onChange={handleSelectAllCountries}
              className="mr-2"
            />
            <span className="font-semibold">Select All</span>
          </label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {countries.map(country => {
            const count = getItemKitCount('country', country._id);
            const isSelected = selectedCountries.includes(country._id);
            return (
              <div
                key={country._id}
                className={`border rounded-lg p-4 text-center cursor-pointer transition-transform hover:scale-105 ${isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                  : 'bg-white border-blue-400 text-gray-700 hover:border-blue-600'
                  }`}
                onClick={() => handleCountrySelect(country._id, country.name)}
              >
                <p className="font-bold uppercase tracking-wider text-sm">{country.name}</p>
                {count > 0 && (
                  <p className={`text-[10px] mt-1 font-bold ${isSelected ? 'text-blue-100' : 'text-blue-600'}`}>
                    {count} ComboKit{count !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* State Selection */}
      {selectedCountries.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8">
          <h5 className="text-lg font-semibold text-gray-700 mb-4">Select State</h5>
          <label className="flex items-center cursor-pointer mb-4">
            <input
              type="checkbox"
              checked={selectAllState}
              onChange={handleSelectAllStates}
              className="mr-2"
            />
            <span className="font-semibold">Select All States</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {stateOptions.map(state => {
              const count = getItemKitCount('state', state._id);
              return (
                <div
                  key={state._id}
                  className={`border rounded-lg p-4 text-center cursor-pointer transition-transform hover:scale-105 ${selectedStates.includes(state._id)
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                    : 'bg-white border-blue-500 hover:border-blue-700'
                    }`}
                  onClick={() => handleStateSelect(state._id)}
                >
                  <p className="font-medium text-sm">{state.name}</p>
                  {count > 0 && (
                    <p className={`text-[10px] mt-1 font-bold ${selectedStates.includes(state._id) ? 'text-blue-100' : 'text-blue-600'}`}>
                      {count} ComboKit{count !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Project Form */}
      {showProjectForm && (
        <div>
          {/* Cluster Selection */}
          <h5 className="text-lg font-semibold text-gray-700 mb-4">Select Cluster</h5>
          {renderClusterCards()}

          {/* District Selection FIRST */}
          {showDistrictSection && renderDistrictCards()}

          {/* Role (CP Type) Selection SECOND */}
          {showRoleSection && renderRoleCards()}

          {/* Plan Selection THIRD */}
          {showPlanSection && renderPlanCards()}

          {/* Action Buttons */}
          <div className="flex gap-3 mb-8">
            <button
              className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
              onClick={handleAddProject}
            >
              <Plus size={18} className="mr-2" />
              Add Project
            </button>
            <button
              className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center"
              onClick={() => {
                if (selectedStates.length === 0) {
                  alert('Please select at least one state');
                  return;
                }
                alert(`Approval process initiated for ${selectedStates.length} selected states`);
              }}
            >
              <CheckCircle size={18} className="mr-2" />
              Approval
            </button>
          </div>

        </div>
      )}

      {/* Project Table - Always show if there is data or even if empty to maintain UI structure */}
      {renderProjectTable()}

      {/* Modals */}
      {renderComboKitModal()}
      {renderProjectCombokitsModal()}
      {renderViewCombokitModal()}
    </div>
  );
}

// State Card Component
function StateCard({ stateCode, stateName, onSelect, selected }) {
  const handleClick = () => {
    onSelect(stateCode, stateName);
  };

  return (
    <div
      className={`border rounded-lg p-4 text-center cursor-pointer transition-transform hover:scale-105 ${selected
        ? 'bg-blue-600 text-white border-blue-600'
        : 'border-blue-500 hover:border-blue-700'
        }`}
      onClick={handleClick}
    >
      <p className="font-medium">{stateName}</p>
    </div>
  );
}