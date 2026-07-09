export interface VetContact {
  clinicName: string;
  doctorName?: string;
  phone: string;
  address: string;
}

export interface PetProfile {
  name: string;
  breed: string;
  gender: 'Male' | 'Female';
  birthDate: string; // ISO string YYYY-MM-DD
  microchipId: string;
  photoUrl: string | null;
  vetContact?: VetContact;
  idealWeight?: number; // kg
  isNeutered?: boolean;
  activityLevel?: 'resting' | 'neutered_adult' | 'intact_adult' | 'active' | 'highly_active' | 'weight_loss' | 'weight_gain';
}

export interface PhysicalRecord {
  id: string;
  date: string;
  weight: number; // kg
  height?: number; // cm
  neck?: number; // cm
  chest?: number; // cm
  back?: number; // cm
  notes?: string;
}

export interface HealthRecord {
  id: string;
  type: 'Vaccine' | 'Deworming' | 'Vet Visit' | 'Checkup' | 'Other';
  date: string;
  title: string;
  location?: string;
  nextDueDate?: string;
  notes?: string;
  metrics?: Record<string, number>;
  cost?: number;
  photoUrl?: string; // legacy
  photos?: string[]; // base64 or external URLs
}

export interface InsurancePolicy {
  id: string;
  name: string;
  provider: string;
  expiryDate: string;
  coverageLimits: { item: string; limit: number; used: number }[];
  claims: { id: string; date: string; amount: number; status: 'Pending' | 'Approved' | 'Rejected' }[];
}

export interface InventoryItem {
  id: string;
  name: string;
  type: 'Food' | 'Supplement';
  expiryDate: string;
  quantity: number;
  unit: string;
  caloriesPerUnit?: number;
  ingredients?: string;
  purchaseLocation?: string;
  purchaseDate?: string;
  dailyUsage?: number; // amount consumed per day (same unit as quantity)
}

export interface PrepaidService {
  id: string;
  name: string;
  type: 'Grooming' | 'Hotel' | 'MedicalFund';
  balance: number;
  expiryDate?: string;
  notes?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface WardrobeItem {
  id: string;
  name: string;
  category: 'Clothing' | 'Accessory' | 'Bag' | 'Other';
  brand?: string;
  color?: string;
  size?: string;
  purchaseDate?: string;
  purchaseSource?: string;
  price?: number;
  notes?: string;
  photoUrl?: string; // legacy
  photos?: string[]; // base64 or external URLs
}

export interface ShopVisitService {
  name: string;
  cost: number;
}

export interface ShopVisit {
  id: string;
  date: string;
  cost: number;
  purpose: string;
  services?: ShopVisitService[];
  notes?: string;
  photoUrl?: string; // legacy
  photos?: string[]; // base64 or external URLs
}

export interface PetShop {
  id: string;
  name: string;
  type: string;
  pricingInfo?: string;
  contact?: string;
  notes?: string;
  visits: ShopVisit[];
}

export interface DailyLog {
  id: string;
  date: string;
  foodIntake?: string;
  waterIntake?: string;
  potty?: 'Normal' | 'Diarrhea' | 'Constipation' | 'None';
  notes?: string;
  photoUrl?: string; // legacy
  photos?: string[]; // base64 or external URLs
}

export type TabView = 'dashboard' | 'daily' | 'profile' | 'physical' | 'health' | 'food' | 'finance' | 'shops';

export interface PetData {
  id: string;
  profile: PetProfile;
  physicalRecords: PhysicalRecord[];
  healthRecords: HealthRecord[];
  inventoryItems: InventoryItem[];
  policies: InsurancePolicy[];
  services: PrepaidService[];
  shops: PetShop[];
  dailyLogs: DailyLog[];
  wardrobeItems: WardrobeItem[];
}
