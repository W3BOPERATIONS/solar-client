import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import {
  getTerraceTypes,
  createTerraceType,
  updateTerraceType,
  deleteTerraceType
} from '../../../../services/quote/quoteApi';
import toast from 'react-hot-toast';

export default function TerraceSetting() {
  const [terraceTypes, setTerraceTypes] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef(null);

  // Fetch terrace types on mount
  useEffect(() => {
    fetchTerraceTypes();
  }, []);

  const fetchTerraceTypes = async () => {
    try {
      const data = await getTerraceTypes();
      setTerraceTypes(data);
    } catch (error) {
      console.error("Error fetching terrace types:", error);
      toast.error("Failed to load terrace types");
    }
  };

  // Focus on input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Add new terrace type
  const handleAddTerrace = async () => {
    if (inputValue.trim() !== '') {
      try {
        await createTerraceType({ name: inputValue.trim() });
        setInputValue('');
        setErrorMessage('');
        fetchTerraceTypes();
        toast.success("Terrace type added successfully");
        if (inputRef.current) {
          inputRef.current.focus();
        }
      } catch (error) {
        console.error("Error adding terrace type:", error);
        toast.error("Failed to add terrace type");
      }
    } else {
      setErrorMessage('⚠️ Please enter a terrace type name!');
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddTerrace();
    }
  };

  // Start editing a terrace type
  const startEdit = (type) => {
    setEditingId(type._id);
    setEditValue(type.name);
  };

  // Save edited terrace type
  const saveEdit = async () => {
    if (editValue.trim() !== '') {
      try {
        await updateTerraceType(editingId, { name: editValue.trim() });
        setEditingId(null);
        setEditValue('');
        fetchTerraceTypes();
        toast.success("Terrace type updated successfully");
      } catch (error) {
        console.error("Error updating terrace type:", error);
        toast.error("Failed to update terrace type");
      }
    }
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  // Delete terrace type
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this terrace type?")) {
      try {
        await deleteTerraceType(id);
        fetchTerraceTypes();
        toast.success("Terrace type deleted successfully");
        if (editingId === id) {
          setEditingId(null);
        }
      } catch (error) {
        console.error("Error deleting terrace type:", error);
        toast.error("Failed to delete terrace type");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Page Header */}
      <div className="mb-6">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <div className="inline-flex items-center text-sm font-medium">
                <span className="text-2xl font-bold text-center text-blue-600">Terrace Setting</span>
              </div>
            </li>
          </ol>
        </nav>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Card Header */}
          <div className="bg-blue-600 text-white font-bold text-center py-4 px-6">
            <h2 className="text-xl">Add Terrace Type</h2>
          </div>

          {/* Card Body */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Input Section */}
              <div className="space-y-4">
                <div>
                  <h6 className="font-bold text-blue-600 text-lg mb-3">Terrace Type</h6>
                  <div className="space-y-3">
                    <div className="flex space-x-2">
                      <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Enter Terrace Type Name"
                        className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={handleAddTerrace}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-1 transition duration-200"
                      >
                        <Plus size={20} />
                        <span>Add</span>
                      </button>
                    </div>
                    {errorMessage && (
                      <div className="text-red-600 font-bold text-sm animate-pulse">
                        {errorMessage}
                      </div>
                    )}
                  </div>
                </div>

                {/* Inline Editing (when editing) */}
                {editingId !== null && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                    <h3 className="font-bold text-yellow-700 mb-2">Editing Terrace Type</h3>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-grow px-4 py-2 border border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        placeholder="Edit terrace type name"
                      />
                      <button
                        onClick={saveEdit}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-1 transition duration-200"
                      >
                        <Save size={20} />
                        <span>Save</span>
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center space-x-1 transition duration-200"
                      >
                        <X size={20} />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Summary */}
              <div>
                <div className="bg-white border border-blue-200 rounded-lg shadow-sm overflow-hidden">
                  <div className="bg-blue-600 text-white font-bold text-center py-3 px-6">
                    <h3 className="text-lg">Terrace Type Summary</h3>
                  </div>
                  <div className="p-4 min-h-[200px]">
                    {terraceTypes.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <span className="text-gray-500 text-lg italic">
                          No terrace types added yet.
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {terraceTypes.map((item, index) => (
                          <div
                            key={item._id}
                            className="flex justify-between items-center border-b border-gray-200 py-3 px-2 hover:bg-gray-50 rounded transition duration-150"
                          >
                            <div className="flex items-center space-x-3">
                              <span className="text-gray-700 font-medium">
                                {index + 1}.
                              </span>
                              <span className="text-gray-800 font-semibold">
                                {item.name}
                              </span>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => startEdit(item)}
                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-full transition duration-200"
                                title="Edit"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button
                                onClick={() => handleDelete(item._id)}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-full transition duration-200"
                                title="Delete"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Statistics */}
                {terraceTypes.length > 0 && (
                  <div className="mt-4 bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {terraceTypes.length}
                        </div>
                        <div className="text-sm text-gray-600">Total Types</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {terraceTypes.length}
                        </div>
                        <div className="text-sm text-gray-600">Unique Types</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h4 className="font-bold text-blue-700 text-lg mb-2">How to use:</h4>
          <ul className="list-disc pl-5 space-y-1 text-blue-600">
            <li>Enter a terrace type name in the input field and click "Add" or press Enter</li>
            <li>Click the edit icon (✏️) to modify an existing terrace type</li>
            <li>Click the delete icon (🗑️) to remove a terrace type</li>
            <li>All changes are saved to the database immediately</li>
          </ul>
        </div>
      </div>

      {/* Footer Note */}
      <div className="mt-8 text-center text-gray-500 text-sm">
        <p>Terrace Setting Configuration • All changes are saved to the database</p>
      </div>
    </div>
  );
}
