
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
    },
    required: ["lat", "lng"],
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
            You are a geocoding API. Your task is to convert the following address into geographical coordinates (latitude and longitude).
            Address: "${address}"
            Return only the JSON object with lat and lng. If you cannot determine the coordinates, return a random location in a major city.
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
        
        return coordinates as { lat: number; lng: number };

    } catch (error) {
        console.error("Error geocoding address with Gemini API:", error);
        // Fallback to a random location on error
        return {
            lat: 37.7749 + (Math.random() - 0.5) * 0.1, // SF fallback
            lng: -122.4194 + (Math.random() - 0.5) * 0.1,
        };
    }
};