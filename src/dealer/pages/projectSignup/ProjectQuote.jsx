import React, { useState, useEffect } from 'react';
import {
    MapPin,
    Box,
    ArrowRight,
    X,
    Wrench,
    Zap,
    Minus,
    Plus,
    ChevronRight,
    Package,
    Award,
    Calendar,
    Home,
    TrendingUp,
    Search,
    Loader,
    Phone
} from 'lucide-react';

import { locationAPI, leadAPI } from '../../../api/api';

const DealerProjectQuote = () => {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedLead, setSelectedLead] = useState(null);
    const [selectedDistrict, setSelectedDistrict] = useState('All');
    const [districts, setDistricts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch districts on mount
    useEffect(() => {
        const fetchDistricts = async () => {
            try {
                const response = await locationAPI.getAllDistricts({ isActive: true });
                if (response.data && response.data.data) {
                    setDistricts(response.data.data);
                }
            } catch (error) {
                console.error("Error fetching districts:", error);
            }
        };
        fetchDistricts();
    }, []);

    // Fetch leads
    const fetchLeads = async () => {
        setLoading(true);
        try {
            const params = {
                search: searchTerm,
                district: selectedDistrict !== 'All' ? selectedDistrict : undefined,
                status: 'SurveyCompleted' // Usually we generate quote after survey
            };
            // For demo purposes, if no leads in SurveyCompleted, maybe show all or New
            // But let's stick to logic. If empty, user sees empty.
            // Or we can just fetch all and filter client side if API doesn't support complex OR queries easily yet
            const response = await leadAPI.getAllLeads(params);
            if (response.data && response.data.data) {
                setLeads(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching leads:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchLeads();
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, selectedDistrict]);


    // State for quantity counters in modal
    const [quantities, setQuantities] = useState({
        pipe60x40: 4,
        pipe50x40: 4,
        pipe40x40: 4,
        lAngle: 15,
        americanBolt: 12,
        dcWire: 25,
        acWire: 20
    });

    // State for commission and discount
    const [commission, setCommission] = useState(3000);
    const [discount, setDiscount] = useState(1000);

    // Handle quantity changes
    const increaseQuantity = (key) => {
        setQuantities(prev => ({ ...prev, [key]: prev[key] + 1 }));
    };

    const decreaseQuantity = (key) => {
        setQuantities(prev => ({ ...prev, [key]: Math.max(0, prev[key] - 1) }));
    };

    // Calculate totals - Dummy prices for now
    const pipeTotal = (quantities.pipe60x40 * 1200) + (quantities.pipe50x40 * 1000) + (quantities.pipe40x40 * 800);
    const accessoriesTotal = (quantities.lAngle * 150) + (quantities.americanBolt * 25);
    const wiresTotal = (quantities.dcWire * 45) + (quantities.acWire * 35);
    const subTotal = pipeTotal + accessoriesTotal + wiresTotal;
    const netAmount = subTotal + commission - discount;

    const handleCreateQuote = (lead) => {
        setSelectedLead(lead);
        setShowModal(true);
    };

    const handleSubmitQuote = async () => {
        if (!selectedLead) return;
        try {
            // Here we would typically save the Quote Details to a separate Quote model
            // For now, we update the Lead status to 'QuoteGenerated'
            // and maybe save the quote amount in billAmount or a new field if we added one (we didn't yet)

            await leadAPI.updateLead(selectedLead._id, {
                status: 'QuoteGenerated',
                quote: {
                    totalAmount: subTotal,
                    commission: commission,
                    discount: discount,
                    netAmount: netAmount,
                    systemSize: selectedLead.kw,
                    generatedAt: new Date()
                }
            });

            alert(`Quote generated successfully for ${selectedLead.name}!`);
            setShowModal(false);
            fetchLeads(); // Refresh list
        } catch (error) {
            console.error("Error generating quote:", error);
            alert("Failed to generate quote");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header with Breadcrumb */}
            <div className="mb-6">
                <div className="bg-white shadow-sm p-4">
                    <nav className="container-fluid">
                        <ol className="flex items-center space-x-2">
                            <li className="text-gray-500">
                                <h3 className="text-xl font-semibold text-gray-800">Project Quote</h3>
                            </li>
                        </ol>
                    </nav>
                </div>
            </div>

            <div className="container-fluid px-6">
                {/* Filters */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div className="relative w-full md:w-96">
                        <input
                            type="text"
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Search Customer..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    </div>

                    <div className="flex items-center space-x-4 w-full md:w-auto">
                        <select
                            className="p-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={selectedDistrict}
                            onChange={(e) => setSelectedDistrict(e.target.value)}
                        >
                            <option value="All">All Districts</option>
                            {districts.map(d => (
                                <option key={d._id} value={d._id}>{d.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Lead List */}
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader className="animate-spin text-blue-500" size={40} />
                    </div>
                ) : leads.length === 0 ? (
                    <div className="text-center text-gray-500 py-20 bg-white rounded-xl shadow-sm">
                        <Package size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="text-xl font-medium">No leads pending for quote</p>
                        <p className="text-sm mt-2">Leads with 'SurveyCompleted' status will appear here.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {leads.map((lead) => (
                            <div key={lead._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                                <div className="p-5">
                                    <div className="flex items-center mb-4">
                                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg mr-4">
                                            {lead.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800">{lead.name}</h3>
                                            <div className="flex items-center text-xs text-gray-500 mt-1">
                                                <MapPin size={12} className="mr-1" />
                                                {lead.district?.name}, {lead.city?.name}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 mb-4">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">System Size</span>
                                            <span className="font-semibold text-gray-800">{lead.kw} KW</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Project Type</span>
                                            <span className="font-semibold text-gray-800">{lead.solarType}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Status</span>
                                            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium">
                                                {lead.status.replace(/([A-Z])/g, ' $1').trim()}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleCreateQuote(lead)}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center transition-colors"
                                    >
                                        Create Quote <ArrowRight size={16} className="ml-2" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Quote Modal */}
            {showModal && selectedLead && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold text-gray-800">Generate Quote for {selectedLead.name}</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Left Side - Structure Selection */}
                                <div>
                                    <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                                        <Wrench className="mr-2 text-blue-500" size={20} />
                                        Structure Components
                                    </h3>

                                    <div className="space-y-4">
                                        {/* Pipes */}
                                        <div className="bg-gray-50 p-4 rounded-xl">
                                            <h4 className="text-sm font-semibold text-gray-600 mb-3">GI Pipes</h4>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-700">60x40 mm</span>
                                                    <div className="flex items-center space-x-3">
                                                        <button onClick={() => decreaseQuantity('pipe60x40')} className="p-1 rounded bg-white shadow-sm border"><Minus size={14} /></button>
                                                        <span className="w-6 text-center text-sm font-medium">{quantities.pipe60x40}</span>
                                                        <button onClick={() => increaseQuantity('pipe60x40')} className="p-1 rounded bg-white shadow-sm border"><Plus size={14} /></button>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-700">50x40 mm</span>
                                                    <div className="flex items-center space-x-3">
                                                        <button onClick={() => decreaseQuantity('pipe50x40')} className="p-1 rounded bg-white shadow-sm border"><Minus size={14} /></button>
                                                        <span className="w-6 text-center text-sm font-medium">{quantities.pipe50x40}</span>
                                                        <button onClick={() => increaseQuantity('pipe50x40')} className="p-1 rounded bg-white shadow-sm border"><Plus size={14} /></button>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-700">40x40 mm</span>
                                                    <div className="flex items-center space-x-3">
                                                        <button onClick={() => decreaseQuantity('pipe40x40')} className="p-1 rounded bg-white shadow-sm border"><Minus size={14} /></button>
                                                        <span className="w-6 text-center text-sm font-medium">{quantities.pipe40x40}</span>
                                                        <button onClick={() => increaseQuantity('pipe40x40')} className="p-1 rounded bg-white shadow-sm border"><Plus size={14} /></button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Accessories */}
                                        <div className="bg-gray-50 p-4 rounded-xl">
                                            <h4 className="text-sm font-semibold text-gray-600 mb-3">Accessories</h4>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-700">L Angle</span>
                                                    <div className="flex items-center space-x-3">
                                                        <button onClick={() => decreaseQuantity('lAngle')} className="p-1 rounded bg-white shadow-sm border"><Minus size={14} /></button>
                                                        <span className="w-6 text-center text-sm font-medium">{quantities.lAngle}</span>
                                                        <button onClick={() => increaseQuantity('lAngle')} className="p-1 rounded bg-white shadow-sm border"><Plus size={14} /></button>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-700">American Bolt</span>
                                                    <div className="flex items-center space-x-3">
                                                        <button onClick={() => decreaseQuantity('americanBolt')} className="p-1 rounded bg-white shadow-sm border"><Minus size={14} /></button>
                                                        <span className="w-6 text-center text-sm font-medium">{quantities.americanBolt}</span>
                                                        <button onClick={() => increaseQuantity('americanBolt')} className="p-1 rounded bg-white shadow-sm border"><Plus size={14} /></button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side - Financials */}
                                <div>
                                    <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                                        <TrendingUp className="mr-2 text-green-500" size={20} />
                                        Financial Summary
                                    </h3>

                                    <div className="bg-blue-50 p-6 rounded-xl space-y-4">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-600">Subtotal (Materials)</span>
                                            <span className="font-semibold text-gray-800">₹{subTotal.toLocaleString()}</span>
                                        </div>

                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-600">Commission</span>
                                            <div className="flex items-center">
                                                <span className="mr-2 text-gray-400">₹</span>
                                                <input
                                                    type="number"
                                                    value={commission}
                                                    onChange={(e) => setCommission(parseInt(e.target.value) || 0)}
                                                    className="w-20 p-1 text-right text-sm border rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-600">Discount</span>
                                            <div className="flex items-center">
                                                <span className="mr-2 text-gray-400">- ₹</span>
                                                <input
                                                    type="number"
                                                    value={discount}
                                                    onChange={(e) => setDiscount(parseInt(e.target.value) || 0)}
                                                    className="w-20 p-1 text-right text-sm border rounded bg-white focus:outline-none focus:ring-1 focus:ring-red-500 text-red-600"
                                                />
                                            </div>
                                        </div>

                                        <div className="h-px bg-blue-200 my-4"></div>

                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-gray-800 text-lg">Net Amount</span>
                                            <span className="font-bold text-blue-700 text-2xl">₹{netAmount.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <div className="mt-8">
                                        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex items-start">
                                            <div className="bg-yellow-100 p-2 rounded-full mr-3 text-yellow-600 shrink-0">
                                                <Zap size={16} />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-yellow-800 text-sm">System Recommendation</h4>
                                                <p className="text-xs text-yellow-700 mt-1">
                                                    Based on {selectedLead.kw} KW requirement, we recommend a standard mounting structure with {Math.ceil(parseFloat(selectedLead.kw) * 3)} panels.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleSubmitQuote}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl mt-6 shadow-lg shadow-blue-200 transition-all transform hover:-translate-y-1"
                                    >
                                        Finalize & Send Quote
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DealerProjectQuote;