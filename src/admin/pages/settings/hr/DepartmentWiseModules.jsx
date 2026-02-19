import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  getDepartments,
  getModules,
  getDepartmentModules,
  saveDepartmentModules,
  getDepartmentStats
} from '../../../../services/hr/departmentModuleApi';
import DepartmentList from '../../../../components/hr/DepartmentList';
import ModuleAccessTable from '../../../../components/hr/ModuleAccessTable';

const DepartmentWiseModules = () => {
  const [departments, setDepartments] = useState([]);
  const [modules, setModules] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [existingMappings, setExistingMappings] = useState([]);
  const [stats, setStats] = useState(null);

  // Loading states
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingModules, setLoadingModules] = useState(false);
  const [loadingMappings, setLoadingMappings] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initial load
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load mappings when department selected
  useEffect(() => {
    if (selectedDepartment) {
      loadDepartmentData(selectedDepartment._id);
    }
  }, [selectedDepartment]);

  const loadInitialData = async () => {
    setLoadingDepartments(true);
    setLoadingModules(true);
    try {
      const [deptRes, modRes] = await Promise.all([
        getDepartments(),
        getModules()
      ]);

      if (deptRes.success) setDepartments(deptRes.departments);
      if (modRes.success) setModules(modRes.modules);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load initial data');
    } finally {
      setLoadingDepartments(false);
      setLoadingModules(false);
    }
  };

  const loadDepartmentData = async (departmentId) => {
    setLoadingMappings(true);
    try {
      const [mappingRes, statsRes] = await Promise.all([
        getDepartmentModules(departmentId),
        getDepartmentStats(departmentId)
      ]);

      if (mappingRes.success) setExistingMappings(mappingRes.accessList);
      if (statsRes.success) setStats(statsRes.stats);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load department configuration');
    } finally {
      setLoadingMappings(false);
    }
  };

  const handleSave = async (mappingsToSave) => {
    if (!selectedDepartment) return;

    setSaving(true);
    try {
      const payload = {
        departmentId: selectedDepartment._id,
        mappings: mappingsToSave
      };

      const response = await saveDepartmentModules(payload);

      if (response.success) {
        toast.success('Configuration saved successfully');
        // Refresh data to show latest state
        loadDepartmentData(selectedDepartment._id);
      } else {
        toast.error(response.message || 'Failed to save');
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] gap-4 p-4"> {/* Adjusted height for typical admin layout */}
      <div className="flex-none">
        <h1 className="text-2xl font-bold text-gray-800">Department Wise Modules</h1>
        <p className="text-gray-500">Configure module access and permissions for each department dynamically.</p>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Left Sidebar: Department List */}
        <div className="w-1/4 h-full overflow-hidden flex flex-col">
          <DepartmentList
            departments={departments}
            selectedid={selectedDepartment?._id}
            onSelect={setSelectedDepartment}
            loading={loadingDepartments}
          />
        </div>

        {/* Right Content: Module Configuration */}
        <div className="flex-1 h-full overflow-y-auto">
          <ModuleAccessTable
            modules={modules}
            existingMappings={existingMappings}
            departmentName={selectedDepartment?.name}
            onSave={handleSave}
            loading={loadingModules || loadingMappings}
            saving={saving}
          />
        </div>
      </div>
    </div>
  );
};

export default DepartmentWiseModules;