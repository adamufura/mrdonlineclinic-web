import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function RouteError() {
  const err = useRouteError();
  const title = isRouteErrorResponse(err) ? err.statusText || 'Error' : 'Something went wrong';
  const detail = isRouteErrorResponse(err) ? err.data : err instanceof Error ? err.message : null;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">{title}</h1>
      {detail ? <p className="max-w-md text-sm text-muted-foreground">{String(detail)}</p> : null}
      <Button asChild variant="secondary">
        <Link to="/">Back home</Link>
      </Button>
    </div>
  );
}
