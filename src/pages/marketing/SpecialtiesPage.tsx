import { Helmet } from 'react-helmet-async';

export default function SpecialtiesPage() {
  return (
    <>
      <Helmet>
        <title>Specialties — MRD Online Clinic</title>
      </Helmet>
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-semibold">Specialties</h1>
        <p className="mt-4 text-muted-foreground">Grid from GET /api/v1/specialties will load here.</p>
      </div>
    </>
  );
}
