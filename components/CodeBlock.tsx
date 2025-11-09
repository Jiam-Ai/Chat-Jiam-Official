import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeBlockProps {
  language: string;
  code: string;
}

// Normalize language aliases for better syntax highlighting reliability
const normalizeLanguage = (lang: string): string => {
    const langMap: { [key: string]: string } = {
        js: 'javascript',
        ts: 'typescript',
        py: 'python',
        rb: 'ruby',
        sh: 'bash',
        html: 'markup',
    };
    return langMap[lang.toLowerCase()] || lang.toLowerCase();
};

const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const lineCount = code.trim().split('\n').length;
  const isCollapsible = lineCount > 10;

  const handleCopy = () => {
    if (isCopied) return;
    navigator.clipboard.writeText(code).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    });
  };
  
  const finalLanguage = normalizeLanguage(language);

  // Define button classes for better readability and state management
  const copyButtonBaseClasses = "flex items-center gap-1.5 transition-all duration-200 text-xs px-2 py-1 rounded-md";
  const copyButtonNormalClasses = "bg-white/5 hover:bg-white/10 hover:text-white text-slate-300";
  const copyButtonCopiedClasses = "bg-[#00d9ff] text-black font-semibold cursor-not-allowed";


  return (
    <div className="bg-[#020a16] rounded-lg my-2 overflow-hidden font-code border border-[#00d9ff]/50 max-w-full shadow-lg">
      <div className="flex justify-between items-center px-4 py-1.5 bg-gradient-to-r from-[#00d9ff]/20 via-[#020a16]/50 to-[#020a16] text-xs text-slate-300">
        <span className="italic">{finalLanguage}</span>
        <div className="flex items-center gap-4">
            {isCollapsible && (
                <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1.5 hover:text-[#00d9ff] transition-colors duration-200 text-slate-300"
                >
                <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                </button>
            )}
            <button 
            onClick={handleCopy} 
            disabled={isCopied}
            className={`${copyButtonBaseClasses} ${isCopied ? copyButtonCopiedClasses : copyButtonNormalClasses}`}
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
                {isCopied ? 'Copied!' : 'Copy'}
            </button>
        </div>
      </div>
      <div className={`relative transition-[max-height] duration-500 ease-in-out overflow-hidden ${isCollapsible && !isExpanded ? 'max-h-56' : 'max-h-[100rem]'}`}>
        <SyntaxHighlighter
            language={finalLanguage}
            style={vscDarkPlus}
            customStyle={{
            margin: 0,
            padding: '1rem',
            backgroundColor: 'transparent',
            fontSize: '0.875rem'
            }}
            codeTagProps={{
            style: {
                fontFamily: "inherit"
            }
            }}
        >
            {code.trim()}
        </SyntaxHighlighter>
        {isCollapsible && !isExpanded && (
            <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-[#020a16] to-transparent pointer-events-none"></div>
        )}
      </div>
    </div>
  );
};

export default CodeBlock;