import React, { useState, useEffect } from 'react';
import { Home, Building, Filter, Save } from 'lucide-react';
import { projectApi } from '../../../../services/project/projectApi';

export default function OverdueSetting() {
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [projectType, setProjectType] = useState('');
  const [subProjectType, setSubProjectType] = useState('');

  // Process configuration state
  // Store all fetched settings to derive summary and form data without re-fetching
  const [allSettings, setAllSettings] = useState([]);

  // Process configuration state (Form Data)
  const [processConfig, setProcessConfig] = useState({
    projectSignup: { consumerRegistered: 3, applicationSubmission: 5 },
    feasibilityApproval: { feasibilityCheck: 7, meterCharge: 2 },
    installationStatus: { vendorSelection: 5, workStart: 3, solarInstallation: 10 },
    meterInstallation: { meterChange: 3, meterInspection: 2 },
    subsidy: { subsidyRequest: 5, subsidyDisbursal: 7 }
  });

  // Default config for reset
  const defaultConfig = {
    projectSignup: { consumerRegistered: 3, applicationSubmission: 5 },
    feasibilityApproval: { feasibilityCheck: 7, meterCharge: 2 },
    installationStatus: { vendorSelection: 5, workStart: 3, solarInstallation: 10 },
    meterInstallation: { meterChange: 3, meterInspection: 2 },
    subsidy: { subsidyRequest: 5, subsidyDisbursal: 7 }
  };

  // Dynamic Summary Data derived from allSettings
  const getSummaryData = (subCat) => {
    // Find setting for the current filters but specific subCategory (Residential/Commercial)
    const setting = allSettings.find(s =>
      s.category === category &&
      s.subCategory === subCat &&
      s.projectType === projectType &&
      s.subProjectType === subProjectType
    );

    if (setting && setting.processConfig) {
      // Map nested processConfig to flat summary structure
      // Note: Using optional chaining ?. to avoid crashes if keys are missing
      const pc = setting.processConfig;
      return {
        consumerReg: pc.projectSignup?.consumerRegistered || 0,
        appSubmit: pc.projectSignup?.applicationSubmission || 0,
        feasibility: pc.feasibilityApproval?.feasibilityCheck || 0,
        meterCharge: pc.feasibilityApproval?.meterCharge || 0,
        vendorSelect: pc.installationStatus?.vendorSelection || 0,
        workStart: pc.installationStatus?.workStart || 0,
        installation: pc.installationStatus?.solarInstallation || 0,
        meterChange: pc.meterInstallation?.meterChange || 0,
        inspection: pc.meterInstallation?.meterInspection || 0,
        subsidyReq: pc.subsidy?.subsidyRequest || 0,
        subsidyDisb: pc.subsidy?.subsidyDisbursal || 0
      };
    }

    // Return 0s or defaults if no setting found
    return {
      consumerReg: 0, appSubmit: 0, feasibility: 0, meterCharge: 0,
      vendorSelect: 0, workStart: 0, installation: 0,
      meterChange: 0, inspection: 0, subsidyReq: 0, subsidyDisb: 0
    };
  };

  const residentialSummary = getSummaryData('residential');
  const commercialSummary = getSummaryData('commercial');

  // Fetch all existing settings on mount or simple refresh
  const fetchSettings = async () => {
    try {
      const settings = await projectApi.getOverdueSettings();
      setAllSettings(settings);
    } catch (error) {
      console.error('Error fetching overdue settings:', error);
    }
  };

  // Effect to populate Form Data when filters or allSettings change
  useEffect(() => {
    if (category && subCategory && projectType && subProjectType) {
      const matchingSetting = allSettings.find(s =>
        s.category === category &&
        s.subCategory === subCategory &&
        s.projectType === projectType &&
        s.subProjectType === subProjectType
      );

      if (matchingSetting && matchingSetting.processConfig) {
        setProcessConfig(matchingSetting.processConfig);
      } else {
        setProcessConfig(defaultConfig);
      }
    }
  }, [allSettings, category, subCategory, projectType, subProjectType]);

  // Initial fetch
  useEffect(() => {
    fetchSettings();
  }, []);

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
      alert(`${processKey.replace(/([A-Z])/g, ' $1')} settings saved!`);
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
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="" disabled>All Categories</option>
                  <option value="solar-panel">Solar Panel</option>
                  <option value="solar-rooftop">Solar Rooftop</option>
                  <option value="solar-pump">Solar Pump</option>
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
                  onChange={(e) => setSubCategory(e.target.value)}
                >
                  <option value="" disabled>Select Sub Category Type</option>
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
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
                  onChange={(e) => setProjectType(e.target.value)}
                >
                  <option value="" disabled>Select Project Type</option>
                  <option value="3kw-5kw">3Kw-5Kw</option>
                  <option value="5kw-10kw">5Kw-10Kw</option>
                  <option value="10kw-20kw">10Kw-20Kw</option>
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
                >
                  <option value="" disabled>Select Sub Project Type</option>
                  <option value="on-grid">On-Grid</option>
                  <option value="off-grid">Off-grid</option>
                  <option value="hybrid">Hybrid</option>
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
            <div className="p-8 text-center">
              <Home className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h4 className="text-xl font-semibold text-gray-800 mb-2">Residential</h4>
              <p className="text-gray-500">Manage residential solar projects</p>
            </div>
          </div>

          {/* Commercial Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
            <div className="p-8 text-center">
              <Building className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h4 className="text-xl font-semibold text-gray-800 mb-2">Commercial</h4>
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
                {/* Project Signup */}
                <tr className="bg-gray-50">
                  <td rowSpan="2" className="px-6 py-4 align-middle font-medium text-gray-900 border-r border-gray-200">
                    Project Signup
                  </td>
                  <td className="px-6 py-4">Consumer Registered</td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      className="w-24 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={processConfig.projectSignup.consumerRegistered}
                      onChange={(e) => handleProcessChange('projectSignup', 'consumerRegistered', e.target.value)}
                      min="1"
                    />
                  </td>
                  <td rowSpan="2" className="px-6 py-4 align-middle border-l border-gray-200">
                    <button
                      onClick={() => handleSaveProcess('projectSignup')}
                      className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
                    >
                      <Save className="w-4 h-4 mr-1" />
                      Save
                    </button>
                  </td>
                </tr>
                <tr className="bg-white">
                  <td className="px-6 py-4">Application Submission</td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      className="w-24 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={processConfig.projectSignup.applicationSubmission}
                      onChange={(e) => handleProcessChange('projectSignup', 'applicationSubmission', e.target.value)}
                      min="1"
                    />
                  </td>
                </tr>

                {/* Feasibility Approval */}
                <tr className="bg-gray-50">
                  <td rowSpan="2" className="px-6 py-4 align-middle font-medium text-gray-900 border-r border-gray-200">
                    Feasibility Approval
                  </td>
                  <td className="px-6 py-4">Feasibility Check</td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      className="w-24 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={processConfig.feasibilityApproval.feasibilityCheck}
                      onChange={(e) => handleProcessChange('feasibilityApproval', 'feasibilityCheck', e.target.value)}
                      min="1"
                    />
                  </td>
                  <td rowSpan="2" className="px-6 py-4 align-middle border-l border-gray-200">
                    <button
                      onClick={() => handleSaveProcess('feasibilityApproval')}
                      className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
                    >
                      <Save className="w-4 h-4 mr-1" />
                      Save
                    </button>
                  </td>
                </tr>
                <tr className="bg-white">
                  <td className="px-6 py-4">Meter Charge</td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      className="w-24 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={processConfig.feasibilityApproval.meterCharge}
                      onChange={(e) => handleProcessChange('feasibilityApproval', 'meterCharge', e.target.value)}
                      min="1"
                    />
                  </td>
                </tr>

                {/* Installation Status */}
                <tr className="bg-gray-50">
                  <td rowSpan="3" className="px-6 py-4 align-middle font-medium text-gray-900 border-r border-gray-200">
                    Installation Status
                  </td>
                  <td className="px-6 py-4">Vendor Selection</td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      className="w-24 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={processConfig.installationStatus.vendorSelection}
                      onChange={(e) => handleProcessChange('installationStatus', 'vendorSelection', e.target.value)}
                      min="1"
                    />
                  </td>
                  <td rowSpan="3" className="px-6 py-4 align-middle border-l border-gray-200">
                    <button
                      onClick={() => handleSaveProcess('installationStatus')}
                      className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
                    >
                      <Save className="w-4 h-4 mr-1" />
                      Save
                    </button>
                  </td>
                </tr>
                <tr className="bg-white">
                  <td className="px-6 py-4">Work Start</td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      className="w-24 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={processConfig.installationStatus.workStart}
                      onChange={(e) => handleProcessChange('installationStatus', 'workStart', e.target.value)}
                      min="1"
                    />
                  </td>
                </tr>
                <tr className="bg-white">
                  <td className="px-6 py-4">Solar Installation</td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      className="w-24 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={processConfig.installationStatus.solarInstallation}
                      onChange={(e) => handleProcessChange('installationStatus', 'solarInstallation', e.target.value)}
                      min="1"
                    />
                  </td>
                </tr>

                {/* Meter Installation */}
                <tr className="bg-gray-50">
                  <td rowSpan="2" className="px-6 py-4 align-middle font-medium text-gray-900 border-r border-gray-200">
                    Meter Installation
                  </td>
                  <td className="px-6 py-4">Meter Change</td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      className="w-24 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={processConfig.meterInstallation.meterChange}
                      onChange={(e) => handleProcessChange('meterInstallation', 'meterChange', e.target.value)}
                      min="1"
                    />
                  </td>
                  <td rowSpan="2" className="px-6 py-4 align-middle border-l border-gray-200">
                    <button
                      onClick={() => handleSaveProcess('meterInstallation')}
                      className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
                    >
                      <Save className="w-4 h-4 mr-1" />
                      Save
                    </button>
                  </td>
                </tr>
                <tr className="bg-white">
                  <td className="px-6 py-4">Meter Inspection</td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      className="w-24 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={processConfig.meterInstallation.meterInspection}
                      onChange={(e) => handleProcessChange('meterInstallation', 'meterInspection', e.target.value)}
                      min="1"
                    />
                  </td>
                </tr>

                {/* Subsidy */}
                <tr className="bg-gray-50">
                  <td rowSpan="2" className="px-6 py-4 align-middle font-medium text-gray-900 border-r border-gray-200">
                    Subsidy
                  </td>
                  <td className="px-6 py-4">Subsidy Request</td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      className="w-24 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={processConfig.subsidy.subsidyRequest}
                      onChange={(e) => handleProcessChange('subsidy', 'subsidyRequest', e.target.value)}
                      min="1"
                    />
                  </td>
                  <td rowSpan="2" className="px-6 py-4 align-middle border-l border-gray-200">
                    <button
                      onClick={() => handleSaveProcess('subsidy')}
                      className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
                    >
                      <Save className="w-4 h-4 mr-1" />
                      Save
                    </button>
                  </td>
                </tr>
                <tr className="bg-white">
                  <td className="px-6 py-4">Subsidy Disbursal</td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      className="w-24 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={processConfig.subsidy.subsidyDisbursal}
                      onChange={(e) => handleProcessChange('subsidy', 'subsidyDisbursal', e.target.value)}
                      min="1"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h5 className="font-semibold text-gray-800 text-lg">Overdue Days Summary (Project Type Wise)</h5>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th rowSpan="2" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider align-middle border-b border-gray-200">
                    Project Type
                  </th>
                  <th colSpan="2" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Project Signup
                  </th>
                  <th colSpan="2" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Feasibility Approval
                  </th>
                  <th colSpan="3" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Installation Status
                  </th>
                  <th colSpan="2" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Meter Installation
                  </th>
                  <th colSpan="2" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Subsidy
                  </th>
                </tr>
                <tr>
                  {/* Project Signup Subheaders */}
                  <th className="px-4 py-2 text-xs font-medium text-gray-500 border-b border-gray-200">Consumer Reg</th>
                  <th className="px-4 py-2 text-xs font-medium text-gray-500 border-b border-gray-200">App Submit</th>

                  {/* Feasibility Approval Subheaders */}
                  <th className="px-4 py-2 text-xs font-medium text-gray-500 border-b border-gray-200">Feasibility</th>
                  <th className="px-4 py-2 text-xs font-medium text-gray-500 border-b border-gray-200">Meter Charge</th>

                  {/* Installation Status Subheaders */}
                  <th className="px-4 py-2 text-xs font-medium text-gray-500 border-b border-gray-200">Vendor Select</th>
                  <th className="px-4 py-2 text-xs font-medium text-gray-500 border-b border-gray-200">Work Start</th>
                  <th className="px-4 py-2 text-xs font-medium text-gray-500 border-b border-gray-200">Installation</th>

                  {/* Meter Installation Subheaders */}
                  <th className="px-4 py-2 text-xs font-medium text-gray-500 border-b border-gray-200">Meter Change</th>
                  <th className="px-4 py-2 text-xs font-medium text-gray-500 border-b border-gray-200">Inspection</th>

                  {/* Subsidy Subheaders */}
                  <th className="px-4 py-2 text-xs font-medium text-gray-500 border-b border-gray-200">Request</th>
                  <th className="px-4 py-2 text-xs font-medium text-gray-500 border-b border-gray-200">Disbursal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {/* Residential Row */}
                <tr>
                  <td className="px-6 py-4 font-medium text-gray-900">Residential</td>
                  <td className="px-4 py-4 text-center">{residentialSummary.consumerReg}</td>
                  <td className="px-4 py-4 text-center">{residentialSummary.appSubmit}</td>
                  <td className="px-4 py-4 text-center">{residentialSummary.feasibility}</td>
                  <td className="px-4 py-4 text-center">{residentialSummary.meterCharge}</td>
                  <td className="px-4 py-4 text-center">{residentialSummary.vendorSelect}</td>
                  <td className="px-4 py-4 text-center">{residentialSummary.workStart}</td>
                  <td className="px-4 py-4 text-center">{residentialSummary.installation}</td>
                  <td className="px-4 py-4 text-center">{residentialSummary.meterChange}</td>
                  <td className="px-4 py-4 text-center">{residentialSummary.inspection}</td>
                  <td className="px-4 py-4 text-center">{residentialSummary.subsidyReq}</td>
                  <td className="px-4 py-4 text-center">{residentialSummary.subsidyDisb}</td>
                </tr>

                {/* Commercial Row */}
                <tr>
                  <td className="px-6 py-4 font-medium text-gray-900">Commercial</td>
                  <td className="px-4 py-4 text-center">{commercialSummary.consumerReg}</td>
                  <td className="px-4 py-4 text-center">{commercialSummary.appSubmit}</td>
                  <td className="px-4 py-4 text-center">{commercialSummary.feasibility}</td>
                  <td className="px-4 py-4 text-center">{commercialSummary.meterCharge}</td>
                  <td className="px-4 py-4 text-center">{commercialSummary.vendorSelect}</td>
                  <td className="px-4 py-4 text-center">{commercialSummary.workStart}</td>
                  <td className="px-4 py-4 text-center">{commercialSummary.installation}</td>
                  <td className="px-4 py-4 text-center">{commercialSummary.meterChange}</td>
                  <td className="px-4 py-4 text-center">{commercialSummary.inspection}</td>
                  <td className="px-4 py-4 text-center">{commercialSummary.subsidyReq}</td>
                  <td className="px-4 py-4 text-center">{commercialSummary.subsidyDisb}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}