import { Helmet } from 'react-helmet-async';

export default function PractitionerAvailabilityPage() {
  return (
    <>
      <Helmet>
        <title>Availability — MRD Online Clinic</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <h1 className="text-2xl font-semibold">Availability</h1>
      <p className="mt-2 text-muted-foreground">One-off slots, recurring rules, and block dates next.</p>
    </>
  );
}
