import React, { useState, useEffect } from 'react';
import { Plus, Eye, EyeOff, Loader, Trash2 } from 'lucide-react';
import {
  getSupplierTypes,
  createSupplierType,
  deleteSupplierType
} from '../../../../services/vendor/vendorApi';
import { locationAPI } from '../../../../api/api';
import toast from 'react-hot-toast';

const LocationCard = ({ title, subtitle, isSelected, onClick }) => (
  <div
    onClick={onClick}
    className={`p-6 rounded-md border-2 transition-all cursor-pointer flex flex-col items-center justify-center text-center h-28 shadow-sm hover:shadow-md ${isSelected
      ? 'border-[#007bff] bg-white'
      : 'border-transparent bg-white'
      }`}
  >
    <div className="font-bold text-base text-[#333] mb-1">{title}</div>
    <div className="text-xs text-gray-500 font-medium uppercase tracking-tight">{subtitle}</div>
  </div>
);

export default function SupplierType() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showLocationCards, setShowLocationCards] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    loginTypeName: '',
    category: '',
    subCategory: '',
    projectType: '',
    subType: '',
    assignModules: '',
    loginAccessType: '',
    orderTat: '10 Days'
  });

  // Location Hierarchy State
  const [locationData, setLocationData] = useState({
    states: [],
    clusters: [],
    districts: []
  });

  const [selectedLocation, setSelectedLocation] = useState({
    state: '',
    cluster: '',
    district: ''
  });

  // Location Fetching Logic
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const res = await locationAPI.getAllStates({ isActive: true });
        if (res.data && res.data.data) setLocationData(prev => ({ ...prev, states: res.data.data }));
      } catch (error) {
        console.error('Failed to fetch states', error);
      }
    };
    fetchStates();
  }, []);

  useEffect(() => {
    const fetchClusters = async () => {
      if (selectedLocation.state) {
        try {
          const params = { isActive: true };
          if (selectedLocation.state !== 'all') params.stateId = selectedLocation.state;
          const res = await locationAPI.getAllClusters(params);
          setLocationData(prev => ({ ...prev, clusters: res.data?.data || [] }));
        } catch (error) {
          setLocationData(prev => ({ ...prev, clusters: [] }));
        }
      } else {
        setLocationData(prev => ({ ...prev, clusters: [] }));
      }
    };
    fetchClusters();
  }, [selectedLocation.state]);

  useEffect(() => {
    const fetchDistricts = async () => {
      if (selectedLocation.cluster) {
        try {
          if (selectedLocation.cluster !== 'all') {
            const res = await locationAPI.getClusterById(selectedLocation.cluster);
            if (res.data?.data?.districts) {
              setLocationData(prev => ({ ...prev, districts: res.data.data.districts }));
            } else setLocationData(prev => ({ ...prev, districts: [] }));
          } else {
            const params = { isActive: true };
            if (selectedLocation.state && selectedLocation.state !== 'all') params.stateId = selectedLocation.state;
            const res = await locationAPI.getAllDistricts(params);
            setLocationData(prev => ({ ...prev, districts: res.data?.data || [] }));
          }
        } catch (error) {
          setLocationData(prev => ({ ...prev, districts: [] }));
        }
      } else {
        setLocationData(prev => ({ ...prev, districts: [] }));
      }
    };
    fetchDistricts();
  }, [selectedLocation.cluster, selectedLocation.state]);

  // Fetch Types from DB
  useEffect(() => {
    if (selectedLocation.district) {
      fetchTypes();
    } else {
      setTypes([]);
    }
  }, [selectedLocation.district, selectedLocation.cluster, selectedLocation.state]);

  const fetchTypes = async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (selectedLocation.district && selectedLocation.district !== 'all') {
        params.districtId = selectedLocation.district;
      } else if (selectedLocation.cluster && selectedLocation.cluster !== 'all') {
        params.clusterId = selectedLocation.cluster;
      } else if (selectedLocation.state && selectedLocation.state !== 'all') {
        params.stateId = selectedLocation.state;
      }

      const res = await getSupplierTypes(params);
      if (res.success) {
        setTypes(res.data || []);
      }
    } catch (error) {
      console.error('Error fetching supplier types:', error);
      toast.error('Failed to load supplier types');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.loginTypeName.trim()) {
       toast.error('Login Type name is required');
       return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        stateId: selectedLocation.state === 'all' ? null : selectedLocation.state,
        clusterId: selectedLocation.cluster === 'all' ? null : selectedLocation.cluster,
        districtId: selectedLocation.district === 'all' ? null : selectedLocation.district,
      };

      const res = await createSupplierType(payload);
      if (res.success) {
        toast.success('Supplier type created/updated successfully');
        setFormData({
            loginTypeName: '', category: '', subCategory: '', projectType: '', subType: '', assignModules: '', loginAccessType: '', orderTat: '10 Days'
        });
        fetchTypes();
      }
    } catch (error) {
      console.error('Error saving supplier type:', error);
      toast.error(error.response?.data?.message || 'Failed to align type');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteSupplierType(id);
      toast.success('Supplier type deleted successfully');
      fetchTypes();
    } catch (error) {
      console.error('Error deleting supplier type:', error);
      toast.error('Failed to delete supplier type');
    }
  };

  return (
    <div className="bg-[#f4f7fa] min-h-screen font-sans">
      {/* Header Block */}
      <div className="bg-white p-6 border-b border-gray-200 mb-8 px-12">
        <h1 className="text-xl font-bold text-[#14233c]">Supplier Type</h1>
        <button
          onClick={() => setShowLocationCards(!showLocationCards)}
          className="mt-3 flex items-center gap-1.5 px-3 py-1.5 bg-[#0076a8] text-white rounded text-[10px] font-bold shadow-sm hover:bg-blue-800 transition-all uppercase tracking-wider"
        >
          {showLocationCards ? <EyeOff size={14} /> : <Eye size={14} />} {showLocationCards ? 'Hide Location Cards' : 'Show Location Cards'}
        </button>
      </div>

      <div className="max-w-[1400px] mx-auto px-12 pb-20">

        {/* Location Selection Section */}
        {showLocationCards && (
          <div className="space-y-10 mb-10">
            {/* States */}
            <div>
              <h2 className="text-xl font-bold text-[#333] mb-6">Select State</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <LocationCard
                  title="All States"
                  subtitle="ALL"
                  isSelected={selectedLocation.state === 'all'}
                  onClick={() => setSelectedLocation({ state: 'all', cluster: '', district: '' })}
                />
                {locationData.states.map(s => (
                  <LocationCard
                    key={s._id}
                    title={s.name}
                    subtitle={s.code || s.name.substring(0, 2).toUpperCase()}
                    isSelected={selectedLocation.state === s._id}
                    onClick={() => setSelectedLocation({ state: s._id, cluster: '', district: '' })}
                  />
                ))}
              </div>
            </div>

            {/* Clusters */}
            {selectedLocation.state && (
              <div>
                <h2 className="text-xl font-bold text-[#333] mb-6">Select Cluster</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <LocationCard
                    title="All Clusters"
                    subtitle="ALL"
                    isSelected={selectedLocation.cluster === 'all'}
                    onClick={() => setSelectedLocation(prev => ({ ...prev, cluster: 'all', district: '' }))}
                  />
                  {locationData.clusters.map(c => {
                    const parentState = locationData.states.find(s => s._id === c.state) || locationData.states.find(s => s._id === selectedLocation.state);
                    return (
                      <LocationCard
                        key={c._id}
                        title={c.name}
                        subtitle={parentState ? (parentState.code || parentState.name.substring(0, 2).toUpperCase()) : 'CL'}
                        isSelected={selectedLocation.cluster === c._id}
                        onClick={() => setSelectedLocation(prev => ({ ...prev, cluster: c._id, district: '' }))}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Districts */}
            {selectedLocation.cluster && (
              <div>
                <h2 className="text-xl font-bold text-[#333] mb-6">Select District</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <LocationCard
                    title="All Districts"
                    subtitle="ALL"
                    isSelected={selectedLocation.district === 'all'}
                    onClick={() => setSelectedLocation(prev => ({ ...prev, district: 'all' }))}
                  />
                  {locationData.districts.map(d => {
                    const parentCluster = locationData.clusters.find(c => c._id === selectedLocation.cluster);
                    return (
                      <LocationCard
                        key={d._id}
                        title={d.name}
                        subtitle={parentCluster ? parentCluster.name : 'DIST'}
                        isSelected={selectedLocation.district === d._id}
                        onClick={() => setSelectedLocation(prev => ({ ...prev, district: d._id }))}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Supplier Type Table */}
        {selectedLocation.district && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-max">
                <thead className="bg-[#2a3642] text-white">
                  <tr>
                    <th className="p-3 text-sm font-semibold border-r border-[#3a4752] whitespace-nowrap">Type Of Login</th>
                    <th className="p-3 text-sm font-semibold border-r border-[#3a4752] whitespace-nowrap">Category</th>
                    <th className="p-3 text-sm font-semibold border-r border-[#3a4752] whitespace-nowrap">Sub Category</th>
                    <th className="p-3 text-sm font-semibold border-r border-[#3a4752] whitespace-nowrap">Project Type</th>
                    <th className="p-3 text-sm font-semibold border-r border-[#3a4752] whitespace-nowrap">Sub Type</th>
                    <th className="p-3 text-sm font-semibold border-r border-[#3a4752] whitespace-nowrap">Modules Tasks</th>
                    <th className="p-3 text-sm font-semibold border-r border-[#3a4752] whitespace-nowrap">Assign Modules</th>
                    <th className="p-3 text-sm font-semibold border-r border-[#3a4752] whitespace-nowrap">Type OF Login</th>
                    <th className="p-3 text-sm font-semibold border-r border-[#3a4752] whitespace-nowrap">Order TAT setting</th>
                    <th className="p-3 text-sm font-semibold border-r border-[#3a4752] whitespace-nowrap text-center">Set Modules</th>
                    <th className="p-3 text-sm font-semibold text-center whitespace-nowrap">Create</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Create Row */}
                  <tr className="bg-[#f8f9fc] border-b border-gray-200">
                    <td className="p-3 border-r border-gray-200">
                      <input 
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded outline-none focus:border-blue-500"
                        placeholder="Enter Login Type name"
                        value={formData.loginTypeName}
                        onChange={e => setFormData({...formData, loginTypeName: e.target.value})}
                      />
                    </td>
                    <td className="p-3 border-r border-gray-200">
                      <select 
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded outline-none focus:border-blue-500 bg-white"
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value})}
                      >
                        <option value="">Category</option>
                        <option value="Category 1">Category 1</option>
                        <option value="Category 2">Category 2</option>
                      </select>
                    </td>
                    <td className="p-3 border-r border-gray-200">
                      <select 
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded outline-none focus:border-blue-500 bg-white"
                        value={formData.subCategory}
                        onChange={e => setFormData({...formData, subCategory: e.target.value})}
                      >
                        <option value="">Select Sub Category</option>
                        <option value="Sub 1">Sub 1</option>
                        <option value="Sub 2">Sub 2</option>
                      </select>
                    </td>
                    <td className="p-3 border-r border-gray-200">
                      <select 
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded outline-none focus:border-blue-500 bg-white"
                        value={formData.projectType}
                        onChange={e => setFormData({...formData, projectType: e.target.value})}
                      >
                        <option value="">Select Project Type</option>
                        <option value="Project 1">Project 1</option>
                        <option value="Project 2">Project 2</option>
                      </select>
                    </td>
                    <td className="p-3 border-r border-gray-200">
                      <select 
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded outline-none focus:border-blue-500 bg-white"
                        value={formData.subType}
                        onChange={e => setFormData({...formData, subType: e.target.value})}
                      >
                        <option value="">Select Sub Type</option>
                        <option value="Sub Type 1">Sub Type 1</option>
                        <option value="Sub Type 2">Sub Type 2</option>
                      </select>
                    </td>
                    <td className="p-3 border-r border-gray-200 text-center text-gray-500 font-medium">
                      -
                    </td>
                    <td className="p-3 border-r border-gray-200">
                      <select 
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded outline-none focus:border-blue-500 bg-white"
                        value={formData.assignModules}
                        onChange={e => setFormData({...formData, assignModules: e.target.value})}
                      >
                        <option value="">Select Modules For Assigning</option>
                        <option value="Module A">Module A</option>
                        <option value="Module B">Module B</option>
                      </select>
                    </td>
                    <td className="p-3 border-r border-gray-200">
                      <select 
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded outline-none focus:border-blue-500 bg-white"
                        value={formData.loginAccessType}
                        onChange={e => setFormData({...formData, loginAccessType: e.target.value})}
                      >
                        <option value="">Select Type of login</option>
                        <option value="User">User</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </td>
                    <td className="p-3 border-r border-gray-200">
                      <input 
                        className="w-full px-3 py-1.5 text-sm border border-transparent bg-transparent outline-none text-gray-700"
                        value={formData.orderTat}
                        onChange={e => setFormData({...formData, orderTat: e.target.value})}
                      />
                    </td>
                    <td className="p-3 border-r border-gray-200 text-center">
                      <button className="bg-[#00babc] text-white px-4 py-1.5 rounded text-xs font-bold hover:bg-[#009ca0] transition-colors whitespace-nowrap">
                        Set Task
                      </button>
                    </td>
                    <td className="p-3 text-center">
                      <button 
                        onClick={handleCreate}
                        disabled={submitting}
                        className={`bg-[#00babc] text-white px-5 py-1.5 rounded text-xs font-bold hover:bg-[#009ca0] transition-colors whitespace-nowrap ${submitting ? 'opacity-50' : ''}`}
                      >
                       {submitting ? 'Saving' : 'Create'}
                      </button>
                    </td>
                  </tr>

                  {/* Saved Rows */}
                  {loading ? (
                    <tr>
                      <td colSpan="11" className="p-8 text-center"><Loader className="animate-spin mx-auto text-blue-500" /></td>
                    </tr>
                  ) : types.length === 0 ? (
                    <tr>
                      <td colSpan="11" className="p-8 text-center text-gray-500 font-medium tracking-wide">
                        No types assigned to this location yet. Create one above.
                      </td>
                    </tr>
                  ) : (
                    types.map(type => (
                      <tr key={type._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="p-3 border-r border-gray-100 text-sm font-bold text-gray-800">{type.loginTypeName}</td>
                        <td className="p-3 border-r border-gray-100 text-sm text-gray-600">{type.category || '-'}</td>
                        <td className="p-3 border-r border-gray-100 text-sm text-gray-600">{type.subCategory || '-'}</td>
                        <td className="p-3 border-r border-gray-100 text-sm text-gray-600">{type.projectType || '-'}</td>
                        <td className="p-3 border-r border-gray-100 text-sm text-gray-600">{type.subType || '-'}</td>
                        <td className="p-3 border-r border-gray-100 text-center text-sm text-gray-600">-</td>
                        <td className="p-3 border-r border-gray-100 text-sm text-gray-600">{type.assignModules || '-'}</td>
                        <td className="p-3 border-r border-gray-100 text-sm text-gray-600">{type.loginAccessType || '-'}</td>
                        <td className="p-3 border-r border-gray-100 text-sm text-gray-600">{type.orderTat || '-'}</td>
                        <td className="p-3 border-r border-gray-100 text-center">
                          <button className="text-[#00babc] text-xs font-bold hover:underline">Edit Task</button>
                        </td>
                        <td className="p-3 text-center">
                          <button 
                            onClick={() => handleDelete(type._id)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors inline-block"
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
            
            <div className="bg-white border-t border-gray-200 py-4 w-full">
                <p className="text-center text-xs font-semibold text-gray-600 uppercase tracking-widest mt-2">
                    Copyright © 2025 Solarkits. All Rights Reserved.
                </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}