import React, { useRef, useMemo, useState } from 'react';
import type { ChatMessage, VoiceSettings } from '../types';
import { availableImageApis } from '../services/externalApiService';
import { renderSimpleMarkdown } from '../utils/markdownRenderer';

interface FooterProps {
    inputValue: string;
    onInputChange: (value: string) => void;
    onSendMessage: () => void;
    isLoading: boolean;
    isStreaming: boolean;
    startNewChat: () => void;
    onHistoryOpen: () => void;
    onSettingsOpen: () => void;
    isDuringCall: boolean;
    isMemoryConfirmationPending: boolean;
    selectedApi: string;
    onApiChange: (apiName: string) => void;
    isListening: boolean;
    voiceSettings: VoiceSettings;
    micError: string | null;
    toggleMic: () => void;
    toggleTts: () => void;
    isCommandMode: boolean;
    stagedImage: File | null;
    onStageImage: (file: File | null) => void;
    stagedFile: File | null;
    onStageFile: (file: File | null) => void;
    isLive: boolean;
    isConnectingLive: boolean;
    onToggleLive: () => void;
    stopGeneration: () => void;
    isThinkingModeEnabled: boolean;
    onToggleThinkingMode: () => void;
}

const imageKeywords = ['create', 'draw', 'paint', 'generate', 'design', 'show me a picture of', 'an image of', 'render', 'illustrate', 'logo'];
const imageKeywordRegex = new RegExp(`\\b(${imageKeywords.join('|')})\\b`, 'i');

