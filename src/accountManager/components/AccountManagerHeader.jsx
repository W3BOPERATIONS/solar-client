import React, { useState, useRef, useEffect } from 'react';
import { Bell, User, LogOut, Settings, HelpCircle, Video, DollarSign, Users } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import authStore from '../../store/authStore';

export default function AccountManagerHeader() {
  const navigate = useNavigate();
  const user = authStore((state) => state.user);
  const logout = authStore((state) => state.logout);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
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
    <header className="bg-white shadow-sm border-b border-gray-100 z-10 relative">
      <div className="flex items-center justify-between px-8 py-4">
        <h1 className="text-xl font-semibold text-gray-800">
          Order Management
        </h1>
        <div className="flex items-center space-x-6">
          <button className="relative p-2 text-gray-400 hover:text-blue-600 transition-colors">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          <div className="relative flex items-center border-l pl-6 border-gray-200" ref={dropdownRef}>
            <button 
                className="flex items-center space-x-3 focus:outline-none"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-md overflow-hidden">
                {user?.profileImage ? (
                    <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                    <User size={20} />
                )}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-700">{user?.name || 'Vivek Gohel'}</p>
                <p className="text-xs text-blue-500">{user?.role || 'Account Manager'}</p>
              </div>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute top-14 right-0 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-lg">
                    <p className="text-sm text-gray-900 font-medium">{user?.name || 'Vivek Gohel'}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email || 'account@solarkits.com'}</p>
                </div>
                <Link 
                    to="/account-manager/profile"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                >
                    <User size={16} className="mr-3 text-gray-400" />
                    My Profile
                </Link>
                <Link 
                    to="/account-manager/salary" 
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                >
                    <DollarSign size={16} className="mr-3 text-gray-400" />
                    My Salary
                </Link>
                <Link 
                    to="/employee-login" 
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                >
                    <Users size={16} className="mr-3 text-gray-400" />
                    Employee Login
                </Link>
                <Link 
                    to="/account-manager/training-videos" 
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                >
                    <Video size={16} className="mr-3 text-gray-400" />
                    My Training Videos
                </Link>
                <Link 
                    to="/account-manager/settings" 
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                >
                    <Settings size={16} className="mr-3 text-gray-400" />
                    User Setting
                </Link>
                <Link 
                    to="/account-manager/help" 
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                >
                    <HelpCircle size={16} className="mr-3 text-gray-400" />
                    Help
                </Link>
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
      </div>
    </header>
  );
}
