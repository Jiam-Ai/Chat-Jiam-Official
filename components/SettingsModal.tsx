import React, { useState, useEffect } from 'react';
import type { VoiceSettings } from '../types';

interface SettingsModalProps {
  isVisible: boolean;
  onClose: () => void;
  currentSettings: VoiceSettings;
  onSave: (settings: VoiceSettings) => void;
}

const ToggleSwitch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void }> = ({ checked, onChange }) => (
  <label className="relative inline-flex items-center cursor-pointer">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
    <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-cyan-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
  </label>
);

const SettingsModal: React.FC<SettingsModalProps> = ({ isVisible, onClose, currentSettings, onSave }) => {
  const [settings, setSettings] = useState(currentSettings);

  useEffect(() => {
    if (isVisible) {
      setSettings(currentSettings);
    }
  }, [currentSettings, isVisible]);

  if (!isVisible) return null;

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  const sensitivityColor = `hsl(${(100 - settings.wakeWordSensitivity) * 1.2}, 70%, 50%)`; // Red to Green

  return (
    <div className="fixed inset-0 bg-[rgba(5,8,15,0.95)] backdrop-blur-lg flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="relative w-full max-w-md bg-[rgba(0,25,30,0.5)] border border-[#00d9ff] rounded-lg p-6 flex flex-col gap-6 font-body text-white animate-scale-in">
        <button onClick={onClose} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center text-xl font-bold z-10 hover:bg-white/20">&times;</button>
        
        <h2 className="font-title text-xl text-[#00d9ff] text-center border-b border-cyan-500/30 pb-3">Voice & Speech Settings</h2>
        
        <div className="space-y-6">
            <div className="p-4 rounded-lg bg-black/30">
                <div className="flex items-center justify-between">
                    <div>
                        <label htmlFor="ttsToggle" className="font-semibold text-gray-100">AI Voice Responses</label>
                        <p className="text-xs text-gray-400 mt-1">Automatically speak AI responses aloud.</p>
                    </div>
                    <ToggleSwitch 
                        checked={settings.isTtsEnabled} 
                        onChange={(checked) => setSettings(s => ({ ...s, isTtsEnabled: checked }))} 
                    />
                </div>
            </div>

            <div className={`p-4 rounded-lg bg-black/30 transition-opacity duration-300 ${!settings.isWakeWordEnabled ? 'opacity-50' : ''}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <label htmlFor="wakeWordToggle" className="font-semibold text-gray-100">"Hey Jiam" Wake Word</label>
                        <p className="text-xs text-gray-400 mt-1">Enable voice activation without clicking.</p>
                    </div>
                    <ToggleSwitch checked={settings.isWakeWordEnabled} onChange={(checked) => setSettings(s => ({ ...s, isWakeWordEnabled: checked }))} />
                </div>
            </div>

            <div className={`p-4 rounded-lg bg-black/30 transition-opacity duration-300 ${!settings.isWakeWordEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
                <label htmlFor="sensitivitySlider" className="block font-semibold text-gray-100 mb-2">Wake Word Sensitivity</label>
                 <div className="flex items-center gap-4">
                    <input
                        id="sensitivitySlider"
                        type="range"
                        min="10"
                        max="90"
                        step="10"
                        value={settings.wakeWordSensitivity}
                        onChange={(e) => setSettings(s => ({ ...s, wakeWordSensitivity: parseInt(e.target.value) }))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        style={{'--thumb-color': sensitivityColor} as React.CSSProperties}
                    />
                    <span className="font-mono w-12 text-center text-cyan-300">{settings.wakeWordSensitivity}%</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                    Lower values require clearer speech. Higher values are more responsive but may trigger accidentally.
                </p>
            </div>
        </div>
        
        <button onClick={handleSave} className="w-full mt-2 p-3 bg-[#00d9ff] text-black rounded-md font-title transition hover:brightness-110 transform hover:scale-105">
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default SettingsModal;