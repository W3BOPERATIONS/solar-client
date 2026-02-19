import React, { useState, useEffect } from 'react';
import {
  Building2, Home, MapPin, Users, Truck, Package,
  DollarSign, Wrench, ShoppingBag, Briefcase, Megaphone,
  ClipboardList, CheckCircle, Clock, TrendingUp,
  ChevronRight, Eye, LayoutDashboard,
  Settings as Gear, Box, Layers, FileText, ShoppingCart,
  Compass, Grid3x3, CheckSquare, Target, FolderOpen,
  BarChart3, Award, Shield, Cpu, Zap, Sun,
  Battery, PanelTop, PackageOpen, FileCheck,
  Plus, Trash2, Edit2, X, AlertCircle
} from 'lucide-react';
import * as settingsApi from '../../../services/settings/settingsApi';
import * as locationApi from '../../../services/locationApi';

export default function ChecklistSetting() {
  // Hierarchical Location Data
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [clusters, setClusters] = useState([]);

  // Selections
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedCluster, setSelectedCluster] = useState(null);

  const [activeFilter, setActiveFilter] = useState('all');
  const [moduleCategories, setModuleCategories] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Management State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '', // Changed from hardcoded 'Location Setting'
    status: 'active',
    items: []
  });
  const [newItemName, setNewItemName] = useState('');

  // Load Initial Data
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        // Seed if first time or to ensure structure
        await settingsApi.seedChecklists();

        const [fetchedCountries, fetchedChecklists, fetchedCategories] = await Promise.all([
          locationApi.getCountries(),
          settingsApi.fetchChecklists(),
          settingsApi.fetchCategories()
        ]);

        setCountries(fetchedCountries || []);
        setChecklists(fetchedChecklists || []);

        // Use global completions only if we want a global overview when no cluster is selected
        // However, the user wants regional view, so we'll fetch completions when cluster changes
        processCategories(fetchedChecklists, [], fetchedCategories);
      } catch (err) {
        setError('Failed to load initial data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Fetch regional completions when cluster changes
  useEffect(() => {
    const fetchRegionalData = async () => {
      if (selectedCluster) {
        try {
          setLoading(true);
          const completions = await settingsApi.fetchModuleCompletions(selectedCluster._id);
          const categories = await settingsApi.fetchCategories();
          processCategories(checklists, completions, categories);
        } catch (err) {
          console.error('Failed to load regional completions', err);
        } finally {
          setLoading(false);
        }
      } else {
        // Reset to global or empty when no cluster selected
        processCategories(checklists, [], []);
      }
    };
    fetchRegionalData();
  }, [selectedCluster?._id, checklists]);

  const processCategories = (checklistTemplates, completions = [], categories = []) => {
    const processed = categories.map(cat => {
      // Find modules belonging to this category from checklists
      const catModules = checklistTemplates.filter(cl => cl.category === cat.title);

      // Calculate progress based on regional completionStatus
      const completedCount = catModules.filter(cl => {
        // Find the regional completion for this module
        const regComp = completions.find(c => c.moduleName === cl.name);
        return regComp ? regComp.completed : false;
      }).length;

      const progress = catModules.length > 0 ? Math.round((completedCount / catModules.length) * 100) : 0;

      // Map dynamic icon name to Lucide component
      const iconMap = {
        Building2, Home, MapPin, Users, Truck, Package,
        DollarSign, Wrench, ShoppingBag, Briefcase, Megaphone,
        ClipboardList, CheckCircle, Clock, TrendingUp,
        Settings: Gear, Box, Layers, FileText, ShoppingCart,
        Compass, Grid3x3, CheckSquare, Target, FolderOpen,
        BarChart3, Award, Shield, Cpu, Zap, Sun,
        Battery, PanelTop, PackageOpen, FileCheck
      };

      return {
        id: cat._id,
        title: cat.title,
        icon: iconMap[cat.iconName] || ClipboardList,
        iconBg: cat.iconBg || "bg-blue-100 text-blue-600",
        progress: progress,
        modules: catModules.length,
        items: catModules.map(m => {
          const regComp = completions.find(c => c.moduleName === m.name);
          return {
            id: m._id,
            name: m.name,
            status: regComp ? (regComp.completed ? 'completed' : 'pending') : 'pending'
          };
        })
      };
    });

    setModuleCategories(processed);
  };


  const handleCountrySelect = async (country) => {
    setSelectedCountry(country);
    setSelectedState(null);
    setSelectedDistrict(null);
    setSelectedCluster(null);
    setStates([]);
    setDistricts([]);
    setClusters([]);

    if (country) {
      try {
        const fetchedStates = await locationApi.getStates(country._id);
        setStates(fetchedStates || []);
      } catch (err) {
        console.error('Failed to load states', err);
      }
    }
  };

  const handleStateSelect = async (state) => {
    setSelectedState(state);
    setSelectedDistrict(null);
    setSelectedCluster(null);
    setDistricts([]);
    setClusters([]);

    if (state) {
      try {
        const fetchedDistricts = await locationApi.getDistricts({ stateId: state._id });
        setDistricts(fetchedDistricts || []);
      } catch (err) {
        console.error('Failed to load districts', err);
      }
    }
  };

  const handleDistrictSelect = async (district) => {
    setSelectedDistrict(district);
    setSelectedCluster(null);
    setClusters([]);

    if (district) {
      try {
        const fetchedClusters = await locationApi.getClusters(district._id);
        setClusters(fetchedClusters || []);
      } catch (err) {
        console.error('Failed to load clusters', err);
      }
    }
  };

  const handleClusterSelect = (cluster) => {
    setSelectedCluster(cluster);
  };

  // CRUD Operations
  const handleAddItem = () => {
    if (!newItemName.trim()) return;
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { itemName: newItemName, required: true, order: prev.items.length }]
    }));
    setNewItemName('');
  };

  const handleRemoveItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleToggleRequired = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => i === index ? { ...item, required: !item.required } : item)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      setError("Please add at least one item to the checklist");
      return;
    }

    try {
      setLoading(true);
      setError('');
      if (editingId) {
        await settingsApi.updateChecklist(editingId, formData);
        setSuccess('Checklist updated successfully');
      } else {
        await settingsApi.createChecklist(formData);
        setSuccess('Checklist created successfully');
      }

      // Refresh data
      const updatedChecklists = await settingsApi.fetchChecklists();
      const updatedCompletions = await settingsApi.fetchModuleCompletions();
      setChecklists(updatedChecklists);
      processCategories(updatedChecklists, updatedCompletions);

      resetForm();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save checklist');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: moduleCategories.length > 0 ? moduleCategories[0].title : '',
      status: 'active',
      items: []
    });
    setEditingId(null);
    setShowForm(false);
    setNewItemName('');
  };

  const handleEdit = (cl) => {
    setFormData({
      name: cl.name,
      category: cl.category || 'Location Setting',
      status: cl.status,
      items: cl.items
    });
    setEditingId(cl._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this checklist?')) return;
    try {
      setLoading(true);
      await settingsApi.deleteChecklist(id);
      setSuccess('Checklist deleted successfully');

      const updatedChecklists = await settingsApi.fetchChecklists();
      const updatedCompletions = await settingsApi.fetchModuleCompletions();
      setChecklists(updatedChecklists);
      processCategories(updatedChecklists, updatedCompletions);
    } catch (err) {
      setError('Failed to delete checklist');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (cl) => {
    try {
      const newStatus = cl.status === 'active' ? 'inactive' : 'active';
      await settingsApi.updateChecklist(cl._id, { ...cl, status: newStatus });

      const updatedChecklists = await settingsApi.fetchChecklists();
      setChecklists(updatedChecklists);
      processCategories(updatedChecklists, await settingsApi.fetchModuleCompletions());
    } catch (err) {
      setError('Failed to update status');
    }
  };

  const handleToggleCompletion = async (cl) => {
    if (!selectedCluster) {
      setError("Please select a cluster first to record regional completion");
      return;
    }
    try {
      // Find current regional completion
      const currentCompletions = await settingsApi.fetchModuleCompletions(selectedCluster._id);
      const regComp = currentCompletions.find(c => c.moduleName === cl.name);

      const newCompleted = regComp ? !regComp.completed : true;

      // Update ModuleCompletion record scoped to cluster
      await settingsApi.updateModuleCompletion({
        moduleName: cl.name,
        completed: newCompleted,
        progressPercent: newCompleted ? 100 : 0,
        category: cl.category,
        iconName: cl.iconName,
        clusterId: selectedCluster._id
      });

      // Refresh regional data
      const updatedCompletions = await settingsApi.fetchModuleCompletions(selectedCluster._id);
      processCategories(checklists, updatedCompletions, await settingsApi.fetchCategories());
    } catch (err) {
      setError('Failed to update completion status');
      console.error(err);
    }
  };

  // Stats calculation
  const totalModules = checklists.length;
  const completedModules = checklists.filter(c => c.completionStatus === 'completed').length;
  const pendingModules = totalModules - completedModules;
  const completionRate = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

  const stats = [
    { label: "Total Modules", value: totalModules.toString(), subtext: "All categories", icon: ClipboardList, color: "bg-gradient-to-r from-blue-500 to-cyan-500" },
    { label: "Completed", value: completedModules.toString(), subtext: `${completionRate}% of total`, icon: CheckCircle, color: "bg-gradient-to-r from-emerald-500 to-green-600" },
    { label: "Pending", value: pendingModules.toString(), subtext: `${100 - completionRate}% of total`, icon: Clock, color: "bg-gradient-to-r from-amber-500 to-orange-500" }
  ];


  // Get progress color based on percentage
  const getProgressColor = (percentage) => {
    if (percentage >= 80) return "bg-emerald-500";
    if (percentage >= 60) return "bg-blue-500";
    if (percentage >= 40) return "bg-amber-500";
    return "bg-gray-400";
  };

  // Get status badge
  const getStatusBadge = (status) => {
    if (status === "completed") {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle className="w-4 h-4 mr-1" />
          Completed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800 border border-amber-200">
        <Clock className="w-4 h-4 mr-1" />
        Pending
      </span>
    );
  };

  // CSS styles
  const styles = `
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .animate-fadeIn {
      animation: fadeIn 0.5s ease forwards;
    }
    
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    /* Custom scrollbar for module lists */
    .module-list-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    
    .module-list-scrollbar::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 3px;
    }
    
    .module-list-scrollbar::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 3px;
    }
    
    .module-list-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #a8a8a8;
    }
    
    /* Gradient borders */
    .gradient-border {
      position: relative;
    }
    
    .gradient-border::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, #3b82f6, #06b6d4);
      border-radius: 8px 8px 0 0;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    .gradient-border:hover::before {
      opacity: 1;
    }
    
    /* Card hover effects */
    .card-hover {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .card-hover:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }
    
    /* Progress bar animation */
    .progress-bar-animated {
      transition: width 0.6s ease;
    }
    
    /* State card selection */
    .state-card-selected {
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    }
    
    /* Module item hover */
    .module-item-hover {
      transition: all 0.2s ease;
    }
    
    .module-item-hover:hover {
      padding-left: 1.5rem;
      background-color: #f9fafb;
    }
    
    .module-item-hover.completed:hover {
      background-color: #f0fdf4;
    }
    
    .module-item-hover.pending:hover {
      background-color: #fffbeb;
    }
    
    /* Breadcrumb styles */
    .breadcrumb-item {
      position: relative;
    }
    
    .breadcrumb-item:not(:last-child)::after {
      content: '›';
      margin: 0 0.5rem;
      color: #9ca3af;
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <a href="#" className="hover:text-blue-600 transition-colors">Dashboard</a>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <span className="text-gray-800 font-medium">Module Completion Status</span>
            </div>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition shadow-lg"
              >
                <Plus className="w-4 h-4" />
                Add Checklist Template
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 gradient-border card-hover">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 flex items-center">
                  <LayoutDashboard className="w-8 h-8 mr-3 text-blue-600" />
                  Module Completion Dashboard
                </h1>
                <p className="text-gray-600">
                  Track and manage module completion status across different regions and positions
                </p>
              </div>
              <div className="hidden md:flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${loading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                <span className="text-sm text-gray-600">{loading ? 'Syncing...' : 'Live'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
          </div>
        )}
        {success && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 px-6 py-4 rounded-2xl flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5" />
              <span>{success}</span>
            </div>
            <button onClick={() => setSuccess('')}><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Management Form */}
        {showForm && (
          <div className="mb-10 bg-white rounded-2xl shadow-xl p-6 border-b-4 border-blue-500 animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                {editingId ? <Edit2 className="w-5 h-5 text-blue-500" /> : <Plus className="w-5 h-5 text-blue-500" />}
                {editingId ? 'Edit Checklist Template' : 'Create New Checklist Template'}
              </h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 transition">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Checklist Name *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                    placeholder="e.g. Setup Location"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                  <select
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {moduleCategories.map(cat => (
                      <option key={cat.title} value={cat.title}>{cat.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Checklist Items</label>
                <div className="space-y-3 mb-4">
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100 group">
                      <div className="flex-1 flex items-center gap-3">
                        <span className="bg-white border rounded-lg w-8 h-8 flex items-center justify-center text-sm font-bold text-gray-400">
                          {index + 1}
                        </span>
                        <span className="font-medium text-gray-700">{item.itemName}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => handleToggleRequired(index)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${item.required ? 'bg-rose-100 text-rose-600' : 'bg-gray-200 text-gray-500'}`}
                        >
                          {item.required ? 'Required' : 'Optional'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="text-gray-400 hover:text-rose-500 transition"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 px-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                    placeholder="Add new item..."
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddItem())}
                  />
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="bg-gray-800 text-white px-6 py-3 rounded-xl hover:bg-gray-900 transition flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-10 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingId ? 'Update Template' : 'Save Template'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Region Selection Dropdowns */}
        <div className="mb-10 bg-white rounded-2xl shadow-lg p-8 border border-gray-200 animate-fadeIn">
          <div className="mb-8 relative">
            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2 ml-4">Select Regional Scope</h2>
            <p className="text-gray-600 ml-4">Choose location hierarchy to view module completion status</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Country Dropdown */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Compass className="w-4 h-4 text-blue-500" />
                Select Country
              </label>
              <select
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                value={selectedCountry?._id || ''}
                onChange={(e) => {
                  const country = countries.find(c => c._id === e.target.value);
                  handleCountrySelect(country);
                }}
              >
                <option value="">Choose Country...</option>
                {countries.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>

            {/* State Dropdown */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-sky-500" />
                Select State
              </label>
              <select
                disabled={!selectedCountry}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition disabled:opacity-50"
                value={selectedState?._id || ''}
                onChange={(e) => {
                  const state = states.find(s => s._id === e.target.value);
                  handleStateSelect(state);
                }}
              >
                <option value="">Choose State...</option>
                {states.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>

            {/* District Dropdown */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Grid3x3 className="w-4 h-4 text-emerald-500" />
                Select District
              </label>
              <select
                disabled={!selectedState}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition disabled:opacity-50"
                value={selectedDistrict?._id || ''}
                onChange={(e) => {
                  const district = districts.find(d => d._id === e.target.value);
                  handleDistrictSelect(district);
                }}
              >
                <option value="">Choose District...</option>
                {districts.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>

            {/* Cluster Dropdown */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Target className="w-4 h-4 text-orange-500" />
                Select Cluster
              </label>
              <select
                disabled={!selectedDistrict}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition disabled:opacity-50"
                value={selectedCluster?._id || ''}
                onChange={(e) => {
                  const cluster = clusters.find(cl => cl._id === e.target.value);
                  handleClusterSelect(cluster);
                }}
              >
                <option value="">Choose Cluster...</option>
                {clusters.map(cl => <option key={cl._id} value={cl._id}>{cl.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Progress Summary Section - Show only when cluster is selected */}
        {selectedCluster && (
          <div className="mb-10 animate-fadeIn">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Progress Overview</h2>
              <p className="text-gray-600">Overall completion status across all modules</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {stats.map((stat, index) => (
                <div key={index} className={`rounded-2xl text-white p-6 shadow-lg ${stat.color} card-hover`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm opacity-90 uppercase tracking-wider mb-3">{stat.label}</p>
                      <h3 className="text-4xl font-bold mb-2">{stat.value}</h3>
                      <p className="text-sm opacity-90">{stat.subtext}</p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                      <stat.icon className="w-8 h-8" />
                    </div>
                  </div>
                  <div className="mt-6 w-full bg-white/20 rounded-full h-2">
                    <div
                      className="bg-white h-2 rounded-full progress-bar-animated"
                      style={{
                        width: stat.label === 'Total Modules' ? '100%' :
                          stat.label === 'Completed' ? `${completionRate}%` : `${100 - completionRate}%`
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Overall Progress */}
            <div className="bg-white rounded-2xl shadow-lg p-6 card-hover">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Overall Progress</h3>
                  <p className="text-gray-600 mt-1">All modules across all categories</p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-bold text-blue-600">{completionRate}%</span>
                  <p className="text-sm text-gray-600">Complete</p>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full progress-bar-animated"
                  style={{ width: `${completionRate}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mt-3">
                <span>0%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        )}

        {/* Module Categories Section - Show only when cluster is selected */}
        {selectedCluster && (
          <div className="animate-fadeIn">
            <div className="mb-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Module Completion Status</h2>
                  <p className="text-gray-600">Track progress and access individual modules</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800 font-medium">
                    Region: <span className="font-bold text-blue-600">{selectedState?.name}</span> / Cluster: <span className="font-bold text-blue-600">{selectedCluster?.name}</span>
                  </p>
                </div>
              </div>

              {/* Filter Options */}
              <div className="flex flex-wrap gap-3 mb-8">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${activeFilter === 'all'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-blue-300'
                    }`}
                >
                  All Modules
                </button>
                <button
                  onClick={() => setActiveFilter('completed')}
                  className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex items-center ${activeFilter === 'completed'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-emerald-300'
                    }`}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Completed
                </button>
                <button
                  onClick={() => setActiveFilter('pending')}
                  className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex items-center ${activeFilter === 'pending'
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-200'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-amber-300'
                    }`}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Pending
                </button>
                <button
                  onClick={() => setActiveFilter('high')}
                  className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex items-center ${activeFilter === 'high'
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-200'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-rose-300'
                    }`}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  High Priority
                </button>
              </div>
            </div>

            {/* Module Categories Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {moduleCategories
                .filter(cat => {
                  if (activeFilter === 'all') return true;
                  if (activeFilter === 'completed') return cat.progress === 100;
                  if (activeFilter === 'pending') return cat.progress < 100;
                  return true;
                })
                .map((category, index) => (
                  <div key={index} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200 card-hover">
                    {/* Category Header */}
                    <div className="p-6 border-b border-gray-100">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-gray-800 text-xl">{category.title}</h3>
                            <div className={`w-14 h-14 rounded-2xl ${category.iconBg} flex items-center justify-center shadow-md`}>
                              <category.icon className="w-7 h-7" />
                            </div>
                          </div>
                          <div className="flex items-center flex-wrap gap-4 text-sm text-gray-600">
                            <span className="bg-gray-100 py-1.5 px-3 rounded-full">
                              {category.modules} Modules
                            </span>
                            <span className="flex items-center bg-blue-50 text-blue-700 py-1.5 px-3 rounded-full">
                              <TrendingUp className="w-4 h-4 mr-2" />
                              {category.progress}% Complete
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
                        <div
                          className={`h-2.5 rounded-full progress-bar-animated ${getProgressColor(category.progress)}`}
                          style={{ width: `${category.progress}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>0%</span>
                        <span>100%</span>
                      </div>
                    </div>

                    {/* Module List */}
                    <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto module-list-scrollbar">
                      {category.items.length === 0 ? (
                        <div className="p-10 text-center text-gray-400">
                          <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-20" />
                          <p className="text-sm">No checklists in this category</p>
                        </div>
                      ) : (
                        category.items.map((item, itemIndex) => {
                          const originalCl = checklists.find(c => c._id === item.id);
                          return (
                            <div
                              key={itemIndex}
                              className={`p-5 module-item-hover ${item.status} ${item.status === 'completed' ? 'bg-emerald-50/30' : 'bg-amber-50/30'}`}
                            >
                              <div className="flex justify-between items-center">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h4 className="font-semibold text-gray-800">{item.name}</h4>
                                    <div className={`w-2 h-2 rounded-full ${item.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${originalCl?.status === 'active' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                      {originalCl?.status}
                                    </span>
                                    <span className="text-xs text-gray-500 italic">
                                      {originalCl?.items?.length || 0} items
                                    </span>
                                  </div>
                                </div>
                                <div className="ml-4 flex items-center gap-2">
                                  <button
                                    onClick={() => handleToggleCompletion(originalCl)}
                                    title="Toggle Completion"
                                  >
                                    {getStatusBadge(item.status)}
                                  </button>
                                  <div className="h-4 w-[1px] bg-gray-200 mx-1"></div>
                                  <button
                                    onClick={() => handleEdit(originalCl)}
                                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                                    title="Edit Template"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleToggleStatus(originalCl)}
                                    className={`p-2 rounded-lg transition ${originalCl?.status === 'active' ? 'text-blue-500 hover:bg-blue-50' : 'text-gray-400 hover:bg-gray-50'}`}
                                    title="Toggle Active Status"
                                  >
                                    <Gear className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(item.id)}
                                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Category Footer */}
                    <div className="p-4 bg-gray-50 border-t border-gray-100">
                      <div className="flex justify-between items-center text-sm text-gray-600">
                        <span>{category.modules} Checklists Total</span>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${category.progress === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                          <span className="font-medium">{category.progress === 100 ? 'Fully Completed' : 'In Progress'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* Additional Info */}
            <div className="mt-12 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-8 border border-blue-200">
              <div className="text-center max-w-3xl mx-auto">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  Module Management Dashboard
                </h3>
                <p className="text-gray-600 mb-6">
                  {selectedCluster ? (
                    <>Currently viewing modules for <span className="font-bold text-blue-600">{selectedState?.name}</span>
                      {selectedCluster && <> in <span className="font-bold text-blue-600">{selectedCluster?.name}</span> cluster</>}</>
                  ) : 'Select a regional scope to begin tracking module completion'}
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                      <span className="font-medium">
                        {checklists.filter(c => c.completionStatus === 'completed').length || 0} Completed
                      </span>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                      <span className="font-medium">
                        {checklists.filter(c => c.completionStatus !== 'completed').length || 0} Pending
                      </span>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="font-medium">
                        {moduleCategories.length || 0} Categories
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State - Show when no cluster is selected */}
        {!selectedCluster && (
          <div className="text-center py-20">
            <div className="w-32 h-32 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center shadow-lg">
              <LayoutDashboard className="w-16 h-16 text-blue-600" />
            </div>
            <h3 className="text-3xl font-bold text-gray-800 mb-4">Select Regional Scope to Begin</h3>
            <p className="text-gray-600 max-w-2xl mx-auto mb-10 text-lg">
              Choose Country, State, District, and Cluster to view module completion status and manage configurations for that region.
              Track progress, manage access, and configure regional settings.
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <span>Track completion progress</span>
              </div>
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <span>Manage module access</span>
              </div>
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <span>Configure regional settings</span>
              </div>
            </div>
          </div>
        )}
        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-600">
            <div>
              <p>© {new Date().getFullYear()} Solarkits ERP. All rights reserved.</p>
            </div>
            <div className="flex items-center gap-6">
              <span>Module Completion Dashboard</span>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                <span>System Status: {loading ? 'Syncing...' : 'Operational'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}