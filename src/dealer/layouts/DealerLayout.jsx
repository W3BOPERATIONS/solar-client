import React from 'react';
import { Outlet } from 'react-router-dom';
import DynamicPanelSidebar from '../../components/Sidebar/DynamicPanelSidebar';
import DealerHeader from '../components/DealerHeader';

export default function DealerLayout() {
    return (
        <div className="flex h-screen bg-gray-100">
            <DynamicPanelSidebar panelTitle="DEALER PANEL" />
            <div className="flex flex-col flex-1 overflow-hidden">
                <DealerHeader />
                <main className="flex-1 overflow-auto bg-gray-50 p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
