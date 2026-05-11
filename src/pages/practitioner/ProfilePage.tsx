import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getPractitionerMe, patchPractitionerProfile } from '@/features/practitioners/session-api';
import { normalizeAxiosError } from '@/lib/api/errors';
import {
  practitionerDocToPersonalForm,
  practitionerPersonalProfileSchema,
  type PractitionerPersonalProfileValues,
} from '@/lib/validators/practitioner-profile';
import { useAuthStore } from '@/stores/auth-store';

export default function PractitionerProfilePage() {
  const qc = useQueryClient();
  const authUser = useAuthStore((s) => s.user);

  const profile = useQuery({
    queryKey: ['practitioners', 'me'],
    queryFn: getPractitionerMe,
  });

  const form = useForm<PractitionerPersonalProfileValues>({
    resolver: zodResolver(practitionerPersonalProfileSchema),
    defaultValues: {
      firstName: '',
      middleName: '',
      lastName: '',
      phoneNumber: '',
    },
  });

  useEffect(() => {
    if (profile.data) {
      form.reset(practitionerDocToPersonalForm(profile.data));
    }
  }, [profile.data, form]);

  const saveProfile = useMutation({
    mutationFn: (values: PractitionerPersonalProfileValues) => patchPractitionerProfile(values),
    onSuccess: async () => {
      toast.success('Profile saved');
      await qc.invalidateQueries({ queryKey: ['practitioners', 'me'] });
    },
    onError: (e) => toast.error(normalizeAxiosError(e).message),
  });

  return (
    <>
      <Helmet>
        <title>Profile — MRD Online Clinic</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Professional profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Legal name and phone can be updated here. Middle name is required on your profile (not collected at sign-up).
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Personal information</CardTitle>
            <CardDescription>Email from your account: {authUser?.email}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
                  <Label htmlFor="pf-first">First name</Label>
                  <Input id="pf-first" {...form.register('firstName')} />
                  {form.formState.errors.firstName ? (
                    <p className="text-sm text-destructive">{form.formState.errors.firstName.message}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pf-middle">Middle name</Label>
                  <Input id="pf-middle" {...form.register('middleName')} />
                  {form.formState.errors.middleName ? (
                    <p className="text-sm text-destructive">{form.formState.errors.middleName.message}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pf-last">Last name</Label>
                  <Input id="pf-last" {...form.register('lastName')} />
                  {form.formState.errors.lastName ? (
                    <p className="text-sm text-destructive">{form.formState.errors.lastName.message}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pf-phone">Phone</Label>
                  <Input id="pf-phone" type="tel" {...form.register('phoneNumber')} />
                  {form.formState.errors.phoneNumber ? (
                    <p className="text-sm text-destructive">{form.formState.errors.phoneNumber.message}</p>
                  ) : null}
                </div>
              </div>
              <Button type="submit" disabled={saveProfile.isPending || !form.formState.isDirty}>
                {saveProfile.isPending ? 'Saving…' : 'Save changes'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
