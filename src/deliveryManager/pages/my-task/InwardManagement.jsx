import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Download, Coffee, X, Upload, FileText, Check } from 'lucide-react';

export default function InwardManagement() {
  const navigate = useNavigate();
  const [inwardData, setInwardData] = useState([]);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [selectedInwardRow, setSelectedInwardRow] = useState(null);
  const [inputOrderNo, setInputOrderNo] = useState('');
  const [inputPurchaseNo, setInputPurchaseNo] = useState('');
  const [selectedInvoiceFile, setSelectedInvoiceFile] = useState(null);
  const [invoiceAmountInput, setInvoiceAmountInput] = useState('');

  React.useEffect(() => {
    const syncExistingCompletedPayments = () => {
      try {
        const completed = JSON.parse(localStorage.getItem('completedVendorPayments') || '[]');
        const generated = JSON.parse(localStorage.getItem('generatedVendorPayments') || '[]');
        let inwardStorage = JSON.parse(localStorage.getItem('inwardOrdersData') || '[]');
        let updatedCompleted = [...completed];
        let completedUpdated = false;
        let inwardUpdated = false;

        completed.forEach((c, index) => {
          const existsInInward = inwardStorage.some(item => item.orderNo === c.orderId);
          if (!existsInInward) {
            const o = generated.find(g => g.id === c.orderId);
            let procNum = c.procurementNo;
            if (!procNum) {
              procNum = 'PROC-' + c.orderId + '-' + Math.floor(100 + Math.random() * 900);
              updatedCompleted[index] = { ...c, procurementNo: procNum };
              completedUpdated = true;
            }

            const panelsStr = o?.equipment?.panels || '0';
            const numPanels = parseInt(panelsStr.replace(/\D/g, '')) || 15;

            const baseAmount = o?.amount?.base || 0;
            const gst = o?.amount?.gst || 0;
            const totalWithGst = baseAmount + (baseAmount * gst / 100);

            const newInwardData = {
              orderNo: c.orderId,
              poNumber: o?.poNumber || 'N/A',
              vendorName: o?.vendorName || c.vendor || 'N/A',
              poAmount: totalWithGst ? `₹${totalWithGst.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : (c.amount || '₹0'),
              brand: o?.panelDetails?.brands ? (Object.keys(o.panelDetails.brands)[0] || 'Mixed') : 'Mixed',
              product: 'Solar Kit Components',
              technology: o?.panelDetails?.technology || 'Mixed',
              projectType: 'Commercial',
              wattPeak: o?.panelDetails?.wattage || '540W',
              totalKw: o?.panelDetails?.totalCapacity ? `${o.panelDetails.totalCapacity / 1000} KW` : '8.0 KW',
              totalUnits: `${numPanels}`,
              sku: procNum,
              status: 'Pending',
              scanNo: '-',
              receivedDate: '-',
              downloadable: false,
            };

            inwardStorage.unshift(newInwardData);
            inwardUpdated = true;
          }
        });

        if (completedUpdated) {
          localStorage.setItem('completedVendorPayments', JSON.stringify(updatedCompleted));
        }
        if (inwardUpdated) {
          localStorage.setItem('inwardOrdersData', JSON.stringify(inwardStorage));
        }
      } catch (e) {
        console.error("Sync error:", e);
      }
    };

    syncExistingCompletedPayments();

    const loadInwardData = () => {
      try {
        const storedInward = JSON.parse(localStorage.getItem('inwardOrdersData') || '[]');
        const sanitized = storedInward.map(item => ({
          ...item,
          projectType: item.projectType === 'Commercial/Residential' ? 'Commercial' : item.projectType
        }));
        setInwardData(sanitized);
      } catch (e) {
        console.error("Error loading inward orders", e);
      }
    };

    loadInwardData();

    // Listen for changes in localStorage from other tabs/actions
    window.addEventListener('storage', loadInwardData);
    // Reload when tab becomes active/focused
    window.addEventListener('focus', loadInwardData);

    return () => {
      window.removeEventListener('storage', loadInwardData);
      window.removeEventListener('focus', loadInwardData);
    };
  }, []);

  const handleInwardClick = (row) => {
    setSelectedInwardRow(row);
    setInputOrderNo(row.orderNo || '');
    setInputPurchaseNo(row.sku || '');
    setSelectedInvoiceFile(null);
    setInvoiceAmountInput('');
    setShowMatchModal(true);
  };

  const handleMatchInward = () => {
    if (selectedInwardRow) {
      if (!selectedInvoiceFile) {
        alert('Please upload the invoice first.');
        return;
      }
      if (inputOrderNo === selectedInwardRow.orderNo && inputPurchaseNo === selectedInwardRow.sku) {
        const todayStr = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
        
        const updateFields = {
          status: 'Inward Matched Successfully',
          receivedDate: todayStr,
          invoiceName: selectedInvoiceFile.name,
          downloadable: true
        };

        // Match successful
        setInwardData(prev => prev.map(item => {
          if (item.orderNo === selectedInwardRow.orderNo) {
            return { ...item, ...updateFields };
          }
          return item;
        }));
        
        // Update localStorage as well
        try {
          const stored = JSON.parse(localStorage.getItem('inwardOrdersData') || '[]');
          const updatedStored = stored.map(item => {
            if (item.orderNo === selectedInwardRow.orderNo) {
              return { ...item, ...updateFields };
            }
            return item;
          });
          localStorage.setItem('inwardOrdersData', JSON.stringify(updatedStored));
        } catch (e) {
          console.error(e);
        }

        alert('Matched Successfully! Status updated to Inward Matched Successfully.');
        setShowMatchModal(false);
        setSelectedInwardRow(null);
        setSelectedInvoiceFile(null);
        navigate('/delivery-manager/my-task/at-warehouse');
      } else {
        alert('Match Failed! Order No or Procurement Number is incorrect.');
      }
    }
  };

  return (
    <div className="p-6 space-y-8 bg-white min-h-screen relative">
      
      {/* Inward Management Section */}
      <div className="space-y-4">
        {/* Header Title */}
        <div className="bg-[#2C7BBA] p-4 text-white font-bold text-xl rounded-sm">
          InWard Management
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative">
            <input 
              type="text" 
              placeholder="dd-mm-yyyy" 
              className="border border-gray-300 rounded-md px-4 py-2 w-48 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <Calendar className="absolute right-3 top-2.5 text-gray-400 w-5 h-5" />
          </div>
          
          <select className="border border-gray-300 rounded-md px-4 py-2 w-48 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-600 appearance-none">
            <option>All Products</option>
          </select>
          
          <select className="border border-gray-300 rounded-md px-4 py-2 w-48 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-600 appearance-none">
            <option>All Brands</option>
          </select>

          <button className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 text-sm font-medium">
            Clear Filters
          </button>
        </div>

        {/* Table 1 */}
        <div className="overflow-x-auto border border-gray-200 rounded-sm font-sans">
          <table className="w-full text-sm text-left">
            <thead className="text-white bg-[#74B8FA] whitespace-nowrap">
              <tr>
                <th className="px-4 py-3 font-semibold border-r border-blue-300/30">Order / PO No</th>
                <th className="px-4 py-3 font-semibold border-r border-blue-300/30">Supplier & Amount</th>
                <th className="px-4 py-3 font-semibold border-r border-blue-300/30">Brand</th>
                <th className="px-4 py-3 font-semibold border-r border-blue-300/30">Product</th>
                <th className="px-4 py-3 font-semibold border-r border-blue-300/30">Technology</th>
                <th className="px-4 py-3 font-semibold border-r border-blue-300/30">Project Type</th>
                <th className="px-4 py-3 font-semibold border-r border-blue-300/30">Watt Peak</th>
                <th className="px-4 py-3 font-semibold border-r border-blue-300/30">Total KW</th>
                <th className="px-4 py-3 font-semibold border-r border-blue-300/30">Total Units</th>
                <th className="px-4 py-3 font-semibold border-r border-blue-300/30">Procurement Number</th>
                <th className="px-4 py-3 font-semibold border-r border-blue-300/30">Status</th>
                <th className="px-4 py-3 font-semibold border-r border-blue-300/30">Scan No</th>
                <th className="px-4 py-3 font-semibold border-r border-blue-300/30">Received Date</th>
                <th className="px-4 py-3 font-semibold border-r border-blue-300/30">Action</th>
                <th className="px-4 py-3 font-semibold">Download Invoice</th>
              </tr>
            </thead>
            <tbody>
              {inwardData.map((row, index) => (
                <tr key={index} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-4 py-4 border-r border-gray-200">
                    <p className="font-bold text-gray-800">{row.orderNo}</p>
                    <p className="text-[10px] text-blue-600 font-mono mt-0.5 font-bold">{row.poNumber || 'N/A'}</p>
                  </td>
                  <td className="px-4 py-4 border-r border-gray-200">
                    <p className="font-semibold text-gray-700 text-xs">{row.vendorName || 'N/A'}</p>
                    <p className="text-[11px] text-green-600 font-bold mt-0.5">{row.poAmount || 'N/A'}</p>
                  </td>
                  <td className="px-4 py-4 border-r border-gray-200">{row.brand}</td>
                  <td className="px-4 py-4 border-r border-gray-200">{row.product}</td>
                  <td className="px-4 py-4 border-r border-gray-200">{row.technology}</td>
                  <td className="px-4 py-4 border-r border-gray-200">{row.projectType}</td>
                  <td className="px-4 py-4 border-r border-gray-200">{row.wattPeak}</td>
                  <td className="px-4 py-4 border-r border-gray-200">{row.totalKw}</td>
                  <td className="px-4 py-4 border-r border-gray-200">{row.totalUnits}</td>
                  <td className="px-4 py-4 border-r border-gray-200">{row.sku}</td>
                  <td className="px-4 py-4 border-r border-gray-200">
                    <span className={`px-2 py-1 rounded text-xs font-semibold text-white ${
                      row.status === 'Inward Matched Successfully' || row.status === 'Completed' ? 'bg-[#2E9C47]' : 'bg-[#EAB308]'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 border-r border-gray-200">{row.scanNo}</td>
                  <td className="px-4 py-4 border-r border-gray-200">{row.receivedDate}</td>
                  <td className="px-4 py-4 border-r border-gray-200 text-center">
                    {row.status !== 'Inward Matched Successfully' && row.status !== 'Completed' && (
                      <button 
                        onClick={() => handleInwardClick(row)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap"
                      >
                        Inward
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    {row.invoiceName ? (
                      <div className="flex flex-col items-center justify-center space-y-1">
                        <span className="text-[10px] text-green-700 bg-green-50 px-1.5 py-0.5 rounded border border-green-200 font-bold">
                          Invoice Uploaded
                        </span>
                        <button className="bg-[#2E9C47] hover:bg-green-700 text-white px-2 py-1 rounded text-[11px] font-semibold flex items-center space-x-1">
                          <Download size={11} />
                          <span className="max-w-[100px] truncate">{row.invoiceName}</span>
                        </button>
                      </div>
                    ) : (
                      <button className="px-2 py-1 rounded text-[11px] font-medium text-white bg-gray-400 cursor-not-allowed" disabled>
                        No Invoice
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scanned Items Summary Section */}
      <div className="space-y-4">
        {/* Header Title */}
        <div className="bg-[#2C7BBA] p-4 text-white font-bold text-xl rounded-sm">
          Scanned Items Summary
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          <select className="border border-gray-300 rounded-md px-4 py-2 w-48 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-600 appearance-none">
            <option>Project Type</option>
          </select>

          <select className="border border-gray-300 rounded-md px-4 py-2 w-48 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-600 appearance-none">
            <option>Technology</option>
          </select>
          
          <select className="border border-gray-300 rounded-md px-4 py-2 w-48 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-600 appearance-none">
            <option>All Products</option>
          </select>
          
          <select className="border border-gray-300 rounded-md px-4 py-2 w-48 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-600 appearance-none">
            <option>All Brands</option>
          </select>

          <button className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 text-sm font-medium">
            Clear Filters
          </button>
        </div>

        {/* Table 2 */}
        <div className="overflow-x-auto border border-gray-200 rounded-sm">
          <table className="w-full text-sm text-left">
            <thead className="text-white bg-[#74B8FA] whitespace-nowrap">
              <tr>
                <th className="px-4 py-3 font-semibold border-r border-blue-300/30">Order / PO No</th>
                <th className="px-4 py-3 font-semibold border-r border-blue-300/30">Supplier & Amount</th>
                <th className="px-4 py-3 font-semibold border-r border-blue-300/30">Brand</th>
                <th className="px-4 py-3 font-semibold border-r border-blue-300/30">Product</th>
                <th className="px-4 py-3 font-semibold border-r border-blue-300/30">Technology</th>
                <th className="px-4 py-3 font-semibold border-r border-blue-300/30">Project Type</th>
                <th className="px-4 py-3 font-semibold border-r border-blue-300/30">Watt Peak</th>
                <th className="px-4 py-3 font-semibold border-r border-blue-300/30">Total KW</th>
                <th className="px-4 py-3 font-semibold border-r border-blue-300/30">Total Units</th>
                <th className="px-4 py-3 font-semibold border-r border-blue-300/30">Procurement Number</th>
                <th className="px-4 py-3 font-semibold border-r border-blue-300/30">Status</th>
                <th className="px-4 py-3 font-semibold border-r border-blue-300/30">Scan No</th>
                <th className="px-4 py-3 font-semibold">Received Date</th>
              </tr>
            </thead>
            <tbody>
              {inwardData.map((row, index) => (
                <tr key={index} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-4 py-4 border-r border-gray-200">
                    <p className="font-bold text-gray-800">{row.orderNo}</p>
                    <p className="text-[10px] text-blue-600 font-mono mt-0.5 font-bold">{row.poNumber || 'N/A'}</p>
                  </td>
                  <td className="px-4 py-4 border-r border-gray-200">
                    <p className="font-semibold text-gray-700 text-xs">{row.vendorName || 'N/A'}</p>
                    <p className="text-[11px] text-green-600 font-bold mt-0.5">{row.poAmount || 'N/A'}</p>
                  </td>
                  <td className="px-4 py-4 border-r border-gray-200">{row.brand}</td>
                  <td className="px-4 py-4 border-r border-gray-200">{row.product}</td>
                  <td className="px-4 py-4 border-r border-gray-200">{row.technology}</td>
                  <td className="px-4 py-4 border-r border-gray-200">{row.projectType}</td>
                  <td className="px-4 py-4 border-r border-gray-200">{row.wattPeak}</td>
                  <td className="px-4 py-4 border-r border-gray-200">{row.totalKw}</td>
                  <td className="px-4 py-4 border-r border-gray-200">{row.totalUnits}</td>
                  <td className="px-4 py-4 border-r border-gray-200">{row.sku}</td>
                  <td className="px-4 py-4 border-r border-gray-200">
                    <span className={`px-2 py-1 rounded text-xs font-semibold text-white ${
                      row.status === 'Inward Matched Successfully' || row.status === 'Completed' ? 'bg-[#2E9C47]' : 'bg-[#EAB308]'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 border-r border-gray-200">{row.scanNo}</td>
                  <td className="px-4 py-4">{row.receivedDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Action Button */}
      <button className="fixed bottom-6 right-6 bg-[#0E1F34] hover:bg-[#1a3350] text-white px-5 py-3 rounded-full flex items-center shadow-lg transition-colors z-50">
        <Coffee className="w-5 h-5 mr-2" />
        <span className="font-medium">Break Time</span>
      </button>

      {/* Match Modal */}
      {showMatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden animate-fade-in flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-[#f8f9fa]">
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                <FileText size={20} className="mr-2 text-blue-600" /> Verify & Match Inward Details
              </h3>
              <button 
                onClick={() => setShowMatchModal(false)}
                className="text-gray-500 hover:text-gray-700 transition bg-gray-100 hover:bg-gray-200 rounded-full p-1"
              >
                <X size={18} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200 bg-white">
              {/* Left Column: PO & Supplier Info */}
              <div className="p-5 space-y-4">
                <h4 className="font-bold text-gray-700 text-xs uppercase tracking-wider border-b pb-2">PO & Supplier Details</h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-xs text-gray-500 font-medium block">PO Number</span>
                    <span className="font-mono font-bold text-blue-600 text-base">{selectedInwardRow?.poNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 font-medium block">Supplier / Vendor</span>
                    <span className="font-bold text-gray-800">{selectedInwardRow?.vendorName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 font-medium block">PO Amount (with GST)</span>
                    <span className="font-bold text-green-600 text-lg">{selectedInwardRow?.poAmount || 'N/A'}</span>
                  </div>
                  
                  <div className="pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-400 uppercase font-bold tracking-wider block mb-2">Material details</span>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-2 text-xs">
                      <div className="text-gray-500">Brand: <span className="font-semibold text-gray-800 block mt-0.5">{selectedInwardRow?.brand}</span></div>
                      <div className="text-gray-500">Tech: <span className="font-semibold text-gray-800 block mt-0.5">{selectedInwardRow?.technology}</span></div>
                      <div className="text-gray-500">Watt Peak: <span className="font-semibold text-gray-800 block mt-0.5">{selectedInwardRow?.wattPeak}</span></div>
                      <div className="text-gray-500">Total KW: <span className="font-semibold text-gray-800 block mt-0.5">{selectedInwardRow?.totalKw}</span></div>
                      <div className="text-gray-500 col-span-2">Total Units: <span className="font-bold text-blue-700 block mt-0.5">{selectedInwardRow?.totalUnits} Units</span></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right Column: Verification & Invoice Upload */}
              <div className="p-5 space-y-4">
                <h4 className="font-bold text-gray-700 text-xs uppercase tracking-wider border-b pb-2">Verification & Upload</h4>
                
                {/* Invoice Upload */}
                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Upload Vendor Invoice</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center bg-white hover:bg-gray-100 transition-colors cursor-pointer relative">
                    <input
                      type="file"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={(e) => setSelectedInvoiceFile(e.target.files[0])}
                      accept="image/*,.pdf"
                    />
                    <Upload size={24} className="text-blue-500 mb-1" />
                    <p className="text-xs font-semibold text-gray-700">Choose invoice file</p>
                    <p className="text-[9px] text-gray-400 mt-0.5">PNG, JPG, PDF up to 5MB</p>
                  </div>
                  {selectedInvoiceFile && (
                    <div className="mt-2 bg-green-50 text-green-700 text-xs px-2.5 py-1.5 rounded border border-green-200 font-semibold flex items-center justify-between">
                      <span className="truncate max-w-[180px]">{selectedInvoiceFile.name}</span>
                      <Check size={14} className="text-green-600 flex-shrink-0" />
                    </div>
                  )}
                </div>
                
                {/* Manual Invoice Amount Input */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Invoice Amount (₹)</label>
                  <input 
                    type="text" 
                    value={invoiceAmountInput}
                    onChange={(e) => setInvoiceAmountInput(e.target.value)}
                    placeholder="Enter Invoice Amount"
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Order Number</label>
                  <input 
                    type="text" 
                    value={inputOrderNo}
                    onChange={(e) => setInputOrderNo(e.target.value)}
                    placeholder="Enter Order Number"
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Procurement Number</label>
                  <input 
                    type="text" 
                    value={inputPurchaseNo}
                    onChange={(e) => setInputPurchaseNo(e.target.value)}
                    placeholder="Enter Procurement Number"
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <p className="text-[10px] text-gray-400 bg-amber-50 p-2 border border-amber-100 rounded">
                  <b>Verification Hint:</b> Order No is <span className="font-mono bg-white border px-1 font-bold text-gray-800">{selectedInwardRow?.orderNo}</span> and Procurement No is <span className="font-mono bg-white border px-1 font-bold text-gray-800">{selectedInwardRow?.sku}</span>
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50 rounded-b-lg">
              <button 
                onClick={() => setShowMatchModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded text-sm font-semibold hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleMatchInward}
                className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-700 transition shadow-sm"
              >
                {selectedInvoiceFile && invoiceAmountInput?.trim() && inputOrderNo?.trim() && inputPurchaseNo?.trim() ? 'Done' : 'Match & Save Inward'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
