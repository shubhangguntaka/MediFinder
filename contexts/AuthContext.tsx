
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import type { User, StoredUser, AuthorUser, Medicine, CustomerUser } from '../types';
import { geocodeAddress } from '../services/geminiService';
import { seedInitialData } from '../services/seedData';
import { useToast } from './ToastContext';

interface RegisterData {
    email: string;
    password_plaintext: string;
    role: 'user' | 'author';
    storeName?: string;
    address?: string;
    location?: { lat: number; lng: number };
}

interface ProfileUpdateData {
    fullName?: string;
    displayName?: string;
    email?: string;
    storeName?: string;
    address?: string;
    location?: { lat: number; lng: number };
}

interface PasswordChangeData {
    currentPassword_plaintext: string;
    newPassword_plaintext: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password_plaintext: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateInventory: (newInventory: Medicine[]) => Promise<void>;
  updateProfile: (data: ProfileUpdateData) => Promise<{ success: boolean; error?: string }>;
  changePassword: (data: PasswordChangeData) => Promise<{ success: boolean; error?: string }>;
  deleteAccount: (password: string) => Promise<{ success: boolean; error?: string }>;
  addSearchTerm: (term: string) => void;
  isProcessing: boolean;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  verifyPasswordResetOTP: (email: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string, newPassword_plaintext: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper functions to interact with localStorage
const getUsersFromStorage = (): StoredUser[] => {
    try {
        const users = localStorage.getItem('medifind_users');
        return users ? JSON.parse(users) : [];
    } catch (e) {
        return [];
    }
};

const saveUsersToStorage = (users: StoredUser[]) => {
    localStorage.setItem('medifind_users', JSON.stringify(users));
};

const getSessionFromStorage = (): User | null => {
    try {
        const session = localStorage.getItem('medifind_session');
        if (!session) return null;
        const parsed = JSON.parse(session);
        // Ensure users with scheduled deletion can't log in
        const allUsers = getUsersFromStorage();
        const storedUser = allUsers.find(u => u.email === parsed.email);
        if (storedUser?.deletionScheduledOn) return null;
        return parsed;
    } catch (e) {
        return null;
    }
};

const saveSessionToStorage = (user: User) => {
    localStorage.setItem('medifind_session', JSON.stringify(user));
};

const clearSessionFromStorage = () => {
    localStorage.removeItem('medifind_session');
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    // Seed data on initial load if no users exist
    seedInitialData();
    
    const session = getSessionFromStorage();
    if (session) {
      setUser(session);
    }
    setIsInitialized(true);
  }, []);

  const register = async (data: RegisterData) => {
    setIsProcessing(true);

    const users = getUsersFromStorage();
    if (users.find(u => u.email.toLowerCase() === data.email.toLowerCase())) {
        showToast('An account with this email already exists.', 'error');
        setIsProcessing(false);
        return;
    }
    
    let newUser: StoredUser;
    if (data.role === 'author') {
        if (!data.storeName || !data.address) {
            showToast('Store Name and Address are required for owners.', 'error');
            setIsProcessing(false);
            return;
        }
        // Use provided location from map if available, otherwise geocode the address
        const location = data.location ?? await geocodeAddress(data.address);
        newUser = {
            email: data.email,
            password_plaintext: data.password_plaintext,
            role: 'author',
            storeName: data.storeName,
            address: data.address,
            location: location,
            inventory: [],
            fullName: '',
            displayName: data.storeName,
        };
    } else {
        newUser = {
            email: data.email,
            password_plaintext: data.password_plaintext,
            role: 'user',
            searchHistory: [],
            fullName: '',
            displayName: data.email.split('@')[0],
        };
    }
    
    users.push(newUser);
    saveUsersToStorage(users);
    
    const sessionUser: User = newUser;
    saveSessionToStorage(sessionUser);
    setUser(sessionUser);
    showToast('Registration successful!', 'success');
    setIsProcessing(false);
  };

