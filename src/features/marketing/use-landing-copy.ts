import {
  Bone,
  Brain,
  Building2,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  Droplets,
  Ear,
  Eye,
  FlaskConical,
  Heart,
  Pill,
  Search,
  Shield,
  Smile,
  Smartphone,
  Store,
  User,
} from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@/router/routes';

const HOW_IT_WORKS_ICONS = {
  search: Search,
  profile: ClipboardList,
  book: CalendarCheck,
  pharmacy: Pill,
} as const;

const SERVICE_ICONS = {
  bookAppointment: CalendarDays,
  labTesting: FlaskConical,
  medicines: Store,
  hospitals: Building2,
  healthCare: Shield,
  talkToDoctor: Smartphone,
} as const;

const SPECIALTY_ICONS = {
  cardiology: Heart,
  neurology: Brain,
  urology: Droplets,
  orthopedic: Bone,
  dentist: Smile,
  ophthalmology: Eye,
  pediatrics: User,
  ent: Ear,
} as const;

export function useLandingCopy() {
  const { t } = useTranslation();

  return useMemo(() => {
    const howItWorksStepKeys = ['search', 'profile', 'book', 'pharmacy'] as const;
    const howItWorksSteps = howItWorksStepKeys.map((key) => ({
      key,
      title: t(`landing.howItWorks.steps.${key}.title`),
      description: t(`landing.howItWorks.steps.${key}.description`),
      Icon: HOW_IT_WORKS_ICONS[key],
    }));

    const serviceKeys = [
      'bookAppointment',
      'labTesting',
      'medicines',
      'hospitals',
      'healthCare',
      'talkToDoctor',
    ] as const;
    const serviceHrefs: Record<(typeof serviceKeys)[number], string> = {
      bookAppointment: ROUTES.findDoctor,
      labTesting: ROUTES.contact,
      medicines: `${ROUTES.home}#pharmacy`,
      hospitals: ROUTES.findDoctor,
      healthCare: `${ROUTES.home}#patients`,
      talkToDoctor: ROUTES.findDoctor,
    };
    const serviceTones: Record<(typeof serviceKeys)[number], string> = {
      bookAppointment: 'bg-violet-100 text-violet-600',
      labTesting: 'bg-emerald-100 text-emerald-600',
      medicines: 'bg-cyan-100 text-cyan-600',
      hospitals: 'bg-rose-100 text-rose-600',
      healthCare: 'bg-green-100 text-green-600',
      talkToDoctor: 'bg-pink-100 text-pink-600',
    };
    const serviceShortcuts = serviceKeys.map((key) => ({
      label: t(`landing.services.${key}`),
      href: serviceHrefs[key],
      Icon: SERVICE_ICONS[key],
      tone: serviceTones[key],
    }));

    const specialtyKeys = [
      'cardiology',
      'neurology',
      'urology',
      'orthopedic',
      'dentist',
      'ophthalmology',
      'pediatrics',
      'ent',
    ] as const;
    const specialityShowcase = specialtyKeys.map((key) => ({
      name: t(`landing.specialities.${key}`),
      searchName: key === 'cardiology' ? 'Cardiology' : t(`landing.specialities.${key}`),
      Icon: SPECIALTY_ICONS[key],
      highlight: key === 'dentist',
    }));

    const faq = [1, 2, 3, 4, 5].map((n) => ({
      q: t(`landing.faq.q${n}`),
      a: t(`landing.faq.a${n}`),
    }));

    const testimonials = (['t1', 't2', 't3'] as const).map((key) => ({
      name: t(`landing.testimonials.${key}.name`),
      location: t(`landing.testimonials.${key}.location`),
      rating: 5,
      quote: t(`landing.testimonials.${key}.quote`),
    }));

    const stats = [
      { value: '12K+', label: t('landing.stats.doctors') },
      { value: '1M+', label: t('landing.stats.patients') },
      { value: '250+', label: t('landing.stats.clinics') },
      { value: '4.8★', label: t('landing.stats.rating') },
    ];

    return {
      howItWorksSteps,
      serviceShortcuts,
      specialityShowcase,
      faq,
      testimonials,
      stats,
    };
  }, [t]);
}
