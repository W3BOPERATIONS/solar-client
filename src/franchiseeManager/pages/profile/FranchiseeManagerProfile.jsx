import React, { useState, useEffect } from 'react';
import authStore from '../../../store/authStore';
import api from '../../../api/axios';

export default function FranchiseeManagerProfile() {
    const user = authStore((state) => state.user);
    const [activeTab, setActiveTab] = useState('Overview');
    const [timeFilter, setTimeFilter] = useState('Day');

    const [dynamicStats, setDynamicStats] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/hr/attendance/profile-stats');
                if (response.data.success) {
                    setDynamicStats(response.data.stats);
                }
            } catch (error) {
                console.error('Error fetching profile stats:', error);
            }
        };
        fetchStats();
    }, []);

    // Stats data mapping matching the provided image
    const stats = [
        { label: 'Arrival time', value: dynamicStats?.arrivalTime || 'N/A', bgColor: 'bg-red-100', textColor: 'text-red-500' },
        { label: 'Leaves', value: dynamicStats?.leaves || 'Total:0', bgColor: 'bg-green-100', textColor: 'text-green-600' },
        { label: 'Overdue task', value: dynamicStats?.overdueTask || 'Total:0', bgColor: 'bg-blue-50', textColor: 'text-blue-500' },
        { label: 'Total Work Days', value: dynamicStats?.totalWorkDays || 'Total:0', bgColor: 'bg-teal-50', textColor: 'text-teal-600' },
        { label: 'Time at work', value: dynamicStats?.timeAtWork || '0m', bgColor: 'bg-blue-50', textColor: 'text-blue-500' },
        { label: 'Rank in team/company', value: dynamicStats?.rankInTeam || 'N/A', bgColor: 'bg-blue-50', textColor: 'text-blue-500' },
        { label: 'Efficiency Score', value: dynamicStats?.efficiencyScore || '0%', bgColor: 'bg-red-100', textColor: 'text-red-500' },
        { label: 'Productivity', value: dynamicStats?.productivity || '0%', bgColor: 'bg-blue-50', textColor: 'text-blue-500' },
        { label: 'Total Break Time', value: dynamicStats?.totalBreakTime || 'Average\n0 hours', bgColor: 'bg-blue-50', textColor: 'text-blue-500' },
        { label: 'Monthly Break Time', value: dynamicStats?.monthlyBreakTime || 'Monthly\n0 Hours', bgColor: 'bg-red-100', textColor: 'text-red-500' },
    ];

    const tabs = ['Overview', 'Overdue Tasks', 'Payroll', 'ESOPs'];
    const timeFilters = ['Day', 'Week', 'Month'];

    // Current Date formatted like "Fri, April 4, 2025"
    const today = new Date();
    const dateOptions = { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' };
    const formattedDate = today.toLocaleDateString('en-US', dateOptions);

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Profile</h2>
                <div className="text-sm text-gray-500 flex items-center space-x-2 mt-1">
                    <span>Home</span>
                    <span>&gt;</span>
                    <span className="text-blue-600 font-medium">Profile</span>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Column - Profile Details */}
                <div className="w-full lg:w-1/4 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex flex-col items-center">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg mb-4">
                                {user?.profileImage ? (
                                    <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-blue-100 flex items-center justify-center text-blue-600 text-3xl font-bold">
                                        {user?.name?.charAt(0) || 'FM'}
                                    </div>
                                )}
                            </div>
                            <button className="absolute bottom-4 right-0 bg-white p-1.5 rounded-full shadow-md border border-gray-100 text-gray-500 hover:text-blue-600">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                            </button>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">{user?.name || 'Ravi harsoda'}</h2>
                        <p className="text-sm text-gray-500 mb-6">{user?.role === 'franchiseeManager' ? 'Partner Manager' : 'PHP- epr Developer'}</p>
                    </div>

                    <div className="border-t border-gray-100 pt-6">
                        <h4 className="text-blue-600 font-semibold mb-4">Contact Information</h4>
                        
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Email Address:</p>
                                <p className="text-sm text-gray-800 font-medium break-all">{user?.email || 'sharadsavaliya@gmail.com'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Phone Number:</p>
                                <p className="text-sm text-gray-800 font-medium">{user?.phone || '9874563210'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Country:</p>
                                <p className="text-sm text-gray-800 font-medium">{user?.country || 'India'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Address:</p>
                                <p className="text-sm text-gray-800 font-medium">{user?.address || 'Umiya Chowk, Rajkot'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-6 mt-6">
                        <h4 className="text-blue-600 font-semibold mb-4">Key Skills</h4>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm font-medium text-gray-800 mb-1">HTML</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-800 mb-1">Css</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Tabs and Content */}
                <div className="w-full lg:w-3/4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        {/* Tabs */}
                        <div className="flex border-b border-gray-100 overflow-x-auto">
                            {tabs.map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                                        activeTab === tab 
                                            ? 'text-blue-600 border-b-2 border-blue-600' 
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Content Area */}
                        <div className="p-6">
                            {activeTab === 'Overview' && (
                                <div className="border-2 border-red-500 p-6 rounded-lg relative">
                                    <div className="flex justify-between items-center mb-6">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-800 mb-1">{user?.name ? `${user.name}'s Profile` : "Sharad's Profile"}</h3>
                                            <p className="text-gray-500">{formattedDate}</p>
                                        </div>
                                        <div className="flex bg-gray-100 rounded-lg p-1">
                                            {timeFilters.map((filter) => (
                                                <button
                                                    key={filter}
                                                    onClick={() => setTimeFilter(filter)}
                                                    className={`px-4 py-1 text-xs font-medium rounded-md transition-all ${
                                                        timeFilter === filter
                                                            ? 'bg-green-500 text-white shadow-sm'
                                                            : 'text-gray-500 hover:text-gray-700'
                                                    }`}
                                                >
                                                    {filter}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {stats.map((stat, index) => (
                                            <div 
                                                key={index} 
                                                className={`${stat.bgColor} rounded-xl p-4 flex flex-col items-center justify-center text-center h-28 shadow-sm`}
                                            >
                                                <span className={`text-sm font-medium mb-1 ${stat.textColor}`}>{stat.label}</span>
                                                {stat.value.includes('\n') ? (
                                                    <div className="flex flex-col items-center">
                                                        {stat.value.split('\n').map((line, i) => (
                                                            <span key={i} className={`font-bold ${i === 1 ? 'text-lg' : 'text-sm'} ${stat.textColor}`}>
                                                                {line}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className={`text-lg font-bold ${stat.textColor}`}>{stat.value}</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'Payroll' && (
                                <div className="p-6 bg-white border border-gray-100 rounded-lg shadow-sm">
                                    <h3 className="text-xl font-bold text-gray-800 mb-4">Payroll Information</h3>
                                    {dynamicStats?.payrollSettings ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-gray-50 p-4 rounded-md">
                                                <p className="text-sm text-gray-500 mb-1">Salary</p>
                                                <p className="font-semibold text-gray-800">{dynamicStats.payrollSettings.salary || 'N/A'}</p>
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-md">
                                                <p className="text-sm text-gray-500 mb-1">Payroll Type</p>
                                                <p className="font-semibold text-gray-800">{dynamicStats.payrollSettings.payrollType || 'N/A'}</p>
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-md">
                                                <p className="text-sm text-gray-500 mb-1">Perks</p>
                                                <p className="font-semibold text-gray-800">{dynamicStats.payrollSettings.perks || 'N/A'}</p>
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-md">
                                                <p className="text-sm text-gray-500 mb-1">Benefits</p>
                                                <p className="font-semibold text-gray-800">{dynamicStats.payrollSettings.benefits || 'N/A'}</p>
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-md">
                                                <p className="text-sm text-gray-500 mb-1">Commission Type</p>
                                                <p className="font-semibold text-gray-800">{dynamicStats.payrollSettings.commissionTypeSelection || 'N/A'}</p>
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-md">
                                                <p className="text-sm text-gray-500 mb-1">Salary Increment</p>
                                                <p className="font-semibold text-gray-800">{dynamicStats.payrollSettings.salaryIncrement || 'N/A'}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <p className="text-gray-500">Payroll settings not configured yet for your role.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'ESOPs' && (
                                <div className="p-6 bg-white border border-gray-100 rounded-lg shadow-sm">
                                    <h3 className="text-xl font-bold text-gray-800 mb-4">ESOPs Eligibility</h3>
                                    {dynamicStats?.payrollSettings ? (
                                        <div className="bg-blue-50 p-6 rounded-md text-center">
                                            <p className="text-lg font-medium text-blue-800">Status: {dynamicStats.payrollSettings.esops || 'Not Configured'}</p>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <p className="text-gray-500">ESOPs settings not configured yet for your role.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab !== 'Overview' && activeTab !== 'Payroll' && activeTab !== 'ESOPs' && (
                                <div className="py-12 text-center text-gray-500">
                                    <p className="text-lg">Content for {activeTab} will go here.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
