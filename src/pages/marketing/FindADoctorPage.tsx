import { Helmet } from 'react-helmet-async';

export default function FindADoctorPage() {
  return (
    <>
      <Helmet>
        <title>Find a doctor — MRD Online Clinic</title>
      </Helmet>
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-semibold">Find a doctor</h1>
        <p className="mt-4 text-muted-foreground">Directory with filters and GET /practitioners will ship in the next slice.</p>
      </div>
    </>
  );
}
