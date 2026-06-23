import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Hourglass, Banknote, ReceiptText, X, CheckCircle, XCircle, Printer, Upload, ArrowRight } from 'lucide-react';

export default function WarehouseVendorPay() {
  const navigate = useNavigate();
  const [dynamicPayments, setDynamicPayments] = React.useState([]);
  const [completedPayments, setCompletedPayments] = React.useState([]);
  const [showPayModal, setShowPayModal] = React.useState(false);
  const [selectedPayRow, setSelectedPayRow] = React.useState(null);
  const [showReceiptModal, setShowReceiptModal] = React.useState(false);
  const [selectedReceiptRow, setSelectedReceiptRow] = React.useState(null);

  const handleResetTestingData = () => {
    if (window.confirm("Are you sure you want to clear all testing data? This will reset the order journey completely.")) {
      localStorage.removeItem('completedVendorPayments');
      localStorage.removeItem('generatedVendorPayments');
      localStorage.clear();
      window.location.reload();
    }
  };

  React.useEffect(() => {
    try {
      const savedCompleted = JSON.parse(localStorage.getItem('completedVendorPayments') || '[]');
      setCompletedPayments(savedCompleted);

      const generated = JSON.parse(localStorage.getItem('generatedVendorPayments') || '[]');
      const uniqueGenerated = [];
      const seenIds = new Set();
      for (const o of generated.reverse()) {
        if (!seenIds.has(o.id)) {
          seenIds.add(o.id);
          uniqueGenerated.push(o);
        }
      }

      const formatted = uniqueGenerated.map(o => {
          const panelsStr = o.equipment?.panels || '0';
          const numPanels = parseInt(panelsStr.replace(/\D/g, '')) || 0;
          const totalCapacity = o.panelDetails?.totalCapacity || (numPanels * 500);
          const base = o.amount?.base || 0;
          const gst = o.amount?.gst || 0;
          const totalAmount = base + (base * gst / 100);
          
          return {
             orderId: o.id,
             vendor: `${o.vendorName || 'Vendor'} (${o.id} - ${o.subCustomers?.length || 1} Projects)`,
             date: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
             warehouse: 'Mumbai',
             rate: 'Custom Combo Kit',
             amount: `₹${totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
          };
      });
      
      const filteredPending = formatted.filter(f => !savedCompleted.some(c => c.vendor === f.vendor));
      setDynamicPayments(filteredPending);
    } catch(e) {}
  }, []);

  const pendingPayments = [
    ...dynamicPayments
  ];

  const paymentHistory = [
    ...completedPayments
  ];

  const calculateTotal = (payments) => {
    return payments.reduce((acc, curr) => {
      const amt = parseInt(curr.amount.replace(/\D/g, ''), 10) || 0;
      return acc + amt;
    }, 0);
  };

  const totalPendingAmountFormatted = `₹${calculateTotal(pendingPayments).toLocaleString('en-IN')}`;
  const totalPaidAmountFormatted = `₹${calculateTotal(paymentHistory).toLocaleString('en-IN')}`;

  const handlePaySuccess = () => {
    if (selectedPayRow) {
      setDynamicPayments(prev => prev.filter(p => p.vendor !== selectedPayRow.vendor));
      const newCompleted = {
        id: 'PAY-WH-' + Math.floor(1000 + Math.random() * 9000),
        vendor: selectedPayRow.vendor,
        date: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
        warehouse: selectedPayRow.warehouse,
        amount: selectedPayRow.amount,
        method: 'Simulator',
        orderId: selectedPayRow.orderId
      };
      setCompletedPayments(prev => {
        const updated = [newCompleted, ...prev];
        localStorage.setItem('completedVendorPayments', JSON.stringify(updated));
        return updated;
      });
    }
    setShowPayModal(false);
    setSelectedPayRow(null);
    alert('Payment Successful!');
  };

  const handleUploadReceipt = (row, file) => {
    if (!file) return;
    setDynamicPayments(prev => prev.filter(p => p.vendor !== row.vendor));
    const newCompleted = {
      id: 'PAY-WH-' + Math.floor(1000 + Math.random() * 9000),
      vendor: row.vendor,
      date: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
      warehouse: row.warehouse,
      amount: row.amount,
      method: 'Receipt Uploaded',
      orderId: row.orderId
    };
    setCompletedPayments(prev => {
      const updated = [newCompleted, ...prev];
      localStorage.setItem('completedVendorPayments', JSON.stringify(updated));
      return updated;
    });
    alert('Receipt Uploaded Successfully!');
  };

  return (
    <div className="p-6 bg-[#f0f4f8] min-h-screen space-y-6">
      {/* Header */}
      <div className="bg-[#2c4b75] text-white p-5 rounded shadow flex justify-between items-start">
        <div className="flex items-center space-x-4 max-w-[60%]">
          <h1 className="text-xl font-bold">Warehouse Vendor Payment Management</h1>
          <button 
            onClick={handleResetTestingData}
            className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1.5 rounded shadow-sm font-bold transition border border-red-700 whitespace-nowrap"
          >
            Reset Testing Data
          </button>
        </div>
        <div className="flex space-x-4 text-xs font-semibold mt-1">
          <span>Today's Task</span>
          <span className="text-yellow-400">Pending Task</span>
          <span className="text-red-400">Overdue Task</span>
        </div>
      </div>

      {/* Pending Vendor Payments Section */}
      <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white">
           <h2 className="text-[#0b74ba] font-bold text-[15px]">Pending Vendor Payments</h2>
           <div className="bg-[#0b74ba] text-white text-xs font-bold px-3 py-1.5 rounded">
              Total Due: {totalPendingAmountFormatted}
           </div>
        </div>
        <div className="overflow-x-auto p-4">
          <table className="w-full text-[13px] text-left border border-gray-100">
            <thead className="bg-[#7fb4eb] text-white">
              <tr>
                <th className="px-4 py-3 font-medium border-r border-blue-300">Order Number</th>
                <th className="px-4 py-3 font-medium border-r border-blue-300">Vendor Name</th>
                <th className="px-3 py-3 font-medium border-r border-blue-300">Date</th>
                <th className="px-3 py-3 font-medium border-r border-blue-300">Warehouse</th>
                <th className="px-3 py-3 font-medium border-r border-blue-300">Rate/Unit</th>
                <th className="px-3 py-3 font-medium border-r border-blue-300">Total Amount</th>
                <th className="px-3 py-3 font-medium border-r border-blue-300 text-center">Status</th>
                <th className="px-3 py-3 font-medium text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 border border-gray-200 border-t-0">
              {pendingPayments.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50 text-gray-700">
                  <td className="px-4 py-4 border-r border-gray-100 font-bold">{row.orderId || '-'}</td>
                  <td className="px-4 py-4 border-r border-gray-100 font-medium">{row.vendor}</td>
                  <td className="px-3 py-4 border-r border-gray-100">{row.date}</td>
                  <td className="px-3 py-4 border-r border-gray-100">{row.warehouse}</td>
                  <td className="px-3 py-4 border-r border-gray-100">{row.rate}</td>
                  <td className="px-3 py-4 border-r border-gray-100">{row.amount}</td>
                  <td className="px-3 py-4 border-r border-gray-100 text-center">
                     <span className="bg-[#ffc107] text-gray-800 px-3 py-1 rounded text-[11px] font-bold shadow-sm whitespace-nowrap">
                       Pending
                     </span>
                  </td>
                  <td className="px-3 py-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button 
                        onClick={() => {
                          setSelectedPayRow(row);
                          setShowPayModal(true);
                        }}
                        className="bg-[#0b74ba] hover:bg-blue-700 text-white px-3 py-1.5 rounded text-[11px] font-bold shadow-sm transition"
                      >
                        Pay Now
                      </button>
                      <label className="bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-[11px] font-bold shadow-sm transition cursor-pointer flex items-center">
                        <Upload size={12} className="mr-1.5" />
                        Upload Receipt
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*,.pdf"
                          onChange={(e) => {
                            if(e.target.files && e.target.files[0]) {
                              handleUploadReceipt(row, e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vendor Payment History Section */}
      <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden mt-6">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white">
           <h2 className="text-[#0b74ba] font-bold text-[15px]">Vendor Payment History</h2>
           <div className="bg-[#28a745] text-white text-xs font-bold px-3 py-1.5 rounded">
              Total Paid: {totalPaidAmountFormatted}
           </div>
        </div>
        <div className="overflow-x-auto p-4">
          <table className="w-full text-[13px] text-left border border-gray-100">
            <thead className="bg-[#7fb4eb] text-white">
              <tr>
                <th className="px-4 py-3 font-medium border-r border-blue-300">Order Number</th>
                <th className="px-4 py-3 font-medium border-r border-blue-300">Payment ID</th>
                <th className="px-3 py-3 font-medium border-r border-blue-300">Vendor Name</th>
                <th className="px-3 py-3 font-medium border-r border-blue-300">Payment Date</th>
                <th className="px-3 py-3 font-medium border-r border-blue-300">Warehouse</th>
                <th className="px-3 py-3 font-medium border-r border-blue-300">Amount</th>
                <th className="px-3 py-3 font-medium border-r border-blue-300">Payment Method</th>
                <th className="px-3 py-3 font-medium border-r border-blue-300 text-center">Status</th>
                <th className="px-3 py-3 font-medium text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 border border-gray-200 border-t-0">
              {paymentHistory.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50 text-gray-700">
                  <td className="px-4 py-4 border-r border-gray-100 font-bold">{row.orderId || '-'}</td>
                  <td className="px-4 py-4 border-r border-gray-100">{row.id}</td>
                  <td className="px-3 py-4 border-r border-gray-100 font-medium">{row.vendor}</td>
                  <td className="px-3 py-4 border-r border-gray-100">{row.date}</td>
                  <td className="px-3 py-4 border-r border-gray-100">{row.warehouse}</td>
                  <td className="px-3 py-4 border-r border-gray-100">{row.amount}</td>
                  <td className="px-3 py-4 border-r border-gray-100">{row.method}</td>
                  <td className="px-3 py-4 border-r border-gray-100 text-center">
                    <span className="bg-[#28a745] text-white px-3 py-1 rounded text-[11px] font-bold shadow-sm whitespace-nowrap">
                      Completed
                    </span>
                  </td>
                  <td className="px-3 py-4 text-center">
                    <div className="flex items-center justify-center space-x-4">
                      <button 
                        onClick={() => {
                          setSelectedReceiptRow(row);
                          setShowReceiptModal(true);
                        }}
                        className="text-gray-500 hover:text-[#0b74ba] transition flex flex-col items-center"
                      >
                        <ReceiptText size={18} strokeWidth={1.5} />
                        <span className="text-[10px] mt-0.5 font-medium">View</span>
                      </button>
                      <button 
                        onClick={() => navigate('/account-manager/my-task/order-journey', { state: { step: 2, flow: 'project_signup_vendor' } })}
                        className="text-green-600 hover:text-green-700 transition flex flex-col items-center"
                      >
                        <ArrowRight size={18} strokeWidth={1.5} />
                        <span className="text-[10px] mt-0.5 font-medium">Procurement Step</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
           <div>
              <p className="text-[#0b74ba] font-bold text-[11px] tracking-wide uppercase mb-1">Total Pending Payments</p>
              <p className="text-[22px] font-bold text-gray-800">{totalPendingAmountFormatted}</p>
           </div>
           <div className="text-gray-800">
              <Hourglass size={28} strokeWidth={1.5} />
           </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
           <div>
              <p className="text-[#28a745] font-bold text-[11px] tracking-wide uppercase mb-1">Total Paid This Month</p>
              <p className="text-[22px] font-bold text-gray-800">{totalPaidAmountFormatted}</p>
           </div>
           <div className="text-gray-800">
              <Banknote size={28} strokeWidth={1.5} />
           </div>
        </div>
      </div>

      {/* Payment Demo Simulator Modal */}
      {showPayModal && selectedPayRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="bg-[#145a80] px-6 py-4 flex justify-between items-center text-white">
              <h3 className="text-lg font-bold">Demo Payment Simulator</h3>
              <button onClick={() => setShowPayModal(false)} className="text-blue-100 hover:text-white transition">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500 mb-1">Paying to Vendor</p>
                <p className="text-lg font-bold text-gray-800">{selectedPayRow.vendor}</p>
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <p className="text-sm text-gray-500 mb-1">Total Amount</p>
                  <p className="text-2xl font-black text-[#0b74ba]">{selectedPayRow.amount}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                <button 
                  onClick={() => {
                    setShowPayModal(false);
                    alert('Payment Failed! Try again later.');
                  }}
                  className="flex flex-col items-center justify-center py-4 border-2 border-red-100 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition"
                >
                  <XCircle size={28} className="mb-2" />
                  <span className="font-bold">Simulate Failure</span>
                </button>
                <button 
                  onClick={handlePaySuccess}
                  className="flex flex-col items-center justify-center py-4 border-2 border-green-100 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition"
                >
                  <CheckCircle size={28} className="mb-2" />
                  <span className="font-bold">Simulate Success</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Professional Receipt Modal */}
      {showReceiptModal && selectedReceiptRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
          <div className="bg-white shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden animate-fade-in relative border border-gray-200 rounded">
            {/* Top decorative bar */}
            <div className="h-2 w-full bg-[#0b74ba] sticky top-0 z-10"></div>
            
            {/* Action buttons (Now part of the document flow, no overlap) */}
            <div className="flex justify-end p-4 pb-0 space-x-2 sticky top-2 z-10 bg-white/80 backdrop-blur-sm mr-4">
              <button 
                onClick={() => window.print()}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded transition"
                title="Print Receipt"
              >
                <Printer size={18} />
              </button>
              <button 
                onClick={() => setShowReceiptModal(false)}
                className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded transition"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-8 pb-8 pt-2">
              {/* Receipt Header */}
              <div className="flex justify-between items-start mb-6 border-b-2 border-dashed border-gray-200 pb-6">
                <div>
                  <h1 className="text-3xl font-black text-[#145a80] tracking-tight mb-1">SOLARKITS</h1>
                  <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">A Solar Marketplace</p>
                  <div className="mt-4 text-xs text-gray-600">
                    <p>123 Solar Tech Park, Green Avenue</p>
                    <p>Mumbai, Maharashtra, 400001</p>
                    <p>GSTIN: 27AADCS1234F1Z5</p>
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="text-2xl font-light text-gray-400 mb-2 uppercase tracking-widest">Receipt</h2>
                  <p className="text-sm font-bold text-gray-800">No. {selectedReceiptRow.id}</p>
                  <p className="text-xs text-gray-500 mt-1">Date: {selectedReceiptRow.date}</p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center justify-center bg-green-50 text-green-700 p-3 rounded-lg border border-green-200 mb-6">
                <CheckCircle size={20} className="mr-2" />
                <span className="font-bold tracking-wide uppercase text-sm">Payment Successfully Completed</span>
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-2 gap-8 mb-6">
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Paid To</p>
                  <p className="text-sm font-bold text-gray-800">{selectedReceiptRow.vendor}</p>
                  <p className="text-xs text-gray-600 mt-1">Warehouse: {selectedReceiptRow.warehouse}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Payment Method</p>
                  <p className="text-sm font-bold text-gray-800">{selectedReceiptRow.method}</p>
                  {selectedReceiptRow.method === 'Simulator' && (
                    <p className="text-xs text-blue-500 italic mt-1">Demo Transaction</p>
                  )}
                </div>
              </div>

              {/* Amount Table */}
              <table className="w-full text-sm mb-6">
                <thead className="bg-gray-50 border-y border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Description</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-600">Total</th>
                  </tr>
                </thead>
                <tbody className="border-b border-gray-200">
                  <tr>
                    <td className="py-4 px-4 text-gray-800">
                      Payment towards warehouse storage and vendor services.
                    </td>
                    <td className="py-4 px-4 text-right font-medium text-gray-800">
                      {selectedReceiptRow.amount}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Total Section */}
              <div className="flex justify-end mb-8">
                <div className="w-64">
                  <div className="flex justify-between items-center py-2 text-gray-600 text-sm">
                    <span>Subtotal:</span>
                    <span>{selectedReceiptRow.amount}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-t-2 border-black mt-2">
                    <span className="font-bold text-gray-800">Total Amount Paid:</span>
                    <span className="text-2xl font-black text-[#0b74ba]">{selectedReceiptRow.amount}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-between items-end border-t border-gray-100 pt-6 mt-6">
                <div className="text-xs text-gray-400">
                  <p>This is a computer generated receipt</p>
                  <p>and does not require a physical signature.</p>
                </div>
                <div className="text-center">
                  <div className="w-40 border-b border-gray-300 mb-2 mx-auto"></div>
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">Authorized Signatory</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
