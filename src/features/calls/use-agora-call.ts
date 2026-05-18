import AgoraRTC, {
  type IAgoraRTCClient,
  type IAgoraRTCRemoteUser,
  type ICameraVideoTrack,
  type IMicrophoneAudioTrack,
} from 'agora-rtc-sdk-ng';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { endCallApi, getCallToken, rejectCallApi, startCall } from './api';

export type CallState = 'idle' | 'outgoing' | 'incoming' | 'active';

export type IncomingCallData = {
  appointmentId: string;
  callType: 'audio' | 'video';
  callerName: string;
  callerPhoto?: string;
  channelName: string;
};

export function useAgoraCall() {
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const [callState, setCallState] = useState<CallState>('idle');
  const [callType, setCallType] = useState<'audio' | 'video'>('video');
  const [appointmentId, setAppointmentId] = useState<string | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const outgoingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize client
  const getClient = useCallback(() => {
    if (!clientRef.current) {
      clientRef.current = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      clientRef.current.on('user-published', async (user, mediaType) => {
        await clientRef.current!.subscribe(user, mediaType);
        setRemoteUsers((prev) => {
          const exists = prev.find((u) => u.uid === user.uid);
          if (exists) return prev.map((u) => (u.uid === user.uid ? user : u));
          return [...prev, user];
        });
        if (mediaType === 'audio') {
          user.audioTrack?.play();
        }
      });
      clientRef.current.on('user-unpublished', (user, mediaType) => {
        if (mediaType === 'video') {
          setRemoteUsers((prev) => prev.map((u) => (u.uid === user.uid ? user : u)));
        }
      });
      clientRef.current.on('user-left', (user) => {
        setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
      });
    }
    return clientRef.current;
  }, []);

  // Initiate a call
  const initiateCall = useCallback(async (type: 'audio' | 'video', apptId: string) => {
    try {
      setCallType(type);
      setAppointmentId(apptId);
      setCallState('outgoing');

      // Get token
      const tokenData = await getCallToken(apptId, type);

      // Notify other party
      await startCall(apptId, type);

      // Create tracks
      const tracks: { audio?: IMicrophoneAudioTrack; video?: ICameraVideoTrack } = {};
      tracks.audio = await AgoraRTC.createMicrophoneAudioTrack();
      setLocalAudioTrack(tracks.audio);
      if (type === 'video') {
        tracks.video = await AgoraRTC.createCameraVideoTrack();
        setLocalVideoTrack(tracks.video);
      }

      // Join channel
      const client = getClient();
      await client.join(tokenData.appId, tokenData.channelName, tokenData.token, tokenData.uid);

      // Publish tracks
      const publishTracks = [tracks.audio, tracks.video].filter(Boolean) as (IMicrophoneAudioTrack | ICameraVideoTrack)[];
      await client.publish(publishTracks);

      // Set active immediately (other party joins when they accept)
      setCallState('active');
      startDurationTimer();

      // Auto-cancel after 30s if no one joins
      outgoingTimeoutRef.current = setTimeout(() => {
        if (remoteUsers.length === 0) {
          toast.info('No answer');
          void endCall();
        }
      }, 30000);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not start call');
      await cleanup();
      setCallState('idle');
    }
  }, [getClient]);

  // Accept incoming call
  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;
    try {
      const { appointmentId: apptId, callType: type } = incomingCall;
      setCallType(type);
      setAppointmentId(apptId);
      setIncomingCall(null);

      // Get token
      const tokenData = await getCallToken(apptId, type);

      // Create tracks
      const tracks: { audio?: IMicrophoneAudioTrack; video?: ICameraVideoTrack } = {};
      tracks.audio = await AgoraRTC.createMicrophoneAudioTrack();
      setLocalAudioTrack(tracks.audio);
      if (type === 'video') {
        tracks.video = await AgoraRTC.createCameraVideoTrack();
        setLocalVideoTrack(tracks.video);
      }

      // Join channel
      const client = getClient();
      await client.join(tokenData.appId, tokenData.channelName, tokenData.token, tokenData.uid);

      // Publish
      const publishTracks = [tracks.audio, tracks.video].filter(Boolean) as (IMicrophoneAudioTrack | ICameraVideoTrack)[];
      await client.publish(publishTracks);

      setCallState('active');
      startDurationTimer();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not join call');
      await cleanup();
      setCallState('idle');
    }
  }, [incomingCall, getClient]);

  // Reject incoming call
  const rejectIncoming = useCallback(async () => {
    if (!incomingCall) return;
    try {
      await rejectCallApi(incomingCall.appointmentId);
    } catch { /* best effort */ }
    setIncomingCall(null);
    setCallState('idle');
  }, [incomingCall]);

  // End call
  const endCall = useCallback(async () => {
    if (outgoingTimeoutRef.current) {
      clearTimeout(outgoingTimeoutRef.current);
      outgoingTimeoutRef.current = null;
    }
    if (appointmentId) {
      try { await endCallApi(appointmentId); } catch { /* best effort */ }
    }
    await cleanup();
    setCallState('idle');
  }, [appointmentId]);

  // Toggle mute
  const toggleMute = useCallback(async () => {
    if (localAudioTrack) {
      await localAudioTrack.setEnabled(isMuted);
      setIsMuted(!isMuted);
    }
  }, [localAudioTrack, isMuted]);

  // Toggle camera
  const toggleCamera = useCallback(async () => {
    if (localVideoTrack) {
      await localVideoTrack.setEnabled(isCameraOff);
      setIsCameraOff(!isCameraOff);
    }
  }, [localVideoTrack, isCameraOff]);

  // Handle incoming call event (called from socket listener)
  const handleIncomingCall = useCallback((data: IncomingCallData) => {
    if (callState !== 'idle') return; // already in a call
    setIncomingCall(data);
    setCallState('incoming');
  }, [callState]);

  // Handle call ended by other party
  const handleCallEnded = useCallback(async () => {
    toast.info('Call ended');
    await cleanup();
    setCallState('idle');
    setIncomingCall(null);
  }, []);

  // Handle call rejected
  const handleCallRejected = useCallback(async () => {
    toast.info('Call declined');
    await cleanup();
    setCallState('idle');
  }, []);

  // Cleanup
  async function cleanup() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (outgoingTimeoutRef.current) {
      clearTimeout(outgoingTimeoutRef.current);
      outgoingTimeoutRef.current = null;
    }
    if (localAudioTrack) {
      localAudioTrack.stop();
      localAudioTrack.close();
      setLocalAudioTrack(null);
    }
    if (localVideoTrack) {
      localVideoTrack.stop();
      localVideoTrack.close();
      setLocalVideoTrack(null);
    }
    if (clientRef.current) {
      await clientRef.current.leave().catch(() => {});
    }
    setRemoteUsers([]);
    setCallDuration(0);
    setIsMuted(false);
    setIsCameraOff(false);
    setAppointmentId(null);
  }

  function startDurationTimer() {
    setCallDuration(0);
    timerRef.current = setInterval(() => {
      setCallDuration((d) => d + 1);
    }, 1000);
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (outgoingTimeoutRef.current) clearTimeout(outgoingTimeoutRef.current);
      void cleanup();
    };
  }, []);

  return {
    callState,
    callType,
    appointmentId,
    localAudioTrack,
    localVideoTrack,
    remoteUsers,
    isMuted,
    isCameraOff,
    callDuration,
    incomingCall,
    initiateCall,
    acceptCall,
    rejectIncoming,
    endCall,
    toggleMute,
    toggleCamera,
    handleIncomingCall,
    handleCallEnded,
    handleCallRejected,
  };
}
