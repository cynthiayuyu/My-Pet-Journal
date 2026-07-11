import React, { useState, useMemo } from 'react';
import { WardrobeItem } from '../types';
import { generateId } from '../utils';
import { Plus, Trash2, X, Search, Tag, Settings, Edit2, Save } from 'lucide-react';
import { PhotoGallery, PhotoStrip } from './PhotoGallery';

interface WardrobeSectionProps {
  items: WardrobeItem[];
  setItems: (items: WardrobeItem[]) => void;
}

const CATEGORIES: { value: WardrobeItem['category']; label: string }[] = [
  { value: 'Clothing',  label: '衣服' },
  { value: 'Accessory', label: '配件' },
  { value: 'Bag',       label: '包包' },
  { value: 'Other',     label: '其他' },
];

const DEFAULT_SOURCES = ['蝦皮', 'PChome', '寵物用品店', '其他'];

type SortOrder = 'default' | 'az' | 'za' | 'price_asc' | 'price_desc';

export const WardrobeSection: React.FC<WardrobeSectionProps> = ({ items, setItems }) => {
  const [isFormOpen, setIsFormOpen]   = useState(false);
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [newItem, setNewItem]         = useState<Partial<WardrobeItem>>({ category: 'Clothing' });
  const [toastMsg, setToastMsg]       = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2000);
  };
  const [searchTerm, setSearchTerm]   = useState('');
  const [filterCat, setFilterCat]     = useState<WardrobeItem['category'] | null>(null);
  const [sortOrder, setSortOrder]     = useState<SortOrder>('default');

  // ── Purchase source options (custom, editable list) ──
  const [sources, setSources] = useState<string[]>(() => {
    const saved = localStorage.getItem('pawprint_wardrobe_sources');
    return saved ? JSON.parse(saved) : DEFAULT_SOURCES;
  });
  React.useEffect(() => {
    localStorage.setItem('pawprint_wardrobe_sources', JSON.stringify(sources));
  }, [sources]);
  const [isManagingSources, setIsManagingSources] = useState(false);
  const [newSource, setNewSource] = useState('');
  const [editingSource, setEditingSource] = useState<string | null>(null);
  const [editSourceValue, setEditSourceValue] = useState('');

  const handleAddSource = () => {
    if (newSource.trim() && !sources.includes(newSource.trim())) {
      setSources([...sources, newSource.trim()]);
      setNewSource('');
    }
  };
  const handleDeleteSource = (source: string) => {
    setSources(sources.filter(s => s !== source));
  };
  const handleSaveEditSource = (oldSource: string) => {
    if (editSourceValue.trim() && editSourceValue.trim() !== oldSource && !sources.includes(editSourceValue.trim())) {
      setSources(sources.map(s => s === oldSource ? editSourceValue.trim() : s));
      setItems(items.map(i => i.purchaseSource === oldSource ? { ...i, purchaseSource: editSourceValue.trim() } : i));
    }
    setEditingSource(null);
  };

  const uniqueSources = Array.from(new Set([...sources, ...items.map(i => i.purchaseSource).filter(Boolean) as string[]]));

  // Plain render helper (not a component) — an inline component type would be
  // recreated on every keystroke, remounting the input and dropping focus.
  const renderSourceSelector = (value: string | undefined, onChange: (v: string) => void) => (
    <>
      <select
        value={uniqueSources.includes(value || '') ? value : (value ? 'other' : '')}
        onChange={e => onChange(e.target.value === 'other' ? ' ' : e.target.value)}
        className="w-full py-2 bg-transparent border-b border-sand focus:border-gold text-ink font-fangsong text-lg rounded-none appearance-none"
      >
        <option value="">請選擇...</option>
        {uniqueSources.map(s => <option key={s} value={s}>{s}</option>)}
        <option value="other">+ 新增...</option>
      </select>
      {(!uniqueSources.includes(value || '') && value !== '') && (
        <input
          type="text"
          placeholder="輸入新來源..."
          value={value === ' ' ? '' : value || ''}
          onChange={e => onChange(e.target.value)}
          className="w-full mt-2 py-2 bg-transparent border-b border-sand focus:border-gold text-ink font-fangsong text-lg rounded-none placeholder-sand/50 animate-fade-in"
        />
      )}
    </>
  );

  const handleOpenForm = (item?: WardrobeItem) => {
    (document.activeElement as HTMLElement | null)?.blur();
    if (item) {
      setEditingId(item.id);
      setNewItem(item);
    } else {
      setEditingId(null);
      setNewItem({ category: 'Clothing' });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name) return;
    const item: WardrobeItem = {
      id: editingId || generateId(),
      name: newItem.name,
      category: newItem.category || 'Clothing',
      brand: newItem.brand || undefined,
      color: newItem.color || undefined,
      size: newItem.size || undefined,
      purchaseDate: newItem.purchaseDate || undefined,
      purchaseSource: newItem.purchaseSource?.trim() || undefined,
      price: newItem.price || undefined,
      notes: newItem.notes || undefined,
      photos: newItem.photos?.length ? newItem.photos : (newItem.photoUrl ? [newItem.photoUrl] : undefined),
    };
    if (editingId) {
      setItems(items.map(i => i.id === editingId ? item : i));
    } else {
      setItems([item, ...items]);
    }
    showToast(editingId ? '已更新 ✓' : '已新增 ✓');
    setIsFormOpen(false);
    setNewItem({ category: 'Clothing' });
    setEditingId(null);
  };

  const filteredItems = useMemo(() => {
    let result = items;
    if (filterCat) result = result.filter(i => i.category === filterCat);
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      result = result.filter(i =>
        i.name.toLowerCase().includes(t) ||
        i.brand?.toLowerCase().includes(t) ||
        i.color?.toLowerCase().includes(t) ||
        i.notes?.toLowerCase().includes(t)
      );
    }
    result = [...result];
    if (sortOrder === 'az') result.sort((a, b) => a.name.localeCompare(b.name, 'zh-TW'));
    else if (sortOrder === 'za') result.sort((a, b) => b.name.localeCompare(a.name, 'zh-TW'));
    else if (sortOrder === 'price_asc') result.sort((a, b) => (a.price || 0) - (b.price || 0));
    else if (sortOrder === 'price_desc') result.sort((a, b) => (b.price || 0) - (a.price || 0));
    return result;
  }, [items, filterCat, searchTerm, sortOrder]);

  const catLabel = (cat: WardrobeItem['category']) =>
    CATEGORIES.find(c => c.value === cat)?.label ?? cat;

  const renderCard = (item: WardrobeItem) => {
    const firstPhoto = item.photos?.[0] || item.photoUrl;
    return (
      <div
        key={item.id}
        className="card-warm rounded-2xl overflow-hidden relative group cursor-pointer active:scale-[0.98] transition-transform"
        onClick={() => handleOpenForm(item)}
      >
        {firstPhoto ? (
          <div className="w-full aspect-square overflow-hidden bg-sand/10">
            <img
              src={firstPhoto}
              alt={item.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        ) : (
          <div className="w-full aspect-square bg-gradient-to-br from-sand/20 to-sand/5 flex items-center justify-center">
            <Tag size={28} className="text-pencil/25" />
          </div>
        )}
        <button
          onClick={e => { e.stopPropagation(); if (!window.confirm('確定要刪除嗎？')) return; setItems(items.filter(i => i.id !== item.id)); }}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center text-ink/30 hover:text-clay opacity-0 group-hover:opacity-100 transition-all shadow-sm"
        >
          <Trash2 size={13} />
        </button>
        <div className="p-3 pb-3.5">
          <div className="font-fangsong text-sm text-ink truncate leading-snug">{item.name}</div>
          {item.brand && <div className="text-[10px] text-pencil/55 font-sans truncate mt-0.5">{item.brand}</div>}
          <div className="flex items-center justify-between mt-1">
            {item.color && <span className="text-[10px] text-pencil/50 font-fangsong">{item.color}</span>}
            {item.price ? <span className="text-xs text-gold font-fangsong">${item.price.toLocaleString()}</span> : null}
          </div>
        </div>
      </div>
    );
  };

  const totalValue = useMemo(
    () => items.reduce((sum, i) => sum + (i.price || 0), 0),
    [items]
  );

  const categoryTotals = useMemo(() => {
    const map: Record<string, { count: number; value: number }> = {};
    CATEGORIES.forEach(c => { map[c.value] = { count: 0, value: 0 }; });
    items.forEach(i => {
      map[i.category].count++;
      map[i.category].value += i.price || 0;
    });
    return map;
  }, [items]);

  return (
    <div className="space-y-5 animate-fade-in">
      {toastMsg && (
        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[150] bg-ink/80 text-white text-sm px-5 py-2.5 rounded-full shadow-lg font-sans pointer-events-none animate-fade-in"
          style={{ whiteSpace: 'nowrap' }}
        >
          {toastMsg}
        </div>
      )}

      {/* ── Source Management Modal ── */}
      {isManagingSources && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none p-4">
          <div className="absolute inset-0 bg-ink/20 backdrop-blur-sm pointer-events-auto" onClick={() => setIsManagingSources(false)} />
          <div className="bg-[#FDFAF5] w-full max-w-sm rounded-3xl p-6 shadow-2xl pointer-events-auto animate-fade-in relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-fangsong text-xl text-ink">購入來源管理</h3>
              <button onClick={() => setIsManagingSources(false)} className="text-ink/40 hover:text-ink"><X size={20} /></button>
            </div>
            <div className="space-y-3 mb-6 max-h-[40vh] overflow-y-auto pr-2">
              {sources.map(source => (
                <div key={source} className="flex justify-between items-center bg-white p-3 rounded-xl border border-sand/30">
                  {editingSource === source ? (
                    <input
                      type="text" value={editSourceValue}
                      onChange={e => setEditSourceValue(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSaveEditSource(source)}
                      className="flex-1 bg-transparent border-b border-clay focus:outline-none text-ink font-fangsong mr-2"
                      autoFocus
                    />
                  ) : (
                    <span className="text-ink font-fangsong">{source}</span>
                  )}
                  <div className="flex gap-2">
                    {editingSource === source ? (
                      <button onClick={() => handleSaveEditSource(source)} className="text-clay hover:text-clay/80"><Save size={16} /></button>
                    ) : (
                      <button onClick={() => { setEditingSource(source); setEditSourceValue(source); }} className="text-sand hover:text-clay"><Edit2 size={16} /></button>
                    )}
                    <button onClick={() => handleDeleteSource(source)} className="text-sand hover:text-clay"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
              {sources.length === 0 && (
                <p className="text-sm font-fangsong text-pencil text-center py-4">尚無來源，請新增</p>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text" placeholder="新增來源..."
                value={newSource}
                onChange={e => setNewSource(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddSource()}
                className="flex-1 bg-white border border-sand rounded-xl px-4 py-2 text-ink focus:ring-1 focus:ring-clay outline-none font-fangsong"
              />
              <button onClick={handleAddSource} className="bg-clay text-white px-4 py-2 rounded-xl hover:bg-clay/90 transition-colors">
                <Plus size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-pencil">
          <Search size={18} />
        </div>
        <input
          type="text"
          placeholder="搜尋衣物配件..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white/80 backdrop-blur-md border border-white rounded-2xl shadow-sm focus:outline-none text-ink font-fangsong transition-all"
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className="absolute inset-y-0 right-4 flex items-center text-pencil hover:text-ink">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Category filter + Add button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 flex-1 min-w-0">
          <button
            onClick={() => setFilterCat(null)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-sans font-semibold transition-all ${
              !filterCat ? 'bg-clay text-white shadow-sm' : 'bg-white/70 text-pencil border border-sand/40'
            }`}
          >全部 {items.length}</button>
          {CATEGORIES.map(cat => {
            const count = items.filter(i => i.category === cat.value).length;
            if (count === 0) return null;
            return (
              <button
                key={cat.value}
                onClick={() => setFilterCat(f => f === cat.value ? null : cat.value)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-sans font-semibold transition-all ${
                  filterCat === cat.value ? 'bg-clay text-white shadow-sm' : 'bg-white/70 text-pencil border border-sand/40'
                }`}
              >{cat.label} {count}</button>
            );
          })}
        </div>
        <button
          onClick={() => setIsManagingSources(true)}
          className="w-9 h-9 rounded-full bg-white border border-sand flex items-center justify-center text-pencil hover:text-clay shadow-sm hover:bg-sand/20 transition-colors flex-shrink-0"
          title="來源管理"
        >
          <Settings size={15} />
        </button>
        <button
          onClick={() => handleOpenForm()}
          className="w-9 h-9 rounded-full bg-white border border-sand flex items-center justify-center text-ink shadow-sm hover:bg-sand/20 transition-colors flex-shrink-0"
        >
          <Plus size={17} />
        </button>
      </div>

      {/* Sort control */}
      {items.length > 1 && (
        <div className="flex items-center justify-end gap-2">
          <span className="text-[10px] text-pencil/55 font-sans uppercase tracking-widest">排序</span>
          <select
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value as SortOrder)}
            className="text-xs font-sans text-pencil bg-white/70 border border-sand/30 rounded-full px-3 py-1 focus:outline-none appearance-none cursor-pointer"
          >
            <option value="default">預設順序</option>
            <option value="az">名稱 A → Z</option>
            <option value="za">名稱 Z → A</option>
            <option value="price_asc">價格 由低到高</option>
            <option value="price_desc">價格 由高到低</option>
          </select>
        </div>
      )}

      {/* Total spend banner */}
      {totalValue > 0 && !filterCat && !searchTerm && (
        <div className="bg-white/60 border border-white/90 rounded-2xl px-5 py-3 flex justify-between items-center shadow-sm">
          <span className="text-xs text-pencil/60 font-sans uppercase tracking-widest">總花費</span>
          <span className="font-fangsong text-lg text-clay">${totalValue.toLocaleString()}</span>
        </div>
      )}

      {/* Empty state */}
      {filteredItems.length === 0 && (
        <div
          className="bg-white/50 border border-dashed border-sand rounded-3xl p-8 flex flex-col items-center justify-center text-center gap-4 group hover:border-gold/50 hover:bg-white/80 transition-all cursor-pointer"
          onClick={() => !searchTerm && !filterCat && handleOpenForm()}
        >
          <div className="w-12 h-12 rounded-full bg-sand/20 flex items-center justify-center text-pencil group-hover:text-gold group-hover:scale-110 transition-all duration-500">
            <Tag size={22} />
          </div>
          <p className="text-sm font-fangsong text-pencil">
            {searchTerm || filterCat ? '找不到符合的項目' : '點擊新增衣物配件'}
          </p>
        </div>
      )}

      {/* Grid */}
      {(filterCat || searchTerm) ? (
        <div className="grid grid-cols-2 gap-3">
          {filteredItems.map(item => renderCard(item))}
        </div>
      ) : (
        <div className="space-y-5">
          {CATEGORIES.filter(cat => categoryTotals[cat.value].count > 0).map(cat => (
            <div key={cat.value}>
              <div className="flex items-center justify-between px-1 mb-2">
                <div className="flex items-center gap-2">
                  <Tag size={11} className="text-clay/60" />
                  <span className="text-[10px] font-bold tracking-[0.2em] text-clay/70 uppercase font-sans">{cat.label}</span>
                  <span className="text-[10px] text-pencil/40 font-sans">{categoryTotals[cat.value].count} 件</span>
                </div>
                {categoryTotals[cat.value].value > 0 && (
                  <span className="text-xs font-fangsong text-gold">${categoryTotals[cat.value].value.toLocaleString()}</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {filteredItems.filter(i => i.category === cat.value).map(item => renderCard(item))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Slide-up Form */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center pointer-events-none">
          <div className="absolute inset-0 bg-ink/20 backdrop-blur-sm pointer-events-auto" onClick={() => setIsFormOpen(false)} />
          <form
            onSubmit={handleSubmit}
            className="bg-[#FDFAF5] w-full max-w-md rounded-t-[2.5rem] shadow-2xl pointer-events-auto animate-fade-in relative flex flex-col"
            style={{ maxHeight: '90dvh' }}
          >
            <div className="flex-shrink-0 px-8 pt-6 pb-4">
              <div className="w-12 h-1 bg-sand rounded-full mx-auto mb-5 opacity-50" />
              <div className="flex justify-between items-center">
                <h3 className="font-fangsong text-2xl text-ink">{editingId ? '編輯物品' : '新增物品'}</h3>
                <button type="button" onClick={() => setIsFormOpen(false)} className="w-8 h-8 rounded-full bg-sand/30 flex items-center justify-center text-ink hover:bg-sand transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-8 pb-4 space-y-5" style={{ overscrollBehavior: 'contain' }}>
              {/* Photos */}
              <div>
                <label className="text-[10px] text-pencil font-bold tracking-widest uppercase mb-2 block font-sans">照片</label>
                <PhotoGallery
                  photos={newItem.photos || (newItem.photoUrl ? [newItem.photoUrl] : [])}
                  onChange={photos => setNewItem(prev => ({ ...prev, photos }))}
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-[10px] text-pencil font-bold tracking-widest uppercase mb-2 block font-sans">類別</label>
                <div className="flex gap-2 flex-wrap">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setNewItem(prev => ({ ...prev, category: cat.value }))}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-sans font-semibold transition-all ${
                        newItem.category === cat.value ? 'bg-clay text-white shadow-sm' : 'bg-sand/25 text-pencil hover:bg-sand/40'
                      }`}
                    >{cat.label}</button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="text-[10px] text-pencil font-bold tracking-widest uppercase mb-1 block font-sans">品名</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. 條紋毛衣、牽繩..."
                  value={newItem.name || ''}
                  onChange={e => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full py-2 bg-transparent border-b border-sand focus:border-gold text-ink font-fangsong text-xl rounded-none placeholder-sand/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="text-[10px] text-pencil font-bold tracking-widest uppercase mb-1 block font-sans">品牌</label>
                  <input
                    type="text"
                    placeholder="e.g. RC Pet"
                    value={newItem.brand || ''}
                    onChange={e => setNewItem(prev => ({ ...prev, brand: e.target.value }))}
                    className="w-full py-2 bg-transparent border-b border-sand focus:border-gold text-ink font-fangsong text-lg rounded-none placeholder-sand/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-pencil font-bold tracking-widest uppercase mb-1 block font-sans">顏色</label>
                  <input
                    type="text"
                    placeholder="e.g. 橘色"
                    value={newItem.color || ''}
                    onChange={e => setNewItem(prev => ({ ...prev, color: e.target.value }))}
                    className="w-full py-2 bg-transparent border-b border-sand focus:border-gold text-ink font-fangsong text-lg rounded-none placeholder-sand/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="text-[10px] text-pencil font-bold tracking-widest uppercase mb-1 block font-sans">尺寸</label>
                  <input
                    type="text"
                    placeholder="e.g. S / 28cm"
                    value={newItem.size || ''}
                    onChange={e => setNewItem(prev => ({ ...prev, size: e.target.value }))}
                    className="w-full py-2 bg-transparent border-b border-sand focus:border-gold text-ink font-fangsong text-lg rounded-none placeholder-sand/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-pencil font-bold tracking-widest uppercase mb-1 block font-sans">購買金額</label>
                  <div className="relative">
                    <span className="absolute left-0 top-2.5 text-ink/60 font-fangsong">$</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={newItem.price || ''}
                      onChange={e => setNewItem(prev => ({ ...prev, price: e.target.value ? Number(e.target.value) : undefined }))}
                      className="w-full pl-4 py-2 bg-transparent border-b border-sand focus:border-gold text-ink font-fangsong text-lg rounded-none placeholder-sand/50"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-pencil font-bold tracking-widest uppercase mb-1 block font-sans">購買日期</label>
                <input
                  type="date"
                  value={newItem.purchaseDate || ''}
                  onChange={e => setNewItem(prev => ({ ...prev, purchaseDate: e.target.value }))}
                  className="w-full py-2 bg-transparent border-b border-sand focus:border-gold text-ink font-fangsong text-lg rounded-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-pencil font-bold tracking-widest uppercase mb-1 block font-sans">購入來源</label>
                {renderSourceSelector(newItem.purchaseSource, v => setNewItem(prev => ({ ...prev, purchaseSource: v })))}
              </div>

              <div>
                <label className="text-[10px] text-pencil font-bold tracking-widest uppercase mb-1 block font-sans">備註</label>
                <textarea
                  rows={2}
                  placeholder="其他備註..."
                  value={newItem.notes || ''}
                  onChange={e => setNewItem(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full py-2 bg-transparent border-b border-sand focus:border-gold text-ink font-fangsong text-lg rounded-none placeholder-sand/50 resize-none"
                />
              </div>
            </div>

            <div className="flex-shrink-0 px-8 pt-4 border-t border-sand/20" style={{ paddingBottom: 'max(0.75rem, calc(0.5rem + env(safe-area-inset-bottom)))' }}>
              <button type="submit" className="w-full py-3.5 btn-warm">
                {editingId ? '更新' : '儲存'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
