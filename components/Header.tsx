import React from 'react';
import type { User } from '../types';
import Avatar from './Avatar';

interface HeaderProps {
    currentUser: User;
    onAdminOpen: () => void;
    onProfileOpen: () => void;
    isLoading: boolean;
    isThinkingModeEnabled: boolean;
}

const CoreSpinner: React.FC<{isActive: boolean}> = ({isActive}) => {
    // The classes are defined in index.html, so this simple structure is all we need.
    return (
        <div className="core-spinner-container">
            <div className={`gyro-scene ${isActive ? 'active' : ''}`}>
                <div className="gyro-ring gyro-ring-1"></div>
                <div className="gyro-ring gyro-ring-2"></div>
                <div className="gyro-ring gyro-ring-3"></div>
                <div className="gyro-core"></div>
            </div>
        </div>
    );
};

const ThinkingIndicator: React.FC = () => (
    <div className="flex items-center gap-1.5 animate-fade-in" title="Thinking Mode is Active">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-cyan-300 animate-[glow-pulse_2s_ease-in-out_infinite]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v0A2.5 2.5 0 0 1 9.5 7h0A2.5 2.5 0 0 1 7 4.5v0A2.5 2.5 0 0 1 9.5 2Z" />
            <path d="M14.5 2A2.5 2.5 0 0 1 17 4.5v0A2.5 2.5 0 0 1 14.5 7h0A2.5 2.5 0 0 1 12 4.5v0A2.5 2.5 0 0 1 14.5 2Z" />
            <path d="M12 7.5c-2 0-2.5-1-4.5-1" />
            <path d="M12 7.5c2 0 2.5-1 4.5-1" />
            <path d="M4.5 10.5c-1.5 0-2 1.5-2 3p0 2.5 2 2.5" />
            <path d="M19.5 10.5c1.5 0 2 1.5 2 3p0 2.5-2 2.5" />
            <path d="M12 11.5v-4" />
            <path d="m14.5 18.5-2-1" />
            <path d="m9.5 18.5 2-1" />
            <path d="M12 22v-2" />
            <path d="M12 18.5v-2.5" />
            <path d="M12 16a2.5 2.5 0 0 1-2.5-2.5v0A2.5 2.5 0 0 1 12 11h0a2.5 2.5 0 0 1 2.5 2.5v0A2.5 2.5 0 0 1 12 16Z" />
        </svg>
        <span className="hidden sm:inline text-xs text-cyan-300 font-semibold">Thinking</span>
    </div>
);

const Header: React.FC<HeaderProps> = ({ currentUser, onAdminOpen, onProfileOpen, isLoading, isThinkingModeEnabled }) => {
    const displayName = currentUser.displayName || currentUser.username;

    return (
        <header className="relative p-2 sm:p-4 text-center border-b border-[rgba(255,255,255,0.08)] flex justify-between items-center h-[70px] sm:h-[90px] flex-shrink-0 bg-gradient-to-b from-[rgba(10,18,35,0.7)] to-transparent">
            <CoreSpinner isActive={isLoading} />
            <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
                 <h1 className="font-title text-xl sm:text-2xl text-white tracking-wider">Jiam</h1>
            </div>
            <div className="z-10 w-full flex justify-between items-center sm:px-4">
                <div className="flex items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-400 status-indicator"></div>
                        <span className="text-xs sm:text-sm font-medium text-gray-300">Status: <span className="text-green-400 font-semibold">Online</span></span>
                    </div>
                    {isThinkingModeEnabled && <ThinkingIndicator />}
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                     <button 
                        onClick={onProfileOpen} 
                        disabled={currentUser.role === 'guest'}
                        className="flex items-center gap-2 sm:gap-3 group disabled:cursor-default"
                    >
                        <span className="text-sm hidden sm:inline group-hover:text-[#00d9ff] transition-colors">
                            <strong className="font-semibold">{displayName}</strong>
                        </span>
                        <Avatar avatarId={currentUser.avatar} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-transparent group-hover:border-[#00d9ff] transition-all" />
                    </button>
                    
                    {(currentUser.role === 'admin' || currentUser.role === 'super') && (
                        <button onClick={onAdminOpen} className="text-xs sm:text-sm bg-black/20 border border-white/10 text-gray-300 px-2 py-1 sm:px-3 rounded-md hover:bg-white/10 hover:text-white transition-colors duration-200">
                            Admin
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;