import React, { useState, useEffect } from 'react';
import api from '../../../api/axios';
import CreateOrder from './order-journey/CreateOrder';
import LoanOrders from './order-journey/LoanOrders';
import DeliveryPlan from './order-journey/DeliveryPlan';
import VendorPay from './order-journey/VendorPay';
import ChannelPartnerPay from './order-journey/ChannelPartnerPay';
import DeliveryManagement from './order-journey/DeliveryManagement';
import ProcurementPlan from '../ProcurementPlan';
import { Check, ChevronRight, Smartphone, FileText, Package, Truck, Eye, X } from 'lucide-react';

const componentRegistry = {
  'CreateOrder': CreateOrder,
  'VendorPay': VendorPay,
  'DeliveryPlan': DeliveryPlan,
  'DeliveryManagement': DeliveryManagement,
  'LoanOrders': LoanOrders,
  'ChannelPartnerPay': ChannelPartnerPay,
  'ProcurementPlaceholder': ProcurementPlan,
  'GenerateOrderNumberPlaceholder': function GenerateOrderNumber({ onNext, sharedOrderData, setSharedOrderData, dashboardData, setDashboardData }) {
    const [orders, setOrders] = React.useState([]);
    const [overdueFilter, setOverdueFilter] = React.useState('');
    const [pendingFilter, setPendingFilter] = React.useState('');
    const [selectedOrderForSummary, setSelectedOrderForSummary] = React.useState(null);

    useEffect(() => {
      if (sharedOrderData && sharedOrderData.length > 0) {
         setOrders(sharedOrderData);
      } else {
         setOrders([
           { 
             id: 'ORD001', 
             customer: 'Group of 2 Projects', 
             vendorName: 'Mayank Solar Distributors',
             equipment: { panels: '120 Panels', inverters: '25 Units', bos: '30 Kits' },
             paymentMode: 'Bank Transfer', 
             utr: 'Pending', 
             status: 'Pending',
             pendingDays: 12,
             overdueDays: 5,
             subCustomers: [
               { name: 'Green Energy Setup', partner: 'Super Admin', pendingDays: 12 },
               { name: 'EcoPower Industrial', partner: 'Super Admin', pendingDays: 10 }
             ]
           },
           { 
             id: 'ORD002', 
             customer: 'Solar Tech Solutions', 
             vendorName: 'Surya Distributors',
             equipment: { panels: '50 Panels', inverters: '10 Units', bos: '10 Kits' },
             paymentMode: 'Credit', 
             utr: 'UTR456', 
             status: 'Paid',
             pendingDays: 3,
             overdueDays: 0,
             subCustomers: [
               { name: 'Solar Tech Solutions', partner: 'N/A', pendingDays: 3 }
             ]
           },
           { 
             id: 'ORD003', 
             customer: 'Eco Power Co', 
             vendorName: 'Mayank Solar Distributors',
             equipment: { panels: '200 Panels', inverters: '40 Units', bos: '50 Kits' },
             paymentMode: 'Bank Transfer', 
             utr: 'Pending', 
             status: 'Pending',
             pendingDays: 20,
             overdueDays: 15,
             subCustomers: [
               { name: 'Eco Power Co', partner: 'N/A', pendingDays: 20 }
             ]
           }
         ]);
      }
    }, [sharedOrderData]);

    const handleApprove = (id) => {
      const updated = orders.map(o => o.id === id ? { ...o, status: 'Paid' } : o);
      setOrders(updated);
      if (setSharedOrderData && sharedOrderData?.length > 0) setSharedOrderData(updated);
    };

    const handleReject = (id) => {
      const updated = orders.map(o => o.id === id ? { ...o, status: 'Rejected' } : o);
      setOrders(updated);
      if (setSharedOrderData && sharedOrderData?.length > 0) setSharedOrderData(updated);
    };

    const allProcessed = orders.every(o => o.status !== 'Pending');

    const filteredOrders = orders.filter(order => {
      let matchesOverdue = true;
      let matchesPending = true;

      if (overdueFilter) {
         matchesOverdue = (order.overdueDays || 0) >= parseInt(overdueFilter);
      }
      if (pendingFilter) {
         matchesPending = (order.pendingDays || 0) >= parseInt(pendingFilter);
      }

      return matchesOverdue && matchesPending;
    });

    return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 mt-6 overflow-hidden animate-fade-in">
      <div className="bg-[#145a80] p-4 text-white flex justify-between items-center shadow">
        <h2 className="text-lg font-bold">Generate Order Number (Accounts Verification)</h2>
        <span className={`px-3 py-1 text-[11px] font-bold rounded-full border shadow-sm text-white ${allProcessed ? 'bg-green-600 border-green-400' : 'bg-yellow-500 border-yellow-400'}`}>
          Status: {allProcessed ? 'Verification Complete' : 'Pending Verification'}
        </span>
      </div>
      <div className="p-6 space-y-6">
        <div className="flex space-x-4 border-b border-gray-100 pb-4 items-center">
           <div className="flex items-center space-x-2">
             <label className="text-xs font-bold text-gray-700">Overdue Days (≥):</label>
             <select 
               className="border border-gray-300 rounded p-1.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
               value={overdueFilter}
               onChange={(e) => setOverdueFilter(e.target.value)}
             >
               <option value="">All</option>
               <option value="1">1+ Days</option>
               <option value="5">5+ Days</option>
               <option value="10">10+ Days</option>
               <option value="15">15+ Days</option>
             </select>
           </div>
           <div className="flex items-center space-x-2">
             <label className="text-xs font-bold text-gray-700">Pending Days (≥):</label>
             <select 
               className="border border-gray-300 rounded p-1.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
               value={pendingFilter}
               onChange={(e) => setPendingFilter(e.target.value)}
             >
               <option value="">All</option>
               <option value="1">1+ Days</option>
               <option value="5">5+ Days</option>
               <option value="10">10+ Days</option>
               <option value="15">15+ Days</option>
               <option value="20">20+ Days</option>
             </select>
           </div>
           <button 
             onClick={() => { setOverdueFilter(''); setPendingFilter(''); }} 
             className="bg-gray-100 text-gray-600 border border-gray-200 px-4 py-1.5 rounded text-xs font-bold hover:bg-gray-200 transition shadow-sm"
           >
             Clear Filters
           </button>
        </div>

        <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#f4f7f9] text-gray-700 font-semibold border-b border-gray-200">
              <tr>
                <th className="px-4 py-3">Order No</th>
                <th className="px-4 py-3">Customer & Vendor</th>
                <th className="px-4 py-3">Order Details</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-4">
                    {order.status === 'Pending' ? (
                      <span className="text-yellow-600 font-bold italic text-xs bg-yellow-50 px-2.5 py-1 rounded border border-yellow-200 shadow-sm">Pending</span>
                    ) : (
                      <span className="font-bold text-gray-800">{order.id}</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                     <p className="text-gray-800 font-medium mb-1">{order.customer}</p>
                     <p className="text-[10px] text-gray-500 font-bold bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded inline-block shadow-sm">
                       {order.vendorName || 'N/A'}
                     </p>
                  </td>
                  <td className="px-4 py-4">
                     {order.equipment ? (
                        <div className="text-[11px] text-gray-600 space-y-0.5">
                          <p><span className="font-semibold text-gray-800">Panels:</span> {order.equipment.panels}</p>
                          <p><span className="font-semibold text-gray-800">Inv:</span> {order.equipment.inverters}</p>
                          <p><span className="font-semibold text-gray-800">BOS:</span> {order.equipment.bos}</p>
                        </div>
                     ) : (
                        <span className="text-gray-400 text-xs">N/A</span>
                     )}
                  </td>
                  <td className="px-4 py-4">
                     <p className="text-gray-700 text-sm font-medium mb-0.5">{order.paymentMode}</p>
                     <p className="text-gray-400 font-mono text-[10px] font-bold">UTR: {order.utr}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-3 py-1.5 rounded text-[11px] font-bold shadow-sm ${
                      order.status === 'Paid' ? 'bg-green-100 text-green-700 border border-green-200' :
                      order.status === 'Rejected' ? 'bg-red-100 text-red-700 border border-red-200' :
                      'bg-yellow-100 text-yellow-700 border border-yellow-200'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-center items-center space-x-2">
                      <button 
                        onClick={() => setSelectedOrderForSummary(order)}
                        className="p-1.5 text-[#0b74ba] hover:bg-blue-100 rounded transition border border-[#0b74ba]"
                        title="View PO Summary"
                      >
                        <Eye size={16} />
                      </button>
                      {order.status === 'Pending' ? (
                        <>
                          <button onClick={() => handleApprove(order.id)} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded text-[11px] font-bold transition shadow-sm uppercase tracking-wider">Approve</button>
                          <button onClick={() => handleReject(order.id)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded text-[11px] font-bold transition shadow-sm uppercase tracking-wider">Reject</button>
                        </>
                      ) : (
                        <span className="text-gray-400 text-xs font-bold uppercase tracking-wider ml-2">Processed</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-4 flex justify-end">
           <button onClick={onNext} className="bg-[#2cb25d] hover:bg-green-700 text-white px-6 py-2.5 rounded text-[13px] font-bold shadow-md transition flex items-center">
             Proceed to Procurement <ChevronRight size={16} className="ml-1"/>
           </button>
        </div>

        {/* PO Summary Modal */}
        {selectedOrderForSummary && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-fade-in border border-gray-100 flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-center p-5 border-b border-gray-200 bg-blue-50">
                <div className="flex items-center space-x-3">
                  <h2 className="text-xl font-bold text-[#145a80] flex items-center">
                    <FileText size={24} className="mr-2" /> PO Summary - {selectedOrderForSummary.status === 'Pending' ? 'Pending' : selectedOrderForSummary.id}
                  </h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm border ${
                    selectedOrderForSummary.status === 'Paid' ? 'bg-green-100 text-green-700 border-green-300' :
                    selectedOrderForSummary.status === 'Rejected' ? 'bg-red-100 text-red-700 border-red-300' :
                    'bg-yellow-100 text-yellow-700 border-yellow-300'
                  }`}>
                    {selectedOrderForSummary.status === 'Paid' ? 'Success' : selectedOrderForSummary.status}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedOrderForSummary(null)}
                  className="text-gray-500 hover:text-red-500 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 space-y-4 text-sm overflow-y-auto flex-1 custom-scrollbar">
                <div className="grid grid-cols-1 gap-4 items-start">
                  <div className="bg-gray-50 p-3 rounded border border-gray-100 shadow-sm">
                    <p className="text-xs text-gray-500 font-bold mb-1">Customer</p>
                    <p className="font-semibold text-gray-800">{selectedOrderForSummary.customer}</p>
                    {selectedOrderForSummary.subCustomers && selectedOrderForSummary.subCustomers.length > 1 && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-[10px] text-gray-500 font-semibold mb-2">Included Projects & Payment Status:</p>
                        <div className="border border-gray-200 rounded overflow-hidden">
                          <table className="w-full text-left text-[11px] text-gray-700">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="px-2 py-1.5 font-semibold text-gray-600">Customer Name</th>
                                <th className="px-2 py-1.5 font-semibold text-gray-600">Partner Name</th>
                                <th className="px-2 py-1.5 font-semibold text-gray-600 text-center">Capacity</th>
                                <th className="px-2 py-1.5 font-semibold text-gray-600">Total Amount</th>
                                <th className="px-2 py-1.5 font-semibold text-gray-600">Paid Amount</th>
                                <th className="px-2 py-1.5 font-semibold text-gray-600 text-right">Status</th>
                                <th className="px-2 py-1.5 font-semibold text-gray-600 text-center">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                              {selectedOrderForSummary.subCustomers.map((c, i) => {
                                const custName = typeof c === 'string' ? c : c.name;
                                const partnerName = typeof c === 'string' ? 'N/A' : (c.partner || 'N/A');
                                const pendingDays = typeof c === 'object' && c.pendingDays !== undefined ? c.pendingDays : selectedOrderForSummary.pendingDays;
                                const isSuccess = selectedOrderForSummary.status === 'Paid';
                                const totalKw = selectedOrderForSummary.subCustomers.reduce((acc, sub) => acc + (parseFloat(sub.kw) || 0), 0);
                                const hasPoAmount = selectedOrderForSummary.amount && selectedOrderForSummary.amount.base > 0;
                                const poBase = hasPoAmount ? selectedOrderForSummary.amount.base : 0;
                                const poGst = hasPoAmount ? (selectedOrderForSummary.amount.gst || 0) : 0;
                                const poTotal = poBase + (poBase * poGst / 100);
                                const poAmountForCustomer = hasPoAmount
                                  ? (parseFloat(c.kw || 0) / totalKw) * poTotal
                                  : (parseFloat(String(c.price || '0').replace(/[^0-9.]/g, '')) || 0);
                                const totalAmount = poAmountForCustomer;
                                const isSubCustomerPaid = c.isPaid !== undefined ? c.isPaid : isSuccess;
                                const paidAmount = isSubCustomerPaid ? totalAmount : 0;
                                
                                return (
                                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-2 py-1.5 font-medium">{custName}</td>
                                    <td className="px-2 py-1.5 text-gray-500">{partnerName}</td>
                                    <td className="px-2 py-1.5 text-gray-600 text-center font-medium bg-gray-50 border-x border-white">{c.kw || '0'} kW</td>
                                    <td className="px-2 py-1.5 font-semibold text-gray-800">
                                      ₹ {totalAmount.toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-2 py-1.5 font-semibold text-green-600">
                                      <div className="flex items-center space-x-2">
                                        <span>₹ {paidAmount.toLocaleString('en-IN')}</span>
                                        <select
                                          className="text-[10px] border border-gray-300 rounded px-1 py-0.5 bg-white text-gray-700 font-normal focus:outline-none focus:ring-1 focus:ring-blue-500"
                                          value={isSubCustomerPaid ? 'Paid' : 'Unpaid'}
                                          onChange={(e) => {
                                            const val = e.target.value === 'Paid';
                                            const updatedSubCustomers = [...selectedOrderForSummary.subCustomers];
                                            updatedSubCustomers[i] = { ...c, isPaid: val, paidAmount: val ? totalAmount : 0 };
                                            const updatedOrder = { ...selectedOrderForSummary, subCustomers: updatedSubCustomers };
                                            setSelectedOrderForSummary(updatedOrder);
                                            const updatedOrders = orders.map(o => o.id === selectedOrderForSummary.id ? updatedOrder : o);
                                            setOrders(updatedOrders);
                                            if (setSharedOrderData) setSharedOrderData(updatedOrders);
                                          }}
                                        >
                                          <option value="Unpaid">Unpaid</option>
                                          <option value="Paid">Paid</option>
                                        </select>
                                      </div>
                                    </td>
                                    <td className="px-2 py-1.5 text-right">
                                      <div className="flex flex-col items-end">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                                          isSuccess ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                        }`}>
                                          {isSuccess ? 'Success' : 'Pending'}
                                        </span>
                                        {!isSuccess && (
                                          <>
                                            {pendingDays > 0 && (
                                              <span className="text-[9px] text-orange-600 font-bold mt-0.5">Pending: {pendingDays} Days</span>
                                            )}
                                          </>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-2 py-1.5 text-center">
                                      <button 
                                        onClick={() => {
                                          const cancelledSubCustomer = c;
                                          const updatedSubCustomers = [...selectedOrderForSummary.subCustomers];
                                          updatedSubCustomers.splice(i, 1);
                                          const updatedOrder = { ...selectedOrderForSummary, subCustomers: updatedSubCustomers };
                                          setSelectedOrderForSummary(updatedOrder);
                                          
                                          const updatedOrders = orders.map(o => o.id === selectedOrderForSummary.id ? updatedOrder : o);
                                          setOrders(updatedOrders);
                                          if (setSharedOrderData) setSharedOrderData(updatedOrders);

                                          // Add back to CreateOrder tableData
                                          if (setDashboardData && cancelledSubCustomer) {
                                            const restoredRow = {
                                              ...cancelledSubCustomer,
                                              status: 'Pending'
                                            };
                                            setDashboardData(prev => ({ 
                                              ...prev, 
                                              tableData: [...(prev?.tableData || []), restoredRow] 
                                            }));
                                          }
                                        }}
                                        className="text-red-500 hover:bg-red-50 p-1 rounded transition mx-auto flex items-center justify-center"
                                        title="Cancel Project"
                                      >
                                        <X size={14} />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot className="bg-gray-50 font-bold border-t border-gray-200">
                              {(() => {
                                const totalKw = selectedOrderForSummary.subCustomers.reduce((acc, sub) => acc + (parseFloat(sub.kw) || 0), 0);
                                const hasPoAmount = selectedOrderForSummary.amount && selectedOrderForSummary.amount.base > 0;
                                const poBase = hasPoAmount ? selectedOrderForSummary.amount.base : 0;
                                const poGst = hasPoAmount ? (selectedOrderForSummary.amount.gst || 0) : 0;
                                const poTotal = poBase + (poBase * poGst / 100);

                                const calculatedPoTotal = selectedOrderForSummary.subCustomers.reduce((acc, c) => {
                                  const poAmountForCustomer = hasPoAmount
                                    ? (parseFloat(c.kw || 0) / totalKw) * poTotal
                                    : (parseFloat(String(c.price || '0').replace(/[^0-9.]/g, '')) || 0);
                                  return acc + poAmountForCustomer;
                                }, 0);

                                const calculatedPaidTotal = selectedOrderForSummary.subCustomers.reduce((acc, c) => {
                                  const poAmountForCustomer = hasPoAmount
                                    ? (parseFloat(c.kw || 0) / totalKw) * poTotal
                                    : (parseFloat(String(c.price || '0').replace(/[^0-9.]/g, '')) || 0);
                                  const cPaid = c.isPaid !== undefined ? c.isPaid : (selectedOrderForSummary.status === 'Paid');
                                  return acc + (cPaid ? poAmountForCustomer : 0);
                                }, 0);

                                const paidPercentage = calculatedPoTotal > 0 ? ((calculatedPaidTotal / calculatedPoTotal) * 100).toFixed(1) : 0;
                                const pendingPercentage = calculatedPoTotal > 0 ? (100 - paidPercentage).toFixed(1) : 0;

                                return (
                                  <tr>
                                    <td colSpan="3" className="px-2 py-3 text-right text-gray-400 uppercase tracking-wider text-[10px]">Summary:</td>
                                    <td className="px-2 py-3 text-blue-700 text-[12px]">
                                      <div className="flex items-center space-x-1.5">
                                        <span className="text-[9px] text-gray-500 uppercase tracking-wider">PO Total:</span>
                                        <span>₹ {calculatedPoTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                                      </div>
                                    </td>
                                    <td className="px-2 py-3 text-green-700 text-[12px]">
                                      <div className="flex items-center space-x-1.5">
                                        <span className="text-[9px] text-gray-500 uppercase tracking-wider">Customer Paid:</span>
                                        <span>₹ {calculatedPaidTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                                      </div>
                                    </td>
                                    <td colSpan="2" className="px-2 py-3 text-right">
                                      <div className="flex justify-end items-center space-x-2 text-[10px]">
                                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded shadow-sm border border-green-200">
                                          {parseFloat(paidPercentage)}% Paid
                                        </span>
                                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded shadow-sm border border-orange-200">
                                          {parseFloat(pendingPercentage)}% Pending
                                        </span>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })()}
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* <div className="bg-gray-50 p-3 rounded border border-gray-100 shadow-sm">
                    <p className="text-xs text-gray-500 font-bold mb-1">Vendor</p>
                    <p className="font-semibold text-gray-800">{selectedOrderForSummary.vendorName || 'N/A'}</p>
                  </div> */}
                  {/* <div className="bg-gray-50 p-3 rounded border border-gray-100 shadow-sm">
                    <p className="text-xs text-gray-500 font-bold mb-1">Payment Details</p>
                    <p className="font-semibold text-gray-800">{selectedOrderForSummary.paymentMode}</p>
                    {selectedOrderForSummary.utr && <p className="text-[10px] text-gray-500 font-mono mt-0.5 font-bold">UTR: {selectedOrderForSummary.utr}</p>}
                  </div> */}
                </div>
                
                {/* <h3 className="font-bold text-gray-800 mt-6 border-b pb-2">Equipment Procurement</h3>
                {selectedOrderForSummary.equipment ? (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-100 p-5 rounded-lg grid grid-cols-3 gap-4 text-center">
                      <div className="bg-white p-3 rounded shadow-sm border border-blue-50">
                        <p className="text-xs text-blue-500 font-bold mb-1 uppercase tracking-wider">Panels</p>
                        <p className="font-bold text-blue-900 text-lg">{selectedOrderForSummary.equipment.panels || 'N/A'}</p>
                      </div>
                      <div className="bg-white p-3 rounded shadow-sm border border-blue-50">
                        <p className="text-xs text-blue-500 font-bold mb-1 uppercase tracking-wider">Inverters</p>
                        <p className="font-bold text-blue-900 text-lg">{selectedOrderForSummary.equipment.inverters || 'N/A'}</p>
                      </div>
                      <div className="bg-white p-3 rounded shadow-sm border border-blue-50">
                        <p className="text-xs text-blue-500 font-bold mb-1 uppercase tracking-wider">BOS Kit</p>
                        <p className="font-bold text-blue-900 text-lg">{selectedOrderForSummary.equipment.bos || 'N/A'}</p>
                      </div>
                    </div>
                    
                    {selectedOrderForSummary.panelDetails && (
                      <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                        <h4 className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider">Panel Specifications</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                          <div>
                            <p className="text-[10px] text-gray-500 uppercase">Technology</p>
                            <p className="font-semibold text-gray-800">{selectedOrderForSummary.panelDetails.technology}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-500 uppercase">Wattage</p>
                            <p className="font-semibold text-gray-800">{selectedOrderForSummary.panelDetails.wattage}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-500 uppercase">Total Capacity</p>
                            <p className="font-semibold text-gray-800">{selectedOrderForSummary.panelDetails.totalCapacity} W</p>
                          </div>
                          {selectedOrderForSummary.amount && (
                            <div>
                              <p className="text-[10px] text-gray-500 uppercase">Estimated Amount</p>
                              <p className="font-bold text-green-600">
                                ₹ {(selectedOrderForSummary.amount.base + (selectedOrderForSummary.amount.base * selectedOrderForSummary.amount.gst / 100)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                              </p>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase mb-1">Brand Breakdown</p>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(selectedOrderForSummary.panelDetails.brands || {}).map(([brand, count]) => (
                              <span key={brand} className="bg-white border border-gray-200 px-2 py-0.5 rounded text-xs shadow-sm">
                                <span className="font-bold text-gray-700">{brand}:</span> <span className="text-blue-700 font-bold">{count}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No equipment details available.</p>
                )} */}
              </div>
              <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
                {(() => {
                  const isFullyPaid = selectedOrderForSummary.subCustomers && 
                                      selectedOrderForSummary.subCustomers.length > 0 && 
                                      selectedOrderForSummary.subCustomers.every(c => c.isPaid || (c.isPaid === undefined && selectedOrderForSummary.status === 'Paid'));
                  return isFullyPaid ? (
                    <button
                      onClick={() => alert('PI Generated Successfully!')}
                      className="px-5 py-2 text-sm font-bold text-white bg-green-600 rounded shadow-sm hover:bg-green-700 transition flex items-center"
                    >
                      Generate PI
                    </button>
                  ) : null;
                })()}
                <button
                  onClick={() => setSelectedOrderForSummary(null)}
                  className="px-5 py-2 text-sm font-bold text-white bg-blue-600 rounded shadow-sm hover:bg-blue-700 transition"
                >
                  Close Summary
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )},
  'CustomerPaymentPlaceholder': ({ onNext }) => (
    <div className="p-10 bg-white rounded-xl shadow-sm text-center border border-gray-200 mt-6">
      <h2 className="text-xl font-bold text-[#0b74ba]">Customer Payment</h2>
      <p className="text-gray-500 mt-2 font-medium mb-6">Process customer payment via App/CRM or Manual UTR.</p>
      <button onClick={onNext} className="bg-[#2cb25d] hover:bg-green-700 text-white px-6 py-2 rounded text-[13px] font-bold shadow-sm transition">Next Step</button>
    </div>
  ),
  'AccountsVerificationPlaceholder': ({ onNext }) => (
    <div className="p-10 bg-white rounded-xl shadow-sm text-center border border-gray-200 mt-6">
      <h2 className="text-xl font-bold text-[#0b74ba]">Accounts Verification</h2>
      <p className="text-gray-500 mt-2 font-medium mb-6">Accounts verifies the payment. Status becomes Paid.</p>
      <button onClick={onNext} className="bg-[#2cb25d] hover:bg-green-700 text-white px-6 py-2 rounded text-[13px] font-bold shadow-sm transition">Next Step</button>
    </div>
  ),
  'GenerateProcurementNumberPlaceholder': ({ onNext }) => (
    <div className="p-10 bg-white rounded-xl shadow-sm text-center border border-gray-200 mt-6">
      <h2 className="text-xl font-bold text-[#0b74ba]">Generate Procurement Number</h2>
      <p className="text-gray-500 mt-2 font-medium mb-6">Procurement number is generated for vendor payment.</p>
      <button onClick={onNext} className="bg-[#2cb25d] hover:bg-green-700 text-white px-6 py-2 rounded text-[13px] font-bold shadow-sm transition">Next Step</button>
    </div>
  ),
  'AtWarehouse': ({ onNext }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 mt-6 overflow-hidden animate-fade-in">
      <div className="bg-[#145a80] p-4 text-white flex justify-between items-center shadow">
        <h2 className="text-lg font-bold">At Warehouse</h2>
        <span className="bg-yellow-500 px-3 py-1 text-[11px] font-bold rounded-full border border-yellow-400 text-white shadow-sm">Status: Warehouse Pending / Processing</span>
      </div>
      <div className="p-6 space-y-6">
        <div className="flex space-x-4 border-b border-gray-100 pb-4">
           <button className="bg-blue-50 text-blue-600 border border-blue-200 px-4 py-2 rounded text-xs font-bold hover:bg-blue-100 transition shadow-sm">Pending Days Filter</button>
           <button className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded text-xs font-bold hover:bg-red-100 transition shadow-sm">Overdue Days Filter</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="border border-gray-200 p-5 rounded-lg bg-gray-50 shadow-sm">
             <h3 className="font-bold text-gray-800 mb-4 flex items-center text-sm"><span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2 text-xs shadow-sm">1</span> Warehouse Manager Login</h3>
             <div className="space-y-4">
                <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm hover:border-blue-300 transition">
                   <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">For Warehouse Inventory Orders:</h4>
                   <button className="w-full flex justify-center items-center bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded text-sm font-semibold shadow-sm transition">
                     <Package size={16} className="mr-2"/> Allocate / Reserve Available Stock
                   </button>
                </div>
                <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm hover:border-purple-300 transition">
                   <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">For Vendor Inventory Orders:</h4>
                   <button className="w-full flex justify-center items-center bg-purple-600 hover:bg-purple-700 text-white p-2.5 rounded text-sm font-semibold shadow-sm transition">
                     <Truck size={16} className="mr-2"/> Inward Material against Procurement No.
                   </button>
                </div>
             </div>
           </div>
           <div className="border border-gray-200 p-5 rounded-lg bg-[#f8fafc] shadow-sm flex flex-col justify-between">
             <div>
               <h3 className="font-bold text-gray-800 mb-4 flex items-center text-sm"><span className="w-6 h-6 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center mr-2 text-xs shadow-sm">2</span> Processing Details</h3>
               <p className="text-sm text-gray-600 mb-4 leading-relaxed">Once stock is reserved or inwarded, the order moves automatically to the <b className="text-gray-800">Delivery Plan</b> stage.</p>
             </div>
             <div className="flex justify-end pt-6">
                <button onClick={onNext} className="bg-[#2cb25d] hover:bg-green-700 text-white px-6 py-2.5 rounded text-[13px] font-bold shadow-md transition w-full flex justify-center items-center">
                  Move to Delivery Plan <ChevronRight size={16} className="ml-1"/>
                </button>
             </div>
           </div>
        </div>
      </div>
    </div>
  )
};

export default function OrderJourney() {
  const [orderType, setOrderType] = useState('project_signup');
  const [currentStep, setCurrentStep] = useState(0);
  const [dynamicFlows, setDynamicFlows] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sharedOrderData, setSharedOrderData] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);

  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [locationHierarchy, setLocationHierarchy] = useState({});

  useEffect(() => {
    const fetchFlows = async () => {
      try {
        const [response, locationData] = await Promise.all([
           api.get('/dashboard/account-manager/order-journey-flows'),
           api.get('/dashboard/account-manager/create-order-data')
        ]);
        if (response.data?.success) {
          setDynamicFlows(response.data.data);
          // Set initial flow based on what is returned if project_signup doesn't exist
          if (!response.data.data['project_signup']) {
            setOrderType(Object.keys(response.data.data)[0]);
          }
        }
        if (locationData.data?.success) {
          setLocationHierarchy(locationData.data.data.locationHierarchy || {});
          setDashboardData(locationData.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch Order Journey flows", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFlows();
  }, []);

  const availableCountries = Object.keys(locationHierarchy);
  const availableStates = (selectedCountry && selectedCountry !== 'All' && locationHierarchy[selectedCountry]) ? Object.keys(locationHierarchy[selectedCountry]) : [];
  const availableClusters = (selectedState && selectedState !== 'All' && selectedCountry && locationHierarchy[selectedCountry]?.[selectedState]) ? Object.keys(locationHierarchy[selectedCountry][selectedState]) : [];
  const availableDistricts = (selectedCluster && selectedCluster !== 'All' && selectedState && selectedCountry && locationHierarchy[selectedCountry]?.[selectedState]?.[selectedCluster]) ? locationHierarchy[selectedCountry][selectedState][selectedCluster] : [];

  if (isLoading || !dynamicFlows) {
    return <div className="p-6 text-center text-gray-500">Loading Order Journey...</div>;
  }

  const activeFlow = dynamicFlows[orderType];
  const activeStepConfig = activeFlow?.steps[currentStep];
  const ActiveComponent = activeStepConfig ? componentRegistry[activeStepConfig.componentId] : null;

  const handleNextStep = () => {
    if (currentStep < activeFlow.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleFlowChange = (e) => {
    setOrderType(e.target.value);
    setCurrentStep(0); // Reset step when flow changes
  };

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa] p-6 space-y-6">
      
      {/* Order Management Dashboard Banner */}
      {dashboardData && (
        <div className="bg-[#145a80] text-white p-4 rounded-lg flex justify-between items-center shadow-md">
          <h1 className="text-2xl font-bold tracking-wide">Order Management</h1>
          <div className="flex space-x-8">
            <div className="flex flex-col items-end">
              <span className="text-gray-200 text-xs uppercase tracking-wider font-semibold">Today's Task</span>
              <span className="text-white text-xl font-bold">{dashboardData.headerCounters?.todayTasks || 0}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-yellow-300 text-xs uppercase tracking-wider font-semibold">Pending Task</span>
              <span className="text-yellow-400 text-xl font-bold">{dashboardData.headerCounters?.pendingTasks || 0}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-red-300 text-xs uppercase tracking-wider font-semibold">Overdue Task</span>
              <span className="text-red-400 text-xl font-bold">{dashboardData.headerCounters?.overdueTasks || 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* Location Card Selection UI */}
      <div className="space-y-6">
        {/* Country */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-800 text-[15px]">Select Country</h3>
            <button className="text-blue-500 text-xs hover:underline">Select All</button>
          </div>
          <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
            <div
              onClick={() => setSelectedCountry('All')}
              className={`flex-shrink-0 cursor-pointer w-48 p-4 rounded-lg border text-center transition-all ${selectedCountry === 'All' ? 'bg-[#ebf5ff] border-blue-400' : 'bg-white border-gray-200'}`}
            >
              <p className="font-bold text-sm text-gray-800">All Countries</p>
              <p className="text-[10px] text-gray-400 uppercase mt-1">ALL</p>
            </div>
            {availableCountries.map((item, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedCountry(item)}
                className={`flex-shrink-0 cursor-pointer w-48 p-4 rounded-lg border text-center transition-all ${selectedCountry === item ? 'bg-[#ebf5ff] border-blue-400' : 'bg-white border-gray-200'}`}
              >
                <p className="font-bold text-sm text-gray-800">{item}</p>
                <p className="text-[10px] text-gray-400 uppercase mt-1">{item.substring(0, 2)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* State */}
        {selectedCountry && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-gray-800 text-[15px]">Select State</h3>
              <button className="text-blue-500 text-xs hover:underline">Select All</button>
            </div>
            <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
              <div
                onClick={() => setSelectedState('All')}
                className={`flex-shrink-0 cursor-pointer w-48 p-4 rounded-lg border text-center transition-all ${selectedState === 'All' ? 'bg-[#ebf5ff] border-blue-400' : 'bg-white border-gray-200'}`}
              >
                <p className="font-bold text-sm text-gray-800">All States</p>
                <p className="text-[10px] text-gray-400 uppercase mt-1">ALL</p>
              </div>
              {availableStates.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedState(item)}
                  className={`flex-shrink-0 cursor-pointer w-48 p-4 rounded-lg border text-center transition-all ${selectedState === item ? 'bg-[#ebf5ff] border-blue-400' : 'bg-white border-gray-200'}`}
                >
                  <p className="font-bold text-sm text-gray-800">{item}</p>
                  <p className="text-[10px] text-gray-400 uppercase mt-1">{item.substring(0, 2)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cluster */}
        {selectedState && availableClusters.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-gray-800 text-[15px]">Select Cluster</h3>
              <button className="text-blue-500 text-xs hover:underline">Select All</button>
            </div>
            <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
              <div
                onClick={() => setSelectedCluster('All')}
                className={`flex-shrink-0 cursor-pointer w-48 p-4 rounded-lg border text-center transition-all ${selectedCluster === 'All' ? 'bg-[#ebf5ff] border-blue-400' : 'bg-white border-gray-200'}`}
              >
                <p className="font-bold text-sm text-gray-800">All Clusters</p>
                <p className="text-[10px] text-gray-400 uppercase mt-1">ALL</p>
              </div>
              {availableClusters.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedCluster(item)}
                  className={`flex-shrink-0 cursor-pointer w-48 p-4 rounded-lg border text-center transition-all ${selectedCluster === item ? 'bg-[#ebf5ff] border-blue-400' : 'bg-white border-gray-200'}`}
                >
                  <p className="font-bold text-sm text-gray-800">{item}</p>
                  <p className="text-[10px] text-gray-400 uppercase mt-1">CLST</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* District */}
        {selectedCluster && availableDistricts.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-gray-800 text-[15px]">Select District</h3>
              <button className="text-blue-500 text-xs hover:underline">Select All</button>
            </div>
            <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
              <div
                onClick={() => setSelectedDistrict('All')}
                className={`flex-shrink-0 cursor-pointer w-48 p-4 rounded-lg border text-center transition-all ${selectedDistrict === 'All' ? 'bg-[#ebf5ff] border-blue-400' : 'bg-white border-gray-200'}`}
              >
                <p className="font-bold text-sm text-gray-800">All Districts</p>
                <p className="text-[10px] text-gray-400 uppercase mt-1">ALL</p>
              </div>
              {availableDistricts.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedDistrict(item)}
                  className={`flex-shrink-0 cursor-pointer w-48 p-4 rounded-lg border text-center transition-all ${selectedDistrict === item ? 'bg-[#ebf5ff] border-blue-400' : 'bg-white border-gray-200'}`}
                >
                  <p className="font-bold text-sm text-gray-800">{item}</p>
                  <p className="text-[10px] text-gray-400 uppercase mt-1">DIST</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Header & Flow Selection */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-[#142340]">Order Journey</h1>
          <p className="text-sm text-gray-500 mt-1">Navigate through the order lifecycle</p>
        </div>
        <div className="flex items-center space-x-3">
          <label className="text-sm font-semibold text-gray-700">Journey Flow Type:</label>
          <select 
            className="border border-gray-300 rounded-lg p-2 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm"
            value={orderType} 
            onChange={handleFlowChange}
          >
            {Object.entries(dynamicFlows).map(([key, flow]) => (
              <option key={key} value={key}>{flow.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Horizontal Stepper */}
      <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-100 shadow-sm mb-6">
        <div className="w-full overflow-x-auto pb-6 custom-scrollbar">
          <div className="flex items-start justify-between min-w-max pt-2 px-4">
            {activeFlow.steps.map((step, index) => {
              const isCompleted = index < currentStep;
              const isActive = index === currentStep;

              return (
                <React.Fragment key={index}>
                  <div 
                    className="flex flex-col items-center cursor-pointer group w-28 md:w-32 flex-shrink-0"
                    onClick={() => setCurrentStep(index)}
                  >
                    <div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-sm ${
                        isCompleted ? 'bg-[#2cb25d] border-[#2cb25d] text-white' : 
                        isActive ? 'bg-blue-600 border-blue-600 text-white ring-4 ring-blue-100' : 
                        'bg-white border-gray-300 text-gray-400 group-hover:border-blue-400'
                      }`}
                    >
                      {isCompleted ? <Check size={20} /> : <span className="font-bold">{index + 1}</span>}
                    </div>
                    <span className={`mt-3 text-[11px] md:text-[13px] font-bold tracking-wide text-center leading-tight transition-colors ${
                      isCompleted ? 'text-[#2cb25d]' : 
                      isActive ? 'text-blue-600' : 
                      'text-gray-400 group-hover:text-gray-600'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                  
                  {/* Connecting Line */}
                  {index < activeFlow.steps.length - 1 && (
                    <div className="flex-1 mx-2 flex items-center mt-5 min-w-[50px] md:min-w-[80px]">
                      <div className={`h-1 w-full rounded-full transition-all duration-300 ${
                        isCompleted ? 'bg-[#2cb25d]' : 'bg-gray-200'
                      }`}></div>
                      <ChevronRight size={16} className={`ml-1 hidden md:block flex-shrink-0 ${isCompleted ? 'text-[#2cb25d]' : 'text-gray-300'}`} />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative min-h-[500px]">
        {/* We wrap the component in a container that handles overflow if needed, or let the component dictate it */}
        <div className="w-full h-full animate-fade-in">
           {ActiveComponent && <ActiveComponent 
              onNext={handleNextStep} 
              sharedOrderData={sharedOrderData} 
              setSharedOrderData={setSharedOrderData} 
              dashboardData={dashboardData}
              setDashboardData={setDashboardData}
           />}
        </div>
      </div>
      
    </div>
  );
}
