import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Building2,
  CheckCircle,
  Edit2,
  Trash2,
  Save,
  X,
  Download,
  Upload,
  PlusCircle
} from 'lucide-react';
import { useLocations } from '../../../../hooks/useLocations';
import {
  createDiscom,
  getDiscomsByState,
  updateDiscom,
  deleteDiscom,
  getQuoteSettings
} from '../../../../services/quote/quoteApi';
import toast from 'react-hot-toast';

export default function DiscomMaster() {
  const [selectedStateId, setSelectedStateId] = useState('');
  const [discomName, setDiscomName] = useState('');
  const [discomId, setDiscomId] = useState(null); // For editing
  const [showDiscomSection, setShowDiscomSection] = useState(false);
  const [showProjectTable, setShowProjectTable] = useState(false);

  // Data for the Input Table (derived from QuoteSettings)
  const [projectData, setProjectData] = useState([]);

  // Existing Discoms for the selected state
  const [existingDiscoms, setExistingDiscoms] = useState([]);

  const { states } = useLocations();
  const selectedStateName = states.find((s) => s._id === selectedStateId)?.name || '';
  const colorClasses = [
    'bg-blue-500 hover:bg-blue-600',
    'bg-green-500 hover:bg-green-600',
    'bg-orange-500 hover:bg-orange-600',
    'bg-purple-500 hover:bg-purple-600',
  ];

  // Fetch QuoteSettings to populate Project Types
  const fetchProjectTemplates = async () => {
    try {
      const settings = await getQuoteSettings();
      // Transform settings into the format needed for the table
      const templates = settings.map((s, index) => ({
        id: s._id || index, // Use _id if available, else index
        category: s.category,
        subCategory: s.subCategory,
        projectType: s.projectType,
        subProjectType: s.subProjectType,
        unitPrice: '',
        billTariff: '',
        isEditing: false
      }));
      setProjectData(templates);
    } catch (error) {
      console.error("Error fetching quote settings:", error);
      toast.error("Failed to load project templates");
    }
  };

  useEffect(() => {
    fetchProjectTemplates();
  }, []);

  // Fetch Existing Discoms when State changes
  useEffect(() => {
    if (selectedStateId) {
      fetchDiscoms(selectedStateId);
    }
  }, [selectedStateId]);

  const fetchDiscoms = async (stateId) => {
    try {
      const data = await getDiscomsByState(stateId);
      setExistingDiscoms(data);
    } catch (error) {
      console.error("Error fetching discoms:", error);
      toast.error("Failed to load existing discoms");
    }
  };

  // Handle state selection
  const handleStateSelect = (stateId) => {
    setSelectedStateId(stateId);
    setShowDiscomSection(true);
    // Reset form
    setDiscomName('');
    setDiscomId(null);
    setShowProjectTable(false);
    // Reset project data values
    fetchProjectTemplates();
  };

  // Handle show project table
  const handleShowProjectTable = () => {
    if (!discomName.trim()) {
      alert('Enter Discomm Name');
      return;
    }
    setShowProjectTable(true);
  };

  // Handle project data change
  const handleProjectDataChange = (id, field, value) => {
    setProjectData(prevData =>
      prevData.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  // Handle Save Discom (Create or Update)
  const handleSaveDiscom = async () => {
    if (!discomName.trim()) {
      toast.error("Please enter Discom Name");
      return;
    }

    const payload = {
      state: selectedStateId,
      name: discomName,
      projects: projectData.map(item => ({
        category: item.category,
        subCategory: item.subCategory,
        projectType: item.projectType,
        subProjectType: item.subProjectType,
        unitPrice: parseFloat(item.unitPrice) || 0,
        billTariff: parseFloat(item.billTariff) || 0
      }))
    };

    try {
      if (discomId) {
        // Update
        await updateDiscom(discomId, payload);
        toast.success("Discom updated successfully");
      } else {
        // Create
        await createDiscom(payload);
        toast.success("Discom created successfully");
      }

      // Refresh list and reset form
      fetchDiscoms(selectedStateId);
      setDiscomName('');
      setDiscomId(null);
      setShowProjectTable(false);
      fetchProjectTemplates(); // Reset inputs

    } catch (error) {
      console.error("Error saving discom:", error);
      toast.error("Failed to save discom");
    }
  };

  // Edit Existing Discom
  const handleEditDiscom = (discom) => {
    setDiscomId(discom._id);
    setDiscomName(discom.name);
    setShowProjectTable(true);
    setShowDiscomSection(true);

    // Merge existing project values into projectData template
    const mergedData = projectData.map(template => {
      const existing = discom.projects.find(p =>
        p.category === template.category &&
        p.subCategory === template.subCategory &&
        p.projectType === template.projectType &&
        p.subProjectType === template.subProjectType
      );
      if (existing) {
        return {
          ...template,
          unitPrice: existing.unitPrice,
          billTariff: existing.billTariff
        };
      }
      return template;
    });
    setProjectData(mergedData);

    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete Discom
  const handleDeleteDiscom = async (id) => {
    if (window.confirm("Are you sure you want to delete this Discom?")) {
      try {
        await deleteDiscom(id);
        toast.success("Discom deleted successfully");
        fetchDiscoms(selectedStateId);
        if (discomId === id) {
          setDiscomName('');
          setDiscomId(null);
          setShowProjectTable(false);
        }
      } catch (error) {
        console.error("Error deleting discom:", error);
        toast.error("Failed to delete discom");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <div className="inline-flex items-center bg-white p-4 shadow-sm rounded-lg w-full">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center">
                  <Building2 className="mr-3" size={28} />
                  Discomm Master
                </h3>
              </div>
            </li>
          </ol>
        </nav>
      </div>

      {/* State Cards Section */}
      <div className="container mx-auto mb-8">
        <h4 className="text-xl font-bold text-gray-700 mb-4 flex items-center">
          <MapPin className="mr-2" size={24} />
          Select State
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {states.length > 0 ? (
            states.map((state, index) => (
              <div
                key={state._id}
                className={`cursor-pointer rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 ${selectedStateId === state._id ? 'ring-4 ring-offset-2 ring-blue-400' : ''
                  } ${colorClasses[index % colorClasses.length]} text-white p-6 text-center`}
                onClick={() => handleStateSelect(state._id)}
              >
                <div className="text-xl font-bold">{state.name}</div>
                <div className="mt-2 text-sm opacity-90">
                  {selectedStateId === state._id ? 'Selected' : 'Click to select'}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-500">
              No states available. Please add them in Settings → Location Management.
            </div>
          )}
        </div>
      </div>

      {/* Discomm Input Section */}
      {showDiscomSection && (
        <div className="container mx-auto mb-8 bg-white p-6 rounded-lg shadow-lg">
          <h4 className="text-xl font-bold text-gray-700 mb-4">
            {discomId ? 'Edit Discom' : 'Add New Discom'} for:
            <span className="ml-2 font-bold text-blue-600">{selectedStateName}</span>
          </h4>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="discommName">
              Discomm Name
            </label>
            <input
              type="text"
              id="discommName"
              value={discomName}
              onChange={(e) => setDiscomName(e.target.value)}
              placeholder="Enter Discomm Name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
            />
          </div>

          <button
            onClick={handleShowProjectTable}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg flex items-center transition duration-200"
          >
            <CheckCircle className="mr-2" size={20} />
            {showProjectTable ? 'Refresh Project Types' : 'Configure Project Rates'}
          </button>
        </div>
      )}

      {/* Project Type Table */}
      {showProjectTable && (
        <div className="container mx-auto mb-8 bg-white p-6 rounded-lg shadow-lg">
          <h4 className="text-xl font-bold text-gray-700 mb-6">Project Rate Configuration</h4>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-blue-50">
                <tr>
                  <th className="py-3 px-4 border-b text-left font-bold text-gray-700">Category</th>
                  <th className="py-3 px-4 border-b text-left font-bold text-gray-700">Sub Category</th>
                  <th className="py-3 px-4 border-b text-left font-bold text-gray-700">Project Type</th>
                  <th className="py-3 px-4 border-b text-left font-bold text-gray-700">Sub Project Type</th>
                  <th className="py-3 px-4 border-b text-left font-bold text-gray-700">Unit Price</th>
                  <th className="py-3 px-4 border-b text-left font-bold text-gray-700">Bill Tariff</th>
                </tr>
              </thead>
              <tbody>
                {projectData.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-gray-500">
                      No Project Types defined in Quote Settings. Please configure Quote Settings first.
                    </td>
                  </tr>
                ) : (
                  projectData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition duration-150">
                      <td className="py-3 px-4 border-b">
                        <div className="font-medium text-gray-800">{item.category}</div>
                      </td>
                      <td className="py-3 px-4 border-b">
                        <div className="font-medium text-gray-800">{item.subCategory}</div>
                      </td>
                      <td className="py-3 px-4 border-b">
                        <div className="font-medium text-gray-800">{item.projectType}</div>
                      </td>
                      <td className="py-3 px-4 border-b">
                        <div className="font-medium text-gray-800">{item.subProjectType}</div>
                      </td>
                      <td className="py-3 px-4 border-b">
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => handleProjectDataChange(item.id, 'unitPrice', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Enter price"
                        />
                      </td>
                      <td className="py-3 px-4 border-b">
                        <input
                          type="number"
                          value={item.billTariff}
                          onChange={(e) => handleProjectDataChange(item.id, 'billTariff', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Enter tariff"
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <button
            onClick={handleSaveDiscom}
            className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 px-6 rounded-lg mt-6 flex items-center transition duration-200"
          >
            <Save className="mr-2" size={20} />
            {discomId ? 'Update Discom' : 'Save Discom'}
          </button>
        </div>
      )}

      {/* Existing Discoms List */}
      {selectedStateId && (
        <div className="container mx-auto mb-8 bg-white p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-xl font-bold text-gray-700">Existing Discoms for {selectedStateName}</h4>
            <div className="bg-blue-100 text-blue-800 py-1 px-3 rounded-full text-sm font-semibold">
              Count: {existingDiscoms.length}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 border-b text-left font-bold text-gray-700">#</th>
                  <th className="py-3 px-4 border-b text-left font-bold text-gray-700">Discom Name</th>
                  <th className="py-3 px-4 border-b text-left font-bold text-gray-700">Configured Projects</th>
                  <th className="py-3 px-4 border-b text-center font-bold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {existingDiscoms.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-gray-500">
                      No Discoms found for this state.
                    </td>
                  </tr>
                ) : (
                  existingDiscoms.map((discom, index) => (
                    <tr key={discom._id} className="hover:bg-gray-50 transition duration-150">
                      <td className="py-3 px-4 border-b text-gray-600">{index + 1}</td>
                      <td className="py-3 px-4 border-b font-medium text-gray-800">{discom.name}</td>
                      <td className="py-3 px-4 border-b text-gray-600">
                        {discom.projects ? discom.projects.length : 0} Types
                      </td>
                      <td className="py-3 px-4 border-b text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handleEditDiscom(discom)}
                            className="text-blue-600 hover:text-blue-800 bg-blue-50 p-2 rounded-full transition"
                            title="Edit"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteDiscom(discom._id)}
                            className="text-red-600 hover:text-red-800 bg-red-50 p-2 rounded-full transition"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}