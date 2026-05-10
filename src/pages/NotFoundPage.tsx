import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/router/routes';

export default function NotFoundPage() {
  return (
    <>
      <Helmet>
        <title>Not found — MRD Online Clinic</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-muted-foreground">This page does not exist.</p>
        <Button asChild>
          <Link to={ROUTES.home}>Home</Link>
        </Button>
      </div>
    </>
  );
}
