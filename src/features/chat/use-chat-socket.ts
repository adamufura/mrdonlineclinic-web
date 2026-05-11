import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { getEnv } from '@/config/env';

/**
 * Subscribes to `/chat` namespace for realtime messages in `roomId`.
 * In dev, connect to Vite origin (proxy forwards `/socket.io` to backend).
 * In prod, connect to the configured API origin (same as backend host).
 */
export function useChatSocket(
  roomId: string | undefined,
  token: string | null,
  currentUserId: string | undefined,
  enabled: boolean,
) {
  const qc = useQueryClient();
  const handlerRef = useRef<(msg: Record<string, unknown>) => void>(() => {});

  handlerRef.current = (msg: Record<string, unknown>) => {
    const sender = msg.sender;
    const sid =
      sender && typeof sender === 'object' && '_id' in (sender as object)
        ? String((sender as { _id?: unknown })._id)
        : String(msg.sender ?? '');
    if (currentUserId && sid === currentUserId) return;
    void qc.invalidateQueries({ queryKey: ['chat', 'messages', roomId] });
    void qc.invalidateQueries({ queryKey: ['chat', 'rooms'] });
  };

  useEffect(() => {
    if (!enabled || !roomId || !token) return;

    const socketBase = getEnv().VITE_SOCKET_URL;
    const socket: Socket = io(`${socketBase}/chat`, {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.emit('joinRoom', roomId, (err?: Error) => {
      if (err) console.warn('[chat] joinRoom failed', err.message);
    });

    const onMessage = (msg: Record<string, unknown>) => handlerRef.current(msg);
    socket.on('message', onMessage);

    return () => {
      socket.emit('leaveRoom', roomId);
      socket.off('message', onMessage);
      socket.disconnect();
    };
  }, [roomId, token, enabled]);
}
