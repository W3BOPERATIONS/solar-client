import React, { useState, useEffect } from 'react';
import {
  Home, Building2, Factory, Plus, Edit2, Trash2, Save,
  RotateCcw, ClipboardList, CheckCircle, Clock, MapPin,
  Compass, Grid3x3, Target, AlertCircle, Loader2
} from 'lucide-react';
import * as settingsApi from '../../../services/settings/settingsApi';
import * as locationApi from '../../../services/locationApi';

export default function LoanSetting() {
  // Regional Scoping State
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [clusters, setClusters] = useState([]);

  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedCluster, setSelectedCluster] = useState(null);

  // Data State
  const [loanRules, setLoanRules] = useState([]);
  const [activeTab, setActiveTab] = useState('residential');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [completions, setCompletions] = useState([]);

  const projectTypes = ['residential', 'commercial', 'industrial'];
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    projectType: 'residential',
    interestRate: '',
    tenureMonths: '',
    maxAmount: '',
    status: 'active',
    fields: []
  });

  const fieldNames = {
    'min_cibil': 'Minimum CIBIL Score',
    'min_bank_balance': 'Min Avg Bank Balance',
    'min_itr_income': 'Min Declared Income (ITR)',
    'down_payment_pct': 'Down Payment (%)',
    'max_ltv_pct': 'Max LTV (%)',
    'processing_fee_pct': 'Processing Fee (%)',
    'lockin_months': 'Lock-in Period (months)',
    'foreclosure_charges_pct': 'Foreclosure Charges (%)'
  };

  const allFields = Object.keys(fieldNames);

  // Initial load
  useEffect(() => {
    const loadInitial = async () => {
      try {
        setLoading(true);
        const fetchedCountries = await locationApi.getCountries();
        setCountries(fetchedCountries || []);
      } catch (err) {
        setError('Failed to load countries');
      } finally {
        setLoading(false);
      }
    };
    loadInitial();
  }, []);

  // Fetch regional data when cluster selected
  useEffect(() => {
    if (selectedCluster) {
      loadClusterData();
    } else {
      setLoanRules([]);
      setCompletions([]);
    }
  }, [selectedCluster]);

  const loadClusterData = async () => {
    try {
      setLoading(true);
      const [rules, comps] = await Promise.all([
        settingsApi.fetchLoanRules(selectedCluster._id),
        settingsApi.fetchModuleCompletions(selectedCluster._id)
      ]);
      setLoanRules(rules || []);
      setCompletions(comps || []);
    } catch (err) {
      setError('Failed to load cluster data');
    } finally {
      setLoading(false);
    }
  };

  // Location Handlers
  const handleCountrySelect = async (country) => {
    setSelectedCountry(country);
    setSelectedState(null);
    setSelectedDistrict(null);
    setSelectedCluster(null);
    setStates([]);
    setDistricts([]);
    setClusters([]);
    if (country) {
      const fetched = await locationApi.getStates(country._id);
      setStates(fetched || []);
    }
  };

  const handleStateSelect = async (state) => {
    setSelectedState(state);
    setSelectedDistrict(null);
    setSelectedCluster(null);
    setDistricts([]);
    setClusters([]);
    if (state) {
      const fetched = await locationApi.getDistricts({ stateId: state._id });
      setDistricts(fetched || []);
    }
  };

  const handleDistrictSelect = async (district) => {
    setSelectedDistrict(district);
    setSelectedCluster(null);
    setClusters([]);
    if (district) {
      const fetched = await locationApi.getClusters(district._id);
      setClusters(fetched || []);
    }
  };

  // CRUD Handlers
  const handleCheckboxChange = (field) => {
    setFormData(prev => {
      const currentFields = prev.fields || [];
      const exists = currentFields.find(f => f.name === field);
      if (exists) {
        return {
          ...prev,
          fields: currentFields.map(f => f.name === field ? { ...f, selected: !f.selected } : f)
        };
      } else {
        return {
          ...prev,
          fields: [...currentFields, { name: field, selected: true }]
        };
      }
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedCluster) {
      setError('Please select a cluster first');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const payload = {
        ...formData,
        clusterId: selectedCluster._id
      };

      if (editingId) {
        await settingsApi.updateLoanRule(editingId, payload);
        setSuccess('Loan rule updated successfully');
      } else {
        await settingsApi.createLoanRule(payload);
        setSuccess('Loan rule created successfully');
      }

      resetForm();
      loadClusterData();
      setShowAddModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save loan rule');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this loan rule?')) return;
    try {
      setLoading(true);
      await settingsApi.deleteLoanRule(id);
      setSuccess('Deleted successfully');
      loadClusterData();
    } catch (err) {
      setError('Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (rule) => {
    setFormData({
      projectType: rule.projectType,
      interestRate: rule.interestRate,
      tenureMonths: rule.tenureMonths,
      maxAmount: rule.maxAmount,
      status: rule.status,
      fields: rule.fields || []
    });
    setEditingId(rule._id);
    setActiveTab(rule.projectType);
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      projectType: 'residential',
      interestRate: '',
      tenureMonths: '',
      maxAmount: '',
      status: 'active',
      fields: []
    });
    setEditingId(null);
  };

  const handleReset = () => {
    resetForm();
    setError('');
    setSuccess('');
  };

  const getProjectDisplayName = (type) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getProjectIcon = (type) => {
    if (type === 'residential') return <Home size={18} className="mr-2" />;
    if (type === 'commercial') return <Building2 size={18} className="mr-2" />;
    if (type === 'industrial') return <Factory size={18} className="mr-2" />;
    return <Home size={18} className="mr-2" />;
  };

  // Stats calculate
  const currentCompletion = completions.find(c => c.moduleName === 'Loan Setting');
  const isCompleted = currentCompletion?.completed || false;
  const progressPercent = currentCompletion?.progressPercent || 0;

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <nav className="bg-white rounded-lg shadow-sm p-4 flex justify-between items-center">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center">
            <ClipboardList className="w-8 h-8 mr-3 text-blue-600" />
            Loan Provider Settings
          </h3>
          <div className="flex items-center space-x-4">
            {isCompleted ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                <CheckCircle className="w-4 h-4 mr-1" /> Completed
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                <Clock className="w-4 h-4 mr-1" /> Pending
              </span>
            )}
            <div className="w-32 bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>
        </nav>
      </div>

      {/* Regional Scoping */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h4 className="text-lg font-bold text-gray-700 mb-4 flex items-center">
          <Compass className="w-5 h-5 mr-2 text-blue-500" /> Regional Scope
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">Country</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={selectedCountry?._id || ''}
              onChange={(e) => handleCountrySelect(countries.find(c => c._id === e.target.value))}
            >
              <option value="">Select Country</option>
              {countries.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">State</label>
            <select
              disabled={!selectedCountry}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm disabled:bg-gray-50"
              value={selectedState?._id || ''}
              onChange={(e) => handleStateSelect(states.find(s => s._id === e.target.value))}
            >
              <option value="">Select State</option>
              {states.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">District</label>
            <select
              disabled={!selectedState}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm disabled:bg-gray-50"
              value={selectedDistrict?._id || ''}
              onChange={(e) => handleDistrictSelect(districts.find(d => d._id === e.target.value))}
            >
              <option value="">Select District</option>
              {districts.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">Cluster</label>
            <select
              disabled={!selectedDistrict}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm disabled:bg-gray-50"
              value={selectedCluster?._id || ''}
              onChange={(e) => setSelectedCluster(clusters.find(c => c._id === e.target.value))}
            >
              <option value="">Select Cluster</option>
              {clusters.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-3" /> {error}
        </div>
      )}
      {success && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg flex items-center">
          <CheckCircle className="w-5 h-5 mr-3" /> {success}
        </div>
      )}

      {!selectedCluster ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center text-gray-500">
          <MapPin className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="text-lg">Select a cluster to manage loan settings</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Rules List / Grid */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-100 px-6 py-4 border-b flex justify-between items-center">
              <h4 className="font-bold text-gray-700">Loan Rules for {selectedCluster.name}</h4>
              <button
                type="button"
                onClick={() => { resetForm(); setShowAddModal(true); }}
                className="inline-flex items-center px-3 py-1.5 border border-blue-600 text-blue-600 rounded-md text-sm font-medium hover:bg-blue-50 transition-colors"
              >
                <Plus size={16} className="mr-1" /> Add Rule
              </button>
            </div>

            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Int. Rate</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenure</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Limit</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loanRules.length > 0 ? loanRules.map((rule) => (
                      <tr key={rule._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900 flex items-center">
                          {getProjectIcon(rule.projectType)} {getProjectDisplayName(rule.projectType)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">{rule.interestRate}%</td>
                        <td className="px-4 py-3 whitespace-nowrap">{rule.tenureMonths} Mo</td>
                        <td className="px-4 py-3 whitespace-nowrap">₹{rule.maxAmount}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs ${rule.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {rule.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap flex space-x-2">
                          <button onClick={() => handleEdit(rule)} className="text-blue-600 hover:text-blue-900"><Edit2 size={16} /></button>
                          <button onClick={() => handleDelete(rule._id)} className="text-red-600 hover:text-red-900"><Trash2 size={16} /></button>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan="6" className="px-4 py-8 text-center text-gray-500">No loan rules found for this cluster</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-500/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
              <h3 className="text-xl font-bold text-gray-900">{editingId ? 'Edit' : 'Add'} Loan Rule</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600"><Plus className="rotate-45" /></button>
            </div>

            <form onSubmit={handleSave} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Project Type</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    value={formData.projectType}
                    onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                    required
                  >
                    {projectTypes.map(t => <option key={t} value={t}>{getProjectDisplayName(t)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Interest Rate (%)</label>
                  <input
                    type="number" step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    value={formData.interestRate}
                    onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Tenure (Months)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    value={formData.tenureMonths}
                    onChange={(e) => setFormData({ ...formData, tenureMonths: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Maximum Amount (₹)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    value={formData.maxAmount}
                    onChange={(e) => setFormData({ ...formData, maxAmount: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="mb-6">
                <h5 className="font-bold text-gray-700 mb-3">Field Selection Configuration</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  {allFields.map(field => (
                    <div key={field} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`field-${field}`}
                        checked={formData.fields?.find(f => f.name === field)?.selected || false}
                        onChange={() => handleCheckboxChange(field)}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300"
                      />
                      <label htmlFor={`field-${field}`} className="ml-2 text-sm text-gray-700">{fieldNames[field]}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={saving} className="bg-blue-600 text-white px-8 py-2 rounded-lg font-bold hover:bg-blue-700 flex items-center">
                  {saving && <Loader2 className="animate-spin mr-2" size={20} />}
                  {editingId ? 'Update Rule' : 'Save Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-[60]">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        </div>
      )}
    </div>
  );
}
