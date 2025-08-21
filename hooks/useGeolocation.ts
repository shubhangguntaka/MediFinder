import { useState, useEffect } from 'react';

interface Location {
    lat: number;
    lng: number;
}

interface GeolocationState {
    location: Location | null;
    error: string | null;
    isLoading: boolean;
}

export const useGeolocation = (): GeolocationState => {
    const [state, setState] = useState<GeolocationState>({
        location: null,
        error: null,
        isLoading: true,
    });

    useEffect(() => {
        if (!navigator.geolocation) {
            setState({
                location: null,
                error: 'Geolocation is not supported by your browser.',
                isLoading: false,
            });
            return;
        }

        const onSuccess = (position: GeolocationPosition) => {
            setState({
                location: {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                },
                error: null,
                isLoading: false,
            });
        };

        const onError = (error: GeolocationPositionError) => {
            setState({
                location: null,
                error: `Failed to get location: ${error.message}`,
                isLoading: false,
            });
        };

        // Standard browser API to get current location
        navigator.geolocation.getCurrentPosition(onSuccess, onError, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
        });

    }, []);

    return state;
};
