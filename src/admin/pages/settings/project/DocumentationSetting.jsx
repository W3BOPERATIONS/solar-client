import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { projectApi } from '../../../../services/project/projectApi';
import { getProjectStats, getAllProjects } from '../../../../admin/services/projectApi';
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
  const navigate = useNavigate();
  // State for project settings
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [projectType, setProjectType] = useState('');
  const [subProjectType, setSubProjectType] = useState('');


  // Pre-defined suggestions for standard placeholders
  const availableSuggestions = [
    "Project Type", "Sub Project Type", "Date", "Company Name", "Client Name",
    "Client Address", "Client Mobile", "Cluster", "Vendor Name", "Supervisor Name",
    "Completion Date", "Approval Authority", "System Capacity", "Annual Production",
    "Project Cost", "Subsidy Amount", "Subsidy Authority", "Installation Date",
    "Warranty Period", "Maintenance Schedule", "Payment Terms", "Contract Duration"
  ];

  const dbFields = [
    { label: 'Project Name', value: 'projectName' },
    { label: 'Category', value: 'category' },
    { label: 'Project Type', value: 'projectType' },
    { label: 'Sub Project Type', value: 'subProjectType' },
    { label: 'Total KW', value: 'totalKW' },
    { label: 'Client Name', value: 'authorizedPersonName' },
    { label: 'Client Mobile', value: 'mobile' },
    { label: 'Client Email', value: 'email' },
    { label: 'Client Address', value: 'address' },
    { label: 'Installation Date', value: 'installationDate' },
    { label: 'Consumer Number', value: 'consumerNumber' },
    { label: 'Due Date', value: 'dueDate' }
  ];

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
  const [stageCounts, setStageCounts] = useState({});
  const [allJourneyStages, setAllJourneyStages] = useState([]); // All available stages from DB
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [templateContent, setTemplateContent] = useState('');
  const [isEditingTemplate, setIsEditingTemplate] = useState(true);
  const [selectedDbField, setSelectedDbField] = useState('');
  const [sampleProject, setSampleProject] = useState(null);
  const [isPreviewWithData, setIsPreviewWithData] = useState(false);

  // Initialize data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Fetch stats and config when filters change
  useEffect(() => {
    if (category || projectType || subcategory || subProjectType) {
      updateDynamicData();
    }
  }, [category, projectType, subcategory, subProjectType]);

  const updateDynamicData = async () => {
    try {
      setIsLoadingStats(true);

      // 1. Update stats
      const statsData = await getProjectStats({
        category,
        projectType,
        subCategory: subcategory,
        subProjectType
      });
      setStageCounts(statsData?.data?.stageCounts || {});

      // 2. Update workflow steps based on project type config
      if (projectType) {
        const configKey = `projectConfig_${projectType.replace(/\s+/g, '_')}`;
        const config = await projectApi.getConfigurationByKey(configKey);

        if (config && config.selectedSteps && config.selectedSteps.length > 0) {
          const activeSteps = config.selectedSteps.map(name => {
            const stage = allJourneyStages.find(s => s.name === name);
            return stage || { title: name, name: name };
          });
          setWorkflowSteps(activeSteps);
          // Only change selection if current isn't in new set? 
          // For now, keep selection if same title exists
          const currentTitle = selectedStep?.title || selectedStep?.name || selectedStep;
          if (!(selectedStep && activeSteps.find(s => (s.title || s.name) === currentTitle))) {
            if (activeSteps.length > 0) setSelectedStep(activeSteps[0]);
          }
        } else {
          // No specific config for this type, use default all stages
          setWorkflowSteps(allJourneyStages);
        }
      }
    } catch (error) {
      console.error("Error updating dynamic data", error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const loadInitialData = async () => {
    try {
      const [stages, fetchedPlaceholders, statsData] = await Promise.all([
        projectApi.getJourneyStages(),
        projectApi.getPlaceholders(),
        getProjectStats({ category, projectType, subCategory: subcategory, subProjectType })
      ]);

      setAllJourneyStages(stages);
      setPlaceholders(fetchedPlaceholders);
      setStageCounts(statsData?.data?.stageCounts || {});

      // Initially show all stages or filtered if defaults exist
      setWorkflowSteps(stages);
      if (stages.length > 0) setSelectedStep(stages[0]);

      // If there are default filters, trigger the update
      if (projectType) {
        updateDynamicData();
      }

      // Fetch a sample project for preview
      const sample = await getAllProjects({ limit: 1 });
      if (sample && sample.success && sample.data && sample.data.length > 0) {
        setSampleProject(sample.data[0]);
      }
    } catch (error) {
      console.error("Error loading data", error);
    }
  };

  // Fetch documents when step changes
  useEffect(() => {
    if (selectedStep) {
      fetchDocuments(selectedStep.name || selectedStep.title || selectedStep);
    }
  }, [selectedStep]);

  const fetchDocuments = async (stageName) => {
    try {
      const docs = await projectApi.getProjectDocuments({ stage: stageName });
      setStepDocuments(docs);
      if (docs && docs.length > 0) {
        setTemplateContent(docs[0].templateContent || '');
      } else {
        setTemplateContent('');
      }
    } catch (error) { console.error(error); }
  };

  const handleSaveTemplate = async () => {
    if (!selectedStep || stepDocuments.length === 0) return;
    try {
      const doc = stepDocuments[0];
      await projectApi.updateProjectDocument(doc._id, {
        ...doc,
        templateContent
      });
      alert('Template saved successfully!');
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

  const handleAddPlaceholderKey = async () => {
    if (!selectedPlaceholder) return;

    // Logic for cursor insertion
    const textarea = document.getElementById('template-editor');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = templateContent;
      const placeholder = `{{${selectedPlaceholder.replace(/\s+/g, '_').toLowerCase()}}}`;
      const newContent = text.substring(0, start) + placeholder + text.substring(end);
      setTemplateContent(newContent);

      // Need to focus back and set cursor?
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
      }, 0);
    }

    try {
      // Also save the placeholder key if it doesn't exist? 
      // User says: "From the Select Placeholder dropdown, user can select..."
      // But we should also ensure the DB knows about this key.
      const existing = placeholders.find(p => p.labelKey === selectedPlaceholder);
      if (!existing) {
        const newPh = await projectApi.savePlaceholder({
          labelKey: selectedPlaceholder,
          labelValue: '',
          dbField: '', // User will set this later
          number: placeholders.length + 1
        });
        setPlaceholders([...placeholders, newPh]);
      }
      setSelectedPlaceholder('');
    } catch (e) { console.error(e); }
  };

  const handleEditPlaceholder = (placeholder) => {
    setModalPlaceholder(placeholder);
    setModalValue(placeholder.labelValue || '');
    setSelectedDbField(placeholder.dbField || '');
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
        dbField: selectedDbField,
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
    setSelectedDbField('');
  };

  // Helper to render placeholder item
  const renderPlaceholder = (key) => {
    // Check if key is a placeholder in our list
    const placeholderName = key.toLowerCase().replace(/\s+/g, '_');
    const phConfig = placeholders.find(p => p.labelKey.toLowerCase().replace(/\s+/g, '_') === placeholderName);

    let displayValue = `[${key}]`;
    let isReplaced = false;

    if (isPreviewWithData && sampleProject) {
      if (phConfig && phConfig.dbField) {
        displayValue = sampleProject[phConfig.dbField] || phConfig.labelValue || `[Missing: ${phConfig.labelKey}]`;
        isReplaced = true;
      } else if (phConfig && phConfig.labelValue) {
        displayValue = phConfig.labelValue;
        isReplaced = true;
      }
    }

    return (
      <span className={`inline-flex items-center space-x-1 border border-dashed rounded px-1 py-0.5 mx-1 text-sm
        ${isReplaced ? 'border-green-500 bg-green-50 text-green-700' : 'border-yellow-500 bg-yellow-50/50 text-yellow-600'}`}>
        <span className={`flex items-center justify-center w-4 h-4 rounded-full text-white text-[10px] font-bold
          ${isReplaced ? 'bg-green-500' : 'bg-[#0ea5e9]'}`}>
          {isReplaced ? '✓' : 'i'}
        </span>
        <span className="font-medium">{displayValue}</span>
      </span>
    );
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
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center space-x-2 mb-6 pb-4 border-b border-gray-100">
            <Cog className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-bold text-[#1e3a8a]">Project Settings</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {/* Row 1 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm bg-white"
              >
                <option value="">Select Category</option>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="industrial">Industrial</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Project Type</label>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm bg-white"
              >
                <option value="">Select Project Type</option>
                <option value="new-installation">New Installation</option>
                <option value="upgrade">System Upgrade</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>

            {/* Row 2 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory</label>
              <select
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm bg-white"
              >
                <option value="">Select Subcategory</option>
                <option value="solar">Solar Power</option>
                <option value="wind">Wind Energy</option>
                <option value="hydro">Hydro Power</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sub Project Type</label>
              <select
                value={subProjectType}
                onChange={(e) => setSubProjectType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm bg-white"
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
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center space-x-2 mb-6 pb-4 border-b border-gray-100">
            <ListChecks className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-bold text-[#1e3a8a]">Project Management Steps</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {workflowSteps.map((step, index) => {
              // Get actual count from stageCounts
              const count = stageCounts[step.name] || 0;
              return (
                <div
                  key={step._id || step.title || index}
                  onClick={() => setSelectedStep(step)}
                  className={`rounded-xl p-3 text-center cursor-pointer transition-all duration-200 border-2 shadow-sm flex flex-col items-center justify-center min-h-[100px] w-full
                    ${(selectedStep?.title || selectedStep?.name || selectedStep) === (step.title || step.name)
                      ? 'border-[#0ea5e9] bg-[#f0f9ff] ring-1 ring-[#0ea5e9] ring-opacity-20'
                      : 'border-[#38bdf8] bg-white hover:border-[#0ea5e9] hover:bg-[#f0f9ff]'
                    }`}
                >
                  <div className="text-[12px] font-bold text-gray-700 leading-tight mb-2 flex-1 flex items-center justify-center w-full px-1">
                    {step.title || step.name}
                  </div>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      const statusParam = step.title || step.name;
                      navigate(`/admin/projects?status=${encodeURIComponent(statusParam)}`);
                    }}
                    className="text-2xl font-black text-[#0ea5e9] hover:underline hover:scale-110 transition-transform"
                    title={`View all ${step.title || step.name} projects`}
                  >
                    {count}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Document and Placeholder Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Document Preview Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-6 pb-4 border-b">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center space-x-2">
                  <File className="w-5 h-5 text-blue-500" />
                  <span>Document Template Editor</span>
                </h2>
                <div className="flex space-x-2">
                  {!isEditingTemplate && (
                    <button
                      onClick={() => setIsPreviewWithData(!isPreviewWithData)}
                      className={`px-3 py-1 text-sm border rounded-lg flex items-center transition-colors
                        ${isPreviewWithData ? 'bg-green-100 border-green-300 text-green-700' : 'border-gray-300 hover:bg-gray-50'}`}
                    >
                      {isPreviewWithData ? 'Using Sample Data' : 'Show Placeholders'}
                    </button>
                  )}
                  <button
                    onClick={() => setIsEditingTemplate(!isEditingTemplate)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
                  >
                    {isEditingTemplate ? 'Preview Mode' : 'Editor Mode'}
                  </button>
                  <button
                    onClick={handleSaveTemplate}
                    disabled={stepDocuments.length === 0}
                    className="px-4 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    Save Template
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-[500px] flex flex-col">
                <div className="mb-2 text-xs text-gray-500 italic">
                  Note: Use placeholders like {"{{client_name}}"} which will be replaced during generation.
                </div>
                {isEditingTemplate ? (
                  <textarea
                    id="template-editor"
                    value={templateContent}
                    onChange={(e) => setTemplateContent(e.target.value)}
                    className="w-full flex-1 p-6 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none leading-relaxed"
                    placeholder="Enter document template content here..."
                  />
                ) : (
                  <div className="w-full flex-1 p-8 bg-gray-50 border border-gray-200 rounded-lg overflow-auto">
                    <div className="max-w-[800px] mx-auto bg-white p-10 shadow-sm min-h-full whitespace-pre-wrap leading-loose text-sm text-gray-800">
                      {templateContent.split(/(\{\{[^{}]+\}\})/).map((part, i) => {
                        if (part.startsWith('{{') && part.endsWith('}}')) {
                          const key = part.slice(2, -2).toUpperCase().replace(/_/g, ' ');
                          return renderPlaceholder(key);
                        }
                        return part;
                      })}
                    </div>
                  </div>
                )}
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
              <div className="mb-8">
                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm bg-white"
                    value={selectedPlaceholder}
                    onChange={(e) => setSelectedPlaceholder(e.target.value)}
                  >
                    <option value="">Select a placeholder</option>
                    {availableSuggestions.map((placeholder, index) => (
                      <option key={index} value={placeholder}>
                        {placeholder}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAddPlaceholderKey}
                    className="px-5 py-2 bg-[#0284c7] text-white rounded-lg hover:bg-[#0369a1] transition-colors flex items-center shadow-sm text-sm font-medium"
                  >
                    <Plus className="w-4 h-4 mr-1 stroke-[3]" />
                    Add
                  </button>
                </div>
              </div>

              {/* Placeholder List */}
              <div className="space-y-3 min-h-[300px] flex flex-col">
                {placeholders.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-center p-8">
                    <p className="text-gray-500 text-sm">
                      No placeholders added yet. Use the form above to add placeholders.
                    </p>
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

              {/* Footer Button */}
              <div className="flex justify-end mt-4 pt-4 border-t border-gray-100">
                <button
                  className="px-6 py-2 bg-[#22c55e] text-white rounded-md hover:bg-[#16a34a] transition-colors flex items-center shadow-sm text-sm font-semibold"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Document
                </button>
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
                  Database Field Mapping
                </label>
                <select
                  value={selectedDbField}
                  onChange={(e) => setSelectedDbField(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                >
                  <option value="">No mapping (Static Value)</option>
                  {dbFields.map((field) => (
                    <option key={field.value} value={field.value}>
                      {field.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Select which database field this placeholder should automatically pull data from.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Value (If DB field empty)
                </label>
                <input
                  type="text"
                  value={modalValue}
                  onChange={(e) => setModalValue(e.target.value)}
                  placeholder="Enter fallback value"
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