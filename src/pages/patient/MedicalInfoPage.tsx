import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClipboardList, HeartPulse, Loader2, MapPin, Phone } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  getPatientMe,
  patchPatientAddress,
  patchPatientEmergency,
  patchPatientHealthRecord,
} from '@/features/patients/api';
import { normalizeAxiosError } from '@/lib/api/errors';
import {
  addressFormSchema,
  addressFormToPatch,
  emergencyContactFormSchema,
  emergencyFormToPatch,
  healthRecordFormSchema,
  healthRecordFormToPatch,
  patientDocToAddressForm,
  patientDocToEmergencyForm,
  patientDocToHealthRecordForm,
  type AddressFormValues,
  type EmergencyContactFormValues,
  type HealthRecordFormValues,
} from '@/lib/validators/patient';
import { ROUTES } from '@/router/routes';
import { cn } from '@/lib/utils/cn';

function SectionCard({
  icon,
  title,
  description,
  children,
  footer,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <Card className="overflow-hidden border-border/80 shadow-sm">
      <CardHeader className="border-b bg-muted/25 pb-5">
        <div className="flex gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </div>
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription className="text-sm leading-relaxed">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-6">{children}</CardContent>
      <div className="flex flex-col gap-2 border-t bg-muted/15 px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
        {footer}
      </div>
    </Card>
  );
}

function ListField({
  form,
  name,
  id,
  label,
  placeholder,
  hint,
}: {
  form: UseFormReturn<HealthRecordFormValues>;
  name: keyof HealthRecordFormValues;
  id: string;
  label: string;
  placeholder: string;
  hint: string;
}) {
  const value = form.watch(name) ?? '';
  const lineCount = value.split(/\r?\n/).filter((l) => l.trim()).length;
  const hasContent = lineCount > 0;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm ring-1 ring-black/[0.03] transition-shadow focus-within:shadow-md focus-within:ring-primary/25">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/80 bg-secondary/60 px-4 py-2.5">
        <Label htmlFor={id} className="text-sm font-semibold text-foreground">
          {label}
        </Label>
        {hasContent ? (
          <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-foreground">
            {lineCount} {lineCount === 1 ? 'entry' : 'entries'}
          </span>
        ) : (
          <span className="text-xs font-medium text-muted-foreground">{hint}</span>
        )}
      </div>
      <div className="space-y-2 p-4">
        <Textarea
          id={id}
          rows={4}
          placeholder={placeholder}
          className={cn(
            'min-h-[108px] resize-y rounded-lg border px-3.5 py-3 text-[15px] leading-7 shadow-none',
            'text-foreground placeholder:text-muted-foreground/55',
            'transition-[border-color,background-color,box-shadow]',
            hasContent
              ? 'border-primary/25 bg-white focus-visible:border-primary/50'
              : 'border-input bg-muted/35 focus-visible:border-primary/45 focus-visible:bg-white',
            'focus-visible:ring-2 focus-visible:ring-primary/20',
          )}
          {...form.register(name)}
        />
        <p className="text-xs leading-relaxed text-muted-foreground">
          {hasContent ? 'One item per line — add or edit anytime.' : `Type each ${label.toLowerCase()} on its own line.`}
        </p>
      </div>
    </div>
  );
}

function FieldRow({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </Label>
      {children}
    </div>
  );
}

function SaveButton({
  label,
  pending,
  disabled,
}: {
  label: string;
  pending: boolean;
  disabled: boolean;
}) {
  return (
    <Button type="submit" disabled={disabled || pending} className="min-w-[10rem]">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Saving…
        </>
      ) : (
        label
      )}
    </Button>
  );
}

