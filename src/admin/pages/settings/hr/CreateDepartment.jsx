import React, { useState, useEffect } from 'react';
import { Building2, PlusCircle, Trash2, Edit } from 'lucide-react';
import { createDepartment, getDepartments, deleteDepartment } from '../../../services/hrService'; // Adjust path as needed
import { getCountries } from '../../../../services/locationApi';
import { toast } from 'react-hot-toast';

export default function CreateDepartment() {
  const [departments, setDepartments] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    names: [''],
    country: '', // Now added dynamically
    description: ''
  });

  useEffect(() => {
    fetchDepartments();
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const countryData = await getCountries();
      setCountries(countryData || []);
    } catch (error) {
      console.error("Error fetching countries:", error);
      toast.error("Failed to load countries");
    }
  };

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await getDepartments();
      if (res.success) {
        let grouped = [];
        res.data.forEach(d => {
          let existing = grouped.find(g => g.name.toLowerCase().trim() === d.name.toLowerCase().trim());
          if (existing) {
            if (!existing.countries.includes(d.country)) existing.countries.push(d.country);
          } else {
            grouped.push({ ...d, countries: [d.country] });
          }
        });
        setDepartments(grouped);
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

  const handleNameChange = (index, value) => {
    const newNames = [...formData.names];
    newNames[index] = value;
    setFormData({ ...formData, names: newNames });
  };

  const addNameField = () => {
    setFormData({ ...formData, names: [...formData.names, ''] });
  };

  const removeNameField = (index) => {
    setFormData({ ...formData, names: formData.names.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validNames = formData.names.map(n => n.trim()).filter(n => n);

    if (validNames.length === 0) {
      toast.error('At least one valid Department Name is required');
      return;
    }
    if (!formData.country) {
      toast.error('Country is required');
      return;
    }

    try {
      let successCount = 0;
      let errorMessages = [];

      for (const name of validNames) {
        try {
          // Provide the description even though we hid it from the UI, to match old signature requirements if any
          const res = await createDepartment({ name, country: formData.country, description: formData.description });
          if (res.success) {
            successCount++;
          }
        } catch (err) {
          errorMessages.push(`Failed for "${name}": ${err.response?.data?.message || err.message || "Unknown error"}`);
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully created ${successCount} department(s)`);
        setFormData({ names: [''], country: formData.country, description: '' }); // keep country selection for convenience
        fetchDepartments();
      }

      if (errorMessages.length > 0) {
        errorMessages.forEach(msg => toast.error(msg));
      }

    } catch (error) {
      console.error("Error creating departments:", error);
      toast.error("An unexpected error occurred during creation");
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
    <div className="p-4 bg-[#f8f9fa] min-h-screen">
      {/* Header */}
      <div className="mb-4">
        <h3 className="font-bold text-2xl text-[#0b386a]">Create Department</h3>
      </div>

      <div className="max-w-5xl mx-auto my-5">
        {/* Create New Department Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="bg-[#0b64a8] text-white p-3">
            <h4 className="text-lg font-bold">Create New Department</h4>
          </div>
          <div className="p-6">
            <form id="departmentForm" onSubmit={handleSubmit}>
              {/* Department Names */}
              <div className="mb-6">
                <label className="block font-semibold text-gray-700 mb-2">
                  Department Name(s) <span className="text-red-500">*</span>
                </label>
                {formData.names.map((name, index) => (
                  <div key={index} className={`flex items-center gap-2 ${index > 0 ? 'mt-3' : ''}`}>
                    <input
                      type="text"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Enter department name"
                      value={name}
                      onChange={(e) => handleNameChange(index, e.target.value)}
                      required={index === 0} // Only first is strictly required by HTML
                    />
                    {formData.names.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeNameField(index)}
                        className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                        title="Remove Department"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                    {index === formData.names.length - 1 && (
                      <button
                        type="button"
                        onClick={addNameField}
                        className="p-3 text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors border border-blue-600 flex items-center justify-center shadow-sm"
                        title="Add Another Department"
                      >
                        <PlusCircle size={20} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Country Selection */}
              <div className="mb-6">
                <label htmlFor="country" className="block font-semibold text-gray-700 mb-2">
                  Country <span className="text-red-500">*</span>
                </label>
                <select
                  id="country"
                  name="country"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  value={formData.country}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Country</option>
                  {countries.map(c => (
                    <option key={c._id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  className="bg-[#28a745] hover:bg-[#218838] text-white px-4 py-2 rounded text-sm font-semibold transition-colors"
                >
                  Create Department
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Summary Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="bg-[#0b64a8] text-white p-3">
            <h4 className="text-lg font-bold">Summary</h4>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              {/* Pill-like header styling in PHP layout */}
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#e9ecef] rounded-lg">
                    <th className="py-2.5 px-4 font-semibold text-gray-700 text-sm first:rounded-l-md">
                      Department Name
                    </th>
                    <th className="py-2.5 px-4 font-semibold text-gray-700 text-sm last:rounded-r-md">
                      Country
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="2" className="py-8 px-4 text-center text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : departments.length === 0 ? (
                    <tr>
                      <td colSpan="2" className="py-4 px-4 text-center text-gray-500 text-sm border-b">
                        No departments created yet.
                      </td>
                    </tr>
                  ) : (
                    departments.map((dept) => (
                      <tr key={dept._id} className="hover:bg-gray-50 transition-colors border-b last:border-0 border-gray-100">
                        <td className="py-3 px-4 text-sm text-gray-700">
                          {dept.name}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">
                          {dept.countries?.join(', ') || dept.country || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Text */}
        <div className="text-center bg-white p-4 rounded-lg shadow-sm w-full font-semibold text-sm text-[#0b386a]">
          Copyright &copy; 2025 Solarkits. All Rights Reserved.
        </div>
      </div>
    </div>
  );
}