import React from 'react';
import type { SearchResult, Medicine } from '../types';
import ResultCard from './ResultCard';
import { SearchIcon, StoreIcon, PillIcon } from './icons';

const SkeletonCard: React.FC = () => (
  <div className="bg-white p-4 rounded-lg shadow border border-gray-200 animate-pulse dark:bg-slate-800 dark:border-slate-700">
    <div className="h-6 bg-slate-200 rounded w-3/4 mb-3 dark:bg-slate-700"></div>
    <div className="h-4 bg-slate-200 rounded w-full mb-2 dark:bg-slate-700"></div>
    <div className="h-4 bg-slate-200 rounded w-5/6 mb-4 dark:bg-slate-700"></div>
    <div className="flex justify-between items-center">
      <div className="h-8 bg-slate-200 rounded-full w-24 dark:bg-slate-700"></div>
      <div className="h-10 bg-slate-200 rounded-lg w-32 dark:bg-slate-700"></div>
    </div>
  </div>
);

const MedicineListItem: React.FC<{item: Medicine}> = ({item}) => (
    <div className="flex justify-between items-start py-3 px-4 bg-slate-50/70 rounded-lg dark:bg-slate-700/50">
        <div>
            <p className="font-semibold text-gray-800 dark:text-gray-200">{item.name}</p>
            {item.brands.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-2">
                    {item.brands.map(brand => (
                        <span key={brand} className="text-xs font-medium bg-gray-200 text-gray-700 px-2 py-1 rounded-full dark:bg-slate-600 dark:text-slate-200">{brand}</span>
                    ))}
                </div>
            )}
        </div>
        <div className="text-right flex-shrink-0 pl-4">
            <p className={`font-semibold ${item.stock > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {item.stock > 0 ? 'In Stock' : 'Out of Stock'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{item.stock} units</p>
        </div>
    </div>
);

interface ResultsListProps {
  results: SearchResult | null;
  isLoading: boolean;
  error: string | null;
  searched: boolean;
  isGuest: boolean;
  onLoginClick: () => void;
}

const ResultsList: React.FC<ResultsListProps> = ({ results, isLoading, error, searched, isGuest, onLoginClick }) => {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={index} />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 px-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-500/30">
        <h3 className="text-xl font-semibold text-red-700 dark:text-red-300">An Error Occurred</h3>
        <p className="mt-2 text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (searched && !results) {
    return (
      <div className="text-center py-16 px-4">
        <SearchIcon className="w-20 h-20 mx-auto text-gray-400 dark:text-slate-600 opacity-75" />
        <h3 className="mt-6 text-2xl font-semibold text-gray-700 dark:text-gray-300">No Results Found</h3>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          We couldn't find any pharmacies or medicines matching your search. Please try again.
        </p>
      </div>
    );
  }

  if (results?.type === 'medicines') {
    const { data, medicineInfo, medicineName } = results;
    return (
      <div>
        {medicineInfo && (
          <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-6 rounded-xl shadow-lg mb-8 text-white">
            <div className="flex items-start gap-4 mb-3">
                <div className="flex-shrink-0 bg-white/20 p-2 rounded-full">
                    <PillIcon className="w-7 h-7" />
                </div>
              <div>
                <p className="text-sm font-semibold text-primary-100">About {medicineName}</p>
                <h3 className="font-bold text-2xl capitalize">{medicineName}</h3>
              </div>
            </div>
            <p className="text-primary-50 leading-relaxed text-md">{medicineInfo}</p>
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.map((pharmacy, index) => (
            <ResultCard key={`${pharmacy.name}-${index}`} pharmacy={pharmacy} isGuest={isGuest} onLoginClick={onLoginClick} />
          ))}
        </div>
      </div>
    );
  }
  
  if (results?.type === 'store') {
      const { store, inventory, distance } = results.data;
      return (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200/80 max-w-3xl mx-auto dark:bg-slate-800 dark:border-slate-700">
              <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 pt-1 bg-slate-100 dark:bg-slate-700 p-3 rounded-full">
                      <StoreIcon className="w-7 h-7 text-slate-500 dark:text-slate-400"/>
                  </div>
                  <div>
                      <h3 className="font-bold text-2xl text-gray-900 dark:text-gray-100">{store.storeName}</h3>
                      <p className="text-md text-gray-600 dark:text-gray-400">{store.address}</p>
                      {distance !== -1 && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{distance.toFixed(1)} km away</p>}
                  </div>
              </div>
              <h4 className="font-semibold text-lg text-gray-800 dark:text-gray-200 mt-6 mb-3 border-t dark:border-slate-700 pt-5">Available Inventory</h4>
              <div className="space-y-3">
                {inventory.length > 0 ? inventory.map(item => <MedicineListItem key={item.name} item={item}/>) : <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">This pharmacy has not listed any inventory yet.</p>}
              </div>
          </div>
      );
  }
  
  return null; // Initial state before any search is performed
};

export default ResultsList;
