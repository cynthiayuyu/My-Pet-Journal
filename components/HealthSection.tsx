import React, { useState, useMemo, useRef } from 'react';
import { HealthRecord, PetShop } from '../types';
import { generateId, formatDate } from '../utils';
import { ChevronLeft, ChevronRight, Plus, Trash2, X, Syringe, Bug, Clock, MapPin, Stethoscope, FileText, Activity, Edit2, Search, Camera, DollarSign } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface HealthSectionProps {
  records: HealthRecord[];
  addRecord: (record: HealthRecord) => void;
  updateRecord: (record: HealthRecord) => void;
  deleteRecord: (id: string) => void;
  shops: PetShop[];
}

export const HealthSection: React.FC<HealthSectionProps> = ({ records, addRecord, updateRecord, deleteRecord, shops }) => {
  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  
  // Form State
  const [activeType, setActiveType] = useState<'Vaccine' | 'Deworming' | 'Checkup' | 'Vet Visit'>('Vaccine');
  const [newRecord, setNewRecord] = useState<Partial<HealthRecord>>({});
  const [metricsInput, setMetricsInput] = useState<{key: string, value: string}[]>([{key: '', value: ''}]);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewRecord({ ...newRecord, photoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // Calendar Logic
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

  const handleOpenForm = (record?: HealthRecord) => {
    if (record) {
      setEditingRecordId(record.id);
      setActiveType(record.type as any);
      setNewRecord(record);
      if (record.metrics) {
        setMetricsInput(Object.entries(record.metrics).map(([key, value]) => ({ key, value: String(value) })));
      } else {
        setMetricsInput([{key: '', value: ''}]);
      }
    } else {
      setEditingRecordId(null);
      setNewRecord({ date: selectedDateStr });
      setMetricsInput([{key: '', value: ''}]);
    }
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRecord.title && newRecord.date) {
      const metrics: Record<string, number> = {};
      if (activeType === 'Checkup') {
        metricsInput.forEach(m => {
          if (m.key && m.value && !isNaN(Number(m.value))) {
            metrics[m.key] = Number(m.value);
          }
        });
      }

      const recordData = {
        id: editingRecordId || generateId(),
        type: activeType,
        date: newRecord.date,
        title: newRecord.title,
        location: newRecord.location,
        nextDueDate: newRecord.nextDueDate,
        notes: newRecord.notes,
        cost: newRecord.cost,
        photoUrl: newRecord.photoUrl,
        metrics: Object.keys(metrics).length > 0 ? metrics : undefined,
      };

      if (editingRecordId) {
        updateRecord(recordData as HealthRecord);
      } else {
        addRecord(recordData as HealthRecord);
      }
      
      setIsFormOpen(false);
      setNewRecord({});
      setEditingRecordId(null);
      setMetricsInput([{key: '', value: ''}]);
    }
  };

  // Filter records for selected date OR records that have a "Next Due" date on selected date
  const selectedDayRecords = records.filter(r => r.date === selectedDateStr);
  const selectedDayReminders = records.filter(r => r.nextDueDate === selectedDateStr);

  const searchResults = useMemo(() => {
    if (!searchTerm) return [];
    const term = searchTerm.toLowerCase();
    return records.filter(r => 
      r.title.toLowerCase().includes(term) || 
      r.notes?.toLowerCase().includes(term) ||
      r.location?.toLowerCase().includes(term) ||
      r.type.toLowerCase().includes(term)
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records, searchTerm]);

  // Checkup Trends Data
  const checkupRecords = useMemo(() => {
    return records.filter(r => r.type === 'Checkup' && r.metrics).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [records]);

  const { shopLocations, otherLocations } = useMemo(() => {
    const shopLocs = new Set<string>();
    const otherLocs = new Set<string>();
    
    shops.forEach(s => {
      if (s.name) shopLocs.add(s.name);
    });
    
    records.forEach(r => {
      if (r.location && !shopLocs.has(r.location)) {
        otherLocs.add(r.location);
      }
    });
    
    return {
      shopLocations: Array.from(shopLocs),
      otherLocations: Array.from(otherLocs)
    };
  }, [records, shops]);

  const allLocations = useMemo(() => [...shopLocations, ...otherLocations], [shopLocations, otherLocations]);

  const getEventTypeName = (type: string) => {
    switch(type) {
      case 'Vaccine': return '疫苗 Vaccine';
      case 'Deworming': return '驅蟲 Deworming';
      case 'Checkup': return '健檢 Checkup';
      case 'Vet Visit': return '就診 Vet Visit';
      default: return type;
    }
  };

  const allMetricKeys = useMemo(() => {
    const keys = new Set<string>();
    checkupRecords.forEach(r => {
      if (r.metrics) Object.keys(r.metrics).forEach(k => keys.add(k));
    });
    return Array.from(keys);
  }, [checkupRecords]);

  const [selectedMetric, setSelectedMetric] = useState<string>(allMetricKeys[0] || '');

  const trendData = useMemo(() => {
    if (!selectedMetric) return [];
    return checkupRecords.filter(r => r.metrics && r.metrics[selectedMetric] !== undefined).map(r => ({
      date: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: r.metrics![selectedMetric]
    }));
  }, [checkupRecords, selectedMetric]);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-pencil">
          <Search size={18} />
        </div>
        <input
          type="text"
          placeholder="搜尋紀錄 Search records..."
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

      {searchTerm ? (
        <div className="space-y-4">
          <h3 className="text-sm font-bold tracking-widest text-pencil uppercase font-sans px-2">搜尋結果 Search Results ({searchResults.length})</h3>
          {searchResults.length === 0 ? (
            <div className="text-center py-8 bg-white/50 rounded-3xl border border-dashed border-sand">
              <p className="text-sm font-fangsong text-pencil">找不到符合的紀錄。<br/>No matching records found.</p>
            </div>
          ) : (
            searchResults.map(record => (
              <div key={record.id} className="bg-white rounded-2xl p-5 shadow-soft border border-white relative group animate-fade-in">
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button onClick={() => handleOpenForm(record)} className="text-sand hover:text-clay transition-colors p-1"><Edit2 size={16} /></button>
                    <button onClick={() => deleteRecord(record.id)} className="text-sand hover:text-red-400 transition-colors p-1"><Trash2 size={16} /></button>
                  </div>
                  <div className="flex gap-4 pr-16">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          record.type === 'Vaccine' ? 'bg-[#84b9cb]/20 text-[#84b9cb]' : 
                          record.type === 'Deworming' ? 'bg-[#7ebea5]/20 text-[#7ebea5]' :
                          record.type === 'Checkup' ? 'bg-[#9079ad]/20 text-[#9079ad]' :
                          'bg-orange-50 text-orange-500'
                      }`}>
                          {record.type === 'Vaccine' ? <Syringe size={18} /> : 
                           record.type === 'Deworming' ? <Bug size={18} /> : 
                           record.type === 'Checkup' ? <Activity size={18} /> :
                           <Stethoscope size={18} />}
                      </div>
                      <div className="flex-1">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-pencil font-sans mb-1">{getEventTypeName(record.type)} • {formatDate(record.date)}</div>
                          <div className="text-xl font-fangsong text-ink whitespace-pre-wrap">{record.title}</div>
                          
                          {(record.location || record.nextDueDate || record.cost) && (
                              <div className="mt-3 space-y-1.5">
                                  {record.location && (
                                      <div className="flex items-center gap-1.5 text-xs text-pencil font-fangsong">
                                          <MapPin size={12} className="text-warm" /> {record.location}
                                      </div>
                                  )}
                                  {record.cost !== undefined && (
                                      <div className="flex items-center gap-1.5 text-xs text-pencil font-fangsong">
                                          <DollarSign size={12} className="text-emerald-500" /> ${record.cost}
                                      </div>
                                  )}
                                  {record.nextDueDate && (
                                      <div className="flex items-center gap-1.5 text-xs text-clay font-medium font-fangsong">
                                          <Clock size={12} /> 下次到期 Next due: {formatDate(record.nextDueDate)}
                                      </div>
                                  )}
                              </div>
                          )}
                          {record.photoUrl && (
                            <div className="mt-4 w-full h-32 rounded-xl overflow-hidden border border-sand/30">
                              <img src={record.photoUrl} alt="Record attachment" className="w-full h-full object-cover" />
                            </div>
                          )}
                      </div>
                  </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Calendar Card */}
      <div className="bg-white/80 backdrop-blur-md rounded-[2rem] p-6 shadow-soft border border-white relative overflow-hidden">
        {/* Decorative corner */}
        <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-sage/10 to-transparent rounded-br-[4rem] pointer-events-none"></div>

        {/* Header */}
        <div className="flex justify-between items-center mb-6 relative z-10">
          <button onClick={prevMonth} className="p-2 text-pencil hover:text-ink transition-colors"><ChevronLeft size={20}/></button>
          <h3 className="text-xl font-fangsong text-ink font-medium tracking-wide text-center">
            <div className="text-sm text-pencil font-sans uppercase tracking-widest mb-1">{currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
            <div>{currentDate.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long' })}</div>
          </h3>
          <button onClick={nextMonth} className="p-2 text-pencil hover:text-ink transition-colors"><ChevronRight size={20}/></button>
        </div>

        {/* Days of Week */}
        <div className="grid grid-cols-7 mb-2 relative z-10">
          {['日','一','二','三','四','五','六'].map((d, i) => (
            <div key={i} className="text-center text-xs font-bold text-sage py-2 font-fangsong">{d}</div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-y-2 relative z-10">
          {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
          
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isSelected = dateStr === selectedDateStr;
            const isToday = dateStr === new Date().toISOString().split('T')[0];
            
            // Check for events on this day
            const dayEvents = records.filter(r => r.date === dateStr);
            const hasVaccine = dayEvents.some(r => r.type === 'Vaccine');
            const hasDeworm = dayEvents.some(r => r.type === 'Deworming');
            const hasCheckupOrVet = dayEvents.some(r => r.type === 'Checkup' || r.type === 'Vet Visit');
            
            // Check for reminders (Next Due)
            const hasReminder = records.some(r => r.nextDueDate === dateStr);

            return (
              <div key={day} className="flex flex-col items-center">
                <button
                  onClick={() => handleDateClick(day)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-fangsong transition-all duration-300 relative border-2 
                    ${isSelected 
                        ? 'bg-ink text-paper border-ink shadow-md scale-105' 
                        : hasReminder 
                            ? 'bg-white border-clay text-ink' // Outline for reminders
                            : 'border-transparent text-ink hover:bg-sand/30'
                    }
                    ${isToday && !isSelected && !hasReminder ? 'border-sage/50 bg-sage/10' : ''}
                  `}
                >
                  {day}
                  
                  {/* Event Indicators */}
                  <div className="absolute -bottom-1 flex gap-0.5 justify-center">
                    {hasVaccine && <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-gold' : 'bg-[#84b9cb]'}`} />}
                    {hasDeworm && <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-gold' : 'bg-[#7ebea5]'}`} />}
                    {hasCheckupOrVet && <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-gold' : 'bg-[#9079ad]'}`} />}
                  </div>
                </button>
              </div>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-sand/30 flex justify-center gap-4 text-[10px] uppercase font-bold tracking-wider text-pencil font-sans">
             <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#84b9cb]"></span> 疫苗 Vaccine</div>
             <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#7ebea5]"></span> 驅蟲 Deworm</div>
             <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#9079ad]"></span> 看診 Vet/Checkup</div>
             <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full border border-clay"></span> 到期 Due</div>
        </div>
      </div>

      {/* Selected Day Details */}
      <div className="space-y-4">
         <div className="flex justify-between items-end px-2">
           <div>
             <span className="text-xs font-bold tracking-[0.2em] text-pencil uppercase font-sans">當日行程 Events On</span>
             <h4 className="text-2xl font-fangsong text-ink mt-1">{formatDate(selectedDateStr)}</h4>
           </div>
           {(selectedDayRecords.length > 0 || selectedDayReminders.length > 0) && (
             <button 
                onClick={() => handleOpenForm()}
                className="w-10 h-10 rounded-full bg-white border border-sand flex items-center justify-center text-ink shadow-sm hover:bg-sand/20 transition-colors"
             >
                <Plus size={18} />
             </button>
           )}
        </div>

        {selectedDayRecords.length === 0 && selectedDayReminders.length === 0 && !isFormOpen && (
           <div className="bg-white/50 border border-dashed border-sand rounded-3xl p-8 flex flex-col items-center justify-center text-center gap-4 group hover:border-gold/50 hover:bg-white/80 transition-all cursor-pointer" onClick={() => handleOpenForm()}>
             <div className="w-12 h-12 rounded-full bg-sand/20 flex items-center justify-center text-pencil group-hover:text-gold group-hover:scale-110 transition-all duration-500">
               <Plus size={24} />
             </div>
             <p className="text-sm font-fangsong text-pencil">尚無健康紀錄。<br/>點擊新增紀錄 No health events logged.<br/>Tap to add record.</p>
          </div>
        )}

        {/* Render "Due" Items First */}
        {selectedDayReminders.map(record => (
             <div key={`remind-${record.id}`} className="bg-[#FAF6F2] rounded-2xl p-5 shadow-sm border border-clay/30 relative flex gap-4 animate-fade-in pr-16">
                <div className="w-10 h-10 rounded-full bg-white border border-clay/20 flex items-center justify-center text-clay flex-shrink-0">
                   <Clock size={18} />
                </div>
                <div className="flex-1">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-clay font-sans mb-1">到期提醒 Reminder Due</div>
                    <div className="text-lg font-fangsong text-ink font-medium whitespace-pre-wrap">{record.title}</div>
                    <div className="text-xs text-pencil mt-1">來自先前的 {getEventTypeName(record.type)} 紀錄 From previous record</div>
                </div>
             </div>
        ))}

        {/* Render Actual Records */}
        {selectedDayRecords.map(record => (
            <div key={record.id} className="bg-white rounded-2xl p-5 shadow-soft border border-white relative group animate-fade-in">
                <div className="absolute top-4 right-4 flex gap-2">
                  <button 
                    onClick={() => handleOpenForm(record)}
                    className="text-sand hover:text-clay transition-colors p-1"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => deleteRecord(record.id)}
                    className="text-sand hover:text-red-400 transition-colors p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="flex gap-4 pr-16">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        record.type === 'Vaccine' ? 'bg-[#84b9cb]/20 text-[#84b9cb]' : 
                        record.type === 'Deworming' ? 'bg-[#7ebea5]/20 text-[#7ebea5]' :
                        record.type === 'Checkup' ? 'bg-[#9079ad]/20 text-[#9079ad]' :
                        'bg-orange-50 text-orange-500'
                    }`}>
                        {record.type === 'Vaccine' ? <Syringe size={18} /> : 
                         record.type === 'Deworming' ? <Bug size={18} /> : 
                         record.type === 'Checkup' ? <Activity size={18} /> :
                         <Stethoscope size={18} />}
                    </div>
                    <div className="flex-1">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-pencil font-sans mb-1">{getEventTypeName(record.type)}</div>
                        <div className="text-xl font-fangsong text-ink whitespace-pre-wrap">{record.title}</div>
                        
                        {(record.location || record.nextDueDate || record.cost) && (
                            <div className="mt-3 space-y-1.5">
                                {record.location && (
                                    <div className="flex items-center gap-1.5 text-xs text-pencil font-fangsong">
                                        <MapPin size={12} className="text-warm" /> {record.location}
                                    </div>
                                )}
                                {record.cost !== undefined && (
                                    <div className="flex items-center gap-1.5 text-xs text-pencil font-fangsong">
                                        <DollarSign size={12} className="text-emerald-500" /> ${record.cost}
                                    </div>
                                )}
                                {record.nextDueDate && (
                                    <div className="flex items-center gap-1.5 text-xs text-clay font-medium font-fangsong">
                                        <Clock size={12} /> 下次到期 Next due: {formatDate(record.nextDueDate)}
                                    </div>
                                )}
                            </div>
                        )}

                        {record.photoUrl && (
                          <div className="mt-4 w-full h-32 rounded-xl overflow-hidden border border-sand/30">
                            <img src={record.photoUrl} alt="Record attachment" className="w-full h-full object-cover" />
                          </div>
                        )}

                        {record.metrics && Object.keys(record.metrics).length > 0 && (
                          <div className="mt-4 pt-4 border-t border-sand/30">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-pencil font-sans mb-2">檢驗結果 Test Results</div>
                            <div className="grid grid-cols-2 gap-2">
                              {Object.entries(record.metrics).map(([key, val]) => (
                                <div key={key} className="flex justify-between items-center bg-sand/10 px-3 py-1.5 rounded-lg">
                                  <span className="text-xs font-sans text-pencil">{key}</span>
                                  <span className="text-sm font-fangsong text-ink font-medium">{val}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                </div>
            </div>
        ))}
      </div>
    </div>
  )}

      {/* Checkup Trends */}
      {allMetricKeys.length > 0 && !searchTerm && (
        <div className="bg-white/80 backdrop-blur-md rounded-[2rem] p-6 shadow-soft border border-white mt-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-bold tracking-[0.2em] text-gold uppercase font-sans opacity-80">健檢趨勢 Checkup Trends</h3>
            <select 
              value={selectedMetric} 
              onChange={e => setSelectedMetric(e.target.value)}
              className="bg-transparent border-b border-sand text-ink text-sm font-fangsong focus:border-clay outline-none"
            >
              {allMetricKeys.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
          
          {trendData.length > 0 ? (
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6E2D8" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8C8680', fontFamily: 'DM Sans' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8C8680', fontFamily: 'DM Sans' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -2px rgba(62, 58, 54, 0.1)', fontFamily: 'DM Sans', fontSize: '12px' }}
                    itemStyle={{ color: '#3E3A36', fontWeight: 'bold' }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#B5C1A6" strokeWidth={3} dot={{ r: 4, fill: '#B5C1A6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, fill: '#8C8680', stroke: '#fff', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-pencil font-fangsong text-center py-8">目前沒有 {selectedMetric} 的趨勢資料。<br/>No trend data available for {selectedMetric}.</p>
          )}
        </div>
      )}

       {/* Slide Up Form */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center pointer-events-none">
          <div className="absolute inset-0 bg-ink/20 backdrop-blur-sm pointer-events-auto" onClick={() => setIsFormOpen(false)} />
          <form onSubmit={handleSubmit} className="bg-[#FDFCF8] w-full max-w-md rounded-t-[2.5rem] p-8 shadow-2xl pointer-events-auto animate-fade-in relative max-h-[90vh] overflow-y-auto">
             <div className="w-12 h-1 bg-sand rounded-full mx-auto mb-8 opacity-50" />
             
             <div className="flex justify-between items-center mb-6">
               <h3 className="font-fangsong text-2xl text-ink">{editingRecordId ? '編輯紀錄 Edit Record' : '新增紀錄 New Record'}</h3>
               <button type="button" onClick={() => setIsFormOpen(false)} className="w-8 h-8 rounded-full bg-sand/30 flex items-center justify-center text-ink hover:bg-sand transition-colors">
                  <X size={16}/>
               </button>
             </div>

             {/* Type Selector */}
             <div className="flex flex-wrap bg-sand/20 p-1 rounded-xl mb-6 gap-1">
                {(['Vaccine', 'Deworming', 'Checkup', 'Vet Visit'] as const).map(type => (
                  <button 
                    key={type}
                    type="button"
                    onClick={() => setActiveType(type)}
                    className={`flex-1 min-w-[45%] py-2 rounded-lg text-sm font-medium transition-all duration-300 font-fangsong ${
                        activeType === type ? 'bg-white text-ink shadow-sm' : 'text-pencil'
                    }`}
                  >
                    {type === 'Vaccine' ? '疫苗 Vaccine' : type === 'Deworming' ? '驅蟲 Deworming' : type === 'Checkup' ? '健檢 Checkup' : '就診 Vet Visit'}
                  </button>
                ))}
             </div>

             <div className="space-y-6">
                 <div>
                   <label className="text-[10px] text-pencil font-bold tracking-widest uppercase mb-1 block font-sans whitespace-normal break-words">項目名稱 Treatment / Visit Name</label>
                   <textarea 
                    required
                    rows={2}
                    placeholder={activeType === 'Vaccine' ? "e.g. 狂犬病 Rabies, 核心疫苗 DHPP" : activeType === 'Checkup' ? "e.g. 年度血檢 Annual Blood Test" : "e.g. 犬心寶 Heartgard"}
                    value={newRecord.title || ''}
                    onChange={e => setNewRecord({...newRecord, title: e.target.value})}
                    className="w-full py-2 bg-transparent border-b border-sand focus:border-gold text-ink font-fangsong text-xl rounded-none placeholder-sand/50 resize-none"
                   />
                </div>

                 <div className="grid grid-cols-2 gap-6">
                   <div>
                       <label className="text-[10px] text-pencil font-bold tracking-widest uppercase mb-1 block font-sans">日期 Date</label>
                       <input 
                        type="date" required
                        value={newRecord.date}
                        onChange={e => setNewRecord({...newRecord, date: e.target.value})}
                        className="w-full py-2 bg-transparent border-b border-sand focus:border-gold text-ink font-fangsong text-lg rounded-none"
                       />
                   </div>
                   <div>
                       <label className="text-[10px] text-clay font-bold tracking-widest uppercase mb-1 block font-sans">下次到期 Next Due</label>
                       <input 
                        type="date"
                        value={newRecord.nextDueDate || ''}
                        onChange={e => setNewRecord({...newRecord, nextDueDate: e.target.value})}
                        className="w-full py-2 bg-transparent border-b border-sand focus:border-gold text-ink font-fangsong text-lg rounded-none"
                       />
                   </div>
                </div>

                 <div className="grid grid-cols-2 gap-6">
                   <div>
                     <label className="text-[10px] text-pencil font-bold tracking-widest uppercase mb-1 block font-sans">地點 Clinic / Location</label>
                     <select
                      value={allLocations.includes(newRecord.location || '') ? newRecord.location : (newRecord.location ? 'other' : '')}
                      onChange={e => {
                        if (e.target.value === 'other') {
                          setNewRecord({...newRecord, location: ' '}); // Temporary space to trigger input
                        } else {
                          setNewRecord({...newRecord, location: e.target.value});
                        }
                      }}
                      className="w-full py-2 bg-transparent border-b border-sand focus:border-gold text-ink font-fangsong text-lg rounded-none appearance-none"
                     >
                       <option value="">請選擇 Select...</option>
                       {shopLocations.length > 0 && (
                         <optgroup label="愛店 Shops & Places">
                           {shopLocations.map(loc => (
                             <option key={loc} value={loc}>{loc}</option>
                           ))}
                         </optgroup>
                       )}
                       {otherLocations.length > 0 && (
                         <optgroup label="其他地點 Other Locations">
                           {otherLocations.map(loc => (
                             <option key={loc} value={loc}>{loc}</option>
                           ))}
                         </optgroup>
                       )}
                       <option value="other">+ 新增其他 Add New...</option>
                     </select>
                     {(!allLocations.includes(newRecord.location || '') && newRecord.location !== '') && (
                       <input 
                        type="text"
                        placeholder="輸入新地點 Type new location..."
                        value={newRecord.location?.trim() || ''}
                        onChange={e => setNewRecord({...newRecord, location: e.target.value})}
                        className="w-full mt-2 py-2 bg-transparent border-b border-sand focus:border-gold text-ink font-fangsong text-lg rounded-none placeholder-sand/50 animate-fade-in"
                        autoFocus
                       />
                     )}
                   </div>
                   <div>
                     <label className="text-[10px] text-pencil font-bold tracking-widest uppercase mb-1 block font-sans">花費 Cost</label>
                     <div className="relative">
                       <span className="absolute left-0 top-2.5 text-ink font-fangsong">$</span>
                       <input 
                        type="number"
                        placeholder="0"
                        value={newRecord.cost || ''}
                        onChange={e => setNewRecord({...newRecord, cost: Number(e.target.value)})}
                        className="w-full pl-4 py-2 bg-transparent border-b border-sand focus:border-gold text-ink font-fangsong text-lg rounded-none placeholder-sand/50"
                       />
                     </div>
                   </div>
                </div>

                {/* Photo Upload */}
                <div>
                   <label className="text-[10px] text-pencil font-bold tracking-widest uppercase mb-2 block font-sans">照片 Photo / Receipt</label>
                   <div 
                     onClick={() => fileInputRef.current?.click()}
                     className="w-full h-32 rounded-xl border-2 border-dashed border-sand flex flex-col items-center justify-center text-pencil hover:text-clay hover:border-clay transition-colors cursor-pointer overflow-hidden relative"
                   >
                     {newRecord.photoUrl ? (
                       <>
                         <img src={newRecord.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                         <div className="absolute inset-0 bg-ink/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                           <span className="text-white text-xs font-bold uppercase tracking-widest">更換照片 Change Photo</span>
                         </div>
                       </>
                     ) : (
                       <>
                         <Camera size={24} className="mb-2" />
                         <span className="text-xs font-sans">點擊上傳 Tap to upload</span>
                       </>
                     )}
                   </div>
                   <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                </div>

                {activeType === 'Checkup' && (
                  <div className="pt-4 border-t border-sand/30">
                    <label className="text-[10px] text-pencil font-bold tracking-widest uppercase mb-3 block font-sans">檢驗數值 Test Metrics (Optional)</label>
                    {metricsInput.map((metric, idx) => (
                      <div key={idx} className="flex gap-2 mb-2">
                        <input 
                          type="text" placeholder="項目 e.g. WBC"
                          value={metric.key}
                          onChange={e => {
                            const newM = [...metricsInput];
                            newM[idx].key = e.target.value;
                            setMetricsInput(newM);
                          }}
                          className="flex-1 py-1.5 px-2 bg-white border border-sand rounded-lg text-sm font-sans focus:border-gold outline-none"
                        />
                        <input 
                          type="number" step="0.01" placeholder="數值 Value"
                          value={metric.value}
                          onChange={e => {
                            const newM = [...metricsInput];
                            newM[idx].value = e.target.value;
                            setMetricsInput(newM);
                          }}
                          className="w-24 py-1.5 px-2 bg-white border border-sand rounded-lg text-sm font-sans focus:border-gold outline-none"
                        />
                        {idx === metricsInput.length - 1 ? (
                          <button type="button" onClick={() => setMetricsInput([...metricsInput, {key: '', value: ''}])} className="p-2 text-gold hover:bg-gold/10 rounded-lg"><Plus size={16}/></button>
                        ) : (
                          <button type="button" onClick={() => setMetricsInput(metricsInput.filter((_, i) => i !== idx))} className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                 <div>
                   <label className="text-[10px] text-pencil font-bold tracking-widest uppercase mb-1 block font-sans">備註 Notes</label>
                   <textarea 
                    rows={2}
                    placeholder="輸入備註 Add any additional notes..."
                    value={newRecord.notes || ''}
                    onChange={e => setNewRecord({...newRecord, notes: e.target.value})}
                    className="w-full py-2 bg-transparent border-b border-sand focus:border-gold text-ink font-fangsong text-lg rounded-none placeholder-sand/50 resize-none"
                   />
                 </div>
              </div>

             <button type="submit" className="w-full py-4 mt-8 bg-ink text-paper rounded-xl font-bold hover:bg-ink/90 transition-all shadow-lg shadow-ink/20 tracking-widest text-xs uppercase font-sans">
               {editingRecordId ? '更新紀錄 Update Record' : '儲存紀錄 Save Record'}
             </button>
          </form>
        </div>
      )}
    </div>
  );
};