import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { GEMINI_API_KEY } from "../secrets";

const API_KEY = GEMINI_API_KEY || "";
console.log('[Eco-AI] API Key Loaded:', API_KEY ? `Yes (${API_KEY.substring(0, 4)}...)` : 'No (Empty)');

const genAI = new GoogleGenerativeAI(API_KEY);

// Use Gemini 2.5 Flash-Lite for fast responses
const FAST_MODEL = "gemini-2.5-flash-lite";
const DETAILED_MODEL = "gemini-2.5-flash";

// 30 second timeout - user-initiated action, not blocking
const TIMEOUT_MS = 30000;

export interface EcoAiAnalysis {
    waste_present: "YES" | "NO" | "UNCERTAIN";
    confidence_percentage: number;
    waste_types_detected: string[];
    severity_level: "Low" | "Medium" | "High" | "Critical";
    authority_report: string;
    summary_for_dashboard: string;
    urgency_level: "Low" | "Medium" | "High" | "Critical";
    size_estimation: string;
    hazard_indicators: string[];
    impact_details: string;
    animal_hazard: boolean;
    water_impact_details: string | null;
    accessibility_block: string[];
    affected_population: string[];
}

// Simplified fast prompt for 5-second response
const FAST_PROMPT = `Analyze this image for waste/garbage. Return ONLY this JSON:
{
    "waste_present": "YES/NO/UNCERTAIN",
    "confidence_percentage": 0-100,
    "waste_types_detected": ["type1","type2"],
    "severity_level": "Low/Medium/High/Critical",
    "authority_report": "Brief 2-sentence description",
    "summary_for_dashboard": "One sentence summary",
    "urgency_level": "Low/Medium/High/Critical",
    "size_estimation": "Small/Medium/Large",
    "hazard_indicators": [],
    "impact_details": "Brief impact",
    "animal_hazard": true/false,
    "water_impact_details": null,
    "accessibility_block": [],
    "affected_population": []
}
Be fast and concise. Return ONLY valid JSON.`;

// Promise with timeout
const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
        )
    ]);
};

const analyzeWithModel = async (modelName: string, base64Image: string, useFastPrompt: boolean = true): Promise<EcoAiAnalysis> => {
    if (!API_KEY) throw new Error("API Key is missing in secrets.ts");

    const model = genAI.getGenerativeModel({
        model: modelName,
        safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ],
        generationConfig: {
            maxOutputTokens: 500, // Limit output for speed
            temperature: 0.1, // Lower temperature for faster, consistent responses
        }
    });

    const imagePart = {
        inlineData: {
            data: base64Image,
            mimeType: "image/jpeg",
        },
    };

    const result = await model.generateContent([FAST_PROMPT, imagePart]);
    const response = await result.response;
    const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(text) as EcoAiAnalysis;
};

export const GeminiService = {
    analyzeImage: async (base64Image: string): Promise<EcoAiAnalysis> => {
        const startTime = Date.now();

        try {
            console.log(`[Eco-AI] Starting fast analysis (${TIMEOUT_MS}ms timeout)...`);

            // Try fast model with timeout
            const result = await withTimeout(
                analyzeWithModel(FAST_MODEL, base64Image, true),
                TIMEOUT_MS
            );

            console.log(`[Eco-AI] Analysis complete in ${Date.now() - startTime}ms`);
            return result;

        } catch (error: any) {
            console.warn(`[Eco-AI] Fast analysis failed: ${error.message}`);

            // If timeout or error, return quick fallback
            console.log(`[Eco-AI] Returning fallback response`);

            return {
                waste_present: "UNCERTAIN",
                confidence_percentage: 50,
                waste_types_detected: ["Unknown - Manual verification needed"],
                severity_level: "Medium",
                authority_report: "AI analysis timed out. Please verify waste type and severity manually.",
                summary_for_dashboard: "Analysis incomplete - manual review required.",
                urgency_level: "Medium",
                size_estimation: "Unknown",
                hazard_indicators: [],
                impact_details: "Please assess manually",
                animal_hazard: false,
                water_impact_details: null,
                accessibility_block: [],
                affected_population: []
            };
        }
    },

    // Quick description for fast response
    generateDescription: async (base64Image: string, locationContext?: string): Promise<string> => {
        try {
            const model = genAI.getGenerativeModel({
                model: FAST_MODEL,
                generationConfig: { maxOutputTokens: 100 }
            });
            const prompt = `Describe this waste in 1 sentence. Location: ${locationContext || 'Unknown'}.`;

            const imagePart = {
                inlineData: {
                    data: base64Image,
                    mimeType: "image/jpeg",
                },
            };

            const result = await withTimeout(
                model.generateContent([prompt, imagePart]),
                3000 // 3 second timeout for descriptions
            );
            return (await result).response.text();
        } catch (error) {
            return "Waste detected - please review.";
        }
    }
};
