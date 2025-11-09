import React, { useEffect, useRef, useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import ChatWindow from './ChatWindow';
import type { User, ChatMessage, VoiceSettings } from '../types';
import MessageAvatar from './MessageAvatar';
import { useSpeech } from '../hooks/useSpeech';
import { useLiveConversation } from '../hooks/useLiveConversation';

interface LiveConversationModalProps {
  isVisible: boolean;
  onClose: () => void;
  isConnecting: boolean;
  isSpeaking: 'user' | 'ai' | 'none';
  transcript: { user: string; ai: string };
}

const ModalAudioVisualizer: React.FC<{ status: 'idle' | 'user' | 'ai' | 'connecting' }> = ({ status }) => {
    const getAnimation = () => {
        switch (status) {
            case 'user': return 'orb-pulse-user 1s ease-in-out infinite';
            case 'ai': return 'orb-swirl-ai 4s linear infinite';
            case 'connecting': return 'orb-breath 2s ease-in-out infinite, spin 2s linear infinite';
            default: return 'orb-breath 2s ease-in-out infinite';
        }
    };
    const getStatusText = () => {
        switch (status) {
            case 'user': return "Listening...";
            case 'ai': return "Jiam is speaking...";
            case 'connecting': return "Connecting...";
            default: return "Live Conversation";
        }
    };
    return (
        <div className="flex flex-col items-center justify-center">
            <div className="relative w-48 h-48 mb-6">
                <div 
                    className="w-full h-full rounded-full border-4 border-cyan-300 transition-all" 
                    style={{ animation: getAnimation() }}
                ></div>
            </div>
            <p className="text-lg text-cyan-200 font-semibold tracking-wider">{getStatusText()}</p>
        </div>
    );
};

const LiveConversationModal: React.FC<LiveConversationModalProps> = ({ isVisible, onClose, isConnecting, isSpeaking, transcript }) => {
    if (!isVisible) return null;

    const getVisualizerStatus = () => {
        if (isConnecting) return 'connecting';
        if (isSpeaking === 'user') return 'user';
        if (isSpeaking === 'ai') return 'ai';
        return 'idle';
    };

    return (
        <div className="fixed inset-0 bg-[rgba(5,8,15,0.95)] backdrop-blur-lg flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="relative w-full h-full flex flex-col items-center justify-center gap-8 text-white">
                <ModalAudioVisualizer status={getVisualizerStatus()} />

                <div className="w-full max-w-2xl h-32 text-center text-2xl text-gray-300">
                    <p className="transition-opacity duration-300" style={{ opacity: isSpeaking === 'user' ? 1 : 0.5 }}>
                        {transcript.user || <span className="text-gray-500">...</span>}
                    </p>
                    <p className="font-semibold text-white transition-opacity duration-300 mt-2" style={{ opacity: isSpeaking === 'ai' ? 1 : 0.5 }}>
                        {transcript.ai}
                    </p>
                </div>
                
                <button 
                    onClick={onClose} 
                    className="absolute bottom-10 px-8 py-4 bg-red-600 text-white font-bold text-lg rounded-full shadow-lg transition-transform hover:scale-105"
                >
                    End Conversation
                </button>
            </div>
        </div>
    );
};


interface ChatInterfaceProps {
  currentUser: User;
  onAdminOpen: () => void;
  onProfileOpen: () => void;
  onHistoryOpen: () => void;
  onSettingsOpen: () => void;
  onImageClick: (url: string) => void;
  initiateCall: (targetUsername: string) => void;
  isDuringCall: boolean;
  // Props from useChat hook
  messages: ChatMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  loadingTask: 'text' | 'tool-image' | 'tool-lyrics' | 'tool-search' | 'tool-video' | null;
  sendMessage: (prompt: string, apiName?: string, imageFile?: File | null, analysisFile?: File | null) => Promise<void>;
  addMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => ChatMessage;
  updateMessage: (messageId: string, updates: Partial<ChatMessage>) => void;
  startNewChat: () => void;
  memoryConfirmation: { fact: string; messageId: string; } | null;
  confirmMemory: () => Promise<void>;
  rejectMemory: () => void;
  voiceSettings: VoiceSettings;
  onToggleTts: () => void;
  stopGeneration: () => void;
  regenerateLastResponse: () => void;
  isThinkingModeEnabled: boolean;
  onToggleThinkingMode: () => void;
}

// Helper to strip markdown for clean text-to-speech output.
const removeMarkdown = (text: string): string => {
  if (!text) return '';
  return text
    // Remove code blocks entirely
    .replace(/```[\s\S]*?```/g, '')
    // Remove images, keeping alt text
    .replace(/!\[(.*?)\]\(.*?\)/g, '$1')
    // Remove links, keeping the link text
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    // Remove headings
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold, italic, strikethrough
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/~~(.*?)~~/g, '$1')
    // Remove blockquotes
    .replace(/^>\s+/gm, '')
    // Remove list markers
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    // Remove horizontal rules
    .replace(/^-{3,}\s*$/gm, '')
    // Collapse multiple newlines
    .replace(/\n{2,}/g, '\n')
    .trim();
};


