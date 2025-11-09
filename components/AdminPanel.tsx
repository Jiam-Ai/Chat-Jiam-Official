
import React, { useState, useEffect } from 'react';
import { firebaseService } from '../services/firebaseService';
import type { User } from '../types';

interface AdminPanelProps {
  currentUser: User;
  isVisible: boolean;
  onClose: () => void;
  initiateCall: (targetUsername: string) => void;
}

interface PanelUser {
    username: string;
    role: 'user' | 'admin' | 'super';
}

const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser, isVisible, onClose, initiateCall }) => {
  const [persona, setPersona] = useState('');
  const [broadcast, setBroadcast] = useState('');
  const [users, setUsers] = useState<PanelUser[]>([]);
  const [currentBroadcast, setCurrentBroadcast] = useState<{ text: string, timestamp: number } | null>(null);

  useEffect(() => {
    if (isVisible) {
      firebaseService.getGlobalPersona().then(setPersona);
      firebaseService.getBroadcast().then(setCurrentBroadcast);
      
      const fetchUsers = async () => {
          const [allUsers, roles] = await Promise.all([
              firebaseService.getAllUsers(),
              firebaseService.getRoles()
          ]);
          // Fix: Refactor user list creation to be type-safe by ensuring only valid roles for the admin panel are included.
          const userList = Object.keys(allUsers).reduce<PanelUser[]>((acc, username) => {
            if (username === currentUser.username) {
              return acc;
            }
            const role = firebaseService.getUserRole(username, roles);
            if (role !== 'guest') {
              acc.push({ username, role });
            }
            return acc;
          }, []);
          setUsers(userList);
      };
      fetchUsers();
    }
  }, [isVisible, currentUser.username]);
  
  if (!isVisible) return null;

  const handleSavePersona = () => {
      firebaseService.saveGlobalPersona(persona);
      alert("Jiam's global logic updated.");
      onClose();
  };

  const handleResetPersona = () => {
    if (window.confirm("Reset global logic to default for all users?")) {
        firebaseService.resetGlobalPersona();
        alert("Global logic has been reset.");
        onClose();
    }
  };

  const handleBroadcast = () => {
    if (broadcast.trim()) {
        firebaseService.sendBroadcast(broadcast.trim()).then(() => {
            alert("Broadcast sent!");
            firebaseService.getBroadcast().then(setCurrentBroadcast); // Refresh
            setBroadcast('');
        });
    }
  };
  
  const handleDeleteBroadcast = () => {
      if (window.confirm("Are you sure you want to delete the current broadcast message for all users?")) {
          firebaseService.deleteBroadcast().then(() => {
              alert("Broadcast deleted.");
              setCurrentBroadcast(null);
          });
      }
  };

  const handleGrantAdmin = (username: string) => {
    if (window.confirm(`Make "${username}" an admin?`)) {
        firebaseService.grantAdmin(username);
    }
  };

  const handleRevokeAdmin = (username: string) => {
    if (window.confirm(`Revoke admin rights from "${username}"?`)) {
        firebaseService.revokeAdmin(username);
    }
  };

  return (
    <div className="fixed inset-0 bg-[rgba(5,8,15,0.95)] backdrop-blur-lg flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="relative w-full max-w-5xl h-full sm:h-[90vh] bg-[rgba(0,25,30,0.5)] border border-[#00d9ff] rounded-none sm:rounded-lg p-4 sm:p-6 flex flex-col sm:flex-row gap-6 font-code text-white animate-scale-in overflow-y-auto">
        <button onClick={onClose} className="absolute top-2 right-2 sm:top-4 sm:right-4 w-8 h-8 rounded-full bg-white text-black flex items-center justify-center text-xl font-bold z-10">&times;</button>
        
        {/* Main Column */}
        <div className="flex-grow flex flex-col gap-4 min-h-[50vh]">
          <h3 className="font-title text-lg sm:text-xl text-[#00d9ff] border-b border-cyan-500/30 pb-2">JIAM :: CORE LOGIC INTERFACE</h3>
          <textarea
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            className="flex-grow bg-black/50 border border-[#00d9ff] rounded-md p-2 sm:p-4 resize-none outline-none focus:ring-2 focus:ring-[#00d9ff]"
          />
          <div className="flex flex-col sm:flex-row gap-4">
            <button onClick={handleSavePersona} className="flex-1 p-3 bg-[#00d9ff] text-black rounded-md font-title transition hover:brightness-110 transform hover:scale-105">Save & Apply Global Logic</button>
            <button onClick={handleResetPersona} className="flex-1 p-3 bg-transparent border border-red-500 text-red-500 rounded-md font-title transition transform hover:scale-105 hover:bg-red-500 hover:text-white">Reset to Default</button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full sm:w-80 flex-shrink-0 flex flex-col gap-6">
          <div className="flex-grow flex flex-col min-h-[30vh]">
            <h3 className="font-title text-lg sm:text-xl text-[#00d9ff] border-b border-cyan-500/30 pb-2 mb-2">User Management</h3>
            <ul className="flex-grow bg-black/50 border border-[#00d9ff] rounded-md p-2 space-y-1 overflow-y-auto">
              {users.map(user => (
                <li key={user.username} className="flex items-center justify-between p-2 rounded hover:bg-white/5">
                  <span className="text-sm truncate">{user.username} {user.role !== 'user' && <span className="text-xs text-cyan-400 font-bold ml-1 sm:ml-2">({user.role.toUpperCase()})</span>}</span>
                  <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    <button onClick={() => initiateCall(user.username)} className="text-xs border border-green-500 text-green-500 px-2 py-0.5 rounded transition transform hover:scale-105 hover:bg-green-500 hover:text-white">Call</button>
                    {currentUser.role === 'super' && user.role === 'admin' && <button onClick={() => handleRevokeAdmin(user.username)} className="text-xs border border-red-500 text-red-500 px-2 py-0.5 rounded transition transform hover:scale-105 hover:bg-red-500 hover:text-white">Revoke</button>}
                    {currentUser.role === 'super' && user.role === 'user' && <button onClick={() => handleGrantAdmin(user.username)} className="text-xs border border-green-500 text-green-500 px-2 py-0.5 rounded transition transform hover:scale-105 hover:bg-green-500 hover:text-white">Grant</button>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-title text-lg sm:text-xl text-[#00d9ff] border-b border-cyan-500/30 pb-2 mb-2">Broadcast Message</h3>
            {currentBroadcast && (
                <div className="mb-4 p-2 bg-black/40 border border-cyan-500/30 rounded-md text-xs">
                    <p className="font-bold text-cyan-400">Current Broadcast:</p>
                    <p className="italic text-gray-300 break-words">"{currentBroadcast.text}"</p>
                    {currentUser.role === 'super' && (
                      <button 
                          onClick={handleDeleteBroadcast} 
                          className="w-full mt-2 text-xs border border-red-500 text-red-500 px-2 py-1 rounded transition transform hover:scale-105 hover:bg-red-500 hover:text-white"
                      >
                          Delete Broadcast
                      </button>
                    )}
                </div>
            )}
            <textarea
                value={broadcast}
                onChange={(e) => setBroadcast(e.target.value)}
                rows={3}
                placeholder="Type a message to send or update..."
                className="w-full bg-black/50 border border-[#00d9ff] rounded-md p-2 resize-none outline-none focus:ring-2 focus:ring-[#00d9ff]"
            />
            <button onClick={handleBroadcast} className="w-full mt-2 p-3 bg-[#00d9ff] text-black rounded-md font-title transition hover:brightness-110 transform hover:scale-105">Send Broadcast</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;