import { Helmet } from 'react-helmet-async';

export default function PractitionerDashboardPage() {
  return (
    <>
      <Helmet>
        <title>Practitioner dashboard — MRD Online Clinic</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">Today&apos;s stats and charts (Recharts) will land here.</p>
    </>
  );
}
