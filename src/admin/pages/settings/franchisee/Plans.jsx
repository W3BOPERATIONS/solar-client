import React, { useState, useEffect } from 'react';
import {
  Rocket,
  Layers,
  Building,
  SlidersHorizontal,
  Plus,
  Check,
  List,
  MapPin,
  Users,
  Tags,
  Star,
  DollarSign,
  HandCoins,
  Percent,
  Video,
  History,
  X,
  Eye,
  Upload,
  Save,
  Calculator,
  ChevronRight,
  Settings,
  FileText,
  Briefcase,
  Home,
  Store,
  ArrowUp,
  ChevronDown,
  Clock,
  Trash2,
  CheckCircle,
  Image as ImageIcon,
  Globe,
  Server,
  UserCircle,
  UserCog,
  Smartphone,
  Monitor,
  Zap,
  AlertCircle,
  File,
  TrendingUp,
  ClipboardCheck,
  Shield,
  Target,
  Award,
  CreditCard,
  Users as UsersIcon,
  BookOpen,
  FolderOpen,
  Grid,
  PieChart,
  BarChart,
  Cpu,
  Battery,
  Sun,
  Zap as ZapIcon,
  DollarSign as DollarSignIcon,
  CreditCard as CreditCardIcon
} from 'lucide-react';
import { getStates } from '../../../../services/locationApi';
import { getProPlans, createProPlan, updateProPlan, deleteProPlan } from '../../../../services/franchisee/franchiseeApi';
import toast from 'react-hot-toast';

// Fallback icons for missing exports
const FileInvoice = File;
const SolarPanel = Sun;

