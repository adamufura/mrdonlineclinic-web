import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { getEnv } from '@/config/env';
import type { IncomingCallData } from './use-agora-call';

type CallSocketHandlers = {
  onIncomingCall: (data: IncomingCallData) => void;
  onCallEnded: () => void;
  onCallRejected: () => void;
  onCallAccepted: () => void;
};

/**
 * Persistent `/chat` connection for call signaling (incomingCall, callEnded, etc.).
 * Separate from per-room chat socket so calls work even outside an open thread.
 */
export function useCallSocket(token: string | null, userId: string | undefined, handlers: CallSocketHandlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!token || !userId) return;

    const socketBase = getEnv().VITE_SOCKET_URL;
    const socket: Socket = io(`${socketBase}/chat`, {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    const onIncoming = (data: IncomingCallData & { callerId?: string }) => {
      if (data.callerId && data.callerId === userId) return;
      handlersRef.current.onIncomingCall(data);
    };

    socket.on('incomingCall', onIncoming);
    socket.on('callEnded', () => handlersRef.current.onCallEnded());
    socket.on('callRejected', () => handlersRef.current.onCallRejected());
    socket.on('callAccepted', () => handlersRef.current.onCallAccepted());

    return () => {
      socket.off('incomingCall', onIncoming);
      socket.off('callEnded');
      socket.off('callRejected');
      socket.off('callAccepted');
      socket.disconnect();
    };
  }, [token, userId]);
}
