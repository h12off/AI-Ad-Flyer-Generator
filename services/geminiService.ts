import { GoogleGenAI, Type } from "@google/genai";
import type { AdConcept } from '../types';

const apiKey = process.env.VITE_GEMINI_API_KEY as string;

if (!apiKey) {
  throw new Error('VITE_GEMINI_API_KEY environment variable not set');
}

const ai = new GoogleGenAI({ apiKey });

const adGenerationSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      headline: {
        type: Type.STRING,
        description: "A short, punchy, and professional headline for the ad (max 10 words).",
      },
      body: {
        type: Type.STRING,
        description: "Concise and persuasive ad body text that highlights the value proposition (max 25 words).",
      },
      cta: {
        type: Type.STRING,
        description: "A clear and compelling call-to-action, e.g., 'Learn More', 'Shop Now'.",
      },
      promo: {
        type: Type.STRING,
        description: "An optional, short, and compelling promotional offer, like '25% OFF' or 'Free Trial'. This should only be included if a promo deal is mentioned in the prompt."
      },
      price: {
        type: Type.STRING,
        description: "A price for the product or service, e.g., '$99', 'Starting at $49/mo'. This should only be included if a price is mentioned in the prompt."
      },
      previousPrice: {
        type: Type.STRING,
        description: "An optional previous price, used to show a discount (e.g., a strikethrough price). This should only be included if a previous price is mentioned in the prompt to create a sense of value."
      }
    },
    required: ["headline", "body", "cta"],
  },
};

export const generateAdIdeas = async (userPrompt: string, promoDeal: string, price: string, previousPrice: string): Promise<AdConcept[]> => {
  try {
    let fullPrompt = `Based on the user's request below, generate 4 distinct and compelling ad concepts for a social media flyer. Each concept must have a headline, body, and call-to-action (CTA). Use the user's text to understand the service, goal, and key points.`;

    if (promoDeal) {
      fullPrompt += `\n\nCrucially, incorporate the following promotional deal into each ad concept in a natural and enticing way: "${promoDeal}"`;
    }
    
    if (price) {
      fullPrompt += `\n\nAlso, prominently feature the following price point: "${price}"`;
    }

    if (previousPrice) {
        fullPrompt += `\n\nTo highlight the value, show this previous price "${previousPrice}" next to the current price, indicating a discount.`;
    }

    fullPrompt += `\n\nUser's Request: "${userPrompt}"`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: adGenerationSchema,
      },
    });
    
    const jsonText = response.text.trim();
    const adConcepts = JSON.parse(jsonText);

    // Basic validation
    if (!Array.isArray(adConcepts)) {
        throw new Error("API did not return an array of ad concepts.");
    }

    return adConcepts as AdConcept[];

  } catch (error) {
    console.error("Error generating ad ideas:", error);
    // In a real app, you might want to return a more user-friendly error or an empty array.
    throw new Error("Failed to generate ad ideas. Please check the console for details.");
  }
};