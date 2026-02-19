import React from 'react';

const AccessLevelDropdown = ({ value, onChange, disabled }) => {
    return (
        <select
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
        >
            <option value="country">Country</option>
            <option value="state">State</option>
            <option value="cluster">Cluster</option>
            <option value="district">District</option>
        </select>
    );
};

export default AccessLevelDropdown;
