import React, { useState, useEffect } from 'react';
import { projectApi } from '../../../../services/project/projectApi';
import {
  Tags,
  Search,
  Plus,
  Save,
  Edit,
  Trash2,
  CheckSquare,
  FileText,
  Home,
  Building,
  Filter,
  Calendar,
  User,
  MapPin,
  Phone,
  Users,
  Briefcase,
  Clock,
  CheckCircle,
  DollarSign,
  Settings,
  AlertCircle
} from 'lucide-react';

export default function PlaceholderNameSetting() {
  // State for placeholders
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlaceholder, setSelectedPlaceholder] = useState('');
  const [placeholders, setPlaceholders] = useState([]); // Array of objects
  const [editingPlaceholder, setEditingPlaceholder] = useState(null);
  const [placeholderKey, setPlaceholderKey] = useState('');
  const [placeholderValue, setPlaceholderValue] = useState('');
  const [placeholderNumber, setPlaceholderNumber] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Available placeholder suggestions (Static list for dropdown if needed, or remove)
  const availableSuggestions = [
    "Project Type", "Sub Project Type", "Date", "Company Name", "Client Name",
    "Client Address", "Client Mobile", "Cluster", "Vendor Name", "Supervisor Name",
    "Completion Date", "Approval Authority", "System Capacity", "Annual Production",
    "Project Cost", "Subsidy Amount", "Subsidy Authority", "Installation Date",
    "Warranty Period", "Maintenance Schedule", "Payment Terms", "Contract Duration"
  ];

  // Initialize data
  useEffect(() => {
    fetchPlaceholders();
  }, []);

  const fetchPlaceholders = async () => {
    try {
      const data = await projectApi.getPlaceholders();
      setPlaceholders(data);
    } catch (error) { console.error(error); }
  };

  const handleAddPlaceholder = async () => {
    if ((!selectedPlaceholder && !isAddingNew) || (isAddingNew && !placeholderKey)) {
      alert('Please enter or select a placeholder key');
      return;
    }

    const keyToAdd = isAddingNew ? placeholderKey : selectedPlaceholder;

    // Check if exists locally (though backend would enforce unique key usually)
    if (placeholders.find(p => p.labelKey === keyToAdd)) {
      alert('Placeholder already exists');
      return;
    }

    setEditingPlaceholder(null);
    setPlaceholderKey(keyToAdd);
    setPlaceholderValue('');
    setPlaceholderNumber(placeholders.length + 1);
    setIsModalOpen(true);
  };

  const handleEditPlaceholder = (placeholder) => {
    setEditingPlaceholder(placeholder);
    setPlaceholderKey(placeholder.labelKey);
    setPlaceholderValue(placeholder.labelValue || '');
    setPlaceholderNumber(placeholder.number || 1);
    setIsModalOpen(true);
  };

  const handleDeletePlaceholder = async (id) => {
    if (window.confirm(`Are you sure you want to delete this placeholder?`)) {
      try {
        await projectApi.deletePlaceholder(id);
        setPlaceholders(placeholders.filter(p => p._id !== id));
      } catch (e) { console.error(e); }
    }
  };

  const handleSavePlaceholder = async () => {
    try {
      const payload = {
        labelKey: placeholderKey,
        labelValue: placeholderValue,
        number: parseInt(placeholderNumber)
      };

      // If editing, we might need ID, but savePlaceholder uses upsert logic usually or strictly create. 
      // My controller for savePlaceholderName logic: 
      // const existing = await PlaceholderName.findOne({ labelKey }); if (existing) update else create.
      // So payload is enough. 
      // Wait, if I EDIT the KEY, it might create a new one. 
      // But here I probably shouldn't allow editing the KEY of an existing placeholder, only value.
      // Let's check handleEditPlaceholder: I set placeholderKey.
      // If I change placeholderKey, it will be treated as a new Key or update if exists.

      await projectApi.savePlaceholder(payload);

      // Refresh list
      fetchPlaceholders();
      setIsModalOpen(false);
      resetModal();
    } catch (e) { console.error(e); }
  };

  const resetModal = () => {
    setEditingPlaceholder(null);
    setPlaceholderKey('');
    setPlaceholderValue('');
    setPlaceholderNumber(1);
    setIsAddingNew(false);
  };

  // Filtered placeholders
  const filteredPlaceholders = placeholders.filter(p =>
    p.labelKey.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <header className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Tags className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Placeholder Name Settings</h1>
                <p className="text-gray-600">Manage placeholders used in project templates</p>
              </div>
            </div>
          </div>
        </header>

        <div className="space-y-6">

          {/* Placeholder Management Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-6 pb-4 border-b">
              <Tags className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-800">Placeholder Management</h2>
            </div>

            {/* Search Placeholders */}
            <div className="relative mb-6">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search placeholders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Add Placeholder Form */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Add New Placeholder
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-grow">
                  <div className="flex gap-2 mb-2">
                    <button
                      onClick={() => setIsAddingNew(false)}
                      className={`px-3 py-1 rounded text-sm ${!isAddingNew ? 'bg-blue-100 text-blue-700' : 'bg-gray-200'}`}
                    >Select Existing</button>
                    <button
                      onClick={() => setIsAddingNew(true)}
                      className={`px-3 py-1 rounded text-sm ${isAddingNew ? 'bg-blue-100 text-blue-700' : 'bg-gray-200'}`}
                    >Create Custom</button>
                  </div>

                  {!isAddingNew ? (
                    <select
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={selectedPlaceholder}
                      onChange={(e) => setSelectedPlaceholder(e.target.value)}
                    >
                      <option value="">Select placeholder to add</option>
                      {availableSuggestions.map((placeholder, index) => (
                        <option key={index} value={placeholder}>
                          {placeholder}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Enter custom placeholder key"
                      value={placeholderKey}
                      onChange={(e) => setPlaceholderKey(e.target.value)}
                    />
                  )}
                </div>
                <button
                  onClick={handleAddPlaceholder}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mt-auto"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </button>
              </div>
            </div>

            {/* Placeholder List */}
            <div className="max-h-[500px] overflow-y-auto mb-6">
              {filteredPlaceholders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
                    <Tags className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No placeholders found
                  </h3>
                  <p className="text-gray-500">
                    {searchTerm ? 'Try a different search term' : 'Add your first placeholder using the form above'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredPlaceholders.map((p) => (
                    <div
                      key={p._id}
                      className="bg-gray-50 rounded-lg p-4 flex items-center justify-between hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{p.labelKey}</div>
                        <div className="text-sm text-blue-600">
                          Value: {p.labelValue || 'No value set'}
                        </div>
                      </div>
                      <div className="flex space-x-2 items-center">
                        <span className="text-xs bg-gray-200 px-2 py-1 rounded mx-2">Seq: {p.number}</span>
                        <button
                          onClick={() => handleEditPlaceholder(p)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeletePlaceholder(p._id)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4 border-t">
              <span className="text-sm text-gray-600">
                {filteredPlaceholders.length} placeholder{filteredPlaceholders.length !== 1 ? 's' : ''}
              </span>
            </div>

          </div>
        </div>
      </div>

      {/* Edit Placeholder Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4 pb-3 border-b">
                  <h3 className="text-lg font-medium text-gray-900">Edit Placeholder</h3>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Placeholder Name
                    </label>
                    <input
                      type="text"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 sm:text-sm"
                      value={placeholderKey}
                      readOnly
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Placeholder Custom Name
                    </label>
                    <input
                      type="text"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Enter value for this placeholder"
                      value={placeholderValue}
                      onChange={(e) => setPlaceholderValue(e.target.value)}
                    />
                  </div>

                  <div className="bg-gray-50 rounded-md p-4 border border-dashed border-gray-200">
                    <div className="text-sm font-medium text-gray-700 mb-2">Preview:</div>
                    <div className="text-sm text-gray-600">
                      <span className="font-mono bg-yellow-100 px-1 rounded">[{placeholderKey}]</span> will be replaced with:
                      <span className="ml-2 font-medium text-blue-600">{placeholderValue || '[Value]'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleSavePlaceholder}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Save Placeholder
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}