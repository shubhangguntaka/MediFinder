
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PillIcon, UserCircleIcon, ClipboardListIcon, StoreIcon, LocationIcon, CloseIcon } from './icons';

interface LoginPageProps {
    onClose: () => void;
}


const LoginPage: React.FC<LoginPageProps> = ({ onClose }) => {
  const [isRegisterView, setIsRegisterView] = useState(false);
  const { login, register, error, clearError, isProcessing } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'author'>('user');
  const [storeName, setStoreName] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    clearError();
  }, [isRegisterView, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;

    if (isRegisterView) {
      await register({ email, password_plaintext: password, role, storeName, address });
    } else {
      await login(email, password);
    }
  };

  const toggleView = () => {
    setIsRegisterView(!isRegisterView);
    clearError();
    setEmail('');
    setPassword('');
    setStoreName('');
    setAddress('');
    setRole('user');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-sm p-4 fixed inset-0 z-50">
        
      <div className="w-full max-w-md mx-auto bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" aria-label="Close login form" title="Close">
            <CloseIcon className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
            <PillIcon className="w-12 h-12 mx-auto text-primary-600" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 tracking-tight mt-3">
              {isRegisterView ? 'Create Your Account' : 'Welcome Back'}
            </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset disabled={isProcessing} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="email">Email Address</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="password">Password</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="••••••••" />
            </div>
            
            {isRegisterView && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">I am a...</label>
                  <div className="flex gap-4">
                    <button type="button" onClick={() => setRole('user')} className={`flex-1 p-3 border-2 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold ${role === 'user' ? 'bg-primary-50 border-primary-500 text-primary-700 dark:bg-primary-900/50 dark:border-primary-500 dark:text-primary-300' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-600'}`}>
                        <UserCircleIcon className={`w-6 h-6 ${role === 'user' ? 'text-primary-600' : 'text-gray-400'}`} />
                        <span>Customer</span>
                    </button>
                    <button type="button" onClick={() => setRole('author')} className={`flex-1 p-3 border-2 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold ${role === 'author' ? 'bg-slate-100 border-slate-500 text-slate-700 dark:bg-slate-600 dark:border-slate-400 dark:text-slate-200' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-600'}`}>
                        <ClipboardListIcon className={`w-6 h-6 ${role === 'author' ? 'text-slate-600' : 'text-gray-400'}`} />
                        <span>Pharmacy Owner</span>
                    </button>
                  </div>
                </div>

                {role === 'author' && (
                  <div className="space-y-4 border-t dark:border-slate-700 pt-4">
                     <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="storeName"><StoreIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />Store Name</label>
                        <input id="storeName" type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="e.g., City Central Pharmacy" />
                    </div>
                     <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="address"><LocationIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />Store Address</label>
                        <input id="address" type="text" value={address} onChange={(e) => setAddress(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="e.g., 123 Main St, San Francisco, CA" />
                    </div>
                  </div>
                )}
              </>
            )}
            
            {error && <p className="text-sm text-red-600 text-center bg-red-50 p-2 rounded-md dark:bg-red-900/30 dark:text-red-400">{error}</p>}

            <div>
              <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-400 disabled:cursor-wait">
                {isProcessing ? (isRegisterView ? 'Registering...' : 'Signing In...') : (isRegisterView ? 'Register' : 'Sign In')}
              </button>
            </div>
          </fieldset>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          {isRegisterView ? 'Already have an account?' : "Don't have an account?"}
          <button onClick={toggleView} disabled={isProcessing} className="ml-1 font-medium text-primary-600 hover:text-primary-500 disabled:text-gray-400">
            {isRegisterView ? 'Sign In' : 'Register'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
