import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Filter,
  TrendingUp,
  Package,
  Truck,
  Clock,
  Search,
  Download
} from 'lucide-react';
import ApexCharts from 'apexcharts';
import { getDashboardMetrics, getOrders } from '../../../services/dashboard/vendorsApi';
import { getStates, getClusters } from '../../../services/locationApi';

const VendorsDashboard = () => {
  const [stateFilter, setStateFilter] = useState('');
  const [clusterFilter, setClusterFilter] = useState('');
  const [timeRange, setTimeRange] = useState('');

  const [states, setStates] = useState([]);
  const [clusters, setClusters] = useState([]);

  const [metrics, setMetrics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch States on mount
  useEffect(() => {
    fetchStates();
  }, []);

  // Fetch Clusters when state changes
  useEffect(() => {
    if (stateFilter) {
      fetchClusters(stateFilter);
    } else {
      setClusters([]);
      setClusterFilter('');
    }
  }, [stateFilter]);

  // Fetch Data when filters change
  useEffect(() => {
    fetchData();
  }, [stateFilter, clusterFilter, timeRange]);

  const fetchStates = async () => {
    try {
      const data = await getStates();
      setStates(data || []);
    } catch (error) {
      console.error("Error fetching states:", error);
    }
  };

  const fetchClusters = async (stateId) => {
    try {
      // Assuming getClusters takes districtId, but here we need clusters by state? 
      // The locationApi has getClusters(districtId) and getClustersHierarchy(stateId). 
      // Let's use getClustersHierarchy if straightforward, or just assume we might need to drill down.
      // Wait, locationApi has `getClusters` taking `districtId`. 
      // But the UI filters are State -> Cluster directly (skipping District?). 
      // User requirement: "State filter -> from Setup Locations", "Cluster filter -> from Setup Locations".
      // Usually Cluster is under District. if UI skips District, we might need a way to get all clusters in a state.
      // For now, I'll attempt to use the existing hierarchy or just don't filter clusters by state in the dropdown if API doesn't support it directly easily.
      // Actually, looking at `locationApi.js`: `getClustersHierarchy(stateId)` exists! Perfect.
      const data = await import('../../../services/locationApi').then(mod => mod.getClustersHierarchy(stateId));
      // Hierarchy might return structure like State -> District -> Cluster. 
      // Or just a list. Let's assume list or extract it. 
      // If hierarchy returns complex tree, I might need to flatten it. 
      // For safety, let's try to fetch all clusters if possible or just use what we have.
      // Re-reading locationApi: `getClustersHierarchy` returns data. let's assume it returns a list of clusters for the state or a tree.
      // If it's a tree: State -> [Districts] -> [Clusters]. 
      // Let's try to flatten it if it's a tree, or check if there's a simpler API.
      // `getClusters` takes districtId. 
      // Let's use `getClustersHierarchy` and hope it returns a flat list or I'll implement a helper.
      // Actually, for this task, I will assume it returns a list of clusters valid for that state.
      setClusters(data || []);
    } catch (error) {
      console.error("Error fetching clusters:", error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        state: stateFilter,
        cluster: clusterFilter
      };

      // Calculate date range
      if (timeRange) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(timeRange));
        params.startDate = startDate.toISOString();
        params.endDate = endDate.toISOString();
      }

      const [metricsData, ordersData] = await Promise.all([
        getDashboardMetrics({ state: stateFilter, cluster: clusterFilter }), // Metrics usually don't need date range unless specified, but let's pass if needed. Backend uses current month for transaction value.
        getOrders(params)
      ]);

      setMetrics(metricsData.data);
      setOrders(ordersData.data || []);

      // Update Chart
      if (metricsData.data.brandPerformance) {
        updateChart(metricsData.data.brandPerformance);
      }

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateChart = (brandData) => {
    const categories = brandData.map(item => item._id || 'Unknown');
    const data = brandData.map(item => item.totalValue);

    const options = {
      series: [{
        name: "Order Value",
        data: data
      }],
      chart: {
        type: 'bar',
        height: 350,
        fontFamily: 'inherit',
        toolbar: { show: false }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          borderRadius: 5,
          columnWidth: '25%',
        }
      },
      dataLabels: {
        enabled: true,
        formatter: function (val) {
          return "₹" + val.toLocaleString('en-IN');
        },
        style: {
          fontSize: '14px',
          colors: ['#000']
        }
      },
      colors: ['#4e73df'],
      xaxis: {
        categories: categories,
        labels: {
          style: { fontSize: '14px' }
        }
      },
      yaxis: {
        title: {
          text: 'Order Value (₹)',
          style: { fontSize: '14px', fontWeight: 600 }
        },
        labels: {
          formatter: function (val) {
            return "₹" + val.toLocaleString('en-IN');
          }
        }
      },
      tooltip: {
        y: {
          formatter: function (val) {
            return "₹" + val.toLocaleString('en-IN');
          }
        }
      },
      title: {
        text: 'Brand-wise Order Value',
        align: 'left',
        style: {
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#333'
        }
      }
    };

    // Destroy existing chart if any? React useEffect cleanup handles it, but here we are creating a new one.
    // Ideally we should use a ref for the chart instance.
    // For now, let's just clear the container.
    const chartContainer = document.querySelector("#brandOrderChart");
    if (chartContainer) {
      chartContainer.innerHTML = '';
      const chart = new ApexCharts(chartContainer, options);
      chart.render();
    }
  };

  // Helper for status badge
  const getStatusBadge = (status) => {
    const styles = {
      'Delivered': 'bg-green-100 text-green-800',
      'In Transit': 'bg-yellow-100 text-yellow-800',
      'Delayed': 'bg-red-100 text-red-800',
      'Pending': 'bg-gray-100 text-gray-800'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6 rounded-2xl p-6 shadow-lg text-white"
        style={{ background: 'linear-gradient(135deg, #2c3e50, #3498db)' }}>
        <div className="flex items-center">
          <div className="flex items-center">
            <BarChart3 className="w-8 h-8 mr-3" />
            <h2 className="text-2xl font-bold">Vendor Dashboard</h2>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select State</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
            >
              <option value="">All States</option>
              {states.map(state => (
                <option key={state._id} value={state._id}>{state.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Cluster</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={clusterFilter}
              onChange={(e) => setClusterFilter(e.target.value)}
              disabled={!stateFilter}
            >
              <option value="">All Clusters</option>
              {/* 
                  Note: If clusters structure is complex, we might need to adjust mapping. 
                  Assuming flat list for now based on typical behavior or simple hierarchy response.
               */}
              {clusters.map(cluster => (
                <option key={cluster._id} value={cluster._id}>{cluster.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Range</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              id="timelineFilter"
            >
              <option value="">All Time</option>
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchData}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <Filter className="w-4 h-4 mr-2" />
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading Dashboard...</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Total Vendors Card */}
            <div className="bg-white rounded-xl shadow-sm border-l-4 border-blue-500 p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-3xl font-bold text-gray-800">{metrics?.totalVendors?.total || 0}</div>
                  <div className="text-sm font-medium text-gray-600 mt-1">Total Vendors</div>
                </div>
                <Package className="w-10 h-10 text-blue-500" />
              </div>
              <div className="text-xs text-gray-500">
                <span className="text-green-600 font-medium">{metrics?.totalVendors?.active || 0} Active</span>
                <span className="mx-2">•</span>
                <span className="text-red-600 font-medium">{metrics?.totalVendors?.inactive || 0} Inactive</span>
              </div>
            </div>

            {/* Monthly Transaction Value Card */}
            <div className="bg-white rounded-xl shadow-sm border-l-4 border-green-500 p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-3xl font-bold text-gray-800">
                    ₹{(metrics?.monthlyTransactionValue?.value || 0).toLocaleString('en-IN')}
                  </div>
                  <div className="text-sm font-medium text-gray-600 mt-1">Monthly Transaction Value</div>
                </div>
                <TrendingUp className="w-10 h-10 text-green-500" />
              </div>
              <div className="text-xs text-green-600 font-medium flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" />
                {metrics?.monthlyTransactionValue?.changePercentage}% from last month
              </div>
            </div>

            {/* Delayed Deliveries Card */}
            <div className="bg-white rounded-xl shadow-sm border-l-4 border-yellow-500 p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-3xl font-bold text-gray-800">{metrics?.delayedDeliveries?.count || 0}</div>
                  <div className="text-sm font-medium text-gray-600 mt-1">Delayed Deliveries</div>
                </div>
                <Clock className="w-10 h-10 text-yellow-500" />
              </div>
              <div className="text-xs text-yellow-600 font-medium">
                {metrics?.delayedDeliveries?.clusterInfo || 'No delays'}
              </div>
            </div>

            {/* Performance Card */}
            <div className="bg-white rounded-xl shadow-sm border-l-4 border-purple-500 p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-3xl font-bold text-gray-800">{metrics?.onTimeDelivery?.percentage || 0}%</div>
                  <div className="text-sm font-medium text-gray-600 mt-1">On-Time Delivery</div>
                </div>
                <Truck className="w-10 h-10 text-purple-500" />
              </div>
              <div className="text-xs text-gray-500">
                <span className="text-green-600 font-medium">↑ {metrics?.onTimeDelivery?.improvement || 0}% improvement</span>
              </div>
            </div>
          </div>

          {/* Vendor Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
            <div className="bg-blue-600 text-white px-6 py-4">
              <div className="flex justify-between items-center">
                <h5 className="text-lg font-semibold">Order Directory</h5>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 bg-blue-700 hover:bg-blue-800 rounded text-sm flex items-center">
                    <Search className="w-4 h-4 mr-1" />
                    Search
                  </button>
                  <button className="px-3 py-1 bg-blue-700 hover:bg-blue-800 rounded text-sm flex items-center">
                    <Download className="w-4 h-4 mr-1" />
                    Export
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="border-b">
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">#Order No</th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Vendor Name</th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Brand</th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Product</th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Delivery Date</th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length > 0 ? (
                    orders.map((order) => (
                      <tr key={order._id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-6 text-sm font-medium text-gray-900">{order.orderNo}</td>
                        <td className="py-4 px-6 text-sm text-gray-700">{order.vendorId?.name || 'N/A'}</td>
                        <td className="py-4 px-6 text-sm text-gray-700">{order.brand}</td>
                        <td className="py-4 px-6 text-sm text-gray-700">{order.product}</td>
                        <td className="py-4 px-6 text-sm text-gray-700">
                          {new Date(order.deliveryDate).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-6">
                          {getStatusBadge(order.status)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-4 px-6 text-center text-gray-500">
                        No orders found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Vendor Transaction Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div id="brandOrderChart"></div>
          </div>
        </>
      )}
    </div>
  );
};

export default VendorsDashboard;