const Footer: React.FC<FooterProps> = ({ 
    inputValue, onInputChange, onSendMessage, 
    isLoading, isStreaming, startNewChat, onHistoryOpen, onSettingsOpen,
    isDuringCall, isMemoryConfirmationPending, selectedApi, onApiChange,
    isListening, voiceSettings, micError, toggleMic, toggleTts, isCommandMode,
    stagedImage, onStageImage, stagedFile, onStageFile,
    isLive, isConnectingLive, onToggleLive, stopGeneration,
    isThinkingModeEnabled, onToggleThinkingMode
}) => {
    const imageInputRef = useRef<HTMLInputElement>(null);
    const fileAnalysisInputRef = useRef<HTMLInputElement>(null);
    const [isMenuOpen, setMenuOpen] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    
    const { isTtsEnabled, isWakeWordEnabled } = voiceSettings;

    const isDictationActive = isListening && !isWakeWordEnabled;

    const stagedImageUrl = useMemo(() => {
        if (stagedImage) {
            return URL.createObjectURL(stagedImage);
        }
        return null;
    }, [stagedImage]);

    const handleSend = () => {
        if (inputValue.trim() || stagedImage || stagedFile) {
            onSendMessage();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onStageImage(file);
        }
        if(e.target) e.target.value = '';
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onStageFile(file);
        }
        if(e.target) e.target.value = '';
    };
    
    const isDisabled = isLoading || isStreaming || isDuringCall || isMemoryConfirmationPending || isLive || isConnectingLive;
    const isImagePrompt = imageKeywordRegex.test(inputValue);
    
    const footerBtnBaseClass = `flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full 
                     shadow-lg shadow-[rgba(2,8,18,0.55)] transition-all duration-300
                     hover:transform hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(2,8,18,0.6),0_0_18px_rgba(0,217,255,0.6)]
                     disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg`;

    const getPlaceholder = () => {
        if (isLive) return "Live conversation is active...";
        if (isCommandMode) return "Awaiting command...";
        if (isListening) return "Listening...";
        if (stagedImage) return "Describe how to edit the image...";
        if (stagedFile) return `Ask a question about ${stagedFile.name}...`;
        return "Speak or type...";
    };
    
    const micTitle = useMemo(() => {
        if (micError) return `Mic Error: ${micError}`;
        if (isListening) {
            if (isCommandMode) return "Listening for command...";
            if (isWakeWordEnabled) return "Listening for 'Hey Jiam' or dictation...";
            return "Listening for dictation...";
        }
        if (isWakeWordEnabled) return "Click to speak, or say 'Hey Jiam'";
        return "Click to speak";
    }, [isListening, isCommandMode, micError, isWakeWordEnabled]);
    

    const inputContainerClasses = useMemo(() => {
        const base = [
            'flex-grow', 'relative', 'bg-[rgba(0,0,0,0.3)]', 'border', 'rounded-full', 'h-10 sm:h-12', 'transition-all duration-300', 'focus-within:bg-[rgba(0,0,0,0.2)]'
        ];

        if (isCommandMode) {
            return [...base, 'border-yellow-400', 'shadow-[0_0_18px_rgba(250,204,21,0.5)]'];
        }
        if (isDictationActive) {
            return [...base, 'animate-typing-glow'];
        }
        return [...base, 'border-white/10', 'focus-within:border-[#00d9ff]', 'focus-within:shadow-[0_0_18px_rgba(0,217,255,0.3)]'];
    }, [isCommandMode, isDictationActive]);

    return (
        <footer className="relative p-2 sm:p-4 border-t border-[rgba(255,255,255,0.08)] flex-shrink-0">
            {showPreview && inputValue && (
                <div className="absolute bottom-full left-2 right-2 mb-2 p-3 max-h-48 overflow-y-auto bg-black/50 backdrop-blur-md border border-white/10 rounded-lg animate-fade-in text-sm text-gray-200 leading-relaxed">
                    <div
                        className="whitespace-pre-wrap break-words"
                        dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(inputValue) }}
                    />
                </div>
            )}
            <div id="input-container" className="flex items-center gap-2 sm:gap-3">
                 <div className="relative">
                    <button onClick={() => setMenuOpen(!isMenuOpen)} disabled={isDisabled} title="More Options" className={`${footerBtnBaseClass} bg-white/5 text-xl font-bold text-cyan-300 hover:bg-white/10`}>
                        +
                    </button>
                    <div className={`absolute bottom-14 sm:bottom-16 left-0 w-52 bg-[rgba(15,25,45,0.9)] backdrop-blur-md border border-white/10 rounded-lg shadow-2xl z-20 transition-all duration-300 ease-in-out ${isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                        <button onClick={() => { imageInputRef.current?.click(); setMenuOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-white/10 transition-colors rounded-t-lg flex items-center gap-3">📷 Edit Image</button>
                        <button onClick={() => { fileAnalysisInputRef.current?.click(); setMenuOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-white/10 transition-colors flex items-center gap-3">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                           Analyze File
                        </button>
                        <button onClick={() => { onHistoryOpen(); setMenuOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-white/10 transition-colors flex items-center gap-3">📜 Chat History</button>
                        <button onClick={() => { onSettingsOpen(); setMenuOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-white/10 transition-colors flex items-center gap-3">⚙️ Settings</button>
                        <button onClick={() => { startNewChat(); setMenuOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-white/10 transition-colors rounded-b-lg flex items-center gap-3 border-t border-white/5">🆕 New Chat</button>
                        <div className="border-t border-white/10 my-1"></div>
                         <button 
                            onClick={() => { onToggleThinkingMode(); setMenuOpen(false); }} 
                            className={`w-full text-left px-4 py-3 hover:bg-white/10 transition-colors rounded-b-lg flex items-center gap-3 ${isThinkingModeEnabled ? 'text-cyan-300' : ''}`}
                         >
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-all ${isThinkingModeEnabled ? 'text-cyan-300 animate-[glow-pulse_2s_ease-in-out_infinite]' : 'text-gray-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v0A2.5 2.5 0 0 1 9.5 7h0A2.5 2.5 0 0 1 7 4.5v0A2.5 2.5 0 0 1 9.5 2Z" /><path d="M14.5 2A2.5 2.5 0 0 1 17 4.5v0A2.5 2.5 0 0 1 14.5 7h0A2.5 2.5 0 0 1 12 4.5v0A2.5 2.5 0 0 1 14.5 2Z" /><path d="M12 7.5c-2 0-2.5-1-4.5-1" /><path d="M12 7.5c2 0 2.5-1 4.5-1" /><path d="M4.5 10.5c-1.5 0-2 1.5-2 3p0 2.5 2 2.5" /><path d="M19.5 10.5c1.5 0 2 1.5 2 3p0 2.5-2 2.5" /><path d="M12 11.5v-4" /><path d="m14.5 18.5-2-1" /><path d="m9.5 18.5 2-1" /><path d="M12 22v-2" /><path d="M12 18.5v-2.5" /><path d="M12 16a2.5 2.5 0 0 1-2.5-2.5v0A2.5 2.5 0 0 1 12 11h0a2.5 2.5 0 0 1 2.5 2.5v0A2.5 2.5 0 0 1 12 16Z" /></svg>
                            <span className="flex-grow">Thinking Mode</span>
                            <div className={`w-3 h-3 rounded-full transition-all ${isThinkingModeEnabled ? 'bg-cyan-400 shadow-[0_0_8px_#00d9ff]' : 'bg-gray-600'}`}></div>
                        </button>
                    </div>
                </div>
                <input type="file" ref={imageInputRef} onChange={handleImageUpload} accept="image/*" className="hidden"/>
                <input type="file" ref={fileAnalysisInputRef} onChange={handleFileUpload} className="hidden" />

                <div className={inputContainerClasses.join(' ')}>
                    {stagedImageUrl && (
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 sm:h-9 sm:w-9 bg-black/50 rounded-lg p-0.5 animate-scale-in">
                            <img src={stagedImageUrl} alt="Staged" className="h-full w-full object-cover rounded-md" />
                            <button onClick={() => onStageImage(null)} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold border-2 border-black/50">&times;</button>
                        </div>
                    )}
                     {stagedFile && (
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 h-8 sm:h-9 flex items-center gap-2 bg-black/50 rounded-full pl-2 pr-1 animate-scale-in">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                           <span className="text-white text-sm truncate max-w-[100px] sm:max-w-[180px]">{stagedFile.name}</span>
                           <button onClick={() => onStageFile(null)} className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold border-2 border-black/50 flex-shrink-0">&times;</button>
                        </div>
                    )}

                    <div className={`absolute left-0 top-0 h-full flex items-center transition-all duration-300 ease-in-out ${isImagePrompt && !stagedImage && !stagedFile ? 'w-32 sm:w-40 opacity-100' : 'w-0 opacity-0 pointer-events-none'}`}>
                        <div className="relative w-full h-full">
                            <select
                                value={selectedApi}
                                onChange={(e) => onApiChange(e.target.value)}
                                disabled={isDisabled}
                                className="w-full h-full bg-transparent border-r border-white/10 pl-4 pr-8 text-white text-sm outline-none appearance-none cursor-pointer disabled:opacity-40"
                                aria-label="Select Image Generation API"
                            >
                                <option value="All" className="bg-[#0A1223]">All</option>
                                {availableImageApis.map(api => (
                                    <option key={api} value={api} className="bg-[#0A1223]">{api}</option>
                                ))}
                            </select>
                            <div className="absolute top-1/2 right-3 -translate-y-1/2 pointer-events-none">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                    </div>
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => onInputChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={getPlaceholder()}
                        disabled={isDisabled}
                        className={`w-full h-full bg-transparent text-white text-base outline-none transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed pr-12
                                    ${isImagePrompt && !stagedImage && !stagedFile ? 'pl-36 sm:pl-44' : 'pl-4 sm:pl-5'} 
                                    ${stagedImage ? 'pl-12 sm:pl-14' : ''} 
                                    ${stagedFile ? 'pl-36 sm:pl-56' : ''}`}
                    />
                    <button
                        onClick={() => setShowPreview(!showPreview)}
                        title={showPreview ? "Edit Markdown" : "Show Markdown Preview"}
                        disabled={!inputValue}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed z-10"
                    >
                        {showPreview ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        )}
                    </button>
                </div>
                
                <button 
                  onClick={onToggleLive} 
                  disabled={isDisabled || isDuringCall || isListening} 
                  title="Start Live Conversation"
                  className={`${footerBtnBaseClass} bg-white/5 text-white`}
                >
                    {isConnectingLive ? (
                        <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"></path></svg>
                    )}
                </button>

                {isLoading || isStreaming ? (
                    <button onClick={stopGeneration} title="Stop Generating" className={`${footerBtnBaseClass} bg-white/10 text-white`}>
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h12v12H6z"></path></svg>
                    </button>
                ) : (inputValue.trim().length === 0 && !stagedImage && !stagedFile) ? (
                    <button onClick={toggleMic} disabled={isDisabled} title={micTitle} className={`${footerBtnBaseClass} ${isListening ? 'animate-pulse bg-red-500' : 'bg-gradient-to-br from-[#00d9ff] to-[#00b8d4]'} text-black`}>
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.49 6-3.31 6-6.72h-1.7z"></path></svg>
                    </button>
                ) : (
                    <button onClick={handleSend} disabled={isDisabled} title="Send Message" className={`${footerBtnBaseClass} bg-gradient-to-br from-[#00d9ff] to-[#00b8d4] text-black`}>
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>
                    </button>
                )}
            </div>
             {micError && <p className="text-center text-red-400 text-xs mt-2">{micError}</p>}
             {isDuringCall && <p className="text-center text-yellow-400 text-xs mt-2">Messaging disabled during call.</p>}
             {isMemoryConfirmationPending && <p className="text-center text-cyan-400 text-xs mt-2">Please respond to the memory confirmation above.</p>}
        </footer>
    );
};

export default Footer;