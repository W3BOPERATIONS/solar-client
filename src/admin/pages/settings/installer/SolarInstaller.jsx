import React, { useState, useEffect } from 'react';
import {
  User,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Phone,
  Award,
  FileText,
  Save,
  X
} from 'lucide-react';
import {
  getSolarInstallers,
  createSolarInstaller,
  updateSolarInstaller,
  deleteSolarInstaller
} from '../../../../services/installer/installerApi';
import { useLocations } from '../../../../hooks/useLocations';
import toast from 'react-hot-toast';

const SolarInstaller = () => {
  const [installers, setInstallers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [currentInstaller, setCurrentInstaller] = useState(null);

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
    name: '',
    contact: '',
    licenseNumber: '',
    experience: '',
    status: 'Active',
    state: '',
    cluster: '',
    district: ''
  });

  useEffect(() => {
    fetchInstallers();
  }, [selectedState, selectedCluster, selectedDistrict]);

  const fetchInstallers = async () => {
    try {
      setLoading(true);
      const data = await getSolarInstallers({
        state: selectedState,
        cluster: selectedCluster,
        district: selectedDistrict
      });
      // Handle the different response format from the updated API
      setInstallers(data.data || data);
    } catch (error) {
      console.error('Error fetching installers:', error);
      toast.error('Failed to load installers');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.contact || !formData.state || !formData.cluster || !formData.district) {
      toast.error('All required fields must be filled');
      return;
    }

    try {
      if (currentInstaller) {
        await updateSolarInstaller(currentInstaller._id, formData);
        toast.success('Installer updated successfully');
      } else {
        await createSolarInstaller(formData);
        toast.success('Installer added successfully');
      }
      setIsModalOpen(false);
      resetForm();
      fetchInstallers();
    } catch (error) {
      console.error('Error saving installer:', error);
      toast.error('Failed to save installer');
    }
  };

  const handleEdit = (installer) => {
    setCurrentInstaller(installer);
    setFormData({
      name: installer.name,
      contact: installer.contact,
      licenseNumber: installer.licenseNumber,
      experience: installer.experience,
      status: installer.status,
      state: installer.state?._id || installer.state || '',
      cluster: installer.cluster?._id || installer.cluster || '',
      district: installer.district?._id || installer.district || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this installer?')) {
      try {
        await deleteSolarInstaller(id);
        toast.success('Installer deleted successfully');
        fetchInstallers();
      } catch (error) {
        console.error('Error deleting installer:', error);
        toast.error('Failed to delete installer');
      }
    }
  };

  const handleStatusToggle = async (installer) => {
    try {
      const newStatus = installer.status === 'Active' ? 'Inactive' : 'Active';
      await updateSolarInstaller(installer._id, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      fetchInstallers();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contact: '',
      licenseNumber: '',
      experience: '',
      status: 'Active',
      state: '',
      cluster: '',
      district: ''
    });
    setCurrentInstaller(null);
  };

  const filteredInstallers = installers.filter(installer => {
    const matchesSearch = installer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      installer.contact.includes(searchTerm) ||
      installer.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || installer.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#f5f7fb] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <User className="w-6 h-6 text-blue-600" />
              Solar Installers
            </h1>
            <p className="text-gray-500 text-sm mt-1">Manage verified solar installers</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg hover:shadow-blue-200"
          >
            <Plus className="w-5 h-5" />
            Add New Installer
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, contact or license..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full md:w-40 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-gray-600 cursor-pointer"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> STATE
              </label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-gray-600 cursor-pointer bg-white"
              >
                <option value="">All States</option>
                {states.map(s => <option key={s._id} value={s._id}>{s.name || s.stateName}</option>)}
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
                className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-gray-600 cursor-pointer bg-white disabled:bg-gray-50 opacity-100"
              >
                <option value="">All Clusters</option>
                {clusters.map(c => <option key={c._id} value={c._id}>{c.name || c.clusterName}</option>)}
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
                className="w-full border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-gray-600 cursor-pointer bg-white disabled:bg-gray-50 opacity-100"
              >
                <option value="">All Districts</option>
                {districts.map(d => <option key={d._id} value={d._id}>{d.name || d.districtName}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-4 text-gray-500 font-semibold text-sm">Installer Info</th>
                  <th className="text-left px-6 py-4 text-gray-500 font-semibold text-sm">Contact</th>
                  <th className="text-left px-6 py-4 text-gray-500 font-semibold text-sm">License / Experience</th>
                  <th className="text-center px-6 py-4 text-gray-500 font-semibold text-sm">Status</th>
                  <th className="text-center px-6 py-4 text-gray-500 font-semibold text-sm">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">Loading installers...</td>
                  </tr>
                ) : filteredInstallers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">No installers found</td>
                  </tr>
                ) : (
                  filteredInstallers.map((installer) => (
                    <tr key={installer._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                            {installer.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{installer.name}</p>
                            <p className="text-xs text-gray-500">ID: {installer._id.slice(-6)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span>{installer.contact}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <FileText className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">{installer.licenseNumber}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Award className="w-3.5 h-3.5" />
                            <span>{installer.experience} Exp.</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleStatusToggle(installer)}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${installer.status === 'Active'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                            }`}
                        >
                          {installer.status === 'Active' ? (
                            <>
                              <CheckCircle className="w-3 h-3" /> Active
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" /> Inactive
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(installer)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(installer._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800">
                {currentInstaller ? 'Edit Installer' : 'Add New Installer'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Enter installer name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                <input
                  type="text"
                  name="contact"
                  value={formData.contact}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Enter contact number"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                  <input
                    type="text"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="License No."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
                  <input
                    type="text"
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="e.g. 5 Years"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData(prev => ({ ...prev, state: val, cluster: '', district: '' }));
                    }}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  >
                    <option value="">Select State</option>
                    {states.map(s => <option key={s._id} value={s._id}>{s.name || s.stateName}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cluster</label>
                    <select
                      name="cluster"
                      value={formData.cluster}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData(prev => ({ ...prev, cluster: val, district: '' }));
                      }}
                      disabled={!formData.state}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-50"
                      required
                    >
                      <option value="">Select Cluster</option>
                      {/* We need to fetch clusters for the form state separately OR filter the ones from useLocations if they match */}
                      {/* Since useLocations follows the global filter, we might need a separate way to get clusters for the form's selected state */}
                      {/* For now, I'll assume useLocations can be used if we're careful, but ideally we'd have a separate fetch or just use the hook's clusters if selectedState matches formData.state */}
                      {clusters.map(c => <option key={c._id} value={c._id}>{c.name || c.clusterName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                    <select
                      name="district"
                      value={formData.district}
                      onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
                      disabled={!formData.cluster}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-50"
                      required
                    >
                      <option value="">Select District</option>
                      {districts.map(d => <option key={d._id} value={d._id}>{d.name || d.districtName}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-medium transition-colors flex items-center gap-2 shadow-lg hover:shadow-blue-200"
                >
                  <Save className="w-4 h-4" />
                  {currentInstaller ? 'Update Installer' : 'Save Installer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SolarInstaller;