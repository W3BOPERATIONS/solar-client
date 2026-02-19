import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, X, Trash2, Edit } from 'lucide-react';
import { getRoles, createRole, updateRole, deleteRole, getDepartments } from '../../../services/hrService';
import { toast } from 'react-hot-toast';

export default function RoleSettings() {
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    level: '',
    parentRole: '',
  });

  const [selectedMandatoryTasks, setSelectedMandatoryTasks] = useState([]);
  const [selectedOptionalTasks, setSelectedOptionalTasks] = useState([]);
  const [selectedRights, setSelectedRights] = useState([]);

  // UI State
  const [showForm, setShowForm] = useState(false);

  const allTasks = [
    "Vendor Select",
    "Track Delivery Orders (Overdue Status)",
    "Create Delivery Plan",
    "Manage Team",
    "Supplier Vendor Onboarding",
    "Recruitment",
    "Payroll Module",
    "CPRM Goals"
  ];

  const allLevels = ["Country", "State", "Cluster", "District", "Zone"];

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [deptRes, roleRes] = await Promise.all([getDepartments(), getRoles()]);
      if (deptRes.success) setDepartments(deptRes.data);
      if (roleRes.success) setRoles(roleRes.data);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load initial data");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleTaskToggle = (task, type) => {
    if (type === 'mandatory') {
      setSelectedMandatoryTasks(prev =>
        prev.includes(task) ? prev.filter(t => t !== task) : [...prev, task]
      );
    } else {
      setSelectedOptionalTasks(prev =>
        prev.includes(task) ? prev.filter(t => t !== task) : [...prev, task]
      );
    }
  };

  const handleRightToggle = (right) => {
    setSelectedRights(prev =>
      prev.includes(right) ? prev.filter(r => r !== right) : [...prev, right]
    );
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.department) {
      toast.error("Position Name and Department are required");
      return;
    }

    const payload = {
      name: formData.name, // maps to 'position' in UI
      department: formData.department,
      level: formData.level,
      parentRole: formData.parentRole || null,
      mandatoryTasks: selectedMandatoryTasks,
      optionalTasks: selectedOptionalTasks,
      rights: selectedRights
    };

    try {
      const res = await createRole(payload);
      if (res.success) {
        toast.success("Role created successfully");
        setShowForm(false);
        resetForm();
        fetchInitialData(); // refresh list
      }
    } catch (error) {
      console.error("Create role error:", error);
      toast.error(error.response?.data?.message || "Failed to create role");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this role?")) return;
    try {
      const res = await deleteRole(id);
      if (res.success) {
        toast.success("Role deleted");
        fetchInitialData();
      }
    } catch (error) {
      console.error("Delete role error:", error);
      toast.error("Failed to delete role");
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      department: '',
      level: '',
      parentRole: ''
    });
    setSelectedMandatoryTasks([]);
    setSelectedOptionalTasks([]);
    setSelectedRights([]);
  };

  const openCreateForm = () => {
    setShowForm(true);
    resetForm();
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-4">
        <nav className="bg-white p-3 rounded-lg shadow-sm flex justify-between items-center">
          <h3 className="font-bold text-xl mb-0">Role Based Task Allocation</h3>
          <button
            onClick={openCreateForm}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            + Add Role
          </button>
        </nav>
      </div>

      {/* Form Wrapper */}
      {showForm && (
        <div className="card shadow-lg rounded-xl overflow-hidden mb-6 bg-white p-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-lg">Create New Role</h4>
            <button onClick={() => setShowForm(false)}><X /></button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200 text-center align-middle">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="p-3">Position Name</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Level</th>
                  <th className="p-3">Parent Position</th>
                  <th className="p-3">Mandatory Tasks</th>
                  <th className="p-3">Optional Tasks</th>
                  <th className="p-3">Rights</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-3 border">
                    <input
                      type="text"
                      className="w-full p-2 border rounded"
                      placeholder="Enter Position"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                    />
                  </td>
                  <td className="p-3 border">
                    <select
                      className="w-full p-2 border rounded"
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                    >
                      <option value="">Select Dept</option>
                      {departments.map(d => (
                        <option key={d._id} value={d._id}>{d.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3 border">
                    <select
                      className="w-full p-2 border rounded"
                      value={formData.level}
                      onChange={(e) => handleInputChange('level', e.target.value)}
                    >
                      <option value="">Select Level</option>
                      {allLevels.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </td>
                  <td className="p-3 border">
                    <select
                      className="w-full p-2 border rounded"
                      value={formData.parentRole}
                      onChange={(e) => handleInputChange('parentRole', e.target.value)}
                    >
                      <option value="">Select Parent</option>
                      {roles.map(r => (
                        <option key={r._id} value={r._id}>{r.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3 border text-left">
                    <div className="h-32 overflow-y-auto border p-2">
                      {allTasks.map(task => (
                        <div key={task} className="flex items-center">
                          <input
                            type="checkbox"
                            className="mr-2"
                            checked={selectedMandatoryTasks.includes(task)}
                            onChange={() => handleTaskToggle(task, 'mandatory')}
                          />
                          <span className="text-sm">{task}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 border text-left">
                    <div className="h-32 overflow-y-auto border p-2">
                      {allTasks.map(task => (
                        <div key={task} className="flex items-center">
                          <input
                            type="checkbox"
                            className="mr-2"
                            checked={selectedOptionalTasks.includes(task)}
                            onChange={() => handleTaskToggle(task, 'optional')}
                          />
                          <span className="text-sm">{task}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 border text-left">
                    <div className="space-y-1">
                      {['View', 'Edit', 'Delete', 'Archive'].map((right) => (
                        <div key={right} className="flex items-center">
                          <input
                            type="checkbox"
                            className="mr-2"
                            checked={selectedRights.includes(right)}
                            onChange={() => handleRightToggle(right)}
                          />
                          <label>{right}</label>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 border">
                    <button
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm"
                      onClick={handleSubmit}
                    >
                      Save
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* List Wrapper */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full border border-gray-200 text-center align-middle">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="p-3">Position</th>
              <th className="p-3">Department</th>
              <th className="p-3">Level</th>
              <th className="p-3">Parent</th>
              <th className="p-3">Mandatory Tasks</th>
              <th className="p-3">Optional Tasks</th>
              <th className="p-3">Rights</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" className="p-4">Loading...</td></tr>
            ) : roles.length === 0 ? (
              <tr><td colSpan="8" className="p-4 text-gray-500">No roles found. Create one above.</td></tr>
            ) : (
              roles.map(role => {
                // Find department name
                const dept = departments.find(d => d._id === role.department);
                const parent = roles.find(r => r._id === role.parentRole);

                return (
                  <tr key={role._id} className="hover:bg-gray-50">
                    <td className="p-3 border">{role.name}</td>
                    <td className="p-3 border">{dept ? dept.name : '-'}</td>
                    <td className="p-3 border">{role.level || '-'}</td>
                    <td className="p-3 border">{parent ? parent.name : '-'}</td>
                    <td className="p-3 border">
                      <ul className="list-disc pl-4 text-left text-xs">
                        {role.mandatoryTasks?.map((t, i) => <li key={i}>{t}</li>)}
                      </ul>
                    </td>
                    <td className="p-3 border">
                      <ul className="list-disc pl-4 text-left text-xs">
                        {role.optionalTasks?.map((t, i) => <li key={i}>{t}</li>)}
                      </ul>
                    </td>
                    <td className="p-3 border">
                      <div className="flex gap-1 flex-wrap">
                        {role.rights?.map((r, i) => (
                          <span key={i} className="bg-gray-200 px-1 rounded text-xs">{r}</span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 border">
                      <button
                        onClick={() => handleDelete(role._id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}