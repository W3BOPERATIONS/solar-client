import React, { useState, useEffect, useRef } from 'react';
import {
  Trash2, Edit, Download, Printer,
  Save, Calculator, Eye, Upload, X,
  BarChart3, LineChart, Settings, CheckCircle,
  MapPin, GripVertical, FileText
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Chart from 'chart.js/auto';
import {
  getQuoteSettings,
  createQuoteSetting,
  updateQuoteSetting,
  deleteQuoteSetting
} from '../../../../services/quote/quoteApi';
import toast from 'react-hot-toast';
import { productApi } from '../../../../api/productApi';
import salesSettingsService from '../../../../services/settings/salesSettingsApi';
import { useLocations } from '../../../../hooks/useLocations';

export default function QuoteSetting() {
  const [filters, setFilters] = useState({
    category: '',
    subCategory: '',
    projectType: '',
    subProjectType: ''
  });

  const [quoteType, setQuoteType] = useState('Survey Quote');
  const [partnerType, setPartnerType] = useState('');
  const [planType, setPlanType] = useState('');
  const [kitType, setKitType] = useState('Combo Kit');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [selectedPages, setSelectedPages] = useState([]);
  const [colorSettings, setColorSettings] = useState({
    brandColor: false,
    backgroundColor: false,
    pageSequence: false
  });

  const [fieldSettings, setFieldSettings] = useState({
    proposalNo: true,
    customerName: true,
    kwRequired: true,
    residentialCommercial: true,
    city: true,
    preparedBy: true,
    date: true,
    validUpto: true,
    quoteType: true,
    productImage: true,
    totalCost: true,
    govtMnreSubsidy: true,
    govtStateSubsidy: true,
    additionalCharges: true,
    finalTotal: true,
    kitType: true,
    paymentMode: true,
    generationSummary: true
  });
  const [pageConfigs, setPageConfigs] = useState({});
  const [isPageModalOpen, setIsPageModalOpen] = useState(false);
  const [activeEditingPage, setActiveEditingPage] = useState(null);
  const [tempPageConfig, setTempPageConfig] = useState({
    header: '',
    footer: '',
    media: '',
    content: ''
  });

  const defaultFrontPageSettings = {
    header: {
      showLogo: true, showName: true, showTagline: true,
      showContact: true, showEmail: true, showWebsite: true,
      showAddress: true, logoUrl: '', alignment: 'Left',
      bgColor: '#ffffff', textColor: '#000000'
    },
    banner: {
      imageUrl: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
      overlayOpacity: 0.4, textColor: '#ffffff'
    },
    contentVisibility: {
      proposalTitle: true, customTitle: '', customerName: true,
      proposalNo: true, quoteDate: true, validUpto: true,
      city: true, systemSize: true, categoryType: true, partnerName: true
    },
    customText: {
      welcomeMsg: '', introDesc: '', promoText: '', notes: ''
    },
    footer: {
      showFooterLogo: true, showName: true, showAddress: true,
      showMobile: true, showEmail: true, showWebsite: true,
      showGst: true, showSocials: true, showCopyright: true,
      showPageNo: true, noteText: '', copyrightText: '© 2025 SolarKits ERP. All rights reserved.',
      bgColor: '#f8f9fa', textColor: '#6c757d', alignment: 'Center',
      layout: 'Center Align'
    },
    styling: {
      themeColor: '#2563eb', fontFamily: 'Inter', fontSize: '14px',
      bgColor: '#ffffff', spacing: '20px', alignment: 'Center'
    }
  };

  const [pricingData, setPricingData] = useState({
    totalCost: 195008,
    mnreSubsidy: 78000,
    stateSubsidy: 0,
    additionalCharges: 0,
    netCost: 117008
  });

  const [frontPageSettings, setFrontPageSettings] = useState(defaultFrontPageSettings);
  const [isFrontPageModalOpen, setIsFrontPageModalOpen] = useState(false);

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
  const logoInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const defaultPages = [
    { id: 'f1', label: 'Front Page', value: 'Front Page', description: 'Cover page with branding and customer details' },
    { id: 'f2', label: 'Commercial Page', value: 'Commercial Page', description: 'Pricing, payment and commercial details' },
    { id: 'f3', label: 'Generation Graph', value: 'Generation Graph', description: 'Energy generation chart page' },
    { id: 'f4', label: 'Add ons Settings', value: 'Advanced Settings', description: 'Extra accessories and feature list' },
    { id: 'f5', label: 'BOM Survey Summary', value: 'Financial Summary', description: 'Technical bill of materials and summary' }
  ];

  const [pagesOptions, setPagesOptions] = useState(() => {
    const savedCustomPages = localStorage.getItem('customQuotePages');
    if (savedCustomPages) {
      try {
        const parsed = JSON.parse(savedCustomPages);
        return [...defaultPages, ...parsed];
      } catch (e) {
        return defaultPages;
      }
    }
    return defaultPages;
  });
  const [newPageName, setNewPageName] = useState('');

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [projectTypes, setProjectTypes] = useState([]);
  const [subProjectTypes, setSubProjectTypes] = useState([]);
  const [partnerTypes, setPartnerTypes] = useState([]);
  const [planTypes, setPlanTypes] = useState([]);

  const [allSubCategories, setAllSubCategories] = useState([]);
  const [allSubProjectTypes, setAllSubProjectTypes] = useState([]);
  const [mappingsList, setMappingsList] = useState([]);
  const [activeTab, setActiveTab] = useState('Header');

  const quoteTypes = ['Survey Quote', 'Quick Quote'];

  useEffect(() => {
    fetchQuotes();
    fetchDynamicFilters();
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setPagesOptions((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        
        // Update localStorage for custom discovery too
        const customOnly = newOrder.filter(opt => !defaultPages.some(d => d.value === opt.value));
        localStorage.setItem('customQuotePages', JSON.stringify(customOnly));
        
        return newOrder;
      });
    }
  };

  const SortablePageCard = ({ page, selectedPages, setSelectedPages, quoteType, setActiveEditingPage, setTempPageConfig, setIsPageModalOpen, pageConfigs }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging
    } = useSortable({ id: page.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      zIndex: isDragging ? 10 : 1,
    };

    const isSelected = selectedPages.includes(page.value);
    const isDisabled = page.value === 'Financial Summary' && quoteType === 'Quick Quote';

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`relative group bg-white border-2 rounded-2xl p-4 transition-all duration-300 flex items-start gap-4 cursor-pointer mb-3 ${isSelected ? 'border-blue-600 bg-blue-50/30' : 'border-gray-100 hover:border-blue-200'} ${isDisabled ? 'opacity-50 grayscale pointer-events-none' : ''} ${isDragging ? 'shadow-2xl scale-[1.02] border-blue-400' : 'shadow-sm'}`}
        onClick={() => {
          if (!isDisabled) {
            if (isSelected) {
              setSelectedPages(selectedPages.filter(p => p !== page.value));
            } else {
              setSelectedPages([...selectedPages, page.value]);
            }
          }
        }}
      >
        <div 
          {...attributes} 
          {...listeners}
          className="mt-1 cursor-grab active:cursor-grabbing text-gray-300 hover:text-blue-400 transition-colors p-1"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={20} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h5 className={`text-sm font-black uppercase tracking-tight ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}>
              {page.label}
            </h5>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-200 bg-white'}`}>
              {isSelected && <CheckCircle size={12} className="text-white" />}
            </div>
          </div>
          <p className="text-[10px] font-bold text-gray-400 leading-relaxed mb-3">
            {page.description || 'Custom configured page content'}
          </p>
          
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (page.value === 'Front Page') {
                  setIsFrontPageModalOpen(true);
                } else {
                  setActiveEditingPage(page);
                  setTempPageConfig(pageConfigs[page.value] || { header: '', footer: '', media: '', content: '' });
                  setIsPageModalOpen(true);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${isSelected ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' : 'bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-500'}`}
            >
              <Settings size={12} />
              Settings
            </button>
            {isSelected && (
              <span className="text-[8px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1">
                <FileText size={10} />
                Selected
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const fetchDynamicFilters = async () => {
    try {
      const results = await Promise.allSettled([
        productApi.getCategories(),
        productApi.getSubCategories(),
        productApi.getProjectTypes(),
        productApi.getSubProjectTypes(),
        productApi.getProjectCategoryMappings(),
        salesSettingsService.getPartnerTypes()
      ]);

      const safeExtract = (result) => {
        if (result.status !== 'fulfilled') return [];
        const val = result.value;
        if (Array.isArray(val)) return val;
        if (val && Array.isArray(val.data)) return val.data;
        if (val && val.data && Array.isArray(val.data.data)) return val.data.data;
        return [];
      };

      const cats = safeExtract(results[0]);
      const subCats = safeExtract(results[1]);
      const pTypes = safeExtract(results[2]);
      const subPTypes = safeExtract(results[3]);
      const mappings = safeExtract(results[4]);
      const partTypes = safeExtract(results[5]);

      setCategories(cats);
      setAllSubCategories(subCats);
      setAllSubProjectTypes(subPTypes);
      setMappingsList(mappings);
      setPartnerTypes(partTypes);

      // Merge project types from mappings and master project types
      const allProjectOptions = [
        ...new Set([
          ...mappings.map(m => `${m.projectTypeFrom} to ${m.projectTypeTo} kW`),
          ...pTypes.map(p => p.name || p)
        ])
      ];
      setProjectTypes(allProjectOptions.filter(Boolean));

    } catch (error) {
      console.error("Error fetching dynamic filters:", error);
    }
  };

  const {
    countries, states, clusters, districts,
    selectedCountry, setSelectedCountry,
    selectedState, setSelectedState,
    selectedCluster, setSelectedCluster,
    selectedDistrict, setSelectedDistrict,
    fetchStates, fetchClusters, fetchDistricts
  } = useLocations();

  // Filter Sub Categories when Category changes
  useEffect(() => {
    if (filters.category) {
      const selectedCatObj = categories.find(c => c.name === filters.category || c._id === filters.category);
      if (selectedCatObj) {
        const filtered = allSubCategories.filter(sc =>
          sc.categoryId === selectedCatObj._id ||
          sc.categoryId?._id === selectedCatObj._id ||
          sc.categoryId?.name === selectedCatObj.name
        );
        const uniqueSubs = [...new Set(filtered.map(s => s.name || s))];
        setSubcategories(uniqueSubs);
      } else {
        setSubcategories([]);
      }
    }
  }, [filters.category, categories, allSubCategories]);

  // Filter Sub Project Types when Project Type changes
  useEffect(() => {
    const uniqueSubPTypes = [...new Set(allSubProjectTypes.map(s => s.name || s))];
    setSubProjectTypes(uniqueSubPTypes);
    
    // Trigger pricing fetch only when core filters are set
    if (filters.category && filters.projectType && !editingId) {
        fetchPricing();
    }
  }, [filters.category, filters.projectType, allSubProjectTypes]); // Removed subCategory to prevent double-firing

  const fetchPricing = async () => {
    try {
        const response = await productApi.getProductPrices({
            category: filters.category,
            subCategory: filters.subCategory,
            projectType: filters.projectType
        });
        
        const data = response.data;
        if (data && data.length > 0) {
            const price = data[0]; // Take first match
            const total = price.basePrice || 0;
            const mnre = price.mnreSubsidy || 0;
            const state = price.stateSubsidy || 0;
            const add = price.additionalCharges || 0;
            
            setPricingData({
                totalCost: total,
                mnreSubsidy: mnre,
                stateSubsidy: state,
                additionalCharges: add,
                netCost: total - mnre - state + add
            });
        } else {
            // Fallback to zeros or defaults if no mapping found
            setPricingData({
                totalCost: 195008, 
                mnreSubsidy: 78000,
                stateSubsidy: 0,
                additionalCharges: 0,
                netCost: 117008
            });
        }
    } catch (error) {
        console.error("Error fetching dynamic pricing:", error);
    }
  };

  // Filter Plan Types when Partner Type changes
  useEffect(() => {
    const fetchPlans = async () => {
      if (partnerType) {
        try {
          const plans = await salesSettingsService.getPartnerPlans({ partnerType });
          const uniquePlans = [...new Set(plans.map(p => p.planName || p.name || p))];
          setPlanTypes(uniquePlans);
        } catch (err) {
          console.error("Error fetching partner plans:", err);
          setPlanTypes(['Startup', 'Basic', 'Enterprise', 'Solar Business']); // Fallback
        }
      } else {
        setPlanTypes([]);
      }
    };
    fetchPlans();
  }, [partnerType]);

  const fetchQuotes = async () => {
    try {
      const data = await getQuoteSettings();
      setQuotes(data);
    } catch (error) {
      console.error("Error fetching quotes:", error);
      toast.error("Failed to load quote settings");
    }
  };

  const getQuoteCount = (type, id) => {
    if (!id || id === 'all') return quotes.length;
    return quotes.filter(q => {
        const target = q[type];
        if (!target) return false;
        const targetId = target._id || target;
        return targetId === id;
    }).length;
  };
  useEffect(() => {
    if (quotes.length > 0) {
      const allSavedPages = quotes.reduce((acc, quote) => {
        return [...acc, ...(quote.selectedPages || [])];
      }, []);

      const uniqueSavedPages = Array.from(new Set(allSavedPages));

      setPagesOptions(prev => {
        const existingValues = new Set(prev.map(p => p.value));
        const newOptions = [...prev];
        let changed = false;

        uniqueSavedPages.forEach(pageVal => {
          if (!existingValues.has(pageVal)) {
            newOptions.push({
              id: `f${newOptions.length + 1}`,
              label: pageVal,
              value: pageVal
            });
            changed = true;
          }
        });

        if (changed) {
          // Update localStorage with these "discovered" pages too if they are custom
          const customOnly = newOptions.filter(opt => !defaultPages.some(d => d.value === opt.value));
          localStorage.setItem('customQuotePages', JSON.stringify(customOnly));
          return newOptions;
        }
        return prev;
      });
    }
  }, [quotes]);

  // Removed automatic calculation to prevent industrial auto-refresh behavior
  // Generation is now manually triggered via the Calculate button

  useEffect(() => {
    if (selectedPages.includes('Generation Graph')) {
      // Delay chart initialization to ensure DOM is ready
      setTimeout(initializeCharts, 100);
    }
  }, [selectedPages]); // Removed monthlyIsolation to prevent auto-refresh on typing


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
    // Also update charts manually only when requested
    setTimeout(initializeCharts, 100);
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
      country: selectedCountry,
      state: selectedState,
      cluster: selectedCluster,
      district: selectedDistrict,
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
      colorSettings,
      fieldSettings,
      kitType,
      paymentMode,
      pageConfigs,
      frontPageSettings
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

  const handleAddPage = () => {
    if (!newPageName.trim()) {
      toast.error("Please enter a page name");
      return;
    }
    const newId = `f${pagesOptions.length + 1}`;
    const newPage = { id: newId, label: newPageName, value: newPageName };
    const updatedOptions = [...pagesOptions, newPage];
    setPagesOptions(updatedOptions);

    // Save custom pages to localStorage
    const customPages = updatedOptions.filter(opt => !defaultPages.some(d => d.value === opt.value));
    localStorage.setItem('customQuotePages', JSON.stringify(customPages));

    setNewPageName('');
    toast.success(`Page "${newPageName}" added`);
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
    setFieldSettings({
      proposalNo: true,
      customerName: true,
      kwRequired: true,
      residentialCommercial: true,
      city: true,
      preparedBy: true,
      date: true,
      validUpto: true,
      quoteType: true,
      productImage: true,
      totalCost: true,
      govtMnreSubsidy: true,
      govtStateSubsidy: true,
      additionalCharges: true,
      finalTotal: true,
      kitType: true,
      paymentMode: true,
      generationSummary: true
    });
    setKitType('Combo Kit');
    setPaymentMode('Cash');
    setPageConfigs({});
    setFrontPageSettings(defaultFrontPageSettings);
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

  const handleEditQuote = async (quote) => {
    setEditingId(quote._id);

    // Set Locations first to trigger cascading fetches
    setSelectedCountry(quote.country?._id || quote.country || '');
    // We need to wait a bit for states/clusters/districts to load or manually trigger them
    // But since setSelectedState triggers useEffect in useLocations, we should set them with a slight delay or directly if data is available
    // Better yet, useLocations should handle it if we pass values, but it resets them on parent change.
    // So we need to manually fetch them to ensure they are available for selection.

    try {
      if (quote.country) await fetchStates({ countryId: quote.country._id || quote.country });
      setSelectedState(quote.state?._id || quote.state || '');

      if (quote.state) await fetchClusters(quote.state._id || quote.state);
      setSelectedCluster(quote.cluster?._id || quote.cluster || '');

      if (quote.cluster) await fetchDistricts(quote.cluster._id || quote.cluster);
      setSelectedDistrict(quote.district?._id || quote.district || '');
    } catch (err) {
      console.error("Error loading location hierarchy for edit:", err);
    }

    setFilters({
      category: quote.category,
      subCategory: quote.subCategory, // Note casing: subCategory in DB
      projectType: quote.projectType,
      subProjectType: quote.subProjectType
    });
    setQuoteType(quote.quoteType);
    setPartnerType(quote.partnerType || '');
    setPlanType(quote.planType || '');
    const savedPages = quote.selectedPages || [];
    setSelectedPages(savedPages);

    // Add any pages from the saved quote that aren't in current options
    setPagesOptions(prev => {
      const existingValues = new Set(prev.map(p => p.value));
      const newOptions = [...prev];
      let added = false;
      savedPages.forEach(pageVal => {
        if (!existingValues.has(pageVal)) {
          newOptions.push({
            id: `f${newOptions.length + 1}`,
            label: pageVal,
            value: pageVal
          });
          added = true;
        }
      });
      return added ? newOptions : prev;
    });

    if (quote.solarSettings) {
      setSolarSettings(quote.solarSettings);
    }
    if (quote.monthlyIsolation && quote.monthlyIsolation.length > 0) {
      setMonthlyIsolation(quote.monthlyIsolation);
    }
    if (quote.colorSettings) {
      setColorSettings(quote.colorSettings);
    }
    if (quote.fieldSettings) {
      setFieldSettings(quote.fieldSettings);
    } else {
      // Fallback for old quotes
      setFieldSettings({
        proposalNo: true, customerName: true, kwRequired: true,
        residentialCommercial: true, city: true, preparedBy: true,
        date: true, validUpto: true, quoteType: true,
        productImage: true, totalCost: true, govtMnreSubsidy: true,
        govtStateSubsidy: true, additionalCharges: true, finalTotal: true,
        kitType: true, paymentMode: true, generationSummary: true
      });
    }

    if (quote.kitType) setKitType(quote.kitType);
    if (quote.paymentMode) setPaymentMode(quote.paymentMode);
    if (quote.pageConfigs) setPageConfigs(quote.pageConfigs);
    if (quote.frontPageSettings) setFrontPageSettings(quote.frontPageSettings);

    // Scroll top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Logo file size should be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFrontPageSettings(prev => ({
          ...prev,
          header: { ...prev.header, logoUrl: reader.result }
        }));
        toast.success("Logo uploaded!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Banner file size should be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFrontPageSettings(prev => ({
          ...prev,
          banner: { ...prev.banner, imageUrl: reader.result }
        }));
        toast.success("Banner uploaded!");
      };
      reader.readAsDataURL(file);
    }
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
  const isLocationSelected = selectedCountry && selectedState && selectedCluster && selectedDistrict;

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <nav className="bg-white rounded-lg shadow-sm p-4">
          <h1 className="text-2xl font-bold text-gray-800">Quote Settings</h1>
        </nav>
      </div>

      {/* Location Selection Module */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-700 to-blue-600 text-white px-6 py-4 font-bold flex items-center gap-2">
          <MapPin size={20} />
          <span>Location Selection</span>
        </div>
        <div className="p-8 space-y-10">

          {/* Country Selection */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-tight">Select Country</h3>
              <button className="text-[10px] font-bold text-blue-600 hover:underline uppercase tracking-widest">Select All</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[{ _id: 'all', name: 'All Countries', code: 'ALL' }, ...countries].map((c, idx) => (
                <button
                  key={c._id || idx}
                  onClick={() => setSelectedCountry(c._id)}
                  className={`relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-300 ${selectedCountry === c._id ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-100/50' : 'border-gray-100 bg-white hover:border-blue-200'}`}
                >
                  {getQuoteCount('country', c._id) > 0 && (
                      <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[9px] font-black px-2 py-1 rounded-full shadow-md z-10">
                          {getQuoteCount('country', c._id)} CFG
                      </span>
                  )}
                  <span className={`text-sm font-bold ${selectedCountry === c._id ? 'text-blue-700' : 'text-gray-700'}`}>{c.name}</span>
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">{c.code || (c._id === 'all' ? 'ALL' : 'IN')}</span>
                </button>
              ))}
            </div>
          </section>

          {/* State Selection */}
          {selectedCountry && (
            <section className="animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex justify-between items-center mb-4 pt-4 border-t border-gray-100">
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-tight">Select State</h3>
                <button className="text-[10px] font-bold text-blue-600 hover:underline uppercase tracking-widest">Select All</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {[{ _id: 'all', name: 'All States', code: 'ALL' }, ...states].map((s, idx) => (
                  <button
                    key={s._id || idx}
                    onClick={() => setSelectedState(s._id)}
                    className={`relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-300 ${selectedState === s._id ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-100/50' : 'border-gray-100 bg-white hover:border-blue-200'}`}
                  >
                    {getQuoteCount('state', s._id) > 0 && (
                        <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[9px] font-black px-2 py-1 rounded-full shadow-md z-10">
                            {getQuoteCount('state', s._id)} CFG
                        </span>
                    )}
                    <span className={`text-sm font-bold ${selectedState === s._id ? 'text-blue-700' : 'text-gray-700'}`}>{s.name}</span>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">{s.code || (s._id === 'all' ? 'ALL' : (s.name ? s.name.substring(0, 2).toUpperCase() : 'ST'))}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Cluster Selection */}
          {selectedState && (
            <section className="animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex justify-between items-center mb-4 pt-4 border-t border-gray-100">
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-tight">Select Cluster</h3>
                <button className="text-[10px] font-bold text-blue-600 hover:underline uppercase tracking-widest">Select All</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {[{ _id: 'all', name: 'All Clusters', code: 'ALL' }, ...clusters].map((cl, idx) => (
                  <button
                    key={cl._id || idx}
                    onClick={() => setSelectedCluster(cl._id)}
                    className={`relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-300 ${selectedCluster === cl._id ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-100/50' : 'border-gray-100 bg-white hover:border-blue-200'}`}
                  >
                    {getQuoteCount('cluster', cl._id) > 0 && (
                        <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[9px] font-black px-2 py-1 rounded-full shadow-md z-10">
                            {getQuoteCount('cluster', cl._id)} CFG
                        </span>
                    )}
                    <span className={`text-sm font-bold ${selectedCluster === cl._id ? 'text-blue-700' : 'text-gray-700'}`}>{cl.name}</span>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">{cl.code || (cl._id === 'all' ? 'ALL' : 'GU')}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* District Selection */}
          {selectedCluster && (
            <section className="animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex justify-between items-center mb-4 pt-4 border-t border-gray-100">
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-tight">Select District</h3>
                <button className="text-[10px] font-bold text-blue-600 hover:underline uppercase tracking-widest">Select All</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {[{ _id: 'all', name: 'All Districts', code: 'ALL' }, ...districts].map((d, idx) => (
                  <button
                    key={d._id || idx}
                    onClick={() => setSelectedDistrict(d._id)}
                    className={`relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-300 ${selectedDistrict === d._id ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-100/50' : 'border-gray-100 bg-white hover:border-blue-200'}`}
                  >
                    {getQuoteCount('district', d._id) > 0 && (
                        <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[9px] font-black px-2 py-1 rounded-full shadow-md z-10">
                            {getQuoteCount('district', d._id)} CFG
                        </span>
                    )}
                    <span className={`text-sm font-bold ${selectedDistrict === d._id ? 'text-blue-700' : 'text-gray-700'}`}>{d.name}</span>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">{d.code || (d._id === 'all' ? 'ALL' : (selectedCluster === 'all' ? 'GU' : clusters.find(c => c._id === selectedCluster)?.name || 'DISTRICT'))}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {!isLocationSelected && (
            <div className="flex items-center gap-3 text-amber-600 bg-amber-50/50 p-4 rounded-2xl border-2 border-dashed border-amber-200 text-sm font-bold animate-pulse justify-center">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              PLEASE SELECT LOCATION TO UNLOCK QUOTE SETTINGS
            </div>
          )}
        </div>
      </div>

      {!isLocationSelected ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center flex flex-col items-center justify-center gap-4 opacity-50 grayscale">
          <div className="p-6 bg-gray-50 rounded-full ring-8 ring-gray-50/50">
            <MapPin size={48} className="text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-400">Quote Settings Locked</h2>
          <p className="text-gray-400 max-w-xs leading-relaxed font-medium">Please complete the location selection above to unlock and configure quote settings for a specific region.</p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Left Column - Settings */}
          <div className="lg:w-7/12">
            {/* Settings Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg font-bold flex justify-between items-center">
                <div className="flex flex-col">
                    <span className="text-xs font-black uppercase tracking-widest opacity-80">{editingId ? 'Updating' : 'Targeting Configuration'}</span>
                    <h4 className="text-lg font-bold">
                        {states.find(s => s._id === selectedState)?.name || '-'} / {clusters.find(c => c._id === selectedCluster)?.name || '-'} / {districts.find(d => d._id === selectedDistrict)?.name || '-'}
                    </h4>
                </div>
                {editingId && (
                  <button onClick={() => { setEditingId(null); resetForm(); }} className="text-[10px] bg-white text-blue-600 px-3 py-1.5 rounded-xl font-black uppercase shadow-sm active:scale-95 transition-all">
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
                        <option key={cat._id || cat.name} value={cat.name}>{cat.name}</option>
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
                      {projectTypes.map((type, idx) => (
                        <option key={idx} value={type}>{type}</option>
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
                      {subProjectTypes.map((sub, idx) => (
                        <option key={idx} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Selections Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 items-stretch">
                  {/* Quote Type */}
                  <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 flex flex-col">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 text-center">Quote Type</label>
                    <div className="grid grid-cols-2 gap-2 flex-1">
                      {quoteTypes.map(type => (
                        <button
                          key={type}
                          className={`flex flex-col items-center justify-center gap-1.5 px-2 py-3 rounded-xl border-2 transition-all duration-200 text-[10px] font-bold shadow-sm ${quoteType === type ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-100 text-gray-600 hover:border-blue-200'}`}
                          onClick={() => setQuoteType(type)}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Kit Type */}
                  <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 flex flex-col">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 text-center">Solution Type</label>
                    <div className="grid grid-cols-2 gap-2 flex-1">
                      {['Combo Kit', 'Customised Kit'].map(type => (
                        <button
                          key={type}
                          className={`flex flex-col items-center justify-center gap-1.5 px-2 py-3 rounded-xl border-2 transition-all duration-200 text-[10px] font-bold shadow-sm ${kitType === type ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-gray-100 text-gray-600 hover:border-indigo-200'}`}
                          onClick={() => setKitType(type)}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Finance Mode */}
                  <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 flex flex-col">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 text-center">Finance Mode</label>
                    <div className="grid grid-cols-3 gap-2 flex-1">
                      {['Cash', 'Loan', 'EMI'].map(type => (
                        <button
                          key={type}
                          className={`flex flex-col items-center justify-center gap-1.5 px-1 py-3 rounded-xl border-2 transition-all duration-200 text-[10px] font-bold shadow-sm ${paymentMode === type ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-gray-100 text-gray-600 hover:border-emerald-200'}`}
                          onClick={() => setPaymentMode(type)}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Partner Type */}
                  <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 flex flex-col">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 text-center">Partner Type</label>
                    <div className="flex-1 flex flex-col justify-center">
                      <select
                        className="w-full bg-white border-2 border-gray-100 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 font-bold text-gray-700 shadow-sm text-xs"
                        value={partnerType}
                        onChange={(e) => setPartnerType(e.target.value)}
                      >
                        <option value="" disabled>Select Partner</option>
                        {partnerTypes.map(type => (
                          <option key={type._id || type.name || type} value={type.name || type}>{type.name || type}</option>
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
                    {planTypes.map((type, idx) => (
                      <button
                        key={idx}
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

                {/* Pages Selection Redesign */}
                <div className="mb-10">
                  <div className="flex flex-col mb-6">
                    <h5 className="text-lg font-black text-gray-800 uppercase tracking-tighter flex items-center gap-2">
                       <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                       Prepare Quote Pages
                    </h5>
                    <p className="text-xs font-bold text-gray-400 ml-3.5">
                      Select which pages you want to include in the final quote PDF.
                    </p>
                  </div>

                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={pagesOptions.map(p => p.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pagesOptions.map(page => (
                          <SortablePageCard
                            key={page.id}
                            page={page}
                            selectedPages={selectedPages}
                            setSelectedPages={setSelectedPages}
                            quoteType={quoteType}
                            setActiveEditingPage={setActiveEditingPage}
                            setTempPageConfig={setTempPageConfig}
                            setIsPageModalOpen={setIsPageModalOpen}
                            pageConfigs={pageConfigs}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>

                  {/* Add Page Input */}
                  <div className="flex gap-2 items-center bg-blue-50/30 p-4 rounded-2xl border-2 border-dashed border-blue-100 mt-6 group hover:border-blue-300 transition-all">
                    <div className="flex-1 relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 group-hover:scale-110 transition-transform">
                        <FileText size={18} />
                      </div>
                      <input
                        type="text"
                        placeholder="Add dynamic custom page name..."
                        className="w-full bg-white border border-blue-100 rounded-xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all font-bold text-gray-700 shadow-sm"
                        value={newPageName}
                        onChange={(e) => setNewPageName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddPage()}
                      />
                    </div>
                    <button
                      onClick={handleAddPage}
                      className="bg-blue-600 text-white h-[50px] px-6 rounded-xl text-xs font-black hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-200 active:scale-95 uppercase tracking-wider"
                    >
                      <span>Add Page</span>
                    </button>
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

                {/* Quote Field Settings Section */}
                <div className="bg-white border-2 border-dashed border-blue-100 rounded-2xl p-6 mb-8">
                  <div className="flex justify-between items-center mb-6">
                    <label className="text-sm font-black text-blue-700 flex items-center gap-2 uppercase tracking-wider">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                      Quote Field Management
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const allTrue = {};
                          Object.keys(fieldSettings).forEach(k => allTrue[k] = true);
                          setFieldSettings(allTrue);
                        }}
                        className="text-[10px] font-bold text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors uppercase"
                      >
                        Select All
                      </button>
                      <button
                        onClick={() => {
                          const allFalse = {};
                          Object.keys(fieldSettings).forEach(k => allFalse[k] = false);
                          setFieldSettings(allFalse);
                        }}
                        className="text-[10px] font-bold text-gray-400 hover:bg-gray-50 px-2 py-1 rounded transition-colors uppercase"
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
                    {[
                      { key: 'proposalNo', label: 'Proposal No' },
                      { key: 'customerName', label: 'Customer Name' },
                      { key: 'kwRequired', label: 'KW Required' },
                      { key: 'residentialCommercial', label: 'Residential / Commercial' },
                      { key: 'city', label: 'City' },
                      { key: 'preparedBy', label: 'Prepared By' },
                      { key: 'date', label: 'Date' },
                      { key: 'validUpto', label: 'Valid Upto' },
                      { key: 'quoteType', label: 'Quote Type' },
                      { key: 'productImage', label: 'Product Image' },
                      { key: 'totalCost', label: 'Total Cost' },
                      { key: 'govtMnreSubsidy', label: 'Govt MNRE Subsidy' },
                      { key: 'govtStateSubsidy', label: 'Govt State Subsidy' },
                      { key: 'additionalCharges', label: 'Additional Charges' },
                      { key: 'finalTotal', label: 'Final Total' },
                      { key: 'kitType', label: 'Solution Type' },
                      { key: 'paymentMode', label: 'Finance Mode' },
                      { key: 'generationSummary', label: 'Power Generation' }
                    ].map((field) => (
                      <label key={field.key} className="flex items-center group cursor-pointer">
                        <div className="relative flex items-center">
                          <input
                            type="checkbox"
                            className="peer h-5 w-5 opacity-0 absolute cursor-pointer"
                            checked={fieldSettings[field.key]}
                            onChange={(e) => setFieldSettings({ ...fieldSettings, [field.key]: e.target.checked })}
                          />
                          <div className={`h-5 w-5 border-2 rounded-md flex items-center justify-center transition-all duration-200 ${fieldSettings[field.key] ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300 group-hover:border-blue-400'}`}>
                            {fieldSettings[field.key] && <CheckCircle size={12} className="text-white" />}
                          </div>
                        </div>
                        <span className={`ml-3 text-xs font-bold transition-colors ${fieldSettings[field.key] ? 'text-gray-800' : 'text-gray-400 group-hover:text-gray-600'}`}>
                          {field.label}
                        </span>
                      </label>
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
                        <th className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700">Location</th>
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
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">
                                {quote.state?.name || (states.find(s => s._id === (quote.state?._id || quote.state))?.name) || '-'}
                              </span>
                              <span className="text-[10px] font-bold text-gray-600">
                                {quote.district?.name || (districts.find(d => d._id === (quote.district?._id || quote.district))?.name) || '-'}
                              </span>
                            </div>
                          </td>
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
                        src={pageConfigs['Front Page']?.media || "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"}
                        alt="Solar Roof"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col items-center justify-center text-center px-6">
                        <h2 className="text-3xl font-black text-white mb-1 uppercase tracking-tighter drop-shadow-lg">
                          {pageConfigs['Front Page']?.header || `${filters.category || 'Residential'} ${filters.projectType || '3 To 10 KW'}`}
                        </h2>
                        <h3 className="text-2xl font-black text-yellow-400 mb-2 uppercase tracking-wide drop-shadow-md">
                          ({filters.subProjectType || 'National Portal'})
                        </h3>
                        <h4 className="text-4xl font-extrabold text-white mb-2 tracking-[0.2em]">PROPOSAL</h4>
                        <p className="text-xs font-bold text-gray-200 tracking-widest uppercase border-t border-gray-400/50 pt-2 transition-all duration-300 hover:text-white">
                          {pageConfigs['Front Page']?.footer || 'SOLAR ENERGY FOR A BETTER TOMORROW'}
                        </p>
                      </div>
                    </div>

                    {/* Customer Info Section */}
                    <div className="p-8 bg-white">
                      <div className="flex flex-col gap-3">
                        {fieldSettings.proposalNo && (
                          <div className="flex items-baseline gap-2 pb-2 border-b border-gray-50">
                            <span className="text-sm font-black text-gray-800 uppercase min-w-[150px]">Proposal No:</span>
                            <span className="text-sm font-bold text-blue-600">
                              # QUA/{filters.category ? filters.category.substring(0, 3).toUpperCase() : 'PRD'}/
                              {filters.subCategory ? filters.subCategory.substring(0, 3).toUpperCase() : 'SUB'}/
                              {states.find(s => s._id === selectedState)?.code || 'ST'}/
                              {districts.find(d => d._id === selectedDistrict)?.code || (districts.find(d => d._id === selectedDistrict)?.name?.substring(0, 3).toUpperCase()) || 'DST'}/
                              {(new Date().getFullYear()).toString().slice(-2)}/
                              {(quotes.filter(q => (q.state?._id || q.state) === selectedState && (q.district?._id || q.district) === selectedDistrict).length + 1).toString().padStart(3, '0')}
                            </span>
                          </div>
                        )}
                        {fieldSettings.customerName && (
                          <div className="flex items-baseline gap-2 pb-2 border-b border-gray-50">
                            <span className="text-sm font-black text-gray-800 uppercase min-w-[150px]">Name of Customer:</span>
                            <span className="text-sm font-bold text-gray-600">Pradip Sharma</span>
                          </div>
                        )}
                        {fieldSettings.kwRequired && (
                          <div className="flex items-baseline gap-2 pb-2 border-b border-gray-50">
                            <span className="text-sm font-black text-gray-800 uppercase min-w-[150px]">KW Required:</span>
                            <span className="text-sm font-bold text-gray-600">{solarSettings.projectKW} KW</span>
                          </div>
                        )}
                        {fieldSettings.quoteType && (
                          <div className="flex items-baseline gap-2 pb-2 border-b border-gray-50">
                            <span className="text-sm font-black text-gray-800 uppercase min-w-[150px]">Quote Type:</span>
                            <span className="text-sm font-bold text-gray-600">{quoteType || 'Survey Quote'}</span>
                          </div>
                        )}
                        {fieldSettings.kitType && (
                          <div className="flex items-baseline gap-2 pb-2 border-b border-gray-50">
                            <span className="text-sm font-black text-gray-800 uppercase min-w-[150px]">Solution Type:</span>
                            <span className="text-sm font-bold text-gray-600">{kitType}</span>
                          </div>
                        )}
                        {fieldSettings.paymentMode && (
                          <div className="flex items-baseline gap-2 pb-2 border-b border-gray-50">
                            <span className="text-sm font-black text-gray-800 uppercase min-w-[150px]">Finance Mode:</span>
                            <span className="text-sm font-bold text-emerald-600">{paymentMode}</span>
                          </div>
                        )}
                        {fieldSettings.residentialCommercial && (
                          <div className="flex items-baseline gap-2 pb-2 border-b border-gray-50">
                            <span className="text-sm font-black text-gray-800 uppercase min-w-[150px]">Residential / Commercial:</span>
                            <span className="text-sm font-bold text-gray-600">{filters.category} {filters.projectType}</span>
                          </div>
                        )}
                        {fieldSettings.city && (
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm font-black text-gray-800 uppercase min-w-[150px]">City:</span>
                            <span className="text-sm font-bold text-gray-600">
                              {selectedDistrict === 'all'
                                ? 'All Districts'
                                : districts.find(d => d._id === selectedDistrict)?.name || 'No Location Selected'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer Stats Section */}
                    <div className="grid grid-cols-2 border-t border-gray-100 bg-gray-50/50">
                      {fieldSettings.preparedBy && (
                        <div className="p-6 border-r border-gray-100">
                          <div className="flex flex-col gap-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Prepared by</p>
                            <p className="text-sm font-bold text-gray-700 uppercase">{partnerType || 'Demo'} User</p>
                          </div>
                        </div>
                      )}
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          {fieldSettings.date && (
                            <div className="flex flex-col gap-1">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</p>
                              <p className="text-sm font-bold text-gray-700 uppercase">
                                {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </p>
                            </div>
                          )}
                          {fieldSettings.validUpto && (
                            <div className="flex flex-col gap-1">
                              <p className="text-[10px] font-black text-red-400 uppercase tracking-widest text-right">Valid Upto</p>
                              <p className="text-sm font-bold text-red-600 text-right">10 Days</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                    {fieldSettings.productImage && (
                      <div className="text-center">
                        <p className="font-bold mb-2">Project: {filters.projectType}</p>
                        <img
                          src="https://placehold.co/300x200"
                          alt="Combo Kit"
                          className="w-full h-auto rounded-lg"
                        />
                      </div>
                    )}

                    <div className={fieldSettings.productImage ? '' : 'md:col-span-2'}>
                      <table className="w-full border border-gray-300">
                        <tbody>
                          {fieldSettings.totalCost && (
                            <tr className="border-b border-gray-300">
                              <td className="p-2">Total Cost</td>
                              <td className="p-2 font-medium">Rs. {pricingData.totalCost.toLocaleString()} /-</td>
                            </tr>
                          )}
                          {fieldSettings.govtMnreSubsidy && (
                            <tr className="border-b border-gray-300">
                              <td className="p-2">Govt MNRE Subsidy</td>
                              <td className="p-2 font-medium">Rs. {pricingData.mnreSubsidy.toLocaleString()} /-</td>
                            </tr>
                          )}
                          {fieldSettings.govtStateSubsidy && (
                            <tr className="border-b border-gray-300">
                              <td className="p-2">Govt State Subsidy</td>
                              <td className="p-2 font-medium">Rs. {pricingData.stateSubsidy.toLocaleString()} /-</td>
                            </tr>
                          )}
                          {fieldSettings.additionalCharges && (
                             <tr className="border-b border-gray-300">
                              <td className="p-2">Additional Charges</td>
                              <td className="p-2 font-medium">Rs. {pricingData.additionalCharges.toLocaleString()} /-</td>
                            </tr>
                          )}
                          {fieldSettings.finalTotal && (
                            <tr className="bg-blue-50">
                              <td className="p-2 font-bold text-blue-800">Net Cost</td>
                              <td className="p-2 font-bold text-blue-900 text-lg">Rs. {pricingData.netCost.toLocaleString()} /-</td>
                            </tr>
                          )}
                          {fieldSettings.generationSummary && (
                            <tr className="bg-green-50">
                              <td className="p-2 font-bold text-green-700">Estimated Generation</td>
                              <td className="p-2 font-bold text-green-700">{annualTotal.toLocaleString()} Units / Year</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
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
      )}

      {/* Front Page Settings Modal (Localized State) */}
      <FrontPageSettingsDrawer 
        isOpen={isFrontPageModalOpen}
        onClose={() => setIsFrontPageModalOpen(false)}
        initialSettings={frontPageSettings}
        onSave={(settings) => {
          setFrontPageSettings(settings);
          toast.success("Settings updated!");
        }}
        selectedState={selectedState}
        selectedDistrict={selectedDistrict}
        states={states}
        districts={districts}
        quoteCount={quotes.length}
        solarSettings={solarSettings}
      />



      {/* Professional Page Configuration Modal (Localized State to prevent main refresh) */}
      <PageConfigDrawer 
        isOpen={isPageModalOpen}
        onClose={() => setIsPageModalOpen(false)}
        activePage={activeEditingPage}
        initialConfig={tempPageConfig}
        onSave={(config) => {
          setPageConfigs({ ...pageConfigs, [activeEditingPage.value]: config });
        }}
        quoteType={quoteType}
      />
    </div>
  );
}

// Sub-component for Front Page Settings (Localized state to fix "auto refresh" feel)
const FrontPageSettingsDrawer = ({ isOpen, onClose, initialSettings, onSave, filters, defaultFrontPageSettings, selectedState, selectedDistrict, states, districts, quoteCount, solarSettings }) => {
  const [activeTab, setActiveTab] = useState('Header');
  const [tempSettings, setTempSettings] = useState(initialSettings);
  const logoInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) setTempSettings(initialSettings);
  }, [isOpen, initialSettings]);

  if (!isOpen) return null;

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempSettings(prev => ({
          ...prev,
          header: { ...prev.header, logoUrl: reader.result }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempSettings(prev => ({
          ...prev,
          banner: { ...prev.banner, imageUrl: reader.result }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110] flex items-center justify-center p-4 lg:p-8 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] w-full max-w-[95%] h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-white/20">
        <div className="bg-gradient-to-r from-blue-700 to-blue-500 px-10 py-6 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-white text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
              <Settings className="animate-spin-slow" size={28} />
              Front Page Settings
            </h3>
            <p className="text-blue-100 text-[10px] font-bold uppercase tracking-[0.2em] opacity-80 decoration-0">Customize cover branding and content</p>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-2xl transition-all"><X size={24} /></button>
        </div>
        
        <div className="flex-1 overflow-hidden flex">
          <div className="w-64 bg-gray-50/50 border-r border-gray-100 p-6 flex flex-col gap-2 shrink-0 overflow-y-auto">
            {['Header', 'Banner', 'Visibility', 'Custom Text', 'Footer', 'Design'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full text-left px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-blue-500'}`}
              >
                {tab}
              </button>
            ))}
            <div className="mt-auto space-y-4 pt-10">
               <button onClick={() => setTempSettings(defaultFrontPageSettings)} className="w-full py-3 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 text-[9px] font-black uppercase hover:text-red-500 transition-all">Reset to Default</button>
               <button
                onClick={() => { onSave(tempSettings); onClose(); }}
                className="w-full bg-green-600 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:bg-green-700 transition-all"
               >
                 Save Changes
               </button>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 overflow-y-auto p-10 space-y-12">
              {activeTab === 'Header' && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  <h4 className="text-xl font-black text-gray-800 uppercase">Header Settings</h4>
                  <div className="grid grid-cols-2 gap-6">
                    {[
                      { key: 'showLogo', label: 'Show Company Logo' },
                      { key: 'showName', label: 'Show Company Name' },
                      { key: 'showTagline', label: 'Show Company Tagline' },
                      { key: 'showContact', label: 'Show Contact Number' },
                      { key: 'showEmail', label: 'Show Email Address' },
                      { key: 'showWebsite', label: 'Show Website URL' },
                      { key: 'showAddress', label: 'Show Company Address' }
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                        <span className="text-[10px] font-black text-gray-500 uppercase">{item.label}</span>
                        <input type="checkbox" checked={tempSettings.header[item.key]} onChange={e => setTempSettings({...tempSettings, header: {...tempSettings.header, [item.key]: e.target.checked}})} className="w-5 h-5 accent-blue-600" />
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-10">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Alignment</label>
                      <div className="flex bg-gray-100 p-1 rounded-xl">
                          {['Left', 'Center', 'Right'].map(a => (
                            <button key={a} onClick={() => setTempSettings({...tempSettings, header: {...tempSettings.header, alignment: a}})} className={`flex-1 py-3 text-[9px] font-black uppercase rounded-lg ${tempSettings.header.alignment === a ? 'bg-white text-blue-600' : 'text-gray-400'}`}>{a}</button>
                          ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Logo Upload</label>
                      <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gray-50 border-2 border-dashed flex items-center justify-center rounded-xl overflow-hidden">
                           {tempSettings.header.logoUrl ? <img src={tempSettings.header.logoUrl} className="w-full h-full object-contain p-1" /> : <Settings size={20} className="text-gray-300" />}
                        </div>
                        <button onClick={() => logoInputRef.current.click()} className="flex-1 bg-blue-50 text-blue-600 py-3 rounded-xl text-[9px] font-black uppercase">Upload Logo</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'Banner' && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  <h4 className="text-xl font-black text-gray-800 uppercase">Banner Settings</h4>
                  <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={handleBannerUpload} />
                  <div className="relative h-48 bg-gray-50 rounded-3xl border-2 border-dashed overflow-hidden flex items-center justify-center group">
                     {tempSettings.banner.imageUrl ? (
                       <>
                         <img src={tempSettings.banner.imageUrl} className="w-full h-full object-cover" />
                         <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"><button onClick={() => bannerInputRef.current.click()} className="bg-white text-blue-600 px-6 py-2 rounded-xl text-[10px] font-black uppercase">Change Image</button></div>
                       </>
                     ) : (
                       <button onClick={() => bannerInputRef.current.click()} className="text-gray-400 flex flex-col items-center gap-2"><Upload size={32} /><span className="text-[10px] font-black uppercase">Upload Cover Banner</span></button>
                     )}
                  </div>
                  <div className="grid grid-cols-2 gap-10">
                     <div>
                       <label className="block text-[10px] font-black text-gray-400 uppercase mb-4">Overlay Opacity ({Math.round(tempSettings.banner.overlayOpacity * 100)}%)</label>
                       <input type="range" min="0" max="1" step="0.1" value={tempSettings.banner.overlayOpacity} onChange={e => setTempSettings({...tempSettings, banner: {...tempSettings.banner, overlayOpacity: parseFloat(e.target.value)}})} className="w-full accent-blue-600" />
                     </div>
                     <div>
                       <label className="block text-[10px] font-black text-gray-400 uppercase mb-4">Text Color</label>
                       <input type="color" value={tempSettings.banner.textColor} onChange={e => setTempSettings({...tempSettings, banner: {...tempSettings.banner, textColor: e.target.value}})} className="w-full h-10 border-0 cursor-pointer" />
                     </div>
                  </div>
                </div>
              )}

              {activeTab === 'Visibility' && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  <h4 className="text-xl font-black text-gray-800 uppercase">Content Visibility</h4>
                  <div className="grid grid-cols-2 gap-6">
                    {Object.keys(tempSettings.contentVisibility).map(key => typeof tempSettings.contentVisibility[key] === 'boolean' && (
                      <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                         <span className="text-[10px] font-black text-gray-400 uppercase">{key.replace(/([A-Z])/g, ' $1')}</span>
                         <input type="checkbox" checked={tempSettings.contentVisibility[key]} onChange={e => setTempSettings({...tempSettings, contentVisibility: {...tempSettings.contentVisibility, [key]: e.target.checked}})} className="w-5 h-5 accent-blue-600" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'Custom Text' && (
                <div className="space-y-8">
                   <h4 className="text-xl font-black text-gray-800 uppercase">Custom Labels</h4>
                   <div>
                     <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Custom Proposal Title</label>
                     <input type="text" value={tempSettings.contentVisibility.customTitle} onChange={e => setTempSettings({...tempSettings, contentVisibility: {...tempSettings.contentVisibility, customTitle: e.target.value}})} className="w-full bg-gray-50 border p-4 rounded-2xl font-bold" placeholder="Defaults to Residential Solar Proposal" />
                   </div>
                </div>
              )}

              {activeTab === 'Footer' && (
                <div className="space-y-8">
                   <h4 className="text-xl font-black text-gray-800 uppercase">Footer Settings</h4>
                   <div className="grid grid-cols-2 gap-6">
                     {Object.keys(tempSettings.footer).filter(k => typeof tempSettings.footer[k] === 'boolean').map(key => (
                       <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                         <span className="text-[10px] font-black text-gray-400 uppercase">{key.replace(/([A-Z])/g, ' $1')}</span>
                         <input type="checkbox" checked={tempSettings.footer[key]} onChange={e => setTempSettings({...tempSettings, footer: {...tempSettings.footer, [key]: e.target.checked}})} className="w-5 h-5 accent-blue-600" />
                       </div>
                     ))}
                   </div>
                   <div>
                     <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Copyright Text</label>
                     <input type="text" value={tempSettings.footer.copyrightText} onChange={e => setTempSettings({...tempSettings, footer: {...tempSettings.footer, copyrightText: e.target.value}})} className="w-full bg-gray-50 border p-4 rounded-2xl font-bold" />
                   </div>
                </div>
              )}

              {activeTab === 'Design' && (
                <div className="space-y-8">
                   <h4 className="text-xl font-black text-gray-800 uppercase">Styling</h4>
                   <div className="grid grid-cols-2 gap-6">
                      <div><label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Header BG</label><input type="color" value={tempSettings.header.bgColor} onChange={e => setTempSettings({...tempSettings, header: {...tempSettings.header, bgColor: e.target.value}})} className="w-full h-12 cursor-pointer" /></div>
                      <div><label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Header Text</label><input type="color" value={tempSettings.header.textColor} onChange={e => setTempSettings({...tempSettings, header: {...tempSettings.header, textColor: e.target.value}})} className="w-full h-12 cursor-pointer" /></div>
                   </div>
                </div>
              )}
            </div>

            <div className="w-[400px] bg-gray-50 p-10 border-l overflow-y-auto hidden xl:block">
               <div className="mb-6 flex justify-between items-center"><h4 className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-2"><Eye size={12}/> Live Preview</h4><div className="bg-blue-100 text-blue-600 text-[8px] font-black px-2 py-0.5 rounded">MODAL ONLY</div></div>
               <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col" style={{ fontFamily: tempSettings.styling.fontFamily }}>
                  <div className="p-6 flex justify-between items-center" style={{ backgroundColor: tempSettings.header.bgColor, justifyContent: tempSettings.header.alignment === 'Left' ? 'flex-start' : tempSettings.header.alignment === 'Right' ? 'flex-end' : 'center' }}>
                     {tempSettings.header.showLogo && <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center bg-blue-50/50 shadow-inner">{tempSettings.header.logoUrl ? <img src={tempSettings.header.logoUrl} className="w-full h-full object-contain p-1" /> : <span className="text-[6px] font-black text-blue-400">LOGO</span>}</div>}
                     <div className="ml-3">{tempSettings.header.showName && <p className="text-[10px] font-black uppercase tracking-tight text-gray-800">SOLARKITS ERP</p>}</div>
                  </div>
                  <div className="relative h-40 overflow-hidden">
                     <img src={tempSettings.banner.imageUrl} className="w-full h-full object-cover" />
                     <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center" style={{ backgroundColor: `rgba(0,0,0,${tempSettings.banner.overlayOpacity})` }}>
                       {tempSettings.contentVisibility.proposalTitle && (
                         <h1 className="text-sm font-black uppercase tracking-tight" style={{ color: tempSettings.banner.textColor }}>
                           {tempSettings.contentVisibility.customTitle || 
                             `${(filters.category || 'RESIDENTIAL').toUpperCase()} ${filters.projectType || '3 TO 10 KW'} PROPOSAL`}
                         </h1>
                       )}
                       <div className="w-8 h-0.5 bg-yellow-400 my-2" />
                       <p className="text-[6px] font-black tracking-widest uppercase opacity-70" style={{ color: tempSettings.banner.textColor }}>PROPOSAL</p>
                     </div>
                   </div>
                  <div className="p-6 space-y-4">
                     <div className="space-y-1">{tempSettings.contentVisibility.customerName && <><p className="text-[6px] font-black text-gray-400 uppercase">Customer Name</p><p className="text-[10px] font-black uppercase text-gray-800">Pradip Sharma</p></>}</div>
                     <div className="flex gap-4">
                       {tempSettings.contentVisibility.proposalNo && (
                         <div>
                           <p className="text-[6px] font-black text-gray-400 uppercase">Proposal No</p>
                           <p className="text-[8px] font-black text-blue-600 uppercase">
                             #QUA/{filters.category ? filters.category.substring(0, 3).toUpperCase() : 'PRD'}/
                             {filters.subCategory ? filters.subCategory.substring(0, 3).toUpperCase() : 'SUB'}/
                             {states.find(s => s._id === selectedState)?.code || 'ST'}/
                             {districts.find(d => d._id === selectedDistrict)?.code || 'DST'}/
                             {(new Date().getFullYear()).toString().slice(-2)}/
                             {(quotes.filter(q => (q.state?._id || q.state) === selectedState && (q.district?._id || q.district) === selectedDistrict).length + 1).toString().padStart(3, '0')}
                           </p>
                         </div>
                       )}
                       {tempSettings.contentVisibility.systemSize && (
                         <div>
                           <p className="text-[6px] font-black text-gray-400 uppercase">System Size</p>
                           <p className="text-[8px] font-black text-gray-800 Uppercase">{solarSettings?.projectKW || 10} kW</p>
                         </div>
                       )}
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Sub-component to prevent main component re-renders
const PageConfigDrawer = ({ isOpen, onClose, activePage, initialConfig, onSave, quoteType }) => {
  const [config, setConfig] = useState(initialConfig);

  useEffect(() => {
    if (isOpen) setConfig(initialConfig);
  }, [isOpen, initialConfig]);

  if (!isOpen) return null;

  const pageType = activePage?.value;

  const renderSelectionSettings = () => {
    if (pageType === 'Commercial Page') {
      return (
        <div className="space-y-3 pt-4 border-t border-gray-100">
           <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Display Selections</p>
           {[
             { key: 'showPricing', label: 'Payment Structure' },
             { key: 'showTerms', label: 'Terms & Conditions' },
             { key: 'showBank', label: 'Bank Account Info' },
             { key: 'showWarranty', label: 'System Warranty Details' }
           ].map(item => (
             <label key={item.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-white transition-colors">
               <span className="text-[11px] font-bold text-gray-600">{item.label}</span>
               <input 
                  type="checkbox" 
                  checked={(config.visibility || {})[item.key] !== false}
                  onChange={(e) => setConfig({
                    ...config,
                    visibility: { ...config.visibility, [item.key]: e.target.checked }
                  })}
                  className="w-4 h-4 text-blue-600 rounded"
               />
             </label>
           ))}
        </div>
      );
    }
    if (pageType === 'Advanced Settings') {
      return (
        <div className="space-y-3 pt-4 border-t border-gray-100">
           <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Add-on Visibility</p>
           {[
             { key: 'showAccessories', label: 'Inverter & Module Details' },
             { key: 'showEarthing', label: 'Earthing & Protection' },
             { key: 'showInstallation', label: 'Installation Standard' },
             { key: 'showAMC', label: 'AMC / Maintenance Offer' }
           ].map(item => (
             <label key={item.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-white transition-colors">
               <span className="text-[11px] font-bold text-gray-600">{item.label}</span>
               <input 
                  type="checkbox" 
                  checked={(config.visibility || {})[item.key] !== false}
                  onChange={(e) => setConfig({
                    ...config,
                    visibility: { ...config.visibility, [item.key]: e.target.checked }
                  })}
                  className="w-4 h-4 text-blue-600 rounded"
               />
             </label>
           ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[120] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        <div className="bg-gradient-to-r from-blue-700 to-blue-600 px-8 py-5 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-white text-lg font-black uppercase tracking-tighter flex items-center gap-2">
              <Settings size={20} className="animate-spin-slow" />
              CONFiGURE: {activePage?.label}
            </h3>
            <p className="text-blue-100 text-[8px] font-bold uppercase tracking-widest opacity-70">Customize current page layout and visible elements</p>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-xl transition-all"><Trash2 size={20} className="rotate-45" /></button>
        </div>
        
        <div className="p-8 space-y-6 overflow-y-auto">
          {/* Header/Footer Inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Page Header</label>
              <input
                type="text"
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold focus:ring-4 focus:ring-blue-500/10 outline-none"
                placeholder="Custom header text..."
                value={config.header || ''}
                onChange={(e) => setConfig({ ...config, header: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Page Footer</label>
              <input
                type="text"
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold focus:ring-4 focus:ring-blue-500/10 outline-none"
                placeholder="Custom footer text..."
                value={config.footer || ''}
                onChange={(e) => setConfig({ ...config, footer: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Featured Image (URL)</label>
            <input
              type="text"
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold focus:ring-4 focus:ring-blue-500/10 outline-none"
              placeholder="https://images.unsplash.com/..."
              value={config.media || ''}
              onChange={(e) => setConfig({ ...config, media: e.target.value })}
            />
          </div>

          {/* Dynamic Selection Section */}
          {renderSelectionSettings()}

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Custom Notes / Content</label>
            <textarea
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-xs font-bold focus:ring-4 focus:ring-blue-500/10 outline-none resize-none"
              placeholder="Enter special page description or notes..."
              rows="4"
              value={config.content || ''}
              onChange={(e) => setConfig({ ...config, content: e.target.value })}
            ></textarea>
          </div>
        </div>

        <div className="bg-gray-50 px-8 py-5 flex gap-4 justify-end border-t border-gray-100">
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-xs font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-all">Cancel</button>
          <button
            onClick={() => {
                onSave(config);
                onClose();
            }}
            className="bg-blue-600 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-200 active:scale-95 transition-all"
          >
            Apply Config
          </button>
        </div>
      </div>
    </div>
  );
};
