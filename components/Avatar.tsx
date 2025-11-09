import React from 'react';

interface AvatarProps {
  avatarId?: string;
  className?: string;
}

const avatarDesigns: { [key: string]: React.ReactNode } = {
  'avatar-1': (
    <g>
      <circle cx="12" cy="12" r="10" fill="#00d9ff" />
      <path d="M12 7V17M7 12H17" stroke="black" strokeWidth="2" strokeLinecap="round" />
    </g>
  ),
  'avatar-2': (
     <g>
      <rect x="2" y="2" width="20" height="20" rx="10" fill="#FF5733" />
      <polygon points="12,6 18,18 6,18" fill="white" />
    </g>
  ),
  'avatar-3': (
     <g>
      <circle cx="12" cy="12" r="10" fill="#33FF57" />
      <path d="M7 7L17 17M7 17L17 7" stroke="black" strokeWidth="2" strokeLinecap="round" />
    </g>
  ),
  'avatar-4': (
    <g>
      <rect x="2" y="2" width="20" height="20" rx="10" fill="#FFC300" />
      <circle cx="12" cy="12" r="5" fill="black" />
    </g>
  ),
};

export const availableAvatars = Object.keys(avatarDesigns);

const Avatar: React.FC<AvatarProps> = ({ avatarId = 'default', className = '' }) => {
    // Handle uploaded images (data URI)
    if (avatarId.startsWith('data:image/')) {
        return (
            <img
                src={avatarId}
                alt="User avatar"
                className={`${className} object-cover`}
            />
        );
    }
    
    // Handle preset SVG avatars or provide a default fallback
    const design = avatarDesigns[avatarId];
    return (
        <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
            {design || (
                // Generic User Icon as default fallback
                <g>
                    <circle cx="12" cy="12" r="10" fill="#2D3748" />
                    <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="#A0AEC0"/>
                </g>
            )}
        </svg>
    );
};

export default Avatar;