import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { PractitionerProfileView } from '@/features/practitioners/practitioner-profile-view';
import { ROUTES } from '@/router/routes';

export default function PatientPractitionerProfilePage() {
  const { t } = useTranslation();
  const { practitionerId = '' } = useParams();

  return (
    <>
      <Helmet>
        <title>{t('patient.practitionerProfile.title')}</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <PractitionerProfileView
        practitionerId={practitionerId}
        backTo={ROUTES.patient.findDoctor}
        portalMode
      />
    </>
  );
}
