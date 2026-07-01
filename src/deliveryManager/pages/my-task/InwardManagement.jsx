import React, { useState } from 'react';
import { Calendar, Download, Coffee, X } from 'lucide-react';

export default function InwardManagement() {
  const [inwardData, setInwardData] = useState([]);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [selectedInwardRow, setSelectedInwardRow] = useState(null);
  const [inputOrderNo, setInputOrderNo] = useState('');
  const [inputPurchaseNo, setInputPurchaseNo] = useState('');

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

            const newInwardData = {
              orderNo: c.orderId,
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
    setInputOrderNo('');
    setInputPurchaseNo(row.sku || '');
    setShowMatchModal(true);
  };

  const handleMatchInward = () => {
    if (selectedInwardRow) {
      if (inputOrderNo === selectedInwardRow.orderNo && inputPurchaseNo === selectedInwardRow.sku) {
        const todayStr = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
        // Match successful
        setInwardData(prev => prev.map(item => {
          if (item.orderNo === selectedInwardRow.orderNo) {
            return { ...item, status: 'Inward Matched Successfully', receivedDate: todayStr };
          }
          return item;
        }));
        
        // Update localStorage as well
        try {
          const stored = JSON.parse(localStorage.getItem('inwardOrdersData') || '[]');
          const updatedStored = stored.map(item => {
            if (item.orderNo === selectedInwardRow.orderNo) {
              return { ...item, status: 'Inward Matched Successfully', receivedDate: todayStr };
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
        <div className="overflow-x-auto border border-gray-200 rounded-sm">
          <table className="w-full text-sm text-left">
            <thead className="text-white bg-[#74B8FA] whitespace-nowrap">
              <tr>
                <th className="px-4 py-3 font-semibold border-r border-blue-300/30">Order No</th>
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
                <th className="px-4 py-3 font-semibold">Download sheet</th>
              </tr>
            </thead>
            <tbody>
              {inwardData.map((row, index) => (
                <tr key={index} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-4 py-4 border-r border-gray-200">{row.orderNo}</td>
                  <td className="px-4 py-4 border-r border-gray-200">{row.brand}</td>
                  <td className="px-4 py-4 border-r border-gray-200">{row.product}</td>
                  <td className="px-4 py-4 border-r border-gray-200">{row.technology}</td>
                  <td className="px-4 py-4 border-r border-gray-200">{row.projectType}</td>
                  <td className="px-4 py-4 border-r border-gray-200">{row.wattPeak}</td>
                  <td className="px-4 py-4 border-r border-gray-200">{row.totalKw}</td>
                  <td className="px-4 py-4 border-r border-gray-200">{row.totalUnits}</td>
                  <td className="px-4 py-4 border-r border-gray-200">{row.sku}</td>
                  <td className="px-4 py-4 border-r border-gray-200">
                    <span className={`px-2 py-1 rounded text-xs font-medium text-white ${
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
                    <button className={`px-3 py-1.5 rounded text-xs font-medium text-white ${
                      row.downloadable ? 'bg-[#2E9C47] hover:bg-green-700' : 'bg-gray-500'
                    }`}>
                      Download
                    </button>
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
                <th className="px-4 py-3 font-semibold border-r border-blue-300/30">Order No</th>
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
                  <td className="px-4 py-4 border-r border-gray-200">{row.orderNo}</td>
                  <td className="px-4 py-4 border-r border-gray-200">{row.brand}</td>
                  <td className="px-4 py-4 border-r border-gray-200">{row.product}</td>
                  <td className="px-4 py-4 border-r border-gray-200">{row.technology}</td>
                  <td className="px-4 py-4 border-r border-gray-200">{row.projectType}</td>
                  <td className="px-4 py-4 border-r border-gray-200">{row.wattPeak}</td>
                  <td className="px-4 py-4 border-r border-gray-200">{row.totalKw}</td>
                  <td className="px-4 py-4 border-r border-gray-200">{row.totalUnits}</td>
                  <td className="px-4 py-4 border-r border-gray-200">{row.sku}</td>
                  <td className="px-4 py-4 border-r border-gray-200">
                    <span className={`px-2 py-1 rounded text-xs font-medium text-white ${
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
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800">Match Inward Details</h3>
              <button 
                onClick={() => setShowMatchModal(false)}
                className="text-gray-500 hover:text-gray-700 transition"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Order Number</label>
                <input 
                  type="text" 
                  value={inputOrderNo}
                  onChange={(e) => setInputOrderNo(e.target.value)}
                  placeholder="Enter Order Number"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Procurement Number</label>
                <input 
                  type="text" 
                  value={inputPurchaseNo}
                  onChange={(e) => setInputPurchaseNo(e.target.value)}
                  placeholder="Enter Procurement Number"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <p className="text-xs text-gray-500">
                Hint: Order No is <span className="font-mono bg-gray-100 px-1">{selectedInwardRow?.orderNo}</span> and Procurement No is <span className="font-mono bg-gray-100 px-1">{selectedInwardRow?.sku}</span>
              </p>
            </div>
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
                Match
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
