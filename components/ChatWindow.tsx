import React, { forwardRef, useState } from 'react';
import type { User, ChatMessage, ImageContent, LyricsContent, MultimodalUserContent, UserFileContent, VideoContent } from '../types';
import ImageSlider from './ImageSlider';
import LyricsDisplay from './LyricsDisplay';
import CodeBlock from './CodeBlock';
import MessageAvatar from './MessageAvatar';
import MemoryConfirmationPrompt from './MemoryConfirmationPrompt';
import VideoDisplay from './VideoDisplay';
import Avatar from './Avatar';
import { renderSimpleMarkdown } from '../utils/markdownRenderer';

interface ChatWindowProps {
  messages: ChatMessage[];
  onImageClick: (url: string) => void;
  memoryConfirmation: { fact: string; messageId: string } | null;
  onConfirmMemory: () => void;
  onRejectMemory: () => void;
  onRegenerate: () => void;
  isLoading: boolean;
  isStreaming: boolean;
  currentUser: User;
}

// New CopyButton component
const CopyButton: React.FC<{ textToCopy: string }> = ({ textToCopy }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    if (isCopied) return;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      className="w-8 h-8 rounded-full bg-black/30 text-gray-400 flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-cyan-500 hover:text-black"
      title={isCopied ? "Copied!" : "Copy to clipboard"}
    >
      {isCopied ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
};

// Helper function to get text for copying
const getCopyableText = (msg: ChatMessage): string | null => {
  switch (msg.type) {
    case 'text':
    case 'live-user':
    case 'live-ai':
      return msg.content as string;
    case 'lyrics':
      const lyrics = msg.content as LyricsContent;
      return `"${lyrics.title}" by ${lyrics.artist}\n\n${lyrics.lyrics}`;
    default:
      return null;
  }
};

const ImageLoadingSkeleton: React.FC<{ prompt: string }> = ({ prompt }) => (
    <div className="w-full max-w-sm">
        <div className="aspect-square w-full bg-black/20 rounded-lg flex items-center justify-center p-4">
            <div className="w-full h-full border-2 border-dashed border-cyan-500/50 rounded-md flex items-center justify-center animate-pulse">
                <svg className="w-10 h-10 text-cyan-500/70" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            </div>
        </div>
        <p className="text-sm text-gray-400 mt-2 italic">Generating image: "{prompt}"</p>
    </div>
);

const ChatWindow = forwardRef<HTMLDivElement, ChatWindowProps>(({ messages, onImageClick, memoryConfirmation, onConfirmMemory, onRejectMemory, onRegenerate, isLoading, isStreaming, currentUser }, ref) => {
    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
    const isLastMessageFromJiam = lastMessage?.sender === 'jiam';

  return (
    <div ref={ref} id="chat-window" className="space-y-6">
      {messages.map((msg, index) => {
        const isThisTheLastMessageFromJiam = isLastMessageFromJiam && index === messages.length - 1;
        return (
            <React.Fragment key={msg.id}>
              <MessageBubble 
                message={msg} 
                onImageClick={onImageClick} 
                onRegenerate={onRegenerate}
                isLastMessageFromJiam={isThisTheLastMessageFromJiam}
                isLoading={isLoading}
                isStreaming={isStreaming}
                currentUser={currentUser}
              />
              {memoryConfirmation && memoryConfirmation.messageId === msg.id && (
                <MemoryConfirmationPrompt
                  fact={memoryConfirmation.fact}
                  onConfirm={onConfirmMemory}
                  onReject={onRejectMemory}
                />
              )}
            </React.Fragment>
        );
      })}
    </div>
  );
});

const SearchSources: React.FC<{ sources: { uri: string; title: string }[] }> = ({ sources }) => {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-white/10">
      <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Sources</h4>
      <div className="flex flex-wrap gap-2">
        {sources.map((source, index) => (
          <a
            key={index}
            href={source.uri}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-black/30 text-cyan-300 text-xs px-2 py-1 rounded-md transition-colors hover:bg-cyan-500 hover:text-black"
            title={source.title}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.527 1.907 6.011 6.011 0 01-1.631 3.033 1 1 0 101.414 1.414c1.125-1.125.989-2.772.586-3.967A3.501 3.501 0 0013 5.5a3.5 3.5 0 00-1.343-2.734 6.014 6.014 0 01-4.288 0A3.5 3.5 0 006 5.5a3.5 3.5 0 00-1.343 2.734 6.011 6.011 0 01-1.631 3.033 1 1 0 101.414 1.414c1.125-1.125.989-2.772.586-3.967A3.501 3.501 0 006 9.5a3.5 3.5 0 00-1.343-2.734 6.014 6.014 0 01-1.125-1.45z" clipRule="evenodd" />
            </svg>
            <span className="truncate max-w-[200px]">{source.title || new URL(source.uri).hostname}</span>
          </a>
        ))}
      </div>
    </div>
  );
};

