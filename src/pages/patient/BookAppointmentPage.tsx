import { useQuery } from '@tanstack/react-query';
import { addDays, startOfDay } from 'date-fns';
import { Helmet } from 'react-helmet-async';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PractitionerBookingWidget } from '@/features/booking/practitioner-booking-widget';
import { getPractitionerPublicProfile, getPractitionerPublicSlots } from '@/features/practitioners/public-api';
import { ROUTES } from '@/router/routes';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

export default function PatientBookAppointmentPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { practitionerId } = useParams();
  const [searchParams] = useSearchParams();
  const initialSlotId = searchParams.get('slotId');

  const id = practitionerId && /^[a-fA-F0-9]{24}$/.test(practitionerId) ? practitionerId : '';

  const profile = useQuery({
    queryKey: ['practitioners', 'public', id],
    queryFn: () => getPractitionerPublicProfile(id),
    enabled: Boolean(id),
  });

  const from = useMemo(() => startOfDay(new Date()), []);
  const to = addDays(from, 90);
  const slots = useQuery({
    queryKey: ['practitioners', 'public', id, 'slots', from.toISOString(), to.toISOString()],
    queryFn: () => getPractitionerPublicSlots(id, from, to),
    enabled: Boolean(id) && profile.isSuccess,
  });

  const pr = profile.data?.practitioner;
  const name = isRecord(pr)
    ? `${String(pr.firstName ?? '')} ${String(pr.lastName ?? '')}`.trim()
    : '';

  return (
    <>
      <Helmet>
        <title>{name ? t('patient.booking.titleWith', { name }) : t('patient.booking.title')}</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="space-y-6">
        <div>
          {id ? (
            <Link to={ROUTES.patient.findDoctorProfile(id)} className="text-sm font-medium text-teal-800 hover:underline">
              {t('patient.booking.backToProfile')}
            </Link>
          ) : null}
          <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-[#0a1628]">{t('patient.booking.heading')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('patient.booking.description')}</p>
        </div>

        {!id ? <p className="text-sm text-destructive">{t('patient.booking.invalidPractitioner')}</p> : null}

        {profile.isLoading ? <div className="h-64 animate-pulse rounded-2xl bg-muted" /> : null}
        {profile.isError ? (
          <p className="text-sm text-destructive">{t('patient.booking.couldNotLoadPractitioner')}</p>
        ) : null}

        {isRecord(pr) ? (
          <PractitionerBookingWidget
            practitionerId={id}
            practitioner={pr}
            slots={Array.isArray(slots.data) ? slots.data : []}
            slotsLoading={slots.isLoading}
            slotsError={slots.isError}
            allowSubmit
            initialSlotId={initialSlotId}
            loginPath={ROUTES.login}
            onBooked={(appointmentId) => void navigate(ROUTES.patient.appointment(appointmentId))}
          />
        ) : null}
      </div>
    </>
  );
}