const Plans = () => {
  const [states, setStates] = useState([]);
  const [selectedState, setSelectedState] = useState(null);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null); // Stores the full plan object
  const [activeSection, setActiveSection] = useState('configuresupplytype');
  const [activityLog, setActivityLog] = useState([]);

  // Form State - Initialize with default values
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    priceDescription: 'signup fees',
    yearlyTargetKw: '',
    cashbackAmount: '',
    accessType: '',
    userLimit: 1,
    userDescription: '',
    projectTypes: [],
    features: [],
    documents: [],
    depositFees: '',
    colorArgs: {
      buttonColor: 'from-blue-600 to-purple-600',
      headerColor: 'bg-blue-600',
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-600'
    }
  });

  const [loading, setLoading] = useState(false);

  // Constants for dropdowns/options (To be made dynamic if needed in future, keeping static for now as per plan)
  const availableProjectTypes = [
    { name: "Residential", image: "ResidentialEarning.png" },
    { name: "Commercial", image: "CommercialEarning.png" },
    { name: "Residential Solar", image: "ResidentialSolar.png" },
    { name: "Commercial Solar", image: "CommercialSolar.png" }
  ];

  const availableFeatures = ["Leads", "Quotes", "Survey", "Project Signup", "CRM", "Analytics", "API Access", "Solar Leads", "Solar CRM", "Energy Analytics"];
  const availableDocuments = ["ID Proof", "Address Proof", "Business PAN", "GST Certificate", "Company Registration", "Solar Certification"];

  const sectionList = [
    { id: 'configuresupplytype', name: 'Configure Supply Type', icon: Check },
    { id: 'kycSection', name: 'Onboarding Requirements', icon: Check },
    // ... Add other sections if needed for functionality, for now keeping core ones that map to data
  ];

  useEffect(() => {
    fetchStates();
  }, []);

  useEffect(() => {
    if (selectedState) {
      fetchPlans(selectedState);
    } else {
      setPlans([]);
      setSelectedPlan(null);
    }
  }, [selectedState]);

  useEffect(() => {
    if (selectedPlan) {
      setFormData({
        ...selectedPlan,
        // Ensure arrays are initialized
        projectTypes: selectedPlan.projectTypes || [],
        features: selectedPlan.features || [],
        documents: selectedPlan.documents || [],
        colorArgs: selectedPlan.colorArgs || {
          buttonColor: 'from-blue-600 to-purple-600',
          headerColor: 'bg-blue-600',
          iconColor: 'text-blue-600',
          bgColor: 'bg-blue-600'
        }
      });
    } else {
      // Reset form for new plan
      setFormData({
        name: '',
        description: '',
        price: '',
        priceDescription: 'signup fees',
        yearlyTargetKw: '',
        cashbackAmount: '',
        accessType: '',
        userLimit: 1,
        userDescription: '',
        projectTypes: [],
        features: [],
        documents: [],
        depositFees: '',
        colorArgs: {
          buttonColor: 'from-blue-600 to-purple-600',
          headerColor: 'bg-blue-600',
          iconColor: 'text-blue-600',
          bgColor: 'bg-blue-600'
        }
      });
    }
  }, [selectedPlan]);

  const fetchStates = async () => {
    try {
      const data = await getStates();
      setStates(data);
    } catch (error) {
      console.error("Error fetching states:", error);
      toast.error("Failed to load states");
    }
  };

  const fetchPlans = async (stateId) => {
    setLoading(true);
    try {
      const data = await getProPlans(stateId);
      setPlans(data);
      if (data.length > 0) {
        setSelectedPlan(data[0]);
      } else {
        setSelectedPlan(null); // Ready to add new
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
      toast.error("Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  const handleStateSelect = (stateId) => {
    setSelectedState(stateId);
  };

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNestedInputChange = (parent, key, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [key]: value
      }
    }));
  }

  const handleArrayToggle = (arrayName, item) => {
    setFormData(prev => {
      const currentArray = prev[arrayName] || [];
      if (currentArray.includes(item)) {
        return { ...prev, [arrayName]: currentArray.filter(i => i !== item) };
      } else {
        return { ...prev, [arrayName]: [...currentArray, item] };
      }
    });
  };

  // Special handler for project types which are objects
  const handleProjectTypeToggle = (projectType) => {
    setFormData(prev => {
      const current = prev.projectTypes || [];
      const exists = current.find(p => p.name === projectType.name);
      if (exists) {
        return { ...prev, projectTypes: current.filter(p => p.name !== projectType.name) };
      } else {
        return { ...prev, projectTypes: [...current, projectType] };
      }
    });
  };

  const calculateCashback = () => {
    // Simple calc logic for demo, can be expanded
    const target = parseFloat(formData.yearlyTargetKw) || 0;
    const rate = 1000; // Hardcoded or fetch from settings
    alert(`Estimated Total Cashback: ₹${target * rate}`);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!selectedState) {
      toast.error("Please select a state first");
      return;
    }

    try {
      const payload = {
        ...formData,
        state: selectedState
      };

      if (selectedPlan && selectedPlan._id) {
        // Update
        const updatedPlan = await updateProPlan(selectedPlan._id, payload);
        setPlans(prev => prev.map(p => p._id === updatedPlan._id ? updatedPlan : p));
        setSelectedPlan(updatedPlan);
        toast.success("Plan updated successfully");
      } else {
        // Create
        const newPlan = await createProPlan(payload);
        setPlans(prev => [...prev, newPlan]);
        setSelectedPlan(newPlan);
        toast.success("Plan created successfully");
      }
    } catch (error) {
      console.error("Error saving plan:", error);
      toast.error(error.message || "Failed to save plan");
    }
  };

  const handleAddNewPlan = () => {
    setSelectedPlan(null); // clear selection to show empty form
  };

  const handleDeletePlan = async () => {
    if (!selectedPlan || !selectedPlan._id) return;
    if (!window.confirm("Are you sure you want to delete this plan?")) return;

    try {
      await deleteProPlan(selectedPlan._id);
      setPlans(prev => prev.filter(p => p._id !== selectedPlan._id));
      setSelectedPlan(plans.length > 1 ? plans.find(p => p._id !== selectedPlan._id) : null);
      toast.success("Plan deleted successfully");
    } catch (error) {
      console.error("Error deleting plan:", error);
      toast.error("Failed to delete plan");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-base">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <nav className="container mx-auto px-4 py-3">
          <div className="flex items-center">
            <Settings className="w-6 h-6 mr-3 text-gray-700" />
            <h1 className="text-2xl font-bold text-gray-800">Franchisee Settings</h1>
          </div>
        </nav>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* State Selection */}
        {!selectedState ? (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-center mb-8">Select State to Configure Plans</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {states.map((state) => (
                <div
                  key={state._id}
                  onClick={() => handleStateSelect(state._id)}
                  className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer transform hover:-translate-y-1"
                >
                  <div className="p-6 text-center">
                    <h3 className="text-xl font-bold text-gray-800">{state.name}</h3>
                    <p className="text-gray-600 mt-2">{state.code}</p>
                  </div>
                </div>
              ))}
            </div>
            {states.length === 0 && <p className="text-center text-gray-500">No states found. Please add states in location settings.</p>}
          </div>
        ) : (
          <>
            <button onClick={() => setSelectedState(null)} className="mb-4 text-blue-600 hover:underline flex items-center">
              &larr; Back to State Selection
            </button>

            {/* Plan Selection Buttons */}
            <div className="mb-8">
              <div className="flex flex-wrap justify-center gap-3 mb-6">
                {plans.map((plan) => (
                  <button
                    key={plan._id}
                    onClick={() => handlePlanSelect(plan)}
                    className={`px-5 py-3 rounded-lg flex items-center transition-all ${selectedPlan && selectedPlan._id === plan._id
                      ? `bg-blue-600 text-white shadow-lg`
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    {/* Using a default icon or dynamic if stored */}
                    <Rocket className="w-5 h-5 mr-2" />
                    {plan.name}
                  </button>
                ))}
                <button
                  onClick={handleAddNewPlan}
                  className={`px-5 py-3 bg-gray-800 text-white rounded-lg flex items-center hover:bg-gray-900 ${!selectedPlan ? 'ring-2 ring-offset-2 ring-gray-800' : ''}`}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add New Plan
                </button>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
              {/* Main Content Form */}
              <div className="lg:w-2/3 mx-auto">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-center border-b pb-4 mb-6">
                    <h3 className="text-2xl font-bold text-gray-800">
                      {selectedPlan && selectedPlan._id ? `Edit ${formData.name}` : 'Create New Plan'}
                    </h3>
                    {selectedPlan && selectedPlan._id && (
                      <button onClick={handleDeletePlan} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleFormSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Plan Name</label>
                        <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Price (₹)</label>
                        <input type="number" name="price" value={formData.price} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <input type="text" name="description" value={formData.description} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Price Description</label>
                        <input type="text" name="priceDescription" value={formData.priceDescription} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Yearly Target (kW)</label>
                        <input type="number" name="yearlyTargetKw" value={formData.yearlyTargetKw} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Cashback Amount (₹)</label>
                        <input type="number" name="cashbackAmount" value={formData.cashbackAmount} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">User Limit</label>
                        <input type="number" name="userLimit" value={formData.userLimit} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Deposit Fees</label>
                        <input type="number" name="depositFees" value={formData.depositFees} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Access Type</label>
                        <input type="text" name="accessType" value={formData.accessType} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md p-2" placeholder="e.g. App Only" />
                      </div>
                    </div>

                    {/* Features Selection */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
                      <div className="flex flex-wrap gap-2">
                        {availableFeatures.map(f => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => handleArrayToggle('features', f)}
                            className={`px-3 py-1 rounded-full text-sm border ${formData.features?.includes(f) ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-gray-50 border-gray-300'}`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Documents Selection */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Required Documents</label>
                      <div className="flex flex-wrap gap-2">
                        {availableDocuments.map(d => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => handleArrayToggle('documents', d)}
                            className={`px-3 py-1 rounded-full text-sm border ${formData.documents?.includes(d) ? 'bg-green-100 border-green-500 text-green-700' : 'bg-gray-50 border-gray-300'}`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Color Configuration */}
                    <div className="mb-6 border-t pt-4">
                      <h4 className="text-lg font-medium mb-3">Appearance</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Header Color Class</label>
                          <input type="text" value={formData.colorArgs?.headerColor || ''} onChange={(e) => handleNestedInputChange('colorArgs', 'headerColor', e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md p-2" placeholder="e.g. bg-blue-600" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Button Gradient Class</label>
                          <input type="text" value={formData.colorArgs?.buttonColor || ''} onChange={(e) => handleNestedInputChange('colorArgs', 'buttonColor', e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md p-2" placeholder="e.g. from-blue-600 to-purple-600" />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3">
                      <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        {selectedPlan && selectedPlan._id ? 'Update Plan' : 'Create Plan'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Plans;