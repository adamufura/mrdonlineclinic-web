import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RouteError } from '@/components/shared/route-error';
import { AuthLayout } from '@/layouts/AuthLayout';
import { MarketingLayout } from '@/layouts/MarketingLayout';
import { PatientLayout } from '@/layouts/PatientLayout';
import { PractitionerLayout } from '@/layouts/PractitionerLayout';
import { RootLayout } from '@/layouts/RootLayout';
import { RequireAuth, RequireGuest, RequireRole } from '@/router/guards';
import NotFoundPage from '@/pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <RouteError />,
    children: [
      {
        element: <MarketingLayout />,
        children: [
          {
            index: true,
            lazy: async () => ({ Component: (await import('@/pages/marketing/LandingPage')).default }),
          },
          {
            path: 'about',
            lazy: async () => ({ Component: (await import('@/pages/marketing/AboutPage')).default }),
          },
          {
            path: 'how-it-works',
            lazy: async () => ({ Component: (await import('@/pages/marketing/HowItWorksPage')).default }),
          },
          {
            path: 'specialties',
            lazy: async () => ({ Component: (await import('@/pages/marketing/SpecialtiesPage')).default }),
          },
          {
            path: 'find-a-doctor',
            lazy: async () => ({ Component: (await import('@/pages/marketing/FindADoctorPage')).default }),
          },
          {
            path: 'find-a-doctor/:practitionerId',
            lazy: async () => ({
              Component: (await import('@/pages/marketing/PractitionerPublicProfilePage')).default,
            }),
          },
          {
            path: 'faq',
            lazy: async () => ({ Component: (await import('@/pages/marketing/FaqPage')).default }),
          },
          {
            path: 'contact',
            lazy: async () => ({ Component: (await import('@/pages/marketing/ContactPage')).default }),
          },
        ],
      },
      {
        path: 'login',
        element: <RequireGuest />,
        children: [
          {
            element: <AuthLayout />,
            children: [
              {
                index: true,
                lazy: async () => ({ Component: (await import('@/pages/auth/LoginPage')).default }),
              },
            ],
          },
        ],
      },
      {
        path: 'register',
        element: <RequireGuest />,
        children: [
          {
            element: <AuthLayout />,
            children: [
              {
                index: true,
                lazy: async () => ({ Component: (await import('@/pages/auth/RegisterChooserPage')).default }),
              },
              {
                path: 'patient',
                lazy: async () => ({ Component: (await import('@/pages/auth/PatientRegisterPage')).default }),
              },
              {
                path: 'practitioner',
                lazy: async () => ({ Component: (await import('@/pages/auth/PractitionerRegisterPage')).default }),
              },
            ],
          },
        ],
      },
      {
        path: 'verify-email',
        element: <AuthLayout />,
        children: [
          {
            index: true,
            lazy: async () => ({ Component: (await import('@/pages/auth/VerifyEmailPage')).default }),
          },
        ],
      },
      {
        path: 'forgot-password',
        element: <RequireGuest />,
        children: [
          {
            element: <AuthLayout />,
            children: [
              {
                index: true,
                lazy: async () => ({ Component: (await import('@/pages/auth/ForgotPasswordPage')).default }),
              },
            ],
          },
        ],
      },
      {
        path: 'reset-password',
        element: <RequireGuest />,
        children: [
          {
            element: <AuthLayout />,
            children: [
              {
                index: true,
                lazy: async () => ({ Component: (await import('@/pages/auth/ResetPasswordPage')).default }),
              },
            ],
          },
        ],
      },
      {
        path: 'patient',
        element: (
          <RequireAuth>
            <RequireRole role="PATIENT">
              <PatientLayout />
            </RequireRole>
          </RequireAuth>
        ),
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          {
            path: 'dashboard',
            lazy: async () => ({ Component: (await import('@/pages/patient/DashboardPage')).default }),
          },
          {
            path: 'appointments',
            lazy: async () => ({ Component: (await import('@/pages/patient/AppointmentsListPage')).default }),
          },
          {
            path: 'appointments/:id',
            lazy: async () => ({ Component: (await import('@/pages/patient/AppointmentDetailPage')).default }),
          },
          {
            path: 'appointments/book/:practitionerId',
            lazy: async () => ({ Component: (await import('@/pages/patient/BookAppointmentPage')).default }),
          },
          {
            path: 'messages',
            lazy: async () => ({ Component: (await import('@/pages/patient/MessagesPage')).default }),
          },
          {
            path: 'prescriptions',
            lazy: async () => ({ Component: (await import('@/pages/patient/PrescriptionsPage')).default }),
          },
          {
            path: 'profile',
            lazy: async () => ({ Component: (await import('@/pages/patient/ProfilePage')).default }),
          },
          {
            path: 'profile/medical',
            lazy: async () => ({ Component: (await import('@/pages/patient/MedicalInfoPage')).default }),
          },
        ],
      },
      {
        path: 'practitioner',
        element: (
          <RequireAuth>
            <RequireRole role="PRACTITIONER">
              <PractitionerLayout />
            </RequireRole>
          </RequireAuth>
        ),
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          {
            path: 'dashboard',
            lazy: async () => ({ Component: (await import('@/pages/practitioner/DashboardPage')).default }),
          },
          {
            path: 'schedule',
            lazy: async () => ({ Component: (await import('@/pages/practitioner/SchedulePage')).default }),
          },
          {
            path: 'appointments',
            lazy: async () => ({ Component: (await import('@/pages/practitioner/AppointmentsListPage')).default }),
          },
          {
            path: 'appointments/:id',
            lazy: async () => ({
              Component: (await import('@/pages/practitioner/AppointmentDetailPage')).default,
            }),
          },
          {
            path: 'availability',
            lazy: async () => ({ Component: (await import('@/pages/practitioner/AvailabilityPage')).default }),
          },
          {
            path: 'patients',
            lazy: async () => ({ Component: (await import('@/pages/practitioner/PatientsPage')).default }),
          },
          {
            path: 'messages',
            lazy: async () => ({ Component: (await import('@/pages/practitioner/MessagesPage')).default }),
          },
          {
            path: 'prescriptions',
            lazy: async () => ({ Component: (await import('@/pages/practitioner/PrescriptionsPage')).default }),
          },
          {
            path: 'profile',
            lazy: async () => ({ Component: (await import('@/pages/practitioner/ProfilePage')).default }),
          },
          {
            path: 'profile/credentials',
            lazy: async () => ({ Component: (await import('@/pages/practitioner/CredentialsPage')).default }),
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
