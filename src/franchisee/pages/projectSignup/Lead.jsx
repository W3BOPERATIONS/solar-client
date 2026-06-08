import React, { useState, useEffect } from 'react';
import {
    Plus,
    X,
    MapPin,
    Mail,
    Phone,
    Wifi,
    Zap,
    Battery,
    Sun,
    Home,
    Building2,
    DollarSign,
    ChevronDown,
    Loader2
} from 'lucide-react';
import { locationAPI, masterAPI, leadAPI } from '../../../api/api';
import { productApi } from '../../../api/productApi';

const FranchiseLeads = () => {
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);

    // Hierarchy Data
    const [countries, setCountries] = useState([]);
    const [states, setStates] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [clusters, setClusters] = useState([]);

    // Selections
    const [activeCountry, setActiveCountry] = useState(null);
    const [activeState, setActiveState] = useState(null);
    const [activeDistrict, setActiveDistrict] = useState(null);
    const [activeCluster, setActiveCluster] = useState(null);

    // Master Data
    const [projectTypes, setProjectTypes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);

    // Leads Data
    const [leads, setLeads] = useState([]);

    // Form Data
    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        whatsapp: '',
        email: '',
        district: '',
        city: '',
        projectType: '',
        projectCategory: '',
        projectSubCategory: '',
        billRange: 0
    });

    // Form Dropdown options
    const [formDistricts, setFormDistricts] = useState([]);
    const [formCities, setFormCities] = useState([]);
    const [allLeads, setAllLeads] = useState([]); // Store all leads for counting

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // Fetch All Leads for counting
                const leadsRes = await leadAPI.getAllLeads({});
                if (leadsRes.data?.data) {
                    setAllLeads(leadsRes.data.data);
                }

                // Fetch Countries
                const countryRes = await locationAPI.getAllCountries({ isActive: true });
                if (countryRes.data?.data) {
                    setCountries(countryRes.data.data);
                }

                // Fetch All Districts for the Form Modal
                const distRes = await locationAPI.getAllDistricts({ isActive: true });
                if (distRes.data?.data) {
                    setFormDistricts(distRes.data.data);
                }

                // Fetch Project Masters
                const [mapRes, catRes, subCatRes] = await Promise.all([
                    productApi.getProjectCategoryMappings({ status: true }),
                    masterAPI.getAllCategories(),
                    masterAPI.getAllSubCategories()
                ]);
                
                if (mapRes.data?.data) {
                    const mappings = mapRes.data.data;
                    const uniqueTypes = new Set();
                    const formattedTypes = [];
                    mappings.forEach(m => {
                        const typeStr = `${m.projectTypeFrom} to ${m.projectTypeTo} kW`;
                        if (!uniqueTypes.has(typeStr)) {
                            uniqueTypes.add(typeStr);
                            formattedTypes.push({ _id: typeStr, name: typeStr });
                        }
                    });
                    setProjectTypes(formattedTypes);
                }
                if (catRes.data?.data) setCategories(catRes.data.data);
                if (subCatRes.data?.data) setSubCategories(subCatRes.data.data);
            } catch (error) {
                console.error("Error fetching initial data:", error);
            }
        };
        fetchInitialData();
    }, []);

    // Fetch States when Country is selected
    useEffect(() => {
        if (activeCountry) {
            const params = activeCountry._id === 'ALL' ? { isActive: true } : { countryId: activeCountry._id, isActive: true };
            locationAPI.getAllStates(params)
                .then(res => setStates(res.data?.data || []))
                .catch(err => console.error(err));
            setActiveState(null);
            setActiveDistrict(null);
            setActiveCluster(null);
            setDistricts([]);
            setClusters([]);
            setLeads([]);
        }
    }, [activeCountry]);

    // Fetch Districts when State is selected
    useEffect(() => {
        if (activeState) {
            const params = activeState._id === 'ALL' ? { isActive: true } : { stateId: activeState._id, isActive: true };
            locationAPI.getAllDistricts(params)
                .then(res => setDistricts(res.data?.data || []))
                .catch(err => console.error(err));
            setActiveDistrict(null);
            setActiveCluster(null);
            setClusters([]);
            setLeads([]);
        }
    }, [activeState]);

    // Fetch Clusters when District is selected
    useEffect(() => {
        if (activeDistrict) {
            const params = activeDistrict._id === 'ALL' ? { isActive: true } : { districtId: activeDistrict._id, isActive: true };
            locationAPI.getAllClusters(params)
                .then(res => setClusters(res.data?.data || []))
                .catch(err => console.error(err));
            setActiveCluster(null);
            setLeads([]);
            
            // Fetch leads when district is selected, passing district filter only if not ALL
            const leadFilters = {};
            if (activeDistrict._id !== 'ALL') {
                leadFilters.district = activeDistrict._id;
            } else if (activeState && activeState._id !== 'ALL') {
                leadFilters.state = activeState._id; // optional if backend supports it
            }
            fetchLeads(leadFilters);
        }
    }, [activeDistrict]);

    // Fetch Leads when Cluster is selected
    useEffect(() => {
        if (activeCluster) {
            const leadFilters = {};
            if (activeCluster._id !== 'ALL') {
                leadFilters.cluster = activeCluster._id;
            } else if (activeDistrict && activeDistrict._id !== 'ALL') {
                leadFilters.district = activeDistrict._id;
            }
            fetchLeads(leadFilters);
        }
    }, [activeCluster]);

    const fetchLeads = async (filters = {}) => {
        try {
            setLoading(true);
            const res = await leadAPI.getAllLeads(filters);
            if (res.data?.data) {
                setLeads(res.data.data);
            }
        } catch (error) {
            console.error("Error fetching leads:", error);
            setLeads([]);
        } finally {
            setLoading(false);
        }
    };

    // Update cities (clusters) in Modal when form district changes
    useEffect(() => {
        const fetchCitiesForForm = async () => {
            if (formData.district) {
                const districtObj = formDistricts.find(d => d._id === formData.district);
                if (districtObj) {
                    try {
                        const response = await locationAPI.getAllClusters({ districtId: districtObj._id, isActive: true });
                        if (response.data && response.data.data) {
                            setFormCities(response.data.data);
                        } else {
                            setFormCities([]);
                        }
                    } catch (error) {
                        console.error("Error fetching clusters:", error);
                        setFormCities([]);
                    }
                }
            } else {
                setFormCities([]);
            }
        };
        fetchCitiesForForm();
    }, [formData.district, formDistricts]);

    const handleInputChange = (e) => {
        const { id, value, type } = e.target;
        setFormData({
            ...formData,
            [id]: type === 'range' ? parseInt(value) : value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.district) {
            alert('Please select a district');
            return;
        }

        try {
            setLoading(true);
            // Create new lead in backend
            await leadAPI.createLead({
                name: formData.name,
                mobile: formData.mobile,
                whatsapp: formData.whatsapp,
                email: formData.email,
                district: formData.district,
                cluster: formData.city,
                solarType: formData.projectCategory || 'N/A',
                subType: formData.projectSubCategory || 'N/A',
                kw: formData.projectType || 'N/A',
                billAmount: formData.billRange,
                date: new Date().toISOString()
            });

            // Reset form
            setFormData({
                name: '', mobile: '', whatsapp: '', email: '', district: '', city: '',
                projectType: '', projectCategory: '', projectSubCategory: '', billRange: 0
            });
            setShowModal(false);

            // Refresh leads based on current selection
            if (activeCluster && activeCluster._id !== 'ALL') {
                fetchLeads({ cluster: activeCluster._id });
            } else if (activeDistrict && activeDistrict._id !== 'ALL') {
                fetchLeads({ district: activeDistrict._id });
            } else {
                fetchLeads({});
            }

            // Refresh all leads for live counting
            const leadsRes = await leadAPI.getAllLeads({});
            if (leadsRes.data?.data) {
                setAllLeads(leadsRes.data.data);
            }
        } catch (error) {
            console.error("Error creating lead:", error);
            alert("Failed to create lead. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency', currency: 'INR', maximumFractionDigits: 0
        }).format(value);
    };

    const getLeadCount = (item, level) => {
        if (!allLeads || allLeads.length === 0) return 0;
        
        // Do not show count for "All" cards
        if (item._id === 'ALL') {
            return null;
        }

        if (level === 'Cluster') {
            return allLeads.filter(l => (l.cluster?._id || l.cluster || l.city?._id || l.city) === item._id).length;
        }
        if (level === 'District') {
            return allLeads.filter(l => (l.district?._id || l.district) === item._id).length;
        }
        if (level === 'State') {
            const stateDistrictIds = formDistricts.filter(d => (d.state?._id || d.state) === item._id).map(d => d._id);
            return allLeads.filter(l => stateDistrictIds.includes(l.district?._id || l.district)).length;
        }
        if (level === 'Country') {
            const countryDistrictIds = formDistricts.filter(d => (d.country?._id || d.country) === item._id).map(d => d._id);
            return allLeads.filter(l => countryDistrictIds.includes(l.district?._id || l.district)).length;
        }
        return 0;
    };

    const renderCard = (item, activeItem, onClick, label) => {
        const count = getLeadCount(item, label);
        return (
            <button
                key={item._id}
                onClick={() => onClick(item)}
                className={`min-w-[160px] h-20 flex flex-col justify-center items-center border rounded-lg transition-all duration-200 ${
                    activeItem?._id === item._id
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                        : 'bg-white border-blue-200 text-gray-700 hover:border-blue-400'
                }`}
            >
                <div className="flex items-center gap-2">
                    <span className="font-bold text-sm tracking-wide text-center">{item.name}</span>
                    {count !== null && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                            activeItem?._id === item._id ? 'bg-white text-blue-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                            {count}
                        </span>
                    )}
                </div>
                {label && <span className="text-xs mt-1 opacity-80">{label}</span>}
            </button>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-4">
                {/* Breadcrumb */}
                <div className="mb-4">
                    <nav className="bg-white rounded-lg shadow-sm p-4">
                        <ol className="flex items-center">
                            <li className="flex-1">
                                <h3 className="text-xl font-bold text-gray-900">CP Leads</h3>
                            </li>
                        </ol>
                    </nav>
                </div>

                {/* Card-based Location Drilldown */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Select Location</h4>
                    
                    {/* Countries */}
                    {countries.length > 0 && (
                        <div className="mb-4">
                            <p className="text-xs text-gray-500 font-semibold mb-2 uppercase">Country</p>
                            <div className="flex gap-4 overflow-x-auto pb-2">
                                {renderCard({ _id: 'ALL', name: 'All Countries' }, activeCountry, setActiveCountry, 'Country')}
                                {countries.map(c => renderCard(c, activeCountry, setActiveCountry, 'Country'))}
                            </div>
                        </div>
                    )}

                    {/* States */}
                    {activeCountry && states.length > 0 && (
                        <div className="mb-4">
                            <p className="text-xs text-gray-500 font-semibold mb-2 uppercase">State</p>
                            <div className="flex gap-4 overflow-x-auto pb-2">
                                {renderCard({ _id: 'ALL', name: 'All States' }, activeState, setActiveState, 'State')}
                                {states.map(s => renderCard(s, activeState, setActiveState, 'State'))}
                            </div>
                        </div>
                    )}

                    {/* Districts */}
                    {activeState && districts.length > 0 && (
                        <div className="mb-4">
                            <p className="text-xs text-gray-500 font-semibold mb-2 uppercase">District</p>
                            <div className="flex gap-4 overflow-x-auto pb-2">
                                {renderCard({ _id: 'ALL', name: 'All Districts' }, activeDistrict, setActiveDistrict, 'District')}
                                {districts.map(d => renderCard(d, activeDistrict, setActiveDistrict, 'District'))}
                            </div>
                        </div>
                    )}

                    {/* Clusters */}
                    {activeDistrict && clusters.length > 0 && (
                        <div>
                            <p className="text-xs text-gray-500 font-semibold mb-2 uppercase">Cluster</p>
                            <div className="flex gap-4 overflow-x-auto pb-2">
                                {renderCard({ _id: 'ALL', name: 'All Clusters' }, activeCluster, setActiveCluster, 'Cluster')}
                                {clusters.map(c => renderCard(c, activeCluster, setActiveCluster, 'Cluster'))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Leads Table Section */}
                <div id="leadsTableContainer" className="mt-6">
                    {activeDistrict ? (
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="p-4 bg-blue-50 border-b flex justify-between items-center">
                                <h4 className="text-lg font-semibold text-blue-600">
                                    {activeCluster && activeCluster._id !== 'ALL' 
                                        ? `${activeCluster.name} Leads` 
                                        : activeDistrict._id !== 'ALL'
                                            ? `${activeDistrict.name} Leads`
                                            : 'All Leads'}
                                </h4>
                                {loading && <Loader2 className="animate-spin text-blue-500" />}
                            </div>

                            {leads.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Type</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {leads.map((lead, index) => (
                                                <tr key={lead._id || index} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{lead.name}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lead.mobile}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lead.email}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lead.cluster?.name || lead.city?.name || 'N/A'}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lead.kw || lead.projectType || 'N/A'}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : (lead.date || '-')}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="p-8 text-center">
                                    <p className="text-gray-500">
                                        No leads found for this location.
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-md p-8 text-center">
                            <MapPin className="mx-auto text-gray-300 mb-3" size={48} />
                            <p className="text-gray-500">Select a district to view leads</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Lead Button */}
            <button
                onClick={() => setShowModal(true)}
                className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
                <Plus size={24} />
            </button>

            {/* Lead Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                            <h4 className="text-xl font-semibold text-gray-800">Create Lead</h4>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6">
                            <form onSubmit={handleSubmit}>
                                {/* Name */}
                                <div className="mb-4">
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" id="name" placeholder="Person or Company Name" value={formData.name} onChange={handleInputChange} required />
                                </div>

                                {/* Mobile and WhatsApp */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                                        <input type="tel" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" id="mobile" placeholder="Mobile" value={formData.mobile} onChange={handleInputChange} required />
                                    </div>
                                    <div>
                                        <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
                                        <input type="tel" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" id="whatsapp" placeholder="WhatsApp No" value={formData.whatsapp} onChange={handleInputChange} />
                                    </div>
                                </div>

                                {/* Email */}
                                <div className="mb-4">
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input type="email" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" id="email" placeholder="Email" value={formData.email} onChange={handleInputChange} />
                                </div>

                                {/* District and City */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-1">District</label>
                                        <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" id="district" value={formData.district} onChange={handleInputChange} required>
                                            <option value="">Select District</option>
                                            {formDistricts.map(district => (
                                                <option key={district._id} value={district._id}>{district.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">City/Cluster</label>
                                        <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" id="city" value={formData.city} onChange={handleInputChange} required disabled={!formData.district}>
                                            <option value="">Select City/Cluster</option>
                                            {formCities.map(city => (
                                                <option key={city._id} value={city._id}>{city.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Project Details Dropdowns */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <label htmlFor="projectCategory" className="block text-sm font-medium text-gray-700 mb-1">Project Category</label>
                                        <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" id="projectCategory" value={formData.projectCategory} onChange={handleInputChange}>
                                            <option value="">Select Category</option>
                                            {categories.map(cat => (
                                                <option key={cat._id} value={cat.name || cat._id}>{cat.name || cat.title || cat._id}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="projectSubCategory" className="block text-sm font-medium text-gray-700 mb-1">Project Sub-Category</label>
                                        <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" id="projectSubCategory" value={formData.projectSubCategory} onChange={handleInputChange}>
                                            <option value="">Select Sub-Category</option>
                                            {subCategories.map(subCat => (
                                                <option key={subCat._id} value={subCat.name || subCat._id}>{subCat.name || subCat.title || subCat._id}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="projectType" className="block text-sm font-medium text-gray-700 mb-1">Project Type</label>
                                        <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" id="projectType" value={formData.projectType} onChange={handleInputChange}>
                                            <option value="">Select Project Type</option>
                                            {projectTypes.map(pt => (
                                                <option key={pt._id} value={pt.name || pt._id}>{pt.name || pt.title || pt._id}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Electricity Bill */}
                                <div className="mb-6">
                                    <label htmlFor="bill" className="block text-sm font-medium text-gray-700 mb-2">Select Electricity Bill Payment (Monthly): {formatCurrency(formData.billRange)}</label>
                                    <input type="range" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" id="billRange" min="0" max="50000" step="500" value={formData.billRange} onChange={handleInputChange} />
                                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                                        <span>₹0</span>
                                        <span>₹25,000</span>
                                        <span>₹50,000</span>
                                    </div>
                                </div>

                                {/* Submit */}
                                <div className="flex justify-end">
                                    <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2">
                                        {loading && <Loader2 size={16} className="animate-spin" />}
                                        Submit
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FranchiseLeads;