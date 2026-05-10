import { Helmet } from 'react-helmet-async';

export default function PatientProfilePage() {
  return (
    <>
      <Helmet>
        <title>Profile — MRD Online Clinic</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <h1 className="text-2xl font-semibold">Profile</h1>
      <p className="mt-2 text-muted-foreground">Personal info and security tabs coming soon.</p>
    </>
  );
}
