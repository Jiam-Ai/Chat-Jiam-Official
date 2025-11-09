import React from 'react';

const MessageAvatar: React.FC = () => {
  return (
    <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gradient-to-br from-cyan-900 to-gray-900 flex items-center justify-center p-1 shadow-lg border-2 border-cyan-500/50">
      <img
        src="https://files.catbox.moe/cw35ls.jpg"
        alt="Jiam Avatar"
        className="w-full h-full rounded-full object-cover"
      />
    </div>
  );
};

export default MessageAvatar;