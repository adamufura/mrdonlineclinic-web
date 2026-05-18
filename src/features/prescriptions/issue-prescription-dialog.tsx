import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { issuePrescription, type Medication } from './api';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string;
  patientName: string;
};

const emptyMed = (): Medication => ({
  drugName: '',
  dosage: '',
  frequency: '',
  duration: '',
  route: '',
  instructions: '',
});

export function IssuePrescriptionDialog({ open, onOpenChange, appointmentId, patientName }: Props) {
  const qc = useQueryClient();
  const [diagnosis, setDiagnosis] = useState('');
  const [medications, setMedications] = useState<Medication[]>([emptyMed()]);
  const [additionalNotes, setAdditionalNotes] = useState('');

  const mutation = useMutation({
    mutationFn: issuePrescription,
    onSuccess: async () => {
      toast.success('Prescription issued successfully');
      onOpenChange(false);
      resetForm();
      await qc.invalidateQueries({ queryKey: ['appointments'] });
      await qc.invalidateQueries({ queryKey: ['practitioners', 'me', 'appointments'] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Failed to issue prescription'),
  });

  function resetForm() {
    setDiagnosis('');
    setMedications([emptyMed()]);
    setAdditionalNotes('');
  }

  function updateMed(index: number, field: keyof Medication, value: string) {
    setMedications((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)),
    );
  }

  function addMed() {
    setMedications((prev) => [...prev, emptyMed()]);
  }

  function removeMed(index: number) {
    setMedications((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit() {
    if (!diagnosis.trim()) {
      toast.error('Diagnosis is required');
      return;
    }
    const validMeds = medications.filter(
      (m) => m.drugName.trim() && m.dosage.trim() && m.frequency.trim() && m.duration.trim(),
    );
    if (validMeds.length === 0) {
      toast.error('At least one complete medication entry is required');
      return;
    }
    mutation.mutate({
      appointmentId,
      diagnosis: diagnosis.trim(),
      medications: validMeds.map((m) => ({
        drugName: m.drugName.trim(),
        dosage: m.dosage.trim(),
        frequency: m.frequency.trim(),
        duration: m.duration.trim(),
        route: m.route?.trim() || undefined,
        instructions: m.instructions?.trim() || undefined,
      })),
      additionalNotes: additionalNotes.trim() || undefined,
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (mutation.isPending && !next) return;
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Issue prescription</DialogTitle>
          <DialogDescription>
            For <span className="font-medium text-[#0a1628]">{patientName}</span>. This will generate a PDF and notify the patient.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Diagnosis */}
          <div className="space-y-1.5">
            <Label htmlFor="rx-diagnosis" className="text-xs font-medium text-[#64748b]">
              Diagnosis <span className="text-rose-500">*</span>
            </Label>
            <Textarea
              id="rx-diagnosis"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="e.g. Upper respiratory tract infection"
              className="min-h-[72px] resize-y border-slate-200 bg-white text-slate-900"
              disabled={mutation.isPending}
            />
          </div>

          {/* Medications */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-[#64748b]">
                Medications <span className="text-rose-500">*</span>
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs text-sky-800 hover:bg-sky-50"
                onClick={addMed}
                disabled={mutation.isPending}
              >
                <Plus className="size-3" />
                Add medication
              </Button>
            </div>

            {medications.map((med, i) => (
              <div
                key={i}
                className="relative rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4 space-y-3"
              >
                {medications.length > 1 ? (
                  <button
                    type="button"
                    className="absolute right-3 top-3 rounded-md p-1 text-[#94a3b8] transition-colors hover:bg-rose-50 hover:text-rose-600"
                    onClick={() => removeMed(i)}
                    disabled={mutation.isPending}
                    title="Remove medication"
                  >
                    <Trash2 className="size-4" />
                  </button>
                ) : null}

                <p className="text-xs font-semibold text-[#64748b]">Medication {i + 1}</p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-[#94a3b8]">Drug name *</Label>
                    <Input
                      value={med.drugName}
                      onChange={(e) => updateMed(i, 'drugName', e.target.value)}
                      placeholder="e.g. Amoxicillin"
                      className="h-9 border-slate-200 bg-white text-sm"
                      disabled={mutation.isPending}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-[#94a3b8]">Dosage *</Label>
                    <Input
                      value={med.dosage}
                      onChange={(e) => updateMed(i, 'dosage', e.target.value)}
                      placeholder="e.g. 500mg"
                      className="h-9 border-slate-200 bg-white text-sm"
                      disabled={mutation.isPending}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-[#94a3b8]">Frequency *</Label>
                    <Input
                      value={med.frequency}
                      onChange={(e) => updateMed(i, 'frequency', e.target.value)}
                      placeholder="e.g. Twice daily"
                      className="h-9 border-slate-200 bg-white text-sm"
                      disabled={mutation.isPending}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-[#94a3b8]">Duration *</Label>
                    <Input
                      value={med.duration}
                      onChange={(e) => updateMed(i, 'duration', e.target.value)}
                      placeholder="e.g. 7 days"
                      className="h-9 border-slate-200 bg-white text-sm"
                      disabled={mutation.isPending}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-[#94a3b8]">Route</Label>
                    <Input
                      value={med.route ?? ''}
                      onChange={(e) => updateMed(i, 'route', e.target.value)}
                      placeholder="e.g. Oral"
                      className="h-9 border-slate-200 bg-white text-sm"
                      disabled={mutation.isPending}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-[#94a3b8]">Instructions</Label>
                    <Input
                      value={med.instructions ?? ''}
                      onChange={(e) => updateMed(i, 'instructions', e.target.value)}
                      placeholder="e.g. Take after food"
                      className="h-9 border-slate-200 bg-white text-sm"
                      disabled={mutation.isPending}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Additional notes */}
          <div className="space-y-1.5">
            <Label htmlFor="rx-notes" className="text-xs font-medium text-[#64748b]">
              Additional notes
            </Label>
            <Textarea
              id="rx-notes"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Follow-up instructions, warnings, pharmacy notes…"
              className="min-h-[72px] resize-y border-slate-200 bg-white text-slate-900"
              disabled={mutation.isPending}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={mutation.isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={mutation.isPending}
            className="gap-2 bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-sm hover:from-teal-600 hover:to-teal-800"
            onClick={handleSubmit}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Issuing…
              </>
            ) : (
              'Issue prescription'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
