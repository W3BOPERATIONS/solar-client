import React, { useState, useEffect } from 'react';
import {
  Home,
  Building2,
  Filter,
  X,
  ArrowRight,
  BriefcaseBusiness,
  Plus,
  Eye,
  EyeOff
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLocations } from '../../../../hooks/useLocations';

import ProjectForm from '../components/ProjectForm';
import StatsCards from '../components/StatsCards';
import ProjectTable from '../components/ProjectTable';

// Dummy API functions for demonstration
const getAllProjects = async (filters) => ({ success: true, data: [] });
const getProjectStats = async (stateId) => ({ success: true, data: { total: 0, inProgress: 0, completed: 0, overdue: 0 } });
const createProject = async (data) => ({ success: true });
const updateProject = async (id, data) => ({ success: true });
const deleteProject = async (id) => ({ success: true });

export default function ManagementProjects() {
  const navigate = useNavigate();
  const location = useLocation();

  // State for filters (replicated from Franchisee)
  const [filters, setFilters] = useState({
    category: '',
    subCategory: '',
    projectType: '',
    subProjectType: ''
  });

  // State for selected customer type
  const [selectedCustomerType, setSelectedCustomerType] = useState(null);

  // States from original Admin logic
  const [locationCardsVisible, setLocationCardsVisible] = useState(false);
  const [currentState, setCurrentState] = useState(null);
  const [currentCluster, setCurrentCluster] = useState(null);
  const [currentDistrict, setCurrentDistrict] = useState(null);
  const [selectedStateCard, setSelectedStateCard] = useState(null);
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({ total: 0, inProgress: 0, completed: 0, overdue: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    projectId: '', projectName: '', category: '', projectType: '', totalKW: '',
    status: 'Consumer Registered', dueDate: '', state: '', cluster: '', district: ''
  });

  const { states, clusters, districts, fetchStates, fetchClusters, fetchDistricts } = useLocations();

  useEffect(() => {
    fetchStates();
  }, []);

  // Filter options replicated from Franchisee
  const filterOptions = {
    categories: [
      { value: 'Rooftop Solar', label: 'Rooftop Solar' },
      { value: 'Solar Pump', label: 'Solar Pump' }
    ],
    subCategories: [
      { value: 'Residential', label: 'Residential' },
      { value: 'Commercial', label: 'Commercial' }
    ],
    projectTypes: [
      { value: '1 to 10 kW', label: '1 to 10 kW' },
      { value: '11 to 20 kW', label: '11 to 20 kW' }
    ],
    subProjectTypes: [
      { value: 'On-Grid', label: 'On-Grid' },
      { value: 'Off-Grid', label: 'Off-Grid' },
      { value: 'Hybrid', label: 'Hybrid' }
    ]
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    if (name === 'subCategory') {
      if (value === 'Residential') setSelectedCustomerType('Residential');
      else if (value === 'Commercial') setSelectedCustomerType('Commercial');
      else setSelectedCustomerType(null);
    }
  };

  const clearFilters = () => {
    setFilters({ category: '', subCategory: '', projectType: '', subProjectType: '' });
    setSelectedCustomerType(null);
  };

  const handleCustomerTypeSelect = (type) => setSelectedCustomerType(type);

  const handleContinue = () => {
    // In Admin, we might show the project table instead of navigating away, or navigate to a specialized form
    alert(`Continuing with ${selectedCustomerType} Project... Showing Management Table.`);
    // For now, let's toggle visibility of the main management section
    // setCurrentState(someState); // This would trigger original behavior
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Container copied from Franchisee */}
      <div className="max-w-7xl mx-auto">
        
        {/* Header replicated from 1st image */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="p-4 flex justify-between items-center">
            <h4 className="text-blue-600 font-bold text-lg">Project Management</h4>
            <div className="flex gap-2">
              <button 
                onClick={() => setLocationCardsVisible(!locationCardsVisible)} 
                className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 text-sm flex items-center gap-2"
              >
                {locationCardsVisible ? <><EyeOff size={16} /> Hide States</> : <><Eye size={16} /> Filter by States</>}
              </button>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2"
              >
                <Plus size={16} /> Add Project
              </button>
            </div>
          </div>
        </div>

        {/* State Selection (Admin specific, can be hidden) */}
        {locationCardsVisible && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h5 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">Select State / Location</h5>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {states.map((state) => (
                <div 
                  key={state._id} 
                  onClick={() => {
                    setCurrentState(state);
                    setSelectedStateCard(state._id);
                    fetchClusters(state._id);
                  }} 
                  className={`cursor-pointer p-3 rounded-lg border-2 text-center transition text-sm font-bold
                    ${selectedStateCard === state._id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 bg-white hover:border-blue-200 text-gray-600'}`}
                >
                  {state.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter Section replicated from 1st image */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <select name="category" value={filters.category} onChange={handleFilterChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                <option value="">Filter by Category</option>
                {filterOptions.categories.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <select name="subCategory" value={filters.subCategory} onChange={handleFilterChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                <option value="">Filter by Sub-Category</option>
                {filterOptions.subCategories.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <select name="projectType" value={filters.projectType} onChange={handleFilterChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                <option value="">Filter by Project Type</option>
                {filterOptions.projectTypes.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <select name="subProjectType" value={filters.subProjectType} onChange={handleFilterChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                <option value="">Filter by Sub Project Type</option>
                {filterOptions.subProjectTypes.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={clearFilters} className="px-3 py-1.5 border border-gray-200 text-gray-500 rounded-md hover:bg-gray-50 text-xs flex items-center">
                <X size={14} className="mr-1" /> Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Customer Type Selection replicated from 1st image */}
        <div className="text-center mt-12 mb-16">
          <h3 className="text-blue-600 font-extrabold text-2xl mb-2">Select Customer Type</h3>
          <p className="text-gray-400 text-sm mb-8 font-medium">Choose one to continue</p>

          <div className="flex flex-col md:flex-row justify-center gap-8 max-w-4xl mx-auto px-4">
            {/* Residential Card */}
            <div 
              onClick={() => handleCustomerTypeSelect('Residential')} 
              className={`flex-1 cursor-pointer group transition-all duration-300 ${filters.subCategory === 'Commercial' ? 'hidden' : 'block'}`}
            >
              <div className={`bg-white rounded-2xl p-10 text-center border-2 transition-all duration-300 transform group-hover:-translate-y-1 ${selectedCustomerType === 'Residential' ? 'border-blue-500 shadow-xl ring-4 ring-blue-50' : 'border-gray-100 shadow-md hover:border-blue-200'}`}>
                <div className={`w-20 h-20 mx-auto mb-6 flex items-center justify-center rounded-2xl transition-colors ${selectedCustomerType === 'Residential' ? 'bg-blue-500 text-white' : 'bg-blue-50 text-blue-500'}`}>
                  <Home size={40} />
                </div>
                <h4 className="font-bold text-xl mb-3 text-gray-800">Residential</h4>
                <p className="text-gray-400 text-sm leading-relaxed">For personal, non-commercial use</p>
              </div>
            </div>

            {/* Commercial Card */}
            <div 
              onClick={() => handleCustomerTypeSelect('Commercial')} 
              className={`flex-1 cursor-pointer group transition-all duration-300 ${filters.subCategory === 'Residential' ? 'hidden' : 'block'}`}
            >
              <div className={`bg-white rounded-2xl p-10 text-center border-2 transition-all duration-300 transform group-hover:-translate-y-1 ${selectedCustomerType === 'Commercial' ? 'border-blue-500 shadow-xl ring-4 ring-blue-50' : 'border-gray-100 shadow-md hover:border-blue-200'}`}>
                <div className={`w-20 h-20 mx-auto mb-6 flex items-center justify-center rounded-2xl transition-colors ${selectedCustomerType === 'Commercial' ? 'bg-blue-500 text-white' : 'bg-blue-50 text-blue-500'}`}>
                  <Building2 size={40} />
                </div>
                <h4 className="font-bold text-xl mb-3 text-gray-800">Commercial</h4>
                <p className="text-gray-400 text-sm leading-relaxed">For business and commercial purposes</p>
              </div>
            </div>
          </div>

          <button 
            disabled={!selectedCustomerType} 
            onClick={handleContinue}
            className={`mt-12 px-10 py-3.5 rounded-xl font-bold text-lg inline-flex items-center gap-3 transition-all duration-300
              ${selectedCustomerType ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700 hover:scale-105 active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
          >
            Continue <ArrowRight size={22} />
          </button>
        </div>

        {/* Existing Admin Modals & Specific logic can follow... */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1000] backdrop-blur-sm transition-opacity">
            <div className="bg-white p-8 rounded-2xl w-[95%] max-w-[650px] shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Add New Project</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"><X size={24} /></button>
              </div>
              <ProjectForm 
                initialData={formData} 
                onSubmit={(data) => { setIsModalOpen(false); console.log(data); }} 
                onCancel={() => setIsModalOpen(false)} 
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
