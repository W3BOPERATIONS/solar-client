import React, { useState, useEffect } from 'react';
import {
    Search,
    User,
    Phone,
    Mail,
    Home,
    Building2,
    FileText,
    Upload,
    CheckCircle,
    XCircle,
    AlertCircle,
    Award,
    Banknote,
    Calendar,
    CreditCard,
    DollarSign,
    Percent,
    Clock,
    Shield,
    Check,
    X,
    Info,
    Image,
    Download,
    Printer,
    Share2,
    Heart,
    Star,
    Zap,
    Sun,
    Battery,
    TrendingUp,
    Briefcase,
    GraduationCap,
    Landmark,
    Wallet,
    PiggyBank,
    ArrowRight,
    ChevronDown,
    ChevronUp,
    Menu,
    Settings
} from 'lucide-react';
import { projectAPI, loanAPI } from '../../../api/api';

const DealerLoan = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [applicationResult, setApplicationResult] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        applicantName: '',
        applicantAadhar: '',
        applicantPan: '',
        employmentType: '',
        downpayment: '',
        loanAmount: '',
        coApplicantName: '',
        coApplicantAadhar: '',
        coApplicantPan: '',
        coApplicantEmployment: '',
        documents: [],
        loanOption: ''
    });

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                setLoading(true);
                const response = await projectAPI.getAll({ status: 'consumer' });
                setProjects(response.data.data || []);
            } catch (error) {
                console.error('Error fetching projects:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, []);

    // Filter projects based on search
    const filteredProjects = projects.filter(project =>
        project.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.projectId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (project.mobile && project.mobile.includes(searchQuery))
    );

    // Wizard steps
    const steps = [
        'Eligibility',
        'Eligibility Check',
        'Additional Documents',
        'Apply',
        'Loan Providers',
        'Get Loan'
    ];

    // Static Loan offers (could be fetched from backend later)
    const loanOffers = [
        {
            id: 'loan1',
            bank: 'Citi Bank',
            plan: '5 Year Bonanza',
            amount: formData.loanAmount || 50000,
            interest: 10.00,
            emi: Math.round(((formData.loanAmount || 50000) * 1.1) / 60),
            recommended: true,
            logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Citibank.svg/512px-Citibank.svg.png'
        },
        {
            id: 'loan2',
            bank: 'EFL Loan',
            plan: '5 Year Loan Plan',
            amount: formData.loanAmount || 50000,
            interest: 9.00,
            emi: Math.round(((formData.loanAmount || 50000) * 1.09) / 60),
            recommended: false,
            logo: 'https://e-shram.gov.in/wp-content/uploads/2022/01/EFL_logo.png'
        }
    ];

    const documentTypes = [
        { id: 'photo', name: 'Customer Photo' },
        { id: 'aadharFront', name: 'Aadhar Card Front' },
        { id: 'aadharBack', name: 'Aadhar Card Back' },
        { id: 'pan', name: 'PAN Card' }
    ];

    const additionalDocuments = [
        { category: 'Project Documents', name: 'Light Bill', id: 'lightBill' },
        { category: 'Project Documents', name: 'Property OR Tax Bill', id: 'propertyTax' },
        { category: 'Loan Documents', name: 'Bank Statement (Min 1 Year)', id: 'bankStatement' },
        { category: 'Loan Documents', name: 'ITR Return (Min 2 Year)', id: 'itr' }
    ];

    const handleSelectProject = async (project) => {
        if (selectedProject?._id !== project._id) {
            setSelectedProject(project);
            setActiveStep(0);
            setApplicationResult(null);
            setLoading(true);

            try {
                // Check if loan application exists for this project
                const response = await loanAPI.getAll({ projectId: project._id });
                if (response.data.success && response.data.data.length > 0) {
                    setApplicationResult(response.data.data[0]);
                    setActiveStep(5); // Show final status step
                } else {
                    setFormData({
                        applicantName: project.projectName,
                        applicantAadhar: '',
                        applicantPan: '',
                        employmentType: '',
                        downpayment: '',
                        loanAmount: project.totalAmount,
                        coApplicantName: '',
                        coApplicantAadhar: '',
                        coApplicantPan: '',
                        coApplicantEmployment: '',
                        documents: [],
                        loanOption: ''
                    });
                }
            } catch (error) {
                console.error('Error checking existing loan:', error);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileUpload = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            // Mock file upload - in real app, send to S3/Cloudinary and get URL
            const url = URL.createObjectURL(file);
            setFormData(prev => ({
                ...prev,
                documents: [...prev.documents, { type, url, name: file.name }]
            }));
            alert(`${type} uploaded successfully (Mock)`);
        }
    };

    const handleSubmit = async () => {
        if (!selectedProject) return alert('Please select a project');

        try {
            setSubmitting(true);
            const payload = {
                project: selectedProject._id,
                applicantName: formData.applicantName,
                applicantAadhar: formData.applicantAadhar,
                applicantPan: formData.applicantPan,
                employmentType: formData.employmentType,
                downpayment: Number(formData.downpayment),
                loanAmount: Number(formData.loanAmount),
                coApplicantName: formData.coApplicantName,
                coApplicantAadhar: formData.coApplicantAadhar,
                coApplicantPan: formData.coApplicantPan,
                coApplicantEmployment: formData.coApplicantEmployment,
                documents: formData.documents,
                loanType: 'bank',
                status: 'Pending'
            };

            const response = await loanAPI.create(payload);
            if (response.data.success) {
                setApplicationResult(response.data.data);
                setActiveStep(3); // Go to "Apply" step success screen
            }
        } catch (error) {
            console.error('Error submitting loan:', error);
            alert('Failed to submit application: ' + (error.response?.data?.message || error.message));
        } finally {
            setSubmitting(false);
        }
    };

    const handleLoanOptionSelect = (optionId) => {
        setFormData(prev => ({ ...prev, loanOption: optionId }));
        setActiveStep(5); // Go to "Get Loan" final step
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="mb-4">
                <div className="bg-white shadow-sm p-3">
                    <h3 className="text-xl font-semibold text-gray-800">Dealer Loans</h3>
                </div>
            </div>

            <div className="container-fluid px-4 py-4">
                <div className="flex flex-wrap">
                    {/* Left Side - Project List */}
                    <div className="w-full md:w-1/3 lg:w-1/4 pr-4">
                        <div className="bg-white rounded-lg shadow-sm p-3 mt-4">
                            <h4 className="font-bold text-lg mb-3">Select Customer</h4>
                            <div className="mb-3 relative">
                                <input
                                    type="text"
                                    className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            </div>

                            <div className="space-y-2 max-h-[500px] overflow-y-auto">
                                {loading ? (
                                    <div className="text-center py-4">Loading projects...</div>
                                ) : filteredProjects.length > 0 ? filteredProjects.map((project) => (
                                    <button
                                        key={project._id}
                                        className={`w-full flex items-center p-3 rounded-lg border transition-all ${selectedProject?._id === project._id
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white hover:bg-gray-50 text-gray-800 border-gray-200'
                                            }`}
                                        onClick={() => handleSelectProject(project)}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${selectedProject?._id === project._id ? 'bg-blue-500' : 'bg-gray-100'}`}>
                                            <User size={20} className={selectedProject?._id === project._id ? 'text-white' : 'text-gray-400'} />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <div className="font-bold text-sm truncate">{project.projectName}</div>
                                            <div className={`text-xs ${selectedProject?._id === project._id ? 'text-blue-100' : 'text-gray-500'}`}>
                                                {project.projectId}
                                            </div>
                                        </div>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${selectedProject?._id === project._id ? 'bg-blue-700' : 'bg-gray-200'}`}>
                                            {project.totalKW} KW
                                        </span>
                                    </button>
                                )) : <div className="text-center py-4 text-gray-400 text-sm">No projects found</div>}
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Wizard */}
                    <div className="w-full md:w-2/3 lg:w-3/4">
                        <div className="bg-white rounded-lg shadow-sm border p-5 mt-4">
                            {/* Stepper */}
                            <div className="flex items-center justify-between mb-8 overflow-x-auto pb-4">
                                {steps.map((step, index) => (
                                    <React.Fragment key={index}>
                                        <div className="flex flex-col items-center min-w-[100px]">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${index === activeStep ? 'bg-orange-500 text-white shadow-lg scale-110' :
                                                index < activeStep ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                                                }`}>
                                                {index < activeStep ? <Check size={20} /> : index + 1}
                                            </div>
                                            <span className={`text-xs mt-2 font-medium ${index === activeStep ? 'text-orange-600' : 'text-gray-500'}`}>
                                                {step}
                                            </span>
                                        </div>
                                        {index < steps.length - 1 && <div className="flex-1 h-[2px] bg-gray-200 mx-2 mt-[-20px]"></div>}
                                    </React.Fragment>
                                ))}
                            </div>

                            {!selectedProject ? (
                                <div className="text-center py-20 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Info className="text-blue-500" size={32} />
                                    </div>
                                    <h4 className="text-lg font-bold text-gray-700">Select a Project to Start</h4>
                                    <p className="text-gray-500 max-w-xs mx-auto mt-2">Choose a customer from the left sidebar to begin their loan application process.</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Project Summary Header */}
                                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex flex-wrap justify-between items-center">
                                        <div className="flex items-center">
                                            <div className="bg-blue-600 p-2 rounded-lg mr-4">
                                                <Sun className="text-white" size={24} />
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-blue-900">{selectedProject.projectName}</h5>
                                                <p className="text-sm text-blue-700">{selectedProject.projectId} • {selectedProject.totalKW} KW Solar Solution</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs text-blue-600 uppercase font-bold tracking-wider">Project Value</span>
                                            <h4 className="text-xl font-bold text-blue-900">₹{selectedProject.totalAmount.toLocaleString()}</h4>
                                        </div>
                                    </div>

                                    {/* Step Contents */}
                                    {activeStep === 0 && (
                                        <div className="animate-fadeIn">
                                            <h4 className="text-lg font-bold mb-4 border-b pb-2">Step 1: Borrower Eligibility</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Main Applicant Name</label>
                                                        <input type="text" name="applicantName" value={formData.applicantName} onChange={handleInputChange} className="w-full p-2 border rounded-lg" placeholder="Full Name" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Aadhar Card Number</label>
                                                        <input type="text" name="applicantAadhar" value={formData.applicantAadhar} onChange={handleInputChange} className="w-full p-2 border rounded-lg" placeholder="12 Digit Aadhar" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-semibold text-gray-700 mb-1">PAN Card Number</label>
                                                        <input type="text" name="applicantPan" value={formData.applicantPan} onChange={handleInputChange} className="w-full p-2 border rounded-lg" placeholder="ABCDE1234F" />
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Employment Type</label>
                                                        <select name="employmentType" value={formData.employmentType} onChange={handleInputChange} className="w-full p-2 border rounded-lg">
                                                            <option value="">Select Option</option>
                                                            <option value="Salaried">Salaried</option>
                                                            <option value="Self-Employed">Self-Employed</option>
                                                            <option value="Business">Business</option>
                                                        </select>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Downpayment</label>
                                                            <input type="number" name="downpayment" value={formData.downpayment} onChange={handleInputChange} className="w-full p-2 border rounded-lg" placeholder="₹" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Loan Amount</label>
                                                            <input type="number" name="loanAmount" value={formData.loanAmount} onChange={handleInputChange} className="w-full p-2 border rounded-lg" placeholder="₹" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-6">
                                                <h5 className="font-bold mb-3 text-sm">Mandatory Documents</h5>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                                    {documentTypes.map(doc => (
                                                        <div key={doc.id} className="border rounded-lg p-3 text-center bg-gray-50">
                                                            <p className="text-xs font-bold mb-2 truncate">{doc.name}</p>
                                                            <label className="cursor-pointer block bg-white border border-blue-500 text-blue-600 rounded py-1 px-2 text-[10px] hover:bg-blue-50">
                                                                <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, doc.id)} />
                                                                {formData.documents.find(d => d.type === doc.id) ? 'Change File' : 'Choose File'}
                                                            </label>
                                                            {formData.documents.find(d => d.type === doc.id) && <Check size={12} className="text-green-500 mx-auto mt-1" />}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeStep === 1 && (
                                        <div className="text-center py-10">
                                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                                <Shield className="text-green-600" size={40} />
                                            </div>
                                            <h4 className="text-2xl font-bold text-gray-800">Eligibility Check Passed!</h4>
                                            <p className="text-gray-500 mb-8 max-w-sm mx-auto">Based on the provided details, the applicant is eligible for a solar loan up to ₹{Number(formData.loanAmount).toLocaleString()}.</p>

                                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left max-w-md mx-auto">
                                                <h5 className="font-bold text-yellow-800 mb-2 flex items-center text-sm">
                                                    <AlertCircle size={16} className="mr-2" /> Note:
                                                </h5>
                                                <p className="text-xs text-yellow-700">Approval depends on physical document verification and credit score indexing.</p>
                                            </div>
                                        </div>
                                    )}

                                    {activeStep === 2 && (
                                        <div className="animate-fadeIn">
                                            <h4 className="text-lg font-bold mb-4 border-b pb-2">Step 3: Verification Documents</h4>
                                            <div className="overflow-x-auto border rounded-lg">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-gray-100 border-b">
                                                        <tr>
                                                            <th className="p-3 text-left">Category</th>
                                                            <th className="p-3 text-left">Document Required</th>
                                                            <th className="p-3 text-center">Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y">
                                                        {additionalDocuments.map(doc => (
                                                            <tr key={doc.id}>
                                                                <td className="p-3 text-gray-500 font-medium">{doc.category}</td>
                                                                <td className="p-3 font-semibold">{doc.name}</td>
                                                                <td className="p-3 text-center">
                                                                    <label className="cursor-pointer inline-flex items-center px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-bold transition-colors">
                                                                        <Upload size={14} className="mr-2" />
                                                                        <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, doc.id)} />
                                                                        {formData.documents.find(d => d.type === doc.id) ? 'Uploaded' : 'Upload'}
                                                                    </label>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {activeStep === 3 && applicationResult && (
                                        <div className="text-center py-8">
                                            <div className="w-24 h-24 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl animate-bounce">
                                                <Check size={48} />
                                            </div>
                                            <h3 className="text-2xl font-bold text-blue-900 mb-2">Application Submitted!</h3>
                                            <p className="text-gray-500 mb-8 font-medium">Your initial loan request has been successfully registered.</p>

                                            <div className="bg-white border-2 border-blue-600 rounded-2xl p-6 shadow-lg max-w-sm mx-auto mb-8">
                                                <span className="text-xs text-blue-500 uppercase font-black tracking-widest">Application ID</span>
                                                <h2 className="text-3xl font-black text-blue-900 mt-1">{applicationResult.applicationNumber}</h2>
                                            </div>

                                            <div className="text-gray-600 text-sm space-y-1">
                                                <p>Proceed to select your preferred loan provider from our partners.</p>
                                            </div>
                                        </div>
                                    )}

                                    {activeStep === 4 && (
                                        <div className="animate-fadeIn">
                                            <h4 className="text-lg font-bold mb-4 border-b pb-2">Step 5: Select Loan Provider</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {loanOffers.map(offer => (
                                                    <div key={offer.id} className={`border-2 rounded-xl p-6 transition-all cursor-pointer hover:shadow-md ${formData.loanOption === offer.id ? 'border-blue-600 bg-blue-50' : 'border-gray-100 bg-white'}`} onClick={() => handleLoanOptionSelect(offer.id)}>
                                                        <div className="flex justify-between items-start mb-4">
                                                            <img src={offer.logo} alt={offer.bank} className="h-8 object-contain" onError={(e) => { e.target.src = 'https://via.placeholder.com/100x40?text=' + offer.bank }} />
                                                            {offer.recommended && <span className="bg-orange-500 text-white text-[10px] px-2 py-1 rounded-full font-bold uppercase">Recommended</span>}
                                                        </div>
                                                        <h5 className="font-bold text-gray-800 text-lg">{offer.bank}</h5>
                                                        <p className="text-sm text-gray-500 mb-4">{offer.plan}</p>
                                                        <div className="flex justify-between text-sm py-2 border-t">
                                                            <span className="text-gray-500">Interest Rate</span>
                                                            <span className="font-bold text-blue-600">{offer.interest}% p.a.</span>
                                                        </div>
                                                        <div className="flex justify-between text-sm py-2 border-t">
                                                            <span className="text-gray-500">Estimated EMI</span>
                                                            <span className="font-bold">₹{offer.emi.toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {activeStep === 5 && (
                                        <div className="text-center py-12">
                                            <div className="w-20 h-20 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                                                <Shield size={40} />
                                            </div>
                                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Loan Applied Successfully</h3>
                                            {applicationResult && (
                                                <div className="bg-blue-50 border border-blue-100 rounded-lg py-2 px-4 mb-4 inline-block">
                                                    <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider block">Application ID</span>
                                                    <span className="text-lg font-black text-blue-900">{applicationResult.applicationNumber}</span>
                                                </div>
                                            )}
                                            <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                                                Your documents and provider selection have been sent to <strong>{loanOffers.find(o => o.id === formData.loanOption)?.bank || applicationResult?.bankName || 'our partners'}</strong> for final verification.
                                            </p>
                                            <div className="bg-gray-50 rounded-xl p-6 max-w-md mx-auto border border-dashed border-gray-300">
                                                <h5 className="font-bold text-gray-800 mb-4">What happens next?</h5>
                                                <ul className="text-sm text-left space-y-3">
                                                    <li className="flex items-start"><Check size={16} className="text-green-500 mr-2 mt-0.5" /> <span>Digital verification of documents (2 hours)</span></li>
                                                    <li className="flex items-start"><Check size={16} className="text-green-500 mr-2 mt-0.5" /> <span>Credit officer call for confirmation (24 hours)</span></li>
                                                    <li className="flex items-start"><Check size={16} className="text-green-500 mr-2 mt-0.5" /> <span>Sanction letter issuance (48 hours)</span></li>
                                                </ul>
                                            </div>
                                        </div>
                                    )}

                                    {/* Navigation Buttons */}
                                    {activeStep < 4 && (
                                        <div className="flex justify-between pt-4 border-t mt-8">
                                            <button
                                                disabled={activeStep === 0 || activeStep === 3}
                                                onClick={() => setActiveStep(prev => prev - 1)}
                                                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-600 font-bold hover:bg-gray-50 disabled:opacity-30 flex items-center"
                                            >
                                                <ChevronDown className="rotate-90 mr-2" size={18} /> Back
                                            </button>

                                            {activeStep === 2 ? (
                                                <button
                                                    onClick={handleSubmit}
                                                    disabled={submitting}
                                                    className="px-8 py-2 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 shadow-md flex items-center"
                                                >
                                                    {submitting ? 'Submitting...' : 'Submit Application'} <ArrowRight className="ml-2" size={18} />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => setActiveStep(prev => prev + 1)}
                                                    className="px-8 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-md flex items-center"
                                                >
                                                    {activeStep === 3 ? 'Explore Providers' : 'Continue'} <ArrowRight className="ml-2" size={18} />
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {activeStep === 5 && (
                                        <div className="text-center pt-8 border-t">
                                            <button
                                                onClick={() => {
                                                    setActiveStep(0);
                                                    setSelectedProject(null);
                                                    setFormData({
                                                        applicantName: '', applicantAadhar: '', applicantPan: '', employmentType: '',
                                                        downpayment: '', loanAmount: '', coApplicantName: '', coApplicantAadhar: '',
                                                        coApplicantPan: '', coApplicantEmployment: '', documents: [], loanOption: ''
                                                    });
                                                }}
                                                className="px-10 py-3 bg-gray-800 text-white rounded-xl font-bold hover:bg-black transition-all"
                                            >
                                                Apply New Loan
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx="true">{`
                .animate-fadeIn {
                    animation: fadeIn 0.4s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default DealerLoan;