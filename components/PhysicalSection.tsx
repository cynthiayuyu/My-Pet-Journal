import React, { useState, useMemo } from 'react';
import { PhysicalRecord, PetProfile } from '../types';
import { generateId, formatDate } from '../utils';
import { Weight, Ruler, ChevronLeft, ChevronRight, Plus, Trash2, X, AlertTriangle, TrendingUp, TrendingDown, Edit2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface PhysicalSectionProps {
  records: PhysicalRecord[];
  addRecord: (record: PhysicalRecord) => void;
  updateRecord: (record: PhysicalRecord) => void;
  deleteRecord: (id: string) => void;
  profile: PetProfile;
}

export const PhysicalSection: React.FC<PhysicalSectionProps> = ({ records, addRecord, updateRecord, deleteRecord, profile }) => {
  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);

  // Form State
  const [newRecord, setNewRecord] = useState<Partial<PhysicalRecord>>({});

  // Calendar Logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Get records for the selected date
  const selectedRecords = records.filter(r => r.date === selectedDateStr);

  const handleDateClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDateStr(dateStr);
  };

  const handleOpenForm = (record?: PhysicalRecord) => {
    if (record) {
      setEditingRecordId(record.id);
      setNewRecord(record);
    } else {
      setEditingRecordId(null);
      setNewRecord({ date: selectedDateStr });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRecord.weight && newRecord.date) {
      const recordData = {
        id: editingRecordId || generateId(),
        date: newRecord.date,
        weight: Number(newRecord.weight),
        height: newRecord.height ? Number(newRecord.height) : undefined,
        neck: newRecord.neck ? Number(newRecord.neck) : undefined,
        chest: newRecord.chest ? Number(newRecord.chest) : undefined,
        back: newRecord.back ? Number(newRecord.back) : undefined,
        notes: newRecord.notes || '',
      };
      
      if (editingRecordId) {
        updateRecord(recordData);
      } else {
        addRecord(recordData);
      }
      
      setIsFormOpen(false);
      setNewRecord({});
      setEditingRecordId(null);
    }
  };

  // Chart Data
  const chartData = useMemo(() => {
    const sorted = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const recentRecords = sorted.slice(-6); // Show only last 6 records
    return recentRecords.map(r => ({
      date: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weight: r.weight
    }));
  }, [records]);

  // Weight Alert Logic
  const latestRecord = useMemo(() => {
    if (records.length === 0) return null;
    return [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  }, [records]);

  const weightAlert = useMemo(() => {
    if (!profile.idealWeight || !latestRecord) return null;
    const diff = latestRecord.weight - profile.idealWeight;
    const percentDiff = (diff / profile.idealWeight) * 100;
    
    if (percentDiff > 10) return { type: 'overweight', message: `Overweight by ${diff.toFixed(1)}kg (${percentDiff.toFixed(0)}%)`, color: 'text-red-500', bg: 'bg-red-50', icon: TrendingUp };
    if (percentDiff < -10) return { type: 'underweight', message: `Underweight by ${Math.abs(diff).toFixed(1)}kg (${Math.abs(percentDiff).toFixed(0)}%)`, color: 'text-blue-500', bg: 'bg-blue-50', icon: TrendingDown };
    return { type: 'ideal', message: 'Ideal Weight!', color: 'text-green-600', bg: 'bg-green-50', icon: Weight };
  }, [profile.idealWeight, latestRecord]);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Weight Alert */}
      {weightAlert && (
        <div className={`p-4 rounded-2xl flex items-center gap-4 ${weightAlert.bg} border border-white shadow-soft`}>
           <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm ${weightAlert.color}`}>
             <weightAlert.icon size={20} />
           </div>
           <div>
             <h4 className={`text-sm font-bold tracking-widest uppercase font-sans ${weightAlert.color}`}>Weight Status</h4>
             <p className="text-lg font-fangsong text-ink">{weightAlert.message}</p>
           </div>
        </div>
      )}

      {/* Weight Chart */}
      {chartData.length > 1 && (
        <div className="bg-white/80 backdrop-blur-md rounded-[2rem] p-6 shadow-soft border border-white">
          <h3 className="text-xs font-bold tracking-[0.2em] text-gold uppercase mb-4 font-sans opacity-80">Weight Trend</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6E2D8" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8C8680', fontFamily: 'DM Sans' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8C8680', fontFamily: 'DM Sans' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -2px rgba(62, 58, 54, 0.1)', fontFamily: 'DM Sans', fontSize: '12px' }}
                  itemStyle={{ color: '#3E3A36', fontWeight: 'bold' }}
                />
                {profile.idealWeight && (
                  <ReferenceLine y={profile.idealWeight} stroke="#B5C1A6" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Ideal', fill: '#B5C1A6', fontSize: 10 }} />
                )}
                <Line type="monotone" dataKey="weight" stroke="#C79A78" strokeWidth={3} dot={{ r: 4, fill: '#C79A78', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, fill: '#BFA884', stroke: '#fff', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Calendar Card */}
      <div className="bg-white/80 backdrop-blur-md rounded-[2rem] p-6 shadow-soft border border-white">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <button onClick={prevMonth} className="p-2 text-pencil hover:text-ink transition-colors"><ChevronLeft size={20}/></button>
          <h3 className="text-xl font-fangsong text-ink font-medium tracking-wide text-center">
            <div className="text-sm text-pencil font-sans uppercase tracking-widest mb-1">{currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
            <div>{currentDate.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long' })}</div>
          </h3>
          <button onClick={nextMonth} className="p-2 text-pencil hover:text-ink transition-colors"><ChevronRight size={20}/></button>
        </div>

        {/* Days of Week */}
        <div className="grid grid-cols-7 mb-2">
          {['日','一','二','三','四','五','六'].map((d, i) => (
            <div key={i} className="text-center text-xs font-bold text-gold py-2 font-fangsong">{d}</div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-y-2">
          {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
          
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isSelected = dateStr === selectedDateStr;
            const hasRecord = records.some(r => r.date === dateStr);
            const isToday = dateStr === new Date().toISOString().split('T')[0];

            return (
              <div key={day} className="flex flex-col items-center">
                <button
                  onClick={() => handleDateClick(day)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-fangsong transition-all duration-300 relative
                    ${isSelected ? 'bg-ink text-paper shadow-md scale-105' : 'text-ink hover:bg-sand/30'}
                    ${isToday && !isSelected ? 'border border-gold text-gold' : ''}
                  `}
                >
                  {day}
                  {hasRecord && (
                    <span className={`absolute bottom-1.5 w-1 h-1 rounded-full ${isSelected ? 'bg-gold' : 'bg-clay'}`} />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details */}
      <div className="space-y-4">
        <div className="flex justify-between items-end px-2">
           <div>
             <span className="text-xs font-bold tracking-[0.2em] text-pencil uppercase font-sans">Records</span>
             <h4 className="text-2xl font-fangsong text-ink mt-1">{formatDate(selectedDateStr)}</h4>
           </div>
           {selectedRecords.length > 0 && (
             <button 
                onClick={handleOpenForm}
                className="w-10 h-10 rounded-full bg-white border border-sand flex items-center justify-center text-ink shadow-sm hover:bg-sand/20 transition-colors"
             >
                <Plus size={18} />
             </button>
           )}
        </div>

        {/* Empty State / Add Button */}
        {selectedRecords.length === 0 && !isFormOpen && (
          <div className="bg-white/50 border border-dashed border-sand rounded-3xl p-8 flex flex-col items-center justify-center text-center gap-4 group hover:border-gold/50 hover:bg-white/80 transition-all cursor-pointer" onClick={handleOpenForm}>
             <div className="w-12 h-12 rounded-full bg-sand/20 flex items-center justify-center text-pencil group-hover:text-gold group-hover:scale-110 transition-all duration-500">
               <Plus size={24} />
             </div>
             <p className="text-sm font-fangsong text-pencil">Tap to add a measurement</p>
          </div>
        )}

        {/* Records List for Selected Day */}
        <div className="space-y-4">
           {selectedRecords.map(record => (
             <div key={record.id} className="bg-white rounded-2xl p-6 shadow-soft border border-white relative group animate-fade-in">
                <div className="absolute top-4 right-4 flex gap-2">
                  <button 
                    onClick={() => handleOpenForm(record)}
                    className="text-sand hover:text-clay transition-colors p-2"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => deleteRecord(record.id)}
                    className="text-sand hover:text-red-400 transition-colors p-2"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-6 pr-16">
                    <div>
                      <div className="flex items-center gap-2 text-gold text-[10px] font-bold uppercase tracking-widest font-sans mb-1">
                        <Weight size={12} /> Weight
                      </div>
                      <div className="text-4xl font-fangsong text-ink">
                        {record.weight} <span className="text-sm text-pencil font-serif italic">kg</span>
                      </div>
                    </div>
                    
                    {(record.height || record.chest) && (
                      <div>
                        <div className="flex items-center gap-2 text-pencil text-[10px] font-bold uppercase tracking-widest font-sans mb-1">
                          <Ruler size={12} /> Size
                        </div>
                         <div className="space-y-1 mt-2">
                            {record.height && <div className="text-sm font-fangsong text-ink">Height: {record.height}cm</div>}
                            {record.chest && <div className="text-sm font-fangsong text-ink">Chest: {record.chest}cm</div>}
                         </div>
                      </div>
                    )}
                </div>
                
                {(record.neck || record.back) && (
                    <div className="mt-4 pt-4 border-t border-sand/30 flex gap-6 text-sm font-fangsong text-pencil">
                       {record.neck && <span>Neck: <span className="text-ink">{record.neck}cm</span></span>}
                       {record.back && <span>Back: <span className="text-ink">{record.back}cm</span></span>}
                    </div>
                )}
             </div>
           ))}
        </div>
      </div>

      {/* Slide Up Form */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center pointer-events-none">
          <div className="absolute inset-0 bg-ink/20 backdrop-blur-sm pointer-events-auto" onClick={() => setIsFormOpen(false)} />
          <form onSubmit={handleSubmit} className="bg-[#FDFCF8] w-full max-w-md rounded-t-[2.5rem] p-8 shadow-2xl pointer-events-auto animate-fade-in relative">
             <div className="w-12 h-1 bg-sand rounded-full mx-auto mb-8 opacity-50" />
             
             <div className="flex justify-between items-center mb-8">
               <h3 className="font-fangsong text-2xl text-ink">{editingRecordId ? 'Edit Record' : 'New Measurement'}</h3>
               <button type="button" onClick={() => setIsFormOpen(false)} className="w-8 h-8 rounded-full bg-sand/30 flex items-center justify-center text-ink hover:bg-sand transition-colors">
                  <X size={16}/>
               </button>
             </div>

             <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="col-span-2">
                   <label className="text-[10px] text-pencil font-bold tracking-widest uppercase mb-1 block font-sans">Date</label>
                   <input 
                    type="date"
                    required 
                    value={newRecord.date}
                    onChange={e => setNewRecord({...newRecord, date: e.target.value})}
                    className="w-full py-2 bg-transparent border-b border-sand focus:border-gold text-ink font-fangsong text-lg rounded-none"
                   />
                </div>
                <div>
                   <label className="text-[10px] text-pencil font-bold tracking-widest uppercase mb-1 block font-sans">Weight (kg)</label>
                   <input 
                    type="number" step="0.1" required
                    placeholder="0.0"
                    value={newRecord.weight || ''}
                    onChange={e => setNewRecord({...newRecord, weight: Number(e.target.value)})}
                    className="w-full py-2 bg-transparent border-b border-sand focus:border-gold text-ink font-fangsong text-2xl rounded-none placeholder-sand/50"
                   />
                </div>
                <div>
                   <label className="text-[10px] text-pencil font-bold tracking-widest uppercase mb-1 block font-sans">Height (cm)</label>
                   <input 
                    type="number" step="0.1"
                    placeholder="0.0"
                    value={newRecord.height || ''}
                    onChange={e => setNewRecord({...newRecord, height: Number(e.target.value)})}
                    className="w-full py-2 bg-transparent border-b border-sand focus:border-gold text-ink font-fangsong text-2xl rounded-none placeholder-sand/50"
                   />
                </div>
                 <div>
                   <label className="text-[10px] text-pencil font-bold tracking-widest uppercase mb-1 block font-sans">Neck (cm)</label>
                   <input 
                    type="number" step="0.1"
                    placeholder="-"
                    value={newRecord.neck || ''}
                    onChange={e => setNewRecord({...newRecord, neck: Number(e.target.value)})}
                    className="w-full py-2 bg-transparent border-b border-sand focus:border-gold text-ink font-fangsong text-xl rounded-none placeholder-sand/50"
                   />
                </div>
                 <div>
                   <label className="text-[10px] text-pencil font-bold tracking-widest uppercase mb-1 block font-sans">Back (cm)</label>
                   <input 
                    type="number" step="0.1"
                    placeholder="-"
                    value={newRecord.back || ''}
                    onChange={e => setNewRecord({...newRecord, back: Number(e.target.value)})}
                    className="w-full py-2 bg-transparent border-b border-sand focus:border-gold text-ink font-fangsong text-xl rounded-none placeholder-sand/50"
                   />
                </div>
                 <div>
                   <label className="text-[10px] text-pencil font-bold tracking-widest uppercase mb-1 block font-sans">Chest (cm)</label>
                   <input 
                    type="number" step="0.1"
                    placeholder="-"
                    value={newRecord.chest || ''}
                    onChange={e => setNewRecord({...newRecord, chest: Number(e.target.value)})}
                    className="w-full py-2 bg-transparent border-b border-sand focus:border-gold text-ink font-fangsong text-xl rounded-none placeholder-sand/50"
                   />
                </div>
             </div>

             <button type="submit" className="w-full py-4 bg-ink text-paper rounded-xl font-bold hover:bg-ink/90 transition-all shadow-lg shadow-ink/20 tracking-widest text-xs uppercase font-sans">
               {editingRecordId ? 'Update' : 'Save'}
             </button>
          </form>
        </div>
      )}
    </div>
  );
};