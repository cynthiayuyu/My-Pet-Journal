import React, { useState, useEffect } from 'react';
import { PetProfile, PhysicalRecord, HealthRecord, TabView, InventoryItem, InsurancePolicy, PrepaidService, PetShop, DailyLog } from './types';
import { ProfileSection } from './components/ProfileSection';
import { PhysicalSection } from './components/PhysicalSection';
import { HealthSection } from './components/HealthSection';
import { FoodSection } from './components/FoodSection';
import { FinanceSection } from './components/FinanceSection';
import { ShopSection } from './components/ShopSection';
import { DashboardSection } from './components/DashboardSection';
import { DailySection } from './components/DailySection';
import { ChatSection } from './components/ChatSection';
import { User, Activity, Heart, PawPrint, Utensils, Wallet, Store, LayoutDashboard, CalendarDays, Moon, Sun, Download, Upload } from 'lucide-react';

const App: React.FC = () => {
  // --- State ---
  const [activeTab, setActiveTab] = useState<TabView>('dashboard');
  const [scrolled, setScrolled] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('pawprint_theme') === 'dark';
  });
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
      vetContact: {
        clinicName: '',
        phone: '',
        address: ''
      }
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

  // --- Effects ---
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('pawprint_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => localStorage.setItem('pawprint_profile', JSON.stringify(profile)), [profile]);
  useEffect(() => localStorage.setItem('pawprint_physical', JSON.stringify(physicalRecords)), [physicalRecords]);
  useEffect(() => localStorage.setItem('pawprint_health', JSON.stringify(healthRecords)), [healthRecords]);
  useEffect(() => localStorage.setItem('pawprint_inventory', JSON.stringify(inventoryItems)), [inventoryItems]);
  useEffect(() => localStorage.setItem('pawprint_insurance', JSON.stringify(insurancePolicies)), [insurancePolicies]);
  useEffect(() => localStorage.setItem('pawprint_prepaid', JSON.stringify(prepaidServices)), [prepaidServices]);
  useEffect(() => localStorage.setItem('pawprint_shops', JSON.stringify(shops)), [shops]);
  useEffect(() => localStorage.setItem('pawprint_daily', JSON.stringify(dailyLogs)), [dailyLogs]);

  // Scroll effect for header
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- Handlers ---
  const addPhysicalRecord = (record: PhysicalRecord) => setPhysicalRecords([...physicalRecords, record]);
  const updatePhysicalRecord = (record: PhysicalRecord) => setPhysicalRecords(physicalRecords.map(r => r.id === record.id ? record : r));
  const deletePhysicalRecord = (id: string) => setPhysicalRecords(physicalRecords.filter(r => r.id !== id));
  
  const addHealthRecord = (record: HealthRecord) => setHealthRecords([...healthRecords, record]);
  const updateHealthRecord = (record: HealthRecord) => setHealthRecords(healthRecords.map(r => r.id === record.id ? record : r));
  const deleteHealthRecord = (id: string) => setHealthRecords(healthRecords.filter(r => r.id !== id));

  const addDailyLog = (log: DailyLog) => setDailyLogs([...dailyLogs, log]);
  const updateDailyLog = (log: DailyLog) => setDailyLogs(dailyLogs.map(l => l.id === log.id ? log : l));
  const deleteDailyLog = (id: string) => setDailyLogs(dailyLogs.filter(l => l.id !== id));

  const handleExportData = () => {
    const data = {
      profile,
      physicalRecords,
      healthRecords,
      inventoryItems,
      insurancePolicies,
      prepaidServices,
      shops,
      dailyLogs
    };
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
        alert('Data imported successfully! 資料匯入成功！');
      } catch (error) {
        alert('Failed to import data. Invalid file format. 匯入失敗，檔案格式錯誤。');
      }
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen pb-32 selection:bg-clay/20 selection:text-ink">
      
      {/* Header - Elegant & Adaptive */}
      <header 
        className={`sticky top-0 z-50 px-6 py-4 flex items-center justify-between transition-all duration-500 ${
          scrolled ? 'glass shadow-sm py-3' : 'bg-transparent py-6'
        }`}
      >
        <div className={`flex items-center gap-3 transition-transform duration-500 ${scrolled ? 'scale-90' : 'scale-100'}`}>
           {profile.photoUrl ? (
             <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-md flex-shrink-0 ring-1 ring-sand/50">
               <img src={profile.photoUrl} alt="Profile" className="w-full h-full object-cover" />
             </div>
           ) : (
             <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-sand">
               <PawPrint className="text-clay" fill="currentColor" size={20} strokeWidth={0} />
             </div>
           )}
           <h1 className="font-fangsong text-2xl tracking-wide text-ink truncate max-w-[200px] font-medium">
             {profile.name || '寵物手帳 My Pet Journal'}
           </h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-full bg-white/50 text-ink/70 hover:text-ink hover:bg-white/80 transition-colors shadow-sm border border-white/40"
            title="切換深色模式 Toggle Dark Mode"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button 
            onClick={handleExportData}
            className="p-2 rounded-full bg-white/50 text-ink/70 hover:text-ink hover:bg-white/80 transition-colors shadow-sm border border-white/40"
            title="匯出資料 Export Data"
          >
            <Download size={18} />
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-full bg-white/50 text-ink/70 hover:text-ink hover:bg-white/80 transition-colors shadow-sm border border-white/40"
            title="匯入資料 Import Data"
          >
            <Upload size={18} />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImportData} 
            accept=".json" 
            className="hidden" 
          />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-md mx-auto px-6 pt-2">
        
        {activeTab === 'dashboard' && (
          <div className="animate-fade-in">
            <div className="mb-6 ml-1 flex flex-col items-center text-center">
               <span className="text-xs font-bold tracking-[0.2em] text-gold uppercase mb-2">Dashboard</span>
               <h2 className="font-fangsong text-3xl text-ink">首頁</h2>
             </div>
            <DashboardSection 
              healthRecords={healthRecords}
              inventoryItems={inventoryItems}
              insurancePolicies={insurancePolicies}
              prepaidServices={prepaidServices}
              shops={shops}
            />
          </div>
        )}

        {activeTab === 'daily' && (
          <DailySection 
            logs={dailyLogs}
            addLog={addDailyLog}
            updateLog={updateDailyLog}
            deleteLog={deleteDailyLog}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileSection profile={profile} setProfile={setProfile} />
        )}

        {activeTab === 'physical' && (
           <div className="animate-fade-in">
             <div className="mb-6 ml-1 flex flex-col items-center text-center">
               <span className="text-xs font-bold tracking-[0.2em] text-gold uppercase mb-2">Growth Tracker</span>
               <h2 className="font-fangsong text-3xl text-ink">體態紀錄</h2>
             </div>
             <PhysicalSection 
               records={physicalRecords} 
               addRecord={addPhysicalRecord} 
               updateRecord={updatePhysicalRecord}
               deleteRecord={deletePhysicalRecord} 
               profile={profile}
             />
           </div>
        )}

        {activeTab === 'health' && (
          <div className="animate-fade-in">
            <div className="mb-6 ml-1 flex flex-col items-center text-center">
               <span className="text-xs font-bold tracking-[0.2em] text-gold uppercase mb-2">Medical History</span>
               <h2 className="font-fangsong text-3xl text-ink">健康日曆</h2>
             </div>
            <HealthSection 
              records={healthRecords} 
              addRecord={addHealthRecord} 
              updateRecord={updateHealthRecord}
              deleteRecord={deleteHealthRecord} 
              shops={shops}
            />
          </div>
        )}

        {activeTab === 'food' && (
          <div className="animate-fade-in">
            <div className="mb-6 ml-1 flex flex-col items-center text-center">
               <span className="text-xs font-bold tracking-[0.2em] text-gold uppercase mb-2">Pantry & Diet</span>
               <h2 className="font-fangsong text-3xl text-ink">食物庫存</h2>
             </div>
            <FoodSection 
              items={inventoryItems} 
              setItems={setInventoryItems} 
              profile={profile}
            />
          </div>
        )}

        {activeTab === 'finance' && (
          <div className="animate-fade-in">
            <div className="mb-6 ml-1 flex flex-col items-center text-center">
               <span className="text-xs font-bold tracking-[0.2em] text-gold uppercase mb-2">Wealth & Care</span>
               <h2 className="font-fangsong text-3xl text-ink">財務與服務</h2>
             </div>
            <FinanceSection 
              policies={insurancePolicies} 
              setPolicies={setInsurancePolicies}
              services={prepaidServices}
              setServices={setPrepaidServices}
              inventoryItems={inventoryItems}
              profile={profile}
            />
          </div>
        )}

        {activeTab === 'shops' && (
          <div className="animate-fade-in">
            <div className="mb-6 ml-1 flex flex-col items-center text-center">
               <span className="text-xs font-bold tracking-[0.2em] text-gold uppercase mb-2">Places & Visits</span>
               <h2 className="font-fangsong text-3xl text-ink">住宿與美容</h2>
             </div>
            <ShopSection
              shops={shops}
              setShops={setShops}
            />
          </div>
        )}


      </main>

      {/* Floating Bottom Navigation */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-[94vw]">
        <div className="bg-[#252220] backdrop-blur-2xl rounded-[2rem] px-2 py-2 flex gap-0.5 overflow-x-auto hide-scrollbar min-w-max"
          style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
          <NavBtn active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={LayoutDashboard} label="總覽" />
          <NavBtn active={activeTab === 'daily'} onClick={() => setActiveTab('daily')} icon={CalendarDays} label="日常" />
          <NavBtn active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={User} label="資料" />
          <NavBtn active={activeTab === 'physical'} onClick={() => setActiveTab('physical')} icon={Activity} label="體態" />
          <NavBtn active={activeTab === 'health'} onClick={() => setActiveTab('health')} icon={Heart} label="醫療" />
          <NavBtn active={activeTab === 'food'} onClick={() => setActiveTab('food')} icon={Utensils} label="飲食" />
          <NavBtn active={activeTab === 'finance'} onClick={() => setActiveTab('finance')} icon={Wallet} label="財務" />
          <NavBtn active={activeTab === 'shops'} onClick={() => setActiveTab('shops')} icon={Store} label="愛店" />
        </div>
      </nav>

    </div>
  );
};

const NavBtn = ({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) => (
  <button
    onClick={onClick}
    className={`relative flex flex-col items-center justify-center px-3 py-2.5 rounded-[1.4rem] transition-all duration-300 min-w-[48px] ${
      active ? 'bg-white/10' : 'hover:bg-white/5'
    }`}
  >
    <Icon
      size={19}
      strokeWidth={active ? 2.2 : 1.75}
      className={`transition-all duration-300 ${active ? 'text-white' : 'text-white/30'}`}
    />
    <span className={`text-[8px] font-sans tracking-wider mt-1.5 transition-all duration-300 font-medium ${
      active ? 'text-gold/80 opacity-100' : 'text-white/0 opacity-0 h-0 mt-0 overflow-hidden'
    }`}>{label}</span>
    {active && (
      <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-3.5 h-[2px] bg-gold/60 rounded-full"
        style={{ boxShadow: '0 0 8px rgba(191,168,132,0.6)' }} />
    )}
  </button>
);

export default App;