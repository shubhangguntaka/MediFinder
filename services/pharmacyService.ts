

import Fuse from 'fuse.js';
import type { Pharmacy, StoredUser, AuthorUser, SearchResult, BasicStoreInfo } from '../types';
import { getMedicineInfo } from './geminiService';

// Helper to get users from localStorage
const getUsersFromStorage = (): StoredUser[] => {
    try {
        const users = localStorage.getItem('medifind_users');
        return users ? JSON.parse(users) : [];
    } catch (e) {
        return [];
    }
};

/**
 * Calculates the distance between two geo-coordinates using the Haversine formula.
 * @returns Distance in kilometers.
 */
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

export const getAllPharmacies = (
    userLocation: { lat: number, lng: number } | null
): Promise<BasicStoreInfo[]> => {
    const allUsers = getUsersFromStorage();
    const authors = allUsers.filter(user => user.role === 'author') as AuthorUser[];

    const stores: BasicStoreInfo[] = authors.map(author => {
        const distance = userLocation
            ? calculateDistance(userLocation.lat, userLocation.lng, author.location.lat, author.location.lng)
            : -1;
        return {
            name: author.storeName,
            address: author.address,
            location: author.location,
            distance: distance,
        };
    });
    
    // Sort by distance if location is available
    if (userLocation) {
        stores.sort((a, b) => a.distance - b.distance);
    }
    
    // Simulate network delay for a better user experience
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(stores);
        }, 300);
    });
};


export const searchPharmacies = async (
    query: string,
    userLocation: { lat: number, lng: number } | null
): Promise<SearchResult | null> => {
    
    const allUsers = getUsersFromStorage();
    const authors = allUsers.filter(user => user.role === 'author') as AuthorUser[];
    const searchTerm = query.trim();

    if (!searchTerm) {
        return null;
    }

    // 1. Check if the search term matches a store name using Fuse.js
    const storeFuse = new Fuse(authors, {
        keys: ['storeName'],
        includeScore: true,
        threshold: 0.3, // Stricter threshold for store names
    });
    const storeResults = storeFuse.search(searchTerm);

    if (storeResults.length > 0 && (storeResults[0].score ?? 1) < 0.3) {
        const matchingStore = storeResults[0].item;
        const distance = userLocation 
            ? calculateDistance(userLocation.lat, userLocation.lng, matchingStore.location.lat, matchingStore.location.lng) 
            : -1;
        
        const result: SearchResult = {
            type: 'store',
            data: {
                store: {
                    email: matchingStore.email,
                    storeName: matchingStore.storeName,
                    address: matchingStore.address,
                    location: matchingStore.location,
                },
                inventory: matchingStore.inventory,
                distance,
            }
        };
        return result;
    }


    // 2. If not a store, search for medicines across all stores using Fuse.js
    const foundPharmacies: Pharmacy[] = [];
    authors.forEach(author => {
        if (!author.inventory || author.inventory.length === 0) return;

        const medicineFuse = new Fuse(author.inventory, {
            keys: ['name', 'brands'], // Search in both generic name and brands
            includeScore: true,
            threshold: 0.4, // More lenient threshold for medicine names
        });
        const medicineResults = medicineFuse.search(searchTerm);

        if (medicineResults.length > 0) {
            // Take the best match
            const bestMatch = medicineResults[0].item; 
            const distance = userLocation
                ? calculateDistance(userLocation.lat, userLocation.lng, author.location.lat, author.location.lng)
                : -1;

            const pharmacy: Pharmacy = {
                name: author.storeName,
                address: author.address,
                location: author.location,
                medicine: bestMatch,
                distance: distance
            };
            foundPharmacies.push(pharmacy);
        }
    });
    
    if (foundPharmacies.length === 0) {
        return null;
    }

    // Fetch medicine info from Gemini
    const medicineInfo = await getMedicineInfo(searchTerm);
    
    // Sort by distance if location is available
    if (userLocation) {
        foundPharmacies.sort((a, b) => a.distance - b.distance);
    }
    
    const result: SearchResult = {
        type: 'medicines',
        data: foundPharmacies,
        medicineName: searchTerm,
        medicineInfo,
    };

    // Simulate network delay for a better user experience
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(result);
        }, 300);
    });
};