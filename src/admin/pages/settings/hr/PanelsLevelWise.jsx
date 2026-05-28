import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Shield,
  Trash2,
  Copy,
  Users,
  Settings,
  FileText,
  Activity,
  Check,
  X,
  Edit2,
  ChevronRight,
  RefreshCw,
  Search,
  CheckSquare,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import * as rbacApi from '../../../../services/settings/rbacApi';
import { SIDEBAR_NAVIGATION } from '../../../constants/navigation';

const AVAILABLE_ICONS = [
  { name: 'Layers', component: Layers },
  { name: 'Users', component: Users },
  { name: 'Settings', component: Settings },
  { name: 'FileText', component: FileText },
  { name: 'Activity', component: Activity },
  { name: 'Shield', component: Shield },
];

const toSnakeCase = (str) => {
  if (!str) return '';
  return str
    .replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
    .replace(/^_/, '');
};

const parseSidebarModules = (navigationList) => {
  const list = [];
  navigationList.forEach((section) => {
    const sectionKey = section.id ? toSnakeCase(section.id) : toSnakeCase(section.name.toLowerCase().replace(/\s+/g, '_'));
    const sectionIconName = section.icon?.name || section.icon?.displayName || 'Layers';

    list.push({
      name: section.name,
      key: sectionKey,
      route: section.href || '',
      icon: sectionIconName,
      description: `${section.name} Main Section`,
      parentKey: null,
    });

    if (section.children && section.children.length > 0) {
      section.children.forEach((child) => {
        const childIconName = child.icon?.name || child.icon?.displayName || 'Layers';

        if (child.isGroup) {
          const groupKey = child.id ? toSnakeCase(child.id) : toSnakeCase(child.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, ''));
          list.push({
            name: child.name,
            key: groupKey,
            route: child.href || '',
            icon: childIconName,
            description: `${child.name} Group Section`,
            parentKey: null,
          });

          if (child.children && child.children.length > 0) {
            child.children.forEach((subChild) => {
              const subChildIconName = subChild.icon?.name || subChild.icon?.displayName || 'Layers';
              let subChildKey = '';
              if (subChild.href) {
                const parts = subChild.href.split('/');
                subChildKey = parts[parts.length - 1].toLowerCase().replace(/-/g, '_');
              } else {
                subChildKey = toSnakeCase(subChild.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, ''));
              }

              list.push({
                name: subChild.name,
                key: subChildKey,
                route: subChild.href || '',
                icon: subChildIconName,
                description: `${subChild.name} Submodule`,
                parentKey: groupKey,
              });
            });
          }
        } else {
          let childKey = '';
          if (child.href) {
            const parts = child.href.split('/');
            childKey = parts[parts.length - 1].toLowerCase().replace(/-/g, '_');
          } else {
            childKey = toSnakeCase(child.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, ''));
          }

          list.push({
            name: child.name,
            key: childKey,
            route: child.href || '',
            icon: childIconName,
            description: `${child.name} Submodule`,
            parentKey: sectionKey,
          });
        }
      });
    }
  });
  return list;
};

