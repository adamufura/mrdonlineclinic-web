import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, isToday, isYesterday } from 'date-fns';
import {
  ArrowLeft,
  Calendar,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  Search,
  Send,
  Stethoscope,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getChatRoom, listChatMessages, listChatRooms, markChatRoomReadAll as markRoomReadApi, postChatMessage } from '@/features/chat/api';
import { useChatSocket } from '@/features/chat/use-chat-socket';
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
  const [draft, setDraft] = useState('');
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
      setDraft('');
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
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-200 to-sky-500 font-display text-sm font-semibold text-white shadow-sm">
                          {displayName(o).charAt(0).toUpperCase()}
                        </div>
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
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-200 to-sky-500 font-display text-sm font-semibold text-white shadow-sm">
                    {displayName(other).charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-[#0a1628]">{displayName(other)}</p>
                    <p className="text-xs text-[#64748b]">
                      {isLocked ? 'Read-only · visit completed' : 'Secure care messaging'}
                    </p>
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="shrink-0 text-[#64748b]" aria-label="More">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
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
                      return (
                        <div key={String(m._id ?? i)} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                          <div
                            className={cn(
                              'max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed shadow-sm',
                              mine
                                ? 'rounded-br-md bg-gradient-to-br from-sky-500 to-sky-700 text-white'
                                : 'rounded-bl-md border border-[#e8edf4] bg-white text-[#0a1628]',
                            )}
                          >
                            <p className="whitespace-pre-wrap break-words">{body}</p>
                            <p
                              className={cn(
                                'mt-1 text-[10px] font-medium tabular-nums',
                                mine ? 'text-sky-100' : 'text-[#94a3b8]',
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
                    <form
                      className="mx-auto flex max-w-[720px] items-end gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const text = draft.trim();
                        if (!roomId || !text || sendMut.isPending) return;
                        sendMut.mutate({ id: roomId, text });
                      }}
                    >
                      <div className="relative min-w-0 flex-1">
                        <Input
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          placeholder="Message…"
                          className="min-h-[44px] resize-none rounded-[14px] border-[#e2e8f0] bg-[#f8fafc] py-3 pr-12 text-[13px] shadow-inner"
                          disabled={sendMut.isPending}
                          maxLength={10000}
                        />
                        <Button
                          type="submit"
                          size="icon"
                          disabled={!draft.trim() || sendMut.isPending}
                          className="absolute bottom-1.5 right-1.5 h-9 w-9 rounded-full bg-gradient-to-br from-sky-500 to-sky-700 text-white shadow-md hover:from-sky-600 hover:to-sky-800"
                          aria-label="Send"
                        >
                          {sendMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                      </div>
                    </form>
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
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-teal-100 font-display text-2xl font-semibold text-sky-800">
                    {displayName(other).charAt(0).toUpperCase()}
                  </div>
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
