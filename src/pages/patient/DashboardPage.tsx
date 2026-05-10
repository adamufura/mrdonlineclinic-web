import { Helmet } from 'react-helmet-async';

export default function PatientDashboardPage() {
  return (
    <>
      <Helmet>
        <title>Patient dashboard — MRD Online Clinic</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">Upcoming appointment cards and stats will load here.</p>
    </>
  );
}