export default function PanelsLevelWise() {
  // Navigation & Tabs state
  const [activeTab, setActiveTab] = useState('matrix'); // matrix | panels | modules | users | logs

  // Data states
  const [panels, setPanels] = useState([]);
  const [modules, setModules] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [users, setUsers] = useState([]);
  const [userPanels, setUserPanels] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [panelForm, setPanelForm] = useState({ name: '', description: '' });
  const [moduleForm, setModuleForm] = useState({
    name: '',
    key: '',
    route: '',
    icon: 'Layers',
    description: '',
    moduleType: 'parent', // 'parent' | 'submodule'
    parentModule: '',
  });
  const [userAssignForm, setUserAssignForm] = useState({ userId: '', panelId: '', branchId: 'Main Branch', customPermissions: [] });

  // Modal / Editing states
  const [editingPanel, setEditingPanel] = useState(null);
  const [editingModule, setEditingModule] = useState(null);
  const [cloningPanel, setCloningPanel] = useState(null); // { sourcePanelId, targetName: '', targetDescription: '' }
  const [configuringUser, setConfiguringUser] = useState(null); // User object currently undergoing permission overrides

  // Search states
  const [userSearch, setUserSearch] = useState('');
  const [logSearch, setLogSearch] = useState('');

  // Local state for modified permissions matrix
  const [matrixState, setMatrixState] = useState({}); // key: panelId_moduleId, value: { can_view, can_add, can_edit, can_delete }
  const [isMatrixDirty, setIsMatrixDirty] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);

      // Auto-sync modules from the SIDEBAR_NAVIGATION structure!
      const parsedModules = parseSidebarModules(SIDEBAR_NAVIGATION);
      await rbacApi.syncModules(parsedModules);

      const [matrixRes, usersRes, logsRes] = await Promise.all([
        rbacApi.getPermissionMatrix(),
        rbacApi.getUsersAndPanels(),
        rbacApi.getActivityLogs(),
      ]);

      if (matrixRes.success) {
        setPanels(matrixRes.panels || []);
        setModules(matrixRes.modules || []);
        setPermissions(matrixRes.permissions || []);

        // Reconstruct matrixState
        const mState = {};
        matrixRes.permissions.forEach((perm) => {
          mState[`${perm.panelId}_${perm.moduleId}`] = {
            can_view: perm.can_view,
            can_add: perm.can_add,
            can_edit: perm.can_edit,
            can_delete: perm.can_delete,
          };
        });
        setMatrixState(mState);
        setIsMatrixDirty(false);
      }

      if (usersRes.success) {
        setUsers(usersRes.users || []);
        setUserPanels(usersRes.userPanels || []);
      }

      if (logsRes.success) {
        setActivityLogs(logsRes.logs || []);
      }
    } catch (error) {
      console.error('Failed to load RBAC data:', error);
      toast.error('Failed to load RBAC data');
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================================
     HIERARCHY GROUPING HELPER
     ========================================================================== */

  const getGroupedModules = () => {
    // Filter parent modules (modules that have no parentModule field set)
    const parents = modules.filter((m) => !m.parentModule);
    const grouped = [];

    parents.forEach((p) => {
      // Add parent to flat list
      grouped.push(p);

      // Find children belonging to this parent module
      const children = modules.filter((m) => {
        if (!m.parentModule) return false;
        const parentId = m.parentModule._id || m.parentModule;
        return String(parentId) === String(p._id);
      });

      children.forEach((c) => {
        grouped.push({
          ...c,
          isSubmodule: true,
          parentName: p.name,
        });
      });
    });

    // Handle orphan submodules (where parent module is not found)
    modules.forEach((m) => {
      if (m.parentModule) {
        const parentId = m.parentModule._id || m.parentModule;
        const parentExists = parents.some((p) => String(p._id) === String(parentId));
        if (!parentExists) {
          grouped.push({
            ...m,
            isSubmodule: true,
            parentName: 'Orphan Submodule',
          });
        }
      }
    });

    return grouped;
  };

  /* ==========================================================================
     PERMISSION MATRIX OPERATIONS
     ========================================================================== */

  const handleMatrixCellChange = (panelId, moduleId, actionField, value) => {
    const key = `${panelId}_${moduleId}`;
    setMatrixState((prev) => {
      const current = prev[key] || { can_view: false, can_add: false, can_edit: false, can_delete: false };
      const updated = { ...current, [actionField]: value };
      return { ...prev, [key]: updated };
    });
    setIsMatrixDirty(true);
  };

  const handleSaveMatrix = async () => {
    try {
      const updates = [];
      Object.keys(matrixState).forEach((key) => {
        const [panelId, moduleId] = key.split('_');
        updates.push({
          panelId,
          moduleId,
          ...matrixState[key],
        });
      });

      const res = await rbacApi.updatePermissionMatrix(updates);
      if (res.success) {
        toast.success('Permission Matrix saved successfully!');
        setIsMatrixDirty(false);
        await loadAllData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save matrix');
    }
  };

  const handleApplyTemplate = (panelId, templateType) => {
    const mState = { ...matrixState };
    modules.forEach((mod) => {
      const key = `${panelId}_${mod._id}`;
      if (templateType === 'view_only') {
        mState[key] = { can_view: true, can_add: false, can_edit: false, can_delete: false };
      } else if (templateType === 'manager') {
        mState[key] = { can_view: true, can_add: true, can_edit: true, can_delete: false };
      } else if (templateType === 'full_access') {
        mState[key] = { can_view: true, can_add: true, can_edit: true, can_delete: true };
      } else if (templateType === 'clear') {
        mState[key] = { can_view: false, can_add: false, can_edit: false, can_delete: false };
      }
    });
    setMatrixState(mState);
    setIsMatrixDirty(true);
    toast.success(`Applied template to panel!`);
  };

  /* ==========================================================================
     PANEL OPERATIONS
     ========================================================================== */

  const handleCreatePanel = async (e) => {
    e.preventDefault();
    try {
      const res = await rbacApi.createPanel(panelForm);
      if (res.success) {
        toast.success(`Panel '${res.panel.name}' created successfully`);
        setPanelForm({ name: '', description: '' });
        await loadAllData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create panel');
    }
  };

  const handleUpdatePanel = async (e) => {
    e.preventDefault();
    try {
      const res = await rbacApi.updatePanel(editingPanel._id, editingPanel);
      if (res.success) {
        toast.success('Panel updated successfully');
        setEditingPanel(null);
        await loadAllData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update panel');
    }
  };

  const handleDeletePanel = async (id) => {
    if (!window.confirm('Are you sure you want to delete this panel? This will delete all permissions and assignments associated with it.')) return;
    try {
      const res = await rbacApi.deletePanel(id);
      if (res.success) {
        toast.success(res.message);
        await loadAllData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete panel');
    }
  };

  const handleClonePanel = async (e) => {
    e.preventDefault();
    try {
      const res = await rbacApi.clonePanel({
        sourcePanelId: cloningPanel.sourcePanelId,
        targetName: cloningPanel.targetName,
        targetDescription: cloningPanel.targetDescription,
      });
      if (res.success) {
        toast.success(`Panel cloned successfully!`);
        setCloningPanel(null);
        await loadAllData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to clone panel');
    }
  };

  /* ==========================================================================
     MODULE OPERATIONS
     ========================================================================== */

  const handleCreateModule = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: moduleForm.name,
        key: moduleForm.key,
        route: moduleForm.route,
        icon: moduleForm.icon,
        description: moduleForm.description,
        parentModule: moduleForm.moduleType === 'submodule' ? moduleForm.parentModule : null,
      };

      if (moduleForm.moduleType === 'submodule' && !moduleForm.parentModule) {
        toast.error('Please select a parent module for this submodule');
        return;
      }

      const res = await rbacApi.createModule(payload);
      if (res.success) {
        toast.success(`Dynamic module '${res.module.name}' registered successfully!`);
        setModuleForm({
          name: '',
          key: '',
          route: '',
          icon: 'Layers',
          description: '',
          moduleType: 'parent',
          parentModule: '',
        });
        await loadAllData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create module');
    }
  };

  const handleUpdateModule = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...editingModule,
        parentModule: editingModule.moduleType === 'submodule' ? editingModule.parentModule : null,
      };

      const res = await rbacApi.updateModule(editingModule._id, payload);
      if (res.success) {
        toast.success('Module changes saved successfully');
        setEditingModule(null);
        await loadAllData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update module');
    }
  };

  const handleDeleteModule = async (id) => {
    if (!window.confirm('Are you sure you want to delete this module? This will remove it from all panels and permission matrices.')) return;
    try {
      const res = await rbacApi.deleteModule(id);
      if (res.success) {
        toast.success(res.message);
        await loadAllData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete module');
    }
  };

  /* ==========================================================================
     USER MAPPING OPERATIONS
     ========================================================================== */

  const handleUserConfigureClick = (user) => {
    const existingMapping = userPanels.find((up) => up.userId?._id === user._id || up.userId === user._id);
    setConfiguringUser(user);
    setUserAssignForm({
      userId: user._id,
      panelId: existingMapping ? existingMapping.panelId?._id || existingMapping.panelId : '',
      branchId: existingMapping ? existingMapping.branchId || 'Main Branch' : 'Main Branch',
      customPermissions: existingMapping ? existingMapping.customPermissions || [] : [],
    });
  };

  const handleToggleUserOverride = (moduleId, actionField, currentValue) => {
    setUserAssignForm((prev) => {
      const cPerms = [...prev.customPermissions];
      const existingIdx = cPerms.findIndex((cp) => cp.moduleId === moduleId || cp.moduleId?._id === moduleId);

      const targetVal = currentValue === undefined ? true : currentValue === true ? false : undefined;

      if (existingIdx >= 0) {
        const item = { ...cPerms[existingIdx] };
        item[actionField] = targetVal;

        if (item.can_view === undefined && item.can_add === undefined && item.can_edit === undefined && item.can_delete === undefined) {
          cPerms.splice(existingIdx, 1);
        } else {
          cPerms[existingIdx] = item;
        }
      } else if (targetVal !== undefined) {
        cPerms.push({
          moduleId,
          [actionField]: targetVal,
        });
      }

      return { ...prev, customPermissions: cPerms };
    });
  };

  const handleSaveUserAssignment = async (e) => {
    e.preventDefault();
    if (!userAssignForm.panelId) {
      toast.error('Please assign a workspace panel first');
      return;
    }
    try {
      const res = await rbacApi.assignUserPanel(userAssignForm);
      if (res.success) {
        toast.success(`Access settings saved for '${configuringUser.name}'`);
        setConfiguringUser(null);
        await loadAllData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign user access');
    }
  };

  const handleRevokeUserAccess = async (id) => {
    if (!window.confirm('Are you sure you want to revoke all panel and override permissions for this user?')) return;
    try {
      const res = await rbacApi.removeUserPanel(id);
      if (res.success) {
        toast.success(res.message);
        await loadAllData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to revoke user access');
    }
  };

  const renderIcon = (iconName) => {
    const matched = AVAILABLE_ICONS.find((i) => i.name === iconName);
    const IconComp = matched ? matched.component : Layers;
    return <IconComp size={16} className="inline mr-1" />;
  };

  // Filters
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredLogs = activityLogs.filter(
    (l) =>
      l.userName.toLowerCase().includes(logSearch.toLowerCase()) ||
      l.action.toLowerCase().includes(logSearch.toLowerCase()) ||
      l.details.toLowerCase().includes(logSearch.toLowerCase())
  );

  // Grouped modules for tree matrices
  const groupedModules = getGroupedModules();

  return (
    <div className="p-6 bg-slate-50 min-h-screen text-slate-800">
      {/* Header Widget */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-900 to-blue-700 bg-clip-text text-transparent flex items-center gap-2">
            <Shield className="text-blue-600" size={32} />
            Role-Based Access Control
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Dynamically configure workspace panels, routes, hierarchical modules, permission matrix, and user-level overrides.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadAllData}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition text-sm font-semibold text-slate-600 shadow-sm"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Sync System
          </button>
          {isMatrixDirty && (
            <button
              onClick={handleSaveMatrix}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 transition text-sm font-semibold text-white shadow-md shadow-emerald-100"
            >
              <Check size={16} />
              Save Matrix Changes
            </button>
          )}
        </div>
      </div>

      {/* Tabs Switcher Widget */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-200 pb-2">
        {[
          { id: 'matrix', label: 'Permission Matrix Grid', icon: Shield },
          { id: 'panels', label: 'Panel Roles Registry', icon: Layers },
          { id: 'modules', label: 'Dynamic Module registry', icon: Settings },
          { id: 'users', label: 'User Workspace Mapping', icon: Users },
          { id: 'logs', label: 'Audit Log Viewer', icon: Activity },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-t-xl text-sm font-bold transition-all border-b-2 ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-700 bg-white font-extrabold shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Container */}
      {loading && panels.length === 0 ? (
        <div className="flex justify-center items-center h-64 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-center">
            <RefreshCw className="animate-spin text-blue-600 mx-auto mb-2" size={32} />
            <p className="text-slate-500 font-medium">Syncing system database configurations...</p>
          </div>
        </div>
      ) : (
        <div className="transition-all duration-300">
          {/* TAB 1: PERMISSION MATRIX */}
          {activeTab === 'matrix' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 bg-slate-900 text-white flex justify-between items-center flex-wrap gap-4 border-b border-slate-800">
                <div>
                  <h3 className="text-lg font-bold">Dynamic Hierarchical Permission Matrix</h3>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Assign global module and submodule access rules. Submodules are visually grouped under their respective parents.
                  </p>
                </div>
                {isMatrixDirty && (
                  <div className="text-amber-400 text-sm font-semibold flex items-center gap-1.5 animate-pulse">
                    <CheckSquare size={16} />
                    Unsaved permissions matrix changes detected!
                  </div>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="py-4 px-6 font-bold text-slate-700 text-sm w-1/4">Module & Submodule Hierarchy</th>
                      {panels.map((panel) => (
                        <th key={panel._id} className="py-4 px-6 border-l border-slate-200 text-center w-1/5 min-w-[220px]">
                          <div className="font-extrabold text-blue-900 text-sm uppercase tracking-wide">{panel.name}</div>
                          <div className="text-xs text-slate-400 font-normal lowercase">{panel.key}</div>
                          
                          {/* Pre-set Templates Selectors */}
                          <div className="mt-3 flex justify-center gap-1">
                            <button
                              onClick={() => handleApplyTemplate(panel._id, 'view_only')}
                              className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-semibold border border-slate-200"
                              title="Set all to can_view only"
                            >
                              View Only
                            </button>
                            <button
                              onClick={() => handleApplyTemplate(panel._id, 'manager')}
                              className="text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-600 px-2 py-0.5 rounded font-semibold border border-blue-100"
                              title="Set all to Manager access"
                            >
                              Manager
                            </button>
                            <button
                              onClick={() => handleApplyTemplate(panel._id, 'full_access')}
                              className="text-[10px] bg-emerald-50 hover:bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded font-semibold border border-emerald-100"
                              title="Set all to Full access"
                            >
                              Full
                            </button>
                            <button
                              onClick={() => handleApplyTemplate(panel._id, 'clear')}
                              className="text-[10px] bg-rose-50 hover:bg-rose-100 text-rose-600 px-2 py-0.5 rounded font-semibold border border-rose-100"
                              title="Revoke all rules"
                            >
                              Reset
                            </button>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {groupedModules.map((mod) => (
                      <tr
                        key={mod._id}
                        className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                          mod.isSubmodule ? 'bg-slate-50/50' : 'bg-white font-extrabold'
                        }`}
                      >
                        <td className="py-4 px-6 text-slate-800 flex flex-col justify-center">
                          <span className={`text-sm flex items-center ${mod.isSubmodule ? 'pl-6 text-slate-600 font-medium' : 'font-extrabold text-slate-800'}`}>
                            {mod.isSubmodule && <span className="text-slate-400 mr-1.5">↳</span>}
                            {renderIcon(mod.icon)}
                            {mod.name}
                            {!mod.isSubmodule && (
                              <span className="ml-2 bg-blue-50 text-blue-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border border-blue-100 uppercase">
                                Parent
                              </span>
                            )}
                          </span>
                          <span className={`text-[11px] text-slate-400 font-mono mt-0.5 lowercase ${mod.isSubmodule ? 'pl-11' : 'pl-6'}`}>
                            {mod.route || 'no-route'}
                          </span>
                        </td>

                        {panels.map((panel) => {
                          const matrixKey = `${panel._id}_${mod._id}`;
                          const permState = matrixState[matrixKey] || {
                            can_view: false,
                            can_add: false,
                            can_edit: false,
                            can_delete: false,
                          };

                          return (
                            <td key={panel._id} className="py-3 px-4 border-l border-slate-100 text-center">
                              <div className="grid grid-cols-4 gap-1 select-none">
                                {/* View */}
                                <label className="flex flex-col items-center cursor-pointer p-1.5 rounded hover:bg-slate-200/50 transition">
                                  <input
                                    type="checkbox"
                                    checked={permState.can_view}
                                    onChange={(e) => handleMatrixCellChange(panel._id, mod._id, 'can_view', e.target.checked)}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                                  />
                                  <span className="text-[9px] text-slate-400 font-bold uppercase mt-1">View</span>
                                </label>

                                {/* Add */}
                                <label className="flex flex-col items-center cursor-pointer p-1.5 rounded hover:bg-slate-200/50 transition">
                                  <input
                                    type="checkbox"
                                    checked={permState.can_add}
                                    onChange={(e) => handleMatrixCellChange(panel._id, mod._id, 'can_add', e.target.checked)}
                                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                                  />
                                  <span className="text-[9px] text-slate-400 font-bold uppercase mt-1">Add</span>
                                </label>

                                {/* Edit */}
                                <label className="flex flex-col items-center cursor-pointer p-1.5 rounded hover:bg-slate-200/50 transition">
                                  <input
                                    type="checkbox"
                                    checked={permState.can_edit}
                                    onChange={(e) => handleMatrixCellChange(panel._id, mod._id, 'can_edit', e.target.checked)}
                                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 h-4 w-4"
                                  />
                                  <span className="text-[9px] text-slate-400 font-bold uppercase mt-1">Edit</span>
                                </label>

                                {/* Delete */}
                                <label className="flex flex-col items-center cursor-pointer p-1.5 rounded hover:bg-slate-200/50 transition">
                                  <input
                                    type="checkbox"
                                    checked={permState.can_delete}
                                    onChange={(e) => handleMatrixCellChange(panel._id, mod._id, 'can_delete', e.target.checked)}
                                    className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-4 w-4"
                                  />
                                  <span className="text-[9px] text-slate-400 font-bold uppercase mt-1">Del</span>
                                </label>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: PANELS LIST & BUILDER */}
          {activeTab === 'panels' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Creator Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Plus className="text-blue-600" size={20} />
                  Add Workspace Panel
                </h3>
                <form onSubmit={handleCreatePanel} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Panel/Role Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-700 text-sm font-semibold"
                      placeholder="e.g. Accounts Panel, Partner Manager"
                      value={panelForm.name}
                      onChange={(e) => setPanelForm({ ...panelForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                    <textarea
                      rows={3}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-700 text-sm"
                      placeholder="Purpose of this workspace role"
                      value={panelForm.description}
                      onChange={(e) => setPanelForm({ ...panelForm, description: e.target.value })}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition shadow-md shadow-blue-100"
                  >
                    Add Panel & Initialize Defaults
                  </button>
                </form>
              </div>

              {/* List Card */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Workspace Panels Registry</h3>
                {panels.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">No panels registered yet.</div>
                ) : (
                  <div className="space-y-3">
                    {panels.map((panel) => (
                      <div
                        key={panel._id}
                        className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-xl border border-slate-150 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-800 text-base">{panel.name}</span>
                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider">
                              {panel.key}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{panel.description || 'No description provided.'}</p>
                        </div>
                        <div className="flex items-center gap-1 sm:self-center">
                          {/* Clone Button */}
                          <button
                            onClick={() =>
                              setCloningPanel({
                                sourcePanelId: panel._id,
                                targetName: '',
                                targetDescription: '',
                              })
                            }
                            className="p-2 hover:bg-white text-blue-600 rounded-lg hover:shadow-sm border border-transparent hover:border-slate-200 transition"
                            title="Clone Panel Rights"
                          >
                            <Copy size={16} />
                          </button>
                          {/* Edit Trigger */}
                          <button
                            onClick={() => setEditingPanel(panel)}
                            className="p-2 hover:bg-white text-amber-600 rounded-lg hover:shadow-sm border border-transparent hover:border-slate-200 transition"
                            title="Edit Details"
                          >
                            <Edit2 size={16} />
                          </button>
                          {/* Delete Trigger */}
                          {panel.key !== 'admin' && (
                            <button
                              onClick={() => handleDeletePanel(panel._id)}
                              className="p-2 hover:bg-white text-rose-600 rounded-lg hover:shadow-sm border border-transparent hover:border-slate-200 transition"
                              title="Delete Panel"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: DYNAMIC MODULE REGISTRY */}
          {activeTab === 'modules' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Builder Form */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Plus className="text-blue-600" size={20} />
                  Register Module
                </h3>
                <form onSubmit={handleCreateModule} className="space-y-4">
                  {/* Module Type Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Module Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setModuleForm({ ...moduleForm, moduleType: 'parent', parentModule: '' })}
                        className={`py-2 rounded-xl text-xs font-bold border transition ${
                          moduleForm.moduleType === 'parent'
                            ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Main Module (Parent)
                      </button>
                      <button
                        type="button"
                        onClick={() => setModuleForm({ ...moduleForm, moduleType: 'submodule' })}
                        className={`py-2 rounded-xl text-xs font-bold border transition ${
                          moduleForm.moduleType === 'submodule'
                            ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Submodule (Child)
                      </button>
                    </div>
                  </div>

                  {/* Parent Module Selection Dropdown (Only shown if submodule is selected) */}
                  {moduleForm.moduleType === 'submodule' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                        Select Parent Module <span className="text-rose-500">*</span>
                      </label>
                      <select
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-700 text-sm font-semibold"
                        value={moduleForm.parentModule}
                        onChange={(e) => setModuleForm({ ...moduleForm, parentModule: e.target.value })}
                        required
                      >
                        <option value="">-- Choose Parent Module --</option>
                        {modules
                          .filter((m) => !m.parentModule)
                          .map((p) => (
                            <option key={p._id} value={p._id}>
                              {p.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Module Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-700 text-sm font-semibold"
                      placeholder="e.g. Invoices, Earnings"
                      value={moduleForm.name}
                      onChange={(e) => setModuleForm({ ...moduleForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Standardised Key</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-700 text-sm font-semibold font-mono"
                      placeholder="e.g. invoices, earnings"
                      value={moduleForm.key}
                      onChange={(e) => setModuleForm({ ...moduleForm, key: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Route Path</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-700 text-sm font-semibold"
                      placeholder="e.g. /account-manager/invoices"
                      value={moduleForm.route}
                      onChange={(e) => setModuleForm({ ...moduleForm, route: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Sidebar Icon</label>
                    <select
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-700 text-sm"
                      value={moduleForm.icon}
                      onChange={(e) => setModuleForm({ ...moduleForm, icon: e.target.value })}
                    >
                      {AVAILABLE_ICONS.map((ico) => (
                        <option key={ico.name} value={ico.name}>
                          {ico.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                    <textarea
                      rows={2}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-700 text-sm"
                      placeholder="Module description"
                      value={moduleForm.description}
                      onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition shadow-md shadow-blue-100"
                  >
                    Register Dynamic Module
                  </button>
                </form>
              </div>

              {/* Module List Directory */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-800">Modules Directory</h3>
                    <p className="text-xs text-slate-400 mt-1">Hierarchical tree representation of all system sections and sub-modules.</p>
                  </div>
                  <span className="bg-blue-50 text-blue-700 px-3 py-1 text-xs font-bold rounded-lg border border-blue-100">
                    {modules.filter(m => !m.parentModule).length} Modules | {modules.filter(m => m.parentModule).length} Submodules
                  </span>
                </div>

                {modules.filter(m => !m.parentModule).length === 0 ? (
                  <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                    No modules registered yet.
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[650px] overflow-y-auto pr-2">
                    {modules
                      .filter((m) => !m.parentModule)
                      .map((parent) => {
                        const subs = modules.filter(
                          (m) =>
                            m.parentModule &&
                            String(m.parentModule._id || m.parentModule) === String(parent._id)
                        );

                        return (
                          <div
                            key={parent._id}
                            className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition duration-200"
                          >
                            {/* Parent Header Row */}
                            <div className="p-4 bg-slate-50 border-b border-slate-150 flex justify-between items-center flex-wrap gap-3">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                                  {renderIcon(parent.icon)}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-slate-800 text-base">{parent.name}</span>
                                    <span className="bg-blue-50 border border-blue-150 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                      {parent.key}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-400 font-mono mt-0.5">{parent.route || 'No Route Path'}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="bg-slate-200 text-slate-700 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase">
                                  {subs.length} Submodules
                                </span>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => {
                                      setEditingModule({
                                        ...parent,
                                        moduleType: 'parent',
                                        parentModule: '',
                                      });
                                    }}
                                    className="p-1.5 hover:bg-white border border-transparent hover:border-slate-200 text-amber-600 rounded-lg transition"
                                    title="Edit Module"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteModule(parent._id)}
                                    className="p-1.5 hover:bg-white border border-transparent hover:border-slate-200 text-rose-600 rounded-lg transition"
                                    title="Delete Module"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Parent Description */}
                            {parent.description && (
                              <p className="px-5 py-2.5 text-xs text-slate-500 italic bg-white border-b border-slate-100">
                                {parent.description}
                              </p>
                            )}

                            {/* Nested Submodules list inside the parent card */}
                            <div className="bg-slate-50/50 p-4 space-y-2.5">
                              {subs.length === 0 ? (
                                <p className="text-xs text-slate-400 italic pl-10">No nested submodules registered under this module.</p>
                              ) : (
                                subs.map((sub) => (
                                  <div
                                    key={sub._id}
                                    className="flex justify-between items-start p-3 bg-white border border-slate-150 rounded-xl shadow-xs hover:border-slate-300 transition ml-6 relative"
                                  >
                                    {/* Connector visual lines */}
                                    <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-4 h-0.5 bg-slate-200"></div>
                                    
                                    <div className="flex items-start gap-3">
                                      <span className="text-slate-400 font-bold mt-0.5">↳</span>
                                      <div className="p-1.5 bg-slate-50 text-slate-600 rounded-lg border border-slate-100">
                                        {renderIcon(sub.icon)}
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="font-extrabold text-slate-700 text-sm">{sub.name}</span>
                                          <span className="bg-slate-100 text-slate-500 font-mono text-[9px] px-1.5 py-0.5 rounded uppercase">
                                            {sub.key}
                                          </span>
                                        </div>
                                        <p className="text-[11px] font-mono text-slate-400 mt-0.5">{sub.route}</p>
                                        {sub.description && (
                                          <p className="text-xs text-slate-400 mt-1 italic leading-relaxed">{sub.description}</p>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex gap-1 shrink-0 ml-4">
                                      <button
                                        onClick={() => {
                                          setEditingModule({
                                            ...sub,
                                            moduleType: 'submodule',
                                            parentModule: parent._id,
                                          });
                                        }}
                                        className="p-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-150 text-amber-600 rounded-lg transition"
                                        title="Edit Submodule"
                                      >
                                        <Edit2 size={12} />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteModule(sub._id)}
                                        className="p-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-150 text-rose-600 rounded-lg transition"
                                        title="Delete Submodule"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: USER WORKSPACE MAPPING */}
          {activeTab === 'users' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">User Workspace Assignments</h3>
                  <p className="text-xs text-slate-400">Manage user panel mappings and individual overrides.</p>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                  <input
                    type="text"
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-700 text-sm font-semibold"
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="py-3.5 px-4 font-bold text-slate-600 text-xs uppercase">User Account</th>
                      <th className="py-3.5 px-4 font-bold text-slate-600 text-xs uppercase">System Role</th>
                      <th className="py-3.5 px-4 font-bold text-slate-600 text-xs uppercase">Assigned Panel Workspace</th>
                      <th className="py-3.5 px-4 font-bold text-slate-600 text-xs uppercase">Branch Access</th>
                      <th className="py-3.5 px-4 font-bold text-slate-600 text-xs uppercase">Overrides</th>
                      <th className="py-3.5 px-4 font-bold text-slate-600 text-xs uppercase text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => {
                      const userMap = userPanels.find((up) => up.userId?._id === user._id || up.userId === user._id);
                      return (
                        <tr key={user._id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                          <td className="py-4 px-4">
                            <div className="font-extrabold text-slate-800 text-sm">{user.name}</div>
                            <div className="text-xs text-slate-400 mt-0.5">{user.email}</div>
                          </td>
                          <td className="py-4 px-4 text-xs font-bold text-slate-600">
                            {user.role}
                          </td>
                          <td className="py-4 px-4">
                            {userMap?.panelId ? (
                              <span className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 text-xs font-extrabold rounded-lg shadow-sm">
                                {userMap.panelId?.name || 'Assigned'}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs italic">Not assigned</span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-xs text-slate-500 font-semibold">
                            {userMap?.branchId || '-'}
                          </td>
                          <td className="py-4 px-4">
                            {userMap?.customPermissions?.length > 0 ? (
                              <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 text-[10px] font-bold rounded">
                                {userMap.customPermissions.length} Active Overrides
                              </span>
                            ) : (
                              <span className="text-slate-300 text-xs">-</span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handleUserConfigureClick(user)}
                                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition"
                              >
                                Configure Access
                              </button>
                              {userMap && (
                                <button
                                  onClick={() => handleRevokeUserAccess(userMap._id)}
                                  className="px-2.5 py-1.5 rounded-lg hover:bg-slate-100 border border-slate-200 text-rose-600 transition"
                                  title="Revoke Mapping"
                                >
                                  <X size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: AUDIT LOGS */}
          {activeTab === 'logs' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Activity className="text-blue-600 animate-pulse" size={22} />
                    Audit Logs Log Viewer
                  </h3>
                  <p className="text-xs text-slate-400">View real-time records of administrative adjustments.</p>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                  <input
                    type="text"
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-700 text-sm font-semibold"
                    placeholder="Search logs..."
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {filteredLogs.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">No activity matching filter found.</div>
                ) : (
                  filteredLogs.map((log) => (
                    <div
                      key={log._id}
                      className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-start gap-4"
                    >
                      <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                        <Activity size={16} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center flex-wrap gap-2">
                          <div className="font-extrabold text-sm text-slate-800">{log.action}</div>
                          <div className="text-[10px] text-slate-400 font-semibold">
                            {new Date(log.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{log.details}</p>
                        <div className="flex gap-4 mt-2 text-[10px] text-slate-400 font-mono">
                          <span>Operator: {log.userName}</span>
                          <span>IP: {log.ipAddress}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CLONE PANEL MODAL */}
      {cloningPanel && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center p-5 border-b border-slate-200 bg-slate-50 rounded-t-2xl">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Copy className="text-blue-600" size={18} />
                Clone Panel Rights
              </h2>
              <button onClick={() => setCloningPanel(null)} className="text-slate-400 hover:text-slate-600 transition">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleClonePanel} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">New Cloned Panel Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-slate-250 rounded-xl focus:outline-none focus:border-blue-500 text-slate-700 text-sm font-semibold"
                  placeholder="e.g. Finance Assistant"
                  value={cloningPanel.targetName}
                  onChange={(e) => setCloningPanel({ ...cloningPanel, targetName: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  className="w-full px-4 py-2 border border-slate-250 rounded-xl focus:outline-none focus:border-blue-500 text-slate-700 text-sm"
                  placeholder="Purpose of cloned panel"
                  value={cloningPanel.targetDescription}
                  onChange={(e) => setCloningPanel({ ...cloningPanel, targetDescription: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCloningPanel(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition"
                >
                  Confirm Clone Operation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PANEL MODAL */}
      {editingPanel && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col border border-slate-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-200 bg-slate-50 rounded-t-2xl">
              <h2 className="text-lg font-bold text-slate-800">Edit Panel Details</h2>
              <button onClick={() => setEditingPanel(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdatePanel} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Panel Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-slate-250 rounded-xl focus:outline-none focus:border-blue-500 text-slate-700 text-sm font-semibold"
                  value={editingPanel.name}
                  onChange={(e) => setEditingPanel({ ...editingPanel, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-250 rounded-xl focus:outline-none focus:border-blue-500 text-slate-700 text-sm"
                  value={editingPanel.description}
                  onChange={(e) => setEditingPanel({ ...editingPanel, description: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="panel-active"
                  checked={editingPanel.isActive}
                  onChange={(e) => setEditingPanel({ ...editingPanel, isActive: e.target.checked })}
                  className="rounded border-slate-350 text-blue-600 h-4 w-4"
                />
                <label htmlFor="panel-active" className="text-xs font-bold text-slate-600">
                  Panel Active Status
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPanel(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700"
                >
                  Save Panel Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODULE MODAL */}
      {editingModule && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col border border-slate-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-200 bg-slate-50 rounded-t-2xl">
              <h2 className="text-lg font-bold text-slate-800">Edit Module/Submodule</h2>
              <button onClick={() => setEditingModule(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateModule} className="p-5 space-y-4">
              {/* Module Type Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Module Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingModule({ ...editingModule, moduleType: 'parent', parentModule: '' })}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      editingModule.moduleType === 'parent'
                        ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-sm font-semibold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Main Module (Parent)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingModule({ ...editingModule, moduleType: 'submodule' })}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      editingModule.moduleType === 'submodule'
                        ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-sm font-semibold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Submodule (Child)
                  </button>
                </div>
              </div>

              {/* Parent Module Selection Dropdown (Only shown if submodule is selected) */}
              {editingModule.moduleType === 'submodule' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Select Parent Module <span className="text-rose-500">*</span>
                  </label>
                  <select
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-700 text-sm font-semibold"
                    value={editingModule.parentModule}
                    onChange={(e) => setEditingModule({ ...editingModule, parentModule: e.target.value })}
                    required
                  >
                    <option value="">-- Choose Parent Module --</option>
                    {modules
                      .filter((m) => !m.parentModule && m._id !== editingModule._id)
                      .map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Module Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-slate-250 rounded-xl focus:outline-none focus:border-blue-500 text-slate-700 text-sm font-semibold"
                  value={editingModule.name}
                  onChange={(e) => setEditingModule({ ...editingModule, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Route Path</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-slate-250 rounded-xl focus:outline-none focus:border-blue-500 text-slate-700 text-sm font-semibold"
                  value={editingModule.route}
                  onChange={(e) => setEditingModule({ ...editingModule, route: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Sidebar Icon</label>
                <select
                  className="w-full px-4 py-2 border border-slate-250 rounded-xl focus:outline-none focus:border-blue-500 text-slate-700 text-sm font-semibold"
                  value={editingModule.icon}
                  onChange={(e) => setEditingModule({ ...editingModule, icon: e.target.value })}
                >
                  {AVAILABLE_ICONS.map((ico) => (
                    <option key={ico.name} value={ico.name}>
                      {ico.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                <textarea
                  rows={2}
                  className="w-full px-4 py-2 border border-slate-250 rounded-xl focus:outline-none focus:border-blue-500 text-slate-700 text-sm"
                  value={editingModule.description}
                  onChange={(e) => setEditingModule({ ...editingModule, description: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingModule(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700"
                >
                  Save Module Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIGURE USER ACCESS SLIDING MODAL */}
      {configuringUser && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-end p-0 backdrop-blur-sm">
          <div className="bg-white shadow-2xl w-full max-w-xl h-full flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 bg-slate-50">
              <div>
                <h2 className="text-xl font-extrabold text-slate-800">Configure User Access</h2>
                <p className="text-xs text-slate-400 mt-0.5">Define workspace panel mappings and custom override permissions.</p>
              </div>
              <button onClick={() => setConfiguringUser(null)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveUserAssignment} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="bg-blue-50/50 border border-blue-150 p-4 rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-blue-500 text-white rounded-xl">
                  <Users size={24} />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-base">{configuringUser.name}</h4>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{configuringUser.email}</p>
                </div>
              </div>

              {/* Panel Select */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Workspace Panel Assignment</label>
                <select
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-700 text-sm font-semibold"
                  value={userAssignForm.panelId}
                  onChange={(e) => setUserAssignForm({ ...userAssignForm, panelId: e.target.value })}
                  required
                >
                  <option value="">-- Choose Workspace Panel --</option>
                  {panels.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.key})
                    </option>
                  ))}
                </select>
              </div>

              {/* Branch Settings */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Branch / Territory Location</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-slate-250 rounded-xl focus:outline-none focus:border-blue-500 text-slate-700 text-sm font-semibold"
                  placeholder="e.g. Main Branch, North Zone"
                  value={userAssignForm.branchId}
                  onChange={(e) => setUserAssignForm({ ...userAssignForm, branchId: e.target.value })}
                />
              </div>

              {/* User Overrides Matrix */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                  User-Specific Override Permissions (Fine-Tuning)
                </label>
                <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                  Toggle cells to enforce explicit overrides (Checked = Allow, Unchecked = Deny, Dash = Default panel permissions).
                </p>

                <div className="border border-slate-150 rounded-2xl overflow-hidden bg-slate-50/50">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200">
                        <th className="py-2.5 px-4 font-bold text-slate-700 text-xs">Module Hierarchy</th>
                        <th className="py-2.5 px-2 font-bold text-slate-700 text-xs text-center">View</th>
                        <th className="py-2.5 px-2 font-bold text-slate-700 text-xs text-center">Add</th>
                        <th className="py-2.5 px-2 font-bold text-slate-700 text-xs text-center">Edit</th>
                        <th className="py-2.5 px-2 font-bold text-slate-700 text-xs text-center">Del</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedModules.map((mod) => {
                        const override = userAssignForm.customPermissions.find(
                          (cp) => cp.moduleId === mod._id || cp.moduleId?._id === mod._id
                        );

                        return (
                          <tr
                            key={mod._id}
                            className={`border-b border-slate-150 hover:bg-slate-50/70 transition ${
                              mod.isSubmodule ? 'bg-slate-50/40 font-normal' : 'bg-slate-100/50 font-bold'
                            }`}
                          >
                            <td className="py-3 px-4 text-slate-800 text-xs">
                              {mod.isSubmodule && <span className="text-slate-400 mr-1.5">↳</span>}
                              {mod.name}
                            </td>
                            {['view', 'add', 'edit', 'delete'].map((act) => {
                              const actField = `can_${act}`;
                              const val = override ? override[actField] : undefined;

                              return (
                                <td key={act} className="py-2 px-1 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleUserOverride(mod._id, actField, val)}
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center border font-extrabold text-xs transition-all ${
                                      val === true
                                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                                        : val === false
                                        ? 'bg-rose-600 border-rose-600 text-white shadow-sm'
                                        : 'bg-white border-slate-200 text-slate-400 hover:border-slate-350'
                                    }`}
                                  >
                                    {val === true ? '✓' : val === false ? '✗' : '-'}
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setConfiguringUser(null)}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition shadow-md shadow-blue-100 flex items-center gap-1.5"
                >
                  <Lock size={14} />
                  Save Dynamic Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
