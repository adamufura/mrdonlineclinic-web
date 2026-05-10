import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';

export default function PractitionerAppointmentDetailPage() {
  const { id } = useParams();
  return (
    <>
      <Helmet>
        <title>Appointment — MRD Online Clinic</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <h1 className="text-2xl font-semibold">Appointment</h1>
      <p className="mt-2 text-sm text-muted-foreground">ID: {id}</p>
    </>
  );
}
