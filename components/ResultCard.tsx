
import React from 'react';
import type { Pharmacy } from '../types';
import { LocationIcon, StoreIcon, UserCircleIcon } from './icons';

interface ResultCardProps {
  pharmacy: Pharmacy;
  isGuest: boolean;
  onLoginClick: () => void;
}

const ResultCard: React.FC<ResultCardProps> = ({ pharmacy, isGuest, onLoginClick }) => {
  const isInStock = pharmacy.medicine.stock > 0;
  const isOutOfStock = !isInStock;

  const handleGetDirections = () => {
    const { lat, lng } = pharmacy.location;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank', 'noopener,noreferrer');
  };
  
  const stockText = isInStock ? 'In Stock' : 'Out of Stock';
  const stockClasses = isInStock
    ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300'
    : 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300';


  return (
    <div className={`bg-white p-5 rounded-xl shadow-sm border border-gray-200/80 flex flex-col justify-between group hover:shadow-lg hover:-translate-y-1 dark:bg-slate-800 dark:border-slate-700 relative transition-opacity overflow-hidden ${isOutOfStock ? 'opacity-70' : ''}`}>
      {isOutOfStock && <div className="absolute inset-0 bg-slate-50/40 dark:bg-slate-900/60 rounded-xl pointer-events-none"></div>}
      <div className="flex-grow min-w-0">
        {/* Store Info */}
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-shrink-0 pt-1">
            <StoreIcon className="w-6 h-6 text-gray-400 dark:text-gray-500" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 leading-tight break-words">{pharmacy.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 break-words mt-1">{pharmacy.address}</p>
          </div>
        </div>
        
        <div className="border-t border-gray-100 dark:border-slate-700 my-4"></div>

        {/* Medicine Info */}
        <div className="pl-9 mb-3 min-w-0">
            <div className="flex justify-between items-baseline gap-2">
                <p className="font-semibold text-gray-800 dark:text-gray-200 text-md break-words flex-1">{pharmacy.medicine.name}</p>
                <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap ${stockClasses}`}>
                  {stockText}
                </span>
            </div>
            {isInStock && <p className="text-xs text-gray-500 dark:text-gray-400">({pharmacy.medicine.stock} units)</p>}

            {pharmacy.medicine.brands.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                    {pharmacy.medicine.brands.map(brand => (
                        <span key={brand} className="text-xs font-medium bg-slate-100 text-slate-700 px-2 py-1 rounded-full dark:bg-slate-600 dark:text-slate-200 break-all">{brand}</span>
                    ))}
                </div>
            )}
        </div>
      </div>

      <div className="flex flex-wrap justify-between items-center mt-3 gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
            <LocationIcon className="w-4 h-4" />
            <span>{pharmacy.distance.toFixed(1)} km away</span>
        </div>
        {isGuest ? (
            <button
              onClick={onLoginClick}
              className="px-4 py-2 bg-primary-50 text-primary-700 text-sm font-semibold rounded-lg hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 flex items-center gap-2 dark:bg-primary-900/50 dark:text-primary-300 dark:hover:bg-primary-900 whitespace-nowrap"
              title="Login to get directions"
            >
                <UserCircleIcon className="w-5 h-5" />
                <span>Directions</span>
            </button>
        ) : (
            <button
              onClick={handleGetDirections}
              disabled={isOutOfStock}
              className="px-4 py-2 bg-slate-800 text-white text-sm font-semibold rounded-lg hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-opacity-50 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-slate-300 disabled:bg-slate-300 disabled:cursor-not-allowed dark:disabled:bg-slate-600 dark:disabled:text-slate-400 whitespace-nowrap"
              title={isOutOfStock ? "Out of stock" : "Get Directions"}
            >
              Get Directions
            </button>
        )}
      </div>
    </div>
  );
};

export default ResultCard;
