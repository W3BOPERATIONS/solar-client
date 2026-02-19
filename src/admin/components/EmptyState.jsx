import React from 'react';
import { PackageOpen } from 'lucide-react';

const EmptyState = ({
    title = "No Data Available",
    description = "There is no data to display at the moment.",
    actionLabel,
    onAction,
    icon: Icon = PackageOpen
}) => {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white rounded-lg border border-gray-200">
            <div className="bg-blue-50 p-4 rounded-full mb-4">
                <Icon className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-500 max-w-sm mb-6">{description}</p>
            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
};

export default EmptyState;
