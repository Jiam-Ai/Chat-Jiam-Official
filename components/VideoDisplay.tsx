import React, { useState, useEffect } from 'react';
import type { VideoContent } from '../types';

interface VideoDisplayProps {
  data: VideoContent;
}

const loadingMessages = [
    "Directing the digital actors...",
    "Rendering the first few frames...",
    "Applying cinematic lighting...",
    "Compositing visual effects...",
    "Calibrating the virtual camera...",
    "Processing audio tracks...",
    "Encoding the final cut...",
    "Polishing the pixels...",
    "Finalizing the masterpiece...",
];

const VideoDisplay: React.FC<VideoDisplayProps> = ({ data }) => {
    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

    useEffect(() => {
        if (data.state === 'loading') {
            const interval = setInterval(() => {
                setLoadingMessageIndex(prev => (prev + 1) % loadingMessages.length);
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [data.state]);

    const handleDownload = () => {
        if (!data.videoUrl) return;
        const a = document.createElement('a');
        a.href = data.videoUrl;
        a.download = `jiam-video-${Date.now()}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    if (data.state === 'error') {
        return (
             <div className="w-full max-w-sm p-4 bg-red-900/50 border border-red-500 rounded-lg text-white">
                <h3 className="font-title text-lg text-red-300">Video Generation Failed</h3>
                <p className="text-sm text-red-200 mt-2 break-words"><strong>Prompt:</strong> "{data.prompt}"</p>
                <p className="text-xs text-red-200 mt-2 font-mono bg-black/30 p-2 rounded">{data.error || "An unknown error occurred."}</p>
            </div>
        )
    }

    return (
        <div className="w-full max-w-sm aspect-video rounded-lg overflow-hidden bg-black/50 relative group">
            {data.state === 'loading' && (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                    <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin"></div>
                    <p className="font-title text-base text-cyan-300 mt-4">Generating Video</p>
                    <p className="text-sm text-gray-300 mt-2 italic">"{data.prompt}"</p>
                    <div className="absolute bottom-4 left-4 right-4 text-center">
                         <p className="text-xs text-gray-400 transition-opacity duration-500 animate-fade-in">{loadingMessages[loadingMessageIndex]}</p>
                    </div>
                </div>
            )}
            {data.state === 'done' && data.videoUrl && (
                <>
                    <video
                        src={data.videoUrl}
                        controls
                        playsInline
                        className="w-full h-full object-contain"
                    />
                    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                         <button
                            onClick={handleDownload}
                            className="w-14 h-14 rounded-full bg-cyan-500/80 text-black flex items-center justify-center border-2 border-cyan-300 hover:scale-110 hover:bg-cyan-400 transition-transform"
                            title="Download Video"
                        >
                            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"/></svg>
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default VideoDisplay;