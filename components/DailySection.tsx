import React, { useState, useRef, useMemo } from 'react';
import { DailyLog } from '../types';
import { generateId, formatDate } from '../utils';
import { Plus, Trash2, Edit2, X, Camera, Droplets, Utensils, Activity, ChevronLeft, ChevronRight } from 'lucide-react';

interface DailySectionProps {
  logs: DailyLog[];
  addLog: (log: DailyLog) => void;
  updateLog: (log: DailyLog) => void;
  deleteLog: (id: string) => void;
}

export const DailySection: React.FC<DailySectionProps> = ({ logs, addLog, updateLog, deleteLog }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [newLog, setNewLog] = useState<Partial<DailyLog>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(new Date().toISOString().split('T')[0]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleDateClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDateStr(dateStr);
  };

  // Set of dates that have logs for quick dot lookup
  const logDateSet = useMemo(() => {
    const s = new Set<string>();
    logs.forEach(l => s.add(l.date));
    return s;
  }, [logs]);

  // Logs for the selected date
  const selectedDayLogs = useMemo(() =>
    logs.filter(l => l.date === selectedDateStr)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [logs, selectedDateStr]
  );

  const handleOpenForm = (log?: DailyLog) => {
    if (log) {
      setEditingLogId(log.id);
      setNewLog(log);
    } else {
      setEditingLogId(null);
      setNewLog({ date: selectedDateStr, potty: 'Normal' });
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
      reader.onloadend = () => setNewLog({ ...newLog, photoUrl: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Calendar Card ── */}
      <div className="card-warm rounded-[2rem] p-6 relative overflow-hidden">
        {/* Decorative corner */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-petal/10 to-transparent rounded-bl-[5rem] pointer-events-none" />

        {/* Month navigation */}
        <div className="flex justify-between items-center mb-5 relative z-10">
          <button onClick={prevMonth} className="p-2 text-pencil hover:text-ink transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div className="text-center">
            <div className="text-[10px] font-sans uppercase tracking-[0.3em] text-gold/60 mb-1">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
            <div className="text-xl font-fangsong text-ink tracking-wide">
              {currentDate.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long' })}
            </div>
          </div>
          <button onClick={nextMonth} className="p-2 text-pencil hover:text-ink transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 mb-1">
          {['日', '一', '二', '三', '四', '五', '六'].map((d, i) => (
            <div key={i} className="text-center text-[10px] font-bold text-clay/50 py-1.5 font-sans tracking-wider">{d}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-y-0.5">
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`e-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isSelected = dateStr === selectedDateStr;
            const isToday = dateStr === todayStr;
            const hasLog = logDateSet.has(dateStr);

            return (
              <div key={day} className="flex flex-col items-center gap-[3px] py-0.5">
                <button
                  onClick={() => handleDateClick(day)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-fangsong transition-all duration-300 border
                    ${isSelected
                      ? 'bg-clay text-white border-clay shadow-sm scale-105'
                      : isToday
                      ? 'border-clay/35 bg-clay/8 text-ink'
                      : 'border-transparent text-ink hover:bg-sand/30'
                    }
                  `}
                >
                  {day}
                </button>
                {/* Dot indicator — shows when a log exists for this day */}
                <span className={`w-1 h-1 rounded-full transition-all duration-300 ${
                  hasLog
                    ? isSelected ? 'bg-white/80' : 'bg-clay/60'
                    : 'opacity-0'
                }`} />
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Selected Day Header ── */}
      <div className="flex justify-between items-end px-1">
        <div>
          <span className="text-[10px] font-bold tracking-[0.25em] text-pencil uppercase font-sans">日常紀錄</span>
          <h4 className="text-2xl font-fangsong text-ink mt-1">{formatDate(selectedDateStr)}</h4>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="w-10 h-10 rounded-full bg-white border border-sand flex items-center justify-center text-ink shadow-sm hover:bg-sand/20 transition-colors"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* ── Empty state ── */}
      {selectedDayLogs.length === 0 && !isFormOpen && (
        <div
          className="bg-white/50 border border-dashed border-sand rounded-3xl p-8 flex flex-col items-center justify-center text-center gap-4 group hover:border-gold/50 hover:bg-white/80 transition-all cursor-pointer"
          onClick={() => handleOpenForm()}
        >
          <div className="w-12 h-12 rounded-full bg-sand/20 flex items-center justify-center text-pencil group-hover:text-gold group-hover:scale-110 transition-all duration-500">
            <Activity size={24} />
          </div>
          <p className="text-sm font-fangsong text-pencil">點擊新增當日紀錄</p>
        </div>
      )}

      {/* ── Log Cards ── */}
      <div className="space-y-4">
        {selectedDayLogs.map(log => (
          <div key={log.id} className="card-warm rounded-2xl p-5 relative group animate-fade-in">
            <div className="absolute top-4 right-4 flex gap-2 z-10">
              <button onClick={() => handleOpenForm(log)} className="text-sand hover:text-clay transition-colors p-1 bg-white/80 rounded-full backdrop-blur-sm">
                <Edit2 size={16} />
              </button>
              <button onClick={() => deleteLog(log.id)} className="text-sand hover:text-clay transition-colors p-1 bg-white/80 rounded-full backdrop-blur-sm">
                <Trash2 size={16} />
              </button>
            </div>

            {log.photoUrl && (
              <div className="w-full h-48 rounded-xl overflow-hidden mb-4 border border-sand/30">
                <img src={log.photoUrl} alt="Daily Log" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mb-3">
              {log.foodIntake && (
                <div className="bg-clay/8 p-3 rounded-xl border border-clay/15">
                  <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.15em] text-clay font-sans mb-1.5">
                    <Utensils size={11} /> Food
                  </div>
                  <div className="text-sm font-fangsong text-ink whitespace-pre-wrap">{log.foodIntake}</div>
                </div>
              )}
              {log.waterIntake && (
                <div className="bg-sage/8 p-3 rounded-xl border border-sage/15">
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
                      log.potty === 'Normal' ? 'bg-sage/15 text-[#5E8A55]' :
                      log.potty === 'None' ? 'bg-sand/40 text-pencil' : 'bg-clay/15 text-clay'
                    }`}>
                      {log.potty === 'Normal' ? '正常' : log.potty === 'Diarrhea' ? '拉肚子' : log.potty === 'Constipation' ? '便秘' : '無'}
                    </span>
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

      {/* ── Slide-up Form ── */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center pointer-events-none">
          <div className="absolute inset-0 bg-ink/20 backdrop-blur-sm pointer-events-auto" onClick={() => setIsFormOpen(false)} />
          <form
            onSubmit={handleSubmit}
            className="bg-[#FDFAF5] w-full max-w-md rounded-t-[2.5rem] shadow-2xl pointer-events-auto animate-fade-in relative flex flex-col"
            style={{ maxHeight: '90vh' }}
          >
            {/* Fixed header */}
            <div className="flex-shrink-0 px-8 pt-6 pb-4">
              <div className="w-12 h-1 bg-sand rounded-full mx-auto mb-5 opacity-50" />
              <div className="flex justify-between items-center">
                <h3 className="font-fangsong text-2xl text-ink">{editingLogId ? '編輯紀錄' : '新增紀錄'}</h3>
                <button type="button" onClick={() => setIsFormOpen(false)} className="w-8 h-8 rounded-full bg-sand/30 flex items-center justify-center text-ink hover:bg-sand transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Scrollable fields */}
            <div className="flex-1 overflow-y-auto px-8 pb-4 space-y-6">
              <div>
                <label className="text-[10px] text-pencil font-bold tracking-widest uppercase mb-1 block font-sans">Date</label>
                <input
                  type="date" required
                  value={newLog.date || ''}
                  onChange={e => setNewLog({ ...newLog, date: e.target.value })}
                  className="w-full py-2 bg-transparent border-b border-sand focus:border-gold text-ink font-fangsong text-lg rounded-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-pencil font-bold tracking-widest uppercase mb-2 block font-sans">Photo (Optional)</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-28 rounded-xl border-2 border-dashed border-sand flex flex-col items-center justify-center text-pencil hover:text-clay hover:border-clay transition-colors cursor-pointer overflow-hidden relative"
                >
                  {newLog.photoUrl ? (
                    <>
                      <img src={newLog.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-ink/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <span className="text-white text-xs font-bold uppercase tracking-widest">Change</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <Camera size={22} className="mb-1.5" />
                      <span className="text-xs font-sans">Tap to upload</span>
                    </>
                  )}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="text-[10px] text-pencil font-bold tracking-widest uppercase mb-1 block font-sans">Food</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. 100g 飼料"
                    value={newLog.foodIntake || ''}
                    onChange={e => setNewLog({ ...newLog, foodIntake: e.target.value })}
                    className="w-full py-2 bg-transparent border-b border-sand focus:border-gold text-ink font-fangsong text-sm rounded-none placeholder-sand/50 resize-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-pencil font-bold tracking-widest uppercase mb-1 block font-sans">Water</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. 喝了很多水"
                    value={newLog.waterIntake || ''}
                    onChange={e => setNewLog({ ...newLog, waterIntake: e.target.value })}
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
                      onClick={() => setNewLog({ ...newLog, potty: p })}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        newLog.potty === p ? 'bg-clay text-white' : 'bg-sand/30 text-pencil hover:bg-sand/50'
                      }`}
                    >
                      {p === 'Normal' ? '正常' : p === 'Diarrhea' ? '拉肚子' : p === 'Constipation' ? '便秘' : '無'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-pencil font-bold tracking-widest uppercase mb-1 block font-sans">Notes</label>
                <textarea
                  rows={3}
                  placeholder="其他觀察紀錄..."
                  value={newLog.notes || ''}
                  onChange={e => setNewLog({ ...newLog, notes: e.target.value })}
                  className="w-full py-2 bg-transparent border-b border-sand focus:border-gold text-ink font-fangsong text-sm rounded-none placeholder-sand/50 resize-none"
                />
              </div>
            </div>

            {/* Sticky submit */}
            <div className="flex-shrink-0 px-8 pb-8 pt-4 border-t border-sand/20">
              <button type="submit" className="w-full py-3.5 btn-warm">
                {editingLogId ? '更新' : '儲存'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
