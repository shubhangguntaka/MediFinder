
import { GoogleGenAI, Type } from "@google/genai";

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

export const getMedicineInfo = async (medicineName: string): Promise<string | null> => {
    try {
        const prompt = `Provide a brief, one-paragraph description for the medicine "${medicineName}". Focus on its primary use, what it treats, and common forms. Keep it simple and easy for a layperson to understand. If you cannot find information, state that clearly.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                temperature: 0.4,
                topP: 0.9,
                topK: 30,
            },
        });

        const text = response.text.trim();
        // Avoid returning generic failure messages from the model as valid info
        if (text.toLowerCase().includes("cannot find information") || text.toLowerCase().includes("i do not have information")) {
            return null;
        }

        return text;
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
