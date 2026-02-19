'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { orderAPI } from '../../../api/api';
import salesSettingsService from '../../services/salesSettingsService'; // Import new service
import Chart from 'react-apexcharts';
import {
  Package,
  ShoppingBag,
  IndianRupee,
  AlertCircle,
  MapPin,
  Filter,
  Calendar,
  TrendingUp,
  PieChart,
  BarChart3,
  Users,
  Percent,
  Layers
} from 'lucide-react';
import { useLocations } from '../../../hooks/useLocations';

function Badge({ tone = 'gray', children }) {
  const map = {
    green: 'bg-green-100 text-green-800 border-green-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    gray: 'bg-gray-100 text-gray-800 border-gray-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    primary: 'bg-blue-100 text-blue-800 border-blue-200',
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    danger: 'bg-red-100 text-red-800 border-red-200',
    secondary: 'bg-gray-100 text-gray-800 border-gray-200',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md border text-xs font-semibold ${map[tone] || map.gray}`}>
      {children}
    </span>
  );
}

export default function OrdersDashboard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [orders, setOrders] = useState([]);

  // Sales Settings Stats State
  const [salesStats, setSalesStats] = useState({
    activeOffers: 0,
    marginStats: [],
    bundleStats: [],
    amcRevenuePotential: 0
  });

  const { countries, states, districts, clusters, fetchStates, fetchDistricts, fetchClusters } = useLocations();

  const [filters, setFilters] = useState({
    country: '',
    state: '',
    district: '',
    cluster: '',
    timeline: '',
    quarter: '',
    category: '',
    subCategory: '',
    projectType: '',
    subType: '',
  });

  // Fetch states when country changes
  useEffect(() => {
    if (filters.country) {
      fetchStates({ countryId: filters.country });
    } else {
      // reset dependent lists
      fetchStates({ countryId: undefined });
    }
  }, [filters.country]);

  // Fetch districts when state changes
  useEffect(() => {
    if (filters.state) {
      fetchDistricts({ stateId: filters.state, countryId: filters.country });
    }
  }, [filters.state, filters.country]);

  // Fetch clusters when district changes
  useEffect(() => {
    if (filters.district) {
      fetchClusters({ districtId: filters.district });
    }
  }, [filters.district]);

  const selectedNames = useMemo(() => {
    const countryName = countries.find((c) => c._id === filters.country)?.name;
    const stateName = states.find((s) => s._id === filters.state)?.name;
    const districtName = districts.find((d) => d._id === filters.district)?.name;
    const clusterName = clusters.find((c) => c._id === filters.cluster)?.name;
    return { countryName, stateName, districtName, clusterName };
  }, [countries, states, districts, clusters, filters.country, filters.state, filters.district, filters.cluster]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        // Parallel fetch for Orders and Sales Stats
        const [ordersRes, statsRes] = await Promise.all([
          orderAPI.getAll({}),
          salesSettingsService.getDashboardStats()
        ]);

        setOrders(ordersRes.data.orders || ordersRes.data || []);
        setSalesStats(statsRes); // Set sales stats

      } catch (e) {
        setError(e?.message || 'Failed to load data');
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Calculate Avg Margin
  const avgMargin = salesStats.marginStats.reduce((acc, curr) => acc + curr.avgMargin, 0) / (salesStats.marginStats.length || 1);
  const activeBundles = salesStats.bundleStats.find(s => s._id === 'Active')?.count || 0;

  // Chart configurations
  const ordersChartOptions = {
    series: [44, 55, 41, 17, 16],
    labels: ['Row Material', 'Emp Salary', 'Marketing', 'Biomass', 'Other Expanses'],
    chart: {
      type: 'donut',
      height: 400,
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
    }]
  };

  const salesChartOptions = {
    series: [{
      name: 'Net Profit',
      data: [44, 55, 57, 56, 61, 100, 63, 60, 66],
    },
    {
      name: 'Revenue',
      data: [80, 95, 100, 90, 110, 140, 120, 130, 135]
    }
    ],
    chart: {
      type: 'bar',
      height: 400,
      toolbar: {
        show: false,
      }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '25%',
      },
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      show: true,
      width: 0,
      colors: ['transparent']
    },
    xaxis: {
      categories: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
    },
    yaxis: {
      title: {
        text: '₹ (in crore)'
      }
    },
    fill: {
      opacity: 1
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return "₹ " + val;
        }
      }
    }
  };

  const cpWiseChartOptions = {
    series: [{
      name: 'Orders',
      data: [420, 680, 310]
    }],
    chart: {
      type: 'bar',
      height: 400,
      toolbar: {
        show: false
      }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '10%',
        borderRadius: 5
      }
    },
    dataLabels: {
      enabled: false
    },
    xaxis: {
      categories: ['Starter', 'Enterprise', 'Solar Business'],
      title: {
        text: 'CP Type'
      }
    },
    yaxis: {
      title: {
        text: 'No. of Orders'
      }
    },
    fill: {
      opacity: 1,
      colors: ['#1E90FF']
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return val + " Orders"
        }
      }
    }
  };

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="mb-4">
        <nav className="breadcrumb bg-white p-3 rounded shadow-sm">
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-3">
              <ShoppingBag className="h-6 w-6 text-blue-600" />
              <h3 className="text-xl font-bold text-blue-600 mb-0">Order Dashboard</h3>
            </div>
            <div className="flex space-x-2">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Franchisee Order
              </button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Dealer Order
              </button>
            </div>
          </div>
        </nav>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* ... Filters maintained as is ... */}
        <div className="relative">
          <Filter className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <select
            className="w-full pl-10 p-3 border border-gray-300 rounded-lg bg-white text-sm"
            value={filters.country}
            onChange={(e) => setFilters(p => ({ ...p, country: e.target.value, state: '', district: '', cluster: '' }))}
          >
            <option value="" className="text-gray-400">Select Country</option>
            {countries.map(c => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* State Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <select
            className="w-full pl-10 p-3 border border-gray-300 rounded-lg bg-white text-sm disabled:opacity-50"
            value={filters.state}
            onChange={(e) => setFilters(p => ({ ...p, state: e.target.value, district: '', cluster: '' }))}
            disabled={!filters.country || states.length === 0}
          >
            <option value="" className="text-gray-400">Select State</option>
            {states.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </div>

        {/* District Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <select
            className="w-full pl-10 p-3 border border-gray-300 rounded-lg bg-white text-sm disabled:opacity-50"
            value={filters.district}
            onChange={(e) => setFilters(p => ({ ...p, district: e.target.value, cluster: '' }))}
            disabled={!filters.state || districts.length === 0}
          >
            <option value="" className="text-gray-400">Select District</option>
            {districts.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
        </div>

        {/* Cluster Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <select
            className="w-full pl-10 p-3 border border-gray-300 rounded-lg bg-white text-sm disabled:opacity-50"
            value={filters.cluster}
            onChange={(e) => setFilters(p => ({ ...p, cluster: e.target.value }))}
            disabled={!filters.district || clusters.length === 0}
          >
            <option value="" className="text-gray-400">Select Cluster</option>
            {clusters.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>

        {/* Timeline Filter */}
        <div className="relative">
          <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <select
            className="w-full pl-10 p-3 border border-gray-300 rounded-lg bg-white text-sm"
            value={filters.timeline}
            onChange={(e) => setFilters(p => ({ ...p, timeline: e.target.value }))}
          >
            <option value="" disabled className="text-gray-400">Select Timeline</option>
            <option value="lastweek">Last Week</option>
            <option value="lastmonth">Last Month</option>
          </select>
        </div>

        {/* Quarter Filter */}
        <div className="relative">
          <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <select
            className="w-full pl-10 p-3 border border-gray-300 rounded-lg bg-white text-sm"
            value={filters.quarter}
            onChange={(e) => setFilters(p => ({ ...p, quarter: e.target.value }))}
          >
            <option value="" disabled className="text-gray-400">Select quarter</option>
            <option value="Q1">Q1</option>
            <option value="Q2">Q2</option>
          </select>
        </div>

        {/* Category Filter */}
        <div className="relative">
          <Package className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <select
            className="w-full pl-10 p-3 border border-gray-300 rounded-lg bg-white text-sm"
            value={filters.category}
            onChange={(e) => setFilters(p => ({ ...p, category: e.target.value }))}
          >
            <option value="" disabled className="text-gray-400">Select Category</option>
            <option value="solarpanel">Solar</option>
          </select>
        </div>

        {/* Sub Category Filter */}
        <div className="relative">
          <Package className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <select
            className="w-full pl-10 p-3 border border-gray-300 rounded-lg bg-white text-sm"
            value={filters.subCategory}
            onChange={(e) => setFilters(p => ({ ...p, subCategory: e.target.value }))}
          >
            <option value="" disabled className="text-gray-400">Select Sub Category</option>
            <option value="residential">Residential</option>
          </select>
        </div>

        {/* Project Type */}
        <div className="relative">
          <Package className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <select
            className="w-full pl-10 p-3 border border-gray-300 rounded-lg bg-white text-sm"
            value={filters.projectType}
            onChange={(e) => setFilters(p => ({ ...p, projectType: e.target.value }))}
          >
            <option value="" disabled className="text-gray-400">Select Project Type</option>
            <option value="above3kw">Above 3KW</option>
          </select>
        </div>

        {/* Sub Type */}
        <div className="relative">
          <Package className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <select
            className="w-full pl-10 p-3 border border-gray-300 rounded-lg bg-white text-sm"
            value={filters.subType}
            onChange={(e) => setFilters(p => ({ ...p, subType: e.target.value }))}
          >
            <option value="" disabled>Select Sub Type</option>
            <option>On-Grid</option>
          </select>
        </div>
      </div>

      {/* Filter Badges */}
      <div className="bg-white rounded-lg shadow-sm border-l-4 border-blue-400 mb-4 p-4">
        <div className="flex flex-wrap gap-3">
          {selectedNames.countryName ? <Badge tone="primary">Country: {selectedNames.countryName}</Badge> : null}
          {selectedNames.stateName ? <Badge tone="primary">State: {selectedNames.stateName}</Badge> : null}
          {selectedNames.districtName ? <Badge tone="success">District: {selectedNames.districtName}</Badge> : null}
          {selectedNames.clusterName ? <Badge tone="success">Cluster: {selectedNames.clusterName}</Badge> : null}
        </div>
      </div>

      {/* NEW: Sales Settings Overview Section */}
      <h4 className="text-lg font-bold text-gray-800 mb-2">Sales Settings Overview</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Active Offers */}
        <div className="bg-white rounded-lg shadow-sm border-l-4 border-purple-500 p-4">
          <div className="flex justify-between items-center mb-2">
            <h6 className="text-gray-500 text-sm font-medium">ACTIVE OFFERS</h6>
            <Percent className="h-5 w-5 text-purple-500" />
          </div>
          <h3 className="text-2xl font-bold mb-0">{salesStats.activeOffers}</h3>
          <small className="text-gray-500 text-xs">Live Campaigns</small>
        </div>

        {/* Active Bundles */}
        <div className="bg-white rounded-lg shadow-sm border-l-4 border-orange-500 p-4">
          <div className="flex justify-between items-center mb-2">
            <h6 className="text-gray-500 text-sm font-medium">ACTIVE BUNDLES</h6>
            <Layers className="h-5 w-5 text-orange-500" />
          </div>
          <h3 className="text-2xl font-bold mb-0">{activeBundles}</h3>
          <small className="text-gray-500 text-xs">Available Plans</small>
        </div>

        {/* Avg Margin */}
        <div className="bg-white rounded-lg shadow-sm border-l-4 border-teal-500 p-4">
          <div className="flex justify-between items-center mb-2">
            <h6 className="text-gray-500 text-sm font-medium">AVG. MARGIN</h6>
            <TrendingUp className="h-5 w-5 text-teal-500" />
          </div>
          <h3 className="text-2xl font-bold mb-0">₹{Math.round(avgMargin)}</h3>
          <small className="text-gray-500 text-xs">Per Unit</small>
        </div>

        {/* AMC Potential */}
        <div className="bg-white rounded-lg shadow-sm border-l-4 border-indigo-500 p-4">
          <div className="flex justify-between items-center mb-2">
            <h6 className="text-gray-500 text-sm font-medium">AMC POTENTIAL</h6>
            <IndianRupee className="h-5 w-5 text-indigo-500" />
          </div>
          <h3 className="text-2xl font-bold mb-0">₹{salesStats.amcRevenuePotential}</h3>
          <small className="text-gray-500 text-xs">Annual</small>
        </div>
      </div>

      <hr className="my-6" />

      {/* Summary Cards (Existing) */}
      {/* ... Keeping existing summary cards for orders ... */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* TOTAL ORDERS Card */}
        <div className="bg-white rounded-lg shadow-sm border-l-4 border-blue-500">
          <div className="p-4">
            <div className="flex justify-between items-center mb-2">
              <h6 className="text-gray-500 text-sm font-medium">TOTAL ORDERS</h6>
              <ShoppingBag className="h-5 w-5 text-blue-500" />
            </div>
            <h3 className="text-2xl font-bold mb-3">{orders.length}</h3>
          </div>
        </div>
      </div>

      <hr className="my-6" />

      {/* Orders Chart + Map */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Orders Chart */}
        <div className="bg-white rounded-lg shadow-sm p-5 h-full">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="h-5 w-5 text-blue-600" />
            <h4 className="text-lg font-bold text-blue-600">Orders</h4>
          </div>
          <div id="chart81">
            <Chart
              options={ordersChartOptions}
              series={ordersChartOptions.series}
              type="donut"
              height={400}
            />
          </div>
        </div>

        {/* Rajkot Map */}
        <div className="bg-white rounded-lg shadow-sm p-5 h-full">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-blue-600" />
            <h4 className="text-lg font-bold text-blue-600">Rajkot Map</h4>
          </div>
          <div className="w-full h-[500px] rounded-lg overflow-hidden">
            <iframe
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1502323.1349301514!2d70.439774!3d22.0698851!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3959ca733392c0ed%3A0x9d0f6f0dcc6020c2!2sRajkot%2C%20Gujarat!5e0!3m2!1sen!2sin!4v1713330000000"
              title="Rajkot Map"
            />
          </div>
        </div>
      </div>

    </div>
  );
}
