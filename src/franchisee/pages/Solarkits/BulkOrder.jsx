import React, { useState, useEffect } from 'react';
import { getActiveBulkBuyOffers } from '../../../services/bulkBuyOfferApi';
import { masterAPI, projectAPI } from '../../../api/api.js';
import { productApi } from '../../../api/productApi.js';
import {
    Zap,
    Funnel,
    RotateCcw,
    Gift,
    User,
    Users,
    CheckCircle,
    XCircle,
    CreditCard,
    Banknote,
    Truck,
    Receipt,
    Lock,
    ArrowLeft,
    Printer,
    PlusCircle,
    Home,
    Phone,
    Calendar,
    DollarSign,
    Gauge,
    Award,
    Check,
    AlertCircle
} from 'lucide-react';

const FranchiseBulkBuy = () => {
    const [filters, setFilters] = useState({
        category: '',
        subCategory: '',
        subProjectType: '',
        projectType: ''
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomers, setSelectedCustomers] = useState([]);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
    const [currentStep, setCurrentStep] = useState('customerSelection'); // 'customerSelection', 'checkout', 'confirmation'
    const [deliveryInfo, setDeliveryInfo] = useState({
        address: '',
        city: '',
        pincode: '',
        instructions: ''
    });
    const [paymentDetails, setPaymentDetails] = useState({
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        cardholderName: '',
        transactionRef: '',
        receiptFile: null
    });
    const [offers, setOffers] = useState([]);
    const [userSelectedOfferId, setUserSelectedOfferId] = useState(null);

    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [subProjectTypes, setSubProjectTypes] = useState([]);
    const [projectTypes, setProjectTypes] = useState([]);

    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const [cats, subCats, subProjects, mappingsRes] = await Promise.all([
                    masterAPI.getAllCategories(),
                    masterAPI.getAllSubCategories(),
                    masterAPI.getAllSubProjectTypes(),
                    productApi.getProjectCategoryMappings()
                ]);
                setCategories(cats.data?.data || cats.data || []);
                setSubCategories(subCats.data?.data || subCats.data || []);
                setSubProjectTypes(subProjects.data?.data || subProjects.data || []);
                
                // Extract unique project type ranges from mappings
                const mappings = mappingsRes.data?.data || mappingsRes.data || [];
                const uniqueRanges = new Set();
                mappings.forEach(m => {
                    if (m.projectTypeFrom !== undefined && m.projectTypeTo !== undefined) {
                        uniqueRanges.add(`${m.projectTypeFrom} to ${m.projectTypeTo} kW`);
                    }
                });
                const projectTypeStrings = Array.from(uniqueRanges).map(range => ({ _id: range, name: range }));
                setProjectTypes(projectTypeStrings);
            } catch (error) {
                console.error("Error fetching master config:", error);
            }
        };
        fetchFilters();
    }, []);

    useEffect(() => {
        const fetchOffers = async () => {
            try {
                const data = await getActiveBulkBuyOffers();
                // Ensure sorted by minOrders
                data.sort((a, b) => a.minOrders - b.minOrders);
                setOffers(data);
            } catch (err) {
                console.error("Failed to fetch bulk buy offers:", err);
            }
        };
        fetchOffers();
    }, []);

    const [customers, setCustomers] = useState([]);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await projectAPI.getAll();
                const data = res.data?.data || res.data || [];
                const mappedCustomers = data.map((p, index) => ({
                    id: p._id || index,
                    name: p.projectName || p.customerName || `Customer ${index+1}`,
                    phone: p.mobile || p.phone || '+91 0000000000',
                    category: p.category || "Rooftop Solar",
                    subCategory: p.subCategory || "Residential",
                    subType: p.subType || "Ongrid",
                    projectType: p.projectType || "1KW to 5KW",
                    kw: p.capacity || p.kw || parseFloat(p.kw) || 3,
                    price: p.totalAmount || p.price || 150000,
                    leadNo: p.leadId?.leadNumber || p.leadNumber || `led/24-25/${String(index).padStart(3, "0")}`,
                    projectNo: p.projectId || `PRJT/24-25/${String(index + 30).padStart(3, "0")}`,
                    date: p.createdAt ? new Date(p.createdAt).toLocaleString("en-IN") : new Date().toLocaleString("en-IN"),
                    creator: p.createdBy?.name || 'Demo user'
                }));
                setCustomers(mappedCustomers);
            } catch (error) {
                console.error("Failed to fetch projects:", error);
            }
        };
        fetchProjects();
    }, []);

    const generateProjectInfo = (id) => {
        // Now mostly handled during mapping, but keep for fallback
        return {
            lead: `led/24-25/${String(id).substring(0, 3)}`,
            project: `PRJT/24-25/${String(id).substring(0, 3)}`,
            date: new Date().toLocaleString("en-IN")
        };
    };

    const handleFilterChange = (filterName, value) => {
        setFilters(prev => ({ ...prev, [filterName]: value }));
    };

    const applyFilters = () => {
        // Filtering is handled by filteredCustomers
    };

    const resetFilters = () => {
        setFilters({
            category: '',
            subCategory: '',
            subProjectType: '',
            projectType: ''
        });
        setSearchTerm('');
    };

    const filteredCustomers = customers.filter(c => {
        const matchesSearch = searchTerm === '' ||
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.phone.includes(searchTerm);

        const matchesCategory = !filters.category || c.category === filters.category;
        const matchesSubCategory = !filters.subCategory || c.subCategory === filters.subCategory;
        const matchesSubType = !filters.subProjectType || c.subType === filters.subProjectType;
        const matchesProjectType = !filters.projectType || c.projectType === filters.projectType;

        return matchesSearch && matchesCategory && matchesSubCategory && matchesSubType && matchesProjectType;
    });

    const toggleCustomerSelection = (customer) => {
        const index = selectedCustomers.findIndex(c => c.id === customer.id);
        if (index === -1) {
            setSelectedCustomers([...selectedCustomers, customer]);
        } else {
            setSelectedCustomers(selectedCustomers.filter(c => c.id !== customer.id));
        }
    };

    const removeCustomer = (customerId) => {
        setSelectedCustomers(selectedCustomers.filter(c => c.id !== customerId));
    };

    const getDiscountInfo = (totalOrders, totalKW) => {
        let discountPerKW = 0;
        let info = "No offer selected.";
        let activeOffer = userSelectedOfferId;

        if (!userSelectedOfferId) {
            info = "Please select a Bulk Buy Offer card above.";
            return { discountPerKW, info, activeOffer: null };
        }

        const selectedOffer = offers.find(o => o._id === userSelectedOfferId);
        if (selectedOffer) {
            if (totalOrders >= selectedOffer.minOrders) {
                discountPerKW = selectedOffer.discountValue;
                info = `₹${selectedOffer.discountValue} ${selectedOffer.discountUnit} discount applied`;
            } else {
                info = `Select ${selectedOffer.minOrders - totalOrders} more customer(s) to unlock discount`;
            }
        }

        return { discountPerKW, info, activeOffer };
    };

    const calculateOrderSummary = () => {
        const totalOrders = selectedCustomers.length;
        const totalKW = selectedCustomers.reduce((sum, c) => sum + c.kw, 0);
        const basePrice = selectedCustomers.reduce((sum, c) => sum + c.price, 0);
        const { discountPerKW, info, activeOffer } = getDiscountInfo(totalOrders, totalKW);
        const discountAmount = totalKW * discountPerKW;
        const finalPrice = basePrice - discountAmount;
        const discountPercent = basePrice > 0 ? (discountAmount / basePrice) * 100 : 0;

        return { totalOrders, totalKW, basePrice, discountAmount, finalPrice, discountPercent, info, activeOffer };
    };

    const handleProceedToCheckout = () => {
        if (!userSelectedOfferId) {
            alert("Please select a Bulk Buy Offer card first.");
            return;
        }
        const selectedOffer = offers.find(o => o._id === userSelectedOfferId);
        if (selectedCustomers.length < selectedOffer.minOrders) {
            alert(`You must select at least ${selectedOffer.minOrders} customer(s) for the selected offer.`);
            return;
        }
        setCurrentStep('checkout');
    };

    const handleBackToSelection = () => {
        setCurrentStep('customerSelection');
    };

    const handleConfirmOrder = () => {
        if (!selectedPaymentMethod) {
            alert("Please select a payment method.");
            return;
        }
        setCurrentStep('confirmation');
    };

    const handleNewOrder = () => {
        setSelectedCustomers([]);
        setSelectedPaymentMethod('');
        setCurrentStep('customerSelection');
        setDeliveryInfo({
            address: '',
            city: '',
            pincode: '',
            instructions: ''
        });
        setPaymentDetails({
            cardNumber: '',
            expiryDate: '',
            cvv: '',
            cardholderName: '',
            transactionRef: '',
            receiptFile: null
        });
    };

    const handlePrintReceipt = () => {
        window.print();
    };

    const summary = calculateOrderSummary();

    return (
        <div className="container mx-auto px-4 py-4 max-w-7xl">
            {/* Title */}
            <div className="bg-white rounded-lg shadow-sm mb-3 border-0">
                <div className="p-4">
                    <h3 className="text-2xl font-bold text-blue-600 flex items-center">
                        <Zap size={24} className="mr-2 text-yellow-500 fill-current" />
                        Bulk Buy
                    </h3>
                </div>
            </div>

            {/* Filter Section */}
            <div className="bg-white rounded-lg shadow-sm mb-3 border-0">
                <div className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                        <div>
                            <label className="block mb-1 text-xs font-semibold text-gray-600">Category</label>
                            <select
                                className="w-full px-2 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                value={filters.category}
                                onChange={(e) => handleFilterChange('category', e.target.value)}
                            >
                                <option value="">All Categories</option>
                                {categories.map((c) => (
                                    <option key={c._id} value={c.name}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block mb-1 text-xs font-semibold text-gray-600">Sub Category</label>
                            <select
                                className="w-full px-2 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                value={filters.subCategory}
                                onChange={(e) => handleFilterChange('subCategory', e.target.value)}
                            >
                                <option value="">All Sub Categories</option>
                                {subCategories.map((c) => (
                                    <option key={c._id} value={c.name}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block mb-1 text-xs font-semibold text-gray-600">Sub Project Type</label>
                            <select
                                className="w-full px-2 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                value={filters.subProjectType}
                                onChange={(e) => handleFilterChange('subProjectType', e.target.value)}
                            >
                                <option value="">All Sub Project Types</option>
                                {subProjectTypes.map((c) => (
                                    <option key={c._id} value={c.name}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block mb-1 text-xs font-semibold text-gray-600">Project Type</label>
                            <select
                                className="w-full px-2 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                value={filters.projectType}
                                onChange={(e) => handleFilterChange('projectType', e.target.value)}
                            >
                                <option value="">All Project Types</option>
                                {projectTypes.map((c) => (
                                    <option key={c._id} value={c.name}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-2">
                        <button
                            className="px-4 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium flex items-center hover:bg-blue-700 transition-colors"
                            onClick={applyFilters}
                        >
                            <Funnel size={14} className="mr-1" />
                            Apply
                        </button>
                        <button
                            className="px-4 py-1.5 bg-gray-500 text-white rounded-md text-sm font-medium flex items-center hover:bg-gray-600 transition-colors"
                            onClick={resetFilters}
                        >
                            <RotateCcw size={14} className="mr-1" />
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            {/* Bulk Buy Offer Section */}
            <div className="bg-white rounded-lg shadow-sm mb-3 border-0">
                <div className="p-4">
                    <h5 className="font-bold text-blue-600 mb-3 flex items-center">
                        <Gift size={18} className="mr-2" />
                        Bulk Buy Offer
                    </h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {offers.map((offer) => (
                            <div
                                key={offer._id}
                                onClick={() => setUserSelectedOfferId(offer._id)}
                                className={`border rounded-lg p-3 text-center cursor-pointer transition-all duration-300 ${summary.activeOffer === offer._id
                                        ? 'border-2 border-blue-500 bg-blue-50 shadow-md'
                                        : 'bg-gray-50 hover:shadow-md hover:bg-gray-100'
                                    }`}
                            >
                                <h6 className="font-bold text-green-600 mb-1">{offer.title || `Min ${offer.minOrders} Orders`}</h6>
                                <div className="text-sm text-gray-600">
                                    {offer.discountUnit === 'Fixed' ? `₹${offer.discountValue} Flat Discount` : 
                                    offer.discountUnit === '%' ? `${offer.discountValue}% Discount` :
                                    `₹${offer.discountValue} ${offer.discountUnit} Discount`}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Customer Selection Step */}
            {currentStep === 'customerSelection' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Customer List */}
                    <div className="lg:col-span-4">
                        <div className="bg-white rounded-lg shadow-sm p-4">
                            <div className="mb-3">
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Search Customer..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <h5 className="font-bold mb-3 flex items-center">
                                <User size={16} className="mr-2" />
                                Select Customer(s)
                            </h5>

                            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                                {filteredCustomers.length === 0 ? (
                                    <div className="text-gray-500 text-sm text-center py-4">No matching customers found.</div>
                                ) : (
                                    filteredCustomers.map(customer => {
                                        const info = generateProjectInfo(customer.id);
                                        const panels = Math.round(customer.kw * 2);
                                        const isSelected = selectedCustomers.some(c => c.id === customer.id);

                                        return (
                                            <div
                                                key={customer.id}
                                                className={`border rounded-lg cursor-pointer transition-all duration-300 ${isSelected
                                                        ? 'border-2 border-green-500 bg-green-50'
                                                        : 'border-gray-200 hover:shadow-md hover:border-gray-300'
                                                    }`}
                                                onClick={() => toggleCustomerSelection(customer)}
                                            >
                                                <div className="p-3">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex items-center">
                                                            <div className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center mr-2">
                                                                <Home size={18} />
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-blue-600">{customer.name}</div>
                                                                <div className="text-xs text-gray-500">{customer.phone}</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex space-x-1">
                                                            <span className="bg-gray-100 border px-1.5 py-0.5 text-xs font-medium rounded">adani</span>
                                                            <span className="bg-gray-100 border px-1.5 py-0.5 text-xs font-medium rounded">vsole</span>
                                                        </div>
                                                    </div>

                                                    <div className="text-xs mb-2">{panels} Panel ({customer.kw} KW)</div>
                                                    <div className="text-xs text-gray-500">Lead Number: {info.lead}</div>
                                                    <div className="text-xs text-gray-500">Project Number: {info.project}</div>
                                                    <div className="text-xs text-gray-500">Added: {info.date}</div>
                                                    <div className="text-xs text-gray-500 mb-2">Created By: Demo user</div>

                                                    <hr className="my-2" />

                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs font-semibold">Total Quote Amount</span>
                                                        <span className="text-green-600 font-bold">₹{customer.price.toLocaleString()}/-</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Selected Customers */}
                    <div className="lg:col-span-8">
                        <div className="bg-white rounded-lg shadow-sm">
                            <div className="p-4">
                                <h5 className="font-bold mb-3 flex items-center">
                                    <Users size={16} className="mr-2" />
                                    Selected Customers
                                </h5>

                                <div className="min-h-[200px] max-h-[45vh] overflow-y-auto mb-4">
                                    {selectedCustomers.length === 0 ? (
                                        <div className="text-gray-500 text-center py-4">No customers selected yet.</div>
                                    ) : (
                                        selectedCustomers.map(customer => (
                                            <div key={customer.id} className="border rounded-lg p-3 mb-2 bg-white">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <div className="font-bold text-blue-600">{customer.name}</div>
                                                        <div className="text-xs text-gray-500">{customer.phone}</div>
                                                        <div className="text-xs">Project: {customer.projectType} | {customer.kw} KW</div>
                                                    </div>
                                                    <button
                                                        className="text-red-500 hover:text-red-700"
                                                        onClick={() => removeCustomer(customer.id)}
                                                    >
                                                        <XCircle size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Order Summary */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h6 className="font-bold mb-2">Order Summary</h6>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span>Total Orders:</span>
                                                <span className="font-bold">{summary.totalOrders}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span>Total KW:</span>
                                                <span className="font-bold">{summary.totalKW} KW</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span>Base Price:</span>
                                                <span className="font-bold">₹{summary.basePrice.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span>Discount:</span>
                                                <span className="font-bold text-green-600">
                                                    ₹{summary.discountAmount.toLocaleString()}
                                                    {summary.discountPercent > 0 && ` (${summary.discountPercent.toFixed(1)}%)`}
                                                </span>
                                            </div>
                                            <hr />
                                            <div className="flex justify-between font-bold">
                                                <span>Final Price:</span>
                                                <span className="text-blue-600">₹{summary.finalPrice.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h6 className="font-bold mb-2">Discount Applied</h6>
                                        <div className="text-sm text-gray-600">{summary.info}</div>
                                        {summary.discountPercent > 0 && (
                                            <div className="text-green-600 font-bold mt-2">
                                                You saved {summary.discountPercent.toFixed(1)}% on total!
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-end mt-4">
                                    <button
                                        className={`px-4 py-2 text-white rounded-md font-medium flex items-center transition-colors ${
                                            userSelectedOfferId && offers.find(o => o._id === userSelectedOfferId) && selectedCustomers.length >= offers.find(o => o._id === userSelectedOfferId).minOrders
                                                ? 'bg-green-600 hover:bg-green-700'
                                                : 'bg-gray-400 cursor-not-allowed opacity-70'
                                        }`}
                                        onClick={handleProceedToCheckout}
                                        disabled={!(userSelectedOfferId && offers.find(o => o._id === userSelectedOfferId) && selectedCustomers.length >= offers.find(o => o._id === userSelectedOfferId).minOrders)}
                                    >
                                        <CheckCircle size={16} className="mr-2" />
                                        Proceed to Checkout
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Checkout Step */}
            {currentStep === 'checkout' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    <div className="lg:col-span-8">
                        {/* Payment Method */}
                        <div className="bg-white rounded-lg shadow-sm mb-4">
                            <div className="bg-blue-600 text-white px-4 py-3 rounded-t-lg">
                                <h5 className="font-bold flex items-center">
                                    <CreditCard size={18} className="mr-2" />
                                    Payment Method
                                </h5>
                            </div>
                            <div className="p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {/* Online Payment */}
                                    <div
                                        className={`border rounded-lg p-4 text-center cursor-pointer transition-all duration-300 ${selectedPaymentMethod === 'online'
                                                ? 'border-blue-500 bg-blue-50 shadow-md'
                                                : 'hover:shadow-md hover:bg-gray-50'
                                            }`}
                                        onClick={() => setSelectedPaymentMethod('online')}
                                    >
                                        <CreditCard size={40} className="mx-auto text-blue-600" />
                                        <h6 className="mt-2 font-semibold">Online Payment</h6>
                                        <small className="text-gray-500">Pay securely with card, UPI or net banking</small>
                                    </div>

                                    {/* Bank Transfer */}
                                    <div
                                        className={`border rounded-lg p-4 text-center cursor-pointer transition-all duration-300 ${selectedPaymentMethod === 'bank'
                                                ? 'border-blue-500 bg-blue-50 shadow-md'
                                                : 'hover:shadow-md hover:bg-gray-50'
                                            }`}
                                        onClick={() => setSelectedPaymentMethod('bank')}
                                    >
                                        <Banknote size={40} className="mx-auto text-green-600" />
                                        <h6 className="mt-2 font-semibold">Bank Transfer</h6>
                                        <small className="text-gray-500">Transfer amount directly to our bank account</small>
                                    </div>
                                </div>

                                {/* Online Payment Details */}
                                {selectedPaymentMethod === 'online' && (
                                    <div className="mt-4 border-t pt-4">
                                        <h6 className="font-bold mb-3">Online Payment</h6>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-sm mb-1">Card Number</label>
                                                <input
                                                    type="text"
                                                    className="w-full px-3 py-2 border rounded-md text-sm"
                                                    placeholder="1234 5678 9012 3456"
                                                    value={paymentDetails.cardNumber}
                                                    onChange={(e) => setPaymentDetails({ ...paymentDetails, cardNumber: e.target.value })}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-sm mb-1">Expiry Date</label>
                                                    <input
                                                        type="text"
                                                        className="w-full px-3 py-2 border rounded-md text-sm"
                                                        placeholder="MM/YY"
                                                        value={paymentDetails.expiryDate}
                                                        onChange={(e) => setPaymentDetails({ ...paymentDetails, expiryDate: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm mb-1">CVV</label>
                                                    <input
                                                        type="text"
                                                        className="w-full px-3 py-2 border rounded-md text-sm"
                                                        placeholder="123"
                                                        value={paymentDetails.cvv}
                                                        onChange={(e) => setPaymentDetails({ ...paymentDetails, cvv: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm mb-1">Cardholder Name</label>
                                                <input
                                                    type="text"
                                                    className="w-full px-3 py-2 border rounded-md text-sm"
                                                    placeholder="John Doe"
                                                    value={paymentDetails.cardholderName}
                                                    onChange={(e) => setPaymentDetails({ ...paymentDetails, cardholderName: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Bank Transfer Details */}
                                {selectedPaymentMethod === 'bank' && (
                                    <div className="mt-4 border-t pt-4">
                                        <h6 className="font-bold mb-3">Bank Transfer Details</h6>
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm mb-3">
                                            <strong>Account Name:</strong> SolarKit Solutions Pvt Ltd<br />
                                            <strong>Account Number:</strong> 123456789012<br />
                                            <strong>IFSC Code:</strong> SBIN0001234<br />
                                            <strong>Bank Name:</strong> State Bank of India<br />
                                            <strong>Branch:</strong> Mumbai Main Branch
                                        </div>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-sm mb-1">Transaction Reference Number</label>
                                                <input
                                                    type="text"
                                                    className="w-full px-3 py-2 border rounded-md text-sm"
                                                    placeholder="Enter transaction reference"
                                                    value={paymentDetails.transactionRef}
                                                    onChange={(e) => setPaymentDetails({ ...paymentDetails, transactionRef: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm mb-1">Upload Payment Receipt</label>
                                                <input
                                                    type="file"
                                                    className="w-full text-sm"
                                                    onChange={(e) => setPaymentDetails({ ...paymentDetails, receiptFile: e.target.files[0] })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Delivery Information */}
                        <div className="bg-white rounded-lg shadow-sm">
                            <div className="bg-cyan-600 text-white px-4 py-3 rounded-t-lg">
                                <h5 className="font-bold flex items-center">
                                    <Truck size={18} className="mr-2" />
                                    Delivery Information
                                </h5>
                            </div>
                            <div className="p-4">
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm mb-1">Delivery Address</label>
                                        <textarea
                                            className="w-full px-3 py-2 border rounded-md text-sm"
                                            rows="3"
                                            placeholder="Enter complete delivery address"
                                            value={deliveryInfo.address}
                                            onChange={(e) => setDeliveryInfo({ ...deliveryInfo, address: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm mb-1">City</label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 border rounded-md text-sm"
                                                placeholder="Enter city"
                                                value={deliveryInfo.city}
                                                onChange={(e) => setDeliveryInfo({ ...deliveryInfo, city: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm mb-1">Pincode</label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 border rounded-md text-sm"
                                                placeholder="Enter pincode"
                                                value={deliveryInfo.pincode}
                                                onChange={(e) => setDeliveryInfo({ ...deliveryInfo, pincode: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm mb-1">Delivery Instructions (Optional)</label>
                                        <textarea
                                            className="w-full px-3 py-2 border rounded-md text-sm"
                                            rows="2"
                                            placeholder="Any special delivery instructions"
                                            value={deliveryInfo.instructions}
                                            onChange={(e) => setDeliveryInfo({ ...deliveryInfo, instructions: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="lg:col-span-4">
                        <div className="bg-white rounded-lg shadow-sm sticky top-5">
                            <div className="bg-green-600 text-white px-4 py-3 rounded-t-lg">
                                <h5 className="font-bold flex items-center">
                                    <Receipt size={18} className="mr-2" />
                                    Order Summary
                                </h5>
                            </div>
                            <div className="p-4">
                                <div className="space-y-2 mb-3">
                                    <div className="flex justify-between text-sm">
                                        <span>Total Orders:</span>
                                        <span className="font-bold">{summary.totalOrders}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Total KW:</span>
                                        <span className="font-bold">{summary.totalKW} KW</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Base Price:</span>
                                        <span className="font-bold">₹{summary.basePrice.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Discount:</span>
                                        <span className="font-bold text-green-600">-₹{summary.discountAmount.toLocaleString()}</span>
                                    </div>
                                </div>
                                <hr />
                                <div className="flex justify-between font-bold mt-3 mb-4">
                                    <span>Total Amount:</span>
                                    <span className="text-blue-600">₹{summary.finalPrice.toLocaleString()}</span>
                                </div>
                                <button
                                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md font-medium flex items-center justify-center hover:bg-blue-700 transition-colors mb-2"
                                    onClick={handleConfirmOrder}
                                >
                                    <Lock size={16} className="mr-2" />
                                    Confirm & Place Order
                                </button>
                                <button
                                    className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md font-medium flex items-center justify-center hover:bg-gray-50 transition-colors"
                                    onClick={handleBackToSelection}
                                >
                                    <ArrowLeft size={16} className="mr-2" />
                                    Back to Selection
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Step */}
            {currentStep === 'confirmation' && (
                <div className="flex justify-center">
                    <div className="w-full max-w-md">
                        <div className="bg-white rounded-lg shadow-sm text-center">
                            <div className="p-8">
                                <div className="mb-4">
                                    <CheckCircle size={80} className="mx-auto text-green-500" />
                                </div>
                                <h3 className="text-2xl text-green-600 font-bold mb-3">Order Placed Successfully!</h3>
                                <p className="text-gray-500 mb-4">Your bulk order has been confirmed and is being processed.</p>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left mb-4">
                                    <h6 className="font-bold mb-2">Order Details:</h6>
                                    <div className="text-sm space-y-1">
                                        <div><strong>Order ID:</strong> BULK-{Date.now()}</div>
                                        <div><strong>Total Orders:</strong> {summary.totalOrders}</div>
                                        <div><strong>Total KW:</strong> {summary.totalKW} KW</div>
                                        <div><strong>Base Price:</strong> ₹{summary.basePrice.toLocaleString()}</div>
                                        <div><strong>Discount Applied:</strong> ₹{summary.discountAmount.toLocaleString()}</div>
                                        <div><strong>Final Amount:</strong> ₹{summary.finalPrice.toLocaleString()}</div>
                                        <div><strong>Payment Method:</strong> {selectedPaymentMethod === 'online' ? 'Online Payment' : 'Bank Transfer'}</div>
                                        <div><strong>Order Date:</strong> {new Date().toLocaleDateString()}</div>
                                    </div>
                                </div>

                                <div className="flex justify-center space-x-3">
                                    <button
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium flex items-center hover:bg-blue-700 transition-colors"
                                        onClick={handlePrintReceipt}
                                    >
                                        <Printer size={16} className="mr-2" />
                                        Print Receipt
                                    </button>
                                    <button
                                        className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md font-medium flex items-center hover:bg-blue-50 transition-colors"
                                        onClick={handleNewOrder}
                                    >
                                        <PlusCircle size={16} className="mr-2" />
                                        Place New Order
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

export default FranchiseBulkBuy;