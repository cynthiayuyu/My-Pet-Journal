import React, { useState, useMemo } from 'react';
import { InventoryItem, PetProfile } from '../types';
import { generateId, formatDate } from '../utils';
import { Plus, Trash2, X, Package, Calculator, Utensils, Edit2, AlertTriangle } from 'lucide-react';

interface FoodSectionProps {
  items: InventoryItem[];
  setItems: (items: InventoryItem[]) => void;
  profile: PetProfile;
}

function estimateRemaining(item: InventoryItem): { remainingQty: number; daysLeft: number } | null {
  if (!item.purchaseDate || !item.dailyUsage || item.dailyUsage <= 0) return null;
  const daysElapsed = Math.max(0, (Date.now() - new Date(item.purchaseDate).getTime()) / 86400000);
  const remainingQty = Math.max(0, item.quantity - daysElapsed * item.dailyUsage);
  const daysLeft = Math.floor(remainingQty / item.dailyUsage);
  return { remainingQty, daysLeft };
}

export const FoodSection: React.FC<FoodSectionProps> = ({ items, setItems, profile }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({ type: 'Food', unit: 'g' });
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2000);
  };

  const handleOpenForm = (item?: InventoryItem) => {
    if (item) {
      setEditingItemId(item.id);
      setNewItem(item);
    } else {
      setEditingItemId(null);
      setNewItem({ type: 'Food', unit: 'g' });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.expiryDate || !newItem.quantity) return;
    const itemData: InventoryItem = {
      id: editingItemId || generateId(),
      name: newItem.name,
      type: (newItem.type as 'Food' | 'Supplement') || 'Food',
      expiryDate: newItem.expiryDate,
      quantity: Number(newItem.quantity),
      unit: newItem.unit || 'g',
      caloriesPerUnit: newItem.caloriesPerUnit ? Number(newItem.caloriesPerUnit) : undefined,
      ingredients: newItem.ingredients || undefined,
      purchaseLocation: newItem.purchaseLocation || undefined,
      purchaseDate: newItem.purchaseDate || undefined,
      dailyUsage: newItem.dailyUsage ? Number(newItem.dailyUsage) : undefined,
    };
    if (editingItemId) {
      setItems(items.map(i => i.id === editingItemId ? itemData : i));
    } else {
      setItems([...items, itemData]);
    }
    showToast(editingItemId ? '已更新 ✓' : '已新增 ✓');
    setIsFormOpen(false);
    setNewItem({ type: 'Food', unit: 'g' });
    setEditingItemId(null);
  };

  const calorieInfo = useMemo(() => {
    if (!profile.idealWeight) return null;
    const rer = 70 * Math.pow(profile.idealWeight, 0.75);
    let multiplier = 1.6;
    switch (profile.activityLevel) {
      case 'resting': multiplier = 1.2; break;
      case 'neutered_adult': multiplier = 1.6; break;
      case 'intact_adult': multiplier = 1.8; break;
      case 'active': multiplier = 2.0; break;
      case 'highly_active': multiplier = 3.0; break;
      case 'weight_loss': multiplier = 1.0; break;
      case 'weight_gain': multiplier = 1.8; break;
    }
    return { rer: Math.round(rer), mer: Math.round(rer * multiplier) };
  }, [profile.idealWeight, profile.activityLevel]);

  // Sort by expiry within each group
  const sorted = useMemo(() =>
    [...items].sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()),
    [items]
  );
  const foods = sorted.filter(i => i.type === 'Food');
  const supplements = sorted.filter(i => i.type === 'Supplement');

  const renderItem = (item: InventoryItem, isFirst: boolean) => {
    const isExpiringSoon = new Date(item.expiryDate).getTime() - Date.now() < 30 * 86400000;
    const est = estimateRemaining(item);
    const isLow = est !== null && est.daysLeft <= 7;
    const suggestedAmount = item.type === 'Food' && item.caloriesPerUnit && calorieInfo
      ? Math.round(calorieInfo.mer / item.caloriesPerUnit)
      : null;

    return (
      <div key={item.id} className="card-warm rounded-2xl p-4 relative group animate-fade-in">
        <div className="absolute top-3.5 right-3.5 flex gap-1.5">
          <button onClick={() => handleOpenForm(item)} className="text-sand hover:text-clay transition-colors p-1">
            <Edit2 size={15} />
          </button>
          <button onClick={() => { if (!window.confirm('確定要刪除嗎？')) return; setItems(items.filter(i => i.id !== item.id)); }} className="text-sand hover:text-clay transition-colors p-1">
            <Trash2 size={15} />
          </button>
        </div>

        <div className="flex gap-3 pr-14">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${item.type === 'Food' ? 'icon-clay' : 'bg-sage/15 text-sage'}`}>
            {item.type === 'Food' ? <Utensils size={16} /> : <Package size={16} />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              {isFirst && item.type === 'Food' && (
                <span className="text-[8px] font-bold uppercase tracking-widest bg-gold/20 text-gold px-2 py-0.5 rounded-full">Use First</span>
              )}
            </div>
            <div className="text-lg font-fangsong text-ink leading-snug">{item.name}</div>
            {item.purchaseLocation && (
              <div className="text-[10px] text-pencil/55 font-sans mt-0.5">{item.purchaseLocation}</div>
            )}

            <div className="mt-2.5 grid grid-cols-2 gap-2">
              <div className="bg-sand/10 px-2.5 py-1.5 rounded-lg">
                <div className="text-[9px] text-pencil font-sans uppercase tracking-widest mb-0.5">購買量</div>
                <div className="text-sm font-fangsong text-ink">{item.quantity} {item.unit}</div>
              </div>
              <div className={`px-2.5 py-1.5 rounded-lg ${isExpiringSoon ? 'bg-clay/10' : 'bg-sand/10'}`}>
                <div className={`text-[9px] font-sans uppercase tracking-widest mb-0.5 ${isExpiringSoon ? 'text-clay font-bold' : 'text-pencil'}`}>效期</div>
                <div className={`text-sm font-fangsong font-medium ${isExpiringSoon ? 'text-clay' : 'text-ink'}`}>
                  {formatDate(item.expiryDate)}
                </div>
              </div>
            </div>

            {/* Auto-estimate remaining */}
            {est !== null && (
              <div className={`mt-2 px-2.5 py-2 rounded-lg flex items-center justify-between ${isLow ? 'bg-clay/8 border border-clay/20' : 'bg-sage/8'}`}>
                <div>
                  <div className={`text-[9px] font-sans uppercase tracking-widest ${isLow ? 'text-clay' : 'text-sage'}`}>預估剩餘</div>
                  <div className={`text-sm font-fangsong font-medium mt-0.5 ${isLow ? 'text-clay' : 'text-ink'}`}>
                    {est.remainingQty.toFixed(0)} {item.unit}
                    <span className="text-xs ml-1 font-sans text-pencil/60">· 約 {est.daysLeft} 天</span>
                  </div>
                </div>
                {isLow && <AlertTriangle size={15} className="text-clay flex-shrink-0" />}
              </div>
            )}

            {/* Daily amount from calorie calc */}
            {suggestedAmount && !est && (
              <div className="mt-2 bg-clay/5 border border-clay/15 px-2.5 py-1.5 rounded-lg flex items-center justify-between">
                <span className="text-[9px] text-clay font-sans uppercase tracking-widest">建議每日用量</span>
                <span className="text-sm font-fangsong text-ink font-medium">{suggestedAmount} {item.unit}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {toastMsg && (
        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[150] bg-ink/80 text-white text-sm px-5 py-2.5 rounded-full shadow-lg font-sans pointer-events-none animate-fade-in"
          style={{ whiteSpace: 'nowrap' }}
        >
          {toastMsg}
        </div>
      )}

      {/* Calorie Calculator */}
      <div className="card-warm rounded-[2rem] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-clay/10 flex items-center justify-center text-clay">
            <Calculator size={16} />
          </div>
          <h3 className="text-xs font-bold tracking-[0.2em] text-gold uppercase font-sans opacity-80">Calorie Needs</h3>
        </div>
        {calorieInfo ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-sand/10 rounded-xl p-4 text-center">
              <div className="text-[10px] font-bold uppercase tracking-widest text-pencil font-sans mb-1">RER</div>
              <div className="text-2xl font-fangsong text-ink">{calorieInfo.rer} <span className="text-xs text-pencil font-sans">kcal/day</span></div>
            </div>
            <div className="bg-clay/5 rounded-xl p-4 text-center border border-clay/20">
              <div className="text-[10px] font-bold uppercase tracking-widest text-clay font-sans mb-1">MER</div>
              <div className="text-2xl font-fangsong text-ink">{calorieInfo.mer} <span className="text-xs text-pencil font-sans">kcal/day</span></div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-pencil font-fangsong text-center py-4">在資料頁設定理想體重與活動等級即可計算。</p>
        )}
      </div>

      {/* Header */}
      <div className="flex justify-between items-end px-1">
        <div>
          <span className="text-xs font-bold tracking-[0.2em] text-pencil uppercase font-sans">Inventory</span>
          <h4 className="text-2xl font-fangsong text-ink mt-0.5">庫存管理</h4>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="w-10 h-10 rounded-full bg-white border border-sand flex items-center justify-center text-ink shadow-sm hover:bg-sand/20 transition-colors"
        >
          <Plus size={18} />
        </button>
      </div>

      {items.length === 0 && !isFormOpen && (
        <div
          className="bg-white/50 border border-dashed border-sand rounded-3xl p-8 flex flex-col items-center justify-center text-center gap-4 group hover:border-gold/50 hover:bg-white/80 transition-all cursor-pointer"
          onClick={() => handleOpenForm()}
        >
          <div className="w-12 h-12 rounded-full bg-sand/20 flex items-center justify-center text-pencil group-hover:text-gold group-hover:scale-110 transition-all duration-500">
            <Package size={24} />
          </div>
          <p className="text-sm font-fangsong text-pencil">庫存空空如也，點擊新增</p>
        </div>
      )}

      {/* Food group */}
      {foods.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Utensils size={12} className="text-clay" />
            <span className="text-[10px] font-bold tracking-[0.2em] text-clay uppercase font-sans">飼料 · 食物</span>
            <span className="text-[10px] text-pencil/40 font-sans">{foods.length} 項</span>
          </div>
          {foods.map((item, i) => renderItem(item, i === 0))}
        </div>
      )}

      {/* Supplement group */}
      {supplements.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Package size={12} className="text-sage" />
            <span className="text-[10px] font-bold tracking-[0.2em] text-sage uppercase font-sans">補充品</span>
            <span className="text-[10px] text-pencil/40 font-sans">{supplements.length} 項</span>
          </div>
          {supplements.map(item => renderItem(item, false))}
        </div>
      )}

      {/* Form */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center pointer-events-none">
          <div className="absolute inset-0 bg-ink/20 backdrop-blur-sm pointer-events-auto" onClick={() => setIsFormOpen(false)} />
          <form
            onSubmit={handleSubmit}
            className="bg-[#FDFAF5] w-full max-w-md rounded-t-[2.5rem] shadow-2xl pointer-events-auto animate-fade-in relative flex flex-col"
            style={{ maxHeight: '90vh' }}
          >
            <div className="flex-shrink-0 px-8 pt-6 pb-4">
              <div className="w-12 h-1 bg-sand rounded-full mx-auto mb-5 opacity-50" />
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-fangsong text-2xl text-ink">{editingItemId ? '編輯品項' : '新增庫存'}</h3>
                <button type="button" onClick={() => setIsFormOpen(false)} className="w-8 h-8 rounded-full bg-sand/30 flex items-center justify-center text-ink hover:bg-sand transition-colors">
                  <X size={16} />
                </button>
              </div>
              <div className="flex bg-sand/20 p-1 rounded-xl">
                {(['Food', 'Supplement'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setNewItem(prev => ({ ...prev, type: t }))}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-300 font-fangsong ${newItem.type === t ? 'bg-white text-ink shadow-sm' : 'text-pencil'}`}
                  >
                    {t === 'Food' ? 'Food 飼料' : 'Supplement 補充品'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-8 pb-4 space-y-6" style={{ overscrollBehavior: 'contain' }}>
              <div>
                <label className="text-[10px] text-pencil font-bold tracking-widest uppercase mb-1 block font-sans">品名</label>
                <input
                  type="text" required
                  placeholder="e.g. 皇家 Royal Canin"
                  value={newItem.name || ''}
                  onChange={e => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full py-2 bg-transparent border-b border-sand focus:border-gold text-ink font-fangsong text-xl rounded-none placeholder-sand/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-pencil font-bold tracking-widest uppercase mb-1 block font-sans">購入來源</label>
                <input
                  type="text"
                  placeholder="e.g. 寵物店、網路商城..."
                  value={newItem.purchaseLocation || ''}
                  onChange={e => setNewItem(prev => ({ ...prev, purchaseLocation: e.target.value }))}
                  className="w-full py-2 bg-transparent border-b border-sand focus:border-gold text-ink font-fangsong text-lg rounded-none placeholder-sand/50 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] text-pencil font-bold tracking-widest uppercase mb-1 block font-sans">購買數量</label>
                  <input
                    type="number" step="0.1" required
                    placeholder="0"
                    value={newItem.quantity || ''}
                    onChange={e => setNewItem(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                    className="w-full py-2 bg-transparent border-b border-sand focus:border-gold text-ink font-fangsong text-lg rounded-none focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-pencil font-bold tracking-widest uppercase mb-1 block font-sans">單位</label>
                  <input
                    type="text" required
                    placeholder="g, kg, 顆..."
                    value={newItem.unit || ''}
                    onChange={e => setNewItem(prev => ({ ...prev, unit: e.target.value }))}
                    className="w-full py-2 bg-transparent border-b border-sand focus:border-gold text-ink font-fangsong text-lg rounded-none focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] text-pencil font-bold tracking-widest uppercase mb-1 block font-sans">購買日期</label>
                  <input
                    type="date"
                    value={newItem.purchaseDate || ''}
                    onChange={e => setNewItem(prev => ({ ...prev, purchaseDate: e.target.value }))}
                    className="w-full py-2 bg-transparent border-b border-sand focus:border-gold text-ink font-fangsong text-lg rounded-none focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-pencil font-bold tracking-widest uppercase mb-1 block font-sans">效期</label>
                  <input
                    type="date" required
                    value={newItem.expiryDate || ''}
                    onChange={e => setNewItem(prev => ({ ...prev, expiryDate: e.target.value }))}
                    className="w-full py-2 bg-transparent border-b border-sand focus:border-gold text-ink font-fangsong text-lg rounded-none focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] text-pencil font-bold tracking-widest uppercase mb-1 block font-sans">
                    每日用量 ({newItem.unit || 'g'})
                  </label>
                  <input
                    type="number" step="0.1"
                    placeholder="自動估算剩餘量"
                    value={newItem.dailyUsage || ''}
                    onChange={e => setNewItem(prev => ({ ...prev, dailyUsage: e.target.value ? Number(e.target.value) : undefined }))}
                    className="w-full py-2 bg-transparent border-b border-sand focus:border-gold text-ink font-fangsong text-lg rounded-none placeholder-sand/40 focus:outline-none"
                  />
                </div>
                {newItem.type === 'Food' && (
                  <div>
                    <label className="text-[10px] text-pencil font-bold tracking-widest uppercase mb-1 block font-sans">Kcal / 單位</label>
                    <input
                      type="number" step="0.01"
                      placeholder="e.g. 3.5"
                      value={newItem.caloriesPerUnit || ''}
                      onChange={e => setNewItem(prev => ({ ...prev, caloriesPerUnit: e.target.value ? Number(e.target.value) : undefined }))}
                      className="w-full py-2 bg-transparent border-b border-sand focus:border-gold text-ink font-fangsong text-lg rounded-none placeholder-sand/50 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] text-pencil font-bold tracking-widest uppercase mb-1 block font-sans">成分 / 備註</label>
                <textarea
                  rows={2}
                  placeholder="主要成分或備註..."
                  value={newItem.ingredients || ''}
                  onChange={e => setNewItem(prev => ({ ...prev, ingredients: e.target.value }))}
                  className="w-full py-2 bg-transparent border-b border-sand focus:border-gold text-ink font-fangsong text-lg rounded-none placeholder-sand/50 resize-none focus:outline-none"
                />
              </div>
            </div>

            <div className="flex-shrink-0 px-8 pt-4 border-t border-sand/20" style={{ paddingBottom: 'max(0.75rem, calc(0.5rem + env(safe-area-inset-bottom)))' }}>
              <button type="submit" className="w-full py-3.5 btn-warm">
                {editingItemId ? '更新' : '儲存'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
