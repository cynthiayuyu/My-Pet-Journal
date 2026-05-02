import React, { useRef, useState } from 'react';
import { PetProfile } from '../types';
import { calculateAge } from '../utils';
import { Camera, Award, Stethoscope, Cloud, Upload, Download, Copy, CheckCircle, AlertCircle, RefreshCw, X } from 'lucide-react';

interface ProfileSectionProps {
  profile: PetProfile;
  setProfile: (profile: PetProfile) => void;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({ profile, setProfile }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: keyof PetProfile, value: string) => {
    setProfile({ ...profile, [field]: value });
  };

  const handleVetChange = (field: keyof NonNullable<PetProfile['vetContact']>, value: string) => {
    setProfile({
      ...profile,
      vetContact: {
        clinicName: '',
        phone: '',
        address: '',
        ...profile.vetContact,
        [field]: value
      }
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, photoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const age = calculateAge(profile.birthDate);

  const [githubToken, setGithubToken] = useState(() => localStorage.getItem('pawprint_github_token') || '');
  const [gistId, setGistId] = useState(() => localStorage.getItem('pawprint_gist_id') || '');
  const [backupStatus, setBackupStatus] = useState<{ type: 'success' | 'error' | 'loading'; msg: string } | null>(null);

  const handleTokenChange = (val: string) => {
    setGithubToken(val);
    if (val) localStorage.setItem('pawprint_github_token', val);
    else localStorage.removeItem('pawprint_github_token');
  };

  const collectBackupData = () => {
    const data: Record<string, unknown> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('pawprint_') && key !== 'pawprint_github_token' && key !== 'pawprint_gist_id') {
        try { data[key] = JSON.parse(localStorage.getItem(key)!); }
        catch { data[key] = localStorage.getItem(key); }
      }
    }
    return data;
  };

  const handleUpload = async () => {
    if (!githubToken.trim()) { setBackupStatus({ type: 'error', msg: '請先輸入 GitHub 存取金鑰' }); return; }
    setBackupStatus({ type: 'loading', msg: '上傳中...' });
    try {
      const content = JSON.stringify(collectBackupData(), null, 2);
      const body = { description: '毛孩日記 My Pet Journal 備份', public: false, files: { 'pawprint-backup.json': { content } } };
      const url = gistId.trim() ? `https://api.github.com/gists/${gistId.trim()}` : 'https://api.github.com/gists';
      const resp = await fetch(url, {
        method: gistId.trim() ? 'PATCH' : 'POST',
        headers: { Authorization: `token ${githubToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const result = await resp.json();
      const newId: string = result.id;
      setGistId(newId);
      localStorage.setItem('pawprint_gist_id', newId);
      setBackupStatus({ type: 'success', msg: '上傳成功！Gist ID 已儲存' });
    } catch (err) {
      setBackupStatus({ type: 'error', msg: `上傳失敗：${err instanceof Error ? err.message : '未知錯誤'}` });
    }
  };

  const handleDownload = async () => {
    if (!githubToken.trim()) { setBackupStatus({ type: 'error', msg: '請先輸入 GitHub 存取金鑰' }); return; }
    if (!gistId.trim()) { setBackupStatus({ type: 'error', msg: '請輸入要還原的 Gist ID' }); return; }
    if (!window.confirm('確定要從 GitHub 還原資料嗎？\n這將覆蓋目前所有的本地資料，且無法復原。')) return;
    setBackupStatus({ type: 'loading', msg: '下載中...' });
    try {
      const resp = await fetch(`https://api.github.com/gists/${gistId.trim()}`, {
        headers: { Authorization: `token ${githubToken}` },
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const result = await resp.json();
      const content = result.files?.['pawprint-backup.json']?.content;
      if (!content) throw new Error('找不到備份檔案');
      const data: Record<string, unknown> = JSON.parse(content);
      Object.entries(data).forEach(([key, value]) => {
        localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
      });
      setBackupStatus({ type: 'success', msg: '還原成功！即將重新載入...' });
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setBackupStatus({ type: 'error', msg: `下載失敗：${err instanceof Error ? err.message : '未知錯誤'}` });
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in pb-8">
      {/* Photo & Main Info Card */}
      <div className="flex flex-col items-center text-center relative pt-4 pb-2">
        
        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <div className="w-44 h-44 rounded-full shadow-soft border-[5px] border-white bg-white overflow-hidden relative transform transition-all duration-500 hover:scale-[1.02] hover:shadow-float">
            {profile.photoUrl ? (
              <img src={profile.photoUrl} alt="Pet" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-sand/20 text-warm">
                <Camera size={32} strokeWidth={1.5} />
              </div>
            )}
             <div className="absolute inset-0 bg-ink/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px]">
               <span className="text-white text-xs font-medium tracking-widest uppercase drop-shadow-md">Change Photo</span>
             </div>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            accept="image/*" 
            className="hidden" 
          />
        </div>

        <div className="mt-8 w-full max-w-xs space-y-4">
           <input
            type="text"
            value={profile.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Pet Name"
            className="text-4xl font-fangsong text-ink text-center w-full bg-transparent border-none focus:ring-0 placeholder-warm/40 transition-all p-0 selection:bg-gold/20"
          />
          <div className="flex justify-center items-center">
            <span className="px-6 py-2 rounded-full text-sm font-fangsong text-ink/70 bg-white/60 border border-white/50 shadow-sm backdrop-blur-sm tracking-wider">
               {age}
            </span>
          </div>
        </div>
      </div>

      {/* Details Form - Paper Style */}
      <div className="card-warm rounded-[2rem] p-8 shadow-soft border border-white space-y-8 relative overflow-hidden">
        {/* Decorative corner */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-lavender/10 via-petal/8 to-transparent rounded-bl-[5rem] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-sage/8 to-transparent rounded-tr-[4rem] pointer-events-none"></div>

        <h3 className="text-xs font-bold tracking-[0.2em] text-gold uppercase flex items-center gap-3 mb-6 font-sans opacity-80">
          <Award size={14} />
          Identity
        </h3>
        
        <div className="grid grid-cols-1 gap-8">
          <div className="grid grid-cols-2 gap-8">
             <div className="group">
              <label className="block text-[10px] font-bold text-pencil mb-1 font-sans uppercase tracking-widest group-focus-within:text-clay transition-colors">Breed</label>
              <input
                type="text"
                value={profile.breed}
                onChange={(e) => handleInputChange('breed', e.target.value)}
                className="w-full py-2 bg-transparent border-b border-sand text-ink text-xl focus:border-clay transition-colors rounded-none font-fangsong placeholder-sand"
                placeholder="Unknown"
              />
            </div>

            <div className="group">
              <label className="block text-[10px] font-bold text-pencil mb-1 font-sans uppercase tracking-widest group-focus-within:text-clay transition-colors">Gender</label>
               <div className="flex gap-1 pt-1">
                  {(['Male', 'Female'] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => setProfile({...profile, gender: g})}
                      className={`flex-1 py-1.5 text-sm transition-all duration-300 font-fangsong border-b-2 ${
                        profile.gender === g
                          ? 'border-ink text-ink font-semibold'
                          : 'border-transparent text-pencil hover:text-ink/70'
                      }`}
                    >
                      {g === 'Male' ? 'Male' : 'Female'}
                    </button>
                  ))}
               </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="group">
              <label className="block text-[10px] font-bold text-pencil mb-1 font-sans uppercase tracking-widest group-focus-within:text-clay transition-colors">
                Ideal Weight (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={profile.idealWeight || ''}
                onChange={(e) => handleInputChange('idealWeight', e.target.value ? parseFloat(e.target.value) : undefined as any)}
                className="w-full py-2 bg-transparent border-b border-sand text-ink text-xl focus:border-clay transition-colors rounded-none font-fangsong"
                placeholder="0.0"
              />
            </div>
            <div className="group">
              <label className="block text-[10px] font-bold text-pencil mb-1 font-sans uppercase tracking-widest group-focus-within:text-clay transition-colors">Neutered</label>
               <div className="flex gap-1 pt-1">
                  {[true, false].map((n) => (
                    <button
                      key={n ? 'yes' : 'no'}
                      onClick={() => setProfile({...profile, isNeutered: n})}
                      className={`flex-1 py-1.5 text-sm transition-all duration-300 font-fangsong border-b-2 ${
                        profile.isNeutered === n 
                          ? 'border-ink text-ink font-semibold' 
                          : 'border-transparent text-pencil hover:text-ink/70'
                      }`}
                    >
                      {n ? 'Yes' : 'No'}
                    </button>
                  ))}
               </div>
            </div>
          </div>

          <div className="group">
            <label className="block text-[10px] font-bold text-pencil mb-1 font-sans uppercase tracking-widest group-focus-within:text-clay transition-colors">
              Activity Level
            </label>
            <select
              value={profile.activityLevel || 'neutered_adult'}
              onChange={(e) => handleInputChange('activityLevel', e.target.value)}
              className="w-full py-2 bg-transparent border-b border-sand text-ink text-lg focus:border-clay transition-colors rounded-none font-fangsong"
            >
              <option value="resting">Resting / Inactive</option>
              <option value="neutered_adult">Neutered Adult</option>
              <option value="intact_adult">Intact Adult</option>
              <option value="active">Active / Working</option>
              <option value="highly_active">Highly Active</option>
              <option value="weight_loss">Weight Loss</option>
              <option value="weight_gain">Weight Gain</option>
            </select>
          </div>

          <div className="group">
            <label className="block text-[10px] font-bold text-pencil mb-1 font-sans uppercase tracking-widest group-focus-within:text-clay transition-colors">
              Birth Date
            </label>
            <input
              type="date"
              value={profile.birthDate}
              onChange={(e) => handleInputChange('birthDate', e.target.value)}
              className="w-full py-2 bg-transparent border-b border-sand text-ink text-xl focus:border-clay transition-colors rounded-none font-fangsong"
            />
          </div>

          <div className="group">
            <label className="block text-[10px] font-bold text-pencil mb-1 font-sans uppercase tracking-widest group-focus-within:text-clay transition-colors">
              Microchip ID
            </label>
            <input
              type="text"
              value={profile.microchipId}
              onChange={(e) => handleInputChange('microchipId', e.target.value)}
              className="w-full py-2 bg-transparent border-b border-sand text-ink text-lg font-mono tracking-wide focus:border-clay transition-colors rounded-none placeholder-sand"
              placeholder="000-000-000"
            />
          </div>
        </div>
      </div>

      {/* Vet / Medical Contact */}
      <div className="card-warm rounded-[2rem] p-8 shadow-soft border border-white space-y-6 relative">
         <h3 className="text-xs font-bold tracking-[0.2em] text-gold uppercase flex items-center gap-3 mb-6 font-sans opacity-80">
          <Stethoscope size={14} />
          Care Team
        </h3>

        <div className="space-y-8">
           <div className="group">
            <label className="block text-[10px] font-bold text-pencil mb-1 font-sans uppercase tracking-widest group-focus-within:text-clay transition-colors">Clinic Name</label>
            <input
              type="text"
              value={profile.vetContact?.clinicName || ''}
              onChange={(e) => handleVetChange('clinicName', e.target.value)}
              className="w-full py-2 bg-transparent border-b border-sand text-ink text-xl font-fangsong focus:border-clay transition-colors rounded-none placeholder-sand"
              placeholder="Clinic Name"
            />
          </div>

          <div className="grid grid-cols-2 gap-8">
             <div className="group">
                <label className="block text-[10px] font-bold text-pencil mb-1 font-sans uppercase tracking-widest group-focus-within:text-clay transition-colors">Doctor</label>
                <input
                  type="text"
                  value={profile.vetContact?.doctorName || ''}
                  onChange={(e) => handleVetChange('doctorName', e.target.value)}
                  className="w-full py-2 bg-transparent border-b border-sand text-ink text-lg focus:border-clay transition-colors rounded-none placeholder-sand font-fangsong"
                  placeholder="Dr. Name"
                />
             </div>
             <div className="group">
                <label className="block text-[10px] font-bold text-pencil mb-1 font-sans uppercase tracking-widest group-focus-within:text-clay transition-colors">Phone</label>
                <input
                  type="tel"
                  value={profile.vetContact?.phone || ''}
                  onChange={(e) => handleVetChange('phone', e.target.value)}
                  className="w-full py-2 bg-transparent border-b border-sand text-ink text-lg font-mono focus:border-clay transition-colors rounded-none placeholder-sand"
                  placeholder="Phone Number"
                />
             </div>
          </div>

           <div className="group">
            <label className="block text-[10px] font-bold text-pencil mb-1 font-sans uppercase tracking-widest group-focus-within:text-clay transition-colors">Address</label>
            <input
              type="text"
              value={profile.vetContact?.address || ''}
              onChange={(e) => handleVetChange('address', e.target.value)}
              className="w-full py-2 bg-transparent border-b border-sand text-ink text-lg focus:border-clay transition-colors rounded-none placeholder-sand font-fangsong"
              placeholder="Clinic Address"
            />
          </div>
        </div>
      </div>

      {/* 雲端備份 */}
      <div className="card-warm rounded-[2rem] p-8 shadow-soft border border-white space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-gold/8 to-transparent rounded-bl-[4rem] pointer-events-none" />
        <h3 className="text-xs font-bold tracking-[0.2em] text-gold uppercase flex items-center gap-3 font-sans opacity-80">
          <Cloud size={14} />
          雲端備份
        </h3>

        <div className="space-y-5">
          <div className="group">
            <label className="block text-[10px] font-bold text-pencil mb-1 font-sans uppercase tracking-widest group-focus-within:text-clay transition-colors">
              GitHub Token (PAT)
            </label>
            <div className="relative">
              <input
                type="password"
                value={githubToken}
                onChange={e => handleTokenChange(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxx"
                className="w-full py-2 bg-transparent border-b border-sand text-ink text-sm font-mono focus:border-clay transition-colors rounded-none placeholder-sand/60 pr-6"
              />
              {githubToken && (
                <button type="button" onClick={() => handleTokenChange('')} className="absolute right-0 bottom-2.5 text-pencil/40 hover:text-ink transition-colors">
                  <X size={14} />
                </button>
              )}
            </div>
            <p className="text-[10px] text-pencil/50 mt-1.5 font-sans leading-relaxed">
              GitHub → Settings → Developer settings → Personal access tokens，需勾選 <span className="font-semibold text-pencil/70">gist</span> 權限
            </p>
          </div>

          <div className="group">
            <label className="block text-[10px] font-bold text-pencil mb-1 font-sans uppercase tracking-widest group-focus-within:text-clay transition-colors">
              Gist ID
            </label>
            <div className="relative">
              <input
                type="text"
                value={gistId}
                onChange={e => { setGistId(e.target.value); localStorage.setItem('pawprint_gist_id', e.target.value); }}
                placeholder="首次上傳後自動填入"
                className="w-full py-2 bg-transparent border-b border-sand text-ink text-sm font-mono focus:border-clay transition-colors rounded-none placeholder-sand/60 pr-6"
              />
              {gistId && (
                <button type="button" onClick={() => navigator.clipboard.writeText(gistId)} className="absolute right-0 bottom-2.5 text-pencil/40 hover:text-ink transition-colors" title="複製">
                  <Copy size={14} />
                </button>
              )}
            </div>
            <p className="text-[10px] text-pencil/50 mt-1.5 font-sans">換新裝置時，在新裝置手動貼上此 ID 再按下載還原</p>
          </div>

          {backupStatus && (
            <div className={`flex items-start gap-2.5 text-xs rounded-2xl px-4 py-3 font-fangsong ${
              backupStatus.type === 'success' ? 'bg-sage/10 text-sage border border-sage/20' :
              backupStatus.type === 'error'   ? 'bg-clay/10 text-clay border border-clay/20' :
                                                'bg-sand/20 text-pencil border border-sand/30'
            }`}>
              {backupStatus.type === 'loading'
                ? <RefreshCw size={13} className="flex-shrink-0 mt-0.5 animate-spin" />
                : backupStatus.type === 'success'
                ? <CheckCircle size={13} className="flex-shrink-0 mt-0.5" />
                : <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />}
              {backupStatus.msg}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={handleUpload}
              disabled={backupStatus?.type === 'loading'}
              className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-clay/10 text-clay border border-clay/20 hover:bg-clay/20 transition-all disabled:opacity-50 text-sm font-sans font-semibold tracking-wide"
            >
              <Upload size={14} />
              上傳備份
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={backupStatus?.type === 'loading'}
              className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-sage/10 text-sage border border-sage/20 hover:bg-sage/20 transition-all disabled:opacity-50 text-sm font-sans font-semibold tracking-wide"
            >
              <Download size={14} />
              下載還原
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};