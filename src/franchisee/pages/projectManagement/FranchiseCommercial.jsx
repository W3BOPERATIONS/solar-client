import React, { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import {
    MapPin,
    BarChart3,
    Users,
    DollarSign,
    Calendar,
    TrendingUp,
    Activity,
    Settings,
    LogOut,
    Menu,
    X,
    Home,
    Briefcase,
    FileText,
    MessageSquare
} from 'lucide-react';

const FranchiseCommercialProjectManagement = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Sample data for charts (customize based on your actual data)
    const projectProgressData = {
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
            colors: ['#3B82F6', '#10B981'],
            dataLabels: {
                enabled: false
            },
            stroke: {
                curve: 'smooth',
                width: 3
            },
            title: {
                text: 'Project Progress',
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
                categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
                title: {
                    text: 'Month'
                }
            },
            yaxis: {
                title: {
                    text: 'Projects Count'
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
                name: 'Completed Projects',
                data: [30, 40, 35, 50, 49, 60, 70]
            },
            {
                name: 'Ongoing Projects',
                data: [20, 35, 45, 40, 55, 65, 75]
            }
        ]
    };

    const revenueChartData = {
        options: {
            chart: {
                type: 'bar',
                toolbar: {
                    show: true
                }
            },
            colors: ['#F59E0B'],
            plotOptions: {
                bar: {
                    horizontal: false,
                    columnWidth: '55%',
                    borderRadius: 5
                }
            },
            dataLabels: {
                enabled: false
            },
            title: {
                text: 'Monthly Revenue',
                align: 'left',
                style: {
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#263238'
                }
            },
            xaxis: {
                categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
            },
            yaxis: {
                title: {
                    text: 'Revenue ($)'
                }
            },
            fill: {
                opacity: 1
            },
            tooltip: {
                y: {
                    formatter: function (val) {
                        return "$ " + val + " thousands"
                    }
                }
            }
        },
        series: [{
            name: 'Revenue',
            data: [45, 52, 38, 45, 69, 75, 85]
        }]
    };

    const projectStatusData = {
        options: {
            chart: {
                type: 'donut',
            },
            labels: ['Completed', 'In Progress', 'On Hold', 'Cancelled'],
            colors: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'],
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
                text: 'Project Status Distribution',
                align: 'left',
                style: {
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#263238'
                }
            }
        },
        series: [44, 55, 13, 8]
    };

    // Map View Component (you can replace with actual map integration like Google Maps or Leaflet)
    const MapView = () => (
        <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
            <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                <div className="text-center">
                    <MapPin className="w-12 h-12 text-blue-500 mx-auto mb-2" />
                    <p className="text-gray-600 text-sm">Map View - Project Locations</p>
                    <p className="text-gray-500 text-xs mt-1">(Integrate with Google Maps or Leaflet)</p>
                    {/* Add your preferred map integration here */}
                </div>
            </div>
            {/* Sample grid overlay to mimic map */}
            <div className="absolute inset-0 grid grid-cols-6 grid-rows-4">
                {[...Array(24)].map((_, i) => (
                    <div key={i} className="border border-gray-300 border-opacity-30"></div>
                ))}
            </div>
        </div>
    );

    // Stats Cards
    const StatCard = ({ icon: Icon, title, value, change, bgColor }) => (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-500 text-sm font-medium">{title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
                    {change && (
                        <p className="text-sm text-green-600 mt-2">
                            <TrendingUp className="inline w-4 h-4 mr-1" />
                            {change} from last month
                        </p>
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
        <nav className="bg-white shadow-sm border-b border-gray-200">
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
                            <span className="text-xl font-bold text-gray-800">SolarKit CRM</span>
                        </div>
                        <div className="hidden lg:ml-6 lg:flex lg:space-x-8">
                            <a href="#" className="border-blue-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                Dashboard
                            </a>
                            <a href="#" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                Projects
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
                            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">{role}</span>
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
            {/* Mobile sidebar backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
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
                            <a href="#" className="bg-blue-50 text-blue-700 group flex items-center px-2 py-2 text-sm font-medium rounded-md">
                                <Home className="mr-3 h-5 w-5 text-blue-500" />
                                Dashboard
                            </a>
                            <a href="#" className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md">
                                <Briefcase className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                                Projects
                            </a>
                            <a href="#" className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md">
                                <FileText className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                                Commercial
                            </a>
                            <a href="#" className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md">
                                <MessageSquare className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                                Messages
                            </a>
                            <a href="#" className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md">
                                <Calendar className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                                Calendar
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

    // Header Component (replaces Allheaders function)
    const Header = () => (
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-6 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold">Commercial Project Management</h1>
                <p className="mt-2 text-blue-100">Manage and track all commercial solar projects</p>
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

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <Header />

            {/* Navigation Bar */}
            <NavigationBar username="Yash" role="franchisee" />

            <div className="flex relative">
                {/* Sidebar */}
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

                {/* Main Content */}
                <main className="flex-1 overflow-x-hidden">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <StatCard
                                icon={Briefcase}
                                title="Total Projects"
                                value="156"
                                change="+12%"
                                bgColor="bg-blue-500"
                            />
                            <StatCard
                                icon={DollarSign}
                                title="Total Revenue"
                                value="$2.4M"
                                change="+8%"
                                bgColor="bg-green-500"
                            />
                            <StatCard
                                icon={Users}
                                title="Active Clients"
                                value="48"
                                change="+5%"
                                bgColor="bg-purple-500"
                            />
                            <StatCard
                                icon={Activity}
                                title="Completion Rate"
                                value="94%"
                                change="+3%"
                                bgColor="bg-orange-500"
                            />
                        </div>

                        {/* Map View - Replacing the map from PHP */}
                        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <MapPin className="w-5 h-5 mr-2 text-blue-500" />
                                Project Locations Map
                            </h2>
                            <MapView />
                        </div>

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            {/* Line Chart */}
                            <div className="bg-white rounded-lg shadow-md p-4">
                                <Chart
                                    options={projectProgressData.options}
                                    series={projectProgressData.series}
                                    type="line"
                                    height={350}
                                />
                            </div>

                            {/* Bar Chart */}
                            <div className="bg-white rounded-lg shadow-md p-4">
                                <Chart
                                    options={revenueChartData.options}
                                    series={revenueChartData.series}
                                    type="bar"
                                    height={350}
                                />
                            </div>
                        </div>

                        {/* Donut Chart and Additional Info */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                            <div className="lg:col-span-1">
                                <div className="bg-white rounded-lg shadow-md p-4">
                                    <Chart
                                        options={projectStatusData.options}
                                        series={projectStatusData.series}
                                        type="donut"
                                        height={350}
                                    />
                                </div>
                            </div>

                            {/* Additional Info Cards */}
                            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="bg-white rounded-lg shadow-md p-6">
                                    <h3 className="text-md font-semibold text-gray-900 mb-3">Recent Projects</h3>
                                    <ul className="space-y-3">
                                        {[1, 2, 3].map((item) => (
                                            <li key={item} className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600">Solar Installation #{item}</span>
                                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">In Progress</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="bg-white rounded-lg shadow-md p-6">
                                    <h3 className="text-md font-semibold text-gray-900 mb-3">Upcoming Deadlines</h3>
                                    <ul className="space-y-3">
                                        {[1, 2, 3].map((item) => (
                                            <li key={item} className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600">Project #{item}</span>
                                                <span className="text-xs text-gray-500">Due in {item * 2} days</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Commercial Project Management Component (replacing the included PHP component) */}
                        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Commercial Projects</h2>
                            {/* Add your commercial project management content here */}
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {[1, 2, 3, 4, 5].map((item) => (
                                            <tr key={item}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Commercial Solar {item}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Client {item}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                        Active
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item * 50}k</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2024-0{item}-30</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default FranchiseCommercialProjectManagement;