import { Helmet } from 'react-helmet-async';
import { FindDoctorDirectory } from '@/features/find-doctor/find-doctor-directory';
import { ROUTES } from '@/router/routes';

const publicFindDoctorRoutes = {
  directory: ROUTES.findDoctor,
  profile: ROUTES.findDoctorProfile,
  book: ROUTES.patient.book,
} as const;

export default function FindADoctorPage() {
  return (
    <>
      <Helmet>
        <title>Find a doctor — MRD Online Clinic</title>
      </Helmet>
      <div className="mx-auto w-full max-w-site px-4 py-10 text-brand-navy sm:px-6 lg:px-8">
        <FindDoctorDirectory routes={publicFindDoctorRoutes} className="pb-4" />
      </div>
    </>
  );
}
