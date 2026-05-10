import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  CalendarCheck,
  Check,
  CircleCheck,
  ClipboardList,
  Home,
  Pill,
  Plus,
  Search,
  Star,
  User,
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { HeroSearchBar } from '@/components/marketing/HeroSearchBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { listPractitionersDirectory, type PractitionerDirectoryItem } from '@/features/practitioners/public-api';
import { listPublicSpecialties, type SpecialtyDto } from '@/features/specialties/api';
import { cn } from '@/lib/utils/cn';
import { ROUTES } from '@/router/routes';

const DOCTOR_IMG =
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=640&q=86';
/** How it works — verified Unsplash asset (telehealth-friendly clinical portrait) */
const HOW_IT_WORKS_IMG =
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=900&q=85';

const HOW_IT_WORKS_STEPS = [
  {
    title: 'Search a Doctor',
    description:
      'Find verified practitioners by specialty, location, or availability and narrow down who fits your needs.',
    Icon: Search,
  },
  {
    title: 'Check Doctor Profile',
    description:
      'Explore detailed profiles, languages, and patient feedback so you can book knowing exactly who you will see.',
    Icon: ClipboardList,
  },
  {
    title: 'Book & Consult Online',
    description:
      'Reserve a slot that works for you, then meet your clinician via secure messaging or video—no crowded waiting rooms.',
    Icon: CalendarCheck,
  },
  {
    title: 'Pharmacy',
    description:
      'When prescribing is appropriate, your clinician routes medications to trusted partner pharmacies you can use for pickup or delivery.',
    Icon: Pill,
  },
] as const;

function formatNgn(amount: number): string {
  return new Intl.NumberFormat('en-NG', { maximumFractionDigits: 0 }).format(amount);
}

const PRICING_PLANS = [
  {
    key: 'basic',
    name: 'Basic',
    priceMonthly: 9_900,
    Icon: User,
    features: ['Profile Creation', 'Appointment Booking', 'Notification Alerts', 'Limited Telemedicine Access'],
    highlighted: false,
  },
  {
    key: 'premium',
    name: 'Premium',
    priceMonthly: 25_000,
    badge: 'Popular',
    Icon: Home,
    features: [
      'Profile Creation',
      'Appointment Booking',
      'Notification Alerts',
      'Extended Telemedicine Access',
      'Exclusive Discounts',
      'Appointment History',
      'Priority Customer Support',
    ],
    highlighted: true,
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    priceMonthly: 99_000,
    Icon: Building2,
    features: [
      'All Basic plan features',
      'All Premium plan features',
      'Personalized Health Insights',
      'Family Account Management',
    ],
    highlighted: false,
  },
] as const;

const AVATAR_JD = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=128&q=80';
const AV_ROUND = [
  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=96&q=72',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=96&q=72',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=96&q=72',
];

const TESTIMONIALS = [
  {
    name: 'Amara Osei',
    location: 'Lagos, Nigeria',
    rating: 5,
    quote:
      'MRD Online Clinic made it so easy to find a specialist. I booked, had my consult, and received my prescription — all within the same day.',
  },
  {
    name: 'Fatima Yusuf',
    location: 'Abuja, Nigeria',
    rating: 5,
    quote:
      'As a busy professional, being able to consult a doctor without leaving my office is a complete game changer. Highly recommend this platform.',
  },
  {
    name: 'Kwame Mensah',
    location: 'Kano, Nigeria',
    rating: 5,
    quote:
      'The doctor I was connected with was thorough and professional. I felt like I was in great hands throughout the entire consultation.',
  },
];

