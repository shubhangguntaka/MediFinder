
import React, { useState, useRef, useEffect } from 'react';
import { PillIcon, UserIcon, SunIcon, MoonIcon, ChevronDownIcon } from './icons';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface HeaderProps {
  onLoginClick: () => void;
  onProfileClick: () => void;
  onLogout: () => void;
}

const useOnClickOutside = (ref: React.RefObject<HTMLDivElement>, handler: (event: MouseEvent | TouchEvent) => void) => {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler(event);
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
};

const Header: React.FC<HeaderProps> = ({ onLoginClick, onProfileClick, onLogout }) => {
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(dropdownRef, () => setIsDropdownOpen(false));

  const handleLogout = () => {
    logout();
    onLogout();
    setIsDropdownOpen(false);
  };

  return (
    <header className="relative py-4 border-b border-gray-200 dark:border-slate-700/80">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center justify-center gap-3">
          <PillIcon className="w-8 h-8 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">MediFinder</h1>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                title="Open user menu"
              >
                <UserIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <span className="hidden sm:inline">{user.email}</span>
                <ChevronDownIcon className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg py-1 border dark:border-slate-700 z-20">
                  <button
                    onClick={() => { onProfileClick(); setIsDropdownOpen(false); }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                  >
                    Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50"
            >
              Login / Register
            </button>
          )}
          <button
              onClick={toggleTheme}
              className="relative w-10 h-10 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 overflow-hidden"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
              <SunIcon className={`w-5 h-5 absolute transition-all duration-300 ${theme === 'dark' ? 'opacity-100 transform rotate-0 scale-100' : 'opacity-0 transform -rotate-90 scale-50'}`} />
              <MoonIcon className={`w-5 h-5 absolute transition-all duration-300 ${theme === 'light' ? 'opacity-100 transform rotate-0 scale-100' : 'opacity-0 transform rotate-90 scale-50'}`} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
