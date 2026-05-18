import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, isToday, isYesterday } from 'date-fns';
import {
  ArrowLeft,
  Calendar,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  Mic,
  Pause,
  Phone,
  Play,
  Search,
  Send,
  Stethoscope,
  Video,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { profilePhotoFrom, UserAvatar } from '@/components/shared/user-avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getChatRoom, listChatMessages, listChatRooms, markChatRoomReadAll as markRoomReadApi, postChatMessage, uploadChatFile } from '@/features/chat/api';
import { useChatSocket } from '@/features/chat/use-chat-socket';
import { useAgoraCall } from '@/features/calls/use-agora-call';
import { ActiveCallOverlay, IncomingCallOverlay, OutgoingCallOverlay } from '@/features/calls/CallOverlays';
import { cn } from '@/lib/utils/cn';
import { useAuthStore } from '@/stores/auth-store';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function displayName(u: Record<string, unknown> | null | undefined): string {
  if (!u) return 'Care team';
  const n = `${String(u.firstName ?? '')} ${String(u.lastName ?? '')}`.trim();
  return n || 'Care team';
}

function senderId(m: Record<string, unknown>): string {
  const s = m.sender;
  if (isRecord(s) && s._id != null) return String(s._id);
  if (typeof s === 'string') return s;
  return '';
}

type Row = { type: 'sep'; label: string } | { type: 'msg'; m: Record<string, unknown> };

function withDateSeparators(messages: Record<string, unknown>[]): Row[] {
  const asc = [...messages].reverse();
  const rows: Row[] = [];
  let lastDay: string | null = null;
  for (const m of asc) {
    const raw = m.createdAt;
    const d = raw ? new Date(String(raw)) : null;
    const dayKey = d && !Number.isNaN(d.getTime()) ? format(d, 'yyyy-MM-dd') : '';
    if (d && dayKey && dayKey !== lastDay) {
      lastDay = dayKey;
      const label = isToday(d) ? 'Today' : isYesterday(d) ? 'Yesterday' : format(d, 'EEEE, MMM d, yyyy');
      rows.push({ type: 'sep', label });
    }
    rows.push({ type: 'msg', m });
  }
  return rows;
}

export type MessagingWorkspaceProps = {
  /** e.g. `/patient/messages` */
  messagesBasePath: string;
  appointmentDetailPath: (appointmentId: string) => string;
};

export function MessagingWorkspace({ messagesBasePath, appointmentDetailPath }: MessagingWorkspaceProps) {
  const { roomId } = useParams<{ roomId?: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.accessToken);
  const myId = user?.id;

  const [listFilter, setListFilter] = useState<'all' | 'unread'>('all');
  const [search, setSearch] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const roomsQuery = useQuery({
    queryKey: ['chat', 'rooms', { page: 1, limit: 60 }],
    queryFn: () => listChatRooms({ page: 1, limit: 60 }),
  });

  const roomQuery = useQuery({
    queryKey: ['chat', 'room', roomId],
    queryFn: () => getChatRoom(roomId!),
    enabled: Boolean(roomId),
  });

  const messagesQuery = useQuery({
    queryKey: ['chat', 'messages', roomId, { page: 1, limit: 80 }],
    queryFn: () => listChatMessages(roomId!, { page: 1, limit: 80 }),
    enabled: Boolean(roomId),
  });

  useChatSocket(roomId, token, myId, Boolean(roomId && token));

  // ─── Agora Calls ───
  const agoraCall = useAgoraCall();

  const lastMarkedRoom = useRef<string | null>(null);

  useEffect(() => {
    if (!roomId) {
      lastMarkedRoom.current = null;
      return;
    }
    if (lastMarkedRoom.current === roomId) return;
    lastMarkedRoom.current = roomId;
    let cancelled = false;
    void (async () => {
      try {
        await markRoomReadApi(roomId);
        if (!cancelled) {
          await qc.invalidateQueries({ queryKey: ['chat', 'rooms'] });
          await qc.invalidateQueries({ queryKey: ['chat', 'room', roomId] });
        }
      } catch {
        /* non-blocking */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [roomId, qc]);

  const sendMut = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) => postChatMessage(id, text),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['chat', 'messages', roomId] });
      await qc.invalidateQueries({ queryKey: ['chat', 'rooms'] });
      await qc.invalidateQueries({ queryKey: ['chat', 'room', roomId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Send failed'),
  });

  const rooms = roomsQuery.data?.items ?? [];
  const filteredRooms = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rooms.filter((r) => {
      if (!isRecord(r)) return false;
      if (listFilter === 'unread' && Number(r.unreadCount ?? 0) <= 0) return false;
      if (!q) return true;
      const other = isRecord(r.otherParticipant) ? (r.otherParticipant as Record<string, unknown>) : null;
      return displayName(other).toLowerCase().includes(q);
    });
  }, [rooms, listFilter, search]);

  const activeRoom = roomQuery.data ?? (roomId ? rooms.find((r) => isRecord(r) && String(r._id) === roomId) : undefined);
  const other = isRecord(activeRoom) && isRecord(activeRoom.otherParticipant)
    ? (activeRoom.otherParticipant as Record<string, unknown>)
    : null;
  const appointment = isRecord(activeRoom) && isRecord(activeRoom.appointment) ? (activeRoom.appointment as Record<string, unknown>) : null;
  const apptId = appointment && appointment._id != null ? String(appointment._id) : null;
  const isLocked = Boolean(isRecord(activeRoom) && activeRoom.isLocked);

  const activeApptId: string | null = (() => {
    if (!activeRoom || !isRecord(activeRoom)) return null;
    const appt = isRecord(activeRoom.appointment) ? activeRoom.appointment : null;
    return appt && appt._id ? String(appt._id) : null;
  })();
  const canCall: boolean = (() => {
    if (!activeRoom || !isRecord(activeRoom)) return false;
    if (activeRoom.isLocked) return false;
    const appt = isRecord(activeRoom.appointment) ? activeRoom.appointment : null;
    if (!appt) return false;
    const status = String(appt.status ?? '');
    return status === 'CONFIRMED' || status === 'IN_PROGRESS';
  })();

  const messages = messagesQuery.data?.items ?? [];
  const rows = useMemo(() => withDateSeparators(messages), [messages]);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [roomId, messages.length, scrollToBottom]);

  const openRoom = (id: string) => {
    navigate(`${messagesBasePath}/${id}`);
  };

  const closeRoom = () => {
    navigate(messagesBasePath);
  };

  const title = other ? displayName(other) : 'Messages';

  return (
    <>
      <Helmet>
        <title>{title} — MRD Online Clinic</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      {/* Call Overlays */}
      {agoraCall.callState === 'outgoing' ? (
        <OutgoingCallOverlay
          calleeName={displayName(other)}
          callType={agoraCall.callType}
          onEnd={() => void agoraCall.endCall()}
        />
      ) : null}
      {agoraCall.callState === 'incoming' && agoraCall.incomingCall ? (
        <IncomingCallOverlay
          data={agoraCall.incomingCall}
          onAccept={() => void agoraCall.acceptCall()}
          onReject={() => void agoraCall.rejectIncoming()}
        />
      ) : null}
      {agoraCall.callState === 'active' ? (
        <ActiveCallOverlay
          callType={agoraCall.callType}
          otherName={displayName(other)}
          duration={agoraCall.callDuration}
          isMuted={agoraCall.isMuted}
          isCameraOff={agoraCall.isCameraOff}
          localVideoTrack={agoraCall.localVideoTrack}
          remoteUsers={agoraCall.remoteUsers}
          onToggleMute={() => void agoraCall.toggleMute()}
          onToggleCamera={() => void agoraCall.toggleCamera()}
          onEnd={() => void agoraCall.endCall()}
        />
      ) : null}

      <div className="flex h-[calc(100dvh-120px)] min-h-[440px] flex-col overflow-hidden rounded-[20px] border border-[#e2e8f0] bg-[#f8fafc] shadow-[0_8px_40px_rgba(15,23,42,0.06)] md:h-[calc(100dvh-132px)]">
        <div className="flex min-h-0 flex-1 divide-x divide-[#e2e8f0]">
          {/* Conversation list */}
          <aside
            className={cn(
              'flex w-full min-w-0 flex-col bg-white md:w-[min(100%,340px)] md:max-w-[40vw]',
              roomId ? 'hidden md:flex' : 'flex',
            )}
          >
            <div className="border-b border-[#e2e8f0] px-4 py-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h1 className="font-display text-xl font-medium tracking-tight text-[#0a1628]">Messages</h1>
                  <p className="mt-0.5 text-xs text-[#64748b]">Chats with your care team</p>
                </div>
                <MessageCircle className="h-5 w-5 text-sky-500/80" aria-hidden />
              </div>
              <div className="relative mt-3">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search"
                  className="h-10 border-[#e2e8f0] bg-[#f8fafc] pl-9 text-[13px] placeholder:text-[#94a3b8]"
                />
              </div>
              <div className="mt-3 flex gap-1 rounded-lg bg-[#f1f5f9] p-1">
                {(['all', 'unread'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setListFilter(f)}
                    className={cn(
                      'flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                      listFilter === f ? 'bg-white text-[#0a1628] shadow-sm' : 'text-[#64748b] hover:text-[#0a1628]',
                    )}
                  >
                    {f === 'all' ? 'All' : 'Unread'}
                    {f === 'unread' && roomsQuery.isSuccess ? (
                      <span className="ml-1 tabular-nums text-[#64748b]">
                        ({rooms.filter((r) => isRecord(r) && Number(r.unreadCount) > 0).length})
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {roomsQuery.isLoading ? (
                <div className="flex items-center justify-center gap-2 py-16 text-sm text-[#64748b]">
                  <Loader2 className="h-5 w-5 animate-spin text-sky-600" />
                  Loading…
                </div>
              ) : null}
              {roomsQuery.isError ? (
                <p className="px-4 py-8 text-center text-sm text-destructive">Could not load conversations.</p>
              ) : null}
              {!roomsQuery.isLoading && filteredRooms.length === 0 ? (
                <div className="mx-4 mt-10 rounded-2xl border border-dashed border-[#c5d5eb] bg-sky-50/40 px-4 py-10 text-center">
                  <Stethoscope className="mx-auto h-8 w-8 text-sky-400" />
                  <p className="mt-3 text-sm font-medium text-[#0a1628]">No conversations yet</p>
                  <p className="mt-2 text-xs leading-relaxed text-[#64748b]">
                    When a practitioner confirms an appointment, a secure chat opens so you can coordinate before and
                    after your visit.
                  </p>
                </div>
              ) : null}

              <ul className="pb-3">
                {filteredRooms.map((raw) => {
                  if (!isRecord(raw)) return null;
                  const id = String(raw._id);
                  const o = isRecord(raw.otherParticipant) ? (raw.otherParticipant as Record<string, unknown>) : null;
                  const last = isRecord(raw.lastMessage) ? (raw.lastMessage as Record<string, unknown>) : null;
                  const preview =
                    typeof last?.content === 'string' && last.content.trim()
                      ? last.content.trim()
                      : 'No messages yet';
                  const ts = last?.createdAt ? new Date(String(last.createdAt)) : raw.lastMessageAt
                    ? new Date(String(raw.lastMessageAt))
                    : null;
                  const timeLabel = ts && !Number.isNaN(ts.getTime()) ? (isToday(ts) ? format(ts, 'h:mm a') : format(ts, 'MMM d')) : '';
                  const unread = Number(raw.unreadCount ?? 0);
                  const active = roomId === id;

                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => openRoom(id)}
                        className={cn(
                          'flex w-full gap-3 border-b border-[#f1f5f9] px-4 py-3 text-left transition-colors hover:bg-[#f8fafc]',
                          active && 'bg-gradient-to-r from-sky-50/90 to-transparent ring-1 ring-inset ring-sky-100',
                        )}
                      >
                        <UserAvatar
                          name={displayName(o)}
                          photoUrl={profilePhotoFrom(o)}
                          className="h-11 w-11 shadow-sm"
                          fallbackClassName="h-11 w-11 bg-gradient-to-br from-sky-200 to-sky-500 text-sm font-semibold text-white"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="truncate font-semibold text-[#0a1628]">{displayName(o)}</span>
                            {timeLabel ? (
                              <span className="shrink-0 text-[11px] tabular-nums text-[#94a3b8]">{timeLabel}</span>
                            ) : null}
                          </div>
                          <div className="mt-0.5 flex items-center gap-2">
                            <p className="min-w-0 flex-1 truncate text-xs text-[#64748b]">{preview}</p>
                            {unread > 0 ? (
                              <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-sky-600 px-1.5 text-[10px] font-bold text-white">
                                {unread > 99 ? '99+' : unread}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>

          {/* Thread */}
          <section
            className={cn(
              'flex min-w-0 flex-1 flex-col bg-white',
              !roomId ? 'hidden md:flex' : 'flex',
              !roomId && 'items-center justify-center',
            )}
          >
            {!roomId ? (
              <div className="hidden max-w-sm px-6 text-center md:block">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-sky-100 to-teal-100 text-sky-700">
                  <MessageCircle className="h-8 w-8" strokeWidth={1.5} />
                </div>
                <p className="mt-5 font-display text-lg font-medium text-[#0a1628]">Select a conversation</p>
                <p className="mt-2 text-sm leading-relaxed text-[#64748b]">Pick someone from the list to read and send messages.</p>
              </div>
            ) : null}

            {roomId && roomQuery.isLoading ? (
              <div className="flex flex-1 items-center justify-center gap-2 text-[#64748b]">
                <Loader2 className="h-5 w-5 animate-spin text-sky-600" />
                Opening chat…
              </div>
            ) : null}

            {roomId && roomQuery.isError ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
                <p className="text-sm text-destructive">Could not open this chat.</p>
                <Button variant="outline" size="sm" onClick={closeRoom}>
                  Back
                </Button>
              </div>
            ) : null}

            {roomId && activeRoom && isRecord(activeRoom) && !roomQuery.isLoading && !roomQuery.isError ? (
              <>
                <header className="flex shrink-0 items-center gap-3 border-b border-[#e2e8f0] px-3 py-3 sm:px-5">
                  <Button type="button" variant="ghost" size="icon" className="shrink-0 md:hidden" onClick={closeRoom} aria-label="Back">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <UserAvatar
                    name={displayName(other)}
                    photoUrl={profilePhotoFrom(other)}
                    className="h-10 w-10 shadow-sm"
                    fallbackClassName="h-10 w-10 bg-gradient-to-br from-teal-200 to-sky-500 text-sm font-semibold text-white"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-[#0a1628]">{displayName(other)}</p>
                    <p className="text-xs text-[#64748b]">
                      {isLocked ? 'Read-only · visit completed' : 'Secure care messaging'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11 shrink-0 text-[#0a1628] hover:bg-sky-50 hover:text-sky-700 disabled:opacity-40"
                      aria-label="Voice call"
                      disabled={!canCall || agoraCall.callState !== 'idle'}
                      onClick={() => activeApptId && agoraCall.initiateCall('audio', activeApptId)}
                    >
                      <Phone className="h-9 w-9" strokeWidth={1.8} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11 shrink-0 text-[#0a1628] hover:bg-sky-50 hover:text-sky-700 disabled:opacity-40"
                      aria-label="Video call"
                      disabled={!canCall || agoraCall.callState !== 'idle'}
                      onClick={() => activeApptId && agoraCall.initiateCall('video', activeApptId)}
                    >
                      <Video className="h-9 w-9" strokeWidth={1.8} />
                    </Button>
                  </div>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto bg-[#f4f7fb] px-3 py-4 sm:px-5">
                  {messagesQuery.isLoading ? (
                    <div className="flex justify-center py-12 text-sm text-[#64748b]">
                      <Loader2 className="h-5 w-5 animate-spin text-sky-600" />
                    </div>
                  ) : null}
                  {messagesQuery.isError ? (
                    <p className="text-center text-sm text-destructive">Messages could not be loaded.</p>
                  ) : null}
                  <div className="mx-auto max-w-[720px] space-y-3">
                    {rows.map((row, i) => {
                      if (row.type === 'sep') {
                        return (
                          <div key={`sep-${row.label}-${i}`} className="flex justify-center py-2">
                            <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#64748b] shadow-sm ring-1 ring-[#e2e8f0]">
                              {row.label}
                            </span>
                          </div>
                        );
                      }
                      const m = row.m;
                      const mine = myId && senderId(m) === myId;
                      const t = m.createdAt ? format(new Date(String(m.createdAt)), 'h:mm a') : '';
                      const body = typeof m.content === 'string' ? m.content : '';
                      const msgType = typeof m.messageType === 'string' ? m.messageType : 'TEXT';
                      const attachments = Array.isArray(m.attachments) ? m.attachments : [];

                      return (
                        <div key={String(m._id ?? i)} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                          <div
                            className={cn(
                              'max-w-[85%] rounded-2xl shadow-sm',
                              mine
                                ? 'rounded-br-md bg-gradient-to-br from-sky-500 to-sky-700 text-white'
                                : 'rounded-bl-md border border-[#e8edf4] bg-white text-[#0a1628]',
                              msgType === 'IMAGE' ? 'overflow-hidden p-1' : 'px-4 py-2.5',
                            )}
                          >
                            {/* Image message */}
                            {msgType === 'IMAGE' && attachments.length > 0 ? (
                              <ImageBubble attachments={attachments} caption={body} mine={mine} />
                            ) : null}

                            {/* Voice message */}
                            {msgType === 'VOICE' && attachments.length > 0 ? (
                              <VoiceNoteBubble attachment={attachments[0]} mine={mine} />
                            ) : null}

                            {/* Text message */}
                            {msgType === 'TEXT' || (msgType !== 'IMAGE' && msgType !== 'VOICE') ? (
                              <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed">{body}</p>
                            ) : null}

                            <p
                              className={cn(
                                'mt-1 text-[10px] font-medium tabular-nums',
                                mine ? 'text-sky-100' : 'text-[#94a3b8]',
                                msgType === 'IMAGE' && 'px-2 pb-1',
                              )}
                            >
                              {t}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={bottomRef} />
                  </div>
                </div>

                <footer className="shrink-0 border-t border-[#e2e8f0] bg-white px-3 py-3 sm:px-5">
                  {isLocked ? (
                    <p className="text-center text-xs text-[#64748b]">This conversation is closed after your visit was completed.</p>
                  ) : (
                    <ChatComposer
                      roomId={roomId!}
                      disabled={sendMut.isPending}
                      onSendText={(text) => sendMut.mutate({ id: roomId!, text })}
                      onSent={async () => {
                        await qc.invalidateQueries({ queryKey: ['chat', 'messages', roomId] });
                        await qc.invalidateQueries({ queryKey: ['chat', 'rooms'] });
                        await qc.invalidateQueries({ queryKey: ['chat', 'room', roomId] });
                      }}
                    />
                  )}
                </footer>
              </>
            ) : null}
          </section>

          {/* Context panel — desktop */}
          <aside className="hidden w-[300px] shrink-0 flex-col border-l border-[#e2e8f0] bg-white xl:flex">
            <div className="border-b border-[#e2e8f0] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">Visit</p>
              <p className="mt-1 font-medium text-[#0a1628]">Details</p>
            </div>
            {roomId && appointment ? (
              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                <div className="flex flex-col items-center text-center">
                  <UserAvatar
                    name={displayName(other)}
                    photoUrl={profilePhotoFrom(other)}
                    className="h-20 w-20"
                    fallbackClassName="h-20 w-20 bg-gradient-to-br from-sky-100 to-teal-100 text-2xl font-semibold text-sky-800"
                  />
                  <p className="mt-3 font-semibold text-[#0a1628]">{displayName(other)}</p>
                  <p className="text-xs text-[#64748b]">Care team</p>
                </div>

                <dl className="mt-6 space-y-3 text-sm">
                  {appointment.scheduledStart ? (
                    <div className="flex gap-2 rounded-xl border border-[#e8edf4] bg-[#f8fafc] px-3 py-2.5">
                      <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                      <div>
                        <dt className="text-[11px] font-medium uppercase tracking-wide text-[#64748b]">Scheduled</dt>
                        <dd className="text-[#0a1628]">{format(new Date(String(appointment.scheduledStart)), 'EEE, MMM d · h:mm a')}</dd>
                      </div>
                    </div>
                  ) : null}
                  <div>
                    <dt className="text-[11px] font-medium uppercase tracking-wide text-[#64748b]">Status</dt>
                    <dd className="mt-0.5 capitalize text-[#0a1628]">{String(appointment.status ?? '—').toLowerCase().replace(/_/g, ' ')}</dd>
                  </div>
                  {typeof appointment.reasonForVisit === 'string' && appointment.reasonForVisit.trim() ? (
                    <div>
                      <dt className="text-[11px] font-medium uppercase tracking-wide text-[#64748b]">Reason</dt>
                      <dd className="mt-1 leading-relaxed text-[#334155]">{String(appointment.reasonForVisit)}</dd>
                    </div>
                  ) : null}
                </dl>

                {apptId ? (
                  <Button asChild variant="outline" className="mt-6 w-full rounded-xl border-[#e2e8f0]">
                    <Link to={appointmentDetailPath(apptId)}>Open appointment</Link>
                  </Button>
                ) : null}
              </div>
            ) : (
              <p className="px-4 py-8 text-center text-xs text-[#64748b]">Select a chat to see visit context.</p>
            )}
          </aside>
        </div>
      </div>
    </>
  );
}

/* ─── Image Bubble ─── */
function ImageBubble({ attachments, caption, mine }: { attachments: unknown[]; caption: string; mine: boolean }) {
  const [lightbox, setLightbox] = useState(false);
  const att = isRecord(attachments[0]) ? (attachments[0] as Record<string, unknown>) : null;
  const url = att && typeof att.url === 'string' ? att.url : '';
  if (!url) return null;

  return (
    <>
      <button type="button" onClick={() => setLightbox(true)} className="block">
        <img
          src={url}
          alt={caption || 'Image'}
          className="max-w-[280px] rounded-xl object-cover"
          loading="lazy"
        />
      </button>
      {caption ? (
        <p className={cn('mt-1 px-2 text-[13px] leading-relaxed', mine ? 'text-white' : 'text-[#0a1628]')}>
          {caption}
        </p>
      ) : null}
      {lightbox ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(false)}
          onKeyDown={(e) => e.key === 'Escape' && setLightbox(false)}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white/20 p-2 text-white hover:bg-white/30"
            onClick={() => setLightbox(false)}
          >
            <X className="h-5 w-5" />
          </button>
          <img src={url} alt={caption || 'Image'} className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain" />
        </div>
      ) : null}
    </>
  );
}

/* ─── Voice Note Bubble ─── */
function VoiceNoteBubble({ attachment, mine }: { attachment: unknown; mine: boolean }) {
  const att = isRecord(attachment) ? (attachment as Record<string, unknown>) : null;
  const url = att && typeof att.url === 'string' ? att.url : '';
  const duration = att && typeof att.duration === 'number' ? att.duration : 0;
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  function togglePlay() {
    if (!url) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(url);
      audioRef.current.addEventListener('timeupdate', () => {
        const a = audioRef.current;
        if (a && a.duration) {
          setProgress((a.currentTime / a.duration) * 100);
          setCurrentTime(Math.floor(a.currentTime));
        }
      });
      audioRef.current.addEventListener('ended', () => {
        setPlaying(false);
        setProgress(0);
        setCurrentTime(0);
      });
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  }

  const formatDur = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="flex items-center gap-3 min-w-[200px]">
      <button
        type="button"
        onClick={togglePlay}
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors',
          mine ? 'bg-white/20 hover:bg-white/30' : 'bg-sky-100 hover:bg-sky-200',
        )}
      >
        {playing ? (
          <Pause className={cn('h-4 w-4', mine ? 'text-white' : 'text-sky-700')} />
        ) : (
          <Play className={cn('h-4 w-4', mine ? 'text-white' : 'text-sky-700')} />
        )}
      </button>
      <div className="min-w-0 flex-1">
        <div className={cn('h-1.5 rounded-full overflow-hidden', mine ? 'bg-white/20' : 'bg-[#e2e8f0]')}>
          <div
            className={cn('h-full rounded-full transition-all', mine ? 'bg-white/80' : 'bg-sky-500')}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <span className={cn('shrink-0 text-[11px] font-medium tabular-nums', mine ? 'text-sky-100' : 'text-[#64748b]')}>
        {playing ? formatDur(currentTime) : formatDur(duration)}
      </span>
    </div>
  );
}

/* ─── Chat Composer with Image + Voice ─── */
function ChatComposer({
  roomId,
  disabled,
  onSendText,
  onSent,
}: {
  roomId: string;
  disabled: boolean;
  onSendText: (text: string) => void;
  onSent: () => Promise<void>;
}) {
  const [draft, setDraft] = useState('');
  const [imagePreview, setImagePreview] = useState<{ file: File; url: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const hasText = draft.trim().length > 0;
  const hasImage = imagePreview !== null;
  const showMic = !hasText && !hasImage;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Reset when room changes
  useEffect(() => {
    setDraft('');
    setImagePreview(null);
    setRecording(false);
    setRecordingTime(0);
  }, [roomId]);

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Only images are supported');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    const url = URL.createObjectURL(file);
    setImagePreview({ file, url });
    e.target.value = '';
  }

  function clearImage() {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview.url);
      setImagePreview(null);
    }
  }

  async function sendImageMessage() {
    if (!imagePreview || uploading) return;
    setUploading(true);
    try {
      const result = await uploadChatFile(roomId, imagePreview.file, imagePreview.file.name);
      await postChatMessage(roomId, draft.trim(), {
        messageType: 'IMAGE',
        attachments: [{
          url: result.url,
          type: 'image',
          fileName: result.fileName,
          size: result.size,
          mimeType: result.mimeType,
        }],
      });
      clearImage();
      setDraft('');
      await onSent();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to send image');
    } finally {
      setUploading(false);
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      // Prefer mp4 (plays on iOS) → webm (Chrome fallback) → ogg
      const mimeType = MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/webm')
            ? 'audio/webm'
            : 'audio/ogg';
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        const blobMime = mimeType.split(';')[0]; // strip codecs param
        const blob = new Blob(chunksRef.current, { type: blobMime });
        if (blob.size < 1000) {
          // Too short, discard
          setRecording(false);
          setRecordingTime(0);
          return;
        }

        // Get duration
        const duration = await getAudioDuration(blob);

        setUploading(true);
        setRecording(false);
        try {
          const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm';
          const result = await uploadChatFile(roomId, blob, `voice-note.${ext}`);
          await postChatMessage(roomId, '', {
            messageType: 'VOICE',
            attachments: [{
              url: result.url,
              type: 'voice',
              fileName: result.fileName,
              size: result.size,
              mimeType: result.mimeType,
              duration,
            }],
          });
          await onSent();
        } catch (e) {
          toast.error(e instanceof Error ? e.message : 'Failed to send voice note');
        } finally {
          setUploading(false);
          setRecordingTime(0);
        }
      };

      recorder.start();
      setRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((t) => {
          if (t >= 300) {
            // 5 min max
            mediaRecorderRef.current?.stop();
            return t;
          }
          return t + 1;
        });
      }, 1000);
    } catch {
      toast.error('Microphone permission denied');
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }

  function cancelRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    chunksRef.current = [];
    setRecording(false);
    setRecordingTime(0);
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (hasImage) {
      sendImageMessage();
      return;
    }
    const text = draft.trim();
    if (!text) return;
    onSendText(text);
    setDraft('');
  }

  // Recording UI
  if (recording) {
    return (
      <div className="mx-auto flex max-w-[720px] items-center gap-3 rounded-[14px] border border-rose-200 bg-rose-50 px-4 py-3">
        <span className="h-3 w-3 animate-pulse rounded-full bg-rose-500" />
        <span className="font-mono text-sm font-medium tabular-nums text-rose-800">{formatTime(recordingTime)}</span>
        <span className="flex-1 text-xs text-rose-600">Recording…</span>
        <button
          type="button"
          onClick={cancelRecording}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={stopRecording}
          className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-700"
        >
          <Send className="h-3 w-3" />
          Send
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[720px]">
      {/* Image preview */}
      {imagePreview ? (
        <div className="mb-2 flex items-start gap-2 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-2">
          <img src={imagePreview.url} alt="Preview" className="h-16 w-16 rounded-lg object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-[#0a1628]">{imagePreview.file.name}</p>
            <p className="text-[11px] text-[#94a3b8]">{(imagePreview.file.size / 1024).toFixed(0)} KB</p>
          </div>
          <button
            type="button"
            onClick={clearImage}
            className="shrink-0 rounded-md p-1 text-[#94a3b8] hover:bg-rose-50 hover:text-rose-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <form className="flex items-end gap-2" onSubmit={handleSubmit}>
        {/* Image attachment button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading || recording}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#64748b] transition-colors hover:bg-[#f1f5f9] hover:text-sky-700 disabled:opacity-40"
          title="Attach image"
        >
          <ImageIcon className="h-5 w-5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageSelect}
        />

        {/* Text input */}
        <div className="relative min-w-0 flex-1">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Message…"
            className="min-h-[44px] resize-none rounded-[14px] border-[#e2e8f0] bg-[#f8fafc] py-3 pr-4 text-[13px] shadow-inner"
            disabled={disabled || uploading}
            maxLength={10000}
          />
        </div>

        {/* Send or Mic button */}
        {showMic ? (
          <button
            type="button"
            onMouseDown={startRecording}
            disabled={disabled || uploading}
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors',
              'bg-gradient-to-br from-sky-500 to-sky-700 text-white shadow-md hover:from-sky-600 hover:to-sky-800',
              'disabled:opacity-40',
            )}
            title="Hold to record voice note"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
          </button>
        ) : (
          <Button
            type="submit"
            size="icon"
            disabled={disabled || uploading || (!hasText && !hasImage)}
            className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-sky-500 to-sky-700 text-white shadow-md hover:from-sky-600 hover:to-sky-800"
            aria-label="Send"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        )}
      </form>
    </div>
  );
}

/* ─── Utility ─── */
function getAudioDuration(blob: Blob): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.src = URL.createObjectURL(blob);
    audio.onloadedmetadata = () => {
      const dur = Math.round(audio.duration);
      URL.revokeObjectURL(audio.src);
      resolve(Number.isFinite(dur) ? dur : 0);
    };
    audio.onerror = () => resolve(0);
  });
}
