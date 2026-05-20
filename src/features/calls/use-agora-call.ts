import AgoraRTC, {
  type IAgoraRTCClient,
  type IAgoraRTCRemoteUser,
  type ICameraVideoTrack,
  type IMicrophoneAudioTrack,
} from 'agora-rtc-sdk-ng';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { acceptCallApi, endCallApi, getCallToken, rejectCallApi, startCall } from './api';
import { stopRingtone } from './ringtone';

export type CallState = 'idle' | 'outgoing' | 'incoming' | 'active';

export const RING_TIMEOUT_MS = 15_000;

export type IncomingCallData = {
  appointmentId: string;
  callType: 'audio' | 'video';
  callerName: string;
  callerPhoto?: string;
  channelName: string;
};

export type CallPeer = {
  name: string;
  photo?: string;
};

export function useAgoraCall() {
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localAudioRef = useRef<IMicrophoneAudioTrack | null>(null);
  const localVideoRef = useRef<ICameraVideoTrack | null>(null);
  const remoteUsersRef = useRef<IAgoraRTCRemoteUser[]>([]);
  const callStateRef = useRef<CallState>('idle');
  const remoteCountRef = useRef(0);
  const isJoiningRef = useRef(false);
  const isCleaningUpRef = useRef(false);
  const joinGenerationRef = useRef(0);
  const mountedRef = useRef(true);

  const [callState, setCallState] = useState<CallState>('idle');
  const [callType, setCallType] = useState<'audio' | 'video'>('video');
  const [appointmentId, setAppointmentId] = useState<string | null>(null);
  const [callPeer, setCallPeer] = useState<CallPeer | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const outgoingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callStartedAtRef = useRef<number | null>(null);

  callStateRef.current = callState;
  remoteUsersRef.current = remoteUsers;

  const syncTrackState = useCallback(() => {
    setLocalAudioTrack(localAudioRef.current);
    setLocalVideoTrack(localVideoRef.current);
  }, []);

  const stopRemoteTracks = useCallback((users: IAgoraRTCRemoteUser[]) => {
    for (const user of users) {
      user.audioTrack?.stop();
      user.videoTrack?.stop();
    }
  }, []);

  const cleanup = useCallback(async () => {
    if (isCleaningUpRef.current) return;
    isCleaningUpRef.current = true;
    joinGenerationRef.current += 1;
    isJoiningRef.current = false;
    stopRingtone();

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (outgoingTimeoutRef.current) {
      clearTimeout(outgoingTimeoutRef.current);
      outgoingTimeoutRef.current = null;
    }

    const client = clientRef.current;
    const audio = localAudioRef.current;
    const video = localVideoRef.current;
    const remotes = [...remoteUsersRef.current];

    stopRemoteTracks(remotes);

    if (client) {
      try {
        if (client.connectionState !== 'DISCONNECTED') {
          await client.unpublish();
        }
      } catch {
        /* ignore */
      }
      try {
        if (client.connectionState !== 'DISCONNECTED') {
          await client.leave();
        }
      } catch {
        /* ignore */
      }
      client.removeAllListeners();
      clientRef.current = null;
    }

    if (audio) {
      audio.stop();
      audio.close();
      localAudioRef.current = null;
    }
    if (video) {
      video.stop();
      video.close();
      localVideoRef.current = null;
    }

    if (mountedRef.current) {
      syncTrackState();
      setRemoteUsers([]);
      remoteCountRef.current = 0;
      setCallDuration(0);
      setIsMuted(false);
      setIsCameraOff(false);
      setAppointmentId(null);
      setCallPeer(null);
      setIncomingCall(null);
    }
    callStartedAtRef.current = null;
    isCleaningUpRef.current = false;
  }, [stopRemoteTracks, syncTrackState]);

  const startDurationTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    callStartedAtRef.current = Date.now();
    setCallDuration(0);
    timerRef.current = setInterval(() => {
      if (callStartedAtRef.current) {
        setCallDuration(Math.floor((Date.now() - callStartedAtRef.current) / 1000));
      }
    }, 1000);
  }, []);

  const activateCall = useCallback(() => {
    if (outgoingTimeoutRef.current) {
      clearTimeout(outgoingTimeoutRef.current);
      outgoingTimeoutRef.current = null;
    }
    stopRingtone();
    callStateRef.current = 'active';
    setCallState('active');
    if (!callStartedAtRef.current) {
      startDurationTimer();
    }
  }, [startDurationTimer]);

  const ensureClient = useCallback(() => {
    if (clientRef.current) return clientRef.current;

    const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    clientRef.current = client;

    client.on('connection-state-change', (cur, prev, reason) => {
      if (import.meta.env.DEV) {
        console.debug('[Agora] connection:', prev, '→', cur, reason ?? '');
      }
    });

    client.on('user-published', async (user, mediaType) => {
      if (!clientRef.current) return;
      try {
        await clientRef.current.subscribe(user, mediaType);
      } catch (e) {
        console.warn('[Agora] subscribe failed', e);
        return;
      }
      setRemoteUsers((prev) => {
        const exists = prev.find((u) => u.uid === user.uid);
        const next = exists ? prev.map((u) => (u.uid === user.uid ? user : u)) : [...prev, user];
        remoteUsersRef.current = next;
        remoteCountRef.current = next.length;
        return next;
      });
      if (mediaType === 'audio') {
        user.audioTrack?.play();
      }
      if (callStateRef.current === 'outgoing' || callStateRef.current === 'incoming') {
        activateCall();
      }
    });

    client.on('user-unpublished', (user, mediaType) => {
      if (mediaType === 'video') {
        setRemoteUsers((prev) => {
          const next = prev.map((u) => (u.uid === user.uid ? user : u));
          remoteUsersRef.current = next;
          return next;
        });
      }
    });

    client.on('user-left', (user) => {
      setRemoteUsers((prev) => {
        const next = prev.filter((u) => u.uid !== user.uid);
        remoteUsersRef.current = next;
        remoteCountRef.current = next.length;
        return next;
      });
    });

    return client;
  }, [activateCall]);

  const joinChannel = useCallback(
    async (type: 'audio' | 'video', apptId: string) => {
      if (isJoiningRef.current) {
        console.warn('[Agora] join skipped — already joining');
        return;
      }

      const generation = ++joinGenerationRef.current;
      isJoiningRef.current = true;

      try {
        const tokenData = await getCallToken(apptId, type);
        if (generation !== joinGenerationRef.current || !mountedRef.current) {
          throw new Error('Join cancelled');
        }

        const audio = await AgoraRTC.createMicrophoneAudioTrack();
        if (generation !== joinGenerationRef.current) {
          audio.stop();
          audio.close();
          throw new Error('Join cancelled');
        }
        localAudioRef.current = audio;

        let video: ICameraVideoTrack | null = null;
        if (type === 'video') {
          video = await AgoraRTC.createCameraVideoTrack();
          if (generation !== joinGenerationRef.current) {
            audio.stop();
            audio.close();
            video.stop();
            video.close();
            throw new Error('Join cancelled');
          }
          localVideoRef.current = video;
        }

        syncTrackState();

        const client = ensureClient();
        if (generation !== joinGenerationRef.current) {
          throw new Error('Join cancelled');
        }

        if (client.connectionState === 'CONNECTED' || client.connectionState === 'CONNECTING') {
          try {
            await client.leave();
          } catch {
            /* ignore */
          }
        }

        await client.join(tokenData.appId, tokenData.channelName, tokenData.token, tokenData.uid);

        if (generation !== joinGenerationRef.current || !mountedRef.current) {
          try {
            await client.leave();
          } catch {
            /* ignore */
          }
          throw new Error('Join cancelled');
        }

        const publishTracks = [audio, video].filter(Boolean) as (
          | IMicrophoneAudioTrack
          | ICameraVideoTrack
        )[];
        await client.publish(publishTracks);
      } finally {
        if (generation === joinGenerationRef.current) {
          isJoiningRef.current = false;
        }
      }
    },
    [ensureClient, syncTrackState],
  );

  const endCall = useCallback(
    async (outcome: 'completed' | 'rejected' | 'missed' | 'cancelled' = 'completed') => {
      const apptId = appointmentId;
      const type = callType;
      const duration =
        callStartedAtRef.current != null
          ? Math.max(0, Math.floor((Date.now() - callStartedAtRef.current) / 1000))
          : 0;

      joinGenerationRef.current += 1;

      if (apptId) {
        try {
          await endCallApi({
            appointmentId: apptId,
            outcome,
            durationSeconds: outcome === 'completed' ? duration : 0,
            callType: type,
          });
        } catch {
          /* best effort */
        }
      }

      await cleanup();
      if (mountedRef.current) setCallState('idle');
    },
    [appointmentId, callType, cleanup],
  );

  const scheduleRingTimeout = useCallback(() => {
    if (outgoingTimeoutRef.current) clearTimeout(outgoingTimeoutRef.current);
    outgoingTimeoutRef.current = setTimeout(() => {
      if (callStateRef.current === 'outgoing' && remoteCountRef.current === 0) {
        toast.info('No answer');
        void endCall('missed');
      }
    }, RING_TIMEOUT_MS);
  }, [endCall]);

  const initiateCall = useCallback(
    async (type: 'audio' | 'video', apptId: string, peer?: CallPeer) => {
      if (callStateRef.current !== 'idle' || isJoiningRef.current) return;

      callStateRef.current = 'outgoing';
      try {
        setCallType(type);
        setAppointmentId(apptId);
        setCallPeer(peer ?? null);
        setCallState('outgoing');

        await startCall(apptId, type);
        await joinChannel(type, apptId);

        if (callStateRef.current === 'outgoing') {
          scheduleRingTimeout();
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Could not start call';
        if (!msg.includes('cancelled') && !msg.includes('OPERATION_ABORTED')) {
          toast.error(msg);
        }
        await cleanup();
        callStateRef.current = 'idle';
        if (mountedRef.current) setCallState('idle');
      }
    },
    [joinChannel, cleanup, scheduleRingTimeout],
  );

  const acceptCall = useCallback(async () => {
    if (!incomingCall || isJoiningRef.current) return;

    const { appointmentId: apptId, callType: type, callerName, callerPhoto } = incomingCall;
    stopRingtone();

    try {
      setCallType(type);
      setAppointmentId(apptId);
      setCallPeer({ name: callerName, photo: callerPhoto });
      setIncomingCall(null);
      callStateRef.current = 'incoming';
      setCallState('incoming');

      callStateRef.current = 'active';
      setCallState('active');

      await acceptCallApi(apptId);
      await joinChannel(type, apptId);

      if (remoteCountRef.current > 0) {
        activateCall();
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not join call';
      if (!msg.includes('cancelled') && !msg.includes('OPERATION_ABORTED')) {
        toast.error(msg);
      }
      await cleanup();
      callStateRef.current = 'idle';
      if (mountedRef.current) setCallState('idle');
    }
  }, [incomingCall, joinChannel, activateCall, cleanup]);

  const rejectIncoming = useCallback(async () => {
    if (!incomingCall) return;
    stopRingtone();
    const { appointmentId: apptId, callType: type } = incomingCall;
    joinGenerationRef.current += 1;
    try {
      await rejectCallApi(apptId, type);
    } catch {
      /* best effort */
    }
    await cleanup();
    callStateRef.current = 'idle';
    if (mountedRef.current) setCallState('idle');
  }, [incomingCall, cleanup]);

  const toggleMute = useCallback(async () => {
    const audio = localAudioRef.current;
    if (audio) {
      await audio.setEnabled(isMuted);
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const toggleCamera = useCallback(async () => {
    const video = localVideoRef.current;
    if (video) {
      await video.setEnabled(isCameraOff);
      setIsCameraOff(!isCameraOff);
    }
  }, [isCameraOff]);

  const handleIncomingCall = useCallback((data: IncomingCallData) => {
    if (callStateRef.current !== 'idle' || isJoiningRef.current) return;
    setIncomingCall(data);
    setCallPeer({ name: data.callerName, photo: data.callerPhoto });
    callStateRef.current = 'incoming';
    setCallState('incoming');
  }, []);

  const handleCallEnded = useCallback(async () => {
    if (callStateRef.current === 'idle') return;
    stopRingtone();
    joinGenerationRef.current += 1;
    toast.info('Call ended');
    await cleanup();
    callStateRef.current = 'idle';
    if (mountedRef.current) setCallState('idle');
  }, [cleanup]);

  const handleCallRejected = useCallback(async () => {
    if (callStateRef.current !== 'outgoing') return;
    stopRingtone();
    joinGenerationRef.current += 1;
    toast.info('Call declined');
    await cleanup();
    callStateRef.current = 'idle';
    if (mountedRef.current) setCallState('idle');
  }, [cleanup]);

  const handleCallAccepted = useCallback(() => {
    // Do not activate here — wait for Agora user-published so we don't show
    // "active" with 00:00 while still waiting for media.
  }, []);

  // Cleanup only on true unmount (not when remoteUsers changes)
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      joinGenerationRef.current += 1;
      void cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional mount-only teardown
  }, []);

  return {
    callState,
    callType,
    appointmentId,
    callPeer,
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
    handleCallAccepted,
  };
}
