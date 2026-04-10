import React, { useState, useMemo } from 'react';
import { InsurancePolicy, PrepaidService, InventoryItem, PetProfile } from '../types';
import { generateId, formatDate } from '../utils';
import { Plus, Trash2, X, Shield, Scissors, Building, PiggyBank, FileText, CheckCircle2, Clock, AlertCircle, Edit2 } from 'lucide-react';

interface FinanceSectionProps {
  policies: InsurancePolicy[];
  setPolicies: (policies: InsurancePolicy[]) => void;
  services: PrepaidService[];
  setServices: (services: PrepaidService[]) => void;
  inventoryItems: InventoryItem[];
  profile: PetProfile;
}

export const FinanceSection: React.FC<FinanceSectionProps> = ({ policies, setPolicies, services, setServices, inventoryItems, profile }) => {
  const [activeTab, setActiveTab] = useState<'Insurance' | 'Prepaid'>('Insurance');
  
  // Forms
  const [isPolicyFormOpen, setIsPolicyFormOpen] = useState(false);
  const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null);
  const [newPolicy, setNewPolicy] = useState<Partial<InsurancePolicy>>({});
  
  const [isServiceFormOpen, setIsServiceFormOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [newService, setNewService] = useState<Partial<PrepaidService>>({ type: 'Grooming' });

  // Policy Details Modal
  const [selectedPolicy, setSelectedPolicy] = useState<InsurancePolicy | null>(null);
  const [newClaim, setNewClaim] = useState<{date: string, amount: number, status: 'Pending' | 'Approved' | 'Rejected'}>({ date: new Date().toISOString().split('T')[0], amount: 0, status: 'Pending' });
  const [newLimit, setNewLimit] = useState<{item: string, limit: number, used: number}>({ item: '', limit: 0, used: 0 });

  // Hotel Plan State
  const [showHotelPlan, setShowHotelPlan] = useState(false);
  const [hotelDays, setHotelDays] = useState(1);

  const getServiceTypeName = (type: string) => {
    switch(type) {
      case 'Grooming': return '美容 Grooming';
      case 'Hotel': return '住宿 Hotel';
      case 'MedicalFund': return '醫療基金 Medical Fund';
      default: return type;
    }
  };

  const handleOpenPolicyForm = (policy?: InsurancePolicy) => {
    if (policy) {
      setEditingPolicyId(policy.id);
      setNewPolicy(policy);
    } else {
      setEditingPolicyId(null);
      setNewPolicy({});
    }
    setIsPolicyFormOpen(true);
  };

  const handleOpenServiceForm = (service?: PrepaidService) => {
    if (service) {
      setEditingServiceId(service.id);
      setNewService(service);
    } else {
      setEditingServiceId(null);
      setNewService({ type: 'Grooming' });
    }
    setIsServiceFormOpen(true);
  };

  const handlePolicySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPolicy.name && newPolicy.provider && newPolicy.expiryDate) {
      const policyData = {
        id: editingPolicyId || generateId(),
        name: newPolicy.name,
        provider: newPolicy.provider,
        expiryDate: newPolicy.expiryDate,
        coverageLimits: newPolicy.coverageLimits || [],
        claims: newPolicy.claims || [],
      };

      if (editingPolicyId) {
        setPolicies(policies.map(p => p.id === editingPolicyId ? policyData : p));
      } else {
        setPolicies([...policies, policyData]);
      }
      
      setIsPolicyFormOpen(false);
      setNewPolicy({});
      setEditingPolicyId(null);
    }
  };

  const handleServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newService.name && newService.balance !== undefined) {
      const serviceData = {
        id: editingServiceId || generateId(),
        name: newService.name,
        type: newService.type as 'Grooming' | 'Hotel' | 'MedicalFund',
        balance: Number(newService.balance),
        expiryDate: newService.expiryDate,
        notes: newService.notes,
      };

      if (editingServiceId) {
        setServices(services.map(s => s.id === editingServiceId ? serviceData : s));
      } else {
        setServices([...services, serviceData]);
      }
      
      setIsServiceFormOpen(false);
      setNewService({ type: 'Grooming' });
      setEditingServiceId(null);
    }
  };

  const deletePolicy = (id: string) => setPolicies(policies.filter(p => p.id !== id));
  const deleteService = (id: string) => setServices(services.filter(s => s.id !== id));

  const handleAddClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPolicy && newClaim.amount > 0) {
      const updatedPolicy = {
        ...selectedPolicy,
        claims: [...selectedPolicy.claims, { id: generateId(), ...newClaim }]
      };
      setPolicies(policies.map(p => p.id === selectedPolicy.id ? updatedPolicy : p));
      setSelectedPolicy(updatedPolicy);
      setNewClaim({ date: new Date().toISOString().split('T')[0], amount: 0, status: 'Pending' });
    }
  };

  const handleAddLimit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPolicy && newLimit.item && newLimit.limit > 0) {
      const updatedPolicy = {
        ...selectedPolicy,
        coverageLimits: [...selectedPolicy.coverageLimits, { ...newLimit }]
      };
      setPolicies(policies.map(p => p.id === selectedPolicy.id ? updatedPolicy : p));
      setSelectedPolicy(updatedPolicy);
      setNewLimit({ item: '', limit: 0, used: 0 });
    }
  };

  const deleteClaim = (policyId: string, claimId: string) => {
    const policy = policies.find(p => p.id === policyId);
    if (policy) {
      const updatedPolicy = { ...policy, claims: policy.claims.filter(c => c.id !== claimId) };
      setPolicies(policies.map(p => p.id === policyId ? updatedPolicy : p));
      if (selectedPolicy?.id === policyId) setSelectedPolicy(updatedPolicy);
    }
  };

  const deleteLimit = (policyId: string, item: string) => {
    const policy = policies.find(p => p.id === policyId);
    if (policy) {
      const updatedPolicy = { ...policy, coverageLimits: policy.coverageLimits.filter(l => l.item !== item) };
      setPolicies(policies.map(p => p.id === policyId ? updatedPolicy : p));
      if (selectedPolicy?.id === policyId) setSelectedPolicy(updatedPolicy);
    }
  };

  const updateLimitUsed = (policyId: string, item: string, used: number) => {
    const policy = policies.find(p => p.id === policyId);
    if (policy) {
      const updatedPolicy = {
        ...policy,
        coverageLimits: policy.coverageLimits.map(l => l.item === item ? { ...l, used } : l)
      };
      setPolicies(policies.map(p => p.id === policyId ? updatedPolicy : p));
      if (selectedPolicy?.id === policyId) setSelectedPolicy(updatedPolicy);
    }
  };

  // Generate Hotel Plan
  const hotelPlanText = useMemo(() => {
    const foodItems = inventoryItems.filter(i => i.type === 'Food').sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
    const supplementItems = inventoryItems.filter(i => i.type === 'Supplement');
    
    let text = `寵物住宿餵食指示 Pet Hotel Feeding Instructions:\n\n天數 Duration: ${hotelDays} 天 days\n\n`;
    
    if (profile.idealWeight && profile.activityLevel) {
      const rer = 70 * Math.pow(profile.idealWeight, 0.75);
      const multipliers = {
        'resting': 1.2,
        'neutered_adult': 1.6,
        'intact_adult': 1.8,
        'active': 2.0,
        'highly_active': 3.0,
        'weight_loss': 1.0,
        'weight_gain': 1.8
      };
      const mer = rer * (multipliers[profile.activityLevel] || 1.6);
      
      const primaryFood = foodItems[0];
      if (primaryFood && primaryFood.caloriesPerUnit) {
        const dailyAmount = Math.round(mer / primaryFood.caloriesPerUnit);
        const totalAmount = dailyAmount * hotelDays;
        text += `每日餵食計畫 Daily Feeding Plan:\n- 每日總量 Total Daily Amount: ${dailyAmount}${primaryFood.unit} (${primaryFood.name})\n`;
        text += `- 早餐 Breakfast: ${Math.round(dailyAmount / 2)}${primaryFood.unit}\n`;
        text += `- 晚餐 Dinner: ${Math.round(dailyAmount / 2)}${primaryFood.unit}\n\n`;
        text += `需準備總食物量 Total Food to Prepare: ${totalAmount}${primaryFood.unit} (${primaryFood.name})\n\n`;
      } else {
        text += `每日餵食計畫 Daily Feeding Plan:\n- 早餐 Breakfast: [數量 Amount] [食物名稱 Food Name]\n- 晚餐 Dinner: [數量 Amount] [食物名稱 Food Name]\n\n`;
        text += `需準備總食物量 Total Food to Prepare: [總數量 Total Amount]\n\n`;
      }
    } else {
      text += `每日餵食計畫 Daily Feeding Plan:\n- 早餐 Breakfast: [數量 Amount] [食物名稱 Food Name]\n- 晚餐 Dinner: [數量 Amount] [食物名稱 Food Name]\n\n`;
      text += `需準備總食物量 Total Food to Prepare: [總數量 Total Amount]\n\n`;
    }

    if (supplementItems.length > 0) {
      text += `保健食品 Supplements:\n`;
      supplementItems.forEach(sup => {
        text += `- ${sup.name}: 每日 [數量 Amount] per day (總共 Total: [總數量 Total Amount])\n`;
      });
    }

    return text;
  }, [hotelDays, inventoryItems, profile]);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Tabs */}
      <div className="flex bg-white/50 backdrop-blur-md p-1 rounded-2xl shadow-soft border border-white">
        <button 
          onClick={() => setActiveTab('Insurance')}
          className={`flex-1 py-3 rounded-xl text-sm font-bold tracking-widest uppercase font-sans transition-all duration-300 ${
              activeTab === 'Insurance' ? 'bg-white text-ink shadow-sm' : 'text-pencil hover:text-ink/70'
          }`}
        >
          保險 Insurance
        </button>
        <button 
          onClick={() => setActiveTab('Prepaid')}
          className={`flex-1 py-3 rounded-xl text-sm font-bold tracking-widest uppercase font-sans transition-all duration-300 ${
              activeTab === 'Prepaid' ? 'bg-white text-ink shadow-sm' : 'text-pencil hover:text-ink/70'
          }`}
        >
          預付與基金 Prepaid & Funds
        </button>
      </div>

      {activeTab === 'Insurance' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex justify-end px-2">
             <button 
                onClick={() => handleOpenPolicyForm()}
                className="w-10 h-10 rounded-full bg-white border border-sand flex items-center justify-center text-ink shadow-sm hover:bg-sand/20 transition-colors"
             >
                <Plus size={18} />
             </button>
          </div>

          {policies.length === 0 && (
            <div className="bg-white/50 border border-dashed border-sand rounded-3xl p-8 flex flex-col items-center justify-center text-center gap-4 group hover:border-gold/50 hover:bg-white/80 transition-all cursor-pointer" onClick={() => handleOpenPolicyForm()}>
               <div className="w-12 h-12 rounded-full bg-sand/20 flex items-center justify-center text-pencil group-hover:text-gold group-hover:scale-110 transition-all duration-500">
                 <Shield size={24} />
               </div>
               <p className="text-sm font-fangsong text-pencil">尚無保險紀錄。<br/>No insurance policies. Tap to add one.</p>
            </div>
          )}

          {policies.map(policy => {
            const isExpiringSoon = new Date(policy.expiryDate).getTime() - new Date().getTime() < 30 * 24 * 60 * 60 * 1000;
            return (
              <div key={policy.id} className="card-warm rounded-2xl p-6 relative group cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedPolicy(policy)}>
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleOpenPolicyForm(policy); }}
                      className="text-sand hover:text-clay transition-colors p-1"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deletePolicy(policy.id); }}
                      className="text-sand hover:text-clay transition-colors p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="flex gap-4 pr-16">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center icon-gold flex-shrink-0">
                          <Shield size={20} />
                      </div>
                      <div className="flex-1">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-pencil font-sans mb-1">{policy.provider}</div>
                          <div className="text-xl font-fangsong text-ink">{policy.name}</div>
                          
                          <div className={`mt-3 px-3 py-2 rounded-lg inline-block ${isExpiringSoon ? 'bg-clay/10' : 'bg-sand/10'}`}>
                              <div className={`text-[10px] font-sans uppercase tracking-widest mb-0.5 ${isExpiringSoon ? 'text-clay font-bold' : 'text-pencil'}`}>到期 Expires</div>
                              <div className={`text-sm font-fangsong font-medium ${isExpiringSoon ? 'text-clay' : 'text-ink'}`}>
                                {formatDate(policy.expiryDate)}
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'Prepaid' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex justify-between items-center px-2">
             <button 
                onClick={() => setShowHotelPlan(true)}
                className="px-4 py-2 rounded-full bg-clay/10 text-clay text-xs font-bold uppercase tracking-widest font-sans hover:bg-clay/20 transition-colors flex items-center gap-2"
             >
                <FileText size={14} /> 住宿計畫 Hotel Plan
             </button>
             <button 
                onClick={() => handleOpenServiceForm()}
                className="w-10 h-10 rounded-full bg-white border border-sand flex items-center justify-center text-ink shadow-sm hover:bg-sand/20 transition-colors"
             >
                <Plus size={18} />
             </button>
          </div>

          {services.length === 0 && (
            <div className="bg-white/50 border border-dashed border-sand rounded-3xl p-8 flex flex-col items-center justify-center text-center gap-4 group hover:border-gold/50 hover:bg-white/80 transition-all cursor-pointer" onClick={() => handleOpenServiceForm()}>
               <div className="w-12 h-12 rounded-full bg-sand/20 flex items-center justify-center text-pencil group-hover:text-gold group-hover:scale-110 transition-all duration-500">
                 <PiggyBank size={24} />
               </div>
               <p className="text-sm font-fangsong text-pencil">尚無預付服務。<br/>No prepaid services. Tap to add balance.</p>
            </div>
          )}

          {services.map(service => {
            const isExpiringSoon = service.expiryDate && new Date(service.expiryDate).getTime() - new Date().getTime() < 30 * 24 * 60 * 60 * 1000;
            return (
              <div key={service.id} className="card-warm rounded-2xl p-6 relative group">
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button 
                      onClick={() => handleOpenServiceForm(service)}
                      className="text-sand hover:text-clay transition-colors p-1"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => deleteService(service.id)}
                      className="text-sand hover:text-clay transition-colors p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="flex gap-4 pr-16">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                          service.type === 'Grooming' ? 'bg-pink-50 text-pink-500' :
                          service.type === 'Hotel' ? 'icon-gold' :
                          'icon-sage'
                      }`}>
                          {service.type === 'Grooming' ? <Scissors size={20} /> :
                           service.type === 'Hotel' ? <Building size={20} /> :
                           <PiggyBank size={20} />}
                      </div>
                      <div className="flex-1">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-pencil font-sans mb-1">{getServiceTypeName(service.type)}</div>
                          <div className="text-xl font-fangsong text-ink">{service.name}</div>
                          
                          <div className="mt-4 grid grid-cols-2 gap-3">
                              <div className="bg-sand/10 px-3 py-2 rounded-lg">
                                  <div className="text-[10px] font-sans uppercase tracking-widest mb-0.5 text-pencil">餘額 Balance</div>
                                  <div className="text-lg font-fangsong text-ink font-medium">${service.balance}</div>
                              </div>
                              {service.expiryDate && (
                                <div className={`px-3 py-2 rounded-lg ${isExpiringSoon ? 'bg-clay/10' : 'bg-sand/10'}`}>
                                    <div className={`text-[10px] font-sans uppercase tracking-widest mb-0.5 ${isExpiringSoon ? 'text-clay font-bold' : 'text-pencil'}`}>到期 Expires</div>
                                    <div className={`text-sm font-fangsong font-medium mt-1 ${isExpiringSoon ? 'text-clay' : 'text-ink'}`}>
                                      {formatDate(service.expiryDate)}
                                    </div>
                                </div>
                              )}
                          </div>
                          {service.notes && (
                            <div className="mt-3 text-xs text-pencil font-fangsong italic">
                              "{service.notes}"
                            </div>
                          )}
                      </div>
                  </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Hotel Plan Generator Modal */}
      {showHotelPlan && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setShowHotelPlan(false)} />
          <div className="bg-[#FEFCF8] w-full max-w-md rounded-[2rem] p-8 shadow-2xl relative z-10 animate-scale-in">
            <div className="flex justify-between items-center mb-6">
               <h3 className="font-fangsong text-2xl text-ink flex items-center gap-2"><Building size={24} className="text-gold"/> 住宿計畫 Hotel Plan</h3>
               <button onClick={() => setShowHotelPlan(false)} className="p-2 text-pencil hover:text-ink"><X size={20}/></button>
            </div>
            
            <div className="mb-6">
              <label className="text-[10px] text-pencil font-bold tracking-widest uppercase mb-2 block font-sans">天數 Stay Duration (Days)</label>
              <div className="flex items-center gap-4">
                <input 
                  type="range" min="1" max="30" 
                  value={hotelDays} onChange={e => setHotelDays(Number(e.target.value))}
                  className="flex-1 accent-clay"
                />
                <span className="text-xl font-fangsong text-ink w-8 text-center">{hotelDays}</span>
              </div>
            </div>

            <div className="bg-white border border-sand rounded-xl p-4 mb-6">
              <h4 className="text-xs font-bold tracking-widest uppercase text-clay mb-3 font-sans">產生的指示 Generated Instructions</h4>
              <textarea 
                readOnly
                className="w-full h-48 text-sm font-fangsong text-ink bg-transparent resize-none outline-none"
                value={hotelPlanText}
              />
            </div>

            <button 
              onClick={() => {
                navigator.clipboard.writeText(hotelPlanText);
                alert('已複製到剪貼簿！ Copied to clipboard!');
              }}
              className="w-full py-3 btn-warm flex items-center justify-center gap-2"
            >
              複製到剪貼簿 Copy to Clipboard
            </button>
          </div>
        </div>
      )}

      {/* Policy Form */}
      {isPolicyFormOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center pointer-events-none">
          <div className="absolute inset-0 bg-ink/20 backdrop-blur-sm pointer-events-auto" onClick={() => setIsPolicyFormOpen(false)} />
          <form onSubmit={handlePolicySubmit} className="bg-[#FEFCF8] w-full max-w-md rounded-t-[2.5rem] p-8 shadow-2xl pointer-events-auto animate-fade-in relative">
             <div className="w-12 h-1 bg-sand rounded-full mx-auto mb-8 opacity-50" />
             
             <div className="flex justify-between items-center mb-6">
               <h3 className="font-fangsong text-2xl text-ink">{editingPolicyId ? '編輯保險 Edit Policy' : '新增保險 New Policy'}</h3>
               <button type="button" onClick={() => setIsPolicyFormOpen(false)} className="w-8 h-8 rounded-full bg-sand/30 flex items-center justify-center text-ink hover:bg-sand transition-colors">
                  <X size={16}/>
               </button>
             </div>

             <div className="space-y-6">
                 <div>
                   <label className="text-[10px] text-pencil font-bold tracking-widest uppercase mb-1 block font-sans">保險公司 Provider</label>
                   <input 
                    type="text" required
                    placeholder="e.g. 富邦產險 Fubon"
                    value={newPolicy.provider || ''}
                    onChange={e => setNewPolicy({...newPolicy, provider: e.target.value})}
                    className="w-full py-2 bg-transparent border-b border-sand focus:border-gold text-ink font-fangsong text-xl rounded-none placeholder-sand/50"
                   />
                </div>
                 <div>
                   <label className="text-[10px] text-pencil font-bold tracking-widest uppercase mb-1 block font-sans">保單名稱/號碼 Policy Name / Number</label>
                   <input 
                    type="text" required
                    placeholder="e.g. 寵物險 Premium Care"
                    value={newPolicy.name || ''}
                    onChange={e => setNewPolicy({...newPolicy, name: e.target.value})}
                    className="w-full py-2 bg-transparent border-b border-sand focus:border-gold text-ink font-fangsong text-lg rounded-none placeholder-sand/50"
                   />
                </div>
                <div>
                   <label className="text-[10px] text-pencil font-bold tracking-widest uppercase mb-1 block font-sans">到期日 Expiry Date</label>
                   <input 
                    type="date" required
                    value={newPolicy.expiryDate || ''}
                    onChange={e => setNewPolicy({...newPolicy, expiryDate: e.target.value})}
                    className="w-full py-2 bg-transparent border-b border-sand focus:border-gold text-ink font-fangsong text-lg rounded-none"
                   />
               </div>
             </div>

             <button type="submit" className="w-full py-4 mt-8 btn-warm">
               {editingPolicyId ? '更新保險 Update Policy' : '儲存保險 Save Policy'}
             </button>
          </form>
        </div>
      )}

      {/* Service Form */}
      {isServiceFormOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center pointer-events-none">
          <div className="absolute inset-0 bg-ink/20 backdrop-blur-sm pointer-events-auto" onClick={() => setIsServiceFormOpen(false)} />
          <form onSubmit={handleServiceSubmit} className="bg-[#FEFCF8] w-full max-w-md rounded-t-[2.5rem] p-8 shadow-2xl pointer-events-auto animate-fade-in relative">
             <div className="w-12 h-1 bg-sand rounded-full mx-auto mb-8 opacity-50" />
             
             <div className="flex justify-between items-center mb-6">
               <h3 className="font-fangsong text-2xl text-ink">{editingServiceId ? '編輯紀錄 Edit Record' : '新增預付/基金 Add Prepaid / Fund'}</h3>
               <button type="button" onClick={() => setIsServiceFormOpen(false)} className="w-8 h-8 rounded-full bg-sand/30 flex items-center justify-center text-ink hover:bg-sand transition-colors">
                  <X size={16}/>
               </button>
             </div>

             <div className="flex bg-sand/20 p-1 rounded-xl mb-6">
                {(['Grooming', 'Hotel', 'MedicalFund'] as const).map(type => (
                  <button 
                    key={type} type="button"
                    onClick={() => setNewService({...newService, type})}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold tracking-widest uppercase transition-all duration-300 font-sans ${
                        newService.type === type ? 'bg-white text-ink shadow-sm' : 'text-pencil'
                    }`}
                  >
                    {type === 'MedicalFund' ? '醫療 Medical' : type === 'Grooming' ? '美容 Grooming' : '住宿 Hotel'}
                  </button>
                ))}
             </div>

             <div className="space-y-6">
                 <div>
                   <label className="text-[10px] text-pencil font-bold tracking-widest uppercase mb-1 block font-sans">名稱/店家 Name / Store</label>
                   <input 
                    type="text" required
                    placeholder="e.g. 快樂毛孩美容 Happy Paws Grooming"
                    value={newService.name || ''}
                    onChange={e => setNewService({...newService, name: e.target.value})}
                    className="w-full py-2 bg-transparent border-b border-sand focus:border-gold text-ink font-fangsong text-xl rounded-none placeholder-sand/50"
                   />
                </div>
                <div className="grid grid-cols-2 gap-6">
                   <div>
                       <label className="text-[10px] text-pencil font-bold tracking-widest uppercase mb-1 block font-sans">餘額 Balance ($)</label>
                       <input 
                        type="number" step="1" required
                        placeholder="0"
                        value={newService.balance || ''}
                        onChange={e => setNewService({...newService, balance: Number(e.target.value)})}
                        className="w-full py-2 bg-transparent border-b border-sand focus:border-gold text-ink font-fangsong text-lg rounded-none"
                       />
                   </div>
                   <div>
                       <label className="text-[10px] text-pencil font-bold tracking-widest uppercase mb-1 block font-sans">到期日 Expiry (選填 Optional)</label>
                       <input 
                        type="date"
                        value={newService.expiryDate || ''}
                        onChange={e => setNewService({...newService, expiryDate: e.target.value})}
                        className="w-full py-2 bg-transparent border-b border-sand focus:border-gold text-ink font-fangsong text-lg rounded-none"
                       />
                   </div>
                </div>
                <div>
                   <label className="text-[10px] text-pencil font-bold tracking-widest uppercase mb-1 block font-sans">備註 Notes</label>
                   <textarea 
                    rows={2}
                    placeholder="e.g. 包含 2 次免費 SPA Includes 2 free spa treatments"
                    value={newService.notes || ''}
                    onChange={e => setNewService({...newService, notes: e.target.value})}
                    className="w-full py-2 bg-transparent border-b border-sand focus:border-gold text-ink font-fangsong text-lg rounded-none placeholder-sand/50 resize-none whitespace-pre-wrap"
                   />
                </div>
             </div>

             <button type="submit" className="w-full py-4 mt-8 btn-warm">
               {editingServiceId ? '更新紀錄 Update Record' : '儲存紀錄 Save Record'}
             </button>
          </form>
        </div>
      )}

      {/* Policy Details / Claims Modal */}
      {selectedPolicy && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center pointer-events-none">
          <div className="absolute inset-0 bg-ink/20 backdrop-blur-sm pointer-events-auto" onClick={() => setSelectedPolicy(null)} />
          <div className="bg-[#FEFCF8] w-full max-w-md rounded-t-[2.5rem] p-8 shadow-2xl pointer-events-auto animate-fade-in relative max-h-[90vh] overflow-y-auto">
             <div className="w-12 h-1 bg-sand rounded-full mx-auto mb-8 opacity-50" />
             
             <div className="flex justify-between items-center mb-6">
               <div>
                 <h3 className="font-fangsong text-2xl text-ink">{selectedPolicy.name}</h3>
                 <p className="text-xs font-bold tracking-widest uppercase text-pencil font-sans">{selectedPolicy.provider}</p>
               </div>
               <button onClick={() => setSelectedPolicy(null)} className="w-8 h-8 rounded-full bg-sand/30 flex items-center justify-center text-ink hover:bg-sand transition-colors">
                  <X size={16}/>
               </button>
             </div>

             <div className="space-y-8">
               {/* Coverage Limits */}
               <div>
                 <h4 className="text-sm font-bold tracking-widest uppercase text-ink mb-4 font-sans flex items-center gap-2">
                   <Shield size={16} className="text-gold"/> 理賠額度 Coverage Limits
                 </h4>
                 
                 <div className="space-y-3 mb-4">
                   {selectedPolicy.coverageLimits.map((limit, idx) => (
                     <div key={idx} className="bg-white p-4 rounded-xl border border-sand/50 relative group">
                       <button onClick={() => deleteLimit(selectedPolicy.id, limit.item)} className="absolute top-2 right-2 text-sand hover:text-clay opacity-0 group-hover:opacity-100 transition-opacity">
                         <Trash2 size={14} />
                       </button>
                       <div className="flex justify-between items-end mb-2">
                         <span className="font-fangsong text-ink font-medium">{limit.item}</span>
                         <span className="text-xs font-bold font-sans text-pencil">${limit.used} / ${limit.limit}</span>
                       </div>
                       <div className="w-full bg-sand/20 rounded-full h-2 overflow-hidden">
                         <div 
                           className={`h-full rounded-full ${limit.used >= limit.limit ? 'bg-clay' : 'bg-gold'}`} 
                           style={{ width: `${Math.min(100, (limit.used / limit.limit) * 100)}%` }}
                         />
                       </div>
                       <div className="mt-3 flex items-center gap-2">
                         <input 
                           type="number" 
                           placeholder="輸入已使用金額 Add used amount"
                           className="flex-1 text-xs py-1 px-2 border border-sand rounded bg-transparent"
                           onKeyDown={(e) => {
                             if (e.key === 'Enter') {
                               const val = Number((e.target as HTMLInputElement).value);
                               if (!isNaN(val)) {
                                 updateLimitUsed(selectedPolicy.id, limit.item, limit.used + val);
                                 (e.target as HTMLInputElement).value = '';
                               }
                             }
                           }}
                         />
                         <span className="text-[10px] text-pencil uppercase tracking-widest font-sans">按 Enter 鍵 Press Enter</span>
                       </div>
                     </div>
                   ))}
                 </div>

                 <form onSubmit={handleAddLimit} className="flex gap-2">
                   <input 
                     type="text" placeholder="項目 Item (e.g. 手術 Surgery)" required
                     value={newLimit.item} onChange={e => setNewLimit({...newLimit, item: e.target.value})}
                     className="flex-1 py-2 px-3 bg-white border border-sand focus:border-gold text-ink text-sm rounded-xl placeholder-sand/50"
                   />
                   <input 
                     type="number" placeholder="額度 Limit $" required
                     value={newLimit.limit || ''} onChange={e => setNewLimit({...newLimit, limit: Number(e.target.value)})}
                     className="w-24 py-2 px-3 bg-white border border-sand focus:border-gold text-ink text-sm rounded-xl placeholder-sand/50"
                   />
                   <button type="submit" className="px-4 bg-clay text-white rounded-xl font-bold hover:bg-clay/90 transition-colors">
                     新增 Add
                   </button>
                 </form>
               </div>

               {/* Claims */}
               <div>
                 <h4 className="text-sm font-bold tracking-widest uppercase text-ink mb-4 font-sans flex items-center gap-2">
                   <FileText size={16} className="text-clay"/> 理賠紀錄 Claims History
                 </h4>

                 <div className="space-y-3 mb-4">
                   {selectedPolicy.claims.map(claim => (
                     <div key={claim.id} className="bg-white p-4 rounded-xl border border-sand/50 flex justify-between items-center relative group">
                       <button onClick={() => deleteClaim(selectedPolicy.id, claim.id)} className="absolute -top-2 -right-2 bg-white rounded-full p-1 text-sand hover:text-clay opacity-0 group-hover:opacity-100 transition-opacity shadow-sm border border-sand/20">
                         <X size={12} />
                       </button>
                       <div>
                         <div className="font-fangsong text-ink font-medium">${claim.amount}</div>
                         <div className="text-[10px] font-sans text-pencil uppercase tracking-widest">{formatDate(claim.date)}</div>
                       </div>
                       <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest font-sans ${
                         claim.status === 'Approved' ? 'bg-sage/15 text-[#5A8A5A]' :
                         claim.status === 'Rejected' ? 'bg-clay/10 text-clay' :
                         'bg-amber-50 text-amber-600'
                       }`}>
                         {claim.status === 'Approved' ? '已核准 Approved' : claim.status === 'Rejected' ? '已拒絕 Rejected' : '審核中 Pending'}
                       </div>
                     </div>
                   ))}
                 </div>

                 <form onSubmit={handleAddClaim} className="bg-sand/10 p-4 rounded-xl space-y-3">
                   <div className="flex gap-2">
                     <input 
                       type="date" required
                       value={newClaim.date} onChange={e => setNewClaim({...newClaim, date: e.target.value})}
                       className="flex-1 py-2 px-3 bg-white border border-sand focus:border-gold text-ink text-sm rounded-xl"
                     />
                     <input 
                       type="number" placeholder="金額 Amount $" required
                       value={newClaim.amount || ''} onChange={e => setNewClaim({...newClaim, amount: Number(e.target.value)})}
                       className="w-24 py-2 px-3 bg-white border border-sand focus:border-gold text-ink text-sm rounded-xl placeholder-sand/50"
                     />
                   </div>
                   <div className="flex gap-2">
                     <select 
                       value={newClaim.status} onChange={e => setNewClaim({...newClaim, status: e.target.value as any})}
                       className="flex-1 py-2 px-3 bg-white border border-sand focus:border-gold text-ink text-sm rounded-xl"
                     >
                       <option value="Pending">審核中 Pending</option>
                       <option value="Approved">已核准 Approved</option>
                       <option value="Rejected">已拒絕 Rejected</option>
                     </select>
                     <button type="submit" className="px-4 bg-ink text-white rounded-xl font-bold hover:bg-ink/90 transition-colors text-xs uppercase tracking-widest font-sans whitespace-nowrap">
                       新增理賠 Add Claim
                     </button>
                   </div>
                 </form>
               </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
