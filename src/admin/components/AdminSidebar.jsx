'use client';

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Truck,
  Package,
  Store,
  Building2,
  CheckCircle2,
  BriefcaseBusiness,
  Workflow,
  Settings,
  FileText,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  BarChart3,
  UserCog,
  Building,
  Store as StoreIcon,
  FileBarChart,
  UserCheck,
  TrendingUp,
  Home,
  MapPin,
  ClipboardList,
  Wrench,
  Layers,
} from 'lucide-react';

import authStore from '../../store/authStore';

export default function AdminSidebar() {
  const { user } = authStore();
  const [isOpen, setIsOpen] = useState(true);

  // Mapping of Sidebar IDs to System Module Keys
  const moduleMapping = {
    // Settings Sub-groups
    'settingsHr': 'settings_hr',
    'settingsVendor': 'settings_vendor',
    'settingsSales': 'settings_sales',
    'settingsMarketing': 'settings_marketing',
    'settingsDelivery': 'settings_delivery',
    'settingsInstaller': 'settings_installer',
    'settingsInventory': 'settings_inventory',
    'settingsProduct': 'settings_product',
    'settingsBrand': 'settings_brand',
    'settingsCombokit': 'settings_combokit',
    'settingsCombokitOverview': 'settings_combokit_overview', // Check if key matches seed
    'settingsOrderProcurement': 'settings_order_procurement',
    'settingsFranchisee': 'settings_franchisee',
    'settingsDealer': 'settings_dealer',
    'settingsHrms': 'settings_hrms',
    'settingsProject': 'settings_project',
    'settingsQuote': 'settings_quote',
    'reports': 'reports'
  };

  const hasAccess = (sectionId) => {
    // 1. Admin always has access
    if (user?.role === 'admin') return true;

    // 2. Check if section has a mapped module
    const moduleKey = moduleMapping[sectionId];
    if (!moduleKey) return true; // Default allow if not mapped (e.g. Dashboard)

    // 3. Check Department Modules (Own + Delegated)
    const assignedModules = user?.department?.assignedModules || [];

    // Flatten modules from delegated departments
    const delegatedModules = user?.delegatedDepartments?.flatMap(dept => dept.assignedModules || []) || [];

    const allModules = [...assignedModules, ...delegatedModules];

    const hasModule = allModules.some(m =>
      m.module?.key === moduleKey && m.status === 'active'
    );

    return hasModule;
  };

  const [expandedSections, setExpandedSections] = useState({
    dashboard: false,
    userPerformance: false,
    departments: false,
    operations: false,
    settings: false,
    reports: false,
    // Settings nested groups
    settingsLocation: false,
    settingsHr: false,
    settingsVendor: false,
    settingsSales: false,
    settingsMarketing: false,
    settingsDelivery: false,
    settingsInstaller: false,
    settingsInventory: false,
    settingsProduct: false,
    settingsBrand: false,
    settingsCombokit: false,
    settingsCombokitOverview: false,
    settingsOrderProcurement: false,
    settingsFranchisee: false,
    settingsDealer: false,
    settingsHrms: false,
    settingsProject: false,
    settingsQuote: false,
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Seven main sections as per requirements
  const mainSections = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: LayoutDashboard,
      isExpanded: expandedSections.dashboard,
      children: [
        {
          id: 'userPerformance',
          name: 'User Performance',
          icon: BarChart3,
          isGroup: true,
          isExpanded: expandedSections.userPerformance,
          children: [
            { name: '- Franchise Manager Dashboard', href: '/admin/dashboard/user-performance/franchise-manager', icon: UserCog },
            { name: '- Franchise Dashboard', href: '/admin/dashboard/user-performance/franchise', icon: Building },
            { name: '- Dealer Manager Dashboard', href: '/admin/dashboard/user-performance/dealer-manager', icon: UserCheck },
            { name: '- Dealer Dashboard', href: '/admin/dashboard/user-performance/dealer', icon: StoreIcon },
          ]
        },
        { name: 'Orders', icon: ShoppingCart, href: '/admin/dashboard/orders' },
        { name: 'Orders by Loan', icon: FileBarChart, href: '/admin/dashboard/orders-by-loan' },
        { name: 'Installer', icon: Users, href: '/admin/dashboard/installer' },
        { name: 'Delivery', icon: Truck, href: '/admin/dashboard/delivery' },
        { name: 'Inventory', icon: Package, href: '/admin/dashboard' },
        { name: 'Vendors', icon: Store, href: '/admin/dashboard/vendors' },
      ]
    },
    {
      id: 'departments',
      name: 'Departments',
      icon: Building2,
      isExpanded: expandedSections.departments,
      children: [
        {
          name: 'Organization chart',
          icon: Users,
          href: '/admin/departments/organization-chart',
        },
      ],
    },
    { id: 'approvals', name: 'Approvals', icon: CheckCircle2, href: '/admin/approvals' },
    { id: 'project-management', name: 'Project Management', icon: BriefcaseBusiness, href: '/admin/project-management' },
    {
      id: 'operations',
      name: 'Operations',
      icon: Workflow,
      isExpanded: expandedSections.operations,
      children: [
        { name: 'Our Warehouse', icon: Building, href: '/admin/operations/warehouse' },
        { name: 'Add Inventory', icon: Package, href: '/admin/operations/add-inventory' },
        {
          name: 'Inventory Management',
          icon: Store,
          href: '/admin/operations/inventory-management',
        },
      ],
    },
    {
      id: 'settings',
      name: 'Settings',
      icon: Settings,
      isExpanded: expandedSections.settings,
      children: [
        {
          id: 'settingsLocation',
          name: 'Location Settings',
          icon: MapPin,
          isGroup: true,
          isExpanded: expandedSections.settingsLocation,
          children: [
            { name: '- Setup Locations', href: '/admin/settings/location/setup-locations', icon: MapPin },
          ],
        },
        {
          id: 'settingsHr',
          name: 'HR Settings',
          icon: UserCog,
          isGroup: true,
          isExpanded: expandedSections.settingsHr,
          children: [
            { name: '- Role Settings', href: '/admin/settings/hr/role-settings', icon: UserCog },
            { name: '- Create Department', href: '/admin/settings/hr/create-department', icon: Building2 },

            { name: '- Department-wise Modules', href: '/admin/settings/hr/department-wise-modules', icon: LayoutDashboard },
            { name: '- Temporary Incharge Setting', href: '/admin/settings/hr/temporary-incharge-setting', icon: Users },
          ],
        },
        {
          id: 'settingsVendor',
          name: 'Vendor Settings',
          icon: Store,
          isGroup: true,
          isExpanded: expandedSections.settingsVendor,
          children: [
            { name: '- Installer Vendors', href: '/admin/settings/vendor/installer-vendors', icon: Users },
            { name: '- Supplier Type', href: '/admin/settings/vendor/supplier-type', icon: LayoutDashboard },
            { name: '- Supplier Vendors', href: '/admin/settings/vendor/supplier-vendors', icon: StoreIcon },
          ],
        },
        {
          id: 'settingsSales',
          name: 'Sales Settings',
          icon: TrendingUp,
          isGroup: true,
          isExpanded: expandedSections.settingsSales,
          children: [
            { name: '- Set Price', href: '/admin/settings/sales/set-price', icon: FileBarChart },
            { name: '- Set Price For AMC', href: '/admin/settings/sales/set-price-amc', icon: FileBarChart },
            { name: '- Offers', href: '/admin/settings/sales/offers', icon: FileText },
            { name: '- Solar Panel Bundle Setting', href: '/admin/settings/sales/solar-panel-bundle-setting', icon: Package },
          ],
        },
        {
          id: 'settingsMarketing',
          name: 'Marketing Settings',
          icon: BriefcaseBusiness,
          isGroup: true,
          isExpanded: expandedSections.settingsMarketing,
          children: [
            { name: '- Campaign Management', href: '/admin/settings/marketing/campaign-management', icon: BriefcaseBusiness },
          ],
        },
        {
          id: 'settingsDelivery',
          name: 'Delivery Settings',
          icon: Truck,
          isGroup: true,
          isExpanded: expandedSections.settingsDelivery,
          children: [
            { name: '- Delivery Type', href: '/admin/settings/delivery/delivery-type', icon: Truck },
            { name: '- Delivery Benchmark Price', href: '/admin/settings/delivery/benchmark-price', icon: FileBarChart },
            { name: '- Vehicle Selection', href: '/admin/settings/delivery/vehicle-selection', icon: Truck },
            { name: '- Vendor Delivery Plan', href: '/admin/settings/delivery/vendor-delivery-plan', icon: StoreIcon },
          ],
        },
        {
          id: 'settingsInstaller',
          name: 'Installer Settings',
          icon: Users,
          isGroup: true,
          isExpanded: expandedSections.settingsInstaller,
          children: [
            { name: '- Solar Installer', href: '/admin/settings/installer/solar-installer', icon: Users },
            { name: '- Installer Tool Requirements', href: '/admin/settings/installer/tool-requirements', icon: Wrench },
            { name: '- Rating Setting', href: '/admin/settings/installer/rating-setting', icon: FileBarChart },
            { name: '- Installer Agency Plans', href: '/admin/settings/installer/agency-plans', icon: FileText },
          ],
        },
        {
          id: 'settingsInventory',
          name: 'Inventory Management',
          icon: Package,
          isGroup: true,
          isExpanded: expandedSections.settingsInventory,
          children: [
            { name: '- Inventory Overview', href: '/admin/settings/inventory/inventory-overview', icon: Package },
            { name: '- Inventory Level Management', href: '/admin/settings/inventory/level-management-setting', icon: FileBarChart },
            { name: '- Restock Order Limit', href: '/admin/settings/inventory/restock-order-limit', icon: ClipboardList },
            { name: '- Combokit Brand Overview', href: '/admin/settings/inventory/combokit-brand-overview', icon: StoreIcon },
          ],
        },
        {
          id: 'settingsProduct',
          name: 'Product Configuration',
          icon: LayoutDashboard,
          isGroup: true,
          isExpanded: expandedSections.settingsProduct,
          children: [
            { name: '- Add Project Type', href: '/admin/settings/product/add-project-type', icon: LayoutDashboard },
            { name: '- Add Project Category', href: '/admin/settings/product/add-project-category', icon: LayoutDashboard },
            { name: '- Add Product', href: '/admin/settings/product/add-product', icon: Package },
            { name: '- SKU', href: '/admin/settings/product/sku', icon: FileText },
            { name: '- Price Master', href: '/admin/settings/product/price-master', icon: FileBarChart },
            { name: '- Add Unit Management', href: '/admin/settings/product/add-unit-management', icon: ClipboardList },
          ],
        },
        {
          id: 'settingsBrand',
          name: 'Brand Manufacturer',
          icon: StoreIcon,
          isGroup: true,
          isExpanded: expandedSections.settingsBrand,
          children: [
            { name: '- Add Brand Manufacturer', href: '/admin/settings/brand/add-brand-manufacturer', icon: StoreIcon },
            { name: '- Brand Supplier Overview', href: '/admin/settings/brand/supplier-overview', icon: FileBarChart },
          ],
        },
        {
          id: 'settingsCombokit',
          name: 'ComboKit',
          icon: Package,
          isGroup: true,
          isExpanded: expandedSections.settingsCombokit,
          children: [
            { name: '- Create Solarkit', href: '/admin/settings/combokit/create-solarkit', icon: Package },
            { name: '- Create AMC', href: '/admin/settings/combokit/create-amc', icon: FileText },
            { name: '- AMC Services', href: '/admin/settings/combokit/amc-services', icon: ClipboardList },
            { name: '- Solarkit Bundle Plans', href: '/admin/settings/combokit/bundle-plans', icon: Package },
            { name: '- Add ComboKit', href: '/admin/settings/combokit/add-combokit', icon: Building },
            { name: '- Customize Combokit', href: '/admin/settings/combokit/customize', icon: LayoutDashboard },
          ],
        },
        {
          id: 'settingsCombokitOverview',
          name: 'Combokit Overview',
          icon: Package,
          isGroup: true,
          isExpanded: expandedSections.settingsCombokitOverview,
          children: [
            { name: '- Combokit Overview', href: '/admin/settings/combokit-overview', icon: Package },
          ],
        },
        {
          id: 'settingsOrderProcurement',
          name: 'Order Procurement',
          icon: ShoppingCart,
          isGroup: true,
          isExpanded: expandedSections.settingsOrderProcurement,
          children: [
            { name: '- Order Procurement', href: '/admin/settings/order-procurement', icon: ShoppingCart },
          ],
        },
        {
          id: 'settingsFranchisee',
          name: 'Franchisee Settings',
          icon: Building,
          isGroup: true,
          isExpanded: expandedSections.settingsFranchisee,
          children: [
            { name: '- Franchisee Plans', href: '/admin/settings/franchisee/plans', icon: LayoutDashboard },
            { name: '- Franchisee Points & Rewards', href: '/admin/settings/franchisee/points-rewards', icon: FileBarChart },
            { name: '- Franchisee Onboarding Goals', href: '/admin/settings/franchisee/onboarding-goals', icon: ClipboardList },
            { name: '- Franchisee Profession Type', href: '/admin/settings/franchisee/profession-type', icon: BriefcaseBusiness },
            { name: '- Order Setting', href: '/admin/settings/franchisee/order-setting', icon: FileText },
          ],
        },
        {
          id: 'settingsDealer',
          name: 'Dealer Settings',
          icon: StoreIcon,
          isGroup: true,
          isExpanded: expandedSections.settingsDealer,
          children: [
            { name: '- Dealer Plans', href: '/admin/settings/dealer/plans', icon: LayoutDashboard },
            { name: '- Dealer Points & Reward Setting', href: '/admin/settings/dealer/points-rewards', icon: FileBarChart },
            { name: '- Dealer Onboarding Goals', href: '/admin/settings/dealer/onboarding-goals', icon: ClipboardList },
            { name: '- Dealer Profession Type', href: '/admin/settings/dealer/profession-type', icon: BriefcaseBusiness },
          ],
        },
        {
          id: 'settingsHrms',
          name: 'HRMS Settings',
          icon: UserCog,
          isGroup: true,
          isExpanded: expandedSections.settingsHrms,
          children: [
            { name: '- HRMS Settings', href: '/admin/settings/hrms/settings', icon: UserCog },
            { name: '- Candidate Test Setting', href: '/admin/settings/hrms/candidate-test-setting', icon: ClipboardList },
            { name: '- Candidate Training Setting', href: '/admin/settings/hrms/candidate-training-setting', icon: ClipboardList },
          ],
        },
        {
          id: 'settingsProject',
          name: 'Project Management Settings',
          icon: BriefcaseBusiness,
          isGroup: true,
          isExpanded: expandedSections.settingsProject,
          children: [
            { name: '- Project Journey Stage Setting', href: '/admin/settings/project/journey-stage-setting', icon: LayoutDashboard },
            { name: '- Project Management Overdue Setting', href: '/admin/settings/project/overdue-setting', icon: ClipboardList },
            { name: '- Project Management Configuration', href: '/admin/settings/project/configuration-setting', icon: FileText },
            { name: '- Project Documentation Setting', href: '/admin/settings/project/documentation-setting', icon: FileText },
            { name: '- Placeholder Name Setting', href: '/admin/settings/project/placeholder-name-setting', icon: FileText },
          ],
        },
        {
          id: 'settingsQuote',
          name: 'Quote',
          icon: FileText,
          isGroup: true,
          isExpanded: expandedSections.settingsQuote,
          children: [
            { name: '- Quote Setting', href: '/admin/settings/quote/quote-setting', icon: FileText },
            { name: '- Survey BOM Setting', href: '/admin/settings/quote/survey-bom-setting', icon: ClipboardList },
            { name: '- Terrace Setting', href: '/admin/settings/quote/terrace-setting', icon: Building2 },
            { name: '- Structure Setting', href: '/admin/settings/quote/structure-setting', icon: Building },
            { name: '- Building Setting', href: '/admin/settings/quote/building-setting', icon: Building },
            { name: '- Discom Master', href: '/admin/settings/quote/discom-master', icon: FileBarChart },

          ],
        },
        { name: 'Approval Overdue Setting', icon: CheckCircle2, href: '/admin/settings/approval-overdue' },
        { name: 'Overdue Task Setting', icon: ClipboardList, href: '/admin/settings/overdue-task' },
        { name: 'Overdue Status Setting', icon: ClipboardList, href: '/admin/settings/overdue-status' },
        { name: 'Franchisee Manager Setting', icon: BriefcaseBusiness, href: '/admin/settings/franchisee-manager' },
        { name: 'Franchise Buy Lead Setting', icon: BriefcaseBusiness, href: '/admin/settings/franchise-buy-lead' },
        { name: 'Loan Setting', icon: FileBarChart, href: '/admin/settings/loan' },
        { name: 'Checklist Setting', icon: ClipboardList, href: '/admin/settings/checklist' },
      ],
    },
    {
      id: 'reports',
      name: 'Report',
      icon: FileText,
      isExpanded: expandedSections.reports,
      children: [
        { name: 'Financial & P&L', icon: FileBarChart, href: '/admin/reports/financial-pl' },
        { name: 'Cashflow', icon: FileBarChart, href: '/admin/reports/cashflow' },
        { name: 'Inventory', icon: Package, href: '/admin/reports/inventory' },
        {
          name: 'Loans',
          icon: FileBarChart,
          href: '/admin/reports/loans-summary',
        },
        { name: 'Captable', icon: FileBarChart, href: '/admin/reports/captable' },
        { name: 'Revenue By CP Types', icon: FileBarChart, href: '/admin/reports/revenue-by-cp-types' },
        { name: 'Cluster', icon: FileBarChart, href: '/admin/reports/cluster' },
        { name: 'District', icon: FileBarChart, href: '/admin/reports/district' },
        { name: 'City', icon: FileBarChart, href: '/admin/reports/city' },
      ],
    },
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-40 p-2 bg-white rounded-lg shadow-md lg:hidden"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside
        className={`${isOpen ? 'w-64' : 'w-0'
          } bg-gray-900 text-white transition-all duration-300 overflow-hidden flex flex-col lg:w-64`}
      >
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Home size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold">SOLARKITS</h1>
              <p className="text-xs text-gray-400">ERP System</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          {mainSections.filter(section => hasAccess(section.id)).map((section) => (
            <div key={section.id} className="mb-1">
              {/* Main Section Header */}
              {section.children ? (
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-800 rounded-lg transition mx-2"
                >
                  <div className="flex items-center space-x-3">
                    <section.icon size={20} />
                    <span className="font-medium">{section.name}</span>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`transform transition ${section.isExpanded ? 'rotate-180' : ''
                      }`}
                  />
                </button>
              ) : (
                <Link
                  to={section.href}
                  className="block px-4 py-3 mx-2 hover:bg-gray-800 rounded-lg transition flex items-center space-x-3"
                >
                  <section.icon size={20} />
                  <span className="font-medium">{section.name}</span>
                </Link>
              )}

              {/* Children Sections */}
              {section.children && section.isExpanded && (
                <div className="mt-1 ml-6">
                  {section.children.filter(child => hasAccess(child.id)).map((child, index) => {
                    if (child.isGroup) {
                      return (
                        <div key={child.id} className="mt-2">
                          <button
                            onClick={() => toggleSection(child.id)}
                            className="w-full flex items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-800 rounded-lg transition"
                          >
                            <div className="flex items-center space-x-2">
                              <child.icon size={16} />
                              <span>{child.name}</span>
                            </div>
                            <ChevronRight
                              size={14}
                              className={`transform transition ${child.isExpanded ? 'rotate-90' : ''
                                }`}
                            />
                          </button>

                          {/* Sub-children of nested groups */}
                          {child.isExpanded && child.children && (
                            <div className="ml-4 mt-1 space-y-1 border-l border-gray-700 pl-2">
                              {child.children.map((subChild) => (
                                <Link
                                  key={subChild.href}
                                  to={subChild.href}
                                  className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition"
                                >
                                  {subChild.icon && <subChild.icon size={14} />}
                                  <span>{subChild.name}</span>
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={child.href || child.name}
                        to={child.href}
                        className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-200 hover:text-white hover:bg-gray-800 rounded-lg transition"
                      >
                        {child.icon && <child.icon size={16} />}
                        <span>{child.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}