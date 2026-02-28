import React, { useState, useEffect } from 'react';
import {
  MapPin, Users, Video, Save, ChevronLeft, ChevronRight,
  PlayCircle, FileVideo, Layers, Globe, Building,
  CheckCircle, Trash2, Edit, Plus, BarChart3,
  GraduationCap, Upload, Link, Loader
} from 'lucide-react';
import { getStates, getCities, getDistricts } from '../../../../services/locationApi';
import { getDepartments, getDesignationsByDepartment } from '../../../../services/masterApi';
import { getCandidateTrainings, createCandidateTraining, updateCandidateTraining } from '../../../../services/hrms/hrmsApi';
import toast from 'react-hot-toast';

const CandidateTrainingSetting = () => {
  // Data States
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);

  // Selection States
  const [currentStep, setCurrentStep] = useState('state');
  const [currentState, setCurrentState] = useState(null);
  const [selectedCities, setSelectedCities] = useState([]);
  const [selectedDistricts, setSelectedDistricts] = useState([]);
  const [currentDepartment, setCurrentDepartment] = useState(null);
  const [currentPosition, setCurrentPosition] = useState(null);

  // Content States
  const [sections, setSections] = useState([]);
  const [trainingId, setTrainingId] = useState(null); // If editing existing
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Initial Load
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

  // Fetch Cities
  useEffect(() => {
    if (currentState?._id) {
      const fetchCities = async () => {
        try {
          const data = await getCities(currentState._id);
          setCities(data);
          setSelectedCities([]);
          setSelectedDistricts([]);
          if (currentStep === 'state') setCurrentStep('city');
        } catch (error) {
          console.error("Error fetching cities:", error);
          toast.error("Failed to load cities");
        }
      };
      fetchCities();
    }
  }, [currentState]);

  // Fetch Districts
  useEffect(() => {
    if (selectedCities.length > 0) {
      const fetchDistrictsForCities = async () => {
        try {
          const promises = selectedCities.map(city => getDistricts(city._id));
          const results = await Promise.all(promises);
          const allDistricts = results.flat();
          const uniqueDistricts = Array.from(new Map(allDistricts.map(d => [d._id, d])).values());
          setDistricts(uniqueDistricts);
        } catch (error) {
          console.error("Error fetching districts:", error);
          toast.error("Failed to load districts");
        }
      };
      fetchDistrictsForCities();
    } else {
      setDistricts([]);
    }
  }, [selectedCities]);

  // Fetch Positions
  useEffect(() => {
    if (currentDepartment?._id) {
      const fetchPositions = async () => {
        try {
          const data = await getDesignationsByDepartment(currentDepartment._id);
          setPositions(data);
          setCurrentPosition(null);
          if (currentStep === 'department') setCurrentStep('position');
        } catch (error) {
          console.error("Error fetching positions:", error);
          toast.error("Failed to load positions");
        }
      };
      fetchPositions();
    }
  }, [currentDepartment]);

  // Fetch Existing Training Config
  useEffect(() => {
    if (currentDepartment?._id && currentPosition?.name) {
      const fetchTraining = async () => {
        try {
          const params = {
            department: currentDepartment._id,
            position: currentPosition.name // Backend expects String for now, or match ID if we enforce
          };
          const response = await getCandidateTrainings(params);
          if (response.data && response.data.length > 0) {
            const existing = response.data[0];
            setTrainingId(existing._id);
            setTrainingId(existing._id);
            // Ensure every section has a frontend ID for editing and rendering keys
            const formattedSections = (existing.sections || []).map(s => ({
              ...s,
              id: s._id || `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            }));
            setSections(formattedSections);
          } else {
            setTrainingId(null);
            setSections([
              {
                id: `section_${Date.now()}`,
                category: 'solarrooftop',
                name: 'New Section',
                videos: []
              }
            ]);
          }
          setCurrentStep('training');
        } catch (error) {
          console.error("Error fetching training:", error);
          toast.error("Failed to load training settings");
        }
      };
      fetchTraining();
    }
  }, [currentPosition]);


  // HANDLERS

  const handleStateSelect = (state) => {
    setCurrentState(state);
    setCurrentStep('city');
  };

  const toggleCitySelect = (city) => {
    if (selectedCities.find(c => c._id === city._id)) {
      setSelectedCities(selectedCities.filter(c => c._id !== city._id));
    } else {
      setSelectedCities([...selectedCities, city]);
    }
  };

  const handleSelectAllCities = () => setSelectedCities([...cities]);

  const toggleDistrictSelect = (district) => {
    if (selectedDistricts.find(d => d._id === district._id)) {
      setSelectedDistricts(selectedDistricts.filter(d => d._id !== district._id));
    } else {
      setSelectedDistricts([...selectedDistricts, district]);
    }
  };

  const handleSelectAllDistricts = () => setSelectedDistricts([...districts]);

  const handleDepartmentSelect = (dept) => {
    setCurrentDepartment(dept);
    setCurrentStep('position');
  };

  const handlePositionSelect = (pos) => {
    setCurrentPosition(pos);
    // Effect triggers fetch
  };

  // Section Handlers
  const addNewSection = () => {
    setSections([...sections, {
      id: `section_${Date.now()}`,
      category: 'solarrooftop',
      name: '',
      videos: []
    }]);
  };

  const removeSection = (id) => {
    setSections(sections.filter(s => s.id !== id));
  };

  const updateSection = (id, field, value) => {
    setSections(sections.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const addVideoToSection = (sectionId) => {
    setSections(sections.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          videos: [...s.videos, { url: '', type: 'youtube' }]
        };
      }
      return s;
    }));
  };

  const updateVideo = (sectionId, videoIndex, field, value) => {
    setSections(sections.map(s => {
      if (s.id === sectionId) {
        const newVideos = [...s.videos];
        newVideos[videoIndex] = { ...newVideos[videoIndex], [field]: value };
        return { ...s, videos: newVideos };
      }
      return s;
    }));
  };

  const removeVideo = (sectionId, videoIndex) => {
    setSections(sections.map(s => {
      if (s.id === sectionId) {
        const newVideos = s.videos.filter((_, i) => i !== videoIndex);
        return { ...s, videos: newVideos };
      }
      return s;
    }));
  };

  const saveTrainingSettings = async () => {
    if (!currentDepartment || !currentPosition) return toast.error("Department and Position required");

    // Sanitize sections to remove frontend temporary IDs
    const sanitizedSections = sections.map(section => {
      const { id, ...rest } = section;
      // If it's a temporary ID, don't send it as _id. 
      // If it's a real ID (from backend), it might be under _id in the original object if we kept it, 
      // but here we are using 'id' in state. 
      // If we loaded from backend, we should probably have preserved _id. 
      // Let's assume for now we strip 'id' and let backend handle _id for new ones.
      // For existing ones, we want to update them? 
      // The backend 'updateCandidateTraining' likely does a full replace of sections array or uses set.
      // If strictly replacing, we don't strictly need _id unless we want to preserve subdocument IDs.
      // But sending a string 'id' is definitely wrong.
      return rest;
    });

    const payload = {
      state: currentState?._id,
      cities: selectedCities.map(c => c._id),
      districts: selectedDistricts.map(d => d._id),
      department: currentDepartment._id,
      position: currentPosition.name,
      sections: sanitizedSections
    };

    try {
      setIsSaving(true);
      if (trainingId) {
        await updateCandidateTraining(trainingId, payload);
        setShowSuccessModal(true);
      } else {
        const res = await createCandidateTraining(payload);
        setTrainingId(res.data._id);
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error("Error saving training:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-lg p-4 shadow-lg">
          <div className="flex items-center">
            <GraduationCap className="h-8 w-8 text-white mr-3" />
            <h1 className="text-2xl font-bold text-white">Candidate Training Settings</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto">
        {isLoading && (
          <div className="flex justify-center p-8">
            <Loader className="animate-spin text-blue-600 h-8 w-8" />
          </div>
        )}

        {/* State Selection */}
        {currentStep === 'state' && !isLoading && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-blue-900 border-b-2 border-gray-200 pb-3 mb-6">Select State</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {states.map((state) => (
                <div
                  key={state._id}
                  className={`bg-white rounded-lg shadow-md p-6 text-center cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${currentState?._id === state._id ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white' : ''}`}
                  onClick={() => handleStateSelect(state)}
                >
                  <h3 className="font-medium">{state.name}</h3>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* City Selection */}
        {currentStep === 'city' && currentState && (
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <button onClick={() => setCurrentStep('state')} className="mr-4 p-2 rounded-lg hover:bg-gray-100"><ChevronLeft className="h-5 w-5" /></button>
              <h2 className="text-xl font-semibold">Select Cities in <span className="text-blue-600">{currentState.name}</span></h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-100" onClick={handleSelectAllCities}>
                <div className="flex items-center justify-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" /><h3 className="font-medium">All Cities</h3></div>
              </div>
              {cities.map((city) => (
                <div
                  key={city._id}
                  className={`bg-white rounded-lg shadow-md p-6 text-center cursor-pointer transition-all ${selectedCities.find(c => c._id === city._id) ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' : 'hover:shadow-lg'}`}
                  onClick={() => toggleCitySelect(city)}
                >
                  <h3 className="font-medium">{city.name}</h3>
                </div>
              ))}
            </div>
            {selectedCities.length > 0 && (
              <div className="mt-6 text-right">
                <button onClick={() => setCurrentStep('district')} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Next: Select Districts</button>
              </div>
            )}
          </div>
        )}

        {/* District Selection */}
        {currentStep === 'district' && selectedCities.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <button onClick={() => setCurrentStep('city')} className="mr-4 p-2 rounded-lg hover:bg-gray-100"><ChevronLeft className="h-5 w-5" /></button>
              <h2 className="text-xl font-semibold">Select Districts</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-100" onClick={handleSelectAllDistricts}>
                <div className="flex items-center justify-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" /><h3 className="font-medium">All Districts</h3></div>
              </div>
              {districts.map((dist) => (
                <div
                  key={dist._id}
                  className={`bg-white rounded-lg shadow-md p-6 text-center cursor-pointer transition-all ${selectedDistricts.find(d => d._id === dist._id) ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' : 'hover:shadow-lg'}`}
                  onClick={() => toggleDistrictSelect(dist)}
                >
                  <h3 className="font-medium">{dist.name}</h3>
                </div>
              ))}
            </div>
            {selectedDistricts.length > 0 && (
              <div className="mt-6 text-right">
                <button onClick={() => setCurrentStep('department')} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Next: Select Department</button>
              </div>
            )}
          </div>
        )}

        {/* Department Selection */}
        {currentStep === 'department' && (
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <button onClick={() => setCurrentStep('district')} className="mr-4 p-2 rounded-lg hover:bg-gray-100"><ChevronLeft className="h-5 w-5" /></button>
              <h2 className="text-xl font-semibold">Select Department</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {departments.map(dept => (
                <div
                  key={dept._id}
                  className={`bg-white rounded-lg shadow-md p-6 text-center cursor-pointer transition-all hover:scale-105 ${currentDepartment?._id === dept._id ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' : ''}`}
                  onClick={() => handleDepartmentSelect(dept)}
                >
                  <h3 className="font-medium">{dept.name}</h3>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Position Selection */}
        {currentStep === 'position' && (
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <button onClick={() => setCurrentStep('department')} className="mr-4 p-2 rounded-lg hover:bg-gray-100"><ChevronLeft className="h-5 w-5" /></button>
              <h2 className="text-xl font-semibold">Select Position</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {positions.map(pos => (
                <div
                  key={pos._id}
                  className={`bg-white rounded-lg shadow-md p-6 text-center cursor-pointer transition-all hover:scale-105 ${currentPosition?._id === pos._id ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' : ''}`}
                  onClick={() => handlePositionSelect(pos)}
                >
                  <h3 className="font-medium">{pos.name}</h3>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Training Form */}
        {currentStep === 'training' && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-blue-600">{currentDepartment?.name} - {currentPosition?.name} Training</h2>
              <button onClick={() => setCurrentStep('position')} className="p-2 rounded-lg hover:bg-gray-100"><ChevronLeft className="h-5 w-5" /></button>
            </div>

            <div className="mb-8">
              <div className="bg-blue-600 text-white rounded-t-lg p-4 flex justify-between items-center">
                <span className="font-semibold">Video Upload Sections</span>
                <button onClick={addNewSection} className="bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 flex items-center">
                  <Plus className="h-4 w-4 mr-1" /> Add Section
                </button>
              </div>
              <div className="border border-gray-200 rounded-b-lg p-4">
                {sections.map(section => (
                  <div key={section.id} className="border-l-4 border-blue-500 rounded-lg border border-gray-200 p-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
                      <div className="md:col-span-4">
                        <label className="block text-sm font-medium mb-2">Category</label>
                        <select value={section.category} onChange={e => updateSection(section.id, 'category', e.target.value)} className="w-full border rounded-lg px-3 py-2">
                          <option value="solarrooftop">Solar Rooftop</option>
                          <option value="solarpump">Solar Pump</option>
                          <option value="solarstreetlight">Solar Street Light</option>
                        </select>
                      </div>
                      <div className="md:col-span-6">
                        <label className="block text-sm font-medium mb-2">Section Name</label>
                        <input type="text" value={section.name} onChange={e => updateSection(section.id, 'name', e.target.value)} className="w-full border rounded-lg px-3 py-2" placeholder="Section Name" />
                      </div>
                      <div className="md:col-span-2 flex items-end justify-end">
                        <button onClick={() => removeSection(section.id)} className="text-red-500 p-2 border border-red-500 rounded-lg hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {section.videos.map((video, vIndex) => (
                        <div key={vIndex} className="grid grid-cols-12 gap-4 items-center bg-gray-50 p-3 rounded">
                          <div className="col-span-8">
                            <input type="url" value={video.url} onChange={e => updateVideo(section.id, vIndex, 'url', e.target.value)} className="w-full border rounded px-2 py-1" placeholder="Video URL (YouTube)" />
                          </div>
                          <div className="col-span-3">
                            <select value={video.type} onChange={e => updateVideo(section.id, vIndex, 'type', e.target.value)} className="w-full border rounded px-2 py-1">
                              <option value="youtube">YouTube</option>
                              <option value="upload">Upload</option>
                            </select>
                          </div>
                          <div className="col-span-1 text-right">
                            <button onClick={() => removeVideo(section.id, vIndex)} className="text-red-500"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </div>
                      ))}
                      <button onClick={() => addVideoToSection(section.id)} className="text-sm text-blue-600 flex items-center"><Plus className="h-3 w-3 mr-1" /> Add Video</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end mb-8">
              <button onClick={saveTrainingSettings} disabled={isSaving} className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold flex items-center disabled:opacity-50">
                <Save className="h-5 w-5 mr-2" />
                {isSaving ? 'Saving...' : 'Save Training Settings'}
              </button>
            </div>

            {/* Training Summary Section */}
            <div className="bg-gray-50 border-l-4 border-blue-600 rounded-r-lg p-6 mb-8 mt-12 shadow-sm">
              <h3 className="text-xl font-bold text-blue-800 mb-6 flex items-center">
                Training Summary
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Location Coverage */}
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <h4 className="font-semibold text-gray-700 flex items-center mb-3">
                    Location Coverage
                  </h4>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="bg-blue-400 text-white text-xs px-3 py-1 rounded-full">{currentState?.name || 'N/A'}</span>
                    <span className="bg-blue-400 text-white text-xs px-3 py-1 rounded-full">{selectedCities.length === cities.length ? 'All Clusters' : `${selectedCities.length} Clusters`}</span>
                    <span className="bg-blue-400 text-white text-xs px-3 py-1 rounded-full">{selectedDistricts.length === districts.length ? 'All Districts' : `${selectedDistricts.length} Districts`}</span>
                  </div>
                  <p className="text-xs text-gray-500">Training will be available in selected locations</p>
                </div>

                {/* Department & Position */}
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <h4 className="font-semibold text-gray-700 flex items-center mb-3">
                    <Users className="w-4 h-4 mr-1" /> Department & Position
                  </h4>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="bg-blue-400 text-white text-xs px-3 py-1 rounded-full">{currentDepartment?.name || 'N/A'}</span>
                    <span className="bg-blue-400 text-white text-xs px-3 py-1 rounded-full">{currentPosition?.name || 'N/A'}</span>
                  </div>
                  <p className="text-xs text-gray-500">Training configured for specific department roles</p>
                </div>
              </div>

              {/* Training Content */}
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <h4 className="font-semibold text-gray-700 flex items-center mb-4">
                  <PlayCircle className="w-4 h-4 mr-1" /> Training Content
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {/* We compute dynamic summary from sections state */}
                  {['solarrooftop', 'solarpump', 'solarstreetlight'].map(cat => {
                    const catSections = sections.filter(s => s.category === cat);
                    const videoCount = catSections.reduce((acc, s) => acc + s.videos.length, 0);
                    if (videoCount === 0 && catSections.length === 0) return null;

                    const catName = cat === 'solarrooftop' ? 'Solar Rooftop Basics' :
                      cat === 'solarpump' ? 'Solar Pump Guide' : 'Solar Street Light';

                    return (
                      <div key={cat} className="flex items-start">
                        <FileVideo className="w-6 h-6 text-blue-500 mr-2 mt-1" />
                        <div>
                          <h5 className="font-semibold text-sm text-gray-800">{catName}</h5>
                          <p className="text-xs text-gray-500">{videoCount} videos</p>
                        </div>
                      </div>
                    );
                  })}
                  {sections.length === 0 || sections.every(s => s.videos.length === 0) ? (
                    <p className="text-sm text-gray-500 col-span-full">No training content added yet.</p>
                  ) : null}
                </div>
                <div className="border-t pt-3 mt-4">
                  <p className="text-xs text-gray-500">
                    Total: {sections.reduce((acc, s) => acc + s.videos.length, 0)} training videos across {new Set(sections.map(s => s.category)).size} categories
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-sm w-full text-center shadow-xl transform transition-all scale-100">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Success!</h3>
            <p className="text-gray-600 mb-6">Training data has been saved successfully in the database.</p>
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
  );
};

export default CandidateTrainingSetting;