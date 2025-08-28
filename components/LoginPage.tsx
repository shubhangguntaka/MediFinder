
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { PillIcon, UserCircleIcon, ClipboardListIcon, CloseIcon, ArrowLeftIcon } from './icons';
import MapSelector from './MapSelector';

interface LoginPageProps {
    onClose: () => void;
}

type View = 'signin' | 'register' | 'forgot_email' | 'forgot_otp' | 'forgot_password';

const LoginPage: React.FC<LoginPageProps> = ({ onClose }) => {
  const [view, setView] = useState<View>('signin');
  const { login, register, isProcessing, requestPasswordReset, verifyPasswordResetOTP, resetPassword } = useAuth();
  const { showToast } = useToast();

  // Common state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register specific state
  const [role, setRole] = useState<'user' | 'author'>('user');
  const [storeName, setStoreName] = useState('');
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number} | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  
  // Forgot password specific state
  const [resetEmail, setResetEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    // This effect can be removed as toasts handle errors now
  }, [view]);
  
  const resetFormState = () => {
    setEmail('');
    setPassword('');
    setStoreName('');
    setAddress('');
    setLocation(null);
    setRole('user');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleSetView = (newView: View) => {
      resetFormState();
      setView(newView);
  };

  const handleLocationSelect = (selected: { lat: number, lng: number, address: string }) => {
    setAddress(selected.address);
    setLocation({ lat: selected.lat, lng: selected.lng });
    setIsMapOpen(false);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    await login(email, password);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    if (password.length < 6) {
        showToast("Password must be at least 6 characters long.", 'error');
        return;
    }
    await register({ email, password_plaintext: password, role, storeName, address, location: location ?? undefined });
  };
  
  const handleForgotEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    const result = await requestPasswordReset(email);
    if (result.success) {
        setResetEmail(email);
        setView('forgot_otp');
    }
  };

  const handleForgotOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    const result = await verifyPasswordResetOTP(resetEmail, otp);
    if (result.success) {
        setView('forgot_password');
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    
    if(newPassword.length < 6) {
        showToast("Password must be at least 6 characters long.", 'error');
        return;
    }
    if (newPassword !== confirmPassword) {
        showToast("Passwords do not match.", 'error');
        return;
    }
    
    const result = await resetPassword(resetEmail, newPassword);
    if (result.success) {
        handleSetView('signin');
    }
  };
  
  const renderHeader = () => {
      let title = '';
      switch(view) {
          case 'signin': title = 'Welcome Back'; break;
          case 'register': title = 'Create Your Account'; break;
          case 'forgot_email': title = 'Reset Password'; break;
          case 'forgot_otp': title = 'Verify OTP'; break;
          case 'forgot_password': title = 'Set New Password'; break;
      }
      return (
        <div className="text-center mb-6">
            <PillIcon className="w-12 h-12 mx-auto text-primary-600" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 tracking-tight mt-3">
              {title}
            </h2>
        </div>
      )
  };

  const renderSignIn = () => (
    <>
      <form onSubmit={handleLoginSubmit} className="space-y-4">
        <fieldset disabled={isProcessing} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="email">Email Address</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="you@example.com" />
          </div>
          <div>
            <div className="flex justify-between items-baseline">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="password">Password</label>
                <button type="button" onClick={() => handleSetView('forgot_email')} className="text-sm font-medium text-primary-600 hover:text-primary-500">Forgot?</button>
            </div>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="••••••••" />
          </div>
          <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-400 disabled:cursor-wait">
            {isProcessing ? 'Signing In...' : 'Sign In'}
          </button>
        </fieldset>
      </form>
      <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        Don't have an account?
        <button onClick={() => handleSetView('register')} disabled={isProcessing} className="ml-1 font-medium text-primary-600 hover:text-primary-500 disabled:text-gray-400">
          Register
        </button>
      </p>
    </>
  );

  const renderRegister = () => (
    <>
      <form onSubmit={handleRegisterSubmit} className="space-y-4">
        <fieldset disabled={isProcessing} className="space-y-4">
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="Email Address" aria-label="Email Address"/>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="Password (min 6 characters)" aria-label="Password"/>
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
              <input id="storeName" type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} required className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="Store Name" aria-label="Store Name"/>
              <div>
                <div className="flex justify-between items-center mb-1">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 sr-only" htmlFor="address">Store Address</label>
                    <button type="button" onClick={() => setIsMapOpen(true)} className="w-full text-sm font-semibold text-primary-600 hover:underline text-right">Select on Map</button>
                </div>
                <textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} required rows={2} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="Store Address" aria-label="Store Address" />
              </div>
            </div>
          )}
          <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-wait">
            {isProcessing ? 'Registering...' : 'Register'}
          </button>
        </fieldset>
      </form>
      <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        Already have an account?
        <button onClick={() => handleSetView('signin')} disabled={isProcessing} className="ml-1 font-medium text-primary-600 hover:text-primary-500 disabled:text-gray-400">
          Sign In
        </button>
      </p>
    </>
  );
  
  const renderForgotEmail = () => (
     <form onSubmit={handleForgotEmailSubmit} className="space-y-4">
        <p className="text-sm text-center text-gray-600 dark:text-gray-400">Enter your account's email address and we will send you a code to reset your password.</p>
        <fieldset disabled={isProcessing} className="space-y-4">
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="Email Address" aria-label="Email Address"/>
            <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-wait">
                {isProcessing ? 'Sending...' : 'Send Code'}
            </button>
        </fieldset>
     </form>
  );
  
  const renderForgotOTP = () => (
    <form onSubmit={handleForgotOTPSubmit} className="space-y-4">
        <p className="text-sm text-center text-gray-600 dark:text-gray-400">We've sent a 6-digit code to <span className="font-semibold">{resetEmail}</span>. The code expires in 10 minutes.</p>
        <fieldset disabled={isProcessing} className="space-y-4">
            <input id="otp" type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={6} className="block w-full text-center tracking-[1em] px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="••••••" aria-label="One-Time Password"/>
            <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-wait">
                {isProcessing ? 'Verifying...' : 'Verify'}
            </button>
        </fieldset>
     </form>
  );
  
  const renderResetPassword = () => (
    <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
        <p className="text-sm text-center text-gray-600 dark:text-gray-400">Create a new password for your account.</p>
        <fieldset disabled={isProcessing} className="space-y-4">
            <input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="New Password" aria-label="New Password"/>
            <input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="Confirm New Password" aria-label="Confirm New Password"/>
            <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-wait">
                {isProcessing ? 'Saving...' : 'Reset Password'}
            </button>
        </fieldset>
    </form>
  );

  const renderContent = () => {
      switch(view) {
          case 'signin': return renderSignIn();
          case 'register': return renderRegister();
          case 'forgot_email': return renderForgotEmail();
          case 'forgot_otp': return renderForgotOTP();
          case 'forgot_password': return renderResetPassword();
          default: return null;
      }
  };


  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-sm p-4 fixed inset-0 z-50">
        <div className="w-full max-w-md mx-auto bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-8 relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" aria-label="Close" title="Close">
              <CloseIcon className="w-6 h-6" />
          </button>
          
          {view !== 'signin' && view !== 'register' && (
             <button onClick={() => handleSetView('signin')} className="absolute top-4 left-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" aria-label="Back to Sign In">
                <ArrowLeftIcon className="w-4 h-4"/> Back
             </button>
          )}

          {renderHeader()}
          {renderContent()}
        </div>
      </div>
      {isMapOpen && <MapSelector onClose={() => setIsMapOpen(false)} onLocationSelect={handleLocationSelect} />}
    </>
  );
};

export default LoginPage;
