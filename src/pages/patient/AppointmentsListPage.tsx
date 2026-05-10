import { Helmet } from 'react-helmet-async';

export default function PatientAppointmentsListPage() {
  return (
    <>
      <Helmet>
        <title>Appointments — MRD Online Clinic</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <h1 className="text-2xl font-semibold">Appointments</h1>
      <p className="mt-2 text-muted-foreground">List and filters coming soon.</p>
    </>
  );
}