export default function PatientMedicalInfoPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const profile = useQuery({
    queryKey: ['patients', 'me'],
    queryFn: getPatientMe,
  });

  const healthForm = useForm<HealthRecordFormValues>({
    resolver: zodResolver(healthRecordFormSchema),
    defaultValues: { allergiesText: '', chronicConditionsText: '', currentMedicationsText: '' },
  });

  const emergencyForm = useForm<EmergencyContactFormValues>({
    resolver: zodResolver(emergencyContactFormSchema),
    defaultValues: { emergencyName: '', emergencyRelationship: '', emergencyPhone: '' },
  });

  const addressForm = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      addressStreet: '',
      addressCity: '',
      addressState: '',
      addressCountry: '',
      addressPostalCode: '',
    },
  });

  useEffect(() => {
    if (!profile.data) return;
    healthForm.reset(patientDocToHealthRecordForm(profile.data));
    emergencyForm.reset(patientDocToEmergencyForm(profile.data));
    addressForm.reset(patientDocToAddressForm(profile.data));
  }, [profile.data, healthForm, emergencyForm, addressForm]);

  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: ['patients', 'me'] });
  };

  const saveHealth = useMutation({
    mutationFn: (values: HealthRecordFormValues) => patchPatientHealthRecord(healthRecordFormToPatch(values)),
    onSuccess: async () => {
      toast.success(t('patient.medical.healthSaved'));
      await invalidate();
    },
    onError: (e) => toast.error(normalizeAxiosError(e).message),
  });

  const saveEmergency = useMutation({
    mutationFn: (values: EmergencyContactFormValues) => patchPatientEmergency(emergencyFormToPatch(values)),
    onSuccess: async () => {
      toast.success(t('patient.medical.emergencySaved'));
      await invalidate();
    },
    onError: (e) => toast.error(normalizeAxiosError(e).message),
  });

  const saveAddress = useMutation({
    mutationFn: (values: AddressFormValues) => patchPatientAddress(addressFormToPatch(values)),
    onSuccess: async () => {
      toast.success(t('patient.medical.addressSaved'));
      await invalidate();
    },
    onError: (e) => toast.error(normalizeAxiosError(e).message),
  });

  const loading = profile.isLoading;

  return (
    <>
      <Helmet>
        <title>{t('patient.medical.title')}</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="mx-auto max-w-4xl space-y-8 pb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary">{t('patient.medical.badge')}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{t('patient.medical.heading')}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{t('patient.medical.description')}</p>
          </div>
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link to={ROUTES.patient.profile}>{t('patient.medical.backToAccount')}</Link>
          </Button>
        </div>

        {profile.isError ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {t('patient.medical.couldNotLoadProfile')}
          </p>
        ) : null}

        {loading ? (
          <p className="text-sm text-muted-foreground">{t('patient.medical.loadingProfile')}</p>
        ) : null}

        <form
          className={cn(loading && 'pointer-events-none opacity-60')}
          onSubmit={healthForm.handleSubmit((v) => saveHealth.mutate(v))}
        >
          <SectionCard
            icon={<HeartPulse className="h-5 w-5" aria-hidden />}
            title={t('patient.medical.healthRecord')}
            description={t('patient.medical.healthRecordHint')}
            footer={
              <SaveButton
                label={t('patient.medical.saveHealthRecord')}
                pending={saveHealth.isPending}
                disabled={!healthForm.formState.isDirty}
              />
            }
          >
            <ListField
              form={healthForm}
              id="allergies"
              name="allergiesText"
              label={t('patient.medical.allergies')}
              hint="One per line"
              placeholder={'e.g. Penicillin\nPeanuts'}
            />
            <ListField
              form={healthForm}
              id="chronic"
              name="chronicConditionsText"
              label={t('patient.medical.conditions')}
              hint="One per line"
              placeholder={'e.g. Type 2 diabetes\nHypertension'}
            />
            <ListField
              form={healthForm}
              id="meds"
              name="currentMedicationsText"
              label={t('patient.medical.medications')}
              hint="One per line"
              placeholder={'e.g. Metformin 500mg — twice daily\nLisinopril 10mg — once daily'}
            />
          </SectionCard>
        </form>

        <form
          className={cn(loading && 'pointer-events-none opacity-60')}
          onSubmit={emergencyForm.handleSubmit((v) => saveEmergency.mutate(v))}
        >
          <SectionCard
            icon={<Phone className="h-5 w-5" aria-hidden />}
            title={t('patient.medical.emergency')}
            description={t('patient.medical.emergencyHint')}
            footer={
              <>
                <p className="text-xs text-muted-foreground sm:mr-auto sm:text-left">
                  Clear all fields and save to remove your emergency contact.
                </p>
                <SaveButton
                  label={t('patient.medical.saveEmergencyContact')}
                  pending={saveEmergency.isPending}
                  disabled={!emergencyForm.formState.isDirty}
                />
              </>
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldRow label={t('patient.medical.contactName')} htmlFor="en">
                <Input id="en" autoComplete="name" placeholder="e.g. Fatima Suleiman" {...emergencyForm.register('emergencyName')} />
              </FieldRow>
              <FieldRow label={t('patient.medical.relationship')} htmlFor="er">
                <Input id="er" placeholder="e.g. Spouse, Parent, Sibling" {...emergencyForm.register('emergencyRelationship')} />
              </FieldRow>
              <FieldRow label={t('patient.medical.contactPhone')} htmlFor="ep" className="sm:col-span-2">
                <Input id="ep" type="tel" autoComplete="tel" placeholder="+234 …" {...emergencyForm.register('emergencyPhone')} />
              </FieldRow>
            </div>
            {emergencyForm.formState.errors.emergencyName ? (
              <p className="text-sm text-destructive">{emergencyForm.formState.errors.emergencyName.message}</p>
            ) : null}
          </SectionCard>
        </form>

        <form
          className={cn(loading && 'pointer-events-none opacity-60')}
          onSubmit={addressForm.handleSubmit((v) => saveAddress.mutate(v))}
        >
          <SectionCard
            icon={<MapPin className="h-5 w-5" aria-hidden />}
            title={t('patient.medical.homeAddress')}
            description={t('patient.medical.addressHint')}
            footer={
              <>
                <p className="text-xs text-muted-foreground sm:mr-auto sm:text-left">
                  Clear all fields and save to remove your saved address.
                </p>
                <SaveButton label={t('patient.medical.saveAddress')} pending={saveAddress.isPending} disabled={!addressForm.formState.isDirty} />
              </>
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldRow label={t('patient.medical.street')} htmlFor="st" className="sm:col-span-2">
                <Input id="st" autoComplete="street-address" placeholder="House number and street" {...addressForm.register('addressStreet')} />
              </FieldRow>
              <FieldRow label={t('patient.medical.city')} htmlFor="city">
                <Input id="city" autoComplete="address-level2" {...addressForm.register('addressCity')} />
              </FieldRow>
              <FieldRow label={t('patient.medical.state')} htmlFor="state">
                <Input id="state" autoComplete="address-level1" {...addressForm.register('addressState')} />
              </FieldRow>
              <FieldRow label={t('patient.medical.country')} htmlFor="country">
                <Input id="country" autoComplete="country-name" {...addressForm.register('addressCountry')} />
              </FieldRow>
              <FieldRow label={t('patient.medical.postalCode')} htmlFor="zip">
                <Input id="zip" autoComplete="postal-code" {...addressForm.register('addressPostalCode')} />
              </FieldRow>
            </div>
          </SectionCard>
        </form>

        <div className="flex items-start gap-3 rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
          <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
          <p>
            Your care team sees this information during appointments and messaging. For name, photo, and login details,
            use{' '}
            <Link to={ROUTES.patient.profile} className="font-medium text-primary underline-offset-4 hover:underline">
              My account
            </Link>
            .
          </p>
        </div>
      </div>
    </>
  );
}
