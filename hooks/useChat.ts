import { useState, useEffect, useCallback, useRef } from 'react';
import { geminiService, apiKey } from '../services/geminiService';
import { externalApiService } from '../services/externalApiService';
import { firebaseService } from '../services/firebaseService';
import { useToasts } from '../context/ToastContext';
import type { User, ChatMessage, ImageContent, LyricsContent, UserFileContent, MultimodalUserContent } from '../types';
import { FunctionDeclaration, Type } from '@google/genai';

// --- Tool Definitions for Gemini Function Calling ---

const tools: FunctionDeclaration[] = [
    {
        name: 'generate_images',
        description: "Generates a static, 2D image, picture, photo, drawing, or illustration based on a user's text prompt. Use this for requests involving visual art that does not move, such as creating a logo, drawing a character, or rendering a scene. Do not use this tool for videos or animations.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                prompt: { type: Type.STRING, description: 'A detailed description of the image to generate.' },
                apiName: { type: Type.STRING, description: 'The specific image generation API to use. Defaults to "All".' },
            },
            required: ['prompt'],
        },
    },
    {
        name: 'fetch_lyrics',
        description: "Fetches the lyrics for a song. Use this when the user asks for lyrics.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                query: { type: Type.STRING, description: 'The name of the song and/or artist.' },
            },
            required: ['query'],
        },
    },
    {
        name: 'google_search',
        description: "Performs a Google search for up-to-date information, recent events, or when the user asks to search or look something up. This tool provides web search grounding for the AI's response.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                query: { type: Type.STRING, description: 'The search query.' },
            },
            required: ['query'],
        },
    },
    {
        name: 'generate_video',
        description: "Generates a short, animated video clip based on a user's text prompt. Use this for requests involving moving pictures, animations, or clips. Do not use this tool for static images, photos, or drawings.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                prompt: { type: Type.STRING, description: 'A detailed description of the video to generate.' },
            },
            required: ['prompt'],
        }
    }
];

