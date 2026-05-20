import { createContext, useContext, useMemo } from 'react';
import { ActiveCallOverlay, IncomingCallOverlay, OutgoingCallOverlay } from '@/features/calls/CallOverlays';
import { useAgoraCall, type IncomingCallData } from '@/features/calls/use-agora-call';
import { useCallSocket } from '@/features/calls/use-call-socket';
import { useAuthStore } from '@/stores/auth-store';

type AgoraCallContextValue = ReturnType<typeof useAgoraCall>;

const CallContext = createContext<AgoraCallContextValue | null>(null);

export function useCallContext(): AgoraCallContextValue {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error('useCallContext must be used within CallProvider');
  return ctx;
}

export function CallProvider({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.accessToken);
  const userId = useAuthStore((s) => s.user?.id);
  const agora = useAgoraCall();

  const socketHandlers = useMemo(
    () => ({
      onIncomingCall: (data: IncomingCallData) => agora.handleIncomingCall(data),
      onCallEnded: () => void agora.handleCallEnded(),
      onCallRejected: () => void agora.handleCallRejected(),
      onCallAccepted: () => agora.handleCallAccepted(),
    }),
    [agora],
  );

  useCallSocket(token, userId, socketHandlers);

  const peerName = agora.callPeer?.name ?? agora.incomingCall?.callerName ?? 'Contact';

  return (
    <CallContext.Provider value={agora}>
      {children}

      {agora.callState === 'outgoing' ? (
        <OutgoingCallOverlay
          calleeName={peerName}
          callType={agora.callType}
          onEnd={() => void agora.endCall('cancelled')}
        />
      ) : null}

      {agora.callState === 'incoming' && agora.incomingCall ? (
        <IncomingCallOverlay
          data={agora.incomingCall}
          onAccept={() => void agora.acceptCall()}
          onReject={() => void agora.rejectIncoming()}
        />
      ) : null}

      {agora.callState === 'active' ? (
        <ActiveCallOverlay
          callType={agora.callType}
          otherName={peerName}
          duration={agora.callDuration}
          isMuted={agora.isMuted}
          isCameraOff={agora.isCameraOff}
          localVideoTrack={agora.localVideoTrack}
          remoteUsers={agora.remoteUsers}
          onToggleMute={() => void agora.toggleMute()}
          onToggleCamera={() => void agora.toggleCamera()}
          onEnd={() => void agora.endCall('completed')}
        />
      ) : null}
    </CallContext.Provider>
  );
}
