import React, { useState, useEffect } from 'react';
import {
  SolarPanel,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  Check,
  List,
  Layout,
  FileText,
  ChevronRight,
  ChevronLeft,
  GripVertical,
  AlertCircle
} from 'lucide-react';
import { projectApi } from '../../../../services/project/projectApi';

const JourneyStageSetting = () => {
  // State for project steps
  const [projectSteps, setProjectSteps] = useState([]);
  const [currentStepId, setCurrentStepId] = useState(null);
  const [currentFieldIndex, setCurrentFieldIndex] = useState(null);

  // Form states
  const [stepName, setStepName] = useState('');
  const [fieldName, setFieldName] = useState('');

  // Modal states
  const [showEditStepModal, setShowEditStepModal] = useState(false);
  const [showEditFieldModal, setShowEditFieldModal] = useState(false);
  const [editStepName, setEditStepName] = useState('');
  const [editFieldName, setEditFieldName] = useState('');

  // Initialize with API data
  useEffect(() => {
    fetchStages();
  }, []);

  const fetchStages = async () => {
    try {
      const data = await projectApi.getJourneyStages();
      setProjectSteps(data);
    } catch (error) {
      console.error('Error fetching stages:', error);
      // toast.error('Failed to load stages');
    }
  };

  // Add a new step
  const handleAddStep = async (e) => {
    e.preventDefault();
    if (!stepName.trim()) return;

    try {
      const newStepData = {
        name: stepName,
        fields: [],
        order: projectSteps.length + 1
      };
      const savedStep = await projectApi.createJourneyStage(newStepData);
      setProjectSteps([...projectSteps, savedStep]);
      setStepName('');
      selectStep(savedStep._id);
    } catch (error) {
      console.error('Error creating stage:', error);
    }
  };

  // Select a step to manage its fields
  const selectStep = (stepId) => {
    setCurrentStepId(stepId);
  };

  // Get current step
  const getCurrentStep = () => {
    return projectSteps.find(step => step._id === currentStepId);
  };

  // Add a field to the current step
  const handleAddField = async () => {
    if (!fieldName.trim() || !currentStepId) return;

    const currentStep = getCurrentStep();
    if (!currentStep) return;

    const updatedFields = [...currentStep.fields, fieldName];

    try {
      const updatedStep = await projectApi.updateJourneyStage(currentStepId, { fields: updatedFields });

      const updatedSteps = projectSteps.map(step =>
        step._id === currentStepId ? updatedStep : step
      );

      setProjectSteps(updatedSteps);
      setFieldName('');
    } catch (error) {
      console.error('Error adding field:', error);
    }
  };

  // Open edit step modal
  const openEditStepModal = (step) => {
    setEditStepName(step.name);
    setShowEditStepModal(true);
  };

  // Update a step
  const handleUpdateStep = async () => {
    if (!editStepName.trim() || !currentStepId) return;

    try {
      const updatedStep = await projectApi.updateJourneyStage(currentStepId, { name: editStepName });

      const updatedSteps = projectSteps.map(step =>
        step._id === currentStepId ? updatedStep : step
      );

      setProjectSteps(updatedSteps);
      setShowEditStepModal(false);
    } catch (error) {
      console.error('Error updating step:', error);
    }
  };

  // Delete a step
  const handleDeleteStep = async () => {
    if (!currentStepId) return;

    try {
      await projectApi.deleteJourneyStage(currentStepId);
      const updatedSteps = projectSteps.filter(step => step._id !== currentStepId);
      setProjectSteps(updatedSteps);
      setCurrentStepId(null);
      setShowEditStepModal(false);
    } catch (error) {
      console.error('Error deleting step:', error);
    }
  };

  // Open edit field modal
  const openEditFieldModal = (field, index) => {
    setEditFieldName(field);
    setCurrentFieldIndex(index);
    setShowEditFieldModal(true);
  };

  // Update a field
  const handleUpdateField = async () => {
    if (!editFieldName.trim() || !currentStepId || currentFieldIndex === null) return;

    const currentStep = getCurrentStep();
    if (!currentStep) return;

    const updatedFields = [...currentStep.fields];
    updatedFields[currentFieldIndex] = editFieldName;

    try {
      const updatedStep = await projectApi.updateJourneyStage(currentStepId, { fields: updatedFields });

      const updatedSteps = projectSteps.map(step =>
        step._id === currentStepId ? updatedStep : step
      );

      setProjectSteps(updatedSteps);
      setShowEditFieldModal(false);
      setCurrentFieldIndex(null);
    } catch (error) {
      console.error('Error updating field:', error);
    }
  };

  // Delete a field
  const handleDeleteField = async () => {
    if (!currentStepId || currentFieldIndex === null) return;

    const currentStep = getCurrentStep();
    if (!currentStep) return;

    const updatedFields = currentStep.fields.filter((_, index) => index !== currentFieldIndex);

    try {
      const updatedStep = await projectApi.updateJourneyStage(currentStepId, { fields: updatedFields });

      const updatedSteps = projectSteps.map(step =>
        step._id === currentStepId ? updatedStep : step
      );

      setProjectSteps(updatedSteps);
      setShowEditFieldModal(false);
      setCurrentFieldIndex(null);
    } catch (error) {
      console.error('Error deleting field:', error);
    }
  };

  // Render step item
  const renderStepItem = (step) => {
    const isActive = currentStepId === step._id;
    return (
      <div
        key={step._id}
        onClick={() => selectStep(step._id)}
        className={`bg-white rounded-lg p-4 mb-3 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-l-4 ${isActive
          ? 'border-green-400 bg-green-50'
          : 'border-blue-500'
          }`}
      >
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-gray-800 flex-1">{step.name}</h3>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEditStepModal(step);
            }}
            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>
        <div className="text-sm text-gray-500">
          {step.fields.length} Field{step.fields.length !== 1 ? 's' : ''}
        </div>
      </div>
    );
  };

  // Render field item
  const renderFieldItem = (field, index) => {
    return (
      <div
        key={index}
        className="flex justify-between items-center bg-gray-50 rounded-lg px-4 py-3 mb-2"
      >
        <div className="flex items-center space-x-3">
          <GripVertical className="w-4 h-4 text-gray-400" />
          <span className="font-medium text-gray-700">{field}</span>
        </div>
        <button
          onClick={() => openEditFieldModal(field, index)}
          className="p-1.5 text-yellow-500 hover:bg-yellow-50 rounded-lg transition-colors"
        >
          <Edit className="w-4 h-4" />
        </button>
      </div>
    );
  };

  const currentStep = getCurrentStep();

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl shadow-lg mb-8 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <SolarPanel className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Project Journey Stage Management</h1>
              <p className="text-blue-100">Configure project workflow steps and form fields</p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Panel - Add Step and Steps List */}
        <div className="lg:col-span-1 space-y-6">
          {/* Add New Step Card */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Add New Step</h2>
            <form onSubmit={handleAddStep}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Step Name
                </label>
                <input
                  type="text"
                  value={stepName}
                  onChange={(e) => setStepName(e.target.value)}
                  placeholder="Enter step name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Step</span>
              </button>
            </form>
          </div>

          {/* Project Steps Card */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Project Steps</h2>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {projectSteps.length} Step{projectSteps.length !== 1 ? 's' : ''}
              </span>
            </div>

            {projectSteps.length === 0 ? (
              <div className="text-center py-8">
                <List className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-500 mb-2">No Steps Added</h3>
                <p className="text-gray-400">Add your first project step using the form above</p>
              </div>
            ) : (
              <div className="max-h-[500px] overflow-y-auto pr-2">
                {projectSteps.map(renderStepItem)}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Step Details */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-6 pb-4 border-b">
              <h2 className="text-xl font-semibold text-gray-800">Step Details</h2>
              <span className="text-gray-600">
                {currentStep ? currentStep.name : 'Select a step to manage fields'}
              </span>
            </div>

            {!currentStep ? (
              <div className="text-center py-12">
                <Layout className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-500 mb-2">No Step Selected</h3>
                <p className="text-gray-400">Select a step from the list to manage its form fields</p>
              </div>
            ) : (
              <div>
                {/* Add Field Form */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Field Name
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={fieldName}
                      onChange={(e) => setFieldName(e.target.value)}
                      placeholder="Enter field name"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleAddField}
                      className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Field</span>
                    </button>
                  </div>
                </div>

                {/* Fields List */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Form Fields ({currentStep.fields.length})
                  </h3>

                  {currentStep.fields.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-400">No fields added yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {currentStep.fields.map(renderFieldItem)}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Step Modal */}
      {showEditStepModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-t-xl">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Edit Step</h3>
                <button
                  onClick={() => setShowEditStepModal(false)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Step Name
                </label>
                <input
                  type="text"
                  value={editStepName}
                  onChange={(e) => setEditStepName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="p-6 pt-0 flex justify-end space-x-3">
              <button
                onClick={handleDeleteStep}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Step</span>
              </button>
              <button
                onClick={handleUpdateStep}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Update Step</span>
              </button>
              <button
                onClick={() => setShowEditStepModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Field Modal */}
      {showEditFieldModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-t-xl">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Edit Field</h3>
                <button
                  onClick={() => setShowEditFieldModal(false)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Field Name
                </label>
                <input
                  type="text"
                  value={editFieldName}
                  onChange={(e) => setEditFieldName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="p-6 pt-0 flex justify-end space-x-3">
              <button
                onClick={handleDeleteField}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Field</span>
              </button>
              <button
                onClick={handleUpdateField}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Update Field</span>
              </button>
              <button
                onClick={() => setShowEditFieldModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JourneyStageSetting;