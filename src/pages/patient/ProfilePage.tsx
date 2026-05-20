import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, Loader2, Lock, UserRound } from 'lucide-react';
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
import { Select } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { changePassword } from '@/features/auth/api';
import { getPatientMe, patchPatientProfile, uploadPatientPhoto } from '@/features/patients/api';
import { normalizeAxiosError } from '@/lib/api/errors';
import { cn } from '@/lib/utils/cn';
import {
  patientDocToProfileForm,
  patientProfileFormSchema,
  profileFormToPatch,
  type PatientProfileFormValues,
} from '@/lib/validators/patient';
import { passwordSchema } from '@/lib/validators/auth';
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

export default function PatientProfilePage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const authUser = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const fileRef = useRef<HTMLInputElement>(null);

  const profile = useQuery({
    queryKey: ['patients', 'me'],
    queryFn: getPatientMe,
  });

  const form = useForm<PatientProfileFormValues>({
    resolver: zodResolver(patientProfileFormSchema),
    defaultValues: {
      firstName: '',
      middleName: '',
      lastName: '',
      phoneNumber: '',
      dateOfBirth: '',
      gender: '',
      bloodGroup: '',
    },
  });

  useEffect(() => {
    if (profile.data) {
      form.reset(patientDocToProfileForm(profile.data));
    }
  }, [profile.data, form]);

  const saveProfile = useMutation({
    mutationFn: (values: PatientProfileFormValues) => patchPatientProfile(profileFormToPatch(values)),
    onSuccess: async () => {
      toast.success(t('patient.profile.profileSaved'));
      await qc.invalidateQueries({ queryKey: ['patients', 'me'] });
    },
    onError: (e) => toast.error(normalizeAxiosError(e).message),
  });

  const uploadPhoto = useMutation({
    mutationFn: (file: File) => uploadPatientPhoto(file),
    onSuccess: async (result) => {
      const current = useAuthStore.getState().user;
      if (current) {
        setUser({ ...current, profilePhotoUrl: result.profilePhotoUrl });
      }
      toast.success(t('patient.profile.photoUpdated'));
      await qc.invalidateQueries({ queryKey: ['patients', 'me'] });
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
      toast.success(t('patient.profile.passwordUpdated'));
    },
    onError: (e) => {
      const err = normalizeAxiosError(e);
      toast.error(err.message);
    },
  });

  const photoUrl =
    typeof profile.data?.profilePhotoUrl === 'string' ? (profile.data.profilePhotoUrl as string) : undefined;

  const initials = `${authUser?.firstName?.[0] ?? ''}${authUser?.lastName?.[0] ?? ''}`.toUpperCase() || '?';

  return (
    <>
      <Helmet>
        <title>{t('patient.profile.title')}</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="mx-auto max-w-4xl space-y-8 pb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary">{t('patient.profile.badge')}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{t('patient.profile.heading')}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{t('patient.profile.introLong')}</p>
          </div>
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link to={ROUTES.patient.profileMedical}>{t('patient.profile.medicalLink')}</Link>
          </Button>
        </div>

        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid h-11 w-full max-w-md grid-cols-2">
            <TabsTrigger value="personal" className="gap-2">
              <UserRound className="h-4 w-4" aria-hidden />
              {t('patient.profile.tabPersonal')}
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Lock className="h-4 w-4" aria-hidden />
              {t('patient.profile.tabSecurity')}
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
                    <CardTitle className="text-lg">{t('patient.profile.personalTitle')}</CardTitle>
                    <CardDescription className="text-sm">
                      {t('patient.profile.signedInAs')}{' '}
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
                    <p className="text-sm font-medium text-foreground">{t('patient.profile.profilePhoto')}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{t('patient.profile.photoHintVideo')}</p>
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
                      {uploadPhoto.isPending ? t('common.loading') : t('patient.profile.changePhoto')}
                    </Button>
                    <p className="mt-2 text-xs text-muted-foreground">{t('patient.profile.photoFormat')}</p>
                  </div>
                </div>

                {profile.isLoading ? <p className="text-sm text-muted-foreground">Loading profile…</p> : null}
                {profile.isError ? (
                  <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    Could not load profile.
                  </p>
                ) : null}

                <form
                  className={cn('space-y-8', profile.isLoading && 'pointer-events-none opacity-60')}
                  onSubmit={form.handleSubmit((v) => saveProfile.mutate(v))}
                >
                  <FormSection title={t('patient.profile.legalName')} description={t('practitioner.profile.legalNameHint')}>
                    <div className="grid gap-5 md:grid-cols-3">
                      <Field label={t('patient.profile.firstName')} htmlFor="firstName" error={form.formState.errors.firstName?.message}>
                        <Input id="firstName" autoComplete="given-name" {...form.register('firstName')} />
                      </Field>
                      <Field label={t('patient.profile.middleName')} htmlFor="middleName" error={form.formState.errors.middleName?.message}>
                        <Input id="middleName" autoComplete="additional-name" {...form.register('middleName')} />
                      </Field>
                      <Field label={t('patient.profile.lastName')} htmlFor="lastName" error={form.formState.errors.lastName?.message}>
                        <Input id="lastName" autoComplete="family-name" {...form.register('lastName')} />
                      </Field>
                    </div>
                  </FormSection>

                  <FormSection title="Contact" description="How we reach you about appointments and care.">
                    <div className="grid gap-5 md:grid-cols-2">
                      <Field label={t('patient.profile.phoneNumber')} htmlFor="phoneNumber" error={form.formState.errors.phoneNumber?.message}>
                        <Input id="phoneNumber" type="tel" autoComplete="tel" placeholder="+234 …" {...form.register('phoneNumber')} />
                      </Field>
                      <Field label={t('patient.profile.dateOfBirth')} htmlFor="dob">
                        <Input id="dob" type="date" autoComplete="bday" {...form.register('dateOfBirth')} />
                      </Field>
                    </div>
                  </FormSection>

                  <FormSection title="Health basics" description="Optional details for your clinical record.">
                    <div className="grid gap-5 md:grid-cols-2">
                      <Field label={t('patient.profile.gender')} htmlFor="gender">
                        <Select id="gender" {...form.register('gender')}>
                          <option value="">Prefer not to say</option>
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                          <option value="OTHER">Other</option>
                          <option value="PREFER_NOT_SAY">Prefer not to say</option>
                        </Select>
                      </Field>
                      <Field label={t('patient.profile.bloodGroup')} htmlFor="blood">
                        <Select id="blood" {...form.register('bloodGroup')}>
                          <option value="">Not specified</option>
                          <option value="A_POS">A+</option>
                          <option value="A_NEG">A−</option>
                          <option value="B_POS">B+</option>
                          <option value="B_NEG">B−</option>
                          <option value="AB_POS">AB+</option>
                          <option value="AB_NEG">AB−</option>
                          <option value="O_POS">O+</option>
                          <option value="O_NEG">O−</option>
                          <option value="UNKNOWN">Unknown</option>
                        </Select>
                      </Field>
                    </div>
                  </FormSection>

                  <div className="flex justify-end border-t border-border/80 pt-6">
                    <Button type="submit" disabled={saveProfile.isPending || !form.formState.isDirty} className="min-w-[10rem]">
                      {saveProfile.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving…
                        </>
                      ) : (
                        t('patient.profile.saveChanges')
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
                    <CardTitle className="text-lg">{t('patient.profile.securityTitle')}</CardTitle>
                    <CardDescription className="text-sm">
                      Choose a strong password. Other signed-in devices will need to log in again after you update.
                    </CardDescription>
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
                  <Field label={t('patient.profile.currentPassword')} htmlFor="cur" error={pwdForm.formState.errors.currentPassword?.message}>
                    <PasswordInput id="cur" autoComplete="current-password" {...pwdForm.register('currentPassword')} />
                  </Field>
                  <Field label={t('patient.profile.newPassword')} htmlFor="np" error={pwdForm.formState.errors.newPassword?.message}>
                    <PasswordInput id="np" autoComplete="new-password" maxLength={12} {...pwdForm.register('newPassword')} />
                  </Field>
                  <Field label={t('patient.profile.confirmPassword')} htmlFor="cp" error={pwdForm.formState.errors.confirmPassword?.message}>
                    <PasswordInput id="cp" autoComplete="new-password" maxLength={12} {...pwdForm.register('confirmPassword')} />
                  </Field>
                  <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={changePwd.isPending} className="min-w-[10rem]">
                      {changePwd.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating…
                        </>
                      ) : (
                        t('patient.profile.updatePassword')
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