  const login = async (email: string, password_plaintext: string) => {
    setIsProcessing(true);
    const users = getUsersFromStorage();
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (foundUser?.deletionScheduledOn) {
        showToast('This account is scheduled for deletion.', 'error');
        setIsProcessing(false);
        return;
    }

    if (foundUser && foundUser.password_plaintext === password_plaintext) {
        const sessionUser: User = { ...foundUser };
        saveSessionToStorage(sessionUser);
        setUser(sessionUser);
        showToast('Login successful!', 'success');
    } else {
        showToast('Invalid email or password.', 'error');
    }
    setIsProcessing(false);
  };

  const logout = () => {
    clearSessionFromStorage();
    setUser(null);
  };

  const updateInventory = async (newInventory: Medicine[]) => {
    if (!user || user.role !== 'author') return;
    
    const users = getUsersFromStorage();
    const userIndex = users.findIndex(u => u.email === user.email);

    if (userIndex !== -1) {
        const updatedAuthor = { ...(users[userIndex] as AuthorUser), inventory: newInventory };
        
        users[userIndex] = updatedAuthor as StoredUser;
        saveUsersToStorage(users);
        
        saveSessionToStorage(updatedAuthor);
        setUser(updatedAuthor);
        showToast('Inventory updated successfully!', 'success');
    }
  };

  const updateProfile = async (data: ProfileUpdateData) => {
    if (!user) return { success: false, error: 'Not logged in.' };

    const allUsers = getUsersFromStorage();
    const userIndex = allUsers.findIndex(u => u.email === user.email);

    if (userIndex === -1) {
      showToast('User not found.', 'error');
      return { success: false, error: 'User not found.' };
    }

    if (data.email && data.email.toLowerCase() !== user.email.toLowerCase()) {
      const emailExists = allUsers.some(u => u.email.toLowerCase() === data.email!.toLowerCase());
      if (emailExists) {
        showToast('This email is already taken.', 'error');
        return { success: false, error: 'This email is already taken.' };
      }
    }

    const updatedUser = { ...allUsers[userIndex] };

    if (data.fullName !== undefined) updatedUser.fullName = data.fullName;
    if (data.displayName !== undefined) updatedUser.displayName = data.displayName;
    if (data.email) updatedUser.email = data.email;

    if (updatedUser.role === 'author') {
      const originalAuthor = allUsers[userIndex] as AuthorUser;
      if (data.storeName) updatedUser.storeName = data.storeName;
      if (data.address) updatedUser.address = data.address;
      
      if (data.location) {
        // If coordinates are provided directly from the map, use them.
        updatedUser.location = data.location;
      } else if (data.address && data.address !== originalAuthor.address) {
        // If only the address string was changed, geocode it.
        try {
          updatedUser.location = await geocodeAddress(data.address);
        } catch (error: any) {
          const errorMessage = error.message || "Could not validate the new address.";
          showToast(errorMessage, 'error');
          return { success: false, error: errorMessage };
        }
      }
    }
    
    allUsers[userIndex] = updatedUser;
    saveUsersToStorage(allUsers);
    
    const newSessionUser: User = { ...updatedUser };
    saveSessionToStorage(newSessionUser);
    setUser(newSessionUser);
    showToast('Profile updated successfully!', 'success');
    return { success: true };
  };
  
  const changePassword = async ({ currentPassword_plaintext, newPassword_plaintext }: PasswordChangeData) => {
    if (!user) return { success: false, error: 'Not logged in.' };
    const allUsers = getUsersFromStorage();
    const userIndex = allUsers.findIndex(u => u.email === user.email);

    if (userIndex === -1) {
        showToast('User not found.', 'error');
        return { success: false, error: 'User not found.' };
    }

    const storedUser = allUsers[userIndex];
    if (storedUser.password_plaintext !== currentPassword_plaintext) {
      showToast('Incorrect current password.', 'error');
      return { success: false, error: 'Incorrect current password.' };
    }
    
    storedUser.password_plaintext = newPassword_plaintext;
    allUsers[userIndex] = storedUser;
    saveUsersToStorage(allUsers);
    showToast('Password changed successfully!', 'success');
    return { success: true };
  };

