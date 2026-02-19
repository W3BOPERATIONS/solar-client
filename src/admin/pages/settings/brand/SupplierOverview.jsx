import React, { useState, useEffect } from 'react';
import {
  Users,
  Truck,
  MapPin,
  Building2,
  Package,
  Filter,
  Check,
  X,
  Plus,
  Edit2,
  Trash2
} from 'lucide-react';
import axios from 'axios';
import {
  createSupplier,
  getAllSuppliers,
  updateSupplier,
  deleteSupplier,
  getAllManufacturers
} from '../../../../services/brandApi';

const BrandSupplierOverview = () => {
  // --- Data State ---
  const [suppliers, setSuppliers] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // --- Filter State ---
  const [selectedStates, setSelectedStates] = useState(new Set());
  const [selectedCities, setSelectedCities] = useState(new Set()); // Renamed from Clusters
  const [selectedDistricts, setSelectedDistricts] = useState(new Set());
  const [selectedManufactures, setSelectedManufactures] = useState(new Set());
  const [showCities, setShowCities] = useState(false);
  const [showDistricts, setShowDistricts] = useState(false);
  const [showManufactures, setShowManufactures] = useState(false);

  const [supplierTypes, setSupplierTypes] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [projectTypes, setProjectTypes] = useState([]);
  const [subProjectTypes, setSubProjectTypes] = useState([]);
  const [procurementTypes, setProcurementTypes] = useState([]);

  // --- Location Master Data (for Filters) ---
  const [allStates, setAllStates] = useState([]);
  const [allCities, setAllCities] = useState([]);
  const [allDistricts, setAllDistricts] = useState([]);

  // --- Modal State ---
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [modalForm, setModalForm] = useState({
    type: 'Dealer',
    name: '',
    state: '',
    cluster: '', // City ID
    district: '',
    manufacturer: '',
    product: '',
    category: '',
    subCategory: '',
    projectType: '',
    subProjectType: '',
    procurementType: '',
    contact: '',
    email: ''
  });

  // --- Modal Location Options ---
  const [modalCities, setModalCities] = useState([]);
  const [modalDistricts, setModalDistricts] = useState([]);

  // --- Initial Fetch ---
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [suppliersData, manuData, statesResp] = await Promise.all([
        getAllSuppliers(),
        getAllManufacturers(),
        axios.get('http://localhost:5000/api/locations/states?isActive=true')
      ]);
      setSuppliers(suppliersData);
      setManufacturers(manuData);
      if (statesResp.data.success) {
        setAllStates(statesResp.data.data);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Cities/Districts for Filters (Aggregated from DB or fetched all?)
  // For filters, we want *relevant* locations. 
  // But strictly adhering to "Dynamic", we should fetch location lists based on selection.
  // Using the same API pattern as AddBrandManufacturer.

  useEffect(() => {
    // When selectedStates changes, fetch relevant cities
    // Note: API supports filtering by ONE stateId usually. 
    // If filtering by multiple, we might need to make multiple calls or get all cities.
    // For simplicity/performance, let's fetch ALL cities if states selected, or just on demand.
    // Let's assume we can fetch cities for selected states. 
    // If multiple states > complicated URL. 
    // Workaround: Fetch cities for EACH selected state and merge.
    const fetchFilterCities = async () => {
      if (selectedStates.size === 0) {
        setAllCities([]);
        return;
      }
      const promises = Array.from(selectedStates).map(stateId =>
        axios.get(`http://localhost:5000/api/locations/cities?stateId=${stateId}&isActive=true`)
      );
      try {
        const responses = await Promise.all(promises);
        const mergedCities = responses.flatMap(r => r.data.success ? r.data.data : []);
        setAllCities(mergedCities);
      } catch (err) { console.error(err); }
    };
    fetchFilterCities();
  }, [selectedStates]);

  useEffect(() => {
    const fetchFilterDistricts = async () => {
      if (selectedCities.size === 0) {
        setAllDistricts([]);
        return;
      }
      const promises = Array.from(selectedCities).map(cityId =>
        axios.get(`http://localhost:5000/api/locations/districts?cityId=${cityId}&isActive=true`)
      );
      try {
        const responses = await Promise.all(promises);
        const mergedDistricts = responses.flatMap(r => r.data.success ? r.data.data : []);
        setAllDistricts(mergedDistricts);
      } catch (err) { console.error(err); }
    };
    fetchFilterDistricts();
  }, [selectedCities]);


  // --- Filter Logic ---
  const filteredSuppliers = suppliers.filter(supplier => {
    if (selectedStates.size > 0 && !selectedStates.has(supplier.state?._id || supplier.state)) return false;
    if (selectedCities.size > 0 && !selectedCities.has(supplier.cluster?._id || supplier.cluster)) return false;
    if (selectedDistricts.size > 0 && !selectedDistricts.has(supplier.district?._id || supplier.district)) return false;
    if (selectedManufactures.size > 0) {
      // Manufacturer name or ID?
      // Filter UI uses names usually. Let's check what we store in Set.
      // We can use Manufacturer Name from populated field.
      const manuName = supplier.manufacturer?.companyName || '';
      if (!selectedManufactures.has(manuName)) return false;
    }

    if (supplierTypes.length > 0 && !supplierTypes.includes(supplier.type)) return false;
    if (products.length > 0 && !products.includes(supplier.product)) return false;
    if (categories.length > 0 && !categories.includes(supplier.category)) return false;
    if (subCategories.length > 0 && !subCategories.includes(supplier.subCategory)) return false;
    if (projectTypes.length > 0 && !projectTypes.includes(supplier.projectType)) return false;
    if (subProjectTypes.length > 0 && !subProjectTypes.includes(supplier.subProjectType)) return false;
    if (procurementTypes.length > 0 && !procurementTypes.includes(supplier.procurementType)) return false;

    return true;
  });

  // --- Stats ---
  const dealerCount = filteredSuppliers.filter(s => s.type === "Dealer").length;
  const distributorCount = filteredSuppliers.filter(s => s.type === "Distributor").length;

  // --- Filter Handlers ---
  const handleStateSelect = (stateId) => {
    const newSet = new Set(selectedStates);
    if (newSet.has(stateId)) newSet.delete(stateId);
    else newSet.add(stateId);
    setSelectedStates(newSet);
    setShowCities(newSet.size > 0);
    // Reset lower filters
    setSelectedCities(new Set());
    setSelectedDistricts(new Set());
    setShowDistricts(false);
  };

  const handleCitySelect = (cityId) => {
    const newSet = new Set(selectedCities);
    if (newSet.has(cityId)) newSet.delete(cityId);
    else newSet.add(cityId);
    setSelectedCities(newSet);
    setShowDistricts(newSet.size > 0);
    setSelectedDistricts(new Set());
  };

  const handleDistrictSelect = (districtId) => {
    const newSet = new Set(selectedDistricts);
    if (newSet.has(districtId)) newSet.delete(districtId);
    else newSet.add(districtId);
    setSelectedDistricts(newSet);
    setShowManufactures(newSet.size > 0);
  };

  const handleManufactureSelect = (manuName) => {
    const newSet = new Set(selectedManufactures);
    if (newSet.has(manuName)) newSet.delete(manuName);
    else newSet.add(manuName);
    setSelectedManufactures(newSet);
  };

  // --- CRUD Handlers ---
  const handleAdd = () => {
    setEditId(null);
    setModalForm({
      type: 'Dealer',
      name: '',
      state: '',
      cluster: '',
      district: '',
      manufacturer: '',
      product: '',
      category: '',
      subCategory: '',
      projectType: '',
      subProjectType: '',
      procurementType: '',
      contact: '',
      email: ''
    });
    setShowModal(true);
  };

  const handleEdit = (supplier) => {
    setEditId(supplier._id);
    const stateId = supplier.state?._id || supplier.state;
    const cityId = supplier.cluster?._id || supplier.cluster;

    setModalForm({
      type: supplier.type,
      name: supplier.name,
      state: stateId,
      cluster: cityId,
      district: supplier.district?._id || supplier.district,
      manufacturer: supplier.manufacturer?._id || supplier.manufacturer,
      product: supplier.product,
      category: supplier.category,
      subCategory: supplier.subCategory,
      projectType: supplier.projectType,
      subProjectType: supplier.subProjectType,
      procurementType: supplier.procurementType,
      contact: supplier.contact || '',
      email: supplier.email || ''
    });

    // Fetch lists for modal
    if (stateId) fetchModalCities(stateId);
    if (cityId) fetchModalDistricts(cityId);

    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        await deleteSupplier(id);
        fetchInitialData();
      } catch (err) {
        alert('Failed to delete supplier');
      }
    }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!modalForm.name || !modalForm.state || !modalForm.cluster || !modalForm.district || !modalForm.manufacturer) {
      alert('Please fill all required fields');
      return;
    }

    try {
      if (editId) {
        await updateSupplier(editId, modalForm);
        alert('Supplier updated successfully');
      } else {
        await createSupplier(modalForm);
        alert('Supplier created successfully');
      }
      setShowModal(false);
      fetchInitialData();
    } catch (err) {
      alert('Operation failed: ' + (err.response?.data?.message || err.message));
    }
  };

  // --- Modal Specific Location Fetchers ---
  const fetchModalCities = async (stateId) => {
    if (!stateId) { setModalCities([]); return; }
    try {
      const res = await axios.get(`http://localhost:5000/api/locations/cities?stateId=${stateId}&isActive=true`);
      if (res.data.success) setModalCities(res.data.data);
    } catch (e) { console.error(e); }
  };

  const fetchModalDistricts = async (cityId) => {
    if (!cityId) { setModalDistricts([]); return; }
    try {
      const res = await axios.get(`http://localhost:5000/api/locations/districts?cityId=${cityId}&isActive=true`);
      if (res.data.success) setModalDistricts(res.data.data);
    } catch (e) { console.error(e); }
  };

  const handleModalStateChange = (e) => {
    const val = e.target.value;
    setModalForm({ ...modalForm, state: val, cluster: '', district: '' });
    setModalCities([]); setModalDistricts([]);
    fetchModalCities(val);
  };

  const handleModalCityChange = (e) => {
    const val = e.target.value;
    setModalForm({ ...modalForm, cluster: val, district: '' }); // cluster = City ID
    setModalDistricts([]);
    fetchModalDistricts(val);
  };

  return (
    <div className="container-fluid p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-600">Brand Supplier Overview</h1>
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Add Supplier
        </button>
      </div>

      {/* State Selection */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
        <h2 className="text-lg font-semibold mb-4 border-l-4 border-blue-500 pl-3">Select States</h2>
        <div className="flex gap-2 mb-4">
          <button onClick={() => setSelectedStates(new Set(allStates.map(s => s._id)))} className="px-4 py-2 border border-blue-500 text-blue-500 rounded">Select All</button>
          <button onClick={() => setSelectedStates(new Set())} className="px-4 py-2 border border-gray-400 text-gray-600 rounded">Clear All</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {allStates.map((state) => (
            <div
              key={state._id}
              className={`border rounded-lg cursor-pointer p-4 text-center transition-all duration-200 ${selectedStates.has(state._id) ? 'border-blue-500 bg-blue-500 text-white' : 'border-blue-200 hover:border-blue-300'}`}
              onClick={() => handleStateSelect(state._id)}
            >
              <p className="font-bold">{state.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* City Selection (Clusters) */}
      {selectedStates.size > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
          <h2 className="text-lg font-semibold mb-4 border-l-4 border-blue-500 pl-3">Select Cities (Clusters)</h2>
          <div className="flex gap-2 mb-4">
            <button onClick={() => setSelectedCities(new Set(allCities.map(c => c._id)))} className="px-4 py-2 border border-blue-500 text-blue-500 rounded">Select All</button>
            <button onClick={() => setSelectedCities(new Set())} className="px-4 py-2 border border-gray-400 text-gray-600 rounded">Clear All</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {allCities.map((city) => (
              <div
                key={city._id}
                className={`border rounded-lg p-4 text-center cursor-pointer transition-all duration-200 ${selectedCities.has(city._id) ? 'border-purple-600 bg-purple-600 text-white' : 'border-gray-200'}`}
                onClick={() => handleCitySelect(city._id)}
              >
                {city.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* District Selection */}
      {selectedCities.size > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
          <h2 className="text-lg font-semibold mb-4 border-l-4 border-blue-500 pl-3">Select Districts</h2>
          <div className="flex gap-2 mb-4">
            <button onClick={() => setSelectedDistricts(new Set(allDistricts.map(d => d._id)))} className="px-4 py-2 border border-blue-500 text-blue-500 rounded">Select All</button>
            <button onClick={() => setSelectedDistricts(new Set())} className="px-4 py-2 border border-gray-400 text-gray-600 rounded">Clear All</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {allDistricts.map((district) => (
              <div
                key={district._id}
                className={`border rounded-lg p-4 text-center cursor-pointer transition-all duration-200 ${selectedDistricts.has(district._id) ? 'border-green-600 bg-green-600 text-white' : 'border-gray-200'}`}
                onClick={() => handleDistrictSelect(district._id)}
              >
                {district.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Section (Simplified Multi-selects for demo, can be expanded) */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
        <h2 className="text-lg font-semibold mb-4 border-l-4 border-blue-500 pl-3">Filter Section</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Supplier Type */}
          <div>
            <label className="block text-sm font-medium mb-2">Supplier Type</label>
            <select multiple className="w-full border rounded h-32 p-2" onChange={e => setSupplierTypes(Array.from(e.target.selectedOptions, o => o.value))}>
              <option value="Dealer">Dealer</option>
              <option value="Distributor">Distributor</option>
            </select>
          </div>
          {/* Products */}
          <div>
            <label className="block text-sm font-medium mb-2">Products</label>
            <select multiple className="w-full border rounded h-32 p-2" onChange={e => setProducts(Array.from(e.target.selectedOptions, o => o.value))}>
              {Array.from(new Set(suppliers.map(s => s.product))).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          {/* Categories */}
          <div>
            <label className="block text-sm font-medium mb-2">Categories</label>
            <select multiple className="w-full border rounded h-32 p-2" onChange={e => setCategories(Array.from(e.target.selectedOptions, o => o.value))}>
              {Array.from(new Set(suppliers.map(s => s.category))).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="border-l-4 border-blue-500 rounded-lg shadow-md bg-white p-6 flex justify-between items-center">
            <div><h3 className="text-sm font-medium text-gray-600">DEALERS</h3><p className="text-3xl font-bold text-blue-600">{dealerCount}</p></div>
            <Users size={32} className="text-blue-500" />
          </div>
          <div className="border-l-4 border-green-500 rounded-lg shadow-md bg-white p-6 flex justify-between items-center">
            <div><h3 className="text-sm font-medium text-gray-600">DISTRIBUTORS</h3><p className="text-3xl font-bold text-green-600">{distributorCount}</p></div>
            <Truck size={32} className="text-green-500" />
          </div>
        </div>

        <h2 className="text-lg font-semibold mb-4 border-l-4 border-blue-500 pl-3">Supplier Results</h2>
        <div className="overflow-x-auto max-h-[500px] border rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-50 sticky top-0">
              <tr>
                {['Type', 'Name', 'State', 'Cluster', 'District', 'Manufacture', 'Product', 'Category', 'Action'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSuppliers.map(supplier => (
                <tr key={supplier._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">{supplier.type}</td>
                  <td className="px-6 py-4 text-sm font-medium">{supplier.name}</td>
                  <td className="px-6 py-4 text-sm">{supplier.state?.name || '-'}</td>
                  <td className="px-6 py-4 text-sm">{supplier.cluster?.name || '-'}</td>
                  <td className="px-6 py-4 text-sm">{supplier.district?.name || '-'}</td>
                  <td className="px-6 py-4 text-sm">{supplier.manufacturer?.companyName || '-'}</td>
                  <td className="px-6 py-4 text-sm">{supplier.product}</td>
                  <td className="px-6 py-4 text-sm">{supplier.category}</td>
                  <td className="px-6 py-4 text-sm flex gap-2">
                    <button onClick={() => handleEdit(supplier)} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(supplier._id)} className="text-red-600 hover:bg-red-50 p-1 rounded"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editId ? 'Edit Supplier' : 'Add Supplier'}</h2>
              <button onClick={() => setShowModal(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleModalSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium">Type*</label>
                  <select className="w-full border p-2 rounded" value={modalForm.type} onChange={e => setModalForm({ ...modalForm, type: e.target.value })}>
                    <option value="Dealer">Dealer</option>
                    <option value="Distributor">Distributor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Name*</label>
                  <input type="text" className="w-full border p-2 rounded" value={modalForm.name} onChange={e => setModalForm({ ...modalForm, name: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm font-medium">Manufacturer*</label>
                  <select className="w-full border p-2 rounded" value={modalForm.manufacturer} onChange={e => setModalForm({ ...modalForm, manufacturer: e.target.value })} required>
                    <option value="">Select Manufacturer</option>
                    {manufacturers.map(m => <option key={m._id} value={m._id}>{m.companyName}</option>)}
                  </select>
                </div>
              </div>

              {/* Location */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
                <div>
                  <label className="block text-sm font-medium">State*</label>
                  <select className="w-full border p-2 rounded" value={modalForm.state} onChange={handleModalStateChange} required>
                    <option value="">Select State</option>
                    {allStates.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">City*</label>
                  <select className="w-full border p-2 rounded" value={modalForm.cluster} onChange={handleModalCityChange} required disabled={!modalForm.state}>
                    <option value="">Select City</option>
                    {modalCities.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">District*</label>
                  <select className="w-full border p-2 rounded" value={modalForm.district} onChange={e => setModalForm({ ...modalForm, district: e.target.value })} required disabled={!modalForm.cluster}>
                    <option value="">Select District</option>
                    {modalDistricts.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
                <div><label className="block text-sm font-medium">Product</label><input className="w-full border p-2 rounded" value={modalForm.product} onChange={e => setModalForm({ ...modalForm, product: e.target.value })} /></div>
                <div><label className="block text-sm font-medium">Category</label><input className="w-full border p-2 rounded" value={modalForm.category} onChange={e => setModalForm({ ...modalForm, category: e.target.value })} /></div>
                <div><label className="block text-sm font-medium">Sub Category</label><input className="w-full border p-2 rounded" value={modalForm.subCategory} onChange={e => setModalForm({ ...modalForm, subCategory: e.target.value })} /></div>
                <div><label className="block text-sm font-medium">Project Type</label><input className="w-full border p-2 rounded" value={modalForm.projectType} onChange={e => setModalForm({ ...modalForm, projectType: e.target.value })} /></div>
                <div><label className="block text-sm font-medium">Sub Project Type</label><input className="w-full border p-2 rounded" value={modalForm.subProjectType} onChange={e => setModalForm({ ...modalForm, subProjectType: e.target.value })} /></div>
                <div><label className="block text-sm font-medium">Procurement Type</label><input className="w-full border p-2 rounded" value={modalForm.procurementType} onChange={e => setModalForm({ ...modalForm, procurementType: e.target.value })} /></div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandSupplierOverview;