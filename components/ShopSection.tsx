import React, { useState, useRef, useMemo } from 'react';
import { PetShop, ShopVisit } from '../types';
import { Plus, Trash2, MapPin, DollarSign, Calendar, Edit2, Save, X, Search, Camera, Settings } from 'lucide-react';

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
      // Also update all shops that use this category
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
          setEditVisitData({ ...editVisitData, photoUrl: reader.result as string });
        } else {
          setNewVisit({ ...newVisit, photoUrl: reader.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddShop = () => {
    if (!newShop.name) return;
    const shop: PetShop = {
      id: Date.now().toString(),
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
    setShops(shops.filter(s => s.id !== id));
  };

  const handleAddVisit = (shopId: string) => {
    if (!newVisit.date || !newVisit.purpose) return;
    const visit: ShopVisit = {
      id: Date.now().toString(),
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
      if (s.id === shopId) {
        return {
          ...s,
          visits: s.visits.map(v => v.id === visitId ? { ...v, ...editVisitData, cost: Number(editVisitData.cost) || 0 } : v)
        };
      }
      return s;
    }));
    setEditingVisitId(null);
  };

  const handleDeleteVisit = (shopId: string, visitId: string) => {
    setShops(shops.map(s => s.id === shopId ? { ...s, visits: s.visits.filter(v => v.id !== visitId) } : s));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-fangsong text-ink">愛店與地點</h3>
        <div className="flex gap-4">
          <button 
            onClick={() => setIsManagingCategories(true)}
            className="flex items-center gap-1 text-sm text-pencil hover:text-clay transition-colors"
          >
            <Settings size={16} /> Categories
          </button>
          <button 
            onClick={() => setIsAddingShop(true)}
            className="flex items-center gap-1 text-sm text-clay hover:text-clay/80 transition-colors"
          >
            <Plus size={16} /> Add Shop
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-pencil">
          <Search size={18} />
        </div>
        <input
          type="text"
          placeholder="Search shops..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white/80 backdrop-blur-md border border-white rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-gold/50 text-ink font-fangsong transition-all"
        />
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm('')}
            className="absolute inset-y-0 right-4 flex items-center text-pencil hover:text-ink"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {isManagingCategories && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none p-4">
          <div className="absolute inset-0 bg-ink/20 backdrop-blur-sm pointer-events-auto" onClick={() => setIsManagingCategories(false)} />
          <div className="bg-[#FDFCF8] w-full max-w-sm rounded-3xl p-6 shadow-2xl pointer-events-auto animate-fade-in relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-fangsong text-xl text-ink">Manage Categories</h3>
              <button onClick={() => setIsManagingCategories(false)} className="text-ink/40 hover:text-ink"><X size={20}/></button>
            </div>
            
            <div className="space-y-3 mb-6 max-h-[40vh] overflow-y-auto pr-2">
              {shopCategories.map(category => (
                <div key={category} className="flex justify-between items-center bg-white p-3 rounded-xl border border-sand/30">
                  {editingCategory === category ? (
                    <input 
                      type="text"
                      value={editCategoryValue}
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
                      <button 
                        onClick={() => handleSaveEditCategory(category)}
                        className="text-clay hover:text-clay/80 transition-colors"
                      >
                        <Save size={16} />
                      </button>
                    ) : (
                      <button 
                        onClick={() => {
                          setEditingCategory(category);
                          setEditCategoryValue(category);
                        }}
                        className="text-sand hover:text-clay transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                    )}
                    <button 
                      onClick={() => handleDeleteCategory(category)}
                      className="text-sand hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="New Category..."
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                className="flex-1 bg-white border border-sand rounded-xl px-4 py-2 text-ink focus:ring-1 focus:ring-clay outline-none font-fangsong"
              />
              <button 
                onClick={handleAddCategory}
                className="bg-clay text-white px-4 py-2 rounded-xl hover:bg-clay/90 transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddingShop && (
        <div className="glass p-4 rounded-2xl animate-fade-in border border-clay/20">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Shop Name"
              className="w-full bg-white/50 border-none rounded-xl px-4 py-2 text-ink focus:ring-1 focus:ring-clay"
              value={newShop.name || ''}
              onChange={e => setNewShop({...newShop, name: e.target.value})}
            />
            <select
              className="w-full bg-white/50 border-none rounded-xl px-4 py-2 text-ink focus:ring-1 focus:ring-clay appearance-none"
              value={uniqueShopTypes.includes(newShop.type || '') ? newShop.type : (newShop.type ? 'other' : '')}
              onChange={e => {
                if (e.target.value === 'other') {
                  setNewShop({...newShop, type: ' '});
                } else {
                  setNewShop({...newShop, type: e.target.value});
                }
              }}
            >
              <option value="">Select Type...</option>
              {uniqueShopTypes.map(t => <option key={t} value={t}>{t}</option>)}
              <option value="other">+ Add New...</option>
            </select>
            {(!uniqueShopTypes.includes(newShop.type || '') && newShop.type !== '') && (
              <input 
                type="text"
                placeholder="Type new category..."
                value={newShop.type?.trim() || ''}
                onChange={e => setNewShop({...newShop, type: e.target.value})}
                className="w-full bg-white/50 border-none rounded-xl px-4 py-2 text-ink focus:ring-1 focus:ring-clay animate-fade-in"
                autoFocus
              />
            )}
            <textarea
              placeholder="Contact Info (Phone, Address...)"
              className="w-full bg-white/50 border-none rounded-xl px-4 py-2 text-ink focus:ring-1 focus:ring-clay min-h-[80px] whitespace-pre-wrap"
              value={newShop.contact || ''}
              onChange={e => setNewShop({...newShop, contact: e.target.value})}
            />
            <textarea
              placeholder="Pricing Info"
              className="w-full bg-white/50 border-none rounded-xl px-4 py-2 text-ink focus:ring-1 focus:ring-clay min-h-[80px] whitespace-pre-wrap"
              value={newShop.pricingInfo || ''}
              onChange={e => setNewShop({...newShop, pricingInfo: e.target.value})}
            />
            <textarea
              placeholder="Other Notes"
              className="w-full bg-white/50 border-none rounded-xl px-4 py-2 text-ink focus:ring-1 focus:ring-clay min-h-[80px] whitespace-pre-wrap"
              value={newShop.notes || ''}
              onChange={e => setNewShop({...newShop, notes: e.target.value})}
            />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setIsAddingShop(false)} className="px-4 py-2 text-sm text-ink/60 hover:text-ink">Cancel</button>
              <button onClick={handleAddShop} className="px-4 py-2 text-sm bg-clay text-white rounded-xl hover:bg-clay/90">Save Shop</button>
            </div>
          </div>
        </div>
      )}

      {filteredShops.length === 0 && searchTerm && (
        <div className="text-center py-8 bg-white/50 rounded-3xl border border-dashed border-sand">
          <p className="text-sm font-fangsong text-pencil">No matching shops found.</p>
        </div>
      )}

      {filteredShops.map(shop => (
        <div key={shop.id} className="glass p-5 rounded-3xl space-y-4">
          {editingShopId === shop.id ? (
            <div className="space-y-3 animate-fade-in">
              <input
                type="text"
                placeholder="Shop Name"
                className="w-full bg-white/50 border-none rounded-xl px-4 py-2 text-ink focus:ring-1 focus:ring-clay"
                value={editShopData.name || ''}
                onChange={e => setEditShopData({...editShopData, name: e.target.value})}
              />
              <select
                className="w-full bg-white/50 border-none rounded-xl px-4 py-2 text-ink focus:ring-1 focus:ring-clay appearance-none"
                value={uniqueShopTypes.includes(editShopData.type || '') ? editShopData.type : (editShopData.type ? 'other' : '')}
                onChange={e => {
                  if (e.target.value === 'other') {
                    setEditShopData({...editShopData, type: ' '});
                  } else {
                    setEditShopData({...editShopData, type: e.target.value});
                  }
                }}
              >
                <option value="">Select Type...</option>
                {uniqueShopTypes.map(t => <option key={t} value={t}>{t}</option>)}
                <option value="other">+ Add New...</option>
              </select>
              {(!uniqueShopTypes.includes(editShopData.type || '') && editShopData.type !== '') && (
                <input 
                  type="text"
                  placeholder="Type new category..."
                  value={editShopData.type?.trim() || ''}
                  onChange={e => setEditShopData({...editShopData, type: e.target.value})}
                  className="w-full bg-white/50 border-none rounded-xl px-4 py-2 text-ink focus:ring-1 focus:ring-clay animate-fade-in"
                  autoFocus
                />
              )}
              <textarea
                placeholder="Contact Info"
                className="w-full bg-white/50 border-none rounded-xl px-4 py-2 text-ink focus:ring-1 focus:ring-clay min-h-[80px] whitespace-pre-wrap"
                value={editShopData.contact || ''}
                onChange={e => setEditShopData({...editShopData, contact: e.target.value})}
              />
              <textarea
                placeholder="Pricing Info"
                className="w-full bg-white/50 border-none rounded-xl px-4 py-2 text-ink focus:ring-1 focus:ring-clay min-h-[80px] whitespace-pre-wrap"
                value={editShopData.pricingInfo || ''}
                onChange={e => setEditShopData({...editShopData, pricingInfo: e.target.value})}
              />
              <textarea
                placeholder="Notes"
                className="w-full bg-white/50 border-none rounded-xl px-4 py-2 text-ink focus:ring-1 focus:ring-clay min-h-[80px] whitespace-pre-wrap"
                value={editShopData.notes || ''}
                onChange={e => setEditShopData({...editShopData, notes: e.target.value})}
              />
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setEditingShopId(null)} className="p-2 text-ink/60 hover:text-ink"><X size={18} /></button>
                <button onClick={() => handleSaveShop(shop.id)} className="p-2 text-clay hover:text-clay/80"><Save size={18} /></button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-fangsong text-xl text-ink">{shop.name}</h4>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-sand/30 text-clay mt-1 inline-block">{shop.type}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingShopId(shop.id); setEditShopData(shop); }} className="text-ink/40 hover:text-clay"><Edit2 size={16} /></button>
                  <button onClick={() => handleDeleteShop(shop.id)} className="text-ink/40 hover:text-red-400"><Trash2 size={16} /></button>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-ink/80">
                {shop.contact && (
                  <div className="flex gap-2 items-start">
                    <MapPin size={16} className="text-clay/60 mt-0.5 shrink-0" />
                    <span className="whitespace-pre-wrap">{shop.contact}</span>
                  </div>
                )}
                {shop.pricingInfo && (
                  <div className="flex gap-2 items-start">
                    <DollarSign size={16} className="text-clay/60 mt-0.5 shrink-0" />
                    <span className="whitespace-pre-wrap">{shop.pricingInfo}</span>
                  </div>
                )}
                {shop.notes && (
                  <div className="mt-2 p-3 bg-white/30 rounded-xl whitespace-pre-wrap text-xs">
                    {shop.notes}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Visits Section */}
          <div className="pt-4 border-t border-sand/30">
            <div className="flex justify-between items-center mb-3">
              <h5 className="text-sm font-medium text-ink/80">Visit History ({shop.visits.length})</h5>
              <button 
                onClick={() => setAddingVisitTo(shop.id)}
                className="text-xs text-clay hover:text-clay/80 flex items-center gap-1"
              >
                <Plus size={14} /> Add Visit
              </button>
            </div>

            {addingVisitTo === shop.id && (
              <div className="bg-white/40 p-3 rounded-xl mb-3 space-y-2 animate-fade-in">
                <div className="flex gap-2">
                  <input
                    type="date"
                    className="flex-1 bg-white/60 border-none rounded-lg px-3 py-1.5 text-sm text-ink focus:ring-1 focus:ring-clay"
                    value={newVisit.date || ''}
                    onChange={e => setNewVisit({...newVisit, date: e.target.value})}
                  />
                  <input
                    type="number"
                    placeholder="花費 Cost"
                    className="w-24 bg-white/60 border-none rounded-lg px-3 py-1.5 text-sm text-ink focus:ring-1 focus:ring-clay"
                    value={newVisit.cost || ''}
                    onChange={e => setNewVisit({...newVisit, cost: Number(e.target.value)})}
                  />
                </div>
                <input
                  type="text"
                  placeholder="Purpose (e.g., Full Grooming, 3-night stay)"
                  className="w-full bg-white/60 border-none rounded-lg px-3 py-1.5 text-sm text-ink focus:ring-1 focus:ring-clay"
                  value={newVisit.purpose || ''}
                  onChange={e => setNewVisit({...newVisit, purpose: e.target.value})}
                />
                <textarea
                  placeholder="Notes"
                  className="w-full bg-white/60 border-none rounded-lg px-3 py-1.5 text-sm text-ink focus:ring-1 focus:ring-clay min-h-[60px] whitespace-pre-wrap"
                  value={newVisit.notes || ''}
                  onChange={e => setNewVisit({...newVisit, notes: e.target.value})}
                />
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-20 rounded-lg border border-dashed border-clay/40 flex flex-col items-center justify-center text-clay/60 hover:text-clay hover:border-clay transition-colors cursor-pointer overflow-hidden relative bg-white/30"
                >
                  {newVisit.photoUrl ? (
                    <img src={newVisit.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center gap-2 text-xs"><Camera size={14} /> Add Photo</div>
                  )}
                </div>
                <input type="file" ref={fileInputRef} onChange={(e) => handleImageUpload(e, false)} accept="image/*" className="hidden" />
                
                <div className="flex justify-end gap-2">
                  <button onClick={() => setAddingVisitTo(null)} className="px-3 py-1 text-xs text-ink/60 hover:text-ink">Cancel</button>
                  <button onClick={() => handleAddVisit(shop.id)} className="px-3 py-1 text-xs bg-clay text-white rounded-lg hover:bg-clay/90">Save</button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {shop.visits.map(visit => (
                <div key={visit.id} className="bg-white/40 p-3 rounded-xl relative group">
                  {editingVisitId === visit.id ? (
                    <div className="space-y-2 animate-fade-in">
                      <div className="flex gap-2">
                        <input
                          type="date"
                          className="flex-1 bg-white/60 border-none rounded-lg px-3 py-1.5 text-sm text-ink focus:ring-1 focus:ring-clay"
                          value={editVisitData.date || ''}
                          onChange={e => setEditVisitData({...editVisitData, date: e.target.value})}
                        />
                        <input
                          type="number"
                          placeholder="花費 Cost"
                          className="w-24 bg-white/60 border-none rounded-lg px-3 py-1.5 text-sm text-ink focus:ring-1 focus:ring-clay"
                          value={editVisitData.cost || ''}
                          onChange={e => setEditVisitData({...editVisitData, cost: Number(e.target.value)})}
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Purpose"
                        className="w-full bg-white/60 border-none rounded-lg px-3 py-1.5 text-sm text-ink focus:ring-1 focus:ring-clay"
                        value={editVisitData.purpose || ''}
                        onChange={e => setEditVisitData({...editVisitData, purpose: e.target.value})}
                      />
                      <textarea
                        placeholder="Notes"
                        className="w-full bg-white/60 border-none rounded-lg px-3 py-1.5 text-sm text-ink focus:ring-1 focus:ring-clay min-h-[60px] whitespace-pre-wrap"
                        value={editVisitData.notes || ''}
                        onChange={e => setEditVisitData({...editVisitData, notes: e.target.value})}
                      />
                      <div 
                        onClick={() => editFileInputRef.current?.click()}
                        className="w-full h-20 rounded-lg border border-dashed border-clay/40 flex flex-col items-center justify-center text-clay/60 hover:text-clay hover:border-clay transition-colors cursor-pointer overflow-hidden relative bg-white/30"
                      >
                        {editVisitData.photoUrl ? (
                          <img src={editVisitData.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex items-center gap-2 text-xs"><Camera size={14} /> Add Photo</div>
                        )}
                      </div>
                      <input type="file" ref={editFileInputRef} onChange={(e) => handleImageUpload(e, true)} accept="image/*" className="hidden" />
                      
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingVisitId(null)} className="p-1 text-ink/60 hover:text-ink"><X size={14} /></button>
                        <button onClick={() => handleSaveVisit(shop.id, visit.id)} className="p-1 text-clay hover:text-clay/80"><Save size={14} /></button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-start mb-1 pr-12">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-clay/60" />
                          <span className="text-sm font-medium text-ink">{visit.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gold">${visit.cost}</span>
                        </div>
                      </div>
                      <div className="absolute top-3 right-3 flex gap-1">
                          <button onClick={() => { setEditingVisitId(visit.id); setEditVisitData(visit); }} className="text-ink/40 hover:text-clay p-1"><Edit2 size={14} /></button>
                          <button onClick={() => handleDeleteVisit(shop.id, visit.id)} className="text-ink/40 hover:text-red-400 p-1"><Trash2 size={14} /></button>
                      </div>
                      <div className="text-sm text-ink/80 pr-12">{visit.purpose}</div>
                      {visit.notes && <div className="text-xs text-ink/60 mt-1 whitespace-pre-wrap pr-12">{visit.notes}</div>}
                      {visit.photoUrl && (
                        <div className="w-full h-32 rounded-lg overflow-hidden border border-sand/30 mt-3">
                          <img src={visit.photoUrl} alt="Visit attachment" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