  const deleteAccount = async (password: string) => {
    if (!user) return { success: false, error: 'Not logged in.' };

    const allUsers = getUsersFromStorage();
    const userIndex = allUsers.findIndex(u => u.email === user.email);

    if (userIndex === -1) {
        showToast('User not found.', 'error');
        return { success: false, error: 'User not found.' };
    }

    if (allUsers[userIndex].password_plaintext !== password) {
        showToast('Incorrect password.', 'error');
        return { success: false, error: 'Incorrect password.' };
    }

    // Schedule deletion for 1 week from now
    const oneWeekFromNow = Date.now() + 7 * 24 * 60 * 60 * 1000;
    allUsers[userIndex].deletionScheduledOn = oneWeekFromNow;
    saveUsersToStorage(allUsers);
    
    logout();
    showToast('Account deletion scheduled. You have been logged out.', 'info');
    return { success: true };
  };

  const addSearchTerm = (term: string) => {
    if (!user || user.role !== 'user') return;

    // Deduplicate and keep latest 10, case-insensitive
    const lowerCaseTerm = term.toLowerCase();
    const existingHistory = (user as CustomerUser).searchHistory || [];
    const updatedHistory = [term, ...existingHistory.filter(t => t.toLowerCase() !== lowerCaseTerm)].slice(0, 10);
    
    const updatedUser: User = { ...user, searchHistory: updatedHistory };

    // Update localStorage
    const allUsers = getUsersFromStorage();
    const userIndex = allUsers.findIndex(u => u.email === user.email);
    if (userIndex > -1) {
        (allUsers[userIndex] as CustomerUser).searchHistory = updatedHistory;
        saveUsersToStorage(allUsers);
    }
    
    // Update session and state
    saveSessionToStorage(updatedUser);
    setUser(updatedUser);
  };

  const requestPasswordReset = async (email: string) => {
    setIsProcessing(true);
    const users = getUsersFromStorage();
    const userIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());

    if (userIndex === -1) {
        showToast('No account found with that email address.', 'error');
        setIsProcessing(false);
        return { success: false, error: 'No account found with that email address.' };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

    users[userIndex].resetOTP = { code: otp, expires };
    saveUsersToStorage(users);

    showToast(`OTP sent to ${email}. (DEV: ${otp})`, 'info');
    
    setIsProcessing(false);
    return { success: true };
  };

  const verifyPasswordResetOTP = async (email: string, otp: string) => {
    setIsProcessing(true);
    const users = getUsersFromStorage();
    const userIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (userIndex === -1) {
        showToast('An unexpected error occurred.', 'error');
        setIsProcessing(false);
        return { success: false, error: 'An unexpected error occurred.' };
    }

    const user = users[userIndex];
    if (!user.resetOTP || user.resetOTP.code !== otp) {
        showToast('Invalid OTP.', 'error');
        setIsProcessing(false);
        return { success: false, error: 'Invalid OTP.' };
    }

    if (Date.now() > user.resetOTP.expires) {
      delete user.resetOTP;
      saveUsersToStorage(users);
      showToast('OTP has expired. Please request a new one.', 'error');
      setIsProcessing(false);
      return { success: false, error: 'OTP has expired. Please request a new one.' };
    }

    setIsProcessing(false);
    return { success: true };
  };

  const resetPassword = async (email: string, newPassword_plaintext: string) => {
      setIsProcessing(true);
      const users = getUsersFromStorage();
      const userIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());

      if (userIndex === -1) {
          showToast('An unexpected error occurred.', 'error');
          setIsProcessing(false);
          return { success: false, error: 'An unexpected error occurred.' };
      }
      
      const user = users[userIndex];
      user.password_plaintext = newPassword_plaintext;
      delete user.resetOTP;
      
      users[userIndex] = user;
      saveUsersToStorage(users);
      
      showToast('Password has been reset successfully. Please sign in.', 'success');
      setIsProcessing(false);
      return { success: true };
  };

  if (!isInitialized) {
      return null; // or a loading spinner
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateInventory, addSearchTerm, updateProfile, deleteAccount, changePassword, isProcessing, requestPasswordReset, verifyPasswordResetOTP, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
