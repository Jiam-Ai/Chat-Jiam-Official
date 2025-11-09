import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { FIREBASE_CONFIG, SUPER_ADMIN_USERNAME, DEFAULT_PERSONA_PROMPT } from '../constants';
import type { ChatMessage } from '../types';

if (!firebase.apps.length) {
  firebase.initializeApp(FIREBASE_CONFIG);
}

const db = firebase.database();

// --- Key Sanitization Utilities ---
// Firebase keys cannot contain '.', '#', '$', '[', or ']'.
// We replace '.' with ',' as a simple, reversible solution for email-like usernames.
const sanitizeKey = (key: string): string => key.replace(/\./g, ',');
const unsanitizeKey = (key: string): string => key.replace(/,/g, '.');

// Helper to decode the keys of an object retrieved from Firebase.
const decodeObjectKeys = <T>(obj: Record<string, T> | null): Record<string, T> => {
  if (!obj) return {};
  return Object.keys(obj).reduce((acc, key) => {
    acc[unsanitizeKey(key)] = obj[key];
    return acc;
  }, {} as Record<string, T>);
};


export const firebaseService = {
  // --- Auth ---
  getUserData: async (username: string) => {
    const snapshot = await db.ref(`users/${sanitizeKey(username)}`).get();
    return snapshot.val();
  },
  createUser: async (username: string, data: object) => {
    await db.ref(`users/${sanitizeKey(username)}`).set(data);
  },

  // --- Roles ---
  // Fix: Explicitly type the return value of `getRoles` to `Promise<Record<string, string>>` to resolve type errors in useAuth.ts and AdminPanel.tsx.
  getRoles: async (): Promise<Record<string, string>> => {
    const snapshot = await db.ref('global/roles').get();
    return decodeObjectKeys<string>(snapshot.val());
  },
  
  getUserRole: (username: string | null, roles: Record<string, string>): 'guest' | 'user' | 'admin' | 'super' => {
      if (!username) return 'guest';
      if (username.toLowerCase() === SUPER_ADMIN_USERNAME.toLowerCase()) return 'super';
      // No sanitization needed here because the `roles` object now has unsanitized keys
      return (roles[username] as 'admin' | 'user') || 'user';
  },

  // --- Chat ---
  getChatHistory: async (username: string): Promise<ChatMessage[]> => {
    const snapshot = await db.ref(`chatHistory/${sanitizeKey(username)}`).get();
    return snapshot.val() || [];
  },
  saveChatHistory: (username: string, history: ChatMessage[]) => {
    return db.ref(`chatHistory/${sanitizeKey(username)}`).set(history.slice(-30));
  },

  // --- Memory & Persona ---
  getUserMemory: async (username: string): Promise<string> => {
    const snapshot = await db.ref(`memory/${sanitizeKey(username)}`).get();
    return snapshot.val() || '';
  },
  saveUserMemory: async (username: string, newFacts: string) => {
    const snapshot = await db.ref(`memory/${sanitizeKey(username)}`).get();
    const existingMemory = snapshot.val() || '';
    const updatedMemory = (existingMemory + '\n' + newFacts).trim();
    return db.ref(`memory/${sanitizeKey(username)}`).set(updatedMemory);
  },
  getGlobalPersona: async (): Promise<string> => {
    const snapshot = await db.ref('global/persona').get();
    return snapshot.val() || DEFAULT_PERSONA_PROMPT;
  },
  
  // --- Admin ---
  saveGlobalPersona: (persona: string) => {
    return db.ref('global/persona').set(persona);
  },
  resetGlobalPersona: () => {
    return db.ref('global/persona').set(DEFAULT_PERSONA_PROMPT);
  },
  getAllUsers: async () => {
    const snapshot = await db.ref('users').get();
    return decodeObjectKeys(snapshot.val());
  },
  grantAdmin: (username: string) => {
    return db.ref(`global/roles/${sanitizeKey(username)}`).set('admin');
  },
  revokeAdmin: (username: string) => {
    return db.ref(`global/roles/${sanitizeKey(username)}`).remove();
  },
  sendBroadcast: (message: string) => {
    const broadcast = { text: message, timestamp: Date.now() };
    return db.ref('global/broadcast').set(broadcast);
  },
  getBroadcast: async () => {
    const snapshot = await db.ref('global/broadcast').get();
    return snapshot.val();
  },
  deleteBroadcast: () => {
    return db.ref('global/broadcast').remove();
  },
  listenForBroadcasts: (username: string, callback: (message: ChatMessage | null) => void) => {
    const ref = db.ref('global/broadcast');
    const listener = ref.on('value', (snapshot) => {
        const broadcast = snapshot.val();
        if (broadcast) {
            callback({
                id: `broadcast-${broadcast.timestamp}`,
                type: 'broadcast',
                sender: 'jiam',
                content: broadcast.text,
                timestamp: broadcast.timestamp,
            });
        } else {
            // Signal that the broadcast was deleted
            callback(null);
        }
    });
    return () => ref.off('value', listener);
  },
  
  // --- WebRTC Signaling ---
  listenForCalls: (username: string, callback: (data: any) => void) => {
    const ref = db.ref(`calls/${sanitizeKey(username)}`);
    ref.on('value', snapshot => callback(snapshot.val()));
    return () => ref.off();
  },
  createCall: (targetUsername: string, data: any) => {
    return db.ref(`calls/${sanitizeKey(targetUsername)}`).set(data);
  },
  removeCall: (username: string) => {
    return db.ref(`calls/${sanitizeKey(username)}`).remove();
  },
  sendAnswer: (targetUsername: string, answer: any) => {
    return db.ref(`calls/${sanitizeKey(targetUsername)}/answer`).set(answer);
  },
  sendIceCandidate: (targetUsername: string, candidate: any) => {
    return db.ref(`calls/${sanitizeKey(targetUsername)}/iceCandidates`).push(candidate);
  },
  listenForAnswer: (username: string, callback: (data: any) => void) => {
    const ref = db.ref(`calls/${sanitizeKey(username)}/answer`);
    ref.on('value', snapshot => callback(snapshot.val()));
    return () => ref.off();
  },
  listenForIceCandidates: (username: string, callback: (data: any) => void) => {
    const ref = db.ref(`calls/${sanitizeKey(username)}/iceCandidates`);
    ref.on('child_added', snapshot => {
        callback(snapshot.val());
        snapshot.ref.remove();
    });
    return () => ref.off();
  },
};