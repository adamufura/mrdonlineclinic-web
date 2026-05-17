import { Helmet } from 'react-helmet-async';
import { FindDoctorDirectory } from '@/features/find-doctor/find-doctor-directory';
import { ROUTES } from '@/router/routes';

const patientFindDoctorRoutes = {
  directory: ROUTES.patient.findDoctor,
  profile: ROUTES.patient.findDoctorProfile,
  book: ROUTES.patient.book,
} as const;

export default function PatientFindDoctorPage() {
  return (
    <>
      <Helmet>
        <title>Find a doctor — MRD Clinic</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <FindDoctorDirectory routes={patientFindDoctorRoutes} alwaysShowBook className="pb-4" />
    </>
  );
}
