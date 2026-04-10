import React, { useState, useMemo } from 'react';
import { InventoryItem, PetProfile } from '../types';
import { generateId, formatDate } from '../utils';
import { Plus, Trash2, X, Package, AlertCircle, Calculator, Utensils, Edit2 } from 'lucide-react';

interface FoodSectionProps {
  items: InventoryItem[];
  setItems: (items: InventoryItem[]) => void;
  profile: PetProfile;
}

export const FoodSection: React.FC<FoodSectionProps> = ({ items, setItems, profile }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({ type: 'Food', unit: 'g' });

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
    if (newItem.name && newItem.expiryDate && newItem.quantity) {
      const itemData = {
        id: editingItemId || generateId(),
        name: newItem.name,
        type: newItem.type as 'Food' | 'Supplement',
        expiryDate: newItem.expiryDate,
        quantity: Number(newItem.quantity),
        unit: newItem.unit || 'g',
        caloriesPerUnit: newItem.caloriesPerUnit ? Number(newItem.caloriesPerUnit) : undefined,
        ingredients: newItem.ingredients || '',
      };

      if (editingItemId) {
        setItems(items.map(i => i.id === editingItemId ? itemData : i));
      } else {
        setItems([...items, itemData]);
      }
      
      setIsFormOpen(false);
      setNewItem({ type: 'Food', unit: 'g' });
      setEditingItemId(null);
    }
  };

  const deleteItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  // Sort items by expiry date (earliest first) to suggest usage order
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
  }, [items]);

  // Calorie Calculator (RER / MER)
  const calorieInfo = useMemo(() => {
    if (!profile.idealWeight) return null;
    
    // RER = 70 * (weight in kg)^0.75
    const rer = 70 * Math.pow(profile.idealWeight, 0.75);
    
    // MER Multipliers (approximate for dogs/cats)
    let multiplier = 1.6; // default neutered adult
    switch(profile.activityLevel) {
      case 'resting': multiplier = 1.2; break;
      case 'neutered_adult': multiplier = 1.6; break;
      case 'intact_adult': multiplier = 1.8; break;
      case 'active': multiplier = 2.0; break;
      case 'highly_active': multiplier = 3.0; break;
      case 'weight_loss': multiplier = 1.0; break;
      case 'weight_gain': multiplier = 1.8; break;
    }
    
    const mer = rer * multiplier;
    return { rer: Math.round(rer), mer: Math.round(mer) };
  }, [profile.idealWeight, profile.activityLevel]);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Calorie Calculator Card */}
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
          <p className="text-sm text-pencil font-fangsong text-center py-4">Please set Ideal Weight and Activity Level in Profile to calculate calories.</p>
        )}
      </div>

      {/* Inventory List */}
      <div className="flex justify-between items-end px-2">
         <div>
           <span className="text-xs font-bold tracking-[0.2em] text-pencil uppercase font-sans">Inventory</span>
           <h4 className="text-2xl font-fangsong text-ink mt-1">庫存管理</h4>
         </div>
         <button 
            onClick={() => handleOpenForm()}
            className="w-10 h-10 rounded-full bg-white border border-sand flex items-center justify-center text-ink shadow-sm hover:bg-sand/20 transition-colors"
         >
            <Plus size={18} />
         </button>
      </div>

      {sortedItems.length === 0 && !isFormOpen && (
         <div className="bg-white/50 border border-dashed border-sand rounded-3xl p-8 flex flex-col items-center justify-center text-center gap-4 group hover:border-gold/50 hover:bg-white/80 transition-all cursor-pointer" onClick={() => handleOpenForm()}>
           <div className="w-12 h-12 rounded-full bg-sand/20 flex items-center justify-center text-pencil group-hover:text-gold group-hover:scale-110 transition-all duration-500">
             <Package size={24} />
           </div>
           <p className="text-sm font-fangsong text-pencil">Pantry is empty. Add food or supplements.</p>
        </div>
      )}

      <div className="space-y-4">
        {sortedItems.map((item, index) => {
          const isExpiringSoon = new Date(item.expiryDate).getTime() - new Date().getTime() < 30 * 24 * 60 * 60 * 1000;
          const isFirstFood = index === sortedItems.findIndex(i => i.type === 'Food');
          
          let suggestedAmount = null;
          if (item.type === 'Food' && item.caloriesPerUnit && calorieInfo) {
            suggestedAmount = Math.round(calorieInfo.mer / item.caloriesPerUnit);
          }

          return (
            <div key={item.id} className="card-warm rounded-2xl p-5 relative group animate-fade-in">
                <div className="absolute top-4 right-4 flex gap-2">
                  <button 
                    onClick={() => handleOpenForm(item)}
                    className="text-sand hover:text-clay transition-colors p-1"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => deleteItem(item.id)}
                    className="text-sand hover:text-clay transition-colors p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="flex gap-4 pr-16">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        item.type === 'Food' ? 'icon-clay' : 'bg-sage/20 text-sage'
                    }`}>
                        {item.type === 'Food' ? <Utensils size={18} /> : <Package size={18} />}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-pencil font-sans">{item.type}</span>
                          {isFirstFood && item.type === 'Food' && (
                            <span className="text-[8px] font-bold uppercase tracking-widest bg-gold/20 text-gold px-2 py-0.5 rounded-full">Use First</span>
                          )}
                        </div>
                        <div className="text-xl font-fangsong text-ink">{item.name}</div>
                        
                        <div className="mt-3 grid grid-cols-2 gap-2">
                            <div className="bg-sand/10 px-3 py-2 rounded-lg">
                                <div className="text-[10px] text-pencil font-sans uppercase tracking-widest mb-0.5">Remaining</div>
                                <div className="text-sm font-fangsong text-ink font-medium">{item.quantity} {item.unit}</div>
                            </div>
                            <div className={`px-3 py-2 rounded-lg ${isExpiringSoon ? 'bg-clay/10' : 'bg-sand/10'}`}>
                                <div className={`text-[10px] font-sans uppercase tracking-widest mb-0.5 ${isExpiringSoon ? 'text-clay font-bold' : 'text-pencil'}`}>Expires</div>
                                <div className={`text-sm font-fangsong font-medium ${isExpiringSoon ? 'text-clay' : 'text-ink'}`}>
                                  {formatDate(item.expiryDate)}
                                </div>
                            </div>
                        </div>

                        {suggestedAmount && (
                          <div className="mt-3 bg-clay/5 border border-clay/20 px-3 py-2 rounded-lg flex items-center justify-between">
                            <span className="text-xs text-clay font-sans font-medium">Daily Amount</span>
                            <span className="text-sm font-fangsong text-ink font-bold">{suggestedAmount} {item.unit}</span>
                          </div>
                        )}
                    </div>
                </div>
            </div>
          );
        })}
      </div>

       {/* Slide Up Form */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center pointer-events-none">
          <div className="absolute inset-0 bg-ink/20 backdrop-blur-sm pointer-events-auto" onClick={() => setIsFormOpen(false)} />
          <form onSubmit={handleSubmit} className="bg-[#FEFCF8] w-full max-w-md rounded-t-[2.5rem] p-8 shadow-2xl pointer-events-auto animate-fade-in relative max-h-[90vh] overflow-y-auto">
             <div className="w-12 h-1 bg-sand rounded-full mx-auto mb-8 opacity-50" />
             
             <div className="flex justify-between items-center mb-6">
               <h3 className="font-fangsong text-2xl text-ink">{editingItemId ? 'Edit Item' : 'Add to Pantry'}</h3>
               <button type="button" onClick={() => setIsFormOpen(false)} className="w-8 h-8 rounded-full bg-sand/30 flex items-center justify-center text-ink hover:bg-sand transition-colors">
                  <X size={16}/>
               </button>
             </div>

             {/* Type Selector */}
             <div className="flex bg-sand/20 p-1 rounded-xl mb-6">
                <button 
                  type="button"
                  onClick={() => setNewItem({...newItem, type: 'Food'})}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-300 font-fangsong ${
                      newItem.type === 'Food' ? 'bg-white text-ink shadow-sm' : 'text-pencil'
                  }`}
                >
                  Food
                </button>
                <button 
                  type="button"
                  onClick={() => setNewItem({...newItem, type: 'Supplement'})}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-300 font-fangsong ${
                      newItem.type === 'Supplement' ? 'bg-white text-ink shadow-sm' : 'text-pencil'
                  }`}
                >
                  Supplement
                </button>
             </div>

             <div className="space-y-6">
                 <div>
                   <label className="text-[10px] text-pencil font-bold tracking-widest uppercase mb-1 block font-sans">Item Name</label>
                   <input 
                    type="text" required
                    placeholder="e.g. 渴望 Orijen Original"
                    value={newItem.name || ''}
                    onChange={e => setNewItem({...newItem, name: e.target.value})}
                    className="w-full py-2 bg-transparent border-b border-sand focus:border-gold text-ink font-fangsong text-xl rounded-none placeholder-sand/50"
                   />
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <div>
                       <label className="text-[10px] text-pencil font-bold tracking-widest uppercase mb-1 block font-sans">Quantity</label>
                       <input 
                        type="number" step="0.1" required
                        placeholder="0"
                        value={newItem.quantity || ''}
                        onChange={e => setNewItem({...newItem, quantity: Number(e.target.value)})}
                        className="w-full py-2 bg-transparent border-b border-sand focus:border-gold text-ink font-fangsong text-lg rounded-none"
                       />
                   </div>
                   <div>
                       <label className="text-[10px] text-pencil font-bold tracking-widest uppercase mb-1 block font-sans">Unit</label>
                       <input 
                        type="text" required
                        placeholder="e.g. g, kg, 顆 pills"
                        value={newItem.unit || ''}
                        onChange={e => setNewItem({...newItem, unit: e.target.value})}
                        className="w-full py-2 bg-transparent border-b border-sand focus:border-gold text-ink font-fangsong text-lg rounded-none"
                       />
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <div>
                       <label className="text-[10px] text-pencil font-bold tracking-widest uppercase mb-1 block font-sans">Expiry Date</label>
                       <input 
                        type="date" required
                        value={newItem.expiryDate || ''}
                        onChange={e => setNewItem({...newItem, expiryDate: e.target.value})}
                        className="w-full py-2 bg-transparent border-b border-sand focus:border-gold text-ink font-fangsong text-lg rounded-none"
                       />
                   </div>
                   {newItem.type === 'Food' && (
                     <div>
                         <label className="text-[10px] text-pencil font-bold tracking-widest uppercase mb-1 block font-sans">Kcal per Unit</label>
                         <input 
                          type="number" step="0.01"
                          placeholder="e.g. 3.5 (kcal/g)"
                          value={newItem.caloriesPerUnit || ''}
                          onChange={e => setNewItem({...newItem, caloriesPerUnit: Number(e.target.value)})}
                          className="w-full py-2 bg-transparent border-b border-sand focus:border-gold text-ink font-fangsong text-lg rounded-none placeholder-sand/50"
                         />
                     </div>
                   )}
                </div>

                 <div>
                   <label className="text-[10px] text-pencil font-bold tracking-widest uppercase mb-1 block font-sans">Ingredients / Notes</label>
                   <textarea
                    rows={2}
                    placeholder="Main ingredients or notes..."
                    value={newItem.ingredients || ''}
                    onChange={e => setNewItem({...newItem, ingredients: e.target.value})}
                    className="w-full py-2 bg-transparent border-b border-sand focus:border-gold text-ink font-fangsong text-lg rounded-none placeholder-sand/50 resize-none"
                   />
                </div>
             </div>

             <button type="submit" className="w-full py-4 mt-8 btn-warm">
               {editingItemId ? 'Update' : 'Save'}
             </button>
          </form>
        </div>
      )}
    </div>
  );
};