const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  currentUser, onAdminOpen, onProfileOpen, onHistoryOpen, onSettingsOpen, onImageClick, initiateCall, isDuringCall,
  messages, isLoading, isStreaming, loadingTask, sendMessage, addMessage, updateMessage, startNewChat, memoryConfirmation, confirmMemory, rejectMemory,
  voiceSettings, onToggleTts, stopGeneration, regenerateLastResponse, isThinkingModeEnabled, onToggleThinkingMode
}) => {
  const mainRef = useRef<HTMLDivElement>(null);
  const [selectedImageApi, setSelectedImageApi] = useState('All');
  const [inputValue, setInputValue] = useState('');
  const [stagedImage, setStagedImage] = useState<File | null>(null);
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [isCommandMode, setIsCommandMode] = useState(false);
  const [isLiveModalVisible, setIsLiveModalVisible] = useState(false);

  const { isLive, isConnecting, isSpeaking, startLiveSession, stopLiveSession, liveTranscript } = useLiveConversation(addMessage, updateMessage);

  const handleCommand = (command: string, arg?: string) => {
    if (command === 'send') {
      handleSendMessage();
    } else if (command === 'new_chat') {
      startNewChat();
      setInputValue('');
    } else if (command === 'call' && arg) {
      initiateCall(arg);
    } else if (command === 'show_history') {
      onHistoryOpen();
    }
  };
  
  const { isListening, micError, toggleMic, speakText } = useSpeech(
    voiceSettings,
    setInputValue,
    handleCommand,
    setIsCommandMode
  );

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = mainRef.current.scrollHeight;
    }
  }, [messages, isLoading, isStreaming]);

  useEffect(() => {
    if (!messages || messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.sender === 'jiam' && lastMessage.type === 'text' && typeof lastMessage.content === 'string' && !isStreaming) {
      const textToSpeak = removeMarkdown(lastMessage.content);
      if (textToSpeak) {
          speakText(textToSpeak);
      }
    }
  }, [messages, isStreaming, speakText]);
  
  useEffect(() => {
    if (!voiceSettings.isTtsEnabled) {
      window.speechSynthesis?.cancel();
    }
  }, [voiceSettings.isTtsEnabled]);

  const handleSendMessage = () => {
    sendMessage(inputValue, selectedImageApi, stagedImage, stagedFile);
    setInputValue('');
    setStagedImage(null);
    setStagedFile(null);
  };
  
  const handleStageImage = (file: File | null) => {
    if (file) setStagedFile(null);
    setStagedImage(file);
  }

  const handleStageFile = (file: File | null) => {
    if (file) setStagedImage(null);
    setStagedFile(file);
  }

  const handleToggleLive = () => {
      setIsLiveModalVisible(true);
  };

  const handleCloseLiveModal = () => {
    stopLiveSession();
    setIsLiveModalVisible(false);
  };

  useEffect(() => {
    if (isLiveModalVisible) {
        startLiveSession();
    }
  }, [isLiveModalVisible, startLiveSession]);

  return (
    <div 
      className="w-full max-w-4xl h-[95vh] sm:h-[95vh] h-full bg-[rgba(10,18,35,0.6)] backdrop-blur-2xl
                 rounded-none sm:rounded-2xl border flex flex-col overflow-hidden chat-container-glow"
    >
      <Header 
        currentUser={currentUser} 
        onAdminOpen={onAdminOpen}
        onProfileOpen={onProfileOpen}
        isLoading={isLoading || isStreaming || isConnecting}
        isThinkingModeEnabled={isThinkingModeEnabled}
      />
      <main ref={mainRef} className="flex-grow flex flex-col overflow-y-auto p-2 sm:p-4 min-h-0 scroll-smooth">
        <ChatWindow 
          messages={messages} 
          onImageClick={onImageClick}
          memoryConfirmation={memoryConfirmation}
          onConfirmMemory={confirmMemory}
          onRejectMemory={rejectMemory}
          onRegenerate={regenerateLastResponse}
          isLoading={isLoading}
          isStreaming={isStreaming}
          currentUser={currentUser}
        />
        {isLoading && <TypingIndicator task={loadingTask} />}
      </main>
      <Footer 
        inputValue={inputValue}
        onInputChange={setInputValue}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        isStreaming={isStreaming}
        startNewChat={startNewChat}
        onHistoryOpen={onHistoryOpen}
        onSettingsOpen={onSettingsOpen}
        isDuringCall={isDuringCall}
        isMemoryConfirmationPending={!!memoryConfirmation}
        selectedApi={selectedImageApi}
        onApiChange={setSelectedImageApi}
        isListening={isListening}
        voiceSettings={voiceSettings}
        micError={micError}
        toggleMic={toggleMic}
        toggleTts={onToggleTts}
        isCommandMode={isCommandMode}
        stagedImage={stagedImage}
        onStageImage={handleStageImage}
        stagedFile={stagedFile}
        onStageFile={handleStageFile}
        isLive={isLiveModalVisible}
        isConnectingLive={isConnecting}
        onToggleLive={handleToggleLive}
        stopGeneration={stopGeneration}
        isThinkingModeEnabled={isThinkingModeEnabled}
        onToggleThinkingMode={onToggleThinkingMode}
      />
      <LiveConversationModal 
        isVisible={isLiveModalVisible}
        onClose={handleCloseLiveModal}
        isConnecting={isConnecting}
        isSpeaking={isSpeaking}
        transcript={liveTranscript}
      />
    </div>
  );
};

