import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, MapPin, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/router/routes';

export default function LandingPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (location) params.set('location', location);
    if (date) params.set('date', date);
    navigate(`${ROUTES.findDoctor}?${params.toString()}`);
  }

  return (
    <>
      <Helmet>
        <title>MRD Online Clinic — See a verified doctor online</title>
        <meta
          name="description"
          content="Book telemedicine visits, message your care team, and manage prescriptions with verified practitioners."
        />
      </Helmet>

      <section className="bg-[#f0f4ff] px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">Telemedicine</p>
            <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
              Consult <span className="text-primary">Best Doctors</span> At Your Convenience.
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted-foreground">
              Search trusted practitioners, book a slot that fits your schedule, and meet over secure video or chat.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full px-8">
                <Link to={ROUTES.findDoctor}>Start a Consult</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-8">
                <Link to={ROUTES.register}>Create an account</Link>
              </Button>
            </div>

            {/* Search bar */}
            <form
              onSubmit={handleSearch}
              className="mt-10 flex flex-col overflow-hidden rounded-2xl bg-white shadow-lg sm:flex-row sm:items-stretch"
            >
              {/* Doctor / specialty search */}
              <label className="flex flex-1 items-center gap-2 px-4 py-3 sm:border-r sm:border-border">
                <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search doctors, clinics, hospitals, etc"
                  className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </label>

              {/* Location */}
              <label className="flex flex-1 items-center gap-2 px-4 py-3 sm:border-r sm:border-border">
                <MapPin className="h-5 w-5 shrink-0 text-muted-foreground" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Location"
                  className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </label>

              {/* Date */}
              <label className="relative flex flex-1 items-center gap-2 px-4 py-3">
                <CalendarDays className="h-5 w-5 shrink-0 text-muted-foreground" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-transparent text-sm text-foreground focus:outline-none [color-scheme:light] [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  style={{ colorScheme: 'light' }}
                />
                {!date && (
                  <span className="pointer-events-none absolute left-11 text-sm text-muted-foreground">Date</span>
                )}
              </label>

              <button
                type="submit"
                className="m-2 shrink-0 rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                Search
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
