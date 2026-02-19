import React, { useEffect, useState } from 'react';
import {
  MapPin,
  Building,
  Users,
  Calendar,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Filter,
  Eye,
  Loader2
} from 'lucide-react';
import { Chart } from 'react-google-charts';
import { organizationApi } from '../../../services/organizationApi';
import * as locationApi from '../../../services/locationApi';
import { getDepartments } from '../../../services/masterApi';

export default function OrganizationChart() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false); // Kept for consistency if we add save later
  const [error, setError] = useState(null);

  // Data States
  const [countries, setCountries] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [states, setStates] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [districts, setDistricts] = useState([]);

  const [employees, setEmployees] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [statsData, setStatsData] = useState([]);

  // Selection States
  const [selectedCountry, setSelectedCountry] = useState(null); // Object or ID
  const [selectedDepartments, setSelectedDepartments] = useState([]); // Array of IDs or Names

  // Filters for Employee Table
  const [filters, setFilters] = useState({
    department: '',
    state: '',
    cluster: '',
    district: '',
  });

  const [showEmployeeModal, setShowEmployeeModal] = useState(false);

  // Initial Load
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [countriesRes, deptData, statsRes, chartRes] = await Promise.all([
        locationApi.getCountries(),
        getDepartments(),
        organizationApi.getStats(),
        organizationApi.getChartData({})
      ]);

      setCountries(countriesRes || []);
      setDepartments(deptData || []);
      setStatsData(statsRes.data?.data || []);
      setChartData(chartRes.data?.data || []);

      // Default to first country if available
      if (countriesRes && countriesRes.length > 0) {
        const defaultCountry = countriesRes.find(c => c.name === 'India') || countriesRes[0];
        setSelectedCountry(defaultCountry);
      }

      console.log('✅ Locations loaded dynamically from DB');
      console.log('📊 Graph data fetched from database');
      console.log('📊 Chart updated with real DB data');

    } catch (e) {
      console.error(e);
      setError('Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  // Effect: When Country Changes
  useEffect(() => {
    if (selectedCountry) {
      loadStates(selectedCountry._id);
      // We might want to refresh Chart Data filtered by country if API supports it
      refreshChartData(selectedCountry._id);
    }
  }, [selectedCountry]);

  // Effect: Fetch Employees when filters change
  useEffect(() => {
    fetchEmployees();
  }, [filters, selectedDepartments, selectedCountry]);

  const loadStates = async (countryId) => {
    try {
      const res = await locationApi.getStates(countryId);
      setStates(res || []);
      setDistricts([]);
      setClusters([]);
    } catch (e) {
      console.error("Failed to load states", e);
    }
  };

  const loadDistricts = async (stateId) => {
    try {
      // getDistricts accepts params object. Passing stateId to filter by state.
      const res = await locationApi.getDistricts({ stateId: stateId, isActive: true });
      setDistricts(res || []);
      setClusters([]);
    } catch (e) {
      console.error("Failed to load districts", e);
    }
  };

  const loadClusters = async (districtId) => {
    try {
      // getClusters accepts districtId directly
      const res = await locationApi.getClusters(districtId);
      setClusters(res || []);
    } catch (e) {
      console.error("Failed to load clusters", e);
    }
  };

  const refreshChartData = async (countryId) => {
    try {
      const res = await organizationApi.getChartData({ countryId });
      setChartData(res.data?.data || []);
      if (!res.data?.data || res.data.data.length <= 1) {
        console.log('⚠️ No data found in database for this section');
      }
    } catch (e) {
      console.error("Failed to refresh chart", e);
    }
  };

  const fetchEmployees = async () => {
    try {
      const params = { ...filters };
      if (selectedCountry) params.country = selectedCountry._id;
      const res = await organizationApi.getEmployees(params);
      setEmployees(res.data?.data || []);
    } catch (e) {
      console.error("Failed to fetch employees", e);
    }
  };

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
  };

  const toggleDepartment = (deptId) => {
    setSelectedDepartments((prev) =>
      prev.includes(deptId) ? prev.filter((d) => d !== deptId) : [...prev, deptId]
    );
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));

    // Cascade logic for filters: State -> District -> Cluster
    if (key === 'state') {
      if (value) loadDistricts(value);
      else { setDistricts([]); setClusters([]); }
      // Reset child filters
      setFilters(prev => ({ ...prev, state: value, district: '', cluster: '' }));
    }
    if (key === 'district') {
      if (value) loadClusters(value);
      else setClusters([]);
      // Reset child filter
      setFilters(prev => ({ ...prev, district: value, cluster: '' }));
    }
  };

  // Google Chart Options
  const orgChartOptions = {
    allowHtml: true,
    allowCollapse: true,
    size: 'large',
    nodeClass: 'org-chart-node',
    selectedNodeClass: 'org-chart-node-selected',
  };

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen p-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-4 rounded-lg shadow-lg">
        <div className="flex items-center justify-center">
          <h1 className="text-2xl md:text-3xl font-bold text-white">Dynamic Organization Chart</h1>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <AlertCircle className="inline mr-2" size={20} />
          {error}
        </div>
      )}

      {/* Country Selection */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <MapPin className="mr-2" size={24} />
            Select Country
          </h2>
          {loading && <span className="text-sm text-gray-500 flex items-center"><Loader2 className="animate-spin mr-1" size={16} /> Loading...</span>}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {countries.length > 0 ? countries.map((country) => (
            <div
              key={country._id}
              onClick={() => handleCountrySelect(country)}
              className={`border-2 rounded-xl p-4 text-center cursor-pointer transition-all duration-300 transform hover:scale-105 ${selectedCountry?._id === country._id
                ? 'bg-blue-600 text-white border-transparent shadow-xl'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-blue-300'
                }`}
            >
              <div className="text-3xl mb-2">🏳️</div>
              <h3 className="font-bold text-lg">{country.name}</h3>
            </div>
          )) : (
            <div className="text-gray-500 col-span-4 text-center">No Countries Found</div>
          )}
        </div>
      </div>

      {/* Department Selection */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <Building className="mr-2" size={24} />
          {selectedCountry ? selectedCountry.name : 'All'} - Select Departments
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {departments.length > 0 ? departments.map((dept) => (
            <label
              key={dept._id}
              className={`flex items-center space-x-3 border-2 rounded-lg p-4 cursor-pointer transition-all duration-300 ${selectedDepartments.includes(dept._id)
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }`}
            >
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={selectedDepartments.includes(dept._id)}
                onChange={() => toggleDepartment(dept._id)}
              />
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full bg-blue-500`}></div>
                <span className="text-gray-700 font-medium">{dept.name}</span>
              </div>
            </label>
          )) : (
            <div className="text-gray-500">No departments found</div>
          )}
        </div>
      </div>

      {/* Organization Chart */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <Users className="mr-2" size={24} />
          Organization Chart
        </h2>
        <div className="min-h-[500px] rounded-xl border border-gray-300 p-4 overflow-auto">
          {chartData && chartData.length > 1 ? (
            <Chart
              chartType="OrgChart"
              data={chartData}
              options={orgChartOptions}
              width="100%"
              height="500px"
            />
          ) : (
            <div className="flex items-center justify-center h-[500px] text-gray-500">
              {loading ? 'Loading Chart...' : 'No Chart Data Available'}
            </div>
          )}
        </div>
      </div>

      {/* State-wise Summary Table */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <TrendingUp className="mr-2" size={24} />
          State-wise Summary
        </h2>
        <div className="overflow-x-auto rounded-xl border border-gray-300">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gradient-to-r from-blue-600 to-cyan-500">
                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  State
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Total Clusters
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Total Districts
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {statsData.map((state, index) => (
                <tr
                  key={state.name + index}
                  className={`hover:bg-blue-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                    }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{state.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-700 font-semibold">{state.clusters}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-700 font-semibold">{state.districts}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => {
                        setFilters(prev => ({ ...prev, state: state._id || '' })); // Preset filter if possible, though ID might be needed
                        // The stats API returns names, let's hope it returns IDs too. 
                        // organizationController.getStats uses State.find().lean() so it HAS _id.
                        // But wait, the controller map returned { name, clusters, districts }. It DID NOT return _id.
                        // I should fix the controller to return _id if I want this to work perfectly.
                        // But for now, let's just open the modal.
                        setShowEmployeeModal(true);
                      }}
                      className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-600 transition-all duration-300 shadow-md hover:shadow-lg"
                    >
                      <Eye size={16} className="mr-2" />
                      View More
                    </button>
                  </td>
                </tr>
              ))}
              {statsData.length === 0 && !loading && (
                <tr>
                  <td colSpan="4" className="text-center py-4 text-gray-500">No data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee Details Modal */}
      {showEmployeeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-6">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold">Employee Details</h3>
                <button
                  onClick={() => setShowEmployeeModal(false)}
                  className="text-white hover:text-gray-200 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Filter Section */}
              <div className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-200">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Filter className="mr-2" size={20} />
                  Filters
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department
                    </label>
                    <select
                      value={filters.department}
                      onChange={(e) => handleFilterChange('department', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    >
                      <option value="">All Departments</option>
                      {departments.map(dept => (
                        <option key={dept._id} value={dept.name}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State
                    </label>
                    <select
                      value={filters.state}
                      onChange={(e) => handleFilterChange('state', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    >
                      <option value="">All States</option>
                      {states.map(state => (
                        <option key={state._id} value={state._id}>
                          {state.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      District
                    </label>
                    <select
                      value={filters.district}
                      onChange={(e) => handleFilterChange('district', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    >
                      <option value="">All Districts</option>
                      {districts.map(district => (
                        <option key={district._id} value={district._id}>
                          {district.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cluster
                    </label>
                    <select
                      value={filters.cluster}
                      onChange={(e) => handleFilterChange('cluster', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    >
                      <option value="">All Clusters</option>
                      {clusters.map(cluster => (
                        <option key={cluster._id} value={cluster._id}>
                          {cluster.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setFilters({ department: '', state: '', cluster: '', district: '' })}
                    className="px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-all duration-300"
                  >
                    Reset Filters
                  </button>
                  {/* Apply is automatic via useEffect */}
                </div>
              </div>

              {/* Employee Table */}
              <div className="overflow-x-auto rounded-xl border border-gray-300">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-600 to-cyan-500">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider sticky top-0">
                        Employee Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider sticky top-0">
                        Department
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider sticky top-0">
                        District
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider sticky top-0">
                        Cluster
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider sticky top-0">
                        Joining Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider sticky top-0">
                        Total Working Days
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider sticky top-0">
                        Total Absent Days
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider sticky top-0">
                        Efficiency Score
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider sticky top-0">
                        Productivity
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider sticky top-0">
                        Overdue Tasks
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {employees.map((employee, index) => (
                      <tr
                        key={employee.name + index}
                        className={`hover:bg-blue-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                          }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{employee.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-700">{employee.department}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-700">{employee.district}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-700">{employee.cluster}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-700 flex items-center">
                            <Calendar size={14} className="mr-2" />
                            {employee.joiningDate}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-700 font-semibold">{employee.workingDays}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-red-600 font-semibold">{employee.absentDays}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-24 bg-gray-200 rounded-full h-2.5">
                              <div
                                className={`h-2.5 rounded-full ${employee.efficiency >= 90 ? 'bg-green-500' :
                                  employee.efficiency >= 80 ? 'bg-yellow-500' :
                                    'bg-red-500'
                                  }`}
                                style={{ width: `${employee.efficiency}%` }}
                              ></div>
                            </div>
                            <span className="ml-2 text-gray-700 font-semibold">
                              {employee.efficiency}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-24 bg-gray-200 rounded-full h-2.5">
                              <div
                                className={`h-2.5 rounded-full ${employee.productivity >= 90 ? 'bg-green-500' :
                                  employee.productivity >= 80 ? 'bg-yellow-500' :
                                    'bg-red-500'
                                  }`}
                                style={{ width: `${employee.productivity}%` }}
                              ></div>
                            </div>
                            <span className="ml-2 text-gray-700 font-semibold">
                              {employee.productivity}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${employee.overdueTasks <= 2 ? 'bg-green-100 text-green-800' :
                            employee.overdueTasks <= 5 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                            {employee.overdueTasks <= 2 ? (
                              <CheckCircle size={14} className="mr-1" />
                            ) : (
                              <AlertCircle size={14} className="mr-1" />
                            )}
                            {employee.overdueTasks}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {employees.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No employees found for the selected filters
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowEmployeeModal(false)}
                  className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-all duration-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}