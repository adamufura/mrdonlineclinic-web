import { Helmet } from 'react-helmet-async';

export default function HowItWorksPage() {
  return (
    <>
      <Helmet>
        <title>How it works — MRD Online Clinic</title>
      </Helmet>
      <div className="mx-auto w-full max-w-site px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-semibold">How it works</h1>
          <p className="mt-4 text-muted-foreground">Patient and practitioner flows will be illustrated here.</p>
        </div>
      </div>
    </>
  );
}
