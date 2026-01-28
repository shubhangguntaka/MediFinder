
import React, { useState, useCallback, useEffect } from 'react';
import SearchBar from './SearchBar';
import ResultsList from './ResultsList';
import LocationSelector from './LocationSelector';
import SmartScanModal from './SmartScanModal';
import { searchPharmacies, getAllPharmacies } from '../services/pharmacyService';
import type { SearchResult, CustomerUser, BasicStoreInfo } from '../types';
import { HistoryIcon, LocationIcon, GlobeIcon, StoreIcon, ArrowLeftIcon, PillIcon } from './icons';
import { useAuth } from '../contexts/AuthContext';
import { useGeolocation } from '../hooks/useGeolocation';

interface UserViewProps {
  onLoginClick: () => void;
}

interface LocationStatusProps {
    currentLocationName: string | undefined;
    isAutoDetecting: boolean;
    autoDetectError: string | null;
    hasAutoLocation: boolean;
    onOpenSelector: () => void;
}

const LocationStatus: React.FC<LocationStatusProps> = ({ currentLocationName, isAutoDetecting, autoDetectError, hasAutoLocation, onOpenSelector }) => {
    let statusText: React.ReactNode;
    let icon: React.ReactNode;

    if (currentLocationName) {
        statusText = <><span className="font-medium">Location:</span> {currentLocationName}</>;
        icon = <GlobeIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />;
    } else if (isAutoDetecting) {
        statusText = 'Detecting your location...';
        icon = <svg className="animate-spin h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;
    } else if (hasAutoLocation) {
        statusText = 'Using your detected location';
        icon = <LocationIcon className="w-5 h-5 text-green-600" />;
    } else {
        statusText = autoDetectError ? 'Could not detect location' : 'Set a location to begin';
        icon = <LocationIcon className="w-5 h-5 text-red-500" />;
    }

    return (
        <div className="mt-4 flex items-center justify-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
                {icon}
                <span className="truncate max-w-[250px]">{statusText}</span>
            </div>
            <button onClick={onOpenSelector} className="font-semibold text-primary-600 hover:underline">
                {currentLocationName || hasAutoLocation ? 'Change' : 'Set Location'}
            </button>
        </div>
    );
};

