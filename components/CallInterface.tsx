
import React, { useEffect, useRef } from 'react';
import { CallState } from '../types';

interface CallInterfaceProps {
  callState: CallState;
  callerUsername: string | null;
  remoteStream?: MediaStream | null;
  onAnswer: () => void;
  onHangup: () => void;
}

const CallInterface: React.FC<CallInterfaceProps> = ({ callState, callerUsername, remoteStream, onAnswer, onHangup }) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current && remoteStream) {
      audioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);
  
  if (callState === CallState.IDLE) return null;

  const getStatusText = () => {
    switch(callState) {
        case CallState.INCOMING: return 'INCOMING CALL FROM';
        case CallState.OUTGOING: return 'CALLING';
        case CallState.CONNECTED: return 'CONNECTED TO';
        default: return '';
    }
  }

  return (
    <div className="fixed inset-0 bg-[radial-gradient(circle,rgba(2,10,22,0.8)_0%,rgba(5,20,40,0.9)_100%)] backdrop-blur-2xl z-[100] flex items-center justify-center flex-col text-white transition-opacity duration-500 p-4">
      <div className="text-center border border-[rgba(0,217,255,0.18)] p-8 sm:p-12 rounded-2xl bg-black/30 animate-[magical-glow-mobile_4s_linear_infinite] sm:animate-[magical-glow_4s_linear_infinite] animate-scale-in">
        <p className="text-base sm:text-lg tracking-widest opacity-80 mb-2">{getStatusText()}</p>
        <h2 className="font-title text-4xl sm:text-5xl mb-8 shadow-[0_0_15px_rgba(0,217,255,0.7)]">{callerUsername}</h2>
        <div className="flex gap-8 justify-center mt-10">
          {callState === CallState.INCOMING && (
            <button onClick={onAnswer} className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg shadow-black/40 transition-transform duration-300 hover:scale-110 hover:shadow-xl hover:shadow-black/50 bg-green-500">
              <svg className="w-8 h-8 fill-black" viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"></path></svg>
            </button>
          )}
          <button onClick={onHangup} className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg shadow-black/40 transition-transform duration-300 hover:scale-110 hover:shadow-xl hover:shadow-black/50 bg-red-500">
             <svg className="w-8 h-8 fill-black" viewBox="0 0 24 24"><path d="M12 9c-1.6 0-3.15.25-4.62.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.1-2.66 1.89-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.7c-.18-.18-.29-.43-.29-.71s.11-.53.29-.71c.39-.39 1.02-.39 1.41 0l1.38 1.38c.53-.46 1.12-.86 1.76-1.19.32-.16.53-.49.53-.85V7.22c-1.45.46-2.99.7-4.59.7-1.1 0-2.18-.13-3.23-.38-.23-.06-.48-.03-.68.08L0 8.08V3.06l1.41-1.41c.39-.39 1.02-.39 1.41 0L5.9 4.72c.19.19.22.45.06.68-1.05.74-2.02 1.63-2.88 2.65.24-.04.48-.05.72-.05zM21.71 13c.18-.18.29-.43.29-.71s-.11-.53-.29-.71l-2.46-2.46c-.19-.19-.45-.22-.68-.06-1.01.62-1.92 1.35-2.73 2.18-.39.39-.39 1.02 0 1.41l1.38 1.38c.79-.79 1.4-1.68 1.89-2.66.16-.33.51-.56.9-.56h3.1c.47-1.47.72-3.02.72-4.62 0-1.6-.25-3.15-.72-4.62h-3.1c-.39 0-.74.23-.9.56-.49.98-1.1 1.87-1.89 2.66l-1.38-1.38c-.39-.39-1.02-.39-1.41 0l-2.46 2.46c-.18-.18-.29-.43-.29-.71s-.11-.53.29-.71l2.46-2.46C13.51.62 12.78.23 12 0c-1.1 0-2.18.13-3.23-.38L10.2 1.8c.2.11.45.14.68.08 1.15-.27 2.34-.4 3.56-.4.48 0 .95.05 1.41.14l2.46-2.46c.39-.39 1.02-.39 1.41 0l2.12 2.12c.39.39.39 1.02 0 1.41L21.4 3.05c-.63.64-1.2 1.33-1.69 2.08.16.32.49.53.85.53h3.22c.46 1.45.7 2.99.7 4.59s-.23 3.14-.7 4.59h-3.22c-.36 0-.69-.21-.85-.53-.49-.75-1.06-1.44-1.69-2.08l-2.46-2.46c-.39-.39-1.02-.39-1.41 0l-2.12 2.12c-.39.39-.39 1.02 0 1.41l2.46 2.46c.74-1.06 1.63-2.02 2.65-2.88.22-.16.48-.19.72-.06l1.47 1.47c.2.2.45.22.68.06z"></path></svg>
          </button>
        </div>
      </div>
      <audio ref={audioRef} autoPlay />
    </div>
  );
};

export default CallInterface;