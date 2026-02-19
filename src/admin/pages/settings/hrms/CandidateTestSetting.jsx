import React, { useState, useEffect } from 'react';
import {
  FileText, Settings, MapPin, Building, Users,
  Plus, X, Save, ArrowLeft, CheckCircle,
  Trash2, Clock, Percent, ListChecks, Edit, Loader
} from 'lucide-react';
import { getStates, getCities, getDistricts } from '../../../../services/locationApi';
import { getDepartments } from '../../../../services/masterApi';
import { getCandidateTests, createCandidateTest, deleteCandidateTest } from '../../../../services/hrms/hrmsApi';
import toast from 'react-hot-toast';

const CandidateTestSetting = () => {
  // Data States
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]); // Available cities for selected state
  const [districts, setDistricts] = useState([]); // Available districts for selected cities
  const [departments, setDepartments] = useState([]);
  const [tests, setTests] = useState([]);

  // Selection States
  const [currentState, setCurrentState] = useState(null); // Whole Object
  const [currentDepartment, setCurrentDepartment] = useState(null); // Whole Object

  const [selectedCities, setSelectedCities] = useState([]); // Array of City Objects
  const [selectedDistricts, setSelectedDistricts] = useState([]); // Array of District Objects

  // UI States
  const [showCitySection, setShowCitySection] = useState(false);
  const [showDistrictSection, setShowDistrictSection] = useState(false);
  const [showDepartmentTests, setShowDepartmentTests] = useState(false);
  const [showTestForm, setShowTestForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null); // Test ID

  // Test form states
  const [testConfig, setTestConfig] = useState({
    name: '',
    duration: 60,
    totalQuestions: 30,
    passingPercentage: 60,
    negativeMarking: false,
    negativeMarkValue: 0.25
  });

  // Questions state
  const [questions, setQuestions] = useState([
    {
      id: Date.now(),
      text: '',
      type: 'multiple',
      options: ['', '', '', ''],
      correctAnswer: [],
      marks: 1
    }
  ]);

  // Initial Data Load
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [statesData, departmentsData] = await Promise.all([
          getStates(),
          getDepartments()
        ]);
        setStates(statesData);
        setDepartments(departmentsData);
      } catch (error) {
        console.error("Error loading initial data:", error);
        toast.error("Failed to load initial data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch Cities when State Selects
  useEffect(() => {
    if (currentState?._id) {
      const fetchCities = async () => {
        try {
          const data = await getCities(currentState._id);
          setCities(data);
          // Reset selections
          setSelectedCities([]);
          setSelectedDistricts([]);
          setShowCitySection(true);
          setShowDistrictSection(false);
        } catch (error) {
          console.error("Error fetching cities:", error);
          toast.error("Failed to load cities");
        }
      };
      fetchCities();
    } else {
      setShowCitySection(false);
    }
  }, [currentState]);

  // Fetch Districts when Selected Cities Change
  useEffect(() => {
    if (selectedCities.length > 0) {
      const fetchDistrictsForCities = async () => {
        try {
          // Fetch districts for ALL selected cities
          // API usually accepts one cityId. We might need to iterate or update API.
          // locationApi getDistricts takes cityId.
          // We can fetch in parallel.
          const promises = selectedCities.map(city => getDistricts(city._id));
          const results = await Promise.all(promises);
          // Flatten results
          const allDistricts = results.flat();
          // Remove duplicates if any (though districts are unique per city)
          setDistricts(allDistricts);
          setShowDistrictSection(true);
        } catch (error) {
          console.error("Error fetching districts:", error);
          toast.error("Failed to load districts");
        }
      };
      fetchDistrictsForCities();
    } else {
      setDistricts([]);
      setShowDistrictSection(false);
    }
  }, [selectedCities]);

  // Fetch Tests when Department Selected
  useEffect(() => {
    if (currentDepartment?._id) {
      fetchTests();
      setShowDepartmentTests(true);
      setShowTestForm(false);
    }
  }, [currentDepartment]);

  const fetchTests = async () => {
    if (!currentDepartment?._id) return;
    try {
      // Fetch tests for this department. 
      // Note: Backend filters by state too if passed, but UI flow implies 
      // selecting location implies "Creating test for this location".
      // Viewing tests might be "All tests for this department" or "Tests filtered by selected State"?
      // Original UI showed "Department Tests" after selecting department. 
      // Let's filter by current State if selected, or just Department.
      const params = { department: currentDepartment._id };
      if (currentState?._id) params.state = currentState._id;

      const response = await getCandidateTests(params);
      setTests(response.data || []);
    } catch (error) {
      console.error("Error fetching tests:", error);
      toast.error("Failed to load tests");
    }
  };

  // HANDLERS

  const handleStateSelect = (state) => {
    setCurrentState(state);
    // Reset lower levels
    setSelectedCities([]);
    setSelectedDistricts([]);
    setCurrentDepartment(null);
    setShowDepartmentTests(false);
    setTests([]);
  };

  const toggleCitySelection = (city) => {
    const isSelected = selectedCities.find(c => c._id === city._id);
    let newSelection;
    if (isSelected) {
      newSelection = selectedCities.filter(c => c._id !== city._id);
    } else {
      newSelection = [...selectedCities, city];
    }
    setSelectedCities(newSelection);
    // Reset districts if city removed?
    // If a city is removed, we should remove its districts from selectedDistricts too.
    // For simplicity, let's keep selectedDistricts but filter valid ones?
    // Or just clear districts if cities change drastically.
    // Let's keep it simple: fetchDistricts effect handles available districts.
    // We should probably cleanup selectedDistricts that are no longer in available districts.
    // We'll do that in effect or render.
  };

  const selectAllCities = () => {
    setSelectedCities([...cities]);
  };

  const toggleDistrictSelection = (district) => {
    const isSelected = selectedDistricts.find(d => d._id === district._id);
    if (isSelected) {
      setSelectedDistricts(selectedDistricts.filter(d => d._id !== district._id));
    } else {
      setSelectedDistricts([...selectedDistricts, district]);
    }
  };

  const selectAllDistricts = () => {
    setSelectedDistricts([...districts]);
  };

  const handleDepartmentSelect = (dept) => {
    setCurrentDepartment(dept);
  };

  const handleDeleteTest = async (e, testId) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this test?")) {
      try {
        setIsDeleting(testId);
        await deleteCandidateTest(testId);
        toast.success("Test deleted");
        fetchTests();
      } catch (error) {
        console.error("Error deleting test:", error);
        toast.error("Failed to delete test");
      } finally {
        setIsDeleting(null);
      }
    }
  };


  // --- FORM HANDLERS (Same as before, updated logic) ---

  const addNewQuestion = () => {
    setQuestions([...questions, {
      id: Date.now(),
      text: '',
      type: 'multiple',
      options: ['', '', '', ''],
      correctAnswer: [],
      marks: 1
    }]);
  };

  const removeQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index, field, value) => {
    const newQuestions = [...questions];
    if (field === 'text' || field === 'type' || field === 'marks') {
      newQuestions[index][field] = value;
    } else if (field === 'option') {
      newQuestions[index].options[value.optionIndex] = value.optionValue;
    } else if (field === 'correctAnswer') {
      // value is the optionIndex or array of indices
      if (newQuestions[index].type === 'single') {
        newQuestions[index].correctAnswer = [value];
      } else {
        // For multiple, toggle
        const current = newQuestions[index].correctAnswer;
        if (current.includes(value)) {
          newQuestions[index].correctAnswer = current.filter(v => v !== value);
        } else {
          newQuestions[index].correctAnswer = [...current, value];
        }
      }
    }
    setQuestions(newQuestions);
  };

  const addOption = (questionIndex) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options.push('');
    setQuestions(newQuestions);
  };

  const removeOption = (questionIndex, optionIndex) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options.splice(optionIndex, 1);
    // Clean up answers
    const newAnswers = newQuestions[questionIndex].correctAnswer
      .filter(a => a !== optionIndex)
      .map(a => a > optionIndex ? a - 1 : a);
    newQuestions[questionIndex].correctAnswer = newAnswers;
    setQuestions(newQuestions);
  };

  const saveTestSettings = async () => {
    if (!testConfig.name.trim()) return toast.error('Enter test name');
    if (questions.length === 0) return toast.error('Add at least one question');
    if (!currentState || selectedCities.length === 0 || selectedDistricts.length === 0) {
      return toast.error('Please select State, Cities and Districts');
    }

    const validQuestions = questions.filter(q => q.text.trim() !== '');
    if (validQuestions.length === 0) return toast.error('Questions cannot be empty');

    // Convert indices to strings if needed, but schema uses Strings. 
    // Let's store option values strings as answers for robustness?
    // Or keep indices. The schema says [String]. Indices are fine as strings.

    const formattedQuestions = validQuestions.map(q => ({
      text: q.text,
      type: q.type,
      options: q.options,
      correctAnswer: q.correctAnswer.map(String), // Store as ["0", "2"]
      marks: q.marks
    }));

    const payload = {
      ...testConfig,
      department: currentDepartment._id,
      state: currentState._id,
      cities: selectedCities.map(c => c._id),
      districts: selectedDistricts.map(d => d._id),
      questions: formattedQuestions
    };

    try {
      setIsSaving(true);
      await createCandidateTest(payload);
      toast.success("Test created successfully");
      setShowTestForm(false);
      fetchTests();
      // Reset config
      setTestConfig({ name: '', duration: 60, totalQuestions: 30, passingPercentage: 60, negativeMarking: false, negativeMarkValue: 0.25 });
      setQuestions([{ id: Date.now(), text: '', type: 'multiple', options: ['', '', '', ''], correctAnswer: [], marks: 1 }]);
    } catch (error) {
      console.error("Error saving test:", error);
      toast.error("Failed to save test");
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mb-6">
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg shadow-md p-4">
          <div className="flex items-center">
            <FileText className="w-8 h-8 text-white mr-3" />
            <h1 className="text-2xl font-bold text-white">Candidate Test Settings</h1>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center p-4">
            <Loader className="animate-spin text-blue-600" />
          </div>
        )}

        {/* State Selection */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-200">Select State</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {states.map((state) => (
              <div
                key={state._id}
                className={`bg-white border-2 border-gray-200 rounded-lg p-4 text-center cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg ${currentState?._id === state._id ? 'border-blue-500 bg-blue-50' : ''}`}
                onClick={() => handleStateSelect(state)}
              >
                <Building className={`w-8 h-8 mx-auto mb-2 ${currentState?._id === state._id ? 'text-blue-500' : 'text-gray-600'}`} />
                <h6 className="font-medium text-gray-800">{state.name}</h6>
              </div>
            ))}
          </div>
        </div>

        {/* City Selection */}
        {showCitySection && currentState && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                Select Cities in <span className="text-blue-600">{currentState.name}</span>
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {/* All Cities */}
              <div
                className={`border-2 ${selectedCities.length === cities.length && cities.length > 0 ? 'border-green-500 bg-green-50' : 'border-dashed border-gray-300'} rounded-lg p-4 text-center cursor-pointer transition-all hover:scale-105`}
                onClick={selectAllCities}
              >
                <CheckCircle className={`w-8 h-8 mx-auto mb-2 ${selectedCities.length === cities.length && cities.length > 0 ? 'text-green-500' : 'text-gray-400'}`} />
                <h6 className="font-medium text-gray-800">All Cities</h6>
              </div>
              {cities.map(city => (
                <div
                  key={city._id}
                  className={`bg-white border-2 ${selectedCities.find(c => c._id === city._id) ? 'border-green-500 bg-green-50' : 'border-gray-200'} rounded-lg p-4 text-center cursor-pointer transition-all hover:scale-105`}
                  onClick={() => toggleCitySelection(city)}
                >
                  <MapPin className={`w-8 h-8 mx-auto mb-2 ${selectedCities.find(c => c._id === city._id) ? 'text-green-500' : 'text-gray-600'}`} />
                  <h6 className="font-medium text-gray-800">{city.name}</h6>
                </div>
              ))}
              {cities.length === 0 && <p className="col-span-full text-gray-500 text-center">No cities found.</p>}
            </div>
          </div>
        )}

        {/* District Selection */}
        {showDistrictSection && selectedCities.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                Select Districts
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {/* All Districts */}
              <div
                className={`border-2 ${selectedDistricts.length === districts.length && districts.length > 0 ? 'border-green-500 bg-green-50' : 'border-dashed border-gray-300'} rounded-lg p-4 text-center cursor-pointer transition-all hover:scale-105`}
                onClick={selectAllDistricts}
              >
                <CheckCircle className={`w-8 h-8 mx-auto mb-2 ${selectedDistricts.length === districts.length && districts.length > 0 ? 'text-green-500' : 'text-gray-400'}`} />
                <h6 className="font-medium text-gray-800">All Districts</h6>
              </div>
              {districts.map(dist => (
                <div
                  key={dist._id}
                  className={`bg-white border-2 ${selectedDistricts.find(d => d._id === dist._id) ? 'border-green-500 bg-green-50' : 'border-gray-200'} rounded-lg p-4 text-center cursor-pointer transition-all hover:scale-105`}
                  onClick={() => toggleDistrictSelection(dist)}
                >
                  <MapPin className={`w-8 h-8 mx-auto mb-2 ${selectedDistricts.find(d => d._id === dist._id) ? 'text-green-500' : 'text-gray-600'}`} />
                  <h6 className="font-medium text-gray-800">{dist.name}</h6>
                </div>
              ))}
              {districts.length === 0 && <p className="col-span-full text-gray-500 text-center">No districts found.</p>}
            </div>
          </div>
        )}

        {/* Department Selection */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-200">Select Department</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {departments.map(dept => (
              <div
                key={dept._id}
                className={`bg-white border-2 ${currentDepartment?._id === dept._id ? 'border-blue-500 bg-gradient-to-br from-blue-500 to-blue-700 text-white' : 'border-gray-200'} rounded-lg p-4 text-center cursor-pointer transition-all hover:scale-105`}
                onClick={() => handleDepartmentSelect(dept)}
              >
                <Users className={`w-8 h-8 mx-auto mb-2 ${currentDepartment?._id === dept._id ? 'text-white' : 'text-gray-600'}`} />
                <h6 className="font-medium">{dept.name}</h6>
              </div>
            ))}
          </div>
        </div>

        {/* Tests List */}
        {showDepartmentTests && currentDepartment && !showTestForm && (
          <div className="bg-white rounded-xl shadow-md p-6 mt-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-2xl font-bold text-blue-600">{currentDepartment.name} Tests</h4>
              <button
                onClick={() => setShowTestForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Test
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {tests.length === 0 ? (
                <div className="col-span-full text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <p className="text-gray-500">No tests found. Create one!</p>
                </div>
              ) : (
                tests.map(test => (
                  <div key={test._id} className="bg-gradient-to-br from-orange-500 to-orange-700 text-white rounded-lg p-4 shadow-lg relative cursor-pointer hover:scale-105 transition-all">
                    <button className="absolute top-2 right-2 text-white/80 hover:text-white" onClick={(e) => handleDeleteTest(e, test._id)}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <h6 className="font-semibold text-lg mb-2">{test.name}</h6>
                    <div className="text-sm opacity-90">
                      <p>Duration: {test.duration} min</p>
                      <p>{test.questions?.length || 0} Questions</p>
                      <p>State: {test.state?.name || 'All'}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Test Creation Form */}
        {showTestForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-2xl font-bold text-blue-600">Create Test for {currentDepartment.name}</h4>
              <button onClick={() => setShowTestForm(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </button>
            </div>

            {/* Config */}
            <div className="bg-white border rounded-lg p-6 mb-6">
              <h5 className="font-semibold mb-4">Configuration</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Test Name</label>
                  <input
                    type="text" className="w-full border rounded-md px-3 py-2"
                    value={testConfig.name} onChange={e => setTestConfig({ ...testConfig, name: e.target.value })}
                    placeholder="e.g. Aptitude Test"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Duration (mins)</label>
                  <input
                    type="number" className="w-full border rounded-md px-3 py-2"
                    value={testConfig.duration} onChange={e => setTestConfig({ ...testConfig, duration: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Passing %</label>
                  <input
                    type="number" className="w-full border rounded-md px-3 py-2"
                    value={testConfig.passingPercentage} onChange={e => setTestConfig({ ...testConfig, passingPercentage: e.target.value })}
                  />
                </div>
                <div className="flex items-center">
                  <input type="checkbox" checked={testConfig.negativeMarking} onChange={e => setTestConfig({ ...testConfig, negativeMarking: e.target.checked })} className="mr-2" />
                  <label>Negative Marking</label>
                </div>
              </div>
            </div>

            {/* Questions */}
            <div className="bg-white border rounded-lg p-6">
              <div className="flex justify-between mb-4">
                <h5 className="font-semibold">Questions</h5>
                <button onClick={addNewQuestion} className="text-blue-600 flex items-center"><Plus className="w-4 h-4 mr-1" /> Add Question</button>
              </div>

              <div className="space-y-6">
                {questions.map((q, i) => (
                  <div key={q.id} className="border-l-4 border-blue-500 bg-gray-50 p-4 rounded-md">
                    <div className="flex justify-between mb-2">
                      <h6 className="font-medium">Question {i + 1}</h6>
                      {questions.length > 1 && <button onClick={() => removeQuestion(i)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>}
                    </div>
                    <div className="mb-2">
                      <input type="text" className="w-full border rounded p-2" placeholder="Question Text" value={q.text} onChange={e => updateQuestion(i, 'text', e.target.value)} />
                    </div>
                    <div className="mb-2">
                      <select className="border rounded p-2" value={q.type} onChange={e => updateQuestion(i, 'type', e.target.value)}>
                        <option value="multiple">Multiple Choice</option>
                        <option value="single">Single Choice</option>
                      </select>
                    </div>
                    <div className="space-y-2 pl-4">
                      {q.options.map((opt, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-2">
                          <input type="text" className="flex-1 border rounded p-1" value={opt} onChange={e => updateQuestion(i, 'option', { optionIndex: optIndex, optionValue: e.target.value })} placeholder={`Option ${optIndex + 1}`} />
                          <input
                            type={q.type === 'single' ? 'radio' : 'checkbox'}
                            name={`q-${q.id}`}
                            checked={q.correctAnswer.includes(optIndex)}
                            onChange={() => updateQuestion(i, 'correctAnswer', optIndex)}
                          />
                          {q.options.length > 2 && <button onClick={() => removeOption(i, optIndex)} className="text-red-400"><X className="w-3 h-3" /></button>}
                        </div>
                      ))}
                      <button onClick={() => addOption(i)} className="text-xs text-blue-500">+ Option</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 text-right">
                <button onClick={saveTestSettings} disabled={isSaving} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                  {isSaving ? 'Saving...' : 'Save Test'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default CandidateTestSetting;