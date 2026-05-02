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
  title: string; // e.g., "Rabies Shot" or "Heartgard"
  location?: string;
  nextDueDate?: string; // For reminders
  notes?: string;
  metrics?: Record<string, number>; // For checkup results like WBC, RBC
  cost?: number; // Added for expense tracking
  photoUrl?: string; // Added for attachments
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
  unit: string; // e.g., 'g', 'pills'
  caloriesPerUnit?: number; // kcal per unit (e.g., per 100g)
  ingredients?: string;
  purchaseLocation?: string; // e.g., 寵物店、網路商店
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
  price?: number;
  notes?: string;
  photoUrl?: string;
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
  photoUrl?: string;
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
  photoUrl?: string;
}

export type TabView = 'dashboard' | 'daily' | 'profile' | 'physical' | 'health' | 'food' | 'finance' | 'shops';