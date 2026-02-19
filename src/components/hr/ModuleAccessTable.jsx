import React, { useState, useEffect } from 'react';
import { FaSave, FaSpinner, FaCheckCircle, FaBuilding } from 'react-icons/fa';
import AccessLevelDropdown from './AccessLevelDropdown';

const ModuleAccessTable = ({
    modules,
    existingMappings,
    departmentName,
    onSave,
    loading,
    saving
}) => {
    // Local state to track changes before saving
    // Format: { [moduleId]: { accessLevel: '...', enabled: true/false } }
    const [mappings, setMappings] = useState({});

    // Initialize local state when modules or existingMappings change
    useEffect(() => {
        const initialMappings = {};

        modules.forEach(mod => {
            // Find existing mapping or use default
            const existing = existingMappings.find(m => m.moduleId && (m.moduleId._id === mod._id || m.moduleId === mod._id));

            initialMappings[mod._id] = {
                moduleId: mod._id,
                accessLevel: existing ? existing.accessLevel : mod.defaultLevel || 'country',
                enabled: existing ? existing.enabled : false
            };
        });

        setMappings(initialMappings);
    }, [modules, existingMappings]);

    const handleChange = (moduleId, field, value) => {
        setMappings(prev => ({
            ...prev,
            [moduleId]: {
                ...prev[moduleId],
                [field]: value
            }
        }));
    };

    const handleSave = () => {
        // Convert to array for API
        const data = Object.values(mappings);
        onSave(data);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-60">
                <FaSpinner className="animate-spin text-blue-500 text-3xl" />
            </div>
        );
    }

    if (!departmentName) {
        return (
            <div className="flex flex-col items-center justify-center h-60 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <FaBuilding className="text-4xl mb-3 text-gray-300" />
                <p>Select a department to configure modules</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-semibold text-gray-700">
                    Module Access Configuration: <span className="text-blue-600">{departmentName}</span>
                </h3>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                        <tr>
                            <th className="p-4 w-1/3">Module Name</th>
                            <th className="p-4 w-1/3">Access Level</th>
                            <th className="p-4 w-1/3 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {modules.map((mod) => {
                            const mapping = mappings[mod._id] || { accessLevel: 'country', enabled: false };

                            return (
                                <tr key={mod._id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-medium text-gray-800">{mod.name}</div>
                                        {/* <div className="text-xs text-gray-400">{mod.key}</div> */}
                                    </td>
                                    <td className="p-4">
                                        <AccessLevelDropdown
                                            value={mapping.accessLevel}
                                            onChange={(val) => handleChange(mod._id, 'accessLevel', val)}
                                            disabled={!mapping.enabled}
                                        />
                                    </td>
                                    <td className="p-4 text-center">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={mapping.enabled}
                                                onChange={(e) => handleChange(mod._id, 'enabled', e.target.checked)}
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            <span className="ml-3 text-sm font-medium text-gray-600 min-w-[60px]">
                                                {mapping.enabled ? 'Active' : 'Diff'}
                                            </span>
                                        </label>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {modules.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                    No modules defined in the system.
                </div>
            )}
        </div>
    );
};

export default ModuleAccessTable;
