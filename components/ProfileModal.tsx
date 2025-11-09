import React, { useState, useEffect, useRef } from 'react';
import type { User } from '../types';
import Avatar, { availableAvatars } from './Avatar';

interface ProfileModalProps {
  currentUser: User;
  isVisible: boolean;
  onClose: () => void;
  onSave: (profileData: { displayName?: string; avatar?: string }) => void;
  onLogout: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ currentUser, isVisible, onClose, onSave, onLogout }) => {
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('default');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isVisible) {
      setDisplayName(currentUser.displayName || currentUser.username);
      setSelectedAvatar(currentUser.avatar || 'default');
    }
  }, [isVisible, currentUser]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedAvatar(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleRemoveImage = () => {
    setSelectedAvatar('default');
  };

  if (!isVisible) return null;

  const handleSave = () => {
    onSave({ 
      displayName: displayName.trim() === currentUser.username ? '' : displayName.trim(),
      avatar: selectedAvatar 
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[rgba(5,8,15,0.95)] backdrop-blur-lg flex items-center justify-center z-50 p-4">
      <div className="relative w-full max-w-lg bg-[rgba(0,25,30,0.5)] border border-[#00d9ff] rounded-lg p-6 flex flex-col gap-6 font-body text-white animate-scale-in">
        <button onClick={onClose} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center text-xl font-bold z-10 hover:bg-white/20">&times;</button>
        
        <h2 className="font-title text-xl text-[#00d9ff] text-center">User Profile</h2>
        
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter a display name"
            className="w-full bg-[rgba(0,0,0,0.5)] border border-[rgba(255,255,255,0.1)] rounded-md text-white p-3 text-base outline-none transition-colors focus:ring-2 focus:ring-[#00d9ff] focus:border-[#00d9ff]"
          />
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-300 mb-4 text-center">Profile Picture</label>
            <div className="flex flex-col items-center gap-4">
                <div 
                    className="relative group w-32 h-32 flex-shrink-0 cursor-pointer" 
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload a new profile picture"
                >
                    <Avatar avatarId={selectedAvatar} className="w-32 h-32 rounded-full bg-black/20 shadow-lg border-2 border-transparent group-hover:border-cyan-400 transition-all" />
                    <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
                        </svg>
                    </div>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/png, image/jpeg, image/gif" className="hidden" />
                
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="px-5 py-2 text-sm font-semibold bg-white/10 text-white rounded-md transition hover:bg-white/20 btn"
                    >
                        Change Image
                    </button>
                    <button 
                        onClick={handleRemoveImage}
                        className="px-5 py-2 text-sm font-semibold bg-red-500/20 text-red-300 rounded-md transition hover:bg-red-500/40 disabled:opacity-50 disabled:cursor-not-allowed btn"
                        disabled={selectedAvatar === 'default' || availableAvatars.includes(selectedAvatar)}
                        title={availableAvatars.includes(selectedAvatar) ? "Cannot remove a preset avatar" : "Remove custom image"}
                    >
                        Remove Image
                    </button>
                </div>
                
                <p className="text-xs text-gray-400 mt-2">Or select a preset avatar below.</p>
            </div>
        </div>
        
        <div>
          <div className="grid grid-cols-4 gap-4">
            {availableAvatars.map(avatarId => (
              <button 
                key={avatarId}
                onClick={() => setSelectedAvatar(avatarId)}
                className={`w-full aspect-square rounded-full transition-all duration-200 ${selectedAvatar === avatarId ? 'ring-2 ring-offset-2 ring-offset-gray-800 ring-[#00d9ff] scale-110' : 'hover:scale-105 opacity-70 hover:opacity-100'}`}
              >
                <Avatar avatarId={avatarId} className="w-full h-full" />
              </button>
            ))}
          </div>
        </div>
        
        <div className="mt-2 flex flex-col gap-3">
          <button onClick={handleSave} className="w-full p-3 bg-[#00d9ff] text-black rounded-md font-title transition hover:brightness-110 transform hover:scale-105">
            Save Changes
          </button>
          {currentUser.role !== 'guest' && (
            <button onClick={onLogout} className="w-full p-2 bg-transparent border border-red-500/50 text-red-400 rounded-md font-title transition hover:bg-red-500/20 hover:text-red-300">
              Logout
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default ProfileModal;