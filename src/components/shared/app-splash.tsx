import { Loader2 } from 'lucide-react';

export function AppSplash() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background text-muted-foreground">
      <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
      <p className="text-sm">Loading…</p>
    </div>
  );
}
