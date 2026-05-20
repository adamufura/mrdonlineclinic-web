import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, ExternalLink, Loader2, Lock, PenLine, Stethoscope, UserRound } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useEffect, useRef, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { changePassword } from '@/features/auth/api';
import {
  getPractitionerMe,
  patchPractitionerProfile,
  uploadPractitionerPhoto,
  uploadPractitionerSignature,
} from '@/features/practitioners/session-api';
import { listPublicSpecialties } from '@/features/specialties/api';
import { normalizeAxiosError } from '@/lib/api/errors';
import { cn } from '@/lib/utils/cn';
import { passwordSchema } from '@/lib/validators/auth';
import {
  practitionerDocToPersonalForm,
  practitionerDocToProfessionalForm,
  practitionerPersonalProfileSchema,
  practitionerProfessionalProfileSchema,
  professionalFormToPatch,
  type PractitionerPersonalProfileValues,
  type PractitionerProfessionalProfileValues,
} from '@/lib/validators/practitioner-profile';
import { ROUTES } from '@/router/routes';
import { useAuthStore } from '@/stores/auth-store';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' })
  .refine((d) => d.currentPassword !== d.newPassword, {
    path: ['newPassword'],
    message: 'New password must be different from your current password',
  });

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

function FormSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm ring-1 ring-black/[0.03]">
      <div className="border-b border-border/80 bg-secondary/50 px-5 py-3.5">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
      </Label>
      {children}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

