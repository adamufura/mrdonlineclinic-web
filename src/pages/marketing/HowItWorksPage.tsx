import { Helmet } from 'react-helmet-async';

export default function HowItWorksPage() {
  return (
    <>
      <Helmet>
        <title>How it works — MRD Online Clinic</title>
      </Helmet>
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-semibold">How it works</h1>
        <p className="mt-4 text-muted-foreground">Patient and practitioner flows will be illustrated here.</p>
      </div>
    </>
  );
}
