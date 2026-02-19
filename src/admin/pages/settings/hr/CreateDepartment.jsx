import React, { useState, useEffect } from 'react';
import { Building2, PlusCircle, Trash2, Edit } from 'lucide-react';
import { createDepartment, getDepartments, deleteDepartment } from '../../../services/hrService'; // Adjust path as needed
import { toast } from 'react-hot-toast';

export default function CreateDepartment() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    // country: '' // Backend Department model doesn't seem to have country in the viewed file, but prompt asked for dynamic. 
    // The viewed model had: name, code, description, headOfDepartment. 
    // The previous static file had 'country'. I'll stick to 'name' and maybe 'description' based on model.
    // If user insists on country, I'd need to add it to model. For now, let's stick to model schema + name.
    description: ''
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await getDepartments();
      if (res.success) {
        setDepartments(res.data);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      toast.error("Failed to load departments");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name) {
      toast.error('Department Name is required');
      return;
    }

    try {
      const res = await createDepartment(formData);
      if (res.success) {
        toast.success('Department created successfully');
        setFormData({ name: '', description: '' });
        fetchDepartments();
      }
    } catch (error) {
      console.error("Error creating department:", error);
      toast.error(error.response?.data?.message || "Failed to create department");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this department?")) return;
    try {
      const res = await deleteDepartment(id);
      if (res.success) {
        toast.success("Department deleted");
        fetchDepartments();
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete department");
    }
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-4">
        <nav className="bg-white p-3 rounded-lg shadow-sm">
          <ol className="flex items-center">
            <li className="flex items-center w-full">
              <h3 className="font-bold text-xl mb-0 flex items-center gap-2">
                <Building2 size={24} className="text-blue-500" />
                Create Department
              </h3>
            </li>
          </ol>
        </nav>
      </div>

      <div className="container mx-auto px-4 my-5">
        {/* Create New Department Card */}
        <div className="card shadow-lg rounded-xl overflow-hidden mb-6">
          <div className="bg-blue-500 text-white p-4">
            <h4 className="text-xl font-bold flex items-center gap-2">
              <PlusCircle size={22} />
              Create New Department
            </h4>
          </div>
          <div className="bg-white p-6">
            <form id="departmentForm" onSubmit={handleSubmit}>
              {/* Department Name */}
              <div className="mb-6">
                <label htmlFor="name" className="block font-semibold text-gray-700 mb-2">
                  Department Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Enter department name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Description */}
              <div className="mb-6">
                <label htmlFor="description" className="block font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Enter description"
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>

              {/* Submit Button */}
              <div className="text-right">
                <button
                  type="submit"
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
                >
                  <PlusCircle size={18} />
                  Create Department
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Summary Section */}
        <div className="card shadow-lg rounded-xl overflow-hidden">
          <div className="bg-blue-500 text-white p-4">
            <h4 className="text-xl font-bold">Summary</h4>
          </div>
          <div className="bg-white p-6">
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-4 border-b text-left font-semibold text-gray-700">
                      Department Name
                    </th>
                    <th className="py-3 px-4 border-b text-left font-semibold text-gray-700">
                      Description
                    </th>
                    <th className="py-3 px-4 border-b text-right font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="3" className="py-8 px-4 text-center text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : departments.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="py-8 px-4 text-center text-gray-500">
                        No departments created yet
                      </td>
                    </tr>
                  ) : (
                    departments.map((dept) => (
                      <tr key={dept._id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 border-b">
                          {dept.name}
                        </td>
                        <td className="py-3 px-4 border-b">
                          {dept.description || '-'}
                        </td>
                        <td className="py-3 px-4 border-b text-right">
                          <button
                            onClick={() => handleDelete(dept._id)}
                            className="text-red-500 hover:text-red-700 p-2"
                          >
                            <Trash2 size={18} />
                          </button>
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