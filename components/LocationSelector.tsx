
import React, { useState } from 'react';
import { geocodeAddress } from '../services/geminiService';
import { CloseIcon, GlobeIcon, LocationIcon } from './icons';

interface LocationSelectorProps {
  onClose: () => void;
  onLocationSet: (location: { lat: number; lng: number; name: string }) => void;
  onUseCurrentLocation: () => void;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({ onClose, onLocationSet, onUseCurrentLocation }) => {
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!city || !country) {
      setError('City and Country are required.');
      return;
    }
    
    setError(null);
    setIsProcessing(true);

    const addressString = [city, state, country].filter(Boolean).join(', ');
    
    try {
      const coordinates = await geocodeAddress(addressString);
      onLocationSet({ ...coordinates, name: addressString });
    } catch (err) {
        console.error("Geocoding failed:", err);
        setError("Could not find location. Please try a different one.");
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm" aria-modal="true" role="dialog">
      <div className="relative w-full max-w-lg p-8 m-4 bg-white dark:bg-slate-800 rounded-2xl shadow-xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors" aria-label="Close location selector" title="Close">
          <CloseIcon className="w-6 h-6" />
        </button>
        
        <div className="flex items-center gap-3 mb-6">
            <GlobeIcon className="w-8 h-8 text-primary-600" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Change Your Location</h2>
        </div>
        
        <button
            onClick={onUseCurrentLocation}
            className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-slate-800 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
        >
            <LocationIcon className="w-5 h-5 mr-2" />
            Use My Current Location
        </button>

        <div className="relative my-6">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-gray-300 dark:border-slate-600" />
            </div>
            <div className="relative flex justify-center">
                <span className="bg-white dark:bg-slate-800 px-2 text-sm text-gray-500 dark:text-gray-400">OR</span>
            </div>
        </div>

        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">Enter a location manually:</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset disabled={isProcessing}>
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300">City</label>
              <input id="city" type="text" value={city} onChange={e => setCity(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="e.g., San Francisco" />
            </div>
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 dark:text-gray-300">State / Province (Optional)</label>
              <input id="state" type="text" value={state} onChange={e => setState(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="e.g., CA" />
            </div>
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Country</label>
              <input id="country" type="text" value={country} onChange={e => setCountry(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="e.g., USA" />
            </div>
            
            {error && <p className="text-sm text-red-600 text-center bg-red-50 p-2 rounded-md dark:bg-red-900/30 dark:text-red-400">{error}</p>}

            <div className="pt-2">
              <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-400 disabled:cursor-wait">
                {isProcessing ? 'Finding Location...' : 'Set Location & Search'}
              </button>
            </div>
          </fieldset>
        </form>
      </div>
    </div>
  );
};

export default LocationSelector;
