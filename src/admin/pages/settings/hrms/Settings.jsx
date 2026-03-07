import React, { useState, useEffect } from 'react';
import {
  Home, Settings, Users, Briefcase, Building, MapPin,
  DollarSign, Calendar, Clock, Award, FileText,
  Plus, X, Save, ChevronLeft, ChevronRight,
  Loader, CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getStates, getClustersHierarchy, getDistrictsHierarchy, getCountries } from '../../../../services/core/locationApi';
import { getDepartments, getRoles } from '../../../../services/core/masterApi';
import { getHRMSSettings, saveHRMSSettings } from '../../../../services/hrms/hrmsApi';
import toast from 'react-hot-toast';

const toId = (val) => (val && typeof val === 'object' ? val._id : val);

const AdminHrmssettings = () => {
  const navigate = useNavigate();
  // Data States
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [allRoles, setAllRoles] = useState([]);
  const [designations, setDesignations] = useState([]);

  // Selection States
  const [currentCountry, setCurrentCountry] = useState(null); // Objects
  const [currentState, setCurrentState] = useState(null); // Objects
  const [currentCluster, setCurrentCluster] = useState(null); // Objects
  const [currentDistrict, setCurrentDistrict] = useState(null); // Objects
  const [currentDepartment, setCurrentDepartment] = useState(null); // Objects
  const [currentPosition, setCurrentPosition] = useState(null); // Objects (Designation)

  const [savedSettingsList, setSavedSettingsList] = useState([]);
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
    recruitmentTraining: '',
    recruitmentPayrollType: 'monthly'
  });

  const [performanceForm, setPerformanceForm] = useState({
    performancePayrollType: 'monthly',
    performanceEfficiency: '',
    performanceAttendance: '',
    performanceLeaveImpact: '',
    performanceOverdue: '',
    performanceProductivity: '',
    performanceBreakTime: '',
    performanceIdealTime: '3',
    efficiencyDecreaseGrid: Array.from({ length: 10 }, (_, i) => ({
      range: `${i * 5 + 1}-${(i + 1) * 5}`,
      decrease: ''
    }))
  });

  const [testForm, setTestForm] = useState({
    selectedTests: []
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
        const [countriesData, rolesData] = await Promise.all([
          getCountries(),
          getRoles()
        ]);
        setCountries(countriesData || []);
        setAllRoles(rolesData?.data || []);

        // Set India as default country to ensure hierarchical filtering works
        if (countriesData && countriesData.length > 0) {
          const india = countriesData.find(c => c.name?.toLowerCase() === 'india') || countriesData[0];
          setCurrentCountry(india);
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
        toast.error("Failed to load initial data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // Fetch Departments and States when Country changes
  useEffect(() => {
    if (currentCountry?.name) {
      const fetchDataByCountry = async () => {
        try {
          const [statesData, departmentsData] = await Promise.all([
            getStates(currentCountry._id),
            getDepartments({ country: currentCountry.name })
          ]);
          setStates(statesData || []);
          setDepartments(departmentsData?.data || []);
        } catch (error) {
          console.error("Error fetching country data:", error);
          toast.error("Failed to load data for selected country");
        }
      };
      fetchDataByCountry();
    } else {
      setStates([]);
      setDepartments([]);
    }
  }, [currentCountry]);

  // ... other useEffects for Location ...

  // Load Settings Function
  const loadSettings = async () => {
    if (currentDepartment?._id && currentPosition?.name) {
      try {
        const response = await getHRMSSettings({
          department: currentDepartment._id,
          position: currentPosition.name
        });

        if (response.data) {
          setSavedSettingsList(response.data);
          // populateForms(response.data[0]); // Disabled to prevent pre-fill
        } else {
          setSavedSettingsList([]);
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

  // Fetch Clusters when State changes
  useEffect(() => {
    if (currentState?._id) {
      const fetchClusters = async () => {
        try {
          const data = await getClustersHierarchy(currentState._id);
          setClusters(data || []);
        } catch (error) {
          console.error("Error fetching clusters:", error);
          toast.error("Failed to load clusters");
        }
      };
      fetchClusters();
    } else {
      setClusters([]);
    }
  }, [currentState]);

  // Fetch Districts when Cluster changes
  useEffect(() => {
    if (currentCluster?._id) {
      const fetchDistricts = async () => {
        try {
          const data = await getDistrictsHierarchy(currentCluster._id);
          setDistricts(data || []);
        } catch (error) {
          console.error("Error fetching districts:", error);
          toast.error("Failed to load districts");
        }
      };
      fetchDistricts();
    } else {
      setDistricts([]);
    }
  }, [currentCluster]);

  // Filter Designations (Positions) when Department or Location changes
  useEffect(() => {
    if (currentDepartment?._id) {
      // Filter roles by Department AND Location
      const filtered = allRoles.filter(role => {
        const matchesDept = toId(role.department) === currentDepartment._id;

        const roleCountryId = toId(role.country);
        const roleStateId = toId(role.state);
        const roleClusterId = toId(role.cluster);
        const roleDistrictId = toId(role.district);

        const selCountryId = currentCountry?._id;
        const selStateId = currentState?._id;
        const selClusterId = currentCluster?._id;
        const selDistrictId = currentDistrict?._id;

        // Hierarchical Location Matching Rules (Case-Insensitive):
        const roleLevel = role.level?.toLowerCase();

        // 1. If role is at Country level -> Show if it matches selected Country (or if no country selected yet)
        if (roleLevel === 'country') {
          return matchesDept && (!selCountryId || roleCountryId === selCountryId);
        }

        // 2. If role is at State level -> Show if it matches selected Country AND (no state selected OR matches selected State)
        if (roleLevel === 'state') {
          return matchesDept &&
            (!selCountryId || roleCountryId === selCountryId) &&
            (!selStateId || roleStateId === selStateId);
        }

        // 3. If role is at Cluster level -> Show if matches Country + State AND (no cluster selected OR matches selected Cluster)
        if (roleLevel === 'cluster') {
          return matchesDept &&
            (!selCountryId || roleCountryId === selCountryId) &&
            (!selStateId || roleStateId === selStateId) &&
            (!selClusterId || roleClusterId === selClusterId);
        }

        // 4. If role is at District level -> Show if matches Country + State + Cluster AND (no district selected OR matches selected District)
        if (roleLevel === 'district') {
          return matchesDept &&
            (!selCountryId || roleCountryId === selCountryId) &&
            (!selStateId || roleStateId === selStateId) &&
            (!selClusterId || roleClusterId === selClusterId) &&
            (!selDistrictId || roleDistrictId === selDistrictId);
        }

        // Default fallback (should not hit if level is one of the above)
        return matchesDept &&
          (!selCountryId || roleCountryId === selCountryId) &&
          (!selStateId || roleStateId === selStateId) &&
          (!selClusterId || roleClusterId === selClusterId) &&
          (!selDistrictId || roleDistrictId === selDistrictId);
      });
      setDesignations(filtered);
    } else {
      setDesignations([]);
    }
  }, [currentDepartment, currentCountry, currentState, currentCluster, currentDistrict, allRoles]);

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
        recruitmentTraining: settings.recruitment.training || '',
        recruitmentPayrollType: settings.recruitment.payrollType || 'monthly'
      });
    }

    if (settings.performance) {
      const defaultGrid = Array.from({ length: 10 }, (_, i) => ({
        range: `${i * 5 + 1}-${(i + 1) * 5}`,
        decrease: ''
      }));
      setPerformanceForm({
        performancePayrollType: settings.performance.payrollType || 'monthly',
        performanceEfficiency: settings.performance.efficiencyFormula || '',
        performanceAttendance: settings.performance.attendanceReq || '',
        performanceLeaveImpact: settings.performance.leaveImpact || '',
        performanceOverdue: settings.performance.overdueImpact || '',
        performanceProductivity: settings.performance.productivity || '',
        performanceBreakTime: settings.performance.breakTime || '',
        performanceIdealTime: settings.performance.idealTime || '3',
        efficiencyDecreaseGrid: settings.performance.efficiencyDecreaseGrid?.length === 10
          ? settings.performance.efficiencyDecreaseGrid
          : defaultGrid
      });
    }

    if (settings.test) {
      setTestForm({
        selectedTests: settings.test.selectedTests || []
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
      recruitmentTraining: '',
      recruitmentPayrollType: 'monthly'
    });
    setPerformanceForm({
      performancePayrollType: 'monthly',
      performanceEfficiency: '',
      performanceAttendance: '',
      performanceLeaveImpact: '',
      performanceOverdue: '',
      performanceProductivity: '',
      performanceBreakTime: '',
      performanceIdealTime: '3',
      efficiencyDecreaseGrid: Array.from({ length: 10 }, (_, i) => ({
        range: `${i * 5 + 1}-${(i + 1) * 5}`,
        decrease: ''
      }))
    });
    setTestForm({
      selectedTests: []
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
  const handleCountrySelect = (country) => {
    setCurrentCountry(country);
    setCurrentState(null);
    setCurrentCluster(null);
    setCurrentDistrict(null);
  };

  const handleStateSelect = (state) => {
    setCurrentState(state);
    setCurrentCluster(null);
    setCurrentDistrict(null);
  };

  const handleClusterSelect = (cluster) => {
    setCurrentCluster(cluster);
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
        settingType: activeTab,
      };

      if (activeTab === 'payroll') {
        payload.payroll = {
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
        };
      } else if (activeTab === 'recruitment') {
        payload.recruitment = {
          probation: recruitmentForm.recruitmentProbation,
          training: recruitmentForm.recruitmentTraining,
          payrollType: recruitmentForm.recruitmentPayrollType
        };
      } else if (activeTab === 'performance') {
        payload.performance = {
          payrollType: performanceForm.performancePayrollType,
          efficiencyFormula: performanceForm.performanceEfficiency,
          attendanceReq: performanceForm.performanceAttendance,
          leaveImpact: performanceForm.performanceLeaveImpact,
          overdueImpact: performanceForm.performanceOverdue,
          productivity: performanceForm.performanceProductivity,
          breakTime: performanceForm.performanceBreakTime,
          idealTime: performanceForm.performanceIdealTime,
          efficiencyDecreaseGrid: performanceForm.efficiencyDecreaseGrid
        };
      } else if (activeTab === 'vacancy') {
        payload.vacancy = {
          count: vacancyForm.vacancyCount,
          experience: vacancyForm.vacancyExperience,
          skills: skills.filter(s => s.trim() !== ''),
          education: vacancyForm.vacancyEducation,
          certifications: vacancyForm.vacancyCertifications,
          deadline: vacancyForm.vacancyDeadline,
          jobType: vacancyForm.vacancyJobType,
          description: vacancyForm.vacancyDescription,
          responsibilities: vacancyForm.vacancyResponsibilities
        };
      } else if (activeTab === 'test') {
        payload.test = {
          selectedTests: testForm.selectedTests
        };
      }

      const response = await saveHRMSSettings(payload);
      await loadSettings(); // Refresh saved settings display
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

        {/* Country Selection */}
        <div className="location-section mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">Select a Country</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {countries.map((country) => (
              <div
                key={country._id}
                className={`bg-gradient-to-br from-blue-600 to-blue-800 text-white text-center p-4 rounded-lg shadow-md transition-all duration-300 hover:scale-105 cursor-pointer ${currentCountry?._id === country._id ? 'ring-4 ring-blue-400' : ''}`}
                onClick={() => handleCountrySelect(country)}
              >
                <Home className="w-8 h-8 mx-auto mb-2" />
                <h6 className="font-medium">{country.name}</h6>
              </div>
            ))}
            {countries.length === 0 && !isLoading && <p className="text-gray-500 italic">No countries found.</p>}
          </div>
        </div>

        {/* State Selection */}
        {currentCountry && (
          <div className="location-section mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
              Select a State in <span className="text-blue-600">{currentCountry.name}</span>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {states.map((state) => (
                <div
                  key={state._id}
                  className={`bg-gradient-to-br from-indigo-500 to-indigo-700 text-white text-center p-4 rounded-lg shadow-md transition-all duration-300 hover:scale-105 cursor-pointer ${currentState?._id === state._id ? 'ring-4 ring-indigo-400' : ''}`}
                  onClick={() => handleStateSelect(state)}
                >
                  <MapPin className="w-8 h-8 mx-auto mb-2" />
                  <h6 className="font-medium">{state.name}</h6>
                </div>
              ))}
              {states.length === 0 && !isLoading && <p className="text-gray-500 italic">No states found.</p>}
            </div>
          </div>
        )}

        {/* Cluster Selection */}
        {currentState && (
          <div className="location-section mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
              Select a Cluster in <span className="text-blue-600">{currentState.name}</span>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {clusters.map((cluster) => (
                <div
                  key={cluster._id}
                  className={`bg-gradient-to-br from-orange-500 to-orange-700 text-white text-center p-4 rounded-lg shadow-md transition-all duration-300 hover:scale-105 cursor-pointer ${currentCluster?._id === cluster._id ? 'ring-4 ring-orange-400' : ''}`}
                  onClick={() => handleClusterSelect(cluster)}
                >
                  <MapPin className="w-8 h-8 mx-auto mb-2" />
                  <h6 className="font-medium">{cluster.name}</h6>
                </div>
              ))}
              {clusters.length === 0 && !isLoading && <p className="text-gray-500 italic">No clusters found.</p>}
            </div>
          </div>
        )}

        {/* District Selection */}
        {currentCluster && (
          <div className="location-section mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
              Select a District in <span className="text-blue-600">{currentCluster.name}</span>
            </h3>
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
            {Array.isArray(departments) && departments.map((dept) => (
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
              {Array.isArray(designations) && designations.map((pos) => (
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

                  <div className="marginTop-6 text-right mt-6 mb-8">
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

              {/* Saved Payroll Settings Summary Cards */}
              {activeTab === 'payroll' && savedSettingsList.filter(s => s.settingType === 'payroll').length > 0 && (
                <div className="space-y-4 mt-6">
                  <h4 className="text-xl font-bold text-gray-800 border-b pb-2">Saved Payroll Configurations</h4>
                  {savedSettingsList.filter(s => s.settingType === 'payroll').map((settings, index) => (
                    <div key={settings._id || index} className="bg-blue-50 border-l-4 border-blue-500 rounded p-6 shadow-sm relative transition-all hover:shadow-md">
                      <div className="absolute top-2 right-4 text-[10px] text-gray-400 font-mono">
                        Saved: {new Date(settings.createdAt).toLocaleString()}
                      </div>
                      <h4 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2 text-green-600" /> Card #{savedSettingsList.filter(s => s.settingType === 'payroll').length - index}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-700">
                        <div>
                          <p className="font-semibold text-gray-500 text-xs">Payroll Type</p>
                          <p className="font-medium capitalize">{settings.payroll.payrollType || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-500 text-xs">Salary Range</p>
                          <p className="font-medium">{settings.payroll.salary || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-500 text-xs">Working Hours</p>
                          <p className="font-medium">{settings.payroll.performanceWorkingHours ? `${settings.payroll.performanceWorkingHours} hrs` : 'N/A'}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-500 text-xs">Login Time</p>
                          <p className="font-medium">{settings.payroll.performanceLoginTime || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-500 text-xs">ESOPs</p>
                          <p className="font-medium capitalize">{settings.payroll.esops || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-500 text-xs">Monthly Leaves</p>
                          <p className="font-medium">{settings.payroll.leaves || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-500 text-xs">PE Tax (%)</p>
                          <p className="font-medium">{settings.payroll.peCheck ? `${settings.payroll.peInput}%` : 'Disabled'}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-500 text-xs">ESIC Tax (%)</p>
                          <p className="font-medium">{settings.payroll.esicCheck ? `${settings.payroll.esicInput}%` : 'Disabled'}</p>
                        </div>
                        {settings.payroll.activeCpField && (
                          <div>
                            <p className="font-semibold text-gray-500 text-xs">Active CP Goal</p>
                            <p className="font-medium">{settings.payroll.activeCpField}</p>
                          </div>
                        )}
                        {settings.payroll.salaryIncrement && (
                          <div>
                            <p className="font-semibold text-gray-500 text-xs">Salary Increment</p>
                            <p className="font-medium">{settings.payroll.salaryIncrement}</p>
                          </div>
                        )}
                        {settings.payroll.cpOnboardingGoal && (
                          <div>
                            <p className="font-semibold text-gray-500 text-xs">CP Onboarding Goal</p>
                            <p className="font-medium">{settings.payroll.cpOnboardingGoal}</p>
                          </div>
                        )}
                        <div className="md:col-span-2">
                          <p className="font-semibold text-gray-500 text-xs">Perks</p>
                          <p className="font-medium">{settings.payroll.perks || 'N/A'}</p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="font-semibold text-gray-500 text-xs">Benefits</p>
                          <p className="font-medium">{settings.payroll.benefits || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Recruitment Settings */}
              {activeTab === 'recruitment' && (
                <form onSubmit={handleSaveAll}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Payroll Type</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={recruitmentForm.recruitmentPayrollType}
                        onChange={(e) => setRecruitmentForm({ ...recruitmentForm, recruitmentPayrollType: e.target.value })}
                      >
                        <option value="monthly">Monthly</option>
                        <option value="hourly">Hourly</option>
                        <option value="commisionbased">Commission Based</option>
                        <option value="hybrid">Hybrid</option>
                      </select>
                    </div>
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
                  <div className="marginTop-6 text-right mt-6 mb-8">
                    <button type="submit" disabled={isSaving} className="px-6 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 disabled:opacity-50">
                      {isSaving ? 'Saving...' : 'Save Recruitment Settings'}
                    </button>
                  </div>
                </form>
              )}

              {/* Saved Recruitment Settings Summary Cards */}
              {activeTab === 'recruitment' && savedSettingsList.filter(s => s.settingType === 'recruitment').length > 0 && (
                <div className="space-y-4 mt-6">
                  <h4 className="text-xl font-bold text-gray-800 border-b pb-2">Saved Recruitment Configurations</h4>
                  {savedSettingsList.filter(s => s.settingType === 'recruitment').map((settings, index) => (
                    <div key={settings._id || index} className="bg-blue-50 border-l-4 border-blue-500 rounded p-6 shadow-sm relative transition-all hover:shadow-md">
                      <div className="absolute top-2 right-4 text-[10px] text-gray-400 font-mono">
                        Saved: {new Date(settings.createdAt).toLocaleString()}
                      </div>
                      <h4 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2 text-green-600" /> Card #{savedSettingsList.filter(s => s.settingType === 'recruitment').length - index}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
                        <div>
                          <p className="font-semibold text-gray-500 text-xs">Payroll Type</p>
                          <p className="font-medium capitalize">{settings.recruitment.payrollType || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-500 text-xs">Probation Period</p>
                          <p className="font-medium">{settings.recruitment.probation ? `${settings.recruitment.probation} Months` : 'N/A'}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-500 text-xs">Training</p>
                          <p className="font-medium">{settings.recruitment.training || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Performance Settings */}
              {activeTab === 'performance' && (
                <form onSubmit={handleSaveAll}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Column 1 */}
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Payroll Type</label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={performanceForm.performancePayrollType}
                          onChange={(e) => setPerformanceForm({ ...performanceForm, performancePayrollType: e.target.value })}
                        >
                          <option value="monthly">Monthly</option>
                          <option value="hourly">Hourly</option>
                          <option value="commisionbased">Commission Based</option>
                          <option value="hybrid">Hybrid</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Attendance Required (%)</label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          value={performanceForm.performanceAttendance}
                          onChange={(e) => setPerformanceForm({ ...performanceForm, performanceAttendance: e.target.value })}
                          placeholder="95"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Overdue Task Impact (%)</label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          value={performanceForm.performanceOverdue}
                          onChange={(e) => setPerformanceForm({ ...performanceForm, performanceOverdue: e.target.value })}
                          placeholder="e.g. 5%"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Break Time Allowed (in minutes)</label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          value={performanceForm.performanceBreakTime}
                          onChange={(e) => setPerformanceForm({ ...performanceForm, performanceBreakTime: e.target.value })}
                          placeholder="30"
                        />
                      </div>
                    </div>

                    {/* Column 2 */}
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Efficiency Score Formula</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          value={performanceForm.performanceEfficiency}
                          onChange={(e) => setPerformanceForm({ ...performanceForm, performanceEfficiency: e.target.value })}
                          placeholder="(TasksCompleted/Target)*100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Unauthorized Leave Impact (%)</label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          value={performanceForm.performanceLeaveImpact}
                          onChange={(e) => setPerformanceForm({ ...performanceForm, performanceLeaveImpact: e.target.value })}
                          placeholder="5"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Productivity Target (%)</label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          value={performanceForm.performanceProductivity}
                          onChange={(e) => setPerformanceForm({ ...performanceForm, performanceProductivity: e.target.value })}
                          placeholder="90"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Set Productivity Ideal Time (in minutes)</label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          value={performanceForm.performanceIdealTime}
                          onChange={(e) => setPerformanceForm({ ...performanceForm, performanceIdealTime: e.target.value })}
                          placeholder="3"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Efficiency Decrease Grid */}
                  <div className="mb-6">
                    <h4 className="text-center font-semibold text-blue-600 mb-4">Efficiency Decrease Based on Overdue Tasks</h4>
                    <div className="border rounded-md overflow-hidden">
                      <div className="grid grid-cols-2 bg-blue-400 text-white font-medium text-sm">
                        <div className="p-3 border-r border-blue-300">Overdue Task Range</div>
                        <div className="p-3">Efficiency Decrease (%)</div>
                      </div>
                      {performanceForm.efficiencyDecreaseGrid.map((row, index) => (
                        <div key={index} className="grid grid-cols-2 border-t border-gray-200 bg-white">
                          <div className="p-2 border-r border-gray-200 flex items-center">
                            <span className="text-sm text-gray-700 ml-2">{row.range}</span>
                          </div>
                          <div className="p-2">
                            <input
                              type="number"
                              className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                              value={row.decrease}
                              onChange={(e) => {
                                const newGrid = [...performanceForm.efficiencyDecreaseGrid];
                                newGrid[index].decrease = e.target.value;
                                setPerformanceForm({ ...performanceForm, efficiencyDecreaseGrid: newGrid });
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="marginTop-6 text-right mt-6 mb-8">
                    <button type="submit" disabled={isSaving} className="px-6 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 disabled:opacity-50">
                      {isSaving ? 'Saving...' : 'Save Performance Settings'}
                    </button>
                  </div>
                </form>
              )}

              {/* Saved Performance Settings Summary Cards */}
              {activeTab === 'performance' && savedSettingsList.filter(s => s.settingType === 'performance').length > 0 && (
                <div className="space-y-4 mt-6">
                  <h4 className="text-xl font-bold text-gray-800 border-b pb-2">Saved Performance Configurations</h4>
                  {savedSettingsList.filter(s => s.settingType === 'performance').map((settings, index) => (
                    <div key={settings._id || index} className="bg-blue-50 border-l-4 border-blue-500 rounded p-6 shadow-sm relative transition-all hover:shadow-md">
                      <div className="absolute top-2 right-4 text-[10px] text-gray-400 font-mono">
                        Saved: {new Date(settings.createdAt).toLocaleString()}
                      </div>
                      <h4 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2 text-green-600" /> Card #{savedSettingsList.filter(s => s.settingType === 'performance').length - index}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-700">
                        <div>
                          <p className="font-semibold text-gray-500 text-xs">Payroll Type</p>
                          <p className="font-medium capitalize">{settings.performance.payrollType || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-500 text-xs">Efficiency Formula</p>
                          <p className="font-medium">{settings.performance.efficiencyFormula || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-500 text-xs">Attendance Req (%)</p>
                          <p className="font-medium">{settings.performance.attendanceReq ? `${settings.performance.attendanceReq}%` : 'N/A'}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-500 text-xs">Leave Impact</p>
                          <p className="font-medium">{settings.performance.leaveImpact || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-500 text-xs">Overdue Impact</p>
                          <p className="font-medium">{settings.performance.overdueImpact || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-500 text-xs">Productivity Target (%)</p>
                          <p className="font-medium">{settings.performance.productivity ? `${settings.performance.productivity}%` : 'N/A'}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-500 text-xs">Break Time (mins)</p>
                          <p className="font-medium">{settings.performance.breakTime || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-500 text-xs">Ideal Time (mins)</p>
                          <p className="font-medium">{settings.performance.idealTime || 'N/A'}</p>
                        </div>
                        <div className="md:col-span-4">
                          <p className="font-semibold text-gray-500 text-xs">Efficiency Decrease Grid</p>
                          <p className="font-medium">{settings.performance.efficiencyDecreaseGrid?.length ? 'Configured (10 Rows)' : 'Not Configured'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Vacancy Settings */}
              {activeTab === 'vacancy' && (
                <form onSubmit={handleSaveAll}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Experience Required (years)</label>
                      <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={vacancyForm.vacancyExperience}
                        onChange={(e) => setVacancyForm({ ...vacancyForm, vacancyExperience: e.target.value })}
                      />
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
                          className="px-4 py-2 bg-red-50 text-red-500 rounded-r-md hover:bg-red-100 border border-red-200"
                          onClick={() => removeSkillField(index)}
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="mt-2 text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium"
                      onClick={addSkillField}
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add Skill
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Education Qualification</label>
                      <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={vacancyForm.vacancyEducation}
                        onChange={(e) => setVacancyForm({ ...vacancyForm, vacancyEducation: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Certifications Required</label>
                      <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={vacancyForm.vacancyCertifications}
                        onChange={(e) => setVacancyForm({ ...vacancyForm, vacancyCertifications: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Application Deadline</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Job Description</label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md h-24"
                      value={vacancyForm.vacancyDescription}
                      onChange={(e) => setVacancyForm({ ...vacancyForm, vacancyDescription: e.target.value })}
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Responsibilities</label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md h-24"
                      value={vacancyForm.vacancyResponsibilities}
                      onChange={(e) => setVacancyForm({ ...vacancyForm, vacancyResponsibilities: e.target.value })}
                    />
                  </div>

                  <div className="marginTop-6 text-right mt-6 mb-8">
                    <button type="submit" disabled={isSaving} className="px-6 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 disabled:opacity-50">
                      {isSaving ? 'Saving...' : 'Save Vacancy Settings'}
                    </button>
                  </div>
                </form>
              )}

              {/* Saved Vacancy Settings Summary Cards */}
              {activeTab === 'vacancy' && savedSettingsList.filter(s => s.settingType === 'vacancy').length > 0 && (
                <div className="space-y-4 mt-6">
                  <h4 className="text-xl font-bold text-gray-800 border-b pb-2">Saved Vacancy Configurations</h4>
                  {savedSettingsList.filter(s => s.settingType === 'vacancy').map((settings, index) => (
                    <div key={settings._id || index} className="bg-blue-50 border-l-4 border-blue-500 rounded p-6 shadow-sm relative transition-all hover:shadow-md">
                      <div className="absolute top-2 right-4 text-[10px] text-gray-400 font-mono">
                        Saved: {new Date(settings.createdAt).toLocaleString()}
                      </div>
                      <h4 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2 text-green-600" /> Card #{savedSettingsList.filter(s => s.settingType === 'vacancy').length - index}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-700">
                        <div>
                          <p className="font-semibold text-gray-500 text-xs">Number of Vacancies</p>
                          <p className="font-medium">{settings.vacancy.count || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-500 text-xs">Experience (years)</p>
                          <p className="font-medium">{settings.vacancy.experience || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-500 text-xs">Job Type</p>
                          <p className="font-medium capitalize">{settings.vacancy.jobType || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-500 text-xs">Deadline</p>
                          <p className="font-medium">{settings.vacancy.deadline ? new Date(settings.vacancy.deadline).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="font-semibold text-gray-500 text-xs">Education</p>
                          <p className="font-medium">{settings.vacancy.education || 'N/A'}</p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="font-semibold text-gray-500 text-xs">Certifications</p>
                          <p className="font-medium">{settings.vacancy.certifications || 'N/A'}</p>
                        </div>
                        <div className="md:col-span-4">
                          <p className="font-semibold text-gray-500 text-xs">Required Skills</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {settings.vacancy.skills?.length > 0 && settings.vacancy.skills[0] !== '' ? (
                              settings.vacancy.skills.map((skill, idx) => (
                                <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs">{skill}</span>
                              ))
                            ) : (
                              <span className="font-medium">N/A</span>
                            )}
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <p className="font-semibold text-gray-500 text-xs">Job Description</p>
                          <p className="font-medium line-clamp-3">{settings.vacancy.description || 'N/A'}</p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="font-semibold text-gray-500 text-xs">Responsibilities</p>
                          <p className="font-medium line-clamp-3">{settings.vacancy.responsibilities || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Test Settings */}
              {activeTab === 'test' && (
                <form onSubmit={handleSaveAll}>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Test Configuration</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
                      {['Aptitude Test', 'Technical Test', 'Behavioral Test', 'Domain Knowledge Test', 'Soft Skills Test'].map(testName => (
                        <label key={testName} className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            checked={testForm.selectedTests.includes(testName)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setTestForm(prev => {
                                const newTests = checked
                                  ? [...prev.selectedTests, testName]
                                  : prev.selectedTests.filter(t => t !== testName);
                                return { selectedTests: newTests };
                              });
                            }}
                          />
                          <span className="text-sm font-medium text-gray-700">{testName}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="marginTop-6 text-right mt-6 mb-8">
                    <button type="submit" disabled={isSaving} className="px-6 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 disabled:opacity-50">
                      {isSaving ? 'Saving...' : 'Save Test Settings'}
                    </button>
                  </div>
                </form>
              )}

              {/* Saved Test Settings Summary Cards */}
              {activeTab === 'test' && savedSettingsList.filter(s => s.settingType === 'test').length > 0 && (
                <div className="space-y-4 mt-6">
                  <h4 className="text-xl font-bold text-gray-800 border-b pb-2">Saved Test Configurations</h4>
                  {savedSettingsList.filter(s => s.settingType === 'test').map((settings, index) => (
                    <div key={settings._id || index} className="bg-blue-50 border-l-4 border-blue-500 rounded p-6 shadow-sm relative transition-all hover:shadow-md">
                      <div className="absolute top-2 right-4 text-[10px] text-gray-400 font-mono">
                        Saved: {new Date(settings.createdAt).toLocaleString()}
                      </div>
                      <h4 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2 text-green-600" /> Card #{savedSettingsList.filter(s => s.settingType === 'test').length - index}
                      </h4>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {settings.test.selectedTests.map((t, idx) => (
                          <li key={idx} className="bg-white border border-gray-200 rounded-md p-3 text-sm text-gray-700 shadow-sm flex items-center">
                            <CheckCircle className="w-5 h-5 text-green-500 mr-3" /> {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
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