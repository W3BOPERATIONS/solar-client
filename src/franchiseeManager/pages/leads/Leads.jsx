import React, { useState } from 'react';
import { Users, User, ChevronRight } from 'lucide-react';
import CompanyLead from './CompanyLead';
import ManagerTable from './ManagerTable';

const FranchiseeManagerOnboardingLeads = () => {
    const [activeTab, setActiveTab] = useState('my-leads');
    const [selectedState, setSelectedState] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');

    return (
        <div className="container mx-auto px-4 py-6">
            {/* Page Header with Breadcrumb */}
            <div className="mb-6 flex justify-between items-center">
                <div className="flex items-center text-sm text-gray-600">
                    <span className="text-blue-600 font-medium flex items-center">
                        Leads
                    </span>
                    <ChevronRight size={16} className="mx-2 text-gray-400" />
                    <span className="text-gray-500">Onboarding</span>
                </div>
                
                {/* Global Filters */}
                <div className="flex space-x-4">
                    <div>
                        <select 
                            className="w-48 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={selectedState}
                            onChange={(e) => setSelectedState(e.target.value)}
                        >
                            <option value="">Select State</option>
                            <option value="gujarat">Gujarat</option>
                            <option value="maharashtra">Maharashtra</option>
                        </select>
                    </div>
                    <div>
                        <select 
                            className="w-48 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={selectedDistrict}
                            onChange={(e) => setSelectedDistrict(e.target.value)}
                        >
                            <option value="">Select District</option>
                            <option value="rajkot">Rajkot</option>
                            <option value="ahmedabad">Ahmedabad</option>
                            <option value="surat">Surat</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Navigation Cards as Tabs */}
            <div className="max-w-4xl mx-auto mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 justify-center">
                    {/* Company Lead Card */}
                    <button
                        onClick={() => setActiveTab('company')}
                        className={`transform transition-all duration-300 hover:-translate-y-1 hover:shadow-lg rounded-xl overflow-hidden focus:outline-none ${activeTab === 'company' ? 'ring-4 ring-blue-300 ring-opacity-50' : ''}`}
                    >
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg p-6 h-40 flex flex-col items-center justify-center group relative">
                            <Users size={40} className="mb-3 group-hover:scale-110 transition-transform duration-300" />
                            <span className="text-lg font-bold text-center">Company Lead</span>
                            <span className="mt-2 text-2xl font-black bg-white bg-opacity-20 px-4 py-1 rounded-full">15</span>
                        </div>
                    </button>

                    {/* My Lead Card */}
                    <button
                        onClick={() => setActiveTab('my-leads')}
                        className={`transform transition-all duration-300 hover:-translate-y-1 hover:shadow-lg rounded-xl overflow-hidden focus:outline-none ${activeTab === 'my-leads' ? 'ring-4 ring-green-300 ring-opacity-50' : ''}`}
                    >
                        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg p-6 h-40 flex flex-col items-center justify-center group relative">
                            <User size={40} className="mb-3 group-hover:scale-110 transition-transform duration-300" />
                            <span className="text-lg font-bold text-center">My Lead</span>
                            <span className="mt-2 text-2xl font-black bg-white bg-opacity-20 px-4 py-1 rounded-full">14</span>
                        </div>
                    </button>
                </div>
            </div>

            {/* Render Selected Table Component */}
            <div className="mt-4 border-t pt-6 border-gray-200">
                {activeTab === 'company' && <CompanyLead />}
                {activeTab === 'my-leads' && <ManagerTable />}
            </div>
        </div>
    );
};

export default FranchiseeManagerOnboardingLeads;