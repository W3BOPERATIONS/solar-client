import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Layout, Globe, IndianRupee, BarChart2, Facebook, Instagram, Twitter, Linkedin, Search } from 'lucide-react';
import {
  getCampaignConfig,
  updateCampaignConfig,
  getAllSocialPlatforms,
  createSocialPlatform,
  updateSocialPlatform,
  deleteSocialPlatform
} from '../../../../api/campaigns';
import { locationAPI } from '../../../../api/api';
import toast from 'react-hot-toast';

const CampaignManagement = () => {
  const [activeTab, setActiveTab] = useState('settings');
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    defaultNameFormat: '',
    campaignTypes: [],
    cprmConversion: 0,
    companyConversion: 0,
    defaultCompanyBudget: 0,
    defaultCprmBudget: 0
  });

  const [socialPlatforms, setSocialPlatforms] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [states, setStates] = useState([]);
  const [newType, setNewType] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [configRes, socialRes, clusterRes, stateRes] = await Promise.all([
        getCampaignConfig(),
        getAllSocialPlatforms(),
        locationAPI.getAllClusters({ isActive: true }),
        locationAPI.getAllStates({ isActive: true })
      ]);

      if (configRes.success) {
        const fetchedConfig = configRes.data;
        if (!fetchedConfig.campaignTypes) fetchedConfig.campaignTypes = [];
        setConfig(fetchedConfig);
      }
      if (socialRes.success) setSocialPlatforms(socialRes.data);
      setClusters(clusterRes.data.data || []);
      setStates(stateRes.data.data || []);
    } catch (error) {
      console.error('Failed to fetch data', error);
      toast.error('Failed to load campaign data');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigSave = async () => {
    try {
      setLoading(true);

      // Auto-add pending type if exists
      let finalConfig = { ...config };
      if (newType.trim() && !config.campaignTypes.includes(newType.trim())) {
        finalConfig.campaignTypes = [...config.campaignTypes, newType.trim()];
        setConfig(finalConfig);
        setNewType('');
      }

      const res = await updateCampaignConfig(finalConfig);
      if (res.success) {
        setConfig(res.data);
        toast.success('Campaign settings saved successfully');
      }
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleAddType = () => {
    if (!newType.trim()) return;
    if (config.campaignTypes.includes(newType.trim())) {
      toast.error('Type already exists');
      return;
    }
    setConfig({ ...config, campaignTypes: [...config.campaignTypes, newType.trim()] });
    setNewType('');
  };

  const handleRemoveType = (typeToRemove) => {
    setConfig({
      ...config,
      campaignTypes: config.campaignTypes.filter(t => t !== typeToRemove)
    });
  };

  const handleAddPlatform = async () => {
    const newPlatform = {
      platform: 'Facebook',
      state: states.length > 0 ? states[0]._id : '',
      cluster: clusters.length > 0 ? clusters[0]._id : '',
      status: 'Active',
      quarter: 'January-March',
      budget: 0
    };

    try {
      setLoading(true);
      const res = await createSocialPlatform(newPlatform);
      if (res.success) {
        setSocialPlatforms([...socialPlatforms, res.data]);
        toast.success('Platform added');
      }
    } catch (error) {
      toast.error('Failed to add platform');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePlatform = async (id, updates) => {
    try {
      const res = await updateSocialPlatform(id, updates);
      if (res.success) {
        setSocialPlatforms(socialPlatforms.map(p => p._id === id ? res.data : p));
        toast.success('Platform updated');
      }
    } catch (error) {
      toast.error('Failed to update platform');
    }
  };

  const handleDeletePlatform = async (id) => {
    if (!window.confirm('Are you sure you want to delete this platform?')) return;
    try {
      const res = await deleteSocialPlatform(id);
      if (res.success) {
        setSocialPlatforms(socialPlatforms.filter(p => p._id !== id));
        toast.success('Platform deleted');
      }
    } catch (error) {
      toast.error('Failed to delete platform');
    }
  };

  const calculateBudgetSummary = () => {
    const platformNames = [...new Set(socialPlatforms.map(p => p.platform))].join(', ');
    const clusterNames = [...new Set(socialPlatforms.map(p => p.cluster?.name).filter(Boolean))].join(', ');
    const stateNames = [...new Set(socialPlatforms.map(p => p.state?.name).filter(Boolean))].join(', ');
    const totalBudget = socialPlatforms.reduce((sum, p) => sum + (Number(p.budget) || 0), 0);
    const totalPlatforms = socialPlatforms.length;

    return { platformNames, clusterNames, stateNames, totalBudget, totalPlatforms };
  };

  const TABS = [
    { id: 'settings', label: 'Campaign Settings' },
    { id: 'social', label: 'Social Media' },
    { id: 'budget', label: 'Budget Controls' },
  ];

  if (loading && config.campaignTypes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const { platformNames, clusterNames, stateNames, totalBudget, totalPlatforms } = calculateBudgetSummary();

  return (
    <div className="p-4 bg-[#e9ecef] min-h-screen font-sans">
      {/* Header Area */}
      <div className="bg-white rounded-lg p-6 mb-6 shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-[#00669c]">Admin Campaign Management</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 min-h-[600px] flex flex-col">
        {/* Tabs - Boxed style as per screenshot */}
        <div className="flex space-x-0 mb-10 border border-gray-200 rounded-lg w-fit overflow-hidden shadow-sm">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-8 font-semibold text-sm transition-all border-r last:border-r-0 ${activeTab === tab.id
                ? 'bg-[#f0f7ff] text-[#00669c] border-b-2 border-b-[#00669c]'
                : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {activeTab === 'settings' && (
            <div className="space-y-12 animate-fadeIn">
              {/* Format */}
              <div className="space-y-4 max-w-2xl">
                <label className="text-base font-semibold text-gray-700">Default Campaign Name Format</label>
                <input
                  type="text"
                  value={config.defaultNameFormat}
                  onChange={(e) => setConfig({ ...config, defaultNameFormat: e.target.value })}
                  className="w-full p-4 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-400 outline-none text-gray-700 bg-white"
                  placeholder="Default Campaign Name Format"
                />
              </div>

              {/* Types and Conversions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                <div className="space-y-4">
                  <label className="text-base font-semibold text-gray-700">Campaign Types</label>
                  <div className="space-y-3">
                    {config.campaignTypes.map((type, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <div className="flex-1 p-4 bg-gray-50 border border-gray-200 rounded-md text-gray-700 font-medium">
                          {type}
                        </div>
                        <button
                          onClick={() => handleRemoveType(type)}
                          className="p-3 text-gray-400 hover:text-red-500 transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center space-x-2 pt-2">
                      <input
                        type="text"
                        value={newType}
                        onChange={(e) => setNewType(e.target.value)}
                        className="flex-1 p-4 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-400 outline-none text-gray-700"
                        placeholder="Add new type..."
                      />
                      <button
                        onClick={handleAddType}
                        className="p-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all shadow-md"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-base font-semibold text-gray-700">Default Conversion Settings</label>
                  <div className="space-y-6 bg-gray-50 p-8 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between">
                      <label className="text-gray-600 font-medium">CPRM Conversion</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={config.cprmConversion}
                          onChange={(e) => setConfig({ ...config, cprmConversion: Number(e.target.value) })}
                          className="w-20 p-3 border border-gray-300 rounded text-center outline-none bg-white font-bold text-blue-600"
                        />
                        <span className="text-gray-400 font-bold">%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-gray-600 font-medium">Company Conversion</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={config.companyConversion}
                          onChange={(e) => setConfig({ ...config, companyConversion: Number(e.target.value) })}
                          className="w-20 p-3 border border-gray-300 rounded text-center outline-none bg-white font-bold text-blue-600"
                        />
                        <span className="text-gray-400 font-bold">%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-gray-100 flex justify-start">
                <button
                  onClick={handleConfigSave}
                  disabled={loading}
                  className="flex items-center space-x-2 py-3 px-8 bg-[#28a745] text-white rounded font-bold text-sm hover:bg-green-700 transition-all shadow-md"
                >
                  <Save size={18} />
                  <span>Save Settings</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'social' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                  <thead className="bg-[#f8f9fa] text-xs font-bold text-gray-600 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4">Platform</th>
                      <th className="px-6 py-4">State</th>
                      <th className="px-6 py-4">Cluster</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4">Quarter</th>
                      <th className="px-6 py-4">Budget</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 font-medium text-sm">
                    {socialPlatforms.map((p, idx) => (
                      <tr key={p._id} className="hover:bg-gray-50/50 transition-all">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            {p.platform === 'Facebook' && <Facebook size={16} className="text-blue-600" />}
                            {p.platform === 'Instagram' && <Instagram size={16} className="text-pink-600" />}
                            {p.platform === 'Twitter' && <Twitter size={16} className="text-blue-400" />}
                            {p.platform === 'LinkedIn' && <Linkedin size={16} className="text-blue-700" />}
                            <select
                              value={p.platform}
                              onChange={(e) => handleUpdatePlatform(p._id, { platform: e.target.value })}
                              className="bg-transparent outline-none focus:ring-0 cursor-pointer"
                            >
                              <option value="Facebook">Facebook</option>
                              <option value="Instagram">Instagram</option>
                              <option value="Twitter">Twitter</option>
                              <option value="LinkedIn">LinkedIn</option>
                              <option value="Google">Google</option>
                            </select>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={p.state?._id || p.state || ''}
                            onChange={(e) => handleUpdatePlatform(p._id, { state: e.target.value })}
                            className="bg-transparent outline-none border border-gray-300 rounded-md p-2 text-xs"
                          >
                            <option value="">Select State</option>
                            {states.map(s => (
                              <option key={s._id} value={s._id}>{s.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={p.cluster?._id || p.cluster || ''}
                            onChange={(e) => handleUpdatePlatform(p._id, { cluster: e.target.value })}
                            className="bg-transparent outline-none border border-gray-300 rounded-md p-2 text-xs"
                          >
                            <option value="">Select Cluster</option>
                            {clusters
                              .filter(c => !p.state || (c.state?._id || c.state) === (p.state?._id || p.state))
                              .map(c => (
                                <option key={c._id} value={c._id}>{c.name}</option>
                              ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleUpdatePlatform(p._id, { status: p.status === 'Active' ? 'Inactive' : 'Active' })}
                            className={`px-3 py-1 rounded text-[11px] font-bold uppercase transition-all ${p.status === 'Active'
                              ? 'bg-[#28a745] text-white'
                              : 'bg-gray-200 text-gray-600'
                              }`}
                          >
                            {p.status}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={p.quarter}
                            onChange={(e) => handleUpdatePlatform(p._id, { quarter: e.target.value })}
                            className="bg-transparent outline-none border border-gray-300 rounded-md p-2 text-sm"
                          >
                            <option value="January-March">January-March</option>
                            <option value="April-June">April-June</option>
                            <option value="July-September">July-September</option>
                            <option value="October-December">October-December</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={p.budget}
                            onBlur={(e) => handleUpdatePlatform(p._id, { budget: Number(e.target.value) })}
                            onChange={(e) => {
                              const newVal = e.target.value;
                              setSocialPlatforms(socialPlatforms.map(item =>
                                item._id === p._id ? { ...item, budget: newVal } : item
                              ));
                            }}
                            className="w-24 border border-gray-300 rounded-md p-2 text-sm outline-none"
                            placeholder="Budget"
                          />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center space-x-4">
                            <button className="text-sm font-bold text-[#28a745] hover:opacity-80">Done</button>
                            <button
                              onClick={() => handleDeletePlatform(p._id)}
                              className="text-red-400 hover:text-red-600 transition-all border border-red-200 p-1 rounded"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-start">
                <button
                  onClick={handleAddPlatform}
                  className="flex items-center space-x-2 py-2.5 px-6 bg-[#28a745] text-white rounded font-bold text-sm hover:bg-green-700 transition-all shadow-sm"
                >
                  <Plus size={18} />
                  <span>Add New Platform</span>
                </button>
              </div>

              {/* Dynamic Platform Summary Cards */}
              <div className="mt-10 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center space-x-2">
                    <BarChart2 className="text-[#00669c]" size={20} />
                    <span>Platform Wise Budget Summary</span>
                  </h3>
                  <div className="bg-[#00669c] text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-sm">
                    Total Platforms: {socialPlatforms.length}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {socialPlatforms.map((p, idx) => (
                    <div key={p._id || idx} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
                      <div className="bg-[#f8f9fa] p-4 border-b border-gray-200 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {p.platform === 'Facebook' && <Facebook size={18} className="text-blue-600" />}
                          {p.platform === 'Instagram' && <Instagram size={18} className="text-pink-600" />}
                          {p.platform === 'Twitter' && <Twitter size={18} className="text-blue-400" />}
                          {p.platform === 'LinkedIn' && <Linkedin size={18} className="text-blue-700" />}
                          <span className="font-bold text-gray-700">{p.platform}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded text-white uppercase ${p.status === 'Active' ? 'bg-green-500' : 'bg-gray-400'}`}>
                          {p.status}
                        </span>
                      </div>

                      <div className="p-5 space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 italic">State:</span>
                          <span className="font-semibold text-gray-800">{p.state?.name || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 italic">Cluster:</span>
                          <span className="font-semibold text-gray-800">{p.cluster?.name || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 italic">Quarter:</span>
                          <span className="font-semibold text-[#00669c]">{p.quarter}</span>
                        </div>
                        <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Budget</span>
                          <div className="text-lg font-bold text-gray-900 flex items-center">
                            <span className="text-sm mr-1">₹</span>
                            {Number(p.budget).toLocaleString() || '0'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {socialPlatforms.length === 0 && (
                    <div className="col-span-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-10 text-center">
                      <p className="text-gray-400 italic">No platforms added yet. Add a platform above to see the summary.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'budget' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                <div className="space-y-4">
                  <label className="text-base font-semibold text-gray-700">Default Company Campaign Budget (₹)</label>
                  <input
                    type="number"
                    value={config.defaultCompanyBudget}
                    onChange={(e) => setConfig({ ...config, defaultCompanyBudget: Number(e.target.value) })}
                    className="w-full p-4 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-400 outline-none text-gray-700 bg-white font-medium"
                    placeholder="5000"
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-base font-semibold text-gray-700">Default CPRM Campaign Budget (₹)</label>
                  <input
                    type="number"
                    value={config.defaultCprmBudget}
                    onChange={(e) => setConfig({ ...config, defaultCprmBudget: Number(e.target.value) })}
                    className="w-full p-4 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-400 outline-none text-gray-700 bg-white font-medium"
                    placeholder="2500"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100">
                <button
                  onClick={handleConfigSave}
                  disabled={loading}
                  className="flex items-center space-x-2 py-3 px-8 bg-[#28a745] text-white rounded font-bold text-sm hover:bg-green-700 transition-all shadow-md"
                >
                  <Save size={18} />
                  <span>Save Budget Settings</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Area */}
      <div className="mt-6 bg-white rounded-lg p-8 shadow-sm border border-gray-200 flex justify-center">
        <p className="text-base font-semibold text-gray-700 tracking-wide">
          Copyright © {new Date().getFullYear()} Solarkits. All Rights Reserved.
        </p>
      </div>
    </div>
  );
};

export default CampaignManagement;