import { useState, useEffect, useCallback } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { firebaseService } from '../services/firebaseService';
import type { User } from '../types';

const getFirebaseAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please check your credentials and try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Please log in instead.';
    case 'auth/weak-password':
      return 'The password is too weak. It should be at least 6 characters long.';
    case 'auth/invalid-email':
      return 'The email address is not valid. Please enter a correctly formatted email.';
    default:
      console.warn(`Unhandled Firebase Auth error: ${errorCode}`);
      return 'An unexpected authentication error occurred. Please try again later.';
  }
};


export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const updateUserState = useCallback(async (username: string | null) => {
    if (username) {
        const roles = await firebaseService.getRoles();
        const role = firebaseService.getUserRole(username, roles);
        
        let profile: { displayName?: string, avatar?: string } = {};
        if (username !== 'Guest') {
            const storedProfile = localStorage.getItem(`jiamUserProfile_${username}`);
            if (storedProfile) {
                try {
                    profile = JSON.parse(storedProfile);
                } catch (error) {
                    console.error("Failed to parse user profile from localStorage:", error);
                    localStorage.removeItem(`jiamUserProfile_${username}`);
                }
            }
        }

        setCurrentUser({ username, role, ...profile });
    } else {
        setCurrentUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const localUser = localStorage.getItem('jiamCurrentUser');
    const sessionUser = sessionStorage.getItem('jiamCurrentUser');
    const loggedInUser = localUser || sessionUser;
    updateUserState(loggedInUser);
  }, [updateUserState]);

  const signup = async (username: string, password: string): Promise<{success: boolean, message: string}> => {
    try {
        await firebase.auth().createUserWithEmailAndPassword(username, password);
        await firebaseService.createUser(username, { authProvider: 'password', createdAt: Date.now() });
        localStorage.setItem('jiamCurrentUser', username);
        await updateUserState(username);
        return { success: true, message: 'Successfully signed up!' };
    } catch (error: any) {
        console.error("Signup error:", error);
        const message = getFirebaseAuthErrorMessage(error.code);
        return { success: false, message };
    }
  };

  const login = async (username: string, password: string): Promise<{success: boolean, message: string}> => {
      try {
          await firebase.auth().signInWithEmailAndPassword(username, password);
          localStorage.setItem('jiamCurrentUser', username);
          await updateUserState(username);
          return { success: true, message: 'Successfully logged in!' };
      } catch (error: any) {
          console.error("Login error:", error);
          const message = getFirebaseAuthErrorMessage(error.code);
          return { success: false, message };
      }
  };
  
  const continueAsGuest = async () => {
      sessionStorage.setItem('jiamCurrentUser', 'Guest');
      await updateUserState('Guest');
  };
  
  const logout = () => {
    localStorage.removeItem('jiamCurrentUser');
    sessionStorage.removeItem('jiamCurrentUser');
    setCurrentUser(null);
  };
  
  const updateUserProfile = (profileData: { displayName?: string; avatar?: string }) => {
    if (currentUser && currentUser.username !== 'Guest') {
        const updatedUser = { ...currentUser, ...profileData };
        setCurrentUser(updatedUser);
        localStorage.setItem(`jiamUserProfile_${currentUser.username}`, JSON.stringify({
            displayName: updatedUser.displayName,
            avatar: updatedUser.avatar,
        }));
    }
  };


  return { currentUser, loading, login, signup, logout, continueAsGuest, updateUserProfile };
};