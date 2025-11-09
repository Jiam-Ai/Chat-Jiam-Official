import { GoogleGenAI, Modality } from "@google/genai";
import type { ChatMessage, ImageContent } from '../types';

// Fix: Per guidelines, the API key must be obtained from process.env.API_KEY.
export const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.error("API_KEY environment variable not set for Gemini service.");
}

const ai = new GoogleGenAI({ apiKey: apiKey! });

const textModel = 'gemini-2.5-flash';
const visionModel = 'gemini-2.5-flash-image';
const videoModel = 'veo-2.0-generate-001';


const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
        };
        reader.onerror = error => reject(error);
    });
};

const fileToGenerativePart = async (file: File) => {
    const base64EncodedData = await fileToBase64(file);
    return {
        inlineData: {
            mimeType: file.type,
            data: base64EncodedData,
        },
    };
};

const base64ToBlob = async (base64: string, mimeType: string): Promise<Blob> => {
    const res = await fetch(`data:${mimeType};base64,${base64}`);
    return res.blob();
};


export const geminiService = {
  getChatResponseStream: async function (
    contents: any[],
    systemInstruction: string,
    tools: any[],
    isThinkingModeEnabled: boolean
  ): Promise<AsyncIterable<any>> {
    try {
        const config: any = {
            systemInstruction: systemInstruction,
        };
        
        if (isThinkingModeEnabled) {
             // Allocate a larger budget for more complex reasoning when the user enables this mode.
             config.thinkingConfig = { thinkingBudget: 16384 };
        }

        if (tools.length > 0) {
            config.tools = tools;
        }

        return await ai.models.generateContentStream({
            model: textModel,
            contents: contents,
            config: config,
        });

    } catch (error) {
        console.error("Error getting streaming response from Gemini:", error);
        throw new Error("The AI is currently unresponsive. This could be due to a network issue or the service being temporarily down. Please try again shortly.");
    }
  },

  editImage: async (prompt: string, imageFile: File): Promise<{ text?: string; image?: ImageContent }> => {
    try {
        const base64Data = await fileToBase64(imageFile);

        const imagePart = {
            inlineData: {
                mimeType: imageFile.type,
                data: base64Data,
            },
        };

        const textPart = {
            text: prompt,
        };

        const response = await ai.models.generateContent({
            model: visionModel,
            contents: { parts: [imagePart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        const result: { text?: string; image?: ImageContent } = {};
        
        for (const part of response.candidates[0].content.parts) {
            if (part.text) {
                result.text = part.text;
            } else if (part.inlineData) {
                const blob = await base64ToBlob(part.inlineData.data, part.inlineData.mimeType);
                result.image = {
                    blobUrl: URL.createObjectURL(blob),
                    apiName: 'Jiam Edit',
                    apiUrl: '',
                };
            }
        }
        
        if (!result.text && !result.image) {
            throw new Error("The AI did not return a valid response. It may not have understood the request.");
        }

        return result;

    } catch (error) {
        console.error("Error editing image with Gemini:", error);
        throw new Error("Failed to edit the image. The AI service may be down or the image format might not be supported.");
    }
  },

  generateVideo: async (prompt: string): Promise<any> => {
    try {
        const operation = await ai.models.generateVideos({
            model: videoModel,
            prompt: prompt,
            config: {
                numberOfVideos: 1,
            },
        });
        return operation;
    } catch (error) {
        console.error("Error initiating video generation with Gemini:", error);
        throw new Error("Failed to start video generation. The service may be unavailable.");
    }
  },

  checkVideoStatus: async (operation: any): Promise<any> => {
      try {
          return await ai.operations.getVideosOperation({ operation: operation });
      } catch (error) {
          console.error("Error checking video status:", error);
          // Don't throw here, as polling failures should be handled gracefully
          return operation; // Return original operation to allow retries
      }
  },
};
