
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AuthorUser } from '../types';
import { CloseIcon, PillIcon, StoreIcon, LocationIcon, UserIcon, IdentificationIcon } from './icons';
import MapSelector from './MapSelector';

interface EditProfileModalProps {
  onClose: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ onClose }) => {
  const { user, updateProfile } = useAuth();
  
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [storeName, setStoreName] = useState(user?.role === 'author' ? (user as AuthorUser).storeName : '');
  const [address, setAddress] = useState(user?.role === 'author' ? (user as AuthorUser).address : '');
  
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  
  const [isProcessing, setIsProcessing] = useState(false);

  const handleLocationSelect = (selected: { lat: number; lng: number; address: string }) => {
    setAddress(selected.address);
    setLocation({ lat: selected.lat, lng: selected.lng });
    setIsMapOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    const updateData: any = { fullName, displayName, email };
    if (user?.role === 'author') {
      updateData.storeName = storeName;
      updateData.address = address;
      if (location) {
        updateData.location = location;
      }
    }

    const result = await updateProfile(updateData);

    if (result.success) {
      setTimeout(() => {
        onClose();
      }, 500); // Close modal shortly after success toast appears
    }
    
    setIsProcessing(false);
  };

  if (!user) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm" aria-modal="true" role="dialog">
        <div className="relative w-full max-w-md p-8 m-4 bg-white dark:bg-slate-800 rounded-2xl shadow-xl">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors" aria-label="Close edit profile modal" title="Close">
            <CloseIcon className="w-6 h-6" />
          </button>
          
          <div className="text-center mb-6">
              <PillIcon className="w-10 h-10 mx-auto text-primary-600" />
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 tracking-tight mt-3">Edit Profile</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <fieldset disabled={isProcessing} className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="fullName"><UserIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />Full Name</label>
                <input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g., Jane Doe" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="displayName"><IdentificationIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />Display Name</label>
                <input id="displayName" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g., Jane D." className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="email">Email Address</label>
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
              </div>
              
              {user.role === 'author' && (
                <>
                  <div className="border-t dark:border-slate-700 pt-4">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="storeName"><StoreIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />Store Name</label>
                    <input id="storeName" type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="address"><LocationIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />Store Address</label>
                      <button type="button" onClick={() => setIsMapOpen(true)} className="text-xs font-semibold text-primary-600 hover:underline">Select on Map</button>
                    </div>
                    <textarea 
                      id="address" 
                      value={address} 
                      onChange={(e) => {
                        setAddress(e.target.value);
                        setLocation(null); // Reset coords if address is manually changed
                      }} 
                      required 
                      rows={2} 
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    />
                  </div>
                </>
              )}

              <div className="pt-2">
                <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-400 disabled:cursor-wait">
                  {isProcessing ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </fieldset>
          </form>
        </div>
      </div>
      {isMapOpen && <MapSelector onClose={() => setIsMapOpen(false)} onLocationSelect={handleLocationSelect} />}
    </>
  );
};

export default EditProfileModal;
