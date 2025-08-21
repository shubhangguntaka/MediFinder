
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import type { User, StoredUser, AuthorUser, Medicine, CustomerUser } from '../types';
import { geocodeAddress } from '../services/geminiService';
import { seedInitialData } from '../services/seedData';

interface RegisterData {
    email: string;
    password_plaintext: string;
    role: 'user' | 'author';
    storeName?: string;
    address?: string;
}

interface ProfileUpdateData {
    fullName?: string;
    displayName?: string;
    email?: string;
    storeName?: string;
    address?: string;
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
  error: string | null;
  clearError: () => void;
  isProcessing: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper functions to interact with localStorage
const getUsersFromStorage = (): StoredUser[] => {
    try {
        const users = localStorage.getItem('medifinder_users');
        return users ? JSON.parse(users) : [];
    } catch (e) {
        return [];
    }
};

const saveUsersToStorage = (users: StoredUser[]) => {
    localStorage.setItem('medifinder_users', JSON.stringify(users));
};

const getSessionFromStorage = (): User | null => {
    try {
        const session = localStorage.getItem('medifinder_session');
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
    localStorage.setItem('medifinder_session', JSON.stringify(user));
};

const clearSessionFromStorage = () => {
    localStorage.removeItem('medifinder_session');
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Seed data on initial load if no users exist
    seedInitialData();
    
    const session = getSessionFromStorage();
    if (session) {
      setUser(session);
    }
    setIsInitialized(true);
  }, []);

  const clearError = () => setError(null);

  const register = async (data: RegisterData) => {
    setError(null);
    setIsProcessing(true);

    const users = getUsersFromStorage();
    if (users.find(u => u.email.toLowerCase() === data.email.toLowerCase())) {
        setError('An account with this email already exists.');
        setIsProcessing(false);
        return;
    }
    
    let newUser: StoredUser;
    if (data.role === 'author') {
        if (!data.storeName || !data.address) {
            setError('Store Name and Address are required for owners.');
            setIsProcessing(false);
            return;
        }
        const location = await geocodeAddress(data.address);
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
    setIsProcessing(false);
  };

  const login = async (email: string, password_plaintext: string) => {
    setError(null);
    setIsProcessing(true);
    const users = getUsersFromStorage();
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (foundUser?.deletionScheduledOn) {
        setError('This account is scheduled for deletion.');
        setIsProcessing(false);
        return;
    }

    if (foundUser && foundUser.password_plaintext === password_plaintext) {
        const sessionUser: User = { ...foundUser };
        saveSessionToStorage(sessionUser);
        setUser(sessionUser);
    } else {
        setError('Invalid email or password.');
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
    }
  };

  const updateProfile = async (data: ProfileUpdateData) => {
    if (!user) return { success: false, error: 'Not logged in.' };

    const allUsers = getUsersFromStorage();
    const userIndex = allUsers.findIndex(u => u.email === user.email);

    if (userIndex === -1) {
      return { success: false, error: 'User not found.' };
    }

    if (data.email && data.email.toLowerCase() !== user.email.toLowerCase()) {
      const emailExists = allUsers.some(u => u.email.toLowerCase() === data.email!.toLowerCase());
      if (emailExists) {
        return { success: false, error: 'This email is already taken.' };
      }
    }

    const updatedUser = { ...allUsers[userIndex] };

    if (data.fullName !== undefined) updatedUser.fullName = data.fullName;
    if (data.displayName !== undefined) updatedUser.displayName = data.displayName;
    if (data.email) updatedUser.email = data.email;

    if (updatedUser.role === 'author') {
      if (data.storeName) updatedUser.storeName = data.storeName;
      if (data.address && data.address !== updatedUser.address) {
        updatedUser.address = data.address;
        updatedUser.location = await geocodeAddress(data.address);
      }
    }
    
    allUsers[userIndex] = updatedUser;
    saveUsersToStorage(allUsers);
    
    const newSessionUser: User = { ...updatedUser };
    saveSessionToStorage(newSessionUser);
    setUser(newSessionUser);

    return { success: true };
  };
  
  const changePassword = async ({ currentPassword_plaintext, newPassword_plaintext }: PasswordChangeData) => {
    if (!user) return { success: false, error: 'Not logged in.' };
    const allUsers = getUsersFromStorage();
    const userIndex = allUsers.findIndex(u => u.email === user.email);

    if (userIndex === -1) return { success: false, error: 'User not found.' };

    const storedUser = allUsers[userIndex];
    if (storedUser.password_plaintext !== currentPassword_plaintext) {
      return { success: false, error: 'Incorrect current password.' };
    }
    
    storedUser.password_plaintext = newPassword_plaintext;
    allUsers[userIndex] = storedUser;
    saveUsersToStorage(allUsers);

    return { success: true };
  };

  const deleteAccount = async (password: string) => {
    if (!user) return { success: false, error: 'Not logged in.' };

    const allUsers = getUsersFromStorage();
    const userIndex = allUsers.findIndex(u => u.email === user.email);

    if (userIndex === -1) {
        return { success: false, error: 'User not found.' };
    }

    if (allUsers[userIndex].password_plaintext !== password) {
        return { success: false, error: 'Incorrect password.' };
    }

    // Schedule deletion for 1 week from now
    const oneWeekFromNow = Date.now() + 7 * 24 * 60 * 60 * 1000;
    allUsers[userIndex].deletionScheduledOn = oneWeekFromNow;
    saveUsersToStorage(allUsers);
    
    logout();
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

  if (!isInitialized) {
      return null; // or a loading spinner
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, error, clearError, updateInventory, addSearchTerm, updateProfile, deleteAccount, changePassword, isProcessing }}>
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