import React, { useState, useEffect } from 'react';
import {
  PlusCircle, Save, RefreshCw, Cog, List,
  Edit2, Trash2, CheckSquare, XSquare,
  Search, Filter, MoreVertical, ChevronRight,
  AlertCircle, Info, Settings, Eye, Package,
  Loader
} from 'lucide-react';
import { useLocations } from '../../../../hooks/useLocations';
import {
  getAMCServices,
  createAMCPlan,
  updateAMCPlan,
  getAMCPlans,
  deleteAMCPlan
} from '../../../../services/combokit/combokitApi';
import toast from 'react-hot-toast';

const CreateAmc = () => {
  const { countries, states, loading: locationLoading, fetchStates } = useLocations();

  // State management
  const [selectedState, setSelectedState] = useState('');
  const [amcPlans, setAmcPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [configureModalOpen, setConfigureModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null);

  // Available services
  const [availableServices, setAvailableServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);

  // Fetch initial data
  useEffect(() => {
    fetchStates('India'); // Assuming India is the default country
    fetchServices();
  }, []);

  // Fetch all created plans whenever state changes
  useEffect(() => {
    fetchAllPlans();
  }, []);

  const fetchServices = async () => {
    try {
      setServicesLoading(true);
      const data = await getAMCServices();
      setAvailableServices(data);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Failed to load services');
    } finally {
      setServicesLoading(false);
    }
  };

  const fetchAllPlans = async () => {
    try {
      setLoading(true);
      // Pass empty state to get all plans
      const data = await getAMCPlans('');
      setAmcPlans(data);
    } catch (error) {
      console.error('Error fetching AMC plans:', error);
      toast.error('Failed to load AMC plans');
    } finally {
      setLoading(false);
    }
  };

  // Handle state selection
  const handleStateSelect = (stateId) => {
    setSelectedState(stateId);
  };

  // Filter plans based on selected state
  const getFilteredPlans = () => {
    if (!selectedState) return amcPlans;
    return amcPlans.filter(plan => plan.state && plan.state._id === selectedState);
  };

  // Open configuration modal
  const openConfigureModal = () => {
    if (!selectedState) {
      toast.error('Please select a state first');
      return;
    }

    // Check if plan already exists for this state
    const existingPlan = amcPlans.find(plan => plan.state && plan.state._id === selectedState);

    if (existingPlan) {
      if (window.confirm('An AMC plan already exists for this state. Do you want to edit it?')) {
        setCurrentPlan(existingPlan);
        setSelectedServices(existingPlan.services.map(s => s._id));
        setConfigureModalOpen(true);
      }
      return;
    }

    setCurrentPlan(null);
    setSelectedServices([]);
    setConfigureModalOpen(true);
  };

  // Toggle service selection
  const toggleService = (serviceId) => {
    setSelectedServices(prev => {
      if (prev.includes(serviceId)) {
        return prev.filter(id => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  };

  // Save configuration
  const saveConfiguration = async () => {
    if (selectedServices.length === 0) {
      toast.error('Please select at least one service');
      return;
    }

    try {
      const payload = {
        stateId: selectedState,
        serviceIds: selectedServices
      };

      if (currentPlan) {
        await updateAMCPlan(currentPlan._id, payload);
        toast.success('AMC Plan updated successfully!');
      } else {
        await createAMCPlan(payload);
        toast.success('AMC Plan configuration saved successfully!');
      }

      setConfigureModalOpen(false);
      fetchAllPlans();
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast.error(error.message || 'Failed to save configuration');
    }
  };

  // Delete plan
  const handleDeletePlan = async (planId) => {
    if (window.confirm('Are you sure you want to delete this AMC plan?')) {
      try {
        await deleteAMCPlan(planId);
        toast.success('AMC Plan deleted successfully');
        fetchAllPlans();
      } catch (error) {
        console.error('Error deleting plan:', error);
        toast.error('Failed to delete plan');
      }
    }
  };

  // View details
  const openViewModal = (plan) => {
    setCurrentPlan(plan);
    setViewModalOpen(true);
  };

  // Get state name from ID
  const getStateName = (stateId) => {
    // If state object is passed directly (from populated data)
    if (typeof stateId === 'object' && stateId !== null) {
      return stateId.name;
    }
    // If ID is passed, find in states list
    const state = states.find(s => s._id === stateId);
    return state ? state.name : 'Unknown State';
  };

  const filteredPlans = getFilteredPlans();

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              <h4 className="mb-2 flex items-center text-gray-800">
                <Cog className="mr-2 text-primary" size={24} />
                Create AMC Plan
              </h4>
              <p className="text-muted mb-0">
                Configure AMC services for specific states
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Left Column: State Selection */}
        <div className="col-lg-4 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0 flex items-center">
                <Search className="mr-2" size={20} />
                Select State
              </h5>
            </div>
            <div className="card-body">
              <div className="form-group mb-4">
                <label className="font-semibold mb-2">Filter by State</label>
                <select
                  className="form-control w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  value={selectedState}
                  onChange={(e) => handleStateSelect(e.target.value)}
                  disabled={locationLoading}
                >
                  <option value="">-- All States --</option>
                  {states.map((state) => (
                    <option key={state._id} value={state._id}>
                      {state.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="alert alert-info flex items-start">
                <Info size={20} className="mr-2 flex-shrink-0 mt-1" />
                <small>
                  Select a specific state to configure services or view existing plans for that state.
                  Leave as "All States" to see all configured plans.
                </small>
              </div>

              {selectedState && (
                <div className="mt-4 text-center">
                  <button
                    className="btn btn-primary w-full py-2 flex justify-center items-center"
                    onClick={openConfigureModal}
                  >
                    <PlusCircle className="mr-2" size={20} />
                    Configure for {getStateName(selectedState)}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Plans List */}
        <div className="col-lg-8">
          <div className="card shadow-sm">
            <div className="card-header bg-success text-white flex justify-between items-center">
              <h5 className="mb-0 flex items-center">
                <List className="mr-2" size={20} />
                Configured AMC Plans
              </h5>
              <span className="badge bg-light text-dark px-3 py-1 rounded-full">
                {filteredPlans.length} Plan{filteredPlans.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="flex justify-center py-5">
                  <Loader className="animate-spin text-blue-600" size={32} />
                </div>
              ) : filteredPlans.length === 0 ? (
                <div className="text-center py-5">
                  <Package className="fa fa-box-open fa-3x text-muted mb-3 mx-auto" size={48} />
                  <h5>No Plans Found</h5>
                  <p className="text-muted">
                    {selectedState
                      ? "No AMC plan configured for this state yet."
                      : "No AMC plans have been configured yet."}
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left">#</th>
                        <th className="px-4 py-3 text-left">State</th>
                        <th className="px-4 py-3 text-left">Services</th>
                        <th className="px-4 py-3 text-left">Total Value (Yr)</th>
                        <th className="px-4 py-3 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPlans.map((plan, index) => {
                        // Calculate total value
                        const totalValue = plan.services.reduce((sum, service) => {
                          let price = service.basePrice || 0;
                          if (service.priceType === 'monthly') price *= 12;
                          // annual is just basePrice
                          // per_visit is based on visitsPerYear
                          if (service.priceType === 'per_visit') {
                            price = (service.basePrice || 0) * (service.visitsPerYear || 1);
                          }
                          return sum + price;
                        }, 0);

                        return (
                          <tr key={plan._id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">{index + 1}</td>
                            <td className="px-4 py-3 font-semibold">
                              {plan.state?.name || 'Unknown State'}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex -space-x-2 overflow-hidden">
                                {plan.services.slice(0, 3).map((s, i) => (
                                  <span
                                    key={i}
                                    className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 ring-2 ring-white text-xs font-medium text-blue-800"
                                    title={s.serviceName}
                                  >
                                    {s.serviceName ? s.serviceName.charAt(0) : '?'}
                                  </span>
                                ))}
                                {plan.services.length > 3 && (
                                  <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 ring-2 ring-white text-xs font-medium text-gray-800">
                                    +{plan.services.length - 3}
                                  </span>
                                )}
                              </div>
                              <span className="ml-2 text-sm text-gray-600">
                                {plan.services.length} Services
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              ~ ₹{totalValue.toLocaleString()}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex space-x-2">
                                <button
                                  className="btn btn-info btn-sm flex items-center px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                  onClick={() => openViewModal(plan)}
                                >
                                  <Eye className="mr-1" size={14} />
                                  View
                                </button>
                                <button
                                  className="btn btn-danger btn-sm flex items-center px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                  onClick={() => handleDeletePlan(plan._id)}
                                >
                                  <Trash2 className="mr-1" size={14} />
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Configure Modal */}
      {configureModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="bg-primary text-white p-4 rounded-t-md flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                Configure AMC for {getStateName(selectedState)}
              </h3>
              <button
                onClick={() => setConfigureModalOpen(false)}
                className="text-white hover:text-gray-200 text-xl"
              >
                &times;
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <h5 className="font-semibold mb-3">Select Services to Include</h5>
                <p className="text-sm text-gray-500 mb-4">
                  Check the services you want to offer in this state's AMC plan.
                </p>
              </div>

              {servicesLoading ? (
                <div className="flex justify-center py-10">
                  <Loader className="animate-spin text-blue-600" size={32} />
                </div>
              ) : availableServices.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-gray-300 rounded-lg">
                  <p className="text-gray-500">No services defined yet. Go to "AMC Services" to add some.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2">
                  {availableServices.map((service) => (
                    <div
                      key={service._id}
                      className={`
                        border rounded-lg p-3 cursor-pointer transition-all
                        ${selectedServices.includes(service._id)
                          ? 'border-primary bg-blue-50 ring-1 ring-primary'
                          : 'border-gray-200 hover:border-blue-300'}
                      `}
                      onClick={() => toggleService(service._id)}
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0 pt-1">
                          {selectedServices.includes(service._id) ? (
                            <CheckSquare className="text-primary" size={20} />
                          ) : (
                            <div className="w-5 h-5 border border-gray-300 rounded bg-white"></div>
                          )}
                        </div>
                        <div className="ml-3 flex-1">
                          <h6 className="text-sm font-semibold text-gray-900 mb-1">
                            {service.serviceName}
                          </h6>
                          <div className="flex flex-wrap gap-1 mb-1">
                            <span className="text-xs bg-gray-200 px-2 py-0.5 rounded text-gray-700">
                              {service.serviceType}
                            </span>
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                              {service.visitsPerYear} visits/yr
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-2">
                            {service.description}
                          </p>
                          <div className="mt-2 text-sm font-medium text-gray-900">
                            Price: {service.basePrice} / {service.priceType}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t">
                <button
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                  onClick={() => setConfigureModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-primary text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  onClick={saveConfiguration}
                  disabled={selectedServices.length === 0}
                >
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewModalOpen && currentPlan && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="bg-info text-white p-4 rounded-t-md flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                AMC Plan Details: {currentPlan.state?.name || 'Unknown State'}
              </h3>
              <button
                onClick={() => setViewModalOpen(false)}
                className="text-white hover:text-gray-200 text-xl"
              >
                &times;
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <h5 className="font-semibold border-b pb-2 mb-3">Included Services</h5>
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead>
                      <tr className="bg-gray-50">
                        <th>Service Name</th>
                        <th>Type</th>
                        <th>Visits</th>
                        <th>Price</th>
                        <th>Power Guarantee</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentPlan.services.map((service, idx) => (
                        <tr key={idx}>
                          <td className="font-medium">{service.serviceName}</td>
                          <td>{service.serviceType}</td>
                          <td>{service.visitsPerYear} per year</td>
                          <td>₹{service.basePrice} ({service.priceType})</td>
                          <td>
                            {service.hasPowerGuarantee ? (
                              <span className="text-green-600 font-medium">Yes</span>
                            ) : (
                              <span className="text-gray-400">No</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  onClick={() => setViewModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateAmc;