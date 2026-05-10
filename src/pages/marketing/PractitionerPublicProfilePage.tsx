import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';

export default function PractitionerPublicProfilePage() {
  const { practitionerId } = useParams();
  return (
    <>
      <Helmet>
        <title>Practitioner profile — MRD Online Clinic</title>
      </Helmet>
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-semibold">Practitioner</h1>
        <p className="mt-2 text-sm text-muted-foreground">ID: {practitionerId}</p>
        <p className="mt-4 text-muted-foreground">Public profile from GET /practitioners/:id will render here.</p>
      </div>
    </>
  );
}
