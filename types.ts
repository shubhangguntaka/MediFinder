

export interface Medicine {
  name: string; // Generic name, e.g., Paracetamol
  brands: string[]; // Specific brand names, e.g., ["Calpol", "Dolo 650"]
  stock: number;
}

interface BaseUser {
  email: string;
  fullName?: string;
  displayName?: string;
}

export interface CustomerUser extends BaseUser {
  role: 'user';
  searchHistory?: string[];
}

export interface AuthorUser extends BaseUser {
  role: 'author';
  storeName: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  inventory: Medicine[];
}

export type User = CustomerUser | AuthorUser;

// Type for storing user data in localStorage, including the password
export type StoredUser = (CustomerUser | AuthorUser) & { 
  password_plaintext: string;
  deletionScheduledOn?: number; // Timestamp for when deletion is scheduled
  resetOTP?: {
    code: string;
    expires: number; // Timestamp
  };
};

export interface Pharmacy {
  name: string; // storeName from AuthorUser
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  distance: number; // Distance in kilometers
  medicine: Medicine;
}

export interface BasicStoreInfo {
    name: string;
    address: string;
    location: { lat: number; lng: number };
    distance: number;
}

export interface StoreSearchResult {
    store: Omit<AuthorUser, 'inventory' | 'role' | 'password_plaintext'>;
    inventory: Medicine[];
    distance: number;
}

export interface MedicineInfo {
    description: string;
    primaryUse: string;
    commonForms: string;
}

export interface MedicineSearchResult {
    type: 'medicines';
    data: Pharmacy[];
    medicineInfo: MedicineInfo | null;
    medicineName: string;
}

export type SearchResult = 
    | MedicineSearchResult
    | { type: 'store'; data: StoreSearchResult };