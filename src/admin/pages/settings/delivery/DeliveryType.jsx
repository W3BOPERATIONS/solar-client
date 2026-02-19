import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Search,
  Loader
} from 'lucide-react';
import {
  getDeliveryTypes,
  createDeliveryType,
  updateDeliveryType,
  deleteDeliveryType
} from '../../../../services/delivery/deliveryApi';

const DeliveryType = () => {
  // State
  const [deliveryTypes, setDeliveryTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', status: 'active' });
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  // Fetch Data
  useEffect(() => {
    fetchDeliveryTypes();
  }, []);

  const fetchDeliveryTypes = async () => {
    try {
      setLoading(true);
      const response = await getDeliveryTypes();
      if (response.success) {
        setDeliveryTypes(response.data);
      }
    } catch (error) {
      showNotification('Failed to fetch delivery types', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Notification Helper
  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  // Form Handling
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', status: 'active' });
    setEditingType(null);
  };

  const handleOpenModal = (type = null) => {
    if (type) {
      setEditingType(type);
      setFormData({
        name: type.name,
        description: type.description,
        status: type.status
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  // CRUD Operations
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      showNotification('Name is required', 'error');
      return;
    }

    try {
      if (editingType) {
        await updateDeliveryType(editingType._id, formData);
        showNotification('Delivery type updated successfully', 'success');
      } else {
        await createDeliveryType(formData);
        showNotification('Delivery type created successfully', 'success');
      }
      fetchDeliveryTypes();
      handleCloseModal();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Operation failed', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this delivery type?')) {
      try {
        await deleteDeliveryType(id);
        showNotification('Delivery type deleted successfully', 'success');
        fetchDeliveryTypes();
      } catch (error) {
        showNotification(error.response?.data?.message || 'Delete failed', 'error');
      }
    }
  };

  const handleStatusToggle = async (type) => {
    try {
      const newStatus = type.status === 'active' ? 'inactive' : 'active';
      await updateDeliveryType(type._id, { status: newStatus });
      showNotification(`Status updated to ${newStatus}`, 'success');
      fetchDeliveryTypes();
    } catch (error) {
      showNotification('Status update failed', 'error');
    }
  };

  // Filter
  const filteredTypes = deliveryTypes.filter(type =>
    type.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Notification Toast */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <Truck className="w-8 h-8 text-blue-600 mr-3" />
            Delivery Types
          </h1>
          <p className="text-gray-600">Manage delivery service types</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add New Type
        </button>
      </div>

      {/* Search and List */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search delivery types..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : filteredTypes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No delivery types found. Add one to get started.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTypes.map((type) => (
              <div key={type._id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{type.name}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${type.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                      {type.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleOpenModal(type)}
                      className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(type._id)}
                      className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-4 min-h-[40px]">
                  {type.description || 'No description provided.'}
                </p>
                <div className="pt-4 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={() => handleStatusToggle(type)}
                    className={`text-sm font-medium flex items-center ${type.status === 'active' ? 'text-red-500 hover:text-red-700' : 'text-green-500 hover:text-green-700'
                      }`}
                  >
                    {type.status === 'active' ? (
                      <>
                        <XCircle className="w-4 h-4 mr-1" /> Deactivate
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-1" /> Activate
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {editingType ? 'Edit Delivery Type' : 'Add New Delivery Type'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g. Express Delivery"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Brief description of this delivery type"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  {editingType ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryType;