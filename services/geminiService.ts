
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

const imageAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        medicines: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'A list of medicine names (generic or brand) identified in the image.'
        },
        confidence: { type: Type.NUMBER, description: 'Confidence score from 0 to 1.' },
        note: { type: Type.STRING, description: 'A short helpful note about what was found.' },
        error: { type: Type.STRING, description: 'Specific error message if identification failed (e.g., image too blurry, not a medicine).' }
    },
    required: ["medicines"]
};

// Helper to clean JSON string from Markdown code blocks
const cleanJsonString = (text: string): string => {
    let cleanText = text.trim();
    if (cleanText.startsWith("```")) {
        cleanText = cleanText.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/\s*```$/, "");
    }
    return cleanText;
};

export const getMedicineInfo = async (medicineName: string): Promise<MedicineInfo | null> => {
    try {
        const prompt = `Provide details for the medicine "${medicineName}". Focus on its primary use, what it treats, and common forms. Keep the description simple and easy for a layperson to understand. If you cannot find information, state that clearly in the description and use "N/A" for other fields.`;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                temperature: 0.2,
                responseMimeType: "application/json",
                responseSchema: medicineInfoSchema,
            },
        });

        const rawText = response.text?.trim();
        if (!rawText) return null;
        
        const jsonText = cleanJsonString(rawText);
        const info = JSON.parse(jsonText);
        
        if (info.description.toLowerCase().includes("cannot find information") || info.description.toLowerCase().includes("i do not have information")) {
            return null;
        }

        return info as MedicineInfo;
    } catch (error) {
        console.error(`Error fetching info for ${medicineName}:`, error);
        return null;
    }
};

export const analyzeMedicineImage = async (base64Image: string, mimeType: string, mode: 'prescription' | 'identification'): Promise<{ medicines: string[], note?: string, error?: string } | null> => {
    try {
        const systemInstruction = mode === 'prescription' 
            ? "You are a specialized medical OCR assistant. Your task is to accurately extract all pharmaceutical drug names (both generic and brand names) from medical prescriptions. You must ignore patient names, doctor names, hospital headers, and dosages (like 500mg, 1 tab daily). Only return the chemical or commercial names of the drugs. If the image is not a prescription or is illegible, use the error field to explain why."
            : "You are a pharmaceutical identification expert. Your task is to identify the specific medicine shown in an image, which could be a loose pill, a medicine strip, or a medicine box/bottle. Identify by color, shape, markings (imprints), or printed text on the packaging. Prioritize identifying the main active generic ingredient or the commercial brand name. If you are unsure, provide the most likely candidate. If the image is not medicine-related or is too blurry, use the error field.";

        const prompt = mode === 'prescription'
            ? "Analyze this prescription and extract all medicine names. If it's a doctor's note, look for the 'Rx' section."
            : "Identify this medicine. Look for brand names on the packaging or imprints on the pill.";

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: {
                parts: [
                    { inlineData: { data: base64Image, mimeType } },
                    { text: prompt }
                ]
            },
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: imageAnalysisSchema,
            }
        });

        const rawText = response.text?.trim();
        if (!rawText) throw new Error("Received empty response from AI");

        const jsonText = cleanJsonString(rawText);
        const result = JSON.parse(jsonText);
        return result;
    } catch (error) {
        console.error("Error analyzing image:", error);
        return { medicines: [], error: "The AI service encountered an error processing your image. Please try again with better lighting." };
    }
}

export const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number }> => {
    try {
        const prompt = `
            You are a highly accurate geocoding API. Your task is to convert the following address into precise geographical coordinates (latitude and longitude).
            Address: "${address}"
            Return ONLY the JSON object with 'lat' and 'lng' keys. Be as precise as possible. If the address is ambiguous or cannot be geocoded, you MUST return a JSON object with an 'error' key, for example: {"error": "Address not found"}. Do not make up coordinates.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: geocodeSchema,
            },
        });

        const rawText = response.text?.trim();
        if (!rawText) throw new Error("Empty response");

        const jsonText = cleanJsonString(rawText);
        const coordinates = JSON.parse(jsonText);
        
        if (coordinates.error || !coordinates.lat || !coordinates.lng) {
            throw new Error(coordinates.error || 'Invalid coordinates returned from API.');
        }

        return { lat: coordinates.lat, lng: coordinates.lng };

    } catch (error) {
        console.error("Error geocoding address with Gemini API:", error);
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
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: reverseGeocodeSchema,
            },
        });
        
        const rawText = response.text?.trim();
        if (!rawText) return 'Unknown location';

        const jsonText = cleanJsonString(rawText);
        const { address } = JSON.parse(jsonText);
        return address || 'Unknown location';
    } catch (error) {
        console.error("Error reverse geocoding coordinates with Gemini API:", error);
        return 'Could not determine address';
    }
};
