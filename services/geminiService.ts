
import { GoogleGenAI, Type } from "@google/genai";
import type { MedicineInfo } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const geocodeSchema = {
    type: Type.OBJECT,
    properties: {
        lat: { type: Type.NUMBER, description: 'The latitude of the address.' },
        lng: { type: Type.NUMBER, description: 'The longitude of the address.' },
        error: { type: Type.STRING, description: 'An error message if the address cannot be geocoded.' },
    },
};

const reverseGeocodeSchema = {
    type: Type.OBJECT,
    properties: {
        address: { type: Type.STRING, description: 'The full street address for the given coordinates.' },
    },
    required: ["address"],
};

const medicineInfoSchema = {
    type: Type.OBJECT,
    properties: {
        description: { type: Type.STRING, description: 'A brief, one-paragraph description of the medicine for a layperson. If you cannot find information, this field should state that clearly.' },
        primaryUse: { type: Type.STRING, description: 'The primary medical condition this medicine is used to treat. Should be "N/A" if not found.' },
        commonForms: { type: Type.STRING, description: 'Common forms the medicine comes in (e.g., tablets, syrup, injection). Should be "N/A" if not found.' },
    },
    required: ["description", "primaryUse", "commonForms"],
};

export const getMedicineInfo = async (medicineName: string): Promise<MedicineInfo | null> => {
    try {
        const prompt = `Provide details for the medicine "${medicineName}". Focus on its primary use, what it treats, and common forms. Keep the description simple and easy for a layperson to understand. If you cannot find information, state that clearly in the description and use "N/A" for other fields.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                temperature: 0.2,
                responseMimeType: "application/json",
                responseSchema: medicineInfoSchema,
            },
        });

        const jsonText = response.text.trim();
        const info = JSON.parse(jsonText);
        
        // Avoid returning generic failure messages from the model as valid info
        if (info.description.toLowerCase().includes("cannot find information") || info.description.toLowerCase().includes("i do not have information")) {
            return null;
        }

        return info as MedicineInfo;
    } catch (error) {
        console.error(`Error fetching info for ${medicineName}:`, error);
        return null; // Return null on error so the app doesn't break
    }
};

export const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number }> => {
    try {
        const prompt = `
            You are a highly accurate geocoding API. Your task is to convert the following address into precise geographical coordinates (latitude and longitude).
            Address: "${address}"
            Return ONLY the JSON object with 'lat' and 'lng' keys. Be as precise as possible. If the address is ambiguous or cannot be geocoded, you MUST return a JSON object with an 'error' key, for example: {"error": "Address not found"}. Do not make up coordinates.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: geocodeSchema,
            },
        });

        const jsonText = response.text.trim();
        const coordinates = JSON.parse(jsonText);
        
        if (coordinates.error || !coordinates.lat || !coordinates.lng) {
            throw new Error(coordinates.error || 'Invalid coordinates returned from API.');
        }

        return { lat: coordinates.lat, lng: coordinates.lng };

    } catch (error) {
        console.error("Error geocoding address with Gemini API:", error);
        // Throw the error so the calling function can handle it.
        throw new Error(`Could not find coordinates for "${address}".`);
    }
};

export const reverseGeocodeCoordinates = async (coords: { lat: number; lng: number }): Promise<string> => {
    try {
        const prompt = `
            You are a highly accurate reverse geocoding API. Convert the following geographical coordinates into a precise, complete, human-readable street address.
            Coordinates: latitude: ${coords.lat}, longitude: ${coords.lng}
            The address should be formatted correctly for the location's region. Return only the JSON object with the key "address". If you cannot determine a street address, provide the most specific location description possible (e.g., a park name, landmark, or city).
        `;
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: reverseGeocodeSchema,
            },
        });
        const jsonText = response.text.trim();
        const { address } = JSON.parse(jsonText);
        return address || 'Unknown location';
    } catch (error) {
        console.error("Error reverse geocoding coordinates with Gemini API:", error);
        return 'Could not determine address';
    }
};
