import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { PractitionerOpenSlotsSummary, usePractitionerSlotManager } from '@/features/practitioners/practitioner-slot-manager';

export default function PractitionerAvailabilityPage() {
  const { openSlotManager } = usePractitionerSlotManager();

  return (
    <>
      <Helmet>
        <title>Availability — MRD Online Clinic</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-[#0a1628] sm:text-3xl">Availability</h1>
            <p className="mt-2 max-w-2xl text-sm text-[#64748b]">
              Define when you are available for new bookings. Open slots sync with your public profile once you are
              verified; patients pick from these times when scheduling.
            </p>
          </div>
          <Button
            type="button"
            className="rounded-[9px] bg-gradient-to-br from-teal-500 to-teal-700 px-5 text-white shadow-sm hover:from-teal-600 hover:to-teal-800"
            onClick={openSlotManager}
          >
            Add or manage slots
          </Button>
        </div>

        <PractitionerOpenSlotsSummary maxItems={100} />
      </div>
    </>
  );
}
