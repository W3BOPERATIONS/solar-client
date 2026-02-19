import React, { useState } from 'react';
import Chart from 'react-apexcharts';
import {
    Home,
    Users,
    DollarSign,
    Calendar,
    TrendingUp,
    Activity,
    Settings,
    LogOut,
    Menu,
    X,
    Briefcase,
    FileText,
    MessageSquare,
    MapPin,
    Sun,
    Battery,
    Zap,
    CheckCircle,
    Clock,
    AlertCircle
} from 'lucide-react';

const FranchiseResidentialProjectManagement = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Project Progress Chart Data
    const installationProgressData = {
        options: {
            chart: {
                type: 'line',
                toolbar: {
                    show: true
                },
                zoom: {
                    enabled: true
                }
            },
            colors: ['#F59E0B', '#10B981', '#3B82F6'],
            dataLabels: {
                enabled: false
            },
            stroke: {
                curve: 'smooth',
                width: 3
            },
            title: {
                text: 'Residential Installation Progress',
                align: 'left',
                style: {
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#263238'
                }
            },
            grid: {
                borderColor: '#e7e7e7',
                row: {
                    colors: ['#f3f3f3', 'transparent'],
                    opacity: 0.5
                }
            },
            markers: {
                size: 5
            },
            xaxis: {
                categories: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'],
                title: {
                    text: 'Timeline'
                }
            },
            yaxis: {
                title: {
                    text: 'Installations'
                },
                min: 0
            },
            legend: {
                position: 'top',
                horizontalAlign: 'right',
                floating: true,
                offsetY: -25,
                offsetX: -5
            },
            responsive: [{
                breakpoint: 600,
                options: {
                    chart: {
                        toolbar: {
                            show: false
                        }
                    },
                    legend: {
                        show: false
                    }
                }
            }]
        },
        series: [
            {
                name: 'Completed',
                data: [15, 25, 35, 45, 55, 70, 85, 100]
            },
            {
                name: 'In Progress',
                data: [25, 30, 40, 35, 30, 25, 20, 15]
            },
            {
                name: 'Scheduled',
                data: [40, 35, 25, 20, 15, 5, 0, 0]
            }
        ]
    };

    // System Size Distribution Chart
    const systemSizeData = {
        options: {
            chart: {
                type: 'bar',
                toolbar: {
                    show: true
                },
                stacked: true
            },
            colors: ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6'],
            plotOptions: {
                bar: {
                    horizontal: false,
                    columnWidth: '60%',
                    borderRadius: 4
                }
            },
            dataLabels: {
                enabled: false
            },
            title: {
                text: 'System Size Distribution (kW)',
                align: 'left',
                style: {
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#263238'
                }
            },
            xaxis: {
                categories: ['3kW', '5kW', '7kW', '10kW', '15kW'],
            },
            yaxis: {
                title: {
                    text: 'Number of Installations'
                }
            },
            fill: {
                opacity: 1
            },
            tooltip: {
                y: {
                    formatter: function (val) {
                        return val + " installations"
                    }
                }
            },
            legend: {
                position: 'top'
            }
        },
        series: [
            {
                name: 'Completed',
                data: [45, 52, 38, 25, 15]
            },
            {
                name: 'In Progress',
                data: [15, 20, 18, 12, 8]
            }
        ]
    };

    // Project Status Chart
    const projectStatusData = {
        options: {
            chart: {
                type: 'donut',
            },
            labels: ['Completed', 'In Progress', 'Scheduled', 'Delayed', 'On Hold'],
            colors: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#9CA3AF'],
            legend: {
                position: 'bottom'
            },
            responsive: [{
                breakpoint: 480,
                options: {
                    chart: {
                        width: 200
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }],
            title: {
                text: 'Project Status Overview',
                align: 'left',
                style: {
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#263238'
                }
            },
            plotOptions: {
                pie: {
                    donut: {
                        size: '70%',
                        labels: {
                            show: true,
                            total: {
                                show: true,
                                label: 'Total',
                                formatter: function () {
                                    return '245'
                                }
                            }
                        }
                    }
                }
            }
        },
        series: [98, 65, 42, 18, 22]
    };

    // Map View Component for Residential Locations
    const ResidentialMapView = () => (
        <div className="relative w-full h-72 bg-gray-100 rounded-lg overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <MapPin className="w-12 h-12 text-orange-500 mx-auto mb-2" />
                    <p className="text-gray-700 font-medium">Residential Project Locations</p>
                    <p className="text-gray-500 text-sm mt-1">245 Active Installations Across the Region</p>
                    <div className="flex justify-center gap-4 mt-4">
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                            <span className="text-xs text-gray-600">Completed</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                            <span className="text-xs text-gray-600">In Progress</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                            <span className="text-xs text-gray-600">Scheduled</span>
                        </div>
                    </div>
                </div>
            </div>
            {/* Sample map markers grid */}
            <div className="absolute inset-0">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="absolute" style={{ top: `${20 + i * 15}%`, left: `${15 + i * 18}%` }}>
                        <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                ))}
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="absolute" style={{ top: `${25 + i * 12}%`, left: `${65 + i * 8}%` }}>
                        <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
                    </div>
                ))}
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="absolute" style={{ top: `${45 + i * 10}%`, left: `${35 + i * 15}%` }}>
                        <div className="w-4 h-4 bg-orange-500 rounded-full animate-pulse"></div>
                    </div>
                ))}
            </div>
        </div>
    );

    // Stats Card Component
    const StatCard = ({ icon: Icon, title, value, change, bgColor, subtext }) => (
        <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-500 text-sm font-medium">{title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
                    {change && (
                        <p className="text-sm text-green-600 mt-2 flex items-center">
                            <TrendingUp className="inline w-4 h-4 mr-1" />
                            {change}
                        </p>
                    )}
                    {subtext && (
                        <p className="text-xs text-gray-500 mt-1">{subtext}</p>
                    )}
                </div>
                <div className={`${bgColor} p-3 rounded-full`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
            </div>
        </div>
    );

    // Navigation Bar Component
    const NavigationBar = ({ username, role }) => (
        <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
                        >
                            <Menu className="h-6 w-6" />
                        </button>
                        <div className="flex-shrink-0 flex items-center">
                            <Sun className="h-8 w-8 text-orange-500 mr-2" />
                            <span className="text-xl font-bold text-gray-800">SolarKit CRM</span>
                        </div>
                        <div className="hidden lg:ml-6 lg:flex lg:space-x-8">
                            <a href="#" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                Dashboard
                            </a>
                            <a href="#" className="border-orange-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                Residential Projects
                            </a>
                            <a href="#" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                Commercial
                            </a>
                            <a href="#" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                Reports
                            </a>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <span className="text-sm text-gray-700 mr-2">Welcome, {username}</span>
                            <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">{role}</span>
                        </div>
                        <button className="ml-4 p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none">
                            <Settings className="h-6 w-6" />
                        </button>
                        <button className="ml-2 p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none">
                            <LogOut className="h-6 w-6" />
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );

    // Sidebar Component
    const Sidebar = ({ isOpen, onClose }) => (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
                    onClick={onClose}
                />
            )}

            <div className={`
        fixed inset-y-0 left-0 transform 
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0
        transition duration-200 ease-in-out
        w-64 bg-white border-r border-gray-200 z-30
      `}>
                <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
                        <span className="text-lg font-semibold text-gray-800">Menu</span>
                        <button
                            onClick={onClose}
                            className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                    <nav className="flex-1 overflow-y-auto py-4">
                        <div className="px-2 space-y-1">
                            <a href="#" className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md">
                                <Home className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                                Dashboard
                            </a>
                            <a href="#" className="bg-orange-50 text-orange-700 group flex items-center px-2 py-2 text-sm font-medium rounded-md">
                                <Briefcase className="mr-3 h-5 w-5 text-orange-500" />
                                Residential Projects
                            </a>
                            <a href="#" className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md">
                                <Zap className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                                Commercial
                            </a>
                            <a href="#" className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md">
                                <Users className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                                Customers
                            </a>
                            <a href="#" className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md">
                                <Calendar className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                                Schedule
                            </a>
                            <a href="#" className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md">
                                <FileText className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                                Documents
                            </a>
                            <a href="#" className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md">
                                <MessageSquare className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                                Messages
                            </a>
                            <a href="#" className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md">
                                <Activity className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                                Analytics
                            </a>
                        </div>
                    </nav>
                </div>
            </div>
        </>
    );

    // Header Component
    const Header = () => (
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-6 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center">
                    <Home className="h-8 w-8 mr-3" />
                    <div>
                        <h1 className="text-3xl font-bold">Residential Project Management</h1>
                        <p className="mt-2 text-orange-100">Track and manage all residential solar installation projects</p>
                    </div>
                </div>
            </div>
        </div>
    );

    // Footer Component
    const Footer = () => (
        <footer className="bg-white border-t border-gray-200 py-4 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <p className="text-center text-sm text-gray-500">
                    © {new Date().getFullYear()} SolarKit CRM. All rights reserved.
                </p>
            </div>
        </footer>
    );

    // Status Badge Component
    const StatusBadge = ({ status }) => {
        const statusConfig = {
            'completed': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
            'in-progress': { color: 'bg-blue-100 text-blue-800', icon: Clock },
            'scheduled': { color: 'bg-orange-100 text-orange-800', icon: Calendar },
            'delayed': { color: 'bg-red-100 text-red-800', icon: AlertCircle },
            'on-hold': { color: 'bg-gray-100 text-gray-800', icon: AlertCircle }
        };

        const config = statusConfig[status] || statusConfig['on-hold'];
        const Icon = config.icon;

        return (
            <span className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${config.color}`}>
                <Icon className="w-3 h-3 mr-1" />
                {status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <NavigationBar username="Yash" role="franchisee" />

            <div className="flex relative">
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

                <main className="flex-1 overflow-x-hidden">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <StatCard
                                icon={Home}
                                title="Total Residential Projects"
                                value="245"
                                change="+18 this month"
                                bgColor="bg-orange-500"
                                subtext="Active installations"
                            />
                            <StatCard
                                icon={Sun}
                                title="Total Capacity"
                                value="1.85 MW"
                                change="+125 kW"
                                bgColor="bg-yellow-500"
                                subtext="Installed"
                            />
                            <StatCard
                                icon={Users}
                                title="Active Customers"
                                value="189"
                                change="+12%"
                                bgColor="bg-green-500"
                                subtext="With ongoing projects"
                            />
                            <StatCard
                                icon={Battery}
                                title="Battery Storage"
                                value="78"
                                change="+15"
                                bgColor="bg-purple-500"
                                subtext="Systems installed"
                            />
                        </div>

                        {/* Map View */}
                        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <MapPin className="w-5 h-5 mr-2 text-orange-500" />
                                Residential Project Locations
                            </h2>
                            <ResidentialMapView />
                        </div>

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            {/* Installation Progress Chart */}
                            <div className="bg-white rounded-xl shadow-md p-4">
                                <Chart
                                    options={installationProgressData.options}
                                    series={installationProgressData.series}
                                    type="line"
                                    height={350}
                                />
                            </div>

                            {/* System Size Distribution Chart */}
                            <div className="bg-white rounded-xl shadow-md p-4">
                                <Chart
                                    options={systemSizeData.options}
                                    series={systemSizeData.series}
                                    type="bar"
                                    height={350}
                                />
                            </div>
                        </div>

                        {/* Project Status and Recent Activity */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                            {/* Donut Chart */}
                            <div className="lg:col-span-1">
                                <div className="bg-white rounded-xl shadow-md p-4">
                                    <Chart
                                        options={projectStatusData.options}
                                        series={projectStatusData.series}
                                        type="donut"
                                        height={350}
                                    />
                                </div>
                            </div>

                            {/* Recent Installations */}
                            <div className="lg:col-span-2 grid grid-cols-1 gap-6">
                                <div className="bg-white rounded-xl shadow-md p-6">
                                    <h3 className="text-md font-semibold text-gray-900 mb-4">Recent Installations</h3>
                                    <div className="space-y-4">
                                        {[
                                            { name: 'Patel Residence', address: '123 Green St', system: '7kW', status: 'completed', date: '2024-02-15' },
                                            { name: 'Sharma Home', address: '456 Solar Ave', system: '5kW', status: 'in-progress', date: '2024-02-14' },
                                            { name: 'Kumar Villa', address: '789 Sun Blvd', system: '10kW', status: 'scheduled', date: '2024-02-20' },
                                            { name: 'Singh House', address: '321 Energy Ln', system: '3kW', status: 'delayed', date: '2024-02-10' },
                                        ].map((project, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div>
                                                    <p className="font-medium text-gray-900">{project.name}</p>
                                                    <p className="text-sm text-gray-500">{project.address}</p>
                                                    <p className="text-xs text-gray-400 mt-1">System: {project.system}</p>
                                                </div>
                                                <div className="text-right">
                                                    <StatusBadge status={project.status} />
                                                    <p className="text-xs text-gray-400 mt-2">{project.date}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Residential Projects Table */}
                        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-900">All Residential Projects</h2>
                                <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                    + New Project
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project ID</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">System Size</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Est. Completion</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {[
                                            { id: 'RES-001', customer: 'Rajesh Patel', system: '7kW', status: 'completed', start: '2024-01-05', end: '2024-01-20', value: '$8,500' },
                                            { id: 'RES-002', customer: 'Priya Sharma', system: '5kW', status: 'in-progress', start: '2024-02-01', end: '2024-02-20', value: '$6,200' },
                                            { id: 'RES-003', customer: 'Amit Kumar', system: '10kW', status: 'scheduled', start: '2024-02-25', end: '2024-03-15', value: '$12,500' },
                                            { id: 'RES-004', customer: 'Neha Singh', system: '3kW', status: 'delayed', start: '2024-01-15', end: '2024-02-05', value: '$4,200' },
                                            { id: 'RES-005', customer: 'Vikram Mehta', system: '15kW', status: 'in-progress', start: '2024-02-10', end: '2024-03-10', value: '$18,000' },
                                            { id: 'RES-006', customer: 'Anita Desai', system: '7kW', status: 'on-hold', start: '2024-01-20', end: '2024-02-15', value: '$8,500' },
                                            { id: 'RES-007', customer: 'Suresh Reddy', system: '5kW', status: 'completed', start: '2024-01-10', end: '2024-01-25', value: '$6,200' },
                                            { id: 'RES-008', customer: 'Deepa Nair', system: '10kW', status: 'scheduled', start: '2024-03-01', end: '2024-03-20', value: '$12,500' },
                                        ].map((project, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{project.id}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{project.customer}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{project.system}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <StatusBadge status={project.status} />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{project.start}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{project.end}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{project.value}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <button className="text-orange-600 hover:text-orange-900 mr-3">View</button>
                                                    <button className="text-blue-600 hover:text-blue-900">Edit</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="flex items-center justify-between mt-4">
                                <div className="text-sm text-gray-500">
                                    Showing 1 to 8 of 20 entries
                                </div>
                                <div className="flex space-x-2">
                                    <button className="px-3 py-1 border rounded-md text-sm text-gray-600 hover:bg-gray-50">Previous</button>
                                    <button className="px-3 py-1 border rounded-md text-sm bg-orange-500 text-white hover:bg-orange-600">1</button>
                                    <button className="px-3 py-1 border rounded-md text-sm text-gray-600 hover:bg-gray-50">2</button>
                                    <button className="px-3 py-1 border rounded-md text-sm text-gray-600 hover:bg-gray-50">3</button>
                                    <button className="px-3 py-1 border rounded-md text-sm text-gray-600 hover:bg-gray-50">Next</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            <Footer />
        </div>
    );
};

export default FranchiseResidentialProjectManagement;