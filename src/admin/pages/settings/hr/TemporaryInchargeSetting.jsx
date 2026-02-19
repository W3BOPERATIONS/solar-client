import React, { useState, useEffect } from 'react';
import { UserCheck, Save, Clock, AlertCircle } from 'lucide-react';
import { createTemporaryIncharge, getTemporaryIncharges, getDepartments, getUsers } from '../../../services/hrService'; // Adjust path
import { toast } from 'react-hot-toast';

export default function TemporaryInchargeSetting() {
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [incharges, setIncharges] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    originalUser: '',
    tempInchargeUser: '',
    department: '',
    startDate: '',
    endDate: '',
    reason: 'Leave'
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [deptRes, inchargeRes] = await Promise.all([
        getDepartments(),
        getTemporaryIncharges()
      ]);

      if (deptRes.success) setDepartments(deptRes.data);
      if (inchargeRes.success) setIncharges(inchargeRes.data);

      // Fetch all users initially or when dept selected? 
      // For now fetch all users to populate dropdowns easily
      const userRes = await getUsers();
      if (userRes.success) {
        // userController returns { users: [...] }, masterController returns { data: [...] }
        setUsers(userRes.users || userRes.data || []);
      }

    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load initial data");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.originalUser || !formData.tempInchargeUser || !formData.department || !formData.startDate || !formData.endDate) {
      toast.error("Please fill all required fields");
      return;
    }

    if (formData.originalUser === formData.tempInchargeUser) {
      toast.error("Original user and Temporary Incharge cannot be the same person");
      return;
    }

    try {
      const res = await createTemporaryIncharge(formData);
      if (res.success) {
        toast.success("Temporary In-charge assigned successfully");
        setFormData({
          originalUser: '',
          tempInchargeUser: '',
          department: '',
          startDate: '',
          endDate: '',
          reason: 'Leave'
        });
        // Refresh list
        const listRes = await getTemporaryIncharges();
        if (listRes.success) setIncharges(listRes.data);
      }
    } catch (error) {
      console.error("Assignment error:", error);
      toast.error(error.response?.data?.message || "Failed to assign temporary in-charge");
    }
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Clock className="text-blue-500" />
          Temporary In-Charge Settings
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Delegate responsibilities temporarily during leaves or absence.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assignment Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold text-lg mb-4 border-b pb-2 flex items-center gap-2">
              <UserCheck size={20} className="text-green-600" />
              Assign New In-Charge
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Department</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept._id} value={dept._id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Original User (On Leave)</label>
                <select
                  name="originalUser"
                  value={formData.originalUser}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select User</option>
                  {users.map(u => (
                    <option key={u._id} value={u._id}>{u.name} ({u.role?.name || 'No Role'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Temporary In-Charge</label>
                <select
                  name="tempInchargeUser"
                  value={formData.tempInchargeUser}
                  onChange={handleInputChange}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select User</option>
                  {users.map(u => (
                    <option key={u._id} value={u._id}>{u.name} ({u.role?.name || 'No Role'})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Reason for temporary assignment..."
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                disabled={loading}
              >
                <Save size={18} />
                Assign In-Charge
              </button>
            </form>
          </div>
        </div>

        {/* Active Assignments List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow overflow-hidden h-full">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800">Active Assignments</h3>
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                {incharges.length} Active
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 text-gray-600 border-b">
                  <tr>
                    <th className="p-4 font-semibold text-sm">Original User</th>
                    <th className="p-4 font-semibold text-sm">Temp In-Charge</th>
                    <th className="p-4 font-semibold text-sm">Department</th>
                    <th className="p-4 font-semibold text-sm">Duration</th>
                    <th className="p-4 font-semibold text-sm">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr><td colSpan="5" className="p-6 text-center text-gray-500">Loading...</td></tr>
                  ) : incharges.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-gray-500 flex flex-col items-center justify-center">
                        <AlertCircle size={32} className="mb-2 text-gray-300" />
                        <p>No active temporary in-charge assignments found.</p>
                      </td>
                    </tr>
                  ) : (
                    incharges.map(inc => (
                      <tr key={inc._id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                          <div className="font-medium text-gray-900">{inc.originalUser?.name || 'Unknown'}</div>
                          <div className="text-xs text-gray-500">{inc.originalUser?.email}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-gray-900">{inc.tempInchargeUser?.name || 'Unknown'}</div>
                          <div className="text-xs text-gray-500">{inc.tempInchargeUser?.email}</div>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {inc.department?.name || '-'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="text-sm text-gray-600">
                            {new Date(inc.startDate).toLocaleDateString()} -
                            <br />
                            {new Date(inc.endDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${inc.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                            {inc.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}