import React, { useState, useEffect } from 'react';
import api from '../../../api/axios';
import CreateOrder from './order-journey/CreateOrder';
import LoanOrders from './order-journey/LoanOrders';
import DeliveryPlan from './order-journey/DeliveryPlan';
import VendorPay from './order-journey/VendorPay';
import ChannelPartnerPay from './order-journey/ChannelPartnerPay';
import DeliveryManagement from './order-journey/DeliveryManagement';
import ProcurementPlan from '../ProcurementPlan';
import { Check, ChevronRight } from 'lucide-react';

const componentRegistry = {
  'CreateOrder': CreateOrder,
  'VendorPay': VendorPay,
  'DeliveryPlan': DeliveryPlan,
  'DeliveryManagement': DeliveryManagement,
  'LoanOrders': LoanOrders,
  'ChannelPartnerPay': ChannelPartnerPay,
  'ProcurementPlaceholder': ProcurementPlan,
  'AtWarehouse': ({ onNext }) => (
    <div className="p-10 bg-white rounded-xl shadow-sm text-center border border-gray-200 mt-6">
      <h2 className="text-xl font-bold text-[#0b74ba]">At Warehouse Stage</h2>
      <p className="text-gray-500 mt-2 font-medium mb-6">This module is under development by Solarkits.</p>
      <button 
        onClick={onNext}
        className="bg-[#2cb25d] hover:bg-green-700 text-white px-6 py-2 rounded text-[13px] font-bold shadow-sm transition"
      >
        Next Step
      </button>
    </div>
  )
};

export default function OrderJourney() {
  const [orderType, setOrderType] = useState('project_signup');
  const [currentStep, setCurrentStep] = useState(0);
  const [dynamicFlows, setDynamicFlows] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFlows = async () => {
      try {
        const response = await api.get('/dashboard/account-manager/order-journey-flows');
        if (response.data?.success) {
          setDynamicFlows(response.data.data);
          // Set initial flow based on what is returned if project_signup doesn't exist
          if (!response.data.data['project_signup']) {
            setOrderType(Object.keys(response.data.data)[0]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch Order Journey flows", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFlows();
  }, []);

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
      <div className="bg-white p-4 md:p-6 pb-8 md:pb-8 rounded-xl border border-gray-100 shadow-sm overflow-visible">
        <div className="flex items-start justify-between w-full pt-2">
          {activeFlow.steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isActive = index === currentStep;
            const isPending = index > currentStep;

            return (
              <React.Fragment key={index}>
                <div 
                  className="flex flex-col items-center cursor-pointer group w-24 md:w-32 flex-shrink-0"
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
                  <div className="flex-1 mx-2 flex items-center mt-5 min-w-[20px]">
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

      {/* Main Content Area */}
      <div className="flex-1 relative min-h-[500px]">
        {/* We wrap the component in a container that handles overflow if needed, or let the component dictate it */}
        <div className="w-full h-full animate-fade-in">
           {ActiveComponent && <ActiveComponent onNext={handleNextStep} />}
        </div>
      </div>
      
    </div>
  );
}
