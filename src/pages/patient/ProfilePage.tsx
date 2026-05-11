import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { changePassword } from '@/features/auth/api';
import { getPatientMe, patchPatientProfile, uploadPatientPhoto } from '@/features/patients/api';
import { normalizeAxiosError } from '@/lib/api/errors';
import {
  patientDocToProfileForm,
  patientProfileFormSchema,
  profileFormToPatch,
  type PatientProfileFormValues,
} from '@/lib/validators/patient';
import { strongPasswordSchema } from '@/lib/validators/auth';
import { ROUTES } from '@/router/routes';
import { useAuthStore } from '@/stores/auth-store';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Required'),
    newPassword: strongPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' });

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export default function PatientProfilePage() {
  const qc = useQueryClient();
  const authUser = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
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
      toast.success('Profile saved');
      await qc.invalidateQueries({ queryKey: ['patients', 'me'] });
    },
    onError: (e) => toast.error(normalizeAxiosError(e).message),
  });

  const uploadPhoto = useMutation({
    mutationFn: (file: File) => uploadPatientPhoto(file),
    onSuccess: async () => {
      toast.success('Photo updated');
      await qc.invalidateQueries({ queryKey: ['patients', 'me'] });
    },
    onError: (e) => toast.error(normalizeAxiosError(e).message),
  });

  const pwdForm = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const changePwd = useMutation({
    mutationFn: (v: Pick<ChangePasswordValues, 'currentPassword' | 'newPassword'>) => changePassword(v.currentPassword, v.newPassword),
    onSuccess: async () => {
      toast.success('Password changed. Please sign in again.');
      clearSession();
      window.location.assign(ROUTES.login);
    },
    onError: (e) => toast.error(normalizeAxiosError(e).message),
  });

  const photoUrl =
    typeof profile.data?.profilePhotoUrl === 'string' ? (profile.data.profilePhotoUrl as string) : undefined;

  return (
    <>
      <Helmet>
        <title>Profile — MRD Online Clinic</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Profile</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Personal details use <code className="rounded bg-muted px-1">PATCH /api/v1/patients/me</code>. Photo uses{' '}
              <code className="rounded bg-muted px-1">POST /api/v1/patients/me/photo</code> (multipart field{' '}
              <code className="rounded bg-muted px-1">file</code>).
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to={ROUTES.patient.profileMedical}>Medical information</Link>
          </Button>
        </div>

        <Tabs defaultValue="personal">
          <TabsList>
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle>Personal information</CardTitle>
                <CardDescription>Email from your account: {authUser?.email}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                  {photoUrl ? (
                    <img src={photoUrl} alt="" className="size-24 rounded-full object-cover ring-2 ring-border" />
                  ) : (
                    <div className="flex size-24 items-center justify-center rounded-full bg-muted text-lg font-medium text-muted-foreground">
                      {authUser?.firstName?.[0]}
                      {authUser?.lastName?.[0]}
                    </div>
                  )}
                  <div>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadPhoto.mutate(f);
                        e.target.value = '';
                      }}
                    />
                    <Button type="button" variant="outline" size="sm" disabled={uploadPhoto.isPending} onClick={() => fileRef.current?.click()}>
                      {uploadPhoto.isPending ? 'Uploading…' : 'Change photo'}
                    </Button>
                    <p className="mt-2 text-xs text-muted-foreground">Images only, max 5MB.</p>
                  </div>
                </div>

                {profile.isLoading ? <p className="text-sm text-muted-foreground">Loading profile…</p> : null}
                {profile.isError ? <p className="text-sm text-destructive">Could not load profile.</p> : null}

                <form
                  className="space-y-4"
                  onSubmit={form.handleSubmit((v) => {
                    saveProfile.mutate(v);
                  })}
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First name</Label>
                      <Input id="firstName" {...form.register('firstName')} />
                      {form.formState.errors.firstName ? (
                        <p className="text-sm text-destructive">{form.formState.errors.firstName.message}</p>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="middleName">Middle name</Label>
                      <Input id="middleName" autoComplete="additional-name" {...form.register('middleName')} />
                      {form.formState.errors.middleName ? (
                        <p className="text-sm text-destructive">{form.formState.errors.middleName.message}</p>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last name</Label>
                      <Input id="lastName" {...form.register('lastName')} />
                      {form.formState.errors.lastName ? (
                        <p className="text-sm text-destructive">{form.formState.errors.lastName.message}</p>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">Phone</Label>
                      <Input id="phoneNumber" type="tel" {...form.register('phoneNumber')} />
                      {form.formState.errors.phoneNumber ? (
                        <p className="text-sm text-destructive">{form.formState.errors.phoneNumber.message}</p>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dob">Date of birth</Label>
                      <Input id="dob" type="date" {...form.register('dateOfBirth')} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <select
                        id="gender"
                        className="flex h-10 w-full rounded-lg border border-border bg-white px-3 text-sm dark:bg-zinc-950"
                        {...form.register('gender')}
                      >
                        <option value="">Prefer not to say</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                        <option value="PREFER_NOT_SAY">Prefer not to say (explicit)</option>
                      </select>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="blood">Blood group</Label>
                      <select
                        id="blood"
                        className="flex h-10 w-full max-w-md rounded-lg border border-border bg-white px-3 text-sm dark:bg-zinc-950"
                        {...form.register('bloodGroup')}
                      >
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
                      </select>
                    </div>
                  </div>
                  <Button type="submit" disabled={saveProfile.isPending || !form.formState.isDirty}>
                    {saveProfile.isPending ? 'Saving…' : 'Save changes'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Change password</CardTitle>
                <CardDescription>
                  Uses <code className="rounded bg-muted px-1">POST /api/v1/auth/change-password</code>. You will be signed out
                  after a successful change.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  className="max-w-md space-y-4"
                  onSubmit={pwdForm.handleSubmit((v) => changePwd.mutate({ currentPassword: v.currentPassword, newPassword: v.newPassword }))}
                >
                  <div className="space-y-2">
                    <Label htmlFor="cur">Current password</Label>
                    <Input id="cur" type="password" autoComplete="current-password" {...pwdForm.register('currentPassword')} />
                    {pwdForm.formState.errors.currentPassword ? (
                      <p className="text-sm text-destructive">{pwdForm.formState.errors.currentPassword.message}</p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="np">New password</Label>
                    <Input id="np" type="password" autoComplete="new-password" {...pwdForm.register('newPassword')} />
                    {pwdForm.formState.errors.newPassword ? (
                      <p className="text-sm text-destructive">{pwdForm.formState.errors.newPassword.message}</p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cp">Confirm new password</Label>
                    <Input id="cp" type="password" autoComplete="new-password" {...pwdForm.register('confirmPassword')} />
                    {pwdForm.formState.errors.confirmPassword ? (
                      <p className="text-sm text-destructive">{pwdForm.formState.errors.confirmPassword.message}</p>
                    ) : null}
                  </div>
                  <Button type="submit" disabled={changePwd.isPending}>
                    {changePwd.isPending ? 'Updating…' : 'Update password'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
