import { Helmet } from 'react-helmet-async';

export default function PatientMedicalInfoPage() {
  return (
    <>
      <Helmet>
        <title>Medical info — MRD Online Clinic</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <h1 className="text-2xl font-semibold">Medical information</h1>
      <p className="mt-2 text-muted-foreground">DOB, allergies, medications, emergency contact — forms next.</p>
    </>
  );
}