const TypingIndicator: React.FC<{ task: 'text' | 'tool-image' | 'tool-lyrics' | 'tool-search' | 'tool-video' | null }> = ({ task }) => {
    const getTaskContent = () => {
        switch (task) {
            case 'tool-search':
                return (
                    <div className="flex items-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-pulse text-cyan-400" viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm text-gray-300">Searching the web...</p>
                    </div>
                );
            case 'tool-image':
                return (
                    <div className="flex flex-col items-center gap-3">
                         <div className="generative-loader">
                            <div style={{ animation: 'spin 3s linear infinite' }}></div>
                            <div style={{ animation: 'spin 4s linear infinite reverse', top: '4px', left: '4px', right: '4px', bottom: '4px' }}></div>
                            <div style={{ animation: 'spin 2.5s linear infinite', top: '8px', left: '8px', right: '8px', bottom: '8px' }}></div>
                            <div className="generative-dot" style={{ top: 'calc(50% - 4px)', left: '0px', animation: 'glow-pulse 1.5s ease-in-out infinite' }}></div>
                            <div className="generative-dot" style={{ top: 'calc(50% - 4px)', right: '0px', animation: 'glow-pulse 1.5s ease-in-out infinite 0.5s' }}></div>
                         </div>
                        <p className="text-sm text-gray-300">Generating images...</p>
                    </div>
                );
            case 'tool-lyrics':
                 return (
                    <div className="flex items-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-pulse text-cyan-400" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V3z" />
                        </svg>
                        <p className="text-sm text-gray-300">Searching for lyrics...</p>
                    </div>
                );
            case 'tool-video':
                 return (
                    <div className="flex items-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-pulse text-cyan-400" viewBox="0 0 20 20" fill="currentColor">
                           <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 001.553.832l3-2a1 1 0 000-1.664l-3-2z" />
                        </svg>
                        <p className="text-sm text-gray-300">Generating video...</p>
                    </div>
                );
            case 'text':
            default:
                return (
                    <div className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 rounded-full animate-[pulse-dot_1.4s_ease-in-out_infinite]" style={{ animationDelay: '0s' }}></div>
                        <div className="w-2 h-2 rounded-full animate-[pulse-dot_1.4s_ease-in-out_infinite]" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 rounded-full animate-[pulse-dot_1.4s_ease-in-out_infinite]" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                );
        }
    };

    return (
        <div className="flex items-end gap-2 sm:gap-3 justify-start animate-slide-in-left mt-6 flex-shrink-0">
            <MessageAvatar />
            <div className="w-fit px-5 py-4 bg-white/10 backdrop-blur-md border border-cyan-300/20 rounded-3xl rounded-bl-md shadow-lg shadow-black/30">
                {getTaskContent()}
            </div>
        </div>
    );
};


export default ChatInterface;