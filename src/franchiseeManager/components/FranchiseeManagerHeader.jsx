import React, { useState, useRef, useEffect } from 'react';
import { Bell, Settings, LogOut, User, DollarSign, Video, HelpCircle, Coffee } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import authStore from '../../store/authStore.js';
import api from '../../api/axios.js';

export default function FranchiseeManagerHeader() {
    const navigate = useNavigate();
    const user = authStore((state) => state.user);
    const setToken = authStore((state) => state.setToken);
    const setUser = authStore((state) => state.setUser);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const [isOnBreak, setIsOnBreak] = useState(false);

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setToken(null);
            setUser(null);
            navigate('/login');
        }
    };

    const handleBreakToggle = async () => {
        try {
            const response = await api.post('/hr/attendance/break');
            if (response.data.success) {
                setIsOnBreak(response.data.isOnBreak);
            }
        } catch (error) {
            console.error('Error toggling break:', error);
        }
    };

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 sticky top-0 z-30">
            <h1 className="text-xl font-bold text-slate-800">Partner Manager Dashboard</h1>

            <div className="flex items-center space-x-6">
                <button className="text-gray-500 hover:text-blue-600 transition relative">
                    <Bell size={20} />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                <button 
                    onClick={handleBreakToggle}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-full transition-all duration-300 ${isOnBreak ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'}`}
                    title={isOnBreak ? "End Break" : "Start Break"}
                >
                    <Coffee size={18} className={isOnBreak ? 'animate-pulse' : ''} />
                    <span className="text-sm font-medium hidden md:block">{isOnBreak ? 'On Break' : 'Take a Break'}</span>
                </button>
                <button className="text-gray-500 hover:text-blue-600 transition">
                    <Settings size={20} />
                </button>

                <div className="h-8 w-px bg-gray-200"></div>

                <div className="relative flex items-center" ref={dropdownRef}>
                    <button 
                        className="flex items-center space-x-3 focus:outline-none"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-blue-200 rounded-full flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
                            {user?.profileImage ? (
                                <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-sm font-bold text-indigo-700">
                                    {user?.name?.charAt(0) || 'FM'}
                                </span>
                            )}
                        </div>
                        <div className="hidden md:block text-right mr-3">
                            <p className="text-sm font-semibold text-slate-800">{user?.name || 'Partner Manager'}</p>
                            <p className="text-xs text-slate-500">{user?.role?.toUpperCase() || 'PARTNER MANAGER'}</p>
                        </div>
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                        <div className="absolute top-14 right-0 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50">
                            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-lg">
                                <p className="text-sm text-gray-900 font-medium">{user?.name || 'Partner Manager'}</p>
                                <p className="text-xs text-gray-500 truncate">{user?.email || 'partner.manager@solarkits.com'}</p>
                            </div>
                            <Link 
                                to="/franchisee-manager/profile"
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                                onClick={() => setIsDropdownOpen(false)}
                            >
                                <User size={16} className="mr-3 text-gray-400" />
                                My Profile
                            </Link>
                            <Link 
                                to="/franchisee-manager/onboarding-goals" 
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                                onClick={() => setIsDropdownOpen(false)}
                            >
                                <DollarSign size={16} className="mr-3 text-gray-400" />
                                MY GOALS
                            </Link>
                            <a 
                                href="#" 
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                            >
                                <Video size={16} className="mr-3 text-gray-400" />
                                My Training Videos
                            </a>
                            <a 
                                href="#" 
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                            >
                                <Settings size={16} className="mr-3 text-gray-400" />
                                User Setting
                            </a>
                            <a 
                                href="#" 
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                            >
                                <HelpCircle size={16} className="mr-3 text-gray-400" />
                                Help
                            </a>
                            <div className="border-t border-gray-100 my-1"></div>
                            <button
                                onClick={() => {
                                    setIsDropdownOpen(false);
                                    handleLogout();
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                                <LogOut size={16} className="mr-3 text-red-400" />
                                Log Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