function PractitionerMiniCard({ p }: { p: PractitionerDirectoryItem }) {
  const id = String(p._id);
  const name = `${p.firstName} ${p.lastName}`;
  const rating = typeof p.averageRating === 'number' ? p.averageRating.toFixed(1) : '—';
  return (
    <Card className="overflow-hidden border-brand-stroke-soft shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-start gap-3">
          {p.profilePhotoUrl ? (
            <img src={p.profilePhotoUrl} alt="" className="size-12 rounded-full object-cover" />
          ) : (
            <div className="flex size-12 items-center justify-center rounded-full bg-muted text-sm font-semibold text-brand-body">
              {p.firstName[0]}
              {p.lastName[0]}
            </div>
          )}
          <div className="min-w-0">
            <CardTitle className="truncate text-base font-bold text-brand-navy">{name}</CardTitle>
            <CardDescription className="text-brand-body">
              ★ {rating} ({p.totalReviews ?? 0}) · {p.yearsOfExperience ?? '—'} yrs
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Button asChild variant="outline" size="sm" className="w-full border-brand-stroke-strong/30 font-semibold text-brand-navy">
          <Link to={ROUTES.findDoctorProfile(id)}>View profile</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

/** Hero right column: stacked “target” rounds + circular portrait — rings stay visible below the photo */
function HeroDoctorIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-[340px] min-[420px]:max-w-[400px] sm:max-w-[440px] lg:mx-0 lg:max-w-none lg:justify-self-end">
      <div className="relative mx-auto aspect-square w-[min(100%,440px)] sm:w-[min(100%,470px)] lg:w-[min(100%,560px)] xl:w-[min(100%,580px)]">
        {/* Outer stack: readable concentric strokes (reads on white grid bg) */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-full bg-linear-to-br from-sky-100/55 via-white/40 to-brand-stroke-soft/30 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.9)] ring-4 ring-white"
        />
        <div
          aria-hidden
          className="absolute inset-[2.5%] rounded-full border-[3px] border-white shadow-[0_0_0_1px_rgba(14,22,61,0.06)] sm:inset-[2%]"
        />
        <div
          aria-hidden
          className="absolute inset-[8%] rounded-full border-[2px] border-sky-300/95 sm:inset-[7%]"
        />
        {/* Mid band: icy ring + airy fill */}
        <div
          aria-hidden
          className="absolute inset-[13%] rounded-full border-[10px] border-white/98 bg-[radial-gradient(circle_at_38%_32%,rgba(255,255,255,1)_0%,rgba(224,247,251,0.78)_42%,rgba(186,231,253,0.55)_74%,rgba(147,197,253,0.42)_100%)] shadow-inner sm:inset-[12%] sm:border-[12px]"
        />
        {/* Inner: solid accent — slightly smaller inset so cyan disk peeks below portrait */}
        <div
          aria-hidden
          className="absolute inset-[27%] rounded-full bg-brand-hero-blue shadow-[inset_0_14px_36px_rgba(255,255,255,0.34),inset_0_-28px_42px_rgba(0,0,0,0.2)] ring-[3px] ring-white/90 sm:inset-[25.5%] sm:ring-4"
        />

        {/* Extra thin “orbit” strokes so rounds read even behind the doctor */}
        <div aria-hidden className="absolute inset-[18%] z-[3] rounded-full border border-white/85 sm:inset-[17%]" />
        <div aria-hidden className="absolute inset-[32%] z-[3] rounded-full border border-white/35 sm:inset-[31%]" />

        <div aria-hidden className="absolute bottom-[16%] right-[12%] z-[2] size-32 rounded-full bg-brand-cyan/15 blur-2xl sm:bottom-[18%] sm:size-36" />

        <Plus
          className="absolute right-[13%] top-[13%] z-[7] size-9 text-brand-cyan drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)] sm:size-11"
          strokeWidth={3}
          aria-hidden
        />
        <Plus
          className="absolute bottom-[34%] left-[7%] z-[7] size-8 text-brand-cyan drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)] sm:size-9"
          strokeWidth={3}
          aria-hidden
        />

        {/* Portrait: triple white/sky halo so “3 rounds” hug the crop; smaller width shows more disk underneath */}
        <div className="pointer-events-none absolute inset-0 z-[6] flex items-end justify-center pb-[11%] pt-[13%] sm:pb-[10%] sm:pt-[11%]">
          <div
            className="relative -translate-y-px rounded-full bg-white p-[3px] sm:p-1"
            style={{
              boxShadow:
                '0 36px 78px -26px rgba(14, 22, 61, 0.48), 0 0 0 6px rgba(255,255,255,1), 0 0 0 11px rgba(186, 231, 253, 0.62), 0 0 0 15px rgba(255,255,255,1), 0 0 0 17px rgba(125,211,252,0.38)',
            }}
          >
            <div className="size-[min(240px,74vw)] shrink-0 overflow-hidden rounded-full ring-[4px] ring-white sm:size-[256px] md:size-[274px] lg:size-[292px] xl:size-[304px]">
              <img
                src={DOCTOR_IMG}
                alt="Smiling physician in a white coat"
                className="h-full w-full object-cover object-[50%_6%]"
                width={518}
                height={640}
                fetchPriority="high"
                draggable={false}
              />
            </div>
          </div>
        </div>

        <div className="absolute left-[2%] top-[26%] z-20 rounded-[1.35rem] bg-white/95 px-3 py-2.5 shadow-float backdrop-blur-sm ring-1 ring-brand-stroke-soft/70 max-[389px]:left-0 max-[389px]:top-[28%] max-[389px]:scale-[0.92] sm:left-[-2%] sm:rounded-3xl sm:px-4 sm:py-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-cyan/12 sm:size-9">
              <Check className="size-4 text-brand-cyan sm:size-5" strokeWidth={2.8} aria-hidden />
            </span>
            <span className="text-xs font-semibold text-brand-navy sm:text-sm">Regular Check-up</span>
          </div>
        </div>

        <div className="absolute right-[0%] top-[10%] z-20 rounded-[1.35rem] bg-white/95 px-3 py-2.5 shadow-float backdrop-blur-sm ring-1 ring-brand-stroke-soft/70 max-[389px]:right-0 max-[389px]:top-[12%] max-[389px]:scale-[0.92] sm:right-[-3%] sm:rounded-3xl sm:px-4 sm:py-3">
          <div className="flex items-center gap-3">
            <img src={AVATAR_JD} alt="" className="size-10 shrink-0 rounded-full object-cover ring-2 ring-white sm:size-11" />
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-brand-navy sm:text-sm">John Doe</p>
              <p className="text-[11px] text-brand-body sm:text-xs">MBBS, Cardiologist</p>
              <Link to={ROUTES.findDoctor} className="text-[11px] font-semibold text-brand-cyan hover:underline sm:text-xs">
                Book Now
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute bottom-[4%] right-[-4%] z-20 rounded-[1.35rem] bg-white/95 px-3 py-2.5 shadow-float backdrop-blur-sm ring-1 ring-brand-stroke-soft/70 max-[389px]:right-[-2%] max-[389px]:scale-[0.9] max-[389px]:bottom-[2%] sm:right-[-2%] sm:rounded-3xl sm:px-4 sm:py-3 md:bottom-[6%]">
          <p className="text-[10px] font-bold uppercase tracking-wide text-brand-navy sm:text-xs">Meet Our Doctors</p>
          <div className="mt-2 flex items-center pl-0.5">
            {AV_ROUND.map((src, i) => (
              <img
                key={src}
                src={src}
                alt=""
                className="-ml-2 size-8 rounded-full border-2 border-white object-cover first:ml-0 sm:size-10"
                width={40}
                height={40}
                style={{ zIndex: 3 - i }}
              />
            ))}
            <span className="-ml-2 flex size-8 items-center justify-center rounded-full bg-gradient-brand-primary text-[9px] font-bold leading-tight text-white ring-2 ring-white sm:size-11 sm:text-[11px]">
              +12k
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const specialties = useQuery({
    queryKey: ['specialties', 'public'],
    queryFn: listPublicSpecialties,
  });

  const featured = useQuery({
    queryKey: ['practitioners', 'directory', { page: 1, limit: 6, sort: 'rating' as const }],
    queryFn: () => listPractitionersDirectory({ page: 1, limit: 6, sort: 'rating' }),
  });

  return (
    <>
      <Helmet>
        <title>MRD Online Clinic — Consult best doctors online</title>
        <meta name="description" content="Consult best doctors at your nearby location. Book visits, prescriptions, and care online." />
      </Helmet>

      {/* Hero — mobile: headline → illustration → search; lg: copy+search column | spanning illustration */}
      <section className="mx-auto w-full max-w-site overflow-x-clip px-4 pb-16 pt-10 sm:px-6 lg:pb-24 lg:pt-14 lg:px-8">
        {/*
          DOM order: headline → search → illustration so stacked mobile shows search under the title
          instead of forcing a tall illustration between them (lg placements unchanged).
        */}
        <div className="grid grid-cols-1 items-center gap-y-7 lg:grid-cols-2 lg:gap-x-12 lg:gap-y-10 xl:gap-x-16 2xl:gap-x-20">
          <header className="max-w-xl lg:max-w-2xl lg:col-start-1 lg:row-start-1 xl:max-w-none">
            <h1 className="text-balance font-sans text-4xl font-extrabold leading-[1.08] tracking-tight text-brand-navy sm:text-[2.8125rem] lg:text-[3.25rem] xl:text-[3.625rem]">
              Consult{' '}
              <span className="bg-gradient-brand-primary bg-clip-text font-extrabold text-transparent">
                Best Doctors
              </span>{' '}
              Your Nearby Location.
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-brand-body sm:mt-6 sm:text-xl">
              Embark on your healing journey with MRD Online Clinic.
            </p>
            <div className="mt-6 sm:mt-7">
              <Button
                variant="navCyan"
                size="lg"
                className="min-h-[3.75rem] px-12 py-8 text-lg font-bold shadow-lg sm:min-h-[4rem] sm:px-14 sm:text-xl"
                asChild
              >
                <Link to={ROUTES.findDoctor}>Start a Consult</Link>
              </Button>
            </div>
          </header>

          <div className="w-full max-w-[min(80rem,100%)] justify-self-start sm:max-w-[min(86rem,100%)] lg:col-start-1 lg:row-start-2 xl:max-w-none 2xl:max-w-none">
            <HeroSearchBar />
          </div>

          <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center">{/* Doctor + 3-round backdrop */}
            <figure className="m-0" aria-label="Care team spotlight">
              <HeroDoctorIllustration />
              <figcaption className="sr-only">
                Smiling clinician with appointment highlights — book verified practitioners anytime.
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* Trust / Statistics */}
      <section className="border-y border-brand-stroke-soft bg-white py-10">
        <div className="mx-auto w-full max-w-site px-4 sm:px-6 lg:px-8">
          <dl className="grid grid-cols-2 gap-y-8 text-center sm:grid-cols-4">
            {[
              { value: '12K+', label: 'Verified Doctors' },
              { value: '1M+', label: 'Happy Patients' },
              { value: '250+', label: 'Clinics' },
              { value: '4.8★', label: 'Avg. Rating' },
            ].map((s) => (
              <div key={s.label}>
                <dt className="bg-gradient-brand-primary bg-clip-text text-[2.25rem] font-extrabold leading-none text-transparent sm:text-[2.75rem]">
                  {s.value}
                </dt>
                <dd className="mt-2 text-sm text-brand-body">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Patients anchor */}
      <section id="patients" className="scroll-mt-28 border-y border-brand-stroke-soft bg-white py-14">
        <div className="mx-auto w-full max-w-site px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-12">
            <div>
              <h2 className="text-3xl font-bold text-brand-navy lg:text-[2rem]">For patients</h2>
              <p className="mt-4 text-lg text-brand-body">
                Find verified practitioners, book a visit, chat with your care team, and manage prescriptions—all in one
                place.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button variant="navCyan" asChild size="lg" className="rounded-lg px-8">
                  <Link to={ROUTES.registerPatient}>Register as patient</Link>
                </Button>
                <Button variant="outline" asChild size="lg" className="rounded-lg border-brand-stroke-strong px-8 font-semibold text-brand-navy">
                  <Link to={ROUTES.findDoctor}>Browse practitioners</Link>
                </Button>
              </div>
            </div>
            <div className="rounded-2xl border border-brand-stroke-soft bg-brand-marketing p-8">
              <ul className="space-y-3 text-brand-body">
                <li className="flex gap-3">
                  <Check className="mt-1 size-5 shrink-0 text-brand-cyan" aria-hidden /> Search by specialty or name
                </li>
                <li className="flex gap-3">
                  <Check className="mt-1 size-5 shrink-0 text-brand-cyan" aria-hidden /> Secure messaging after booking
                </li>
                <li className="flex gap-3">
                  <Check className="mt-1 size-5 shrink-0 text-brand-cyan" aria-hidden /> Digital prescriptions where appropriate
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How it works — split layout + four steps (includes pharmacy) */}
      <section
        id="how-it-works"
        className="relative isolate scroll-mt-28 overflow-hidden border-y border-brand-stroke-soft bg-how-it-works-shell py-12 lg:py-20"
      >
        <span
          className="how-it-works-hex-tile pointer-events-none absolute -left-[8%] top-[-6%] h-[min(380px,48vh)] w-[min(100%,460px)] opacity-[0.22] mask-[linear-gradient(to_bottom_right,black_42%,transparent_88%)] sm:-left-[4%] sm:opacity-[0.26]"
          aria-hidden
        />
        <span
          className="how-it-works-hex-tile pointer-events-none absolute -bottom-[10%] -right-[6%] h-[min(360px,45vh)] w-[min(100%,440px)] opacity-[0.2] mask-[linear-gradient(to_top_left,black_46%,transparent_90%)] sm:opacity-[0.24]"
          aria-hidden
        />
        <div className="relative mx-auto w-full max-w-site px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.1fr)] lg:items-stretch lg:gap-x-11 xl:gap-x-16">
            <figure className="relative order-2 mx-auto flex w-full max-w-md flex-col lg:order-1 lg:mx-0 lg:h-full lg:max-w-none lg:min-h-0">
              <span
                className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[min(115%,460px)] w-[min(108%,430px)] -translate-x-1/2 -translate-y-[48%] rounded-full bg-brand-sky/35 blur-[2px]"
                aria-hidden
              />
              <span
                className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[min(126%,520px)] w-[min(120%,480px)] -translate-x-1/2 -translate-y-[48%] rounded-full bg-brand-landing/95 ring-1 ring-brand-hero-blue/[0.06]"
                aria-hidden
              />
              <span
                className="pointer-events-none absolute -left-[6%] top-[8%] h-44 w-44 rounded-full bg-brand-cyan/15 blur-3xl sm:h-52 sm:w-52"
                aria-hidden
              />
              <span
                className="pointer-events-none absolute -bottom-2 -right-[4%] h-36 w-36 rounded-full bg-brand-hero-blue/10 blur-[2.75rem]"
                aria-hidden
              />
              <div
                className={cn(
                  'relative isolate mx-auto w-full max-w-md overflow-hidden rounded-2xl bg-white ring-1 ring-brand-stroke-soft/90 shadow-hero-search-kit lg:mx-0 lg:max-w-none lg:min-h-0 lg:flex-1 lg:rounded-[1.25rem]',
                  'aspect-[16/11] max-h-[300px] max-lg:w-full lg:aspect-auto lg:max-h-none lg:self-stretch sm:max-h-[320px]',
                )}
              >
                <img
                  src={HOW_IT_WORKS_IMG}
                  alt="Clinician in telehealth-friendly care setting."
                  width={900}
                  height={600}
                  sizes="(min-width: 1024px) 38vw, (min-width: 640px) 90vw, 100vw"
                  className="h-full w-full min-h-[12rem] object-cover object-[center_22%] lg:absolute lg:inset-0 lg:min-h-0"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </figure>

            <div className="order-1 flex min-h-0 flex-col lg:order-2 lg:h-full">
              <div className="shrink-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-cyan sm:text-sm">
                  How it works
                </p>
                <h2 className="mt-2 text-balance text-[1.75rem] font-extrabold leading-[1.12] text-brand-navy sm:text-[2rem] lg:mt-2.5 lg:text-[2.25rem]">
                  <span className="font-black text-brand-hero-blue tabular-nums">4</span> easy steps to get your{' '}
                  <span className="relative inline-block">
                    solution
                    <span className="absolute -right-7 top-[-2px] flex sm:-right-9" aria-hidden>
                      <Plus className="size-[1rem] text-brand-hero-blue drop-shadow-[0_1px_0_rgba(255,255,255,0.85)] sm:size-[1.2rem]" strokeWidth={3} />
                      <Plus className="-ml-2 size-[1rem] text-brand-cyan sm:-ml-2.5 sm:size-[1.2rem]" strokeWidth={3} />
                    </span>
                  </span>
                </h2>
                <p className="mt-3 max-w-xl text-[0.9375rem] leading-relaxed text-brand-body sm:mt-3.5 sm:text-base lg:mt-4 lg:text-lg lg:leading-relaxed">
                  From search to prescriptions, every stage stays on-platform so you waste less time and get clearer next
                  steps.
                </p>
              </div>

              <ul className="mt-8 grid min-h-0 flex-1 gap-6 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-7 lg:mt-10 lg:auto-rows-fr lg:gap-x-12 lg:gap-y-10 lg:self-stretch lg:content-between">
                {HOW_IT_WORKS_STEPS.map(({ title, description, Icon }, idx) => {
                  const isPharmacy = title === 'Pharmacy';
                  return (
                    <li
                      key={title}
                      id={isPharmacy ? 'pharmacy' : undefined}
                      className={cn('flex gap-4', isPharmacy && 'scroll-mt-28')}
                    >
                      <div className="flex size-[3.25rem] shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#dff3ff] via-[#cfe8fd] to-[#bfe0fc] shadow-[inset_0_1px_0_rgba(255,255,255,0.92),inset_0_-1px_0_rgba(14,22,61,0.04)] ring-1 ring-brand-hero-blue/35">
                        <Icon className="size-[1.45rem] text-[#1557a8]" strokeWidth={2.05} aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1 lg:pb-1">
                        <p className="text-sm font-black tabular-nums tracking-wide text-brand-navy sm:text-[0.95rem]">
                          {String(idx + 1).padStart(2, '0')}
                        </p>
                        <h3 className="text-base font-bold leading-snug text-brand-navy">{title}</h3>
                        <p className="mt-1.5 text-[0.875rem] leading-relaxed text-brand-body sm:text-[0.9rem] sm:leading-relaxed lg:text-[0.9375rem] lg:leading-[1.55]">
                          {description}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="scroll-mt-28 border-t border-brand-stroke-soft bg-white py-14 lg:py-20">
        <div className="mx-auto w-full max-w-site px-4 text-center sm:px-6 lg:px-8">
          <h2 className="relative mx-auto inline-block text-3xl font-extrabold text-brand-navy lg:text-[2rem]">
            Pricing Plan
            <Plus className="absolute -right-6 top-1 size-[1rem] text-brand-cyan sm:-right-8 sm:size-5" strokeWidth={2.5} aria-hidden />
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[0.9375rem] text-brand-body sm:text-base lg:mt-5">
            Simple monthly tiers in Nigerian Naira (NGN). Upgrade anytime as your care needs grow.
          </p>

          <div className="mx-auto mt-12 grid max-w-6xl gap-8 lg:mt-14 lg:grid-cols-3 lg:gap-7 lg:items-stretch xl:gap-8">
            {PRICING_PLANS.map((plan) => {
              const { key, name, priceMonthly, Icon, features, highlighted } = plan;
              const badge = 'badge' in plan ? plan.badge : undefined;
              return (
                <div
                  key={key}
                  className={cn(
                    'flex flex-col rounded-2xl text-left shadow-hero-search-kit ring-1 transition-shadow lg:rounded-[1.35rem]',
                    highlighted
                      ? 'relative z-[1] border-0 bg-brand-hero-blue px-6 py-9 text-white shadow-float ring-brand-hero-blue/35 lg:-mt-1 lg:px-8 lg:py-11'
                      : 'border border-brand-stroke-soft/80 bg-brand-landing/70 px-6 py-8 ring-brand-stroke-soft/60 lg:px-7 lg:py-10',
                  )}
                >
                  <div className="flex items-start gap-4">
                    <span
                      className={cn(
                        'flex size-14 shrink-0 items-center justify-center rounded-xl shadow-sm lg:size-[3.65rem]',
                        highlighted ? 'bg-white/98 text-brand-hero-blue' : 'bg-white text-brand-hero-blue ring-1 ring-brand-stroke-soft/90',
                      )}
                    >
                      <Icon className="size-[1.65rem] lg:size-7" strokeWidth={highlighted ? 2 : 1.85} aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1 pt-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className={cn('text-xl font-bold lg:text-[1.35rem]', highlighted ? 'text-white' : 'text-brand-navy')}>
                          {name}
                        </h3>
                        {badge ? (
                          <span className="rounded-full bg-white/22 px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-white ring-1 ring-white/35">
                            {badge}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <span
                          className={cn(
                            'text-[2rem] font-black tabular-nums leading-none tracking-tight sm:text-[2.25rem]',
                            highlighted ? 'text-white' : 'text-brand-navy',
                          )}
                        >
                          ₦{formatNgn(priceMonthly)}
                        </span>
                        <span
                          className={cn(
                            'text-[0.9rem] font-medium',
                            highlighted ? 'text-sky-100/95' : 'text-brand-body',
                          )}
                        >
                          /monthly
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-9 flex-1">
                    <p className={cn('text-[0.9rem] font-bold', highlighted ? 'text-white' : 'text-brand-navy')}>What&apos;s included</p>
                    <ul className="mt-4 space-y-3.5">
                      {features.map((line) => (
                        <li key={line} className="flex gap-3">
                          <CircleCheck
                            className={cn('mt-0.5 size-[1.1rem] shrink-0', highlighted ? 'text-white' : 'text-brand-hero-blue')}
                            strokeWidth={2.15}
                            aria-hidden
                          />
                          <span
                            className={cn(
                              'text-[0.875rem] leading-snug lg:text-[0.9375rem] lg:leading-relaxed',
                              highlighted ? 'text-white/93' : 'text-brand-body',
                            )}
                          >
                            {line}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-10">
                    <Button
                      variant={highlighted ? 'secondary' : 'navCyan'}
                      size="lg"
                      className={cn(
                        'w-full rounded-full px-8 text-[0.9rem] font-semibold lg:min-h-12 lg:text-[0.9375rem]',
                        highlighted
                          ? 'border-0 bg-white text-brand-navy shadow-md hover:bg-white/92'
                          : 'border-0 bg-gradient-search-pill text-white shadow-sm hover:brightness-[1.04]',
                      )}
                      asChild
                    >
                      <Link to={ROUTES.register}>Choose Plan</Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-brand-stroke-soft py-14">
        <div className="mx-auto w-full max-w-site px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-brand-navy sm:text-[1.65rem]">Specialties</h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-brand-body">
            Explore care areas from our Live catalog.
          </p>
          {specialties.isLoading ? <p className="mt-10 text-center text-brand-body">Loading…</p> : null}
          {specialties.isError ? <p className="mt-10 text-center text-red-600">Could not load specialties.</p> : null}
          {specialties.data ? (
            <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {specialties.data.slice(0, 8).map((s: SpecialtyDto) => (
                <li key={s.id}>
                  <Link
                    to={`${ROUTES.findDoctor}?specialtyId=${encodeURIComponent(s.id)}`}
                    className="block rounded-xl border border-brand-stroke-soft bg-white p-4 text-left text-sm font-semibold text-brand-navy shadow-sm transition hover:border-brand-cyan/50"
                  >
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-8 text-center">
            <Link to={ROUTES.specialties} className="font-semibold text-brand-cyan hover:underline">
              View all specialties
            </Link>
          </div>
        </div>
      </section>

      <section className="pb-16 pt-6">
        <div className="mx-auto w-full max-w-site px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-brand-navy sm:text-[1.65rem]">Featured practitioners</h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-brand-body">Top-rated verified doctors in our directory.</p>
          {featured.isLoading ? <p className="mt-10 text-center text-brand-body">Loading…</p> : null}
          {featured.isError ? <p className="mt-10 text-center text-red-600">Could not load directory.</p> : null}
          {featured.data?.items.length ? (
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.data.items.map((p) => (
                <PractitionerMiniCard key={String(p._id)} p={p} />
              ))}
            </div>
          ) : featured.isSuccess ? (
            <p className="mt-10 text-center text-brand-body">No verified practitioners in the catalog yet.</p>
          ) : null}
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-t border-brand-stroke-soft bg-white py-16">
        <div className="mx-auto w-full max-w-site px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-brand-navy lg:text-[2rem]">What Patients Say</h2>
            <p className="mx-auto mt-3 max-w-xl text-brand-body">Real experiences from patients across Nigeria.</p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <article
                key={t.name}
                className="rounded-2xl border border-brand-stroke-soft bg-white p-6 shadow-sm transition hover:shadow-float"
              >
                <div className="flex gap-0.5" aria-label={`${t.rating} out of 5 stars`}>
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="size-4 fill-amber-400 text-amber-400" aria-hidden />
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-brand-body">"{t.quote}"</p>
                <div className="mt-5 flex items-center gap-3">
                  <div
                    aria-hidden
                    className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-brand-primary text-sm font-bold text-white"
                  >
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-brand-navy">{t.name}</p>
                    <p className="text-xs text-brand-body">{t.location}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
