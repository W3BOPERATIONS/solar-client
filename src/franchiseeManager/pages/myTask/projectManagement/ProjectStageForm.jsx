import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, FileText, CheckCircle, Loader2 } from 'lucide-react';
import { projectApi } from '../../../../services/project/projectApi';

const ProjectStageForm = () => {
    const { processSlug } = useParams();
    const [searchParams] = useSearchParams();
    const projectId = searchParams.get('id');
    const stageId = searchParams.get('stageId');
    const urlStageName = searchParams.get('stageName');
    const navigate = useNavigate();

    // Fallback if stageName is missing from URL for some reason
    const formatTitle = (slug) => {
        if (!slug) return 'Project Details';
        return slug
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const stageTitle = urlStageName || formatTitle(processSlug);

    const [dynamicForms, setDynamicForms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDynamicFields = async () => {
            try {
                setIsLoading(true);
                // Fetch dynamic journey stages from admin panel
                const stages = await projectApi.getJourneyStages();
                let activeStage = null;
                
                if (stageId) {
                    activeStage = stages.find(s => s._id === stageId);
                } 
                if (!activeStage && stageTitle) {
                    activeStage = stages.find(s => s.name === stageTitle || s.title === stageTitle);
                }

                if (activeStage && activeStage.fields) {
                    setDynamicForms(activeStage.fields);
                } else {
                    setDynamicForms([]);
                }
            } catch (error) {
                console.error("Error fetching dynamic stage forms:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDynamicFields();
    }, [stageId, stageTitle]);

    const renderInputType = (input) => {
        const baseClasses = "w-full px-4 py-2 border border-gray-300 rounded-md bg-white focus:ring-blue-500 focus:border-blue-500";
        switch (input.type) {
            case 'upload':
            case 'File Upload':
                return <input type="file" className={baseClasses} required={input.required} />;
            case 'textarea':
            case 'Textarea':
                return <textarea className={baseClasses} rows="3" required={input.required}></textarea>;
            case 'select':
            case 'Dropdown / Select':
                return (
                    <select className={baseClasses} required={input.required}>
                        <option value="">Select {input.label}</option>
                        {input.options?.map((opt, idx) => (
                            <option key={idx} value={opt}>{opt}</option>
                        ))}
                    </select>
                );
            case 'date':
            case 'Date Picker':
                return <input type="date" className={baseClasses} required={input.required} />;
            default:
                return <input type="text" className={baseClasses} required={input.required} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-blue-600 hover:text-blue-800 mb-6 transition-colors"
                >
                    <ArrowLeft size={16} className="mr-2" />
                    Back to Project List
                </button>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-blue-600 px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center">
                            <FileText className="text-white mr-3" size={24} />
                            <h1 className="text-xl font-bold text-white">{stageTitle} Form</h1>
                        </div>
                        <div className="text-blue-100 text-sm">
                            Project ID: {projectId || 'N/A'}
                        </div>
                    </div>

                    <div className="p-8">
                        <form className="space-y-6">
                            {/* Generic Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-gray-100">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
                                        <option>Pending</option>
                                        <option>In Progress</option>
                                        <option>Completed</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Completion Date</label>
                                    <input type="date" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
                                </div>
                            </div>
                            
                            {/* Dynamic Stage-Specific Fields */}
                            <div className="py-2">
                                <h3 className="text-lg font-medium text-gray-800 mb-4">{stageTitle} Details</h3>
                                
                                {isLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                                        <span className="ml-3 text-gray-500">Loading dynamic forms...</span>
                                    </div>
                                ) : (
                                    <>
                                        {dynamicForms.length > 0 ? (
                                            <div className="space-y-6">
                                                {dynamicForms.map((form, idx) => (
                                                    <div key={idx} className="bg-blue-50 rounded-xl border border-blue-100 overflow-hidden shadow-sm">
                                                        <div className="bg-blue-100 px-6 py-3 border-b border-blue-200">
                                                            <h4 className="text-md font-bold text-[#1e3a8a]">{form.name}</h4>
                                                        </div>
                                                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                                            {form.inputs?.map((input, i) => (
                                                                <div key={i} className={input.type === 'textarea' || input.type === 'Textarea' ? "col-span-2" : ""}>
                                                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                                                        {input.label} {input.required && <span className="text-red-500 ml-1">*</span>}
                                                                    </label>
                                                                    {renderInputType(input)}
                                                                </div>
                                                            ))}
                                                            {(!form.inputs || form.inputs.length === 0) && (
                                                                <div className="col-span-2 text-sm text-gray-500 italic">
                                                                    No fields configured for this form.
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 gap-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
                                                <div className="text-center text-gray-500 py-4">
                                                    No dynamic forms are configured for this stage in the Admin Panel.
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Action Required / Status Update</label>
                                                    <input type="text" placeholder={`Enter action details for ${stageTitle}`} className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white focus:ring-blue-500 focus:border-blue-500" />
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="pt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks / Notes</label>
                                <textarea rows="3" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" placeholder="Enter additional details regarding this stage..."></textarea>
                            </div>

                            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => navigate(-1)} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
                                    Cancel
                                </button>
                                <button type="button" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                                    Save {stageTitle} Details
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectStageForm;
