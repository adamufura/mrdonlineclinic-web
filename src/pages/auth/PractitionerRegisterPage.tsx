import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { useForm, useWatch } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { registerPractitioner } from '@/features/auth/api';
import { listPublicSpecialties } from '@/features/specialties/api';
import { normalizeAxiosError } from '@/lib/api/errors';
import { mongoIdSchema, strongPasswordSchema } from '@/lib/validators/auth';
import { cn } from '@/lib/utils/cn';
import { ROUTES } from '@/router/routes';

const schema = z
  .object({
    firstName: z.string().min(1, 'Required'),
    middleName: z.string().optional(),
    lastName: z.string().min(1, 'Required'),
    email: z.string().email(),
    phoneNumber: z.string().min(5, 'Enter a valid phone number'),
    password: strongPasswordSchema,
    confirmPassword: z.string(),
    specialties: z.array(mongoIdSchema).min(1, 'Select at least one specialty'),
    acceptTerms: z.boolean().refine((v) => v === true, { message: 'You must accept the terms' }),
  })
  .refine((d) => d.password === d.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' });

type FormValues = z.infer<typeof schema>;

export default function PractitionerRegisterPage() {
  const specialtiesQuery = useQuery({
    queryKey: ['specialties', 'public'],
    queryFn: listPublicSpecialties,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '',
      middleName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
      specialties: [],
      acceptTerms: false,
    },
  });

  const selected = useWatch({ control: form.control, name: 'specialties', defaultValue: [] });

  function toggleSpecialty(id: string) {
    const set = new Set(selected);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    form.setValue('specialties', [...set], { shouldValidate: true });
  }

  const mutation = useMutation({
    mutationFn: registerPractitioner,
    onSuccess: () => {
      toast.success('Check your email to verify your account.');
    },
    onError: (e) => {
      toast.error(normalizeAxiosError(e).message);
    },
  });

  return (
    <>
      <Helmet>
        <title>Practitioner registration — MRD Online Clinic</title>
      </Helmet>
      <Card className="border-0 shadow-none sm:border sm:shadow-sm">
        <CardHeader>
          <CardTitle>Practitioner sign up</CardTitle>
          <CardDescription>
            After you verify your email, you will complete your professional profile and submit credentials for admin review
            before accepting patients.
          </CardDescription>
        </CardHeader>
        <form
          onSubmit={form.handleSubmit(
            ({ firstName, middleName, lastName, email, phoneNumber, password, specialties }) => {
              mutation.mutate({ firstName, middleName, lastName, email, phoneNumber, password, specialties });
            },
          )}
        >
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Specialties</Label>
              {specialtiesQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading specialties…</p>
              ) : specialtiesQuery.isError ? (
                <p className="text-sm text-destructive">Could not load specialties. Is the API running?</p>
              ) : (
                <ul className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-border p-3 text-sm">
                  {specialtiesQuery.data?.map((s) => {
                    const on = selected.includes(s.id);
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => toggleSpecialty(s.id)}
                          className={cn(
                            'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left hover:bg-muted',
                            on && 'bg-muted font-medium',
                          )}
                        >
                          {s.name}
                          <span className="text-xs text-muted-foreground">{on ? 'Selected' : 'Tap to select'}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              {form.formState.errors.specialties ? (
                <p className="text-sm text-destructive">{form.formState.errors.specialties.message}</p>
              ) : null}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" {...form.register('firstName')} />
              {form.formState.errors.firstName ? (
                <p className="text-sm text-destructive">{form.formState.errors.firstName.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="middleName">Middle name (optional)</Label>
              <Input id="middleName" {...form.register('middleName')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" {...form.register('lastName')} />
              {form.formState.errors.lastName ? (
                <p className="text-sm text-destructive">{form.formState.errors.lastName.message}</p>
              ) : null}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...form.register('email')} />
              {form.formState.errors.email ? (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              ) : null}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="phoneNumber">Phone number</Label>
              <Input id="phoneNumber" type="tel" {...form.register('phoneNumber')} />
              {form.formState.errors.phoneNumber ? (
                <p className="text-sm text-destructive">{form.formState.errors.phoneNumber.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...form.register('password')} />
              {form.formState.errors.password ? (
                <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input id="confirmPassword" type="password" {...form.register('confirmPassword')} />
              {form.formState.errors.confirmPassword ? (
                <p className="text-sm text-destructive">{form.formState.errors.confirmPassword.message}</p>
              ) : null}
            </div>
            <label className="flex items-start gap-2 text-sm sm:col-span-2">
              <input type="checkbox" {...form.register('acceptTerms')} />
              <span>I agree to the terms of service and privacy policy.</span>
            </label>
            {form.formState.errors.acceptTerms ? (
              <p className="text-sm text-destructive sm:col-span-2">{form.formState.errors.acceptTerms.message}</p>
            ) : null}
          </CardContent>
          <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <Button type="submit" disabled={mutation.isPending || specialtiesQuery.isLoading}>
              {mutation.isPending ? 'Creating account…' : 'Create account'}
            </Button>
            <Link to={ROUTES.login} className="text-sm text-primary hover:underline">
              Back to log in
            </Link>
          </CardFooter>
        </form>
      </Card>
    </>
  );
}
