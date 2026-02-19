import React, { useState, useEffect } from 'react';
import { Save, X, Loader } from 'lucide-react';
import { fetchOverdueTaskSettings, updateOverdueTaskSettings } from '../../../services/settings/settingsApi';

export default function OverdueTaskSetting() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [initialData, setInitialData] = useState(null);

  const [formData, setFormData] = useState({
    // Today's Tasks
    todayTasksDays: 0,
    todayPriority: 'medium',
    showTodayTasks: true,

    // Pending Tasks
    pendingMinDays: 1,
    pendingMaxDays: 7,
    sendPendingReminders: true,
    reminderFrequency: 'weekly',

    // Overdue Tasks
    overdueDays: 1,
    escalationLevels: {
      level1: true,
      level2: true,
      level3: false
    },
    autoPenalty: true,
    penaltyPercentage: 2,
    overdueBenchmark: 70
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await fetchOverdueTaskSettings();
      setFormData(data);
      setInitialData(data);
      setError(null);
    } catch (err) {
      console.error('Error loading settings:', err);
      setError('Failed to load settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updatedSettings = await updateOverdueTaskSettings(formData);
      setFormData(updatedSettings);
      setInitialData(updatedSettings);
      alert('Task settings saved successfully!');
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (initialData) {
      setFormData(initialData);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedChange = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500 text-center">
        {error}
        <button
          onClick={loadSettings}
          className="ml-4 text-blue-500 hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="text-white p-4 rounded-xl mb-4 shadow-lg"
        style={{ background: 'linear-gradient(135deg, #2c3e50, #3498db)' }}>
        <div className="flex flex-col md:flex-row md:items-center">
          <div className="md:w-1/2">
            <h2 className="text-2xl font-bold text-white mb-2 md:mb-0">Overdue Task Setting</h2>
          </div>
        </div>
      </div>

      <div className="plan-section bg-white rounded-lg shadow" id="taskSettingsPlan">
        <form id="taskSettingsForm" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {/* Today's Tasks Settings */}
            <div className="col-span-1">
              <div className="card border border-blue-300 rounded-lg overflow-hidden">
                <div className="card-header bg-blue-500 text-white p-4">
                  <h5 className="text-lg font-semibold mb-0">Today's Tasks Definition</h5>
                </div>
                <div className="card-body p-4">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Consider tasks due within:
                    </label>
                    <div className="flex">
                      <input
                        type="number"
                        className="flex-grow rounded-l-md border border-r-0 border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        value={formData.todayTasksDays}
                        min="0"
                        onChange={(e) => handleInputChange('todayTasksDays', parseInt(e.target.value))}
                      />
                      <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                        days
                      </span>
                    </div>
                    <small className="text-gray-500 text-xs mt-1 block">
                      (0 means only tasks due exactly today)
                    </small>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority Highlighting:
                    </label>
                    <select
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.todayPriority}
                      onChange={(e) => handleInputChange('todayPriority', e.target.value)}
                    >
                      <option value="high">High Priority (Color: Red)</option>
                      <option value="medium">Medium Priority (Color: Orange)</option>
                      <option value="low">Low Priority (Color: Blue)</option>
                    </select>
                  </div>

                  <div className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      id="showTodaysTasks"
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={formData.showTodayTasks}
                      onChange={(e) => handleInputChange('showTodayTasks', e.target.checked)}
                    />
                    <label htmlFor="showTodaysTasks" className="ml-2 block text-sm text-gray-700">
                      Show in Dashboard
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Pending Tasks Settings */}
            <div className="col-span-1">
              <div className="card border border-yellow-300 rounded-lg overflow-hidden">
                <div className="card-header bg-yellow-400 text-gray-900 p-4">
                  <h5 className="text-lg font-semibold mb-0">Pending Tasks Definition</h5>
                </div>
                <div className="card-body p-4">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum days remaining to be "Pending":
                    </label>
                    <div className="flex">
                      <input
                        type="number"
                        className="flex-grow rounded-l-md border border-r-0 border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        value={formData.pendingMinDays}
                        min="1"
                        onChange={(e) => handleInputChange('pendingMinDays', parseInt(e.target.value))}
                      />
                      <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                        days
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum days remaining to be "Pending":
                    </label>
                    <div className="flex">
                      <input
                        type="number"
                        className="flex-grow rounded-l-md border border-r-0 border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        value={formData.pendingMaxDays}
                        min="1"
                        onChange={(e) => handleInputChange('pendingMaxDays', parseInt(e.target.value))}
                      />
                      <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                        days
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      id="sendPendingReminders"
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={formData.sendPendingReminders}
                      onChange={(e) => handleInputChange('sendPendingReminders', e.target.checked)}
                    />
                    <label htmlFor="sendPendingReminders" className="ml-2 block text-sm text-gray-700">
                      Send Reminder Emails
                    </label>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reminder Frequency:
                    </label>
                    <select
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.reminderFrequency}
                      onChange={(e) => handleInputChange('reminderFrequency', e.target.value)}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Bi-Weekly</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Overdue Tasks Settings */}
            <div className="col-span-1">
              <div className="card border border-red-300 rounded-lg overflow-hidden">
                <div className="card-header bg-red-500 text-white p-4">
                  <h5 className="text-lg font-semibold mb-0">Overdue Tasks Definition</h5>
                </div>
                <div className="card-body p-4">
                  {/* Days past deadline */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Days past deadline to be "Overdue":
                    </label>
                    <div className="flex">
                      <input
                        type="number"
                        className="flex-grow rounded-l-md border border-r-0 border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        value={formData.overdueDays}
                        min="0"
                        onChange={(e) => handleInputChange('overdueDays', parseInt(e.target.value))}
                      />
                      <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                        days
                      </span>
                    </div>
                  </div>

                  {/* Escalation Levels */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Escalation Levels:
                    </label>
                    <div className="border border-gray-200 rounded-md p-3 space-y-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="level1"
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={formData.escalationLevels.level1}
                          onChange={(e) => handleNestedChange('escalationLevels', 'level1', e.target.checked)}
                        />
                        <label htmlFor="level1" className="ml-2 block text-sm text-gray-700">
                          Level 1 (1-3 days overdue) - Efficiency score decrease with 5%
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="level2"
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={formData.escalationLevels.level2}
                          onChange={(e) => handleNestedChange('escalationLevels', 'level2', e.target.checked)}
                        />
                        <label htmlFor="level2" className="ml-2 block text-sm text-gray-700">
                          Level 2 (4-7 days overdue) - Efficiency score decrease with 10%
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="level3"
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={formData.escalationLevels.level3}
                          onChange={(e) => handleNestedChange('escalationLevels', 'level3', e.target.checked)}
                        />
                        <label htmlFor="level3" className="ml-2 block text-sm text-gray-700">
                          Level 3 (8+ days overdue) - Efficiency score decrease with 15%
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Auto penalty switch */}
                  <div className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      id="autoPenalty"
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={formData.autoPenalty}
                      onChange={(e) => handleInputChange('autoPenalty', e.target.checked)}
                    />
                    <label htmlFor="autoPenalty" className="ml-2 block text-sm text-gray-700">
                      Apply Automatic Penalties
                    </label>
                  </div>

                  {/* Penalty Percentage */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Penalty Percentage:
                    </label>
                    <div className="flex">
                      <input
                        type="number"
                        className="flex-grow rounded-l-md border border-r-0 border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        value={formData.penaltyPercentage}
                        min="0"
                        max="10"
                        step="0.5"
                        onChange={(e) => handleInputChange('penaltyPercentage', parseFloat(e.target.value))}
                      />
                      <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                        %
                      </span>
                    </div>
                  </div>

                  {/* Overdue Benchmark Score */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Overdue Benchmark Score:
                    </label>
                    <div className="flex">
                      <input
                        type="number"
                        className="flex-grow rounded-l-md border border-r-0 border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        value={formData.overdueBenchmark}
                        min="0"
                        max="100"
                        onChange={(e) => handleInputChange('overdueBenchmark', parseInt(e.target.value))}
                      />
                      <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                        %
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Save Settings */}
          <div className="mt-6">
            <div className="flex justify-center">
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={saving}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  disabled={saving}
                >
                  {saving ? (
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {saving ? 'Saving...' : 'Save Task Settings'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