interface MessageBubbleProps {
    message: ChatMessage;
    onImageClick: (url: string) => void;
    onRegenerate: () => void;
    isLastMessageFromJiam: boolean;
    isLoading: boolean;
    isStreaming: boolean;
    currentUser: User;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onImageClick, onRegenerate, isLastMessageFromJiam, isLoading, isStreaming, currentUser }) => {
  const isUser = message.sender === 'user';
  const textToCopy = getCopyableText(message);
  
  const bubbleStyles = isUser
    ? 'bg-gradient-to-br from-[#00d9ff] to-[#007cf0] text-white rounded-3xl rounded-br-md shadow-blue-900/40 hover:shadow-blue-800/50'
    : 'bg-white/10 backdrop-blur-md border border-cyan-300/20 text-gray-200 rounded-3xl rounded-bl-md shadow-black/30 hover:bg-white/15';

  if (message.type === 'system' || message.type === 'broadcast') {
    return (
      <div className="self-center text-center w-full my-2 animate-fade-in">
        <div className="inline-block max-w-[90%] font-code border text-gray-200 p-3 sm:p-4 rounded-[30px] text-xs sm:text-sm bg-black/30 animate-typing-glow">
          {message.type === 'broadcast' && <span className="font-bold opacity-80">BROADCAST :: </span>}
          {message.content as string}
        </div>
      </div>
    );
  }
  
  const renderTextContent = (content: string, isLive: boolean) => {
    const isLastMessage = isLastMessageFromJiam && isStreaming;
    if (isLive) {
      return (
        <div className="flex items-center gap-2">
            <span className="text-red-500 text-xs font-bold bg-red-500/20 px-1.5 py-0.5 rounded-md">LIVE</span>
            <p className="whitespace-pre-wrap break-words italic text-gray-300">
                {content}
                {isLastMessage && <span className="inline-block w-2 h-4 bg-white animate-pulse ml-1"></span>}
            </p>
        </div>
      )
    }

    if (!content.trim()) return null;

    const codeBlockRegex = /```(\w*)\n([\s\S]+?)\n```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: content.substring(lastIndex, match.index) });
      }
      parts.push({
        type: 'code',
        language: match[1] || 'text',
        content: match[2].trim(),
      });
      lastIndex = codeBlockRegex.lastIndex;
    }

    if (lastIndex < content.length) {
      parts.push({ type: 'text', content: content.substring(lastIndex) });
    }

    return (
      <div className="flex flex-col gap-2 leading-relaxed">
        {parts.map((part, index) => {
          if (part.type === 'text' && part.content.trim()) {
              const htmlContent = renderSimpleMarkdown(part.content);
              return <div key={index} className="whitespace-pre-wrap break-words" dangerouslySetInnerHTML={{ __html: htmlContent + (isLastMessage && index === parts.length - 1 ? '<span class="inline-block w-2 h-4 bg-white animate-pulse ml-1"></span>' : '') }} />;
          }
          if (part.type === 'code') {
            return <CodeBlock key={index} language={part.language} code={part.content} />;
          }
          return null;
        })}
      </div>
    );
  };

  const renderContent = () => {
    switch (message.type) {
      case 'text':
        return renderTextContent(message.content as string, false);
      case 'live-user':
      case 'live-ai':
        return renderTextContent(message.content as string, true);
      case 'image':
        return <ImageSlider images={(message.content as { images: ImageContent[] }).images} onImageClick={onImageClick} />;
      case 'image-loading':
        const loadingContent = message.content as { prompt: string };
        return <ImageLoadingSkeleton prompt={loadingContent.prompt} />;
      case 'lyrics':
        return <LyricsDisplay data={message.content as LyricsContent} />;
      case 'video':
        return <VideoDisplay data={message.content as VideoContent} />;
      case 'multimodal-user':
        const content = message.content as MultimodalUserContent;
        return (
          <div className="flex flex-col gap-2">
            <img src={content.imageUrl} alt="User upload" className="max-w-xs rounded-lg object-cover" />
            {content.text && <p className="whitespace-pre-wrap break-words">{content.text}</p>}
          </div>
        );
      case 'file-user':
        const fileContent = message.content as UserFileContent;
        return (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 bg-white/10 px-3 py-2 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-300 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                <span className="font-semibold truncate">{fileContent.file.name}</span>
            </div>
            {fileContent.text && <p className="whitespace-pre-wrap break-words">{fileContent.text}</p>}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`group flex items-end gap-2 sm:gap-3 ${isUser ? 'justify-end animate-slide-in-right' : 'justify-start animate-slide-in-left'}`}>
      {!isUser && <MessageAvatar />}
      <div className={`px-4 py-2.5 sm:px-5 sm:py-3 max-w-[85%] sm:max-w-[75%] w-fit transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-xl shadow-lg ${bubbleStyles} ${(message.type === 'image' || message.type === 'image-loading') ? '!bg-transparent !border-none !shadow-none' : ''}`}>
        {renderContent()}
        {message.groundingMetadata && message.groundingMetadata.length > 0 && (
          <SearchSources sources={message.groundingMetadata} />
        )}
      </div>
      {isUser ? (
        <div className="flex-shrink-0 self-end">
            <Avatar avatarId={currentUser.avatar} className="w-10 h-10 rounded-full" />
        </div>
      ) : (
        <div className="self-center flex-shrink-0 flex flex-col gap-1">
            {textToCopy && message.type !== 'live-ai' && <CopyButton textToCopy={textToCopy} />}
            {isLastMessageFromJiam && !isLoading && !isStreaming && (
                <button 
                    onClick={onRegenerate}
                    className="w-8 h-8 rounded-full bg-black/30 text-gray-400 flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-cyan-500 hover:text-black"
                    title="Regenerate response"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 4l16 16" />
                    </svg>
                </button>
            )}
        </div>
      )}
    </div>
  );
};

export default ChatWindow;