export const useChat = (currentUser: User | null, isThinkingModeEnabled: boolean) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [loadingTask, setLoadingTask] = useState<'text' | 'tool-image' | 'tool-lyrics' | 'tool-search' | 'tool-video' | null>(null);
    const [memoryConfirmation, setMemoryConfirmation] = useState<{ fact: string; messageId: string } | null>(null);
    const { addToast } = useToasts();
    const videoPollingIntervals = useRef<Map<string, number>>(new Map());
    const isStoppedRef = useRef(false);

    const stopAllVideoPolling = useCallback(() => {
        videoPollingIntervals.current.forEach(intervalId => clearInterval(intervalId));
        videoPollingIntervals.current.clear();
    }, []);

    useEffect(() => {
        return () => stopAllVideoPolling();
    }, [stopAllVideoPolling]);


    useEffect(() => {
        const loadHistory = async () => {
            if (!currentUser || currentUser.username === 'Guest') {
                setMessages([{
                    id: 'welcome-guest',
                    type: 'system',
                    sender: 'jiam',
                    content: "Hey there! I'm Jiam. Ask me anything. Sign up to save your chats!",
                    timestamp: Date.now()
                }]);
                return;
            }
            const history = await firebaseService.getChatHistory(currentUser.username);
            if (history.length === 0) {
                 setMessages([{
                    id: 'welcome-back',
                    type: 'system',
                    sender: 'jiam',
                    content: `Welcome back, ${currentUser.username}! What's on your mind?`,
                    timestamp: Date.now()
                }]);
            } else {
                setMessages(history);
            }
        };
        loadHistory();
    }, [currentUser]);

    useEffect(() => {
        if (currentUser?.username) {
            const unsubscribe = firebaseService.listenForBroadcasts(currentUser.username, (broadcastMessage) => {
                if (broadcastMessage) {
                    setMessages(prev => {
                        // Remove any existing broadcast message, then add the new one.
                        const otherMessages = prev.filter(msg => msg.type !== 'broadcast');
                        return [...otherMessages, broadcastMessage];
                    });
                } else {
                    // This is called when the broadcast is deleted from the DB
                    setMessages(prev => prev.filter(msg => msg.type !== 'broadcast'));
                }
            });
            return () => unsubscribe();
        }
    }, [currentUser?.username]);

    const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage => {
        const newMessage: ChatMessage = {
            ...message,
            id: `${Date.now()}-${Math.random()}`,
            timestamp: Date.now(),
        };
        setMessages(prev => {
            const updatedMessages = [...prev, newMessage];
            if (currentUser && currentUser.username !== 'Guest') {
                firebaseService.saveChatHistory(currentUser.username, updatedMessages);
            }
            return updatedMessages;
        });
        return newMessage;
    }, [currentUser]);

    const updateMessage = useCallback((messageId: string, updates: Partial<ChatMessage>) => {
        setMessages(prev => {
            let messageUpdated = false;
            const updatedMessages = prev.map(msg => {
                if (msg.id === messageId) {
                    messageUpdated = true;
                    return { ...msg, ...updates };
                }
                return msg;
            });

            if (messageUpdated && currentUser && currentUser.username !== 'Guest') {
                if (updates.type !== 'live-ai' && updates.type !== 'live-user') {
                     firebaseService.saveChatHistory(currentUser.username, updatedMessages);
                }
            }
            return updatedMessages;
        });
    }, [currentUser]);

    const pollVideoStatus = useCallback((messageId: string, operation: any) => {
        const intervalId = window.setInterval(async () => {
            try {
                const updatedOperation = await geminiService.checkVideoStatus(operation);
                if (updatedOperation.done) {
                    clearInterval(videoPollingIntervals.current.get(messageId));
                    videoPollingIntervals.current.delete(messageId);

                    if (updatedOperation.error) {
                         updateMessage(messageId, { content: { state: 'error', error: updatedOperation.error.message, prompt: (messages.find(m=>m.id === messageId)?.content as any)?.prompt } });
                         return;
                    }

                    const video = updatedOperation.response?.generatedVideos?.[0]?.video;
                    if (video?.uri) {
                        const downloadUrl = `${video.uri}&key=${apiKey}`;
                        const response = await fetch(downloadUrl);
                        if (!response.ok) throw new Error(`Failed to fetch video: ${response.status} ${response.statusText}`);
                        const blob = await response.blob();
                        const videoUrl = URL.createObjectURL(blob);
                        updateMessage(messageId, { content: { state: 'done', videoUrl, downloadUrl, prompt: (messages.find(m=>m.id === messageId)?.content as any)?.prompt } });
                    } else {
                        throw new Error("Video generation finished but no video URI was found.");
                    }
                }
            } catch (error) {
                console.error(`Polling failed for video ${messageId}:`, error);
                clearInterval(videoPollingIntervals.current.get(messageId));
                videoPollingIntervals.current.delete(messageId);
                const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during polling.";
                updateMessage(messageId, { content: { state: 'error', error: errorMessage, prompt: (messages.find(m=>m.id === messageId)?.content as any)?.prompt } });
            }
        }, 10000); // Poll every 10 seconds
        videoPollingIntervals.current.set(messageId, intervalId);
    }, [updateMessage, messages]);

    const deleteMessage = useCallback((messageId: string) => {
        if (videoPollingIntervals.current.has(messageId)) {
            clearInterval(videoPollingIntervals.current.get(messageId));
            videoPollingIntervals.current.delete(messageId);
        }
        setMessages(prev => {
            const updatedMessages = prev.filter(msg => msg.id !== messageId);
            if (currentUser && currentUser.username !== 'Guest') {
                firebaseService.saveChatHistory(currentUser.username, updatedMessages);
            }
            return updatedMessages;
        });
    }, [currentUser]);

    const _executeGeneration = async (prompt: string, historyForGemini: any[], apiName: string = 'All', imageFile?: File | null, analysisFile?: File | null) => {
        if (!currentUser) return;
        setIsLoading(true);
        isStoppedRef.current = false;

        try {
            if (imageFile) {
                setLoadingTask('tool-image');
                const result = await geminiService.editImage(prompt, imageFile);
                if (result.image) addMessage({ type: 'image', sender: 'jiam', content: { images: [result.image] } });
                if (result.text) addMessage({ type: 'text', sender: 'jiam', content: result.text });
            } else {
                setLoadingTask('text');
                const [persona, memory] = await Promise.all([
                    firebaseService.getGlobalPersona(),
                    currentUser.username === 'Guest' ? Promise.resolve('') : firebaseService.getUserMemory(currentUser.username)
                ]);
                const fullSystemInstruction = `${persona}\n\n# MEMORY BANK\nThis is what you already know about the user. You MUST use this to inform and personalize your response:\n${memory}`;
                
                const userPromptParts = [];
                if (analysisFile) {
                    const filePart = { inlineData: { mimeType: analysisFile.type, data: await new Promise<string>((res, rej) => {
                        const reader = new FileReader();
                        reader.onload = () => res((reader.result as string).split(',')[1]);
                        reader.onerror = rej;
                        reader.readAsDataURL(analysisFile);
                    })}};
                    userPromptParts.push(filePart);
                }
                userPromptParts.push({ text: prompt });
                
                const contents = [...historyForGemini, { role: 'user', parts: userPromptParts }];

                setIsStreaming(true);
                let stream = await geminiService.getChatResponseStream(contents, fullSystemInstruction, [{functionDeclarations: tools}], isThinkingModeEnabled);
                let fullResponse = '';
                let aiMessageId = '';

                for await (const chunk of stream) {
                    if (isStoppedRef.current) break;

                    if (chunk.candidates[0].content.parts[0].text) {
                        fullResponse += chunk.candidates[0].content.parts[0].text;
                        if (!aiMessageId) {
                            setIsLoading(false);
                            const newMessage = addMessage({ type: 'text', sender: 'jiam', content: fullResponse });
                            aiMessageId = newMessage.id;
                        } else {
                            updateMessage(aiMessageId, { content: fullResponse });
                        }
                    } else if (chunk.functionCalls) {
                        setIsLoading(false);
                        const call = chunk.functionCalls[0];
                        const toolResponse = { role: 'tool', parts: [{ functionResponse: { name: call.name, response: {} } }] };
                        let toolResultDisplayAdded = false;

                        if (call.name === 'generate_images') {
                            setLoadingTask('tool-image');
                            const loadingMessage = addMessage({ type: 'image-loading', sender: 'jiam', content: { prompt: call.args.prompt } });
                            try {
                                const images = await externalApiService.generateImages(call.args.prompt, call.args.apiName || 'All');
                                toolResponse.parts[0].functionResponse.response = { success: true, image_count: images.length };
                                if (images.length > 0) {
                                    updateMessage(loadingMessage.id, { type: 'image', content: { images } });
                                    toolResultDisplayAdded = true;
                                } else {
                                    deleteMessage(loadingMessage.id);
                                }
                            } catch (e: any) {
                                deleteMessage(loadingMessage.id);
                                toolResponse.parts[0].functionResponse.response = { success: false, error: e.message };
                                addToast(e.message, 'error');
                            }
                        } else {
                            try {
                                if (call.name === 'fetch_lyrics') {
                                    setLoadingTask('tool-lyrics');
                                    const lyrics = await externalApiService.fetchLyrics(call.args.query);
                                    toolResponse.parts[0].functionResponse.response = { success: true, title: lyrics.title, artist: lyrics.artist };
                                    addMessage({ type: 'lyrics', sender: 'jiam', content: lyrics });
                                    toolResultDisplayAdded = true;
                                } else if (call.name === 'google_search') {
                                    setLoadingTask('tool-search');
                                    const searchContents = [...contents];
                                    searchContents[searchContents.length - 1].parts = [{text: call.args.query}];
                                    const searchStream = await geminiService.getChatResponseStream(searchContents, fullSystemInstruction, [{googleSearch: {}}], isThinkingModeEnabled);
                                    for await (const searchChunk of searchStream) {
                                         if (isStoppedRef.current) break;
                                         fullResponse += searchChunk.text;
                                         const groundingMetadata = searchChunk.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => c.web).filter(Boolean);
                                         if (!aiMessageId) {
                                            const newMessage = addMessage({ type: 'text', sender: 'jiam', content: fullResponse, groundingMetadata });
                                            aiMessageId = newMessage.id;
                                        } else {
                                            updateMessage(aiMessageId, { content: fullResponse, groundingMetadata });
                                        }
                                    }
                                    continue;
                                } else if (call.name === 'generate_video') {
                                    setLoadingTask('tool-video');
                                    const videoMessage = addMessage({ type: 'video', sender: 'jiam', content: { state: 'loading', prompt: call.args.prompt }});
                                    const operation = await geminiService.generateVideo(call.args.prompt);
                                    updateMessage(videoMessage.id, { content: { ...videoMessage.content as any, operationName: operation.name } });
                                    pollVideoStatus(videoMessage.id, operation);
                                    toolResponse.parts[0].functionResponse.response = { success: true, message: "Video generation started successfully." };
                                    toolResultDisplayAdded = true;
                                }
                            } catch (e: any) {
                                toolResponse.parts[0].functionResponse.response = { success: false, error: e.message };
                                addToast(e.message, 'error');
                            }
                        }

                        if (toolResultDisplayAdded) setLoadingTask('text');

                        const secondCallContents = [...contents, { role: 'model', parts: [{ functionCall: call }] }, toolResponse];
                        stream = await geminiService.getChatResponseStream(secondCallContents, fullSystemInstruction, [], isThinkingModeEnabled);
                        fullResponse = '';
                    }
                }
                
                if (aiMessageId) {
                     const memoryMatch = fullResponse.match(/\[\[memory:(.+?)\]\]/);
                     if (memoryMatch && currentUser.username !== 'Guest') {
                        const finalContent = fullResponse.replace(/\[\[memory:.+?\]\]/g, '').trim();
                        updateMessage(aiMessageId, { content: finalContent });
                        setMemoryConfirmation({ fact: memoryMatch[1].trim(), messageId: aiMessageId });
                    }
                }
            }
        } catch (error) {
            console.error("Error processing message:", error);
            const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
            addToast(errorMessage, 'error');
        } finally {
            setIsLoading(false);
            setIsStreaming(false);
            setLoadingTask(null);
        }
    };
    
    const sendMessage = async (prompt: string, apiName: string = 'All', imageFile?: File | null, analysisFile?: File | null) => {
        if ((!prompt && !imageFile && !analysisFile) || isLoading || isStreaming || !currentUser || memoryConfirmation) return;

        if (imageFile) {
            addMessage({ type: 'multimodal-user', sender: 'user', content: { imageUrl: URL.createObjectURL(imageFile), text: prompt } });
        } else if (analysisFile) {
            addMessage({ type: 'file-user', sender: 'user', content: { file: { name: analysisFile.name }, text: prompt } });
        } else {
            addMessage({ type: 'text', sender: 'user', content: prompt });
        }

        const historyForGemini = messages.filter(msg => (msg.type === 'text' || msg.type === 'multimodal-user' || msg.type === 'file-user') && msg.content).map(msg => {
            const role = msg.sender === 'user' ? 'user' : 'model';
            let text = '';
            if (typeof msg.content === 'string') text = msg.content;
            else if (typeof (msg.content as any).text === 'string') text = (msg.content as any).text;
            return { role, parts: [{ text }] };
        });

        await _executeGeneration(prompt, historyForGemini, apiName, imageFile, analysisFile);
    };

    const regenerateLastResponse = useCallback(async () => {
        if (isLoading || isStreaming) return;

        let lastUserMessageIndex = -1;
        for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].sender === 'user') {
                lastUserMessageIndex = i;
                break;
            }
        }

        if (lastUserMessageIndex === -1) {
            addToast("No user prompt found to regenerate.", 'info');
            return;
        }

        const lastUserMessage = messages[lastUserMessageIndex];
        if (lastUserMessage.type === 'multimodal-user' || lastUserMessage.type === 'file-user') {
            addToast("Regenerating responses for file uploads is not yet supported.", 'warning');
            return;
        }

        const prompt = typeof lastUserMessage.content === 'string' ? lastUserMessage.content : (lastUserMessage.content as any).text || '';
        if (!prompt) {
            addToast("Could not find a valid prompt to regenerate.", 'error');
            return;
        }
        
        const historyForGeneration = messages.slice(0, lastUserMessageIndex);
        setMessages(prev => prev.slice(0, lastUserMessageIndex + 1));
        
        const historyForGemini = historyForGeneration.filter(msg => (msg.type === 'text' || msg.type === 'multimodal-user' || msg.type === 'file-user') && msg.content).map(msg => {
            const role = msg.sender === 'user' ? 'user' : 'model';
            let text = '';
            if (typeof msg.content === 'string') text = msg.content;
            else if (typeof (msg.content as any).text === 'string') text = (msg.content as any).text;
            return { role, parts: [{ text }] };
        });
        
        await _executeGeneration(prompt, historyForGemini);

    }, [messages, isLoading, isStreaming, addToast, isThinkingModeEnabled]);

    const stopGeneration = useCallback(() => {
        isStoppedRef.current = true;
        setIsStreaming(false);
        setIsLoading(false);
        setLoadingTask(null);
    }, []);

    const confirmMemory = async () => {
        if (!memoryConfirmation || !currentUser || currentUser.username === 'Guest') return;
        try {
            await firebaseService.saveUserMemory(currentUser.username, memoryConfirmation.fact);
            addMessage({ type: 'system', sender: 'jiam', content: `Got it. I'll remember: "${memoryConfirmation.fact}"` });
        } catch (error) {
            console.error("Failed to save memory:", error);
            addMessage({ type: 'system', sender: 'jiam', content: "Sorry, I had trouble saving that memory." });
        } finally {
            setMemoryConfirmation(null);
        }
    };

    const rejectMemory = () => {
        setMemoryConfirmation(null);
    };
    
    const startNewChat = () => {
        stopAllVideoPolling();
        const newChatWelcome = { id: 'new-chat-welcome', type: 'system', sender: 'jiam', content: 'New chat started. How can I help you?', timestamp: Date.now() } as ChatMessage;
        setMessages([newChatWelcome]);
        if(currentUser && currentUser.username !== 'Guest') {
            firebaseService.saveChatHistory(currentUser.username, [newChatWelcome]);
        }
    }

    const togglePinMessage = useCallback((messageId: string) => {
        const message = messages.find(m => m.id === messageId);
        if (message) updateMessage(messageId, { isPinned: !message.isPinned });
    }, [messages, updateMessage]);

    const toggleArchiveMessage = useCallback((messageId: string) => {
        const message = messages.find(m => m.id === messageId);
        if (message) updateMessage(messageId, { isArchived: !message.isArchived });
    }, [messages, updateMessage]);

    return { messages, isLoading, isStreaming, sendMessage, addMessage, updateMessage, startNewChat, memoryConfirmation, confirmMemory, rejectMemory, deleteMessage, loadingTask, togglePinMessage, toggleArchiveMessage, stopGeneration, regenerateLastResponse };
};