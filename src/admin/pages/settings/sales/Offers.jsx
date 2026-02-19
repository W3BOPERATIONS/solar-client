import React, { useState, useEffect } from 'react';
import { Gift, Zap, Package, Share2, Copy, Calendar, Award, Trash2, Eye } from 'lucide-react';
import { useLocations } from '../../../../hooks/useLocations';
import salesSettingsService from '../../../../admin/services/salesSettingsService';

const AdminOffers = () => {
  const [activeTab, setActiveTab] = useState('solar');
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Location Hook
  const { states, districts, clusters, fetchDistricts, fetchClusters } = useLocations();

  // Solar Cashback Form State
  const [solarForm, setSolarForm] = useState({
    offerName: '',
    cpType: 'Starter',
    projectType: 'Residential',
    brand: 'Tata',
    kwSelection: '1-3KW',
    cashbackAmount: '',
    targetKw: '',
    validity: '', // Using as EndDate
    state: '',
    district: '',
    cluster: ''
  });

  // Loyalty Program Form State
  const [loyaltyForm, setLoyaltyForm] = useState({
    offerName: '',
    programName: '', // Mapping to offerName in backend
    targetAudience: 'All Customers', // Mapping to cpType or projectType
    minOrderValue: '', // Maybe description or dedicated field if Schema updated, mapping to cashbackAmount for now as generic value
    pointsMultiplier: '1x', // specific field
    validityPeriod: '',
    yearCashbacks: [{ years: 1, cashback: 0 }],
    state: '',
    district: '',
    cluster: ''
  });

  // Limited Stock Form State
  const [stockForm, setStockForm] = useState({
    offerName: '',
    bundlePlan: '',
    currentStock: '',
    product: '',
    deadline: '',
    cashbackValue: '',
    state: '',
    district: '',
    cluster: ''
  });

  useEffect(() => {
    fetchOffers();
  }, [activeTab]); // Refresh when tab changes or generally on mount

  const fetchOffers = async () => {
    setLoading(true);
    try {
      // Mapping tab to backend offerType enum
      let type = '';
      if (activeTab === 'solar') type = 'Solar Cashback';
      if (activeTab === 'loyalty') type = 'Loyalty Program';
      if (activeTab === 'limited') type = 'Limited Stock';

      const data = await salesSettingsService.getOffers({ type });
      setOffers(data);
    } catch (error) {
      console.error("Error fetching offers:", error);
    } finally {
      setLoading(false);
    }
  };

  // Location Handlers (Generic)
  const handleLocationChange = (section, field, value) => {
    if (section === 'solar') {
      setSolarForm(prev => ({ ...prev, [field]: value }));
      if (field === 'state') fetchDistricts({ stateId: value });
      if (field === 'district') fetchClusters({ districtId: value });
    } else if (section === 'loyalty') {
      setLoyaltyForm(prev => ({ ...prev, [field]: value }));
      if (field === 'state') fetchDistricts({ stateId: value });
      if (field === 'district') fetchClusters({ districtId: value });
    } else if (section === 'limited') {
      setStockForm(prev => ({ ...prev, [field]: value }));
      if (field === 'state') fetchDistricts({ stateId: value });
      if (field === 'district') fetchClusters({ districtId: value });
    }
  };

  // Form Submissions
  const handleSolarSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        offerName: solarForm.offerName,
        offerType: 'Solar Cashback',
        cpType: solarForm.cpType,
        projectType: solarForm.projectType,
        brand: solarForm.brand,
        kwSelection: solarForm.kwSelection,
        cashbackAmount: Number(solarForm.cashbackAmount),
        targetKw: Number(solarForm.targetKw),
        endDate: solarForm.validity,
        location: {
          state: solarForm.state, // Ideally pass ID, but schema supports string
          district: solarForm.district,
          cluster: solarForm.cluster
        },
        status: 'Active'
      };
      await salesSettingsService.createOffer(payload);
      alert("Solar Cashback Offer Created!");
      fetchOffers();
      // Reset form if needed
    } catch (error) {
      console.error("Error creating offer:", error);
      alert("Failed to create offer");
    }
  };

  const handleLoyaltySubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        offerName: loyaltyForm.programName,
        offerType: 'Loyalty Program',
        cpType: loyaltyForm.targetAudience, // Approximate mapping
        yearCashbacks: loyaltyForm.yearCashbacks,
        endDate: loyaltyForm.validityPeriod,
        location: {
          state: loyaltyForm.state,
          district: loyaltyForm.district,
          cluster: loyaltyForm.cluster
        },
        status: 'Active'
      };
      await salesSettingsService.createOffer(payload);
      alert("Loyalty Program Created!");
      fetchOffers();
    } catch (error) {
      console.error("Error creating loyalty offer:", error);
      alert("Failed to create offer");
    }
  };

  // Helper for loyalty dynamic rows
  const addLoyaltyYear = () => {
    setLoyaltyForm(prev => ({
      ...prev,
      yearCashbacks: [...prev.yearCashbacks, { years: prev.yearCashbacks.length + 1, cashback: 0 }]
    }));
  };

  const updateLoyaltyYear = (index, value) => {
    const newYears = [...loyaltyForm.yearCashbacks];
    newYears[index].cashback = Number(value);
    setLoyaltyForm(prev => ({ ...prev, yearCashbacks: newYears }));
  };


  const handleStockSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        offerName: stockForm.offerName,
        offerType: 'Limited Stock',
        bundlePlan: stockForm.bundlePlan,
        currentStock: Number(stockForm.currentStock),
        product: stockForm.product,
        deadline: stockForm.deadline,
        cashbackAmount: Number(stockForm.cashbackValue), // Mapping cashbackValue to cashbackAmount
        location: {
          state: stockForm.state,
          district: stockForm.district,
          cluster: stockForm.cluster
        },
        status: 'Active'
      };
      await salesSettingsService.createOffer(payload);
      alert("Limited Stock Offer Created!");
      fetchOffers();
    } catch (error) {
      console.error("Error creating stock offer:", error);
      alert("Failed to create offer");
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Delete this offer?")) {
      try {
        await salesSettingsService.deleteOffer(id);
        fetchOffers();
      } catch (error) {
        console.error("Error deleting offer:", error);
      }
    }
  };


  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Offers & Rewards Settings</h2>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-gray-200 mb-6">
        <button
          className={`pb-2 px-4 transition-colors duration-300 font-medium ${activeTab === 'solar' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500 hover:text-green-600'}`}
          onClick={() => setActiveTab('solar')}
        >
          <div className="flex items-center gap-2">
            <Zap size={18} /> Solar Cashback
          </div>
        </button>
        <button
          className={`pb-2 px-4 transition-colors duration-300 font-medium ${activeTab === 'loyalty' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500 hover:text-purple-600'}`}
          onClick={() => setActiveTab('loyalty')}
        >
          <div className="flex items-center gap-2">
            <Gift size={18} /> Loyalty Program
          </div>
        </button>
        <button
          className={`pb-2 px-4 transition-colors duration-300 font-medium ${activeTab === 'limited' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500 hover:text-red-600'}`}
          onClick={() => setActiveTab('limited')}
        >
          <div className="flex items-center gap-2">
            <Package size={18} /> Limited Stock
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="transition-all duration-300">

        {/* Solar Cashback Tab */}
        {activeTab === 'solar' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Zap className="text-green-500" size={20} /> New Solar Cashback
                </h3>
              </div>

              <form onSubmit={handleSolarSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Offer Name</label>
                  <input type="text" className="w-full border rounded p-2" value={solarForm.offerName} onChange={e => handleLocationChange('solar', 'offerName', e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">CP Type</label>
                    <select className="w-full border rounded p-2" value={solarForm.cpType} onChange={(e) => handleLocationChange('solar', 'cpType', e.target.value)}>
                      <option>Starter</option>
                      <option>Pro</option>
                      <option>Enterprise</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Project Type</label>
                    <select className="w-full border rounded p-2" value={solarForm.projectType} onChange={(e) => handleLocationChange('solar', 'projectType', e.target.value)}>
                      <option>Residential</option>
                      <option>Commercial</option>
                      <option>Industrial</option>
                    </select>
                  </div>
                </div>

                {/* Location Selectors */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">State</label>
                    <select className="w-full border rounded p-2" value={solarForm.state} onChange={e => handleLocationChange('solar', 'state', e.target.value)}>
                      <option value="">Select State</option>
                      {states.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">District</label>
                    <select className="w-full border rounded p-2" value={solarForm.district} onChange={e => handleLocationChange('solar', 'district', e.target.value)}>
                      <option value="">Select District</option>
                      {districts.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cluster</label>
                    <select className="w-full border rounded p-2" value={solarForm.cluster} onChange={e => handleLocationChange('solar', 'cluster', e.target.value)}>
                      <option value="">Select Cluster</option>
                      {clusters.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Brand</label>
                  <input type="text" className="w-full border rounded p-2" value={solarForm.brand} onChange={(e) => handleLocationChange('solar', 'brand', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">KW Selection</label>
                  <select className="w-full border rounded p-2" value={solarForm.kwSelection} onChange={(e) => handleLocationChange('solar', 'kwSelection', e.target.value)}>
                    <option>1-3KW</option>
                    <option>3-10KW</option>
                    <option>10KW+</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Target KW</label>
                    <input type="number" className="w-full border rounded p-2" value={solarForm.targetKw} onChange={(e) => handleLocationChange('solar', 'targetKw', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cashback Amount (₹)</label>
                    <input type="number" className="w-full border rounded p-2" value={solarForm.cashbackAmount} onChange={(e) => handleLocationChange('solar', 'cashbackAmount', e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Validity (Date)</label>
                  <input type="date" className="w-full border rounded p-2" value={solarForm.validity} onChange={(e) => handleLocationChange('solar', 'validity', e.target.value)} />
                </div>
                <button type="submit" className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 flex justify-center items-center gap-2">
                  <Share2 size={16} /> Publish Offer
                </button>
              </form>
            </div>

            {/* Preview/List */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
                <h3 className="font-semibold text-gray-800 mb-4">Active Solar Cashback Offers</h3>
                {loading ? <p>Loading...</p> : (
                  <div className="space-y-4 max-h-[500px] overflow-auto">
                    {offers.map((offer) => (
                      <div key={offer._id} className="bg-green-50 p-4 rounded-lg flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-green-900">{offer.offerName}</h4>
                          <p className="text-sm text-green-700">Type: {offer.cpType}</p>
                          <p className="text-sm text-green-700">Details: {offer.brand} | {offer.kwSelection}</p>
                          <p className="text-sm font-bold mt-1">Get ₹{offer.cashbackAmount} Cashback on {offer.targetKw}KW</p>
                          <p className="text-xs text-green-600 mt-1">Valid until: {new Date(offer.endDate).toLocaleDateString()}</p>
                        </div>
                        <button onClick={() => handleDelete(offer._id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                      </div>
                    ))}
                    {offers.length === 0 && <p className="text-gray-500 text-center">No active offers.</p>}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Loyalty Program Tab */}
        {activeTab === 'loyalty' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Award className="text-purple-500" size={20} /> Create Loyalty Program
              </h3>
              <form onSubmit={handleLoyaltySubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Program Name</label>
                  <input type="text" className="w-full border rounded p-2" value={loyaltyForm.programName} onChange={e => handleLocationChange('loyalty', 'programName', e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Target Audience</label>
                  <select className="w-full border rounded p-2" value={loyaltyForm.targetAudience} onChange={e => handleLocationChange('loyalty', 'targetAudience', e.target.value)}>
                    <option>All Customers</option>
                    <option>High Volume Buyers</option>
                  </select>
                </div>
                {/* Location Selectors */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <select className="w-full border rounded p-2" value={loyaltyForm.state} onChange={e => handleLocationChange('loyalty', 'state', e.target.value)}>
                      <option value="">State</option>
                      {states.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <select className="w-full border rounded p-2" value={loyaltyForm.district} onChange={e => handleLocationChange('loyalty', 'district', e.target.value)}>
                      <option value="">District</option>
                      {districts.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <select className="w-full border rounded p-2" value={loyaltyForm.cluster} onChange={e => handleLocationChange('loyalty', 'cluster', e.target.value)}>
                      <option value="">Cluster</option>
                      {clusters.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="border p-3 rounded bg-purple-50">
                  <label className="block text-sm font-medium text-purple-900 mb-2">Yearly Cashback Structure</label>
                  {loyaltyForm.yearCashbacks.map((item, index) => (
                    <div key={index} className="flex gap-2 mb-2 items-center">
                      <span className="text-sm font-bold w-16">Year {item.years}</span>
                      <input
                        type="number"
                        placeholder="Cashback Amount"
                        className="w-full border rounded p-1"
                        value={item.cashback}
                        onChange={(e) => updateLoyaltyYear(index, e.target.value)}
                      />
                    </div>
                  ))}
                  <button type="button" onClick={addLoyaltyYear} className="text-xs text-purple-600 font-bold hover:underline">+ Add Year</button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Validity Period (Date)</label>
                  <input type="date" className="w-full border rounded p-2" value={loyaltyForm.validityPeriod} onChange={e => handleLocationChange('loyalty', 'validityPeriod', e.target.value)} />
                </div>
                <button type="submit" className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 flex justify-center items-center gap-2">
                  <Share2 size={16} /> Launch Program
                </button>
              </form>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-purple-500">
                <h3 className="font-semibold text-gray-800 mb-4">Active Loyalty Programs</h3>
                {loading ? <p>Loading...</p> : (
                  <div className="space-y-4 max-h-[500px] overflow-auto">
                    {offers.map((offer) => (
                      <div key={offer._id} className="bg-purple-50 p-4 rounded-lg flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-purple-900">{offer.offerName}</h4>
                          <p className="text-sm text-purple-700">Audience: {offer.cpType}</p>
                          <div className="mt-2 text-sm text-purple-800">
                            {offer.yearCashbacks && offer.yearCashbacks.map(y => (
                              <div key={y.years}>Year {y.years}: ₹{y.cashback}</div>
                            ))}
                          </div>
                          <p className="text-xs text-purple-600 mt-1">Valid until: {new Date(offer.endDate).toLocaleDateString()}</p>
                        </div>
                        <button onClick={() => handleDelete(offer._id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Limited Stock Tab */}
        {activeTab === 'limited' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Package className="text-red-500" size={20} /> Create Limited Stock Offer
              </h3>
              <form onSubmit={handleStockSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Offer Name</label>
                  <input type="text" className="w-full border rounded p-2" value={stockForm.offerName} onChange={e => handleLocationChange('limited', 'offerName', e.target.value)} required />
                </div>
                {/* Location Selectors */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <select className="w-full border rounded p-2" value={stockForm.state} onChange={e => handleLocationChange('limited', 'state', e.target.value)}>
                      <option value="">State</option>
                      {states.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <select className="w-full border rounded p-2" value={stockForm.district} onChange={e => handleLocationChange('limited', 'district', e.target.value)}>
                      <option value="">District</option>
                      {districts.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <select className="w-full border rounded p-2" value={stockForm.cluster} onChange={e => handleLocationChange('limited', 'cluster', e.target.value)}>
                      <option value="">Cluster</option>
                      {clusters.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Select Product</label>
                  <select className="w-full border rounded p-2" value={stockForm.product} onChange={e => handleLocationChange('limited', 'product', e.target.value)}>
                    <option>Solar Panel</option>
                    <option>Inverter</option>
                    <option>Battery</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Stock</label>
                  <input type="number" className="w-full border rounded p-2" value={stockForm.currentStock} onChange={e => handleLocationChange('limited', 'currentStock', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bundle Plan</label>
                  <input type="text" className="w-full border rounded p-2" value={stockForm.bundlePlan} onChange={e => handleLocationChange('limited', 'bundlePlan', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cashback Value (₹)</label>
                  <input type="number" className="w-full border rounded p-2" value={stockForm.cashbackValue} onChange={e => handleLocationChange('limited', 'cashbackValue', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Deadline</label>
                  <input type="date" className="w-full border rounded p-2" value={stockForm.deadline} onChange={e => handleLocationChange('limited', 'deadline', e.target.value)} />
                </div>
                <button type="submit" className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 flex justify-center items-center gap-2">
                  <Share2 size={16} /> Create Flash Sale
                </button>
              </form>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-red-500">
                <h3 className="font-semibold text-gray-800 mb-4">Active Limited Stock Offers</h3>
                {loading ? <p>Loading...</p> : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-red-50">
                        <tr>
                          <th className="p-2 text-left text-sm font-semibold text-gray-700">Name</th>
                          <th className="p-2 text-left text-sm font-semibold text-gray-700">Product</th>
                          <th className="p-2 text-left text-sm font-semibold text-gray-700">Stock</th>
                          <th className="p-2 text-left text-sm font-semibold text-gray-700">Cashback</th>
                          <th className="p-2 text-left text-sm font-semibold text-gray-700">Deadline</th>
                          <th className="p-2 text-left text-sm font-semibold text-gray-700">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {offers.map(offer => (
                          <tr key={offer._id} className="hover:bg-gray-50 border-b">
                            <td className="p-2 text-sm">{offer.offerName}</td>
                            <td className="p-2 text-sm">{offer.product}</td>
                            <td className="p-2 text-sm">{offer.currentStock}</td>
                            <td className="p-2 text-sm">₹{offer.cashbackAmount}</td>
                            <td className="p-2 text-sm">{new Date(offer.deadline).toLocaleDateString()}</td>
                            <td className="p-2 text-sm"><button onClick={() => handleDelete(offer._id)} className="text-red-500"><Trash2 size={14} /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOffers;