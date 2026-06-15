import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, MapPin, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { productApi } from '../../api/productApi';
import { getPartners, getPartnerPlans } from '../../services/partner/partnerApi';
import { orderAPI } from '../../api/api';
import api from '../../api/axios';

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

export default function AccountManagerDashboard() {
  const navigate = useNavigate();
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);

  // Dynamic filter states
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [projectTypes, setProjectTypes] = useState([]);
  const [subProjectTypes, setSubProjectTypes] = useState([]);
  const [partnerTypes, setPartnerTypes] = useState([]);
  const [partnerPlans, setPartnerPlans] = useState([]);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [catRes, subCatRes, mappingsRes, subPTypeRes, pTypesRes, pPlansRes] = await Promise.all([
          productApi.getCategories(),
          productApi.getSubCategories(),
          productApi.getProjectCategoryMappings(),
          productApi.getSubProjectTypes(),
          getPartners(),
          getPartnerPlans()
        ]);
        
        setCategories(catRes?.data?.data || []);
        setSubCategories(subCatRes?.data?.data || []);
        setSubProjectTypes(subPTypeRes?.data?.data || []);
        setPartnerTypes(pTypesRes || []);
        setPartnerPlans(pPlansRes || []);

        // Extract unique project type ranges (e.g., "3 to 10 kW")
        const mappings = mappingsRes?.data?.data || [];
        const uniqueRanges = new Set();
        mappings.forEach(m => {
          if (m.projectTypeFrom !== undefined && m.projectTypeTo !== undefined) {
            uniqueRanges.add(`${m.projectTypeFrom} to ${m.projectTypeTo} kW`);
          }
        });
        setProjectTypes(Array.from(uniqueRanges).map(range => ({ name: range })));

      } catch (err) {
        console.error("Failed to fetch filter data from DB", err);
      }
    };
    fetchFilters();
  }, []);

  // Mock data to simulate DB fetch
  const locationData = {
    countries: [{ id: 'IN', name: 'India', code: 'IN' }],
    states: {
      'IN': [
        { id: 'GU', name: 'Gujarat', code: 'GU' },
        { id: 'MA', name: 'Maharashtra', code: 'MA' },
        { id: 'RA', name: 'Rajasthan', code: 'RA' }
      ]
    },
    clusters: {
      'GU': [
        { id: 'NGUJ', name: 'North GUJ', code: 'GU' },
        { id: 'SGUJ', name: 'South GUJ', code: 'GU' },
        { id: 'WGUJ', name: 'West GUJ', code: 'GU' }
      ]
    },
    districts: {
      'NGUJ': [
        { id: 'AHM', name: 'Ahmedabad', code: 'NORTH GUJ' },
        { id: 'GAN', name: 'Gandhinagar', code: 'NORTH GUJ' },
        { id: 'MEH', name: 'Mehsana', code: 'NORTH GUJ' }
      ]
    }
  };

  const [pendingOrders, setPendingOrders] = useState([]);
  const [mapData, setMapData] = useState([]);
  const mapRef = useRef(null);

  useEffect(() => {
    const fetchOrdersData = async () => {
      try {
        const res = await orderAPI.getAllOrders();
        const rawData = res.data?.data || res.data || [];
        // Ensure allOrders is an array (some APIs return it inside a property like .orders or .items)
        const allOrders = Array.isArray(rawData) 
          ? rawData 
          : (Array.isArray(rawData.orders) ? rawData.orders : []);
        
        // Filter for CP pending orders
        const pending = allOrders.filter(order => 
          order.status?.toLowerCase() === 'pending' || 
          order.paymentStatus?.toLowerCase() === 'pending'
        );
        
        const formattedPending = pending.map(order => ({
          id: order.orderId || order._id,
          cpName: order.cpName || order.partner?.name || order.user?.name || 'Unknown CP',
          project: order.projectName || order.product?.name || order.category?.name || 'Project',
          date: order.orderDate || order.createdAt ? new Date(order.orderDate || order.createdAt).toLocaleDateString() : 'N/A',
          amount: order.amount || order.totalAmount || 0,
          status: 'Pending',
          dbId: order._id
        }));
        
        setPendingOrders(formattedPending);

        // Map data from orders
        const locations = allOrders.filter(o => o.location?.lat && o.location?.lng).map(o => ({
          name: o.projectName || o.customerName || 'Customer',
          message: o.status || 'Active',
          position: { lat: o.location.lat, lng: o.location.lng }
        }));
        
        if (locations.length === 0) {
           locations.push(
            { name: "Ahmedabad Project", message: "Pending", position: { lat: 23.0225, lng: 72.5714 } },
            { name: "Surat Customer", message: "In Progress", position: { lat: 21.1702, lng: 72.8311 } },
            { name: "Rajkot Site", message: "Completed", position: { lat: 22.3039, lng: 70.8022 } },
            { name: "Vadodara Install", message: "Pending", position: { lat: 22.3072, lng: 73.1812 } },
            { name: "Bhavnagar Project", message: "Active", position: { lat: 21.7645, lng: 72.1519 } }
           );
        }
        setMapData(locations);
      } catch (err) {
        console.error("Failed to fetch orders data", err);
      }
    };
    fetchOrdersData();
  }, []);

  const initMap = () => {
    if (!mapRef.current) return;
    const map = new window.google.maps.Map(mapRef.current, {
      zoom: 7,
      center: { lat: 22.9734, lng: 72.5700 },
      styles: [
        { featureType: "poi", stylers: [{ visibility: "off" }] }
      ]
    });
    mapData.forEach(d => {
      const marker = new window.google.maps.Marker({
        position: d.position,
        map,
        title: d.name,
      });
      const info = new window.google.maps.InfoWindow({
        content: `<div class="p-2"><strong class="text-sm">${d.name}</strong><br><span class="text-xs text-gray-600">Status: ${d.message}</span></div>`,
      });
      marker.addListener("click", () => info.open(map, marker));
    });
  };

  useEffect(() => {
    if (mapData.length > 0) {
      loadGoogleMapsScript(initMap);
    }
  }, [mapData]);

  const [installerPayments, setInstallerPayments] = useState([]);
  const [solarKitPayments, setSolarKitPayments] = useState([]);
  const [installerTypeFilter, setInstallerTypeFilter] = useState('All');

  useEffect(() => {
    const fetchDashboardTables = async () => {
      try {
        const [installerRes, signupRes] = await Promise.all([
          api.get(`/dashboard/account-manager/installer-payments?installerType=${installerTypeFilter}`),
          api.get('/dashboard/account-manager/partner-signups')
        ]);
        setInstallerPayments(installerRes.data?.data || []);
        setSolarKitPayments(signupRes.data?.data || []);
      } catch (err) {
        console.error("Failed to fetch dashboard tables", err);
      }
    };
    fetchDashboardTables();
  }, [installerTypeFilter]);

  const filterOptions = [
    { placeholder: 'Time Duration', options: ['This Month', 'Last Month', 'This Quarter', 'This Year'] },
    { placeholder: 'Select Category', options: categories.map(c => c.name) },
    { placeholder: 'Select Sub Category', options: subCategories.map(c => c.name) },
    { placeholder: 'Project Type', options: projectTypes.map(c => c.name) },
    { placeholder: 'Select Sub type', options: subProjectTypes.map(c => c.name) },
    { placeholder: 'Partner type', options: partnerTypes.map(pt => pt.name) },
    { placeholder: 'Partner plans', options: partnerPlans.map(pp => pp.name) }
  ];

  const renderCards = (title, items, selectedId, onSelect, allLabel) => (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-[15px] font-bold text-[#142340]">{title}</h2>
        <button className="text-blue-600 text-xs font-semibold hover:underline">Select All</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {/* All Card */}
        <div 
          onClick={() => onSelect(null)}
          className={`bg-white rounded-lg shadow-sm border p-4 flex flex-col items-center justify-center transition-all cursor-pointer ${
            selectedId === null ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 hover:border-blue-300'
          }`}
        >
          <h3 className="text-sm font-bold text-[#142340] text-center">{allLabel}</h3>
          <p className="text-[10px] text-gray-400 mt-1 uppercase font-semibold">ALL</p>
        </div>
        
        {/* Item Cards */}
        {items?.map((item) => (
          <div 
            key={item.id} 
            onClick={() => onSelect(item.id)}
            className={`bg-white rounded-lg shadow-sm border p-4 flex flex-col items-center justify-center transition-all cursor-pointer ${
              selectedId === item.id ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <h3 className="text-sm font-bold text-[#142340] text-center">{item.name}</h3>
            <p className="text-[10px] text-gray-400 mt-1 uppercase font-semibold">{item.code}</p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col space-y-6 min-h-screen pb-10 bg-[#f8f9fa] p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#142340]">Account Dashboard</h1>
      </div>

      {/* Cascading Location Selection */}
      <div className="space-y-2 mt-4">
        {renderCards('Select Country', locationData.countries, selectedCountry, (id) => {
          setSelectedCountry(id);
          setSelectedState(null);
          setSelectedCluster(null);
          setSelectedDistrict(null);
        }, 'All Countries')}

        {selectedCountry && renderCards('Select State', locationData.states[selectedCountry], selectedState, (id) => {
          setSelectedState(id);
          setSelectedCluster(null);
          setSelectedDistrict(null);
        }, 'All States')}

        {selectedState && renderCards('Select Cluster', locationData.clusters[selectedState], selectedCluster, (id) => {
          setSelectedCluster(id);
          setSelectedDistrict(null);
        }, 'All Clusters')}

        {selectedCluster && renderCards('Select District', locationData.districts[selectedCluster], selectedDistrict, (id) => {
          setSelectedDistrict(id);
        }, 'All Districts')}
      </div>
      
      {/* Filters Row */}
      <div className="flex flex-wrap gap-4 mt-4">
        {filterOptions.map((filter, idx) => (
          <div key={idx} className="relative">
            <select className="appearance-none bg-white border border-gray-200 text-gray-700 py-2 px-4 pr-8 rounded leading-tight focus:outline-none text-sm w-48 shadow-sm">
              <option value="">{filter.placeholder}</option>
              {filter.options.map((opt, oIdx) => (
                <option key={oIdx} value={opt}>{opt}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
              <ChevronDown size={14} />
            </div>
          </div>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm flex flex-col items-start justify-between">
          <p className="text-[11px] font-bold text-gray-500 tracking-wider">PROJECT SIGNUP</p>
          <p className="text-3xl font-bold text-[#3478c9] mt-2">42</p>
          <span className="mt-3 bg-[#2cb25d] text-white text-[10px] font-bold px-2 py-1 rounded">+5 this month</span>
        </div>
        <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm flex flex-col items-start justify-between">
          <p className="text-[11px] font-bold text-gray-500 tracking-wider">TOTAL ORDER AMOUNT</p>
          <p className="text-3xl font-bold text-[#2cb25d] mt-2">₹12,75,000</p>
          <span className="mt-3 bg-[#2cb25d] text-white text-[10px] font-bold px-2 py-1 rounded">+15% from last month</span>
        </div>
        <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-gray-500 tracking-wider">PENDING PAYMENT</p>
              <p className="text-xl font-bold text-red-500 mt-1">8 Projects</p>
              <p className="text-sm font-semibold text-gray-700">₹2,45,000</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-500 tracking-wider">OVERDUE PAYMENT</p>
              <p className="text-xl font-bold text-red-500 mt-1">2 Projects</p>
              <p className="text-sm font-semibold text-gray-700">₹1,25,000</p>
            </div>
          </div>
          <span className="mt-3 bg-[#fbb03b] text-white text-[10px] font-bold px-2 py-1 rounded w-max">Action required</span>
        </div>
        <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm flex flex-col items-start justify-between">
          <p className="text-[11px] font-bold text-gray-500 tracking-wider">PENDING INSTALLATIONS</p>
          <p className="text-3xl font-bold text-[#f29f05] mt-2">15</p>
          <div className="flex items-center mt-3 space-x-2">
             <span className="bg-[#48a9a6] text-white text-[10px] font-bold px-2 py-1 rounded">5 scheduled this week</span>
             <span className="text-red-500 font-bold text-[11px]">Rs: 2,40,000</span>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-[#1e73be] text-white p-3 font-semibold text-sm">
          Gujarat District Map
        </div>
        <div ref={mapRef} className="w-full h-80 relative overflow-hidden bg-gray-100 flex items-center justify-center">
          {/* Google map renders here */}
        </div>
      </div>

      {/* CP Pending Orders */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
        <h3 className="text-[15px] font-bold text-gray-800 mb-4">CP Pending Orders</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#7fb4eb] text-white">
              <tr>
                <th className="px-4 py-3 font-medium rounded-tl">Order ID</th>
                <th className="px-4 py-3 font-medium">CP Name</th>
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">Order Date</th>
                <th className="px-4 py-3 font-medium">Amount (₹)</th>
                <th className="px-4 py-3 font-medium rounded-tr">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pendingOrders.map((order, idx) => (
                <tr key={idx} className="hover:bg-gray-50 text-gray-700">
                  <td className="px-4 py-3">
                    <button 
                      onClick={() => navigate(`/account/projects/${order.dbId || order.id}`)}
                      className="text-blue-600 font-bold hover:underline"
                    >
                      {order.id}
                    </button>
                  </td>
                  <td className="px-4 py-3">{order.cpName}</td>
                  <td className="px-4 py-3">{order.project}</td>
                  <td className="px-4 py-3">{order.date}</td>
                  <td className="px-4 py-3">{order.amount}</td>
                  <td className="px-4 py-3">
                    <span className="bg-[#ffc107] text-gray-900 text-[11px] px-2 py-0.5 rounded font-medium">{order.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payments Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CP Installer Payments */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[15px] font-bold text-gray-800">CP Installer Payments</h3>
            <select 
              value={installerTypeFilter} 
              onChange={(e) => setInstallerTypeFilter(e.target.value)}
              className="border border-gray-300 rounded text-[12px] px-2 py-1 text-gray-700 outline-none focus:border-blue-400"
            >
              <option value="All">All Installers</option>
              <option value="Company">Company</option>
              <option value="Partner">Partner</option>
            </select>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-[13px] text-left">
              <thead className="bg-[#7fb4eb] text-white">
                <tr>
                  <th className="px-3 py-2 font-medium rounded-tl">Installer</th>
                  <th className="px-3 py-2 font-medium">CP</th>
                  <th className="px-3 py-2 font-medium">Pending (₹)</th>
                  <th className="px-3 py-2 font-medium">Due Date</th>
                  <th className="px-3 py-2 font-medium rounded-tr">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {installerPayments.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 text-gray-700">
                    <td className="px-3 py-3 font-medium">{item.installer}</td>
                    <td className="px-3 py-3">{item.cp}</td>
                    <td className="px-3 py-3">{item.pending}</td>
                    <td className="px-3 py-3">{item.dueDate}</td>
                    <td className="px-3 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${item.status === 'Overdue' ? 'bg-[#e53935] text-white' : 'bg-[#ffc107] text-gray-900'}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <button className="bg-[#0b74ba] hover:bg-[#095c94] transition-colors text-white text-[12px] font-medium px-4 py-1.5 rounded">Process Payments</button>
          </div>
        </div>

        {/* Partner Project Signup */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 flex flex-col">
          <h3 className="text-[15px] font-bold text-gray-800 mb-4">Partner Project Signup</h3>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-[13px] text-left">
              <thead className="bg-[#7fb4eb] text-white">
                <tr>
                  <th className="px-3 py-2 font-medium rounded-tl">CP</th>
                  <th className="px-3 py-2 font-medium">Kit Type</th>
                  <th className="px-3 py-2 font-medium">Pending (₹)</th>
                  <th className="px-3 py-2 font-medium">Due Date</th>
                  <th className="px-3 py-2 font-medium rounded-tr">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {solarKitPayments.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 text-gray-700">
                    <td className="px-3 py-3 font-medium">{item.cp}</td>
                    <td className="px-3 py-3">{item.kitType}</td>
                    <td className="px-3 py-3">{item.pending}</td>
                    <td className="px-3 py-3">{item.dueDate}</td>
                    <td className="px-3 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${item.status === 'Overdue' ? 'bg-[#e53935] text-white' : 'bg-[#ffc107] text-gray-900'}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <button className="bg-[#0b74ba] hover:bg-[#095c94] transition-colors text-white text-[12px] font-medium px-4 py-1.5 rounded">Process Payments</button>
          </div>
        </div>
      </div>

    </div>
  );
}
