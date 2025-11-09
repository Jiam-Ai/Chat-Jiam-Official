import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className = '' }) => (
  <img 
    src="https://files.catbox.moe/cw35ls.jpg" 
    alt="Jiam Logo"
    className={className} 
    style={{ filter: 'brightness(1.2) contrast(1.1)' }} // Optional: Enhance image appearance
  />
);

export default Logo;