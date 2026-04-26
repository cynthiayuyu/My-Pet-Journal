import React, { useState, useEffect, useMemo } from 'react';
import { PetProfile, PhysicalRecord, HealthRecord, TabView, InventoryItem, InsurancePolicy, PrepaidService, PetShop, DailyLog } from './types';
import { ProfileSection } from './components/ProfileSection';
import { PhysicalSection } from './components/PhysicalSection';
import { HealthSection } from './components/HealthSection';
import { FoodSection } from './components/FoodSection';
import { FinanceSection } from './components/FinanceSection';
import { ShopSection } from './components/ShopSection';
import { DailySection } from './components/DailySection';
import { ChatSection } from './components/ChatSection';
import { User, Heart, PawPrint, Utensils, Wallet, CalendarDays, Download, Upload, MessageSquare } from 'lucide-react';

const SubToggle = ({ options, active, onChange }: {
  options: { value: string; label: string }[];
  active: string;
  onChange: (v: string) => void;
}) => (
  <div className="flex items-center justify-center mb-8">
    <div className="flex bg-white/60 backdrop-blur-sm rounded-xl p-1 gap-0.5 border border-white/72 shadow-sm">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-5 py-1.5 rounded-[0.6rem] text-[10px] font-sans tracking-[0.15em] transition-all duration-300 ${
            active === opt.value
              ? 'bg-white text-ink shadow-sm font-medium'
              : 'text-pencil hover:text-ink'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  </div>
);

const SectionHeader = ({ en, zh }: { en: string; zh: string }) => (
  <div className="mb-8 flex flex-col items-center text-center">
    <div className="flex items-center gap-2.5 mb-3">
      <div className="h-px w-6" style={{background: 'linear-gradient(to right, transparent, rgba(184,144,80,0.32))'}} />
      <span className="text-[9px] tracking-[0.42em] text-gold/55 uppercase font-sans">{en}</span>
      <div className="h-px w-6" style={{background: 'linear-gradient(to left, transparent, rgba(184,144,80,0.32))'}} />
    </div>
    <h2 className="font-fangsong text-4xl text-ink tracking-wide">{zh}</h2>
    <div className="flex items-center gap-2.5 mt-3">
      <div className="h-px w-10" style={{background: 'linear-gradient(to right, transparent, rgba(184,144,80,0.28))'}} />
      <span style={{color: 'rgba(184,144,80,0.40)', fontSize: '0.45rem', lineHeight: '1', fontFamily: 'serif'}}>✦</span>
      <div className="h-px w-10" style={{background: 'linear-gradient(to left, transparent, rgba(184,144,80,0.28))'}} />
    </div>
  </div>
);

const App: React.FC = () => {
  // --- State ---
  const [activeTab, setActiveTab] = useState<TabView>('profile');
  const [healthSubTab, setHealthSubTab] = useState<'health' | 'physical'>('health');
  const [financeSubTab, setFinanceSubTab] = useState<'finance' | 'shops'>('shops');
  const [scrolled, setScrolled] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<PetProfile>(() => {
    const saved = localStorage.getItem('pawprint_profile');
    return saved ? JSON.parse(saved) : {
      name: '',
      breed: '',
      gender: 'Male',
      birthDate: '',
      microchipId: '',
      photoUrl: null,
      vetContact: { clinicName: '', phone: '', address: '' }
    };
  });

  const [physicalRecords, setPhysicalRecords] = useState<PhysicalRecord[]>(() => {
    const saved = localStorage.getItem('pawprint_physical');
    return saved ? JSON.parse(saved) : [];
  });

  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>(() => {
    const saved = localStorage.getItem('pawprint_health');
    return saved ? JSON.parse(saved) : [];
  });

  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('pawprint_inventory');
    return saved ? JSON.parse(saved) : [];
  });

  const [insurancePolicies, setInsurancePolicies] = useState<InsurancePolicy[]>(() => {
    const saved = localStorage.getItem('pawprint_insurance');
    return saved ? JSON.parse(saved) : [];
  });

  const [prepaidServices, setPrepaidServices] = useState<PrepaidService[]>(() => {
    const saved = localStorage.getItem('pawprint_prepaid');
    return saved ? JSON.parse(saved) : [];
  });

  const [shops, setShops] = useState<PetShop[]>(() => {
    const saved = localStorage.getItem('pawprint_shops');
    return saved ? JSON.parse(saved) : [];
  });

  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>(() => {
    const saved = localStorage.getItem('pawprint_daily');
    return saved ? JSON.parse(saved) : [];
  });

  const latestWeight = useMemo(() => {
    if (physicalRecords.length === 0) return undefined;
    return [...physicalRecords].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].weight;
  }, [physicalRecords]);

  // --- Effects ---

  useEffect(() => localStorage.setItem('pawprint_profile', JSON.stringify(profile)), [profile]);
  useEffect(() => localStorage.setItem('pawprint_physical', JSON.stringify(physicalRecords)), [physicalRecords]);
  useEffect(() => localStorage.setItem('pawprint_health', JSON.stringify(healthRecords)), [healthRecords]);
  useEffect(() => localStorage.setItem('pawprint_inventory', JSON.stringify(inventoryItems)), [inventoryItems]);
  useEffect(() => localStorage.setItem('pawprint_insurance', JSON.stringify(insurancePolicies)), [insurancePolicies]);
  useEffect(() => localStorage.setItem('pawprint_prepaid', JSON.stringify(prepaidServices)), [prepaidServices]);
  useEffect(() => localStorage.setItem('pawprint_shops', JSON.stringify(shops)), [shops]);
  useEffect(() => localStorage.setItem('pawprint_daily', JSON.stringify(dailyLogs)), [dailyLogs]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- Handlers ---
  const addPhysicalRecord = (r: PhysicalRecord) => setPhysicalRecords([...physicalRecords, r]);
  const updatePhysicalRecord = (r: PhysicalRecord) => setPhysicalRecords(physicalRecords.map(x => x.id === r.id ? r : x));
  const deletePhysicalRecord = (id: string) => setPhysicalRecords(physicalRecords.filter(r => r.id !== id));

  const addHealthRecord = (r: HealthRecord) => setHealthRecords([...healthRecords, r]);
  const updateHealthRecord = (r: HealthRecord) => setHealthRecords(healthRecords.map(x => x.id === r.id ? r : x));
  const deleteHealthRecord = (id: string) => setHealthRecords(healthRecords.filter(r => r.id !== id));

  const addDailyLog = (log: DailyLog) => setDailyLogs([...dailyLogs, log]);
  const updateDailyLog = (log: DailyLog) => setDailyLogs(dailyLogs.map(l => l.id === log.id ? log : l));
  const deleteDailyLog = (id: string) => setDailyLogs(dailyLogs.filter(l => l.id !== id));

  const handleExportData = () => {
    const data = { profile, physicalRecords, healthRecords, inventoryItems, insurancePolicies, prepaidServices, shops, dailyLogs };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pawprint_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.profile) setProfile(data.profile);
        if (data.physicalRecords) setPhysicalRecords(data.physicalRecords);
        if (data.healthRecords) setHealthRecords(data.healthRecords);
        if (data.inventoryItems) setInventoryItems(data.inventoryItems);
        if (data.insurancePolicies) setInsurancePolicies(data.insurancePolicies);
        if (data.prepaidServices) setPrepaidServices(data.prepaidServices);
        if (data.shops) setShops(data.shops);
        if (data.dailyLogs) setDailyLogs(data.dailyLogs);
        alert('資料匯入成功！');
      } catch {
        alert('匯入失敗，檔案格式錯誤。');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen pb-36 selection:bg-clay/20 selection:text-ink" style={{ fontFamily: "'Raleway', 'Noto Serif SC', sans-serif" }}>

      {/* Header */}
      <header className={`sticky top-0 z-50 px-5 flex items-center justify-between transition-all duration-500 ${
        scrolled ? 'glass shadow-sm py-3' : 'bg-transparent py-5'
      }`}>
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2.5 transition-all duration-300 ${scrolled ? 'scale-90' : 'scale-100'}`}
        >
          {profile.photoUrl ? (
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white shadow-md flex-shrink-0 ring-1 ring-sand/50">
              <img src={profile.photoUrl} alt="Profile" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm border border-sand flex-shrink-0">
              <PawPrint className="text-clay" fill="currentColor" size={18} strokeWidth={0} />
            </div>
          )}
          <h1 className="font-fangsong text-xl tracking-wide text-ink truncate max-w-[160px]">
            {profile.name || 'My Pet Journal'}
          </h1>
        </button>

        <div className="flex items-center gap-1.5">
          <button onClick={handleExportData}
            className="p-2 rounded-full bg-white/50 text-ink/60 hover:text-ink hover:bg-white/80 transition-colors border border-white/40"
            title="匯出資料">
            <Download size={16} />
          </button>
          <button onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-full bg-white/50 text-ink/60 hover:text-ink hover:bg-white/80 transition-colors border border-white/40"
            title="匯入資料">
            <Upload size={16} />
          </button>
          <input type="file" ref={fileInputRef} onChange={handleImportData} accept=".json" className="hidden" />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-5 pt-2">

        {/* ── Profile ── */}
        {activeTab === 'profile' && (
          <div className="animate-fade-in">
            <ProfileSection profile={profile} setProfile={setProfile} />
          </div>
        )}

        {/* ── Daily ── */}
        {activeTab === 'daily' && (
          <div className="animate-fade-in">
            <SectionHeader en="Daily Journal" zh="日常紀錄" />
            <DailySection
              logs={dailyLogs}
              addLog={addDailyLog}
              updateLog={updateDailyLog}
              deleteLog={deleteDailyLog}
            />
          </div>
        )}

        {/* ── Health + Physical ── */}
        {activeTab === 'health' && (
          <div className="animate-fade-in">
            <SubToggle
              options={[{ value: 'health', label: '健康日曆' }, { value: 'physical', label: '體態紀錄' }]}
              active={healthSubTab}
              onChange={(v) => setHealthSubTab(v as 'health' | 'physical')}
            />
            {healthSubTab === 'health' ? (
              <>
                <SectionHeader en="Medical History" zh="健康日曆" />
                <HealthSection
                  records={healthRecords}
                  addRecord={addHealthRecord}
                  updateRecord={updateHealthRecord}
                  deleteRecord={deleteHealthRecord}
                  shops={shops}
                />
              </>
            ) : (
              <>
                <SectionHeader en="Growth Tracker" zh="體態紀錄" />
                <PhysicalSection
                  records={physicalRecords}
                  addRecord={addPhysicalRecord}
                  updateRecord={updatePhysicalRecord}
                  deleteRecord={deletePhysicalRecord}
                  profile={profile}
                />
              </>
            )}
          </div>
        )}

        {/* ── Food ── */}
        {activeTab === 'food' && (
          <div className="animate-fade-in">
            <SectionHeader en="Pantry & Diet" zh="食物庫存" />
            <FoodSection
              items={inventoryItems}
              setItems={setInventoryItems}
              profile={profile}
            />
          </div>
        )}

        {/* ── Chat ── */}
        {activeTab === 'chat' && (
          <div className="animate-fade-in">
            <SectionHeader en="AI Assistant" zh="智能助手" />
            <ChatSection profile={profile} latestWeight={latestWeight} />
          </div>
        )}

        {/* ── Finance + Shops ── */}
        {activeTab === 'finance' && (
          <div className="animate-fade-in">
            <SubToggle
              options={[{ value: 'shops', label: '住宿與美容' }, { value: 'finance', label: '財務與服務' }]}
              active={financeSubTab}
              onChange={(v) => setFinanceSubTab(v as 'finance' | 'shops')}
            />
            {financeSubTab === 'finance' ? (
              <>
                <SectionHeader en="Wealth & Care" zh="財務與服務" />
                <FinanceSection
                  policies={insurancePolicies}
                  setPolicies={setInsurancePolicies}
                  services={prepaidServices}
                  setServices={setPrepaidServices}
                  inventoryItems={inventoryItems}
                  profile={profile}
                />
              </>
            ) : (
              <>
                <SectionHeader en="Places & Visits" zh="住宿與美容" />
                <ShopSection shops={shops} setShops={setShops} />
              </>
            )}
          </div>
        )}

      </main>

      {/* ── Bottom Nav (5 tabs) ── */}
      <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50">
        <div
          className="backdrop-blur-2xl rounded-[2rem] px-1.5 py-1.5 flex gap-0.5"
          style={{
            background: 'rgba(255, 253, 250, 0.94)',
            border: '1px solid rgba(255, 255, 255, 0.92)',
            boxShadow: '0 8px 40px -4px rgba(152, 100, 80, 0.12), 0 2px 10px -2px rgba(152, 100, 80, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.98)'
          }}
        >
          <NavBtn active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={User} label="資料" />
          <NavBtn active={activeTab === 'daily'} onClick={() => setActiveTab('daily')} icon={CalendarDays} label="日常" />
          <NavBtn active={activeTab === 'health'} onClick={() => setActiveTab('health')} icon={Heart} label="健康" />
          <NavBtn active={activeTab === 'food'} onClick={() => setActiveTab('food')} icon={Utensils} label="飲食" />
          <NavBtn active={activeTab === 'finance'} onClick={() => setActiveTab('finance')} icon={Wallet} label="財務" />
          <NavBtn active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} icon={MessageSquare} label="助手" />
        </div>
      </nav>

    </div>
  );
};

const NavBtn = ({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) => (
  <button
    onClick={onClick}
    className={`relative flex flex-col items-center justify-center px-4 py-2.5 rounded-[1.1rem] transition-all duration-300 min-w-[52px] ${
      active ? '' : 'hover:bg-clay/5'
    }`}
    style={active ? { background: 'rgba(184,112,104,0.09)' } : undefined}
  >
    <Icon size={19} strokeWidth={active ? 1.8 : 1.4}
      className={`transition-all duration-300 ${active ? 'text-clay' : 'text-ink/25'}`}
    />
    <span className={`text-[8px] font-sans tracking-[0.18em] transition-all duration-300 uppercase ${
      active ? 'text-clay/65 opacity-100 mt-1.5' : 'opacity-0 h-0 mt-0 overflow-hidden'
    }`}>{label}</span>
    {active && (
      <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-[1px] rounded-full"
        style={{ background: 'rgba(184,112,104,0.42)' }} />
    )}
  </button>
);

export default App;
