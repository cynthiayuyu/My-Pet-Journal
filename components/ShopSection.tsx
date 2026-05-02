import React, { useState, useRef, useMemo } from 'react';
import { PetShop, ShopVisit } from '../types';
import { generateId } from '../utils';
import { Plus, Trash2, MapPin, DollarSign, Calendar, Edit2, Save, X, Search, Camera, Settings, ChevronRight } from 'lucide-react';

interface ShopSectionProps {
  shops: PetShop[];
  setShops: (shops: PetShop[]) => void;
}

export const ShopSection: React.FC<ShopSectionProps> = ({ shops, setShops }) => {
  const [isAddingShop, setIsAddingShop] = useState(false);
  const [newShop, setNewShop] = useState<Partial<PetShop>>({ type: 'Boarding' });
  const [editingShopId, setEditingShopId] = useState<string | null>(null);
  const [editShopData, setEditShopData] = useState<Partial<PetShop>>({});

  const [addingVisitTo, setAddingVisitTo] = useState<string | null>(null);
  const [newVisit, setNewVisit] = useState<Partial<ShopVisit>>({ date: new Date().toISOString().split('T')[0] });
  const [editingVisitId, setEditingVisitId] = useState<string | null>(null);
  const [editVisitData, setEditVisitData] = useState<Partial<ShopVisit>>({});

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryValue, setEditCategoryValue] = useState('');
  const [shopCategories, setShopCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('pawprint_shop_categories');
    return saved ? JSON.parse(saved) : ['Boarding', 'Grooming', 'Other'];
  });
  const [newCategory, setNewCategory] = useState('');

  React.useEffect(() => {
    localStorage.setItem('pawprint_shop_categories', JSON.stringify(shopCategories));
  }, [shopCategories]);

  // Always derive selected shop from latest shops array to stay in sync
  const selectedShop = selectedShopId ? shops.find(s => s.id === selectedShopId) ?? null : null;

  const uniqueShopTypes = Array.from(new Set([
    ...shopCategories,
    ...shops.map(s => s.type).filter(Boolean)
  ]));

  const handleAddCategory = () => {
    if (newCategory.trim() && !shopCategories.includes(newCategory.trim())) {
      setShopCategories([...shopCategories, newCategory.trim()]);
      setNewCategory('');
    }
  };

  const handleDeleteCategory = (category: string) => {
    setShopCategories(shopCategories.filter(c => c !== category));
  };

  const handleSaveEditCategory = (oldCategory: string) => {
    if (editCategoryValue.trim() && editCategoryValue.trim() !== oldCategory && !shopCategories.includes(editCategoryValue.trim())) {
      setShopCategories(shopCategories.map(c => c === oldCategory ? editCategoryValue.trim() : c));
      setShops(shops.map(s => s.type === oldCategory ? { ...s, type: editCategoryValue.trim() } : s));
    }
    setEditingCategory(null);
  };

  const filteredShops = useMemo(() => {
    if (!searchTerm) return shops;
    const term = searchTerm.toLowerCase();
    return shops.filter(s =>
      s.name.toLowerCase().includes(term) ||
      s.type.toLowerCase().includes(term) ||
      s.notes?.toLowerCase().includes(term) ||
      s.visits.some(v => v.purpose.toLowerCase().includes(term) || v.notes?.toLowerCase().includes(term))
    );
  }, [shops, searchTerm]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isEditing: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isEditing) {
          setEditVisitData(prev => ({ ...prev, photoUrl: reader.result as string }));
        } else {
          setNewVisit(prev => ({ ...prev, photoUrl: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddShop = () => {
    if (!newShop.name) return;
    const shop: PetShop = {
      id: generateId(),
      name: newShop.name,
      type: newShop.type || 'Other',
      pricingInfo: newShop.pricingInfo,
      contact: newShop.contact,
      notes: newShop.notes,
      visits: []
    };
    setShops([...shops, shop]);
    setNewShop({ type: 'Boarding' });
    setIsAddingShop(false);
  };

  const handleSaveShop = (id: string) => {
    setShops(shops.map(s => s.id === id ? { ...s, ...editShopData } : s));
    setEditingShopId(null);
  };

  const handleDeleteShop = (id: string) => {
    if (selectedShopId === id) closeSheet();
    setShops(shops.filter(s => s.id !== id));
  };

  const handleAddVisit = (shopId: string) => {
    if (!newVisit.date || !newVisit.purpose) return;
    const visit: ShopVisit = {
      id: generateId(),
      date: newVisit.date,
      cost: Number(newVisit.cost) || 0,
      purpose: newVisit.purpose,
      notes: newVisit.notes,
      photoUrl: newVisit.photoUrl
    };
    setShops(shops.map(s => s.id === shopId ? { ...s, visits: [...s.visits, visit] } : s));
    setNewVisit({ date: new Date().toISOString().split('T')[0] });
    setAddingVisitTo(null);
  };

  const handleSaveVisit = (shopId: string, visitId: string) => {
    setShops(shops.map(s => {
      if (s.id !== shopId) return s;
      return {
        ...s,
        visits: s.visits.map(v => v.id === visitId ? { ...v, ...editVisitData, cost: Number(editVisitData.cost) || 0 } : v)
      };
    }));
    setEditingVisitId(null);
  };

  const handleDeleteVisit = (shopId: string, visitId: string) => {
    setShops(shops.map(s => s.id === shopId ? { ...s, visits: s.visits.filter(v => v.id !== visitId) } : s));
  };

  const closeSheet = () => {
    setSelectedShopId(null);
    setEditingShopId(null);
    setAddingVisitTo(null);
    setEditingVisitId(null);
  };

  const TypeSelector = ({ value, onChange }: { value: string | undefined; onChange: (v: string) => void }) => (
    <>
      <select
        className="w-full bg-white/70 border border-sand/50 rounded-xl px-4 py-2.5 text-ink focus:ring-1 focus:ring-clay appearance-none"
        value={uniqueShopTypes.includes(value || '') ? value : (value ? 'other' : '')}
        onChange={e => onChange(e.target.value === 'other' ? ' ' : e.target.value)}
      >
        <option value="">選擇類型...</option>
        {uniqueShopTypes.map(t => <option key={t} value={t}>{t}</option>)}
        <option value="other">+ 新增類型...</option>
      </select>
      {(!uniqueShopTypes.includes(value || '') && value !== '') && (
        <input
          type="text"
          placeholder="輸入新類型..."
          value={value?.trim() || ''}
          onChange={e => onChange(e.target.value)}
          className="w-full bg-white/70 border border-sand/50 rounded-xl px-4 py-2.5 text-ink focus:ring-1 focus:ring-clay animate-fade-in"
          autoFocus
        />
      )}
    </>
  );

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-fangsong text-ink">愛店與地點</h3>
        <div className="flex gap-4">
          <button
            onClick={() => setIsManagingCategories(true)}
            className="flex items-center gap-1 text-sm text-pencil hover:text-clay transition-colors"
          >
            <Settings size={16} />
            <span>Categories <span className="text-pencil/55">分類</span></span>
          </button>
          <button
            onClick={() => setIsAddingShop(true)}
            className="flex items-center gap-1 text-sm text-clay hover:text-clay/80 transition-colors"
          >
            <Plus size={16} />
            <span>Add <span className="text-clay/70">新增</span></span>
          </button>
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-pencil">
          <Search size={18} />
        </div>
        <input
          type="text"
          placeholder="搜尋店家 Search shops..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white/80 backdrop-blur-md border border-white rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-gold/50 text-ink font-fangsong transition-all"
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className="absolute inset-y-0 right-4 flex items-center text-pencil hover:text-ink">
            <X size={16} />
          </button>
        )}
      </div>

      {/* ── Category Management Modal ── */}
      {isManagingCategories && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none p-4">
          <div className="absolute inset-0 bg-ink/20 backdrop-blur-sm pointer-events-auto" onClick={() => setIsManagingCategories(false)} />
          <div className="bg-[#FDFAF5] w-full max-w-sm rounded-3xl p-6 shadow-2xl pointer-events-auto animate-fade-in relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-fangsong text-xl text-ink">分類管理 <span className="text-base text-pencil/55">Categories</span></h3>
              <button onClick={() => setIsManagingCategories(false)} className="text-ink/40 hover:text-ink"><X size={20} /></button>
            </div>
            <div className="space-y-3 mb-6 max-h-[40vh] overflow-y-auto pr-2">
              {shopCategories.map(category => (
                <div key={category} className="flex justify-between items-center bg-white p-3 rounded-xl border border-sand/30">
                  {editingCategory === category ? (
                    <input
                      type="text" value={editCategoryValue}
                      onChange={e => setEditCategoryValue(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSaveEditCategory(category)}
                      className="flex-1 bg-transparent border-b border-clay focus:outline-none text-ink font-fangsong mr-2"
                      autoFocus
                    />
                  ) : (
                    <span className="text-ink font-fangsong">{category}</span>
                  )}
                  <div className="flex gap-2">
                    {editingCategory === category ? (
                      <button onClick={() => handleSaveEditCategory(category)} className="text-clay hover:text-clay/80"><Save size={16} /></button>
                    ) : (
                      <button onClick={() => { setEditingCategory(category); setEditCategoryValue(category); }} className="text-sand hover:text-clay"><Edit2 size={16} /></button>
                    )}
                    <button onClick={() => handleDeleteCategory(category)} className="text-sand hover:text-clay"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text" placeholder="新增分類 New Category..."
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                className="flex-1 bg-white border border-sand rounded-xl px-4 py-2 text-ink focus:ring-1 focus:ring-clay outline-none font-fangsong"
              />
              <button onClick={handleAddCategory} className="bg-clay text-white px-4 py-2 rounded-xl hover:bg-clay/90 transition-colors">
                <Plus size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Shop Form ── */}
      {isAddingShop && (
        <div className="glass p-4 rounded-2xl animate-fade-in border border-clay/20 space-y-3">
          <input
            type="text" placeholder="商店名稱 Shop Name"
            className="w-full bg-white/60 border border-sand/40 rounded-xl px-4 py-2.5 text-ink focus:ring-1 focus:ring-clay"
            value={newShop.name || ''}
            onChange={e => setNewShop({ ...newShop, name: e.target.value })}
          />
          <TypeSelector value={newShop.type} onChange={v => setNewShop({ ...newShop, type: v })} />
          <textarea
            placeholder="聯絡方式 Contact（電話、地址...）"
            className="w-full bg-white/60 border border-sand/40 rounded-xl px-4 py-2.5 text-ink focus:ring-1 focus:ring-clay min-h-[72px] whitespace-pre-wrap"
            value={newShop.contact || ''}
            onChange={e => setNewShop({ ...newShop, contact: e.target.value })}
          />
          <textarea
            placeholder="收費資訊 Pricing"
            className="w-full bg-white/60 border border-sand/40 rounded-xl px-4 py-2.5 text-ink focus:ring-1 focus:ring-clay min-h-[72px] whitespace-pre-wrap"
            value={newShop.pricingInfo || ''}
            onChange={e => setNewShop({ ...newShop, pricingInfo: e.target.value })}
          />
          <textarea
            placeholder="備註 Notes"
            className="w-full bg-white/60 border border-sand/40 rounded-xl px-4 py-2.5 text-ink focus:ring-1 focus:ring-clay min-h-[72px] whitespace-pre-wrap"
            value={newShop.notes || ''}
            onChange={e => setNewShop({ ...newShop, notes: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={() => setIsAddingShop(false)} className="px-4 py-2 text-sm text-ink/60 hover:text-ink">取消</button>
            <button onClick={handleAddShop} className="px-4 py-2 text-sm bg-clay text-white rounded-xl hover:bg-clay/90">儲存店家</button>
          </div>
        </div>
      )}

      {/* No results */}
      {filteredShops.length === 0 && searchTerm && (
        <div className="text-center py-8 bg-white/50 rounded-3xl border border-dashed border-sand">
          <p className="text-sm font-fangsong text-pencil">找不到符合的店家。</p>
        </div>
      )}

      {/* ── Compact Shop List ── */}
      {filteredShops.map(shop => {
        const lastVisit = shop.visits.length > 0
          ? [...shop.visits].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
          : null;
        return (
          <div
            key={shop.id}
            className="card-warm rounded-2xl p-5 cursor-pointer hover:shadow-float active:scale-[0.99] transition-all duration-300"
            onClick={() => setSelectedShopId(shop.id)}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sand/30 text-clay font-sans inline-block mb-1.5">{shop.type}</span>
                <h4 className="font-fangsong text-xl text-ink truncate">{shop.name}</h4>
              </div>
              <div className="flex items-center gap-1 ml-3 flex-shrink-0">
                <button
                  onClick={e => { e.stopPropagation(); handleDeleteShop(shop.id); }}
                  className="p-2 text-ink/25 hover:text-clay transition-colors"
                >
                  <Trash2 size={15} />
                </button>
                <ChevronRight size={16} className="text-pencil/30" />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-pencil font-sans px-2 py-0.5 bg-sand/20 rounded-full">
                {shop.visits.length} 次造訪
              </span>
              {lastVisit && (
                <span className="text-xs text-pencil/65 font-fangsong">最近：{lastVisit.date}</span>
              )}
            </div>
          </div>
        );
      })}

      {/* ── Shop Detail Bottom Sheet ── */}
      {selectedShop && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center pointer-events-none">
          <div className="absolute inset-0 bg-ink/20 backdrop-blur-sm pointer-events-auto" onClick={closeSheet} />
          <div
            className="bg-[#FDFAF5] w-full max-w-md rounded-t-[2.5rem] shadow-2xl pointer-events-auto animate-fade-in relative flex flex-col"
            style={{ maxHeight: '88vh' }}
          >
            {/* Drag handle */}
            <div className="pt-5 pb-0 flex justify-center flex-shrink-0">
              <div className="w-12 h-1 bg-sand rounded-full opacity-50" />
            </div>

            {editingShopId === selectedShop.id ? (
              /* ── Edit Shop Mode ── */
              <>
                <div className="flex-shrink-0 px-6 pt-4 pb-3 flex justify-between items-center">
                  <h3 className="font-fangsong text-xl text-ink">編輯店家</h3>
                  <button onClick={() => setEditingShopId(null)} className="text-ink/40 hover:text-ink"><X size={20} /></button>
                </div>
                <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-3">
                  <input
                    type="text" placeholder="商店名稱 Shop Name"
                    className="w-full bg-white/70 border border-sand/50 rounded-xl px-4 py-2.5 text-ink focus:ring-1 focus:ring-clay"
                    value={editShopData.name || ''}
                    onChange={e => setEditShopData({ ...editShopData, name: e.target.value })}
                  />
                  <TypeSelector value={editShopData.type} onChange={v => setEditShopData({ ...editShopData, type: v })} />
                  <textarea
                    placeholder="聯絡方式 Contact（電話、地址...）"
                    className="w-full bg-white/70 border border-sand/50 rounded-xl px-4 py-2.5 text-ink focus:ring-1 focus:ring-clay min-h-[72px] whitespace-pre-wrap"
                    value={editShopData.contact || ''}
                    onChange={e => setEditShopData({ ...editShopData, contact: e.target.value })}
                  />
                  <textarea
                    placeholder="收費資訊 Pricing"
                    className="w-full bg-white/70 border border-sand/50 rounded-xl px-4 py-2.5 text-ink focus:ring-1 focus:ring-clay min-h-[72px] whitespace-pre-wrap"
                    value={editShopData.pricingInfo || ''}
                    onChange={e => setEditShopData({ ...editShopData, pricingInfo: e.target.value })}
                  />
                  <textarea
                    placeholder="備註 Notes"
                    className="w-full bg-white/70 border border-sand/50 rounded-xl px-4 py-2.5 text-ink focus:ring-1 focus:ring-clay min-h-[72px] whitespace-pre-wrap"
                    value={editShopData.notes || ''}
                    onChange={e => setEditShopData({ ...editShopData, notes: e.target.value })}
                  />
                </div>
                <div className="flex-shrink-0 px-6 pb-10 pt-3 border-t border-sand/20">
                  <button onClick={() => handleSaveShop(selectedShop.id)} className="w-full py-3.5 btn-warm">儲存</button>
                </div>
              </>
            ) : (
              /* ── Shop Detail + Visit History ── */
              <>
                {/* Shop info header */}
                <div className="flex-shrink-0 px-6 pt-4 pb-5 border-b border-sand/25">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-sand/30 text-clay font-sans inline-block mb-1.5">{selectedShop.type}</span>
                      <h3 className="font-fangsong text-2xl text-ink">{selectedShop.name}</h3>
                    </div>
                    <div className="flex gap-0.5 ml-3 flex-shrink-0">
                      <button
                        onClick={() => { setEditingShopId(selectedShop.id); setEditShopData(selectedShop); }}
                        className="p-2 text-ink/35 hover:text-clay transition-colors"
                      >
                        <Edit2 size={17} />
                      </button>
                      <button
                        onClick={() => handleDeleteShop(selectedShop.id)}
                        className="p-2 text-ink/35 hover:text-clay transition-colors"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>

                  {(selectedShop.contact || selectedShop.pricingInfo || selectedShop.notes) && (
                    <div className="mt-3 space-y-2 text-sm text-ink/80">
                      {selectedShop.contact && (
                        <div className="flex gap-2 items-start">
                          <MapPin size={14} className="text-clay/60 mt-0.5 shrink-0" />
                          <span className="whitespace-pre-wrap font-fangsong">{selectedShop.contact}</span>
                        </div>
                      )}
                      {selectedShop.pricingInfo && (
                        <div className="flex gap-2 items-start">
                          <DollarSign size={14} className="text-clay/60 mt-0.5 shrink-0" />
                          <span className="whitespace-pre-wrap font-fangsong">{selectedShop.pricingInfo}</span>
                        </div>
                      )}
                      {selectedShop.notes && (
                        <div className="mt-1 p-3 bg-sand/15 rounded-xl whitespace-pre-wrap text-xs font-fangsong text-ink/75">
                          {selectedShop.notes}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Visit history — scrollable */}
                <div className="flex-1 overflow-y-auto px-6 pb-4">
                  <div className="flex justify-between items-center py-4">
                    <h5 className="font-fangsong text-lg text-ink">
                      造訪紀錄
                      <span className="text-sm text-pencil/50 ml-2">({selectedShop.visits.length})</span>
                    </h5>
                    <button
                      onClick={() => { setAddingVisitTo(selectedShop.id); setNewVisit({ date: new Date().toISOString().split('T')[0] }); }}
                      className="flex items-center gap-1 text-sm text-clay hover:text-clay/80 transition-colors"
                    >
                      <Plus size={15} /> 新增造訪
                    </button>
                  </div>

                  {/* Add visit form */}
                  {addingVisitTo === selectedShop.id && (
                    <div className="bg-white/60 border border-sand/30 p-4 rounded-2xl mb-4 space-y-2.5 animate-fade-in">
                      <div className="flex gap-2">
                        <input
                          type="date"
                          className="flex-1 bg-white/80 border border-sand/50 rounded-xl px-3 py-2 text-sm text-ink focus:ring-1 focus:ring-clay"
                          value={newVisit.date || ''}
                          onChange={e => setNewVisit({ ...newVisit, date: e.target.value })}
                        />
                        <input
                          type="number" placeholder="花費"
                          className="w-24 bg-white/80 border border-sand/50 rounded-xl px-3 py-2 text-sm text-ink focus:ring-1 focus:ring-clay"
                          value={newVisit.cost || ''}
                          onChange={e => setNewVisit({ ...newVisit, cost: Number(e.target.value) })}
                        />
                      </div>
                      <input
                        type="text" placeholder="用途（如：全套美容、住宿 3 晚...）"
                        className="w-full bg-white/80 border border-sand/50 rounded-xl px-3 py-2 text-sm text-ink focus:ring-1 focus:ring-clay"
                        value={newVisit.purpose || ''}
                        onChange={e => setNewVisit({ ...newVisit, purpose: e.target.value })}
                      />
                      <textarea
                        placeholder="備註..."
                        className="w-full bg-white/80 border border-sand/50 rounded-xl px-3 py-2 text-sm text-ink focus:ring-1 focus:ring-clay min-h-[60px] whitespace-pre-wrap"
                        value={newVisit.notes || ''}
                        onChange={e => setNewVisit({ ...newVisit, notes: e.target.value })}
                      />
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-20 rounded-xl border border-dashed border-clay/40 flex items-center justify-center text-clay/60 hover:text-clay hover:border-clay transition-colors cursor-pointer overflow-hidden relative bg-white/40"
                      >
                        {newVisit.photoUrl
                          ? <img src={newVisit.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                          : <div className="flex items-center gap-2 text-xs"><Camera size={14} /> 新增照片</div>
                        }
                      </div>
                      <input type="file" ref={fileInputRef} onChange={e => handleImageUpload(e, false)} accept="image/*" className="hidden" />
                      <div className="flex justify-end gap-2 pt-1">
                        <button onClick={() => setAddingVisitTo(null)} className="px-3 py-1.5 text-xs text-ink/60 hover:text-ink">取消</button>
                        <button onClick={() => handleAddVisit(selectedShop.id)} className="px-4 py-1.5 text-xs bg-clay text-white rounded-lg hover:bg-clay/90">儲存</button>
                      </div>
                    </div>
                  )}

                  {/* Empty visits state */}
                  {selectedShop.visits.length === 0 && addingVisitTo !== selectedShop.id && (
                    <div
                      className="py-10 flex flex-col items-center gap-3 cursor-pointer group"
                      onClick={() => { setAddingVisitTo(selectedShop.id); setNewVisit({ date: new Date().toISOString().split('T')[0] }); }}
                    >
                      <div className="w-10 h-10 rounded-full bg-sand/20 flex items-center justify-center text-pencil group-hover:text-gold group-hover:scale-110 transition-all">
                        <Plus size={20} />
                      </div>
                      <p className="text-sm font-fangsong text-pencil">尚無造訪紀錄，點擊新增</p>
                    </div>
                  )}

                  {/* Visit cards */}
                  <div className="space-y-3">
                    {[...selectedShop.visits]
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map(visit => (
                        <div key={visit.id} className="bg-white/55 border border-sand/30 p-4 rounded-2xl relative">
                          {editingVisitId === visit.id ? (
                            <div className="space-y-2.5 animate-fade-in">
                              <div className="flex gap-2">
                                <input
                                  type="date"
                                  className="flex-1 bg-white/80 border border-sand/50 rounded-xl px-3 py-2 text-sm text-ink focus:ring-1 focus:ring-clay"
                                  value={editVisitData.date || ''}
                                  onChange={e => setEditVisitData({ ...editVisitData, date: e.target.value })}
                                />
                                <input
                                  type="number" placeholder="花費"
                                  className="w-24 bg-white/80 border border-sand/50 rounded-xl px-3 py-2 text-sm text-ink focus:ring-1 focus:ring-clay"
                                  value={editVisitData.cost || ''}
                                  onChange={e => setEditVisitData({ ...editVisitData, cost: Number(e.target.value) })}
                                />
                              </div>
                              <input
                                type="text" placeholder="用途"
                                className="w-full bg-white/80 border border-sand/50 rounded-xl px-3 py-2 text-sm text-ink focus:ring-1 focus:ring-clay"
                                value={editVisitData.purpose || ''}
                                onChange={e => setEditVisitData({ ...editVisitData, purpose: e.target.value })}
                              />
                              <textarea
                                placeholder="備註..."
                                className="w-full bg-white/80 border border-sand/50 rounded-xl px-3 py-2 text-sm text-ink focus:ring-1 focus:ring-clay min-h-[60px] whitespace-pre-wrap"
                                value={editVisitData.notes || ''}
                                onChange={e => setEditVisitData({ ...editVisitData, notes: e.target.value })}
                              />
                              <div
                                onClick={() => editFileInputRef.current?.click()}
                                className="w-full h-20 rounded-xl border border-dashed border-clay/40 flex items-center justify-center text-clay/60 hover:text-clay hover:border-clay transition-colors cursor-pointer overflow-hidden relative bg-white/40"
                              >
                                {editVisitData.photoUrl
                                  ? <img src={editVisitData.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                                  : <div className="flex items-center gap-2 text-xs"><Camera size={14} /> 新增照片</div>
                                }
                              </div>
                              <input type="file" ref={editFileInputRef} onChange={e => handleImageUpload(e, true)} accept="image/*" className="hidden" />
                              <div className="flex justify-end gap-2 pt-1">
                                <button onClick={() => setEditingVisitId(null)} className="p-1.5 text-ink/60 hover:text-ink"><X size={15} /></button>
                                <button onClick={() => handleSaveVisit(selectedShop.id, visit.id)} className="p-1.5 text-clay"><Save size={15} /></button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex justify-between items-start pr-14">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <Calendar size={13} className="text-clay/60" />
                                    <span className="text-sm font-medium text-ink font-fangsong">{visit.date}</span>
                                  </div>
                                  <div className="text-sm text-ink/85 font-fangsong">{visit.purpose}</div>
                                  {visit.notes && (
                                    <div className="text-xs text-ink/50 mt-1 whitespace-pre-wrap font-fangsong">{visit.notes}</div>
                                  )}
                                </div>
                                <span className="text-sm font-medium text-gold font-fangsong">${visit.cost}</span>
                              </div>
                              <div className="absolute top-3 right-3 flex gap-0.5">
                                <button onClick={() => { setEditingVisitId(visit.id); setEditVisitData(visit); }} className="p-1.5 text-ink/25 hover:text-clay transition-colors"><Edit2 size={14} /></button>
                                <button onClick={() => handleDeleteVisit(selectedShop.id, visit.id)} className="p-1.5 text-ink/25 hover:text-clay transition-colors"><Trash2 size={14} /></button>
                              </div>
                              {visit.photoUrl && (
                                <div className="w-full h-32 rounded-xl overflow-hidden border border-sand/30 mt-3">
                                  <img src={visit.photoUrl} alt="Visit" className="w-full h-full object-cover" />
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                  </div>
                  <div className="h-2" />
                </div>

                {/* Close */}
                <div className="flex-shrink-0 px-6 pb-10 pt-3 border-t border-sand/15">
                  <button
                    onClick={closeSheet}
                    className="w-full py-3 text-sm text-pencil hover:text-ink transition-colors font-sans tracking-[0.18em] uppercase"
                  >
                    關閉
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
