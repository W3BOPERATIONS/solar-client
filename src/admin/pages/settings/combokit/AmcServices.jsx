import React, { useState, useEffect } from 'react';
import {
  PlusCircle, Save, RefreshCw, Cog, List,
  Edit2, Trash2, CheckSquare, XSquare,
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
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              <h4 className="mb-2 flex items-center text-gray-800">
                <Cog className="mr-2 text-primary" size={24} />
                AMC Services Management
              </h4>
              <p className="text-muted mb-0">
                Add and manage AMC services, visits, and power generation guarantee
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Left Column: Add New Service Form */}
        <div className="col-lg-6 mb-4">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0 flex items-center">
                <PlusCircle className="mr-2" size={20} />
                Add New AMC Service
              </h5>
            </div>
            <div className="card-body">
              <form id="serviceForm" onSubmit={addService}>
                <div className="form-group mb-4">
                  <label htmlFor="serviceName" className="font-semibold">
                    Service Name
                  </label>
                  <input
                    type="text"
                    className="form-control mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    id="serviceNameInput"
                    name="serviceName"
                    value={formData.serviceName}
                    onChange={handleInputChange}
                    placeholder="Enter service name (e.g., Cleaning, Maintenance)"
                    required
                  />
                </div>

                <div className="form-group mb-4">
                  <label htmlFor="serviceDescription" className="font-semibold">
                    Service Description
                  </label>
                  <textarea
                    className="form-control mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    id="serviceDescription"
                    name="serviceDescription"
                    value={formData.serviceDescription}
                    onChange={handleInputChange}
                    rows="2"
                    placeholder="Enter service description"
                  />
                </div>

                <div className="form-group mb-4">
                  <label htmlFor="serviceType" className="font-semibold">
                    Service Type
                  </label>
                  <select
                    className="form-control mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    id="serviceType"
                    name="serviceType"
                    value={formData.serviceType}
                    onChange={handleInputChange}
                  >
                    <option value="regular">Regular Service</option>
                    <option value="preventive">Preventive Maintenance</option>
                    <option value="emergency">Emergency Service</option>
                    <option value="special">Special Service</option>
                  </select>
                </div>

                <div className="row mb-4">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="basePrice" className="font-semibold">
                        Base Price (₹)
                      </label>
                      <input
                        type="number"
                        className="form-control mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        id="basePrice"
                        name="basePrice"
                        value={formData.basePrice}
                        onChange={handleInputChange}
                        placeholder="0"
                        min="0"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="priceType" className="font-semibold">
                        Price Type
                      </label>
                      <select
                        className="form-control mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        id="priceType"
                        name="priceType"
                        value={formData.priceType}
                        onChange={handleInputChange}
                      >
                        <option value="fixed">Fixed</option>
                        <option value="per_visit">Per Visit</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="row mb-4">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="visitsPerYear" className="font-semibold">
                        Visits Per Year
                      </label>
                      <input
                        type="number"
                        className="form-control mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        id="visitsPerYear"
                        name="visitsPerYear"
                        value={formData.visitsPerYear}
                        onChange={handleInputChange}
                        placeholder="0"
                        min="0"
                        max="12"
                      />
                      <small className="form-text text-muted">
                        Number of visits included in service
                      </small>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="additionalVisitCharge" className="font-semibold">
                        Additional Visit Charge (₹)
                      </label>
                      <input
                        type="number"
                        className="form-control mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        id="additionalVisitCharge"
                        name="additionalVisitCharge"
                        value={formData.additionalVisitCharge}
                        onChange={handleInputChange}
                        placeholder="0"
                        min="0"
                      />
                      <small className="form-text text-muted">
                        Charge for extra visits
                      </small>
                    </div>
                  </div>
                </div>

                {/* Power Generation Guarantee Section */}
                <div className="card mb-4 border border-gray-200">
                  <div className="card-header bg-gray-100">
                    <h6 className="mb-0 font-semibold">
                      Power Generation Guarantee (Optional)
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="form-group mb-3">
                      <div className="form-check">
                        <input
                          className="form-check-input h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                          type="checkbox"
                          id="includePowerGuarantee"
                          name="includePowerGuarantee"
                          checked={formData.includePowerGuarantee}
                          onChange={(e) => {
                            handleInputChange(e);
                            setShowPowerGuarantee(e.target.checked);
                          }}
                        />
                        <label className="form-check-label ml-2" htmlFor="includePowerGuarantee">
                          Include Power Generation Guarantee
                        </label>
                      </div>
                    </div>

                    {showPowerGuarantee && (
                      <div id="powerGuaranteeFields">
                        <div className="row mb-3">
                          <div className="col-md-6">
                            <div className="form-group">
                              <label htmlFor="guaranteeMinKW" className="font-semibold">
                                Minimum kW
                              </label>
                              <input
                                type="number"
                                className="form-control mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                id="guaranteeMinKW"
                                name="guaranteeMinKW"
                                value={formData.guaranteeMinKW}
                                onChange={handleInputChange}
                                placeholder="0"
                                min="0"
                                step="0.1"
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-group">
                              <label htmlFor="guaranteeMaxKW" className="font-semibold">
                                Maximum kW
                              </label>
                              <input
                                type="number"
                                className="form-control mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                id="guaranteeMaxKW"
                                name="guaranteeMaxKW"
                                value={formData.guaranteeMaxKW}
                                onChange={handleInputChange}
                                placeholder="0"
                                min="0"
                                step="0.1"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="form-group mb-3">
                          <label htmlFor="guaranteePerUnitPrice" className="font-semibold">
                            Per Unit kW Price (₹)
                          </label>
                          <input
                            type="number"
                            className="form-control mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                            id="guaranteePerUnitPrice"
                            name="guaranteePerUnitPrice"
                            value={formData.guaranteePerUnitPrice}
                            onChange={handleInputChange}
                            placeholder="0"
                            min="0"
                          />
                          <small className="form-text text-muted">
                            Price per kW for power generation guarantee
                          </small>
                        </div>

                        <div className="form-group">
                          <label htmlFor="guaranteeDescription" className="font-semibold">
                            Guarantee Description
                          </label>
                          <textarea
                            className="form-control mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                            id="guaranteeDescription"
                            name="guaranteeDescription"
                            value={formData.guaranteeDescription}
                            onChange={handleInputChange}
                            rows="2"
                            placeholder="Describe the power generation guarantee terms"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="d-flex justify-content-between">
                  <button
                    type="button"
                    className="btn btn-secondary flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    onClick={resetForm}
                  >
                    <RefreshCw className="mr-1" size={16} />
                    Reset
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    <Save className="mr-1" size={16} />
                    Add Service
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Right Column: Services Summary */}
        <div className="col-lg-6">
          <div className="card shadow-sm">
            <div className="card-header bg-success text-white flex justify-between items-center">
              <h5 className="mb-0 flex items-center">
                <List className="mr-2" size={20} />
                AMC Services Summary
              </h5>
              <span className="badge bg-light text-dark px-3 py-1 rounded-full">
                {services.length} Service{services.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="flex justify-center py-5">
                  <Loader className="animate-spin text-blue-600" size={32} />
                </div>
              ) : services.length === 0 ? (
                <div id="noServicesMessage" className="text-center py-5">
                  <Package className="fa fa-clipboard-list fa-3x text-muted mb-3 mx-auto" size={48} />
                  <h5>No Services Added</h5>
                  <p className="text-muted">
                    Add your first AMC service using the form on the left
                  </p>
                </div>
              ) : (
                <div id="servicesList">
                  {services.map((service) => (
                    <div key={service._id} className="card mb-3">
                      <div className="card-body">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h6 className="mb-1 font-semibold">{service.serviceName}</h6>
                            <p className="text-muted mb-2 text-sm">
                              {service.description || 'No description'}
                            </p>
                            <div className="mb-2 flex flex-wrap gap-2">
                              <span className="badge bg-secondary text-white px-2 py-1 rounded text-xs">
                                {service.serviceType}
                              </span>
                              <span className="badge bg-primary text-white px-2 py-1 rounded text-xs">
                                {service.visitsPerYear} visits/year
                              </span>
                              {service.hasPowerGuarantee && (
                                <span className="badge bg-info text-white px-2 py-1 rounded text-xs">
                                  Power Guarantee: {service.guaranteeMinKW}-{service.guaranteeMaxKW} kW
                                </span>
                              )}
                            </div>
                            <div>
                              <strong>{getPriceText(service)}</strong>
                              {service.additionalVisitCharge > 0 && (
                                <small className="text-muted ml-2">
                                  + ₹{service.additionalVisitCharge}/extra visit
                                </small>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-1">
                            <button
                              className="btn btn-outline-warning btn-sm flex items-center p-2 border border-yellow-500 text-yellow-600 rounded hover:bg-yellow-50"
                              onClick={() => editService(service._id)}
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              className="btn btn-outline-danger btn-sm flex items-center p-2 border border-red-500 text-red-600 rounded hover:bg-red-50"
                              onClick={() => deleteService(service._id)}
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
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
      <div className="row mt-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header flex justify-between items-center">
              <h5 className="mb-0 flex items-center">
                <Settings className="mr-2" size={20} />
                All AMC Services
              </h5>
              <button
                type="button"
                className="btn btn-outline-primary btn-sm flex items-center"
                onClick={scrollToForm}
              >
                <PlusCircle className="mr-1" size={16} />
                Add New Service
              </button>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left">#</th>
                      <th className="px-4 py-3 text-left">Service Name</th>
                      <th className="px-4 py-3 text-left">Type</th>
                      <th className="px-4 py-3 text-left">Price</th>
                      <th className="px-4 py-3 text-left">Visits/Year</th>
                      <th className="px-4 py-3 text-left">Power Guarantee</th>
                      <th className="px-4 py-3 text-left">Description</th>
                      <th className="px-4 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((service, index) => (
                      <tr key={service._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">{index + 1}</td>
                        <td className="px-4 py-3 font-semibold">{service.serviceName}</td>
                        <td className="px-4 py-3">
                          <span className="badge bg-secondary text-white px-2 py-1 rounded text-xs">
                            {service.serviceType}
                          </span>
                        </td>
                        <td className="px-4 py-3">{getPriceText(service)}</td>
                        <td className="px-4 py-3">{service.visitsPerYear}</td>
                        <td className="px-4 py-3">
                          {service.hasPowerGuarantee
                            ? `${service.guaranteeMinKW}-${service.guaranteeMaxKW} kW @ ₹${service.guaranteePerUnitPrice}/kW`
                            : 'No'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {service.description || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex space-x-2">
                            <button
                              className="btn btn-warning btn-sm flex items-center px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                              onClick={() => editService(service._id)}
                            >
                              <Edit2 className="mr-1" size={14} />
                              Edit
                            </button>
                            <button
                              className="btn btn-danger btn-sm flex items-center px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                              onClick={() => deleteService(service._id)}
                            >
                              <Trash2 className="mr-1" size={14} />
                              Delete
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

      {/* Edit Service Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="bg-yellow-500 text-white p-4 rounded-t-md flex justify-between items-center">
              <h3 className="text-lg font-semibold">Edit Service</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-white hover:text-gray-200 text-xl"
              >
                &times;
              </button>
            </div>
            <div className="p-6">
              <form id="editForm">
                <input type="hidden" id="editServiceId" value={currentEditId || ''} />

                <div className="form-group mb-4">
                  <label htmlFor="editServiceName" className="font-semibold">
                    Service Name
                  </label>
                  <input
                    type="text"
                    className="form-control mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    id="editServiceName"
                    name="serviceName"
                    value={editFormData.serviceName}
                    onChange={handleEditInputChange}
                    required
                  />
                </div>

                <div className="form-group mb-4">
                  <label htmlFor="editServiceDescription" className="font-semibold">
                    Service Description
                  </label>
                  <textarea
                    className="form-control mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    id="editServiceDescription"
                    name="serviceDescription"
                    value={editFormData.serviceDescription}
                    onChange={handleEditInputChange}
                    rows="2"
                  />
                </div>

                <div className="form-group mb-4">
                  <label htmlFor="editServiceType" className="font-semibold">
                    Service Type
                  </label>
                  <select
                    className="form-control mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    id="editServiceType"
                    name="serviceType"
                    value={editFormData.serviceType}
                    onChange={handleEditInputChange}
                  >
                    <option value="regular">Regular Service</option>
                    <option value="preventive">Preventive Maintenance</option>
                    <option value="emergency">Emergency Service</option>
                    <option value="special">Special Service</option>
                  </select>
                </div>

                <div className="row mb-4">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="editBasePrice" className="font-semibold">
                        Base Price (₹)
                      </label>
                      <input
                        type="number"
                        className="form-control mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        id="editBasePrice"
                        name="basePrice"
                        value={editFormData.basePrice}
                        onChange={handleEditInputChange}
                        min="0"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="editPriceType" className="font-semibold">
                        Price Type
                      </label>
                      <select
                        className="form-control mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        id="editPriceType"
                        name="priceType"
                        value={editFormData.priceType}
                        onChange={handleEditInputChange}
                      >
                        <option value="fixed">Fixed</option>
                        <option value="per_visit">Per Visit</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="row mb-4">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="editVisitsPerYear" className="font-semibold">
                        Visits Per Year
                      </label>
                      <input
                        type="number"
                        className="form-control mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        id="editVisitsPerYear"
                        name="visitsPerYear"
                        value={editFormData.visitsPerYear}
                        onChange={handleEditInputChange}
                        min="0"
                        max="12"
                      />
                      <small className="form-text text-muted">
                        Number of visits included in service
                      </small>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="editAdditionalVisitCharge" className="font-semibold">
                        Additional Visit Charge (₹)
                      </label>
                      <input
                        type="number"
                        className="form-control mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        id="editAdditionalVisitCharge"
                        name="additionalVisitCharge"
                        value={editFormData.additionalVisitCharge}
                        onChange={handleEditInputChange}
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Edit Power Generation Guarantee Section */}
                <div className="card mb-4 border border-gray-200">
                  <div className="card-header bg-gray-100">
                    <h6 className="mb-0 font-semibold">
                      Power Generation Guarantee (Optional)
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="form-group mb-3">
                      <div className="form-check">
                        <input
                          className="form-check-input h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                          type="checkbox"
                          id="editIncludePowerGuarantee"
                          name="includePowerGuarantee"
                          checked={editFormData.includePowerGuarantee}
                          onChange={(e) => {
                            handleEditInputChange(e);
                            setShowEditPowerGuarantee(e.target.checked);
                          }}
                        />
                        <label className="form-check-label ml-2" htmlFor="editIncludePowerGuarantee">
                          Include Power Generation Guarantee
                        </label>
                      </div>
                    </div>

                    {showEditPowerGuarantee && (
                      <div id="editPowerGuaranteeFields">
                        <div className="row mb-3">
                          <div className="col-md-6">
                            <div className="form-group">
                              <label htmlFor="editGuaranteeMinKW" className="font-semibold">
                                Minimum kW
                              </label>
                              <input
                                type="number"
                                className="form-control mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                id="editGuaranteeMinKW"
                                name="guaranteeMinKW"
                                value={editFormData.guaranteeMinKW}
                                onChange={handleEditInputChange}
                                min="0"
                                step="0.1"
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="form-group">
                              <label htmlFor="editGuaranteeMaxKW" className="font-semibold">
                                Maximum kW
                              </label>
                              <input
                                type="number"
                                className="form-control mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                id="editGuaranteeMaxKW"
                                name="guaranteeMaxKW"
                                value={editFormData.guaranteeMaxKW}
                                onChange={handleEditInputChange}
                                min="0"
                                step="0.1"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="form-group mb-3">
                          <label htmlFor="editGuaranteePerUnitPrice" className="font-semibold">
                            Per Unit kW Price (₹)
                          </label>
                          <input
                            type="number"
                            className="form-control mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                            id="editGuaranteePerUnitPrice"
                            name="guaranteePerUnitPrice"
                            value={editFormData.guaranteePerUnitPrice}
                            onChange={handleEditInputChange}
                            min="0"
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="editGuaranteeDescription" className="font-semibold">
                            Guarantee Description
                          </label>
                          <textarea
                            className="form-control mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                            id="editGuaranteeDescription"
                            name="guaranteeDescription"
                            value={editFormData.guaranteeDescription}
                            onChange={handleEditInputChange}
                            rows="2"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-3">
                  <button
                    type="button"
                    className="btn btn-secondary px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                    onClick={() => setIsEditModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-warning px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                    onClick={updateService}
                  >
                    Update Service
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