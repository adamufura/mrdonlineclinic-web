import { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Mic, MicOff, Phone, PhoneOff, Video } from 'lucide-react';
import type { IAgoraRTCRemoteUser, ICameraVideoTrack } from 'agora-rtc-sdk-ng';
import { cn } from '@/lib/utils/cn';
import { startRingtone, stopRingtone } from './ringtone';
import { RING_TIMEOUT_MS, type IncomingCallData } from './use-agora-call';

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/* ─── Outgoing Call ─── */
export function OutgoingCallOverlay({
  calleeName,
  callType,
  onEnd,
}: {
  calleeName: string;
  callType: 'audio' | 'video';
  onEnd: () => void;
}) {
  const [ringSeconds, setRingSeconds] = useState(0);

  useEffect(() => {
    startRingtone();
    const started = Date.now();
    const tick = setInterval(() => {
      setRingSeconds(Math.min(RING_TIMEOUT_MS / 1000, Math.floor((Date.now() - started) / 1000)));
    }, 500);
    return () => {
      clearInterval(tick);
      stopRingtone();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-gradient-to-b from-[#0a1628] to-[#0d3a6e] text-white">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-sky-400/30" />
          <div className="relative h-24 w-24 rounded-full bg-gradient-to-br from-sky-400 to-teal-400 grid place-items-center text-3xl font-bold text-[#04132a]">
            {calleeName.charAt(0).toUpperCase()}
          </div>
        </div>
        <div className="text-center">
          <p className="text-2xl font-medium">{calleeName}</p>
          <p className="mt-2 flex items-center justify-center gap-2 text-sm text-white/60">
            {callType === 'video' ? <Video className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
            <span>Ringing</span>
            <span className="animate-pulse">•••</span>
          </p>
          <p className="mt-1 text-xs tabular-nums text-white/40">
            {ringSeconds}s / {RING_TIMEOUT_MS / 1000}s
          </p>
        </div>
      </div>
      <div className="mt-16">
        <button
          type="button"
          onClick={onEnd}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition hover:bg-red-600"
        >
          <PhoneOff className="h-7 w-7" />
        </button>
      </div>
    </div>
  );
}

/* ─── Incoming Call ─── */
export function IncomingCallOverlay({
  data,
  onAccept,
  onReject,
}: {
  data: IncomingCallData;
  onAccept: () => void;
  onReject: () => void;
}) {
  useEffect(() => {
    startRingtone();
    return () => stopRingtone();
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-gradient-to-b from-[#0a1628] to-[#0d3a6e] text-white">
      <div className="flex flex-col items-center gap-6">
        <div className="h-24 w-24 animate-pulse rounded-full bg-gradient-to-br from-teal-400 to-sky-400 grid place-items-center text-3xl font-bold text-[#04132a]">
          {data.callerName.charAt(0).toUpperCase()}
        </div>
        <div className="text-center">
          <p className="text-2xl font-medium">{data.callerName}</p>
          <p className="mt-2 flex items-center gap-2 text-sm text-white/60">
            {data.callType === 'video' ? <Video className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
            Incoming {data.callType} call…
          </p>
        </div>
      </div>
      <div className="mt-16 flex items-center gap-8">
        <button
          type="button"
          onClick={onReject}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition hover:bg-red-600"
        >
          <PhoneOff className="h-7 w-7" />
        </button>
        <button
          type="button"
          onClick={onAccept}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition hover:bg-green-600"
        >
          <Phone className="h-7 w-7" />
        </button>
      </div>
    </div>
  );
}

/* ─── Active Call ─── */
export function ActiveCallOverlay({
  callType,
  otherName,
  duration,
  isMuted,
  isCameraOff,
  localVideoTrack,
  remoteUsers,
  waitingLabel = 'Waiting for other party…',
  onToggleMute,
  onToggleCamera,
  onEnd,
}: {
  callType: 'audio' | 'video';
  otherName: string;
  duration: number;
  isMuted: boolean;
  isCameraOff: boolean;
  localVideoTrack: ICameraVideoTrack | null;
  remoteUsers: IAgoraRTCRemoteUser[];
  waitingLabel?: string;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onEnd: () => void;
}) {
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);

  // Play local video (tracks are closed in useAgoraCall.cleanup — do not stop here)
  useEffect(() => {
    if (!localVideoTrack || callType !== 'video' || isCameraOff) return;
    const el = localVideoRef.current;
    if (!el) return;
    try {
      localVideoTrack.play(el);
    } catch (e) {
      console.warn('[Agora] local play failed', e);
    }
  }, [localVideoTrack, isCameraOff, callType]);

  // Play remote video
  useEffect(() => {
    const remoteUser = remoteUsers[0];
    if (remoteUser?.videoTrack && remoteVideoRef.current && callType === 'video') {
      remoteUser.videoTrack.play(remoteVideoRef.current);
    }
  }, [remoteUsers, callType]);

  if (callType === 'video') {
    return (
      <div className="fixed inset-0 z-[200] flex flex-col bg-black">
        {/* Remote video (full screen) */}
        <div ref={remoteVideoRef} className="flex-1 bg-[#0a1628]">
          {remoteUsers.length === 0 ? (
            <div className="flex h-full items-center justify-center text-white/50">
              {waitingLabel}
            </div>
          ) : null}
        </div>

        {/* Local video (PIP) */}
        <div
          ref={localVideoRef}
          className={cn(
            'absolute right-4 top-4 h-36 w-28 rounded-xl overflow-hidden border-2 border-white/20 shadow-xl bg-[#1a1a2e]',
            isCameraOff && 'flex items-center justify-center',
          )}
        >
          {isCameraOff ? <CameraOff className="h-6 w-6 text-white/40" /> : null}
        </div>

        {/* Duration */}
        <div className="absolute left-1/2 top-6 -translate-x-1/2 rounded-full bg-black/50 px-4 py-1.5 text-sm font-medium tabular-nums text-white backdrop-blur">
          {formatDuration(duration)}
        </div>

        {/* Controls */}
        <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-4">
          <ControlButton active={isMuted} onClick={onToggleMute} icon={isMuted ? MicOff : Mic} label={isMuted ? 'Unmute' : 'Mute'} />
          <ControlButton active={isCameraOff} onClick={onToggleCamera} icon={isCameraOff ? CameraOff : Camera} label={isCameraOff ? 'Camera on' : 'Camera off'} />
          <button
            type="button"
            onClick={onEnd}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition hover:bg-red-600"
          >
            <PhoneOff className="h-6 w-6" />
          </button>
        </div>
      </div>
    );
  }

  // Audio call
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-gradient-to-b from-[#0a1628] to-[#0d3a6e] text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="h-28 w-28 rounded-full bg-gradient-to-br from-sky-400 to-teal-400 grid place-items-center text-4xl font-bold text-[#04132a]">
          {otherName.charAt(0).toUpperCase()}
        </div>
        <p className="text-2xl font-medium">{otherName}</p>
        <p className="font-mono text-lg tabular-nums text-white/70">{formatDuration(duration)}</p>
      </div>
      <div className="mt-16 flex items-center gap-6">
        <ControlButton active={isMuted} onClick={onToggleMute} icon={isMuted ? MicOff : Mic} label={isMuted ? 'Unmute' : 'Mute'} />
        <button
          type="button"
          onClick={onEnd}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition hover:bg-red-600"
        >
          <PhoneOff className="h-7 w-7" />
        </button>
      </div>
    </div>
  );
}

function ControlButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Mic;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={cn(
        'flex h-12 w-12 items-center justify-center rounded-full transition',
        active ? 'bg-white/30 text-white' : 'bg-white/10 text-white/80 hover:bg-white/20',
      )}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
