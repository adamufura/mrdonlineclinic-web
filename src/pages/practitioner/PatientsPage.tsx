import { Helmet } from 'react-helmet-async';

export default function PractitionerPatientsPage() {
  return (
    <>
      <Helmet>
        <title>Patients — MRD Online Clinic</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <h1 className="text-2xl font-semibold">Patients</h1>
      <p className="mt-2 text-muted-foreground">Deduped patient directory after visits.</p>
    </>
  );
}
