
import React, { useEffect, useState } from 'react';
import { useToast } from '../contexts/ToastContext';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, CloseIcon } from './icons';

const icons = {
  success: <CheckCircleIcon className="w-6 h-6 text-green-500" />,
  error: <XCircleIcon className="w-6 h-6 text-red-500" />,
  info: <InformationCircleIcon className="w-6 h-6 text-blue-500" />,
};

const bgColors = {
    success: 'bg-green-50 border-green-200 dark:bg-green-900/50 dark:border-green-500/30',
    error: 'bg-red-50 border-red-200 dark:bg-red-900/50 dark:border-red-500/30',
    info: 'bg-blue-50 border-blue-200 dark:bg-blue-900/50 dark:border-blue-500/30',
};

const textColors = {
    success: 'text-green-800 dark:text-green-200',
    error: 'text-red-800 dark:text-red-200',
    info: 'text-blue-800 dark:text-blue-200',
}

const Toast: React.FC = () => {
  const { toast, hideToast } = useToast();
  
  if (!toast) return null;

  return (
    <div 
        className="fixed top-5 left-1/2 z-[100] w-full max-w-sm sm:max-w-md animate-fade-in-down"
        role="alert"
    >
      <div className={`relative flex items-start gap-4 p-4 rounded-lg shadow-lg border ${bgColors[toast.type]}`}>
        <div className="flex-shrink-0">{icons[toast.type]}</div>
        <div className={`flex-grow text-sm font-semibold ${textColors[toast.type]}`}>
          {toast.message}
        </div>
        <button onClick={hideToast} className="flex-shrink-0 -mt-1 -mr-1 p-1 rounded-full hover:bg-black/10" aria-label="Dismiss">
            <CloseIcon className={`w-5 h-5 ${textColors[toast.type]} opacity-70 hover:opacity-100`} />
        </button>
      </div>
    </div>
  );
};

export default Toast;
