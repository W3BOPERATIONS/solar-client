import React, { useState, useEffect } from 'react';
import {
    Search,
    User,
    Phone,
    Mail,
    MapPin,
    AlertCircle,
    Image,
    Video,
    Send,
    ChevronDown,
    Home,
    Zap,
    AlertTriangle,
    Clock,
    Camera,
    FileText,
    Settings,
    Sun,
    Battery
} from 'lucide-react';
import api from '../../../api/api'; // Adjust import path if needed

const DealerRaiseTicket = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProject, setSelectedProject] = useState(null);
    const [selectedInstallation, setSelectedInstallation] = useState('');
    const [issueType, setIssueType] = useState('');
    const [component, setComponent] = useState('');
    const [description, setDescription] = useState('');
    const [isUrgent, setIsUrgent] = useState(false);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch projects on mount
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const response = await api.get('/projects');
                // response.data from axios contains the body.
                // projectController returns { success: true, data: [...] }
                const projectsData = response.data.data || [];

                // Filter for Completed projects only as per requirement
                const completedProjects = projectsData.filter(project => project.status === 'Completed');

                setProjects(completedProjects);
            } catch (error) {
                console.error('Error fetching projects:', error);
            }
        };

        fetchProjects();
    }, []);

    // Filter projects based on search
    const filteredProjects = projects.filter(project => {
        const name = project.projectName || '';
        const id = project.projectId || '';
        const phone = project.mobile || '';
        return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            phone.includes(searchQuery);
    });

    // Select a project
    const handleSelectProject = (project) => {
        setSelectedProject(project);
        setSelectedInstallation(''); // Reset installation when project changes
    };

    // Installation options based on selected project
    // For now, assuming project ID or similar is the installation identifier, 
    // or if you have specific installation data inside project, map it here.
    // If no specific installation list, maybe just use the project ID itself as the only option?
    const installationOptions = selectedProject ? [
        { value: selectedProject._id, label: `${selectedProject.projectId}: ${selectedProject.address || 'Project Location'}` }
    ] : [];

    // Issue type options
    const issueTypeOptions = [
        { value: '', label: 'Select Issue Type' },
        { value: 'performance', label: 'Performance Issue' },
        { value: 'damage', label: 'Physical Damage' },
        { value: 'monitoring', label: 'Monitoring System Problem' },
        { value: 'billing', label: 'Billing Issue' },
        { value: 'other', label: 'Other' }
    ];

    // Component options
    const componentOptions = [
        { value: '', label: 'Select Component' },
        { value: 'panel', label: 'Solar Panel' },
        { value: 'bos', label: 'BOS Kit' },
        { value: 'inverter', label: 'Inverter' },
        { value: 'other', label: 'Other' }
    ];

    // Handle form submission
    const handleSubmitTicket = async () => {
        if (!selectedProject) {
            alert('Please select a project');
            return;
        }
        // if (!selectedInstallation) {
        //     alert('Please select an installation');
        //     return;
        // }
        if (!issueType) {
            alert('Please select issue type');
            return;
        }
        if (!component) {
            alert('Please select component');
            return;
        }
        if (description.length < 30) {
            alert('Please provide a detailed description (minimum 30 characters)');
            return;
        }

        try {
            setLoading(true);
            const ticketData = {
                projectId: selectedProject._id,
                issueType,
                component,
                description,
                priority: isUrgent ? 'Urgent' : 'Normal',
                // media: [] // Add media handling if implemented
            };

            await api.post('/tickets', ticketData);
            alert('Support ticket submitted successfully!');

            // Reset form
            setSelectedProject(null);
            setSelectedInstallation('');
            setIssueType('');
            setComponent('');
            setDescription('');
            setIsUrgent(false);

        } catch (error) {
            console.error('Error submitting ticket:', error);
            alert('Failed to submit ticket. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header with Breadcrumb */}
            <div className="mb-4">
                <div className="bg-white shadow-sm p-3">
                    <nav className="container-fluid">
                        <ol className="flex items-center space-x-2">
                            <li className="text-gray-500">
                                <h3 className="text-xl font-semibold text-gray-800">Raise Ticket</h3>
                            </li>
                        </ol>
                    </nav>
                </div>
            </div>

            <div className="container-fluid px-4">
                <div className="flex flex-wrap">
                    {/* Left Side - Project List */}
                    <div className="w-full md:w-1/4 lg:w-1/4 pr-4">
                        <div className="bg-white rounded-lg shadow-sm p-3" style={{ marginTop: '20px' }}>
                            <h3 className="font-bold text-lg mb-2">My Projects</h3>
                            <p className="text-gray-500 text-sm mb-3">Select a project to raise a ticket</p>

                            {/* Search */}
                            <div className="mb-3 relative">
                                <input
                                    type="text"
                                    className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Search projects..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            </div>

                            {/* Project List */}
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {filteredProjects.map((project) => (
                                    <button
                                        key={project._id}
                                        className={`w-full flex items-center p-2 rounded-lg transition-colors ${selectedProject?._id === project._id
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white hover:bg-gray-100 text-gray-800 border'
                                            }`}
                                        onClick={() => handleSelectProject(project)}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                                            <span className="font-bold text-xs text-gray-600">
                                                {project.projectName ? project.projectName.charAt(0).toUpperCase() : 'P'}
                                            </span>
                                        </div>
                                        <div className="flex-1 text-left">
                                            <div className="font-semibold text-sm">{project.projectName}</div>
                                            <small className={selectedProject?._id === project._id ? 'text-blue-200' : 'text-gray-500'}>
                                                Project ID: {project.projectId}
                                            </small>
                                        </div>
                                    </button>
                                ))}
                                {filteredProjects.length === 0 && (
                                    <div className="text-center text-gray-500 py-4">
                                        No projects found
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Ticket Form */}
                    <div className="w-full md:w-3/4 lg:w-3/4">
                        <div className="bg-white rounded-lg shadow-sm mt-5 p-4">
                            {/* Customer Info Card */}
                            {selectedProject ? (
                                <div className="bg-cyan-50 rounded-lg border p-4 mb-4">
                                    <h4 className="text-blue-600 font-semibold text-lg">{selectedProject.projectName}</h4>
                                    <div className="flex items-center text-gray-600 mt-2">
                                        <Phone size={16} className="mr-2" />
                                        <span className="mr-4">{selectedProject.mobile || 'N/A'}</span>
                                        <Mail size={16} className="mr-2" />
                                        <span>{selectedProject.email || 'N/A'}</span>
                                    </div>
                                    <div className="mt-3 inline-block bg-orange-500 text-white px-3 py-1 rounded-lg text-sm">
                                        {selectedProject.totalKW} KW
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-gray-100 rounded-lg border p-4 mb-4 text-center text-gray-500">
                                    <User size={48} className="mx-auto mb-2 text-gray-400" />
                                    <p>Select a project from the left to raise a ticket</p>
                                </div>
                            )}

                            {selectedProject && (
                                <>
                                    {/* Select Installation - Simplified directly to project for now unless multiple installations exist */}
                                    {/* <div className="mb-3">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Solar Installations</label>
                                        <select
                                            className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={selectedInstallation}
                                            onChange={(e) => setSelectedInstallation(e.target.value)}
                                        >
                                            <option value="">Select Installation</option>
                                            {installationOptions.map((opt) => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div> */}

                                    {/* Issue Type and Component */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Issue Type</label>
                                            <select
                                                className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                value={issueType}
                                                onChange={(e) => setIssueType(e.target.value)}
                                            >
                                                {issueTypeOptions.map((opt) => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Component</label>
                                            <select
                                                className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                value={component}
                                                onChange={(e) => setComponent(e.target.value)}
                                            >
                                                {componentOptions.map((opt) => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Detailed Description */}
                                    <div className="mb-3">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Detailed Description</label>
                                        <small className="text-gray-500 block mb-2">Please describe the issue in detail (minimum 30 characters)</small>
                                        <textarea
                                            rows="4"
                                            className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Detailed description of the issue..."
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                        ></textarea>
                                        <div className="text-right text-xs text-gray-500 mt-1">
                                            {description.length} / 30 characters
                                        </div>
                                    </div>

                                    {/* Urgent Issue Card */}
                                    <div
                                        className={`p-3 rounded-lg border mb-4 cursor-pointer transition-colors ${isUrgent
                                            ? 'border-red-600 bg-red-100'
                                            : 'border-red-300 bg-red-50 hover:bg-red-100'
                                            }`}
                                        onClick={() => setIsUrgent(!isUrgent)}
                                    >
                                        <div className="flex items-center">
                                            <AlertTriangle size={20} className="text-red-600 mr-2" />
                                            <div>
                                                <h5 className="font-semibold text-red-700">Urgent Issue</h5>
                                                <small className="text-red-600 font-medium">24 hours response - additional charges apply*</small>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Media Attachments - Placeholder for now */}
                                    <h4 className="font-semibold text-lg mt-4 mb-1">Media Attachments</h4>
                                    <small className="text-gray-500 block mb-2">
                                        Upload clear photos/videos showing the problem for better understanding
                                    </small>

                                    <div className="flex space-x-2 mb-4">
                                        <button className="flex items-center px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50">
                                            <Image size={18} className="mr-2" />
                                            Image
                                        </button>
                                        <button className="flex items-center px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50">
                                            <Video size={18} className="mr-2" />
                                            Video
                                        </button>
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        onClick={handleSubmitTicket}
                                        disabled={loading}
                                        className={`w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg text-xl transition-colors flex items-center justify-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        <Send size={24} className="mr-2" />
                                        {loading ? 'Submitting...' : 'Submit Support Ticket'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DealerRaiseTicket;