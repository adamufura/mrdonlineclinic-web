import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, FileUp, Loader2, ShieldCheck } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  getPractitionerMe,
  patchPractitionerProfile,
  uploadPractitionerCredentials,
} from '@/features/practitioners/session-api';
import { normalizeAxiosError } from '@/lib/api/errors';
import { cn } from '@/lib/utils/cn';
import {
  practitionerCredentialsSchema,
  practitionerDocToCredentialsForm,
  type PractitionerCredentialsValues,
} from '@/lib/validators/practitioner-profile';
import { ROUTES } from '@/router/routes';

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  PENDING_REVIEW: { label: 'Under review', className: 'bg-amber-100 text-amber-900 border-amber-200' },
  VERIFIED: { label: 'Verified', className: 'bg-teal-100 text-teal-900 border-teal-200' },
  REJECTED: { label: 'Needs attention', className: 'bg-red-100 text-red-900 border-red-200' },
  PENDING: { label: 'Not submitted', className: 'bg-slate-100 text-slate-800 border-slate-200' },
};

export default function PractitionerCredentialsPage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const profile = useQuery({
    queryKey: ['practitioners', 'me'],
    queryFn: getPractitionerMe,
  });

  const form = useForm<PractitionerCredentialsValues>({
    resolver: zodResolver(practitionerCredentialsSchema),
    defaultValues: { licenseNumber: '' },
  });

  useEffect(() => {
    if (profile.data) {
      form.reset(practitionerDocToCredentialsForm(profile.data));
    }
  }, [profile.data, form]);

  const saveLicense = useMutation({
    mutationFn: (values: PractitionerCredentialsValues) =>
      patchPractitionerProfile({ licenseNumber: values.licenseNumber.trim() }),
    onSuccess: async () => {
      toast.success('License number saved');
      await qc.invalidateQueries({ queryKey: ['practitioners', 'me'] });
    },
    onError: (e) => toast.error(normalizeAxiosError(e).message),
  });

  const uploadDoc = useMutation({
    mutationFn: (file: File) => uploadPractitionerCredentials(file),
    onSuccess: async () => {
      toast.success('License document submitted for review');
      await qc.invalidateQueries({ queryKey: ['practitioners', 'me'] });
    },
    onError: (e) => toast.error(normalizeAxiosError(e).message),
  });

  const status =
    typeof profile.data?.verificationStatus === 'string' ? profile.data.verificationStatus : 'PENDING';
  const statusUi = STATUS_LABEL[status] ?? STATUS_LABEL.PENDING;
  const notes =
    typeof profile.data?.verificationNotes === 'string' ? profile.data.verificationNotes : undefined;
  const docUrl =
    typeof profile.data?.licenseDocumentUrl === 'string' ? profile.data.licenseDocumentUrl : undefined;

  return (
    <>
      <Helmet>
        <title>Credentials — MRD Online Clinic</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="mx-auto max-w-3xl space-y-8 pb-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-primary">Verification</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Credentials</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Submit your medical license number and document so administrators can verify your practice. Patients see you
            on the directory after approval.
          </p>
        </div>

        <Card className="overflow-hidden border-border/80 shadow-sm">
          <CardHeader className="border-b bg-muted/25 pb-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ShieldCheck className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0 space-y-1">
                  <CardTitle className="text-lg">Verification status</CardTitle>
                  <CardDescription className="text-sm">
                    {status === 'VERIFIED'
                      ? 'Your credentials are approved. You appear on Find a doctor when booking is enabled.'
                      : status === 'PENDING_REVIEW'
                        ? 'Our team is reviewing your submission — usually within 24 hours.'
                        : status === 'REJECTED'
                          ? 'Please update your license details and resubmit.'
                          : 'Upload your license document to start verification.'}
                  </CardDescription>
                </div>
              </div>
              <span
                className={cn(
                  'inline-flex shrink-0 rounded-full border px-3 py-1 text-xs font-semibold',
                  statusUi.className,
                )}
              >
                {statusUi.label}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-8 pt-8">
            {status === 'REJECTED' && notes ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                <p className="font-medium">Admin note</p>
                <p className="mt-1">{notes}</p>
              </div>
            ) : null}

            <form
              className="space-y-4"
              onSubmit={form.handleSubmit((v) => saveLicense.mutate(v))}
            >
              <div className="space-y-2">
                <Label htmlFor="license-num">Medical license number</Label>
                <Input
                  id="license-num"
                  placeholder="e.g. MD/12345/2020"
                  {...form.register('licenseNumber')}
                />
                {form.formState.errors.licenseNumber ? (
                  <p className="text-sm text-destructive">{form.formState.errors.licenseNumber.message}</p>
                ) : null}
              </div>
              <Button type="submit" variant="outline" disabled={saveLicense.isPending || !form.formState.isDirty}>
                {saveLicense.isPending ? 'Saving…' : 'Save license number'}
              </Button>
            </form>

            <div className="border-t border-border/80 pt-8">
              <p className="text-sm font-medium text-foreground">License document</p>
              <p className="mt-1 text-sm text-muted-foreground">
                PDF or image (JPG, PNG), max 10MB. Uploading a new file resubmits for review.
              </p>
              {docUrl ? (
                <p className="mt-3 text-sm">
                  <a
                    href={docUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                  >
                    View current document
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  </a>
                </p>
              ) : null}
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = '';
                  if (!f) return;
                  const okType =
                    f.type === 'application/pdf' || f.type.startsWith('image/');
                  if (!okType) {
                    toast.error('Please choose a PDF or image file.');
                    return;
                  }
                  if (f.size > 10 * 1024 * 1024) {
                    toast.error('File must be 10MB or smaller.');
                    return;
                  }
                  uploadDoc.mutate(f);
                }}
              />
              <Button
                type="button"
                className="mt-4 gap-2"
                disabled={uploadDoc.isPending}
                onClick={() => fileRef.current?.click()}
              >
                {uploadDoc.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <FileUp className="h-4 w-4" />
                    {docUrl ? 'Replace license document' : 'Upload license document'}
                  </>
                )}
              </Button>
            </div>

            <div className="rounded-xl border border-border bg-secondary/30 px-4 py-3 text-sm text-muted-foreground">
              Personal details and your profile photo are in{' '}
              <Link to={ROUTES.practitioner.profile} className="font-medium text-primary hover:underline">
                My account
              </Link>
              .
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
