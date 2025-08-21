
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, THEMES, ColorTheme } from '../contexts/ThemeContext';
import { ArrowLeftIcon, IdentificationIcon, Cog6ToothIcon, ShieldExclamationIcon, SunIcon, MoonIcon, PencilIcon, ArrowRightOnRectangleIcon, TrashIcon, KeyIcon } from './icons';
import EditProfileModal from './EditProfileModal';
import DeleteAccountModal from './DeleteAccountModal';
import ChangePasswordModal from './ChangePasswordModal';

interface ProfilePageProps {
  onBack: () => void;
}

const colorClasses: { [key in ColorTheme]: { bg: string, ring: string } } = {
  blue: { bg: 'bg-blue-500', ring: 'ring-blue-500' },
  green: { bg: 'bg-green-500', ring: 'ring-green-500' },
  red: { bg: 'bg-red-500', ring: 'ring-red-500' },
  yellow: { bg: 'bg-yellow-500', ring: 'ring-yellow-500' },
  orange: { bg: 'bg-orange-500', ring: 'ring-orange-500' },
};

const ProfilePage: React.FC<ProfilePageProps> = ({ onBack }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, colorTheme, setColorTheme } = useTheme();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);


  if (!user) {
    onBack();
    return null;
  }

  return (
    <>
      <main className="container mx-auto px-4 pb-16 max-w-3xl">
        <div className="my-6">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:text-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Back to App
            </button>
        </div>

        <div className="space-y-8">
          {/* Profile Details Card */}
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-200/80 dark:bg-slate-800 dark:border-slate-700">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3"><IdentificationIcon className="w-6 h-6 text-primary-600"/>Profile Details</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your personal and store information.</p>
              </div>
              <div className="flex items-center gap-2">
                 <button onClick={() => setIsChangePasswordModalOpen(true)} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 dark:text-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600" title="Change your password">
                    <KeyIcon className="w-4 h-4"/>
                    <span className="hidden sm:inline">Change Password</span>
                </button>
                <button onClick={() => setIsEditModalOpen(true)} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 dark:text-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600" title="Edit your profile details">
                  <PencilIcon className="w-4 h-4"/>
                  <span className="hidden sm:inline">Edit Profile</span>
                </button>
              </div>
            </div>
            <div className="mt-6 border-t dark:border-slate-700 pt-6 space-y-4 text-sm">
                <div className="flex justify-between">
                    <span className="font-medium text-gray-600 dark:text-gray-400">Full Name</span>
                    <span className="text-gray-800 dark:text-gray-200">{user.fullName || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                    <span className="font-medium text-gray-600 dark:text-gray-400">Display Name</span>
                    <span className="text-gray-800 dark:text-gray-200">{user.displayName || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                    <span className="font-medium text-gray-600 dark:text-gray-400">Email</span>
                    <span className="text-gray-800 dark:text-gray-200">{user.email}</span>
                </div>
                <div className="flex justify-between">
                    <span className="font-medium text-gray-600 dark:text-gray-400">Account Type</span>
                    <span className="text-gray-800 dark:text-gray-200 capitalize">{user.role}</span>
                </div>
                {user.role === 'author' && (
                    <>
                    <div className="flex justify-between">
                        <span className="font-medium text-gray-600 dark:text-gray-400">Store Name</span>
                        <span className="text-gray-800 dark:text-gray-200">{user.storeName}</span>
                    </div>
                     <div className="flex justify-between items-start">
                        <span className="font-medium text-gray-600 dark:text-gray-400">Address</span>
                        <span className="text-gray-800 dark:text-gray-200 text-right max-w-xs truncate">{user.address}</span>
                    </div>
                    </>
                )}
            </div>
          </div>

          {/* Settings Card */}
           <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-200/80 dark:bg-slate-800 dark:border-slate-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3"><Cog6ToothIcon className="w-6 h-6 text-primary-600"/>Settings</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Customize your app experience.</p>
            <div className="mt-6 border-t dark:border-slate-700 pt-6 space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="font-medium text-gray-700 dark:text-gray-200">Appearance</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Switch between light and dark mode.</p>
                    </div>
                    <button onClick={toggleTheme} className="relative inline-flex items-center h-8 rounded-full w-14 transition-colors bg-slate-200 dark:bg-slate-700">
                        <span className={`inline-block w-6 h-6 transform bg-white rounded-full transition-transform ${theme === 'dark' ? 'translate-x-7' : 'translate-x-1'}`} />
                        <SunIcon className={`w-4 h-4 absolute right-2 text-yellow-500 transition-opacity ${theme === 'dark' ? 'opacity-100' : 'opacity-0'}`} />
                        <MoonIcon className={`w-4 h-4 absolute left-2 text-slate-400 transition-opacity ${theme === 'light' ? 'opacity-100' : 'opacity-0'}`} />
                    </button>
                </div>
                
                <div>
                    <h3 className="font-medium text-gray-700 dark:text-gray-200">Accent Color</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Choose the primary accent color for the app.</p>
                    <div className="mt-3 flex items-center gap-3">
                        {THEMES.map((color) => (
                          <button
                            key={color}
                            onClick={() => setColorTheme(color)}
                            className={`w-8 h-8 rounded-full transition-all duration-200 ${colorClasses[color].bg} ${colorTheme === color ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-800' : ''} ${colorClasses[color].ring}`}
                            aria-label={`Set theme to ${color}`}
                            title={`Set theme to ${color}`}
                          />
                        ))}
                    </div>
                </div>

                <div className="border-t dark:border-slate-700 pt-6 flex justify-between items-center">
                    <div>
                        <h3 className="font-medium text-gray-700 dark:text-gray-200">Log Out</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Sign out of your account.</p>
                    </div>
                     <button onClick={logout} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 dark:text-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600">
                        <ArrowRightOnRectangleIcon className="w-4 h-4"/> Logout
                    </button>
                </div>
            </div>
          </div>

          {/* Danger Zone Card */}
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border-2 border-red-200/80 dark:bg-slate-800 dark:border-red-500/20">
            <h2 className="text-xl font-bold text-red-700 dark:text-red-400 flex items-center gap-3"><ShieldExclamationIcon className="w-6 h-6"/>Danger Zone</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">These actions are permanent and cannot be undone.</p>
             <div className="mt-6 border-t border-red-200 dark:border-red-500/30 pt-6 flex justify-between items-center">
                <div>
                    <h3 className="font-medium text-gray-700 dark:text-gray-200">Delete Account</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Permanently delete your account and all associated data.</p>
                </div>
                <button onClick={() => setIsDeleteModalOpen(true)} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50">
                    <TrashIcon className="w-4 h-4"/> Delete
                </button>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="text-center py-4 mt-8">
        <p className="text-sm text-gray-500 dark:text-gray-400">Created by the MediFinder Team</p>
      </footer>

      {isEditModalOpen && (
        <EditProfileModal onClose={() => setIsEditModalOpen(false)} />
      )}
      {isDeleteModalOpen && (
        <DeleteAccountModal onClose={() => setIsDeleteModalOpen(false)} />
      )}
      {isChangePasswordModalOpen && (
        <ChangePasswordModal onClose={() => setIsChangePasswordModalOpen(false)} />
      )}
    </>
  );
};

export default ProfilePage;
