import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, X, Trash2, Edit, ChevronDown, ChevronRight } from 'lucide-react';
import { getRoles, createRole, updateRole, deleteRole, getDepartments } from '../../../services/hrService';
import { locationAPI } from '../../../../api/api';
import { getDepartmentModules, getModules } from '../../../../services/hr/departmentModuleApi';
import { toast } from 'react-hot-toast';

const SIDEBAR_MODULES = [
  {
    category: "Dashboard",
    modules: [
      { name: "User Performance", key: "dashboard_performance" },
      { name: "Orders", key: "dashboard_orders" },
      { name: "Orders by Loan", key: "dashboard_orders_loan" },
      { name: "Installer", key: "dashboard_installer" },
      { name: "Delivery", key: "dashboard_delivery" },
      { name: "Inventory", key: "dashboard_inventory" },
      { name: "Vendors", key: "dashboard_vendors" },
    ]
  },
  {
    category: "Departments",
    modules: [
      { name: "Organization chart", key: "dept_org_chart" }
    ]
  },
  {
    category: "Approvals",
    modules: [
      { name: "Approvals", key: "approvals_main" }
    ]
  },
  {
    category: "Project Management",
    modules: [
      { name: "Project Management", key: "pm_main" }
    ]
  },
  {
    category: "Operations",
    modules: [
      { name: "Our Warehouse", key: "ops_warehouse" },
      { name: "Add Inventory", key: "ops_add_inventory" },
      { name: "Inventory Management", key: "ops_inventory" },
    ]
  },
  {
    category: "Settings",
    modules: [
      { name: "Location Settings", key: "settings_location" },
      { name: "HR Settings", key: "settings_hr" },
      { name: "Vendor Settings", key: "settings_vendor" },
      { name: "Sales Settings", key: "settings_sales" },
      { name: "Marketing Settings", key: "settings_marketing" },
      { name: "Delivery Settings", key: "settings_delivery" },
      { name: "Installer Settings", key: "settings_installer" },
      { name: "Inventory Management", key: "settings_inventory" },
      { name: "Product Configuration", key: "settings_product" },
      { name: "Brand Manufacturer", key: "settings_brand" },
      { name: "ComboKit", key: "settings_combokit" },
      { name: "Combokit Overview", key: "settings_combokit_overview" },
      { name: "Order Procurement", key: "settings_order_procurement" },
      { name: "Franchisee Settings", key: "settings_franchisee" },
      { name: "Dealer Settings", key: "settings_dealer" },
      { name: "HRMS Settings", key: "settings_hrms" },
      { name: "Project Management Settings", key: "settings_project" },
      { name: "Quote", key: "settings_quote" },
      { name: "Approval Overdue Setting", key: "settings_approval_overdue" },
      { name: "Overdue Task Setting", key: "settings_overdue_task" },
      { name: "Overdue Status Setting", key: "settings_overdue_status" },
      { name: "Franchisee Manager Setting", key: "settings_franchisee_manager" },
      { name: "Franchise Buy Lead Setting", key: "settings_franchise_buy_lead" },
      { name: "Loan Setting", key: "settings_loan" },
      { name: "Checklist Setting", key: "settings_checklist" },
    ]
  },
  {
    category: "Report",
    modules: [
      { name: "Financial & P&L", key: "report_financial" },
      { name: "Cashflow", key: "report_cashflow" },
      { name: "Inventory", key: "report_inventory" },
      { name: "Loans", key: "report_loans" },
      { name: "Captable", key: "report_captable" },
      { name: "Revenue By CP Types", key: "report_revenue" },
      { name: "Cluster", key: "report_cluster" },
      { name: "District", key: "report_district" },
      { name: "City", key: "report_city" },
    ]
  }
];

const ALL_SUB_MODULES = [...new Set(SIDEBAR_MODULES.reduce((acc, cat) => acc.concat(cat.modules.map(m => m.name)), []))];
const ALL_CATEGORIES = SIDEBAR_MODULES.map(c => c.category);

