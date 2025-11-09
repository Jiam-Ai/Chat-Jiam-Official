import React from 'react';

interface MemoryConfirmationPromptProps {
  fact: string;
  onConfirm: () => void;
  onReject: () => void;
}

const MemoryConfirmationPrompt: React.FC<MemoryConfirmationPromptProps> = ({ fact, onConfirm, onReject }) => {
  return (
    <div className="flex justify-start animate-fade-in pl-12 sm:pl-14">
      <div className="w-fit max-w-[90%] sm:max-w-[85%] mt-2 p-3 bg-black/30 backdrop-blur-md border border-cyan-300/20 rounded-xl shadow-lg">
        <p className="text-sm text-gray-300 mb-3">
          Jiam wants to remember the following:
          <br />
          <strong className="font-medium text-cyan-400 block mt-1">"{fact}"</strong>
        </p>
        <p className="text-xs text-gray-400 mb-3">Save this to your personal memory bank?</p>
        <div className="flex gap-3">
          <button 
            onClick={onConfirm} 
            className="flex-1 px-3 py-1.5 text-sm font-semibold bg-cyan-500 text-black rounded-md transition hover:bg-cyan-400 hover:scale-105"
          >
            Save
          </button>
          <button 
            onClick={onReject} 
            className="flex-1 px-3 py-1.5 text-sm font-semibold bg-white/10 text-white rounded-md transition hover:bg-white/20"
          >
            Don't Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default MemoryConfirmationPrompt;
