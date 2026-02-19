import React from 'react';
import { FaBuilding, FaSpinner } from 'react-icons/fa';

const DepartmentList = ({ departments, selectedid, onSelect, loading }) => {
    if (loading) {
        return (
            <div className="flex justify-center items-center h-40">
                <FaSpinner className="animate-spin text-blue-500 text-2xl" />
            </div>
        );
    }

    if (!departments || departments.length === 0) {
        return <div className="p-4 text-center text-gray-500">No departments found.</div>;
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                    <FaBuilding className="text-gray-500" />
                    Departments
                </h3>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
                {departments.map((dept) => (
                    <div
                        key={dept._id}
                        onClick={() => onSelect(dept)}
                        className={`p-3 cursor-pointer transition-colors border-b border-gray-50 hover:bg-blue-50
                            ${selectedid === dept._id ? 'bg-blue-50 border-l-4 border-l-blue-500 font-medium text-blue-700' : 'text-gray-600 border-l-4 border-l-transparent'}
                        `}
                    >
                        {dept.name}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DepartmentList;
