import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Wrench, Save, X, MapPin, Layers } from 'lucide-react';
import {
  getInstallerTools,
  createInstallerTool,
  updateInstallerTool,
  deleteInstallerTool
} from '../../../../services/installer/installerApi';
import { getClustersHierarchy, getDistrictsHierarchy } from '../../../../services/locationApi';
import { useLocations } from '../../../../hooks/useLocations';
import toast from 'react-hot-toast';

export default function ToolRequirements() {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentToolId, setCurrentToolId] = useState(null);

  const {
    states,
    clusters,
    districts,
    selectedState,
    setSelectedState,
    selectedCluster,
    setSelectedCluster,
    selectedDistrict,
    setSelectedDistrict,
    loading: locationsLoading
  } = useLocations();

  const [formData, setFormData] = useState({
    toolName: '',
    description: '',
    state: '',
    cluster: '',
    district: '',
    status: 'Active'
  });

  const [formClusters, setFormClusters] = useState([]);
  const [formDistricts, setFormDistricts] = useState([]);

  useEffect(() => {
    fetchTools();
  }, [selectedState, selectedCluster, selectedDistrict]);

  const fetchTools = async () => {
    try {
      setLoading(true);
      const params = {
        state: selectedState,
        cluster: selectedCluster,
        district: selectedDistrict
      };
      const data = await getInstallerTools(params);
      setTools(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error('Error fetching tools:', error);
      toast.error('Failed to load tools');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFormStateChange = async (e) => {
    const newStateId = e.target.value;
    setFormData(prev => ({ ...prev, state: newStateId, cluster: '', district: '' }));
    setFormClusters([]);
    setFormDistricts([]);

    if (newStateId) {
      try {
        const data = await getClustersHierarchy(newStateId);
        setFormClusters(data || []);
      } catch (error) {
        console.error('Error fetching clusters:', error);
        toast.error('Failed to load clusters');
      }
    }
  };

  const handleFormClusterChange = async (e) => {
    const newClusterId = e.target.value;
    setFormData(prev => ({ ...prev, cluster: newClusterId, district: '' }));
    setFormDistricts([]);

    if (newClusterId) {
      try {
        const data = await getDistrictsHierarchy(newClusterId);
        setFormDistricts(data || []);
      } catch (error) {
        console.error('Error fetching districts:', error);
        toast.error('Failed to load districts');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.toolName.trim() || !formData.state || !formData.cluster || !formData.district) {
      toast.error('Tool Name and Location (S/C/D) are required');
      return;
    }

    try {
      if (isEditing && currentToolId) {
        await updateInstallerTool(currentToolId, formData);
        toast.success('Tool updated successfully');
      } else {
        await createInstallerTool(formData);
        toast.success('Tool added successfully');
      }
      resetForm();
      fetchTools();
    } catch (error) {
      console.error('Error saving tool:', error);
      toast.error('Failed to save tool');
    }
  };

  const handleEdit = async (tool) => {
    setFormData({
      toolName: tool.toolName,
      description: tool.description || '',
      state: tool.state?._id || tool.state || '',
      cluster: tool.cluster?._id || tool.cluster || '',
      district: tool.district?._id || tool.district || '',
      status: tool.status
    });
    setCurrentToolId(tool._id);
    setIsEditing(true);

    // Fetch dependent data
    try {
      const stateId = tool.state?._id || tool.state;
      if (stateId) {
        const clustersData = await getClustersHierarchy(stateId);
        setFormClusters(clustersData || []);

        const clusterId = tool.cluster?._id || tool.cluster;
        if (clusterId) {
          const districtsData = await getDistrictsHierarchy(clusterId);
          setFormDistricts(districtsData || []);
        }
      }
    } catch (error) {
      console.error('Error fetching dependent location data:', error);
      toast.error('Failed to load location data for editing');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this tool?')) {
      try {
        await deleteInstallerTool(id);
        toast.success('Tool deleted successfully');
        fetchTools();
      } catch (error) {
        console.error('Error deleting tool:', error);
        toast.error('Failed to delete tool');
      }
    }
  };

  const resetForm = () => {
    setFormData({ toolName: '', description: '', state: '', cluster: '', district: '', status: 'Active' });
    setFormClusters([]);
    setFormDistricts([]);
    setIsEditing(false);
    setCurrentToolId(null);
  };

  return (
    <div className="p-6 bg-[#f5f7fb] min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header & Filters */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
                <Wrench className="w-6 h-6 text-blue-600" />
                Installer Tool Requirements
              </h2>
              <p className="text-gray-500 text-sm mt-1">Manage mandatory tools for installers</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-3 rounded-xl">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> STATE
              </label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-gray-600 cursor-pointer bg-white text-sm"
              >
                <option value="">All States</option>
                {states.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                <Layers className="w-3 h-3" /> CLUSTER
              </label>
              <select
                value={selectedCluster}
                onChange={(e) => setSelectedCluster(e.target.value)}
                disabled={!selectedState}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-gray-600 cursor-pointer bg-white disabled:bg-gray-100 text-sm"
              >
                <option value="">All Clusters</option>
                {clusters.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> DISTRICT
              </label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                disabled={!selectedCluster}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-gray-600 cursor-pointer bg-white disabled:bg-gray-100 text-sm"
              >
                <option value="">All Districts</option>
                {districts.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                {isEditing ? <Edit2 className="w-5 h-5 text-blue-500" /> : <Plus className="w-5 h-5 text-green-500" />}
                {isEditing ? 'Edit Tool' : 'Add New Tool'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tool Name</label>
                  <input
                    type="text"
                    name="toolName"
                    value={formData.toolName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="e.g. Drilling Machine"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleFormStateChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    required
                  >
                    <option value="">Select State</option>
                    {states.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cluster</label>
                    <select
                      name="cluster"
                      value={formData.cluster}
                      onChange={handleFormClusterChange}
                      disabled={!formData.state}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:bg-gray-50 text-sm"
                      required
                    >
                      <option value="">Select Cluster</option>
                      {formClusters.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                    <select
                      name="district"
                      value={formData.district}
                      onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
                      disabled={!formData.cluster}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:bg-gray-50 text-sm"
                      required
                    >
                      <option value="">Select District</option>
                      {formDistricts.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                    placeholder="Optional tool details..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  {isEditing && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="flex-1 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" /> Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className={`flex-1 px-4 py-2 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg ${isEditing
                      ? 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-200'
                      : 'bg-green-600 hover:bg-green-700 hover:shadow-green-200'
                      }`}
                  >
                    <Save className="w-4 h-4" />
                    {isEditing ? 'Update Tool' : 'Add Tool'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* List Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tool Name</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Location (S/C/D)</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500">Loading tools...</td>
                      </tr>
                    ) : tools.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                          <div className="flex flex-col items-center justify-center">
                            <Wrench className="w-12 h-12 text-gray-300 mb-2" />
                            <p>No tools added yet.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      tools.map((tool) => (
                        <tr
                          key={tool._id}
                          className={`hover:bg-gray-50 transition-colors ${currentToolId === tool._id ? 'bg-blue-50' : ''}`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-800">{tool.toolName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            <div className="font-semibold">{tool.state?.name || '---'}</div>
                            <div className="text-xs">{tool.cluster?.name || '---'} / {tool.district?.name || '---'}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{tool.description || '-'}</td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${tool.status === 'Active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                                }`}
                            >
                              {tool.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => handleEdit(tool)}
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(tool._id)}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}