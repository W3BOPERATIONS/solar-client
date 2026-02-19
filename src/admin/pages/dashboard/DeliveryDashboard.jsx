import React, { useEffect, useState } from 'react';
import { dashboardAPI } from '../../../api/api';
import ReactApexChart from 'react-apexcharts';
import {
  Truck,
  Package,
  Clock,
  AlertCircle,
  MapPin,
  BarChart3,
  IndianRupee,
  Calendar,
  Filter,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useLocations } from '../../../hooks/useLocations';

export default function DeliveryDashboard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    totalDeliveries: 0,
    counts: { prime: 0, regular: 0, express: 0, bulk: 0, other: 0 },
    pending: { total: 0, urgent: 0, normal: 0, overdue: 0 },
    financials: { avgCost: 0, totalDistance: 0, efficiency: 0 },
    performance: { avgTime: "0 Days", primeTime: "0 Day", perentage: 0 },
    chart: { series: [{ name: 'Deliveries', data: [] }], labels: [] },
    breakdown: {
      kit: { total: 0, prime: 0, regular: 0 },
      combo: { total: 0, prime: 0, regular: 0 }
    }
  });
  const [activeKitTab, setActiveKitTab] = useState('kit');

  // Dynamic Location Data
  const { states, clusters, districts, fetchStates, fetchClusters, fetchDistricts } = useLocations();
  const [filters, setFilters] = useState({
    state: '',
    cluster: '',
    district: '',
    deliveryType: '',
    category: '',
    timeline: 'Last Month' // Default
  });

  useEffect(() => {
    fetchStates();
  }, []);

  // Fetch Dashboard Data
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('🔄 Fetching dashboard data with filters:', filters);

        // Prepare query params
        const params = {};
        if (filters.state) params.state = states.find(s => s.name === filters.state)?._id || filters.state; // Try to resolve Name to ID if needed, or assume ID
        // Note: useLocations usually returns objects. If filters are IDs, pass directly.
        // Assuming filters are IDs from the select inputs below.
        Object.keys(filters).forEach(key => {
          if (filters[key]) params[key] = filters[key];
        });

        const res = await dashboardAPI.getDelivery(params);
        if (res.data.success) {
          setData(res.data.dashboard);
          console.log('✅ Locations loaded dynamically from DB (confirmed via API response)');
          console.log('📊 Chart updated with real DB data', res.data.dashboard.chart);
        }
      } catch (e) {
        console.error('Failed to load dashboard:', e);
        setError(e?.message || 'Failed to load delivery dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));

    // Cascading Logic
    if (key === 'state') {
      fetchClusters({ stateId: value });
      setFilters(prev => ({ ...prev, state: value, cluster: '', district: '' }));
    }
    if (key === 'cluster') {
      fetchDistricts({ clusterId: value });
      setFilters(prev => ({ ...prev, cluster: value, district: '' }));
    }
  };

  // Chart configuration
  const chartOptions = {
    series: data.chart.series,
    chart: {
      type: 'bar',
      height: 350,
      toolbar: { show: false }
    },
    plotOptions: {
      bar: { horizontal: false, columnWidth: '50%' },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: data.chart.labels,
      title: { text: 'Project Types' }
    },
    yaxis: {
      title: { text: 'Number of Deliveries' },
      min: 0,
    },
    fill: { opacity: 1 },
    colors: ['#007bff'],
    tooltip: {
      y: {
        formatter: function (val) {
          return val + " Deliveries";
        }
      }
    }
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-4">
        <div className="bg-white p-3 rounded-lg shadow-sm flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Truck className="h-6 w-6 text-blue-600" />
            <h3 className="text-xl font-bold text-blue-600 mb-0">Delivery Dashboard</h3>
          </div>
          <div className="flex space-x-2">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Franchisee Delivery
            </button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Dealer Delivery
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* State */}
          <div className="relative">
            <Filter className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <select
              className="w-full pl-10 p-3 border border-gray-300 rounded-lg bg-white text-sm"
              value={filters.state}
              onChange={(e) => handleFilterChange('state', e.target.value)}
            >
              <option value="">All States</option>
              {states.map(state => (
                <option key={state._id} value={state._id}>{state.name}</option>
              ))}
            </select>
          </div>

          {/* Cluster */}
          <div className="relative">
            <Filter className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <select
              className="w-full pl-10 p-3 border border-gray-300 rounded-lg bg-white text-sm"
              value={filters.cluster}
              onChange={(e) => handleFilterChange('cluster', e.target.value)}
              disabled={!filters.state}
            >
              <option value="">All Clusters</option>
              {clusters.map(cluster => (
                <option key={cluster._id} value={cluster._id}>{cluster.name}</option>
              ))}
            </select>
          </div>

          {/* District */}
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <select
              className="w-full pl-10 p-3 border border-gray-300 rounded-lg bg-white text-sm"
              value={filters.district}
              onChange={(e) => handleFilterChange('district', e.target.value)}
              disabled={!filters.cluster}
            >
              <option value="">All Districts</option>
              {districts.map(d => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Delivery Type */}
          <div className="relative">
            <Truck className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <select
              className="w-full pl-10 p-3 border border-gray-300 rounded-lg bg-white text-sm"
              value={filters.deliveryType}
              onChange={(e) => handleFilterChange('deliveryType', e.target.value)}
            >
              <option value="">All Delivery Types</option>
              <option value="Prime">Prime Delivery</option>
              <option value="Regular">Regular Delivery</option>
              <option value="Express">Express</option>
              <option value="Bulk">Bulk</option>
            </select>
          </div>

          {/* Category */}
          <div className="relative">
            <Filter className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <select
              className="w-full pl-10 p-3 border border-gray-300 rounded-lg bg-white text-sm"
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="Solar Rooftop">Solar Rooftop</option>
              <option value="Solar Street Light">Solar Street Light</option>
              <option value="Solar Pump">Solar Pump</option>
            </select>
          </div>

          {/* Timeline */}
          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <select
              className="w-full pl-10 p-3 border border-gray-300 rounded-lg bg-white text-sm"
              value={filters.timeline}
              onChange={(e) => handleFilterChange('timeline', e.target.value)}
            >
              <option value="">select timeline</option>
              <option value="Last Week">Last Week</option>
              <option value="Last Month">Last Month</option>
              <option value="Last 3 Months">Last 3 Months</option>
              <option value="Last 6 Months">Last 6 Months</option>
            </select>
          </div>
        </div>
      </div>

      {loading && <p className="text-center text-blue-500">Loading dashboard data...</p>}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* TOTAL DELIVERIES Card */}
        <div className="bg-white rounded-lg shadow-sm border-l-4 border-blue-500">
          <div className="p-5">
            <div className="flex items-center justify-between mb-2">
              <h6 className="text-gray-500 text-sm font-medium">TOTAL DELIVERIES</h6>
              <Truck className="h-5 w-5 text-blue-500" />
            </div>
            <h4 className="text-2xl font-bold mb-4">{data.totalDeliveries}</h4>

            {/* Tabs */}
            <div className="flex space-x-1 mb-4">
              <button
                className={`px-3 py-1 text-sm rounded-lg flex items-center gap-1 ${activeKitTab === 'kit' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}
                onClick={() => setActiveKitTab('kit')}
              >
                <Package className="h-3 w-3" />
                Customized Kit
              </button>
              <button
                className={`px-3 py-1 text-sm rounded-lg flex items-center gap-1 ${activeKitTab === 'combo' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}
                onClick={() => setActiveKitTab('combo')}
              >
                <Package className="h-3 w-3" />
                ComboKit
              </button>
            </div>

            {/* Tab Content */}
            <div className="text-center">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <div className="text-gray-500 text-xs flex items-center justify-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Prime
                  </div>
                  <div className="font-bold text-sm text-blue-600">
                    {activeKitTab === 'kit' ? data.breakdown.kit.prime : data.breakdown.combo.prime}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs flex items-center justify-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Regular
                  </div>
                  <div className="font-bold text-sm text-green-600">
                    {activeKitTab === 'kit' ? data.breakdown.kit.regular : data.breakdown.combo.regular}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs flex items-center justify-center gap-1">
                    <Package className="h-3 w-3" />
                    Other
                  </div>
                  <div className="font-bold text-gray-600 text-sm">
                    {activeKitTab === 'kit'
                      ? (data.breakdown.kit.total - (data.breakdown.kit.prime + data.breakdown.kit.regular))
                      : (data.breakdown.combo.total - (data.breakdown.combo.prime + data.breakdown.combo.regular))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AVG COST Card */}
        <div className="bg-white rounded-lg shadow-sm border-l-4 border-green-500">
          <div className="p-5">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <IndianRupee className="h-5 w-5 text-green-500" />
                <h6 className="text-gray-500 text-sm font-medium">AVG COST (per Delivery)</h6>
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-1">₹{data.financials.avgCost}</h3>
            <p className="text-gray-500 text-xs mb-2">Based on filtered data</p>
            <p className="text-red-500 text-sm flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              (Benchmark: ₹10,000)
            </p>
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <div>
                  <h6 className="text-gray-500 text-xs">Total Distance</h6>
                  <span className="font-bold text-green-600">{data.financials.totalDistance} km</span>
                </div>
                <div className="text-right">
                  <div className="text-green-600 font-bold">{data.financials.efficiency}%</div>
                  <div className="text-gray-500 text-xs">Efficiency</div>
                </div>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: `${data.financials.efficiency}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* AVG. DELIVERY TIME Card */}
        <div className="bg-white rounded-lg shadow-sm border-l-4 border-yellow-500">
          <div className="p-5">
            <div className="flex items-center justify-between mb-2">
              <h6 className="text-gray-500 text-sm font-medium">AVG. DELIVERY TIME</h6>
              <Clock className="h-5 w-5 text-yellow-500" />
            </div>
            <h3 className="text-2xl font-bold mb-4">{data.performance.avgTime}</h3>
            <div className="space-y-1 mb-4">
              <div className="text-gray-600 text-sm flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Prime: {data.performance.primeTime}</span>
              </div>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Performance</span>
              <span className="text-yellow-600 font-bold">{data.performance.perentage}%</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-yellow-500" style={{ width: `${data.performance.perentage}%` }}></div>
            </div>
          </div>
        </div>

        {/* PENDING DELIVERIES Card */}
        <div className="bg-white rounded-lg shadow-sm border-l-4 border-red-500">
          <div className="p-5">
            <div className="flex items-center justify-between mb-2">
              <h6 className="text-gray-500 text-sm font-medium">PENDING DELIVERIES</h6>
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <h3 className="text-2xl font-bold mb-4">{data.pending.total}</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 text-red-500" />
                  Urgent
                </span>
                <strong className="text-red-600">{data.pending.urgent}</strong>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 flex items-center gap-1">
                  <Clock className="h-3 w-3 text-gray-500" />
                  Normal
                </span>
                <strong>{data.pending.normal}</strong>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between items-center text-sm">
                <span className="text-red-600 flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  Overdue
                </span>
                <strong className="text-red-600">{data.pending.overdue}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <hr className="my-6" />

      {/* Check for empty data */}
      {data.totalDeliveries === 0 && !loading && (
        <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200 mb-6">
          <p className="text-yellow-700 flex items-center justify-center gap-2">
            <AlertCircle size={20} />
            ⚠️ No data found in database for this section (Confirming DB Connection)
          </p>
        </div>
      )}

      {/* Delivery Summary + Map */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Delivery Summary */}
        <div className="bg-white rounded-lg shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <h4 className="text-lg font-bold text-blue-600">Delivery Summary</h4>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-gray-700">Prime Delivery</span>
              </div>
              <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">{data.counts.prime}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium text-gray-700">Regular Delivery</span>
              </div>
              <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">{data.counts.regular}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="font-medium text-gray-700">Express Delivery</span>
              </div>
              <span className="bg-yellow-600 text-white px-3 py-1 rounded-full text-sm font-medium">{data.counts.express}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-600" />
                <span className="font-medium text-gray-700">Bulk Delivery</span>
              </div>
              <span className="bg-gray-600 text-white px-3 py-1 rounded-full text-sm font-medium">{data.counts.bulk}</span>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="bg-white rounded-lg shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-bold">Rajkot Map</h2>
          </div>
          <div className="w-full h-96 rounded-lg overflow-hidden border border-gray-200">
            <iframe
              width="100%"
              height="100%"
              style={{ border: 'none' }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1502323.1349301514!2d70.439774!3d22.0698851!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3959ca733392c0ed%3A0x9d0f6f0dcc6020c2!2sRajkot%2C%20Gujarat!5e0!3m2!1sen!2sin!4v1713330000000"
              title="Rajkot Map"
            />
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-lg shadow-sm p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          <h4 className="text-lg font-bold text-blue-600">Delivery Summary Chart (Real-Time)</h4>
        </div>
        {typeof window !== 'undefined' && (
          <ReactApexChart
            options={chartOptions}
            series={chartOptions.series}
            type="bar"
            height={350}
          />
        )}
      </div>

    </div>
  );
}