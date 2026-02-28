import React, { useState, useEffect } from 'react';
import {
  PlusCircle, Save, RefreshCw, Cog, List,
  Edit2, Trash2, CheckSquare, X,
  Search, Filter, MoreVertical, ChevronRight,
  AlertCircle, Info, Settings, Eye, Package,
  Loader
} from 'lucide-react';
import {
  createAMCService,
  getAMCServices,
  updateAMCService,
  deleteAMCService
} from '../../../../services/combokit/combokitApi';
import toast from 'react-hot-toast';

const AmcServices = () => {
  // State for form fields
  const [formData, setFormData] = useState({
    serviceName: '',
    serviceDescription: '',
    serviceType: 'regular',
    basePrice: '',
    priceType: 'fixed',
    visitsPerYear: '',
    additionalVisitCharge: '',
    includePowerGuarantee: false,
    guaranteeMinKW: '',
    guaranteeMaxKW: '',
    guaranteePerUnitPrice: '',
    guaranteeDescription: ''
  });

  // Services data
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentEditId, setCurrentEditId] = useState(null);
  const [showPowerGuarantee, setShowPowerGuarantee] = useState(false);
  const [showEditPowerGuarantee, setShowEditPowerGuarantee] = useState(false);

  // State for edit form
  const [editFormData, setEditFormData] = useState({
    serviceName: '',
    serviceDescription: '',
    serviceType: 'regular',
    basePrice: '',
    priceType: 'fixed',
    visitsPerYear: '',
    additionalVisitCharge: '',
    includePowerGuarantee: false,
    guaranteeMinKW: '',
    guaranteeMaxKW: '',
    guaranteePerUnitPrice: '',
    guaranteeDescription: ''
  });

  // Fetch Services
  const fetchServices = async () => {
    try {
      setLoading(true);
      const data = await getAMCServices();
      setServices(data);
    } catch (error) {
      console.error('Error fetching AMC services:', error);
      toast.error('Failed to load AMC services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle edit form input changes
  const handleEditInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Add new service
  const addService = async (e) => {
    e.preventDefault();

    if (!formData.serviceName.trim()) {
      alert('Please enter a service name');
      return;
    }

    const payload = {
      serviceName: formData.serviceName,
      description: formData.serviceDescription,
      serviceType: formData.serviceType,
      basePrice: parseInt(formData.basePrice) || 0,
      priceType: formData.priceType,
      visitsPerYear: parseInt(formData.visitsPerYear) || 0,
      additionalVisitCharge: parseInt(formData.additionalVisitCharge) || 0,
      hasPowerGuarantee: formData.includePowerGuarantee,
      guaranteeMinKW: parseFloat(formData.guaranteeMinKW) || 0,
      guaranteeMaxKW: parseFloat(formData.guaranteeMaxKW) || 0,
      guaranteePerUnitPrice: parseInt(formData.guaranteePerUnitPrice) || 0,
      guaranteeDescription: formData.guaranteeDescription
    };

    try {
      await createAMCService(payload);
      toast.success('Service added successfully!');
      resetForm();
      fetchServices();
    } catch (error) {
      console.error('Error adding service:', error);
      toast.error('Failed to add service');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      serviceName: '',
      serviceDescription: '',
      serviceType: 'regular',
      basePrice: '',
      priceType: 'fixed',
      visitsPerYear: '',
      additionalVisitCharge: '',
      includePowerGuarantee: false,
      guaranteeMinKW: '',
      guaranteeMaxKW: '',
      guaranteePerUnitPrice: '',
      guaranteeDescription: ''
    });
    setShowPowerGuarantee(false);
  };

  // Edit service
  const editService = (id) => {
    const service = services.find(s => s._id === id);
    if (!service) return;

    setCurrentEditId(id);
    setEditFormData({
      serviceName: service.serviceName,
      serviceDescription: service.description || '',
      serviceType: service.serviceType || 'regular',
      basePrice: (service.basePrice || 0).toString(),
      priceType: service.priceType || 'fixed',
      visitsPerYear: (service.visitsPerYear || 0).toString(),
      additionalVisitCharge: (service.additionalVisitCharge || 0).toString(),
      includePowerGuarantee: service.hasPowerGuarantee || false,
      guaranteeMinKW: (service.guaranteeMinKW || 0).toString(),
      guaranteeMaxKW: (service.guaranteeMaxKW || 0).toString(),
      guaranteePerUnitPrice: (service.guaranteePerUnitPrice || 0).toString(),
      guaranteeDescription: service.guaranteeDescription || ''
    });
    setShowEditPowerGuarantee(service.hasPowerGuarantee || false);
    setIsEditModalOpen(true);
  };

  // Update service
  const updateService = async () => {
    if (!currentEditId) return;

    const payload = {
      serviceName: editFormData.serviceName,
      description: editFormData.serviceDescription,
      serviceType: editFormData.serviceType,
      basePrice: parseInt(editFormData.basePrice) || 0,
      priceType: editFormData.priceType,
      visitsPerYear: parseInt(editFormData.visitsPerYear) || 0,
      additionalVisitCharge: parseInt(editFormData.additionalVisitCharge) || 0,
      hasPowerGuarantee: editFormData.includePowerGuarantee,
      guaranteeMinKW: parseFloat(editFormData.guaranteeMinKW) || 0,
      guaranteeMaxKW: parseFloat(editFormData.guaranteeMaxKW) || 0,
      guaranteePerUnitPrice: parseInt(editFormData.guaranteePerUnitPrice) || 0,
      guaranteeDescription: editFormData.guaranteeDescription
    };

    try {
      await updateAMCService(currentEditId, payload);
      toast.success('Service updated successfully!');
      setIsEditModalOpen(false);
      setCurrentEditId(null);
      fetchServices();
    } catch (error) {
      console.error('Error updating service:', error);
      toast.error('Failed to update service');
    }
  };

  // Delete service
  const deleteService = async (id) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        await deleteAMCService(id);
        toast.success('Service deleted successfully!');
        if (id === currentEditId) {
          setIsEditModalOpen(false);
          setCurrentEditId(null);
        }
        fetchServices();
      } catch (error) {
        console.error('Error deleting service:', error);
        toast.error('Failed to delete service');
      }
    }
  };

  // Get price text for display
  const getPriceText = (service) => {
    switch (service.priceType) {
      case 'per_visit':
        return `₹${service.basePrice || 0}/visit`;
      case 'monthly':
        return `₹${service.basePrice || 0}/month`;
      case 'yearly':
        return `₹${service.basePrice || 0}/year`;
      default:
        return `₹${service.basePrice || 0} (fixed)`;
    }
  };

  // Scroll to form
  const scrollToForm = () => {
    const formElement = document.getElementById('serviceForm');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
      document.getElementById('serviceNameInput').focus();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      {/* Premium Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 mb-6">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100 shadow-sm">
                <Cog className="text-blue-600" size={22} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800 tracking-tight">AMC Services Management</h1>
                <p className="text-[11px] text-slate-500 font-medium font-inter">Add and manage AMC services, visits, and power generation guarantee</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchServices}
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                title="Refresh Data"
              >
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              </button>
              <div className="h-6 w-[1px] bg-slate-200 mx-1"></div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">System Operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6">
        <div className="row">
          {/* Left Column: Add New Service Form */}
          <div className="col-lg-7 mb-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-blue-600 px-6 py-4 flex items-center justify-between">
                <h5 className="text-white text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <PlusCircle size={18} />
                  Add New AMC Service
                </h5>
                <span className="text-[10px] font-bold text-blue-100 uppercase tracking-tighter bg-blue-700/50 px-2 py-1 rounded">Primary Setup</span>
              </div>
              <div className="p-8">
                <form id="serviceForm" onSubmit={addService}>
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div className="col-span-2">
                      <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2 ml-1">Service Identity</label>
                      <input
                        type="text"
                        id="serviceNameInput"
                        name="serviceName"
                        value={formData.serviceName}
                        onChange={handleInputChange}
                        placeholder="Enter service name (e.g., Cleaning, Maintenance)"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                        required
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2 ml-1">Service Description</label>
                      <textarea
                        name="serviceDescription"
                        value={formData.serviceDescription}
                        onChange={handleInputChange}
                        rows="3"
                        placeholder="Define the scope of this AMC service..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2 ml-1">Service Classification</label>
                      <select
                        name="serviceType"
                        value={formData.serviceType}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                      >
                        <option value="regular">Regular Service</option>
                        <option value="preventive">Preventive Maintenance</option>
                        <option value="emergency">Emergency Service</option>
                        <option value="special">Special Service</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2 ml-1">Base Price (₹)</label>
                        <input
                          type="number"
                          name="basePrice"
                          value={formData.basePrice}
                          onChange={handleInputChange}
                          placeholder="0"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2 ml-1">Price Model</label>
                        <select
                          name="priceType"
                          value={formData.priceType}
                          onChange={handleInputChange}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                        >
                          <option value="fixed">Fixed</option>
                          <option value="per_visit">Per Visit</option>
                          <option value="monthly">Monthly</option>
                          <option value="yearly">Yearly</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2 ml-1">Standard Visits</label>
                      <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-1">
                        <input
                          type="range"
                          name="visitsPerYear"
                          min="0"
                          max="12"
                          value={formData.visitsPerYear || 0}
                          onChange={handleInputChange}
                          className="flex-1 accent-blue-600"
                        />
                        <span className="w-8 h-8 bg-white border border-slate-100 rounded-lg flex items-center justify-center text-xs font-black text-blue-600 shadow-sm">{formData.visitsPerYear || 0}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2 ml-1">Extra Visit Charge (₹)</label>
                      <input
                        type="number"
                        name="additionalVisitCharge"
                        value={formData.additionalVisitCharge}
                        onChange={handleInputChange}
                        placeholder="0"
                        className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black text-slate-800 transition-all"
                      />
                    </div>
                  </div>

                  {/* Power Generation Guarantee Section */}
                  <div className={`mb-8 rounded-2xl border transition-all duration-500 ${formData.includePowerGuarantee ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-100 bg-slate-50/50'}`}>
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${formData.includePowerGuarantee ? 'bg-emerald-500 text-white shadow-emerald-200 shadow-lg' : 'bg-slate-200 text-slate-500'}`}>
                          <CheckSquare size={16} />
                        </div>
                        <div>
                          <h6 className="text-[11px] font-black text-slate-800 uppercase tracking-wider">Power Generation Guarantee</h6>
                          <p className="text-[10px] text-slate-500 font-medium">Include performance security for large systems</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="includePowerGuarantee"
                          checked={formData.includePowerGuarantee}
                          onChange={(e) => {
                            handleInputChange(e);
                            setShowPowerGuarantee(e.target.checked);
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>

                    {showPowerGuarantee && (
                      <div className="p-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-black text-emerald-700 uppercase mb-1.5 ml-1">System Limit (Min kW)</label>
                            <input
                              type="number"
                              name="guaranteeMinKW"
                              value={formData.guaranteeMinKW}
                              onChange={handleInputChange}
                              placeholder="0"
                              step="0.1"
                              className="w-full bg-white border border-emerald-100 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500 transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-emerald-700 uppercase mb-1.5 ml-1">System Limit (Max kW)</label>
                            <input
                              type="number"
                              name="guaranteeMaxKW"
                              value={formData.guaranteeMaxKW}
                              onChange={handleInputChange}
                              placeholder="0"
                              step="0.1"
                              className="w-full bg-white border border-emerald-100 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500 transition-all"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-emerald-700 uppercase mb-1.5 ml-1">Guarantee Price (₹ / kW)</label>
                          <input
                            type="number"
                            name="guaranteePerUnitPrice"
                            value={formData.guaranteePerUnitPrice}
                            onChange={handleInputChange}
                            placeholder="0"
                            className="w-full bg-white border border-emerald-100 rounded-xl px-4 py-2.5 text-sm font-black text-slate-800 focus:outline-none focus:border-emerald-500 transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-emerald-700 uppercase mb-1.5 ml-1">Guarantee Policy Details</label>
                          <textarea
                            name="guaranteeDescription"
                            value={formData.guaranteeDescription}
                            onChange={handleInputChange}
                            rows="2"
                            placeholder="Describe the generation security terms..."
                            className="w-full bg-white border border-emerald-100 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-600 focus:outline-none focus:border-emerald-500 transition-all resize-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="flex items-center gap-2 px-6 py-3 text-[11px] font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest"
                    >
                      <RefreshCw size={14} />
                      Reset Fields
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white text-[11px] font-black rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 uppercase tracking-widest"
                    >
                      <Save size={16} />
                      Generate Service
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Right Column: Services Summary */}
          <div className="col-lg-5 mb-4" >
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
              <div className="bg-emerald-600 px-6 py-4 flex items-center justify-between">
                <h5 className="text-white text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <List size={18} />
                  AMC Services Summary
                </h5>
                <span className="text-[10px] font-black text-emerald-100 uppercase tracking-tighter bg-emerald-700 px-3 py-1 rounded-full">
                  {services.length} Active
                </span>
              </div>

              <div className="p-6 flex-1 overflow-y-auto no-scrollbar max-h-[700px]">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Loader className="animate-spin text-emerald-500 mb-4" size={40} />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hydrating Summary...</p>
                  </div>
                ) : services.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100">
                      <Package className="text-slate-300" size={32} />
                    </div>
                    <h5 className="text-sm font-black text-slate-400 uppercase tracking-wider">Inventory Empty</h5>
                    <p className="text-xs text-slate-400 mt-1 max-w-[200px]">No AMC services have been defined in the system yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {services.map((service) => (
                      <div key={service._id} className="group bg-white border border-slate-100 rounded-2xl p-5 hover:border-emerald-200 hover:shadow-md hover:shadow-emerald-50/50 transition-all duration-300 relative">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h6 className="text-sm font-black text-slate-800 tracking-tight">{service.serviceName}</h6>
                              {service.hasPowerGuarantee && (
                                <span className="bg-emerald-100 text-emerald-700 text-[8px] font-black uppercase px-2 py-0.5 rounded tracking-tighter border border-emerald-200">Power Guard</span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-2">
                              {service.description || 'Standard solar maintenance protocol.'}
                            </p>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => editService(service._id)}
                              className="w-7 h-7 bg-white border border-slate-100 rounded-lg flex items-center justify-center text-amber-500 hover:bg-amber-50 hover:border-amber-100 transition-all shadow-sm"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => deleteService(service._id)}
                              className="w-7 h-7 bg-white border border-slate-100 rounded-lg flex items-center justify-center text-rose-500 hover:bg-rose-50 hover:border-rose-100 transition-all shadow-sm"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className="bg-slate-100 text-slate-500 text-[9px] font-black uppercase px-2 py-1 rounded-md border border-slate-200">
                            {service.serviceType}
                          </span>
                          <span className="bg-blue-50 text-blue-600 text-[9px] font-black uppercase px-2 py-1 rounded-md border border-blue-100">
                            {service.visitsPerYear} visits / year
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                          <div className="flex items-baseline gap-1">
                            <span className="text-base font-black text-slate-900 tracking-tighter">₹{service.basePrice?.toLocaleString()}</span>
                            <span className="text-[10px] font-bold text-slate-400 border-l border-slate-200 pl-2 uppercase">{service.priceType}</span>
                          </div>
                          {service.additionalVisitCharge > 0 && (
                            <div className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded border border-dotted border-slate-200">
                              +₹{service.additionalVisitCharge} extra
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Services Table */}
        <div className="mt-8" >
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-800 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center">
                  <Settings className="text-slate-300" size={18} />
                </div>
                <h5 className="text-white text-sm font-black uppercase tracking-widest">System Master Registry</h5>
              </div>
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-[10px] font-black rounded-lg hover:bg-blue-700 transition-all uppercase tracking-widest shadow-lg shadow-blue-900/20"
                onClick={scrollToForm}
              >
                <PlusCircle size={14} />
                Register New Service
              </button>
            </div>
            <div className="p-0">
              <div className="table-responsive">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID Reference</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Service Identification</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset Type</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Premium Structure</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Protocol Visits</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Security Coverage</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">System Control</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {services.map((service, index) => (
                      <tr key={service._id} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-black text-slate-300 font-mono">#{index + 1}</span>
                        </td>
                        <td className="px-6 py-4">
                          <h6 className="text-xs font-black text-slate-800 uppercase tracking-tight">{service.serviceName}</h6>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5 max-w-[200px] truncate">{service.description || 'Global Service Protocol'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-black rounded uppercase border border-slate-200">
                            {service.serviceType}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-800">₹{service.basePrice?.toLocaleString()}</span>
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{service.priceType} Billing</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-50 text-blue-600 rounded-lg text-xs font-black border border-blue-100 shadow-sm">
                            {service.visitsPerYear}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {service.hasPowerGuarantee ? (
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-emerald-600 uppercase">Active Coverage</span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{service.guaranteeMinKW}-{service.guaranteeMaxKW} kW Registry</span>
                            </div>
                          ) : (
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Standard Pack</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-amber-500 hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all shadow-sm"
                              onClick={() => editService(service._id)}
                              title="Edit Registry"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-rose-500 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all shadow-sm"
                              onClick={() => deleteService(service._id)}
                              title="Revoke Service"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Edit Service Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-amber-500 px-8 py-5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center shadow-lg shadow-amber-600/20">
                  <Edit2 className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="text-white text-lg font-black uppercase tracking-tight">Modify Registry</h3>
                  <p className="text-amber-100 text-[10px] font-bold uppercase tracking-widest">Service Item Refinement</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-amber-600/30 text-white hover:bg-amber-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8">
              <form id="editForm">
                <input type="hidden" id="editServiceId" value={currentEditId || ''} />

                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2 ml-1">Service Identity</label>
                    <input
                      type="text"
                      name="serviceName"
                      value={editFormData.serviceName}
                      onChange={handleEditInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-amber-500 transition-all"
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2 ml-1">Service Scope Definition</label>
                    <textarea
                      name="serviceDescription"
                      value={editFormData.serviceDescription}
                      onChange={handleEditInputChange}
                      rows="2"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 focus:outline-none focus:border-amber-500 transition-all resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2 ml-1">Service Classification</label>
                    <select
                      name="serviceType"
                      value={editFormData.serviceType}
                      onChange={handleEditInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-amber-500 transition-all cursor-pointer"
                    >
                      <option value="regular">Regular Service</option>
                      <option value="preventive">Preventive Maintenance</option>
                      <option value="emergency">Emergency Service</option>
                      <option value="special">Special Service</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2 ml-1">Base Price (₹)</label>
                      <input
                        type="number"
                        name="basePrice"
                        value={editFormData.basePrice}
                        onChange={handleEditInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black text-slate-800 focus:outline-none focus:border-amber-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2 ml-1">Price Model</label>
                      <select
                        name="priceType"
                        value={editFormData.priceType}
                        onChange={handleEditInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-amber-500 transition-all cursor-pointer"
                      >
                        <option value="fixed">Fixed</option>
                        <option value="per_visit">Per Visit</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2 ml-1">Standard Visits</label>
                    <input
                      type="number"
                      name="visitsPerYear"
                      value={editFormData.visitsPerYear}
                      onChange={handleEditInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black text-slate-800 focus:outline-none focus:border-amber-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-2 ml-1">Extra Visit Premium (₹)</label>
                    <input
                      type="number"
                      name="additionalVisitCharge"
                      value={editFormData.additionalVisitCharge}
                      onChange={handleEditInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black text-slate-800 focus:outline-none focus:border-amber-500 transition-all"
                    />
                  </div>
                </div>

                {/* Edit Power Generation Guarantee Section */}
                <div className={`mb-8 rounded-2xl border transition-all duration-500 ${editFormData.includePowerGuarantee ? 'border-amber-200 bg-amber-50/30' : 'border-slate-100 bg-slate-50/50'}`}>
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${editFormData.includePowerGuarantee ? 'bg-amber-500 text-white shadow-amber-200 shadow-lg' : 'bg-slate-200 text-slate-500'}`}>
                        <CheckSquare size={16} />
                      </div>
                      <h6 className="text-[11px] font-black text-slate-800 uppercase tracking-wider">Power Generation Security</h6>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="includePowerGuarantee"
                        checked={editFormData.includePowerGuarantee}
                        onChange={(e) => {
                          handleEditInputChange(e);
                          setShowEditPowerGuarantee(e.target.checked);
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  {showEditPowerGuarantee && (
                    <div className="p-6 grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                      <div>
                        <label className="block text-[10px] font-black text-amber-700 uppercase mb-1.5 ml-1">Min kW</label>
                        <input
                          type="number"
                          name="guaranteeMinKW"
                          value={editFormData.guaranteeMinKW}
                          onChange={handleEditInputChange}
                          step="0.1"
                          className="w-full bg-white border border-amber-100 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-amber-700 uppercase mb-1.5 ml-1">Max kW</label>
                        <input
                          type="number"
                          name="guaranteeMaxKW"
                          value={editFormData.guaranteeMaxKW}
                          onChange={handleEditInputChange}
                          step="0.1"
                          className="w-full bg-white border border-amber-100 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-6 py-3 text-[11px] font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={updateService}
                    className="px-8 py-3 bg-amber-500 text-white text-[11px] font-black rounded-xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-100 uppercase tracking-widest"
                  >
                    Update Registry
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AmcServices;