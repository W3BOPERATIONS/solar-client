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

      // Automatic Table Row Generation: Use all active combinations from QuoteSettings
      const projectsWithCounts = quotesData.filter(q => q.isActive !== false).map(q => {
        const count = bomsData.filter(b => b.quoteSettingsId === q._id).length;
        return {
          id: q._id,
          category: q.category,
          subCategory: q.subCategory,
          projectType: q.projectType,
          subProjectType: q.subProjectType,
          totalBom: count
        };
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
      quoteSettingsId: selectedProject.id,
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
  const projectBoms = selectedProject ? surveyBoms.filter(b => b.quoteSettingsId === selectedProject.id) : [];

  const tableHeaderStyle = "px-6 py-4 text-xs font-black text-white uppercase tracking-widest text-center border-r border-[#4db2eb]/30 last:border-r-0";

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-100">
              <Settings size={28} />
            </div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tight">Survey BOM Settings</h1>
          </div>
        </div>
      </div>

      {/* Project Type Table */}
      <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 mb-8 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#4db2eb]">
                <th className={tableHeaderStyle}>Create BOM</th>
                <th className={tableHeaderStyle}>Category</th>
                <th className={tableHeaderStyle}>Sub Category</th>
                <th className={tableHeaderStyle}>Project Type</th>
                <th className={tableHeaderStyle}>Sub Project Type</th>
                <th className={tableHeaderStyle}>Total BOM Created</th>
                <th className={tableHeaderStyle}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {projectTypes.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <Package size={48} strokeWidth={1.5} />
                      <p className="font-bold">No project types found. Configure Quote Settings first.</p>
                    </div>
                  </td>
                </tr>
              ) : projectTypes.map((project, idx) => (
                <tr key={idx} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-6 py-5 border-r border-gray-50">
                    <button
                      className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2 text-xs shadow-md shadow-blue-100"
                      onClick={() => handleOpenCreateModal(project)}
                    >
                      <Plus size={16} strokeWidth={3} />
                      CREATE BOM
                    </button>
                  </td>
                  <td className="px-6 py-5 text-center font-bold text-gray-600 text-sm border-r border-gray-50">{project.category}</td>
                  <td className="px-6 py-5 text-center font-bold text-gray-600 text-sm border-r border-gray-50">{project.subCategory}</td>
                  <td className="px-6 py-5 text-center font-bold text-gray-600 text-sm border-r border-gray-50">{project.projectType}</td>
                  <td className="px-6 py-5 text-center font-bold text-gray-600 text-sm border-r border-gray-50">{project.subProjectType}</td>
                  <td className="px-6 py-5 text-center border-r border-gray-50">
                    <span className="inline-flex items-center justify-center min-w-[32px] h-8 bg-blue-100 text-blue-700 rounded-full text-sm font-black shadow-inner">
                      {project.totalBom}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <button
                      className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${project.totalBom > 0
                        ? 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white shadow-sm ring-1 ring-blue-100'
                        : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                        }`}
                      onClick={() => project.totalBom > 0 && handleViewBomDetails(project)}
                      disabled={project.totalBom === 0}
                    >
                      <Eye size={16} strokeWidth={2.5} />
                      VIEW
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
          {showDetailedView && currentBom && (() => {
            const allItems = [
              ...(currentBom.pipes || []).map(p => ({ ...p, category: 'Standard Pipes' })),
              ...(currentBom.accessories || []).map(a => ({ ...a, category: 'Accessories' })),
              ...(currentBom.wires || []).map(w => ({ ...w, category: 'Wires' }))
            ];

            const totalQty = allItems.reduce((acc, item) => acc + (item.formulaQty || item.qty || 0), 0);
            const grandTotal = allItems.reduce((acc, item) => acc + ((item.formulaQty || item.qty || 0) * (item.price || 0)), 0);

            return (
              <div className="bg-white rounded-3xl border border-gray-100 mt-8 shadow-2xl shadow-gray-200/50 overflow-hidden">
                {/* Dark Grey Header Bar */}
                <div className="bg-[#5e666d] px-8 py-5 flex justify-between items-center">
                  <h3 className="text-xl font-black text-white tracking-tight uppercase">
                    Detailed BOM View
                  </h3>
                </div>

                <div className="p-8">
                  {/* Close Button Row */}
                  <div className="flex justify-end mb-6">
                    <button
                      className="bg-[#5e666d] text-white px-8 py-2.5 rounded-xl font-black text-xs hover:bg-gray-800 transition-all active:scale-95 shadow-md"
                      onClick={() => setShowDetailedView(false)}
                    >
                      Close
                    </button>
                  </div>

                  <div className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#72b5f1]">
                          <th className="px-6 py-5 text-sm font-black text-white border-r border-white/20 last:border-r-0">Category</th>
                          <th className="px-6 py-5 text-sm font-black text-white border-r border-white/20 last:border-r-0">Item Name</th>
                          <th className="px-6 py-5 text-sm font-black text-white text-center border-r border-white/20 last:border-r-0">Quantity</th>
                          <th className="px-6 py-5 text-sm font-black text-white text-center border-r border-white/20 last:border-r-0">Price</th>
                          <th className="px-6 py-5 text-sm font-black text-white text-right last:border-r-0">Total Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {allItems.map((item, i) => (
                          <tr key={i} className={i % 2 === 1 ? 'bg-[#f8fafd]' : 'bg-white'}>
                            <td className="px-6 py-4 font-black text-gray-400 text-sm border-r border-gray-50">{item.category}</td>
                            <td className="px-6 py-4 font-bold text-gray-700 text-sm border-r border-gray-50">{item.product || item.item || item.formulaItem}</td>
                            <td className="px-6 py-4 text-center font-bold text-gray-600 text-sm border-r border-gray-50">{item.formulaQty || item.qty}</td>
                            <td className="px-6 py-4 text-center font-bold text-gray-600 text-sm border-r border-gray-50">${(item.price || 0).toFixed(2)}</td>
                            <td className="px-6 py-4 text-right font-black text-blue-600 text-sm">${((item.formulaQty || item.qty || 0) * (item.price || 0)).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-[#72b5f1]/10">
                          <td colSpan="2" className="px-6 py-6 font-black text-blue-600 uppercase tracking-widest bg-[#72b5f1] text-white">Grand Total</td>
                          <td className="px-6 py-6 text-center font-black text-white bg-[#72b5f1]">{totalQty}</td>
                          <td className="bg-[#72b5f1]"></td>
                          <td className="px-6 py-6 text-right font-black text-white bg-[#72b5f1] tracking-widest">${grandTotal.toFixed(2)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}
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
              {selectedProject && (
                <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1 ml-1">Category</label>
                    <div className="bg-white border border-blue-100 rounded-xl px-4 py-2 font-bold text-gray-700 text-xs shadow-sm shadow-blue-50">
                      {selectedProject.category}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1 ml-1">Sub Category</label>
                    <div className="bg-white border border-blue-100 rounded-xl px-4 py-2 font-bold text-gray-700 text-xs shadow-sm shadow-blue-50">
                      {selectedProject.subCategory}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1 ml-1">Project Type</label>
                    <div className="bg-white border border-blue-100 rounded-xl px-4 py-2 font-bold text-gray-700 text-xs shadow-sm shadow-blue-50">
                      {selectedProject.projectType}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1 ml-1">Sub Proj Type</label>
                    <div className="bg-white border border-blue-100 rounded-xl px-4 py-2 font-bold text-gray-700 text-xs shadow-sm shadow-blue-50">
                      {selectedProject.subProjectType}
                    </div>
                  </div>
                </div>
              )}

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