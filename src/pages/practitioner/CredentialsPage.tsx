import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, FileUp, Loader2, ShieldCheck } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
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

const STATUS_CLASS: Record<string, string> = {
  PENDING_REVIEW: 'bg-amber-100 text-amber-900 border-amber-200',
  VERIFIED: 'bg-teal-100 text-teal-900 border-teal-200',
  REJECTED: 'bg-red-100 text-red-900 border-red-200',
  PENDING: 'bg-slate-100 text-slate-800 border-slate-200',
};

export default function PractitionerCredentialsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const statusLabel = (status: string): string => {
    switch (status) {
      case 'PENDING_REVIEW':
        return t('practitioner.credentials.underReview');
      case 'VERIFIED':
        return t('practitioner.credentials.verified');
      case 'REJECTED':
        return t('practitioner.credentials.needsAttention');
      default:
        return t('practitioner.credentials.notSubmitted');
    }
  };

  const statusDescription = (status: string): string => {
    switch (status) {
      case 'VERIFIED':
        return t('practitioner.credentials.statusVerified');
      case 'PENDING_REVIEW':
        return t('practitioner.credentials.statusReview');
      case 'REJECTED':
        return t('practitioner.credentials.statusRejected');
      default:
        return t('practitioner.credentials.statusPending');
    }
  };

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
      toast.success(t('practitioner.credentials.licenseSaved'));
      await qc.invalidateQueries({ queryKey: ['practitioners', 'me'] });
    },
    onError: (e) => toast.error(normalizeAxiosError(e).message),
  });

  const uploadDoc = useMutation({
    mutationFn: (file: File) => uploadPractitionerCredentials(file),
    onSuccess: async () => {
      toast.success(t('practitioner.credentials.submitted'));
      await qc.invalidateQueries({ queryKey: ['practitioners', 'me'] });
    },
    onError: (e) => toast.error(normalizeAxiosError(e).message),
  });

  const status =
    typeof profile.data?.verificationStatus === 'string' ? profile.data.verificationStatus : 'PENDING';
  const statusClass = STATUS_CLASS[status] ?? STATUS_CLASS.PENDING;
  const notes =
    typeof profile.data?.verificationNotes === 'string' ? profile.data.verificationNotes : undefined;
  const docUrl =
    typeof profile.data?.licenseDocumentUrl === 'string' ? profile.data.licenseDocumentUrl : undefined;

  return (
    <>
      <Helmet>
        <title>{t('practitioner.credentials.title')}</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="mx-auto max-w-3xl space-y-8 pb-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-primary">{t('practitioner.credentials.badge')}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{t('practitioner.credentials.heading')}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {t('practitioner.credentials.description')}
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
                  <CardTitle className="text-lg">{t('practitioner.credentials.statusTitle')}</CardTitle>
                  <CardDescription className="text-sm">{statusDescription(status)}</CardDescription>
                </div>
              </div>
              <span
                className={cn(
                  'inline-flex shrink-0 rounded-full border px-3 py-1 text-xs font-semibold',
                  statusClass,
                )}
              >
                {statusLabel(status)}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-8 pt-8">
            {status === 'REJECTED' && notes ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                <p className="font-medium">{t('practitioner.credentials.needsAttention')}</p>
                <p className="mt-1">{notes}</p>
              </div>
            ) : null}

            <form className="space-y-4" onSubmit={form.handleSubmit((v) => saveLicense.mutate(v))}>
              <div className="space-y-2">
                <Label htmlFor="license-num">{t('practitioner.credentials.licenseNumber')}</Label>
                <Input id="license-num" placeholder="e.g. MD/12345/2020" {...form.register('licenseNumber')} />
                {form.formState.errors.licenseNumber ? (
                  <p className="text-sm text-destructive">{form.formState.errors.licenseNumber.message}</p>
                ) : null}
              </div>
              <Button type="submit" variant="outline" disabled={saveLicense.isPending || !form.formState.isDirty}>
                {saveLicense.isPending ? t('common.loading') : t('practitioner.credentials.saveLicense')}
              </Button>
            </form>

            <div className="border-t border-border/80 pt-8">
              <p className="text-sm font-medium text-foreground">{t('practitioner.credentials.licenseDocument')}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t('practitioner.credentials.uploadHint')}</p>
              {docUrl ? (
                <p className="mt-3 text-sm">
                  <a
                    href={docUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                  >
                    {t('practitioner.credentials.viewDocument')}
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
                  const okType = f.type === 'application/pdf' || f.type.startsWith('image/');
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
                    {t('common.loading')}
                  </>
                ) : (
                  <>
                    <FileUp className="h-4 w-4" />
                    {docUrl ? t('practitioner.credentials.replaceDocument') : t('practitioner.credentials.licenseDocument')}
                  </>
                )}
              </Button>
            </div>

            <div className="rounded-xl border border-border bg-secondary/30 px-4 py-3 text-sm text-muted-foreground">
              {t('practitioner.credentials.accountNote')}{' '}
              <Link to={ROUTES.practitioner.profile} className="font-medium text-primary hover:underline">
                {t('practitioner.credentials.myAccountLink')}
              </Link>
              .
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
