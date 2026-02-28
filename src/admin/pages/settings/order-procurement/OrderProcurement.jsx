import React, { useState, useEffect } from 'react';
import { Eye, Search, X, Plus, Trash, Edit, Save, Settings } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Select from 'react-select';
import {
  getAllOrderProcurementSettings,
  createOrderProcurementSetting,
  updateOrderProcurementSetting,
  deleteOrderProcurementSetting,
  getCategories,
  getSubCategories,
  getProjectTypes,
  getSubProjectTypes,
  getProducts,
  getBrands,
  getComboKits,
  getSupplierTypes,
  getSkus
} from '../../../../services/settings/orderProcurementSettingApi';

export default function OrderProcurement() {
  // Data State
  const [settings, setSettings] = useState([]);
  const [filteredSettings, setFilteredSettings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [projectTypes, setProjectTypes] = useState([]);
  const [subProjectTypes, setSubProjectTypes] = useState([]);
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [skusList, setSkusList] = useState([]);
  const [comboKits, setComboKits] = useState([]);
  const [supplierTypes, setSupplierTypes] = useState([]);

  // Form Dep Dropdowns
  const [formSubCategories, setFormSubCategories] = useState([]);
  const [formSubProjectTypes, setFormSubProjectTypes] = useState([]);

  // UI State
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    category: '',
    subCategory: '',
    projectType: '',
    subProjectType: ''
  });

  // Current Setting Form Data
  const initialFormState = {
    category: '',
    subCategory: '',
    projectType: '',
    subProjectType: '',
    product: '',
    brand: '',
    skus: [],
    skuSelectionOption: 'ComboKit',
    skuItems: [{ minRange: '', maxRange: '', comboKit: '', supplierType: '' }]
  };
  const [formData, setFormData] = useState(initialFormState);

  // Fetch Initial Data
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [
        settingsData,
        catData,
        pTypeData,
        prodData,
        brandData,
        skuData,
        comboData,
        suppTypeData,
        allSubCatData,
        allSubPTypeData
      ] = await Promise.all([
        getAllOrderProcurementSettings(),
        getCategories(),
        getProjectTypes(),
        getProducts(),
        getBrands(),
        getSkus(),
        getComboKits(),
        getSupplierTypes(),
        getSubCategories(), // fetch all for list filters
        getSubProjectTypes() // fetch all for list filters
      ]);

      setSettings(settingsData?.data || []);
      setFilteredSettings(settingsData?.data || []);
      setCategories(catData?.data || []);
      setProjectTypes(pTypeData?.data || []);
      setProducts(prodData?.data || []);
      setBrands(Array.isArray(brandData) ? brandData : brandData?.data || []);
      setSkusList(skuData?.data || []);
      setComboKits(Array.isArray(comboData) ? comboData : comboData?.data || []);
      setSupplierTypes(suppTypeData?.data || []);
      
      setSubCategories(allSubCatData?.data || []);
      setSubProjectTypes(allSubPTypeData?.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load initial data");
    } finally {
      setLoading(false);
    }
  };

  // Filter Logic
  useEffect(() => {
    let result = settings;

    if (filters.category) {
      result = result.filter(s => s.category?.name === filters.category || s.category?._id === filters.category || s.category === filters.category);
    }
    if (filters.subCategory) {
      result = result.filter(s => s.subCategory?.name === filters.subCategory || s.subCategory?._id === filters.subCategory || s.subCategory === filters.subCategory);
    }
    if (filters.projectType) {
      result = result.filter(s => s.projectType?.name === filters.projectType || s.projectType?._id === filters.projectType || s.projectType === filters.projectType);
    }
    if (filters.subProjectType) {
      result = result.filter(s => s.subProjectType?.name === filters.subProjectType || s.subProjectType?._id === filters.subProjectType || s.subProjectType === filters.subProjectType);
    }

    setFilteredSettings(result);
  }, [filters, settings]);

  // Form Handlers
  const handleCategoryChange = async (e) => {
    const catId = e.target.value;
    setFormData(prev => ({ ...prev, category: catId, subCategory: '' }));
    setFormSubCategories([]);
    if (catId) {
      try {
        const res = await getSubCategories(catId);
        setFormSubCategories(res.data || []);
      } catch (err) {
        toast.error("Failed to load sub categories");
      }
    }
  };

  const handleProjectTypeChange = async (e) => {
    const ptId = e.target.value;
    setFormData(prev => ({ ...prev, projectType: ptId, subProjectType: '' }));
    setFormSubProjectTypes([]);
    if (ptId) {
      try {
        const res = await getSubProjectTypes(ptId);
        setFormSubProjectTypes(res.data || []);
      } catch (err) {
        toast.error("Failed to load sub project types");
      }
    }
  };

  // SKU Items Logic
  const handleSkuItemChange = (index, field, value) => {
    const newItems = [...formData.skuItems];
    newItems[index][field] = value;
    setFormData({ ...formData, skuItems: newItems });
  };

  const addSkuItem = () => {
    setFormData({
      ...formData,
      skuItems: [...formData.skuItems, { minRange: '', maxRange: '', comboKit: '', supplierType: '' }]
    });
  };

  const removeSkuItem = (index) => {
    const newItems = formData.skuItems.filter((_, i) => i !== index);
    setFormData({ ...formData, skuItems: newItems });
  };

  // CRUD Actions
  const handleEdit = async (setting) => {
    setIsEdit(true);
    setFormData({
      category: setting.category?._id || setting.category,
      subCategory: setting.subCategory?._id || setting.subCategory,
      projectType: setting.projectType?._id || setting.projectType,
      subProjectType: setting.subProjectType?._id || setting.subProjectType,
      product: setting.product?._id || setting.product,
      brand: setting.brand?._id || setting.brand,
      skus: setting.skus?.map(s => s._id || s) || [],
      skuSelectionOption: setting.skuSelectionOption || 'ComboKit',
      skuItems: setting.skuItems.map(i => ({
        minRange: i.minRange,
        maxRange: i.maxRange,
        comboKit: i.comboKit?._id || i.comboKit || '',
        supplierType: i.supplierType?._id || i.supplierType || '',
        _id: i._id
      })),
      _id: setting._id
    });

    // Load dependent dropdowns for form
    if (setting.category?._id || setting.category) {
      const res = await getSubCategories(setting.category?._id || setting.category);
      setFormSubCategories(res.data || []);
    }
    if (setting.projectType?._id || setting.projectType) {
      const res = await getSubProjectTypes(setting.projectType?._id || setting.projectType);
      setFormSubProjectTypes(res.data || []);
    }

    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this setting?')) {
      try {
        await deleteOrderProcurementSetting(id);
        toast.success('Setting deleted successfully');
        fetchInitialData();
      } catch (err) {
        toast.error(err.message || 'Failed to delete setting');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        skuItems: formData.skuItems.map(item => {
          const newItem = { ...item };
          if (!newItem.comboKit || newItem.comboKit === '') delete newItem.comboKit;
          if (!newItem.supplierType || newItem.supplierType === '') delete newItem.supplierType;
          return newItem;
        })
      };

      if (isEdit) {
        await updateOrderProcurementSetting(formData._id, payload);
        toast.success('Setting updated successfully');
      } else {
        await createOrderProcurementSetting(payload);
        toast.success('Setting created successfully');
      }
      setShowModal(false);
      fetchInitialData();
      resetForm();
    } catch (err) {
      toast.error(err.message || 'Operation failed');
    }
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setFormSubCategories([]);
    setFormSubProjectTypes([]);
    setIsEdit(false);
  };

  return (
    <div className="container px-4 py-8 mx-auto">
      {/* Header and Add Button inside one card */}
      <div className="p-6 mb-6 bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col items-start gap-4">
        <h4 className="text-xl font-bold text-blue-600 mb-0">Order Procurement Setting</h4>
        
        {/* Filters Grid */}
        <div className="w-full grid grid-cols-1 gap-4 md:grid-cols-4 items-center">
          <select
            className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          >
            <option value="">Filter by Category</option>
            {Array.from(new Set(categories.map(c => c.name))).map(name => <option key={name} value={name}>{name}</option>)}
          </select>

          <select
            className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            value={filters.subCategory}
            onChange={(e) => setFilters({ ...filters, subCategory: e.target.value })}
          >
            <option value="">Filter by Sub-Category</option>
            {Array.from(new Set(subCategories.map(c => c.name))).map(name => <option key={name} value={name}>{name}</option>)}
          </select>

          <select
            className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            value={filters.projectType}
            onChange={(e) => setFilters({ ...filters, projectType: e.target.value })}
          >
            <option value="">Filter by Project type</option>
            {Array.from(new Set(projectTypes.map(p => p.name))).map(name => <option key={name} value={name}>{name}</option>)}
          </select>

          <select
            className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            value={filters.subProjectType}
            onChange={(e) => setFilters({ ...filters, subProjectType: e.target.value })}
          >
            <option value="">Filter by Sub Project type</option>
            {Array.from(new Set(subProjectTypes.map(p => p.name))).map(name => <option key={name} value={name}>{name}</option>)}
          </select>
        </div>
        
        <div className="flex w-full justify-between items-center mt-2">
            <button 
                onClick={() => setFilters({ category: '', subCategory: '', projectType: '', subProjectType: '' })}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
            >
                <X size={14} className="mr-1" /> Clear Filters
            </button>
            <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="bg-blue-600 text-white px-5 py-2 rounded-md flex items-center gap-2 hover:bg-blue-700 transition"
            >
            <Plus size={18} /> Add
            </button>
        </div>
      </div>

      {/* Table */}
      <div className="p-0 bg-white rounded-lg shadow-sm overflow-x-auto border border-gray-100">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading settings...</div>
        ) : filteredSettings.length === 0 ? (
          <div className="py-16 text-center text-gray-400 font-medium">
            <Settings size={48} className="mx-auto mb-4 opacity-50" />
            <p>No setting permutations found. Try adding a new configuration.</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-[#5da5eb] text-white">
              <tr>
                <th className="px-4 py-3 font-medium border-b border-[#4791d9]">ID</th>
                <th className="px-4 py-3 font-medium border-b border-[#4791d9]">Category</th>
                <th className="px-4 py-3 font-medium border-b border-[#4791d9]">Sub category</th>
                <th className="px-4 py-3 font-medium border-b border-[#4791d9]">Project type</th>
                <th className="px-4 py-3 font-medium border-b border-[#4791d9]">Sub Project type</th>
                <th className="px-4 py-3 font-medium border-b border-[#4791d9] text-center">action</th>
              </tr>
            </thead>
            <tbody>
              {filteredSettings.map((setting, idx) => (
                <tr key={setting._id} className="border-b hover:bg-blue-50/30 transition">
                  <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{setting.category?.name || 'N/A'}</td>
                  <td className="px-4 py-3 text-gray-600">{setting.subCategory?.name || 'N/A'}</td>
                  <td className="px-4 py-3 text-gray-600">{setting.projectType?.name || 'N/A'}</td>
                  <td className="px-4 py-3 text-gray-600">{setting.subProjectType?.name || 'N/A'}</td>
                  <td className="px-4 py-3 text-center flex justify-center gap-3">
                    <button
                      onClick={() => handleEdit(setting)}
                      className="text-blue-500 hover:text-blue-700"
                      title="Edit"
                    >
                      <Settings size={18} />
                    </button>
                    <button
                      onClick={() => handleEdit(setting)}
                      className="text-blue-500 hover:text-blue-700"
                      title="View"
                    >
                      <Eye size={18} />
                    </button>
                    {/* Add delete optionally */}
                    <button
                      onClick={() => handleDelete(setting._id)}
                      className="text-red-400 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal matching exact structure */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center z-50 p-4 xl:p-0">
          <div className="bg-[#f0f4f8] rounded-xl shadow-xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh]">
            
            <div className="p-6 bg-white border-b border-gray-200 flex justify-between items-center rounded-t-xl">
              <h3 className="text-[22px] font-bold text-[#1f8dec] m-0 leading-tight">
                {isEdit ? 'Edit Order Procurement Setting' : 'Add Order Procurement Setting'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-700 flex items-center text-sm font-medium gap-1 uppercase tracking-wide">
                <span className="text-xl">&larr;</span> Back
              </button>
            </div>

            <div className="p-8 overflow-y-auto flex-1 bg-white mx-0 my-0">
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Row 1: Category, Sub Category, Project Type, Sub Project Type */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Category</label>
                    <select
                      required
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                      value={formData.category}
                      onChange={handleCategoryChange}
                    >
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Sub Category</label>
                    <select
                      required
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                      value={formData.subCategory}
                      onChange={e => setFormData({ ...formData, subCategory: e.target.value })}
                      disabled={!formData.category}
                    >
                      <option value="">Select Sub Category</option>
                      {formSubCategories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Project Type</label>
                    <select
                      required
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                      value={formData.projectType}
                      onChange={handleProjectTypeChange}
                    >
                      <option value="">Select Project Type</option>
                      {projectTypes.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Sub Project Type</label>
                    <select
                      required
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                      value={formData.subProjectType}
                      onChange={e => setFormData({ ...formData, subProjectType: e.target.value })}
                      disabled={!formData.projectType}
                    >
                      <option value="">Select Sub Project</option>
                      {formSubProjectTypes.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Row 2: Product, Brand */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Product</label>
                    <select
                      required
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                      value={formData.product}
                      onChange={e => setFormData({ ...formData, product: e.target.value })}
                    >
                      <option value="">Select Product</option>
                      {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Brand</label>
                    <select
                      required
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                      value={formData.brand}
                      onChange={e => setFormData({ ...formData, brand: e.target.value })}
                    >
                      <option value="">Select Brand</option>
                      {brands.map(b => <option key={b._id} value={b._id}>{b.companyName || b.brand || b.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* SKUs block with Tabs */}
                <div className="mt-8 border border-gray-200 rounded-lg p-1 max-w-sm inline-block w-full sm:w-80">
                  <div className="p-3">
                      <label className="block font-medium text-blue-600 mb-4">SKUs</label>
                      <Select
                          isMulti
                          placeholder="Select SKUs"
                          className="mb-4 text-sm"
                          options={skusList.map(s => ({ label: s.skuCode, value: s._id }))}
                          value={formData.skus.map(sId => {
                              const s = skusList.find(x => x._id === sId);
                              return { label: s?.skuCode || sId, value: sId };
                          })}
                          onChange={(selected) => setFormData({ ...formData, skus: selected ? selected.map(s => s.value) : [] })}
                      />
                      
                      <div className="flex bg-gray-100 rounded overflow-hidden mt-4 shadow-inner">
                        <button
                          type="button"
                          className={`flex-1 py-2 text-sm font-medium transition ${
                            formData.skuSelectionOption === 'ComboKit' ? 'bg-white shadow text-blue-600 border border-gray-200' : 'text-gray-500 hover:bg-gray-200'
                          }`}
                          onClick={() => setFormData({ ...formData, skuSelectionOption: 'ComboKit' })}
                        >
                          ComboKit
                        </button>
                        <button
                          type="button"
                          className={`flex-1 py-2 text-sm font-medium transition ${
                            formData.skuSelectionOption === 'Customize' ? 'bg-white shadow text-blue-600 border border-gray-200' : 'text-gray-500 hover:bg-gray-200'
                          }`}
                          onClick={() => setFormData({ ...formData, skuSelectionOption: 'Customize' })}
                        >
                          Customize
                        </button>
                      </div>
                  </div>
                </div>
                
                {/* Red Arrow helper mapping UI visually */}
                {/* This represents the logic mapping on the UI image */}
                <div className="relative mt-8 bg-[#f8f9fa] border border-gray-200 rounded-xl p-6">
                    
                  {/* Table headers for dynamic rows */}
                  <div className="flex mb-2">
                      <div className="w-[30%] text-[13px] font-medium text-gray-600">Range (kW)</div>
                      <div className="w-[30%] text-[13px] font-medium text-gray-600 ml-4">{formData.skuSelectionOption}</div>
                      <div className="w-[30%] text-[13px] font-medium text-gray-600 ml-4">Supplier Type</div>
                      <div className="w-10"></div>
                  </div>

                  <div className="space-y-4">
                    {formData.skuItems.map((item, index) => (
                      <div key={index} className="flex items-center gap-4 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                        
                        <div className="w-[30%] flex gap-2">
                           <input
                              required
                              type="number"
                              min="0"
                              placeholder="Min"
                              className="w-1/2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm"
                              value={item.minRange}
                              onChange={(e) => handleSkuItemChange(index, 'minRange', e.target.value)}
                            />
                            <input
                              required
                              type="number"
                              min="0"
                              placeholder="Max"
                              className="w-1/2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm"
                              value={item.maxRange}
                              onChange={(e) => handleSkuItemChange(index, 'maxRange', e.target.value)}
                            />
                        </div>
                        
                        <div className="w-[30%]">
                            {formData.skuSelectionOption === 'ComboKit' ? (
                                <select
                                    required
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm"
                                    value={item.comboKit}
                                    onChange={(e) => handleSkuItemChange(index, 'comboKit', e.target.value)}
                                >
                                    <option value="">Select ComboKit</option>
                                    {comboKits.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select>
                            ) : (
                                <div className="w-full px-3 py-2 bg-gray-100 border border-dashed border-gray-300 rounded-md text-sm text-gray-500 text-center">
                                    Custom Logic Applied
                                </div>
                            )}
                        </div>
                        
                        <div className="w-[30%]">
                            <select
                                required
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm"
                                value={item.supplierType}
                                onChange={(e) => handleSkuItemChange(index, 'supplierType', e.target.value)}
                            >
                                <option value="">Select Supplier Type</option>
                                {supplierTypes.map(s => <option key={s._id} value={s._id}>{s.name || s.type_name || s._id}</option>)}
                            </select>
                        </div>
                        
                        <div className="w-10 flex justify-center">
                            {formData.skuItems.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeSkuItem(index)}
                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition"
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4">
                     <button 
                        type="button" 
                        onClick={addSkuItem} 
                        className="text-[#1f8dec] text-sm font-medium hover:underline flex items-center"
                     >
                        <Plus size={16} className="mr-1" /> Add {formData.skuSelectionOption}
                     </button>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-8 mb-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 font-medium text-gray-600 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-2 bg-[#1976d2] text-white font-medium rounded-md shadow hover:bg-blue-700 flex items-center gap-2 transition"
                  >
                    <Save size={18} /> Save
                  </button>
                </div>
              </form>
            </div>
            
            <div className="bg-white py-3 border-t text-center text-xs text-gray-500 border-gray-200">
                Copyright © {new Date().getFullYear()} Solarkits. All Rights Reserved.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}