const OPTIONAL_TASKS_STRUCTURE = [
  { category: "User Performance", subItems: ["User Performance"] },
  { category: "Franchise Manager Dashboard", subItems: ["Franchise Manager Dashboard"] },
  { category: "Franchise Dashboard", subItems: ["Franchise Dashboard"] },
  { category: "Dealer Manager Dashboard", subItems: ["Dealer Manager Dashboard"] },
  { category: "Dealer Dashboard", subItems: ["Dealer Dashboard"] },
  { category: "Order by Loan", subItems: ["Order by Loan"] },
  { category: "Installer", subItems: ["Solar Installer", "Installer Tool Requirement", "Rating Setting", "Installer Agency Plans", "Installer Vendors"] },
  { category: "Delivery", subItems: ["Delivery Type", "Delivery Benchmark Price", "Vehicle Selection", "Vendor Delivery Plan"] },
  { category: "Inventory", subItems: ["Inventory Overview", "Inventory Level Management", "AutoLock Order Limit"] },
  { category: "Vendors", subItems: ["Supplier Type", "Supplier Vendors"] },
  { category: "Organization Chart", subItems: ["Organization Chart"] },
  { category: "Location Settings", subItems: ["Setup Locations"] },
  { category: "HR Settings", subItems: ["Role Settings", "Create Department", "Department-wise Modules", "Temporary Incharge Setting"] },
  { category: "Vendor Settings", subItems: ["Installer Vendors", "Supplier Type", "Supplier Vendors"] },
  { category: "Sales Settings", subItems: ["Set Price", "Set Price for AMC", "Offers", "Solar Panel Bundle Setting"] },
  { category: "Marketing Settings", subItems: ["Campaign Management"] },
  { category: "Delivery Settings", subItems: ["Delivery Type", "Delivery Benchmark Price", "Vehicle Selection", "Vendor Delivery Plan"] },
  { category: "Installer Settings", subItems: ["Solar Installer", "Installer Tool Requirement", "Rating Setting", "Installer Agency Plans"] },
  { category: "Inventory Management", subItems: ["Inventory Overview", "Inventory Level Management", "AutoLock Order Limit"] },
  { category: "Product Configuration", subItems: ["ComboKit Brand Overview", "Add Project Type", "Add Project Category", "Add Product", "SKU", "Price Matrix", "Add Unit Management"] },
  { category: "Brand Manufacturer", subItems: ["Add Brand Manufacturer", "Brand Supplier Overview"] },
  { category: "ComboKit", subItems: ["Create SolarKit", "Create AMC", "AMC Services"] },
  { category: "ComboKit Overview", subItems: ["ComboKit Overview"] },
  { category: "Order Procurement", subItems: ["Order Procurement"] },
  { category: "Franchise Settings", subItems: ["Franchise Plans", "Franchise Points & Rewards", "Franchise Onboarding Goals", "Franchise Permission Type", "Order Settings"] },
  { category: "Dealer Settings", subItems: ["Dealer Plans", "Dealer Points & Reward Setting", "Dealer Onboarding Goals", "Dealer Permission Type"] },
  { category: "HMS Settings", subItems: ["HMS Settings", "Candidate Test Setting", "Candidate Training Setting"] },
  { category: "Project Management Settings", subItems: ["Project Journey Stage Setting", "Project Management Overdue Setting", "Project Management Configuration", "Project Documentation Setting", "Placeholder Name Setting"] },
  { category: "Financial & P&L", subItems: ["Financial & P&L"] },
  { category: "Cashflow", subItems: ["Cashflow"] },
  { category: "Inventory", subItems: ["Inventory"] },
  { category: "Loans", subItems: ["Loans"] },
  { category: "Capital", subItems: ["Capital"] }
];

