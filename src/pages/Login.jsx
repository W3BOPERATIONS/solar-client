'use client';

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api/api.js';
import authStore from '../store/authStore.js';
import { Mail, Lock, Eye, EyeOff, Shield, Building2, Store } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const setUser = authStore((state) => state.setUser);
  const setToken = authStore((state) => state.setToken);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login({ email, password });
      setToken(response.data.token);
      setUser(response.data.user);

      if (response.data.user.role === 'admin') {
        navigate('/dashboard');
      } else if (response.data.user.role === 'dealer') {
        navigate('/dealer/dashboard');
      } else if (response.data.user.role === 'franchisee') {
        navigate('/franchisee/dashboard');
      } else if (response.data.user.role === 'dealerManager') {
        navigate('/dealer-manager/dashboard');
      } else if (response.data.user.role === 'franchiseeManager') {
        navigate('/franchisee-manager/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      // FIX: Prevent page refresh and show error properly
      setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
      setLoading(false); // Stop loading on error
      // Don't throw or reload the page
    }
  };

  const handleDemoLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950 p-6">
      {/* Main container with proper spacing */}
      <div className="w-full max-w-md mx-auto">
        {/* Card with top and bottom spacing */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-gray-200 my-10">
          {/* Logo Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Shield size={32} className="text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
              SOLARKITS
            </h1>
            <p className="text-slate-600 mt-2">A Solar Marketplace Platform</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-sm font-bold">!</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin}>
            <div className="space-y-6">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={20} className="text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={20} className="text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff size={20} className="text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye size={20} className="text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logging in...
                  </span>
                ) : (
                  'Login'
                )}
              </button>
            </div>
          </form>

          {/* Demo Credentials */}
          <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-200">
            <p className="text-sm font-semibold text-slate-700 mb-4 flex items-center">
              <span className="bg-blue-100 text-blue-700 p-1 rounded mr-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </span>
              Demo Credentials (Click to auto-fill)
            </p>

            <div className="space-y-3">
              <button
                onClick={() => handleDemoLogin('admin@solarkits.com', '123456')}
                className="w-full flex items-center justify-between p-3 bg-white hover:bg-red-50 rounded-lg border border-gray-200 transition-all duration-200 group"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                    <Shield size={16} className="text-red-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-slate-800 group-hover:text-red-700">Admin</p>
                    <p className="text-xs text-slate-500">admin@solarkits.com</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-red-600">Click to use</span>
              </button>

              <button
                onClick={() => handleDemoLogin('dealer@solarkits.com', '123456')}
                className="w-full flex items-center justify-between p-3 bg-white hover:bg-emerald-50 rounded-lg border border-gray-200 transition-all duration-200 group"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
                    <Store size={16} className="text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-slate-800 group-hover:text-emerald-700">Dealer</p>
                    <p className="text-xs text-slate-500">dealer@solarkits.com</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-emerald-600">Click to use</span>
              </button>

              <button
                onClick={() => handleDemoLogin('franchise@solarkits.com', '123456')}
                className="w-full flex items-center justify-between p-3 bg-white hover:bg-purple-50 rounded-lg border border-gray-200 transition-all duration-200 group"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                    <Building2 size={16} className="text-purple-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-slate-800 group-hover:text-purple-700">Franchisee</p>
                    <p className="text-xs text-slate-500">franchise@solarkits.com</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-purple-600">Click to use</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('dealermanager@example.com', 'password123')}
                className="w-full flex items-center justify-between p-3 bg-white hover:bg-blue-50 rounded-lg border border-gray-200 transition-all duration-200 group"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <Shield size={16} className="text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-slate-800 group-hover:text-blue-700">Dealer Manager</p>
                    <p className="text-xs text-slate-500">dealermanager@example.com</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-blue-600">Click to use</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('franchisemanager@example.com', 'password123')}
                className="w-full flex items-center justify-between p-3 bg-white hover:bg-orange-50 rounded-lg border border-gray-200 transition-all duration-200 group"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                    <Building2 size={16} className="text-orange-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-slate-800 group-hover:text-orange-700">Franchisee Manager</p>
                    <p className="text-xs text-slate-500">franchisemanager@example.com</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-orange-600">Click to use</span>
              </button>

            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              © 2024 SOLARKITS ERP System. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}