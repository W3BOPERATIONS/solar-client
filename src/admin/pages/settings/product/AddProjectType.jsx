import React, { useState, useEffect } from 'react';
import { Search, Save, Edit2, Trash2, CheckCircle, AlertCircle, Loader2, Plus } from 'lucide-react';
import { productApi } from '../../../../api/productApi';

const AddProjectType = () => {
    // Data States
    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [projectTypes, setProjectTypes] = useState([]);
    const [subProjectTypes, setSubProjectTypes] = useState([]);
    
    // Loading & UI States
    const [loading, setLoading] = useState(false);
    const [toasts, setToasts] = useState([]);
    
    // Form Inputs
    const [newCategoryName, setNewCategoryName] = useState('');
    const [selectedProjectTypeForCat, setSelectedProjectTypeForCat] = useState('');
    
    const [newSubCategoryName, setNewSubCategoryName] = useState('');
    const [selectedCategoryForSubCat, setSelectedCategoryForSubCat] = useState('');
    const [selectedProjectTypeForSubCat, setSelectedProjectTypeForSubCat] = useState('');

    const [newSubProjectTypeName, setNewSubProjectTypeName] = useState('');
    const [selectedProjectTypeForSubPT, setSelectedProjectTypeForSubPT] = useState('');

    const showToast = (message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [catRes, subCatRes, pTypeRes, subPTypeRes] = await Promise.all([
                productApi.getCategories(),
                productApi.getSubCategories(),
                productApi.getProjectTypes(),
                productApi.getSubProjectTypes()
            ]);

            const cats = catRes?.data?.data || [];
            const pts = pTypeRes?.data?.data || [];
            
            setCategories(cats);
            setSubCategories(subCatRes?.data?.data || []);
            setProjectTypes(pts);
            setSubProjectTypes(subPTypeRes?.data?.data || []);

            // Set initial dropdown values if available
            if (pts.length > 0) {
                setSelectedProjectTypeForCat(pts[0]._id);
                setSelectedProjectTypeForSubCat(pts[0]._id);
                setSelectedProjectTypeForSubPT(pts[0]._id);
            }
            if (cats.length > 0) {
                setSelectedCategoryForSubCat(cats[0]._id);
            }
        } catch (err) {
            console.error(err);
            showToast('Failed to fetch master data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return showToast("Category name is required", "error");
        if (!selectedProjectTypeForCat) return showToast("Project Type is required", "error");
        try {
            await productApi.createCategory({ 
                name: newCategoryName.trim(),
                projectTypeId: selectedProjectTypeForCat
            });
            showToast("Category added");
            setNewCategoryName('');
            fetchInitialData();
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to add category", "error");
        }
    };

    const handleAddSubCategory = async () => {
        if (!newSubCategoryName.trim()) return showToast("Sub Category name is required", "error");
        if (!selectedCategoryForSubCat) return showToast("Category selection is required", "error");
        if (!selectedProjectTypeForSubCat) return showToast("Project Type selection is required", "error");
        
        try {
            await productApi.createSubCategory({ 
                name: newSubCategoryName.trim(),
                categoryId: selectedCategoryForSubCat,
                projectTypeId: selectedProjectTypeForSubCat
            });
            showToast("Sub Category added");
            setNewSubCategoryName('');
            fetchInitialData();
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to add sub-category", "error");
        }
    };

    const handleAddSubProjectType = async () => {
        if (!newSubProjectTypeName.trim()) return showToast("Sub Project Type name is required", "error");
        if (!selectedProjectTypeForSubPT) return showToast("Project Type selection is required", "error");

        try {
            await productApi.createSubProjectType({ 
                name: newSubProjectTypeName.trim(),
                projectTypeId: selectedProjectTypeForSubPT
            });
            showToast("Sub Project Type added");
            setNewSubProjectTypeName('');
            fetchInitialData();
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to add sub-project type", "error");
        }
    };

    const handleDelete = async (type, id) => {
        if (!window.confirm("Are you sure you want to delete this item?")) return;
        try {
            if (type === 'cat') await productApi.deleteCategory(id);
            if (type === 'subCat') await productApi.deleteSubCategory(id);
            if (type === 'subPT') await productApi.deleteSubProjectType(id);
            showToast("Item deleted");
            fetchInitialData();
        } catch (err) {
            showToast("Delete failed", "error");
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-7xl font-sans">
            {/* Toasts */}
            <div className="fixed top-4 right-4 z-50 space-y-2">
                {toasts.map(t => (
                    <div key={t.id} className={`p-4 rounded-lg shadow-lg flex items-center gap-2 text-white transition-all animate-fadeIn ${t.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                        {t.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        {t.message}
                    </div>
                ))}
            </div>

            {/* Main Content Card */}
            <div className="bg-white rounded shadow-sm overflow-hidden mb-8 border border-gray-200">
                <div className="bg-blue-600 p-3">
                    <h2 className="text-white text-center font-bold text-lg uppercase tracking-wider">Add Category Type</h2>
                </div>

                <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                        {/* Category Card */}
                        <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 shadow-sm transition hover:shadow-md">
                            <h3 className="text-blue-600 font-bold mb-4 flex items-center gap-2">Category</h3>
                            <div className="space-y-4">
                                <input 
                                    type="text" 
                                    className="w-full border rounded p-2 focus:ring-1 focus:ring-blue-400 outline-none"
                                    placeholder="Enter Category Name"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                />
                                <div className="flex gap-2">
                                    <select 
                                        className="flex-1 border rounded p-2 text-sm focus:ring-1 focus:ring-blue-400 outline-none"
                                        value={selectedProjectTypeForCat}
                                        onChange={(e) => setSelectedProjectTypeForCat(e.target.value)}
                                    >
                                        <option value="">Select Project Type</option>
                                        {projectTypes.map(pt => <option key={pt._id} value={pt._id}>{pt.name}</option>)}
                                    </select>
                                    <button 
                                        onClick={handleAddCategory}
                                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-1 font-semibold transition"
                                    >
                                        <Plus size={18} /> Add
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Sub Category Card */}
                        <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 shadow-sm transition hover:shadow-md">
                            <h3 className="text-blue-600 font-bold mb-4 flex items-center gap-2">Sub Category</h3>
                            <div className="space-y-4">
                                <input 
                                    type="text" 
                                    className="w-full border rounded p-2 focus:ring-1 focus:ring-blue-400 outline-none"
                                    placeholder="Enter Sub Category Name"
                                    value={newSubCategoryName}
                                    onChange={(e) => setNewSubCategoryName(e.target.value)}
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <select 
                                        className="border rounded p-2 text-sm focus:ring-1 focus:ring-blue-400 outline-none"
                                        value={selectedCategoryForSubCat}
                                        onChange={(e) => setSelectedCategoryForSubCat(e.target.value)}
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                    </select>
                                    <select 
                                        className="border rounded p-2 text-sm focus:ring-1 focus:ring-blue-400 outline-none"
                                        value={selectedProjectTypeForSubCat}
                                        onChange={(e) => setSelectedProjectTypeForSubCat(e.target.value)}
                                    >
                                        <option value="">Select Project Type</option>
                                        {projectTypes.map(pt => <option key={pt._id} value={pt._id}>{pt.name}</option>)}
                                    </select>
                                </div>
                                <button 
                                    onClick={handleAddSubCategory}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center justify-center gap-1 font-semibold transition"
                                >
                                    <Plus size={18} /> Add Sub Category
                                </button>
                            </div>
                        </div>

                        {/* Sub Project Type Card */}
                        <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 shadow-sm transition hover:shadow-md md:col-span-1">
                            <h3 className="text-blue-600 font-bold mb-4 flex items-center gap-2">Sub Project Type</h3>
                            <div className="space-y-4">
                                <input 
                                    type="text" 
                                    className="w-full border rounded p-2 focus:ring-1 focus:ring-blue-400 outline-none"
                                    placeholder="Enter Sub Project Type"
                                    value={newSubProjectTypeName}
                                    onChange={(e) => setNewSubProjectTypeName(e.target.value)}
                                />
                                <div className="flex gap-2">
                                    <select 
                                        className="flex-1 border rounded p-2 text-sm focus:ring-1 focus:ring-blue-400 outline-none"
                                        value={selectedProjectTypeForSubPT}
                                        onChange={(e) => setSelectedProjectTypeForSubPT(e.target.value)}
                                    >
                                        <option value="">Select Project Type</option>
                                        {projectTypes.map(pt => <option key={pt._id} value={pt._id}>{pt.name}</option>)}
                                    </select>
                                    <button 
                                        onClick={handleAddSubProjectType}
                                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-1 font-semibold transition"
                                    >
                                        <Plus size={18} /> Add
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Category Summary */}
                <div className="bg-white rounded shadow-sm overflow-hidden border border-gray-200">
                    <div className="bg-blue-600 p-2 text-center text-white font-bold">Category Summary</div>
                    <div className="p-4 max-h-[300px] overflow-y-auto min-h-[150px]">
                        {categories.length === 0 ? (
                            <div className="text-gray-400 text-center py-10">No categories added yet.</div>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {categories.map(item => (
                                    <li key={item._id} className="py-2 flex justify-between items-center group">
                                        <div className="flex flex-col">
                                            <span className="text-gray-700 font-medium">{item.name}</span>
                                            <span className="text-[10px] text-gray-400 uppercase">{item.projectTypeId?.name}</span>
                                        </div>
                                        <button onClick={() => handleDelete('cat', item._id)} className="text-red-400 opacity-0 group-hover:opacity-100 transition"><Trash2 size={16}/></button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Sub Category Summary */}
                <div className="bg-white rounded shadow-sm overflow-hidden border border-gray-200">
                    <div className="bg-green-600 p-2 text-center text-white font-bold">Sub Category Summary</div>
                    <div className="p-4 max-h-[300px] overflow-y-auto min-h-[150px]">
                        {subCategories.length === 0 ? (
                            <div className="text-gray-400 text-center py-10">No sub-categories added yet.</div>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {subCategories.map(item => (
                                    <li key={item._id} className="py-2 flex justify-between items-center group">
                                        <div className="flex flex-col">
                                            <span className="text-gray-700 font-medium">{item.name}</span>
                                            <span className="text-[10px] text-gray-400 uppercase">{item.categoryId?.name}</span>
                                        </div>
                                        <button onClick={() => handleDelete('subCat', item._id)} className="text-red-400 opacity-0 group-hover:opacity-100 transition"><Trash2 size={16}/></button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Sub Project Type Summary */}
                <div className="bg-white rounded shadow-sm overflow-hidden border border-gray-200">
                    <div className="bg-yellow-500 p-2 text-center text-white font-bold">Sub Project Type Summary</div>
                    <div className="p-4 max-h-[300px] overflow-y-auto min-h-[150px]">
                        {subProjectTypes.length === 0 ? (
                            <div className="text-gray-400 text-center py-10">No sub project types added yet.</div>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {subProjectTypes.map(item => (
                                    <li key={item._id} className="py-2 flex justify-between items-center group">
                                         <div className="flex flex-col">
                                            <span className="text-gray-700 font-medium">{item.name}</span>
                                            <span className="text-[10px] text-gray-400 uppercase">{item.projectTypeId?.name}</span>
                                        </div>
                                        <button onClick={() => handleDelete('subPT', item._id)} className="text-red-400 opacity-0 group-hover:opacity-100 transition"><Trash2 size={16}/></button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>

            {/* Copyright Footer (matches mockup) */}
            <div className="mt-12 text-center text-gray-600 text-sm pb-8">
                Copyright © 2025 Solarkits. All Rights Reserved.
            </div>
        </div>
    );
};

export default AddProjectType;