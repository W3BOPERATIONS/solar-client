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
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [isThemeOpen, setIsThemeOpen] = useState(false);
    
    const dropdownRef = useRef(null);
    const notifRef = useRef(null);
    const themeRef = useRef(null);

    const [isOnBreak, setIsOnBreak] = useState(false);

    // Mock Notifications for overdue pending work
    const notifications = [
        { id: 1, text: 'Project PRJ-1010 Meter Installation is overdue by 2 days.', time: '10 mins ago', unread: true },
        { id: 2, text: 'Ramesh Patel Feasibility Approval is pending.', time: '1 hour ago', unread: true },
        { id: 3, text: 'Partner onboarding documentation incomplete for Suresh.', time: '2 hours ago', unread: false }
    ];

    const unreadCount = notifications.filter(n => n.unread).length;

    // Theme Colors
    const themes = [
        { id: 'blue', name: 'Default Blue', colorClass: 'bg-blue-600' },
        { id: 'purple', name: 'Royal Purple', colorClass: 'bg-purple-600' },
        { id: 'green', name: 'Eco Green', colorClass: 'bg-green-600' },
        { id: 'orange', name: 'Solar Orange', colorClass: 'bg-orange-600' }
    ];

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

    const handleThemeChange = (themeId) => {
        setIsThemeOpen(false);
        const root = document.documentElement;

        // Reset previous color classes
        root.classList.remove('theme-purple', 'theme-green', 'theme-orange');

        if (themeId === 'purple') {
            root.classList.add('theme-purple');
        } else if (themeId === 'green') {
            root.classList.add('theme-green');
        } else if (themeId === 'orange') {
            root.classList.add('theme-orange');
        }
        // blue is default so no class needed
        
        localStorage.setItem('franchiseePanelTheme', themeId);
    };

    // Load saved theme on mount
    useEffect(() => {
        const savedTheme = localStorage.getItem('franchiseePanelTheme');
        if (savedTheme) {
            handleThemeChange(savedTheme);
        }
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setIsNotifOpen(false);
            }
            if (themeRef.current && !themeRef.current.contains(event.target)) {
                setIsThemeOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 sticky top-0 z-30">
            <h1 className="text-xl font-bold text-slate-800">Partner Manager Dashboard</h1>

            <div className="flex items-center space-x-6">
                {/* Notifications */}
                <div className="relative flex items-center" ref={notifRef}>
                    <button 
                        onClick={() => setIsNotifOpen(!isNotifOpen)}
                        className="text-gray-500 hover:text-blue-600 transition relative focus:outline-none"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center text-[10px] text-white bg-red-500 rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    {isNotifOpen && (
                        <div className="absolute top-10 right-[-60px] w-80 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50">
                            <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="text-sm font-semibold text-gray-800">Pending Work</h3>
                                <span className="text-xs text-blue-600 cursor-pointer">Mark all read</span>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                {notifications.map(notif => (
                                    <div key={notif.id} className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${notif.unread ? 'bg-blue-50/50' : ''}`}>
                                        <p className={`text-sm ${notif.unread ? 'font-medium text-gray-800' : 'text-gray-600'}`}>{notif.text}</p>
                                        <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="px-4 py-2 text-center border-t border-gray-100">
                                <a href="#" className="text-xs text-blue-600 hover:underline">View All Notifications</a>
                            </div>
                        </div>
                    )}
                </div>

                {/* Break Button */}
                <button 
                    onClick={handleBreakToggle}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-full transition-all duration-300 ${isOnBreak ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'}`}
                    title={isOnBreak ? "End Break" : "Start Break"}
                >
                    <Coffee size={18} className={isOnBreak ? 'animate-pulse' : ''} />
                    <span className="text-sm font-medium hidden md:block">{isOnBreak ? 'On Break' : 'Take a Break'}</span>
                </button>

                {/* Theme Settings */}
                <div className="relative flex items-center" ref={themeRef}>
                    <button 
                        onClick={() => setIsThemeOpen(!isThemeOpen)}
                        className="text-gray-500 hover:text-blue-600 transition focus:outline-none"
                        title="Panel Color & Theme"
                    >
                        <Settings size={20} />
                    </button>

                    {isThemeOpen && (
                        <div className="absolute top-10 right-0 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50">
                            <div className="px-4 py-2 border-b border-gray-100">
                                <h3 className="text-sm font-semibold text-gray-800">Panel Theme</h3>
                            </div>
                            <div className="py-2">
                                {themes.map(theme => (
                                    <button 
                                        key={theme.id}
                                        onClick={() => handleThemeChange(theme.id)}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-3"
                                    >
                                        <span className={`w-4 h-4 rounded-full border border-gray-200 shadow-inner ${theme.colorClass}`}></span>
                                        <span className="text-gray-700">{theme.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

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
