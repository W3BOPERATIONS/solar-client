import React, { useState, useEffect } from 'react';
import {
  getInstallerAgencyPlans,
  createInstallerAgencyPlan,
  updateInstallerAgencyPlan,
  deleteInstallerAgencyPlan
} from '../../../../services/installer/installerApi';
import { getStates } from '../../../../services/locationApi';
import toast from 'react-hot-toast';
import { Plus, ChevronRight } from 'lucide-react';

const AgencyPlan = () => {
  const [states, setStates] = useState([]);
  const [selectedState, setSelectedState] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePlanId, setActivePlanId] = useState(null);

  // Default empty form data structure
  const defaultFormData = {
    name: '',
    eligibility: { kyc: true, agreement: true },
    coverage: '1 District',
    userLimits: 10,
    subUser: { sales: true, dealer: true, leadPartner: true, service: true },
    assignedProjectTypes: { district: true, cluster: false, state: false },
    categoryType: { solarPanel: true, solarRooftop: true, solarPump: false, solarWaterHeater: false },
    subCategoryType: { residential: true, commercial: true },
    projectType: { upTo100Kw: true, upTo200Kw: true, above100Kw: false },
    subProjectType: { onGrid: true, offGrid: true, hybrid: false },
    solarInstallationPoints: [
      { typeLabel: 'Residential', points: 1000, periodInMonth: 6, claimInMonth: 2 },
      { typeLabel: 'Commercial up to 100 Kw', points: 1500, periodInMonth: 5, claimInMonth: 2 },
      { typeLabel: 'Commercial above 100 Kw', points: 2000, periodInMonth: 6, claimInMonth: 1 }
    ],
    solarInstallationCharges: [
      { typeLabel: 'Residential', charges: 1000 },
      { typeLabel: 'Commercial up to 100 Kw', charges: 1500 },
      { typeLabel: 'Commercial above 100 Kw', charges: 2000 }
    ],
    isActive: true
  };

  const [formData, setFormData] = useState(defaultFormData);

  useEffect(() => {
    fetchStates();
  }, []);

  useEffect(() => {
    if (selectedState) {
      fetchPlans(selectedState);
    } else {
      setPlans([]);
      setActivePlanId(null);
    }
  }, [selectedState]);

  const fetchStates = async () => {
    try {
      setLoading(true);
      const data = await getStates();
      setStates(data);
    } catch (error) {
      console.error('Error fetching states:', error);
      toast.error('Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async (stateId) => {
    try {
      setLoading(true);
      const data = await getInstallerAgencyPlans(stateId);
      setPlans(data);
      if (data.length > 0) {
        if (!activePlanId || !data.find(p => p._id === activePlanId)) {
          setActivePlanId(data[0]._id);
          setFormData(data[0]);
        }
      } else {
        setActivePlanId(null);
        setFormData(null);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const handleTabClick = (plan) => {
    setActivePlanId(plan._id);
    setFormData(plan);
  };

  const handleAddNewClick = async () => {
    if (!selectedState) {
      toast.error('Please select a Setup Location first');
      return;
    }
    try {
      setLoading(true);
      const newName = `Plan ${plans.length + 1}`;
      const payload = { ...defaultFormData, name: newName, state: selectedState };
      const created = await createInstallerAgencyPlan(payload);
      toast.success(`${newName} added successfully`);
      
      setPlans((prev) => [...prev, created]);
      setActivePlanId(created._id);
      setFormData(created);
    } catch (error) {
      console.error('Error adding plan:', error);
      toast.error('Failed to add plan');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (section, field) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: !prev[section][field]
      }
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePointsChange = (index, field, value) => {
    const newPoints = [...formData.solarInstallationPoints];
    newPoints[index][field] = value;
    setFormData((prev) => ({ ...prev, solarInstallationPoints: newPoints }));
  };

  const handleChargesChange = (index, value) => {
    const newCharges = [...formData.solarInstallationCharges];
    newCharges[index].charges = value;
    setFormData((prev) => ({ ...prev, solarInstallationCharges: newCharges }));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!selectedState) {
      toast.error('Please select a Setup Location first');
      return;
    }
    try {
      if (!activePlanId) {
        // Fallback catch (should not happen with instant creation)
        const payload = { ...formData, state: selectedState };
        const created = await createInstallerAgencyPlan(payload);
        toast.success('Saved Successfully!');
        fetchPlans(selectedState);
      } else {
        const payload = { ...formData, state: selectedState };
        await updateInstallerAgencyPlan(activePlanId, payload);
        toast.success('Saved Successfully!');
        fetchPlans(selectedState);
      }
    } catch (error) {
      console.error('Error saving plan:', error);
      toast.error('Failed to save plan');
    }
  };

  // Helper component for checkboxes
  const CheckboxField = ({ label, checked, onChange }) => (
    <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
      />
      {label}
    </label>
  );

  return (
    <div className="min-h-screen bg-[#f5f7fb] p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Setup Location Selection */}
        {!selectedState ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-semibold text-center mb-6 text-gray-800">Select Setup Location</h2>
            {loading ? (
               <div className="p-8 text-center text-gray-500">Loading locations...</div>
            ) : (
               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                 {states.map((state) => (
                   <div
                     key={state._id}
                     onClick={() => setSelectedState(state._id)}
                     className="bg-white border border-gray-200 rounded-lg p-6 text-center cursor-pointer hover:shadow-md transition-shadow hover:border-blue-400"
                   >
                     <h3 className="text-lg font-bold text-gray-800">{state.name}</h3>
                     <p className="text-gray-500 mt-1">{state.abbreviation}</p>
                   </div>
                 ))}
               </div>
            )}
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
               <button 
                  onClick={() => setSelectedState(null)} 
                  className="text-blue-600 hover:text-blue-800 flex items-center font-medium"
               >
                 <ChevronRight className="w-4 h-4 mr-1 rotate-180" />
                 Back to Locations
               </button>
            </div>

            {/* State Header Display */}
            <div className="flex flex-wrap gap-4 mb-8 justify-center">
               {states.map((state) => (
                 <div
                   key={state._id}
                   onClick={() => setSelectedState(state._id)}
                   className={`bg-white border rounded-lg px-8 py-4 text-center cursor-pointer transition-all ${
                     selectedState === state._id 
                        ? 'border-blue-500 shadow-sm ring-1 ring-blue-500' 
                        : 'border-gray-200 hover:border-blue-300'
                   }`}
                 >
                   <h3 className="text-lg font-bold text-gray-800">{state.name}</h3>
                 </div>
               ))}
            </div>

            {/* Add More Plan Button */}
            <div className="flex justify-center mb-6">
              <button
                onClick={handleAddNewClick}
                disabled={loading}
                className="px-6 py-2 text-sm font-semibold rounded-md flex items-center gap-1 transition-all bg-[#1a2332] text-white hover:bg-gray-800 shadow-md"
              >
                Add More Plan
              </button>
            </div>

            {/* Tabs */}
            {plans.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6 justify-center">
                {plans.map((plan) => (
                  <button
                    key={plan._id}
                    onClick={() => handleTabClick(plan)}
                    className={`px-6 py-2 text-sm font-semibold rounded-md transition-all ${
                      activePlanId === plan._id
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white text-gray-500 hover:text-gray-800 border-b-2 border-transparent'
                    }`}
                  >
                    {plan.name}
                  </button>
                ))}
              </div>
            )}

            {loading && plans.length === 0 ? (
               <div className="p-8 text-center text-gray-500">Loading plan...</div>
            ) : plans.length > 0 && formData ? (
               <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8">
                 <div className="mb-6 pb-2 inline-block">
                   <input
                     type="text"
                     name="name"
                     value={formData.name || ''}
                     onChange={handleInputChange}
                     className="text-2xl font-bold text-blue-600 bg-transparent outline-none placeholder-blue-300 border-b border-dashed border-blue-400 min-w-[200px]"
                     placeholder="Enter Plan Name"
                   />
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                   {/* Column 1 */}
                   <div className="space-y-6">
                     <div>
                       <h4 className="text-sm font-medium text-gray-600 mb-2">Eligibility Requirements</h4>
                       <div className="space-y-1">
                         <CheckboxField
                           label="KYC"
                           checked={formData.eligibility.kyc}
                           onChange={() => handleCheckboxChange('eligibility', 'kyc')}
                         />
                         <CheckboxField
                           label="Agreement"
                           checked={formData.eligibility.agreement}
                           onChange={() => handleCheckboxChange('eligibility', 'agreement')}
                         />
                       </div>
                     </div>

                     <div className="pt-2">
                       <h4 className="text-sm font-medium text-gray-600 mb-2">Sub User</h4>
                       <div className="space-y-1">
                         <CheckboxField
                           label="Sales"
                           checked={formData.subUser.sales}
                           onChange={() => handleCheckboxChange('subUser', 'sales')}
                         />
                         <CheckboxField
                           label="Dealer"
                           checked={formData.subUser.dealer}
                           onChange={() => handleCheckboxChange('subUser', 'dealer')}
                         />
                         <CheckboxField
                           label="Lead Partner"
                           checked={formData.subUser.leadPartner}
                           onChange={() => handleCheckboxChange('subUser', 'leadPartner')}
                         />
                         <CheckboxField
                           label="Service"
                           checked={formData.subUser.service}
                           onChange={() => handleCheckboxChange('subUser', 'service')}
                         />
                       </div>
                     </div>

                     <div className="pt-2">
                       <h4 className="text-sm font-medium text-gray-600 mb-2">Category Type</h4>
                       <div className="space-y-1">
                         <CheckboxField
                           label="Solar Panel"
                           checked={formData.categoryType.solarPanel}
                           onChange={() => handleCheckboxChange('categoryType', 'solarPanel')}
                         />
                         <CheckboxField
                           label="Solar Rooftop"
                           checked={formData.categoryType.solarRooftop}
                           onChange={() => handleCheckboxChange('categoryType', 'solarRooftop')}
                         />
                         <CheckboxField
                           label="Solar Pump"
                           checked={formData.categoryType.solarPump}
                           onChange={() => handleCheckboxChange('categoryType', 'solarPump')}
                         />
                         <CheckboxField
                           label="Solar Water Heater"
                           checked={formData.categoryType.solarWaterHeater}
                           onChange={() => handleCheckboxChange('categoryType', 'solarWaterHeater')}
                         />
                       </div>
                     </div>
                   </div>

                   {/* Column 2 */}
                   <div className="space-y-6">
                     <div>
                       <h4 className="text-sm font-medium text-gray-600 mb-2">Coverage</h4>
                       <input
                         type="text"
                         name="coverage"
                         value={formData.coverage}
                         onChange={handleInputChange}
                         className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-blue-500 max-w-[200px]"
                         placeholder="e.g. 1 District"
                       />
                     </div>

                     <div className="pt-5">
                       <h4 className="text-sm font-medium text-gray-600 mb-2">User Limits</h4>
                       <input
                         type="number"
                         name="userLimits"
                         value={formData.userLimits}
                         onChange={handleInputChange}
                         className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-blue-500 max-w-[200px]"
                         placeholder="e.g. 10"
                       />
                     </div>

                     <div className="pt-2">
                       <h4 className="text-sm font-medium text-gray-600 mb-2">Sub Category Type</h4>
                       <div className="space-y-1">
                         <CheckboxField
                           label="Residential"
                           checked={formData.subCategoryType.residential}
                           onChange={() => handleCheckboxChange('subCategoryType', 'residential')}
                         />
                         <CheckboxField
                           label="Commercial"
                           checked={formData.subCategoryType.commercial}
                           onChange={() => handleCheckboxChange('subCategoryType', 'commercial')}
                         />
                       </div>
                     </div>
                   </div>

                   {/* Column 3 */}
                   <div className="space-y-6">
                     <div>
                       <h4 className="text-sm font-medium text-gray-600 mb-2">Assigned Project Types</h4>
                       <div className="space-y-1">
                         <CheckboxField
                           label="District project types"
                           checked={formData.assignedProjectTypes.district}
                           onChange={() => handleCheckboxChange('assignedProjectTypes', 'district')}
                         />
                         <CheckboxField
                           label="Cluster project types"
                           checked={formData.assignedProjectTypes.cluster}
                           onChange={() => handleCheckboxChange('assignedProjectTypes', 'cluster')}
                         />
                         <CheckboxField
                           label="State all project types"
                           checked={formData.assignedProjectTypes.state}
                           onChange={() => handleCheckboxChange('assignedProjectTypes', 'state')}
                         />
                       </div>
                     </div>

                     <div>
                       <h4 className="text-sm font-medium text-gray-600 mb-2">Project Type</h4>
                       <div className="space-y-1">
                         <CheckboxField
                           label="Up To 100 KW"
                           checked={formData.projectType.upTo100Kw}
                           onChange={() => handleCheckboxChange('projectType', 'upTo100Kw')}
                         />
                         <CheckboxField
                           label="Up To 200 KW"
                           checked={formData.projectType.upTo200Kw}
                           onChange={() => handleCheckboxChange('projectType', 'upTo200Kw')}
                         />
                         <CheckboxField
                           label="Above 100 KW"
                           checked={formData.projectType.above100Kw}
                           onChange={() => handleCheckboxChange('projectType', 'above100Kw')}
                         />
                       </div>
                     </div>

                     <div>
                       <h4 className="text-sm font-medium text-gray-600 mb-2">Sub Project Type</h4>
                       <div className="space-y-1">
                         <CheckboxField
                           label="On-Grid"
                           checked={formData.subProjectType.onGrid}
                           onChange={() => handleCheckboxChange('subProjectType', 'onGrid')}
                         />
                         <CheckboxField
                           label="Off-Grid"
                           checked={formData.subProjectType.offGrid}
                           onChange={() => handleCheckboxChange('subProjectType', 'offGrid')}
                         />
                         <CheckboxField
                           label="Hybrid"
                           checked={formData.subProjectType.hybrid}
                           onChange={() => handleCheckboxChange('subProjectType', 'hybrid')}
                         />
                       </div>
                     </div>
                   </div>
                 </div>

                 {/* Solar Installation Points */}
                 <div className="mb-6">
                   <h3 className="text-sm font-medium text-gray-600 mb-3">
                     Solar Installation Points
                   </h3>
                   <div className="space-y-3">
                     {formData.solarInstallationPoints.map((item, index) => (
                       <div key={index} className="border border-gray-200 p-4 rounded-md">
                         <h4 className="text-sm font-bold text-gray-800 mb-3">{item.typeLabel}</h4>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                           <div>
                             <label className="block text-xs text-gray-600 mb-1">Points</label>
                             <input
                               type="number"
                               value={item.points}
                               onChange={(e) => handlePointsChange(index, 'points', e.target.value)}
                               className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                               placeholder="e.g. 1000"
                             />
                           </div>
                           <div>
                             <label className="block text-xs text-gray-600 mb-1">Period (in Month)</label>
                             <input
                               type="number"
                               value={item.periodInMonth}
                               onChange={(e) => handlePointsChange(index, 'periodInMonth', e.target.value)}
                               className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                               placeholder="e.g. 6"
                             />
                           </div>
                           <div>
                             <label className="block text-xs text-gray-600 mb-1">Claim (in Month)</label>
                             <input
                               type="number"
                               value={item.claimInMonth}
                               onChange={(e) => handlePointsChange(index, 'claimInMonth', e.target.value)}
                               className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                               placeholder="e.g. 2"
                             />
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>

                 {/* Solar Installation Charges */}
                 <div className="mb-8">
                   <h3 className="text-sm font-medium text-gray-600 mb-3">
                     Solar Installation Charges
                   </h3>
                   <div className="space-y-3">
                     {formData.solarInstallationCharges.map((item, index) => (
                       <div key={index} className="border border-gray-200 p-4 rounded-md">
                         <h4 className="text-sm font-bold text-gray-800 mb-3">{item.typeLabel}</h4>
                         <div>
                           <label className="block text-xs text-gray-600 mb-1">₹ charges</label>
                           <input
                             type="number"
                             value={item.charges}
                             onChange={(e) => handleChargesChange(index, e.target.value)}
                             className="w-full md:w-1/3 border border-gray-300 rounded-md px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                             placeholder="e.g. 1000"
                           />
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>

                 {/* Actions */}
                 <div className="mt-8 flex justify-end">
                   <button
                     onClick={handleSave}
                     className="px-6 py-2 bg-[#1B57A6] hover:bg-blue-800 text-white rounded-md text-sm font-medium transition-colors"
                   >
                     Save Changes
                   </button>
                 </div>
               </div>
            ) : (
               <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 text-center text-gray-500">
                 No plans available for this location. Click "Add More Plan" to create one.
               </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AgencyPlan;
