
import React, { useState } from 'react';
import type { LyricsContent } from '../types';

interface LyricsDisplayProps {
  data: LyricsContent;
}

const LyricsDisplay: React.FC<LyricsDisplayProps> = ({ data }) => {
    const [copyText, setCopyText] = useState('Copy');

    const handleCopy = () => {
        navigator.clipboard.writeText(data.lyrics);
        setCopyText('Copied!');
        setTimeout(() => setCopyText('Copy'), 2000);
    };

    return (
        <div className="w-full max-w-md">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h3 className="font-title text-lg text-[#00d9ff]">{data.title}</h3>
                    <p className="text-sm opacity-80 -mt-1">{data.artist}</p>
                </div>
                <button onClick={handleCopy} className="bg-[#00d9ff] text-black px-3 py-1.5 rounded-md text-sm font-bold transition-transform hover:scale-105">
                    {copyText}
                </button>
            </div>
            <pre className="font-code text-sm whitespace-pre-wrap max-h-96 overflow-y-auto bg-black/20 p-4 rounded-md leading-relaxed">
                {data.lyrics}
            </pre>
        </div>
    );
};

export default LyricsDisplay;
