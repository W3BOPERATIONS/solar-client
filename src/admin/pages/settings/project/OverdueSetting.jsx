import React, { useState, useEffect } from 'react';
import { Home, Building, Filter, Save, ClipboardList } from 'lucide-react';
import { projectApi } from '../../../../services/project/projectApi';
import { 
  getCategories, 
  getSubCategories, 
  getProjectCategoryMappings, 
  getSubProjectTypes 
} from '../../../../services/settings/orderProcurementSettingApi';
import { toast } from 'react-hot-toast';

export default function OverdueSetting() {
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [projectType, setProjectType] = useState('');
  const [subProjectType, setSubProjectType] = useState('');

  // Process configuration state
  // Store all fetched settings to derive summary and form data without re-fetching
  const [allSettings, setAllSettings] = useState([]);
  
  // Master Data State
  const [masterCategories, setMasterCategories] = useState([]);
  const [allSubCategories, setAllSubCategories] = useState([]);
  const [projectMappings, setProjectMappings] = useState([]);
  const [allSubProjectTypes, setAllSubProjectTypes] = useState([]);
  
  // Filter Dropdown Options
  const [availableSubCategories, setAvailableSubCategories] = useState([]);
  const [availableProjectTypes, setAvailableProjectTypes] = useState([]);
  const [availableSubProjectTypes, setAvailableSubProjectTypes] = useState([]);

  // Dynamic journey stages from DB
  const [journeyStages, setJourneyStages] = useState([]);

  // Process configuration state (Form Data)
  const [processConfig, setProcessConfig] = useState({});

  // Flag to check if config is being loaded to prevent overwriting with defaults
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);

  // Default values for new/unconfigured stages/fields
  const DEFAULT_DAYS = 5;

  // Summary data is now directly derived in the render section for Residential and Commercial cards

  // Fetch all master data and existing settings
  const fetchInitialData = async () => {
    try {
      const [settings, cats, mappings, subPTs, stages] = await Promise.all([
        projectApi.getOverdueSettings(),
        getCategories(),
        getProjectCategoryMappings(),
        getSubProjectTypes(),
        projectApi.getJourneyStages()
      ]);
      
      setAllSettings(settings || []);
      setMasterCategories(cats?.data || []);
      setProjectMappings(mappings?.data || []);
      setAllSubProjectTypes(subPTs?.data || []);
      setJourneyStages(stages || []);
      
      // Also fetch all sub-categories for mapping
      const subCats = await getSubCategories();
      setAllSubCategories(subCats?.data || []);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Failed to load configuration data');
    }
  };

  const [summaryTab, setSummaryTab] = useState('residential');

  // Fetch only settings when needed
  const fetchSettings = async () => {
    try {
      const settings = await projectApi.getOverdueSettings();
      setAllSettings(settings || []);
    } catch (error) {
      console.error('Error fetching overdue settings:', error);
    }
  };

  // Effect to populate Form Data when filters or allSettings/journeyStages change
  useEffect(() => {
    if (category && subCategory && projectType && subProjectType && journeyStages.length > 0) {
      const matchingSetting = allSettings.find(s =>
        s.category === category &&
        s.subCategory === subCategory &&
        s.projectType === projectType &&
        s.subProjectType === subProjectType
      );

      const initialConfig = {};
      
      // Initialize with journey stages and fields
      journeyStages.forEach(stage => {
        initialConfig[stage.name] = {};
        if (stage.fields && stage.fields.length > 0) {
          stage.fields.forEach(field => {
            // Check if we have a saved value, otherwise use DEFAULT_DAYS
            const savedValue = matchingSetting?.processConfig?.[stage.name]?.[field];
            initialConfig[stage.name][field] = savedValue !== undefined ? savedValue : DEFAULT_DAYS;
          });
        }
      });

      setProcessConfig(initialConfig);
      setIsConfigLoaded(true);
    }
  }, [allSettings, category, subCategory, projectType, subProjectType, journeyStages]);

  // Initial fetch
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Hierarchical Filter Handlers
  const handleCategoryChange = async (catName) => {
    setCategory(catName);
    setSubCategory('');
    setProjectType('');
    setSubProjectType('');
    setAvailableSubCategories([]);
    setAvailableProjectTypes([]);
    
    if (catName) {
      const selCat = masterCategories.find(c => c.name === catName);
      if (selCat) {
        try {
          const res = await getSubCategories(selCat._id);
          setAvailableSubCategories(res.data || []);
        } catch (err) {
          console.error("Error loading sub categories:", err);
        }
      }
    }
  };

  const handleSubCategoryChange = (subCatName) => {
    setSubCategory(subCatName);
    setProjectType('');
    setSubProjectType('');
    setAvailableProjectTypes([]);
    
    if (category && subCatName) {
      const selCat = masterCategories.find(c => c.name === category);
      const selSubCat = allSubCategories.find(sc => sc.name === subCatName);
      
      if (selCat && selSubCat) {
        const ranges = projectMappings
          .filter(m => 
            (m.categoryId?._id || m.categoryId) === selCat._id && 
            (m.subCategoryId?._id || m.subCategoryId) === selSubCat._id
          )
          .map(m => `${m.projectTypeFrom} to ${m.projectTypeTo} kW`)
          .filter((v, i, a) => a.indexOf(v) === i);
        setAvailableProjectTypes(ranges);
      }
    }
  };

  const handleProjectTypeChange = async (ptName) => {
    setProjectType(ptName);
    setSubProjectType('');
    setAvailableSubProjectTypes([]);
    
    if (ptName) {
      // Find if this is a master range or just show all sub-project types
      setAvailableSubProjectTypes(allSubProjectTypes);
    }
  };

  const handleSaveProcess = async (processKey) => {
    if (!category || !subCategory || !projectType || !subProjectType) {
      alert('Please select all filters before saving.');
      return;
    }

    try {
      const data = {
        category,
        subCategory,
        projectType,
        subProjectType,
        processConfig: processConfig
      };

      await projectApi.saveOverdueSetting(data);
      alert(`${processKey} configuration saved successfully!`);
      // Refresh local data to update summary table
      fetchSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    }
  };

  const handleProcessChange = (processKey, subProcessKey, value) => {
    setProcessConfig(prev => ({
      ...prev,
      [processKey]: {
        ...prev[processKey],
        [subProcessKey]: parseInt(value) || 0
      }
    }));
  };

  const handleApplyFilters = () => {
    // No-op or just re-fetch to be sure
    fetchSettings();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
            Overdue Days Configuration
          </h2>
          <p className="text-gray-600">
            Configure overdue thresholds for different project stages and types
          </p>
        </div>

        {/* Filters Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h5 className="font-semibold text-gray-800 text-lg">Filters</h5>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                >
                  <option value="">Select Category</option>
                  {masterCategories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                </select>
              </div>

              {/* Sub Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sub Category
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={subCategory}
                  onChange={(e) => handleSubCategoryChange(e.target.value)}
                  disabled={!category}
                >
                  <option value="">Select Sub Category</option>
                  {availableSubCategories.map(sc => <option key={sc._id} value={sc.name}>{sc.name}</option>)}
                </select>
              </div>

              {/* Project Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Type
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={projectType}
                  onChange={(e) => handleProjectTypeChange(e.target.value)}
                  disabled={!subCategory}
                >
                  <option value="">Select Project Type</option>
                  {availableProjectTypes.map((range, idx) => <option key={idx} value={range}>{range}</option>)}
                </select>
              </div>

              {/* Sub Project Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sub Project Type
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={subProjectType}
                  onChange={(e) => setSubProjectType(e.target.value)}
                  disabled={!projectType}
                >
                  <option value="">Select Sub Project Type</option>
                  {availableSubProjectTypes.map(st => <option key={st._id} value={st.name}>{st.name}</option>)}
                </select>
              </div>
            </div>

            {/* Apply Filters Button */}
            <div className="mt-6">
              <button
                onClick={handleApplyFilters}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Filter className="w-4 h-4 mr-2" />
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Project Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Residential Card */}
          <div 
            onClick={() => handleSubCategoryChange('Residential')}
            className={`rounded-lg shadow-sm border transition-all cursor-pointer ${
              subCategory?.toLowerCase() === 'residential' 
                ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' 
                : 'bg-white border-gray-200 hover:shadow-md hover:border-blue-300'
            }`}
          >
            <div className="p-8 text-center">
              <Home className={`w-16 h-16 mx-auto mb-4 transition-colors ${
                subCategory?.toLowerCase() === 'residential' ? 'text-blue-600' : 'text-gray-400'
              }`} />
              <h4 className={`text-xl font-semibold mb-2 transition-colors ${
                subCategory?.toLowerCase() === 'residential' ? 'text-blue-700' : 'text-gray-800'
              }`}>Residential</h4>
              <p className="text-gray-500">Manage residential solar projects</p>
            </div>
          </div>

          {/* Commercial Card */}
          <div 
            onClick={() => handleSubCategoryChange('Commercial')}
            className={`rounded-lg shadow-sm border transition-all cursor-pointer ${
              subCategory?.toLowerCase() === 'commercial' 
                ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' 
                : 'bg-white border-gray-200 hover:shadow-md hover:border-blue-300'
            }`}
          >
            <div className="p-8 text-center">
              <Building className={`w-16 h-16 mx-auto mb-4 transition-colors ${
                subCategory?.toLowerCase() === 'commercial' ? 'text-blue-600' : 'text-gray-400'
              }`} />
              <h4 className={`text-xl font-semibold mb-2 transition-colors ${
                subCategory?.toLowerCase() === 'commercial' ? 'text-blue-700' : 'text-gray-800'
              }`}>Commercial</h4>
              <p className="text-gray-500">Manage commercial solar projects</p>
            </div>
          </div>
        </div>

        {/* Process Configuration */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h5 className="font-semibold text-gray-800 text-lg">Process Configuration</h5>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-1/4 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Main Process
                  </th>
                  <th className="w-1/4 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Sub Process
                  </th>
                  <th className="w-1/5 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    OverDue Setting (Days)
                  </th>
                  <th className="w-1/10 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {journeyStages.map((stage, sIdx) => {
                  const subProcesses = stage.fields && stage.fields.length > 0 ? stage.fields : [];
                  const rowCount = Math.max(subProcesses.length, 1);
                  
                  return (
                    <React.Fragment key={stage._id || sIdx}>
                      {rowCount > 0 && (
                        <tr className="bg-gray-50/50">
                          <td rowSpan={rowCount} className="px-6 py-4 align-middle font-semibold text-[#0ea5e9] border-r border-gray-200 bg-white">
                            {stage.name}
                          </td>
                          
                          {/* First Sub-Process Row */}
                          <td className="px-6 py-4 text-gray-700">
                            {subProcesses[0] || <span className="text-gray-400 italic">No sub-processes</span>}
                          </td>
                          <td className="px-6 py-4">
                            {subProcesses[0] && (
                              <div className="flex items-center space-x-2">
                                <input
                                  type="number"
                                  className="w-20 px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                  value={processConfig[stage.name]?.[subProcesses[0]] || ''}
                                  onChange={(e) => handleProcessChange(stage.name, subProcesses[0], e.target.value)}
                                  min="0"
                                />
                                <span className="text-xs text-gray-500 font-medium">Days</span>
                              </div>
                            )}
                          </td>
                          <td rowSpan={rowCount} className="px-6 py-4 align-middle border-l border-gray-100 bg-white">
                            <button
                              onClick={() => handleSaveProcess(stage.name)}
                              className="inline-flex items-center px-4 py-2 bg-[#0ea5e9] text-white text-xs font-bold rounded-lg hover:bg-blue-600 transition-all shadow-sm hover:shadow-md active:scale-95"
                            >
                              <Save className="w-3.5 h-3.5 mr-1.5" />
                              Save
                            </button>
                          </td>
                        </tr>
                      )}
                      
                      {/* Remaining Sub-Process Rows */}
                      {subProcesses.slice(1).map((subProc, spIdx) => (
                        <tr key={`${stage._id}-${spIdx}`} className="bg-white">
                          <td className="px-6 py-4 text-gray-700">{subProc}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                className="w-20 px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                value={processConfig[stage.name]?.[subProc] || ''}
                                onChange={(e) => handleProcessChange(stage.name, subProc, e.target.value)}
                                min="0"
                              />
                              <span className="text-xs text-gray-500 font-medium">Days</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dynamic Summary Cards Section */}
        <div className="space-y-6 mb-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center">
              <Filter className="w-5 h-5 mr-2 text-blue-600" />
              Overdue Configuration Summary
            </h3>
          </div>

          {/* Large Navigation Buttons */}
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setSummaryTab('residential')}
              className={`flex-1 flex items-center justify-center p-6 rounded-2xl transition-all duration-300 shadow-sm border-2 ${summaryTab === 'residential'
                ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-md ring-4 ring-blue-50 ring-offset-0'
                : 'bg-white border-gray-100 text-gray-500 hover:border-blue-200 hover:bg-gray-50 uppercase tracking-wider text-sm font-bold'
                }`}
            >
              <div className={`p-3 rounded-xl mr-4 ${summaryTab === 'residential' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                <Home className="w-6 h-6" />
              </div>
              <div className="text-left">
                <div className="text-xs uppercase font-bold opacity-60 mb-0.5">Project Category</div>
                <div className="text-xl font-black">RESIDENTIAL PROJECTS</div>
              </div>
            </button>

            <button
              onClick={() => setSummaryTab('commercial')}
              className={`flex-1 flex items-center justify-center p-6 rounded-2xl transition-all duration-300 shadow-sm border-2 ${summaryTab === 'commercial'
                ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-md ring-4 ring-emerald-50 ring-offset-0'
                : 'bg-white border-gray-100 text-gray-500 hover:border-emerald-200 hover:bg-gray-50 uppercase tracking-wider text-sm font-bold'
                }`}
            >
              <div className={`p-3 rounded-xl mr-4 ${summaryTab === 'commercial' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                <Building className="w-6 h-6" />
              </div>
              <div className="text-left">
                <div className="text-xs uppercase font-bold opacity-60 mb-0.5">Project Category</div>
                <div className="text-xl font-black">COMMERCIAL PROJECTS</div>
              </div>
            </button>
          </div>

          {/* Table Summary Content */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className={`px-6 py-4 border-b flex items-center justify-between ${summaryTab === 'residential' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'}`}>
              <div className="flex items-center font-bold">
                <ClipboardList className="w-5 h-5 mr-3" />
                {summaryTab === 'residential' ? 'Residential' : 'Commercial'} Configuration Details
              </div>
              <span className="bg-white bg-opacity-20 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-sm shadow-sm ring-1 ring-white ring-opacity-30">
                Displaying All Saved Rules
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-widest">Filters (Application To)</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-widest">Journey Stages & Overdue Thresholds</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {allSettings
                    .filter(s => s.subCategory?.toLowerCase() === summaryTab)
                    .map((config, cIdx) => (
                      <tr key={config._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-6 align-top border-r border-gray-50 w-1/4">
                          <div className="space-y-3">
                            <div>
                              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Category & Project Type</div>
                              <div className="flex flex-wrap gap-2">
                                <span className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-tight ${summaryTab === 'residential' ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'}`}>
                                  {config.category}
                                </span>
                                <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded text-[11px] font-bold uppercase tracking-tight ring-1 ring-gray-200">
                                  {config.projectType}
                                </span>
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Sub Project Type</div>
                              <div className="text-sm font-bold text-gray-800 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                                {config.subProjectType}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.entries(config.processConfig || {}).map(([stageName, subProcs], sIdx) => (
                              <div key={sIdx} className="bg-white p-4 rounded-xl border border-gray-200 hover:border-blue-200 hover:shadow-md transition-all">
                                <h6 className="text-[11px] font-black text-gray-800 uppercase tracking-widest border-b border-gray-100 pb-2 mb-3 flex items-center justify-between">
                                  {stageName}
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                </h6>
                                <ul className="space-y-2.5">
                                  {Object.entries(subProcs).map(([subProc, days], spIdx) => (
                                    <li key={spIdx} className="flex justify-between items-center bg-gray-50 p-2 px-3 rounded-lg border border-gray-50 group hover:bg-white hover:border-gray-200 transition-all">
                                      <span className="text-xs text-gray-600 font-medium truncate pr-4">{subProc}</span>
                                      <span className={`text-[12px] font-black min-w-[36px] text-center px-1.5 py-1 rounded shadow-sm ${summaryTab === 'residential' ? 'bg-blue-500 text-white' : 'bg-emerald-500 text-white'}`}>
                                        {days}d
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  {allSettings.filter(s => s.subCategory?.toLowerCase() === summaryTab).length === 0 && (
                    <tr>
                      <td colSpan="2" className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center justify-center opacity-30">
                          <ClipboardList className="w-16 h-16 mb-4" />
                          <p className="text-lg font-bold">No configuration found for {summaryTab === 'residential' ? 'Residential' : 'Commercial'}</p>
                          <p className="text-sm">Configurations will appear here after they are saved.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}