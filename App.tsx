import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  PetProfile, PhysicalRecord, HealthRecord, TabView, InventoryItem,
  InsurancePolicy, PrepaidService, PetShop, DailyLog, WardrobeItem, PetData
} from './types';
import { generateId } from './utils';
import { ProfileSection } from './components/ProfileSection';
import { PhysicalSection } from './components/PhysicalSection';
import { HealthSection } from './components/HealthSection';
import { FoodSection } from './components/FoodSection';
import { FinanceSection } from './components/FinanceSection';
import { ShopSection } from './components/ShopSection';
import { DailySection } from './components/DailySection';
import { WardrobeSection } from './components/WardrobeSection';
import { GlobalSearch } from './components/GlobalSearch';
import {
  User, Heart, PawPrint, Utensils, Wallet, CalendarDays,
  Download, Upload, Search, Plus, Trash2, ChevronDown, Bell, X
} from 'lucide-react';

// ── helpers ──────────────────────────────────────────────────────────────────

function parseSafe<T>(key: string, fallback: T): T {
  try {
    const s = localStorage.getItem(key);
    return s ? (JSON.parse(s) as T) : fallback;
  } catch {
    return fallback;
  }
}

const DEFAULT_PROFILE: PetProfile = {
  name: '', breed: '', gender: 'Male', birthDate: '', microchipId: '', photoUrl: null,
  vetContact: { clinicName: '', phone: '', address: '' },
};

function makePet(overrides: Partial<PetData> = {}): PetData {
  return {
    id: generateId(),
    profile: { ...DEFAULT_PROFILE },
    physicalRecords: [],
    healthRecords: [],
    inventoryItems: [],
    policies: [],
    services: [],
    shops: [],
    dailyLogs: [],
    wardrobeItems: [],
    ...overrides,
  };
}

// ── shared UI components ──────────────────────────────────────────────────────

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
      <div className="h-px w-6" style={{ background: 'linear-gradient(to right, transparent, rgba(184,144,80,0.32))' }} />
      <span className="text-[9px] tracking-[0.42em] text-gold/55 uppercase font-sans">{en}</span>
      <div className="h-px w-6" style={{ background: 'linear-gradient(to left, transparent, rgba(184,144,80,0.32))' }} />
    </div>
    <h2 className="font-fangsong text-4xl text-ink tracking-wide">{zh}</h2>
    <div className="flex items-center gap-2.5 mt-3">
      <div className="h-px w-10" style={{ background: 'linear-gradient(to right, transparent, rgba(184,144,80,0.28))' }} />
      <span style={{ color: 'rgba(184,144,80,0.40)', fontSize: '0.45rem', lineHeight: '1', fontFamily: 'serif' }}>✦</span>
      <div className="h-px w-10" style={{ background: 'linear-gradient(to left, transparent, rgba(184,144,80,0.28))' }} />
    </div>
  </div>
);

const NavBtn = ({
  active, onClick, icon: Icon, label, badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  label: string;
  badge?: boolean;
}) => (
  <button
    onClick={onClick}
    className={`relative flex flex-col items-center justify-center px-4 py-2.5 rounded-[1.1rem] transition-all duration-300 min-w-[52px] ${
      active ? '' : 'hover:bg-clay/5'
    }`}
    style={active ? { background: 'rgba(184,112,104,0.09)' } : undefined}
  >
    <div className="relative">
      <Icon
        size={19}
        strokeWidth={active ? 1.8 : 1.4}
        className={`transition-all duration-300 ${active ? 'text-clay' : 'text-ink/25'}`}
      />
      {badge && !active && (
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-clay border border-white" />
      )}
    </div>
    <span className={`text-[8px] font-sans tracking-[0.18em] transition-all duration-300 uppercase ${
      active ? 'text-clay/65 opacity-100 mt-1.5' : 'opacity-0 h-0 mt-0 overflow-hidden'
    }`}>{label}</span>
    {active && (
      <span
        className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-[1px] rounded-full"
        style={{ background: 'rgba(184,112,104,0.42)' }}
      />
    )}
  </button>
);

// ── App ───────────────────────────────────────────────────────────────────────

