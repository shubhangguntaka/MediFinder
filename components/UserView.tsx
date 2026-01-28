
import React, { useState, useCallback, useEffect } from 'react';
import SearchBar from './SearchBar';
import ResultsList from './ResultsList';
import LocationSelector from './LocationSelector';
import SmartScanModal from './SmartScanModal';
import { searchPharmacies, getAllPharmacies } from '../services/pharmacyService';
import type { SearchResult, CustomerUser, BasicStoreInfo } from '../types';
import { HistoryIcon, LocationIcon, GlobeIcon, StoreIcon, ArrowLeftIcon, PillIcon, SearchIcon, PencilIcon, DocumentScannerIcon } from './icons';
import { useAuth } from '../contexts/AuthContext';
import { useGeolocation } from '../hooks/useGeolocation';

interface UserViewProps {
  onLoginClick: () => void;
}

const SUGGESTED_MEDICINES = [
  "Paracetamol", "Azithromycin", "Dolo 650", "Shelcal 500", "Lantus", "Aspirin"
];

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
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-sm text-gray-600 dark:text-gray-400 px-2">
            <div className="flex items-center gap-2 min-w-0">
                <span className="shrink-0">{icon}</span>
                <span className="truncate">{statusText}</span>
            </div>
            <button onClick={onOpenSelector} className="shrink-0 font-bold text-primary-600 hover:text-primary-700 hover:underline transition-colors">
                {currentLocationName || hasAutoLocation ? 'Change' : 'Set Location'}
            </button>
        </div>
    );
};

const StoreListCard: React.FC<{ store: BasicStoreInfo; onViewInventory: (name: string) => void }> = ({ store, onViewInventory }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between group hover:shadow-xl hover:border-primary-100 transition-all duration-300 dark:bg-slate-800 dark:border-slate-700 h-full">
        <div className="min-w-0">
            <div className="flex items-start gap-4 mb-3">
                <div className="flex-shrink-0 p-3 bg-slate-50 dark:bg-slate-700 rounded-xl group-hover:bg-primary-50 dark:group-hover:bg-primary-900/30 transition-colors">
                    <StoreIcon className="w-6 h-6 text-gray-400 group-hover:text-primary-600 transition-colors" />
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 leading-tight break-words">{store.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-3 break-words">{store.address}</p>
                </div>
            </div>
            {store.distance !== -1 && (
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-4 ml-1">
                    <LocationIcon className="w-4 h-4 text-primary-500" />
                    <span>{store.distance.toFixed(1)} km away</span>
                </div>
            )}
        </div>
        <div className="flex justify-end items-center mt-6">
            <button
                onClick={() => onViewInventory(store.name)}
                className="w-full px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition-all shadow-md shadow-slate-900/10"
            >
                View Inventory
            </button>
        </div>
    </div>
);

