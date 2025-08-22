import React from 'react';
import { PillIcon, CheckCircleIcon } from './icons';

interface WelcomePageProps {
  onGetStarted: () => void;
}

const WelcomePage: React.FC<WelcomePageProps> = ({ onGetStarted }) => {
  return (
    <div className="relative min-h-screen bg-white dark:bg-slate-900 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-100/50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-primary-900/20"></div>
      
      {/* Content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12 text-center">
        <header className="flex items-center justify-center gap-3 mb-8">
          <PillIcon className="w-12 h-12 text-primary-600" />
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">MediFind</h1>
        </header>

        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50 sm:text-5xl md:text-6xl">
            Find Your Medicine, <span className="text-primary-600">Instantly.</span>
          </h2>
          <p className="mt-6 text-lg text-gray-600 dark:text-gray-300 sm:text-xl">
            MediFind helps you locate nearby pharmacies with the medicines you need in stock. Search by medicine or store name and get real-time availability and directions.
          </p>
        </div>

        <div className="mt-10">
          <button
            onClick={onGetStarted}
            className="px-10 py-4 text-lg font-semibold text-white bg-primary-600 rounded-lg shadow-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900 transform hover:scale-105"
          >
            Get Started
          </button>
        </div>
        
        <div className="mt-20 w-full max-w-5xl">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-gray-200/50 dark:border-slate-700/50">
              <CheckCircleIcon className="w-8 h-8 mx-auto text-green-500" />
              <h3 className="mt-4 text-lg font-semibold text-gray-800 dark:text-gray-200">Live Inventory</h3>
              <p className="mt-1 text-base text-gray-500 dark:text-gray-400">See real-time stock levels updated by pharmacy owners.</p>
            </div>
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-gray-200/50 dark:border-slate-700/50">
              <CheckCircleIcon className="w-8 h-8 mx-auto text-green-500" />
              <h3 className="mt-4 text-lg font-semibold text-gray-800 dark:text-gray-200">Location-Based Search</h3>
              <p className="mt-1 text-base text-gray-500 dark:text-gray-400">Find the closest pharmacies with your medicine.</p>
            </div>
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-gray-200/50 dark:border-slate-700/50">
              <CheckCircleIcon className="w-8 h-8 mx-auto text-green-500" />
              <h3 className="mt-4 text-lg font-semibold text-gray-800 dark:text-gray-200">Multiple Search Options</h3>
              <p className="mt-1 text-base text-gray-500 dark:text-gray-400">Search for a specific medicine or by a pharmacy's name.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WelcomePage;