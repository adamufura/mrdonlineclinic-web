import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Download, FileText, Loader2, Pill } from 'lucide-react';
import { useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { listPatientPrescriptions } from '@/features/patients/api';
import { cn } from '@/lib/utils/cn';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function practitionerName(rx: Record<string, unknown>): string {
  const pr = rx.practitioner;
  if (!isRecord(pr)) return 'Your clinician';
  const n = `${String(pr.firstName ?? '')} ${String(pr.lastName ?? '')}`.trim();
  return n ? `Dr. ${n}` : 'Your clinician';
}

function firstMedicationLine(rx: Record<string, unknown>): string {
  const meds = rx.medications;
  if (!Array.isArray(meds) || meds.length === 0) return 'Prescription';
  const m0 = meds[0];
  if (!isRecord(m0)) return 'Prescription';
  const name = String(m0.drugName ?? 'Medication');
  const dose = String(m0.dosage ?? '');
  const freq = String(m0.frequency ?? '');
  const parts = [name + (dose ? ` ${dose}` : ''), freq].filter(Boolean);
  return parts.join(' · ') || name;
}

function medicationCount(rx: Record<string, unknown>): number {
  const meds = rx.medications;
  return Array.isArray(meds) ? meds.length : 0;
}

export default function PatientPrescriptionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);

  const listQuery = useQuery({
    queryKey: ['patients', 'prescriptions', { page }],
    queryFn: () => listPatientPrescriptions({ page, limit: 20 }),
  });

  const setPage = useCallback(
    (nextPage: number) => {
      const nextParams = new URLSearchParams(searchParams);
      if (nextPage <= 1) nextParams.delete('page');
      else nextParams.set('page', String(nextPage));
      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const items = listQuery.data?.items ?? [];
  const meta = listQuery.data?.meta;
  const totalPages = meta?.totalPages ?? 1;

  return (
    <>
      <Helmet>
        <title>Prescriptions — MRD Online Clinic</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-[#64748b]">
              <Pill className="size-3.5 text-rose-500" aria-hidden />
              Your care
            </p>
            <h1 className="font-display text-3xl font-normal tracking-tight text-[#0a1628]">Prescriptions</h1>
            <p className="mt-2 max-w-2xl text-sm text-[#64748b]">
              View and download prescriptions issued by your clinicians after completed visits.
            </p>
          </div>
          {listQuery.isSuccess && meta ? (
            <p className="text-sm text-[#64748b]">
              <span className="font-semibold text-[#0a1628]">{meta.total}</span> total
            </p>
          ) : null}
        </div>

        {/* Content */}
        <section className="overflow-hidden rounded-[18px] border border-[#e2e8f0] bg-white shadow-sm">
          {listQuery.isLoading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-[#64748b]">
              <Loader2 className="size-5 animate-spin text-sky-600" aria-hidden />
              Loading prescriptions…
            </div>
          ) : null}

          {listQuery.isError ? (
            <p className="p-8 text-sm text-destructive">Could not load prescriptions. Try again shortly.</p>
          ) : null}

          {listQuery.isSuccess && items.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-rose-50">
                <FileText className="size-6 text-rose-400" />
              </div>
              <p className="font-medium text-[#0a1628]">No prescriptions yet</p>
              <p className="mt-2 text-sm text-[#64748b]">
                After a completed visit, your clinician may issue a prescription that will appear here.
              </p>
            </div>
          ) : null}

          {listQuery.isSuccess && items.length > 0 ? (
            <div className="divide-y divide-[#eef1f6]">
              {items.map((raw) => {
                if (!isRecord(raw) || raw._id == null) return null;
                const id = String(raw._id);
                const rxNum = typeof raw.prescriptionNumber === 'string' ? raw.prescriptionNumber : '';
                const diagnosis = typeof raw.diagnosis === 'string' ? raw.diagnosis.trim() : '';
                const issuedAt = raw.issuedAt ? new Date(String(raw.issuedAt)) : null;
                const pdfUrl = typeof raw.pdfUrl === 'string' && raw.pdfUrl.trim() ? raw.pdfUrl : '';
                const medCount = medicationCount(raw);

                return (
                  <div key={id} className="flex flex-wrap items-center gap-4 px-4 py-5 sm:flex-nowrap sm:px-6">
                    {/* Icon */}
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-100 to-rose-200 shadow-sm">
                      <Pill className="size-5 text-rose-600" strokeWidth={2} />
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[#0a1628]">{firstMedicationLine(raw)}</p>
                      <p className="mt-0.5 text-xs text-[#64748b]">
                        {practitionerName(raw)}
                        {issuedAt ? ` · ${format(issuedAt, 'MMM d, yyyy')}` : ''}
                        {medCount > 1 ? ` · ${medCount} medications` : ''}
                      </p>
                      {diagnosis ? (
                        <p className="mt-1 line-clamp-1 text-xs text-[#94a3b8]">
                          Dx: {diagnosis}
                        </p>
                      ) : null}
                      {rxNum ? (
                        <p className="mt-1 font-mono text-[11px] text-[#94a3b8]">{rxNum}</p>
                      ) : null}
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 items-center gap-2">
                      {pdfUrl ? (
                        <a
                          href={pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            'inline-flex h-9 items-center gap-2 rounded-lg border border-[#e2e8f0] bg-white px-3 text-[13px] font-medium text-[#0a1628] transition-colors',
                            'hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800',
                          )}
                        >
                          <Download className="size-4" />
                          Download
                        </a>
                      ) : (
                        <span className="text-xs text-[#94a3b8]">PDF generating…</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          {/* Pagination */}
          {listQuery.isSuccess && meta && totalPages > 1 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e2e8f0] bg-[#fafbfc] px-4 py-3 sm:px-6">
              <p className="text-xs text-[#64748b]">
                Page <span className="font-semibold text-[#0a1628]">{meta.page}</span> of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-lg border-[#e2e8f0]"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-lg border-[#e2e8f0]"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </>
  );
}
