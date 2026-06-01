import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, Heart, TrendingUp, Utensils, Tag, MapPin, Wallet, CalendarDays, ChevronRight } from 'lucide-react';
import { PetData, TabView } from '../types';

interface GlobalSearchProps {
  pet: PetData;
  onClose: () => void;
  onNavigate: (tab: TabView, subtab?: string) => void;
}

interface SearchResult {
  id: string;
  sectionLabel: string;
  tab: TabView;
  subtab?: string;
  title: string;
  subtitle?: string;
  iconBg: string;
  iconColor: string;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
}

function matches(query: string, ...fields: (string | number | undefined | null)[]): boolean {
  const q = query.toLowerCase();
  return fields.some(f => f != null && String(f).toLowerCase().includes(q));
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ pet, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const results = useMemo((): SearchResult[] => {
    if (!query.trim()) return [];
    const q = query.trim();
    const out: SearchResult[] = [];

    pet.healthRecords.forEach(r => {
      if (matches(q, r.title, r.notes, r.location, r.type)) {
        out.push({
          id: `health-${r.id}`,
          sectionLabel: '健康日曆',
          tab: 'health',
          subtab: 'health',
          title: r.title,
          subtitle: `${r.type} · ${r.date}`,
          iconBg: 'bg-[rgba(184,112,104,0.10)]',
          iconColor: 'text-clay',
          Icon: Heart,
        });
      }
    });

    pet.physicalRecords.forEach(r => {
      if (matches(q, r.notes, r.weight, r.date)) {
        out.push({
          id: `physical-${r.id}`,
          sectionLabel: '體態紀錄',
          tab: 'health',
          subtab: 'physical',
          title: `體重 ${r.weight} kg`,
          subtitle: r.date,
          iconBg: 'bg-[rgba(122,152,112,0.12)]',
          iconColor: 'text-sage',
          Icon: TrendingUp,
        });
      }
    });

    pet.inventoryItems.forEach(r => {
      if (matches(q, r.name, r.ingredients, r.purchaseLocation, r.type)) {
        out.push({
          id: `food-${r.id}`,
          sectionLabel: '食物庫存',
          tab: 'food',
          subtab: 'food',
          title: r.name,
          subtitle: `${r.type} · ${r.quantity}${r.unit}`,
          iconBg: 'bg-[rgba(184,144,80,0.10)]',
          iconColor: 'text-gold',
          Icon: Utensils,
        });
      }
    });

    pet.wardrobeItems.forEach(r => {
      if (matches(q, r.name, r.brand, r.color, r.notes, r.category)) {
        out.push({
          id: `wardrobe-${r.id}`,
          sectionLabel: '衣物配件',
          tab: 'food',
          subtab: 'wardrobe',
          title: r.name,
          subtitle: [r.brand, r.category].filter(Boolean).join(' · '),
          iconBg: 'bg-[rgba(152,136,168,0.12)]',
          iconColor: 'text-lavender',
          Icon: Tag,
        });
      }
    });

    pet.shops.forEach(r => {
      if (matches(q, r.name, r.type, r.notes)) {
        out.push({
          id: `shop-${r.id}`,
          sectionLabel: '住宿與美容',
          tab: 'finance',
          subtab: 'shops',
          title: r.name,
          subtitle: r.type,
          iconBg: 'bg-[rgba(196,160,168,0.12)]',
          iconColor: 'text-petal',
          Icon: MapPin,
        });
      }
    });

    pet.policies.forEach(r => {
      if (matches(q, r.name, r.provider)) {
        out.push({
          id: `ins-${r.id}`,
          sectionLabel: '財務與服務',
          tab: 'finance',
          subtab: 'finance',
          title: r.name,
          subtitle: r.provider,
          iconBg: 'bg-[rgba(188,168,152,0.14)]',
          iconColor: 'text-warm',
          Icon: Wallet,
        });
      }
    });

    pet.services.forEach(r => {
      if (matches(q, r.name, r.notes, r.type)) {
        out.push({
          id: `svc-${r.id}`,
          sectionLabel: '財務與服務',
          tab: 'finance',
          subtab: 'finance',
          title: r.name,
          subtitle: `${r.type} · 餘額 $${r.balance}`,
          iconBg: 'bg-[rgba(188,168,152,0.14)]',
          iconColor: 'text-warm',
          Icon: Wallet,
        });
      }
    });

    pet.dailyLogs.forEach(r => {
      if (matches(q, r.notes, r.foodIntake, r.waterIntake, r.date)) {
        out.push({
          id: `daily-${r.id}`,
          sectionLabel: '日常紀錄',
          tab: 'daily',
          title: r.date,
          subtitle: (r.notes || r.foodIntake || '').slice(0, 50),
          iconBg: 'bg-[rgba(122,152,112,0.12)]',
          iconColor: 'text-sage',
          Icon: CalendarDays,
        });
      }
    });

    return out.slice(0, 24);
  }, [query, pet]);

  const grouped = useMemo(() => {
    const map = new Map<string, SearchResult[]>();
    results.forEach(r => {
      const arr = map.get(r.sectionLabel) || [];
      arr.push(r);
      map.set(r.sectionLabel, arr);
    });
    return map;
  }, [results]);

  const handleResult = (r: SearchResult) => {
    onNavigate(r.tab, r.subtab);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex flex-col"
      style={{ background: 'rgba(247,244,240,0.97)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
    >
      {/* Search input bar */}
      <div className="flex items-center gap-3 px-5 pt-14 pb-4 flex-shrink-0">
        <div className="flex-1 flex items-center gap-3 bg-white/80 rounded-2xl px-4 py-3 border border-white/80 shadow-sm">
          <Search size={16} className="text-pencil flex-shrink-0" strokeWidth={1.5} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="搜尋健康、飲食、日常..."
            className="flex-1 bg-transparent text-ink text-sm placeholder-warm/60 focus:outline-none"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-pencil/40 hover:text-ink transition-colors">
              <X size={14} />
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-sm text-pencil font-sans hover:text-ink transition-colors px-1 py-2 flex-shrink-0"
        >
          取消
        </button>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-5 pb-10">
        {!query.trim() && (
          <div className="flex flex-col items-center justify-center pt-24 gap-4 text-pencil/30">
            <Search size={36} strokeWidth={1} />
            <p className="text-sm font-sans">搜尋所有寵物紀錄</p>
          </div>
        )}

        {query.trim() && results.length === 0 && (
          <div className="flex flex-col items-center justify-center pt-24 gap-3 text-pencil/40">
            <p className="text-sm font-sans">找不到「{query}」相關紀錄</p>
          </div>
        )}

        {Array.from(grouped.entries()).map(([section, items]) => (
          <div key={section} className="mb-6">
            <p className="text-[10px] font-sans tracking-[0.22em] text-pencil/45 uppercase mb-2.5 pl-1">
              {section}
            </p>
            <div className="space-y-2">
              {items.map(r => (
                <button
                  key={r.id}
                  onClick={() => handleResult(r)}
                  className="w-full flex items-center gap-3 bg-white/70 rounded-2xl px-4 py-3.5 border border-white/80 text-left hover:bg-white transition-all active:scale-[0.98]"
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${r.iconBg} ${r.iconColor}`}>
                    <r.Icon size={15} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ink font-medium truncate">{r.title}</p>
                    {r.subtitle && (
                      <p className="text-xs text-pencil/55 truncate mt-0.5">{r.subtitle}</p>
                    )}
                  </div>
                  <ChevronRight size={14} className="text-pencil/25 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
