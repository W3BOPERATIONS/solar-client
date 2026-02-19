import React, { useState, useEffect } from 'react';
import {
  Eye, Trash2, Edit, X, Plus,
  Settings, FileText, Grid,
  BarChart3, Package, Building,
  Home, Layers, Cable, Wrench
} from 'lucide-react';
import {
  getQuoteSettings,
  createSurveyBOM,
  getSurveyBOMs,
  deleteSurveyBOM,
  getTerraceTypes,
  getBuildingTypes,
  getStructureTypes
} from '../../../../services/quote/quoteApi';
import toast from 'react-hot-toast';

export default function SurveyBomSetting() {
  const [projectTypes, setProjectTypes] = useState([]);
  const [surveyBoms, setSurveyBoms] = useState([]);

  // Dynamic Option Lists
  const [terraceTypes, setTerraceTypes] = useState([]);
  const [buildingTypes, setBuildingTypes] = useState([]);
  const [structureTypes, setStructureTypes] = useState([]);

  const [selectedProject, setSelectedProject] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailedView, setShowDetailedView] = useState(false);

  // Current BOM being viewed/edited
  const [currentBom, setCurrentBom] = useState(null);

  const [bomForm, setBomForm] = useState({
    terraceType: '',
    buildingType: '',
    structureType: '',
    floorCount: '1'
  });

  const [modalTables, setModalTables] = useState({
    pipes: [
      { id: Date.now() + 1, product: '', formulaItem: '', formulaQty: 1, price: 0 }
    ],
    accessories: [
      { id: Date.now() + 2, product: '', formulaItem: '', formulaQty: 1, price: 0 }
    ],
    wires: [
      { id: Date.now() + 3, product: '', formulaItem: '', formulaQty: 1, price: 0 }
    ]
  });

  const [summaryData, setSummaryData] = useState({
    pipes: { items: 0, qty: 0, price: 0 },
    accessories: { items: 0, qty: 0, price: 0 },
    wires: { items: 0, qty: 0, price: 0 },
    total: { items: 0, qty: 0, price: 0 }
  });

  // These could be dynamic too, but for now we keep them static or fetch if available
  const productOptions = ['Product-1', 'Product-2', 'Product-3'];
  const formulaOptions = ['Solar panel', 'Inverter', 'Battery'];

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [quotesData, bomsData, terraces, buildings, structures] = await Promise.all([
        getQuoteSettings(),
        getSurveyBOMs(),
        getTerraceTypes(),
        getBuildingTypes(),
        getStructureTypes()
      ]);

      // Process Project Types from Quote Settings
      // We want uniqueness based on Category, SubCategory, ProjectType, SubProjectType
      const uniqueProjects = [];
      const seen = new Set();

      quotesData.forEach(q => {
        const key = `${q.category}-${q.subCategory}-${q.projectType}-${q.subProjectType}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueProjects.push({
            id: q._id, // Use the quote setting ID as a reference, or generate one
            category: q.category,
            subCategory: q.subCategory,
            projectType: q.projectType,
            subProjectType: q.subProjectType,
            // Calculate total BOMs later
          });
        }
      });

      // Calculate totals
      const projectsWithCounts = uniqueProjects.map(p => {
        const count = bomsData.filter(b =>
          b.category === p.category &&
          b.subCategory === p.subCategory &&
          b.projectType === p.projectType &&
          b.subProjectType === p.subProjectType
        ).length;
        return { ...p, totalBom: count };
      });

      setProjectTypes(projectsWithCounts);
      setSurveyBoms(bomsData);
      setTerraceTypes(terraces.map(t => t.name));
      setBuildingTypes(buildings.map(b => b.name));
      setStructureTypes(structures.map(s => s.name));

    } catch (error) {
      console.error("Error fetching initial data:", error);
      toast.error("Failed to load settings data");
    }
  };

  const calculateSummary = () => {
    const calculateTableTotal = (data) => {
      return {
        items: data.filter(item => item.product && item.product.trim() !== '').length,
        qty: data.reduce((sum, item) => sum + (parseFloat(item.formulaQty) || 0), 0),
        price: data.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0)
      };
    };

    const pipesSummary = calculateTableTotal(modalTables.pipes);
    const accessoriesSummary = calculateTableTotal(modalTables.accessories);
    const wiresSummary = calculateTableTotal(modalTables.wires);

    const totalSummary = {
      items: pipesSummary.items + accessoriesSummary.items + wiresSummary.items,
      qty: pipesSummary.qty + accessoriesSummary.qty + wiresSummary.qty,
      price: pipesSummary.price + accessoriesSummary.price + wiresSummary.price
    };

    setSummaryData({
      pipes: pipesSummary,
      accessories: accessoriesSummary,
      wires: wiresSummary,
      total: totalSummary
    });
  };

  useEffect(() => {
    calculateSummary();
  }, [modalTables]);

  const handleOpenCreateModal = (project) => {
    setSelectedProject(project);
    setShowCreateModal(true);
    // Reset form
    setBomForm({
      terraceType: '',
      buildingType: '',
      structureType: '',
      floorCount: '1'
    });
    setModalTables({
      pipes: [{ id: Date.now() + 1, product: '', formulaItem: '', formulaQty: 1, price: 0 }],
      accessories: [{ id: Date.now() + 2, product: '', formulaItem: '', formulaQty: 1, price: 0 }],
      wires: [{ id: Date.now() + 3, product: '', formulaItem: '', formulaQty: 1, price: 0 }]
    });
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setSelectedProject(null);
  };

  const handleBomFormChange = (field, value) => {
    setBomForm({ ...bomForm, [field]: value });
  };

  const handleAddRow = (tableType) => {
    const newRow = {
      id: Date.now(),
      product: '',
      formulaItem: '',
      formulaQty: 1,
      price: 0
    };

    setModalTables({
      ...modalTables,
      [tableType]: [...modalTables[tableType], newRow]
    });
  };

  const handleDeleteRow = (tableType, id) => {
    setModalTables({
      ...modalTables,
      [tableType]: modalTables[tableType].filter(row => row.id !== id)
    });
  };

  const handleTableDataChange = (tableType, id, field, value) => {
    const updatedTable = modalTables[tableType].map(row => {
      if (row.id === id) {
        return { ...row, [field]: field === 'price' || field === 'formulaQty' ? parseFloat(value) || 0 : value }; // Ensure numbers
      }
      return row;
    });

    setModalTables({ ...modalTables, [tableType]: updatedTable });
  };

  const handleCreateBom = async () => {
    if (!bomForm.terraceType || !bomForm.buildingType || !bomForm.structureType) {
      toast.error('Please fill all required fields');
      return;
    }

    if (!selectedProject) return;

    const payload = {
      category: selectedProject.category,
      subCategory: selectedProject.subCategory,
      projectType: selectedProject.projectType,
      subProjectType: selectedProject.subProjectType,
      terraceType: bomForm.terraceType,
      buildingType: bomForm.buildingType,
      structureType: bomForm.structureType,
      floorCount: bomForm.buildingType === 'Flat' ? parseInt(bomForm.floorCount) : null,
      pipes: modalTables.pipes.map(i => ({ product: i.product, formulaItem: i.formulaItem, formulaQty: i.formulaQty, price: i.price })),
      accessories: modalTables.accessories.map(i => ({ product: i.product, formulaItem: i.formulaItem, formulaQty: i.formulaQty, price: i.price })),
      wires: modalTables.wires.map(i => ({ product: i.product, formulaItem: i.formulaItem, formulaQty: i.formulaQty, price: i.price }))
    };

    try {
      await createSurveyBOM(payload);
      toast.success("BOM created successfully");
      setShowCreateModal(false);
      fetchInitialData(); // Refresh counts
    } catch (error) {
      console.error("Error creating BOM:", error);
      toast.error("Failed to create BOM");
    }
  };

  const handleViewBomDetails = (project) => {
    setSelectedProject(project);
    // Find all BOMs for this project
    const boms = surveyBoms.filter(b =>
      b.category === project.category &&
      b.subCategory === project.subCategory &&
      b.projectType === project.projectType &&
      b.subProjectType === project.subProjectType
    );
    // For now, just show the first one or a list? 
    // The previous UI showed detailed view of ONE config.
    // Let's iterate or allow selection. 
    // If there are multiple, maybe we show a list first?
    // But the UI design has a "BOM Details" section. 
    // Let's assume we show the list of configurations if multiple exist, or just the first if one.
    // Let's implement a simple list selection if needed, or primarily just list them.

    // Actually, "BOM Details" section in the original code showed ONE BOM details (staticBomData[selectedProject][0]).
    // I will show a list of configured BOMs for this project below.
  };

  const handleCloseDetails = () => {
    setSelectedProject(null);
    setCurrentBom(null);
    setShowDetailedView(false);
  };

  const handleDeleteConfiguration = async (id) => {
    if (window.confirm('Are you sure you want to delete this configuration?')) {
      try {
        await deleteSurveyBOM(id);
        toast.success("BOM configuration deleted");
        // Update state locally
        setSurveyBoms(prev => prev.filter(b => b._id !== id));
        // Also update project counts (refresh or manual)
        fetchInitialData();
        if (currentBom?._id === id) {
          setCurrentBom(null);
          setShowDetailedView(false);
        }
      } catch (error) {
        console.error("Error deleting BOM:", error);
        toast.error("Failed to delete BOM");
      }
    }
  };

  const handleViewSingleBom = (bom) => {
    setCurrentBom(bom);
    setShowDetailedView(true);
  };

  // Filter BOMs for the currently selected project for the list view
  const projectBoms = selectedProject ? surveyBoms.filter(b =>
    b.category === selectedProject.category &&
    b.subCategory === selectedProject.subCategory &&
    b.projectType === selectedProject.projectType &&
    b.subProjectType === selectedProject.subProjectType
  ) : [];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <nav className="bg-white rounded-lg shadow-sm p-4">
          <h1 className="text-2xl font-bold text-gray-800">Survey BOM Settings</h1>
        </nav>
      </div>

      {/* Project Type Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 overflow-hidden">
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700">Create BOM</th>
              <th className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700">Category</th>
              <th className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700">Sub Category</th>
              <th className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700">Project Type</th>
              <th className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700">Sub Project Type</th>
              <th className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700">Total BOM Created</th>
              <th className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projectTypes.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-4 text-center text-gray-500">No project types found. Please configure Quote Settings first.</td>
              </tr>
            ) : projectTypes.map((project, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-3">
                  <button
                    className="bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 flex items-center gap-1 text-sm"
                    onClick={() => handleOpenCreateModal(project)}
                  >
                    <Plus size={14} />
                    Create BOM
                  </button>
                </td>
                <td className="border border-gray-300 px-4 py-3 text-center">{project.category}</td>
                <td className="border border-gray-300 px-4 py-3 text-center">{project.subCategory}</td>
                <td className="border border-gray-300 px-4 py-3 text-center">{project.projectType}</td>
                <td className="border border-gray-300 px-4 py-3 text-center">{project.subProjectType}</td>
                <td className="border border-gray-300 px-4 py-3 text-center font-medium">{project.totalBom}</td>
                <td className="border border-gray-300 px-4 py-3">
                  <div className="flex justify-center">
                    <button
                      className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm ${project.totalBom > 0 ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                      onClick={() => project.totalBom > 0 && handleViewBomDetails(project)}
                      disabled={project.totalBom === 0}
                    >
                      <Eye size={14} />
                      View
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* BOM Configurations List */}
      {selectedProject && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              BOM Configurations for {selectedProject.category} - {selectedProject.projectType}
            </h2>
            <button
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 flex items-center gap-2"
              onClick={handleCloseDetails}
            >
              <X size={18} />
              Close
            </button>
          </div>

          {projectBoms.length === 0 ? (
            <div className="text-gray-500 text-center py-4">No BOMs found for this project.</div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {projectBoms.map(bom => (
                <div key={bom._id} className="border border-gray-200 rounded p-4 flex justify-between items-center bg-gray-50">
                  <div>
                    <span className="font-semibold text-blue-800 block">{bom.terraceType} | {bom.buildingType} | {bom.structureType}</span>
                    <span className="text-sm text-gray-600 block">Items: {bom.pipes?.length || 0} Pipes, {bom.accessories?.length || 0} Acc, {bom.wires?.length || 0} Wires</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewSingleBom(bom)}
                      className="bg-blue-100 text-blue-600 px-3 py-1 rounded hover:bg-blue-200 text-sm flex items-center gap-1"
                    >
                      <Eye size={14} /> View Details
                    </button>
                    <button
                      onClick={() => handleDeleteConfiguration(bom._id)}
                      className="bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200 text-sm flex items-center gap-1"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Detailed View Section */}
          {showDetailedView && currentBom && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6 shadow-sm">
              <div className="bg-gray-600 text-white rounded-t-lg p-3 mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText size={20} />
                  Detailed BOM View
                </h3>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="text-gray-700 font-semibold mb-3 flex items-center gap-2">
                  <Building size={16} />
                  Configuration Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex">
                    <span className="font-semibold text-gray-600 w-32">Terrace Type:</span>
                    <span className="text-gray-800">{currentBom.terraceType}</span>
                  </div>
                  <div className="flex">
                    <span className="font-semibold text-gray-600 w-32">Building Type:</span>
                    <span className="text-gray-800">{currentBom.buildingType}</span>
                  </div>
                  <div className="flex">
                    <span className="font-semibold text-gray-600 w-32">Structure Type:</span>
                    <span className="text-gray-800">{currentBom.structureType}</span>
                  </div>
                  <div className="flex">
                    <span className="font-semibold text-gray-600 w-32">Floors:</span>
                    <span className="text-gray-800">{currentBom.floorCount || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Detailed Tables for Pipes, Accessories, Wires */}
                {['pipes', 'accessories', 'wires'].map(type => (
                  <div key={type} className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3 capitalize">{type}</h4>
                    <table className="min-w-full border border-gray-300 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="border px-2 py-1">Item</th>
                          <th className="border px-2 py-1">Qty</th>
                          <th className="border px-2 py-1">Price</th>
                          <th className="border px-2 py-1">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentBom[type]?.map((item, i) => (
                          <tr key={i}>
                            <td className="border px-2 py-1">{item.price ? item.product : item.item}</td>
                            <td className="border px-2 py-1 text-center">{item.formulaQty || item.qty}</td>
                            <td className="border px-2 py-1 text-right">{item.price}</td>
                            <td className="border px-2 py-1 text-right">{((item.formulaQty || item.qty) * item.price).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>

              <div className="flex justify-end mt-4">
                <button
                  className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded hover:bg-gray-300 flex items-center gap-1 text-sm"
                  onClick={() => setShowDetailedView(false)}
                >
                  <X size={14} />
                  Close Detail
                </button>
              </div>

            </div>
          )}
        </div>
      )}

      {/* Create BOM Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Create New BOM</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={handleCloseModal}
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <form id="bomForm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Terrace Type</label>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={bomForm.terraceType}
                      onChange={(e) => handleBomFormChange('terraceType', e.target.value)}
                      required
                    >
                      <option value="">Select Terrace Type</option>
                      {terraceTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Building Type</label>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={bomForm.buildingType}
                      onChange={(e) => handleBomFormChange('buildingType', e.target.value)}
                      required
                    >
                      <option value="">Select Building Type</option>
                      {buildingTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Structure Type</label>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={bomForm.structureType}
                      onChange={(e) => handleBomFormChange('structureType', e.target.value)}
                      required
                    >
                      <option value="">Select Structure Type</option>
                      {structureTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  {bomForm.buildingType === 'Flat' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Number of Floors</label>
                      <select
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={bomForm.floorCount}
                        onChange={(e) => handleBomFormChange('floorCount', e.target.value)}
                      >
                        {[1, 2, 3, 4, 5].map(num => (
                          <option key={num} value={num}>{num}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Standard Pipes Table */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <div className="bg-blue-600 text-white rounded-t-lg p-3 -mt-6 -mx-6 mb-4">
                    <h3 className="text-lg font-semibold">Standard Pipes</h3>
                  </div>
                  <button
                    type="button"
                    className="bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 flex items-center gap-1 mb-3 text-sm"
                    onClick={() => handleAddRow('pipes')}
                  >
                    <Plus size={14} />
                    Add Row
                  </button>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-300">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700">Product</th>
                          <th className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700">Quantity Formula</th>
                          <th className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700">Price</th>
                          <th className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modalTables.pipes.map((row) => (
                          <tr key={row.id}>
                            <td className="border border-gray-300 px-4 py-3">
                              <select
                                className="w-full border border-gray-300 rounded px-2 py-1"
                                value={row.product}
                                onChange={(e) => handleTableDataChange('pipes', row.id, 'product', e.target.value)}
                              >
                                <option value="">Select Product</option>
                                {productOptions.map(option => (
                                  <option key={option} value={option}>{option}</option>
                                ))}
                              </select>
                            </td>
                            <td className="border border-gray-300 px-4 py-3">
                              <div className="flex items-center gap-2">
                                <select
                                  className="w-1/2 border border-gray-300 rounded px-2 py-1"
                                  value={row.formulaItem}
                                  onChange={(e) => handleTableDataChange('pipes', row.id, 'formulaItem', e.target.value)}
                                >
                                  <option value="">Select Item</option>
                                  {formulaOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                  ))}
                                </select>
                                <span className="text-red-500 font-bold text-xl">×</span>
                                <input
                                  type="number"
                                  className="w-1/3 border border-gray-300 rounded px-2 py-1"
                                  value={row.formulaQty}
                                  onChange={(e) => handleTableDataChange('pipes', row.id, 'formulaQty', e.target.value)}
                                  min="0"
                                />
                              </div>
                            </td>
                            <td className="border border-gray-300 px-4 py-3">
                              <input
                                type="number"
                                className="w-full border border-gray-300 rounded px-2 py-1"
                                value={row.price}
                                onChange={(e) => handleTableDataChange('pipes', row.id, 'price', e.target.value)}
                                min="0"
                                step="0.01"
                              />
                            </td>
                            <td className="border border-gray-300 px-4 py-3">
                              <button
                                type="button"
                                className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-sm"
                                onClick={() => handleDeleteRow('pipes', row.id)}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Structure Accessories Table */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <div className="bg-blue-600 text-white rounded-t-lg p-3 -mt-6 -mx-6 mb-4">
                    <h3 className="text-lg font-semibold">Structure Accessories</h3>
                  </div>
                  <button
                    type="button"
                    className="bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 flex items-center gap-1 mb-3 text-sm"
                    onClick={() => handleAddRow('accessories')}
                  >
                    <Plus size={14} />
                    Add Row
                  </button>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-300">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700">Product</th>
                          <th className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700">Quantity Formula</th>
                          <th className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700">Price</th>
                          <th className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modalTables.accessories.map((row) => (
                          <tr key={row.id}>
                            <td className="border border-gray-300 px-4 py-3">
                              <select
                                className="w-full border border-gray-300 rounded px-2 py-1"
                                value={row.product}
                                onChange={(e) => handleTableDataChange('accessories', row.id, 'product', e.target.value)}
                              >
                                <option value="">Select Product</option>
                                {productOptions.map(option => (
                                  <option key={option} value={option}>{option}</option>
                                ))}
                              </select>
                            </td>
                            <td className="border border-gray-300 px-4 py-3">
                              <div className="flex items-center gap-2">
                                <select
                                  className="w-1/2 border border-gray-300 rounded px-2 py-1"
                                  value={row.formulaItem}
                                  onChange={(e) => handleTableDataChange('accessories', row.id, 'formulaItem', e.target.value)}
                                >
                                  <option value="">Select Item</option>
                                  {formulaOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                  ))}
                                </select>
                                <span className="text-red-500 font-bold text-xl">×</span>
                                <input
                                  type="number"
                                  className="w-1/3 border border-gray-300 rounded px-2 py-1"
                                  value={row.formulaQty}
                                  onChange={(e) => handleTableDataChange('accessories', row.id, 'formulaQty', e.target.value)}
                                  min="0"
                                />
                              </div>
                            </td>
                            <td className="border border-gray-300 px-4 py-3">
                              <input
                                type="number"
                                className="w-full border border-gray-300 rounded px-2 py-1"
                                value={row.price}
                                onChange={(e) => handleTableDataChange('accessories', row.id, 'price', e.target.value)}
                                min="0"
                                step="0.01"
                              />
                            </td>
                            <td className="border border-gray-300 px-4 py-3">
                              <button
                                type="button"
                                className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-sm"
                                onClick={() => handleDeleteRow('accessories', row.id)}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Wires Table */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <div className="bg-blue-600 text-white rounded-t-lg p-3 -mt-6 -mx-6 mb-4">
                    <h3 className="text-lg font-semibold">Wires</h3>
                  </div>
                  <button
                    type="button"
                    className="bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 flex items-center gap-1 mb-3 text-sm"
                    onClick={() => handleAddRow('wires')}
                  >
                    <Plus size={14} />
                    Add Row
                  </button>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-300">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700">Product</th>
                          <th className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700">Quantity Formula</th>
                          <th className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700">Price</th>
                          <th className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modalTables.wires.map((row) => (
                          <tr key={row.id}>
                            <td className="border border-gray-300 px-4 py-3">
                              <select
                                className="w-full border border-gray-300 rounded px-2 py-1"
                                value={row.product}
                                onChange={(e) => handleTableDataChange('wires', row.id, 'product', e.target.value)}
                              >
                                <option value="">Select Product</option>
                                {productOptions.map(option => (
                                  <option key={option} value={option}>{option}</option>
                                ))}
                              </select>
                            </td>
                            <td className="border border-gray-300 px-4 py-3">
                              <div className="flex items-center gap-2">
                                <select
                                  className="w-1/2 border border-gray-300 rounded px-2 py-1"
                                  value={row.formulaItem}
                                  onChange={(e) => handleTableDataChange('wires', row.id, 'formulaItem', e.target.value)}
                                >
                                  <option value="">Select Product</option>
                                  {formulaOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                  ))}
                                </select>
                                <span className="text-red-500 font-bold text-xl">×</span>
                                <input
                                  type="number"
                                  className="w-1/3 border border-gray-300 rounded px-2 py-1"
                                  value={row.formulaQty}
                                  onChange={(e) => handleTableDataChange('wires', row.id, 'formulaQty', e.target.value)}
                                  min="0"
                                />
                              </div>
                            </td>
                            <td className="border border-gray-300 px-4 py-3">
                              <input
                                type="number"
                                className="w-full border border-gray-300 rounded px-2 py-1"
                                value={row.price}
                                onChange={(e) => handleTableDataChange('wires', row.id, 'price', e.target.value)}
                                min="0"
                                step="0.01"
                              />
                            </td>
                            <td className="border border-gray-300 px-4 py-3">
                              <button
                                type="button"
                                className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-sm"
                                onClick={() => handleDeleteRow('wires', row.id)}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* BOM Summary */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <h4 className="font-semibold text-gray-800 mb-4">BOM Summary</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-300">
                      <thead>
                        <tr>
                          <th className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 w-2/5">Category</th>
                          <th className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 w-1/5">Total Items</th>
                          <th className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 w-1/5">Total Quantity</th>
                          <th className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 w-1/5">Total Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 px-4 py-3">Standard Pipes</td>
                          <td className="border border-gray-300 px-4 py-3 text-center">{summaryData.pipes.items}</td>
                          <td className="border border-gray-300 px-4 py-3 text-center">{summaryData.pipes.qty}</td>
                          <td className="border border-gray-300 px-4 py-3 text-center">{summaryData.pipes.price.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-4 py-3">Accessories</td>
                          <td className="border border-gray-300 px-4 py-3 text-center">{summaryData.accessories.items}</td>
                          <td className="border border-gray-300 px-4 py-3 text-center">{summaryData.accessories.qty}</td>
                          <td className="border border-gray-300 px-4 py-3 text-center">{summaryData.accessories.price.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-4 py-3">Wires</td>
                          <td className="border border-gray-300 px-4 py-3 text-center">{summaryData.wires.items}</td>
                          <td className="border border-gray-300 px-4 py-3 text-center">{summaryData.wires.qty}</td>
                          <td className="border border-gray-300 px-4 py-3 text-center">{summaryData.wires.price.toFixed(2)}</td>
                        </tr>
                        <tr className="bg-green-50 font-semibold">
                          <td className="border border-gray-300 px-4 py-3">Grand Total</td>
                          <td className="border border-gray-300 px-4 py-3 text-center">{summaryData.total.items}</td>
                          <td className="border border-gray-300 px-4 py-3 text-center">{summaryData.total.qty}</td>
                          <td className="border border-gray-300 px-4 py-3 text-center">{summaryData.total.price.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <button
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
                onClick={handleCloseModal}
              >
                Cancel
              </button>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                onClick={handleCreateBom}
              >
                Create BOM
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}