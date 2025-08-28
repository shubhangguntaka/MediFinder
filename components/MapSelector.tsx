
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { CloseIcon, LocationIcon, CrosshairIcon } from './icons';
import { reverseGeocodeCoordinates } from '../services/geminiService';

interface MapSelectorProps {
  onClose: () => void;
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
}

const DEFAULT_CENTER: L.LatLngTuple = [17.4300, 78.4012]; // Hyderabad
const DEFAULT_ZOOM = 12;

const MapSelector: React.FC<MapSelectorProps> = ({ onClose, onLocationSelect }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    // Prevent map from initializing multiple times
    if (mapContainerRef.current && !mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        zoomControl: false, // Will be added manually to a different position
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
      
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapInstanceRef.current = map;
    }

    // Cleanup function to remove map instance on component unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const handleGoToMyLocation = () => {
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const map = mapInstanceRef.current;
        if (map) {
          map.setView([latitude, longitude], 16);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLocationError(`Could not get your location: ${error.message}`);
      }
    );
  };

  const handleConfirm = async () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const center = map.getCenter();
    const selectedLocation = { lat: center.lat, lng: center.lng };

    setIsProcessing(true);
    setLocationError(null);
    try {
      const address = await reverseGeocodeCoordinates(selectedLocation);
      onLocationSelect({ ...selectedLocation, address });
    } catch (error) {
      console.error("Failed to get address for location:", error);
      onLocationSelect({ ...selectedLocation, address: `Lat: ${selectedLocation.lat.toFixed(4)}, Lng: ${selectedLocation.lng.toFixed(4)}` });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm" aria-modal="true" role="dialog">
      <div className="relative w-full max-w-2xl h-[90vh] max-h-[700px] p-4 sm:p-6 m-4 bg-white dark:bg-slate-800 rounded-2xl shadow-xl flex flex-col">
        <button onClick={onClose} className="absolute top-4 right-4 z-[1001] text-gray-600 bg-white/80 rounded-full p-1 hover:bg-white dark:bg-slate-700/80 dark:text-gray-300 dark:hover:bg-slate-700" aria-label="Close map selector">
          <CloseIcon className="w-6 h-6" />
        </button>

        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Select Store Location</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Move the map to place the pin at your pharmacy's exact location.</p>
        </div>

        <div className="flex-grow rounded-lg overflow-hidden relative bg-slate-200 dark:bg-slate-700">
          <div ref={mapContainerRef} className="w-full h-full" />
          
          <button
            type="button"
            onClick={handleGoToMyLocation}
            className="absolute bottom-4 left-4 z-[1000] w-12 h-12 flex items-center justify-center bg-white dark:bg-slate-700 rounded-full shadow-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
            title="Go to my location"
          >
            <CrosshairIcon className="w-6 h-6" />
          </button>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[1000]">
            <LocationIcon className="w-10 h-10 text-red-500 drop-shadow-lg" style={{ transform: 'translateY(-50%)' }} />
          </div>
        </div>
        
        {locationError && <p className="mt-2 text-xs text-center text-red-600 dark:text-red-400">{locationError}</p>}

        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <button type="button" onClick={onClose} className="w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing}
            className="flex-grow flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-400 disabled:cursor-wait"
          >
            {isProcessing ? 'Getting Address...' : 'Confirm Location'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapSelector;
