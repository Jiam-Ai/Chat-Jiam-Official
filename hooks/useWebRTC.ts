
import { useState, useEffect, useCallback, useRef } from 'react';
import { firebaseService } from '../services/firebaseService';
import { RTC_CONFIGURATION } from '../constants';
import type { User } from '../types';
import { CallState } from '../types';

export const useWebRTC = (currentUser: User | null) => {
  const [callState, setCallState] = useState<CallState>(CallState.IDLE);
  const [callerUsername, setCallerUsername] = useState<string | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);

  const cleanup = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    remoteStreamRef.current = null;
    setCallState(CallState.IDLE);
    setCallerUsername(null);
    if(currentUser) firebaseService.removeCall(currentUser.username);
  }, [currentUser]);

  const endCall = useCallback((notify: boolean) => {
    cleanup();
  }, [cleanup]);

  const createPeerConnection = useCallback((targetUsername: string) => {
    const pc = new RTCPeerConnection(RTC_CONFIGURATION);
    
    pc.onicecandidate = event => {
      if (event.candidate && currentUser) {
        firebaseService.sendIceCandidate(targetUsername, event.candidate.toJSON());
      }
    };
    
    pc.ontrack = event => {
      remoteStreamRef.current = event.streams[0];
      setCallState(CallState.CONNECTED);
    };

    if (currentUser) {
        firebaseService.listenForAnswer(currentUser.username, (answer) => {
            if (answer && pc.signalingState !== "stable") {
                pc.setRemoteDescription(new RTCSessionDescription(answer));
            }
        });

        firebaseService.listenForIceCandidates(currentUser.username, (candidate) => {
            if(candidate) {
                pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
        });
    }

    return pc;
  }, [currentUser]);

  const initiateCall = useCallback(async (targetUsername: string) => {
    if (!currentUser || callState !== CallState.IDLE) return;
    
    setCallState(CallState.OUTGOING);
    setCallerUsername(targetUsername);

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        localStreamRef.current = stream;
        
        const pc = createPeerConnection(targetUsername);
        peerConnectionRef.current = pc;
        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        await firebaseService.createCall(targetUsername, {
            offer: { type: offer.type, sdp: offer.sdp },
            from: currentUser.username,
            to: targetUsername
        });
    } catch (error) {
        console.error("Error initiating call:", error);
        endCall(false);
    }
  }, [currentUser, callState, createPeerConnection, endCall]);

  const answerCall = useCallback(async () => {
    if (!currentUser || callState !== CallState.INCOMING || !callerUsername) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      
      const pc = createPeerConnection(callerUsername);
      peerConnectionRef.current = pc;
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const callData = await firebaseService.getUserData(`calls/${currentUser.username}`);
      if (callData && callData.offer) {
        await pc.setRemoteDescription(new RTCSessionDescription(callData.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        await firebaseService.sendAnswer(callerUsername, { type: answer.type, sdp: answer.sdp });
        await firebaseService.removeCall(currentUser.username);
        setCallState(CallState.CONNECTED);
      }
    } catch (error) {
      console.error("Error answering call:", error);
      endCall(false);
    }
  }, [currentUser, callState, callerUsername, createPeerConnection, endCall]);

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = firebaseService.listenForCalls(currentUser.username, (callData) => {
        if (callData && callData.offer && callState === CallState.IDLE) {
            setCallState(CallState.INCOMING);
            setCallerUsername(callData.from);
        } else if (!callData && callState !== CallState.IDLE) {
            endCall(false);
        }
    });

    return () => {
      unsubscribe();
      cleanup();
    }
  }, [currentUser, callState, endCall, cleanup]);

  return { callState, callerUsername, remoteStream: remoteStreamRef.current, initiateCall, answerCall, endCall, isDuringCall: callState !== CallState.IDLE };
};