const StoreListSkeleton: React.FC = () => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-pulse dark:bg-slate-800 dark:border-slate-700 h-full">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 bg-slate-100 rounded-xl dark:bg-slate-700"></div>
        <div className="flex-1">
          <div className="h-6 bg-slate-100 rounded-md w-3/4 mb-2 dark:bg-slate-700"></div>
          <div className="h-4 bg-slate-100 rounded-md w-1/2 dark:bg-slate-700"></div>
        </div>
      </div>
      <div className="h-4 bg-slate-50 rounded-md w-1/4 mb-6 dark:bg-slate-700/50"></div>
      <div className="h-10 bg-slate-100 rounded-xl w-full sm:w-32 ml-auto dark:bg-slate-700"></div>
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
  const [manualEntry, setManualEntry] = useState('');

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
    setManualEntry('');
  };
  
  const searchHistory = (user as CustomerUser)?.searchHistory;

  return (
    <>
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-12 max-w-7xl">
        <div className="sticky top-0 sm:top-4 z-30 bg-gray-50/95 dark:bg-slate-900/95 backdrop-blur-xl p-5 sm:rounded-3xl sm:shadow-2xl sm:shadow-primary-500/5 sm:border border-gray-200/50 dark:border-slate-800/80 mb-8 w-full">
            <SearchBar onSearch={handleSearch} onOpenScan={() => setIsScanModalOpen(true)} isLoading={isLoading} />
            <LocationStatus 
                currentLocationName={manualLocation?.name}
                isAutoDetecting={isAutoLocationLoading}
                autoDetectError={autoLocationError}
                hasAutoLocation={!!autoDetectedLocation}
                onOpenSelector={() => setIsLocationSelectorOpen(true)}
            />
        </div>

        {!hasSearched && (
          <div className="mb-10 animate-fade-in-down">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-800/50">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex-1">
                  <h3 className="text-xl font-bold dark:text-white flex items-center gap-2 mb-2">
                    <PencilIcon className="w-6 h-6 text-primary-600" />
                    Quick Medicine Entry
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Prefer typing? Enter the exact medicine name below to find it instantly in nearby stores.</p>
                </div>
                <div className="flex-1 flex gap-2">
                  <input 
                    type="text" 
                    value={manualEntry}
                    onChange={(e) => setManualEntry(e.target.value)}
                    placeholder="e.g. Insulin, Cetrizine..."
                    className="flex-grow min-w-0 px-5 py-3.5 bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none dark:text-white"
                  />
                  <button 
                    onClick={() => manualEntry.trim() && handleSearch(manualEntry)}
                    className="px-6 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/20"
                  >
                    Find
                  </button>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2 mr-2">
                  <SearchIcon className="w-4 h-4" /> Recommended:
                </span>
                {SUGGESTED_MEDICINES.map(med => (
                  <button 
                    key={med}
                    onClick={() => handleSearch(med)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 text-sm font-semibold rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:text-primary-700 transition-all border border-transparent hover:border-primary-200 dark:hover:border-primary-800"
                  >
                    {med}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {scannedMedicines.length > 0 && (
          <div className="mb-10 animate-fade-in-down">
            <div className="bg-primary-50 dark:bg-primary-900/10 p-6 rounded-[2rem] border border-primary-100 dark:border-primary-900/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-primary-700 dark:text-primary-400 flex items-center gap-2">
                  <DocumentScannerIcon className="w-6 h-6"/> AI Scanned Results
                </h3>
                <button 
                  onClick={() => setScannedMedicines([])} 
                  className="px-4 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 text-gray-500 rounded-full shadow-sm hover:text-red-500 transition-all"
                >
                  Dismiss Scan
                </button>
              </div>
              <div className="flex flex-wrap gap-3">
                {scannedMedicines.map(med => (
                  <button 
                    key={med} 
                    onClick={() => handleSearch(med)}
                    className="group px-5 py-3 bg-white dark:bg-slate-800 text-primary-800 text-sm font-bold rounded-2xl hover:bg-primary-600 hover:text-white transition-all shadow-sm border border-primary-200 dark:border-primary-800 flex items-center gap-2"
                  >
                    <SearchIcon className="w-4 h-4 opacity-40 group-hover:opacity-100" />
                    {med}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {user && searchHistory && searchHistory.length > 0 && !hasSearched && scannedMedicines.length === 0 && (
            <div className="mb-10 px-4">
                <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                  <HistoryIcon className="w-5 h-5"/> Your Recent History
                </h3>
                <div className="flex flex-wrap gap-3">
                    {searchHistory.map(term => (
                        <button key={term} onClick={() => handleSearch(term)} className="px-5 py-2.5 bg-white dark:bg-slate-800 text-slate-700 text-sm font-semibold rounded-2xl border border-gray-100 dark:border-slate-700 hover:border-primary-400 transition-all shadow-sm">
                            {term}
                        </button>
                    ))}
                </div>
            </div>
        )}
        
        {hasSearched ? (
            <div className="animate-fade-in-down">
              <div className="mb-6 flex items-center justify-between">
                <button
                  onClick={handleGoBack}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-slate-700 bg-white shadow-sm border border-gray-200 rounded-2xl hover:bg-slate-50 dark:text-slate-200 dark:bg-slate-800 dark:border-slate-700 transition-all"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                  Return to Overview
                </button>
                <div className="hidden sm:block h-px flex-grow bg-gray-200 dark:bg-slate-800 mx-6"></div>
                <div className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Searching...</div>
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
            <div className="mt-8 animate-fade-in-down">
                <div className="flex items-center justify-between mb-6 px-2">
                  <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight flex items-center gap-3">
                    <StoreIcon className="w-8 h-8 text-primary-600" />
                    Nearby Pharmacies
                  </h2>
                  <div className="text-xs font-bold text-primary-600 bg-primary-50 dark:bg-primary-900/30 px-3 py-1.5 rounded-full uppercase">
                    {initialStores.length} Stores Found
                  </div>
                </div>
                {isInitialLoading ? (
                    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, index) => <StoreListSkeleton key={index} />)}
                    </div>
                ) : initialStores.length > 0 ? (
                    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {initialStores.map(store => (
                            <StoreListCard key={store.name} store={store} onViewInventory={handleSearch} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 px-8 bg-white dark:bg-slate-800 rounded-[3rem] shadow-sm border dark:border-slate-800/50 mx-2">
                        <div className="w-24 h-24 bg-gray-50 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                          <StoreIcon className="w-12 h-12 text-gray-300 dark:text-slate-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200">No Stores in this Area</h3>
                        <p className="mt-2 text-gray-500 dark:text-gray-400 max-w-sm mx-auto">Try changing your search radius or location to discover pharmacies with live inventory.</p>
                        <button 
                          onClick={() => setIsLocationSelectorOpen(true)}
                          className="mt-8 px-8 py-3 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 transition-all shadow-xl shadow-primary-500/20"
                        >
                          Change Location
                        </button>
                    </div>
                )}
            </div>
        )}
    </div>

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
