import React, { useRef } from 'react';
import { PetProfile } from '../types';
import { calculateAge } from '../utils';
import { Camera, Award, Stethoscope } from 'lucide-react';

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

  return (
    <div className="flex flex-col gap-8 animate-fade-in pb-8">
      {/* Photo & Main Info Card */}
      <div className="flex flex-col items-center text-center relative pt-4 pb-2">
        
        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <div className="w-44 h-44 rounded-full shadow-soft border-[6px] border-white bg-white overflow-hidden relative transform transition-all duration-500 hover:scale-[1.02] hover:shadow-float">
            {profile.photoUrl ? (
              <img src={profile.photoUrl} alt="Pet" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-sand/20 text-warm">
                <Camera size={32} strokeWidth={1.5} />
              </div>
            )}
             <div className="absolute inset-0 bg-ink/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px]">
               <span className="text-white text-xs font-medium tracking-widest uppercase drop-shadow-md">更換照片 Change</span>
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
            placeholder="名字 Pet Name"
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
      <div className="bg-white/80 backdrop-blur-sm rounded-[2rem] p-8 shadow-soft border border-white space-y-8 relative overflow-hidden">
        {/* Decorative corner */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-sand/20 to-transparent rounded-bl-[4rem] pointer-events-none"></div>

        <h3 className="text-xs font-bold tracking-[0.2em] text-gold uppercase flex items-center gap-3 mb-6 font-sans opacity-80">
          <Award size={14} />
          基本資料 Identity
        </h3>
        
        <div className="grid grid-cols-1 gap-8">
          <div className="grid grid-cols-2 gap-8">
             <div className="group">
              <label className="block text-[10px] font-bold text-pencil mb-1 font-sans uppercase tracking-widest group-focus-within:text-clay transition-colors">品種 Breed</label>
              <input
                type="text"
                value={profile.breed}
                onChange={(e) => handleInputChange('breed', e.target.value)}
                className="w-full py-2 bg-transparent border-b border-sand text-ink text-xl focus:border-clay transition-colors rounded-none font-fangsong placeholder-sand"
                placeholder="未知 Unknown"
              />
            </div>

            <div className="group">
              <label className="block text-[10px] font-bold text-pencil mb-1 font-sans uppercase tracking-widest group-focus-within:text-clay transition-colors">性別 Gender</label>
               <div className="flex gap-1 pt-1">
                  {(['Male', 'Female', 'Other'] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => setProfile({...profile, gender: g})}
                      className={`flex-1 py-1.5 text-sm transition-all duration-300 font-fangsong border-b-2 ${
                        profile.gender === g 
                          ? 'border-ink text-ink font-semibold' 
                          : 'border-transparent text-pencil hover:text-ink/70'
                      }`}
                    >
                      {g === 'Male' ? '男生 Male' : g === 'Female' ? '女生 Female' : '其他 Other'}
                    </button>
                  ))}
               </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="group">
              <label className="block text-[10px] font-bold text-pencil mb-1 font-sans uppercase tracking-widest group-focus-within:text-clay transition-colors">
                理想體重 Ideal Weight (kg)
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
              <label className="block text-[10px] font-bold text-pencil mb-1 font-sans uppercase tracking-widest group-focus-within:text-clay transition-colors">結紮 Neutered</label>
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
                      {n ? '是 Yes' : '否 No'}
                    </button>
                  ))}
               </div>
            </div>
          </div>

          <div className="group">
            <label className="block text-[10px] font-bold text-pencil mb-1 font-sans uppercase tracking-widest group-focus-within:text-clay transition-colors">
              活動量 Activity Level
            </label>
            <select
              value={profile.activityLevel || 'neutered_adult'}
              onChange={(e) => handleInputChange('activityLevel', e.target.value)}
              className="w-full py-2 bg-transparent border-b border-sand text-ink text-lg focus:border-clay transition-colors rounded-none font-fangsong"
            >
              <option value="resting">休息 / 不活躍 Resting / Inactive</option>
              <option value="neutered_adult">已結紮成犬 (正常) Neutered Adult (Normal)</option>
              <option value="intact_adult">未結紮成犬 (正常) Intact Adult (Normal)</option>
              <option value="active">活躍 / 工作犬 Active / Working</option>
              <option value="highly_active">非常活躍 Highly Active</option>
              <option value="weight_loss">需要減重 Weight Loss Needed</option>
              <option value="weight_gain">需要增重 Weight Gain Needed</option>
            </select>
          </div>

          <div className="group">
            <label className="block text-[10px] font-bold text-pencil mb-1 font-sans uppercase tracking-widest group-focus-within:text-clay transition-colors">
              生日 Birth Date
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
              晶片號碼 Microchip ID
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
      <div className="bg-white/80 backdrop-blur-sm rounded-[2rem] p-8 shadow-soft border border-white space-y-6 relative">
         <h3 className="text-xs font-bold tracking-[0.2em] text-gold uppercase flex items-center gap-3 mb-6 font-sans opacity-80">
          <Stethoscope size={14} />
          醫療團隊 Care Team
        </h3>

        <div className="space-y-8">
           <div className="group">
            <label className="block text-[10px] font-bold text-pencil mb-1 font-sans uppercase tracking-widest group-focus-within:text-clay transition-colors">診所名稱 Clinic Name</label>
            <input
              type="text"
              value={profile.vetContact?.clinicName || ''}
              onChange={(e) => handleVetChange('clinicName', e.target.value)}
              className="w-full py-2 bg-transparent border-b border-sand text-ink text-xl font-fangsong focus:border-clay transition-colors rounded-none placeholder-sand"
              placeholder="診所名稱 Clinic Name"
            />
          </div>

          <div className="grid grid-cols-2 gap-8">
             <div className="group">
                <label className="block text-[10px] font-bold text-pencil mb-1 font-sans uppercase tracking-widest group-focus-within:text-clay transition-colors">醫生 Doctor</label>
                <input
                  type="text"
                  value={profile.vetContact?.doctorName || ''}
                  onChange={(e) => handleVetChange('doctorName', e.target.value)}
                  className="w-full py-2 bg-transparent border-b border-sand text-ink text-lg focus:border-clay transition-colors rounded-none placeholder-sand font-fangsong"
                  placeholder="醫生名字 Dr. Name"
                />
             </div>
             <div className="group">
                <label className="block text-[10px] font-bold text-pencil mb-1 font-sans uppercase tracking-widest group-focus-within:text-clay transition-colors">電話 Phone</label>
                <input
                  type="tel"
                  value={profile.vetContact?.phone || ''}
                  onChange={(e) => handleVetChange('phone', e.target.value)}
                  className="w-full py-2 bg-transparent border-b border-sand text-ink text-lg font-mono focus:border-clay transition-colors rounded-none placeholder-sand"
                  placeholder="電話號碼 Number"
                />
             </div>
          </div>

           <div className="group">
            <label className="block text-[10px] font-bold text-pencil mb-1 font-sans uppercase tracking-widest group-focus-within:text-clay transition-colors">地址 Address</label>
            <input
              type="text"
              value={profile.vetContact?.address || ''}
              onChange={(e) => handleVetChange('address', e.target.value)}
              className="w-full py-2 bg-transparent border-b border-sand text-ink text-lg focus:border-clay transition-colors rounded-none placeholder-sand font-fangsong"
              placeholder="診所地址 Clinic Address"
            />
          </div>
        </div>
      </div>
    </div>
  );
};