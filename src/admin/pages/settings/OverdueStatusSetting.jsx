// OverdueStatusSetting.jsx
import React, { useState, useEffect } from 'react';
import {
  Save,
  Building2,
  MapPin,
  Building,
  CheckCircle,
  XCircle,
  ChevronRight,
  Loader
} from 'lucide-react';
import { getDepartments } from '../../../services/hr/departmentModuleApi';
import { getStates, getCities } from '../../../services/locationApi';
import { fetchOverdueStatusSettings, updateOverdueStatusSettings } from '../../../services/settings/settingsApi';
import axios from '../../../api/axios';

const OverdueStatusSetting = () => {
  const [departments, setDepartments] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);

  const [overdueData, setOverdueData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch Departments on Mount
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const response = await getDepartments();
        if (response.success && response.departments) {
          setDepartments(response.departments.map(d => ({ name: d.name, color: 'bg-green-500', _id: d._id })));
        } else if (Array.isArray(response)) {
          setDepartments(response.map(d => ({ name: d.name, color: 'bg-green-500', _id: d._id })));
        }
      } catch (error) {
        console.error("Failed to fetch departments", error);
      }
    };
    loadDepartments();
  }, []);

  // Fetch States when Department is selected (or just load all states initially)
  // For this UI flow, it seems independent of department, so load on mount or when dept selected
  useEffect(() => {
    const loadStates = async () => {
      try {
        const data = await getStates();
        setStates(data || []);
      } catch (error) {
        console.error("Failed to fetch states", error);
      }
    };
    if (selectedDepartment) {
      loadStates();
    }
  }, [selectedDepartment]);

  // Fetch Cities when State is selected
  useEffect(() => {
    const loadCities = async () => {
      if (!selectedState) return;
      try {
        // Find state ID to fetch cities
        const stateObj = states.find(s => s.name === selectedState);
        if (stateObj) {
          const data = await getCities(stateObj._id);
          setCities(data || []);
        }
      } catch (error) {
        console.error("Failed to fetch cities", error);
      }
    };
    loadCities();
  }, [selectedState, states]);


  // Load overdue data when city is selected
  useEffect(() => {
    const loadSettings = async () => {
      if (selectedDepartment && selectedState && selectedCity) {
        setLoading(true);
        try {
          const data = await fetchOverdueStatusSettings({
            department: selectedDepartment,
            state: selectedState,
            city: selectedCity
          });
          setOverdueData(data);
        } catch (error) {
          console.error("Failed to fetch settings", error);

        } finally {
          setLoading(false);
        }
      }
    };
    loadSettings();
  }, [selectedDepartment, selectedState, selectedCity]);

  const handleDepartmentSelect = (department) => {
    setSelectedDepartment(department);
    setSelectedState(null);
    setSelectedCity(null);
    setOverdueData(null);
  };

  const handleStateSelect = (state) => {
    setSelectedState(state);
    setSelectedCity(null);
    setOverdueData(null);
  };

  const handleCitySelect = (city) => {
    setSelectedCity(city);
  };

  const handleOverdueDaysChange = (moduleId, taskId, value) => {
    if (!overdueData) return;

    const updatedModules = overdueData.modules.map(module => {
      if (module.id === moduleId) {
        if (taskId) {
          // Update task overdue days
          const updatedTasks = module.tasks.map(task =>
            task.id === taskId ? { ...task, overdueDays: parseInt(value) || 1 } : task
          );
          return { ...module, tasks: updatedTasks };
        } else {
          // Update module overdue days
          return { ...module, overdueDays: parseInt(value) || 1 };
        }
      }
      return module;
    });

    setOverdueData({ ...overdueData, modules: updatedModules });
  };

  const handleStatusToggle = (moduleId, taskId) => {
    if (!overdueData) return;

    const updatedModules = overdueData.modules.map(module => {
      if (module.id === moduleId) {
        if (taskId) {
          // Toggle task status
          const updatedTasks = module.tasks.map(task =>
            task.id === taskId ? {
              ...task,
              status: task.status === "Active" ? "Inactive" : "Active"
            } : task
          );
          return { ...module, tasks: updatedTasks };
        } else {
          // Toggle module status
          return {
            ...module,
            status: module.status === "Active" ? "Inactive" : "Active"
          };
        }
      }
      return module;
    });

    setOverdueData({ ...overdueData, modules: updatedModules });
  };

  const handleSaveSettings = async () => {
    if (!selectedDepartment || !selectedState || !selectedCity) {
      alert('Please select a department, state, and cluster first');
      return;
    }

    if (!overdueData) {
      alert('No settings to save');
      return;
    }

    setSaving(true);
    try {
      await updateOverdueStatusSettings({
        department: selectedDepartment,
        state: selectedState,
        city: selectedCity,
        modules: overdueData.modules
      });
      alert(`Settings for ${selectedDepartment} in ${selectedCity}, ${selectedState} have been saved successfully!`);
    } catch (error) {
      console.error("Failed to save settings", error);
      alert("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-fluid py-4 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-4">
        <nav className="bg-white p-3 shadow-sm rounded-lg">
          <div className="flex items-center">
            <div className="text-primary w-full">
              <h3 className="mb-0 text-blue-600 font-bold text-xl flex items-center">
                <Building2 className="mr-2" />
                Admin Overdue Status Setting
              </h3>
            </div>
          </div>
        </nav>
      </div>

      <div className="container-fluid mt-4">
        <h3 className="mb-4 text-gray-700 font-semibold">Select a Department</h3>

        {/* Department Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3" id="departmentCards">
          {departments.length > 0 ? departments.map((dept, index) => (
            <div key={index} className="col-span-1">
              <div
                className={`card text-white text-center p-3 rounded-lg shadow-md cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${selectedDepartment === dept.name
                  ? 'bg-blue-500 selected-department'
                  : 'bg-green-500' // Default color
                  }`}
                onClick={() => handleDepartmentSelect(dept.name)}
              >
                <h6 className="mb-0 font-medium">{dept.name}</h6>
              </div>
            </div>
          )) : <p className="text-gray-500 ml-3">Loading departments...</p>}
        </div>
      </div>

      {/* State Selection */}
      {selectedDepartment && (
        <div className="mt-8" id="stateSelection">
          <h4 className="mb-3 text-gray-700 font-semibold flex items-center">
            <MapPin className="mr-2" size={20} />
            Select State
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3" id="stateContainer">
            {states.length > 0 ? states.map((state, index) => (
              <div key={index} className="col-span-1">
                <div
                  className={`card text-white text-center p-3 rounded-lg shadow-md cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${selectedState === state.name
                    ? 'bg-blue-500 selected-state'
                    : 'bg-blue-400'
                    }`}
                  onClick={() => handleStateSelect(state.name)}
                >
                  <h6 className="mb-0 font-medium">{state.name}</h6>
                </div>
              </div>
            )) : <p className="text-gray-500 ml-3">Loading states...</p>}
          </div>
        </div>
      )}

      {/* City Selection */}
      {selectedState && (
        <div className="mt-6" id="citySelection">
          <h4 className="mb-3 text-gray-700 font-semibold flex items-center">
            <Building className="mr-2" size={20} />
            Select Cluster
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3" id="cityContainer">
            {cities.length > 0 ? cities.map((city, index) => (
              <div key={index} className="col-span-1">
                <div
                  className={`card text-dark text-center p-3 rounded-lg shadow-md cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${selectedCity === city.name
                    ? 'bg-blue-500 text-white selected-city'
                    : 'bg-yellow-400'
                    }`}
                  onClick={() => handleCitySelect(city.name)}
                >
                  <h6 className="mb-0 font-medium">{city.name}</h6>
                </div>
              </div>
            )) : <p className="text-gray-500 ml-3">Loading clusters...</p>}
          </div>
        </div>
      )}

      {/* Overdue Settings Table */}
      {loading && (
        <div className="flex justify-center mt-8">
          <Loader className="animate-spin text-blue-600" size={32} />
        </div>
      )}

      {!loading && overdueData && selectedCity && (
        <div className="card mt-8 mb-4 p-6 bg-white rounded-lg shadow-md" id="overdueSettingsContainer">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-blue-600 font-bold text-lg">
              Overdue Settings -
              <span className="mx-1 font-semibold">{selectedDepartment}</span>
              <ChevronRight className="inline mx-1" size={16} />
              <span className="mx-1 font-semibold">{selectedState}</span>
              <ChevronRight className="inline mx-1" size={16} />
              <span className="mx-1 font-semibold">{selectedCity}</span>
            </h4>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">#</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Module Name</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Task Name</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Overdue Days</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody id="overdueSettingsBody">
                {overdueData.modules && overdueData.modules.map((module, moduleIndex) => (
                  <React.Fragment key={module.id}>
                    {/* Module Row */}
                    <tr className="bg-gray-100 font-bold">
                      <td className="border border-gray-300 px-4 py-3 align-top" rowSpan={module.tasks.length + 1}>
                        {moduleIndex + 1}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 align-top" rowSpan={module.tasks.length + 1}>
                        <span className="font-bold text-gray-800">{module.name}</span>
                      </td>
                    </tr>

                    {/* Task Rows */}
                    {module.tasks.map((task, taskIndex) => (
                      <tr key={task.id} className="bg-gray-50 hover:bg-gray-100 transition-colors duration-150">
                        <td className="border border-gray-300 px-4 py-3 text-gray-700">{task.name}</td>
                        <td className="border border-gray-300 px-4 py-3">
                          <input
                            type="number"
                            className="form-input w-24 px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            value={task.overdueDays}
                            min="1"
                            max="30"
                            onChange={(e) => handleOverdueDaysChange(module.id, task.id, e.target.value)}
                          />
                        </td>
                        <td className="border border-gray-300 px-4 py-3">
                          <div className="flex items-center">
                            <button
                              onClick={() => handleStatusToggle(module.id, task.id)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${task.status === "Active" ? "bg-green-500" : "bg-gray-300"
                                }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${task.status === "Active" ? "translate-x-6" : "translate-x-1"
                                  }`}
                              />
                            </button>
                            <span className="ml-3 text-sm font-medium text-gray-700">
                              {task.status === "Active" ? (
                                <span className="flex items-center text-green-600">
                                  <CheckCircle size={16} className="mr-1" />
                                  Active
                                </span>
                              ) : (
                                <span className="flex items-center text-red-600">
                                  <XCircle size={16} className="mr-1" />
                                  Inactive
                                </span>
                              )}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Save Button - Fixed Position */}
      {selectedDepartment && selectedState && selectedCity && (
        <button
          onClick={handleSaveSettings}
          className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-full shadow-lg flex items-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
          disabled={saving}
        >
          {saving ? <Loader className="mr-2 animate-spin" size={20} /> : <Save className="mr-2" size={20} />}
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      )}

      {/* Custom Styles */}
      <style>{`
        .selected-department,
        .selected-state,
        .selected-city {
          background-color: #6da1ee !important;
          color: white;
        }
        
        .card {
          transition: all 0.3s ease;
        }
        
        .card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
        }
        
        .form-input:focus {
          box-shadow: 0 0 0 2px rgba(109, 161, 238, 0.2);
        }
      `}</style>
    </div>
  );
};

export default OverdueStatusSetting;
