import { Helmet } from 'react-helmet-async';

export default function FaqPage() {
  return (
    <>
      <Helmet>
        <title>FAQ — MRD Online Clinic</title>
      </Helmet>
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-semibold">FAQ</h1>
        <p className="mt-4 text-muted-foreground">Questions and answers will be added here.</p>
      </div>
    </>
  );
}
