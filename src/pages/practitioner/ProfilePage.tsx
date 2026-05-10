import { Helmet } from 'react-helmet-async';

export default function PractitionerProfilePage() {
  return (
    <>
      <Helmet>
        <title>Profile — MRD Online Clinic</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <h1 className="text-2xl font-semibold">Professional profile</h1>
      <p className="mt-2 text-muted-foreground">Bio, specialties, languages, qualifications.</p>
    </>
  );
}
