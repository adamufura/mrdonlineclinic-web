import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/router/routes';

export default function LandingPage() {
  return (
    <>
      <Helmet>
        <title>MRD Online Clinic — See a verified doctor online</title>
        <meta
          name="description"
          content="Book telemedicine visits, message your care team, and manage prescriptions with verified practitioners."
        />
      </Helmet>
      <section className="mx-auto max-w-6xl px-4 py-20 text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-primary">Telemedicine</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          See a verified doctor online — book, chat, get prescriptions
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          Search trusted practitioners, book a slot that fits your schedule, and meet over secure chat. This MVP is wired
          to the live API for authentication; directory, booking, and clinical flows roll out next.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link to={ROUTES.findDoctor}>Find a doctor</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to={ROUTES.register}>Create an account</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
