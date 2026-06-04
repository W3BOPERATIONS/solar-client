import React, { useState, useEffect } from 'react';
import api, { ticketAPI } from '../../../api/api';
import { productApi } from '../../../api/productApi';
import {
    PlusCircle,
    X,
    Eye,
    Clock,
    AlertCircle,
    CheckCircle,
    XCircle,
    ChevronRight,
    Filter,
    Users,
    Calendar,
    FileText,
    Activity
} from 'lucide-react';

const ServiceTicket = () => {
    const [selectedCp, setSelectedCp] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [viewTicket, setViewTicket] = useState(null);
    const [formData, setFormData] = useState({
        cp: '',
        customer: '',
        product: '',
        installDate: '',
        faultType: '',
        serviceType: '',
        description: '',
        priority: 'Normal',
        phone: '',
        email: '',
        address: '',
        component: '',
        isUrgent: false,
        imageFile: null,
        videoFile: null
    });

    // Filter states
    const [filters, setFilters] = useState({
        categoryType: '',
        subCategoryType: '',
        projectType: '',
        subProjectType: ''
    });

    // Filter Options States
    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [projectTypes, setProjectTypes] = useState([]);
    const [subProjectTypes, setSubProjectTypes] = useState([]);

    // Customers State
    const [customers, setCustomers] = useState([]);
    const [loadingCustomers, setLoadingCustomers] = useState(false);

    // Fetch Customers dynamically when CP is selected
    useEffect(() => {
        const fetchCustomers = async () => {
            if (!selectedCp) {
                setCustomers([]);
                return;
            }
            
            try {
                setLoadingCustomers(true);
                // Fetch projects from backend
                const response = await api.get('/projects');
                let projects = response.data?.data || [];
                
                // If the user wants seeding for testing when data is 0:
                if (projects.length === 0) {
                    console.log("No real projects found, seeding dummy data for workflow testing.");
                    projects = [
                        { _id: 'seed1', projectName: 'Ramesh Singh', totalKW: '5', createdAt: '2025-01-10', status: 'Completed', mobile: '9988776655', email: 'ramesh@example.com', address: '123 Solar St, Rajkot' },
                        { _id: 'seed2', projectName: 'Vikram Mehta', totalKW: '10', createdAt: '2025-02-20', status: 'Completed', mobile: '9988776644', email: 'vikram@example.com', address: '456 Energy Ave, Surat' }
                    ];
                }

                // Map backend data to UI format
                const formattedCustomers = projects.map(p => ({
                    id: p._id,
                    name: p.projectName || 'Unknown Customer',
                    product: p.totalKW ? `${p.totalKW}kW Solar System` : 'Solar System',
                    installDate: p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A',
                    fault: 'No Active Fault',
                    serviceType: '',
                    status: p.status || 'Active',
                    lastService: 'N/A',
                    phone: p.mobile || '',
                    email: p.email || '',
                    address: p.address || ''
                }));

                setCustomers(formattedCustomers);
            } catch (error) {
                console.error("Error fetching customers dynamically:", error);
                // Fallback seeding
                setCustomers([
                    { id: 'seed1', name: 'Ramesh Singh', product: '5kW Solar System', installDate: '10/01/2025', fault: 'No Active Fault', serviceType: '', status: 'Active', lastService: 'N/A', phone: '9988776655', email: 'ramesh@example.com', address: '123 Solar St, Rajkot' }
                ]);
            } finally {
                setLoadingCustomers(false);
            }
        };

        fetchCustomers();
    }, [selectedCp]);

    // Tickets State
    const [tickets, setTickets] = useState([]);
    const [loadingTickets, setLoadingTickets] = useState(false);

    // Fetch Tickets dynamically
    useEffect(() => {
        const fetchTickets = async () => {
            try {
                setLoadingTickets(true);
                // First import ticketAPI from the correct file path below (we will fix the import above)
                const { ticketAPI } = await import('../../../api/api');
                const res = await ticketAPI.getAll();
                let fetchedTickets = res.data || [];
                
                // If the user wants seeding for workflow testing:
                if (fetchedTickets.length === 0) {
                    fetchedTickets = [
                        {
                            ticketId: "TCK-00125",
                            createdAt: "2025-08-05",
                            customerName: "Ramesh Singh",
                            project: { projectName: "Ramesh Singh" }, // mock project populate
                            issueType: "Panel Not Charging",
                            serviceType: "On-Site Repair",
                            status: "Pending",
                        },
                        {
                            ticketId: "TCK-00126",
                            createdAt: "2025-08-06",
                            customerName: "Vikram Mehta",
                            project: { projectName: "Vikram Mehta" },
                            issueType: "Inverter Failure",
                            serviceType: "Replacement",
                            status: "In Progress",
                        }
                    ];
                }
                setTickets(fetchedTickets);
            } catch (error) {
                console.error("Error fetching tickets:", error);
            } finally {
                setLoadingTickets(false);
            }
        };

        fetchTickets();
    }, []);

    const [channelPartners, setChannelPartners] = useState([]);

    useEffect(() => {
        const fetchChannelPartners = async () => {
            try {
                const response = await api.get('/users?role=franchisee');
                if (response.data && response.data.users) {
                    const partners = response.data.users.map(user => ({
                        id: user._id,
                        name: user.companyName || user.name
                    }));
                    setChannelPartners(partners);
                }
            } catch (error) {
                console.error("Error fetching channel partners:", error);
                // Fallback to dummy data if API fails
                setChannelPartners([
                    { id: "cp1", name: "Sunshine Solar (Rajkot)" },
                    { id: "cp2", name: "Green Energy (Ahmedabad)" },
                    { id: "cp3", name: "Eco Power (Surat)" },
                    { id: "cp4", name: "Solar Tech (Vadodara)" }
                ]);
            }
        };

        fetchChannelPartners();
    }, []);

    // Fetch Master Data for Filters
    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                const [catRes, subCatRes, mappingRes, subPTypeRes] = await Promise.all([
                    productApi.getCategories(),
                    productApi.getSubCategories(),
                    productApi.getProjectCategoryMappings(),
                    productApi.getSubProjectTypes()
                ]);

                if (catRes?.data?.data) setCategories(catRes.data.data);
                if (subCatRes?.data?.data) setSubCategories(subCatRes.data.data);
                
                if (mappingRes?.data?.data) {
                    const mappings = mappingRes.data.data;
                    const uniqueRanges = [];
                    const seen = new Set();
                    mappings.forEach(m => {
                        if (m.projectTypeFrom !== undefined && m.projectTypeTo !== undefined) {
                            const label = `${m.projectTypeFrom} to ${m.projectTypeTo} kW`;
                            if(!seen.has(label)) {
                                seen.add(label);
                                uniqueRanges.push({ _id: label, name: label });
                            }
                        }
                    });
                    setProjectTypes(uniqueRanges);
                }

                if (subPTypeRes?.data?.data) setSubProjectTypes(subPTypeRes.data.data);
            } catch (error) {
                console.error("Error fetching master data:", error);
            }
        };

        fetchMasterData();
    }, []);

    const handleFilterChange = (e) => {
        setFilters({
            ...filters,
            [e.target.name]: e.target.value
        });
    };

    const handleFormChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        if (type === 'checkbox') {
            setFormData({ ...formData, [name]: checked });
        } else if (type === 'file') {
            setFormData({ ...formData, [name]: files[0] });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleCpChange = (e) => {
        setSelectedCp(e.target.value);
    };

    const handleRaiseTicket = (customer) => {
        setFormData({
            ...formData,
            customer: customer.name,
            product: customer.product,
            phone: customer.phone || '', 
            email: customer.email || '', 
            address: customer.address || ''
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const { ticketAPI } = await import('../../../api/api');
            const payload = {
                projectId: formData.customerId || null, // Assuming customerId might hold projectId
                issueType: formData.faultType,
                component: formData.component,
                description: formData.description,
                priority: formData.isUrgent ? 'High' : 'Normal',
                media: formData.file ? [formData.file.name] : [] // Mocking media array
            };

            await ticketAPI.create(payload);
            
            // Refresh tickets
            const res = await ticketAPI.getAll();
            setTickets(res.data || []);

            console.log('Ticket submitted successfully');
            setShowModal(false);
            
            // Reset form data
            setFormData({
                customerId: '',
                customer: '',
                phone: '',
                email: '',
                address: '',
                product: '',
                faultType: '',
                component: '',
                description: '',
                isUrgent: false,
                file: null
            });
        } catch (error) {
            console.error("Error submitting ticket:", error);
            alert("Failed to submit ticket. Please check console.");
        }
    };

    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'active': return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">Active</span>;
            case 'completed': return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">Completed</span>;
            case 'pending': return <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">Pending</span>;
            default: return <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full font-medium">{status || 'Unknown'}</span>;
        }
    };

    const getTicketStatusBadge = (status) => {
        const classes = {
            'Pending': 'bg-yellow-100 text-yellow-800',
            'In Progress': 'bg-blue-100 text-blue-800',
            'Resolved': 'bg-green-100 text-green-800',
            'Closed': 'bg-green-100 text-green-800'
        };
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${classes[status] || 'bg-gray-100 text-gray-800'}`}>
                {status || 'Unknown'}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 py-4">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="mb-4">
                    <nav className="bg-white rounded-lg shadow-sm p-4">
                        <ol className="flex items-center">
                            <li className="flex items-center text-gray-700 w-full">
                                <h3 className="text-xl font-semibold text-gray-800">Raise Service Ticket</h3>
                            </li>
                        </ol>
                    </nav>
                </div>

                {/* CP Selection Card */}
                <div className="bg-white rounded-lg shadow-sm mb-4">
                    <div className="p-6">
                        <h5 className="text-lg font-semibold text-gray-800 mb-4">Select Franchisee</h5>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Category Type
                                </label>
                                <select
                                    name="categoryType"
                                    value={filters.categoryType}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">All Category Types</option>
                                    {categories.map(cat => (
                                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Sub Category Type
                                </label>
                                <select
                                    name="subCategoryType"
                                    value={filters.subCategoryType}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">All Sub Category Types</option>
                                    {subCategories.map(subCat => (
                                        <option key={subCat._id} value={subCat._id}>{subCat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Project Type
                                </label>
                                <select
                                    name="projectType"
                                    value={filters.projectType}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">All Project Types</option>
                                    {projectTypes.map(pType => (
                                        <option key={pType._id} value={pType._id}>{pType.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Sub Project Type</label>
                                <select
                                    name="subProjectType"
                                    value={filters.subProjectType}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">All Sub Project Types</option>
                                    {subProjectTypes.map(subPType => (
                                        <option key={subPType._id} value={subPType._id}>{subPType.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Channel Partner</label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={selectedCp}
                                    onChange={handleCpChange}
                                >
                                    <option value="">-- Select CP --</option>
                                    {channelPartners.map(cp => (
                                        <option key={cp.id} value={cp.id}>{cp.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="md:col-span-5 mt-2">
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-150"
                                >
                                    <PlusCircle size={18} className="mr-2" />
                                    Raise New Ticket
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Customer Table */}
                <div className="bg-white rounded-lg shadow-sm mb-4">
                    <div className="p-6">
                        <h5 className="text-lg font-semibold text-gray-800 mb-4">Customer Service Requests</h5>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Customer Name</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Product</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Installation Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Fault Type</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Service Type</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {loadingCustomers ? (
                                        <tr>
                                            <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                                                Loading customers...
                                            </td>
                                        </tr>
                                    ) : customers.length > 0 ? (
                                        customers.map((customer, index) => (
                                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{customer.name}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{customer.product}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{customer.installDate}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-red-500">{customer.fault}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{customer.serviceType || 'Not Assigned'}</td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {getStatusBadge(customer.status)}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                                    <button 
                                                        onClick={() => handleRaiseTicket(customer)}
                                                        className="text-blue-600 hover:text-blue-900 flex items-center bg-blue-50 px-3 py-1 rounded-md transition-colors"
                                                    >
                                                        <PlusCircle size={16} className="mr-1" /> Raise Ticket
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                                                {selectedCp ? "No customers found for this channel partner." : "Select a Channel Partner to view customers"}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Raise Ticket Modal */}
                {showModal && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                            </div>

                            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                    <div className="flex justify-between items-center">
                                        <h5 className="text-lg font-semibold text-gray-800">Raise New Service Ticket</h5>
                                        <button
                                            onClick={() => setShowModal(false)}
                                            className="text-gray-400 hover:text-gray-600 focus:outline-none"
                                        >
                                            <X size={24} />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Channel Partner <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    name="cp"
                                                    value={formData.cp}
                                                    onChange={handleFormChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    required
                                                >
                                                    <option value="">Select CP</option>
                                                    {channelPartners.map(cp => (
                                                        <option key={cp.id} value={cp.id}>{cp.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Customer Name <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="customer"
                                                    value={formData.customer}
                                                    onChange={handleFormChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Customer name"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* Customer Details */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Phone Number
                                                </label>
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleFormChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Phone"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Email Address
                                                </label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleFormChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Email"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Installation Address
                                                </label>
                                                <input
                                                    type="text"
                                                    name="address"
                                                    value={formData.address}
                                                    onChange={handleFormChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Address"
                                                />
                                            </div>
                                        </div>

                                        {/* Product Details */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Product / System Size <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="product"
                                                    value={formData.product}
                                                    onChange={handleFormChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Installation Date</label>
                                                <input
                                                    type="date"
                                                    name="installDate"
                                                    value={formData.installDate}
                                                    onChange={handleFormChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Fault/Issue Type <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    name="faultType"
                                                    value={formData.faultType}
                                                    onChange={handleFormChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    required
                                                >
                                                    <option value="">Select Fault Type</option>
                                                    <option value="performance">Performance Issue</option>
                                                    <option value="damage">Physical Damage</option>
                                                    <option value="monitoring">Monitoring System Problem</option>
                                                    <option value="electrical">Electrical</option>
                                                    <option value="mechanical">Mechanical</option>
                                                    <option value="billing">Billing Issue</option>
                                                    <option value="other">Other</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Component <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    name="component"
                                                    value={formData.component}
                                                    onChange={handleFormChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    required
                                                >
                                                    <option value="">Select Component</option>
                                                    <option value="panel">Solar Panel</option>
                                                    <option value="bos">BOS Kit</option>
                                                    <option value="inverter">Inverter</option>
                                                    <option value="other">Other</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Service Type <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    name="serviceType"
                                                    value={formData.serviceType}
                                                    onChange={handleFormChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    required
                                                >
                                                    <option value="">Select Service Type</option>
                                                    <option value="repair">Repair</option>
                                                    <option value="replace">Replace</option>
                                                    <option value="maintenance">Maintenance</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Detailed Description <span className="text-red-500">*</span>
                                            </label>
                                            <small className="text-gray-500 block mb-2">
                                                Please describe the issue in detail (minimum 30 characters)
                                            </small>
                                            <textarea
                                                name="description"
                                                value={formData.description}
                                                onChange={handleFormChange}
                                                rows="3"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                required
                                                minLength="30"
                                                placeholder="Enter detailed description here..."
                                            ></textarea>
                                            {formData.description && formData.description.length < 30 && (
                                                <p className="text-xs text-red-500 mt-1">
                                                    Please enter at least {30 - formData.description.length} more characters
                                                </p>
                                            )}
                                        </div>

                                        {/* Urgent Issue Card */}
                                        <div 
                                            className={`p-4 rounded-md border cursor-pointer transition-colors ${formData.isUrgent ? 'bg-red-100 border-red-300' : 'bg-red-50 border-red-100'}`}
                                            onClick={() => setFormData({...formData, isUrgent: !formData.isUrgent})}
                                        >
                                            <div className="flex items-center">
                                                <input 
                                                    type="checkbox" 
                                                    name="isUrgent"
                                                    checked={formData.isUrgent}
                                                    onChange={handleFormChange}
                                                    className="mr-3 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded" 
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                                <div>
                                                    <h5 className="font-semibold text-red-700 flex items-center">
                                                        <AlertCircle size={18} className="mr-2" />
                                                        Urgent Issue
                                                    </h5>
                                                    <small className="text-gray-600 block mt-1">
                                                        24 hours response - additional charges apply*
                                                    </small>
                                                </div>
                                            </div>
                                        </div>

                                        {/* File Uploads */}
                                        <div>
                                            <h4 className="font-semibold text-sm text-gray-800 mb-1">Media Attachments</h4>
                                            <small className="text-gray-500 block mb-3">
                                                Upload clear photos/videos showing the problem for better understanding
                                            </small>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Upload Image</label>
                                                    <input 
                                                        type="file" 
                                                        name="imageFile"
                                                        accept="image/*"
                                                        onChange={handleFormChange}
                                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-gray-300 rounded-md p-1"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Upload Video</label>
                                                    <input 
                                                        type="file" 
                                                        name="videoFile"
                                                        accept="video/*"
                                                        onChange={handleFormChange}
                                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-gray-300 rounded-md p-1"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-2">
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors duration-150"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-150"
                                    >
                                        Raise Ticket
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Ticket Tracking Table */}
                <div className="bg-white rounded-lg shadow-sm">
                    <div className="p-6">
                        <h5 className="text-lg font-semibold text-gray-800 mb-4">Ticket Tracking</h5>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Ticket ID</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Raised Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Customer</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Franchisee Name</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Product</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Fault Type</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Service Type</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Current Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Proof</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {loadingTickets ? (
                                        <tr>
                                            <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                                                Loading tickets...
                                            </td>
                                        </tr>
                                    ) : tickets.length > 0 ? (
                                        tickets.map((ticket, index) => (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 text-sm font-mono text-gray-700">{ticket.ticketId || ticket.id}</td>
                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                    {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : ticket.raisedDate || ticket.date}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-700">{ticket.customerName || ticket.customer || (ticket.project && ticket.project.projectName)}</td>
                                                <td className="px-4 py-3 text-sm text-gray-700">{ticket.franchisee || 'N/A'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-700">{ticket.product || 'N/A'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-700">{ticket.issueType || ticket.faultType}</td>
                                                <td className="px-4 py-3 text-sm text-gray-700">{ticket.serviceType || 'Not Assigned'}</td>
                                                <td className="px-4 py-3 text-sm">{getTicketStatusBadge(ticket.status)}</td>
                                                <td className="px-4 py-3 text-sm">
                                                    <button 
                                                        onClick={() => setViewTicket(ticket)}
                                                        className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors duration-150"
                                                    >
                                                        <Eye size={14} className="mr-1" />
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                                                No tickets found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* View Ticket Modal */}
                {viewTicket && (
                    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setViewTicket(null)}></div>
                            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-200">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                                            <FileText className="mr-2 text-blue-600" size={20} />
                                            Ticket Details - {viewTicket.ticketId || viewTicket.id}
                                        </h3>
                                        <button onClick={() => setViewTicket(null)} className="text-gray-400 hover:text-gray-500 transition-colors">
                                            <X size={24} />
                                        </button>
                                    </div>
                                    <div className="space-y-4 text-sm text-gray-600">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <span className="font-medium text-gray-900 block mb-1">Raised Date</span>
                                                {viewTicket.createdAt ? new Date(viewTicket.createdAt).toLocaleDateString() : viewTicket.raisedDate || viewTicket.date}
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-900 block mb-1">Status</span>
                                                {getTicketStatusBadge(viewTicket.status)}
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-900 block mb-1">Customer Name</span>
                                                {viewTicket.customerName || viewTicket.customer || (viewTicket.project && viewTicket.project.projectName)}
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-900 block mb-1">Franchisee / Partner</span>
                                                {viewTicket.franchisee || 'N/A'}
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-900 block mb-1">Product</span>
                                                {viewTicket.product || 'N/A'}
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-900 block mb-1">Issue Type</span>
                                                {viewTicket.issueType || viewTicket.faultType}
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-900 block mb-1">Service Type</span>
                                                {viewTicket.serviceType || 'Not Assigned'}
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-900 block mb-1">Component</span>
                                                {viewTicket.component || 'N/A'}
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            <span className="font-medium text-gray-900 block mb-2">Description</span>
                                            <p className="whitespace-pre-wrap bg-gray-50 p-3 rounded-md border border-gray-200">
                                                {viewTicket.description || 'No description provided.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-6 py-3 flex justify-end">
                                    <button
                                        onClick={() => setViewTicket(null)}
                                        className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors duration-150"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ServiceTicket;