const App: React.FC = () => {
  // ── multi-pet state (with migration from old localStorage keys) ──
  const [pets, setPets] = useState<PetData[]>(() => {
    const savedStr = localStorage.getItem('pawprint_pets');
    if (savedStr) {
      try {
        const parsed = JSON.parse(savedStr) as PetData[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    // Migrate from old per-key format
    return [makePet({
      profile: parseSafe('pawprint_profile', DEFAULT_PROFILE),
      physicalRecords: parseSafe('pawprint_physical', []),
      healthRecords: parseSafe('pawprint_health', []),
      inventoryItems: parseSafe('pawprint_inventory', []),
      policies: parseSafe('pawprint_insurance', []),
      services: parseSafe('pawprint_prepaid', []),
      shops: parseSafe('pawprint_shops', []),
      dailyLogs: parseSafe('pawprint_daily', []),
      wardrobeItems: parseSafe('pawprint_wardrobe', []),
    })];
  });

  const [activePetId, setActivePetId] = useState<string>(() => {
    return localStorage.getItem('pawprint_active_pet') || '';
  });

  // ── derived state ──
  const resolvedPetId = useMemo(() => {
    if (pets.find(p => p.id === activePetId)) return activePetId;
    return pets[0]?.id || '';
  }, [pets, activePetId]);

  const activePet = useMemo(
    () => pets.find(p => p.id === resolvedPetId),
    [pets, resolvedPetId]
  );

  // ── updater ──
  const updatePet = useCallback((updater: (pet: PetData) => PetData) => {
    setPets(prev => prev.map(p => p.id === resolvedPetId ? updater(p) : p));
  }, [resolvedPetId]);

  // ── per-section setters ──
  const setProfile = useCallback(
    (profile: PetProfile) => updatePet(p => ({ ...p, profile })), [updatePet]);
  const setPhysicalRecords = useCallback(
    (physicalRecords: PhysicalRecord[]) => updatePet(p => ({ ...p, physicalRecords })), [updatePet]);
  const setHealthRecords = useCallback(
    (healthRecords: HealthRecord[]) => updatePet(p => ({ ...p, healthRecords })), [updatePet]);
  const setInventoryItems = useCallback(
    (inventoryItems: InventoryItem[]) => updatePet(p => ({ ...p, inventoryItems })), [updatePet]);
  const setInsurancePolicies = useCallback(
    (policies: InsurancePolicy[]) => updatePet(p => ({ ...p, policies })), [updatePet]);
  const setPrepaidServices = useCallback(
    (services: PrepaidService[]) => updatePet(p => ({ ...p, services })), [updatePet]);
  const setShops = useCallback(
    (shops: PetShop[]) => updatePet(p => ({ ...p, shops })), [updatePet]);
  const setDailyLogs = useCallback(
    (dailyLogs: DailyLog[]) => updatePet(p => ({ ...p, dailyLogs })), [updatePet]);
  const setWardrobeItems = useCallback(
    (wardrobeItems: WardrobeItem[]) => updatePet(p => ({ ...p, wardrobeItems })), [updatePet]);

  // ── record handlers ──
  const addPhysicalRecord = useCallback((r: PhysicalRecord) =>
    updatePet(p => ({ ...p, physicalRecords: [...p.physicalRecords, r] })), [updatePet]);
  const updatePhysicalRecord = useCallback((r: PhysicalRecord) =>
    updatePet(p => ({ ...p, physicalRecords: p.physicalRecords.map(x => x.id === r.id ? r : x) })), [updatePet]);
  const deletePhysicalRecord = useCallback((id: string) =>
    updatePet(p => ({ ...p, physicalRecords: p.physicalRecords.filter(r => r.id !== id) })), [updatePet]);

  const addHealthRecord = useCallback((r: HealthRecord) =>
    updatePet(p => ({ ...p, healthRecords: [...p.healthRecords, r] })), [updatePet]);
  const updateHealthRecord = useCallback((r: HealthRecord) =>
    updatePet(p => ({ ...p, healthRecords: p.healthRecords.map(x => x.id === r.id ? r : x) })), [updatePet]);
  const deleteHealthRecord = useCallback((id: string) =>
    updatePet(p => ({ ...p, healthRecords: p.healthRecords.filter(r => r.id !== id) })), [updatePet]);

  const addDailyLog = useCallback((log: DailyLog) =>
    updatePet(p => ({ ...p, dailyLogs: [...p.dailyLogs, log] })), [updatePet]);
  const updateDailyLog = useCallback((log: DailyLog) =>
    updatePet(p => ({ ...p, dailyLogs: p.dailyLogs.map(l => l.id === log.id ? log : l) })), [updatePet]);
  const deleteDailyLog = useCallback((id: string) =>
    updatePet(p => ({ ...p, dailyLogs: p.dailyLogs.filter(l => l.id !== id) })), [updatePet]);

  // ── UI state ──
  const [activeTab, setActiveTab] = useState<TabView>('profile');
  const [healthSubTab, setHealthSubTab] = useState<'health' | 'physical'>('health');
  const [financeSubTab, setFinanceSubTab] = useState<'finance' | 'shops'>('shops');
  const [foodSubTab, setFoodSubTab] = useState<'food' | 'wardrobe'>('food');
  const [scrolled, setScrolled] = useState(false);
  const [isPetSwitcherOpen, setIsPetSwitcherOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const notifSentRef = useRef(false);

  // ── computed values ──
  const dueHealthRecords = useMemo(() => {
    if (!activePet) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cutoff = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return activePet.healthRecords.filter(r => {
      if (!r.nextDueDate) return false;
      const d = new Date(r.nextDueDate);
      return d >= today && d <= cutoff;
    });
  }, [activePet?.healthRecords]);

  const storageUsedBytes = useMemo(() => {
    try {
      let total = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) total += (localStorage.getItem(key) || '').length * 2;
      }
      return total;
    } catch {
      return 0;
    }
  }, [pets]);

  // ── persistence ──
  useEffect(() => {
    try {
      localStorage.setItem('pawprint_pets', JSON.stringify(pets));
    } catch {
      // QuotaExceededError — storage bar will show warning
    }
  }, [pets]);

  useEffect(() => {
    if (resolvedPetId) localStorage.setItem('pawprint_active_pet', resolvedPetId);
  }, [resolvedPetId]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ── health push notifications (once per session) ──
  useEffect(() => {
    if (!activePet || notifSentRef.current || dueHealthRecords.length === 0) return;
    if (!('Notification' in window)) return;
    notifSentRef.current = true;
    const send = () => {
      dueHealthRecords.slice(0, 3).forEach(r => {
        try {
          new Notification(`${activePet.profile.name || '毛孩'} 健康提醒`, {
            body: `${r.title} 即將到期：${r.nextDueDate}`,
            icon: './icon.svg',
          });
        } catch {}
      });
    };
    if (Notification.permission === 'granted') {
      send();
    } else if (Notification.permission === 'default') {
      Notification.requestPermission().then(p => { if (p === 'granted') send(); });
    }
  }, []); // intentionally once on mount

  // ── pet management ──
  const addPet = () => {
    const pet = makePet();
    setPets(prev => [...prev, pet]);
    setActivePetId(pet.id);
    setIsPetSwitcherOpen(false);
  };

  const deletePet = (id: string) => {
    if (pets.length <= 1) return;
    if (!window.confirm('確定要刪除這隻寵物的所有資料嗎？此操作無法復原。')) return;
    setPets(prev => prev.filter(p => p.id !== id));
    if (id === resolvedPetId) {
      const remaining = pets.filter(p => p.id !== id);
      setActivePetId(remaining[0]?.id || '');
    }
  };

  // ── export / import ──
  const handleExportData = () => {
    const data = { version: 2, pets };
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
        if (data.version === 2 && Array.isArray(data.pets)) {
          setPets(data.pets);
          if (data.pets[0]) setActivePetId(data.pets[0].id);
        } else {
          // Legacy single-pet format
          const pet = makePet({
            profile: data.profile || DEFAULT_PROFILE,
            physicalRecords: data.physicalRecords || [],
            healthRecords: data.healthRecords || [],
            inventoryItems: data.inventoryItems || [],
            policies: data.insurancePolicies || [],
            services: data.prepaidServices || [],
            shops: data.shops || [],
            dailyLogs: data.dailyLogs || [],
            wardrobeItems: data.wardrobeItems || [],
          });
          setPets([pet]);
          setActivePetId(pet.id);
        }
        alert('資料匯入成功！');
      } catch {
        alert('匯入失敗，檔案格式錯誤。');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleNavigate = (tab: TabView, subtab?: string) => {
    setActiveTab(tab);
    if (tab === 'health' && subtab) setHealthSubTab(subtab as 'health' | 'physical');
    if (tab === 'food' && subtab) setFoodSubTab(subtab as 'food' | 'wardrobe');
    if (tab === 'finance' && subtab) setFinanceSubTab(subtab as 'finance' | 'shops');
  };

  if (!activePet) return null;

  return (
    <div className="min-h-screen pb-36 selection:bg-clay/20 selection:text-ink" style={{ fontFamily: "'Raleway', 'Noto Serif SC', sans-serif" }}>

      {/* ── Global Search overlay ── */}
      {isSearchOpen && (
        <GlobalSearch
          pet={activePet}
          onClose={() => setIsSearchOpen(false)}
          onNavigate={handleNavigate}
        />
      )}

      {/* ── Pet Switcher overlay ── */}
      {isPetSwitcherOpen && (
        <div
          className="fixed inset-0 z-[200] flex flex-col justify-end"
          style={{ background: 'rgba(43,33,26,0.30)', backdropFilter: 'blur(4px)' }}
          onClick={() => setIsPetSwitcherOpen(false)}
        >
          <div
            className="rounded-t-[2rem] p-6 border-t border-white/80"
            style={{ background: 'rgba(255,253,250,0.97)', backdropFilter: 'blur(24px)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-sand/60 rounded-full mx-auto mb-5" />
            <p className="text-[10px] font-sans tracking-[0.22em] uppercase text-pencil/45 mb-4">切換寵物</p>

            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
              {pets.map(pet => (
                <div key={pet.id} className="flex items-center gap-2">
                  <button
                    onClick={() => { setActivePetId(pet.id); setIsPetSwitcherOpen(false); }}
                    className={`flex-1 flex items-center gap-3 p-3 rounded-2xl transition-all text-left ${
                      pet.id === resolvedPetId
                        ? 'border border-clay/25'
                        : 'bg-white/60 border border-white/70 hover:bg-white/90'
                    }`}
                    style={pet.id === resolvedPetId ? { background: 'rgba(184,112,104,0.08)' } : undefined}
                  >
                    {pet.profile.photoUrl ? (
                      <img src={pet.profile.photoUrl} className="w-10 h-10 rounded-full object-cover flex-shrink-0 border-2 border-white" alt="" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-sand/30 flex items-center justify-center flex-shrink-0">
                        <PawPrint size={16} className="text-clay" fill="currentColor" strokeWidth={0} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{pet.profile.name || '未命名寵物'}</p>
                      <p className="text-xs text-pencil/50 truncate">{pet.profile.breed || '品種不明'}</p>
                    </div>
                    {pet.id === resolvedPetId && (
                      <span className="w-2 h-2 rounded-full bg-clay flex-shrink-0" />
                    )}
                  </button>
                  {pets.length > 1 && (
                    <button
                      onClick={() => deletePet(pet.id)}
                      className="p-2.5 text-pencil/25 hover:text-clay transition-colors flex-shrink-0"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={addPet}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-dashed border-sand text-pencil/45 hover:text-ink hover:border-clay/30 transition-all text-sm font-sans"
              style={{ paddingBottom: 'calc(0.875rem + env(safe-area-inset-bottom))' }}
            >
              <Plus size={15} />
              新增寵物
            </button>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <header className={`sticky top-0 z-50 px-5 flex items-center justify-between transition-all duration-500 ${
        scrolled ? 'glass shadow-sm py-3' : 'bg-transparent py-5'
      }`}>
        <div className="flex items-center gap-2">
          {/* Pet photo → navigate to profile */}
          <button onClick={() => setActiveTab('profile')} className={`transition-all duration-300 ${scrolled ? 'scale-90' : 'scale-100'}`}>
            {activePet.profile.photoUrl ? (
              <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white shadow-md flex-shrink-0">
                <img src={activePet.profile.photoUrl} alt="Profile" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm border border-sand flex-shrink-0">
                <PawPrint className="text-clay" fill="currentColor" size={18} strokeWidth={0} />
              </div>
            )}
          </button>

          {/* Pet name → open pet switcher */}
          <button
            onClick={() => setIsPetSwitcherOpen(true)}
            className="flex items-center gap-1 hover:opacity-70 transition-opacity"
          >
            <h1 className="font-fangsong text-xl tracking-wide text-ink truncate max-w-[140px]">
              {activePet.profile.name || 'My Pet Journal'}
            </h1>
            <ChevronDown size={13} className="text-pencil/40 flex-shrink-0 mt-0.5" />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-2 rounded-full bg-white/50 text-ink/60 hover:text-ink hover:bg-white/80 transition-colors border border-white/40"
            title="搜尋"
          >
            <Search size={16} />
          </button>
          <button
            onClick={handleExportData}
            className="p-2 rounded-full bg-white/50 text-ink/60 hover:text-ink hover:bg-white/80 transition-colors border border-white/40"
            title="匯出資料"
          >
            <Download size={16} />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-full bg-white/50 text-ink/60 hover:text-ink hover:bg-white/80 transition-colors border border-white/40"
            title="匯入資料"
          >
            <Upload size={16} />
          </button>
          <input type="file" ref={fileInputRef} onChange={handleImportData} accept=".json" className="hidden" />
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="max-w-md mx-auto px-5 pt-2">

        {/* ── Profile ── */}
        {activeTab === 'profile' && (
          <div className="animate-fade-in">
            <ProfileSection
              profile={activePet.profile}
              setProfile={setProfile}
              storageUsedBytes={storageUsedBytes}
            />
          </div>
        )}

        {/* ── Daily ── */}
        {activeTab === 'daily' && (
          <div className="animate-fade-in">
            <SectionHeader en="Daily Journal" zh="日常紀錄" />
            <DailySection
              logs={activePet.dailyLogs}
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

            {/* Due-date in-app banner */}
            {healthSubTab === 'health' && dueHealthRecords.length > 0 && (
              <div
                className="flex items-start gap-3 rounded-2xl px-4 py-3 mb-5 border"
                style={{ background: 'rgba(184,112,104,0.07)', borderColor: 'rgba(184,112,104,0.18)' }}
              >
                <Bell size={14} className="text-clay flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-clay font-sans mb-1">7 天內即將到期</p>
                  {dueHealthRecords.slice(0, 3).map(r => (
                    <p key={r.id} className="text-xs text-pencil/70 font-sans">· {r.title} — {r.nextDueDate}</p>
                  ))}
                </div>
              </div>
            )}

            {healthSubTab === 'health' ? (
              <>
                <SectionHeader en="Medical History" zh="健康日曆" />
                <HealthSection
                  records={activePet.healthRecords}
                  addRecord={addHealthRecord}
                  updateRecord={updateHealthRecord}
                  deleteRecord={deleteHealthRecord}
                  shops={activePet.shops}
                />
              </>
            ) : (
              <>
                <SectionHeader en="Growth Tracker" zh="體態紀錄" />
                <PhysicalSection
                  records={activePet.physicalRecords}
                  addRecord={addPhysicalRecord}
                  updateRecord={updatePhysicalRecord}
                  deleteRecord={deletePhysicalRecord}
                  profile={activePet.profile}
                />
              </>
            )}
          </div>
        )}

        {/* ── Food + Wardrobe ── */}
        {activeTab === 'food' && (
          <div className="animate-fade-in">
            <SubToggle
              options={[{ value: 'food', label: '食物庫存' }, { value: 'wardrobe', label: '衣物配件' }]}
              active={foodSubTab}
              onChange={v => setFoodSubTab(v as 'food' | 'wardrobe')}
            />
            {foodSubTab === 'food' ? (
              <>
                <SectionHeader en="Pantry & Diet" zh="食物庫存" />
                <FoodSection
                  items={activePet.inventoryItems}
                  setItems={setInventoryItems}
                  profile={activePet.profile}
                />
              </>
            ) : (
              <>
                <SectionHeader en="Wardrobe" zh="衣物配件" />
                <WardrobeSection items={activePet.wardrobeItems} setItems={setWardrobeItems} />
              </>
            )}
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
                  policies={activePet.policies}
                  setPolicies={setInsurancePolicies}
                  services={activePet.services}
                  setServices={setPrepaidServices}
                  inventoryItems={activePet.inventoryItems}
                  profile={activePet.profile}
                />
              </>
            ) : (
              <>
                <SectionHeader en="Places & Visits" zh="住宿與美容" />
                <ShopSection shops={activePet.shops} setShops={setShops} />
              </>
            )}
          </div>
        )}

      </main>

      {/* ── Bottom Nav ── */}
      <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50">
        <div
          className="backdrop-blur-2xl rounded-[2rem] px-1.5 py-1.5 flex gap-0.5"
          style={{
            background: 'rgba(255, 253, 250, 0.94)',
            border: '1px solid rgba(255, 255, 255, 0.92)',
            boxShadow: '0 8px 40px -4px rgba(152, 100, 80, 0.12), 0 2px 10px -2px rgba(152, 100, 80, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.98)',
          }}
        >
          <NavBtn active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={User} label="資料" />
          <NavBtn active={activeTab === 'daily'} onClick={() => setActiveTab('daily')} icon={CalendarDays} label="日常" />
          <NavBtn
            active={activeTab === 'health'}
            onClick={() => setActiveTab('health')}
            icon={Heart}
            label="健康"
            badge={dueHealthRecords.length > 0}
          />
          <NavBtn active={activeTab === 'food'} onClick={() => setActiveTab('food')} icon={Utensils} label="飲食" />
          <NavBtn active={activeTab === 'finance'} onClick={() => setActiveTab('finance')} icon={Wallet} label="財務" />
        </div>
      </nav>

    </div>
  );
};

export default App;