export default function RoleSettings() {
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    level: '',
    parentRole: '',
    isChildPosition: false,
    tempIncharge: ''
  });

  const [selectedMandatoryTasks, setSelectedMandatoryTasks] = useState([]);
  const [selectedOptionalTasks, setSelectedOptionalTasks] = useState([]);
  const [selectedRights, setSelectedRights] = useState([]);

  // Data Options
  const [allModulesList, setAllModulesList] = useState([]);
  const [deptModulesList, setDeptModulesList] = useState([]);

  // Location Hierarchy State
  const [locationData, setLocationData] = useState({
    states: [],
    clusters: [],
    districts: []
  });

  const [selectedLocation, setSelectedLocation] = useState({
    state: '',
    cluster: '',
    district: '',
    country: ''
  });

  // UI State
  const [showLocationCards, setShowLocationCards] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [activeTaskModalType, setActiveTaskModalType] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState([]);
  const [editingRoleId, setEditingRoleId] = useState(null); // Used for editing if we implement it, unused for now.

  const allLevels = ["Country", "State", "Cluster", "District", "Zone"];

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [deptRes, roleRes, modRes, stateRes] = await Promise.all([
        getDepartments(),
        getRoles(),
        getModules(),
        locationAPI.getAllStates({ isActive: true })
      ]);
      if (deptRes.success) setDepartments(deptRes.data);
      if (roleRes.success) setRoles(roleRes.data);
      if (modRes.success) setAllModulesList(modRes.data || modRes.modules || []);
      if (stateRes.data && stateRes.data.data) {
        setLocationData(prev => ({ ...prev, states: stateRes.data.data }));
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load initial data");
    } finally {
      setLoading(false);
    }
  };


  // Fetch Clusters when State changes
  useEffect(() => {
    const fetchClusters = async () => {
      if (selectedLocation.state) {
        try {
          const params = { isActive: true };
          if (selectedLocation.state !== 'all') {
            params.stateId = selectedLocation.state;
          }
          const res = await locationAPI.getAllClusters(params);
          setLocationData(prev => ({ ...prev, clusters: res.data?.data || [] }));
        } catch (error) {
          console.error('Failed to fetch clusters:', error);
          setLocationData(prev => ({ ...prev, clusters: [] }));
        }
      } else {
        setLocationData(prev => ({ ...prev, clusters: [] }));
      }
    };
    fetchClusters();
  }, [selectedLocation.state]);

  // Fetch Districts when Cluster changes
  useEffect(() => {
    const fetchDistricts = async () => {
      if (selectedLocation.cluster) {
        try {
          if (selectedLocation.cluster !== 'all') {
            const res = await locationAPI.getClusterById(selectedLocation.cluster);
            if (res.data?.data?.districts) {
              setLocationData(prev => ({ ...prev, districts: res.data.data.districts }));
            } else {
              setLocationData(prev => ({ ...prev, districts: [] }));
            }
          } else {
            const params = { isActive: true };
            if (selectedLocation.state && selectedLocation.state !== 'all') {
              params.stateId = selectedLocation.state;
            }
            const res = await locationAPI.getAllDistricts(params);
            setLocationData(prev => ({ ...prev, districts: res.data?.data || [] }));
          }
        } catch (error) {
          console.error('Failed to fetch districts:', error);
          setLocationData(prev => ({ ...prev, districts: [] }));
        }
      } else {
        setLocationData(prev => ({ ...prev, districts: [] }));
      }
    };
    fetchDistricts();
  }, [selectedLocation.cluster, selectedLocation.state]);


  // Fetch Dept Modules when Department changes
  useEffect(() => {
    const fetchDeptMods = async () => {
      if (formData.department) {
        try {
          const res = await getDepartmentModules(formData.department);
          if (res.success && res.accessList) {
            setDeptModulesList(res.accessList.map(m => m.moduleId));
          } else {
            setDeptModulesList([]);
          }
        } catch (error) {
          console.error('Failed to fetch department modules:', error);
          setDeptModulesList([]);
        }
      } else {
        setDeptModulesList([]);
      }
    };
    fetchDeptMods();
  }, [formData.department]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTaskToggle = (task, type) => {
    if (type === 'mandatory') {
      setSelectedMandatoryTasks(prev =>
        prev.includes(task) ? prev.filter(t => t !== task) : [...prev, task]
      );
    } else {
      setSelectedOptionalTasks(prev =>
        prev.includes(task) ? prev.filter(t => t !== task) : [...prev, task]
      );
    }
  };

  const handleRightToggle = (right) => {
    setSelectedRights(prev =>
      prev.includes(right) ? prev.filter(r => r !== right) : [...prev, right]
    );
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.department) {
      toast.error("Position Name and Department are required");
      return;
    }

    if (!selectedLocation.district) {
      toast.error("Please select a complete location hierarchy (District)");
      return;
    }

    if (formData.isChildPosition && !formData.parentRole) {
      toast.error("Please select a Parent Position for this child role");
      return;
    }

    const payload = {
      name: formData.name,
      department: formData.department,
      level: formData.level,
      parentRole: formData.parentRole || null,
      isChildPosition: formData.isChildPosition,
      tempIncharge: formData.tempIncharge || '',
      country: selectedLocation.country || null,
      state: selectedLocation.state || null,
      cluster: selectedLocation.cluster || null,
      district: selectedLocation.district || null,
      city: null,
      zone: null,
      mandatoryTasks: selectedMandatoryTasks,
      optionalTasks: selectedOptionalTasks,
      rights: selectedRights
    };

    try {
      // If editingRoleId is set, we could call updateRole. For now, it's just create mode as per image
      const res = await createRole(payload);
      if (res.success) {
        toast.success("Role created successfully");
        resetForm();
        fetchInitialData();
      }
    } catch (error) {
      console.error("Create role error:", error);
      toast.error(error.response?.data?.message || "Failed to create role");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this role?")) return;
    try {
      const res = await deleteRole(id);
      if (res.success) {
        toast.success("Role deleted");
        fetchInitialData();
      }
    } catch (error) {
      console.error("Delete role error:", error);
      toast.error("Failed to delete role");
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      department: '',
      level: '',
      parentRole: '',
      isChildPosition: false,
      tempIncharge: ''
    });
    setSelectedMandatoryTasks([]);
    setSelectedOptionalTasks([]);
    setSelectedRights([]);
  };

  // Filter roles based on selected district
  const displayedRoles = (() => {
    if (!selectedLocation.state) return [];

    // Base filter: active state
    let filtered = roles;

    // Filter by State
    if (selectedLocation.state !== 'all') {
      filtered = filtered.filter(r => r.state === selectedLocation.state);
    }

    // Filter by Cluster
    if (selectedLocation.cluster && selectedLocation.cluster !== 'all') {
      filtered = filtered.filter(r => r.cluster === selectedLocation.cluster);
    }

    // Filter by District
    if (selectedLocation.district && selectedLocation.district !== 'all') {
      filtered = filtered.filter(r => r.district === selectedLocation.district);
    }

    // Return if at least a district selection holds (either 'all' or specific id)
    return selectedLocation.district ? filtered : [];
  })();

  // Card Render Helper
  const LocationCard = ({ title, subtitle, isSelected, onClick }) => (
    <div
      onClick={onClick}
      className={`border rounded-lg p-4 cursor-pointer text-center transition-all ${isSelected
        ? 'bg-[#82c5fa] border-blue-400 shadow-md text-gray-900'
        : 'bg-white border-gray-200 hover:border-[#82c5fa] hover:shadow-sm text-gray-800'
        }`}
    >
      <div className="font-bold mb-1">{title}</div>
      <div className={`text-sm ${isSelected ? 'text-gray-700' : 'text-gray-500'}`}>{subtitle}</div>
    </div>
  );

  return (
    <div className="p-4 relative">
      {/* Header */}
      <div className="mb-4">
        <nav className="bg-white p-3 rounded-lg shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          <div>
            <h3 className="font-bold text-xl mb-2 text-[#0b386a]">Role Based Task Allocation</h3>
            <button
              onClick={() => setShowLocationCards(!showLocationCards)}
              className="mt-1 text-sm bg-[#1b62a6] hover:bg-[#144d85] text-white px-3 py-1.5 rounded-md flex items-center gap-2"
            >
              {showLocationCards ? <><EyeOff size={16} /> Hide Location Cards</> : <><Eye size={16} /> Show Location Cards</>}
            </button>
          </div>
        </nav>
      </div>

      {/* Location Hierarchy Cards section */}
      {showLocationCards && (
        <div className="mb-6 space-y-6">

          {/* States */}
          <div>
            <h4 className="font-bold text-lg mb-3 text-[#0b386a]">Select State</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <LocationCard
                title="All States"
                subtitle="ALL"
                isSelected={selectedLocation.state === 'all'}
                onClick={() => {
                  setSelectedLocation({
                    state: 'all',
                    cluster: '',
                    district: '',
                    country: '' // Handle 'all' logic appropriately in your backend calls later if needed, but visually it works here
                  });
                }}
              />
              {locationData.states.map(s => (
                <LocationCard
                  key={s._id}
                  title={s.name}
                  subtitle={s.code || s.name.substring(0, 2).toUpperCase()}
                  isSelected={selectedLocation.state === s._id}
                  onClick={() => {
                    setSelectedLocation({
                      state: s._id,
                      cluster: '',
                      district: '',
                      country: s.country?._id || s.country || ''
                    });
                  }}
                />
              ))}
            </div>
            {locationData.states.length === 0 && <p className="text-gray-500 italic">No states found.</p>}
          </div>

          {/* Clusters */}
          {selectedLocation.state && (
            <div>
              <h4 className="font-bold text-lg mb-3 text-[#0b386a]">Select Cluster</h4>
              {/* Clusters Display */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <LocationCard
                  title="All Clusters"
                  subtitle="ALL"
                  isSelected={selectedLocation.cluster === 'all'}
                  onClick={() => {
                    setSelectedLocation(prev => ({ ...prev, cluster: 'all', district: '' }));
                  }}
                />
                {locationData.clusters.map(c => {
                  const parentState = locationData.states.find(s => s._id === c.state);
                  return (
                    <LocationCard
                      key={c._id}
                      title={c.name}
                      subtitle={parentState ? parentState.name : 'State'}
                      isSelected={selectedLocation.cluster === c._id}
                      onClick={() => {
                        setSelectedLocation(prev => ({ ...prev, cluster: c._id, district: '' }));
                      }}
                    />
                  );
                })}
              </div>
              {locationData.clusters.length === 0 && <p className="text-gray-500 italic">No clusters found.</p>}
            </div>
          )}

          {/* Districts */}
          {selectedLocation.cluster && (
            <div>
              <h4 className="font-bold text-lg mb-3 text-[#0b386a]">Select District</h4>
              {/* Districts Display */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <LocationCard
                  title="All Districts"
                  subtitle="ALL"
                  isSelected={selectedLocation.district === 'all'}
                  onClick={() => {
                    setSelectedLocation(prev => ({ ...prev, district: 'all' }));
                  }}
                />
                {locationData.districts.map(d => {
                  const parentCluster = locationData.clusters.find(c => c._id === selectedLocation.cluster);
                  return (
                    <LocationCard
                      key={d._id}
                      title={d.name}
                      subtitle={parentCluster ? parentCluster.name : 'Cluster'}
                      isSelected={selectedLocation.district === d._id}
                      onClick={() => {
                        setSelectedLocation(prev => ({ ...prev, district: d._id }));
                      }}
                    />
                  );
                })}
              </div>
              {locationData.districts.length === 0 && <p className="text-gray-500 italic">No districts found.</p>}
            </div>
          )}

        </div>
      )}

      {/* Conditionally render tables only if District is selected */}
      {selectedLocation.district && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-6">
            <div className="overflow-x-auto">
              {/* Combine Create Form and List into one clean table structure as per PHP layout */}
              <table className="w-full text-left align-middle border-collapse text-sm">

                {/* Header Row (Light Blue #82c5fa) */}
                <thead className="bg-[#82c5fa] text-white">
                  <tr>
                    <th className="p-3 border-r border-white/20 font-semibold w-[15%]">Position</th>
                    <th className="p-3 border-r border-white/20 font-semibold w-[12%]">Department</th>
                    <th className="p-3 border-r border-white/20 font-semibold w-[12%]">Level</th>
                    <th className="p-3 border-r border-white/20 font-semibold w-[15%]">Parent Position</th>
                    <th className="p-3 border-r border-white/20 font-semibold w-[10%] text-center leading-tight">Mandatory Tasks<br /><span className="text-xs font-normal opacity-80">(Click to Set)</span></th>
                    <th className="p-3 border-r border-white/20 font-semibold w-[10%] text-center leading-tight">Optional Tasks<br /><span className="text-xs font-normal opacity-80">(Click to Set)</span></th>
                    <th className="p-3 border-r border-white/20 font-semibold w-[10%] text-center">Rights</th>
                    <th className="p-3 border-r border-white/20 font-semibold w-[14%] text-center leading-tight">Temporary In-Charge</th>
                    <th className="p-3 font-semibold w-[8%] text-center">Create</th>
                  </tr>
                </thead>

                <tbody>
                  {/* Create New Role Row */}
                  <tr className="bg-gray-50 border-b border-gray-200 align-top">
                    {/* Position */}
                    <td className="p-3 border-r border-gray-200">
                      <input
                        type="text"
                        className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm mb-2"
                        placeholder="Enter Position name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                      />
                      <label className="flex items-center text-xs text-gray-700 cursor-pointer">
                        <input
                          type="radio"
                          name="isChildPosition"
                          className="mr-1.5 cursor-pointer accent-blue-600"
                          checked={formData.isChildPosition}
                          onChange={(e) => handleInputChange('isChildPosition', e.target.checked)}
                          onClick={(e) => {
                            // Allow unchecking a radio by clicking it again
                            if (formData.isChildPosition) {
                              e.preventDefault();
                              handleInputChange('isChildPosition', false);
                            }
                          }}
                        />
                        Child Position
                      </label>
                    </td>

                    {/* Department */}
                    <td className="p-3 border-r border-gray-200">
                      <select
                        className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                        value={formData.department}
                        onChange={(e) => handleInputChange('department', e.target.value)}
                      >
                        <option value="">Select Dept</option>
                        {/* Show unique department names only */}
                        {[...new Map(departments.map(d => [d.name, d])).values()].map(d => (
                          <option key={d._id} value={d._id}>{d.name}</option>
                        ))}
                      </select>
                    </td>

                    {/* Level */}
                    <td className="p-3 border-r border-gray-200">
                      <select
                        className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                        value={formData.level}
                        onChange={(e) => handleInputChange('level', e.target.value)}
                      >
                        <option value="">Select Level</option>
                        {allLevels.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </td>

                    {/* Parent Position */}
                    <td className="p-3 border-r border-gray-200">
                      <select
                        className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm disabled:bg-gray-100 disabled:text-gray-400"
                        value={formData.parentRole}
                        onChange={(e) => handleInputChange('parentRole', e.target.value)}
                        disabled={!formData.isChildPosition}
                      >
                        <option value="">Select Parent</option>
                        {[...new Map(roles.map(r => [r.name, r])).values()].map(r => (
                          <option key={r._id} value={r._id}>{r.name}</option>
                        ))}
                      </select>
                    </td>

                    {/* Mandatory Tasks (Clickable area to open modal) */}
                    <td
                      className="p-3 border-r border-gray-200 text-center align-middle cursor-pointer hover:bg-gray-100 transition-colors group"
                      onClick={() => {
                        if (!formData.department) {
                          toast.error("Please select a Department first to view tasks.");
                          return;
                        }
                        setActiveTaskModalType('mandatory');
                        setShowTaskModal(true);
                      }}
                    >
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-xs text-gray-500 mb-1 group-hover:text-blue-600 font-medium">
                          {selectedMandatoryTasks.length > 0
                            ? `${selectedMandatoryTasks.length} Selected`
                            : '-'}
                        </span>
                      </div>
                    </td>

                    {/* Optional Tasks (Clickable area to open modal) */}
                    <td
                      className="p-3 border-r border-gray-200 text-center align-middle cursor-pointer hover:bg-gray-100 transition-colors group"
                      onClick={() => {
                        if (!formData.department) {
                          toast.error("Please select a Department first to view tasks.");
                          return;
                        }
                        setActiveTaskModalType('optional');
                        setShowTaskModal(true);
                      }}
                    >
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-xs text-gray-500 mb-1 group-hover:text-blue-600 font-medium">
                          {selectedOptionalTasks.length > 0
                            ? `${selectedOptionalTasks.length} Selected`
                            : '-'}
                        </span>
                      </div>
                    </td>

                    {/* Rights Checkboxes */}
                    <td className="p-3 border-r border-gray-200 align-middle">
                      <div className="flex flex-col gap-1 text-xs">
                        {['View', 'Edit', 'Delete', 'Archive'].map((right) => (
                          <label key={right} className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="mr-1.5 rounded-sm accent-blue-600"
                              checked={selectedRights.includes(right)}
                              onChange={() => handleRightToggle(right)}
                            />
                            {right}
                          </label>
                        ))}
                      </div>
                    </td>

                    {/* Temporary In-Charge */}
                    <td className="p-3 border-r border-gray-200 align-middle">
                      <select
                        className="w-full p-2 border border-blue-300 rounded-full focus:ring-1 focus:ring-blue-500 outline-none text-xs text-gray-800"
                        value={formData.tempIncharge}
                        onChange={(e) => handleInputChange('tempIncharge', e.target.value)}
                      >
                        <option value="">Select Incharge</option>
                        {/* Assuming Temp Incharge maps to a department/role, using departments as per "Marketing" badge in PHP image */}
                        {/* Unique In-charge names from departments */}
                        {[...new Map(departments.map(d => [d.name, d])).values()].map(d => (
                          <option key={d._id} value={d.name}>{d.name}</option>
                        ))}
                      </select>
                    </td>

                    {/* (Removed Set Task Button Column) */}

                    {/* Create Button */}
                    <td className="p-3 text-center align-middle">
                      <button
                        onClick={handleSubmit}
                        className="bg-[#17a2b8] hover:bg-[#138496] shadow-sm text-white px-3 py-1.5 rounded-md text-xs font-semibold"
                      >
                        Create
                      </button>
                    </td>
                  </tr>

                  {/* Gap between Create and Display Tables */}
                  <tr><td colSpan="9" className="h-6 bg-white border-0"></td></tr>

                  {/* Dark Data Header Row */}
                  <tr className="bg-[#2c3e50] text-white">
                    <th className="p-3 border-r border-white/10 font-medium">Position</th>
                    <th className="p-3 border-r border-white/10 font-medium whitespace-nowrap">Department</th>
                    <th className="p-3 border-r border-white/10 font-medium">Level</th>
                    <th className="p-3 border-r border-white/10 font-medium leading-tight">Parent<br />Position</th>
                    <th className="p-3 border-r border-white/10 font-medium text-center">Mandatory Tasks</th>
                    <th className="p-3 border-r border-white/10 font-medium text-center">Optional Tasks</th>
                    <th className="p-3 border-r border-white/10 font-medium text-center">Rights</th>
                    <th className="p-3 border-r border-white/10 font-medium text-center leading-tight">Temporary<br />In-Charge</th>
                    <th className="p-3 font-medium text-center" colSpan="2">Edit / Delete</th>
                  </tr>

                  {/* Data Rows */}
                  {loading ? (
                    <tr><td colSpan="10" className="p-8 text-center text-gray-500 bg-white">Loading roles...</td></tr>
                  ) : displayedRoles.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="p-8 text-center text-gray-500 bg-white">
                        <div className="flex flex-col items-center justify-center py-4">
                          <EyeOff size={24} className="text-gray-400 mb-2" />
                          <p>No roles configured for this district yet.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    displayedRoles.map(role => {
                      const dept = departments.find(d => d._id === role.department);
                      const parent = roles.find(r => r._id === role.parentRole);

                      // Displaying state/cluster/district if level requires based on image layout
                      const levelDisp = role.level === 'State' || role.level === 'State Level' ? `State Level\n${role.state}` : role.level;

                      return (
                        <tr key={role._id} className="bg-white hover:bg-gray-50 border-b border-gray-200">
                          <td className="p-3 border-r border-gray-200 align-top font-medium text-gray-800">{role.name}</td>
                          <td className="p-3 border-r border-gray-200 align-top text-gray-600">{dept ? dept.name : '-'}</td>
                          <td className="p-3 border-r border-gray-200 align-top text-gray-600 whitespace-pre-wrap text-xs leading-relaxed">
                            {role.level || '-'}
                            {role.level === 'State' && locationData.states.find(s => s._id === role.state) && `\n${locationData.states.find(s => s._id === role.state).name}`}
                            {role.level === 'Cluster' && locationData.clusters.find(c => c._id === role.cluster) && `\n${locationData.clusters.find(c => c._id === role.cluster).name}`}
                            {role.level === 'District' && locationData.districts.find(d => d._id === role.district) && `\n${locationData.districts.find(d => d._id === role.district).name}`}
                          </td>
                          <td className="p-3 border-r border-gray-200 align-top text-gray-600">{parent ? parent.name : '-'}</td>

                          {/* Lists */}
                          <td className="p-3 border-r border-gray-200 align-top">
                            {role.mandatoryTasks?.length > 0 ? (
                              <ul className="list-disc pl-4 text-xs text-gray-700 space-y-1">
                                {role.mandatoryTasks.map((t, i) => <li key={i}>{t}</li>)}
                              </ul>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </td>
                          <td className="p-3 border-r border-gray-200 align-top">
                            {role.optionalTasks?.length > 0 ? (
                              <ul className="list-disc pl-4 text-xs text-gray-700 space-y-1">
                                {role.optionalTasks.map((t, i) => <li key={i}>{t}</li>)}
                              </ul>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </td>
                          <td className="p-3 border-r border-gray-200 align-top">
                            {role.rights?.length > 0 ? (
                              <ul className="list-disc pl-4 text-xs text-gray-700 space-y-1">
                                {role.rights.map((r, i) => <li key={i}>{r}</li>)}
                              </ul>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </td>

                          {/* Temp Incharge Badge */}
                          <td className="p-3 border-r border-gray-200 text-center align-top">
                            {role.tempIncharge ? (
                              <span className="inline-block bg-gray-500 text-white px-2 py-0.5 rounded text-xs font-semibold tracking-wide">
                                {role.tempIncharge}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </td>

                          {/* Action Buttons */}
                          <td className="p-3 align-top text-center" colSpan="2">
                            <div className="flex flex-col items-center gap-2">
                              <button className="bg-[#17a2b8] hover:bg-[#138496] shadow-sm text-white px-4 py-1.5 rounded-md text-xs font-semibold w-16">
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(role._id)}
                                className="bg-red-500 hover:bg-red-600 shadow-sm text-white w-16 py-1.5 rounded-md text-xs font-semibold transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Task Selection Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center bg-[#0b386a] text-white p-4">
              <h3 className="font-bold text-lg">Select Tasks</h3>
              <button onClick={() => setShowTaskModal(false)} className="hover:text-gray-300"><X size={20} /></button>
            </div>

            <div className="p-6 grid grid-cols-1 gap-6">
              {/* Mandatory Tasks */}
              {activeTaskModalType === 'mandatory' && (
                <div className="border rounded-lg flex flex-col h-80">
                  <div className="bg-gray-100 p-2 border-b font-semibold text-sm text-center">
                    Mandatory Tasks (Dept Modules)
                  </div>
                  <div className="p-3 overflow-y-auto flex-1 custom-scrollbar">
                    {(() => {
                      const explicitMandatoryList = [
                        'Dashboard',
                        'Departments',
                        'Approvals',
                        'Project Management',
                        'Operations',
                        'Settings',
                        'Report'
                      ];

                      return explicitMandatoryList.map(task => (
                        <label key={task} className="flex items-start mb-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded border border-transparent hover:border-gray-200">
                          <input
                            type="checkbox"
                            className="mt-0.5 mr-2 accent-blue-600"
                            checked={selectedMandatoryTasks.includes(task)}
                            onChange={() => handleTaskToggle(task, 'mandatory')}
                          />
                          <span className="text-sm text-gray-700 leading-tight">{task}</span>
                        </label>
                      ));
                    })()}
                  </div>
                </div>
              )}

              {/* Optional Tasks (Accordion) */}
              {activeTaskModalType === 'optional' && (
                <div className="border rounded-lg flex flex-col h-[500px]">
                  <div className="bg-gray-100 p-2 border-b font-semibold text-sm text-center">
                    Optional Tasks (Other Modules)
                  </div>
                  <div className="p-3 overflow-y-auto flex-1 custom-scrollbar">
                    {OPTIONAL_TASKS_STRUCTURE.map((catObj) => {
                      const isExpanded = expandedCategories.includes(catObj.category);
                      const allSelected = catObj.subItems.every(item => selectedOptionalTasks.includes(item));
                      const someSelected = catObj.subItems.some(item => selectedOptionalTasks.includes(item));

                      return (
                        <div key={catObj.category} className="mb-2 border rounded overflow-hidden">
                          <div
                            className="bg-gray-50 p-2 flex items-center justify-between cursor-pointer hover:bg-gray-100"
                            onClick={() => {
                              setExpandedCategories(prev =>
                                prev.includes(catObj.category)
                                  ? prev.filter(c => c !== catObj.category)
                                  : [...prev, catObj.category]
                              );
                            }}
                          >
                            <div className="flex items-center gap-2">
                              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                              <input
                                type="checkbox"
                                className="accent-blue-600"
                                checked={allSelected}
                                ref={el => el && (el.indeterminate = someSelected && !allSelected)}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  const newVal = e.target.checked;
                                  let updated = [...selectedOptionalTasks];
                                  catObj.subItems.forEach(item => {
                                    if (newVal) {
                                      if (!updated.includes(item)) updated.push(item);
                                    } else {
                                      updated = updated.filter(u => u !== item);
                                    }
                                  });
                                  setSelectedOptionalTasks(updated);
                                }}
                              />
                              <span className="text-sm font-medium text-gray-700">{catObj.category}</span>
                            </div>
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                              {catObj.subItems.filter(i => selectedOptionalTasks.includes(i)).length} / {catObj.subItems.length}
                            </span>
                          </div>

                          {isExpanded && (
                            <div className="p-3 bg-white grid grid-cols-2 gap-x-4 gap-y-2 border-t">
                              {catObj.subItems.map(item => (
                                <label key={item} className="flex items-center gap-2 cursor-pointer hover:text-blue-600">
                                  <input
                                    type="checkbox"
                                    className="accent-blue-600"
                                    checked={selectedOptionalTasks.includes(item)}
                                    onChange={() => handleTaskToggle(item, 'optional')}
                                  />
                                  <span className="text-xs text-gray-600">{item}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}


            </div>

            <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowTaskModal(false)}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}