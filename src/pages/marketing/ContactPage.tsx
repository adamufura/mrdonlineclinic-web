import { Helmet } from 'react-helmet-async';

export default function ContactPage() {
  return (
    <>
      <Helmet>
        <title>Contact — MRD Online Clinic</title>
      </Helmet>
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-semibold">Contact</h1>
        <p className="mt-4 text-muted-foreground">Contact form and clinic details will go here.</p>
      </div>
    </>
  );
}
