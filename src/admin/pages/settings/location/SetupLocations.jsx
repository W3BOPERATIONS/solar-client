'use client';

import React, { useState, useEffect } from 'react';
import {
  Globe,
  CheckCircle,
  PlusCircle,
  Search,
  Edit2,
  Trash2,
  X,
  AlertCircle,
} from 'lucide-react';

import { locationAPI } from '../../../../api/api';

const toId = (v) => {
  if (!v) return '';
  if (typeof v === 'string') return v;
  return v?._id || '';
};

const normalizeItemToForm = (item) => ({
  name: item?.name || '',
  code: item?.code || '',
  description: item?.description || '',
  country: toId(item?.country),
  state: toId(item?.state),
  city: toId(item?.city),
  district: toId(item?.district),
  cluster: toId(item?.cluster),
});

export default function SetupLocations() {
  const [activeTab, setActiveTab] = useState('countries');
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]); // New state for Cities
  const [districts, setDistricts] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [zones, setZones] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    country: '',
    state: '',
    city: '', // New field
    district: '',
    cluster: '',
  });

  // Load base data on mount
  useEffect(() => {
    loadCountries();
  }, []);

  // Load data whenever tab changes
  useEffect(() => {
    setSearchQuery('');
    setError('');
    setSuccess('');

    if (activeTab === 'countries') loadCountries();
    else if (activeTab === 'states') loadStates();
    else if (activeTab === 'cities') loadCities(); // Load cities
    else if (activeTab === 'districts') loadDistricts();
    else if (activeTab === 'clusters') loadClusters();
    else if (activeTab === 'zones') loadZones();
  }, [activeTab]);

  // Load states when country changes
  useEffect(() => {
    if (!showForm) return;
    if (formData.country) {
      loadStates({ countryId: formData.country });
    } else {
      setStates([]);
      setFormData((prev) => ({ ...prev, state: '', city: '', district: '', cluster: '' }));
    }
  }, [formData.country, showForm]);

  // Load cities when state changes (New dependency)
  useEffect(() => {
    if (!showForm) return;
    if (formData.state) {
      loadCities({ stateId: formData.state });
    } else {
      setCities([]);
      setFormData((prev) => ({ ...prev, city: '', district: '', cluster: '' }));
    }
  }, [formData.state, showForm]);

  // Load districts when city changes (Updated dependency: State -> City -> District)
  useEffect(() => {
    if (!showForm) return;
    if (formData.city) {
      loadDistricts({ cityId: formData.city });
    } else {
      setDistricts([]);
      setFormData((prev) => ({ ...prev, district: '', cluster: '' }));
    }
  }, [formData.city, showForm]);

  // Load clusters when district changes
  useEffect(() => {
    if (!showForm) return;
    if (formData.district) {
      loadClusters({ districtId: formData.district });
    } else {
      setClusters([]);
      setFormData((prev) => ({ ...prev, cluster: '' }));
    }
  }, [formData.district, showForm]);

  // Load zones when cluster changes
  useEffect(() => {
    if (!showForm) return;
    if (formData.cluster) {
      loadZones({ clusterId: formData.cluster });
    } else {
      setZones([]);
    }
  }, [formData.cluster, showForm]);

  // When closing available form, reload list for the active tab
  useEffect(() => {
    if (showForm) return;
    if (activeTab === 'countries') loadCountries();
    if (activeTab === 'states') loadStates();
    if (activeTab === 'cities') loadCities();
    if (activeTab === 'districts') loadDistricts();
    if (activeTab === 'clusters') loadClusters();
    if (activeTab === 'zones') loadZones();
  }, [showForm, activeTab]);

  const loadCountries = async () => {
    try {
      setLoading(true);
      const response = await locationAPI.getAllCountries({ isActive: 'true' });
      setCountries(response.data.data || []);
    } catch (err) {
      setError('Failed to load countries');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStates = async (params) => {
    try {
      const response = await locationAPI.getAllStates(params);
      setStates(response.data.data || []);
    } catch (err) {
      console.error('Failed to load states:', err);
    }
  };

  const loadCities = async (params) => {
    try {
      const response = await locationAPI.getAllCities(params);
      setCities(response.data.data || []);
    } catch (err) {
      console.error('Failed to load cities:', err);
    }
  };

  const loadDistricts = async (params) => {
    try {
      const response = await locationAPI.getAllDistricts(params);
      setDistricts(response.data.data || []);
    } catch (err) {
      console.error('Failed to load districts:', err);
    }
  };

  const loadClusters = async (params) => {
    try {
      const response = await locationAPI.getAllClusters(params);
      setClusters(response.data.data || []);
    } catch (err) {
      console.error('Failed to load clusters:', err);
    }
  };

  const loadZones = async (params) => {
    try {
      const response = await locationAPI.getAllZones(params);
      setZones(response.data.data || []);
    } catch (err) {
      console.error('Failed to load zones:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = normalizeItemToForm(formData);
      // Clean up empty strings or nulls
      Object.keys(payload).forEach(key => {
        if (!payload[key]) delete payload[key];
      });

      // Explicitly keep country/state/city/district/cluster IDs if required by schema validation
      if (formData.country) payload.country = formData.country;
      if (formData.state) payload.state = formData.state;
      if (formData.city) payload.city = formData.city;
      if (formData.district) payload.district = formData.district;
      if (formData.cluster) payload.cluster = formData.cluster;


      if (activeTab === 'countries') {
        if (editingId) await locationAPI.updateCountry(editingId, payload);
        else await locationAPI.createCountry(payload);
        setSuccess(`Country ${editingId ? 'updated' : 'created'} successfully`);
        loadCountries();
      } else if (activeTab === 'states') {
        if (editingId) await locationAPI.updateState(editingId, payload);
        else await locationAPI.createState(payload);
        setSuccess(`State ${editingId ? 'updated' : 'created'} successfully`);
        loadStates({ countryId: formData.country });
      } else if (activeTab === 'cities') {
        if (editingId) await locationAPI.updateCity(editingId, payload);
        else await locationAPI.createCity(payload);
        setSuccess(`City ${editingId ? 'updated' : 'created'} successfully`);
        loadCities({ stateId: formData.state });
      } else if (activeTab === 'districts') {
        if (editingId) await locationAPI.updateDistrict(editingId, payload);
        else await locationAPI.createDistrict(payload);
        setSuccess(`District ${editingId ? 'updated' : 'created'} successfully`);
        loadDistricts({ cityId: formData.city });
      } else if (activeTab === 'clusters') {
        if (editingId) await locationAPI.updateCluster(editingId, payload);
        else await locationAPI.createCluster(payload);
        setSuccess(`Cluster ${editingId ? 'updated' : 'created'} successfully`);
        loadClusters({ districtId: formData.district });
      } else if (activeTab === 'zones') {
        if (editingId) await locationAPI.updateZone(editingId, payload);
        else await locationAPI.createZone(payload);
        setSuccess(`Zone ${editingId ? 'updated' : 'created'} successfully`);
        loadZones({ clusterId: formData.cluster });
      }

      resetForm();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this?')) {
      try {
        setLoading(true);
        if (activeTab === 'countries') {
          await locationAPI.deleteCountry(id);
          loadCountries();
        } else if (activeTab === 'states') {
          await locationAPI.deleteState(id);
          loadStates({ countryId: formData.country });
        } else if (activeTab === 'cities') {
          await locationAPI.deleteCity(id);
          loadCities({ stateId: formData.state });
        } else if (activeTab === 'districts') {
          await locationAPI.deleteDistrict(id);
          loadDistricts({ cityId: formData.city });
        } else if (activeTab === 'clusters') {
          await locationAPI.deleteCluster(id);
          loadClusters({ districtId: formData.district });
        } else if (activeTab === 'zones') {
          await locationAPI.deleteZone(id);
          loadZones({ clusterId: formData.cluster });
        }
        setSuccess('Deleted successfully');
      } catch (err) {
        setError('Failed to delete');
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      country: '',
      state: '',
      city: '',
      district: '',
      cluster: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const getDisplayData = () => {
    let data = [];
    if (activeTab === 'countries') data = countries;
    else if (activeTab === 'states') data = states;
    else if (activeTab === 'cities') data = cities;
    else if (activeTab === 'districts') data = districts;
    else if (activeTab === 'clusters') data = clusters;
    else if (activeTab === 'zones') data = zones;

    return data.filter(item =>
      item.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getCountByParent = () => {
    if (activeTab === 'countries') return countries.length;
    if (activeTab === 'states') return states.length;
    if (activeTab === 'cities') return cities.length;
    if (activeTab === 'districts') return districts.length;
    if (activeTab === 'clusters') return clusters.length;
    if (activeTab === 'zones') return zones.length;
    return 0;
  };

  // Tabs list
  const TABS = ['countries', 'states', 'cities', 'districts', 'clusters', 'zones'];

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-2xl bg-white shadow-[0px_3px_10px_rgba(0,0,0,0.08)] p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="font-bold text-2xl flex items-center gap-2 text-gray-800">
                <Globe className="text-blue-500" size={28} />
                Location Management
              </h4>
              <p className="text-gray-500 mt-2 text-sm">
                Manage countries, states, cities, districts, clusters and zones
              </p>
            </div>
            <div className="text-right">
              <h3 className="font-bold text-3xl text-blue-500">{getCountByParent()}</h3>
              <small className="text-gray-500 text-sm capitalize">Total {activeTab}</small>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4 flex-wrap">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  resetForm();
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === tab
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="rounded-2xl bg-red-50 shadow-[0px_3px_10px_rgba(0,0,0,0.08)] p-4 border border-red-200 flex gap-2">
            <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
            <span className="text-red-700">{error}</span>
            <button onClick={() => setError('')} className="ml-auto">
              <X size={18} className="text-red-500" />
            </button>
          </div>
        )}
        {success && (
          <div className="rounded-2xl bg-green-50 shadow-[0px_3px_10px_rgba(0,0,0,0.08)] p-4 border border-green-200 flex gap-2">
            <CheckCircle className="text-green-500 flex-shrink-0" size={20} />
            <span className="text-green-700">{success}</span>
            <button onClick={() => setSuccess('')} className="ml-auto">
              <X size={18} className="text-green-500" />
            </button>
          </div>
        )}

        {/* Add Form */}
        {showForm && (
          <div className="rounded-2xl bg-gray-50 shadow-[0px_3px_10px_rgba(0,0,0,0.08)] p-6 border-2 border-blue-200">
            <div className="flex justify-between items-center mb-4">
              <h5 className="font-bold text-lg">{editingId ? 'Edit' : 'Add New'} {activeTab.slice(0, -1)}</h5>
              <button
                onClick={resetForm}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Country Selector (Required for State+) */}
              {activeTab !== 'countries' && (
                <div>
                  <label className="font-semibold text-gray-700 block mb-2">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">-- Select Country --</option>
                    {countries.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* State Selector (Required for City+) */}
              {['cities', 'districts', 'clusters', 'zones'].includes(activeTab) && (
                <div>
                  <label className="font-semibold text-gray-700 block mb-2">
                    State <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={!formData.country}
                  >
                    <option value="">-- Select State --</option>
                    {states.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* City Selector (Required for District+) */}
              {['districts', 'clusters', 'zones'].includes(activeTab) && (
                <div>
                  <label className="font-semibold text-gray-700 block mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={!formData.state}
                  >
                    <option value="">-- Select City --</option>
                    {cities.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* District Selector (Required for Cluster+) */}
              {['clusters', 'zones'].includes(activeTab) && (
                <div>
                  <label className="font-semibold text-gray-700 block mb-2">
                    District <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={!formData.city}
                  >
                    <option value="">-- Select District --</option>
                    {districts.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Cluster Selector (Required for Zones) */}
              {activeTab === 'zones' && (
                <div>
                  <label className="font-semibold text-gray-700 block mb-2">
                    Cluster <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.cluster}
                    onChange={(e) => setFormData({ ...formData, cluster: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={!formData.district}
                  >
                    <option value="">-- Select Cluster --</option>
                    {clusters.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="font-semibold text-gray-700 block mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-2">Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <CheckCircle size={20} />
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-3 px-4 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Add Button */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full rounded-2xl bg-blue-50 shadow-[0px_3px_10px_rgba(0,0,0,0.08)] p-4 border-2 border-dashed border-blue-300 hover:border-blue-500 text-blue-600 font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <PlusCircle size={20} />
            Add New {activeTab.slice(0, -1)}
          </button>
        )}

        {/* Search */}
        {getDisplayData().length > 0 && (
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}

        {/* List */}
        <div className="space-y-3">
          {getDisplayData().length > 0 ? (
            getDisplayData().map((item) => (
              <div key={item._id} className="rounded-xl shadow-[0px_2px_8px_rgba(0,0,0,0.06)] p-4 bg-white border-l-4 border-blue-500">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h5 className="font-bold text-lg text-gray-800">{item.name}</h5>
                    {item.code && <p className="text-sm text-gray-500">Code: {item.code}</p>}
                    {item.description && <p className="text-sm text-gray-600 mt-1">{item.description}</p>}

                    {/* Hierarchy details */}
                    {activeTab !== 'countries' && item.country?.name && (
                      <p className="text-xs text-gray-500 mt-1">Country: {item.country.name}</p>
                    )}
                    {['cities', 'districts', 'clusters', 'zones'].includes(activeTab) && item.state?.name && (
                      <p className="text-xs text-gray-500 mt-1">State: {item.state.name}</p>
                    )}
                    {['districts', 'clusters', 'zones'].includes(activeTab) && item.city?.name && (
                      <p className="text-xs text-gray-500 mt-1">City: {item.city.name}</p>
                    )}
                    {['clusters', 'zones'].includes(activeTab) && item.district?.name && (
                      <p className="text-xs text-gray-500 mt-1">District: {item.district.name}</p>
                    )}
                    {activeTab === 'zones' && item.cluster?.name && (
                      <p className="text-xs text-gray-500 mt-1">Cluster: {item.cluster.name}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setFormData(normalizeItemToForm(item));
                        setEditingId(item._id);
                        setShowForm(true);
                      }}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl bg-white shadow-[0px_3px_10px_rgba(0,0,0,0.08)] p-8 text-center text-gray-500">
              <AlertCircle size={40} className="mx-auto mb-3 opacity-50" />
              <p className="font-medium">No {activeTab} available</p>
              <p className="text-sm mt-1">Add a new {activeTab.slice(0, -1)} to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
