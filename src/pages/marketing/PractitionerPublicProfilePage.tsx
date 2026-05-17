import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import { PractitionerProfileView } from '@/features/practitioners/practitioner-profile-view';
import { ROUTES } from '@/router/routes';

export default function PractitionerPublicProfilePage() {
  const { practitionerId = '' } = useParams();

  return (
    <>
      <Helmet>
        <title>Practitioner — MRD Online Clinic</title>
      </Helmet>
      <div className="mx-auto w-full max-w-site px-4 py-8 text-brand-navy sm:px-6 sm:py-10 lg:px-8">
        <PractitionerProfileView practitionerId={practitionerId} backTo={ROUTES.findDoctor} />
      </div>
    </>
  );
}
