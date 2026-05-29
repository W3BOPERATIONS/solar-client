import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import * as Icons from 'lucide-react';
import authStore from '../../store/authStore';

const DynamicPanelSidebar = ({ panelTitle = "SOLARKITS", panelSubtitle = "A SOLAR MARKETPLACE" }) => {
  const { user } = authStore();
  const [openSubMenus, setOpenSubMenus] = useState({});
  const location = useLocation();

  const toggleSubMenu = (label, e) => {
    if (e) e.preventDefault();
    setOpenSubMenus(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  const getDynamicIcon = (iconName) => {
    const IconComponent = Icons[iconName] || Icons.Layers;
    return IconComponent;
  };

  const getPanelBasePath = (role) => {
    switch (role) {
      case 'admin': return '/admin';
      case 'dealer': return '/dealer';
      case 'franchisee': return '/franchisee';
      case 'dealerManager': return '/dealer-manager';
      case 'franchiseeManager': return '/franchisee-manager';
      case 'accountManager': return '/account-manager';
      case 'deliveryManager': return '/delivery-manager';
      default: return '';
    }
  };

  const getDynamicRoute = (route) => {
    if (!route || route === '#') return '#';
    const basePath = getPanelBasePath(user?.role);
    
    // If it's a hardcoded route that matches the old base path, we should replace it
    if (route.startsWith('/admin')) {
      return route.replace(/^\/admin/, basePath);
    }
    if (route.startsWith('/dealer') && !route.startsWith(basePath)) {
        return route.replace(/^\/dealer/, basePath);
    }
    
    return route;
  };

  const renderNavLink = (item, isNested = false) => {
    const IconComponent = getDynamicIcon(item.icon);
    return (
      <NavLink
        key={item._id || item.key || item.name}
        to={getDynamicRoute(item.path || item.route)}
        className={({ isActive }) =>
          `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
            isActive && !item.hasDropdown
              ? 'bg-blue-50 text-blue-700 shadow-sm'
              : isNested 
                ? 'text-[#142340] hover:bg-[#dce4ee]' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
          }`
        }
      >
        <IconComponent size={20} />
        <span className="font-medium">{item.name}</span>
      </NavLink>
    );
  };

  const menuTree = user?.dynamicMenuTree || [];

  return (
    <div className="w-64 bg-[#f1f4f9] shadow-lg h-full flex flex-col transition-all duration-300 border-r border-gray-200">
      <div className="p-6 bg-white border-b border-gray-100">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          {panelTitle}
        </h2>
        <p className="text-[10px] text-gray-500 tracking-wider">{panelSubtitle}</p>
      </div>
      <nav className="flex-1 overflow-y-auto mt-4 space-y-1 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="px-4 space-y-1">
          {menuTree.map((item) => {
            if (item.hasDropdown && item.subItems?.length > 0) {
              const isOpen = openSubMenus[item.name];
              const IconComponent = getDynamicIcon(item.icon);
              return (
                <div key={item._id} className="mt-1">
                  <button
                    onClick={(e) => toggleSubMenu(item.name, e)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${
                      isOpen
                        ? 'bg-[#142340] text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <IconComponent size={20} className={isOpen ? 'text-white' : 'text-gray-600'} />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    {isOpen ? <Icons.ChevronUp size={20} /> : <Icons.ChevronDown size={20} />}
                  </button>
                  
                  {isOpen && (
                    <div className="bg-[#e9eef5] py-2 mt-1 rounded-xl flex flex-col space-y-1 shadow-inner">
                      {item.subItems.map((subItem, index) => {
                        const SubIcon = getDynamicIcon(subItem.icon);
                        return (
                          <NavLink
                            key={subItem._id || subItem.key || subItem.name || index}
                            to={getDynamicRoute(subItem.route || subItem.path)}
                            className={({ isActive }) =>
                              `flex items-center space-x-3 px-8 py-2 mx-2 rounded-lg transition-colors ${
                                isActive
                                  ? 'bg-[#142340] text-white font-semibold' 
                                  : 'text-[#142340] hover:bg-[#dce4ee]'
                              }`
                            }
                          >
                            <SubIcon size={18} />
                            <span className="text-[14.5px]">{subItem.name}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            } else {
              return renderNavLink(item);
            }
          })}
        </div>
      </nav>
    </div>
  );
};

export default DynamicPanelSidebar;
