import React, { useState, useEffect } from 'react';
import {
  PlusCircle, Save, RefreshCw, Cog, List,
  Edit2, Trash2, CheckSquare, XSquare,
  Search, Filter, MoreVertical, ChevronRight,
  AlertCircle, Info, Settings, Eye, Package,
  Loader, Upload, FileText
} from 'lucide-react';
import { useLocations } from '../../../../hooks/useLocations';
import {
  createSolarKit as createSolarkit,
  getSolarKits as getSolarkits,
  updateSolarKit as updateSolarkit,
  deleteSolarKit as deleteSolarkit,
  updateSolarKitStatus as updateSolarkitStatus,
  saveSolarKitBOM as saveSolarkitBOM,
  getSolarKitBOM as getSolarkitBOM
} from '../../../../services/combokit/combokitApi';
import toast from 'react-hot-toast';

const CreateSolarkit = () => {
  const { countries, loading: locationLoading, fetchCountries } = useLocations();

  // State management
  const [selectedCountry, setSelectedCountry] = useState('');
  const [showTable, setShowTable] = useState(false); // Controls visibility of the table
  const [solarkits, setSolarkits] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [bomModalOpen, setBomModalOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form states
  const [solarkitForm, setSolarkitForm] = useState({
    name: '',
    products: [''],
    country: ''
  });

  // BOM State
  const [bomData, setBomData] = useState([]);
  const [currentKitId, setCurrentKitId] = useState(null);

  // Fetch initial data
  useEffect(() => {
    fetchCountries();
  }, []);

  // Fetch Solarkits
  const fetchSolarkits = async () => {
    try {
      setLoading(true);
      const data = await getSolarkits();
      setSolarkits(data);
    } catch (error) {
      console.error('Error fetching solarkits:', error);
      toast.error('Failed to load solarkits');
    } finally {
      setLoading(false);
    }
  };

  // Handle country selection
  const handleCountrySelect = (countryId) => {
    setSelectedCountry(countryId);
    if (countryId) {
      setShowTable(true);
      fetchSolarkits(); // Fetch solarkits for the selected country (filtering can be added later if needed)
    } else {
      setShowTable(false);
      setSolarkits([]);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSolarkitForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle product changes
  const handleProductChange = (index, value) => {
    const newProducts = [...solarkitForm.products];
    newProducts[index] = value;
    setSolarkitForm(prev => ({
      ...prev,
      products: newProducts
    }));
  };

  // Add product field
  const addProductField = () => {
    setSolarkitForm(prev => ({
      ...prev,
      products: [...prev.products, '']
    }));
  };

  // Remove product field
  const removeProductField = (index) => {
    const newProducts = solarkitForm.products.filter((_, i) => i !== index);
    setSolarkitForm(prev => ({
      ...prev,
      products: newProducts
    }));
  };

  // Save solarkit
  const saveSolarkit2 = async () => {
    if (!solarkitForm.name || !selectedCountry) {
      toast.error('Please fill in all required fields');
      return;
    }

    const payload = {
      name: solarkitForm.name,
      country: selectedCountry,
      products: solarkitForm.products.filter(p => p.trim() !== '')
    };

    try {
      if (currentRow) {
        await updateSolarkit(currentRow._id, payload);
        toast.success('Solarkit updated successfully');
      } else {
        await createSolarkit(payload);
        toast.success('Solarkit created successfully');
      }
      setModalOpen(false);
      fetchSolarkits();
      setSolarkitForm({ name: '', products: [''], country: '' });
      setCurrentRow(null);
    } catch (error) {
      console.error('Error saving solarkit:', error);
      toast.error('Failed to save solarkit');
    }
  };

  // Edit solarkit
  const handleEdit = (kit) => {
    setCurrentRow(kit);
    setSolarkitForm({
      name: kit.name,
      products: kit.products || [''],
      country: kit.country?._id || selectedCountry
    });
    setModalOpen(true);
  };

  // Delete solarkit
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this solarkit?')) {
      try {
        await deleteSolarkit(id);
        toast.success('Solarkit deleted successfully');
        fetchSolarkits();
      } catch (error) {
        console.error('Error deleting solarkit:', error);
        toast.error('Failed to delete solarkit');
      }
    }
  };

  // Toggle status
  const toggleStatus = async (id, currentStatus) => {
    try {
      await updateSolarkitStatus(id, !currentStatus);
      toast.success('Status updated successfully');
      fetchSolarkits();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  // BOM Management
  const openBomModal = async (kit) => {
    setCurrentKitId(kit._id);
    setCurrentRow(kit);
    try {
      const data = await getSolarkitBOM(kit._id);
      setBomData(data.bom || []);
      setBomModalOpen(true);
    } catch (error) {
      console.error('Error fetching BOM:', error);
      toast.error('Failed to load BOM');
    }
  };

  const addBomSection = () => {
    setBomData([...bomData, { title: '', items: [{ name: '', qty: '', unit: '' }] }]);
  };

  const removeBomSection = (index) => {
    const newData = bomData.filter((_, i) => i !== index);
    setBomData(newData);
  };

  const updateBomSection = (index, field, value) => {
    const newData = [...bomData];
    newData[index][field] = value;
    setBomData(newData);
  };

  const addBomItem = (sectionIndex) => {
    const newData = [...bomData];
    newData[sectionIndex].items.push({ name: '', qty: '', unit: '' });
    setBomData(newData);
  };

  const removeBomItem = (sectionIndex, itemIndex) => {
    const newData = [...bomData];
    newData[sectionIndex].items = newData[sectionIndex].items.filter((_, i) => i !== itemIndex);
    setBomData(newData);
  };

  const updateBomItem = (sectionIndex, itemIndex, field, value) => {
    const newData = [...bomData];
    newData[sectionIndex].items[itemIndex][field] = value;
    setBomData(newData);
  };

  const saveBOM = async () => {
    try {
      await saveSolarkitBOM(currentKitId, bomData);
      toast.success('BOM saved successfully');
      setBomModalOpen(false);
    } catch (error) {
      console.error('Error saving BOM:', error);
      toast.error('Failed to save BOM');
    }
  };

  const openViewModal = (kit) => {
    setCurrentRow(kit);
    setViewModalOpen(true);
  };

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              <h4 className="mb-2 flex items-center text-gray-800">
                <Cog className="mr-2 text-primary" size={24} />
                Create Solar Kit
              </h4>
              <p className="text-muted mb-0">
                Manage solar kits like 3kW, 5kW, etc., and define their Bill of Materials (BOM).
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Left Column: Country Selection */}
        <div className="col-lg-4 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0 flex items-center">
                <Search className="mr-2" size={20} />
                Select Country
              </h5>
            </div>
            <div className="card-body">
              <div className="form-group mb-4">
                <label className="font-semibold mb-2">Filter by Country</label>
                <select
                  className="form-control w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  value={selectedCountry}
                  onChange={(e) => handleCountrySelect(e.target.value)}
                  disabled={locationLoading}
                >
                  <option value="">-- Select Country --</option>
                  {countries.map((country) => (
                    <option key={country._id} value={country._id}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedCountry && (
                <div className="mt-4 text-center">
                  <button
                    className="btn btn-primary w-full py-2 flex justify-center items-center"
                    onClick={() => {
                      setSolarkitForm({ name: '', products: [''], country: selectedCountry });
                      setCurrentRow(null);
                      setModalOpen(true);
                    }}
                  >
                    <PlusCircle className="mr-2" size={20} />
                    Add New Solarkit
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Solarkits Table */}
        <div className="col-lg-8">
          {showTable && (
            <div className="card shadow-sm">
              <div className="card-header bg-success text-white flex justify-between items-center">
                <h5 className="mb-0 flex items-center">
                  <List className="mr-2" size={20} />
                  Solar Kits List
                </h5>
                <span className="badge bg-light text-dark px-3 py-1 rounded-full">
                  {solarkits.length} Kit{solarkits.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="card-body">
                {loading ? (
                  <div className="flex justify-center py-5">
                    <Loader className="animate-spin text-blue-600" size={32} />
                  </div>
                ) : solarkits.length === 0 ? (
                  <div className="text-center py-5">
                    <Package className="fa fa-box-open fa-3x text-muted mb-3 mx-auto" size={48} />
                    <h5>No Solar Kits Found</h5>
                    <p className="text-muted">
                      Add a new solar kit for the selected country.
                    </p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left">#</th>
                          <th className="px-4 py-3 text-left">Kit Name</th>
                          <th className="px-4 py-3 text-left">Products</th>
                          <th className="px-4 py-3 text-left">Status</th>
                          <th className="px-4 py-3 text-left">BOM</th>
                          <th className="px-4 py-3 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {solarkits.map((kit, index) => (
                          <tr key={kit._id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">{index + 1}</td>
                            <td className="px-4 py-3 font-semibold">{kit.name}</td>
                            <td className="px-4 py-3">
                              <span className="badge bg-secondary text-white px-2 py-1 rounded text-xs">
                                {kit.products.length} Products
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="form-check form-switch">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  role="switch"
                                  checked={kit.status}
                                  onChange={() => toggleStatus(kit._id, kit.status)}
                                />
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                className="btn btn-outline-info btn-sm flex items-center px-2 py-1 rounded text-blue-600 border-blue-600 hover:bg-blue-50"
                                onClick={() => openBomModal(kit)}
                              >
                                <FileText size={14} className="mr-1" />
                                Manage
                              </button>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex space-x-2">
                                <button
                                  className="btn btn-warning btn-sm flex items-center px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                                  onClick={() => handleEdit(kit)}
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  className="btn btn-danger btn-sm flex items-center px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                  onClick={() => handleDelete(kit._id)}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Internal Modals */}
      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
            <div className="bg-primary text-white p-4 rounded-t-md flex justify-between items-center">
              <h3 className="text-lg font-semibold">{currentRow ? 'Edit Solarkit' : 'Add Solarkit'}</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-white hover:text-gray-200 text-xl"
              >
                &times;
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Kit Name</label>
                <input
                  type="text"
                  name="name"
                  value={solarkitForm.name}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="e.g., 3kW Solar Kit"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Products Included</label>
                {solarkitForm.products.map((product, index) => (
                  <div key={index} className="flex mb-2">
                    <input
                      type="text"
                      value={product}
                      onChange={(e) => handleProductChange(index, e.target.value)}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mr-2"
                      placeholder="Product Name"
                    />
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => removeProductField(index)}
                        className="text-red-500 hover:text-red-700 font-bold"
                      >
                        &times;
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addProductField}
                  className="text-blue-500 hover:text-blue-700 text-sm font-medium flex items-center"
                >
                  <PlusCircle size={14} className="mr-1" /> Add Product
                </button>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={saveSolarkit2}
                  className="px-4 py-2 bg-primary text-white rounded hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BOM Configuration Modal */}
      {bomModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="bg-info text-white p-4 rounded-t-md flex justify-between items-center">
              <h3 className="text-lg font-semibold">Manage BOM: {currentRow?.name}</h3>
              <button
                onClick={() => setBomModalOpen(false)}
                className="text-white hover:text-gray-200 text-xl"
              >
                &times;
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {bomData.map((section, sectionIndex) => (
                  <div key={sectionIndex} className="border rounded-lg p-4 bg-gray-50 relative">
                    <button
                      onClick={() => removeBomSection(sectionIndex)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </button>

                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Section Title</label>
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => updateBomSection(sectionIndex, 'title', e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="e.g., Solar Panels, Structure, etc."
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Items</label>
                      {section.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="flex gap-2">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => updateBomItem(sectionIndex, itemIndex, 'name', e.target.value)}
                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder="Item Name"
                          />
                          <input
                            type="text"
                            value={item.qty}
                            onChange={(e) => updateBomItem(sectionIndex, itemIndex, 'qty', e.target.value)}
                            className="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder="Qty"
                          />
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => updateBomItem(sectionIndex, itemIndex, 'unit', e.target.value)}
                            className="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder="Unit"
                          />
                          <button
                            onClick={() => removeBomItem(sectionIndex, itemIndex)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <XSquare size={16} />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addBomItem(sectionIndex)}
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center mt-2"
                      >
                        <PlusCircle size={14} className="mr-1" /> Add Item
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  onClick={addBomSection}
                  className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 flex items-center justify-center gap-2"
                >
                  <PlusCircle size={20} />
                  Add Another BOM Section
                </button>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setBomModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={saveBOM}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save BOM
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateSolarkit;