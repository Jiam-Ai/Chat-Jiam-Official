import type { ImageContent, LyricsContent } from '../types';

export const imageAPIs = [
  { name: 'MagicStudio', url: (prompt: string) => `https://api.siputzx.my.id/api/ai/magicstudio?prompt=${encodeURIComponent(prompt)}` },
  { name: 'BIMG', url: (prompt: string) => `https://api.siputzx.my.id/api/s/bimg?query=${encodeURIComponent(prompt)}`},
  { name: 'DALL-E', url: (prompt:string) => `https://apis.davidcyriltech.my.id/ai/dalle?text=${encodeURIComponent(prompt)}` },
  { name: 'Flux', url: (prompt: string) => `https://api.siputzx.my.id/api/ai/flux?prompt=${encodeURIComponent(prompt)}` }
];

export const availableImageApis = imageAPIs.map(api => api.name);

export const externalApiService = {
  generateImages: async (prompt: string, apiName: string = 'All'): Promise<ImageContent[]> => {
    const apisToUse = apiName === 'All'
      ? imageAPIs
      : imageAPIs.filter(api => api.name === apiName);

    if (apisToUse.length === 0) {
      console.warn(`Image API "${apiName}" not found.`);
      return [];
    }
    
    const promises = apisToUse.map(api =>
      fetch(api.url(prompt))
        .then(res => {
          if (!res.ok) throw new Error(`API ${api.name} failed with status: ${res.status}`);
          return res.blob();
        })
        .then(blob => {
          if (!blob.type.startsWith('image/')) throw new Error(`Invalid content type from ${api.name}: ${blob.type}`);
          return {
            blobUrl: URL.createObjectURL(blob),
            apiUrl: api.url(prompt),
            apiName: api.name,
          };
        })
    );

    const results = await Promise.allSettled(promises);
    const successfulImages: ImageContent[] = [];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        successfulImages.push(result.value);
      } else if (result.status === 'rejected') {
        console.warn(`Image API ${apisToUse[index].name} failed:`, result.reason);
      }
    });
    
    if (successfulImages.length === 0 && apisToUse.length > 0) {
        const firstFailure = results.find(r => r.status === 'rejected') as PromiseRejectedResult | undefined;
        let errorMessage = "All image generation services failed. They may be busy or offline.";
        if (firstFailure) {
            const reason = firstFailure.reason instanceof Error ? firstFailure.reason.message : String(firstFailure.reason);
            errorMessage = `Image generation failed. Error: ${reason}`;
        }
        throw new Error(errorMessage);
    }
    
    return successfulImages;
  },

  fetchLyrics: async (query: string): Promise<LyricsContent> => {
    try {
        const response = await fetch(`https://api.ryzumi.vip/api/search/lyrics?query=${encodeURIComponent(query)}`);
        if (!response.ok) {
            if (response.status === 404) throw new Error("Could not find lyrics for that query.");
            throw new Error(`Lyrics API request failed with status: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) {
            throw new Error("Sorry, I couldn't find any lyrics matching your query.");
        }

        const firstHit = data[0];
        if (!firstHit || !firstHit.plainLyrics) {
            throw new Error("The lyrics service returned an invalid response.");
        }

        return {
          title: firstHit.name || 'Unknown Title',
          artist: firstHit.artistName || 'Unknown Artist',
          lyrics: firstHit.plainLyrics,
        };
    } catch (error) {
        if (error instanceof Error && (error.message.includes('find lyrics') || error.message.includes('invalid response') || error.message.includes('request failed'))) {
            throw error; // Re-throw our custom, user-friendly errors
        }
        console.error("Lyrics API fetch error:", error);
        throw new Error("The lyrics service is currently unavailable. Please check your connection and try again.");
    }
  }
};