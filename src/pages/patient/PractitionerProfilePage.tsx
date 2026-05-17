import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import { PractitionerProfileView } from '@/features/practitioners/practitioner-profile-view';
import { ROUTES } from '@/router/routes';

export default function PatientPractitionerProfilePage() {
  const { practitionerId = '' } = useParams();

  return (
    <>
      <Helmet>
        <title>Practitioner — MRD Clinic</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <PractitionerProfileView
        practitionerId={practitionerId}
        backTo={ROUTES.patient.findDoctor}
        backLabel="Back to find a doctor"
        portalMode
      />
    </>
  );
}
