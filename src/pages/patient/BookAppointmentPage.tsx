import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';

export default function PatientBookAppointmentPage() {
  const { practitionerId } = useParams();
  return (
    <>
      <Helmet>
        <title>Book appointment — MRD Online Clinic</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <h1 className="text-2xl font-semibold">Book appointment</h1>
      <p className="mt-2 text-sm text-muted-foreground">Practitioner: {practitionerId}</p>
    </>
  );
}
