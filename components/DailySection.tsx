import React, { useState, useRef } from 'react';
import { DailyLog } from '../types';
import { generateId, formatDate } from '../utils';
import { Plus, Trash2, Edit2, X, Camera, Droplets, Utensils, Activity } from 'lucide-react';

interface DailySectionProps {
  logs: DailyLog[];
  addLog: (log: DailyLog) => void;
  updateLog: (log: DailyLog) => void;
  deleteLog: (id: string) => void;
}

export const DailySection: React.FC<DailySectionProps> = ({ logs, addLog, updateLog, deleteLog }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [newLog, setNewLog] = useState<Partial<DailyLog>>({ date: new Date().toISOString().split('T')[0] });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenForm = (log?: DailyLog) => {
    if (log) {
      setEditingLogId(log.id);
      setNewLog(log);
    } else {
      setEditingLogId(null);
      setNewLog({ date: new Date().toISOString().split('T')[0], potty: 'Normal' });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLog.date) {
      const logData = {
        id: editingLogId || generateId(),
        date: newLog.date,
        foodIntake: newLog.foodIntake,
        waterIntake: newLog.waterIntake,
        potty: newLog.potty,
        notes: newLog.notes,
        photoUrl: newLog.photoUrl,
      };

      if (editingLogId) {
        updateLog(logData as DailyLog);
      } else {
        addLog(logData as DailyLog);
      }
      
      setIsFormOpen(false);
      setNewLog({});
      setEditingLogId(null);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewLog({ ...newLog, photoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // Sort logs by date descending
  const sortedLogs = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6 animate-fade-in">
      
      <div className="flex justify-end px-1 -mt-4 mb-2">
         <button
            onClick={() => handleOpenForm()}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 border border-white/80 text-ink/60 hover:text-clay hover:bg-white/90 transition-all text-xs font-sans tracking-wider backdrop-blur-sm shadow-sm"
         >
            <Plus size={14} strokeWidth={2} />
            New Log
         </button>
      </div>

      {sortedLogs.length === 0 && !isFormOpen && (
           <div className="bg-white/50 border border-dashed border-sand rounded-3xl p-8 flex flex-col items-center justify-center text-center gap-4 group hover:border-gold/50 hover:bg-white/80 transition-all cursor-pointer" onClick={() => handleOpenForm()}>
             <div className="w-12 h-12 rounded-full bg-sand/20 flex items-center justify-center text-pencil group-hover:text-gold group-hover:scale-110 transition-all duration-500">
               <Activity size={24} />
             </div>
             <p className="text-sm font-fangsong text-pencil">Tap to add today's log</p>
          </div>
      )}

      <div className="space-y-4">
        {sortedLogs.map(log => (
          <div key={log.id} className="card-warm rounded-2xl p-5 relative group animate-fade-in">
              <div className="absolute top-4 right-4 flex gap-2 z-10">
                <button onClick={() => handleOpenForm(log)} className="text-sand hover:text-clay transition-colors p-1 bg-white/80 rounded-full backdrop-blur-sm">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => deleteLog(log.id)} className="text-sand hover:text-clay transition-colors p-1 bg-white/80 rounded-full backdrop-blur-sm">
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="mb-3">
                <div className="text-lg font-fangsong text-ink font-medium">{formatDate(log.date)}</div>
              </div>

              {log.photoUrl && (
                <div className="w-full h-48 rounded-xl overflow-hidden mb-4 border border-sand/30">
                  <img src={log.photoUrl} alt="Daily Log" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mb-3">
                {log.foodIntake && (
                  <div className="bg-clay/10 p-3 rounded-xl border border-clay/20">
                    <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.15em] text-clay font-sans mb-1.5">
                      <Utensils size={11} /> Food
                    </div>
                    <div className="text-sm font-fangsong text-ink whitespace-pre-wrap">{log.foodIntake}</div>
                  </div>
                )}
                {log.waterIntake && (
                  <div className="bg-sage/10 p-3 rounded-xl border border-sage/20">
                    <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.15em] text-sage font-sans mb-1.5">
                      <Droplets size={11} /> Water
                    </div>
                    <div className="text-sm font-fangsong text-ink whitespace-pre-wrap">{log.waterIntake}</div>
                  </div>
                )}
              </div>

              {(log.potty || log.notes) && (
                <div className="bg-sand/10 p-3 rounded-xl space-y-2">
                  {log.potty && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-pencil font-sans">Potty:</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        log.potty === 'Normal' ? 'bg-sage/20 text-[#7A9A6A]' :
                        log.potty === 'None' ? 'bg-sand/40 text-pencil' : 'bg-clay/15 text-clay'
                      }`}>{
                        log.potty === 'Normal' ? 'Normal' :
                        log.potty === 'Diarrhea' ? 'Diarrhea' :
                        log.potty === 'Constipation' ? 'Constipation' :
                        'None'
                      }</span>
                    </div>
                  )}
                  {log.notes && (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-pencil font-sans block mb-0.5">Notes:</span>
                      <div className="text-sm font-fangsong text-ink whitespace-pre-wrap">{log.notes}</div>
                    </div>
                  )}
                </div>
              )}
          </div>
        ))}
      </div>

      {/* Slide Up Form */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center pointer-events-none">
          <div className="absolute inset-0 bg-ink/20 backdrop-blur-sm pointer-events-auto" onClick={() => setIsFormOpen(false)} />
          <form onSubmit={handleSubmit} className="bg-[#FEFCF8] w-full max-w-md rounded-t-[2.5rem] p-8 shadow-2xl pointer-events-auto animate-fade-in relative max-h-[90vh] overflow-y-auto">
             <div className="w-12 h-1 bg-sand rounded-full mx-auto mb-8 opacity-50" />
             
             <div className="flex justify-between items-center mb-6">
               <h3 className="font-fangsong text-2xl text-ink">{editingLogId ? 'Edit Log' : 'New Log'}</h3>
               <button type="button" onClick={() => setIsFormOpen(false)} className="w-8 h-8 rounded-full bg-sand/30 flex items-center justify-center text-ink hover:bg-sand transition-colors">
                  <X size={16}/>
               </button>
             </div>

             <div className="space-y-6">
                 <div>
                     <label className="text-[10px] text-pencil font-bold tracking-widest uppercase mb-1 block font-sans">Date</label>
                     <input 
                      type="date" required
                      value={newLog.date || ''}
                      onChange={e => setNewLog({...newLog, date: e.target.value})}
                      className="w-full py-2 bg-transparent border-b border-sand focus:border-gold text-ink font-fangsong text-lg rounded-none"
                     />
                 </div>

                 {/* Photo Upload */}
                 <div>
                    <label className="text-[10px] text-pencil font-bold tracking-widest uppercase mb-2 block font-sans">Photo (Optional)</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-32 rounded-xl border-2 border-dashed border-sand flex flex-col items-center justify-center text-pencil hover:text-clay hover:border-clay transition-colors cursor-pointer overflow-hidden relative"
                    >
                      {newLog.photoUrl ? (
                        <>
                          <img src={newLog.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-ink/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <span className="text-white text-xs font-bold uppercase tracking-widest">Change Photo</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <Camera size={24} className="mb-2" />
                          <span className="text-xs font-sans">Tap to upload</span>
                        </>
                      )}
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                   <div>
                     <label className="text-[10px] text-pencil font-bold tracking-widest uppercase mb-1 block font-sans">Food Intake</label>
                     <textarea 
                      rows={2}
                      placeholder="e.g. 100g 飼料 kibble"
                      value={newLog.foodIntake || ''}
                      onChange={e => setNewLog({...newLog, foodIntake: e.target.value})}
                      className="w-full py-2 bg-transparent border-b border-sand focus:border-gold text-ink font-fangsong text-sm rounded-none placeholder-sand/50 resize-none"
                     />
                   </div>
                   <div>
                     <label className="text-[10px] text-pencil font-bold tracking-widest uppercase mb-1 block font-sans">Water Intake</label>
                     <textarea 
                      rows={2}
                      placeholder="e.g. 喝很多水 Drank well"
                      value={newLog.waterIntake || ''}
                      onChange={e => setNewLog({...newLog, waterIntake: e.target.value})}
                      className="w-full py-2 bg-transparent border-b border-sand focus:border-gold text-ink font-fangsong text-sm rounded-none placeholder-sand/50 resize-none"
                     />
                   </div>
                 </div>

                 <div>
                   <label className="text-[10px] text-pencil font-bold tracking-widest uppercase mb-2 block font-sans">Potty</label>
                   <div className="flex flex-wrap gap-2">
                     {(['Normal', 'Diarrhea', 'Constipation', 'None'] as const).map(p => (
                       <button
                         key={p}
                         type="button"
                         onClick={() => setNewLog({...newLog, potty: p})}
                         className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                           newLog.potty === p ? 'bg-clay text-white' : 'bg-sand/30 text-pencil hover:bg-sand/50'
                         }`}
                       >
                         {
                           p === 'Normal' ? '正常 Normal' :
                           p === 'Diarrhea' ? '拉肚子 Diarrhea' :
                           p === 'Constipation' ? '便秘 Constipation' :
                           '無 None'
                         }
                       </button>
                     ))}
                   </div>
                 </div>

                 <div>
                   <label className="text-[10px] text-pencil font-bold tracking-widest uppercase mb-1 block font-sans">Notes</label>
                   <textarea
                    rows={3}
                    placeholder="Any other observations..."
                    value={newLog.notes || ''}
                    onChange={e => setNewLog({...newLog, notes: e.target.value})}
                    className="w-full py-2 bg-transparent border-b border-sand focus:border-gold text-ink font-fangsong text-sm rounded-none placeholder-sand/50 resize-none"
                   />
                </div>
             </div>

             <button type="submit" className="w-full py-4 mt-8 btn-warm">
               {editingLogId ? 'Update' : 'Save'}
             </button>
          </form>
        </div>
      )}
    </div>
  );
};
