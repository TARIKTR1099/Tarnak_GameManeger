import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { cacheService } from "./cache";

// --- Gemini API ---
export const getGeminiResponse = async (apiKey, prompt, history = []) => {
    if (!apiKey) throw new Error("API Key missing");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const chat = model.startChat({
        history: history.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        })),
    });

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    return response.text();
};

// --- OpenAI API (ChatGPT) ---
export const getChatGPTRecommendations = async (apiKey, criteria, excludeList = []) => {
    if (!apiKey) throw new Error("OpenAI API Key missing");

    const openai = new OpenAI({ apiKey: apiKey, dangerouslyAllowBrowser: true });

    const prompt = `
    Recommend 5 games based on these criteria:
    - Genre/Vibe: ${criteria.query}
    - Price Range: ${criteria.price}
    - Sort By: ${criteria.sort}
    
    Exclude these games: ${excludeList.join(', ')}.
    
    Return a JSON object with a "games" array. Each game object must have:
    - title: string
    - reason: string (Why this game fits the criteria, max 2 sentences)
    - price_category: string (Free, Low, Medium, High)
    
    Do NOT include games that don't fit the criteria well.
  `;

    const completion = await openai.chat.completions.create({
        messages: [{ role: "system", content: "You are a helpful game recommendation engine." }, { role: "user", content: prompt }],
        model: "gpt-3.5-turbo", // Or gpt-4-turbo if preferred/available
        response_format: { type: "json_object" },
    });

    const response = JSON.parse(completion.choices[0].message.content);
    return response.games || [];
};

// --- Free Games API ---
// Using a CORS proxy if needed, or direct if possible. 
// FreeToGame API: https://www.freetogame.com/api/games
export const getFreeGames = async () => {
    try {
        // Note: In production, you should use your own proxy. 
        // For this demo, we'll try direct, if it fails due to CORS, we might need a workaround.
        // Often "allorigins" or similar is used for client-side only demos.
        const response = await fetch('https://api.allorigins.win/get?url=' + encodeURIComponent('https://www.freetogame.com/api/games'));
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        return JSON.parse(data.contents);
    } catch (error) {
        console.error("Failed to fetch games:", error);
        return [];
    }
};

// --- Research API (Tavily) ---
export const searchWeb = async (apiKey, query) => {
    if (!apiKey) throw new Error("Research API Key missing");

    // Check cache first
    const cached = cacheService.get(`search_${query}`);
    if (cached) return cached;

    // Example for Tavily
    const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            api_key: apiKey,
            query: query,
            search_depth: "basic",
            include_answer: true,
            include_images: true, // Request images
        }),
    });

    if (!response.ok) throw new Error("Research API failed");
    const data = await response.json();

    // Cache result
    cacheService.set(`search_${query}`, data);

    return data;
};

// Helper to get image for a game using Research API
export const getGameImage = async (researchApiKey, gameTitle) => {
    const cacheKey = `img_${gameTitle}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;

    try {
        const data = await searchWeb(researchApiKey, `${gameTitle} game cover art wallpaper`);
        const image = data.images?.[0] || null; // Tavily returns images array if requested

        if (image) {
            cacheService.set(cacheKey, image);
        }
        return image;
    } catch (e) {
        return null;
    }
};
