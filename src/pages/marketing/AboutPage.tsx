import { Helmet } from 'react-helmet-async';

export default function AboutPage() {
  return (
    <>
      <Helmet>
        <title>About — MRD Online Clinic</title>
      </Helmet>
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-semibold">About</h1>
        <p className="mt-4 text-muted-foreground">Marketing copy will go here.</p>
      </div>
    </>
  );
}
