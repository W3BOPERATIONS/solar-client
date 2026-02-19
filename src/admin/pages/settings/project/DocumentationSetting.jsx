import React, { useState, useEffect } from 'react';
import { projectApi } from '../../../../services/project/projectApi';
import {
  FileText,
  Cog,
  ListChecks,
  File,
  Tag,
  Plus,
  Save,
  Edit,
  Trash2,
  X,
  Check,
  User,
  Calendar,
  Home,
  Phone,
  Building,
  UserCheck,
  Zap,
  DollarSign,
  Shield
} from 'lucide-react';

const DocumentationSetting = () => {
  // State for project settings
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [projectType, setProjectType] = useState('');
  const [subProjectType, setSubProjectType] = useState('');


  // State for workflow steps
  const [workflowSteps, setWorkflowSteps] = useState([]);
  const [selectedStep, setSelectedStep] = useState(null);

  // State for documents
  const [stepDocuments, setStepDocuments] = useState([]);
  const [newDocumentName, setNewDocumentName] = useState('');
  const [isAddingDocument, setIsAddingDocument] = useState(false);

  // State for placeholders (Dynamic from API)
  const [selectedPlaceholder, setSelectedPlaceholder] = useState('');
  const [placeholders, setPlaceholders] = useState([]); // Array of objects { _id, labelKey, labelValue, number }
  const [showModal, setShowModal] = useState(false);
  const [modalPlaceholder, setModalPlaceholder] = useState(null); // Object to edit
  const [modalValue, setModalValue] = useState('');
  const [modalNumber, setModalNumber] = useState(1);
  const [addingPlaceholderName, setAddingPlaceholderName] = useState(''); // For adding NEW placeholder keys

  // Initialize data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [stages, fetchedPlaceholders] = await Promise.all([
        projectApi.getJourneyStages(),
        projectApi.getPlaceholders()
      ]);
      setWorkflowSteps(stages);
      if (stages.length > 0) setSelectedStep(stages[0].title);
      setPlaceholders(fetchedPlaceholders);
    } catch (error) {
      console.error("Error loading data", error);
    }
  };

  // Fetch documents when step changes
  useEffect(() => {
    if (selectedStep) {
      fetchDocuments(selectedStep.name); // Using name or ID? API uses name? Schema has 'stage' string.
    }
  }, [selectedStep]);

  const fetchDocuments = async (stageName) => {
    try {
      // Ideally we filter by category/projectType too if selected
      const docs = await projectApi.getProjectDocuments({ stage: stageName });
      setStepDocuments(docs);
    } catch (error) { console.error(error); }
  };

  const handleAddDocument = async () => {
    if (!newDocumentName.trim() || !selectedStep) return;

    try {
      const newDoc = await projectApi.createProjectDocument({
        documentName: newDocumentName,
        stage: selectedStep.name,
        required: true, // Default to required?
        category, subCategory: subcategory, projectType, subProjectType // Save filters if selected
      });
      setStepDocuments([...stepDocuments, newDoc]);
      setNewDocumentName('');
      setIsAddingDocument(false);
    } catch (error) { console.error(error); }
  };

  const handleDeleteDocument = async (id) => {
    try {
      await projectApi.deleteProjectDocument(id);
      setStepDocuments(stepDocuments.filter(d => d._id !== id));
    } catch (error) { console.error(error); }
  };

  // Placeholder Handlers
  const handleAddPlaceholderKey = async () => {
    if (!addingPlaceholderName.trim()) return;
    try {
      const newPh = await projectApi.savePlaceholder({
        labelKey: addingPlaceholderName,
        labelValue: '',
        number: placeholders.length + 1
      });
      setPlaceholders([...placeholders, newPh]);
      setAddingPlaceholderName('');
    } catch (e) { console.error(e); }
  };

  const handleEditPlaceholder = (placeholder) => {
    setModalPlaceholder(placeholder);
    setModalValue(placeholder.labelValue || '');
    setModalNumber(placeholder.number || 1);
    setShowModal(true);
  };

  const handleDeletePlaceholder = async (id) => {
    if (confirm('Delete this placeholder?')) {
      try {
        await projectApi.deletePlaceholder(id);
        setPlaceholders(placeholders.filter(p => p._id !== id));
      } catch (e) { console.error(e); }
    }
  };

  const savePlaceholderValue = async () => {
    if (!modalPlaceholder) return;
    try {
      const updated = await projectApi.savePlaceholder({
        labelKey: modalPlaceholder.labelKey,
        labelValue: modalValue,
        number: parseInt(modalNumber)
      });

      setPlaceholders(placeholders.map(p => p.labelKey === updated.labelKey ? updated : p));
      closeModal();
    } catch (e) { console.error(e); }
  };

  const closeModal = () => {
    setShowModal(false);
    setModalPlaceholder(null);
    setModalValue('');
  };

  // Helper to render placeholder item
  const renderPlaceholder = (key) => {
    // Logic for preview text replacement? 
    // Current implementation used function to substitute text.
    // We might not need this if we remove Document Preview text.
    return `[${key}]`;
  };


  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <header className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="w-8 h-8 text-blue-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Project Documentation Settings</h1>
              <p className="text-gray-600">Configure document templates and placeholders</p>
            </div>
          </div>
        </div>
      </header>

      <div className="space-y-6">
        {/* Project Settings Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center space-x-2">
              <Cog className="w-5 h-5 text-blue-500" />
              <span>Project Settings</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Category</option>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="industrial">Industrial</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory</label>
              <select
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Subcategory</option>
                <option value="solar">Solar Power</option>
                <option value="wind">Wind Energy</option>
                <option value="hydro">Hydro Power</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Project Type</label>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Project Type</option>
                <option value="new-installation">New Installation</option>
                <option value="upgrade">System Upgrade</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sub Project Type</label>
              <select
                value={subProjectType}
                onChange={(e) => setSubProjectType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Sub Project Type</option>
                <option value="rooftop">Rooftop Solar</option>
                <option value="ground">Ground Mount</option>
                <option value="hybrid">Hybrid System</option>
              </select>
            </div>
          </div>
        </div>

        {/* Workflow Steps Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center space-x-2">
              <ListChecks className="w-5 h-5 text-blue-500" />
              <span>Project Management Steps</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-4">
            {workflowSteps.map((step) => (
              <div
                key={step._id || step.title}
                onClick={() => setSelectedStep(step.title)}
                className={`bg-gray-50 rounded-lg p-4 text-center cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${selectedStep === step.title
                  ? 'border-2 border-blue-500 bg-blue-50'
                  : 'border border-gray-200'
                  }`}
              >
                <div className="font-medium text-gray-800 mb-2">{step.title}</div>
                <div className="text-2xl font-bold text-blue-500">{step.count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Document and Placeholder Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Document Preview Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center space-x-2 mb-6 pb-4 border-b">
                <File className="w-5 h-5 text-blue-500" />
                <span>Document Preview</span>
              </h2>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 md:p-8">
                <div className="text-center mb-8 pb-6 border-b">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
                    {selectedStep} Document
                  </h1>
                  <p className="text-gray-600">
                    For {renderPlaceholder("Project Type")} - {renderPlaceholder("Sub Project Type")}
                  </p>
                </div>

                <div className="space-y-4 text-gray-700 leading-relaxed">
                  <p>
                    This agreement is made on {renderPlaceholder("Date")} between {renderPlaceholder("Company Name")}
                    (hereinafter referred to as "the Company") and {renderPlaceholder("Client Name")}
                    (hereinafter referred to as "the Client").
                  </p>

                  <p>
                    The Client, residing at {renderPlaceholder("Client Address")}, with contact number
                    {renderPlaceholder("Client Mobile")}, agrees to following terms and conditions for installation
                    of a solar power system at their premises located in {renderPlaceholder("Cluster")}.
                  </p>

                  <p>
                    The project will be executed by {renderPlaceholder("Vendor Name")} and supervised by
                    {renderPlaceholder("Supervisor Name")}. The estimated completion date is
                    {renderPlaceholder("Completion Date")}.
                  </p>

                  <p>
                    All necessary approvals from {renderPlaceholder("Approval Authority")} have been obtained.
                    The system capacity is {renderPlaceholder("System Capacity")} kW with an estimated annual
                    production of {renderPlaceholder("Annual Production")} kWh.
                  </p>

                  <p>
                    The total project cost is {renderPlaceholder("Project Cost")}, with a subsidy amount of
                    {renderPlaceholder("Subsidy Amount")} approved by {renderPlaceholder("Subsidy Authority")}.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Placeholder Management Section */}
          <div>
            <div className="bg-white rounded-xl shadow-sm p-6 h-full">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center space-x-2 mb-6 pb-4 border-b">
                <Tag className="w-5 h-5 text-blue-500" />
                <span>Placeholder Management</span>
              </h2>

              {/* Add Placeholder Form */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add New Placeholder Key
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={addingPlaceholderName}
                    onChange={(e) => setAddingPlaceholderName(e.target.value)}
                    placeholder="e.g. Client Name"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleAddPlaceholderKey}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Placeholder List */}
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {placeholders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p>No placeholders added yet.</p>
                  </div>
                ) : (
                  placeholders.map((p) => (
                    <div
                      key={p._id}
                      className="bg-gray-50 rounded-lg p-3 flex justify-between items-center"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-800">{p.labelKey}</div>
                        <div className="text-xs text-blue-600 truncate">
                          {p.labelValue || 'Not set'}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {/* Display Number */}
                        <span className="bg-gray-200 text-gray-800 px-2 py-1 rounded text-xs">{p.number}</span>

                        <button
                          onClick={() => handleEditPlaceholder(p)}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePlaceholder(p._id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for editing placeholder */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-800">Edit Placeholder</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Placeholder Key
                </label>
                <input
                  type="text"
                  value={modalPlaceholder?.labelKey || ''}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Value (Default)
                </label>
                <input
                  type="text"
                  value={modalValue}
                  onChange={(e) => setModalValue(e.target.value)}
                  placeholder="Enter default value"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sequence Number
                </label>
                <input
                  type="number"
                  value={modalNumber}
                  onChange={(e) => setModalNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="p-6 pt-0 flex justify-end">
              <button
                onClick={savePlaceholderValue}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentationSetting;