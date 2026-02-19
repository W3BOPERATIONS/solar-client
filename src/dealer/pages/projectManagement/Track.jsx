import React, { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    User,
    Phone,
    Mail,
    Calendar,
    MapPin,
    CheckCircle,
    Clock,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    Home,
    Building2,
    Factory,
    Sun,
    Battery,
    Wrench,
    Zap,
    Award,
    FileText,
    ClipboardCheck,
    Truck,
    Settings,
    UserSearch,
    Play
} from 'lucide-react';
import { getAllProjects, updateProject } from '../../../admin/services/projectApi';

const DealerProjectManagTrack = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [expandedSteps, setExpandedSteps] = useState({});
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const response = await getAllProjects();
                if (response.success) {
                    setProjects(response.data);
                }
            } catch (error) {
                console.error('Error fetching projects:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, []);

    // Helper to generate steps based on project category
    const getJourneySteps = (project) => {
        if (!project) return [];

        const isResidential = project.category === 'Residential';
        const currentStep = project.currentStep || 1;
        const projectStatus = project.status || 'In Progress';

        // Define steps for each category
        const residentialSteps = [
            { title: 'Project Signup', icon: 'User', color: '#0d6efd', description: 'Consumer registration and application' },
            { title: 'Feasibility Approval', icon: 'ClipboardCheck', color: '#fd7e14', description: 'Site survey and feasibility report' },
            { title: 'Installation Status', icon: 'Wrench', color: '#6f42c1', description: 'Structure and panel installation' },
            { title: 'Meter Installation', icon: 'Zap', color: '#dc3545', description: 'Net meter installation' },
            { title: 'Subsidy', icon: 'Award', color: '#ffc107', description: 'Subsidy processing' }
        ];

        const commercialSteps = [
            { title: 'Project Signup', icon: 'User', color: '#0d6efd', description: 'Consumer registration and application' },
            { title: 'Feasibility Approval', icon: 'ClipboardCheck', color: '#fd7e14', description: 'Site survey and feasibility report' },
            { title: 'Installation Status', icon: 'Wrench', color: '#6f42c1', description: 'Structure and panel installation' },
            { title: 'Meter Installation', icon: 'Zap', color: '#dc3545', description: 'Net meter installation' }
        ];

        const stepsTemplate = isResidential ? residentialSteps : commercialSteps;
        const totalSteps = stepsTemplate.length;

        return stepsTemplate.map((step, index) => {
            const stepNumber = index + 1;
            let status = 'pending';
            let date = 'Pending';

            if (projectStatus === 'Completed') {
                status = 'completed';
                date = 'Completed';
            } else if (stepNumber < currentStep) {
                status = 'completed';
                date = 'Completed';
            } else if (stepNumber === currentStep) {
                status = 'in-progress';
                date = 'In Progress';
            }

            return {
                ...step,
                status,
                date,
                stepNumber
            };
        });
    };

    const handleStepCompelte = async (project, stepNumber) => {
        if (!project) return;

        try {
            const isResidential = project.category === 'Residential';
            const totalSteps = isResidential ? 5 : 4;

            let updateData = {};

            if (stepNumber >= totalSteps) {
                updateData = { status: 'Completed', currentStep: totalSteps };
            } else {
                updateData = { currentStep: stepNumber + 1 };
            }

            const response = await updateProject(project._id, updateData);

            if (response.success) {
                // Update local state
                const updatedProject = { ...project, ...updateData };
                setProjects(projects.map(p => p._id === project._id ? updatedProject : p));
                setSelectedCustomer(updatedProject);
                // alert('Project progress updated successfully!');
            }
        } catch (error) {
            console.error('Error updating project progress:', error);
            alert('Failed to update project progress.');
        }
    };

    // Filter customers based on search
    const filteredCustomers = projects.filter(customer =>
        (customer.projectName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (customer.projectId?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );

    // Get status color class
    const getStatusColorClass = (status) => {
        switch (status) {
            case 'completed':
            case 'Completed':
                return 'bg-green-500 text-white';
            case 'in-progress':
            case 'In Progress':
            case 'Active':
                return 'bg-blue-500 text-white';
            case 'pending':
            case 'Pending':
                return 'bg-gray-400 text-white';
            default:
                return 'bg-gray-400 text-white';
        }
    };

    // Get status icon
    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed':
            case 'Completed':
                return <CheckCircle size={16} className="text-green-500" />;
            case 'in-progress':
            case 'In Progress':
            case 'Active':
                return <Clock size={16} className="text-blue-500" />;
            default:
                return <AlertCircle size={16} className="text-gray-400" />;
        }
    };

    // Format status text
    const formatStatus = (status) => {
        switch (status) {
            case 'completed': return 'Completed';
            case 'in-progress': return 'In Progress';
            case 'pending': return 'Pending';
            default: return status;
        }
    };

    // Get icon component based on icon name
    const getIconComponent = (iconName, color) => {
        const iconProps = { size: 20, style: { color } };
        switch (iconName) {
            case 'User': return <User {...iconProps} />;
            case 'ClipboardCheck': return <ClipboardCheck {...iconProps} />;
            case 'Truck': return <Truck {...iconProps} />;
            case 'Wrench': return <Wrench {...iconProps} />;
            case 'Zap': return <Zap {...iconProps} />;
            case 'Award': return <Award {...iconProps} />;
            default: return <FileText {...iconProps} />;
        }
    };

    // Toggle step expansion
    const toggleStep = (stepTitle) => {
        setExpandedSteps(prev => ({
            ...prev,
            [stepTitle]: !prev[stepTitle]
        }));
    };

    const journeySteps = selectedCustomer ? getJourneySteps(selectedCustomer) : [];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="mb-4">
                <div className="bg-white shadow-sm p-3">
                    <nav className="container-fluid">
                        <ol className="flex items-center space-x-2">
                            <li className="text-gray-500">
                                <h3 className="text-xl font-semibold text-gray-800">Project Management Track</h3>
                            </li>
                        </ol>
                    </nav>
                </div>
            </div>

            <div className="container-fluid px-0">
                <div className="flex flex-wrap">
                    {/* Left Side - Customer Selection */}
                    <div className="w-full md:w-1/4 lg:w-1/4">
                        <div className="p-3 h-screen bg-white border-r overflow-y-auto">
                            <h4 className="text-lg font-semibold mb-3">Select Customer</h4>

                            {/* Search Bar */}
                            <div className="bg-white rounded-lg shadow-sm mb-3">
                                <div className="p-2">
                                    <div className="flex items-center border rounded-lg">
                                        <span className="px-3 text-gray-400">
                                            <Search size={18} />
                                        </span>
                                        <input
                                            type="text"
                                            className="flex-1 py-2 pr-3 focus:outline-none"
                                            placeholder="Search by name, email or ID..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                        <span className="px-3 text-gray-400">
                                            <Filter size={18} />
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <h6 className="text-sm font-medium mb-2">Customers List</h6>

                            {/* Customers List */}
                            <div className="bg-white rounded-lg shadow-sm">
                                {loading ? (
                                    <div className="text-center py-4">
                                        <p className="text-gray-500">Loading...</p>
                                    </div>
                                ) : filteredCustomers.length === 0 ? (
                                    <div className="text-center py-4">
                                        <p className="text-gray-500">No projects found</p>
                                    </div>
                                ) : (
                                    <div className="divide-y">
                                        {filteredCustomers.map((customer) => (
                                            <div
                                                key={customer._id}
                                                onClick={() => setSelectedCustomer(customer)}
                                                className={`p-3 cursor-pointer transition-all hover:translate-y-[-2px] hover:shadow-md ${selectedCustomer?._id === customer._id
                                                    ? 'border-l-4 border-blue-600 bg-blue-50'
                                                    : ''
                                                    }`}
                                            >
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold mr-3">
                                                        {customer.projectName?.[0]}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h6 className={`text-sm font-semibold ${selectedCustomer?._id === customer._id ? 'text-blue-600' : 'text-gray-800'
                                                            }`}>
                                                            {customer.projectName}
                                                        </h6>
                                                        <p className="text-xs text-gray-600">{customer.category}</p>
                                                        <p className="text-xs text-gray-500">{customer.projectId}</p>
                                                    </div>
                                                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColorClass(customer.status)}`}>
                                                        {customer.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Journey Details */}
                    <div className="w-full md:w-3/4 lg:w-3/4">
                        <div className="p-4">
                            {!selectedCustomer ? (
                                <div className="flex flex-col items-center justify-center h-96">
                                    <UserSearch size={64} className="text-gray-400 mb-3" />
                                    <h4 className="text-gray-500 text-lg">Select a customer to view journey details</h4>
                                </div>
                            ) : (
                                <>
                                    {/* Customer Info Card */}
                                    <div className="bg-white rounded-lg shadow-sm mb-4">
                                        <div className="p-4">
                                            <div className="flex items-center mb-3">
                                                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg mr-3">
                                                    {selectedCustomer.projectName?.[0]}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="text-lg font-semibold text-blue-600">{selectedCustomer.projectName}</h4>
                                                    <p className="text-sm text-gray-600">{selectedCustomer.category} Solar</p>
                                                    <p className="text-xs text-gray-500">System: {selectedCustomer.totalKW || 0} kW</p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColorClass(selectedCustomer.status)}`}>
                                                    {selectedCustomer.status}
                                                </span>
                                            </div>
                                            <hr className="my-3" />
                                            <div className="grid grid-cols-3 text-center gap-4">
                                                <div>
                                                    <Phone size={16} className="mx-auto mb-1 text-blue-600" />
                                                    <p className="text-xs text-gray-600">{selectedCustomer.mobile || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <Mail size={16} className="mx-auto mb-1 text-blue-600" />
                                                    <p className="text-xs text-gray-600">{selectedCustomer.email || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <Calendar size={16} className="mx-auto mb-1 text-blue-600" />
                                                    <p className="text-xs text-gray-600">Reg: {selectedCustomer.createdAt ? new Date(selectedCustomer.createdAt).toLocaleDateString() : 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress Stepper */}
                                    <div className="bg-white rounded-lg shadow-sm mb-4">
                                        <div className="p-4">
                                            <h5 className="font-semibold mb-3">Project Progress</h5>
                                            <div className="overflow-x-auto pb-2">
                                                <div className="flex min-w-max">
                                                    {journeySteps.map((step, index) => (
                                                        <React.Fragment key={step.title}>
                                                            <div className="inline-block w-32 text-center">
                                                                <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center text-white ${step.status === 'completed' ? 'bg-green-500' :
                                                                    step.status === 'in-progress' ? 'bg-blue-500' : 'bg-gray-400'
                                                                    }`}>
                                                                    {step.status === 'completed' ? (
                                                                        <CheckCircle size={16} />
                                                                    ) : step.status === 'in-progress' ? (
                                                                        <Clock size={16} />
                                                                    ) : (
                                                                        <span>{index + 1}</span>
                                                                    )}
                                                                </div>
                                                                <h6 className="text-xs font-bold">{step.title}</h6>
                                                                <span className={`text-xs px-2 py-1 rounded-full ${step.status === 'completed' ? 'bg-green-500 text-white' :
                                                                    step.status === 'in-progress' ? 'bg-blue-500 text-white' : 'bg-gray-400 text-white'
                                                                    }`}>
                                                                    {formatStatus(step.status)}
                                                                </span>
                                                            </div>
                                                            {index < journeySteps.length - 1 && (
                                                                <div className={`h-0.5 flex-1 self-center mx-2 ${step.status === 'completed' ? 'bg-green-500' : 'bg-gray-200'
                                                                    }`}></div>
                                                            )}
                                                        </React.Fragment>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Journey Timeline */}
                                    <div className="bg-white rounded-lg shadow-sm">
                                        <div className="p-4">
                                            <h5 className="font-semibold">Installation Journey Timeline</h5>
                                            <p className="text-sm text-gray-500 mb-3">Track each step of the solar installation process</p>

                                            {journeySteps.map((step) => (
                                                <div key={step.title} className="border rounded-lg mb-3 overflow-hidden">
                                                    {/* Step Header */}
                                                    <div
                                                        className="bg-white p-3 hover:bg-gray-50"
                                                    >
                                                        <div className="flex items-center">
                                                            <div
                                                                className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
                                                                style={{ backgroundColor: `${step.color}20` }}
                                                            >
                                                                {getIconComponent(step.icon, step.color)}
                                                            </div>
                                                            <div className="flex-1">
                                                                <h6 className="font-semibold text-sm">{step.title}</h6>
                                                                <p className="text-xs text-gray-500">{step.description}</p>
                                                            </div>
                                                            <div className="flex items-center">
                                                                <span className={`text-xs px-2 py-1 rounded-full mr-2 ${step.status === 'completed' ? 'bg-green-500 text-white' :
                                                                    step.status === 'in-progress' ? 'bg-blue-500 text-white' : 'bg-gray-400 text-white'
                                                                    }`}>
                                                                    {formatStatus(step.status)}
                                                                </span>

                                                                {/* Manual Completion Button */}
                                                                {step.status === 'in-progress' && (
                                                                    <button
                                                                        onClick={() => handleStepCompelte(selectedCustomer, step.stepNumber)}
                                                                        className="ml-2 flex items-center px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
                                                                    >
                                                                        Mark Completed <CheckCircle size={12} className="ml-1" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DealerProjectManagTrack;
