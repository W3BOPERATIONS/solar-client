import React, { useState, useEffect, useRef } from 'react';
import {
  Trash2, Edit, Download, Printer,
  Save, Calculator, Eye,
  BarChart3, LineChart, Settings, CheckCircle
} from 'lucide-react';
import Chart from 'chart.js/auto';
import {
  getQuoteSettings,
  createQuoteSetting,
  updateQuoteSetting,
  deleteQuoteSetting
} from '../../../../services/quote/quoteApi';
import toast from 'react-hot-toast';

export default function QuoteSetting() {
  const [filters, setFilters] = useState({
    category: '',
    subCategory: '',
    projectType: '',
    subProjectType: ''
  });

  const [quoteType, setQuoteType] = useState('');
  const [partnerType, setPartnerType] = useState('');
  const [planType, setPlanType] = useState('');
  const [selectedPages, setSelectedPages] = useState([]);
  const [colorSettings, setColorSettings] = useState({
    brandColor: false,
    backgroundColor: false,
    pageSequence: false
  });

  const [solarSettings, setSolarSettings] = useState({
    projectKW: 10,
    unitPerKW: 4
  });

  const [monthlyIsolation, setMonthlyIsolation] = useState(
    Array(12).fill(0).map((val, idx) => ({
      month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][idx],
      isolation: 120,
      total: 0
    }))
  );

  const [annualTotal, setAnnualTotal] = useState(0);
  const [quotes, setQuotes] = useState([]);
  // const [quoteCount, setQuoteCount] = useState(0); // Not needed with DB IDs
  const [editingId, setEditingId] = useState(null);

  const generationChartRef = useRef(null);
  const roiChartRef = useRef(null);
  const generationChartInstance = useRef(null);
  const roiChartInstance = useRef(null);

  const pagesOptions = [
    { id: 'f1', label: 'Front Page', value: 'Front Page' },
    { id: 'f2', label: 'Commercial Page', value: 'Commercial Page' },
    { id: 'f3', label: 'Generation Graph', value: 'Generation Graph' },
    { id: 'f4', label: 'Add ons Settings', value: 'Advanced Settings' },
    { id: 'f5', label: 'BOM Survey Summary', value: 'Financial Summary' }
  ];

  const categories = ['Solar Rooftop', 'Solar Pump'];
  const subcategories = ['Residential', 'Commercial'];
  const projectTypes = ['3kw - 5kw', '10kw - 15kw', '10kw - 20kw'];
  const subProjectTypes = ['On Grid', 'Off Grid', 'Hybrid'];
  const quoteTypes = ['Survey Quote', 'Quick Quote'];
  const partnerTypes = ['Dealer', 'Franchisee', 'Channel Partner', 'Employee'];
  const planTypes = ['Startup', 'Basic', 'Enterprise', 'Solar Business'];

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      const data = await getQuoteSettings();
      setQuotes(data);
    } catch (error) {
      console.error("Error fetching quotes:", error);
      toast.error("Failed to load quote settings");
    }
  };

  useEffect(() => {
    calculateGeneration();
  }, [monthlyIsolation, solarSettings.projectKW, solarSettings.unitPerKW]); // Recalculate when dependencies change

  useEffect(() => {
    if (selectedPages.includes('Generation Graph')) {
      // Delay chart initialization to ensure DOM is ready
      setTimeout(initializeCharts, 100);
    }
  }, [selectedPages, monthlyIsolation]);


  const calculateGeneration = () => {
    const { projectKW, unitPerKW } = solarSettings;
    let total = 0;

    const updatedMonths = monthlyIsolation.map(month => {
      const monthTotal = month.isolation * projectKW * unitPerKW;
      total += monthTotal;
      return { ...month, total: parseFloat(monthTotal.toFixed(2)) };
    });

    // Only update state if values actually changed to avoid infinite loop if we were setting monthlyIsolation here directly
    // But since we are mapping, we are creating new objects.
    // Instead of setting monthlyIsolation which triggers effect, we just calculate for annualTotal
    // And for the chart.
    // However, we want 'total' property in monthlyIsolation to be updated.

    // To avoid infinite loop (Effect -> calculate -> setState -> Effect), we should separate the "input" isolation from "calculated" total.
    // BUT the original code did setMonthlyIsolation.
    // Let's just calculate total here for annualTotal state, and rely on the rendered values for display.

    const calculatedTotal = updatedMonths.reduce((sum, m) => sum + m.total, 0);
    setAnnualTotal(parseFloat(calculatedTotal.toFixed(2)));
  };

  const getCalculatedMonthlyData = () => {
    const { projectKW, unitPerKW } = solarSettings;
    return monthlyIsolation.map(month => ({
      ...month,
      total: parseFloat((month.isolation * projectKW * unitPerKW).toFixed(2))
    }));
  }

  const initializeCharts = () => {
    // Destroy existing charts
    if (generationChartInstance.current) {
      generationChartInstance.current.destroy();
    }
    if (roiChartInstance.current) {
      roiChartInstance.current.destroy();
    }

    const calculatedData = getCalculatedMonthlyData();

    // Generation Chart
    const generationCtx = document.getElementById('generationChart');
    if (generationCtx) {
      generationChartInstance.current = new Chart(generationCtx, {
        type: 'bar',
        data: {
          labels: calculatedData.map(m => m.month),
          datasets: [{
            label: 'Units Generated (kWh)',
            data: calculatedData.map(m => m.total),
            backgroundColor: 'rgba(54, 162, 235, 0.7)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Units (kWh)'
              }
            }
          }
        }
      });
    }

    // ROI Chart (Static Data as placeholder, dynamic would require more inputs)
    const roiCtx = document.getElementById('roiChart');
    if (roiCtx) {
      roiChartInstance.current = new Chart(roiCtx, {
        type: 'line',
        data: {
          labels: ['Year 0', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6', 'Year 7'],
          datasets: [{
            label: 'Cumulative Savings (₹)',
            data: [0, 28500, 57000, 85500, 114000, 142500, 171000, 199500],
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.1)',
            borderWidth: 2,
            fill: true
          }, {
            label: 'System Cost (₹)',
            data: [195008, 195008, 195008, 195008, 195008, 195008, 195008, 195008],
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 2,
            borderDash: [5, 5],
            fill: false
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Amount (₹)'
              }
            }
          }
        }
      });
    }
  };

  const handleSaveQuote = async () => {
    if (!filters.category || !filters.subCategory || !filters.projectType || !filters.subProjectType || !quoteType || !partnerType || !planType) {
      toast.error("Please fill all fields before saving the quote.");
      return;
    }

    const payload = {
      ...filters,
      quoteType,
      partnerType,
      planType,
      selectedPages,
      solarSettings,
      monthlyIsolation: monthlyIsolation.map(m => ({
        month: m.month,
        isolation: m.isolation,
        total: (m.isolation * solarSettings.projectKW * solarSettings.unitPerKW)
      })),
      colorSettings
    };

    try {
      if (editingId) {
        await updateQuoteSetting(editingId, payload);
        toast.success("Quote setting updated");
      } else {
        await createQuoteSetting(payload);
        toast.success("Quote setting created");
      }

      // Reset and Fetch
      setEditingId(null);
      resetForm();
      fetchQuotes();

    } catch (error) {
      console.error("Error saving quote:", error);
      toast.error("Failed to save quote");
    }
  };

  const resetForm = () => {
    setFilters({
      category: '',
      subCategory: '',
      projectType: '',
      subProjectType: ''
    });
    setQuoteType('');
    setPartnerType('');
    setPlanType('');
    setSelectedPages([]);
    setSolarSettings({
      projectKW: 10,
      unitPerKW: 4
    });
    setMonthlyIsolation(Array(12).fill(0).map((val, idx) => ({
      month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][idx],
      isolation: 120,
      total: 0
    })));
  };

  const handleDeleteQuote = async (id) => {
    if (window.confirm("Are you sure you want to delete this quote setting?")) {
      try {
        await deleteQuoteSetting(id);
        toast.success("Quote setting deleted");
        fetchQuotes();
        if (editingId === id) {
          setEditingId(null);
          resetForm();
        }
      } catch (error) {
        console.error("Error deleting quote:", error);
        toast.error("Failed to delete quote");
      }
    }
  };

  const handleEditQuote = (quote) => {
    setEditingId(quote._id);
    setFilters({
      category: quote.category,
      subCategory: quote.subCategory, // Note casing: subCategory in DB
      projectType: quote.projectType,
      subProjectType: quote.subProjectType
    });
    setQuoteType(quote.quoteType);
    setPartnerType(quote.partnerType || '');
    setPlanType(quote.planType || '');
    setSelectedPages(quote.selectedPages || []);

    if (quote.solarSettings) {
      setSolarSettings(quote.solarSettings);
    }
    if (quote.monthlyIsolation && quote.monthlyIsolation.length > 0) {
      setMonthlyIsolation(quote.monthlyIsolation);
    }
    if (quote.colorSettings) {
      setColorSettings(quote.colorSettings);
    }

    // Scroll top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateBOMVisibility = () => {
    // BOM Survey is disabled for Quick Quote
    if (quoteType === 'Quick Quote') {
      setSelectedPages(prev => prev.filter(page => page !== 'Financial Summary'));
    }
  };

  useEffect(() => {
    updateBOMVisibility();
  }, [quoteType]);

  const isAdvancedSettingsEnabled = ['Basic', 'Enterprise', 'Solar Business'].includes(planType);

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <nav className="bg-white rounded-lg shadow-sm p-4">
          <h1 className="text-2xl font-bold text-gray-800">Quote Settings</h1>
        </nav>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column - Settings */}
        <div className="lg:w-7/12">
          {/* Settings Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg font-bold flex justify-between items-center">
              <span>{editingId ? 'Edit Quote Setting' : 'Add Quote Setting'}</span>
              {editingId && (
                <button onClick={() => { setEditingId(null); resetForm(); }} className="text-xs bg-white text-blue-600 px-2 py-1 rounded">
                  Cancel Edit
                </button>
              )}
            </div>

            <div className="p-6">
              {/* Filters */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Category</label>
                  <select
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  >
                    <option value="" disabled>Select Category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Sub Category</label>
                  <select
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                    value={filters.subCategory}
                    onChange={(e) => setFilters({ ...filters, subCategory: e.target.value })}
                  >
                    <option value="" disabled>Select Sub Category</option>
                    {subcategories.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Project Type</label>
                  <select
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                    value={filters.projectType}
                    onChange={(e) => setFilters({ ...filters, projectType: e.target.value })}
                  >
                    <option value="" disabled>Select Type</option>
                    {projectTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Sub Proj Type</label>
                  <select
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                    value={filters.subProjectType}
                    onChange={(e) => setFilters({ ...filters, subProjectType: e.target.value })}
                  >
                    <option value="" disabled>Select Type</option>
                    {subProjectTypes.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Selections Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 items-stretch">
                {/* Quote Type */}
                <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 flex flex-col">
                  <label className="block text-sm font-bold text-gray-700 mb-3 text-center uppercase tracking-tight">Quote Type</label>
                  <div className="grid grid-cols-2 gap-3 flex-1">
                    {quoteTypes.map(type => (
                      <button
                        key={type}
                        className={`flex flex-col items-center justify-center gap-2 px-3 py-4 rounded-xl border-2 transition-all duration-200 text-xs font-bold shadow-sm ${quoteType === type ? 'bg-blue-600 text-white border-blue-600 scale-[1.02]' : 'bg-white border-gray-100 text-gray-600 hover:border-blue-200'}`}
                        onClick={() => setQuoteType(type)}
                      >
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${quoteType === type ? 'border-white' : 'border-gray-300'}`}>
                          {quoteType === type && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Partner Type */}
                <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 flex flex-col">
                  <label className="block text-sm font-bold text-gray-700 mb-3 text-center uppercase tracking-tight">Partner Type</label>
                  <div className="flex-1 flex flex-col justify-center">
                    <select
                      className="w-full bg-white border-2 border-gray-100 rounded-xl px-4 py-3.5 focus:outline-none focus:border-blue-500 font-bold text-gray-700 shadow-sm text-sm"
                      value={partnerType}
                      onChange={(e) => setPartnerType(e.target.value)}
                    >
                      <option value="" disabled>Select Partner Type</option>
                      {partnerTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Plan Type Selection */}
              <div className="bg-gray-50/50 p-6 rounded-2xl border-2 border-dashed border-gray-200 mb-8">
                <label className="block text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  Select Plan Type
                </label>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {planTypes.map(type => (
                    <button
                      key={type}
                      className={`relative px-4 py-5 rounded-xl border-2 transition-all duration-300 text-[11px] font-black flex flex-col items-center justify-center gap-2 shadow-sm uppercase tracking-wider ${planType === type ? 'bg-blue-600 text-white border-blue-600 scale-[1.05] z-10 shadow-blue-200 shadow-lg' : 'bg-white border-gray-100 text-gray-500 hover:border-blue-400 hover:bg-blue-50/50'}`}
                      onClick={() => setPlanType(type)}
                    >
                      {planType === type && (
                        <div className="absolute -top-2 -right-2 bg-green-500 text-white p-1 rounded-full shadow-md">
                          <CheckCircle size={12} className="text-white" />
                        </div>
                      )}
                      <span>{type}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Solar Generation Settings Card */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6">
                <div className="bg-blue-600 text-white text-center py-4 rounded-t-lg">
                  <h4 className="text-xl font-bold">Solar Generation Settings</h4>
                </div>

                <div className="p-6">
                  {/* Project Inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Total Project (kW)</label>
                      <input
                        type="number"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={solarSettings.projectKW}
                        onChange={(e) => setSolarSettings({ ...solarSettings, projectKW: parseFloat(e.target.value) || 0 })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Unit per kW</label>
                      <input
                        type="number"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={solarSettings.unitPerKW}
                        onChange={(e) => setSolarSettings({ ...solarSettings, unitPerKW: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  {/* Monthly Inputs */}
                  <h5 className="text-blue-600 font-medium mb-4">Enter Monthly Solar Isolation</h5>

                  <div className="overflow-x-auto mb-4">
                    <table className="min-w-full border border-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700">Month</th>
                          <th className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700">Solar Isolation</th>
                          <th className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700">Total Generation (Units)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getCalculatedMonthlyData().map((month, index) => (
                          <tr key={month.month}>
                            <td className="border border-gray-300 px-4 py-3 text-center">{month.month}</td>
                            <td className="border border-gray-300 px-4 py-3">
                              <input
                                type="number"
                                className="w-full border border-gray-300 rounded px-2 py-1 text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                                value={monthlyIsolation[index].isolation}
                                onChange={(e) => {
                                  const newIsolation = [...monthlyIsolation];
                                  newIsolation[index] = {
                                    ...newIsolation[index],
                                    isolation: parseFloat(e.target.value) || 0
                                  };
                                  setMonthlyIsolation(newIsolation);
                                }}
                              />
                            </td>
                            <td className="border border-gray-300 px-4 py-3 text-center font-medium">
                              {month.total.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Total Summary */}
                  <div className="text-right mt-4">
                    <h5 className="text-green-600 font-bold text-lg">
                      🌍 Annual Total: <span className="text-green-700">{annualTotal.toFixed(2)}</span> Units
                    </h5>
                  </div>

                  <div className="text-center mt-4">
                    <button
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
                      onClick={calculateGeneration}
                    >
                      <Calculator size={18} />
                      Calculate
                    </button>
                  </div>
                </div>
              </div>

              {/* Pages Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Pages</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {pagesOptions.map(page => (
                    <div key={page.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={page.id}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        checked={selectedPages.includes(page.value)}
                        disabled={page.value === 'Financial Summary' && quoteType === 'Quick Quote'}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPages([...selectedPages, page.value]);
                          } else {
                            setSelectedPages(selectedPages.filter(p => p !== page.value));
                          }
                        }}
                      />
                      <label
                        htmlFor={page.id}
                        className={`ml-2 text-sm ${page.value === 'Financial Summary' && quoteType === 'Quick Quote' ? 'text-gray-400' : 'text-gray-700'}`}
                      >
                        {page.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Advanced Settings Section */}
              <div className={`border border-gray-300 rounded-lg p-4 mb-6 ${!isAdvancedSettingsEnabled ? 'opacity-60 pointer-events-none' : ''}`}>
                <h5 className="font-bold text-gray-800 mb-4">Advanced Settings</h5>
                <div className="space-y-3">
                  {['Page Sequence Setting', 'Brand Color Setting', 'Background Color Setting'].map((setting, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          checked={Object.values(colorSettings)[idx]}
                          onChange={(e) => {
                            const newSettings = { ...colorSettings };
                            newSettings[Object.keys(colorSettings)[idx]] = e.target.checked;
                            setColorSettings(newSettings);
                          }}
                          disabled={!isAdvancedSettingsEnabled}
                        />
                        <label className="ml-2 text-sm text-gray-700">{setting}</label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <div className="text-right">
                <button
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 ml-auto"
                  onClick={handleSaveQuote}
                >
                  <Save size={18} />
                  {editingId ? 'Update & Save' : 'Save Quote'}
                </button>
              </div>
            </div>
          </div>

          {/* Quote Summary Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="bg-gray-50 px-6 py-4 rounded-t-lg font-bold border-b">
              Quote Summary
            </div>

            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700">#</th>
                      <th className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700">Quote Type</th>
                      <th className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700">Category</th>
                      <th className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700">Sub Category</th>
                      <th className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700">Project Type</th>
                      <th className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700">Sub Project Type</th>
                      <th className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700">Partner Type</th>
                      <th className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700">Plan Type</th>
                      {/* <th className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700">Quote Pages</th> */}
                      <th className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotes.map((quote, index) => (
                      <tr key={quote._id}>
                        <td className="border border-gray-300 px-4 py-3 text-center">{index + 1}</td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${quote.quoteType === 'Survey Quote' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                            {quote.quoteType}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">{quote.category}</td>
                        <td className="border border-gray-300 px-4 py-3 text-center">{quote.subCategory}</td>
                        <td className="border border-gray-300 px-4 py-3 text-center">{quote.projectType}</td>
                        <td className="border border-gray-300 px-4 py-3 text-center">{quote.subProjectType}</td>
                        <td className="border border-gray-300 px-4 py-3 text-center text-xs font-semibold text-blue-700">{quote.partnerType}</td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-md text-[10px] font-bold uppercase">
                            {quote.planType}
                          </span>
                        </td>
                        {/* <td className="border border-gray-300 px-4 py-3">{quote.pages || '-'}</td> */}
                        <td className="border border-gray-300 px-4 py-3">
                          <div className="flex justify-center gap-2">
                            <button
                              className="bg-yellow-500 text-white p-1.5 rounded hover:bg-yellow-600"
                              onClick={() => handleEditQuote(quote)}
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              className="bg-red-500 text-white p-1.5 rounded hover:bg-red-600"
                              onClick={() => handleDeleteQuote(quote._id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {quotes.length === 0 && (
                      <tr>
                        <td colSpan="9" className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                          No quotes saved yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Preview */}
        <div className="lg:w-5/12">
          <div className="sticky top-4 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 font-bold border-b">
              Quote Preview
            </div>

            <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 140px)' }}>
              {/* Preview Content */}
              <div className="transform scale-90 origin-top">
                {/* Page 1: Title */}
                <div className="bg-white border rounded-3xl overflow-hidden shadow-2xl mb-8 border-gray-100">
                  {/* Hero Banner Section */}
                  <div className="relative h-64 w-full">
                    <img
                      src="https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
                      alt="Solar Roof"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col items-center justify-center text-center px-6">
                      <h2 className="text-3xl font-black text-white mb-1 uppercase tracking-tighter drop-shadow-lg">
                        {filters.category || 'Residential'} {filters.projectType || '3 To 10 KW'}
                      </h2>
                      <h3 className="text-2xl font-black text-yellow-400 mb-2 uppercase tracking-wide drop-shadow-md">
                        ({filters.subProjectType || 'National Portal'})
                      </h3>
                      <h4 className="text-4xl font-extrabold text-white mb-2 tracking-[0.2em]">PROPOSAL</h4>
                      <p className="text-xs font-bold text-gray-200 tracking-widest uppercase border-t border-gray-400/50 pt-2 transition-all duration-300 hover:text-white">
                        SOLAR ENERGY FOR A BETTER TOMORROW
                      </p>
                    </div>
                  </div>

                  {/* Customer Info Section */}
                  <div className="p-8 bg-white">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-baseline gap-2 pb-2 border-b border-gray-50">
                        <span className="text-sm font-black text-gray-800 uppercase min-w-[150px]">Proposal No:</span>
                        <span className="text-sm font-bold text-blue-600"># qua/24-25/002</span>
                      </div>
                      <div className="flex items-baseline gap-2 pb-2 border-b border-gray-50">
                        <span className="text-sm font-black text-gray-800 uppercase min-w-[150px]">Name of Customer:</span>
                        <span className="text-sm font-bold text-gray-600">Pradip Sharma</span>
                      </div>
                      <div className="flex items-baseline gap-2 pb-2 border-b border-gray-50">
                        <span className="text-sm font-black text-gray-800 uppercase min-w-[150px]">KW Required:</span>
                        <span className="text-sm font-bold text-gray-600">{solarSettings.projectKW} KW</span>
                      </div>
                      <div className="flex items-baseline gap-2 pb-2 border-b border-gray-50">
                        <span className="text-sm font-black text-gray-800 uppercase min-w-[150px]">Residential / Commercial:</span>
                        <span className="text-sm font-bold text-gray-600">{filters.category} {filters.projectType}</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-black text-gray-800 uppercase min-w-[150px]">City:</span>
                        <span className="text-sm font-bold text-gray-600">Rajkot</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Stats Section */}
                  <div className="grid grid-cols-2 border-t border-gray-100 bg-gray-50/50">
                    <div className="p-6 border-r border-gray-100">
                      <div className="flex flex-col gap-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Prepared by</p>
                        <p className="text-sm font-bold text-gray-700 uppercase">{partnerType || 'Demo'} User</p>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex flex-col gap-1">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</p>
                          <p className="text-sm font-bold text-gray-700 uppercase">16 July 2025</p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <p className="text-[10px] font-black text-red-400 uppercase tracking-widest text-right">Valid Upto</p>
                          <p className="text-sm font-bold text-red-600 text-right">10 Days</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-center">
                    <p className="font-bold mb-2">Project: {filters.projectType}</p>
                    <img
                      src="https://placehold.co/300x200"
                      alt="Combo Kit"
                      className="w-full h-auto rounded-lg"
                    />
                  </div>

                  <div>
                    <table className="w-full border border-gray-300">
                      <tbody>
                        <tr className="border-b border-gray-300">
                          <td className="p-2">Total Cost</td>
                          <td className="p-2 font-medium">Rs. 195008 /-</td>
                        </tr>
                        <tr className="border-b border-gray-300">
                          <td className="p-2">Govt MNRE Subsidy</td>
                          <td className="p-2 font-medium">Rs. 78000 /-</td>
                        </tr>
                        <tr className="border-b border-gray-300">
                          <td className="p-2">Govt State Subsidy</td>
                          <td className="p-2 font-medium">Rs. 0 /-</td>
                        </tr>
                        <tr className="bg-blue-50">
                          <td className="p-2 font-bold">Net Cost</td>
                          <td className="p-2 font-bold">Rs. 117008 /-</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Page 3: BOM (Conditional) */}
              {quoteType === 'Survey Quote' && selectedPages.includes('Financial Summary') && (
                <div className="bg-white border border-gray-300 rounded-lg p-6 mb-4">
                  <h5 className="text-blue-600 font-bold mb-4">Residential Solar BOM</h5>

                  <table className="w-full border border-gray-300 mb-6">
                    <tbody>
                      <tr className="border-b border-gray-300">
                        <td className="p-2">Solar Structure</td>
                        <td className="p-2">HOT DIP GALVANIZE</td>
                      </tr>
                      <tr className="border-b border-gray-300">
                        <td className="p-2">Solar DC Cable</td>
                        <td className="p-2">Polycab 4 Sq mm</td>
                      </tr>
                      <tr className="border-b border-gray-300">
                        <td className="p-2">Solar AC Cable</td>
                        <td className="p-2">Polycab 4 Sq mm</td>
                      </tr>
                      <tr className="border-b border-gray-300">
                        <td className="p-2">Earthing Kit + LA</td>
                        <td className="p-2">Standard</td>
                      </tr>
                      <tr>
                        <td className="p-2">Electrical Components</td>
                        <td className="p-2">L & T / Similar</td>
                      </tr>
                    </tbody>
                  </table>

                  <p className="text-sm mb-4">
                    <strong>*Structure Height 6 x 8 Feet is included.</strong> Extra pipes beyond this will be paid by the customer.
                  </p>
                </div>
              )}

              {/* Page 4: Generation Graph and ROI Chart (Conditional) */}
              {selectedPages.includes('Generation Graph') && (
                <div className="bg-white border border-gray-300 rounded-lg p-6 mb-4">
                  <h3 className="text-blue-600 font-bold mb-4">Performance Analysis</h3>

                  {/* Generation Graph */}
                  <div className="mb-6">
                    <h5 className="font-medium mb-3">Monthly Generation (Units)</h5>
                    <div className="h-64 w-full border border-gray-300 rounded-lg p-4">
                      <canvas id="generationChart" />
                    </div>
                  </div>

                  {/* ROI Chart */}
                  <div className="mb-6">
                    <h5 className="font-medium mb-3">ROI Analysis (Payback Period)</h5>
                    <div className="h-64 w-full border border-gray-300 rounded-lg p-4">
                      <canvas id="roiChart" />
                    </div>
                  </div>
                </div>
              )}

              {/* Page 5: Advanced Options (Conditional) */}
              {selectedPages.includes('Advanced Settings') && (
                <div className="bg-white border border-gray-300 rounded-lg p-6 mb-4">
                  <h3 className="text-blue-600 font-bold mb-4">Advanced Options</h3>

                  {/* Selected Advanced Options */}
                  <div className="mb-6">
                    <h5 className="font-medium mb-3">Selected Options</h5>
                    <div className="space-y-3">
                      <div className="bg-gray-50 border-l-4 border-blue-600 p-3 rounded">
                        {Object.entries(colorSettings).map(([key, value]) => (
                          value && <div key={key}>{key.replace(/([A-Z])/g, ' $1').trim()} Enabled</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
