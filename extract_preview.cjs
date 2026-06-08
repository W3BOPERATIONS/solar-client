const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'src', 'admin', 'pages', 'settings', 'quote', 'QuoteSetting.jsx');
const destPath = path.join(__dirname, 'src', 'franchisee', 'pages', 'projectSignup', 'FranchiseeQuotePreview.jsx');

const src = fs.readFileSync(srcPath, 'utf8');
const lines = src.split('\n');

// Find start and end of Quote Preview
let startIndex = -1;
let endIndex = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('pagesOptions.filter(p => selectedPages.includes(p.value)).map((page, idx) => {')) {
        startIndex = i;
    }
    // We know from previous commands it ends around line 5195
}
endIndex = 5194;

const chunk = lines.slice(startIndex, endIndex).join('\n');

const componentCode = `import React, { useRef, useEffect } from 'react';
import Chart from 'chart.js/auto';
import { Download } from 'lucide-react';

const FranchiseeQuotePreview = ({ adminQuoteConfig, systemConfig, pricing, selectedProducts }) => {
    // Refs for charts
    const generationChartRef = useRef(null);
    const roiChartRef = useRef(null);
    const generationChartInstance = useRef(null);
    const roiChartInstance = useRef(null);

    // Extract variables from config with fallbacks
    const config = adminQuoteConfig || {};
    const themeAccent = config.colorSettings?.accent || '#EAB308';
    const themeBgColor = config.colorSettings?.background || '#FFFFFF';
    const themeBgLight = config.colorSettings?.bgLight || '#FEF9C3';
    const themeBgSemi = config.colorSettings?.bgSemi || '#FEF08A';
    const themeBgFaint = config.colorSettings?.bgFaint || '#FEFCE8';
    const themeBgStrong = config.colorSettings?.bgStrong || '#FACC15';
    const headerFontSize = config.fontSettings?.header || '32px';
    const footerFontSize = config.fontSettings?.footer || '12px';
    const sectionTitleFontSize = config.fontSettings?.sectionTitle || '24px';
    const contentFontSize = config.fontSettings?.content || '14px';
    
    const pageConfigs = config.pageConfigs || {};
    const selectedPages = config.selectedPages || ['Front Page', 'Proposal Details', 'System Details', 'Financial ROI', 'Technical BOM', 'T&C'];
    const pagesOptions = [
        { id: '1', value: 'Front Page', label: 'Front Page' },
        { id: '2', value: 'Proposal Details', label: 'Proposal Details' },
        { id: '3', value: 'System Details', label: 'System Details' },
        { id: '4', value: 'Financial ROI', label: 'Financial ROI' },
        { id: '5', value: 'Technical BOM', label: 'Technical BOM' },
        { id: '6', value: 'T&C', label: 'Terms & Conditions' }
    ];

    // Map systemConfig to filters to match Admin structure
    const filters = {
        category: systemConfig.category || 'Residential',
        projectType: systemConfig.projectType || '3 To 10 KW',
        subProjectType: systemConfig.subProjectType || 'National Portal',
        subProjectTypes: [systemConfig.subProjectType || 'National Portal']
    };

    const fieldSettings = config.fieldSettings || {
        proposalNo: true,
        customerName: true,
        city: true,
        kwRequired: true,
        preparedBy: true,
        date: true,
        validUpto: true
    };

    const solarSettings = config.solarSettings || { projectKW: parseInt(systemConfig.systemCapacity) || 5 };
    const monthlyIsolation = config.monthlyIsolation || [];
    const annualTotal = monthlyIsolation.reduce((sum, item) => sum + (item.units || 0), 0) || 7200;
    
    const pricingData = config.pricingData || {};
    const unitPrice = config.unitPrice || 8;
    const inflationRate = config.inflationRate || 5;
    const degradationRate = config.degradationRate || 1;
    
    const bomData = config.bomData || { items: [], pipes: [], heightNote: '' };
    const packageImage = config.packageImage || '';
    const kitTypesSelected = config.kitTypesSelected || [];
    const paymentModesSelected = config.paymentModesSelected || [];
    const advancedOptions = config.advancedOptions || [];

    // Setup Charts exactly like QuoteSetting.jsx
    useEffect(() => {
        if (!monthlyIsolation || monthlyIsolation.length === 0) return;

        // Generation Chart
        if (generationChartRef.current) {
            const generationCtx = generationChartRef.current.getContext('2d');
            if (generationChartInstance.current) {
                generationChartInstance.current.destroy();
            }
            generationChartInstance.current = new Chart(generationCtx, {
                type: 'bar',
                data: {
                    labels: monthlyIsolation.map(item => item.month),
                    datasets: [{
                        label: 'Generation (kWh)',
                        data: monthlyIsolation.map(item => item.units),
                        backgroundColor: themeAccent,
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, grid: { display: false } },
                        x: { grid: { display: false } }
                    }
                }
            });
        }

        // ROI Chart
        if (roiChartRef.current) {
            const roiCtx = roiChartRef.current.getContext('2d');
            if (roiChartInstance.current) {
                roiChartInstance.current.destroy();
            }
            
            const currentTotalCost = pricingData.totalCost || 250000;
            const years = Array.from({ length: 25 }, (_, i) => \`Year \${i + 1}\`);
            const cumulativeSavings = [];
            let currentSavings = 0;
            
            for (let i = 0; i < 25; i++) {
                const yearGeneration = annualTotal * Math.pow(1 - (degradationRate / 100), i);
                const yearUnitPrice = unitPrice * Math.pow(1 + (inflationRate / 100), i);
                const yearSavings = yearGeneration * yearUnitPrice;
                currentSavings += yearSavings;
                cumulativeSavings.push(Math.round(currentSavings));
            }

            roiChartInstance.current = new Chart(roiCtx, {
                type: 'line',
                data: {
                    labels: years,
                    datasets: [
                        {
                            label: 'Cumulative Savings',
                            data: cumulativeSavings,
                            borderColor: themeAccent,
                            backgroundColor: themeAccent + '20',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.4
                        },
                        {
                            label: 'System Cost',
                            data: Array(25).fill(currentTotalCost),
                            borderColor: '#EF4444',
                            borderWidth: 2,
                            borderDash: [5, 5],
                            fill: false,
                            pointRadius: 0
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'top', labels: { boxWidth: 12, usePointStyle: true } }
                    },
                    scales: {
                        y: { beginAtZero: true, grid: { borderDash: [2, 2] } },
                        x: { grid: { display: false }, ticks: { maxTicksLimit: 5 } }
                    }
                }
            });
        }

        return () => {
            if (generationChartInstance.current) generationChartInstance.current.destroy();
            if (roiChartInstance.current) roiChartInstance.current.destroy();
        };
    }, [monthlyIsolation, themeAccent, annualTotal, pricingData.totalCost, unitPrice, inflationRate, degradationRate]);

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden sticky top-4">
            <div className="bg-gray-50 px-6 py-4 font-bold border-b">
                <span>Quote Preview</span>
            </div>
            <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 140px)' }}>
                <div className="transform scale-90 origin-top">
                    ${chunk}
                </div>
            </div>
        </div>
    );
};

export default FranchiseeQuotePreview;
`;

fs.writeFileSync(destPath, componentCode);
console.log('Successfully created FranchiseeQuotePreview.jsx');
