import React, { useState, useEffect, useRef } from 'react';
import {
  Trash2, Edit, Download, Printer,
  Save, Calculator, Eye, Upload, X,
  BarChart3, LineChart, Settings, CheckCircle,
  MapPin, GripVertical, FileText, Image, Zap, Shield,
  ChevronDown, ChevronRight
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
import { getAMCServices } from '../../../../services/combokit/combokitApi';
import salesSettingsService from '../../../../services/settings/salesSettingsApi';
import { useLocations } from '../../../../hooks/useLocations';

/**
 * AccordionSection Component
 * A reusable collapsible container for settings modules
 */
const AccordionSection = ({ title, section, isOpen, onToggle, children, icon: Icon, badge }) => (
  <div className={`bg-white border-2 rounded-3xl overflow-hidden transition-all duration-300 mb-4 ${isOpen ? 'border-blue-200 shadow-md' : 'border-gray-100 hover:border-blue-100'}`}>
    <button 
      onClick={() => onToggle(section)}
      className={`w-full flex items-center justify-between px-8 py-5 transition-all ${isOpen ? 'bg-blue-100/10' : 'bg-white'}`}
    >
      <div className="flex items-center gap-4">
        {Icon && (
          <div className={`p-2.5 rounded-xl transition-all duration-300 ${isOpen ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-gray-50 text-gray-400'}`}>
            <Icon size={18} />
          </div>
        )}
        <div className="flex flex-col items-start">
          <span className={`text-[11px] font-black uppercase tracking-widest transition-colors duration-300 ${isOpen ? 'text-blue-700' : 'text-gray-500'}`}>{title}</span>
          {badge && <span className="text-[9px] font-bold text-gray-400 mt-0.5">{badge}</span>}
        </div>
      </div>
      <div className={`transition-all duration-300 ${isOpen ? 'rotate-180 text-blue-600' : 'text-gray-300'}`}>
        <ChevronDown size={20} />
      </div>
    </button>
    <div 
      className={`transition-all duration-500 ease-in-out overflow-hidden`}
      style={{ maxHeight: isOpen ? '5000px' : '0', opacity: isOpen ? 1 : 0 }}
    >
      <div className="p-8 border-t border-gray-50 bg-white">
        {children}
      </div>
    </div>
  </div>
);

export default function QuoteSetting() {
  const [dbAmcServices, setDbAmcServices] = useState([]);
  useEffect(() => {
    const fetchAmcServices = async () => {
      try {
        const res = await getAMCServices();
        // Handle both direct array response and { data: [...] } format
        const services = Array.isArray(res) ? res : (res?.data || []);
        setDbAmcServices(services);
        console.log('Fetched AMC Services:', services);
      } catch (e) { 
        console.error('Failed to fetch AMC services', e); 
        setDbAmcServices([]);
      }
    };
    fetchAmcServices();
  }, [getAMCServices]);


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
  const [selectedPages, setSelectedPages] = useState(['Front Page']);
  const [colorSettings, setColorSettings] = useState({
    brandColor: false,
    backgroundColor: false,
    pageSequence: false
  });

  const [advancedOptions, setAdvancedOptions] = useState([
    { key: 'amc', enabled: false, type: 'Basic AMC Plan', price: 4000, description: 'Bi-annual system inspection, Basic cleaning (twice a year), Performance report, Remote monitoring setup' },
    { key: 'insurance', enabled: false, type: 'Basic Panel Protection', price: 3000, description: 'Covers damage from natural disasters, Theft protection, 10-year coverage option' },
    { key: 'cleaningKit', enabled: false, type: 'Basic Cleaning Kit', price: 2500, description: 'Includes telescopic pole, brush and biodegradable cleaner' }
  ]);

  const [unitPrice, setUnitPrice] = useState(7.5);

  const [packageImage, setPackageImage] = useState(null);
  const [bomData, setBomData] = useState({
    items: [
      { label: 'Solar Structure', value: 'HOT DIP GALVANIZE' },
      { label: 'Solar DC Cable', value: 'Polycab 4 Sq mm' },
      { label: 'Solar AC Cable', value: 'Polycab 4 Sq mm' },
      { label: 'Earthing Kit + LA', value: 'Standard' },
      { label: 'Electrical Components', value: 'L & T / Similar' }
    ],
    pipes: [
      { panels: '4', kw: '2.16', size1: '3', size2: '2' },
      { panels: '6', kw: '3.24', size1: '3', size2: '3' },
      { panels: '10', kw: '5.4', size1: '5', size2: '4' },
      { panels: '12', kw: '6.48', size1: '5', size2: '5' }
    ],
    heightNote: 'Structure Height 6 x 8 Feet is included. Extra pipes beyond this will be paid by the customer.'
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
    projectKW: 10
  });

  const [monthlyIsolation, setMonthlyIsolation] = useState(
    Array(12).fill(0).map((val, idx) => ({
      month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][idx],
      isolation: 120,
      total: 0
    }))
  );

  const [annualTotal, setAnnualTotal] = useState(0);
  const [inflationRate, setInflationRate] = useState(0.05); // Default 5%
  const [degradationRate, setDegradationRate] = useState(0.01); // Default 1%
  const [quotes, setQuotes] = useState([]);
  // const [quoteCount, setQuoteCount] = useState(0); // Not needed with DB IDs
  const [editingId, setEditingId] = useState(null);
  const [downloadQuote, setDownloadQuote] = useState(null);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  const handleDownloadQuote = (quote) => {
    setDownloadQuote(quote);
    setIsDownloadModalOpen(true);
  };

  const generationChartRef = useRef(null);
  const roiChartRef = useRef(null);
  const generationChartInstance = useRef(null);
  const roiChartInstance = useRef(null);
  const logoInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  const packageImageInputRef = useRef(null);

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
        // Clean up specific unwanted pages requested by user
        const filtered = parsed.filter(p => !['EEEE', 'SWWSW', 'FOTTER', 'JJIIK'].includes(p.label?.toUpperCase()));
        if (filtered.length !== parsed.length) {
          localStorage.setItem('customQuotePages', JSON.stringify(filtered));
        }
        return [...defaultPages, ...filtered];
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
  const [openSections, setOpenSections] = useState({
    targeting: true,
    media: false,
    bom: false,
    finance: false,
    pages: false,
    addons: false,
    fields: false
  });

  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const quoteTypes = ['Survey Quote', 'Quick Quote'];

  useEffect(() => {
    fetchQuotes();
    fetchDynamicFilters();

    // One-time cleanup for specific unwanted pages
    const unwanted = ['EEEE', 'SWWSW', 'FOTTER', 'JJIIK'];
    setPagesOptions(prev => {
      const filtered = prev.filter(p => !p.label || !unwanted.includes(p.label.toUpperCase()));
      if (filtered.length !== prev.length) {
        const customOnly = filtered.filter(p => !['f1', 'f2', 'f3', 'f4', 'f5'].includes(p.id));
        localStorage.setItem('customQuotePages', JSON.stringify(customOnly));
        return filtered;
      }
      return prev;
    });

    // Ensure Front Page is always selected
    setSelectedPages(prev => prev.includes('Front Page') ? prev : ['Front Page', ...prev]);
  }, []);

  const handleDeletePage = (pageId) => {
    if (['f1', 'f2', 'f3', 'f4', 'f5'].includes(pageId)) {
      toast.error("Standard system pages cannot be deleted.");
      return;
    }

    const updatedPages = pagesOptions.filter(p => p.id !== pageId);
    setPagesOptions(updatedPages);

    const customOnly = updatedPages.filter(p => !['f1', 'f2', 'f3', 'f4', 'f5'].includes(p.id));
    localStorage.setItem('customQuotePages', JSON.stringify(customOnly));
    
    const pageToDelete = pagesOptions.find(p => p.id === pageId);
    if (pageToDelete) {
      setSelectedPages(prev => prev.filter(val => val !== pageToDelete.value));
    }

    toast.success("Page removed successfully.");
  };

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
        const customOnly = newOrder.filter(p => !['f1', 'f2', 'f3', 'f4', 'f5'].includes(p.id));
        localStorage.setItem('customQuotePages', JSON.stringify(customOnly));
        
        return newOrder;
      });
    }
  };

  const SortablePageCard = ({ page, selectedPages, setSelectedPages, quoteType, setActiveEditingPage, setTempPageConfig, setIsPageModalOpen, pageConfigs, onDelete }) => {
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

    const toggleSelection = (e) => {
      e.stopPropagation();
      if (page.value === 'Front Page') return; // Cannot deselect Front Page
      if (isSelected) {
        setSelectedPages(selectedPages.filter(p => p !== page.value));
      } else {
        setSelectedPages([...selectedPages, page.value]);
      }
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`relative group bg-white border-2 rounded-3xl p-6 transition-all duration-300 flex items-start gap-5 mb-4 ${isSelected ? 'border-blue-600 bg-blue-50/50 ring-4 ring-blue-500/5' : 'border-gray-100 hover:border-blue-200'} ${isDragging ? 'shadow-2xl scale-[1.02] border-blue-400 z-50' : 'shadow-sm'}`}
      >
        <div 
          {...attributes} 
          {...listeners}
          className="mt-1 cursor-grab active:cursor-grabbing text-gray-300 hover:text-blue-500 transition-colors p-1"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={20} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h5 className={`text-[13px] font-black uppercase tracking-tight ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}>
              {page.label}
            </h5>
            <button 
              onClick={toggleSelection}
              disabled={page.value === 'Front Page'}
              className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${isSelected ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-200' : 'border-gray-200 bg-white hover:border-blue-400'} ${page.value === 'Front Page' ? 'cursor-not-allowed opacity-70' : ''}`}
            >
              {isSelected ? <CheckCircle size={14} className="text-white" /> : <div className="w-2 h-2 rounded-full bg-gray-100 group-hover:bg-blue-100" />}
            </button>
          </div>
          
          <p className="text-[10px] font-bold text-gray-400 leading-relaxed mb-5 uppercase tracking-wide">
            {page.description || 'Custom configured page content and components'}
          </p>
          
          <div className="flex items-center gap-3">
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
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all shadow-sm ${isSelected ? 'bg-white text-blue-600 hover:bg-blue-600 hover:text-white' : 'bg-gray-50 text-gray-400 hover:bg-blue-600 hover:text-white hover:shadow-blue-100'}`}
            >
              <Settings size={14} className={isSelected ? 'animate-spin-slow' : ''} />
              Settings
            </button>
            
            {isSelected && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-100 text-blue-600 text-[9px] font-black uppercase tracking-widest animate-in fade-in zoom-in-95">
                <FileText size={12} />
                Selected
              </div>
            )}

            {!['f1', 'f2', 'f3', 'f4', 'f5'].includes(page.id) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(page.id);
                }}
                className="ml-auto p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                title="Delete page"
              >
                <Trash2 size={16} />
              </button>
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

  // Filter Plan Types when Partner Type or Location changes
  useEffect(() => {
    const fetchPlans = async () => {
      if (partnerType) {
        try {
          const plans = await salesSettingsService.getPartnerPlans({ 
            partnerType,
            countryId: selectedCountry,
            stateId: selectedState,
            clusterId: selectedCluster,
            districtId: selectedDistrict 
          });
          const uniquePlans = [...new Set(plans.map(p => p.planName || p.name || p))];
          setPlanTypes(uniquePlans);

          if (planType && !uniquePlans.includes(planType)) {
            setPlanType('');
          }
        } catch (err) {
          console.error("Error fetching partner plans:", err);
          setPlanTypes(['Startup', 'Basic', 'Enterprise', 'Solar Business']); // Fallback
        }
      } else {
        setPlanTypes([]);
      }
    };
    fetchPlans();
  }, [partnerType, selectedCountry, selectedState, selectedCluster, selectedDistrict]);

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

  // Discovery logic removed to prevent deleted pages from returning.

  useEffect(() => {
    if (selectedPages.includes('Generation Graph') || selectedPages.includes('Financial Summary')) {
      // Auto-calculate annual total for reactive cards
      const { projectKW } = solarSettings;
      const calculatedTotal = monthlyIsolation.reduce((sum, m) => sum + (m.isolation * projectKW * 0.8), 0);
      setAnnualTotal(parseFloat(calculatedTotal.toFixed(2)));
      
      // Delay chart initialization to ensure DOM is ready
      setTimeout(initializeCharts, 100);
    }
  }, [selectedPages, monthlyIsolation, solarSettings, pricingData, advancedOptions, unitPrice]); 


  const calculateGeneration = () => {
    const { projectKW } = solarSettings;
    let total = 0;

    const updatedMonths = monthlyIsolation.map(month => {
      const monthTotal = month.isolation * projectKW * 0.8;
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
    const { projectKW } = solarSettings;
    return monthlyIsolation.map(month => ({
      ...month,
      total: parseFloat((month.isolation * projectKW * 0.8).toFixed(2))
    }));
  };

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
    // ROI Chart (Dynamic calculation)
    const roiCtx = document.getElementById('roiChart');
    if (roiCtx) {
      const years = Array.from({ length: 11 }, (_, i) => i);
      let cumulative = 0;
      const cumulativeSavings = [];
      const costBaseline = years.map(() => currentSystemCost);
      
      let yearlySavings = annualTotal * unitPrice;
      
      years.forEach(y => {
        if (y === 0) {
          cumulativeSavings.push(0);
        } else {
          cumulative += yearlySavings;
          cumulativeSavings.push(cumulative);
          // Apply inflation and degradation for NEXT year
          yearlySavings = yearlySavings * (1 + inflationRate - degradationRate);
        }
      });

      roiChartInstance.current = new Chart(roiCtx, {
        type: 'line',
        data: {
          labels: years.map(y => `Year ${y}`),
          datasets: [{
            label: 'Cumulative Savings (₹)',
            data: cumulativeSavings,
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: 'rgba(75, 192, 192, 1)',
            pointRadius: 4
          }, {
            label: 'System Cost (₹)',
            data: costBaseline,
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 2,
            borderDash: [5, 5],
            fill: false,
            pointRadius: 0
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
        total: parseFloat((m.isolation * solarSettings.projectKW * 0.8).toFixed(2))
      })),
      colorSettings,
      fieldSettings,
      kitType,
      paymentMode,
      pageConfigs,
      frontPageSettings,
      advancedOptions,
      unitPrice,
      inflationRate,
      degradationRate,
      packageImage,
      bomData
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
    const newId = `c${Date.now()}`;
    const newPage = { id: newId, label: newPageName, value: newPageName };
    const updatedOptions = [...pagesOptions, newPage];
    setPagesOptions(updatedOptions);

    // Save custom pages to localStorage
    const customPages = updatedOptions.filter(p => !['f1', 'f2', 'f3', 'f4', 'f5'].includes(p.id));
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
      projectKW: 10
    });
    setMonthlyIsolation(Array(12).fill(0).map((val, idx) => ({
      month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][idx],
      isolation: 120,
      total: 0
    })));
    setAdvancedOptions([
      { key: 'amc', enabled: false, type: 'Basic AMC Plan', price: 4000, description: 'Bi-annual system inspection, Basic cleaning (twice a year), Performance report, Remote monitoring setup' },
      { key: 'insurance', enabled: false, type: 'Basic Panel Protection', price: 3000, description: 'Covers damage from natural disasters, Theft protection, 10-year coverage option' },
      { key: 'cleaningKit', enabled: false, type: 'Basic Cleaning Kit', price: 2500, description: 'Includes telescopic pole, brush and biodegradable cleaner' }
    ]);
    setUnitPrice(7.5);
    setInflationRate(0.05);
    setDegradationRate(0.01);
    setPackageImage(null);
    setBomData({
      items: [
        { label: 'Solar Structure', value: 'HOT DIP GALVANIZE' },
        { label: 'Solar DC Cable', value: 'Polycab 4 Sq mm' },
        { label: 'Solar AC Cable', value: 'Polycab 4 Sq mm' },
        { label: 'Earthing Kit + LA', value: 'Standard' },
        { label: 'Electrical Components', value: 'L & T / Similar' }
      ],
      pipes: [
        { panels: '4', kw: '2.16', size1: '3', size2: '2' },
        { panels: '6', kw: '3.24', size1: '3', size2: '3' },
        { panels: '10', kw: '5.4', size1: '5', size2: '4' },
        { panels: '12', kw: '6.48', size1: '5', size2: '5' }
      ],
      heightNote: 'Structure Height 6 x 8 Feet is included. Extra pipes beyond this will be paid by the customer.'
    });
    setMonthlyIsolation([
      { month: 'January', isolation: 4.8, total: 0 },
      { month: 'February', isolation: 5.2, total: 0 },
      { month: 'March', isolation: 6.1, total: 0 },
      { month: 'April', isolation: 6.8, total: 0 },
      { month: 'May', isolation: 7.2, total: 0 },
      { month: 'June', isolation: 5.8, total: 0 },
      { month: 'July', isolation: 4.5, total: 0 },
      { month: 'August', isolation: 4.3, total: 0 },
      { month: 'September', isolation: 5.1, total: 0 },
      { month: 'October', isolation: 5.6, total: 0 },
      { month: 'November', isolation: 5.0, total: 0 },
      { month: 'December', isolation: 4.6, total: 0 }
    ]);
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
    if (quote.advancedOptions) {
      setAdvancedOptions(quote.advancedOptions);
    }
    if (quote.unitPrice) {
      setUnitPrice(quote.unitPrice);
    }
    if (quote.inflationRate !== undefined) {
      setInflationRate(quote.inflationRate);
    }
    if (quote.degradationRate !== undefined) {
      setDegradationRate(quote.degradationRate);
    }
    if (quote.packageImage) {
      setPackageImage(quote.packageImage);
    } else {
      setPackageImage(null);
    }
    if (quote.bomData) {
      setBomData(quote.bomData);
    }
    if (quote.monthlyIsolation && quote.monthlyIsolation.length > 0) {
      setMonthlyIsolation(quote.monthlyIsolation);
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
 
  const handlePackageImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image file size should be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPackageImage(reader.result);
        toast.success("Package image uploaded!");
      };
      reader.readAsDataURL(file);
    }
  };

  const updateBOMVisibility = () => {
    // BOM Survey enabled for all quote types
  };

  useEffect(() => {
    updateBOMVisibility();
  }, [quoteType]);

  const isAdvancedSettingsEnabled = true; // Enabled for all plans as per user request
  const isLocationSelected = selectedCountry && selectedState && selectedCluster && selectedDistrict;

  const advancedTotal = advancedOptions.reduce((acc, opt) => acc + (opt.enabled ? (opt.price || 0) : 0), 0);
  const annualSavings = annualTotal * unitPrice;
  
  // Advanced Payback Calculation
  let total25YearSavings = 0;
  let currentYearSavings = annualSavings;
  let calculatedPayback = 0;
  let cumulative = 0;
  
  for (let i = 1; i <= 25; i++) {
    cumulative += currentYearSavings;
    total25YearSavings += currentYearSavings;
    if (calculatedPayback === 0 && cumulative >= pricingData.netCost) {
      // Linear interpolation for more accurate payback month if needed, but keeping it simple for now
      calculatedPayback = i - 1 + (pricingData.netCost - (cumulative - currentYearSavings)) / currentYearSavings;
    }
    currentYearSavings = currentYearSavings * (1 + inflationRate - degradationRate);
  }

  const paybackPeriod = calculatedPayback || (annualSavings > 0 ? (pricingData.netCost / annualSavings) : 0);
  const savings25Year = total25YearSavings;

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
            {/* Targeting Configuration */}
            <AccordionSection
              title={editingId ? 'Updating Configuration' : 'Targeting Configuration'}
              section="targeting"
              isOpen={openSections.targeting}
              onToggle={toggleSection}
              icon={MapPin}
              badge={`${states.find(s => s._id === (selectedState))?.name || '-'} / ${clusters.find(c => c._id === (selectedCluster))?.name || '-'} / ${districts.find(d => d._id === (selectedDistrict))?.name || '-'}`}
            >
               {editingId && (
                <div className="flex justify-end mb-6">
                   <button 
                     onClick={() => { setEditingId(null); resetForm(); }} 
                     className="text-[10px] bg-red-50 text-red-600 px-4 py-2 rounded-xl font-black uppercase shadow-sm active:scale-95 transition-all flex items-center gap-2 border border-red-100 hover:bg-red-600 hover:text-white"
                   >
                     <X size={14} />
                     Cancel Edit Mode
                   </button>
                </div>
              )}
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

            </AccordionSection>

            {/* Package Media Configuration */}
            <AccordionSection
              title="Package Media Configuration"
              section="media"
              isOpen={openSections.media}
              onToggle={toggleSection}
              icon={Image}
              badge="Branding & Visual Assets"
            >
                  
                  <div className="flex flex-col md:flex-row gap-6 items-center">
                    <div className="w-32 h-32 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden shrink-0 group/img relative">
                      {packageImage ? (
                        <>
                          <img src={packageImage} alt="Preview" className="w-full h-full object-contain p-2" />
                          <button 
                            onClick={() => setPackageImage(null)}
                            className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                          >
                            <Trash2 size={20} />
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center text-gray-400">
                          <Image size={24} className="mb-1" />
                          <span className="text-[8px] font-black uppercase">No Image</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 space-y-3">
                      <p className="text-[10px] font-bold text-gray-500 leading-relaxed uppercase tracking-tight">
                        Upload a professional product image to be displayed in the commercial preview section.
                      </p>
                      <input 
                        type="file" 
                        ref={packageImageInputRef}
                        className="hidden" 
                        accept="image/*"
                        onChange={handlePackageImageUpload}
                      />
                      <button 
                        onClick={() => packageImageInputRef.current.click()}
                        className="w-full bg-indigo-50 text-indigo-600 border-2 border-indigo-100 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm"
                      >
                        <Upload size={14} />
                        {packageImage ? 'Change Image' : 'Upload Package Image'}
                      </button>
                    </div>
                  </div>

            </AccordionSection>

            {/* Solar BOM Configuration */}
            <AccordionSection
              title="Solar BOM Configuration"
              section="bom"
              isOpen={openSections.bom}
              onToggle={toggleSection}
              icon={Settings}
              badge="Material Specifications & Tables"
            >

                  {/* BOM Material Items */}
                  <div className="mb-8">
                    <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4">Material Specifications</label>
                    <div className="space-y-4">
                      {bomData.items.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-2 gap-4">
                          <input 
                            type="text" 
                            className="bg-gray-50 border border-transparent rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 focus:bg-white focus:border-blue-300 outline-none transition-all"
                            value={item.label}
                            onChange={(e) => {
                              const newItems = [...bomData.items];
                              newItems[idx].label = e.target.value;
                              setBomData({...bomData, items: newItems});
                            }}
                          />
                          <input 
                            type="text" 
                            className="bg-gray-50 border border-transparent rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 focus:bg-white focus:border-blue-300 outline-none transition-all"
                            value={item.value}
                            onChange={(e) => {
                              const newItems = [...bomData.items];
                              newItems[idx].value = e.target.value;
                              setBomData({...bomData, items: newItems});
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* GI Pipe Configuration */}
                  <div className="mb-8">
                    <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4">GI Pipe Specifications Table</label>
                    <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                      <div className="grid grid-cols-4 gap-2 text-[8px] font-black text-gray-400 uppercase tracking-widest px-1">
                        <span>Panels</span>
                        <span>DC KW</span>
                        <span>60x40 Pipe</span>
                        <span>40x40 Pipe</span>
                      </div>
                      {bomData.pipes.map((pipe, idx) => (
                        <div key={idx} className="grid grid-cols-4 gap-2">
                          <input 
                            type="text" 
                            className="bg-white border border-gray-100 rounded-lg px-2 py-1.5 text-[10px] font-black text-gray-700 focus:border-blue-400 outline-none text-center"
                            value={pipe.panels}
                            onChange={(e) => {
                              const newPipes = [...bomData.pipes];
                              newPipes[idx].panels = e.target.value;
                              setBomData({...bomData, pipes: newPipes});
                            }}
                          />
                          <input 
                            type="text" 
                            className="bg-white border border-gray-100 rounded-lg px-2 py-1.5 text-[10px] font-black text-gray-700 focus:border-blue-400 outline-none text-center"
                            value={pipe.kw}
                            onChange={(e) => {
                              const newPipes = [...bomData.pipes];
                              newPipes[idx].kw = e.target.value;
                              setBomData({...bomData, pipes: newPipes});
                            }}
                          />
                          <input 
                            type="text" 
                            className="bg-white border border-gray-100 rounded-lg px-2 py-1.5 text-[10px] font-black text-gray-700 focus:border-blue-400 outline-none text-center"
                            value={pipe.size1}
                            onChange={(e) => {
                              const newPipes = [...bomData.pipes];
                              newPipes[idx].size1 = e.target.value;
                              setBomData({...bomData, pipes: newPipes});
                            }}
                          />
                          <input 
                            type="text" 
                            className="bg-white border border-gray-100 rounded-lg px-2 py-1.5 text-[10px] font-black text-gray-700 focus:border-blue-400 outline-none text-center"
                            value={pipe.size2}
                            onChange={(e) => {
                              const newPipes = [...bomData.pipes];
                              newPipes[idx].size2 = e.target.value;
                              setBomData({...bomData, pipes: newPipes});
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3 px-1">Structure Height Note</label>
                    <textarea 
                      className="w-full bg-gray-50 border border-transparent rounded-2xl px-4 py-3 text-[10px] font-bold text-gray-600 focus:bg-white focus:border-blue-300 outline-none transition-all resize-none h-20"
                      value={bomData.heightNote}
                      onChange={(e) => setBomData({...bomData, heightNote: e.target.value})}
                    />
                  </div>

            </AccordionSection>

            {/* Performance & ROI Management */}
            <AccordionSection
              title="Performance & ROI Management"
              section="finance"
              isOpen={openSections.finance}
              onToggle={toggleSection}
              icon={Calculator}
              badge="Financials & Generation Calculations"
            >
                <div className="bg-emerald-50/30 border-2 border-emerald-100 rounded-3xl p-8 mb-8 relative overflow-hidden group shadow-sm transition-all hover:border-emerald-200">
                  <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[8px] font-black px-4 py-1 rounded-bl-xl uppercase tracking-widest group-hover:scale-110 transition-transform">ROI Settings</div>
                  <div className="flex justify-between items-center mb-6">
                    <h5 className="text-sm font-black text-gray-800 flex items-center gap-2 uppercase tracking-wider">
                       <Calculator size={16} className="text-emerald-600" />
                       Financial Performance Management
                    </h5>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 px-1">Unit Selling Price (₹/Unit)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 font-bold">₹</span>
                        <input 
                          type="number"
                          step="0.1"
                          className="w-full bg-emerald-50/50 border border-emerald-100 rounded-2xl pl-8 pr-4 py-3.5 text-sm font-black text-gray-800 focus:bg-white focus:border-emerald-400 outline-none transition-all shadow-inner"
                          value={unitPrice}
                          onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 px-1">Total System Cost Adjustment</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600 font-bold">₹</span>
                        <input 
                          type="number"
                          className="w-full bg-blue-50/50 border border-blue-100 rounded-2xl pl-8 pr-4 py-3.5 text-sm font-black text-gray-800 focus:bg-white focus:border-blue-400 outline-none transition-all shadow-inner"
                          value={pricingData.totalCost}
                          onChange={(e) => setPricingData({...pricingData, totalCost: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2 px-1">Electricity Inflation (% Yearly)</label>
                      <input 
                        type="number"
                        step="0.1"
                        className="w-full bg-amber-50/50 border border-amber-100 rounded-2xl px-4 py-3.5 text-sm font-black text-gray-800 focus:bg-white focus:border-amber-400 outline-none transition-all shadow-inner"
                        value={inflationRate * 100}
                        onChange={(e) => setInflationRate(parseFloat(e.target.value) / 100 || 0)}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[10px] font-black text-red-600 uppercase tracking-widest mb-2 px-1">Panel Degradation (% Yearly)</label>
                      <input 
                        type="number"
                        step="0.1"
                        className="w-full bg-red-50/50 border border-red-100 rounded-2xl px-4 py-3.5 text-sm font-black text-gray-800 focus:bg-white focus:border-red-400 outline-none transition-all shadow-inner"
                        value={degradationRate * 100}
                        onChange={(e) => setDegradationRate(parseFloat(e.target.value) / 100 || 0)}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-gray-800 uppercase tracking-wide">Calculated Annual Generation</span>
                        <span className="text-[8px] font-bold text-gray-400 uppercase">Based on Monthly Multipliers</span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black text-blue-600">{annualTotal.toLocaleString()}</span>
                        <span className="text-[10px] font-black text-blue-400 ml-1">UNITS</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50/30 border-2 border-blue-100 rounded-3xl p-8 relative overflow-hidden group shadow-sm transition-all hover:border-blue-200">
                  <div className="absolute top-0 right-0 bg-blue-600 text-white text-[8px] font-black px-4 py-1 rounded-bl-xl uppercase tracking-widest group-hover:scale-110 transition-transform">Generation Settings</div>
                    {/* Formula Note */}
                    <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                      <p className="text-sm font-bold text-blue-700">
                        Monthly Units = kW × Solar Insolation × 0.8
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Use this for monthly generation graph
                      </p>
                    </div>

                    {/* Monthly Inputs */}
                    <h5 className="text-blue-600 font-black uppercase text-[10px] tracking-widest mb-4 ml-1">Enter Monthly Solar Isolation</h5>

                    <div className="overflow-x-auto mb-4 bg-white rounded-2xl border border-blue-50 shadow-sm">
                      <table className="min-w-full">
                        <thead className="bg-gray-50/50">
                          <tr>
                            <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Month</th>
                            <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Solar Isolation</th>
                            <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Total Generation</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {getCalculatedMonthlyData().map((month, index) => (
                            <tr key={month.month} className="hover:bg-blue-50/30 transition-colors">
                              <td className="px-4 py-3 text-center text-xs font-black text-gray-500">{month.month}</td>
                              <td className="px-4 py-3">
                                <input
                                  type="number"
                                  className="w-full bg-gray-50 border border-transparent rounded-lg px-2 py-1.5 text-xs font-black text-gray-700 text-center focus:bg-white focus:border-blue-300 outline-none transition-all"
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
                              <td className="px-4 py-3 text-center">
                                <span className="text-xs font-bold text-blue-600">{month.total.toLocaleString()} Units</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Monthly Multipliers / Isolation */}
                    <div className="mt-8 border-t border-gray-100 pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest">Monthly Isolation Multipliers</label>
                        <span className="text-[8px] font-bold text-gray-400 uppercase">Adjust graph curve</span>
                      </div>
                      <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                        {monthlyIsolation.map((m, idx) => (
                          <div key={m.month} className="group/iso">
                            <label className="block text-[8px] font-black text-gray-400 uppercase text-center mb-1 group-hover/iso:text-blue-500 transition-colors">{m.month.substring(0, 3)}</label>
                            <input 
                              type="number"
                              step="0.01"
                              className="w-full bg-gray-50 border border-transparent rounded-xl px-2 py-2 text-[10px] font-black text-gray-700 text-center focus:bg-white focus:border-blue-300 outline-none transition-all shadow-sm"
                              value={m.isolation}
                              onChange={(e) => {
                                const newIso = [...monthlyIsolation];
                                newIso[idx].isolation = parseFloat(e.target.value) || 0;
                                setMonthlyIsolation(newIso);
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="text-center mt-8">
                      <button
                        className="bg-blue-600 text-white px-8 py-3 rounded-2xl hover:bg-blue-700 flex items-center gap-2 mx-auto text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-100 transition-all active:scale-95"
                        onClick={calculateGeneration}
                      >
                        <Calculator size={18} />
                        Trigger Recalculation
                      </button>
                    </div>
                </div>

            </AccordionSection>

            {/* Quote Configuration & Layout */}
            <AccordionSection
              title="Quote Layout & Visuals"
              section="pages"
              isOpen={openSections.pages}
              onToggle={toggleSection}
              icon={FileText}
              badge="Pages selection & Visual Appearance"
            >
                <div className="mb-10">
                                    <div className="flex flex-col mb-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h5 className="text-lg font-black text-gray-800 uppercase tracking-tighter flex items-center gap-2">
                           <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                           Prepare Quote Pages
                        </h5>
                        <p className="text-xs font-bold text-gray-400 ml-3.5 mt-0.5">
                          Select which pages you want to include in the final quote PDF.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setSelectedPages(pagesOptions.map(p => p.value))}
                          className="flex-1 md:flex-none text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-200 px-4 py-2 rounded-xl hover:bg-blue-600 hover:text-white transition-all uppercase tracking-widest active:scale-95 shadow-sm"
                        >
                          Select All
                        </button>
                        <button 
                          onClick={() => setSelectedPages(['Front Page'])}
                          className="flex-1 md:flex-none text-[10px] font-black text-gray-400 bg-gray-50 border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-100 transition-all uppercase tracking-widest active:scale-95 shadow-sm"
                        >
                          Deselect All
                        </button>
                      </div>
                    </div>
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
                            onDelete={handleDeletePage}
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

            </AccordionSection>

            {/* Advanced Add-ons */}
            {/* Visual Overrides */}
            <AccordionSection
              title="Visual Appearance Priorities"
              section="addons"
              isOpen={openSections.addons}
              onToggle={toggleSection}
              icon={Zap}
              badge="Brand Colors and Sequence"
            >
                  <div className="bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-3xl p-6 mt-2">
                  
                    <h5 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 ml-1">Visual Appearance Overrides</h5>
                    <div className="grid grid-cols-2 gap-4">
                      {['brandColor', 'backgroundColor', 'pageSequence'].map((key) => (
                        <div key={key} className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm transition-all hover:border-blue-200 group">
                          <input
                            type="checkbox"
                            className="h-5 w-5 text-blue-600 border-gray-300 rounded-lg focus:ring-blue-500 cursor-pointer"
                            checked={colorSettings[key]}
                            onChange={(e) => {
                              setColorSettings({ ...colorSettings, [key]: e.target.checked });
                            }}
                          />
                          <label className="text-[10px] font-black text-gray-600 uppercase tracking-tight cursor-pointer group-hover:text-blue-600 transition-colors">{key.replace(/([A-Z])/g, ' $1')}</label>
                        </div>
                      ))}
                    </div>
                  </div>

            </AccordionSection>

            {/* Field Management */}
            <AccordionSection
              title="Quote Field Management"
              section="fields"
              isOpen={openSections.fields}
              onToggle={toggleSection}
              icon={CheckCircle}
              badge="Enable/Disable specific quote fields"
            >
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
            </AccordionSection>

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
                                title="Download Quote PDF"
                                className="bg-blue-600 text-white p-1.5 rounded hover:bg-blue-700 transition-colors"
                                onClick={() => handleDownloadQuote(quote)}
                              >
                                <Download size={16} />
                              </button>
                              <button
                                title="Edit Quote"
                                className="bg-yellow-500 text-white p-1.5 rounded hover:bg-yellow-600 transition-colors"
                                onClick={() => handleEditQuote(quote)}
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                title="Delete Quote"
                                className="bg-red-500 text-white p-1.5 rounded hover:bg-red-600 transition-colors"
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
                    {selectedPages.includes('Front Page') && (
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
                    )}

                    {/* Customer Info Section */}
                    <div className="p-10 bg-white">
                      {/* Sub-header Title */}
                      <div className="mb-10 text-center">
                         <h2 className="text-xl font-black text-gray-800 uppercase tracking-tighter">
                            {filters.category} {filters.projectType} ({filters.subProjectType}) 
                            <span className="text-blue-600 ml-2">Proposal</span>
                         </h2>
                         <div className="w-20 h-1 bg-red-500 mx-auto mt-2" />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-6">
                          {fieldSettings.proposalNo && (
                            <div className="group transition-all">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 group-hover:text-blue-500">Proposal No</p>
                              <p className="text-sm font-black text-blue-600 border-b-2 border-transparent group-hover:border-blue-100 pb-1">
                                # QUA/{filters.category ? filters.category.substring(0, 3).toUpperCase() : 'PRD'}/
                                {states.find(s => s._id === selectedState)?.code || 'ST'}/
                                {(new Date().getFullYear()).toString().slice(-2)}/
                                {Math.floor(Math.random() * 900 + 100)}
                              </p>
                            </div>
                          )}
                          {fieldSettings.customerName && (
                            <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Name of Customer</p>
                              <p className="text-sm font-bold text-gray-700">Pradip Sharma</p>
                            </div>
                          )}
                          {fieldSettings.kwRequired && (
                            <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">KW Required</p>
                              <div className="flex items-center gap-3">
                                <p className="text-sm font-bold text-gray-700">{solarSettings.projectKW} KW</p>
                                {fieldSettings.paymentMode && (
                                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                    {paymentMode || 'Cash'}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-6">
                           {fieldSettings.residentialCommercial && (
                            <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Residential / Commercial</p>
                              <p className="text-sm font-bold text-gray-700">{filters.category} {filters.projectType} ({filters.subProjectType})</p>
                            </div>
                          )}
                          {fieldSettings.city && (
                            <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">City</p>
                              <p className="text-sm font-bold text-gray-700">
                                {selectedDistrict === 'all'
                                  ? 'All Districts'
                                  : districts.find(d => d._id === selectedDistrict)?.name || 'Rajkot'}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Footer Stats Section */}
                    <div className="grid grid-cols-3 border-t border-gray-100 bg-gray-50/50">
                      {fieldSettings.preparedBy && (
                        <div className="p-8 border-r border-gray-100">
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Prepared by</p>
                           <p className="text-xs font-black text-gray-700 uppercase">{partnerType || 'Demo'} User</p>
                        </div>
                      )}
                      {fieldSettings.date && (
                        <div className="p-8 border-r border-gray-100">
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Date</p>
                           <p className="text-xs font-black text-gray-700">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                      )}
                      {fieldSettings.validUpto && (
                        <div className="p-8">
                           <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Valid Upto</p>
                           <p className="text-xs font-black text-red-600 bg-red-100 px-3 py-1 rounded-full w-fit">10 Days</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Page 2: Commercial (Conditional) */}
                  {selectedPages.includes('Commercial Page') && (
                  <div className="mb-8 p-8 border-b border-gray-100 last:border-0">
                     <div className="flex justify-between items-center mb-6 border-b-4 border-red-500 pb-2">
                        <div>
                           <h5 className="text-xl font-black text-blue-700 uppercase tracking-tighter">{quoteType || 'Quote Type'}</h5>
                           <p className="text-xs font-bold text-gray-500 uppercase">{kitType}</p>
                        </div>
                        {fieldSettings.kitType && (
                           <div className="bg-red-500 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                              {kitType}
                           </div>
                        )}
                     </div>

                        <div className="bg-white border-2 border-gray-100 rounded-[2.5rem] overflow-hidden shadow-2xl mx-auto max-w-xl w-full">
                           <table className="w-full border-collapse">
                             <tbody>
                               {[
                                 { key: 'showTotalCost', label: 'Total Cost', value: pricingData.totalCost },
                                 { key: 'showMnreSubsidy', label: 'Govt MNRE Subsidy', value: pricingData.mnreSubsidy },
                                 { key: 'showStateSubsidy', label: 'Govt State Subsidy', value: pricingData.stateSubsidy },
                                 { key: 'showAdditionalCharges', label: 'Additional Charges', value: pricingData.additionalCharges }
                               ].map((row, i) => (pageConfigs['Commercial Page']?.visibility?.[row.key] !== false) && (
                                 <tr key={i} className="border-b border-gray-100 last:border-0">
                                   <td className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{row.label}</td>
                                   <td className="p-4 text-sm font-black text-gray-700 text-right whitespace-nowrap leading-none">Rs. {row.value.toLocaleString()} /-</td>
                                 </tr>
                               ))}
                               {(pageConfigs['Commercial Page']?.visibility?.showNetCost !== false) && (
                                 <tr className="bg-blue-600 text-white">
                                   <td className="p-4 text-[11px] font-black uppercase tracking-widest">Net Cost</td>
                                   <td className="p-4 text-xl font-black text-right whitespace-nowrap leading-none">Rs. {pricingData.netCost.toLocaleString()} /-</td>
                                 </tr>
                               )}
                             </tbody>
                           </table>
                        </div>

                        {/* Package Image Below Pricing */}
                        <div className="text-center flex flex-col items-center mt-10 animate-in fade-in slide-in-from-top-4">
                           <div className="relative group">
                              <div className="absolute inset-0 bg-blue-100 rounded-full blur-3xl opacity-30 group-hover:opacity-60 transition-all" />
                              <img
                                src={packageImage || "https://img.icons8.com/illustrations/external-flaticons-lineal-color-flat-icons/256/external-solar-energy-ecology-flaticons-lineal-color-flat-icons-2.png"} 
                                alt=""
                                className="w-64 h-64 object-contain relative z-10 animate-fade-in"
                              />
                           </div>
                        </div>

                        {/* Live: Custom Sections from PageConfigDrawer */}
                        {(() => {
                          const commercialCfg = pageConfigs['Commercial Page'] || {};
                          const customSections = (commercialCfg.customSections || []).filter(
                            s => (commercialCfg.visibility || {})[`custom_${s.id}`] !== false
                          );
                          if (customSections.length === 0) return null;
                          return (
                            <div className="mt-8 space-y-3">
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 text-center">Additional Sections</p>
                              {customSections.map((s) => (
                                <div key={s.id} className="bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                                  <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                                  <span className="text-xs font-black text-gray-600 uppercase tracking-widest">{s.label}</span>
                                  <div className="flex-1 h-px bg-gray-200" />
                                  <span className="text-[9px] font-black text-blue-400 bg-blue-50 px-2 py-0.5 rounded-full">Custom</span>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                  </div>
                  )}

                  {/* Page 3: BOM (Conditional) */}
                  {selectedPages.includes('Financial Summary') && (
                    <div className="bg-white border-2 border-gray-100 rounded-[2rem] overflow-hidden shadow-xl mb-8">
                       <div className="bg-blue-600 px-8 py-4 text-white">
                          <h5 className="text-lg font-black uppercase tracking-tighter">Residential Solar BOM</h5>
                       </div>
                       <div className="p-8">
                           {(pageConfigs['Financial Summary']?.visibility?.showBomTable !== false) && (
                             <table className="w-full border-collapse mb-8">
                            <tbody>
                              {bomData.items.map((row, i) => (
                                <tr key={i} className="border-b border-gray-100">
                                  <td className="py-3 text-[11px] font-black text-gray-400 uppercase tracking-widest">{row.label}</td>
                                  <td className="py-3 text-sm font-bold text-gray-700 text-right">{row.value}</td>
                                </tr>
                              ))}
                            </tbody>
                           </table>
                           )}

                           {(pageConfigs['Financial Summary']?.visibility?.showPipesTable !== false) && (
                           <div className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 mb-6">
                              <table className="w-full text-[10px] text-center">
                                 <thead className="bg-blue-500 text-white">
                                    <tr>
                                       <th className="py-2 px-1 font-black uppercase border-r border-blue-400">No. of Solar Panels</th>
                                       <th className="py-2 px-1 font-black uppercase border-r border-blue-400">DC K.W.</th>
                                       <th className="py-2 px-1 font-black uppercase border-r border-blue-400">GI pipe 2 mm 60x40</th>
                                       <th className="py-2 px-1 font-black uppercase">GI pipe 2 mm 40x40</th>
                                    </tr>
                                 </thead>
                                 <tbody className="font-bold text-gray-600">
                                    {bomData.pipes.map((pipe, i) => (
                                       <tr key={i} className={`border-b border-gray-100 ${i % 2 === 0 ? '' : 'bg-white'}`}>
                                          <td className="py-2 border-r border-gray-100">{pipe.panels}</td>
                                          <td className="py-2 border-r border-gray-100">{pipe.kw}</td>
                                          <td className="py-2 border-r border-gray-100">{pipe.size1}</td>
                                          <td className="py-2">{pipe.size2}</td>
                                       </tr>
                                    ))}
                                 </tbody>
                              </table>
                           </div>
                           )}

                           <p className="text-[9px] font-bold text-gray-400 italic mb-8">
                             <span className="text-red-500 font-black">*</span> {bomData.heightNote}
                           </p>

                           <div className="grid grid-cols-2 gap-8">
                              {(pageConfigs['Financial Summary']?.visibility?.showNotes !== false) && (
                              <div>
                                 <h6 className="text-[10px] font-black text-gray-800 uppercase tracking-widest mb-3 border-b-2 border-blue-600 pb-1 w-fit">Notes</h6>
                                 <ul className="space-y-1.5">
                                    {[
                                      'Bi-directional meter charges as per GUVNL.',
                                      'Extra DISCOM quotation charges to be paid by customer.',
                                      'Civil work at site is customer\'s responsibility.',
                                      '25-year linear performance warranty in solar panel.'
                                    ].map((note, i) => (
                                      <li key={i} className="text-[9px] font-bold text-gray-500 flex items-start gap-1.5">
                                         <div className="w-1 h-1 bg-blue-500 rounded-full mt-1 shrink-0" />
                                         {note}
                                      </li>
                                    ))}
                                 </ul>
                              </div>
                              )}
                              {(pageConfigs['Financial Summary']?.visibility?.showDocuments !== false) && (
                              <div>
                                 <h6 className="text-[10px] font-black text-gray-800 uppercase tracking-widest mb-3 border-b-2 border-blue-600 pb-1 w-fit">Documents Required</h6>
                                 <ul className="space-y-1.5">
                                    {[
                                      'Electricity Bill - Latest',
                                      'House Location from Google Map',
                                      'Cancelled Cheque / Passbook First Page',
                                      'Email ID',
                                      'Aadhaar Card',
                                      'PAN Card (if Loan)'
                                    ].map((doc, i) => (
                                      <li key={i} className="text-[9px] font-bold text-gray-500 flex items-start gap-1.5">
                                         <div className="w-1 h-1 bg-emerald-500 rounded-full mt-1 shrink-0" />
                                         {doc}
                                      </li>
                                    ))}
                                 </ul>
                              </div>
                              )}
                           </div>
                       </div>
                    </div>
                  )}

                  {/* Page 4: Generation Graph and ROI Chart (Conditional) */}
                  {selectedPages.includes('Generation Graph') && (
                    <div className="bg-white border-2 border-gray-100 rounded-[2rem] overflow-hidden shadow-xl mb-8">
                       <div className="bg-gradient-to-r from-blue-700 to-blue-500 px-8 py-6 text-white text-center">
                          <h3 className="text-2xl font-black uppercase tracking-tighter">Performance Analysis</h3>
                          <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Projected Energy Generation & Financial Benefits</p>
                       </div>
                       
                       <div className="p-8">
                          {(pageConfigs['Generation Graph']?.visibility?.showGenChart !== false) && (
                          <div className="mb-10">
                            <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Monthly Generation (Units)</h5>
                            <div className="h-64 w-full bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-4">
                              <canvas id="generationChart" />
                            </div>
                          </div>
                          )}

                          {(pageConfigs['Generation Graph']?.visibility?.showRoiChart !== false) && (
                          <div className="mb-10">
                            <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">ROI Analysis (Payback Period)</h5>
                            <div className="h-64 w-full bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-4">
                              <canvas id="roiChart" />
                            </div>
                          </div>
                          )}

                          <div className="grid grid-cols-2 gap-4">
                             {[
                               { label: 'Total System Cost', value: `Rs. ${pricingData.totalCost.toLocaleString()} /-`, color: 'blue' },
                               { label: 'Annual Savings', value: `Rs. ${annualSavings.toLocaleString()} /-`, color: 'emerald' },
                               { label: 'Payback Period', value: `${paybackPeriod.toFixed(1)} Years`, color: 'amber' },
                               { label: '25-Year Savings', value: `Rs. ${savings25Year.toLocaleString()} /-`, color: 'blue', full: true }
                             ].map((stat, i) => (
                               <div key={i} className={`${stat.full ? 'col-span-2' : ''} p-5 rounded-2xl border border-gray-100 ${stat.color === 'blue' ? 'bg-blue-50/50' : stat.color === 'emerald' ? 'bg-emerald-50/50' : 'bg-amber-50/50'} shadow-sm hover:scale-[1.02] transition-transform`}>
                                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                  <p className={`text-lg font-black ${stat.color === 'blue' ? 'text-blue-700' : stat.color === 'emerald' ? 'text-emerald-700' : 'text-amber-700'}`}>{stat.value}</p>
                               </div>
                             ))}
                             <div className="col-span-2 bg-blue-600 p-6 rounded-2xl shadow-xl shadow-blue-100 flex flex-col justify-center items-center text-center mt-2">
                                <p className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-1">Total Estimated ROI Benefits</p>
                                <p className="text-xl font-black text-white uppercase tracking-tighter">Over 25 Year Lifecycle</p>
                             </div>
                          </div>
                       </div>
                    </div>
                  )}

                  {/* Page 5: Advanced Options (Conditional) */}
                  {selectedPages.includes('Advanced Settings') && (
                    <div className="bg-white border-2 border-gray-100 rounded-[2rem] overflow-hidden shadow-xl mb-8">
                       <div className="bg-gray-800 px-8 py-5 text-white">
                          <h3 className="text-xl font-black uppercase tracking-tighter">Advanced Options</h3>
                       </div>
                       
                       <div className="p-8">
                          <div className="mb-8">
                            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                               <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-ping" />
                               Selected Options Breakout
                            </label>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {advancedOptions.filter(opt => opt.enabled).map((opt, idx) => (
                                  <div key={opt.key || idx} className="p-5 bg-gray-50 rounded-2xl border border-gray-100 relative overflow-hidden group">
                                     <div className={`absolute top-0 right-0 ${idx % 3 === 0 ? 'bg-blue-600' : idx % 3 === 1 ? 'bg-emerald-600' : 'bg-indigo-600'} text-white text-[8px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest`}>
                                        {idx % 3 === 0 ? 'Premium' : idx % 3 === 1 ? 'Protection' : 'Add-on'}
                                     </div>
                                     <h6 className="text-[11px] font-black text-gray-800 uppercase mb-2">{opt.type}</h6>
                                     <p className={`text-[10px] font-black ${idx % 3 === 0 ? 'text-blue-600' : idx % 3 === 1 ? 'text-emerald-600' : 'text-indigo-600'} mb-3`}>₹{opt.price.toLocaleString()}{opt.key !== 'cleaningKit' ? '/year' : ''}</p>
                                     <p className="text-[9px] font-bold text-gray-500 leading-relaxed uppercase">
                                        {opt.description}
                                     </p>
                                  </div>
                                ))}
                                {advancedOptions.every(v => !v.enabled) && (
                                  <div className="col-span-2 p-10 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No Advanced Options Selected</p>
                                  </div>
                                )}
                             </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 pt-6 border-t border-gray-100">
                             {advancedOptions.map((opt, idx) => (
                               <div key={opt.key || idx} className={`flex flex-col items-center text-center p-4 rounded-2xl transition-all ${opt.enabled ? 'bg-blue-50/50 shadow-inner' : 'bg-gray-50 opacity-40 grayscale'}`}>
                                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">{opt.key?.toUpperCase() || 'SERVICE'}</p>
                                  <div className="bg-white p-2 rounded-lg mb-2 shadow-sm">
                                     {idx % 3 === 0 ? <Settings size={16} className="text-indigo-600" /> : idx % 3 === 1 ? <Shield size={16} className="text-emerald-600" /> : <Zap size={16} className="text-blue-600" />}
                                  </div>
                                  <p className="text-[10px] font-black text-gray-700 uppercase">{opt.type}</p>
                                  <p className={`text-[9px] font-bold ${idx % 3 === 0 ? 'text-indigo-600' : idx % 3 === 1 ? 'text-emerald-600' : 'text-blue-600'}`}>
                                     ₹{opt.price.toLocaleString()}{opt.key !== 'cleaningKit' ? '/YR' : ''}
                                  </p>
                               </div>
                             ))}
                          </div>

                          <div className="bg-gray-900 rounded-3xl p-8 flex flex-col gap-4 shadow-2xl shadow-gray-200">
                             <div className="flex justify-between items-center text-white/60">
                                <span className="text-[10px] font-black uppercase tracking-widest">Solar System Cost</span>
                                <span className="text-sm font-bold tracking-tighter text-white">Rs. {pricingData.totalCost.toLocaleString()} /-</span>
                             </div>
                             <div className="flex justify-between items-center text-white/60 border-b border-white/10 pb-4">
                                <span className="text-[10px] font-black uppercase tracking-widest">Advanced Options Total</span>
                                <span className="text-sm font-bold tracking-tighter text-blue-400">Rs. {advancedTotal.toLocaleString()} /-</span>
                             </div>
                             <div className="flex justify-between items-center">
                                <span className="text-xs font-black text-yellow-500 uppercase tracking-tighter">Grand Total</span>
                                <span className="text-2xl font-black text-white tracking-widest">Rs. {(pricingData.totalCost + advancedTotal).toLocaleString()} /-</span>
                             </div>
                             <p className="text-[9px] font-bold text-center text-white/40 uppercase tracking-widest mt-2 border-t border-white/5 pt-4">All Prices are inclusive of GST and Govt Incentives</p>
                          </div>

                          {/* Dynamic Standard & Custom Sections for Advanced Pages */}
                          {(() => {
                            const advCfg = pageConfigs['Advanced Settings'] || {};
                            const vis = advCfg.visibility || {};
                            
                            const activeSections = [
                              ...(vis.showAccessories !== false ? [{ id: 'std_accessories', label: 'Inverter & Module Details' }] : []),
                              ...(vis.showEarthing !== false ? [{ id: 'std_earthing', label: 'Earthing & Protection' }] : []),
                              ...(vis.showInstallation !== false ? [{ id: 'std_installation', label: 'Installation Standard' }] : []),
                              ...(vis.showAMC !== false ? [{ id: 'std_amc', label: 'AMC / Maintenance Offer' }] : []),
                              ...(advCfg.customSections || []).filter(s => vis[`custom_${s.id}`] !== false)
                            ];

                            if (activeSections.length === 0) return null;
                            return (
                              <div className="mt-8 space-y-3">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 text-center">Sections Provided</p>
                                {activeSections.map((s) => (
                                  <div key={s.id} className="bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
                                     <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                                        <span className="text-xs font-black text-gray-700 uppercase tracking-widest">{s.label}</span>
                                     </div>
                                     <span className="text-[9px] font-black text-blue-500 uppercase bg-blue-50 px-2 py-0.5 rounded-full">Included</span>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                       </div>
                    </div>
                  )}

                  {/* Dynamic Custom Pages Preview */}
                  {selectedPages.filter(p => !['Front Page', 'Commercial Page', 'Generation Graph', 'Advanced Settings', 'Financial Summary'].includes(p)).map((pageName, idx) => (
                    <div key={idx} className="bg-white border-2 border-gray-100 rounded-[2rem] overflow-hidden shadow-xl mb-8">
                       <div className="bg-gray-100 px-8 py-5 border-b flex justify-between items-center">
                          <h3 className="text-xl font-black uppercase tracking-tighter text-gray-700">{pageName}</h3>
                          <div className="px-3 py-1 bg-yellow-400 text-black text-[9px] font-black uppercase rounded-full">Custom Page</div>
                       </div>
                       
                       <div className="p-8">
                          {pageConfigs[pageName]?.media && (
                             <div className="mb-6 h-48 w-full rounded-2xl overflow-hidden shadow-inner">
                                <img src={pageConfigs[pageName].media} className="w-full h-full object-cover" />
                             </div>
                          )}
                          <div className="space-y-4">
                             {pageConfigs[pageName]?.header && (
                                <h4 className="text-sm font-black text-blue-600 uppercase tracking-widest border-b pb-2">{pageConfigs[pageName].header}</h4>
                             )}
                             <p className="text-xs font-bold text-gray-600 leading-relaxed whitespace-pre-wrap">
                                {pageConfigs[pageName]?.content || 'This page was dynamically added to the quote. You can configure its content in the Settings panel above.'}
                             </p>
                             {pageConfigs[pageName]?.footer && (
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] pt-6 border-t">{pageConfigs[pageName].footer}</p>
                             )}

                             {/* Dynamic Custom Sections for Custom Page Preview */}
                             {(() => {
                               const thisCfg = pageConfigs[pageName] || {};
                               const customSections = (thisCfg.customSections || []).filter(
                                 s => (thisCfg.visibility || {})[`custom_${s.id}`] !== false
                               );
                               if (customSections.length === 0) return null;
                               return (
                                 <div className="mt-8 space-y-3">
                                   <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 text-center">Sections Provided</p>
                                   {customSections.map((s) => (
                                     <div key={s.id} className="bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                                       <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                                       <span className="text-xs font-black text-gray-600 uppercase tracking-widest">{s.label}</span>
                                       <div className="flex-1 h-px bg-gray-200" />
                                       <span className="text-[9px] font-black text-blue-400 bg-blue-50 px-2 py-0.5 rounded-full">Included</span>
                                     </div>
                                   ))}
                                 </div>
                               );
                             })()}
                          </div>
                       </div>
                    </div>
                  ))}
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
        filters={filters}
        quotes={quotes}
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
        onLiveChange={(config) => {
          setPageConfigs({ ...pageConfigs, [activeEditingPage.value]: config });
        }}
        quoteType={quoteType}
        advancedOptions={advancedOptions}
        setAdvancedOptions={setAdvancedOptions}
        dbAmcServices={dbAmcServices}
      />

      {/* Quote Download / Print Modal */}
      <QuoteDownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => { setIsDownloadModalOpen(false); setDownloadQuote(null); }}
        quote={downloadQuote}
      />
    </div>
  );
}

// Quote Download / PDF Print Modal
const QuoteDownloadModal = ({ isOpen, onClose, quote }) => {
  if (!isOpen || !quote) return null;


  const handlePrint = () => {
    const printArea = document.getElementById('quote-print-area');
    if (!printArea) return;

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      alert('Please allow popups for this site to download the PDF.');
      return;
    }

    // Collect all existing stylesheet links from the main document
    const styleLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .map(link => `<link rel="stylesheet" href="${link.href}" />`)
      .join('\n');
    const inlineStyles = Array.from(document.querySelectorAll('style'))
      .map(style => `<style>${style.innerHTML}</style>`)
      .join('\n');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Solar Quote — ${quote.category || ''} ${quote.projectType || ''}</title>
        ${styleLinks}
        ${inlineStyles}
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { background: white; margin: 0; padding: 24px; font-family: Inter, sans-serif; }
          @media print {
            body { padding: 0; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        ${printArea.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();

    // Wait for resources (images, fonts) to load before printing
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 800);
    };
  };


  const pages = quote.selectedPages || [];
  const pricing = {
    totalCost: quote.pricingData?.totalCost || 195008,
    mnreSubsidy: quote.pricingData?.mnreSubsidy || 78000,
    stateSubsidy: quote.pricingData?.stateSubsidy || 0,
    additionalCharges: quote.pricingData?.additionalCharges || 0,
    netCost: quote.pricingData?.netCost || 117008,
  };
  const bom = quote.bomData || { items: [], pipes: [], heightNote: '' };
  const fieldSettings = quote.fieldSettings || {};
  const pageConfigs = quote.pageConfigs || {};
  const advancedOptions = quote.advancedOptions || [];
  const solarSettings = quote.solarSettings || { projectKW: 10 };
  const advancedTotal = advancedOptions.reduce((acc, opt) => acc + (opt.enabled ? (opt.price || 0) : 0), 0);
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300 print:hidden-outer">
      {/* Top Utility Bar - hidden when printing */}
      <div className="fixed top-0 left-0 right-0 z-[210] bg-gray-900 px-8 py-3 flex items-center justify-between shadow-2xl print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-xl">
            <FileText size={18} className="text-white" />
          </div>
          <div>
            <h3 className="text-white text-sm font-black uppercase tracking-widest">Quote Preview</h3>
            <p className="text-gray-400 text-[9px] font-bold uppercase tracking-[0.2em]">
              {quote.category} · {quote.projectType} · {quote.partnerType}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-900/40 active:scale-95"
          >
            <Download size={15} />
            Download PDF
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all"
          >
            <Printer size={15} />
            Print
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-gray-400 hover:text-white hover:bg-gray-700 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all"
          >
            <X size={15} />
            Close
          </button>
        </div>
      </div>

      {/* Scrollable Print Area */}
      <div className="w-full max-w-4xl bg-gray-200 rounded-2xl overflow-y-auto mt-14 max-h-[88vh] shadow-2xl" id="quote-print-area">

        <div className="p-6 space-y-6">

          {/* ── FRONT PAGE ── */}
          {pages.includes('Front Page') && (
            <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 print:rounded-none print:shadow-none print:border-0 print:page-break-after-always">
              <div className="relative h-56 w-full">
                <img
                  src={pageConfigs['Front Page']?.media || "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"}
                  alt="Solar"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col items-center justify-center text-center px-6">
                  <h2 className="text-2xl font-black text-white mb-1 uppercase tracking-tighter drop-shadow-lg">
                    {pageConfigs['Front Page']?.header || `${quote.category || 'Residential'} ${quote.projectType || ''}`}
                  </h2>
                  <h3 className="text-xl font-black text-yellow-400 mb-2 uppercase tracking-wide">({quote.subProjectType || 'National Portal'})</h3>
                  <h4 className="text-3xl font-extrabold text-white mb-1 tracking-[0.2em]">PROPOSAL</h4>
                  <p className="text-xs font-bold text-gray-200 tracking-widest uppercase border-t border-gray-400/50 pt-2">
                    {pageConfigs['Front Page']?.footer || 'SOLAR ENERGY FOR A BETTER TOMORROW'}
                  </p>
                </div>
              </div>
              <div className="p-8">
                <div className="grid grid-cols-2 gap-8 mb-6">
                  <div className="space-y-4">
                    {fieldSettings.proposalNo && (
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Proposal No</p>
                        <p className="text-xs font-black text-blue-600"># QUA/{quote.category?.substring(0,3)?.toUpperCase() || 'PRD'}/{new Date().getFullYear().toString().slice(-2)}/001</p>
                      </div>
                    )}
                    {fieldSettings.customerName && (
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Customer Name</p>
                        <p className="text-xs font-bold text-gray-700">Pradip Sharma</p>
                      </div>
                    )}
                    {fieldSettings.kwRequired && (
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">KW Required</p>
                        <p className="text-xs font-bold text-gray-700">{solarSettings.projectKW} KW</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    {fieldSettings.residentialCommercial && (
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Category</p>
                        <p className="text-xs font-bold text-gray-700">{quote.category} {quote.projectType}</p>
                      </div>
                    )}
                    {fieldSettings.city && (
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">City</p>
                        <p className="text-xs font-bold text-gray-700">{quote.district?.name || 'Rajkot'}</p>
                      </div>
                    )}
                    {fieldSettings.quoteType && (
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Quote Type</p>
                        <p className="text-xs font-bold text-gray-700">{quote.quoteType}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 border-t border-gray-100 pt-4">
                  {fieldSettings.preparedBy && (
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Prepared By</p>
                      <p className="text-xs font-black text-gray-700 uppercase">{quote.partnerType || 'Demo'} User</p>
                    </div>
                  )}
                  {fieldSettings.date && (
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Date</p>
                      <p className="text-xs font-black text-gray-700">{today}</p>
                    </div>
                  )}
                  {fieldSettings.validUpto && (
                    <div>
                      <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-1">Valid Upto</p>
                      <p className="text-xs font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-full w-fit">10 Days</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── COMMERCIAL PAGE ── */}
          {pages.includes('Commercial Page') && (
            <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100 p-8 print:rounded-none print:shadow-none print:page-break-after-always">
              <div className="flex justify-between items-center mb-6 border-b-4 border-red-500 pb-2">
                <div>
                  <h5 className="text-xl font-black text-blue-700 uppercase tracking-tighter">{quote.quoteType}</h5>
                  <p className="text-xs font-bold text-gray-500 uppercase">{quote.kitType || 'Combo Kit'}</p>
                </div>
                {fieldSettings.kitType && (
                  <div className="bg-red-500 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase">{quote.kitType || 'Combo Kit'}</div>
                )}
              </div>
              <div className="bg-white border-2 border-gray-100 rounded-2xl overflow-hidden mx-auto max-w-md">
                <table className="w-full border-collapse">
                  <tbody>
                    {[
                      { key: 'showTotalCost', label: 'Total Cost', value: pricing.totalCost },
                      { key: 'showMnreSubsidy', label: 'Govt MNRE Subsidy', value: pricing.mnreSubsidy },
                      { key: 'showStateSubsidy', label: 'Govt State Subsidy', value: pricing.stateSubsidy },
                      { key: 'showAdditionalCharges', label: 'Additional Charges', value: pricing.additionalCharges },
                    ].map((row, i) => (pageConfigs['Commercial Page']?.visibility?.[row.key] !== false) && (
                      <tr key={i} className="border-b border-gray-50">
                        <td className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{row.label}</td>
                        <td className="p-4 text-sm font-black text-gray-700 text-right">Rs. {(row.value || 0).toLocaleString()} /-</td>
                      </tr>
                    ))}
                    {(pageConfigs['Commercial Page']?.visibility?.showNetCost !== false) && (
                      <tr className="bg-blue-600 text-white">
                        <td className="p-4 text-[11px] font-black uppercase tracking-widest">Net Cost</td>
                        <td className="p-4 text-xl font-black text-right">Rs. {pricing.netCost.toLocaleString()} /-</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Dynamic Custom Sections for PDF */}
              {(() => {
                const commercialCfg = pageConfigs['Commercial Page'] || {};
                const customSections = (commercialCfg.customSections || []).filter(
                  s => (commercialCfg.visibility || {})[`custom_${s.id}`] !== false
                );
                if (customSections.length === 0) return null;
                return (
                  <div className="mt-8 space-y-3 print:break-inside-avoid">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 text-center">Additional Sections</p>
                    {customSections.map((s) => (
                      <div key={s.id} className="border border-gray-200 rounded-xl px-6 py-4 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            <span className="text-xs font-black text-gray-700 uppercase tracking-widest">{s.label}</span>
                         </div>
                         <span className="text-[9px] font-black text-blue-500 uppercase">Included</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* ── BOM SURVEY SUMMARY ── */}
          {pages.includes('Financial Summary') && bom.items.length > 0 && (
            <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100 print:rounded-none print:shadow-none print:page-break-after-always">
              <div className="bg-blue-600 px-8 py-4 text-white">
                <h5 className="text-lg font-black uppercase tracking-tighter">Residential Solar BOM</h5>
              </div>
              <div className="p-8">
                <table className="w-full border-collapse mb-6">
                  <tbody>
                    {bom.items.map((row, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">{row.label}</td>
                        <td className="py-3 text-sm font-bold text-gray-700 text-right">{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {bom.heightNote && (
                  <p className="text-[9px] font-bold text-gray-400 italic mt-4">
                    <span className="text-red-500">*</span> {bom.heightNote}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── ADVANCED OPTIONS ── */}
          {pages.includes('Advanced Settings') && (
            <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100 print:rounded-none print:shadow-none print:page-break-after-always">
              <div className="bg-gray-800 px-8 py-4 text-white">
                <h3 className="text-lg font-black uppercase tracking-tighter">Advanced Options</h3>
              </div>
              <div className="p-8">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {advancedOptions.filter(opt => opt.enabled).map((opt, idx) => (
                    <div key={opt.key || idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <h6 className="text-[11px] font-black text-gray-800 uppercase mb-1">{opt.type}</h6>
                      <p className="text-[10px] font-black text-blue-600 mb-2">₹{(opt.price || 0).toLocaleString()}</p>
                      <p className="text-[9px] font-bold text-gray-500 leading-relaxed">{opt.description}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-gray-900 rounded-2xl p-6 flex flex-col gap-3">
                  <div className="flex justify-between items-center text-white/60 text-xs font-bold">
                    <span>Solar System Cost</span>
                    <span className="text-white">Rs. {pricing.totalCost.toLocaleString()} /-</span>
                  </div>
                  <div className="flex justify-between items-center text-white/60 text-xs font-bold border-b border-white/10 pb-3">
                    <span>Advanced Options Total</span>
                    <span className="text-blue-400">Rs. {advancedTotal.toLocaleString()} /-</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-yellow-500 uppercase">Grand Total</span>
                    <span className="text-xl font-black text-white">Rs. {(pricing.totalCost + advancedTotal).toLocaleString()} /-</span>
                  </div>
                </div>

                {/* Dynamic Standard & Custom Sections for Advanced Pages Download */}
                {(() => {
                  const advCfg = pageConfigs['Advanced Settings'] || {};
                  const vis = advCfg.visibility || {};
                  
                  const activeSections = [
                    ...(vis.showAccessories !== false ? [{ id: 'std_accessories', label: 'Inverter & Module Details' }] : []),
                    ...(vis.showEarthing !== false ? [{ id: 'std_earthing', label: 'Earthing & Protection' }] : []),
                    ...(vis.showInstallation !== false ? [{ id: 'std_installation', label: 'Installation Standard' }] : []),
                    ...(vis.showAMC !== false ? [{ id: 'std_amc', label: 'AMC / Maintenance Offer' }] : []),
                    ...(advCfg.customSections || []).filter(s => vis[`custom_${s.id}`] !== false)
                  ];

                  if (activeSections.length === 0) return null;
                  return (
                    <div className="mt-8 space-y-3 print:break-inside-avoid">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 text-center">Sections Provided</p>
                      {activeSections.map((s) => (
                        <div key={s.id} className="border border-gray-200 rounded-xl px-6 py-4 flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                              <span className="text-xs font-black text-gray-700 uppercase tracking-widest">{s.label}</span>
                           </div>
                           <span className="text-[9px] font-black text-blue-500 uppercase">Included</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}

              </div>
            </div>
          )}

          {/* ── CUSTOM PAGES ── */}
          {pages.filter(p => !['Front Page', 'Commercial Page', 'Generation Graph', 'Advanced Settings', 'Financial Summary'].includes(p)).map((pageName, idx) => (
            <div key={idx} className="bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100 print:rounded-none print:shadow-none print:page-break-after-always">
              <div className="bg-gray-100 px-8 py-4 flex justify-between items-center border-b">
                <h3 className="text-lg font-black uppercase tracking-tighter text-gray-700">{pageName}</h3>
                <div className="px-3 py-1 bg-yellow-400 text-black text-[9px] font-black uppercase rounded-full">Custom</div>
              </div>
              <div className="p-8">
                {pageConfigs[pageName]?.media && (
                  <img src={pageConfigs[pageName].media} className="w-full h-40 object-cover rounded-xl mb-6" alt="" />
                )}
                {pageConfigs[pageName]?.header && (
                  <h4 className="text-sm font-black text-blue-600 uppercase tracking-widest border-b pb-2 mb-4">{pageConfigs[pageName].header}</h4>
                )}
                <p className="text-xs font-bold text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {pageConfigs[pageName]?.content || 'Custom page content. Configure in Settings panel.'}
                </p>
                {pageConfigs[pageName]?.footer && (
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] pt-4 border-t mt-4">{pageConfigs[pageName].footer}</p>
                )}

                {/* Dynamic Custom Sections for Custom Page Download */}
                {(() => {
                  const thisCfg = pageConfigs[pageName] || {};
                  const customSections = (thisCfg.customSections || []).filter(
                    s => (thisCfg.visibility || {})[`custom_${s.id}`] !== false
                  );
                  if (customSections.length === 0) return null;
                  return (
                    <div className="mt-8 space-y-3 print:break-inside-avoid">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 text-center">Sections Provided</p>
                      {customSections.map((s) => (
                        <div key={s.id} className="border border-gray-200 rounded-xl px-6 py-4 flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-blue-500" />
                              <span className="text-xs font-black text-gray-700 uppercase tracking-widest">{s.label}</span>
                           </div>
                           <span className="text-[9px] font-black text-blue-500 uppercase">Included</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          ))}

          {pages.length === 0 && (
            <div className="bg-white rounded-3xl p-20 text-center shadow-xl border border-gray-100">
              <FileText size={48} className="mx-auto text-gray-200 mb-4" />
              <p className="text-sm font-black text-gray-400 uppercase tracking-widest">No pages selected for this quote</p>
              <p className="text-xs font-bold text-gray-300 mt-2">Go to Quote Layout &amp; Visuals to enable pages.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

// Sub-component for Front Page Settings (Localized state to fix "auto refresh" feel)
const FrontPageSettingsDrawer = ({ isOpen, onClose, initialSettings, onSave, filters, defaultFrontPageSettings, selectedState, selectedDistrict, states, districts, quoteCount, solarSettings, quotes }) => {
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
const PageConfigDrawer = ({ isOpen, onClose, activePage, initialConfig, onSave, onLiveChange, quoteType, advancedOptions, setAdvancedOptions, dbAmcServices }) => {
  const [config, setConfig] = React.useState(initialConfig);
  const [showAddInput, setShowAddInput] = React.useState(false);
  const [newSectionName, setNewSectionName] = React.useState('');
  const addInputRef = React.useRef(null);

  // Wrapper that updates local state AND fires live preview
  const updateConfig = (next) => {
    setConfig(next);
    if (onLiveChange) onLiveChange(next);
  };

  React.useEffect(() => {
    if (isOpen) {
      setConfig(initialConfig);
      setShowAddInput(false);
      setNewSectionName('');
    }
  }, [isOpen, initialConfig]);

  React.useEffect(() => {
    if (showAddInput && addInputRef.current) addInputRef.current.focus();
  }, [showAddInput]);

  if (!isOpen) return null;

  const pageType = activePage?.value;

  const builtInItemsMap = {
    'Commercial Page': [
      { key: 'showTotalCost',         label: 'Total Cost' },
      { key: 'showMnreSubsidy',       label: 'Govt MNRE Subsidy' },
      { key: 'showStateSubsidy',      label: 'Govt State Subsidy' },
      { key: 'showAdditionalCharges', label: 'Additional Charges' },
      { key: 'showNetCost',           label: 'Net Cost' },
    ],
    'Advanced Settings': [
      { key: 'showAddonsGrid',        label: 'Add-ons Price Grid' },
      { key: 'showAddonsList',        label: 'Add-ons Summary List' },
      { key: 'showAddonsTotal',       label: 'Add-ons Total Costing' },
      { key: 'showAccessories',       label: 'Inverter & Module Details' },
      { key: 'showEarthing',          label: 'Earthing & Protection' },
      { key: 'showInstallation',      label: 'Installation Standard' },
      { key: 'showAMC',               label: 'AMC / Maintenance Offer' },
    ],
    'Generation Graph': [
      { key: 'showGenChart',          label: 'Monthly Generation Chart' },
      { key: 'showRoiChart',          label: 'ROI Payback Chart' },
      { key: 'showStatsTable',        label: 'Performance Stats Table' },
      { key: 'showRoiBanner',         label: 'Total ROI Benefit Banner' },
    ],
    'Financial Summary': [
      { key: 'showBomTable',          label: 'Solar BOM Table' },
      { key: 'showPipesTable',        label: 'Structure GI Pipes Table' },
      { key: 'showNotes',             label: 'Important Notes' },
      { key: 'showDocuments',         label: 'Documents Required' },
    ]
  };

  const builtInItems = builtInItemsMap[pageType] || [];
  const customSections = config.customSections || [];

  const toggleItem = (key) => {
    const current = (config.visibility || {})[key] !== false;
    updateConfig({ ...config, visibility: { ...config.visibility, [key]: !current } });
  };

  const addCustomSection = () => {
    const trimmed = newSectionName.trim();
    if (!trimmed) return;
    const id = `cs_${Date.now()}`;
    updateConfig({
      ...config,
      customSections: [...customSections, { id, label: trimmed }],
      visibility: { ...config.visibility, [`custom_${id}`]: true },
    });
    setNewSectionName('');
    setShowAddInput(false);
  };

  const removeCustomSection = (id) => {
    const updatedVisibility = { ...config.visibility };
    delete updatedVisibility[`custom_${id}`];
    updateConfig({
      ...config,
      customSections: customSections.filter((s) => s.id !== id),
      visibility: updatedVisibility,
    });
  };

  const ToggleRow = ({ itemKey, label, isCustom = false, customId = null }) => {
    const checked = (config.visibility || {})[itemKey] !== false;
    return (
      <div className={`flex items-center justify-between px-5 py-3.5 rounded-xl transition-all duration-200 border-2 group ${checked ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-gray-50 border-transparent hover:border-gray-100'}`}>
        <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer" onClick={() => toggleItem(itemKey)}>
          <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors ${checked ? 'bg-blue-500' : 'bg-gray-300'}`} />
          <span className={`text-[12px] font-bold transition-colors truncate ${checked ? 'text-blue-800' : 'text-gray-500'}`}>{label}</span>
          {isCustom && (
            <span className="text-[8px] font-black uppercase tracking-widest text-blue-400 bg-blue-100 px-2 py-0.5 rounded-full flex-shrink-0">Custom</span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div onClick={() => toggleItem(itemKey)} className={`relative w-11 h-6 rounded-full cursor-pointer transition-all duration-300 ${checked ? 'bg-blue-600 shadow-md shadow-blue-200' : 'bg-gray-200'}`}>
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${checked ? 'left-6' : 'left-1'}`} />
          </div>
          {isCustom && customId && (
            <button
              onClick={() => removeCustomSection(customId)}
              className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all p-1 rounded-lg hover:bg-red-50 ml-0.5"
              title="Remove section"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col" style={{ maxHeight: '90vh' }}>

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-600 px-7 py-5 flex justify-between items-center flex-shrink-0">
          <div>
            <h3 className="text-white text-base font-black uppercase tracking-tight flex items-center gap-2">
              <Settings size={17} />
              Configure: {activePage?.label}
            </h3>
            <p className="text-blue-200 text-[9px] font-bold uppercase tracking-widest mt-0.5 opacity-80">
              Choose which sections appear on this page
            </p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white hover:bg-white/15 p-2 rounded-xl transition-all">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">


          {pageType === 'Advanced Settings' && advancedOptions && setAdvancedOptions && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.18em]">Service & Add-On Pricing</p>
              </div>
              <div className="space-y-4">
                {advancedOptions.map((opt, idx) => (
                  <div key={opt.key || idx} className={`p-4 rounded-xl border-2 transition-all ${opt.enabled ? 'border-blue-100 bg-blue-50/30' : 'border-gray-50 bg-white opacity-80'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                          checked={opt.enabled}
                          onChange={(e) => {
                            const newOpts = [...advancedOptions];
                            newOpts[idx].enabled = e.target.checked;
                            setAdvancedOptions(newOpts);
                          }}
                        />
                        <span className="text-[11px] font-black text-gray-800 uppercase tracking-tight">{opt.key?.toUpperCase() || 'CUSTOM'} Service</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {opt.enabled && <span className="text-[8px] font-black text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full uppercase">Active</span>}
                        <button onClick={() => setAdvancedOptions(advancedOptions.filter((_, i) => i !== idx))} className="text-gray-300 hover:text-red-500 transition-colors">
                           <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                        </button>
                      </div>
                    </div>
                    {opt.enabled && (
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        <div className="col-span-2">
                          <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Plan Title</label>
                          {opt.key === 'amc' ? (
                            <select 
                              className="w-full bg-white border border-gray-100 rounded-lg px-3 py-2 text-[10px] font-bold text-gray-700 outline-none focus:border-blue-300 transition-all focus:ring-2 focus:ring-blue-100 cursor-pointer"
                              value={opt.type}
                              onChange={(e) => {
                                const selectedName = e.target.value;
                                const amc = (dbAmcServices || []).find(s => s.serviceName === selectedName);
                                const newOpts = [...advancedOptions];
                                newOpts[idx].type = selectedName;
                                if (amc) {
                                  newOpts[idx].price = Number(amc.basePrice || 0);
                                  newOpts[idx].description = amc.description || amc.serviceDescription || '';
                                }
                                setAdvancedOptions(newOpts);
                              }}
                            >
                              <option value="">Select an AMC Service...</option>
                              {/* Add current selection if not in DB to avoid empty display */}
                              {opt.type && !(dbAmcServices || []).some(s => s.serviceName === opt.type) && (
                                <option value={opt.type}>{opt.type} (Default)</option>
                              )}
                              {(dbAmcServices || []).map(service => (
                                <option key={service._id} value={service.serviceName}>
                                  {service.serviceName} - ₹{service.basePrice || 0}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input type="text" className="w-full bg-white border border-gray-100 rounded-lg px-3 py-2 text-[10px] font-bold text-gray-700 outline-none focus:border-blue-300 transition-all focus:ring-2 focus:ring-blue-100" value={opt.type} onChange={(e) => { const newOpts = [...advancedOptions]; newOpts[idx].type = e.target.value; setAdvancedOptions(newOpts); }} />
                          )}
                        </div>
                        <div className="col-span-2 md:col-span-1">
                          <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Price (₹)</label>
                          <input type="number" className="w-full bg-white border border-gray-100 rounded-lg px-3 py-2 text-[10px] font-bold text-blue-600 outline-none focus:border-blue-300 transition-all focus:ring-2 focus:ring-blue-100" value={opt.price} onChange={(e) => { const newOpts = [...advancedOptions]; newOpts[idx].price = parseFloat(e.target.value) || 0; setAdvancedOptions(newOpts); }} />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Description / Notes</label>
                          <textarea className="w-full bg-white border border-gray-100 rounded-lg px-3 py-2 text-[9px] font-bold text-gray-500 outline-none focus:border-blue-300 transition-all h-12 resize-none focus:ring-2 focus:ring-blue-100" value={opt.description} onChange={(e) => { const newOpts = [...advancedOptions]; newOpts[idx].description = e.target.value; setAdvancedOptions(newOpts); }} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section header row */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.18em]">Visible Sections</p>
            <button
              onClick={() => { setShowAddInput(!showAddInput); setNewSectionName(''); }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                showAddInput ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200 active:scale-95'
              }`}
            >
              {showAddInput
                ? <><X size={10} /> Cancel</>
                : <><span className="text-sm leading-none">+</span> Add New Section</>
              }
            </button>
          </div>

          {/* Inline add input */}
          {showAddInput && (
            <div className="mb-4 flex gap-2">
              <input
                ref={addInputRef}
                type="text"
                value={newSectionName}
                maxLength={50}
                onChange={(e) => setNewSectionName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addCustomSection();
                  if (e.key === 'Escape') { setShowAddInput(false); setNewSectionName(''); }
                }}
                placeholder="e.g. Delivery Timeline, Installation Process..."
                className="flex-1 bg-blue-50 border-2 border-blue-200 rounded-xl px-4 py-2.5 text-xs font-bold text-blue-800 placeholder:text-blue-300 focus:outline-none focus:border-blue-500 transition-all"
              />
              <button
                onClick={addCustomSection}
                disabled={!newSectionName.trim()}
                className="bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wide hover:bg-blue-700 transition-all active:scale-95 flex-shrink-0"
              >
                Add
              </button>
            </div>
          )}

          {/* All section rows */}
          <div className="space-y-2">
            {builtInItems.map((item) => (
              <ToggleRow key={item.key} itemKey={item.key} label={item.label} />
            ))}

            {customSections.length > 0 && builtInItems.length > 0 && (
              <div className="flex items-center gap-3 py-2">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Custom Sections</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
            )}

            {customSections.map((s) => (
              <ToggleRow key={`custom_${s.id}`} itemKey={`custom_${s.id}`} label={s.label} isCustom customId={s.id} />
            ))}

            {builtInItems.length === 0 && customSections.length === 0 && (
              <div className="text-center py-10">
                <Settings size={32} className="mx-auto text-gray-200 mb-3" />
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No sections yet</p>
                <p className="text-[10px] font-bold text-gray-300 mt-1">Click "Add New Section" above to start</p>
              </div>
            )}
          </div>

          {builtInItems.length > 0 && customSections.length === 0 && !showAddInput && (
            <p className="text-center text-[9px] font-bold text-gray-300 uppercase tracking-widest mt-5">
              Use "+ Add New Section" to add custom sections
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex gap-3 justify-end border-t border-gray-100 bg-gray-50 flex-shrink-0">
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-xs font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-all hover:bg-gray-100">
            Cancel
          </button>
          <button
            onClick={() => { onSave(config); onClose(); }}
            className="bg-blue-600 text-white px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-200 active:scale-95 transition-all"
          >
            Apply Config
          </button>
        </div>

      </div>
    </div>
  );
};
