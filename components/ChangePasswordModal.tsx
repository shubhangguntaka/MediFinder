
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CloseIcon, KeyIcon } from './icons';

interface ChangePasswordModalProps {
  onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ onClose }) => {
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setIsProcessing(true);
    const result = await changePassword({
      currentPassword_plaintext: currentPassword,
      newPassword_plaintext: newPassword,
    });

    if (result.success) {
      setSuccess('Password changed successfully!');
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setError(result.error || 'Failed to change password.');
    }
    setIsProcessing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm" aria-modal="true" role="dialog">
      <div className="relative w-full max-w-md p-8 m-4 bg-white dark:bg-slate-800 rounded-2xl shadow-xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors" aria-label="Close change password modal" title="Close">
          <CloseIcon className="w-6 h-6" />
        </button>
        
        <div className="text-center mb-6">
            <KeyIcon className="w-10 h-10 mx-auto text-primary-600" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 tracking-tight mt-3">Change Password</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset disabled={isProcessing} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="currentPassword">Current Password</label>
              <input id="currentPassword" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="••••••••" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="newPassword">New Password</label>
              <input id="newPassword" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="••••••••" />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="confirmPassword">Confirm New Password</label>
              <input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="••••••••" />
            </div>

            {error && <p className="text-sm text-red-600 text-center bg-red-50 p-2 rounded-md dark:bg-red-900/30 dark:text-red-400">{error}</p>}
            {success && <p className="text-sm text-green-600 text-center bg-green-50 p-2 rounded-md dark:bg-green-900/30 dark:text-green-400">{success}</p>}

            <div className="pt-2">
              <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-400 disabled:cursor-wait">
                {isProcessing ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </fieldset>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
