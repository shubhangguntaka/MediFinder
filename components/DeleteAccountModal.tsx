
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CloseIcon, TrashIcon } from './icons';

interface DeleteAccountModalProps {
  onClose: () => void;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ onClose }) => {
  const { deleteAccount } = useAuth();
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!password) {
        setError('Password is required to delete your account.');
        return;
    }
    setIsProcessing(true);
    const result = await deleteAccount(password);
    if (!result.success) {
        setError(result.error || 'An error occurred.');
        setIsProcessing(false);
    } else {
        // On success, the AuthProvider logs the user out, which will unmount this component.
        // No need to call onClose().
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm" aria-modal="true" role="dialog">
      <div className="relative w-full max-w-md p-8 m-4 bg-white dark:bg-slate-800 rounded-2xl shadow-xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors" aria-label="Close delete account modal" title="Close">
          <CloseIcon className="w-6 h-6" />
        </button>
        
        <div className="text-center mb-6">
            <TrashIcon className="w-10 h-10 mx-auto text-red-500" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 tracking-tight mt-3">Delete Account</h2>
        </div>

        <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-4">
            This action is permanent and cannot be undone. Your account will be deleted after one week. To confirm, please enter your password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset disabled={isProcessing} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="password">Password</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="••••••••" />
            </div>

            {error && <p className="text-sm text-red-600 text-center bg-red-50 p-2 rounded-md dark:bg-red-900/30 dark:text-red-400">{error}</p>}

            <div className="pt-2 flex flex-col sm:flex-row-reverse gap-3">
              <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-400 disabled:cursor-wait">
                {isProcessing ? 'Deleting...' : 'Delete My Account'}
              </button>
               <button type="button" onClick={onClose} className="w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500">
                Cancel
              </button>
            </div>
          </fieldset>
        </form>
      </div>
    </div>
  );
};

export default DeleteAccountModal;