export default function PractitionerProfilePage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const authUser = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const fileRef = useRef<HTMLInputElement>(null);
  const signatureRef = useRef<HTMLInputElement>(null);

  const profile = useQuery({
    queryKey: ['practitioners', 'me'],
    queryFn: getPractitionerMe,
  });

  const specialtiesQuery = useQuery({
    queryKey: ['specialties', 'public'],
    queryFn: listPublicSpecialties,
  });

  const personalForm = useForm<PractitionerPersonalProfileValues>({
    resolver: zodResolver(practitionerPersonalProfileSchema),
    defaultValues: { firstName: '', middleName: '', lastName: '', phoneNumber: '' },
  });

  const professionalForm = useForm<PractitionerProfessionalProfileValues>({
    resolver: zodResolver(practitionerProfessionalProfileSchema),
    defaultValues: {
      bio: '',
      yearsOfExperience: 0,
      practiceCity: '',
      practiceState: '',
      practiceCountry: 'Nigeria',
      consultationLanguages: '',
      specialtyIds: [],
    },
  });

  useEffect(() => {
    if (profile.data) {
      personalForm.reset(practitionerDocToPersonalForm(profile.data));
      professionalForm.reset(practitionerDocToProfessionalForm(profile.data));
    }
  }, [profile.data, personalForm, professionalForm]);

  const savePersonal = useMutation({
    mutationFn: (values: PractitionerPersonalProfileValues) => patchPractitionerProfile(values),
    onSuccess: async () => {
      toast.success(t('practitioner.profile.personalSaved'));
      await qc.invalidateQueries({ queryKey: ['practitioners', 'me'] });
    },
    onError: (e) => toast.error(normalizeAxiosError(e).message),
  });

  const saveProfessional = useMutation({
    mutationFn: (values: PractitionerProfessionalProfileValues) =>
      patchPractitionerProfile(professionalFormToPatch(values)),
    onSuccess: async () => {
      toast.success(t('practitioner.profile.professionalSaved'));
      await qc.invalidateQueries({ queryKey: ['practitioners', 'me'] });
    },
    onError: (e) => toast.error(normalizeAxiosError(e).message),
  });

  const uploadPhoto = useMutation({
    mutationFn: (file: File) => uploadPractitionerPhoto(file),
    onSuccess: async (result) => {
      const current = useAuthStore.getState().user;
      if (current) {
        setUser({ ...current, profilePhotoUrl: result.profilePhotoUrl });
      }
      toast.success(t('practitioner.profile.photoUpdated'));
      await qc.invalidateQueries({ queryKey: ['practitioners', 'me'] });
    },
    onError: (e) => toast.error(normalizeAxiosError(e).message),
  });

  const uploadSignature = useMutation({
    mutationFn: (file: File) => uploadPractitionerSignature(file),
    onSuccess: async () => {
      toast.success(t('practitioner.profile.signatureSaved'));
      await qc.invalidateQueries({ queryKey: ['practitioners', 'me'] });
    },
    onError: (e) => toast.error(normalizeAxiosError(e).message),
  });

  const pwdForm = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const changePwd = useMutation({
    mutationFn: (v: Pick<ChangePasswordValues, 'currentPassword' | 'newPassword'>) =>
      changePassword(v.currentPassword, v.newPassword),
    onSuccess: async (result) => {
      setAccessToken(result.tokens.accessToken);
      pwdForm.reset();
      toast.success(t('practitioner.profile.passwordUpdated'));
    },
    onError: (e) => toast.error(normalizeAxiosError(e).message),
  });

  const photoUrl =
    (typeof profile.data?.profilePhotoUrl === 'string' ? profile.data.profilePhotoUrl : undefined) ||
    authUser?.profilePhotoUrl;

  const initials =
    `${authUser?.firstName?.[0] ?? ''}${authUser?.lastName?.[0] ?? ''}`.toUpperCase() || 'Dr';

  const publicProfileHref = authUser?.id ? ROUTES.findDoctorProfile(authUser.id) : ROUTES.findDoctor;

  const selectedSpecialties = professionalForm.watch('specialtyIds');
  const signatureUrl =
    typeof profile.data?.signatureUrl === 'string' ? profile.data.signatureUrl : undefined;

  return (
    <>
      <Helmet>
        <title>{t('practitioner.profile.title')}</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="mx-auto max-w-4xl space-y-8 pb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary">{t('practitioner.profile.badge')}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{t('practitioner.profile.heading')}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {t('practitioner.profile.intro')}{' '}
              <Link to={ROUTES.practitioner.profileCredentials} className="font-medium text-primary hover:underline">
                {t('practitioner.profile.credentialsLink')}
              </Link>
              .
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm" className="shrink-0 gap-1.5">
              <Link to={ROUTES.practitioner.profileCredentials}>{t('practitioner.profile.credentialsLink')}</Link>
            </Button>
            {authUser?.id ? (
              <Button asChild variant="outline" size="sm" className="shrink-0 gap-1.5">
                <a href={publicProfileHref} target="_blank" rel="noopener noreferrer">
                  {t('practitioner.profile.viewPublicProfile')}
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </a>
              </Button>
            ) : null}
          </div>
        </div>

        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid h-11 w-full max-w-xl grid-cols-3">
            <TabsTrigger value="personal" className="gap-2">
              <UserRound className="h-4 w-4" aria-hidden />
              {t('practitioner.profile.tabPersonal')}
            </TabsTrigger>
            <TabsTrigger value="professional" className="gap-2">
              <Stethoscope className="h-4 w-4" aria-hidden />
              {t('practitioner.profile.tabProfessional')}
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Lock className="h-4 w-4" aria-hidden />
              {t('practitioner.profile.tabSecurity')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="mt-0">
            <Card className="overflow-hidden border-border/80 shadow-sm">
              <CardHeader className="border-b bg-muted/25 pb-5">
                <div className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <UserRound className="h-5 w-5" aria-hidden />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <CardTitle className="text-lg">{t('practitioner.profile.personalTitle')}</CardTitle>
                    <CardDescription className="text-sm">
                      {t('practitioner.profile.signedInAs')}{' '}
                      <span className="font-medium text-foreground">{authUser?.email}</span>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-8 pt-8">
                <div className="flex flex-col gap-6 rounded-xl border border-border bg-secondary/30 p-5 sm:flex-row sm:items-center">
                  <div className="relative shrink-0">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt=""
                        className="size-28 rounded-full object-cover ring-2 ring-white shadow-md"
                      />
                    ) : (
                      <div className="flex size-28 items-center justify-center rounded-full bg-white text-2xl font-semibold text-foreground shadow-md ring-2 ring-border">
                        {initials}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                      <Camera className="h-4 w-4" aria-hidden />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{t('practitioner.profile.profilePhoto')}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{t('practitioner.profile.photoHint')}</p>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        e.target.value = '';
                        if (!f) return;
                        if (!f.type.startsWith('image/')) {
                          toast.error('Please choose an image file (JPG, PNG, or WebP).');
                          return;
                        }
                        if (f.size > 5 * 1024 * 1024) {
                          toast.error('Image must be 5MB or smaller.');
                          return;
                        }
                        uploadPhoto.mutate(f);
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-4 bg-white"
                      disabled={uploadPhoto.isPending}
                      onClick={() => fileRef.current?.click()}
                    >
                      {uploadPhoto.isPending ? t('common.loading') : t('practitioner.profile.changePhoto')}
                    </Button>
                    <p className="mt-2 text-xs text-muted-foreground">{t('practitioner.profile.photoFormat')}</p>
                  </div>
                </div>

                {profile.isLoading ? <p className="text-sm text-muted-foreground">{t('practitioner.profile.loadingProfile')}</p> : null}
                {profile.isError ? (
                  <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    {t('practitioner.profile.couldNotLoadProfile')}
                  </p>
                ) : null}

                <form
                  className={cn('space-y-8', profile.isLoading && 'pointer-events-none opacity-60')}
                  onSubmit={personalForm.handleSubmit((v) => savePersonal.mutate(v))}
                >
                  <FormSection title={t('practitioner.profile.legalName')} description={t('practitioner.profile.legalNameHint')}>
                    <div className="grid gap-5 md:grid-cols-3">
                      <Field label={t('practitioner.profile.firstName')} htmlFor="pf-first" error={personalForm.formState.errors.firstName?.message}>
                        <Input id="pf-first" autoComplete="given-name" {...personalForm.register('firstName')} />
                      </Field>
                      <Field label={t('practitioner.profile.middleName')} htmlFor="pf-middle" error={personalForm.formState.errors.middleName?.message}>
                        <Input id="pf-middle" autoComplete="additional-name" {...personalForm.register('middleName')} />
                      </Field>
                      <Field label={t('practitioner.profile.lastName')} htmlFor="pf-last" error={personalForm.formState.errors.lastName?.message}>
                        <Input id="pf-last" autoComplete="family-name" {...personalForm.register('lastName')} />
                      </Field>
                    </div>
                  </FormSection>

                  <FormSection title={t('practitioner.profile.contact')}>
                    <Field label={t('practitioner.profile.phoneNumber')} htmlFor="pf-phone" error={personalForm.formState.errors.phoneNumber?.message}>
                      <Input id="pf-phone" type="tel" autoComplete="tel" placeholder="+234 …" {...personalForm.register('phoneNumber')} />
                    </Field>
                  </FormSection>

                  <div className="flex justify-end border-t border-border/80 pt-6">
                    <Button type="submit" disabled={savePersonal.isPending || !personalForm.formState.isDirty} className="min-w-[10rem]">
                      {savePersonal.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t('common.loading')}
                        </>
                      ) : (
                        t('practitioner.profile.saveChanges')
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="professional" className="mt-0">
            <Card className="overflow-hidden border-border/80 shadow-sm">
              <CardHeader className="border-b bg-muted/25 pb-5">
                <div className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-700">
                    <Stethoscope className="h-5 w-5" aria-hidden />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <CardTitle className="text-lg">{t('practitioner.profile.professionalTitle')}</CardTitle>
                    <CardDescription className="text-sm">{t('practitioner.profile.professionalHint')}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-8">
                <form
                  className={cn('space-y-8', profile.isLoading && 'pointer-events-none opacity-60')}
                  onSubmit={professionalForm.handleSubmit((v) => saveProfessional.mutate(v))}
                >
                  <FormSection title={t('practitioner.profile.aboutYou')}>
                    <Field label={t('practitioner.profile.bio')} htmlFor="bio" error={professionalForm.formState.errors.bio?.message}>
                      <textarea
                        id="bio"
                        rows={4}
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        placeholder={t('practitioner.profile.bioPlaceholder')}
                        {...professionalForm.register('bio')}
                      />
                    </Field>
                    <Field
                      label={t('practitioner.profile.yearsExperience')}
                      htmlFor="yoe"
                      className="mt-4 max-w-xs"
                      error={professionalForm.formState.errors.yearsOfExperience?.message}
                    >
                      <Input
                        id="yoe"
                        type="number"
                        min={0}
                        max={80}
                        {...professionalForm.register('yearsOfExperience', { valueAsNumber: true })}
                      />
                    </Field>
                  </FormSection>

                  <FormSection title={t('practitioner.profile.specialties')} description={t('practitioner.profile.specialtiesHint')}>
                    {specialtiesQuery.isLoading ? (
                      <p className="text-sm text-muted-foreground">{t('practitioner.profile.loadingSpecialties')}</p>
                    ) : null}
                    <div className="grid gap-2 sm:grid-cols-2">
                      {(specialtiesQuery.data ?? []).map((s) => {
                        const checked = selectedSpecialties.includes(s.id);
                        return (
                          <label
                            key={s.id}
                            className={cn(
                              'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors',
                              checked ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50',
                            )}
                          >
                            <input
                              type="checkbox"
                              className="size-4 rounded border-input"
                              checked={checked}
                              onChange={() => {
                                const next = checked
                                  ? selectedSpecialties.filter((id) => id !== s.id)
                                  : [...selectedSpecialties, s.id];
                                professionalForm.setValue('specialtyIds', next, { shouldDirty: true });
                              }}
                            />
                            <span>{s.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </FormSection>

                  <FormSection title={t('practitioner.profile.practiceLocation')}>
                    <div className="grid gap-5 md:grid-cols-3">
                      <Field label={t('practitioner.profile.city')} htmlFor="city" error={professionalForm.formState.errors.practiceCity?.message}>
                        <Input id="city" {...professionalForm.register('practiceCity')} />
                      </Field>
                      <Field label={t('practitioner.profile.state')} htmlFor="state" error={professionalForm.formState.errors.practiceState?.message}>
                        <Input id="state" {...professionalForm.register('practiceState')} />
                      </Field>
                      <Field label={t('practitioner.profile.country')} htmlFor="country" error={professionalForm.formState.errors.practiceCountry?.message}>
                        <Input id="country" {...professionalForm.register('practiceCountry')} />
                      </Field>
                    </div>
                  </FormSection>

                  <FormSection
                    title={t('practitioner.profile.signatureTitle')}
                    description={t('practitioner.profile.signatureHint')}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div className="flex h-24 min-w-[200px] items-center justify-center rounded-lg border border-dashed border-border bg-white px-4">
                        {signatureUrl ? (
                          <img
                            src={signatureUrl}
                            alt={t('practitioner.profile.yourSignature')}
                            className="max-h-20 max-w-full object-contain"
                          />
                        ) : (
                          <p className="text-center text-xs text-muted-foreground">{t('practitioner.profile.noSignature')}</p>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <input
                          ref={signatureRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            e.target.value = '';
                            if (!f) return;
                            if (!f.type.startsWith('image/')) {
                              toast.error('Use a PNG or JPG image.');
                              return;
                            }
                            if (f.size > 2 * 1024 * 1024) {
                              toast.error('Signature image must be 2MB or smaller.');
                              return;
                            }
                            uploadSignature.mutate(f);
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-2 bg-white"
                          disabled={uploadSignature.isPending}
                          onClick={() => signatureRef.current?.click()}
                        >
                          <PenLine className="h-4 w-4" aria-hidden />
                          {uploadSignature.isPending
                            ? t('common.loading')
                            : signatureUrl
                              ? t('practitioner.profile.replaceSignature')
                              : t('practitioner.profile.uploadSignature')}
                        </Button>
                        <p className="mt-2 text-xs text-muted-foreground">{t('practitioner.profile.signatureFormat')}</p>
                      </div>
                    </div>
                  </FormSection>

                  <FormSection title={t('practitioner.profile.languages')} description={t('practitioner.profile.languagesHint')}>
                    <Field
                      label={t('practitioner.profile.consultationLanguages')}
                      htmlFor="langs"
                      error={professionalForm.formState.errors.consultationLanguages?.message}
                    >
                      <Input id="langs" placeholder="English, Hausa" {...professionalForm.register('consultationLanguages')} />
                    </Field>
                  </FormSection>

                  <div className="flex justify-end border-t border-border/80 pt-6">
                    <Button
                      type="submit"
                      disabled={saveProfessional.isPending || !professionalForm.formState.isDirty}
                      className="min-w-[10rem]"
                    >
                      {saveProfessional.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving…
                        </>
                      ) : (
                        t('practitioner.profile.saveProfessional')
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="mt-0">
            <Card className="overflow-hidden border-border/80 shadow-sm">
              <CardHeader className="border-b bg-muted/25 pb-5">
                <div className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Lock className="h-5 w-5" aria-hidden />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <CardTitle className="text-lg">{t('practitioner.profile.securityTitle')}</CardTitle>
                    <CardDescription className="text-sm">{t('practitioner.profile.securityHint')}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-8">
                <form
                  className="mx-auto max-w-lg space-y-5"
                  onSubmit={pwdForm.handleSubmit((v) =>
                    changePwd.mutate({ currentPassword: v.currentPassword, newPassword: v.newPassword }),
                  )}
                >
                  <Field label={t('practitioner.profile.currentPassword')} htmlFor="cur" error={pwdForm.formState.errors.currentPassword?.message}>
                    <PasswordInput id="cur" autoComplete="current-password" {...pwdForm.register('currentPassword')} />
                  </Field>
                  <Field label={t('practitioner.profile.newPassword')} htmlFor="np" error={pwdForm.formState.errors.newPassword?.message}>
                    <PasswordInput id="np" autoComplete="new-password" maxLength={12} {...pwdForm.register('newPassword')} />
                  </Field>
                  <Field label={t('practitioner.profile.confirmPassword')} htmlFor="cp" error={pwdForm.formState.errors.confirmPassword?.message}>
                    <PasswordInput id="cp" autoComplete="new-password" maxLength={12} {...pwdForm.register('confirmPassword')} />
                  </Field>
                  <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={changePwd.isPending} className="min-w-[10rem]">
                      {changePwd.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t('common.loading')}
                        </>
                      ) : (
                        t('practitioner.profile.updatePassword')
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
