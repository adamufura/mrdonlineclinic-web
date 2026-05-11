import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getPatientMe, patchPatientMedical } from '@/features/patients/api';
import { normalizeAxiosError } from '@/lib/api/errors';
import {
  medicalFormToPatch,
  patientDocToMedicalForm,
  patientMedicalFormSchema,
  type PatientMedicalFormValues,
} from '@/lib/validators/patient';
import { ROUTES } from '@/router/routes';

export default function PatientMedicalInfoPage() {
  const qc = useQueryClient();

  const profile = useQuery({
    queryKey: ['patients', 'me'],
    queryFn: getPatientMe,
  });

  const form = useForm<PatientMedicalFormValues>({
    resolver: zodResolver(patientMedicalFormSchema),
    defaultValues: {
      allergiesText: '',
      chronicConditionsText: '',
      currentMedicationsText: '',
      emergencyName: '',
      emergencyRelationship: '',
      emergencyPhone: '',
      addressStreet: '',
      addressCity: '',
      addressState: '',
      addressCountry: '',
      addressPostalCode: '',
    },
  });

  useEffect(() => {
    if (profile.data) {
      form.reset(patientDocToMedicalForm(profile.data));
    }
  }, [profile.data, form]);

  const save = useMutation({
    mutationFn: (values: PatientMedicalFormValues) => patchPatientMedical(medicalFormToPatch(values)),
    onSuccess: async () => {
      toast.success('Medical information saved');
      await qc.invalidateQueries({ queryKey: ['patients', 'me'] });
    },
    onError: (e) => toast.error(normalizeAxiosError(e).message),
  });

  return (
    <>
      <Helmet>
        <title>Medical info — MRD Online Clinic</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Medical information</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Saved with <code className="rounded bg-muted px-1">PATCH /api/v1/patients/me/medical</code>. List fields are one
              entry per line. Clearing a list saves an empty array.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to={ROUTES.patient.profile}>Back to profile</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Health record</CardTitle>
            <CardDescription>Allergies, conditions, medications, emergency contact, and address.</CardDescription>
          </CardHeader>
          <CardContent>
            {profile.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
            {profile.isError ? <p className="text-sm text-destructive">Could not load profile.</p> : null}

            <form
              className="mt-4 space-y-6"
              onSubmit={form.handleSubmit((v) => {
                save.mutate(v);
              })}
            >
              <div className="space-y-2">
                <Label htmlFor="allergies">Allergies (one per line)</Label>
                <Textarea id="allergies" rows={4} {...form.register('allergiesText')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="chronic">Chronic conditions (one per line)</Label>
                <Textarea id="chronic" rows={4} {...form.register('chronicConditionsText')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meds">Current medications (one per line)</Label>
                <Textarea id="meds" rows={4} {...form.register('currentMedicationsText')} />
              </div>

              <div className="rounded-lg border border-border p-4">
                <h3 className="text-sm font-semibold">Emergency contact</h3>
                <p className="mt-1 text-xs text-muted-foreground">Leave all three empty to skip updating this block.</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="en">Name</Label>
                    <Input id="en" {...form.register('emergencyName')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="er">Relationship</Label>
                    <Input id="er" {...form.register('emergencyRelationship')} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="ep">Phone</Label>
                    <Input id="ep" type="tel" {...form.register('emergencyPhone')} />
                  </div>
                </div>
                {form.formState.errors.emergencyName ? (
                  <p className="mt-2 text-sm text-destructive">{form.formState.errors.emergencyName.message}</p>
                ) : null}
              </div>

              <div className="rounded-lg border border-border p-4">
                <h3 className="text-sm font-semibold">Address</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="st">Street</Label>
                    <Input id="st" {...form.register('addressStreet')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" {...form.register('addressCity')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State / region</Label>
                    <Input id="state" {...form.register('addressState')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" {...form.register('addressCountry')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip">Postal code</Label>
                    <Input id="zip" {...form.register('addressPostalCode')} />
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={save.isPending || !form.formState.isDirty}>
                {save.isPending ? 'Saving…' : 'Save medical information'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
