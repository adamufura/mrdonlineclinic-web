import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { FindDoctorDirectory } from '@/features/find-doctor/find-doctor-directory';
import { ROUTES } from '@/router/routes';

const patientFindDoctorRoutes = {
  directory: ROUTES.patient.findDoctor,
  profile: ROUTES.patient.findDoctorProfile,
  book: ROUTES.patient.book,
} as const;

export default function PatientFindDoctorPage() {
  const { t } = useTranslation();
  return (
    <>
      <Helmet>
        <title>{t('patient.findDoctor.title')}</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <FindDoctorDirectory routes={patientFindDoctorRoutes} alwaysShowBook className="pb-4" />
    </>
  );
}
