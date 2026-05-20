import AgoraRTC, {
  type IAgoraRTCClient,
  type IAgoraRTCRemoteUser,
  type ICameraVideoTrack,
  type IMicrophoneAudioTrack,
} from 'agora-rtc-sdk-ng';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { acceptCallApi, endCallApi, getCallToken, rejectCallApi, startCall } from './api';

export type CallState = 'idle' | 'outgoing' | 'incoming' | 'active';

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
  const callStateRef = useRef<CallState>('idle');
  const remoteCountRef = useRef(0);

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
    const remotes = [...remoteUsers];

    stopRemoteTracks(remotes);

    if (client) {
      try {
        await client.unpublish();
      } catch {
        /* channel may already be left */
      }
      try {
        await client.leave();
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

    syncTrackState();
    setRemoteUsers([]);
    remoteCountRef.current = 0;
    setCallDuration(0);
    setIsMuted(false);
    setIsCameraOff(false);
    setAppointmentId(null);
    setCallPeer(null);
    setIncomingCall(null);
    callStartedAtRef.current = null;
  }, [remoteUsers, stopRemoteTracks, syncTrackState]);

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
    if (callStateRef.current === 'active') return;
    if (outgoingTimeoutRef.current) {
      clearTimeout(outgoingTimeoutRef.current);
      outgoingTimeoutRef.current = null;
    }
    setCallState('active');
    startDurationTimer();
  }, [startDurationTimer]);

  const getClient = useCallback(() => {
    if (!clientRef.current) {
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      clientRef.current = client;

      client.on('user-published', async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        setRemoteUsers((prev) => {
          const exists = prev.find((u) => u.uid === user.uid);
          const next = exists ? prev.map((u) => (u.uid === user.uid ? user : u)) : [...prev, user];
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
          setRemoteUsers((prev) => prev.map((u) => (u.uid === user.uid ? user : u)));
        }
      });

      client.on('user-left', (user) => {
        setRemoteUsers((prev) => {
          const next = prev.filter((u) => u.uid !== user.uid);
          remoteCountRef.current = next.length;
          return next;
        });
      });
    }
    return clientRef.current;
  }, [activateCall]);

  const joinChannel = useCallback(
    async (type: 'audio' | 'video', apptId: string) => {
      const tokenData = await getCallToken(apptId, type);
      const audio = await AgoraRTC.createMicrophoneAudioTrack();
      localAudioRef.current = audio;

      let video: ICameraVideoTrack | null = null;
      if (type === 'video') {
        video = await AgoraRTC.createCameraVideoTrack();
        localVideoRef.current = video;
      }

      syncTrackState();

      const client = getClient();
      await client.join(tokenData.appId, tokenData.channelName, tokenData.token, tokenData.uid);

      const publishTracks = [audio, video].filter(Boolean) as (IMicrophoneAudioTrack | ICameraVideoTrack)[];
      await client.publish(publishTracks);
    },
    [getClient, syncTrackState],
  );

  const endCall = useCallback(
    async (outcome: 'completed' | 'rejected' | 'missed' | 'cancelled' = 'completed') => {
      const apptId = appointmentId;
      const type = callType;
      const duration =
        callStartedAtRef.current != null
          ? Math.max(0, Math.floor((Date.now() - callStartedAtRef.current) / 1000))
          : 0;

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
      setCallState('idle');
    },
    [appointmentId, callType, cleanup],
  );

  const initiateCall = useCallback(
    async (type: 'audio' | 'video', apptId: string, peer?: CallPeer) => {
      if (callStateRef.current !== 'idle') return;
      try {
        setCallType(type);
        setAppointmentId(apptId);
        setCallPeer(peer ?? null);
        setCallState('outgoing');

        await startCall(apptId, type);
        await joinChannel(type, apptId);

        outgoingTimeoutRef.current = setTimeout(() => {
          if (callStateRef.current === 'outgoing' && remoteCountRef.current === 0) {
            toast.info('No answer');
            void endCall('missed');
          }
        }, 30000);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Could not start call');
        await cleanup();
        setCallState('idle');
      }
    },
    [joinChannel, cleanup, endCall],
  );

  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;
    try {
      const { appointmentId: apptId, callType: type, callerName, callerPhoto } = incomingCall;
      setCallType(type);
      setAppointmentId(apptId);
      setCallPeer({ name: callerName, photo: callerPhoto });
      setIncomingCall(null);
      setCallState('incoming');

      await acceptCallApi(apptId);
      await joinChannel(type, apptId);
      activateCall();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not join call');
      await cleanup();
      setCallState('idle');
    }
  }, [incomingCall, joinChannel, activateCall, cleanup]);

  const rejectIncoming = useCallback(async () => {
    if (!incomingCall) return;
    const { appointmentId: apptId, callType: type } = incomingCall;
    try {
      await rejectCallApi(apptId, type);
    } catch {
      /* best effort */
    }
    await cleanup();
    setCallState('idle');
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
    if (callStateRef.current !== 'idle') return;
    setIncomingCall(data);
    setCallPeer({ name: data.callerName, photo: data.callerPhoto });
    setCallState('incoming');
  }, []);

  const handleCallEnded = useCallback(async () => {
    if (callStateRef.current === 'idle') return;
    toast.info('Call ended');
    await cleanup();
    setCallState('idle');
  }, [cleanup]);

  const handleCallRejected = useCallback(async () => {
    if (callStateRef.current !== 'outgoing') return;
    toast.info('Call declined');
    await cleanup();
    setCallState('idle');
  }, [cleanup]);

  const handleCallAccepted = useCallback(() => {
    if (callStateRef.current === 'outgoing') {
      activateCall();
    }
  }, [activateCall]);

  useEffect(() => {
    return () => {
      void cleanup();
    };
  }, [cleanup]);

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
