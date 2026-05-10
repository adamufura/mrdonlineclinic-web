import { Helmet } from 'react-helmet-async';

export default function PatientPrescriptionsPage() {
  return (
    <>
      <Helmet>
        <title>Prescriptions — MRD Online Clinic</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <h1 className="text-2xl font-semibold">Prescriptions</h1>
      <p className="mt-2 text-muted-foreground">List + react-pdf preview in a follow-up slice.</p>
    </>
  );
}
