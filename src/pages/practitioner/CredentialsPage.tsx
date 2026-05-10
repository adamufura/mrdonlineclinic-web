import { Helmet } from 'react-helmet-async';

export default function PractitionerCredentialsPage() {
  return (
    <>
      <Helmet>
        <title>Credentials — MRD Online Clinic</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <h1 className="text-2xl font-semibold">Credentials</h1>
      <p className="mt-2 text-muted-foreground">License upload + ImageKit integration next.</p>
    </>
  );
}
