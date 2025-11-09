
import React, { useState, useEffect } from 'react';

const loadingMessages = [
    "Initializing Jiam...",
    "Warming up neural networks...",
    "Establishing secure connection...",
    "Calibrating logic circuits...",
    "Loading user profile..."
];

const LoadingSpinner: React.FC = () => {
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex(prevIndex => (prevIndex + 1) % loadingMessages.length);
        }, 2500); // Change message every 2.5 seconds
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center gap-8 text-center">
            <div className="relative w-24 h-24 sm:w-32 sm:h-32">
                 <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20"></div>
                 <div className="absolute inset-2 rounded-full border-4 border-dashed border-cyan-500/30 animate-[spin_20s_linear_infinite_reverse]"></div>
                 <div className="absolute inset-0 rounded-full border-t-4 border-cyan-400 animate-[spin_1.5s_ease-in-out_infinite]"></div>
            </div>
            <p className="text-lg text-cyan-300 font-light tracking-wider animate-fade-in w-64">
                {loadingMessages[messageIndex]}
            </p>
        </div>
    );
};

export default LoadingSpinner;