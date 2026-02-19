import React, { useMemo, useState, useEffect } from 'react';
import Chart from 'react-apexcharts';
import { dashboardApi } from '../../../services/dashboard/dashboardApi';
import { getStates, getDistricts, getClusters } from '../../../services/locationApi';
import {
  Package,
  IndianRupee,
  AlertTriangle,
  RefreshCw,
  BarChart3,
  Map,
  TrendingUp,
  Eye,
  Filter,
  X
} from 'lucide-react';

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

export default function InventoryDashboard() {
  const [filters, setFilters] = useState({
    state: '',
    district: '',
    cluster: '',
    categoryType: '',
    quarter: '',
    category: '',
    projectType: '',
    subType: '',
    product: '',
    brand: '',
    timeline: ''
  });

  const [locationOptions, setLocationOptions] = useState({
    states: [],
    districts: [],
    clusters: []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  // Initial Load & Location Logic
  useEffect(() => {
    fetchStatesList();
    fetchData();
  }, []);

  // Fetch States
  const fetchStatesList = async () => {
    try {
      const res = await getStates();
      setLocationOptions(prev => ({ ...prev, states: res || [] }));
      console.log(`Fetched states count: ${res?.length || 0}`);
    } catch (e) {
      console.error("Failed to fetch states", e);
    }
  };

  // Fetch Data whenever filters change (debounced slightly or just effect)
  useEffect(() => {
    fetchData();
  }, [filters]);

  // Cascade: State -> District
  useEffect(() => {
    if (filters.state) {
      getDistricts({ stateId: filters.state }).then(res => {
        setLocationOptions(prev => ({ ...prev, districts: res || [], clusters: [] }));
        console.log(`Fetched cities/districts count: ${res?.length || 0}`);
      });
    } else {
      setLocationOptions(prev => ({ ...prev, districts: [], clusters: [] }));
    }
  }, [filters.state]);

  // Cascade: District -> Cluster
  useEffect(() => {
    if (filters.district) {
      getClusters(filters.district).then(res => {
        setLocationOptions(prev => ({ ...prev, clusters: res || [] }));
        console.log(`Fetched areas/clusters count: ${res?.length || 0}`);
      });
    } else {
      setLocationOptions(prev => ({ ...prev, clusters: [] }));
    }
  }, [filters.district]);


  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await dashboardApi.getInventoryDashboard(filters);
      setData(res.dashboard);
      if (res.dashboard) {
        console.log("✅ Locations loaded dynamically from DB");
        console.log("✅ Graph data fetched from database");
        console.log("📊 Chart updated with real DB data");
        console.log(`Fetched chart records: ${res.dashboard.charts?.movement?.categories?.length || 0}`);
      } else {
        console.log("⚠️ No data found in database for this section");
      }
    } catch (e) {
      setError(e?.message || 'Failed to load inventory dashboard');
      console.log("⚠️ No locations found in database (or error fetching)");
    } finally {
      setLoading(false);
    }
  };

  // CHART 1: Inventory Movement
  const inventoryOptions = {
    series: data?.charts?.movement?.series || [],
    chart: {
      type: 'bar',
      height: 350,
      stacked: false, // Changed to false to see side-by-side or true if desired
      toolbar: { show: false }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '45%',
        borderRadius: 4
      },
    },
    colors: ['#4e73df', '#1cc88a', '#f6c23e'],
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ['transparent'] },
    xaxis: {
      categories: data?.charts?.movement?.categories || [],
    },
    yaxis: { title: { text: 'Quantity' } },
    fill: { opacity: 1 },
    tooltip: {
      y: { formatter: (val) => val + " units" }
    },
    legend: { position: 'top' }
  };

  // CHART 2: Prediction
  const predictionOptions = {
    series: data?.charts?.prediction?.series || [],
    chart: {
      type: 'bar',
      height: 350,
      toolbar: { show: false },
      stacked: false
    },
    plotOptions: {
      bar: { horizontal: false, columnWidth: '45%', borderRadius: 4 }
    },
    colors: ['#4e73df', '#e83e8c'],
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ['transparent'] },
    xaxis: {
      categories: data?.charts?.prediction?.categories || [],
    },
    yaxis: { title: { text: 'Inventory (Units)' } }, // Changed from Watts to Units generic
    fill: { opacity: 1 },
    tooltip: {
      y: { formatter: (val) => val + " units" }
    },
    legend: { position: 'top' }
  };

  if (loading && !data) return <div className="p-6 text-center">Loading Dashboard...</div>;

  return (
    <div className="space-y-6 p-4">
      {/* Header/Breadcrumb */}
      <div className="mb-4">
        <nav className="breadcrumb bg-white p-3 rounded shadow-sm">
          <div className="breadcrumb-item active w-full">
            <h3 className="mb-0 text-blue-700 font-bold text-2xl">
              Inventory Dashboard
            </h3>
          </div>
        </nav>
      </div>

      <div className="container-fluid py-3">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-3">
          {/* STATE FILTER */}
          <div>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.state}
              onChange={(e) => setFilters(p => ({ ...p, state: e.target.value, district: '', cluster: '' }))}
            >
              <option value="">Select State</option>
              {locationOptions.states.map(s => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* DISTRICT FILTER (Added for proper hierarchy) */}
          <div>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.district}
              onChange={(e) => setFilters(p => ({ ...p, district: e.target.value, cluster: '' }))}
              disabled={!filters.state}
            >
              <option value="">Select District</option>
              {locationOptions.districts.map(d => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* CLUSTER FILTER */}
          <div>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.cluster}
              onChange={(e) => setFilters(p => ({ ...p, cluster: e.target.value }))}
              disabled={!filters.district}
            >
              <option value="">Select Cluster</option>
              {locationOptions.clusters.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.category}
              onChange={(e) => setFilters(p => ({ ...p, category: e.target.value }))}
            >
              <option value="" >Select Category</option>
              <option value="solarpanel">Solar Panel</option>
              <option value="rooftop">Solar Rooftop</option>
              <option value="streetlight">Solar Street Light</option>
              <option value="solarpump">Solar Pump</option>
              <option value="inverter">Inverter</option>
              <option value="battery">Battery</option>
            </select>
          </div>

          <div>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.timeline}
              onChange={(e) => setFilters(p => ({ ...p, timeline: e.target.value }))}
            >
              <option value="">Select Timeline</option>
              <option value="Q1">Q1 (Jan - Mar)</option>
              <option value="Q2">Q2 (Apr - Jun)</option>
              <option value="Q3">Q3 (Jul - Sep)</option>
              <option value="Q4">Q4 (Oct - Dec)</option>
            </select>
          </div>

          <div>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.projectType}
              onChange={(e) => setFilters(p => ({ ...p, projectType: e.target.value }))}
            >
              <option value="">Select Project Type</option>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
            </select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Total Inventory Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 border-l-4 border-l-blue-500 p-5 h-full">
            <div className="flex justify-between items-center mb-2">
              <h6 className="text-gray-500 text-sm font-semibold mb-0">TOTAL INVENTORY</h6>
              <Package className="text-blue-500 h-5 w-5" />
            </div>
            <h3 className="text-2xl font-bold mb-3">{data?.totals?.totalInventory || 0}</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 rounded p-2 text-center">
                <small className="text-gray-500 block text-xs">AVAILABLE</small>
                <strong className="text-green-600">{data?.totals?.available || 0}</strong>
              </div>
              <div className="bg-gray-50 rounded p-2 text-center">
                <small className="text-gray-500 block text-xs">ALLOCATED</small>
                <strong className="text-yellow-600">{data?.totals?.allocated || 0}</strong>
              </div>
            </div>
          </div>

          {/* Inventory Value Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 border-l-4 border-l-green-500 p-5 h-full">
            <div className="flex justify-between items-center mb-2">
              <h6 className="text-gray-500 text-sm font-semibold mb-0">INVENTORY VALUE</h6>
              <IndianRupee className="text-green-500 h-5 w-5" />
            </div>
            <h3 className="text-2xl font-bold mb-0">₹{(data?.totals?.inventoryValue || 0).toLocaleString()}</h3>
          </div>

          {/* Stock Alerts Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 border-l-4 border-l-yellow-500 p-5 h-full">
            <div className="flex justify-between items-center mb-2">
              <h6 className="text-gray-500 text-sm font-semibold mb-0">STOCK ALERTS</h6>
              <AlertTriangle className="text-yellow-500 h-5 w-5" />
            </div>
            <h3 className="text-2xl font-bold mb-3">{(data?.totals?.stockAlerts?.lowStock || 0) + (data?.totals?.stockAlerts?.critical || 0)}</h3>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Low Stock</span>
              <strong className="text-yellow-600">{data?.totals?.stockAlerts?.lowStock || 0}</strong>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Critical</span>
              <strong className="text-red-600">{data?.totals?.stockAlerts?.critical || 0}</strong>
            </div>
          </div>

          {/* Inventory Turnover Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 border-l-4 border-l-blue-400 p-5 h-full">
            <div className="flex justify-between items-center mb-2">
              <h6 className="text-gray-500 text-sm font-semibold mb-0">INVENTORY TURNOVER</h6>
              <RefreshCw className="text-blue-400 h-5 w-5" />
            </div>
            <h3 className="text-2xl font-bold mb-0">{data?.totals?.inventoryTurnover || 0}x</h3>
            <small className="text-gray-500 text-xs">Ratio</small>
          </div>
        </div>

        {/* Filter Badges */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 border-l-4 border-l-blue-400 mb-4 p-4">
          <div className="flex flex-wrap gap-3">
            {filters.state && <Badge tone="primary">State Filter Active</Badge>}
            {filters.district && <Badge tone="success">District Filter Active</Badge>}
            {filters.cluster && <Badge tone="warning">Cluster Filter Active</Badge>}
            {!filters.state && <Badge tone="secondary">No Location Filters</Badge>}
          </div>
        </div>

        <hr className="my-6" />

        {/* Inventory Summary + Map */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Product Inventory Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
            <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
              <h4 className="text-blue-700 font-bold flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Product Inventory Summary
              </h4>
            </div>
            <div className="p-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left p-3 font-semibold text-gray-700">Category</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Available</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Allocated</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Stock Level</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.productSummary?.length > 0 ? (
                      data.productSummary.map((item, idx) => (
                        <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-3 font-medium text-gray-900">{item.category}</td>
                          <td className="p-3 text-gray-700">{item.available}</td>
                          <td className="p-3 text-gray-700">{item.allocated}</td>
                          <td className="p-3 text-gray-700">{item.stockLevel}%</td>
                          <td className="p-3">
                            <Badge tone={item.status === 'Good' ? 'success' : item.status === 'Low' ? 'warning' : 'danger'}>
                              {item.status}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="5" className="p-3 text-center text-gray-500">No data available</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Warehouse Map (List for now, replacing map if no lat/lng provided properly or just showing active warehouses) */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
            <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
              <h4 className="text-blue-700 font-bold flex items-center gap-2">
                <Map className="h-5 w-5" />
                Active Warehouses
              </h4>
            </div>
            <div className="p-4">
              {/* Dynamic Warehouse List */}
              <div className="h-[400px] overflow-y-auto">
                {data?.warehouses?.length > 0 ? (
                  <ul className="space-y-3">
                    {data.warehouses.map((w, idx) => (
                      <li key={idx} className="p-3 border rounded-lg bg-gray-50 hover:bg-blue-50">
                        <strong className="block text-gray-900">{w.name}</strong>
                        <span className="text-xs text-gray-500 block">{w.state}, {w.district}, {w.cluster}</span>
                        <span className="text-xs text-blue-600 block mt-1">Lat: {w.lat}, Lng: {w.lng}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-center text-gray-500 mt-10">No warehouses found for selected region.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Inventory Movement Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
            <h4 className="text-blue-700 font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Inventory Movement (Last 6 Months)
            </h4>
          </div>
          <div className="p-4">
            <div id="inventoryChart">
              <Chart
                options={inventoryOptions}
                series={inventoryOptions.series}
                type="bar"
                height={350}
              />
            </div>
          </div>
        </div>

        {/* Inventory Prediction Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-4 border-t border-gray-200 bg-white flex items-center justify-between">
            <h4 className="text-blue-700 font-bold flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Inventory Prediction Chart (Top Brands)
            </h4>
          </div>
          <div className="p-4">
            <div id="predictionchart">
              <Chart
                options={predictionOptions}
                series={predictionOptions.series}
                type="bar"
                height={350}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}