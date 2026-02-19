import React, { useState, useEffect } from 'react';
import {
  Home, Settings, Users, Briefcase, Building, MapPin,
  DollarSign, Calendar, Clock, Award, FileText,
  Plus, X, Save, ChevronLeft, ChevronRight,
  Loader, CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getStates, getCities, getDistricts } from '../../../../services/locationApi';
import { getDepartments, getDesignationsByDepartment } from '../../../../services/masterApi';
import { getHRMSSettings, saveHRMSSettings } from '../../../../services/hrms/hrmsApi';
import toast from 'react-hot-toast';

const AdminHrmssettings = () => {
  const navigate = useNavigate();
  // Data States
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);

  // Selection States
  const [currentState, setCurrentState] = useState(null); // Objects
  const [currentCity, setCurrentCity] = useState(null); // Objects
  const [currentDistrict, setCurrentDistrict] = useState(null); // Objects
  const [currentDepartment, setCurrentDepartment] = useState(null); // Objects
  const [currentPosition, setCurrentPosition] = useState(null); // Objects (Designation)

  const [activeTab, setActiveTab] = useState('payroll');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSettings, setSavedSettings] = useState(null);

  // Form States
  const [skills, setSkills] = useState(['']);
  const [payrollForm, setPayrollForm] = useState({
    payrollType: 'monthly',
    payrollSalary: '',
    peCheck: false,
    peInput: '',
    esicCheck: false,
    esicInput: '',
    performanceLoginTime: '',
    performanceWorkingHours: 8,
    payrollLeaves: '',
    payrollPerks: '',
    payrollBenefits: '',
    payrollEsops: 'eligible',
    activeCpField: '',
    salaryIncrement: '',
    cpOnboardingGoal: '30'
  });

  const [recruitmentForm, setRecruitmentForm] = useState({
    recruitmentProbation: '',
    recruitmentTraining: ''
  });

  const [performanceForm, setPerformanceForm] = useState({
    performanceEfficiency: '',
    performanceAttendance: '',
    performanceLeaveImpact: '',
    performanceOverdue: '',
    performanceProductivity: '',
    performanceBreakTime: '',
    performanceIdealTime: '3'
  });

  const [vacancyForm, setVacancyForm] = useState({
    vacancyCount: '',
    vacancyExperience: '',
    vacancyEducation: '',
    vacancyCertifications: '',
    vacancyDeadline: '',
    vacancyJobType: 'fulltime',
    vacancyDescription: '',
    vacancyResponsibilities: ''
  });

  // Fetch Initial Data (States & Departments)
  useEffect(() => {
    // ... existing initial data fetch ...
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        const [statesData, departmentsData] = await Promise.all([
          getStates(),
          getDepartments()
        ]);
        setStates(statesData);
        setDepartments(departmentsData);
      } catch (error) {
        console.error("Error fetching initial data:", error);
        toast.error("Failed to load initial data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // ... other useEffects for Location ...

  // Load Settings Function
  const loadSettings = async () => {
    if (currentDepartment?._id && currentPosition?.name) {
      try {
        const response = await getHRMSSettings({
          department: currentDepartment._id,
          position: currentPosition.name
        });

        if (response.data && response.data.length > 0) {
          setSavedSettings(response.data[0]);
          // populateForms(response.data[0]); // Disabled to prevent pre-fill
        } else {
          setSavedSettings(null);
          resetForms();
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
        toast.error("Failed to load settings");
      }
    }
  };

  // Fetch Settings when Position (Designation) selected
  useEffect(() => {
    loadSettings();
  }, [currentDepartment, currentPosition]);

  // Fetch Cities when State changes
  useEffect(() => {
    if (currentState?._id) {
      const fetchCities = async () => {
        try {
          const data = await getCities(currentState._id);
          setCities(data);
        } catch (error) {
          console.error("Error fetching cities:", error);
          toast.error("Failed to load cities");
        }
      };
      fetchCities();
    } else {
      setCities([]);
    }
  }, [currentState]);

  // Fetch Districts when City changes
  useEffect(() => {
    if (currentCity?._id) {
      const fetchDistricts = async () => {
        try {
          const data = await getDistricts(currentCity._id);
          setDistricts(data);
        } catch (error) {
          console.error("Error fetching districts:", error);
          toast.error("Failed to load districts");
        }
      };
      fetchDistricts();
    } else {
      setDistricts([]);
    }
  }, [currentCity]);

  // Fetch Designations when Department changes
  useEffect(() => {
    if (currentDepartment?._id) {
      const fetchDesignations = async () => {
        try {
          const data = await getDesignationsByDepartment(currentDepartment._id);
          setDesignations(data);
        } catch (error) {
          console.error("Error fetching designations:", error);
          toast.error("Failed to load positions");
        }
      };
      fetchDesignations();
    } else {
      setDesignations([]);
    }
  }, [currentDepartment]);

  const populateForms = (settings) => {
    if (settings.payroll) {
      setPayrollForm({
        payrollType: settings.payroll.payrollType || 'monthly',
        payrollSalary: settings.payroll.salary || '',
        peCheck: settings.payroll.peCheck || false,
        peInput: settings.payroll.peInput || '',
        esicCheck: settings.payroll.esicCheck || false,
        esicInput: settings.payroll.esicInput || '',
        performanceLoginTime: settings.payroll.performanceLoginTime || '',
        performanceWorkingHours: settings.payroll.performanceWorkingHours || 8,
        payrollLeaves: settings.payroll.leaves || '',
        payrollPerks: settings.payroll.perks || '',
        payrollBenefits: settings.payroll.benefits || '',
        payrollEsops: settings.payroll.esops || 'eligible',
        activeCpField: settings.payroll.activeCpField || '',
        salaryIncrement: settings.payroll.salaryIncrement || '',
        cpOnboardingGoal: settings.payroll.cpOnboardingGoal || '30'
      });
    }

    if (settings.recruitment) {
      setRecruitmentForm({
        recruitmentProbation: settings.recruitment.probation || '',
        recruitmentTraining: settings.recruitment.training || ''
      });
    }

    if (settings.performance) {
      setPerformanceForm({
        performanceEfficiency: settings.performance.efficiencyFormula || '',
        performanceAttendance: settings.performance.attendanceReq || '',
        performanceLeaveImpact: settings.performance.leaveImpact || '',
        performanceOverdue: settings.performance.overdueImpact || '',
        performanceProductivity: settings.performance.productivity || '',
        performanceBreakTime: settings.performance.breakTime || '',
        performanceIdealTime: settings.performance.idealTime || '3'
      });
    }

    if (settings.vacancy) {
      setVacancyForm({
        vacancyCount: settings.vacancy.count || '',
        vacancyExperience: settings.vacancy.experience || '',
        vacancyEducation: settings.vacancy.education || '',
        vacancyCertifications: settings.vacancy.certifications || '',
        vacancyDeadline: settings.vacancy.deadline ? new Date(settings.vacancy.deadline).toISOString().split('T')[0] : '',
        vacancyJobType: settings.vacancy.jobType || 'fulltime',
        vacancyDescription: settings.vacancy.description || '',
        vacancyResponsibilities: settings.vacancy.responsibilities || ''
      });
      setSkills(settings.vacancy.skills && settings.vacancy.skills.length > 0 ? settings.vacancy.skills : ['']);
    }
  };

  const resetForms = () => {
    setPayrollForm({
      payrollType: 'monthly',
      payrollSalary: '',
      peCheck: false,
      peInput: '',
      esicCheck: false,
      esicInput: '',
      performanceLoginTime: '',
      performanceWorkingHours: 8,
      payrollLeaves: '',
      payrollPerks: '',
      payrollBenefits: '',
      payrollEsops: 'eligible',
      activeCpField: '',
      salaryIncrement: '',
      cpOnboardingGoal: '30'
    });
    setRecruitmentForm({
      recruitmentProbation: '',
      recruitmentTraining: ''
    });
    setPerformanceForm({
      performanceEfficiency: '',
      performanceAttendance: '',
      performanceLeaveImpact: '',
      performanceOverdue: '',
      performanceProductivity: '',
      performanceBreakTime: '',
      performanceIdealTime: '3'
    });
    setVacancyForm({
      vacancyCount: '',
      vacancyExperience: '',
      vacancyEducation: '',
      vacancyCertifications: '',
      vacancyDeadline: '',
      vacancyJobType: 'fulltime',
      vacancyDescription: '',
      vacancyResponsibilities: ''
    });
    setSkills(['']);
  };

  // Handlers
  const handleStateSelect = (state) => {
    setCurrentState(state);
    setCurrentCity(null);
    setCurrentDistrict(null);
  };

  const handleCitySelect = (city) => {
    setCurrentCity(city);
    setCurrentDistrict(null);
  };

  const handleDistrictSelect = (district) => {
    setCurrentDistrict(district);
  };

  const handleDepartmentSelect = (department) => {
    setCurrentDepartment(department);
    setCurrentPosition(null);
    setActiveTab('payroll');
  };

  const handlePositionSelect = (position) => {
    setCurrentPosition(position);
  };

  const addSkillField = () => setSkills([...skills, '']);

  const removeSkillField = (index) => {
    const newSkills = skills.filter((_, i) => i !== index);
    setSkills(newSkills.length > 0 ? newSkills : ['']);
  };

  const handleSkillChange = (index, value) => {
    const newSkills = [...skills];
    newSkills[index] = value;
    setSkills(newSkills);
  };

  // SAVE HANDLER
  const handleSaveAll = async (e) => {
    if (e) e.preventDefault();

    if (!currentDepartment || !currentPosition) {
      toast.error("Please select a department and position first");
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        department: currentDepartment._id,
        position: currentPosition.name,
        payroll: {
          payrollType: payrollForm.payrollType,
          salary: payrollForm.payrollSalary,
          peCheck: payrollForm.peCheck,
          peInput: payrollForm.peInput,
          esicCheck: payrollForm.esicCheck,
          esicInput: payrollForm.esicInput,
          performanceLoginTime: payrollForm.performanceLoginTime,
          performanceWorkingHours: payrollForm.performanceWorkingHours,
          leaves: payrollForm.payrollLeaves,
          perks: payrollForm.payrollPerks,
          benefits: payrollForm.payrollBenefits,
          esops: payrollForm.payrollEsops,
          activeCpField: payrollForm.activeCpField,
          salaryIncrement: payrollForm.salaryIncrement,
          cpOnboardingGoal: payrollForm.cpOnboardingGoal
        },
        recruitment: {
          probation: recruitmentForm.recruitmentProbation,
          training: recruitmentForm.recruitmentTraining
        },
        performance: {
          efficiencyFormula: performanceForm.performanceEfficiency,
          attendanceReq: performanceForm.performanceAttendance,
          leaveImpact: performanceForm.performanceLeaveImpact,
          overdueImpact: performanceForm.performanceOverdue,
          productivity: performanceForm.performanceProductivity,
          breakTime: performanceForm.performanceBreakTime,
          idealTime: performanceForm.performanceIdealTime
        },
        vacancy: {
          count: vacancyForm.vacancyCount,
          experience: vacancyForm.vacancyExperience,
          skills: skills.filter(s => s.trim() !== ''),
          education: vacancyForm.vacancyEducation,
          certifications: vacancyForm.vacancyCertifications,
          deadline: vacancyForm.vacancyDeadline,
          jobType: vacancyForm.vacancyJobType,
          description: vacancyForm.vacancyDescription,
          responsibilities: vacancyForm.vacancyResponsibilities
        }
      };

      const response = await saveHRMSSettings(payload);
      console.log("Data successfully stored in DB:", response.data);
      await loadSettings(); // Refresh saved settings display
      resetForms(); // Clear form fields
      setShowSuccessModal(true); // Show Success Modal
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error(typeof error === 'string' ? error : "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const getDepartmentCardClass = (deptId) => {
    const baseClasses = "card text-white text-center p-3 department-card transition-all duration-300 hover:scale-105 cursor-pointer ";
    // Check selection by ID
    if (currentDepartment?._id === deptId) {
      return baseClasses + "ring-4 ring-blue-400 bg-gradient-to-br from-blue-500 to-blue-700";
    }
    // Default style
    return baseClasses + "bg-gradient-to-br from-[#8a8884] to-[#a3a09b]";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mb-6">
        <nav className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center">
            <Settings className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-800">Admin HRMS Settings</h1>
          </div>
        </nav>
      </div>

      <div className="container mx-auto px-4">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <Loader className="w-10 h-10 text-white animate-spin" />
          </div>
        )}

        {/* State Selection */}
        <div className="location-section mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">Select State</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {states.map((state) => (
              <div
                key={state._id}
                className={`bg-gradient-to-br from-blue-500 to-blue-700 text-white text-center p-4 rounded-lg shadow-md transition-all duration-300 hover:scale-105 cursor-pointer ${currentState?._id === state._id ? 'ring-4 ring-blue-400' : ''}`}
                onClick={() => handleStateSelect(state)}
              >
                <Building className="w-8 h-8 mx-auto mb-2" />
                <h6 className="font-medium">{state.name}</h6>
              </div>
            ))}
            {states.length === 0 && !isLoading && <p className="text-gray-500 italic">No states found.</p>}
          </div>
        </div>

        {/* City Selection */}
        {currentState && (
          <div className="location-section mb-8">
            <div className="flex items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                Select a City in <span className="text-blue-600">{currentState.name}</span>
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {cities.map((city) => (
                <div
                  key={city._id}
                  className={`bg-gradient-to-br from-orange-500 to-orange-700 text-white text-center p-4 rounded-lg shadow-md transition-all duration-300 hover:scale-105 cursor-pointer ${currentCity?._id === city._id ? 'ring-4 ring-orange-400' : ''}`}
                  onClick={() => handleCitySelect(city)}
                >
                  <MapPin className="w-8 h-8 mx-auto mb-2" />
                  <h6 className="font-medium">{city.name}</h6>
                </div>
              ))}
              {cities.length === 0 && !isLoading && <p className="text-gray-500 italic">No cities found.</p>}
            </div>
          </div>
        )}

        {/* District Selection */}
        {currentCity && (
          <div className="location-section mb-8">
            <div className="flex items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                Select a District in <span className="text-blue-600">{currentCity.name}</span>
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {districts.map((district) => (
                <div
                  key={district._id}
                  className={`bg-gradient-to-br from-purple-500 to-purple-700 text-white text-center p-4 rounded-lg shadow-md transition-all duration-300 hover:scale-105 cursor-pointer ${currentDistrict?._id === district._id ? 'ring-4 ring-purple-400' : ''}`}
                  onClick={() => handleDistrictSelect(district)}
                >
                  <MapPin className="w-8 h-8 mx-auto mb-2" />
                  <h6 className="font-medium">{district.name}</h6>
                </div>
              ))}
              {districts.length === 0 && !isLoading && <p className="text-gray-500 italic">No districts found.</p>}
            </div>
          </div>
        )}

        {/* Department Selection */}
        <div className="location-section mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">Select a Department</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {departments.map((dept) => (
              <div
                key={dept._id}
                className={getDepartmentCardClass(dept._id)}
                onClick={() => handleDepartmentSelect(dept)}
              >
                <Users className="w-8 h-8 mx-auto mb-2" />
                <h6 className="font-medium">{dept.name}</h6>
              </div>
            ))}
            {departments.length === 0 && !isLoading && <p className="text-gray-500 italic">No departments found.</p>}
          </div>
        </div>

        {/* Position Selection */}
        {currentDepartment && (
          <div className="location-section mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">Select a Position</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {designations.map((pos) => (
                <div
                  key={pos._id}
                  className={`bg-gradient-to-br from-blue-500 to-blue-700 text-white text-center p-4 rounded-lg shadow-md transition-all duration-300 hover:scale-105 cursor-pointer ${currentPosition?._id === pos._id ? 'ring-4 ring-blue-400' : ''}`}
                  onClick={() => handlePositionSelect(pos)}
                >
                  <Briefcase className="w-8 h-8 mx-auto mb-2" />
                  <h6 className="font-medium">{pos.name}</h6>
                </div>
              ))}
              {designations.length === 0 && !isLoading && <p className="text-gray-500 italic">No positions found for this department.</p>}
            </div>
          </div>
        )}

        {/* Department Settings Form */}
        {currentDepartment && currentPosition && (
          <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-2xl font-bold text-blue-600">
                {currentDepartment.name} Settings - {currentPosition.name}
              </h4>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex flex-wrap -mb-px">
                {['payroll', 'recruitment', 'performance', 'vacancy', 'test'].map((tab) => (
                  <button
                    key={tab}
                    className={`mr-4 py-2 px-4 font-medium text-sm border-b-2 transition-colors ${activeTab === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)} Settings
                  </button>
                ))}
              </nav>
            </div>

            <div className="mt-6">
              {/* Payroll Settings */}
              {activeTab === 'payroll' && (
                <form onSubmit={handleSaveAll}>
                  {/* CPRM Specific Fields - Dynamic check loosely based on name or code if available */}
                  {currentDepartment.name.toLowerCase().includes('cprm') && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Number Of Active CP</label>
                          <input
                            type="number"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={payrollForm.activeCpField}
                            onChange={(e) => setPayrollForm({ ...payrollForm, activeCpField: e.target.value })}
                            placeholder="Enter Number Of active CP"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Salary Increment</label>
                          <input
                            type="number"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={payrollForm.salaryIncrement}
                            onChange={(e) => setPayrollForm({ ...payrollForm, salaryIncrement: e.target.value })}
                            placeholder="e.g., 5000"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">CP Onboarding Goal</label>
                          <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={payrollForm.cpOnboardingGoal}
                            onChange={(e) => setPayrollForm({ ...payrollForm, cpOnboardingGoal: e.target.value })}
                          >
                            <option value="30">30</option>
                            <option value="60">60</option>
                            <option value="90">90</option>
                          </select>
                        </div>
                      </div>
                      <hr className="my-6" />
                    </>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Payroll Type</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={payrollForm.payrollType}
                        onChange={(e) => setPayrollForm({ ...payrollForm, payrollType: e.target.value })}
                      >
                        <option value="monthly">Monthly</option>
                        <option value="hourly">Hourly</option>
                        <option value="commisionbased">Commission Based</option>
                        <option value="hybrid">Hybrid</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Salary Range (₹)</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={payrollForm.payrollSalary}
                        onChange={(e) => setPayrollForm({ ...payrollForm, payrollSalary: e.target.value })}
                        placeholder="e.g. 30,000 - 50,000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Govt Tax Deduction</label>
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            className="mr-2"
                            checked={payrollForm.peCheck}
                            onChange={(e) => setPayrollForm({ ...payrollForm, peCheck: e.target.checked })}
                          />
                          <label className="mr-2">PE (%)</label>
                          <input
                            type="number"
                            className="w-24 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={payrollForm.peInput}
                            onChange={(e) => setPayrollForm({ ...payrollForm, peInput: e.target.value })}
                            placeholder="e.g. 12"
                          />
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            className="mr-2"
                            checked={payrollForm.esicCheck}
                            onChange={(e) => setPayrollForm({ ...payrollForm, esicCheck: e.target.checked })}
                          />
                          <label className="mr-2">ESIC (%)</label>
                          <input
                            type="number"
                            className="w-24 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={payrollForm.esicInput}
                            onChange={(e) => setPayrollForm({ ...payrollForm, esicInput: e.target.value })}
                            placeholder="e.g. 1.75"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Login Time Requirement (HH:MM)</label>
                      <input
                        type="time"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={payrollForm.performanceLoginTime}
                        onChange={(e) => setPayrollForm({ ...payrollForm, performanceLoginTime: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Set Minimum Working Hours</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={payrollForm.performanceWorkingHours}
                        onChange={(e) => setPayrollForm({ ...payrollForm, performanceWorkingHours: e.target.value })}
                        min="1"
                        max="24"
                        step="1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Paid Leave</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={payrollForm.payrollLeaves}
                        onChange={(e) => setPayrollForm({ ...payrollForm, payrollLeaves: e.target.value })}
                        placeholder="e.g. 2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Perks</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={payrollForm.payrollPerks}
                        onChange={(e) => setPayrollForm({ ...payrollForm, payrollPerks: e.target.value })}
                        placeholder="e.g. Travel, Internet"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Benefits</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={payrollForm.payrollBenefits}
                        onChange={(e) => setPayrollForm({ ...payrollForm, payrollBenefits: e.target.value })}
                        placeholder="e.g. Health Insurance, PF"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">ESOPs Eligibility</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={payrollForm.payrollEsops}
                        onChange={(e) => setPayrollForm({ ...payrollForm, payrollEsops: e.target.value })}
                      >
                        <option value="eligible">Eligible</option>
                        <option value="noteligible">Not Eligible</option>
                        <option value="after1year">After 1 Year</option>
                      </select>
                    </div>
                  </div>

                  <div className="marginTop-6 text-right mt-6">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-6 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : 'Save Payroll Settings'}
                    </button>
                  </div>
                </form>
              )}

              {/* Recruitment Settings */}
              {activeTab === 'recruitment' && (
                <form onSubmit={handleSaveAll}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Probation Period (Months)</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={recruitmentForm.recruitmentProbation}
                        onChange={(e) => setRecruitmentForm({ ...recruitmentForm, recruitmentProbation: e.target.value })}
                        placeholder="e.g. 3"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Training Required</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={recruitmentForm.recruitmentTraining}
                        onChange={(e) => setRecruitmentForm({ ...recruitmentForm, recruitmentTraining: e.target.value })}
                        placeholder="e.g. Sales Training, Compliance"
                      />
                    </div>
                  </div>
                  <div className="marginTop-6 text-right mt-6">
                    <button type="submit" disabled={isSaving} className="px-6 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 disabled:opacity-50">
                      {isSaving ? 'Saving...' : 'Save Recruitment Settings'}
                    </button>
                  </div>
                </form>
              )}

              {/* Performance Settings */}
              {activeTab === 'performance' && (
                <form onSubmit={handleSaveAll}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Efficiency Formula</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={performanceForm.performanceEfficiency}
                        onChange={(e) => setPerformanceForm({ ...performanceForm, performanceEfficiency: e.target.value })}
                        placeholder="(Tasks/Target)*100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Attendance Req (%)</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={performanceForm.performanceAttendance}
                        onChange={(e) => setPerformanceForm({ ...performanceForm, performanceAttendance: e.target.value })}
                        placeholder="95"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Leave Impact (pts)</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={performanceForm.performanceLeaveImpact}
                        onChange={(e) => setPerformanceForm({ ...performanceForm, performanceLeaveImpact: e.target.value })}
                        placeholder="5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Overdue Impact (pts)</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={performanceForm.performanceOverdue}
                        onChange={(e) => setPerformanceForm({ ...performanceForm, performanceOverdue: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Productivity Target</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={performanceForm.performanceProductivity}
                        onChange={(e) => setPerformanceForm({ ...performanceForm, performanceProductivity: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Break Time (mins)</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={performanceForm.performanceBreakTime}
                        onChange={(e) => setPerformanceForm({ ...performanceForm, performanceBreakTime: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="marginTop-6 text-right mt-6">
                    <button type="submit" disabled={isSaving} className="px-6 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 disabled:opacity-50">
                      {isSaving ? 'Saving...' : 'Save Performance Settings'}
                    </button>
                  </div>
                </form>
              )}

              {/* Vacancy Settings */}
              {activeTab === 'vacancy' && (
                <form onSubmit={handleSaveAll}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Number of Vacancies</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={vacancyForm.vacancyCount}
                        onChange={(e) => setVacancyForm({ ...vacancyForm, vacancyCount: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Deadline</label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={vacancyForm.vacancyDeadline}
                        onChange={(e) => setVacancyForm({ ...vacancyForm, vacancyDeadline: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={vacancyForm.vacancyJobType}
                        onChange={(e) => setVacancyForm({ ...vacancyForm, vacancyJobType: e.target.value })}
                      >
                        <option value="fulltime">Full Time</option>
                        <option value="parttime">Part Time</option>
                        <option value="contract">Contract</option>
                        <option value="internship">Internship</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Required Skills</label>
                    {skills.map((skill, index) => (
                      <div key={index} className="flex mb-2">
                        <input
                          type="text"
                          className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md"
                          value={skill}
                          onChange={(e) => handleSkillChange(index, e.target.value)}
                          placeholder="e.g. React.js"
                        />
                        <button
                          type="button"
                          className="px-4 py-2 bg-red-500 text-white rounded-r-md hover:bg-red-600"
                          onClick={() => removeSkillField(index)}
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="mt-2 text-blue-600 hover:text-blue-800 flex items-center"
                      onClick={addSkillField}
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add Skill
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Experience (Years)</label>
                      <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={vacancyForm.vacancyExperience}
                        onChange={(e) => setVacancyForm({ ...vacancyForm, vacancyExperience: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Education</label>
                      <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={vacancyForm.vacancyEducation}
                        onChange={(e) => setVacancyForm({ ...vacancyForm, vacancyEducation: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="marginTop-6 text-right mt-6">
                    <button type="submit" disabled={isSaving} className="px-6 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 disabled:opacity-50">
                      {isSaving ? 'Saving...' : 'Save Vacancy Settings'}
                    </button>
                  </div>
                </form>
              )}

              {/* Test Settings - Placeholder to redirect */}
              {activeTab === 'test' && (
                <div className="text-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900">Manage Candidate Tests</h3>
                  <p className="text-gray-500 mb-4">Configure test questions and parameters for this position.</p>
                  <button
                    onClick={() => navigate('/admin/settings/hrms/candidate-test-setting')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    Go to Candidate Test Settings
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-sm w-full text-center shadow-xl transform transition-all scale-100">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Success!</h3>
              <p className="text-gray-600 mb-6">Settings have been saved successfully to the database.</p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminHrmssettings;