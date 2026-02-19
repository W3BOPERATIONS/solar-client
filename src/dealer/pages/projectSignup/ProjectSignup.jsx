import React, { useState, useEffect } from 'react';
import {
    Search,
    User,
    Phone,
    FileText,
    MapPin,
    CheckCircle,
    X,
    ChevronRight,
    ChevronLeft,
    Award,
    Home,
    CreditCard,
    Upload,
    Eye,
    Edit,
    Map,
    Share2,
    AlertCircle,
    Lock,
    Unlock,
    Calendar,
    Loader
} from 'lucide-react';
import { locationAPI, leadAPI, projectAPI } from '../../../api/api';

const DealerProjectSignup = () => {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLead, setSelectedLead] = useState(null);
    const [activeTab, setActiveTab] = useState('personal');

    // Form states
    const [aadharNumber, setAadharNumber] = useState('');
    const [lightBillNumber, setLightBillNumber] = useState('');
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [locationAddress, setLocationAddress] = useState('');

    // Agreement checkbox
    const [agreeTerms, setAgreeTerms] = useState(false);


    // Fetch leads
    const fetchLeads = async () => {
        setLoading(true);
        try {
            const params = {
                search: searchTerm,
                status: 'QuoteGenerated' // Signup shows leads that have quote generated
            };
            const response = await leadAPI.getAllLeads(params);
            if (response.data && response.data.data) {
                setLeads(response.data.data);
                if (response.data.data.length > 0 && !selectedLead) {
                    setSelectedLead(response.data.data[0]);
                }
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
    }, [searchTerm]);

    useEffect(() => {
        if (selectedLead) {
            setWhatsappNumber(selectedLead.whatsapp || selectedLead.mobile || '');
            setLocationAddress(`${selectedLead.district?.name || ''}, ${selectedLead.city?.name || ''}`);
        }
    }, [selectedLead]);


    // Handle Aadhar verification
    const handleVerifyAadhar = () => {
        if (aadharNumber.length === 12) {
            alert('Aadhar verification initiated for: ' + aadharNumber);
        } else {
            alert('Please enter a valid 12-digit Aadhar number');
        }
    };

    // Handle Light Bill verification
    const handleVerifyLightBill = () => {
        if (lightBillNumber.length > 5) {
            alert('Light bill verification initiated for: ' + lightBillNumber);
        } else {
            alert('Please enter a valid light bill number');
        }
    };

    const handleSignupComplete = async () => {
        if (!selectedLead) return;
        if (!agreeTerms) {
            alert("Please agree to the terms and conditions.");
            return;
        }

        try {
            // First update lead details if needed (aadhar, etc) - or send them to signProject if needed
            // The current backend signProject doesn't take body params for aadhar/lightbill, 
            // but we should probably save them to Lead first or create Project with them.
            // Let's update Lead first then Sign Project.

            await leadAPI.updateLead(selectedLead._id, {
                aadharNumber,
                lightBillNumber,
                // status: 'ProjectSigned' // Let signProject handle the status change
            });

            // Call Sign Project API
            await projectAPI.signProject(selectedLead._id);

            alert("Project Signed Up Successfully! Project Created.");
            setSelectedLead(null);
            fetchLeads(); // Refresh
        } catch (error) {
            console.error("Error signing up project:", error);
            alert("Failed to sign up project. " + (error.response?.data?.message || error.message));
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col h-screen overflow-hidden">
            {/* Header */}
            <div className="bg-white shadow-sm p-4 z-10">
                <nav className="container-fluid">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                            <h3 className="text-xl font-semibold text-gray-800">Project Signup</h3>
                        </div>
                    </div>
                </nav>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* LEFT SIDE - List */}
                <div className="w-full md:w-1/4 bg-white border-r flex flex-col z-0">
                    <div className="p-4 border-b">
                        <div className="relative">
                            <input
                                type="text"
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="flex justify-center items-center py-10">
                                <Loader className="animate-spin text-blue-500" size={24} />
                            </div>
                        ) : leads.length === 0 ? (
                            <div className="text-center text-gray-500 py-10 px-4">
                                <p>No projects pending signup.</p>
                                <p className="text-xs mt-1">Generate quotes first.</p>
                            </div>
                        ) : (
                            leads.map((lead) => (
                                <div
                                    key={lead._id}
                                    onClick={() => setSelectedLead(lead)}
                                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${selectedLead && selectedLead._id === lead._id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''}`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-semibold text-gray-800">{lead.name}</h4>
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                            {lead.kw} KW
                                        </span>
                                    </div>
                                    <div className="flex items-center text-xs text-gray-500 mb-1">
                                        <Phone size={12} className="mr-1" /> {lead.mobile}
                                    </div>
                                    <div className="flex items-center text-xs text-gray-500">
                                        <MapPin size={12} className="mr-1" /> {lead.city?.name || lead.district?.name}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* RIGHT SIDE - Details */}
                <div className="w-full md:w-3/4 flex flex-col bg-gray-50 overflow-y-auto">
                    {selectedLead ? (
                        <div className="p-6 max-w-5xl mx-auto w-full">
                            {/* Header Card */}
                            <div className="bg-white rounded-xl shadow-sm p-6 mb-6 flex justify-between items-center">
                                <div className="flex items-center">
                                    <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600 mr-4">
                                        {selectedLead.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-800">{selectedLead.name}</h2>
                                        <div className="flex items-center text-gray-500 mt-1">
                                            <span className="mr-4 flex items-center"><Phone size={14} className="mr-1" /> {selectedLead.mobile}</span>
                                            <span className="flex items-center"><MapPin size={14} className="mr-1" /> {selectedLead.district?.name}, {selectedLead.city?.name}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-gray-500">System Size</div>
                                    <div className="text-xl font-bold text-blue-600">{selectedLead.kw} KW</div>
                                    <div className="text-sm text-gray-500 mt-1">{selectedLead.solarType}</div>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
                                <div className="flex border-b">
                                    <button
                                        className={`flex-1 py-4 text-center font-medium text-sm transition-colors ${activeTab === 'personal' ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-50'}`}
                                        onClick={() => setActiveTab('personal')}
                                    >
                                        <User size={18} className="mx-auto mb-1" />
                                        Personal & Documents
                                    </button>
                                    <button
                                        className={`flex-1 py-4 text-center font-medium text-sm transition-colors ${activeTab === 'payment' ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-50'}`}
                                        onClick={() => setActiveTab('payment')}
                                    >
                                        <CreditCard size={18} className="mx-auto mb-1" />
                                        Payment & Finalize
                                    </button>
                                </div>

                                <div className="p-6">
                                    {activeTab === 'personal' && (
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Aadhar Number</label>
                                                    <div className="flex">
                                                        <input
                                                            type="text"
                                                            value={aadharNumber}
                                                            onChange={(e) => setAadharNumber(e.target.value)}
                                                            className="flex-1 border rounded-l-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            placeholder="12 digit Aadhar No"
                                                        />
                                                        <button
                                                            onClick={handleVerifyAadhar}
                                                            className="bg-blue-600 text-white px-4 rounded-r-lg hover:bg-blue-700 font-medium"
                                                        >
                                                            Verify
                                                        </button>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Light Bill Consumer No</label>
                                                    <div className="flex">
                                                        <input
                                                            type="text"
                                                            value={lightBillNumber}
                                                            onChange={(e) => setLightBillNumber(e.target.value)}
                                                            className="flex-1 border rounded-l-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            placeholder="Consumer Number"
                                                        />
                                                        <button
                                                            onClick={handleVerifyLightBill}
                                                            className="bg-blue-600 text-white px-4 rounded-r-lg hover:bg-blue-700 font-medium"
                                                        >
                                                            Verify
                                                        </button>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp Number</label>
                                                    <input
                                                        type="text"
                                                        value={whatsappNumber}
                                                        onChange={(e) => setWhatsappNumber(e.target.value)}
                                                        className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Installation Address</label>
                                                    <input
                                                        type="text"
                                                        value={locationAddress}
                                                        onChange={(e) => setLocationAddress(e.target.value)}
                                                        className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex justify-end mt-6">
                                                <button
                                                    onClick={() => setActiveTab('payment')}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center font-medium"
                                                >
                                                    Next Step <ChevronRight size={18} className="ml-1" />
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'payment' && (
                                        <div className="space-y-6">
                                            <div className="bg-green-50 p-6 rounded-xl border border-green-100 mb-6">
                                                <h4 className="font-bold text-green-800 mb-2 flex items-center">
                                                    <CheckCircle size={20} className="mr-2" />
                                                    Ready for Signup
                                                </h4>
                                                <p className="text-green-700 text-sm">
                                                    Please review all details before proceeding. By clicking confirm, you agree to create this project.
                                                </p>
                                            </div>

                                            <div className="flex items-start mb-6">
                                                <div className="flex items-center h-5">
                                                    <input
                                                        id="terms"
                                                        type="checkbox"
                                                        checked={agreeTerms}
                                                        onChange={(e) => setAgreeTerms(e.target.checked)}
                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                    />
                                                </div>
                                                <div className="ml-3 text-sm">
                                                    <label htmlFor="terms" className="font-medium text-gray-700">
                                                        I agree to the terms and conditions
                                                    </label>
                                                    <p className="text-gray-500">
                                                        By checking this, you confirm that all provided details are correct and verify the consumer identity.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center pt-4 border-t">
                                                <button
                                                    onClick={() => setActiveTab('personal')}
                                                    className="text-gray-600 hover:text-gray-800 px-4 py-2 flex items-center"
                                                >
                                                    <ChevronLeft size={18} className="mr-1" /> Back
                                                </button>
                                                <button
                                                    onClick={handleSignupComplete}
                                                    disabled={!agreeTerms}
                                                    className={`px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all ${agreeTerms ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 transform hover:-translate-y-1' : 'bg-gray-300 cursor-not-allowed'}`}
                                                >
                                                    Complete Signup
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
                            <FileText size={64} className="mb-4 opacity-20" />
                            <h3 className="text-xl font-medium text-gray-500 max-w-md text-center">Select a project from the list to continue signup</h3>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DealerProjectSignup;