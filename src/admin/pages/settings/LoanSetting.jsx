import React, { useState, useEffect } from 'react';
import {
  Save, RotateCcw, Plus, Trash2, Edit2, CheckCircle, AlertCircle, Loader2,
  ChevronRight, Building2, Home
} from 'lucide-react';
import * as settingsApi from '../../../services/settings/settingsApi';

export default function LoanSetting() {
  const [loanRules, setLoanRules] = useState([]);
  const [activeTab, setActiveTab] = useState('Residential');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formFields, setFormFields] = useState({
    'Residential': [],
    'Commercial': []
  });

  const fieldOptions = [
    { id: 'min_cibil', label: 'Minimum CIBIL Score' },
    { id: 'max_ltv', label: 'Max LTV (%)' },
    { id: 'min_bank_balance', label: 'Min Avg Bank Balance' },
    { id: 'processing_fee', label: 'Processing Fee (%)' },
    { id: 'min_itr', label: 'Min Declared Income (ITR)' },
    { id: 'lockin_period', label: 'Lock-in Period (months)' },
    { id: 'down_payment', label: 'Down Payment (%)' },
    { id: 'foreclosure_charges', label: 'Foreclosure Charges (%)' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const rules = await settingsApi.fetchLoanRules();
      // Filter ONLY global rules (clusterId is missing or null)
      const globalRules = (rules || []).filter(r => !r.clusterId);
      setLoanRules(globalRules);

      // Initialize form fields from global rules
      const newFormFields = { 'Residential': [], 'Commercial': [] };
      globalRules.forEach(rule => {
        // Convert 'residential' or 'RESIDENTIAL' to 'Residential'
        const normalizedType = rule.projectType.charAt(0).toUpperCase() + rule.projectType.slice(1).toLowerCase();
        if (newFormFields[normalizedType]) {
          newFormFields[normalizedType] = rule.fields
            .filter(f => f.selected)
            .map(f => f.name);
        }
      });
      setFormFields(newFormFields);
      console.log('Loaded global loan rules:', globalRules);
    } catch (err) {
      setError('Failed to load loan settings');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (fieldId) => {
    setFormFields(prev => {
      const current = prev[activeTab] || [];
      if (current.includes(fieldId)) {
        return { ...prev, [activeTab]: current.filter(id => id !== fieldId) };
      } else {
        return { ...prev, [activeTab]: [...current, fieldId] };
      }
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      console.log('Saving global settings...', formFields);

      const tasks = Object.keys(formFields).map(async (type) => {
        const selectedFields = fieldOptions.map(opt => ({
          name: opt.id,
          selected: formFields[type].includes(opt.id)
        }));

        const existingRule = loanRules.find(r =>
          r.projectType.toLowerCase() === type.toLowerCase()
        );
        console.log(`Checking ${type}: existingId=`, existingRule?._id);

        const payload = {
          projectType: type, // e.g., 'Residential'
          clusterId: null,   // Explicitly make global
          interestRate: 0,
          tenureMonths: 0,
          maxAmount: 0,
          fields: selectedFields,
          status: 'active'
        };

        if (existingRule) {
          console.log(`Updating global rule for ${type}: ${existingRule._id}`);
          return settingsApi.updateLoanRule(existingRule._id, payload);
        } else {
          console.log(`Creating new global rule for ${type}`);
          return settingsApi.createLoanRule(payload);
        }
      });

      await Promise.all(tasks);
      setSuccess('Settings saved successfully');
      loadData();
    } catch (err) {
      console.error('Save failed:', err);
      setError(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    loadData();
    setSuccess('');
    setError('');
  };

  const getLabel = (id) => fieldOptions.find(opt => opt.id === id)?.label || id;

  const handleRemove = async (type) => {
    if (!window.confirm(`Are you sure you want to remove all fields for ${type}?`)) return;
    try {
      setSaving(true);
      const rule = loanRules.find(r => r.projectType.toLowerCase() === type.toLowerCase());
      if (rule) {
        await settingsApi.deleteLoanRule(rule._id);
        setSuccess(`${type} settings removed`);
        loadData();
      }
    } catch (err) {
      setError('Failed to remove settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 bg-[#f0f2f5] min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-[#003366] mb-6">Loan Provider Settings</h2>

        {/* Alerts */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center shadow-sm">
            <AlertCircle className="w-5 h-5 mr-2" /> {error}
          </div>
        )}
        {success && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded flex items-center shadow-sm">
            <CheckCircle className="w-5 h-5 mr-2" /> {success}
          </div>
        )}

        {/* Project Types Card */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-8 overflow-hidden">
          <div className="bg-gray-50 px-6 py-3 border-b flex justify-between items-center">
            <h3 className="font-semibold text-gray-700">Project Types</h3>
          </div>

          <div className="p-6">
            {/* Tabs */}
            <div className="flex space-x-2 mb-6 border-b border-gray-100 pb-4">
              {['Residential', 'Commercial'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 ${activeTab === tab
                    ? 'bg-[#007bff] text-white shadow-md'
                    : 'bg-[#f8f9fa] text-gray-500 hover:bg-gray-100'
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Field Selection Area */}
            <div className="bg-gray-50/50 rounded-xl p-6 border border-gray-200 relative mb-8">
              <h4 className="text-[#003366] font-bold text-lg mb-6 flex items-center">
                <div className="w-1.5 h-6 bg-blue-500 rounded-full mr-3"></div>
                Select Fields for {activeTab} Projects
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8">
                {fieldOptions.map((opt) => (
                  <div key={opt.id} className="flex items-center group bg-white p-3 rounded-lg border border-transparent hover:border-blue-200 hover:shadow-sm transition-all">
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        id={opt.id}
                        checked={formFields[activeTab].includes(opt.id)}
                        onChange={() => handleCheckboxChange(opt.id)}
                        className="w-5 h-5 border-gray-300 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </div>
                    <label htmlFor={opt.id} className="ml-3 text-gray-700 font-medium cursor-pointer group-hover:text-blue-600 transition-colors">
                      {opt.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Fields Summary Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h4 className="font-bold text-gray-800 flex items-center">
                  <ChevronRight size={18} className="mr-2 text-blue-500" />
                  Selected Fields by Project Type
                </h4>
                <button
                  onClick={() => setActiveTab(activeTab === 'Residential' ? 'Commercial' : 'Residential')}
                  className="text-blue-600 text-sm font-bold hover:text-blue-700 flex items-center bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Plus size={14} className="mr-1" /> Add Project Type
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#f8fafc] border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Project Type</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Selected Fields</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {['Residential', 'Commercial'].map(type => (
                      formFields[type].length > 0 && (
                        <tr key={type} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-6 py-5 align-top">
                            <div className="flex items-center">
                              {type === 'Residential' ? <Home size={18} className="mr-2 text-blue-500" /> : <Building2 size={18} className="mr-2 text-blue-500" />}
                              <span className="text-gray-900 font-bold">{type}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex flex-wrap gap-2">
                              {formFields[type].map(id => (
                                <span key={id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                  {getLabel(id)}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-5 align-top">
                            <div className="flex justify-center space-x-3">
                              <button
                                onClick={() => {
                                  setActiveTab(type);
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="flex items-center px-3 py-1 bg-blue-50 text-blue-600 rounded-md text-xs font-bold hover:bg-blue-100 transition-colors"
                              >
                                <Edit2 size={12} className="mr-1" /> Edit
                              </button>
                              <button
                                onClick={() => handleRemove(type)}
                                className="flex items-center px-3 py-1 bg-red-50 text-red-600 rounded-md text-xs font-bold hover:bg-red-100 transition-colors"
                              >
                                <Trash2 size={12} className="mr-1" /> Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    ))}
                    {!formFields['Residential'].length && !formFields['Commercial'].length && (
                      <tr>
                        <td colSpan="3" className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center opacity-40">
                            <Plus size={48} className="mb-2 text-gray-300" />
                            <p className="text-gray-500 font-medium">No project types configured</p>
                            <p className="text-xs text-gray-400 mt-1">Select fields above and click Save Settings</p>
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

        {/* Bottom Actions */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleReset}
            className="px-6 py-2 bg-gray-500 text-white rounded font-bold hover:bg-gray-600 transition-all flex items-center shadow-md"
          >
            <RotateCcw size={18} className="mr-2" /> Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-[#007bff] text-white rounded font-bold hover:bg-[#0069d9] transition-all flex items-center shadow-md disabled:bg-blue-300"
          >
            {saving ? <Loader2 size={18} className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
            Save Settings
          </button>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-[100]">
          <div className="bg-white p-5 rounded-xl shadow-2xl flex flex-col items-center border border-blue-50">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            <span className="mt-3 text-blue-600 font-bold tracking-wide">Loading Settings...</span>
          </div>
        </div>
      )}
    </div>
  );
}
