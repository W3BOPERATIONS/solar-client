import React, { useState, useEffect } from 'react';
import api from '../../../api/axios'; // Make sure the path is correct
import { toast } from 'react-hot-toast'; // Optional: for error display

export default function FranchiseeManagerOnboardingGoals() {
    const [assignedGoals, setAssignedGoals] = useState([]);
    const [partnerData, setPartnerData] = useState(null);
    const [projectData, setProjectData] = useState(null);
    const [franchisees, setFranchisees] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await api.get('/franchisee/dashboard-stats');
                setAssignedGoals(response.data.assignedGoals || []);
                setPartnerData(response.data.partnerData);
                setProjectData(response.data.projectData);
                setFranchisees(response.data.franchisees || []);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
                // toast.error("Failed to fetch goals data");
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    const renderPartnerCard = () => {
        if (!partnerData) return null;
        return (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8 relative">
                <h3 className="text-lg font-bold text-slate-700 mb-4 border-b pb-2">Partner Onboarding Goals</h3>
                <div className="absolute top-6 right-6 text-right">
                    <p className="text-sm font-medium text-gray-700">App Demo Approval Date: {new Date().toLocaleDateString()}</p>
                    <p className="text-sm font-bold text-red-500 mt-1">Due Date: 90 Days</p>
                </div>

                <div className="mb-6">
                    <h3 className="font-semibold text-indigo-900 mb-1">Assign company leads: {partnerData.assignCompanyLeads}</h3>
                    <p className="font-bold text-indigo-600 mb-2">Franchisee onboarded leads: {partnerData.franchiseeOnboardedLeads}</p>

                    <div className="relative pt-1 mt-4">
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>0</span>
                            <span className="text-red-500 font-bold bg-white px-2 rounded border border-red-200 shadow-sm relative -top-3">{partnerData.franchiseeOnboardedLeads}</span>
                            <span>{partnerData.assignCompanyLeads}</span>
                        </div>
                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                            <div style={{ width: `${Math.min((partnerData.franchiseeOnboardedLeads / partnerData.assignCompanyLeads) * 100, 100)}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-red-400"></div>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="font-semibold text-indigo-900 mb-1">Self leads: {partnerData.selfLeads}</h3>
                    <p className="font-bold text-indigo-600 mb-2">Franchisee onboarder self leads: {partnerData.selfOnboarded}</p>

                    <div className="relative pt-1 mt-4">
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>0</span>
                            <span className="text-blue-500 font-bold bg-white px-2 rounded border border-blue-200 shadow-sm relative -top-3">{partnerData.selfOnboarded}</span>
                            <span>{partnerData.selfLeads}</span>
                        </div>
                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                            <div style={{ width: `${Math.min((partnerData.selfOnboarded / partnerData.selfLeads) * 100, 100)}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-400"></div>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-6 right-6 text-right">
                    <p className="text-sm font-bold text-gray-800">Total Franchisee Target: {partnerData.totalTarget}</p>
                    <p className="text-sm font-bold text-gray-800 mt-1">Conversion in(%): {partnerData.conversionPct}%</p>
                </div>
            </div>
        );
    }

    const renderProjectCard = () => {
        if (!projectData) return null;
        return (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 relative">
                <h3 className="text-lg font-bold text-blue-800 mb-4 border-b border-blue-200 pb-2">Project Completion Goals</h3>
                <div className="absolute top-6 right-6 text-right">
                    <p className="text-sm font-medium text-gray-700">Quarter: Q3 {new Date().getFullYear()}</p>
                    <p className="text-sm font-bold text-orange-500 mt-1">Due Date: 45 Days</p>
                </div>

                <div className="mb-6">
                    <h3 className="font-semibold text-blue-900 mb-1">Total Solar Projects Assigned: {projectData.totalProjectsAssigned}</h3>
                    <p className="font-bold text-blue-600 mb-2">Projects Successfully Completed: {projectData.projectsCompleted}</p>

                    <div className="relative pt-1 mt-4">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>0</span>
                            <span className="text-blue-500 font-bold bg-white px-2 rounded border border-blue-200 shadow-sm relative -top-3">{projectData.projectsCompleted}</span>
                            <span>{projectData.totalProjectsAssigned}</span>
                        </div>
                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                            <div style={{ width: `${projectData.targetAchievementPct}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"></div>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-6 right-6 text-right">
                    <p className="text-sm font-bold text-gray-800">Target Achievement: {projectData.targetAchievementPct}%</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return <div className="p-6 text-center text-gray-500">Loading dynamic goals...</div>;
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-slate-800">Partner Manager Goals</h2>
            </div>

            {/* Dynamic Target Progress Bar Cards */}
            {assignedGoals.includes('partner') && renderPartnerCard()}
            {assignedGoals.includes('project') && renderProjectCard()}

            {assignedGoals.length === 0 && (
                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg mb-8">
                    <p>No goals have been assigned to you currently.</p>
                </div>
            )}

            <h2 className="text-xl font-semibold text-blue-500 mb-4">Franchisee Summary Table</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full table-auto border-collapse border border-gray-200">
                    <thead>
                        <tr className="bg-blue-400 text-white text-sm">
                            <th className="px-4 py-3 text-left font-medium border border-blue-300">Franchisee Name</th>
                            <th className="px-4 py-3 text-left font-medium border border-blue-300">Order Payment Receipt</th>
                            <th className="px-4 py-3 text-left font-medium border border-blue-300">Franchisee Onboarding Date</th>
                            <th className="px-4 py-3 text-left font-medium border border-blue-300">Franchisee First Order Due Date</th>
                            <th className="px-4 py-3 text-left font-medium border border-blue-300">Order Status</th>
                            <th className="px-4 py-3 text-left font-medium border border-blue-300">Commission</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {franchisees.length > 0 ? (
                            franchisees.map((row) => (
                                <tr key={row.id} className="border-b border-gray-200 hover:bg-gray-50">
                                    <td className="px-4 py-4 text-gray-700">{row.name}</td>
                                    <td className="px-4 py-4">
                                        <input type="file" className="text-sm text-gray-500 file:mr-4 file:py-1 file:px-3 file:border file:border-gray-300 file:rounded file:text-sm file:bg-gray-50 hover:file:bg-gray-100 cursor-pointer" />
                                    </td>
                                    <td className="px-4 py-4 text-gray-700">{new Date(row.onboardingDate).toLocaleDateString()}</td>
                                    <td className="px-4 py-4 text-gray-700">{new Date(row.firstOrderDueDate).toLocaleDateString()}</td>
                                    <td className={`px-4 py-4 font-medium ${row.status === 'Completed' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                        {row.status}
                                    </td>
                                    <td className={`px-4 py-4 font-medium ${row.commission === 'Not Eligible' ? 'text-red-500' : 'text-emerald-500 font-semibold'}`}>
                                        {row.commission}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                                    No Franchisees onboarded yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
