import React, { useEffect, useRef, useState } from 'react';
import {
  BarChart3, TrendingUp, DollarSign, Users,
  Filter, RefreshCw, MapPin, Home,
  Building, Zap, Smartphone, Target
} from 'lucide-react';
import ApexCharts from 'apexcharts';
import performanceApi from '../../../../services/performance/performanceApi';
import * as locationApi from '../../../../services/locationApi';

// Google Maps Script Loader
const loadGoogleMapsScript = (callback) => {
  if (window.google && window.google.maps) {
    callback();
    return;
  }

  if (document.getElementById('google-maps-script')) {
    window.initMap = callback;
    return;
  }

  const script = document.createElement('script');
  script.id = 'google-maps-script';
  script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCGt03YWLd6CUTWIZQlBDtdvrTAAIfSqlM&callback=initMap`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);

  window.initMap = callback;
};

export default function FranchiseDashboard() {
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);

  const [states, setStates] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    timeline: '30',
    franchiseeType: 'all',
    franchiseeName: 'all',
    category: '',
    subCategory: '',
    projectType: '',
    subProject: '',
    timeline2: 'q1'
  });

  const mapRef = useRef(null);
  const chart1Ref = useRef(null);
  const chart2Ref = useRef(null);
  const clusterChartRef = useRef(null);
  const chart1Instance = useRef(null);
  const chart2Instance = useRef(null);
  const clusterChartInstance = useRef(null);

  // Initialize Google Map
  const initMap = () => {
    if (!mapRef.current) return;

    const map = new window.google.maps.Map(mapRef.current, {
      zoom: 7,
      center: { lat: 22.9734, lng: 72.5700 },
      styles: [
        {
          "featureType": "administrative",
          "elementType": "geometry",
          "stylers": [{ "visibility": "off" }]
        },
        {
          "featureType": "poi",
          "stylers": [{ "visibility": "off" }]
        },
        {
          "featureType": "road",
          "elementType": "labels.icon",
          "stylers": [{ "visibility": "off" }]
        },
        {
          "featureType": "transit",
          "stylers": [{ "visibility": "off" }]
        }
      ]
    });

    const districtsData = [
      {
        name: "Rajkot",
        message: "22",
        position: { lat: 22.3039, lng: 70.8022 }
      },
      {
        name: "Surat",
        message: "12",
        position: { lat: 21.1702, lng: 72.8311 }
      },
      {
        name: "Vadodara",
        message: "16",
        position: { lat: 22.3072, lng: 73.1812 }
      },
      {
        name: "Ahmedabad",
        message: "28",
        position: { lat: 23.0225, lng: 72.5714 }
      },
      {
        name: "Bhavnagar",
        message: "5",
        position: { lat: 21.7645, lng: 72.1519 }
      }
    ];

    districtsData.forEach(d => {
      const marker = new window.google.maps.Marker({
        position: d.position,
        map,
        title: d.name,
        label: {
          text: d.message,
          color: "#ffffff",
          fontWeight: "bold"
        },
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: "#0d6efd",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
          scale: 15
        }
      });

      const info = new window.google.maps.InfoWindow({
        content: `<div class="p-2"><strong class="text-sm">${d.name}</strong><br><strong class="text-primary">Total Franchisee: ${d.message}</strong></div>`,
      });

      marker.addListener("click", () => {
        info.open(map, marker);
      });
    });
  };

  useEffect(() => {
    fetchStates();
    fetchPerformance();
  }, [filters]);

  useEffect(() => {
    fetchPerformance();
  }, [selectedState, selectedCluster, selectedDistrict]);

  const fetchStates = async () => {
    try {
      const statesData = await locationApi.getStates();
      setStates(statesData);
    } catch (err) {
      console.error('Error fetching states:', err);
    }
  };

  const fetchClusters = async (districtId) => {
    try {
      const data = await locationApi.getClusters(districtId);
      setClusters(data);
    } catch (err) {
      console.error('Error fetching clusters:', err);
    }
  };

  const fetchDistrictsByState = async (stateId) => {
    try {
      const data = await locationApi.getDistricts({ stateId });
      setDistricts(data);
    } catch (err) {
      console.error('Error fetching districts:', err);
    }
  };

  const fetchPerformance = async () => {
    setLoading(true);
    try {
      const params = {
        stateId: selectedState?._id,
        clusterId: selectedCluster?._id,
        districtId: selectedDistrict?._id,
        ...filters
      };
      const response = await performanceApi.getFranchiseePerformance(params);
      setPerformanceData(response);
    } catch (err) {
      console.error('Error fetching performance:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initialize Charts
  useEffect(() => {
    if (!performanceData) return;

    // Cleanup existing charts
    [chart1Instance, chart2Instance, clusterChartInstance].forEach(ref => {
      if (ref.current) {
        ref.current.destroy();
        ref.current = null;
      }
    });

    // Chart 1 - Franchisee Chart (Leads vs Signups)
    if (chart1Ref.current) {
      const chartData = performanceData.charts?.franchiseePerformance || { labels: [], leads: [], signups: [] };
      const options = {
        series: [{
          name: 'Leads',
          data: chartData.leads || []
        },
        {
          name: 'Signups',
          data: chartData.signups || []
        }],
        chart: {
          type: 'bar',
          height: 350,
          toolbar: { show: false },
          fontFamily: 'inherit'
        },
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: '25%',
            borderRadius: 4
          }
        },
        colors: ['#4e73df', '#00c9a7'],
        xaxis: {
          categories: chartData.labels || []
        },
        yaxis: { title: { text: 'Counts' } },
        legend: { position: 'top' }
      };

      chart1Instance.current = new ApexCharts(chart1Ref.current, options);
      chart1Instance.current.render();
    }

    // Chart 2 - Orders Chart (Count vs Amount)
    if (chart2Ref.current) {
      const orderData = performanceData.charts?.orderPerformance || { labels: [], counts: [], amounts: [] };
      const options = {
        series: [{
          name: 'Orders',
          type: 'column',
          data: orderData.counts || []
        },
        {
          name: 'Order Amount ₹',
          type: 'line',
          data: orderData.amounts || []
        }
        ],
        chart: {
          height: 350,
          type: 'line',
          toolbar: { show: false },
          fontFamily: 'inherit'
        },
        stroke: { width: [0, 3], curve: 'smooth' },
        plotOptions: { bar: { columnWidth: '30%', borderRadius: 4 } },
        colors: ['#4e73df', '#00c9a7'],
        labels: orderData.labels || [],
        xaxis: { type: 'category' },
        yaxis: [
          { title: { text: 'Orders Count' } },
          { opposite: true, title: { text: 'Order Amount ₹' } }
        ],
        tooltip: {
          shared: true,
          y: [
            { formatter: (val) => val + " Orders" },
            { formatter: (val) => "₹" + (val || 0).toLocaleString() }
          ]
        },
        legend: { position: 'top' }
      };

      chart2Instance.current = new ApexCharts(chart2Ref.current, options);
      chart2Instance.current.render();
    }

    // Cluster Orders Chart
    if (clusterChartRef.current) {
      const clusterData = performanceData.charts?.clusterPerformance || { labels: [], values: [] };
      const options = {
        series: clusterData.values || [],
        chart: {
          type: 'donut',
          height: 300,
          fontFamily: 'inherit'
        },
        labels: clusterData.labels || [],
        colors: ['#2C599D', '#F98125', '#1CC88A', '#F6C23E', '#36B9CC'],
        legend: { position: 'bottom' },
        dataLabels: {
          formatter: (val, opts) => opts.w.config.series[opts.seriesIndex] + ' orders'
        }
      };

      clusterChartInstance.current = new ApexCharts(clusterChartRef.current, options);
      clusterChartInstance.current.render();
    }

    // Cleanup on unmount
    return () => {
      [chart1Instance, chart2Instance, clusterChartInstance].forEach(ref => {
        if (ref.current) {
          ref.current.destroy();
          ref.current = null;
        }
      });
    };
  }, [performanceData]);

  useEffect(() => {
    loadGoogleMapsScript(initMap);
  }, []);

  const handleStateSelect = (state) => {
    setSelectedState(state);
    setSelectedCluster(null);
    setSelectedDistrict(null);
    setDistricts([]);
    setClusters([]);
    fetchDistrictsByState(state._id);
  };

  const handleClusterSelect = (cluster) => {
    setSelectedCluster(cluster);
  };

  const handleDistrictSelect = (district) => {
    setSelectedDistrict(district);
    setSelectedCluster(null);
    fetchClusters(district._id);
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleApplyFilters = () => {
    fetchPerformance();
  };

  const handleResetFilters = () => {
    setSelectedState(null);
    setSelectedDistrict(null);
    setSelectedCluster(null);
    setFilters({
      timeline: '30',
      franchiseeType: 'all',
      franchiseeName: 'all',
      category: '',
      subCategory: '',
      projectType: '',
      subProject: '',
      timeline2: 'q1'
    });
  };

  // No static data needed

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 rounded-2xl p-4 shadow-lg"
        style={{ background: 'linear-gradient(135deg, #2c3e50, #3498db)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
              <BarChart3 className="inline mr-2" size={24} />
              Frenchisee Dashboard
            </h2>
          </div>
        </div>
      </div>

      {/* First Filters Section */}
      <div className="mb-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
          <div>
            <select
              value={selectedState?._id || ''}
              onChange={(e) => {
                const s = states.find(st => st._id === e.target.value);
                if (s) handleStateSelect(s);
              }}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>Select State</option>
              {states.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <select
              value={selectedDistrict?._id || ''}
              onChange={(e) => {
                const d = districts.find(ds => ds._id === e.target.value);
                if (d) handleDistrictSelect(d);
              }}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>Select District</option>
              {districts.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <select
              value={selectedCluster?._id || ''}
              onChange={(e) => {
                const c = clusters.find(cl => cl._id === e.target.value);
                if (c) setSelectedCluster(c);
              }}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>Select Cluster</option>
              {clusters.map(cl => <option key={cl._id} value={cl._id}>{cl.name}</option>)}
            </select>
          </div>
          <div>
            <select
              value={filters.timeline}
              onChange={(e) => handleFilterChange('timeline', e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled>Timeline</option>
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last Quarter</option>
            </select>
          </div>
          <div>
            <select
              value={filters.franchiseeType}
              onChange={(e) => handleFilterChange('franchiseeType', e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all" disabled>Frenchisee Type</option>
              <option value="startup">Start Up(Dealer)</option>
              <option value="startup">Basic</option>
              <option value="enterprice">Enterprice</option>
              <option value="solarbussiness">Solar Bussiness</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              <option>Solar Rooftop</option>
              <option>Solar Pump</option>
            </select>
          </div>
          <div>
            <select
              value={filters.subCategory}
              onChange={(e) => handleFilterChange('subCategory', e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Sub Categories</option>
              <option>Residential</option>
              <option>Commercial</option>
            </select>
          </div>
          <div>
            <select
              value={filters.projectType}
              onChange={(e) => handleFilterChange('projectType', e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Project Type</option>
              <option>3kw - 5kw</option>
              <option>5kw - 10kw</option>
            </select>
          </div>
          <div>
            <select
              value={filters.subProject}
              onChange={(e) => handleFilterChange('subProject', e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Sub Project</option>
              <option>OnGrid</option>
              <option>OffGrid</option>
              <option>Hybrid</option>
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleApplyFilters}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
          >
            <Filter size={16} className="mr-2" />
            Apply
          </button>
          <button
            onClick={handleResetFilters}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
          >
            <RefreshCw size={16} className="mr-2" />
            Reset
          </button>
        </div>
      </div>

      <hr className="my-6" />

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Leads & Quotes */}
        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-blue-500 hover:-translate-y-1 transition-transform duration-300">
          <div className="flex justify-between items-center mb-3">
            <div className="text-2xl font-bold text-gray-800">{performanceData?.summary?.leads || 0}</div>
            <div className="text-2xl font-bold text-gray-800">{performanceData?.summary?.quotes || 0}</div>
          </div>
          <div className="flex justify-between items-center mb-2">
            <div className="text-gray-600 font-medium">Total Leads</div>
            <div className="text-gray-600 font-medium">Total Quotes</div>
          </div>
          <div className="mt-2 flex items-center">
            <span className="text-gray-500 text-sm">Combined count</span>
          </div>
        </div>

        {/* Total Conversion */}
        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-green-500 hover:-translate-y-1 transition-transform duration-300">
          <div className="mb-3">
            <div className="text-gray-600 font-medium mb-1">Total Conversion</div>
            <div className="text-2xl font-bold text-gray-800">{performanceData?.summary?.conversionRatio || 0}%</div>
          </div>
          <div className="mt-2 flex items-center">
            <span className="text-gray-500 text-sm">Overall performance</span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-cyan-500 hover:-translate-y-1 transition-transform duration-300">
          <div className="mb-3">
            <div className="text-gray-600 font-medium mb-1">Total Orders</div>
            <div className="flex justify-between items-baseline space-x-4">
              <div className="text-2xl font-bold text-gray-800">{performanceData?.summary?.totalOrders || 0}</div>
              <div className="text-gray-500 font-semibold">₹{(performanceData?.summary?.totalOrderRs || 0).toLocaleString()}</div>
            </div>
          </div>
          <div className="mt-2 flex items-center">
            <span className="text-gray-500 text-sm">Current selection</span>
          </div>
        </div>

        {/* Avg Order Size */}
        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-yellow-500 hover:-translate-y-1 transition-transform duration-300">
          <div className="mb-3">
            <div className="text-gray-600 font-medium mb-1">Avg Order Size</div>
            <div className="text-2xl font-bold text-gray-800">₹{(performanceData?.summary?.avgOrderValue || 0).toLocaleString()}</div>
          </div>
          <div className="mt-2 flex items-center">
            <span className="text-gray-500 text-sm">Mean value</span>
          </div>
        </div>
      </div>

      <hr className="my-6" />

      {/* Additional Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Frenchisee Type
          </label>
          <select
            value={filters.franchiseeType}
            onChange={(e) => handleFilterChange('franchiseeType', e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="startup">Start Up(Dealer)</option>
            <option value="startup">Basic</option>
            <option value="enterprice">Enterprice</option>
            <option value="solarbussiness">Solar Bussiness</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Frenchisee Name
          </label>
          <select
            value={filters.franchiseeName}
            onChange={(e) => handleFilterChange('franchiseeName', e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="startup">Ramesh Pandit</option>
            <option value="startup">Mayank Agarwal</option>
            <option value="enterprice">Priyank Patel</option>
            <option value="solarbussiness">Priya Sharma</option>
            <option value="solarbussiness">Shruti Mehta</option>
            <option value="solarbussiness">Kiran Patel</option>
            <option value="solarbussiness">Amit Shah</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Timeline
          </label>
          <select
            value={filters.timeline2}
            onChange={(e) => handleFilterChange('timeline2', e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="q1">January-March</option>
            <option value="q2">April-June</option>
            <option value="q3">July-September</option>
            <option value="q4">October-December</option>
          </select>
        </div>
      </div>

      {/* Map and Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Map */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-blue-600 text-white px-5 py-3">
            <h5 className="font-semibold text-lg">Gujarat District Map</h5>
          </div>
          <div className="p-0">
            <div ref={mapRef} className="h-[450px] w-full"></div>
          </div>
        </div>

        {/* Frenchisee Chart */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="bg-white px-5 py-4 border-b">
            <h4 className="font-semibold text-lg text-green-600 flex items-center">
              <BarChart3 className="mr-2" size={20} />
              Frenchisee Chart
            </h4>
          </div>
          <div className="p-5">
            <div ref={chart1Ref}></div>
          </div>
        </div>
      </div>

      <hr className="my-6" />

      {/* Second Filters Section */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div>
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            <option>Solar Rooftop</option>
            <option>Solar Pump</option>
          </select>
        </div>
        <div>
          <select
            value={filters.subCategory}
            onChange={(e) => handleFilterChange('subCategory', e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Sub Categories</option>
            <option>Residential</option>
            <option>Commercial</option>
          </select>
        </div>
        <div>
          <select
            value={filters.projectType}
            onChange={(e) => handleFilterChange('projectType', e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Project Type</option>
            <option>3kw - 5kw</option>
            <option>5kw - 10kw</option>
          </select>
        </div>
        <div>
          <select
            value={filters.subProject}
            onChange={(e) => handleFilterChange('subProject', e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Sub Project</option>
            <option>OnGrid</option>
            <option>OffGrid</option>
            <option>Hybrid</option>
          </select>
        </div>
        <div>
          <select
            value={filters.timeline2}
            onChange={(e) => handleFilterChange('timeline2', e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="q1" disabled>Timeline</option>
            <option value="q1">January-March</option>
            <option value="q2">April-June</option>
            <option value="q3">July-September</option>
            <option value="q4">October-December</option>
          </select>
        </div>
      </div>

      {/* Franchise Manager Orders Chart */}
      <div className="bg-white rounded-xl shadow-sm mb-8">
        <div className="bg-white px-5 py-4 border-b">
          <h4 className="font-semibold text-lg text-green-600 flex items-center">
            <BarChart3 className="mr-2" size={20} />
            Franchise Manager Orders Chart
          </h4>
        </div>
        <div className="p-5">
          <div ref={chart2Ref}></div>
        </div>
      </div>


      {/* Charts and Dealer Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Orders by Cluster */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h5 className="font-semibold text-lg text-blue-600 mb-4">Orders by Cluster</h5>
          <div ref={clusterChartRef}></div>
        </div>

        {/* Dealer Performance */}
        <div className="bg-white rounded-xl shadow-sm border-0 p-5">
          <h5 className="font-semibold text-lg text-gray-800 mb-4">Dealer Performance</h5>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 border">Franchisee Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 border">Dealer Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 border">Orders</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 border">Performance</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 border">Status</th>
                </tr>
              </thead>
              <tbody>
                {performanceData?.tableData?.map((row, index) => (
                  <tr key={row.id || index} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700 border">{row.franchiseeName}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 border">{row.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 border">{row.totalOrders || 0}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 border">{row.conversion || 0}%</td>
                    <td className="px-4 py-3 border">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.status === 'Performer' ? 'bg-green-100 text-green-800' :
                        row.status === 'Active' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!performanceData?.tableData || performanceData.tableData.length === 0) && (
                  <tr><td colSpan="5" className="px-4 py-10 text-center text-gray-500">No dealer records found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}