const StoreListCard: React.FC<{ store: BasicStoreInfo; onViewInventory: (name: string) => void }> = ({ store, onViewInventory }) => (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200/80 flex flex-col justify-between group hover:shadow-lg hover:-translate-y-1 dark:bg-slate-800 dark:border-slate-700">
        <div>
            <div className="flex items-start gap-3 mb-2">
                <div className="flex-shrink-0 pt-1">
                    <StoreIcon className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                </div>
                <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{store.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{store.address}</p>
                </div>
            </div>
            {store.distance !== -1 && (
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-3 ml-9">
                    <LocationIcon className="w-4 h-4" />
                    <span>{store.distance.toFixed(1)} km away</span>
                </div>
            )}
        </div>
        <div className="flex justify-end items-center mt-4">
            <button
                onClick={() => onViewInventory(store.name)}
                className="px-4 py-2 bg-slate-800 text-white text-sm font-semibold rounded-lg hover:bg-slate-900 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-slate-300"
            >
                View Inventory
            </button>
        </div>
    </div>
);

const StoreListSkeleton: React.FC = () => (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200/80 animate-pulse dark:bg-slate-800 dark:border-slate-700">
      <div className="flex items-start gap-3 mb-2">
        <div className="flex-shrink-0 pt-1">
          <div className="w-6 h-6 bg-slate-200 rounded dark:bg-slate-700"></div>
        </div>
        <div>
          <div className="h-6 bg-slate-200 rounded w-48 mb-2 dark:bg-slate-700"></div>
          <div className="h-4 bg-slate-200 rounded w-64 dark:bg-slate-700"></div>
        </div>
      </div>
      <div className="h-5 mt-3 ml-9">
          <div className="h-4 bg-slate-200 rounded w-24 dark:bg-slate-700"></div>
      </div>
      <div className="flex justify-end items-center mt-4">
        <div className="h-10 w-36 bg-slate-200 rounded-lg dark:bg-slate-700"></div>
      </div>
    </div>
);


const UserView: React.FC<UserViewProps> = ({ onLoginClick }) => {
  const { user, addSearchTerm } = useAuth();
  const { location: autoDetectedLocation, error: autoLocationError, isLoading: isAutoLocationLoading } = useGeolocation();
  
  const [manualLocation, setManualLocation] = useState<{ lat: number; lng: number; name: string } | null>(() => {
    try {
        const saved = localStorage.getItem('medifind_manual_location');
        return saved ? JSON.parse(saved) : null;
    } catch {
        return null;
    }
  });

  const [isLocationSelectorOpen, setIsLocationSelectorOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [scannedMedicines, setScannedMedicines] = useState<string[]>([]);

  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [initialStores, setInitialStores] = useState<BasicStoreInfo[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  const [sortOption, setSortOption] = useState<'distance' | 'stock'>('distance');
  const [showInStockOnly, setShowInStockOnly] = useState(false);


  const currentLocation = manualLocation ?? autoDetectedLocation;

  useEffect(() => {
    if (currentLocation || !isAutoLocationLoading) {
      setIsInitialLoading(true);
      getAllPharmacies(currentLocation)
        .then(stores => {
          setInitialStores(stores);
        })
        .catch(err => {
          console.error("Failed to fetch initial stores:", err);
          setError("Could not load pharmacy list.");
        })
        .finally(() => {
          setIsInitialLoading(false);
        });
    }
  }, [currentLocation, isAutoLocationLoading]);


  const handleSetManualLocation = (location: { lat: number; lng: number; name: string }) => {
    setManualLocation(location);
    localStorage.setItem('medifind_manual_location', JSON.stringify(location));
    setIsLocationSelectorOpen(false);
    setHasSearched(false);
    setResults(null);
  };

  const handleUseCurrentLocation = () => {
    setManualLocation(null);
    localStorage.removeItem('medifind_manual_location');
    setIsLocationSelectorOpen(false);
    setHasSearched(false);
    setResults(null);
  };

  const handleSearch = useCallback(async (query: string) => {
    if (!currentLocation) {
        setError("Please set a location before searching to find nearby pharmacies.");
        setIsLocationSelectorOpen(true);
        return;
    }
    
    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    setResults(null);
    try {
      const data = await searchPharmacies(query, currentLocation);
      setResults(data);
      if (user?.role === 'user' && query.length > 2) {
        addSearchTerm(query);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to perform search. ${errorMessage}. Please try again later.`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [currentLocation, user, addSearchTerm]);

  const handleMedicinesFound = (medicines: string[]) => {
    setScannedMedicines(medicines);
    if (medicines.length === 1) {
      handleSearch(medicines[0]);
    }
  };

  const handleGoBack = () => {
    setHasSearched(false);
    setResults(null);
    setError(null);
  };
  
  const searchHistory = (user as CustomerUser)?.searchHistory;

  return (
    <>
    <main className="container mx-auto px-4 pb-16 max-w-5xl">
        <div className="sticky top-0 sm:top-4 z-10 bg-gray-50/90 dark:bg-slate-900/90 backdrop-blur-sm p-4 -mx-4 sm:mx-0 sm:rounded-xl sm:shadow-lg sm:border border-gray-200/80 dark:border-slate-700/80 mb-6">
            <SearchBar onSearch={handleSearch} onOpenScan={() => setIsScanModalOpen(true)} isLoading={isLoading} />
            <LocationStatus 
                currentLocationName={manualLocation?.name}
                isAutoDetecting={isAutoLocationLoading}
                autoDetectError={autoLocationError}
                hasAutoLocation={!!autoDetectedLocation}
                onOpenSelector={() => setIsLocationSelectorOpen(true)}
            />
        </div>

        {scannedMedicines.length > 0 && (
          <div className="mb-8 px-2 animate-fade-in-down">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-primary-700 dark:text-primary-400 flex items-center gap-2">
                <PillIcon className="w-5 h-5"/> Found in your Scan
              </h3>
              <button onClick={() => setScannedMedicines([])} className="text-xs text-gray-500 hover:text-gray-700">Clear</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {scannedMedicines.map(med => (
                <button 
                  key={med} 
                  onClick={() => handleSearch(med)}
                  className="px-4 py-2 bg-primary-100 text-primary-800 text-sm font-bold rounded-full hover:bg-primary-200 dark:bg-primary-900/40 dark:text-primary-300 transition-all border border-primary-200 dark:border-primary-800"
                >
                  {med}
                </button>
              ))}
            </div>
          </div>
        )}

        {user && searchHistory && searchHistory.length > 0 && !hasSearched && scannedMedicines.length === 0 && (
            <div className="mb-8 px-2">
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-2 mb-3"><HistoryIcon className="w-5 h-5"/> Recent Searches</h3>
                <div className="flex flex-wrap gap-2">
                    {searchHistory.map(term => (
                        <button key={term} onClick={() => handleSearch(term)} className="px-3 py-1 bg-slate-200 text-slate-700 text-sm rounded-full hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">
                            {term}
                        </button>
                    ))}
                </div>
            </div>
        )}
        
        {hasSearched ? (
            <div>
              <div className="mb-4 px-2">
                <button
                  onClick={handleGoBack}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:text-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                  Back to All Pharmacies
                </button>
              </div>
              <ResultsList 
                  results={results} 
                  isLoading={isLoading} 
                  error={error}
                  searched={hasSearched}
                  isGuest={!user}
                  onLoginClick={onLoginClick}
                  sortOption={sortOption}
                  onSortChange={setSortOption}
                  showInStockOnly={showInStockOnly}
                  onFilterChange={setShowInStockOnly}
              />
            </div>
        ) : (
            <div className="mt-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4 px-2">All Pharmacies</h2>
                {isInitialLoading ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, index) => <StoreListSkeleton key={index} />)}
                    </div>
                ) : initialStores.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {initialStores.map(store => (
                            <StoreListCard key={store.name} store={store} onViewInventory={handleSearch} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 px-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700">
                        <StoreIcon className="w-16 h-16 mx-auto text-gray-400 dark:text-slate-500" />
                        <h3 className="mt-4 text-xl font-semibold text-gray-700 dark:text-gray-300">No Pharmacies Found</h3>
                        <p className="mt-1 text-gray-500 dark:text-gray-400">There are no registered pharmacies yet. Check back later!</p>
                    </div>
                )}
            </div>
        )}
    </main>

    {isLocationSelectorOpen && (
        <LocationSelector
            onClose={() => setIsLocationSelectorOpen(false)}
            onLocationSet={handleSetManualLocation}
            onUseCurrentLocation={handleUseCurrentLocation}
        />
    )}

    {isScanModalOpen && (
      <SmartScanModal 
        onClose={() => setIsScanModalOpen(false)} 
        onMedicinesFound={handleMedicinesFound}
      />
    )}
    </>
  );
};

export default UserView;
