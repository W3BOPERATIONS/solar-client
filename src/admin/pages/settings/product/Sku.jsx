import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { productApi } from '../../../../api/productApi';
import AddProductModal from './AddProductModal';

const SkuManagement = () => {
  // Data States
  const [states, setStates] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [projectTypes, setProjectTypes] = useState([]);
  const [subProjectTypes, setSubProjectTypes] = useState([]);

  // Selection States
  const [selectedStates, setSelectedStates] = useState([]);
  const [selectedClusters, setSelectedClusters] = useState([]);
  const [selectAllStates, setSelectAllStates] = useState(false);
  const [selectAllClusters, setSelectAllClusters] = useState(false);

  // UI States
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [toasts, setToasts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [
        stateRes,
        clusterRes,
        productRes,
        brandRes,
        catRes,
        subCatRes,
        pTypeRes,
        subPTypeRes
      ] = await Promise.all([
        productApi.getStates(),
        productApi.getClusters(),
        productApi.getAll(),
        productApi.getBrands(),
        productApi.getCategories(),
        productApi.getSubCategories(),
        productApi.getProjectTypes(),
        productApi.getSubProjectTypes()
      ]);

      setStates(stateRes?.data?.data || []);
      setClusters(clusterRes?.data?.data || []);
      setProducts(productRes?.data?.data || []);
      setBrands(Array.isArray(brandRes?.data) ? brandRes.data : brandRes?.data?.data || []);
      setCategories(catRes?.data?.data || []);
      setSubCategories(subCatRes?.data?.data || []);
      setProjectTypes(pTypeRes?.data?.data || []);
      setSubProjectTypes(subPTypeRes?.data?.data || []);

    } catch (error) {
      console.error("Data fetch error:", error);
      showToast("Failed to load dashboard data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleStateToggle = (stateId) => {
    setSelectedStates(prev => {
      const next = prev.includes(stateId) ? prev.filter(id => id !== stateId) : [...prev, stateId];
      // Clear clusters that no longer belong to selected states
      setSelectedClusters(cPrev => cPrev.filter(cId => {
        const cluster = clusters.find(cl => cl._id === cId);
        return cluster && next.includes(cluster.state?._id || cluster.state);
      }));
      return next;
    });
  };

  const handleClusterToggle = (clusterId) => {
    setSelectedClusters(prev =>
      prev.includes(clusterId) ? prev.filter(id => id !== clusterId) : [...prev, clusterId]
    );
  };

  const toggleSelectAllStates = () => {
    if (selectAllStates) {
      setSelectedStates([]);
      setSelectedClusters([]);
    } else {
      setSelectedStates(states.map(s => s._id));
    }
    setSelectAllStates(!selectAllStates);
  };

  const toggleSelectAllClusters = () => {
    if (selectAllClusters) {
      setSelectedClusters([]);
    } else {
      setSelectedClusters(filteredClusters.map(c => c._id));
    }
    setSelectAllClusters(!selectAllClusters);
  };

  // Filter clusters based on state
  const filteredClusters = clusters.filter(c =>
    selectedStates.length > 0 && selectedStates.includes(c.state?._id || c.state)
  );

  // Helper to get name from master data
  const getMasterName = (list, id) => {
    const item = list.find(i => i._id === id);
    return item ? item.name : '-';
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.skuId?.skuCode?.toLowerCase().includes(searchTerm.toLowerCase());

    // Geography filtering - use String comparison for robustness
    const prodStateId = String(p.stateId?._id || p.stateId || '');
    const prodClusterId = String(p.clusterId?._id || p.clusterId || '');

    const matchesState = selectedStates.length === 0 || selectedStates.some(id => String(id) === prodStateId);
    const matchesCluster = selectedClusters.length === 0 || selectedClusters.some(id => String(id) === prodClusterId);

    return matchesSearch && matchesState && matchesCluster;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800">
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(t => (
          <div key={t.id} className={`p-4 rounded shadow-lg flex items-center gap-2 text-white animate-fadeIn ${t.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
            {t.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            {t.message}
          </div>
        ))}
      </div>

      {showAddModal ? (
        <AddProductModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setEditingProduct(null);
          }}
          selectedStates={selectedStates}
          selectedClusters={selectedClusters}
          states={states}
          clusters={clusters}
          onSuccess={() => {
            fetchAllData();
          }}
          editingProduct={editingProduct}
        />
      ) : (
        <>
          {/* Header */}
          <div className="mb-4">
            <h1 className="text-blue-500 font-bold text-lg">SKU Generator</h1>
          </div>

          {/* Select States */}
          <div className="bg-white border border-gray-200 mb-6 font-sans">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-blue-500 font-bold text-sm uppercase tracking-tight">Select States</h2>
            </div>

            <div className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  id="selectAllStates"
                  className="w-3.5 h-3.5 text-blue-500 rounded focus:ring-blue-500 border-gray-300"
                  checked={selectAllStates}
                  onChange={toggleSelectAllStates}
                />
                <label htmlFor="selectAllStates" className="text-gray-500 text-xs cursor-pointer">Select All States</label>
              </div>

              <div className="flex flex-wrap gap-4">
                {states.map((state) => (
                  <div
                    key={state._id}
                    onClick={() => handleStateToggle(state._id)}
                    className={`p-3 cursor-pointer transition-all duration-200 w-44 h-24 flex flex-col justify-between border rounded ${selectedStates.includes(state._id)
                      ? 'border-blue-500 bg-white z-10 shadow-sm'
                      : 'border-blue-200 bg-white hover:border-blue-300'
                      }`}
                  >
                    <div className={`text-xs ${selectedStates.includes(state._id) ? 'text-blue-600 font-bold' : 'text-blue-500 font-medium'} truncate`}>{state.name}</div>
                    <div className="text-gray-500 text-xs mt-1">
                      {state.code || state.name?.substring(0, 2).toUpperCase()}
                    </div>
                  </div>
                ))}
                {states.length === 0 && <div className="text-gray-400 text-sm p-4 w-full text-center">No states found in database.</div>}
              </div>
            </div>
          </div>

          {/* Select Clusters - Dynamic based on State */}
          {selectedStates.length > 0 && (
            <div className="bg-white border border-gray-200 mb-6 font-sans">
              <div className="p-4 border-b border-gray-100">
                <h2 className="text-blue-500 font-bold text-sm uppercase tracking-tight">Select Clusters (Filtered by State)</h2>
              </div>

              <div className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    id="selectAllClusters"
                    className="w-3.5 h-3.5 text-blue-500 rounded focus:ring-blue-500 border-gray-300"
                    checked={selectAllClusters}
                    onChange={toggleSelectAllClusters}
                  />
                  <label htmlFor="selectAllClusters" className="text-gray-500 text-xs cursor-pointer">Select All Clusters</label>
                </div>

                <div className="flex flex-wrap gap-4">
                  {filteredClusters.map((cluster) => (
                    <div
                      key={cluster._id}
                      onClick={() => handleClusterToggle(cluster._id)}
                      className={`p-3 cursor-pointer transition-all duration-200 w-44 h-24 flex flex-col justify-between border rounded ${selectedClusters.includes(cluster._id)
                        ? 'border-blue-500 bg-white z-10 shadow-sm'
                        : 'border-blue-200 bg-white hover:border-blue-300'
                        }`}
                    >
                      <div className={`text-xs ${selectedClusters.includes(cluster._id) ? 'text-blue-600 font-bold' : 'text-blue-600'} truncate`}>{cluster.name}</div>
                      <div className="text-gray-400 text-xs mt-1">
                        {cluster.code || cluster.name?.substring(0, 1).toUpperCase()}
                      </div>
                    </div>
                  ))}
                  {filteredClusters.length === 0 && (
                    <div className="w-full p-4 text-center text-gray-400 text-sm border border-dashed border-gray-200 rounded">
                      No clusters found for selected states.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Product Summary */}
          <div className="bg-white border border-gray-200 mb-6 font-sans">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-blue-500 font-bold text-sm uppercase tracking-tight">Product Summary</h2>
            </div>
            <div className="p-4 text-gray-600 text-sm">
              {products.length > 0 ? (
                <span>Showing <span className="font-bold text-blue-600">{filteredProducts.length}</span> of <span className="font-bold">{products.length}</span> total products based on your selection.</span>
              ) : (
                <span className="text-gray-700">No products added</span>
              )}
            </div>
          </div>

          {/* Product List Section */}
          <div className="bg-white border border-gray-200 font-sans mb-12">
            <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="text-blue-500 font-bold text-sm uppercase tracking-tight">Product List</h2>
              <button
                onClick={() => {
                  if (selectedStates.length === 0 || selectedClusters.length === 0) {
                    showToast("Please select at least one State and Cluster first", "error");
                    return;
                  }
                  setEditingProduct(null);
                  setShowAddModal(true);
                }}
                className="bg-[#0066cc] hover:bg-blue-700 text-white px-5 py-1.5 rounded-sm font-medium text-xs flex items-center justify-center gap-2 transition"
              >
                Add Product
              </button>
            </div>

            <div className="px-4 pb-4">
              <div className="relative mb-4">
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded p-2.5 outline-none text-sm text-gray-700"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Table Container with Custom Scrollbar */}
              <div className="overflow-x-auto w-full border border-gray-200 rounded-t-lg">
                <table className="w-full text-left border-collapse min-w-[1500px]">
                  <thead className="bg-[#7fb5f5] text-white font-medium text-xs whitespace-nowrap">
                    <tr>
                      <th className="p-4 border-r border-blue-400">#</th>
                      <th className="p-4 border-r border-blue-400">Brand</th>
                      <th className="p-4 border-r border-blue-400 text-center">Product Name</th>
                      <th className="p-4 border-r border-blue-400 text-center">Sub Category</th>
                      <th className="p-4 border-r border-blue-400 text-center">Project Category</th>
                      <th className="p-4 border-r border-blue-400 text-center">Project Type</th>
                      <th className="p-4 border-r border-blue-400 text-center">Sub Project Type</th>
                      <th className="p-4 border-r border-blue-400 text-center">Serial No</th>
                      <th className="p-4 border-r border-blue-400 text-center">Subtype</th>
                      <th className="p-4 border-r border-blue-400 text-center">Technology</th>
                      <th className="p-4 border-r border-blue-400 text-center">Tolerance</th>
                      <th className="p-4 border-r border-blue-400 text-center">DCR</th>
                      <th className="p-4 border-r border-blue-400 text-center">Datasheet</th>
                      <th className="p-4 border-r border-blue-400 text-center">State</th>
                      <th className="p-4 border-r border-blue-400 text-center">Cluster</th>
                      <th className="p-4 border-r border-blue-400 text-center">SKU</th>
                      <th className="p-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm font-semibold divide-y divide-gray-100">
                    {filteredProducts.map((p, idx) => (
                      <tr key={p._id} className="hover:bg-blue-50 transition border-b border-gray-100 group">
                        <td className="p-4 text-gray-500 bg-gray-50 group-hover:bg-blue-100 text-center font-bold">{idx + 1}</td>
                        <td className="p-4 text-center font-bold whitespace-nowrap">{p.brandId?.brand || p.brandId?.companyName || '-'}</td>
                        <td className="p-4 text-center text-blue-700 font-bold min-w-[150px]">{p.name || '-'}</td>
                        <td className="p-4 text-center">{p.subCategoryId?.name || '-'}</td>
                        <td className="p-4 text-center">{p.categoryId?.name || '-'}</td>
                        <td className="p-4 text-center">{p.projectTypeId?.name || '-'}</td>
                        <td className="p-4 text-center">{p.subProjectTypeId?.name || '-'}</td>
                        <td className="p-4 text-center text-gray-400 italic">{p.serialNo || '-'}</td>
                        <td className="p-4 text-center">{p.subtype || '-'}</td>
                        <td className="p-4 text-center">{p.technology || '-'}</td>
                        <td className="p-4 text-center">{p.tolerance || '-'}</td>
                        <td className="p-4 text-center">{p.dcr || '-'}</td>
                        <td className="p-4 text-center">
                          {p.datasheet ? (
                            <a href={p.datasheet} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-xs font-bold">View</a>
                          ) : '-'}
                        </td>
                        <td className="p-4 text-center">{p.stateId?.name || p.stateId || '-'}</td>
                        <td className="p-4 text-center">{p.clusterId?.name || p.clusterId || '-'}</td>
                        <td className="p-4 text-center font-mono text-xs">{p.skuId?.skuCode || '-'}</td>
                        <td className="p-4 text-center flex justify-center gap-2">
                          <button
                            onClick={() => {
                              setEditingProduct(p);
                              setShowAddModal(true);
                            }}
                            className="text-blue-500 hover:text-blue-700 bg-blue-100 p-2 rounded-full transition shadow-inner"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={async () => {
                              if (window.confirm('Delete this product?')) {
                                try {
                                  await productApi.delete(p._id);
                                  showToast("Product deleted");
                                  fetchAllData();
                                } catch (e) {
                                  showToast("Delete failed", "error");
                                }
                              }
                            }}
                            className="text-red-500 hover:text-red-700 bg-red-100 p-2 rounded-full transition shadow-inner"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredProducts.length === 0 && (
                      <tr>
                        <td colSpan="17" className="p-12 text-center text-gray-400 italic bg-gray-50 border-b border-gray-100">
                          {loading ? (
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 className="animate-spin text-blue-500" size={32} />
                              <span>Loading data...</span>
                            </div>
                          ) : (
                            "No products matching your selection."
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer info matching mockup */}
              <div className="p-4 bg-gray-50 border-t flex justify-center text-[#0066cc] font-bold text-xs">
                <div className="flex items-center gap-4">
                  <ChevronLeft size={16} className="cursor-pointer text-gray-400 hover:text-gray-600" />
                  <span>Page 1 of 1</span>
                  <ChevronRight size={16} className="cursor-pointer text-gray-400 hover:text-gray-600" />
                </div>
              </div>
            </div>
          </div>
          {/* Copyright Footer */}
          <div className="mt-8 text-center text-gray-800 font-bold text-xs pb-4 tracking-tight">
            Copyright © 2025 Solarkits. All Rights Reserved.
          </div>
        </>
      )}
    </div>
  );
};

export default SkuManagement;