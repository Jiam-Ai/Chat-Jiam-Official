
import React, { useEffect } from 'react';

interface ImageModalProps {
  imageUrl: string;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, onClose }) => {

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `jiam-image-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  return (
    <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
        <div className="relative animate-scale-in" onClick={e => e.stopPropagation()}>
            <img src={imageUrl} alt="Full-screen view" className="max-w-full max-h-[85vh] object-contain"/>

            <button 
                onClick={onClose}
                className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-black/70 text-white flex items-center justify-center text-2xl border border-white"
                title="Close (Esc)"
            >
                &times;
            </button>
            <button
                onClick={handleDownload}
                className="absolute top-2 left-2 w-10 h-10 rounded-full bg-black/70 text-white flex items-center justify-center border border-white"
                title="Download Image"
            >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"/></svg>
            </button>
        </div>
    </div>
  );
};

export default ImageModal;