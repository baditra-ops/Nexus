"use client";

import * as React from "react";
import { checkoutBookingAction } from "../actions";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  AlertTriangle,
  Camera,
  CheckCircle2,
  X,
  UploadCloud,
  FileText,
  AlertCircle,
} from "lucide-react";
import type { BookingWithRelations } from "../types";

interface CheckoutDialogProps {
  booking: BookingWithRelations;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CheckoutDialog({
  booking,
  isOpen,
  onClose,
  onSuccess,
}: CheckoutDialogProps) {
  const [isPending, startTransition] = React.useTransition();
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [safetyAcknowledged, setSafetyAcknowledged] = React.useState(false);
  const [conditionNotes, setConditionNotes] = React.useState(
    "Apparatus handed over in verified operational condition. All standard accessories present."
  );
  const [selectedPhotos, setSelectedPhotos] = React.useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = React.useState<string[]>([]);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  if (!isOpen) return null;

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    // Limit to 5 photos max, 5MB each
    const valid = newFiles.filter((f) => {
      if (f.size > 5 * 1024 * 1024) {
        alert(`File ${f.name} exceeds 5MB limit.`);
        return false;
      }
      return true;
    });
    const updated = [...selectedPhotos, ...valid].slice(0, 5);
    setSelectedPhotos(updated);
    setPreviewUrls(updated.map((file) => URL.createObjectURL(file)));
  };

  const removePhoto = (index: number) => {
    const updated = selectedPhotos.filter((_, i) => i !== index);
    setSelectedPhotos(updated);
    setPreviewUrls(updated.map((file) => URL.createObjectURL(file)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!safetyAcknowledged) {
      setErrorMsg("You must acknowledge the apparatus safety instructions before proceeding.");
      return;
    }

    setErrorMsg(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("booking_id", booking.id);
      formData.append("condition_notes", conditionNotes);
      formData.append("safety_acknowledged", "true");

      selectedPhotos.forEach((file) => {
        formData.append("photos", file);
      });

      const res = await checkoutBookingAction(formData);
      if (res.success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setErrorMsg(res.error || "Handover failed to record.");
      }
    });
  };

  const resource = booking.resource;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-dialog-title"
    >
      <div className="relative w-full max-w-xl rounded-2xl border border-white/15 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-xl my-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 shadow-sm">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <h2
                id="checkout-dialog-title"
                className="text-lg font-bold text-white"
              >
                Resource Handover & Checkout
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Record baseline condition and acknowledge required safety protocol for{" "}
              <strong className="text-white">{resource?.title}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-950/40 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-5">
          {/* Safety Instructions Card */}
          <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <div>
                <h3 className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                  Mandatory Safety & Operational Instructions
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-amber-800/90 dark:text-amber-300/80">
                  {resource?.usage_rules ||
                    "Operate within documented manufacturer specifications. Always wear standard laboratory protective equipment (eye protection, lab coat, gloves). Report any anomalous noise or thermal variance immediately."}
                </p>
              </div>
            </div>

            <label className="mt-3.5 flex cursor-pointer items-start gap-2.5 pt-2 border-t border-amber-200/60 dark:border-amber-900/40">
              <input
                type="checkbox"
                checked={safetyAcknowledged}
                onChange={(e) => setSafetyAcknowledged(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-amber-400 text-teal-600 focus:ring-teal-500 dark:border-amber-700 dark:bg-slate-800"
                required
              />
              <span className="text-xs font-medium text-amber-950 dark:text-amber-100 select-none">
                I verify that I have reviewed the standard operating procedures and agree to abide by all safety guidelines.
              </span>
            </label>
          </div>

          {/* Condition Notes */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <FileText className="h-3.5 w-3.5 text-slate-500" />
              Baseline Condition Observations
            </label>
            <textarea
              rows={3}
              value={conditionNotes}
              onChange={(e) => setConditionNotes(e.target.value)}
              placeholder="Record any existing scratches, accessory checklist, or operational notes before checkout..."
              className="mt-1.5 w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 shadow-2xs focus:border-teal-500 focus:outline-hidden focus:ring-1 focus:ring-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Baseline Photos Upload */}
          <div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Camera className="h-3.5 w-3.5 text-slate-500" />
                Condition Evidence Photos (Optional, max 5)
              </label>
              <span className="text-[11px] text-slate-400">JPEG, PNG, WebP (≤5MB)</span>
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              {previewUrls.map((url, idx) => (
                <div
                  key={idx}
                  className="relative h-16 w-16 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Preview ${idx + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="absolute top-0.5 right-0.5 rounded-full bg-slate-900/80 p-0.5 text-white hover:bg-rose-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {selectedPhotos.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-16 w-16 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-500 hover:border-teal-500 hover:bg-teal-50/30 hover:text-teal-600 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-teal-400"
                >
                  <UploadCloud className="h-4 w-4" />
                  <span className="mt-1 text-[9px] font-medium">Add Photo</span>
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handlePhotoSelect}
              className="hidden"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="teal"
              size="sm"
              isLoading={isPending}
              disabled={!safetyAcknowledged}
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              Confirm Handover & Checkout
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
